import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Entry } from '../lib/backend'
import { formatDate } from '../lib/date'
import { Grip, Pencil, Trash, Check, X } from './icons'

interface Props {
  entry: Entry
  isAdmin: boolean
  draggable?: boolean
  index?: number
  onSaveCaption: (id: string, caption: string) => void
  onDelete: (entry: Entry) => void
  onOpen: (entry: Entry) => void
}

// deterministic tiny tilt per card for the scrapbook feel
function tiltFor(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000
  return ((h % 5) - 2) * 0.6 // -1.2deg .. +1.2deg
}

export default function EntryCard({
  entry,
  isAdmin,
  draggable = true,
  index = 0,
  onSaveCaption,
  onDelete,
  onOpen,
}: Props) {
  const canDrag = isAdmin && draggable
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
    disabled: !canDrag,
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.caption)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      taRef.current?.focus()
      setDraft(entry.caption)
    }
  }, [editing, entry.caption])

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    rotate: isDragging ? '0deg' : `${tiltFor(entry.id)}deg`,
    zIndex: isDragging ? 50 : undefined,
    animationDelay: `${Math.min(index, 12) * 45}ms`,
  }

  function save() {
    onSaveCaption(entry.id, draft.trim())
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group mb-5 animate-fade break-inside-avoid rounded-[14px] bg-white p-3 pb-4 shadow-polaroid transition-shadow hover:shadow-2xl ${
        isDragging ? 'opacity-90 shadow-2xl' : ''
      }`}
    >
      <div className="relative overflow-hidden rounded-[8px]">
        <img
          src={entry.url}
          alt={entry.caption || 'cat'}
          loading="lazy"
          className="block w-full cursor-zoom-in object-cover transition duration-300 group-hover:brightness-[1.03]"
          draggable={false}
          onClick={() => !editing && onOpen(entry)}
        />

        {isAdmin && (
          <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
            <button
              className="rounded-full bg-white/90 p-1.5 text-ink shadow hover:bg-white"
              onClick={() => setEditing((v) => !v)}
              title="编辑文字"
            >
              <Pencil width={15} height={15} />
            </button>
            <button
              className="rounded-full bg-white/90 p-1.5 text-rose shadow hover:bg-white"
              onClick={() => onDelete(entry)}
              title="删除照片"
            >
              <Trash width={15} height={15} />
            </button>
          </div>
        )}

        {canDrag && (
          <button
            className="absolute left-2 top-2 cursor-grab touch-none rounded-full bg-white/90 p-1.5 text-coffee opacity-0 shadow transition active:cursor-grabbing group-hover:opacity-100"
            title="拖动排序"
            {...attributes}
            {...listeners}
          >
            <Grip width={15} height={15} />
          </button>
        )}
      </div>

      <div className="px-1 pt-3">
        <p className="mb-1 font-hand text-sm text-coffee/70">{formatDate(entry.created_at)}</p>
        {editing ? (
          <div>
            <textarea
              ref={taRef}
              className="field min-h-[4rem] resize-none font-hand text-lg leading-snug"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="写点什么…（清空即删除文字）"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button className="btn-ghost px-3 py-1 text-xs" onClick={() => setEditing(false)}>
                <X width={14} height={14} /> 取消
              </button>
              <button className="btn-primary px-3 py-1 text-xs" onClick={save}>
                <Check width={14} height={14} /> 保存
              </button>
            </div>
          </div>
        ) : entry.caption ? (
          <p className="whitespace-pre-wrap font-hand text-lg leading-snug text-ink">{entry.caption}</p>
        ) : isAdmin ? (
          <button className="font-hand text-base text-coffee/50 hover:text-coffee" onClick={() => setEditing(true)}>
            ＋ 添加文字…
          </button>
        ) : null}
      </div>
    </div>
  )
}
