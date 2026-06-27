import type { Backend } from './types'
import { isCloud } from './config'
import { localBackend } from './localBackend'
import { supabaseBackend } from './supabaseBackend'

/** Single backend instance, auto-selected by whether Supabase keys exist. */
export const backend: Backend = isCloud ? supabaseBackend : localBackend

export type { Backend, Entry } from './types'
