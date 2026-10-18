'use client'
// The people a parent adds for Family Faces: a photo, what the child calls them, and what they are to the child. Kept
// in this browser only (IndexedDB), never sent anywhere. Every call is forgiving: if the browser has no IndexedDB, or it
// is blocked (a private window), there are simply no people, and the game says to ask a grown-up.

const DB = 'littleSteps.family'
const STORE = 'people'

/** How many people a parent can add. */
export const MAX_PEOPLE = 12

export type StoredPerson = { slot: number; name: string; relation: string; blob: Blob; at: number }

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

export async function listPeople(): Promise<StoredPerson[]> {
  const all = await run<StoredPerson[], StoredPerson[]>('readonly', s => s.getAll() as IDBRequest<StoredPerson[]>, [])
  return all
    .filter(p => p && p.blob instanceof Blob && Number.isInteger(p.slot) && p.slot >= 0 && p.slot < MAX_PEOPLE && typeof p.name === 'string' && typeof p.relation === 'string')
    .sort((a, b) => a.slot - b.slot)
}

export async function savePerson(person: StoredPerson): Promise<boolean> {
  const ok = await run('readwrite', s => s.put(person), null)
  return ok !== null
}

export async function deletePerson(slot: number): Promise<void> {
  await run('readwrite', s => s.delete(slot), undefined)
}

/** The first empty place for a new person, or null when all are taken. */
export function freePlace(people: { slot: number }[]): number | null {
  const used = new Set(people.map(p => p.slot))
  for (let i = 0; i < MAX_PEOPLE; i++) if (!used.has(i)) return i
  return null
}
