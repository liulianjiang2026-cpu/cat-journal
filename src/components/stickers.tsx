import type { CSSProperties } from 'react'

/**
 * 手绘矢量贴纸（模切风：白描边 + 柔影），配色取自参考1 马卡龙色。
 * 全部原创 SVG，可任意缩放。
 */

interface SP {
  className?: string
  style?: CSSProperties
  size?: number
}

// 统一白描边 + 柔和投影，营造贴纸"贴在纸上"的质感
const OUTLINE = {
  stroke: '#fffdf7',
  strokeWidth: 2.5,
  paintOrder: 'stroke' as const,
  strokeLinejoin: 'round' as const,
}
const wrap = (size: number, style?: CSSProperties): CSSProperties => ({
  filter: 'drop-shadow(0 2px 2px rgba(74,64,54,.22))',
  width: size,
  height: size,
  ...style,
})

export function HeartSticker({ className, style, size = 44 }: SP) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={wrap(size, style)}>
      <path
        d="M24 42C10 33 5 25 5 17.5 5 11 10 7 15 7c4 0 7 2.5 9 6 2-3.5 5-6 9-6 5 0 10 4 10 10.5C43 25 38 33 24 42Z"
        fill="#f3aec6"
        {...OUTLINE}
      />
    </svg>
  )
}

export function StarSticker({ className, style, size = 42 }: SP) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={wrap(size, style)}>
      <path
        d="M24 4c2 12 8 18 20 20-12 2-18 8-20 20-2-12-8-18-20-20C16 22 22 16 24 4Z"
        fill="#f1dd86"
        {...OUTLINE}
      />
    </svg>
  )
}

export function PawSticker({ className, style, size = 42 }: SP) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={wrap(size, style)}>
      <g fill="#e6a98a" {...OUTLINE}>
        <ellipse cx="14" cy="17" rx="4.5" ry="6" />
        <ellipse cx="24" cy="13" rx="4.5" ry="6.5" />
        <ellipse cx="34" cy="17" rx="4.5" ry="6" />
        <path d="M24 22c-6 0-11 4.5-11 9.5 0 4 3.5 6.5 11 6.5s11-2.5 11-6.5C35 26.5 30 22 24 22Z" />
      </g>
    </svg>
  )
}

export function FishSticker({ className, style, size = 46 }: SP) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={wrap(size, style)}>
      <g {...OUTLINE}>
        <path
          d="M30 24c0-6-6-11-13-11S5 17 5 24s5 11 12 11 13-5 13-11Z"
          fill="#a9cbe0"
        />
        <path d="M30 24c4-3 9-6 13-6-2 4-2 8 0 12-4 0-9-3-13-6Z" fill="#8fb8d6" stroke="#fffdf7" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="13" cy="22" r="2" fill="#4a4036" stroke="none" />
      </g>
    </svg>
  )
}

export function YarnSticker({ className, style, size = 44 }: SP) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={wrap(size, style)}>
      <circle cx="24" cy="24" r="18" fill="#e9a7b3" {...OUTLINE} />
      <g fill="none" stroke="#fffdf7" strokeWidth="2" strokeLinecap="round" opacity="0.85">
        <path d="M12 20c8-6 16-6 24 0" />
        <path d="M9 27c10-7 20-7 30 0" />
        <path d="M14 33c6-4 14-4 20 0" />
        <path d="M20 9c-7 7-10 20-6 30" />
        <path d="M30 9c6 8 7 22 1 30" />
      </g>
    </svg>
  )
}

export function FlowerSticker({ className, style, size = 40 }: SP) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={wrap(size, style)}>
      <g fill="#c9bce6" {...OUTLINE}>
        <circle cx="24" cy="11" r="7.5" />
        <circle cx="36.5" cy="20" r="7.5" />
        <circle cx="31.5" cy="34" r="7.5" />
        <circle cx="16.5" cy="34" r="7.5" />
        <circle cx="11.5" cy="20" r="7.5" />
      </g>
      <circle cx="24" cy="24" r="6.5" fill="#f1dd86" stroke="#fffdf7" strokeWidth="2.5" />
    </svg>
  )
}

export function BowSticker({ className, style, size = 44 }: SP) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={wrap(size, style)}>
      <g fill="#f3aec6" {...OUTLINE}>
        <path d="M23 24 7 15c-2-1-4 0-4 2v14c0 2 2 3 4 2l16-9Z" />
        <path d="M25 24l16-9c2-1 4 0 4 2v14c0 2-2 3-4 2l-16-9Z" />
        <circle cx="24" cy="24" r="4.5" />
      </g>
    </svg>
  )
}

export function CloudSticker({ className, style, size = 46 }: SP) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={wrap(size, style)}>
      <path
        d="M14 34c-5 0-9-3.5-9-8s4-8 9-8c1-5 5.5-8 10.5-8 6 0 11 4.5 11.5 10.5 4 .5 7 3.5 7 7.5 0 4.5-4 8-9 8H14Z"
        fill="#bcd6e8"
        {...OUTLINE}
      />
    </svg>
  )
}
