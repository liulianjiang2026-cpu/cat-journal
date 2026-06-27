import { useEffect, useRef, useState } from 'react'
import { backend, type Entry } from '../lib/backend'
import { compressImage } from '../lib/image'
import { X, Plus } from './icons'

interface Pending {
  file: File
  preview: string
  caption: string
}

export default function UploadDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (entries: Entry[]) => void
}) {
  const [items, setItems] = useState<Pending[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => items.forEach((it) => URL.revokeObjectURL(it.preview))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addFiles(files: FileList | null) {
    if (!files) return
    const next: Pending[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({ file: f, preview: URL.createObjectURL(f), caption: '' }))
    setItems((prev) => [...prev, ...next])
  }

  async function save() {
    if (items.length === 0) return
    setBusy(true)
    setProgress(0)
    const created: Entry[] = []
    try {
      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        const compressed = await compressImage(it.file)
        const entry = await backend.create(compressed, it.caption.trim())
        created.push(entry)
        setProgress(i + 1)
      }
      onCreated(created)
      onClose()
    } catch (err) {
      alert('上传失败：' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex max-h-[88vh] w-full max-w-lg flex-col rounded-3xl bg-cream p-6 shadow-polaroid animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-coffee hover:text-ink">
          <X />
        </button>
        <h2 className="mb-4 font-hand text-2xl text-ink">添加新的回忆 🐾</h2>

        <div
          className="mb-4 cursor-pointer rounded-2xl border-2 border-dashed border-coffee/30 bg-paper/40 p-6 text-center text-coffee transition hover:border-coffee/60 hover:bg-paper/70"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            addFiles(e.dataTransfer.files)
          }}
        >
          <Plus className="mx-auto mb-1" />
          <p className="text-sm">点击或把照片拖到这里（可多选）</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {items.length > 0 && (
          <div className="-mr-2 flex-1 space-y-3 overflow-y-auto pr-2">
            {items.map((it, i) => (
              <div key={i} className="flex gap-3 rounded-2xl bg-paper/50 p-2">
                <img src={it.preview} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                <textarea
                  className="field min-h-[5rem] flex-1 resize-none font-hand text-base"
                  placeholder="写点什么…（也可以留空）"
                  value={it.caption}
                  onChange={(e) => {
                    const next = [...items]
                    next[i] = { ...next[i], caption: e.target.value }
                    setItems(next)
                  }}
                />
                <button
                  className="self-start text-coffee/60 hover:text-rose"
                  onClick={() => {
                    URL.revokeObjectURL(it.preview)
                    setItems(items.filter((_, idx) => idx !== i))
                  }}
                >
                  <X />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          {busy && (
            <span className="mr-auto text-sm text-coffee">
              上传中 {progress}/{items.length}…
            </span>
          )}
          <button className="btn-ghost" onClick={onClose} disabled={busy}>
            取消
          </button>
          <button className="btn-primary" onClick={save} disabled={busy || items.length === 0}>
            保存 {items.length > 0 ? `(${items.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
