import type { SVGProps } from 'react'

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
})

export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const Trash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
)
export const Pencil = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)
export const Check = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)
export const X = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)
export const Grip = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="18" r="1" />
  </svg>
)
export const Paw = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ fill: 'currentColor', stroke: 'none', ...p })}>
    <ellipse cx="6" cy="11" rx="1.7" ry="2.3" />
    <ellipse cx="10" cy="8" rx="1.7" ry="2.4" />
    <ellipse cx="14" cy="8" rx="1.7" ry="2.4" />
    <ellipse cx="18" cy="11" rx="1.7" ry="2.3" />
    <path d="M12 12c-2.8 0-5 2-5 4.2C7 18 8.6 19 12 19s5-1 5-2.8C17 14 14.8 12 12 12Z" />
  </svg>
)
export const Lock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)
export const Logout = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
)
export const ChevronLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
export const ChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 18l6-6-6-6" />
  </svg>
)
export const Grid = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)
export const BookOpen = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 7v14" />
    <path d="M3 5a3 3 0 0 1 3-2h6v18H6a3 3 0 0 0-3 2Z" />
    <path d="M21 5a3 3 0 0 0-3-2h-6v18h6a3 3 0 0 1 3 2Z" />
  </svg>
)
export const ShoppingBag = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 8h12l1 13H5Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
)
export const MedicalCross = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7Z" />
  </svg>
)
export const DiaryTab = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ strokeWidth: 2.85, ...p })}>
    <path d="M5 6h14v13H5Z" />
    <path d="M8 9h8" />
    <path d="M8 13h5" />
  </svg>
)
export const ShoppingTab = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ strokeWidth: 2.85, ...p })}>
    <path d="M4 10h16l-2 10H6Z" />
    <path d="M8 10c0-3 1.5-5 4-5s4 2 4 5" />
  </svg>
)
export const MedicalTab = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ strokeWidth: 2.85, ...p })}>
    <path d="M6 12h12" />
    <path d="M12 6v12" />
    <path d="M5 5h14v14H5Z" />
  </svg>
)
export const Clock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)
export const Calendar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)
export const Filter = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 5h18l-7 8v6l-4-2v-4Z" />
  </svg>
)
export const Sort = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l-3 3M17 20l3-3" />
  </svg>
)
