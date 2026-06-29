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
import { Plus, Paw, Lock, Logout, Grid, Clock } from './icons'

type View = 'album' | 'timeline'

const MASONRY = 'columns-2 gap-5 sm:columns-2 md:columns-3 lg:columns-4'

export default function Gallery() {
  const { isAdmin, logoutAdmin, mode } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [toDelete, setToDelete] = useState<Entry | null>(null)
  const [view, setView] = useState<View>('album')
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

  // timeline: newest first, grouped by month
  const timelineGroups = useMemo(() => {
    const byDate = [...entries].sort(
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
  }, [entries])

  // flat display order — drives lightbox prev/next so it matches what's on screen
  const displayFlat = useMemo(
    () => (view === 'album' ? entries : timelineGroups.flatMap((g) => g.items)),
    [view, entries, timelineGroups],
  )

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
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}qiuqiu.png`}
              alt={SITE.catName}
              className="h-11 w-11 rounded-full object-cover shadow-card ring-2 ring-white"
            />
            <div className="leading-tight">
              <h1 className="font-hand text-2xl text-ink">{SITE.title}</h1>
              <p className="text-xs text-coffee">{SITE.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <button className="btn-primary" onClick={() => setShowUpload(true)}>
                  <Plus width={16} height={16} /> 添加照片
                </button>
                <button className="btn-ghost" onClick={logoutAdmin} title="退出管理">
                  <Logout width={16} height={16} />
                </button>
              </>
            ) : (
              <button className="btn-ghost" onClick={() => setShowLogin(true)}>
                <Lock width={15} height={15} /> 管理员
              </button>
            )}
          </div>
        </div>
      </header>

      {/* view toggle */}
      {!loading && entries.length > 0 && (
        <div className="mx-auto mt-5 flex max-w-5xl justify-center px-4">
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
            <Paw className="mx-auto mb-3 text-rose/50" width={48} height={48} />
            <p className="font-hand text-2xl text-coffee">还没有任何回忆呢～</p>
            <p className="mt-1 text-sm text-coffee/70">
              {isAdmin ? '点右上角「添加照片」开始记录吧' : `登录后即可为「${SITE.catName}」添加照片`}
            </p>
          </div>
        ) : view === 'album' ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={entries.map((e) => e.id)} strategy={rectSortingStrategy}>
              <div className={MASONRY}>
                {entries.map((entry, i) => (
                  <EntryCard key={entry.id} entry={entry} index={i} draggable {...cardProps} />
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
                  <span className="text-xs text-coffee/60">{group.items.length} 张</span>
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

      <footer className="pb-8 pt-2 text-center text-xs text-coffee/50">
        {mode === 'cloud' ? '☁️ 云端同步中' : '📁 本地模式（数据存在此浏览器）'} · 用 ❤️ 记录{' '}
        {SITE.catName}
      </footer>

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
