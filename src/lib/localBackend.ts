import type { Backend, Entry } from './types'
import { LOCAL_ADMIN_PASSWORD } from './config'

/**
 * Local backend: photos (Blob) + metadata stored in IndexedDB.
 * Used automatically when no Supabase keys are configured.
 * Single-device, offline, zero-cost. Data lives in this browser only.
 */

const DB_NAME = 'cat-journal'
const STORE = 'entries'
const ADMIN_KEY = 'cat-journal:isAdmin'

interface Row {
  id: string
  blob: Blob
  caption: string
  sort_order: number
  created_at: string
  updated_at: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(STORE, mode).objectStore(STORE)
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getAllRows(): Promise<Row[]> {
  const db = await openDB()
  const rows = await reqToPromise(tx(db, 'readonly').getAll() as IDBRequest<Row[]>)
  db.close()
  return rows
}

async function getRow(id: string): Promise<Row | undefined> {
  const db = await openDB()
  const row = await reqToPromise(tx(db, 'readonly').get(id) as IDBRequest<Row | undefined>)
  db.close()
  return row
}

async function putRow(row: Row): Promise<void> {
  const db = await openDB()
  await reqToPromise(tx(db, 'readwrite').put(row))
  db.close()
}

async function deleteRow(id: string): Promise<void> {
  const db = await openDB()
  await reqToPromise(tx(db, 'readwrite').delete(id))
  db.close()
}

function rowToEntry(row: Row): Entry {
  return {
    id: row.id,
    photo_path: row.id,
    url: URL.createObjectURL(row.blob),
    caption: row.caption,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

const authListeners = new Set<() => void>()

export const localBackend: Backend = {
  mode: 'local',

  async list() {
    const rows = await getAllRows()
    return rows.sort((a, b) => a.sort_order - b.sort_order).map(rowToEntry)
  },

  async create(file, caption, dateISO) {
    const rows = await getAllRows()
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0)
    const now = new Date().toISOString()
    const created = dateISO || now
    const row: Row = {
      id: crypto.randomUUID(),
      blob: file,
      caption,
      sort_order: maxOrder + 1,
      created_at: created,
      updated_at: now,
    }
    await putRow(row)
    return rowToEntry(row)
  },

  async updateCaption(id, caption) {
    const row = await getRow(id)
    if (!row) return
    row.caption = caption
    row.updated_at = new Date().toISOString()
    await putRow(row)
  },

  async reorder(orderedIds) {
    const db = await openDB()
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE)
    await Promise.all(
      orderedIds.map(async (id, idx) => {
        const row = await reqToPromise(store.get(id) as IDBRequest<Row | undefined>)
        if (row) {
          row.sort_order = idx + 1
          store.put(row)
        }
      }),
    )
    db.close()
  },

  async remove(id) {
    await deleteRow(id)
  },

  async isAdmin() {
    return localStorage.getItem(ADMIN_KEY) === '1'
  },

  async loginAdmin(password) {
    if (password !== LOCAL_ADMIN_PASSWORD) {
      throw new Error('密码不正确')
    }
    localStorage.setItem(ADMIN_KEY, '1')
    authListeners.forEach((cb) => cb())
  },

  async logoutAdmin() {
    localStorage.removeItem(ADMIN_KEY)
    authListeners.forEach((cb) => cb())
  },

  onAuthChange(cb) {
    authListeners.add(cb)
    return () => authListeners.delete(cb)
  },
}
