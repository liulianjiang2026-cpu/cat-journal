export const PURCHASE_CATEGORIES = [
  '猫粮',
  '猫砂',
  '猫零食',
  '玩具',
  '用品',
  '医疗',
  '清洁',
  '其他',
] as const

export type PurchaseCategory = (typeof PURCHASE_CATEGORIES)[number]

export interface PurchaseRecord {
  id: string
  name: string
  category: PurchaseCategory
  spec: string
  note: string
  amount: number
  date: string
  created_at: string
  updated_at: string
}

const STORAGE_KEY = 'cat-journal:purchases'

function normalizeRecord(value: unknown): PurchaseRecord | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Partial<PurchaseRecord>
  if (!row.id || !row.name || !row.date) return null
  const amount = Number(row.amount)
  return {
    id: String(row.id),
    name: String(row.name),
    category: PURCHASE_CATEGORIES.includes(row.category as PurchaseCategory)
      ? (row.category as PurchaseCategory)
      : '其他',
    spec: String(row.spec ?? ''),
    note: String(row.note ?? ''),
    amount: Number.isFinite(amount) ? amount : 0,
    date: String(row.date),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  }
}

export function listPurchases(): PurchaseRecord[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as unknown[]
    return raw
      .map(normalizeRecord)
      .filter((row): row is PurchaseRecord => Boolean(row))
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
  } catch {
    return []
  }
}

export function savePurchases(records: PurchaseRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}
