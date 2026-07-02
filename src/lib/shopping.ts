import { isCloud } from './config'
import { supabase } from './supabase'

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

export interface PurchaseInput {
  name: string
  category: PurchaseCategory
  spec: string
  note: string
  amount: number
  date: string
}

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

function sortPurchases(records: PurchaseRecord[]) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
}

function listLocalPurchases(): PurchaseRecord[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as unknown[]
    return sortPurchases(raw
      .map(normalizeRecord)
      .filter((row): row is PurchaseRecord => Boolean(row)))
  } catch {
    return []
  }
}

function saveLocalPurchases(records: PurchaseRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sortPurchases(records)))
}

function client() {
  if (!supabase) throw new Error('Supabase 未配置')
  return supabase
}

export async function listPurchases(): Promise<PurchaseRecord[]> {
  if (!isCloud) return listLocalPurchases()
  const { data, error } = await client()
    .from('purchases')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return sortPurchases(((data ?? []) as unknown[]).map(normalizeRecord).filter((row): row is PurchaseRecord => Boolean(row)))
}

export async function createPurchase(input: PurchaseInput): Promise<PurchaseRecord> {
  const now = new Date().toISOString()
  if (!isCloud) {
    const record: PurchaseRecord = {
      id: crypto.randomUUID(),
      ...input,
      created_at: now,
      updated_at: now,
    }
    saveLocalPurchases([record, ...listLocalPurchases()])
    return record
  }

  const { data, error } = await client()
    .from('purchases')
    .insert({
      name: input.name,
      category: input.category,
      spec: input.spec,
      note: input.note,
      amount: input.amount,
      date: input.date,
    })
    .select('*')
    .single()
  if (error) throw error
  const record = normalizeRecord(data)
  if (!record) throw new Error('购物记录返回数据异常')
  return record
}

export async function removePurchase(id: string): Promise<void> {
  if (!isCloud) {
    saveLocalPurchases(listLocalPurchases().filter((row) => row.id !== id))
    return
  }
  const { error } = await client().from('purchases').delete().eq('id', id)
  if (error) throw error
}
