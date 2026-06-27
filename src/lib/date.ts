/** 手账风日期格式化 */

export function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

/** 分组用的键：YYYY年M月 */
export function monthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
}

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export function weekday(iso: string): string {
  return WEEK[new Date(iso).getDay()]
}
