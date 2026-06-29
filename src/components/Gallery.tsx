import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { backend, type Entry } from '../lib/backend'
import { SITE } from '../lib/config'
import { monthKey } from '../lib/date'
import { useAuth } from '../context/AuthContext'
import EntryCard from './EntryCard'
import UploadDialog from './UploadDialog'
import AdminLogin from './AdminLogin'
import Lightbox from './Lightbox'
import { Plus, Paw, Logout, Grid, Clock, Calendar } from './icons'

type View = 'album' | 'timeline'

const MASONRY = 'columns-2 gap-5 sm:columns-2 md:columns-3 lg:columns-4'

export default function Gallery() {
  const { isAdmin, logoutAdmin } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [toDelete, setToDelete] = useState<Entry | null>(null)
  const [view, setView] = useState<View>('album')
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setEntries(await backend.list())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // 可选月份（按时间倒序）
  const months = useMemo(() => {
    const byDate = [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    const seen: string[] = []
    for (const e of byDate) {
      const k = monthKey(e.created_at)
      if (!seen.includes(k)) seen.push(k)
    }
    return seen
  }, [entries])

  // 当前月份筛选已失效时重置
  useEffect(() => {
    if (filterMonth !== 'all' && !months.includes(filterMonth)) setFilterMonth('all')
  }, [months, filterMonth])

  const visible = useMemo(
    () => (filterMonth === 'all' ? entries : entries.filter((e) => monthKey(e.created_at) === filterMonth)),
    [entries, filterMonth],
  )

  const timelineGroups = useMemo(() => {
    const byDate = [...visible].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    const groups: { key: string; items: Entry[] }[] = []
    for (const e of byDate) {
      const k = monthKey(e.created_at)
      const g = groups.find((x) => x.key === k)
      if (g) g.items.push(e)
      else groups.push({ key: k, items: [e] })
    }
    return groups
  }, [visible])

  const displayFlat = useMemo(
    () => (view === 'album' ? visible : timelineGroups.flatMap((g) => g.items)),
    [view, visible, timelineGroups],
  )

  const canReorder = filterMonth === 'all' // 仅全部+相册时可拖动排序

  const openLightbox = (entry: Entry) => {
    const i = displayFlat.findIndex((e) => e.id === entry.id)
    if (i >= 0) setLightboxIndex(i)
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = entries.findIndex((x) => x.id === active.id)
    const newIndex = entries.findIndex((x) => x.id === over.id)
    const reordered = arrayMove(entries, oldIndex, newIndex)
    setEntries(reordered)
    try {
      await backend.reorder(reordered.map((x) => x.id))
    } catch (err) {
      console.error(err)
      load()
    }
  }

  function handleSaveCaption(id: string, caption: string) {
    setEntries((prev) => prev.map((x) => (x.id === id ? { ...x, caption } : x)))
    backend.updateCaption(id, caption).catch((err) => {
      console.error(err)
      load()
    })
  }

  async function confirmDelete() {
    if (!toDelete) return
    const target = toDelete
    setToDelete(null)
    setEntries((prev) => prev.filter((x) => x.id !== target.id))
    try {
      await backend.remove(target.id)
    } catch (err) {
      console.error(err)
      load()
    }
  }

  const cardProps = {
    isAdmin,
    onSaveCaption: handleSaveCaption,
    onDelete: setToDelete,
    onOpen: openLightbox,
  }

  return (
    <div className="min-h-full bg-dots">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}qiuqiu.png`}
              alt={SITE.catName}
              className="h-11 w-11 shrink-0 rounded-full object-cover shadow-card ring-2 ring-white"
            />
            <h1 className="whitespace-nowrap font-script text-[26px] leading-[1.6] text-ink">
              {SITE.title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isAdmin ? (
              <>
                <button
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-rose px-3.5 py-2 text-sm font-medium text-white shadow-card transition hover:brightness-105 active:scale-95"
                  onClick={() => setShowUpload(true)}
                >
                  <Plus width={16} height={16} /> 添加
                </button>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-cream text-coffee transition hover:text-ink active:scale-95"
                  onClick={logoutAdmin}
                  title="退出管理"
                >
                  <Logout width={16} height={16} />
                </button>
              </>
            ) : (
              <button
                className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-cream/70 px-3 py-1.5 text-sm text-coffee/80 transition hover:text-ink active:scale-95"
                onClick={() => setShowLogin(true)}
                title="管理员登录"
              >
                <Paw width={15} height={15} /> login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* toolbar: 视图切换 + 月份筛选 */}
      {!loading && entries.length > 0 && (
        <div className="mx-auto mt-5 flex max-w-5xl flex-wrap items-center justify-center gap-3 px-4">
          <div className="inline-flex rounded-full border border-ink/10 bg-cream/70 p-1 shadow-card">
            <button
              className={`btn gap-1.5 px-4 py-1.5 ${view === 'album' ? 'bg-ink text-cream' : 'text-coffee'}`}
              onClick={() => setView('album')}
            >
              <Grid width={15} height={15} /> 相册
            </button>
            <button
              className={`btn gap-1.5 px-4 py-1.5 ${view === 'timeline' ? 'bg-ink text-cream' : 'text-coffee'}`}
              onClick={() => setView('timeline')}
            >
              <Clock width={15} height={15} /> 时间轴
            </button>
          </div>

          {months.length > 1 && (
            <label className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-cream/70 px-3 py-1.5 text-sm text-coffee shadow-card">
              <Calendar width={15} height={15} />
              <select
                className="cursor-pointer bg-transparent pr-1 text-ink outline-none"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="all">全部时间</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {/* body */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className={MASONRY}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mb-5 break-inside-avoid rounded-[14px] bg-white p-3 pb-4 shadow-polaroid">
                <div className="skeleton rounded-[8px]" style={{ height: 120 + ((i * 37) % 110) }} />
                <div className="skeleton mt-3 h-3 w-2/3 rounded" />
                <div className="skeleton mt-2 h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-24 text-center">
            <img
              src={`${import.meta.env.BASE_URL}qiuqiu.png`}
              alt={SITE.catName}
              className="mx-auto mb-4 h-20 w-20 rounded-full object-cover opacity-80 shadow-card ring-2 ring-white"
            />
            <p className="font-hand text-2xl text-coffee">还没有任何回忆呢～</p>
            <p className="mt-1 text-sm text-coffee/70">
              {isAdmin ? '点右上角「添加」开始记录吧' : `登录后即可为「${SITE.catName}」添加照片`}
            </p>
          </div>
        ) : view === 'album' ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visible.map((e) => e.id)} strategy={rectSortingStrategy}>
              <div className={MASONRY}>
                {visible.map((entry, i) => (
                  <EntryCard key={entry.id} entry={entry} index={i} draggable={canReorder} {...cardProps} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-8">
            {timelineGroups.map((group) => (
              <section key={group.key}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-ink/15" />
                  <h2 className="font-hand text-xl text-ink">
                    <Clock width={16} height={16} className="mb-0.5 mr-1 inline" />
                    {group.key}
                  </h2>
                  <span className="h-px flex-1 bg-ink/15" />
                </div>
                <div className={MASONRY}>
                  {group.items.map((entry, i) => (
                    <EntryCard key={entry.id} entry={entry} index={i} draggable={false} {...cardProps} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <div className="h-10" />

      {showUpload && (
        <UploadDialog
          onClose={() => setShowUpload(false)}
          onCreated={(created) => setEntries((prev) => [...prev, ...created])}
        />
      )}
      {showLogin && <AdminLogin onClose={() => setShowLogin(false)} />}

      {lightboxIndex !== null && (
        <Lightbox
          entries={displayFlat}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      {toDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-5 backdrop-blur-sm"
          onClick={() => setToDelete(null)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-cream p-6 text-center shadow-polaroid animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={toDelete.url} className="mx-auto mb-3 h-24 w-24 rounded-xl object-cover" />
            <p className="font-hand text-xl text-ink">确定删除这张照片吗？</p>
            <p className="mt-1 text-sm text-coffee/70">删除后无法恢复哦</p>
            <div className="mt-5 flex justify-center gap-2">
              <button className="btn-ghost" onClick={() => setToDelete(null)}>
                再想想
              </button>
              <button className="btn-soft" onClick={confirmDelete}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
