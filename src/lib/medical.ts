import { isCloud } from './config'
import { supabase } from './supabase'

export interface MedicalSettings {
  dewormed_at: string
  litter_changed_at: string
}

const SETTINGS_KEY = 'medical'
const LOCAL_KEY = 'cat-journal:medical-settings'
const DEFAULT_SETTINGS: MedicalSettings = {
  dewormed_at: '2026-07-02',
  litter_changed_at: '2026-07-05',
}

function client() {
  if (!supabase) throw new Error('Supabase 未配置')
  return supabase
}

function normalizeSettings(value: unknown): MedicalSettings {
  if (!value || typeof value !== 'object') return DEFAULT_SETTINGS
  const row = value as Partial<MedicalSettings>
  return {
    dewormed_at: typeof row.dewormed_at === 'string' && row.dewormed_at
      ? row.dewormed_at
      : DEFAULT_SETTINGS.dewormed_at,
    litter_changed_at: typeof row.litter_changed_at === 'string' && row.litter_changed_at
      ? row.litter_changed_at
      : DEFAULT_SETTINGS.litter_changed_at,
  }
}

function readLocal(): MedicalSettings {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'))
  } catch {
    return DEFAULT_SETTINGS
  }
}

function writeLocal(settings: MedicalSettings) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(settings))
}

export async function getMedicalSettings(): Promise<MedicalSettings> {
  if (!isCloud) return readLocal()
  const { data, error } = await client()
    .from('app_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle()
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return DEFAULT_SETTINGS
    throw error
  }
  return normalizeSettings(data?.value)
}

export async function saveMedicalSettings(settings: MedicalSettings): Promise<MedicalSettings> {
  const next = normalizeSettings(settings)
  if (!isCloud) {
    writeLocal(next)
    return next
  }
  const { data, error } = await client()
    .from('app_settings')
    .upsert({
      key: SETTINGS_KEY,
      value: next,
      updated_at: new Date().toISOString(),
    })
    .select('value')
    .single()
  if (error) throw error
  return normalizeSettings(data?.value)
}
