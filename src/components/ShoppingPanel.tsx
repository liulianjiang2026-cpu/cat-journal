import { useEffect, useMemo, useState } from 'react'
import {
  PURCHASE_CATEGORIES,
  createPurchase,
  listPurchases,
  removePurchase,
  updatePurchase,
  type PurchaseCategory,
  type PurchaseInput,
  type PurchaseRecord,
} from '../lib/shopping'
import { Plus, Trash, ShoppingBag, X, Filter, Pencil } from './icons'

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

const purchaseField =
  'w-full rounded-[15px] border border-white/80 bg-[#fffaf0] px-3 py-2.5 font-serif text-[15px] text-ink shadow-[inset_0_0_0_1px_rgba(74,64,54,.04)] outline-none transition placeholder:text-coffee/35 focus:border-coffee/25 focus:bg-white focus:ring-2 focus:ring-rose/12'

function monthKey(date: string) {
  return date.slice(0, 7)
}

function yearKey(date: string) {
  return date.slice(0, 4)
}

function shoppingErrorMessage(err: unknown, fallback: string) {
  const error = err as { code?: string; message?: string } | null
  const message = error?.message || ''
  if (error?.code === '42P01' || message.includes('purchases') || message.includes('does not exist')) {
    return 'Supabase 还没建 purchases 表喵'
  }
  if (error?.code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return '购物记录权限没放开喵'
  }
  return fallback
}

function categoryTone(category: PurchaseCategory) {
  const tones: Record<PurchaseCategory, { accent: string; chip: string; detail: string; corner: string }> = {
    猫粮: {
      accent: 'bg-peach/75',
      chip: 'rgba(248, 220, 192, 0.76)',
      detail: 'bg-peach/18',
      corner: 'rgba(248, 220, 192, 0.62)',
    },
    猫砂: {
      accent: 'bg-sky/60',
      chip: 'rgba(174, 207, 226, 0.66)',
      detail: 'bg-sky/16',
      corner: 'rgba(174, 207, 226, 0.54)',
    },
    猫零食: {
      accent: 'bg-pink/65',
      chip: 'rgba(244, 194, 214, 0.66)',
      detail: 'bg-pink/16',
      corner: 'rgba(244, 194, 214, 0.52)',
    },
    玩具: {
      accent: 'bg-lilac/65',
      chip: 'rgba(202, 191, 228, 0.66)',
      detail: 'bg-lilac/16',
      corner: 'rgba(202, 191, 228, 0.52)',
    },
    用品: {
      accent: 'bg-lemon/70',
      chip: 'rgba(240, 227, 160, 0.7)',
      detail: 'bg-lemon/16',
      corner: 'rgba(240, 227, 160, 0.54)',
    },
    医疗: {
      accent: 'bg-sage/70',
      chip: 'rgba(188, 202, 166, 0.7)',
      detail: 'bg-sage/16',
      corner: 'rgba(188, 202, 166, 0.54)',
    },
    清洁: {
      accent: 'bg-rose/55',
      chip: 'rgba(232, 167, 161, 0.56)',
      detail: 'bg-rose/14',
      corner: 'rgba(232, 167, 161, 0.48)',
    },
    其他: {
      accent: 'bg-clay/50',
      chip: 'rgba(220, 160, 131, 0.5)',
      detail: 'bg-clay/12',
      corner: 'rgba(220, 160, 131, 0.42)',
    },
  }
  return tones[category]
}

export default function ShoppingPanel() {
  const [records, setRecords] = useState<PurchaseRecord[]>([])
  const [form, setForm] = useState<FormState>(() => emptyForm())
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState<'all' | PurchaseCategory>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    listPurchases()
      .then((rows) => {
        if (alive) setRecords(rows)
      })
      .catch((err) => {
        console.error(err)
        if (alive) setError(shoppingErrorMessage(err, '购物记录加载失败喵'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

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

  function sortRecords(next: PurchaseRecord[]) {
    return [...next].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    const amount = Number(form.amount)
    if (!form.name.trim()) {
      setError('喵喵？')
      return
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setError('金额喵喵？')
      return
    }
    setSaving(true)
    setError('')
    try {
      const created = await createPurchase({
        name: form.name.trim(),
        category: form.category,
        spec: form.spec.trim(),
        note: form.note.trim(),
        amount,
        date: form.date || today(),
      })
      setRecords((prev) => sortRecords([created, ...prev]))
      setForm(emptyForm())
      setFormOpen(false)
    } catch (err) {
      console.error(err)
      setError(shoppingErrorMessage(err, '保存失败喵'))
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    const previous = records
    setRecords((prev) => prev.filter((row) => row.id !== id))
    try {
      await removePurchase(id)
    } catch (err) {
      console.error(err)
      setRecords(previous)
      setError(shoppingErrorMessage(err, '删除失败喵'))
    }
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
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border shadow-[0_8px_18px_rgba(74,64,54,.09),inset_0_0_0_1px_rgba(74,64,54,.04)] transition active:scale-95 ${
              editMode
                ? 'border-rose/35 bg-rose/18 text-rose'
                : 'border-white/80 bg-[#fffaf0] text-coffee/65 hover:text-rose'
            }`}
            onClick={() => setEditMode((value) => !value)}
            title={editMode ? 'Done editing' : 'Edit purchases'}
          >
            <Pencil width={15} height={15} />
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
          className="relative overflow-hidden rounded-[22px] border border-white/80 bg-[#fffaf0] p-4 shadow-[0_14px_30px_rgba(74,64,54,.13),inset_0_0_0_1px_rgba(74,64,54,.045)] animate-pop"
          onSubmit={submit}
        >
          <span className="absolute left-0 top-5 h-12 w-1.5 rounded-r-full bg-rose/40" />
          <div className="mb-4 flex items-center justify-between gap-3 text-ink">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose/12 text-rose">
                <ShoppingBag width={17} height={17} />
              </span>
              <div>
                <h2 className="font-script text-[27px] leading-none text-ink">New Purchase</h2>
              </div>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-coffee/45 transition hover:bg-white/80 hover:text-ink"
              onClick={() => {
                setFormOpen(false)
                setError('')
              }}
              title="收起"
            >
              <X width={15} height={15} />
            </button>
          </div>

          <div className="grid gap-2.5 md:grid-cols-2">
            <Field label="Name">
              <input
                className={purchaseField}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="喵喵喵"
              />
            </Field>
            <Field label="Type">
              <select
                className={purchaseField}
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
            <Field label="Spec">
              <input
                className={purchaseField}
                value={form.spec}
                onChange={(e) => setForm({ ...form, spec: e.target.value })}
                placeholder="喵喵"
              />
            </Field>
            <Field label="Amount">
              <input
                className={purchaseField}
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </Field>
            <Field label="Date">
              <input
                className={purchaseField}
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="Note">
              <input
                className={purchaseField}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="喵喵喵喵"
              />
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="min-h-5 text-xs text-rose">{error}</p>
            <button className="btn-soft shrink-0 disabled:opacity-55" type="submit" disabled={saving}>
              <Plus width={15} height={15} /> {saving ? 'Saving' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {!loading && visibleRecords.length > 0 && (
        <div className="space-y-3">
          {visibleRecords.map((row) => (
            <PurchaseCard
              key={row.id}
              row={row}
              editMode={editMode}
              onDelete={remove}
              onSave={async (id, input) => {
                const updated = await updatePurchase(id, input)
                setRecords((prev) => sortRecords(prev.map((item) => (item.id === id ? updated : item))))
              }}
            />
          ))}
        </div>
      )}
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

function formFromRecord(row: PurchaseRecord): FormState {
  return {
    name: row.name,
    category: row.category,
    spec: row.spec,
    note: row.note,
    amount: String(row.amount),
    date: row.date,
  }
}

function toPurchaseInput(form: FormState): PurchaseInput | null {
  const amount = Number(form.amount)
  if (!form.name.trim() || !Number.isFinite(amount) || amount < 0) return null
  return {
    name: form.name.trim(),
    category: form.category,
    spec: form.spec.trim(),
    note: form.note.trim(),
    amount,
    date: form.date || today(),
  }
}

function PurchaseCard({
  row,
  editMode,
  onSave,
  onDelete,
}: {
  row: PurchaseRecord
  editMode: boolean
  onSave: (id: string, input: PurchaseInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [draft, setDraft] = useState<FormState>(() => formFromRecord(row))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const tone = categoryTone(row.category)

  useEffect(() => {
    setDraft(formFromRecord(row))
    setMessage('')
  }, [row])

  async function save() {
    const input = toPurchaseInput(draft)
    if (!input) {
      setMessage('喵喵？')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      await onSave(row.id, input)
      setMessage('喵！')
    } catch (err) {
      console.error(err)
      setMessage(shoppingErrorMessage(err, '保存失败喵'))
    } finally {
      setBusy(false)
    }
  }

  async function deleteRow() {
    setBusy(true)
    setMessage('')
    try {
      await onDelete(row.id)
    } catch (err) {
      console.error(err)
      setMessage(shoppingErrorMessage(err, '删除失败喵'))
      setBusy(false)
    }
  }

  return (
    <article className="relative overflow-hidden rounded-[18px] border border-white/80 bg-[#fffaf0] p-4 shadow-[0_12px_26px_rgba(74,64,54,.13),inset_0_0_0_1px_rgba(74,64,54,.045)]">
      <span
        className="pointer-events-none absolute -right-5 -top-6 h-20 w-20 rounded-full"
        style={{ backgroundColor: tone.corner }}
      />
      <span className={`absolute left-0 top-5 h-12 w-1.5 rounded-r-full ${tone.accent}`} />
      {!editMode ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words font-serif text-base text-ink">{row.name}</h3>
                <span
                  className="rounded-full px-2 py-0.5 text-xs text-coffee/78"
                  style={{ backgroundColor: tone.chip }}
                >
                  {row.category}
                </span>
              </div>
              <p className="mt-1 text-xs text-coffee/55">{row.date}</p>
            </div>
            <p className="shrink-0 text-right font-serif text-base text-ink">{money.format(row.amount)}</p>
          </div>
          {(row.spec || row.note) && (
            <div className="mt-3 grid gap-2 text-sm text-coffee/68 sm:grid-cols-2">
              {row.spec && <p className={`rounded-[12px] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(74,64,54,.04)] ${tone.detail}`}>规格：{row.spec}</p>}
              {row.note && <p className={`rounded-[12px] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(74,64,54,.04)] ${tone.detail}`}>备注：{row.note}</p>}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2.5 md:grid-cols-2">
            <Field label="Name">
              <input className={purchaseField} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="Type">
              <select
                className={purchaseField}
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value as PurchaseCategory })}
              >
                {PURCHASE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Spec">
              <input className={purchaseField} value={draft.spec} onChange={(e) => setDraft({ ...draft, spec: e.target.value })} />
            </Field>
            <Field label="Amount">
              <input
                className={purchaseField}
                type="number"
                min="0"
                step="0.01"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              />
            </Field>
            <Field label="Date">
              <input className={purchaseField} type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </Field>
            <Field label="Note">
              <input className={purchaseField} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </Field>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="min-h-5 text-xs text-coffee/55">{message}</p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border border-rose/25 bg-rose/10 text-rose transition hover:bg-rose/18 disabled:opacity-50"
                onClick={deleteRow}
                disabled={busy}
                title="Delete"
              >
                <Trash width={14} height={14} />
              </button>
              <button className="btn-soft h-8 px-3 text-xs disabled:opacity-50" onClick={save} disabled={busy}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-serif text-[11px] text-coffee/48">{label}</span>
      {children}
    </label>
  )
}
