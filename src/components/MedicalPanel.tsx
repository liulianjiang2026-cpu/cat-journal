import { useEffect, useMemo, useState } from 'react'
import { getMedicalSettings, saveMedicalSettings } from '../lib/medical'
import { Calendar, Check, MedicalCross, Pencil, X } from './icons'

const VACCINE_MONTH = 10
const VACCINE_DAY = 9
const STERILIZED_AT = '2026-01-31'

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
  if (error?.code === '42P01' || message.includes('app_settings') || message.includes('does not exist')) {
    return 'Supabase 还没建 app_settings 表喵'
  }
  if (error?.code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return 'Medical 权限没放开喵'
  }
  return fallback
}

export default function MedicalPanel() {
  const [dewormedAt, setDewormedAt] = useState('2026-07-02')
  const [draftDate, setDraftDate] = useState('2026-07-02')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let alive = true
    getMedicalSettings()
      .then((settings) => {
        if (!alive) return
        setDewormedAt(settings.dewormed_at)
        setDraftDate(settings.dewormed_at)
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
      setMessage('喵！')
    } catch (err) {
      console.error(err)
      setMessage(healthErrorMessage(err, '保存失败喵'))
    } finally {
      setSaving(false)
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
        />
        <HealthCard
          accent="bg-sage/55"
          icon={<Check width={18} height={18} />}
          label="Sterilized"
          value={loading ? '...' : String(sterilizedDays)}
          unit="days"
          note={`Since ${formatDate(STERILIZED_AT)}`}
          detail="Growing steady"
        />
        <HealthCard
          accent="bg-sky/50"
          icon={<Calendar width={18} height={18} />}
          label="Deworming"
          value={loading ? '...' : String(dewormedDays)}
          unit="days"
          note={`Last ${formatDate(dewormedAt)}`}
          detail="After treatment"
          action={
            <button
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-coffee/38 transition hover:bg-white/70 hover:text-ink active:scale-95"
              onClick={() => {
                setDraftDate(dewormedAt)
                setEditing(true)
                setMessage('')
              }}
              title="Edit deworming date"
            >
              <Pencil width={12} height={12} />
            </button>
          }
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
                setDraftDate(dewormedAt)
                setMessage('')
              }}
              title="Close"
            >
              <X width={15} height={15} />
            </button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1">
              <span className="mb-1 block font-serif text-[11px] text-coffee/48">Last Date</span>
              <input
                className="w-full rounded-[15px] border border-white/80 bg-[#fffaf0] px-3 py-2.5 font-serif text-[15px] text-ink shadow-[inset_0_0_0_1px_rgba(74,64,54,.04)] outline-none transition focus:border-coffee/25 focus:bg-white focus:ring-2 focus:ring-sky/20"
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
              />
            </label>
            <button className="btn-soft h-10 shrink-0 disabled:opacity-55" onClick={saveDewormedDate} disabled={saving}>
              <Check width={15} height={15} /> {saving ? 'Saving' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {message && <p className="px-2 text-xs text-rose">{message}</p>}
    </section>
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
}: {
  accent: string
  icon: React.ReactNode
  label: string
  value: string
  unit: string
  note: string
  detail: string
  action?: React.ReactNode
}) {
  return (
    <article className="relative min-h-[168px] overflow-hidden rounded-[22px] border border-white/80 bg-[#fffaf0] p-4 shadow-[0_14px_30px_rgba(74,64,54,.13),inset_0_0_0_1px_rgba(74,64,54,.045)]">
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
