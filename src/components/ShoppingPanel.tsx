import { useMemo, useState } from 'react'
import { PURCHASE_CATEGORIES, listPurchases, savePurchases, type PurchaseCategory, type PurchaseRecord } from '../lib/shopping'
import { Plus, Trash, ShoppingBag, X, Filter } from './icons'

interface FormState {
  name: string
  category: PurchaseCategory
  spec: string
  note: string
  amount: string
  date: string
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = (): FormState => ({
  name: '',
  category: '猫粮',
  spec: '',
  note: '',
  amount: '',
  date: today(),
})

const money = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 2,
})

function monthKey(date: string) {
  return date.slice(0, 7)
}

function yearKey(date: string) {
  return date.slice(0, 4)
}

export default function ShoppingPanel() {
  const [records, setRecords] = useState<PurchaseRecord[]>(() => listPurchases())
  const [form, setForm] = useState<FormState>(() => emptyForm())
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState<'all' | PurchaseCategory>('all')

  const visibleRecords = useMemo(
    () => (filterCategory === 'all' ? records : records.filter((row) => row.category === filterCategory)),
    [records, filterCategory],
  )

  const stats = useMemo(() => {
    const now = new Date()
    const currentYear = String(now.getFullYear())
    const currentMonth = now.toISOString().slice(0, 7)
    return visibleRecords.reduce(
      (sum, row) => {
        sum.total += row.amount
        if (yearKey(row.date) === currentYear) sum.year += row.amount
        if (monthKey(row.date) === currentMonth) sum.month += row.amount
        return sum
      },
      { total: 0, year: 0, month: 0 },
    )
  }, [visibleRecords])

  function update(next: PurchaseRecord[]) {
    const sorted = [...next].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
    setRecords(sorted)
    savePurchases(sorted)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.name.trim()) {
      setError('先填一下名称')
      return
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setError('金额要填数字')
      return
    }
    const now = new Date().toISOString()
    update([
      {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        category: form.category,
        spec: form.spec.trim(),
        note: form.note.trim(),
        amount,
        date: form.date || today(),
        created_at: now,
        updated_at: now,
      },
      ...records,
    ])
    setForm(emptyForm())
    setError('')
    setFormOpen(false)
  }

  function remove(id: string) {
    update(records.filter((row) => row.id !== id))
  }

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="This Year" value={stats.year} />
        <StatCard label="This Month" value={stats.month} />
      </div>

      <div className="flex items-center gap-2">
        <label className="inline-flex h-10 min-w-0 flex-1 items-center gap-1.5 rounded-[18px] border border-white/80 bg-[#fffaf0] px-3 text-coffee/75 shadow-[0_8px_18px_rgba(74,64,54,.09),inset_0_0_0_1px_rgba(74,64,54,.04)]">
          <Filter width={14} height={14} />
          <select
            className="min-w-0 flex-1 cursor-pointer bg-transparent font-serif text-[13px] text-ink outline-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as 'all' | PurchaseCategory)}
          >
            <option value="all">All Types</option>
            {PURCHASE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {filterCategory !== 'all' && (
          <button
            className="h-10 shrink-0 rounded-[18px] border border-ink/10 bg-white/70 px-3 font-serif text-xs text-coffee/70 shadow-card transition hover:text-ink active:scale-95"
            onClick={() => setFilterCategory('all')}
          >
            Clear
          </button>
        )}
        {!formOpen && (
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border border-white/80 bg-[#fffaf0] text-coffee/65 shadow-[0_8px_18px_rgba(74,64,54,.09),inset_0_0_0_1px_rgba(74,64,54,.04)] transition hover:text-rose active:scale-95"
            onClick={() => setFormOpen(true)}
            title="Add purchase"
          >
            <Plus width={15} height={15} />
          </button>
        )}
      </div>

      {formOpen && (
        <form
          className="rounded-[18px] border border-ink/10 bg-white/82 p-4 shadow-card backdrop-blur animate-pop"
          onSubmit={submit}
        >
          <div className="mb-3 flex items-center justify-between gap-3 text-ink">
            <div className="flex items-center gap-2">
              <ShoppingBag width={18} height={18} />
              <h2 className="font-serif text-base">Purchase Record</h2>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-coffee/55 transition hover:bg-cream/70 hover:text-ink"
              onClick={() => {
                setFormOpen(false)
                setError('')
              }}
              title="收起"
            >
              <X width={15} height={15} />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="名称">
              <input
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="比如：渴望六种鱼"
              />
            </Field>
            <Field label="类型">
              <select
                className="field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as PurchaseCategory })}
              >
                {PURCHASE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="规格">
              <input
                className="field"
                value={form.spec}
                onChange={(e) => setForm({ ...form, spec: e.target.value })}
                placeholder="比如：5.4kg / 12袋"
              />
            </Field>
            <Field label="金额">
              <input
                className="field"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </Field>
            <Field label="日期">
              <input
                className="field"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="备注">
              <input
                className="field"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="渠道、口味、优惠等"
              />
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="min-h-5 text-xs text-rose">{error}</p>
            <button className="btn-soft shrink-0" type="submit">
              <Plus width={15} height={15} /> Add
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {records.length === 0 ? (
          <EmptyState face="ฅ^•ﻌ•^ฅ" title="No records" onAdd={() => setFormOpen(true)} />
        ) : visibleRecords.length === 0 ? (
          <EmptyState face="(=･ｪ･=)" title="No matches" onAdd={() => setFormOpen(true)} />
        ) : (
          visibleRecords.map((row) => (
            <article
              key={row.id}
              className="relative overflow-hidden rounded-[18px] border border-white/80 bg-[#fffaf0] p-4 shadow-[0_12px_26px_rgba(74,64,54,.13),inset_0_0_0_1px_rgba(74,64,54,.045)]"
            >
              <span className="absolute left-0 top-5 h-12 w-1.5 rounded-r-full bg-rose/45" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words font-serif text-base text-ink">{row.name}</h3>
                    <span className="rounded-full bg-rose/12 px-2 py-0.5 text-xs text-rose">{row.category}</span>
                  </div>
                  <p className="mt-1 text-xs text-coffee/55">{row.date}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-serif text-base text-ink">{money.format(row.amount)}</p>
                  <button
                    className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-coffee/38 transition hover:bg-cream/70 hover:text-rose"
                    onClick={() => remove(row.id)}
                    title="删除"
                  >
                    <Trash width={14} height={14} />
                  </button>
                </div>
              </div>
              {(row.spec || row.note) && (
                <div className="mt-3 grid gap-2 text-sm text-coffee/68 sm:grid-cols-2">
                  {row.spec && <p className="rounded-[12px] bg-white/72 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(74,64,54,.04)]">规格：{row.spec}</p>}
                  {row.note && <p className="rounded-[12px] bg-white/72 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(74,64,54,.04)]">备注：{row.note}</p>}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-white/80 bg-[#fffaf0] px-3 py-4 text-center shadow-[0_10px_22px_rgba(74,64,54,.11),inset_0_0_0_1px_rgba(74,64,54,.04)]">
      <p className="truncate font-serif text-[11px] text-coffee/58">{label}</p>
      <p className="mt-1 truncate font-serif text-[15px] text-ink sm:text-lg">{money.format(value)}</p>
    </div>
  )
}

function EmptyState({ face, title, onAdd }: { face: string; title: string; onAdd: () => void }) {
  return (
    <div className="mx-auto max-w-xs rounded-[22px] border border-white/80 bg-[#fffaf0]/90 px-6 py-7 text-center shadow-[0_10px_22px_rgba(74,64,54,.09),inset_0_0_0_1px_rgba(74,64,54,.035)]">
      <p className="font-serif text-3xl leading-none text-coffee/70">{face}</p>
      <p className="mt-3 font-serif text-sm text-coffee/58">{title}</p>
      <button
        className="mx-auto mt-4 inline-flex h-8 items-center gap-1.5 rounded-full border border-rose/25 bg-rose/10 px-3 font-serif text-xs text-coffee/75 transition hover:bg-rose/16 hover:text-ink active:scale-95"
        onClick={onAdd}
      >
        <Plus width={13} height={13} /> New
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-coffee/65">{label}</span>
      {children}
    </label>
  )
}
