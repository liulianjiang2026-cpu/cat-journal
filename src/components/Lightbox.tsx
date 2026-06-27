import { useEffect, useRef, useState } from 'react'
import type { Entry } from '../lib/backend'
import { formatDate, weekday } from '../lib/date'
import { ChevronLeft, ChevronRight, X } from './icons'

interface Props {
  entries: Entry[]
  index: number
  onClose: () => void
  onIndexChange: (i: number) => void
}

export default function Lightbox({ entries, index, onClose, onIndexChange }: Props) {
  const entry = entries[index]
  const [dir, setDir] = useState(0)
  const touchX = useRef<number | null>(null)

  const go = (delta: number) => {
    const next = index + delta
    if (next < 0 || next >= entries.length) return
    setDir(delta)
    onIndexChange(next)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, entries.length])

  if (!entry) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink/90 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      {/* close */}
      <button
        className="absolute right-4 top-4 z-10 rounded-full bg-white/15 p-2 text-cream transition hover:bg-white/25"
        onClick={onClose}
        title="关闭"
      >
        <X width={22} height={22} />
      </button>

      {/* counter */}
      <div className="absolute left-1/2 top-5 -translate-x-1/2 text-sm text-cream/70">
        {index + 1} / {entries.length}
      </div>

      {/* prev */}
      {index > 0 && (
        <button
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-cream transition hover:bg-white/25 sm:left-6"
          onClick={(e) => {
            e.stopPropagation()
            go(-1)
          }}
        >
          <ChevronLeft width={26} height={26} />
        </button>
      )}
      {/* next */}
      {index < entries.length - 1 && (
        <button
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-cream transition hover:bg-white/25 sm:right-6"
          onClick={(e) => {
            e.stopPropagation()
            go(1)
          }}
        >
          <ChevronRight width={26} height={26} />
        </button>
      )}

      {/* photo + caption (polaroid framed) */}
      <div
        key={entry.id}
        className="flex max-h-[88vh] max-w-[92vw] flex-col items-center"
        style={{ animation: `lb-in 0.28s ease both`, ['--lb-from' as string]: dir < 0 ? '-24px' : '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={entry.url}
          alt={entry.caption || 'cat'}
          className="max-h-[70vh] max-w-[92vw] rounded-lg bg-white object-contain p-2 shadow-2xl"
          draggable={false}
        />
        <div className="mt-3 max-w-[92vw] text-center">
          <p className="text-xs text-cream/60">
            {formatDate(entry.created_at)} · {weekday(entry.created_at)}
          </p>
          {entry.caption && (
            <p className="mt-1 whitespace-pre-wrap font-hand text-xl leading-snug text-cream">
              {entry.caption}
            </p>
          )}
        </div>
      </div>

      <style>{`@keyframes lb-in{from{opacity:0;transform:translateX(var(--lb-from,0))}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  )
}
