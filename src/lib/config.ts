/**
 * All user-tunable settings live here, driven by env vars with friendly defaults
 * so the app runs out-of-the-box in LOCAL mode before any cloud keys exist.
 *
 * To customise without env vars, just edit the defaults below.
 */

const env = import.meta.env

export interface GateQuestion {
  q: string
  /** accepted answers (case/space-insensitive). any match passes. */
  answers: string[]
}

/** Visitor Q&A gate. Edit these, or set VITE_GATE_QA as JSON. */
export const GATE_QUESTIONS: GateQuestion[] = (() => {
  const raw = env.VITE_GATE_QA as string | undefined
  if (raw) {
    try {
      return JSON.parse(raw)
    } catch {
      console.warn('VITE_GATE_QA is not valid JSON, using defaults')
    }
  }
  return [{ q: '秋秋和妈妈第一次见面的时间？', answers: ['20250910'] }]
})()

/** Branding */
export const SITE = {
  title: env.VITE_SITE_TITLE || "Qiuqiu's Diary",
  // 允许设为空字符串以隐藏副标题
  subtitle: env.VITE_SITE_SUBTITLE ?? '',
  catName: env.VITE_CAT_NAME || '秋秋',
}

/** Supabase config — when both present, the app runs in CLOUD mode. */
export const SUPABASE_URL = env.VITE_SUPABASE_URL as string | undefined
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY as string | undefined
export const SUPABASE_BUCKET = (env.VITE_SUPABASE_BUCKET as string) || 'cat-photos'
export const isCloud = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/**
 * Admin password for LOCAL mode only (cloud mode uses Supabase email+password).
 * Change this, or set VITE_ADMIN_PASSWORD.
 */
export const LOCAL_ADMIN_PASSWORD = (env.VITE_ADMIN_PASSWORD as string) || 'meow-admin'

export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '')
}
