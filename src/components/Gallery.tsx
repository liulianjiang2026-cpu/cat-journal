import { useCallback, useEffect, useMemo, useState } from 'react'
import { backend, type Entry } from '../lib/backend'
import { SITE } from '../lib/config'
import { monthKey } from '../lib/date'
import { useAuth } from '../context/AuthContext'
import EntryCard from './EntryCard'
import UploadDialog from './UploadDialog'
import AdminLogin from './AdminLogin'
import Lightbox from './Lightbox'
import { Plus, Paw, Logout, Grid, Clock, Calendar, Sort } from './icons'

type View = 'album' | 'timeline'

const CARD_GRID = 'grid grid-cols-2 items-start gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'

export default function Gallery() {
  const { isAdmin, logoutAdmin } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [toDelete, setToDelete] = useState<Entry | null>(null)
  const [view, setView] = useState<View>('album')
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [sortAsc, setSortAsc] = useState(false) // false=最新在前(倒序)，true=最早在前(正序)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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

  // 相册：按日期排序（sortAsc 决定方向）
  const albumEntries = useMemo(() => {
    const arr = [...visible].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    return sortAsc ? arr : arr.reverse()
  }, [visible, sortAsc])

  // 时间轴：切换正/倒序只影响月份块；每个月内部始终按 1 -> 30 正序阅读
  const timelineGroups = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const e of visible) {
      const k = monthKey(e.created_at)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(e)
    }
    const groups = [...map.entries()].map(([key, items]) => {
      const sorted = [...items].sort((a, b) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
      const d = new Date(sorted[0].created_at)
      return { key, items: sorted, t: d.getFullYear() * 12 + d.getMonth() }
    })
    groups.sort((a, b) => (sortAsc ? a.t - b.t : b.t - a.t))
    return groups.map(({ key, items }) => ({ key, items }))
  }, [visible, sortAsc])

  const displayFlat = useMemo(
    () => (view === 'album' ? albumEntries : timelineGroups.flatMap((g) => g.items)),
    [view, albumEntries, timelineGroups],
  )

  const openLightbox = (entry: Entry) => {
    const i = displayFlat.findIndex((e) => e.id === entry.id)
    if (i >= 0) setLightboxIndex(i)
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
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-rose text-white shadow-card transition hover:brightness-105 active:scale-95"
                  onClick={() => setShowUpload(true)}
                  title="Add"
                >
                  <Plus width={16} height={16} />
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
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-cream/60 text-coffee/55 transition hover:bg-cream hover:text-ink active:scale-95"
                onClick={() => setShowLogin(true)}
                title="管理员登录"
              >
                <Paw width={15} height={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* toolbar: 视图切换 + 月份筛选 */}
      {!loading && entries.length > 0 && (
        <div className="mx-auto mt-4 flex max-w-5xl flex-nowrap items-center justify-center gap-1.5 overflow-x-auto px-4 text-[12px] font-serif [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex shrink-0 rounded-[16px] border border-ink/10 bg-cream/75 p-0.5 shadow-card backdrop-blur">
            <button
              className={`btn h-8 gap-0.5 rounded-[12px] px-2 py-0 text-[12px] font-medium ${view === 'album' ? 'bg-ink text-cream shadow-sm' : 'text-coffee/75'}`}
              onClick={() => setView('album')}
            >
              <Grid width={13} height={13} /> Album
            </button>
            <button
              className={`btn h-8 gap-0.5 rounded-[12px] px-2 py-0 text-[12px] font-medium ${view === 'timeline' ? 'bg-ink text-cream shadow-sm' : 'text-coffee/75'}`}
              onClick={() => setView('timeline')}
            >
              <Clock width={13} height={13} /> Timeline
            </button>
          </div>

          {months.length > 1 && (
            <label className="inline-flex h-8 w-[5.35rem] shrink-0 items-center gap-0.5 rounded-[16px] border border-ink/10 bg-cream/75 px-1.5 text-coffee/75 shadow-card backdrop-blur">
              <Calendar width={13} height={13} />
              <select
                className="min-w-0 flex-1 cursor-pointer bg-transparent text-[12px] text-ink outline-none"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="all">All</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] border border-ink/10 bg-cream/75 text-coffee/75 shadow-card backdrop-blur transition hover:text-ink active:scale-95"
            onClick={() => setSortAsc((v) => !v)}
            title={sortAsc ? 'Oldest first' : 'Latest first'}
          >
            <Sort width={13} height={13} />
          </button>
        </div>
      )}

      {/* body */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className={CARD_GRID}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-[14px] bg-white p-3 pb-4 shadow-polaroid">
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
          <div className={CARD_GRID}>
            {albumEntries.map((entry, i) => (
              <EntryCard key={entry.id} entry={entry} index={i} draggable={false} {...cardProps} />
            ))}
          </div>
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
                <div className={CARD_GRID}>
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
