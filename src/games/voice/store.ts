'use client'
// The parent's recordings, kept in this browser only (IndexedDB), never sent anywhere. Every call is
// forgiving: if the browser has no IndexedDB, or it is blocked (a private window), there are simply no
// recordings, and the games use the computer voice as before.

const DB = 'littleSteps.voice'
const STORE = 'clips'

export type Clip = { slot: number; blob: Blob; type: string; ms: number; at: number }

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

export async function listClips(): Promise<Clip[]> {
  const all = await run<Clip[], Clip[]>('readonly', s => s.getAll() as IDBRequest<Clip[]>, [])
  return all.filter(c => c && c.blob instanceof Blob && Number.isInteger(c.slot))
}

export async function saveClip(clip: Clip): Promise<boolean> {
  const ok = await run('readwrite', s => s.put(clip), null)
  return ok !== null
}

export async function deleteClip(slot: number): Promise<void> {
  await run('readwrite', s => s.delete(slot), undefined)
}
