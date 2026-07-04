import { useEffect, useMemo, useState } from 'react'
import { getMedicalSettings, saveMedicalSettings } from '../lib/medical'
import { createPurchase, listPurchases, removePurchase, type PurchaseRecord } from '../lib/shopping'
import { Calendar, Check, MedicalCross, Pencil, Plus, Trash, X } from './icons'

const VACCINE_MONTH = 10
const VACCINE_DAY = 9
const STERILIZED_AT = '2026-01-31'
const costField =
  'w-full rounded-[15px] border border-white/80 bg-[#fffaf0] px-3 py-2.5 font-serif text-[15px] text-ink shadow-[inset_0_0_0_1px_rgba(74,64,54,.04)] outline-none transition placeholder:text-coffee/35 focus:border-coffee/25 focus:bg-white focus:ring-2 focus:ring-sage/20'

const money = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 2,
})

interface CostFormState {
  date: string
  event: string
  amount: string
  note: string
}

function todayText() {
  return new Date().toISOString().slice(0, 10)
}

function emptyCostForm(): CostFormState {
  return {
    date: todayText(),
    event: '',
    amount: '',
    note: '',
  }
}

function parseLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function diffDays(from: Date, to: Date) {
  const day = 24 * 60 * 60 * 1000
  return Math.floor((to.getTime() - from.getTime()) / day)
}

function nextVaccineInfo(today = startOfToday()) {
  let target = new Date(today.getFullYear(), VACCINE_MONTH, VACCINE_DAY)
  if (today.getTime() > target.getTime()) {
    target = new Date(today.getFullYear() + 1, VACCINE_MONTH, VACCINE_DAY)
  }
  return {
    target,
    days: diffDays(today, target),
  }
}

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? parseLocalDate(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

function healthErrorMessage(err: unknown, fallback: string) {
  const error = err as { code?: string; message?: string } | null
  const message = error?.message || ''
  if (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    message.includes('app_settings') ||
    message.includes('purchases') ||
    message.includes('does not exist')
  ) {
    return 'Supabase 表还没建好喵'
  }
  if (error?.code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return 'Medical 权限没放开喵'
  }
  return fallback
}

function sortMedicalCosts(records: PurchaseRecord[]) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
}

export default function MedicalPanel() {
  const [dewormedAt, setDewormedAt] = useState('2026-07-02')
  const [draftDate, setDraftDate] = useState('2026-07-02')
  const [editing, setEditing] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [medicalCosts, setMedicalCosts] = useState<PurchaseRecord[]>([])
  const [costForm, setCostForm] = useState<CostFormState>(() => emptyCostForm())
  const [costActionsOpen, setCostActionsOpen] = useState(false)
  const [costFormOpen, setCostFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [costSaving, setCostSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([getMedicalSettings(), listPurchases().catch(() => [])])
      .then(([settings, purchaseRows]) => {
        if (!alive) return
        setDewormedAt(settings.dewormed_at)
        setDraftDate(settings.dewormed_at)
        setMedicalCosts(sortMedicalCosts(purchaseRows.filter((row) => row.category === '医疗')))
      })
      .catch((err) => {
        console.error(err)
        if (alive) setMessage(healthErrorMessage(err, 'Medical 加载失败喵'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const today = useMemo(() => startOfToday(), [])
  const vaccine = useMemo(() => nextVaccineInfo(today), [today])
  const sterilizedDays = useMemo(() => Math.max(0, diffDays(parseLocalDate(STERILIZED_AT), today)), [today])
  const dewormedDays = useMemo(() => Math.max(0, diffDays(parseLocalDate(dewormedAt), today)), [dewormedAt, today])

  async function saveDewormedDate() {
    if (saving) return
    setSaving(true)
    setMessage('')
    try {
      const saved = await saveMedicalSettings({ dewormed_at: draftDate })
      setDewormedAt(saved.dewormed_at)
      setDraftDate(saved.dewormed_at)
      setEditing(false)
      setActionsOpen(false)
      setMessage('喵！')
    } catch (err) {
      console.error(err)
      setMessage(healthErrorMessage(err, '保存失败喵'))
    } finally {
      setSaving(false)
    }
  }

  async function submitCost(event: React.FormEvent) {
    event.preventDefault()
    if (costSaving) return
    const amount = Number(costForm.amount)
    if (!costForm.date || !Number.isFinite(amount) || amount < 0) {
      setMessage('喵喵？')
      return
    }
    setCostSaving(true)
    setMessage('')
    try {
      const created = await createPurchase({
        name: costForm.event.trim() || '医疗',
        category: '医疗',
        spec: '',
        note: costForm.note.trim(),
        amount,
        date: costForm.date,
      })
      setMedicalCosts((prev) => sortMedicalCosts([created, ...prev]))
      setCostForm(emptyCostForm())
      setCostFormOpen(false)
      setCostActionsOpen(false)
    } catch (err) {
      console.error(err)
      setMessage(healthErrorMessage(err, '保存失败喵'))
    } finally {
      setCostSaving(false)
    }
  }

  async function deleteCost(id: string) {
    const previous = medicalCosts
    setMedicalCosts((prev) => prev.filter((row) => row.id !== id))
    try {
      await removePurchase(id)
    } catch (err) {
      console.error(err)
      setMedicalCosts(previous)
      setMessage(healthErrorMessage(err, '删除失败喵'))
    }
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <HealthCard
          accent="bg-rose/45"
          icon={<MedicalCross width={18} height={18} />}
          label="Vaccine"
          value={loading ? '...' : String(vaccine.days)}
          unit="days"
          note={`Next ${formatDate(vaccine.target)}`}
          detail="Annual booster"
          onClick={() => {
            setActionsOpen(false)
            setCostActionsOpen(false)
          }}
        />
        <HealthCard
          accent="bg-sage/55"
          icon={<Check width={18} height={18} />}
          label="Sterilized"
          value={loading ? '...' : String(sterilizedDays)}
          unit="days"
          note={`Since ${formatDate(STERILIZED_AT)}`}
          detail="Growing steady"
          onClick={() => {
            setActionsOpen(false)
            setCostActionsOpen(false)
          }}
        />
        <HealthCard
          accent="bg-sky/50"
          icon={<Calendar width={18} height={18} />}
          label="Deworming"
          value={loading ? '...' : String(dewormedDays)}
          unit="days"
          note={`Last ${formatDate(dewormedAt)}`}
          detail="After treatment"
          onClick={() => {
            setCostActionsOpen(false)
            if (!editing) setActionsOpen((value) => !value)
          }}
          action={actionsOpen && !editing ? (
            <button
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/72 text-coffee/55 shadow-[0_5px_14px_rgba(74,64,54,.10),inset_0_0_0_1px_rgba(74,64,54,.04)] transition hover:text-ink active:scale-95 animate-pop"
              onClick={(event) => {
                event.stopPropagation()
                setDraftDate(dewormedAt)
                setEditing(true)
                setMessage('')
              }}
              title="Edit deworming date"
            >
              <Pencil width={12} height={12} />
            </button>
          ) : null}
        />
      </div>

      {editing && (
        <div className="relative overflow-hidden rounded-[22px] border border-white/80 bg-[#fffaf0] p-4 shadow-[0_14px_30px_rgba(74,64,54,.12),inset_0_0_0_1px_rgba(74,64,54,.045)] animate-pop">
          <span className="absolute left-0 top-5 h-12 w-1.5 rounded-r-full bg-sky/50" />
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-script text-[27px] leading-none text-ink">Deworming</p>
              <p className="mt-1 text-xs text-coffee/48">Update the last treatment date</p>
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-coffee/45 transition hover:bg-white/80 hover:text-ink"
              onClick={() => {
                setEditing(false)
                setActionsOpen(false)
                setDraftDate(dewormedAt)
                setMessage('')
              }}
              title="Close"
            >
              <X width={15} height={15} />
            </button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Last Date">
              <input
                className={costField}
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
              />
            </Field>
            <button className="btn-soft h-10 shrink-0 disabled:opacity-55" onClick={saveDewormedDate} disabled={saving}>
              <Check width={15} height={15} /> {saving ? 'Saving' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <ActionCard
          open={costActionsOpen && !costFormOpen}
          onClick={() => {
            if (!costFormOpen) setCostActionsOpen((value) => !value)
          }}
          onAdd={(event) => {
            event.stopPropagation()
            setCostForm(emptyCostForm())
            setCostFormOpen(true)
            setCostActionsOpen(false)
            setMessage('')
          }}
        />

        {costFormOpen && (
          <form
            className="relative overflow-hidden rounded-[22px] border border-white/80 bg-[#fffaf0] p-4 shadow-[0_14px_30px_rgba(74,64,54,.12),inset_0_0_0_1px_rgba(74,64,54,.045)] animate-pop"
            onSubmit={submitCost}
          >
            <span className="absolute left-0 top-5 h-12 w-1.5 rounded-r-full bg-sage/60" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-script text-[27px] leading-none text-ink">Medical Record</p>
                <p className="mt-1 text-xs text-coffee/48">Also linked to Shopping as medical spending</p>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-coffee/45 transition hover:bg-white/80 hover:text-ink"
                onClick={() => {
                  setCostFormOpen(false)
                  setMessage('')
                }}
                title="Close"
              >
                <X width={15} height={15} />
              </button>
            </div>
            <div className="grid gap-2.5 md:grid-cols-2">
              <Field label="Date">
                <input
                  className={costField}
                  type="date"
                  value={costForm.date}
                  onChange={(e) => setCostForm({ ...costForm, date: e.target.value })}
                />
              </Field>
              <Field label="Event">
                <input
                  className={costField}
                  value={costForm.event}
                  onChange={(e) => setCostForm({ ...costForm, event: e.target.value })}
                  placeholder="比如：复查 / 疫苗 / 看诊"
                />
              </Field>
              <Field label="Amount">
                <input
                  className={costField}
                  type="number"
                  min="0"
                  step="0.01"
                  value={costForm.amount}
                  onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Note">
                <input
                  className={costField}
                  value={costForm.note}
                  onChange={(e) => setCostForm({ ...costForm, note: e.target.value })}
                  placeholder="喵喵喵"
                />
              </Field>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="btn-soft h-10 shrink-0 disabled:opacity-55" type="submit" disabled={costSaving}>
                <Plus width={15} height={15} /> {costSaving ? 'Saving' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {medicalCosts.length > 0 && (
          <div className="space-y-3">
            {medicalCosts.map((record) => (
              <MedicalCostCard key={record.id} record={record} onDelete={deleteCost} />
            ))}
          </div>
        )}
      </section>

      {message && <p className="px-2 text-xs text-rose">{message}</p>}
    </section>
  )
}

function ActionCard({
  open,
  onClick,
  onAdd,
}: {
  open: boolean
  onClick: () => void
  onAdd: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <article
      className="relative min-h-[96px] cursor-pointer overflow-hidden rounded-[22px] border border-white/80 bg-[#fffaf0] p-4 shadow-[0_12px_26px_rgba(74,64,54,.11),inset_0_0_0_1px_rgba(74,64,54,.045)] transition active:scale-[0.99]"
      onClick={onClick}
    >
      <span className="absolute left-0 top-5 h-12 w-1.5 rounded-r-full bg-sage/60" />
      {open && (
        <button
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/72 text-coffee/55 shadow-[0_5px_14px_rgba(74,64,54,.10),inset_0_0_0_1px_rgba(74,64,54,.04)] transition hover:text-ink active:scale-95 animate-pop"
          onClick={onAdd}
          title="New medical record"
        >
          <Plus width={12} height={12} />
        </button>
      )}
      <div className="flex items-center gap-3 text-coffee/65">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-[inset_0_0_0_1px_rgba(74,64,54,.04)]">
          <MedicalCross width={18} height={18} />
        </span>
        <div>
          <p className="font-script text-[28px] leading-none text-ink">Medical Record</p>
          <p className="mt-1 font-serif text-xs text-coffee/48">Tap to add a record and sync it to Shopping</p>
        </div>
      </div>
    </article>
  )
}

function MedicalCostCard({ record, onDelete }: { record: PurchaseRecord; onDelete: (id: string) => void }) {
  return (
    <article className="relative overflow-hidden rounded-[18px] border border-white/80 bg-[#fffaf0] p-4 shadow-[0_12px_26px_rgba(74,64,54,.12),inset_0_0_0_1px_rgba(74,64,54,.045)]">
      <span className="absolute left-0 top-5 h-12 w-1.5 rounded-r-full bg-sage/60" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-serif text-base text-ink">{record.name || '医疗'}</h3>
            <span className="rounded-full bg-sage/18 px-2 py-0.5 text-xs text-coffee/70">{formatDate(record.date)}</span>
          </div>
          <p className="mt-1 text-xs text-coffee/55">{record.note || 'No note'}</p>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <p className="text-right font-serif text-base text-ink">{money.format(record.amount)}</p>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full text-coffee/35 transition hover:bg-rose/12 hover:text-rose active:scale-95"
            onClick={() => onDelete(record.id)}
            title="Delete"
          >
            <Trash width={13} height={13} />
          </button>
        </div>
      </div>
    </article>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block flex-1">
      <span className="mb-1 block font-serif text-[11px] text-coffee/48">{label}</span>
      {children}
    </label>
  )
}

function HealthCard({
  accent,
  icon,
  label,
  value,
  unit,
  note,
  detail,
  action,
  onClick,
}: {
  accent: string
  icon: React.ReactNode
  label: string
  value: string
  unit: string
  note: string
  detail: string
  action?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <article
      className={`relative min-h-[168px] overflow-hidden rounded-[22px] border border-white/80 bg-[#fffaf0] p-4 shadow-[0_14px_30px_rgba(74,64,54,.13),inset_0_0_0_1px_rgba(74,64,54,.045)] ${
        onClick ? 'cursor-pointer transition active:scale-[0.99]' : ''
      }`}
      onClick={onClick}
    >
      <span className={`absolute left-0 top-5 h-14 w-1.5 rounded-r-full ${accent}`} />
      <span className="absolute -right-6 -top-7 h-24 w-24 rounded-full bg-white/45" />
      {action}
      <div className="flex items-center gap-2 text-coffee/65">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 shadow-[inset_0_0_0_1px_rgba(74,64,54,.04)]">
          {icon}
        </span>
        <div>
          <p className="font-serif text-[13px] text-coffee/60">{label}</p>
          <p className="font-serif text-[11px] text-coffee/42">{detail}</p>
        </div>
      </div>
      <div className="mt-5 flex items-end gap-2">
        <p className="font-script text-[56px] leading-[0.9] text-ink">{value}</p>
        <p className="pb-2 font-serif text-sm text-coffee/56">{unit}</p>
      </div>
      <p className="mt-4 rounded-[14px] bg-white/62 px-3 py-2 font-serif text-[13px] text-coffee/68 shadow-[inset_0_0_0_1px_rgba(74,64,54,.035)]">
        {note}
      </p>
    </article>
  )
}
