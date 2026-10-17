'use client'
// The parent's photos for the Jigsaw, kept in this browser only (IndexedDB), never sent anywhere. Every call is
// forgiving: if the browser has no IndexedDB, or it is blocked (a private window), there are simply no photos,
// and the Jigsaw uses its drawn pictures as before.

const DB = 'littleSteps.pictures'
const STORE = 'photos'

/** How many photos a parent can keep. */
export const MAX_PHOTOS = 12

export type Photo = { slot: number; blob: Blob; at: number }

function open(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null)
      const req = indexedDB.open(DB, 1)
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: 'slot' }) }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch { resolve(null) }
  })
}

function run<T, F>(mode: IDBTransactionMode, work: (s: IDBObjectStore) => IDBRequest<T>, fallback: F): Promise<T | F> {
  return open().then(db => new Promise<T | F>(resolve => {
    if (!db) return resolve(fallback)
    try {
      const req = work(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => { resolve(req.result); db.close() }
      req.onerror = () => { resolve(fallback); db.close() }
    } catch { resolve(fallback); db.close() }
  }))
}

export async function listPhotos(): Promise<Photo[]> {
  const all = await run<Photo[], Photo[]>('readonly', s => s.getAll() as IDBRequest<Photo[]>, [])
  return all
    .filter(p => p && p.blob instanceof Blob && Number.isInteger(p.slot) && p.slot >= 0 && p.slot < MAX_PHOTOS)
    .sort((a, b) => a.slot - b.slot)
}

export async function savePhoto(photo: Photo): Promise<boolean> {
  const ok = await run('readwrite', s => s.put(photo), null)
  return ok !== null
}

export async function deletePhoto(slot: number): Promise<void> {
  await run('readwrite', s => s.delete(slot), undefined)
}

/** The first empty place for a new photo, or null when all are taken. */
export function freeSlot(photos: { slot: number }[]): number | null {
  const used = new Set(photos.map(p => p.slot))
  for (let i = 0; i < MAX_PHOTOS; i++) if (!used.has(i)) return i
  return null
}
