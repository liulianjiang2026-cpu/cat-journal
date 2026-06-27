import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, isCloud } from './config'

/** Null when running in local mode (no keys configured). */
export const supabase: SupabaseClient | null = isCloud
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string)
  : null
