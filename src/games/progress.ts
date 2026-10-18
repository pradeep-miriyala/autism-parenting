// What a child has finished: a count of rounds per day and per game, and the stickers earned.
// It is kept in this browser only (localStorage), never sent anywhere. There is no score and
// nothing here is ever taken away by playing: a sticker is earned by finishing a round, and a
// round that was not finished simply earns nothing.
//
// Dependency-free on purpose, so scripts/test-progress.mts can check it.

export type GameKey =
  | 'numbers' | 'spelling' | 'spot' | 'trace' | 'letters' | 'match' | 'habits'
  | 'count' | 'pattern' | 'sort' | 'odd' | 'puzzle' | 'dots' | 'memory'
export const GAME_KEYS: GameKey[] = [
  'numbers', 'spelling', 'spot', 'trace', 'letters', 'match', 'habits',
  'count', 'pattern', 'sort', 'odd', 'puzzle', 'dots',
  'memory',
]

export type Progress = {
  /** Rounds finished, by local date (YYYY-MM-DD), then by game. */
  days: Record<string, Partial<Record<GameKey, number>>>
  /** Indexes into STICKERS, in the order they were earned. */
  stickers: number[]
}

export const EMPTY_PROGRESS: Progress = { days: {}, stickers: [] }

/** A fixed album: every sticker is a plain, friendly picture. */
export const STICKERS: { emoji: string; label: string }[] = [
  { emoji: '🐝', label: 'Bee' }, { emoji: '⭐', label: 'Star' }, { emoji: '🌈', label: 'Rainbow' },
  { emoji: '🚜', label: 'Tractor' }, { emoji: '🐮', label: 'Cow' }, { emoji: '🐟', label: 'Fish' },
  { emoji: '🚂', label: 'Train' }, { emoji: '🦆', label: 'Duck' }, { emoji: '🐢', label: 'Turtle' },
  { emoji: '🍎', label: 'Apple' }, { emoji: '🌻', label: 'Sunflower' }, { emoji: '🚀', label: 'Rocket' },
  { emoji: '🐘', label: 'Elephant' }, { emoji: '🎈', label: 'Balloon' }, { emoji: '🦋', label: 'Butterfly' },
  { emoji: '🐸', label: 'Frog' }, { emoji: '🍓', label: 'Strawberry' }, { emoji: '🚲', label: 'Bicycle' },
  { emoji: '🐬', label: 'Dolphin' }, { emoji: '🌙', label: 'Moon' }, { emoji: '🐞', label: 'Ladybird' },
  { emoji: '⛵', label: 'Sailboat' }, { emoji: '🎨', label: 'Paints' }, { emoji: '🐑', label: 'Sheep' },
  { emoji: '🍉', label: 'Watermelon' }, { emoji: '🦁', label: 'Lion' }, { emoji: '🧸', label: 'Teddy bear' },
  { emoji: '🐧', label: 'Penguin' }, { emoji: '🌳', label: 'Tree' }, { emoji: '🏠', label: 'House' },
]

const KEEP_DAYS = 120

/** Local calendar date, so "today" is the child's today and not UTC's. */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function daysAgo(now: Date, n: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - n)
}

/**
 * A round was finished. Counts it and, while the album has room, earns a sticker chosen at random
 * from those not yet earned. `rand` is Math.random, passed in so tests can fix it.
 */
export function recordRound(p: Progress, game: GameKey, now: Date, rand: () => number): { progress: Progress; sticker: number | null } {
  const key = dayKey(now)
  const today = { ...(p.days[key] || {}) }
  today[game] = (today[game] || 0) + 1
  const days = { ...p.days, [key]: today }
  const cutoff = dayKey(daysAgo(now, KEEP_DAYS))
  for (const k of Object.keys(days)) if (k < cutoff) delete days[k]

  const owned = new Set(p.stickers)
  const free = STICKERS.map((_, i) => i).filter(i => !owned.has(i))
  if (free.length === 0) return { progress: { days, stickers: p.stickers }, sticker: null }
  const sticker = free[Math.min(free.length - 1, Math.floor(rand() * free.length))]
  return { progress: { days, stickers: [...p.stickers, sticker] }, sticker }
}

export type Summary = {
  today: number
  week: number
  total: number
  byGame: Partial<Record<GameKey, number>>   // the last 7 days
  daily: { key: string; label: string; count: number }[]   // the last 7 days, oldest first
  stickers: number
}

const sum = (r: Partial<Record<GameKey, number>> | undefined) => GAME_KEYS.reduce((n, g) => n + (r?.[g] || 0), 0)

/** For the parent: this week at a glance. */
export function summarise(p: Progress, now: Date): Summary {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(now, 6 - i)
    const key = dayKey(d)
    return { key, label: names[d.getDay()], count: sum(p.days[key]) }
  })
  const byGame: Partial<Record<GameKey, number>> = {}
  for (const { key } of daily) for (const g of GAME_KEYS) {
    const n = p.days[key]?.[g] || 0
    if (n) byGame[g] = (byGame[g] || 0) + n
  }
  return {
    today: daily[6].count,
    week: daily.reduce((n, d) => n + d.count, 0),
    total: Object.values(p.days).reduce((n, r) => n + sum(r), 0),
    byGame,
    daily,
    stickers: p.stickers.length,
  }
}

/** Reads what was saved, keeping only what makes sense, so a damaged entry cannot break the page. */
export function cleanProgress(raw: unknown): Progress {
  const out: Progress = { days: {}, stickers: [] }
  if (!raw || typeof raw !== 'object') return out
  const r = raw as any
  if (r.days && typeof r.days === 'object') {
    for (const [k, v] of Object.entries(r.days)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !v || typeof v !== 'object') continue
      const row: Partial<Record<GameKey, number>> = {}
      for (const g of GAME_KEYS) {
        const n = (v as any)[g]
        if (Number.isInteger(n) && n > 0 && n < 100000) row[g] = n
      }
      if (Object.keys(row).length) out.days[k] = row
    }
  }
  if (Array.isArray(r.stickers)) {
    const seen = new Set<number>()
    for (const i of r.stickers) {
      if (Number.isInteger(i) && i >= 0 && i < STICKERS.length && !seen.has(i)) { seen.add(i); out.stickers.push(i) }
    }
  }
  return out
}
