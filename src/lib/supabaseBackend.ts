import type { Backend, Entry } from './types'
import { supabase } from './supabase'
import { SUPABASE_BUCKET } from './config'

/**
 * Cloud backend backed by Supabase (Postgres + Storage + Auth).
 * Active when VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY are set.
 *
 * Writes are gated server-side by Row Level Security (see supabase/schema.sql),
 * so non-admins physically cannot insert/update/delete.
 */

interface RowDB {
  id: string
  photo_path: string
  caption: string
  sort_order: number
  created_at: string
  updated_at: string
}

function client() {
  if (!supabase) throw new Error('Supabase 未配置')
  return supabase
}

function publicUrl(path: string): string {
  return client().storage.from(SUPABASE_BUCKET).getPublicUrl(path).data.publicUrl
}

function toEntry(r: RowDB): Entry {
  return { ...r, url: publicUrl(r.photo_path) }
}

export const supabaseBackend: Backend = {
  mode: 'cloud',

  async list() {
    const { data, error } = await client()
      .from('entries')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return (data as RowDB[]).map(toEntry)
  },

  async create(file, caption) {
    const sb = client()
    const ext = (file as File).name?.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${crypto.randomUUID()}.${ext}`

    const { error: upErr } = await sb.storage.from(SUPABASE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    })
    if (upErr) throw upErr

    const { data: maxRow } = await sb
      .from('entries')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextOrder = (maxRow?.sort_order ?? 0) + 1

    const { data, error } = await sb
      .from('entries')
      .insert({ photo_path: path, caption, sort_order: nextOrder })
      .select('*')
      .single()
    if (error) {
      // roll back the orphaned upload
      await sb.storage.from(SUPABASE_BUCKET).remove([path])
      throw error
    }
    return toEntry(data as RowDB)
  },

  async updateCaption(id, caption) {
    const { error } = await client()
      .from('entries')
      .update({ caption, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async reorder(orderedIds) {
    const sb = client()
    // update each row's sort_order to its index
    const updates = orderedIds.map((id, idx) =>
      sb.from('entries').update({ sort_order: idx + 1 }).eq('id', id),
    )
    const results = await Promise.all(updates)
    const failed = results.find((r) => r.error)
    if (failed?.error) throw failed.error
  },

  async remove(id) {
    const sb = client()
    const { data: row, error: selErr } = await sb
      .from('entries')
      .select('photo_path')
      .eq('id', id)
      .single()
    if (selErr) throw selErr
    const { error } = await sb.from('entries').delete().eq('id', id)
    if (error) throw error
    if (row?.photo_path) {
      await sb.storage.from(SUPABASE_BUCKET).remove([row.photo_path])
    }
  },

  async isAdmin() {
    const { data } = await client().auth.getSession()
    return Boolean(data.session)
  },

  async loginAdmin(email, password) {
    const { error } = await client().auth.signInWithPassword({
      email,
      password: password as string,
    })
    if (error) throw error
  },

  async logoutAdmin() {
    await client().auth.signOut()
  },

  onAuthChange(cb) {
    const { data } = client().auth.onAuthStateChange(() => cb())
    return () => data.subscription.unsubscribe()
  },
}
