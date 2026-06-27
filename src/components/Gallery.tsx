import { useCallback, useEffect, useState } from 'react'
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
import { useAuth } from '../context/AuthContext'
import EntryCard from './EntryCard'
import UploadDialog from './UploadDialog'
import AdminLogin from './AdminLogin'
import { Plus, Paw, Lock, Logout } from './icons'

export default function Gallery() {
  const { isAdmin, logoutAdmin, mode } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [toDelete, setToDelete] = useState<Entry | null>(null)

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

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = entries.findIndex((x) => x.id === active.id)
    const newIndex = entries.findIndex((x) => x.id === over.id)
    const reordered = arrayMove(entries, oldIndex, newIndex)
    setEntries(reordered) // optimistic
    try {
      await backend.reorder(reordered.map((x) => x.id))
    } catch (err) {
      console.error(err)
      load() // revert from source of truth
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

  return (
    <div className="min-h-full bg-dots">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose/20 text-rose">
              <Paw width={20} height={20} />
            </span>
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

      {/* body */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <p className="py-20 text-center font-hand text-2xl text-coffee/60">正在翻开手账…</p>
        ) : entries.length === 0 ? (
          <div className="py-24 text-center">
            <Paw className="mx-auto mb-3 text-rose/50" width={48} height={48} />
            <p className="font-hand text-2xl text-coffee">还没有任何回忆呢～</p>
            <p className="mt-1 text-sm text-coffee/70">
              {isAdmin ? '点右上角「添加照片」开始记录吧' : `登录后即可为「${SITE.catName}」添加照片`}
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={entries.map((e) => e.id)} strategy={rectSortingStrategy}>
              <div className="columns-2 gap-5 sm:columns-2 md:columns-3 lg:columns-4">
                {entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    isAdmin={isAdmin}
                    onSaveCaption={handleSaveCaption}
                    onDelete={setToDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
