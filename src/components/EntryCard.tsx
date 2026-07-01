import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Entry } from '../lib/backend'
import { DECOR_ASSETS } from '../lib/decorAssets'
import { formatDate } from '../lib/date'
import { Grip, Pencil, Trash, Check, X } from './icons'

interface Props {
  entry: Entry
  isAdmin: boolean
  draggable?: boolean
  compact?: boolean
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

function seedFor(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 37 + id.charCodeAt(i)) % 10000
  return h
}

function paperStyleFor(id: string): React.CSSProperties {
  const seed = seedFor(id)
  const palettes = [
    { base: '#f8dcc0', ink: 'rgba(220, 160, 131, 0.35)' },
    { base: '#f4c2d6', ink: 'rgba(232, 167, 161, 0.32)' },
    { base: '#aecfe2', ink: 'rgba(86, 132, 156, 0.24)' },
    { base: '#f0e3a0', ink: 'rgba(190, 160, 76, 0.28)' },
    { base: '#cabfe4', ink: 'rgba(126, 102, 168, 0.25)' },
    { base: '#bccaa6', ink: 'rgba(104, 128, 86, 0.25)' },
  ]
  const { base, ink } = palettes[seed % palettes.length]
  const patterns = [
    `radial-gradient(circle, ${ink} 1.4px, transparent 1.5px)`,
    `linear-gradient(45deg, ${ink} 25%, transparent 25%, transparent 50%, ${ink} 50%, ${ink} 75%, transparent 75%, transparent)`,
    `linear-gradient(${ink} 1px, transparent 1px), linear-gradient(90deg, ${ink} 1px, transparent 1px)`,
    `repeating-linear-gradient(-35deg, transparent 0 9px, ${ink} 9px 11px, transparent 11px 20px)`,
  ]
  const sizes = ['13px 13px', '18px 18px', '16px 16px', '22px 22px']
  const patternIndex = Math.floor(seed / palettes.length) % patterns.length
  return {
    backgroundColor: base,
    backgroundImage: patterns[patternIndex],
    backgroundSize: sizes[patternIndex],
  }
}

function photoFrameStyleFor(id: string): React.CSSProperties {
  const seed = seedFor(id)
  const variants = [
    { inset: '7% 8% 16% 8%', rotate: '-1.3deg', borderRadius: '14px' },
    { inset: '12% 6% 10% 12%', rotate: '1.6deg', borderRadius: '22px 10px 18px 12px' },
    { inset: '8% 13% 13% 6%', rotate: '-2deg', borderRadius: '10px 22px 12px 18px' },
    { inset: '14% 9% 8% 9%', rotate: '0.8deg', borderRadius: '18px' },
    { inset: '6% 10% 18% 11%', rotate: '2deg', borderRadius: '12px 12px 24px 12px' },
  ]
  const v = variants[seed % variants.length]
  return {
    inset: v.inset,
    rotate: v.rotate,
    borderRadius: v.borderRadius,
    boxShadow: '0 8px 16px rgba(74,64,54,.18)',
  }
}

function DecorativeStickers({ id }: { id: string }) {
  const seed = seedFor(id)
  const topLeft = seed % 2 === 0
  const bottomLeft = seed % 3 === 0
  const assets = [
    DECOR_ASSETS[seed % DECOR_ASSETS.length],
    DECOR_ASSETS[Math.floor(seed / 7) % DECOR_ASSETS.length],
    DECOR_ASSETS[Math.floor(seed / 17) % DECOR_ASSETS.length],
  ]
  const assetUrl = (asset: string) => `${import.meta.env.BASE_URL}${asset}`
  return (
    <>
      <img
        src={assetUrl(assets[0])}
        alt=""
        className={`pointer-events-none absolute z-[8] h-12 w-12 object-contain opacity-95 drop-shadow-sm ${
          topLeft ? '-right-2 top-7 rotate-12' : '-left-2 top-7 -rotate-12'
        }`}
      />
      <img
        src={assetUrl(assets[1])}
        alt=""
        className={`pointer-events-none absolute z-[8] h-11 w-16 object-contain opacity-90 drop-shadow-sm ${
          bottomLeft ? 'bottom-3 left-1 -rotate-6' : 'bottom-3 right-1 rotate-6'
        }`}
      />
      <img
        src={assetUrl(assets[2])}
        alt=""
        className={`pointer-events-none absolute z-[8] h-9 w-9 object-contain opacity-80 drop-shadow-sm ${
          bottomLeft ? 'bottom-16 right-3 rotate-12' : 'bottom-16 left-3 -rotate-12'
        }`}
      />
    </>
  )
}

export default function EntryCard({
  entry,
  isAdmin,
  draggable = true,
  compact = false,
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
      className={`group animate-fade rounded-[14px] bg-white p-3 pb-4 shadow-polaroid transition-shadow hover:shadow-2xl ${
        compact ? 'mb-5 break-inside-avoid' : ''
      } ${
        isDragging ? 'opacity-90 shadow-2xl' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-[8px] bg-cream ${compact ? '' : 'aspect-[4/5]'}`}
        style={compact ? undefined : paperStyleFor(entry.id)}
      >
        {!compact && (
          <DecorativeStickers id={entry.id} />
        )}
        {compact ? (
          <img
            src={entry.url}
            alt={entry.caption || 'cat'}
            loading="lazy"
            className="block w-full cursor-zoom-in object-cover transition duration-300 group-hover:brightness-[1.03]"
            draggable={false}
            onClick={() => !editing && onOpen(entry)}
          />
        ) : (
          <div
            className="absolute z-20 cursor-zoom-in overflow-hidden border-[5px] border-white/90 bg-white/70 transition duration-300 group-hover:brightness-[1.03]"
            style={photoFrameStyleFor(entry.id)}
            onClick={() => !editing && onOpen(entry)}
          >
            <img
              src={entry.url}
              alt={entry.caption || 'cat'}
              loading="lazy"
              className="h-full w-full object-contain"
              draggable={false}
            />
          </div>
        )}

        {isAdmin && (
          <div className="absolute right-2 top-2 z-30 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
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
            className="absolute left-2 top-2 z-30 cursor-grab touch-none rounded-full bg-white/90 p-1.5 text-coffee opacity-0 shadow transition active:cursor-grabbing group-hover:opacity-100"
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
