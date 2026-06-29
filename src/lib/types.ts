export interface Entry {
  id: string
  /** storage path (supabase) or indexeddb blob key (local) */
  photo_path: string
  /** ready-to-use image url (object URL in local mode, signed/public URL in supabase mode) */
  url: string
  caption: string
  sort_order: number
  created_at: string
  updated_at: string
}

/** Unified data layer interface — both local & supabase backends implement this. */
export interface Backend {
  /** human-readable mode, shown in UI footer */
  readonly mode: 'local' | 'cloud'

  list(): Promise<Entry[]>
  /** upload a compressed image + caption, appended to the end.
   *  dateISO (可选) 指定拍摄日期，用作 created_at；不传则用当前时间。 */
  create(file: Blob, caption: string, dateISO?: string): Promise<Entry>
  updateCaption(id: string, caption: string): Promise<void>
  /** persist a new ordering given the full list of ids in display order */
  reorder(orderedIds: string[]): Promise<void>
  remove(id: string): Promise<void>

  /** admin auth */
  isAdmin(): Promise<boolean>
  loginAdmin(emailOrPassword: string, password?: string): Promise<void>
  logoutAdmin(): Promise<void>
  /** notify when admin state may have changed */
  onAuthChange(cb: () => void): () => void
}
