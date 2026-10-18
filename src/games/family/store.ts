'use client'
// The people a parent adds for Family Faces: a photo, what the child calls them, and what they are to the child. Kept
// in this browser only (IndexedDB), never sent anywhere. Every call is forgiving: if the browser has no IndexedDB, or it
// is blocked (a private window), there are simply no people, and the game says to ask a grown-up.

const DB = 'littleSteps.family'
const STORE = 'people'

/** How many people a parent can add. */
export const MAX_PEOPLE = 12

/** `voice` is the parent saying the name, if they recorded it; `voiceMs` is how long it is. */
export type StoredPerson = { slot: number; name: string; relation: string; blob: Blob; at: number; voice?: Blob; voiceMs?: number }

/** One saved entry, checked; a damaged recording is dropped and the person kept. null if the person itself is unusable. */
export function cleanPerson(p: unknown): StoredPerson | null {
  if (!p || typeof p !== 'object') return null
  const r = p as Record<string, unknown>
  if (!(r.blob instanceof Blob) || !Number.isInteger(r.slot) || (r.slot as number) < 0 || (r.slot as number) >= MAX_PEOPLE) return null
  if (typeof r.name !== 'string' || typeof r.relation !== 'string') return null
  const out: StoredPerson = { slot: r.slot as number, name: r.name, relation: r.relation, blob: r.blob, at: typeof r.at === 'number' ? r.at : 0 }
  if (r.voice instanceof Blob && r.voice.size > 0) {
    out.voice = r.voice
    if (typeof r.voiceMs === 'number' && r.voiceMs > 0 && r.voiceMs < 60_000) out.voiceMs = r.voiceMs
  }
  return out
}

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
  return all.map(cleanPerson).filter((p): p is StoredPerson => p !== null).sort((a, b) => a.slot - b.slot)
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
