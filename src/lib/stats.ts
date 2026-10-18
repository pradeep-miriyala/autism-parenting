// src/lib/stats.ts
// What the Little Steps games report, and how it is kept. The dashboard that reads it back is not in this
// repo: it is Admin → Little Steps on the portfolio site (src/lib/parentingStats.ts there is this file plus the
// read side), so there is one admin for everything. A change to the records or the games list goes in both.
//
// Privacy is the design, not a layer on top of it:
//   * Every number is a COUNT. There are no per-person rows, no IP address, no user agent, no
//     cookie and no identifier that survives a page load.
//   * "Who is on the page now" is a random id made fresh in the browser on each page load. It lives
//     in `parenting_live` for a few minutes (a TTL index removes it) and is never linked to anything.
//   * A child's first name is kept ONLY if a parent switches sharing on, in `parenting_shared`,
//     under a random id the browser holds. Switching sharing off deletes that record, and the portfolio
//     admin can delete one too. It expires on its own after a year without a visit.
//
// Takes the Db as an argument, and imports only types from mongodb, so scripts/test-stats.mts
// can check the cleaning without a database.

import type { Db } from 'mongodb'

export const PARENTING_GAMES = [
  'numbers', 'spelling', 'spot', 'trace', 'letters', 'match', 'habits',
  'count', 'pattern', 'sort', 'odd', 'puzzle', 'dots',
  'memory',
  'shapes',
  'maze',
] as const
export type PGame = (typeof PARENTING_GAMES)[number]

export const GAME_LABELS: Record<PGame, string> = {
  numbers: 'Number Steps', spelling: 'Spelling Bees', spot: 'Spot the Differences',
  trace: 'Trace the Lines', letters: 'Letters & Numbers', match: 'Matching Objects', habits: 'Helpful Habits',
  count: 'How Many?', pattern: 'What Comes Next?', sort: 'Sort It', odd: 'Odd One Out', puzzle: 'Jigsaw', dots: 'Connect the Dots',
  memory: "Memory Pairs",
  shapes: "Colours and Shapes",
  maze: "Maze",
}

export const AGE_BANDS = ['u4', '5-6', '7-8', '9+'] as const
export type AgeBand = (typeof AGE_BANDS)[number]
export const AGE_BAND_LABELS: Record<AgeBand, string> = { u4: '4 or under', '5-6': '5 to 6', '7-8': '7 to 8', '9+': '9 or over' }

/** Pinged within this long counts as on the page. The page pings every 30 seconds; this is two and a bit. */
export const ACTIVE_MS = 75_000
/** A visit that has been silent this long is forgotten. */
export const LIVE_TTL_S = 15 * 60
/** A shared name not seen for this long is deleted. */
export const SHARED_TTL_S = 365 * 24 * 3600
/** Each heartbeat stands for about this much time with the page open and in use. */
export const HEARTBEAT_SECONDS = 30

export type Ping = {
  e: 'hb' | 'round' | 'forget'
  v: string                       // this page load, random
  g: PGame | 'home'
  id?: string                     // only when a parent shares: random, held by the browser
  name?: string
  age?: AgeBand
}

const ID = /^[A-Za-z0-9_-]{12,40}$/

/** A first name or nickname: letters, spaces and the marks names use. */
export function cleanSharedName(raw: unknown, max = 24): string {
  if (typeof raw !== 'string') return ''
  return raw.replace(/[^\p{L}\p{M}\s'’.-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** Whatever arrives is checked field by field; anything off and the whole ping is dropped. */
export function cleanPing(raw: unknown): Ping | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.e !== 'hb' && r.e !== 'round' && r.e !== 'forget') return null
  if (typeof r.v !== 'string' || !ID.test(r.v)) return null
  const g = r.g === 'home' || (PARENTING_GAMES as readonly string[]).includes(r.g as string) ? (r.g as Ping['g']) : null
  if (!g) return null
  if (r.e === 'round' && g === 'home') return null
  const ping: Ping = { e: r.e, v: r.v, g }
  if (typeof r.id === 'string' && ID.test(r.id)) {
    ping.id = r.id
    const name = cleanSharedName(r.name)
    if (name) ping.name = name
    if ((AGE_BANDS as readonly string[]).includes(r.age as string)) ping.age = r.age as AgeBand
  }
  if (r.e === 'forget' && !ping.id) return null
  return ping
}

/** The calendar day in India, as YYYY-MM-DD: the day the site's owner thinks in. */
export function istDay(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

let indexes: Promise<unknown> | null = null
function ensureIndexes(db: Db) {
  indexes ||= Promise.all([
    db.collection('parenting_live').createIndex({ seenAt: 1 }, { expireAfterSeconds: LIVE_TTL_S }),
    db.collection('parenting_shared').createIndex({ lastSeen: 1 }, { expireAfterSeconds: SHARED_TTL_S }),
  ]).catch(() => { indexes = null })
  return indexes
}

/** Takes one ping from the page and counts it. */
export async function recordPing(db: Db, ping: Ping, now = new Date()) {
  await ensureIndexes(db)
  const live = db.collection('parenting_live')
  const daily = db.collection('parenting_daily')
  const shared = db.collection<{ _id: string }>('parenting_shared')

  if (ping.e === 'forget') {
    if (ping.id) await shared.deleteOne({ _id: ping.id })
    return
  }

  const day = istDay(now)
  const playing = ping.g !== 'home'
  const inc: Record<string, number> = {}

  if (ping.e === 'hb') {
    const prev = await live.findOneAndUpdate(
      { _id: ping.v as any },
      { $set: { g: ping.g, seenAt: now }, $max: { played: playing ? 1 : 0 } },
      { upsert: true, returnDocument: 'before' },
    )
    if (!prev) inc.visits = 1                                      // the first ping of a page load
    if (playing && prev?.played !== 1) inc.played = 1              // the first time it was in a game
    if (playing) inc[`games.${ping.g}.hb`] = 1
    else inc.homeHb = 1
  } else {
    inc.rounds = 1
    inc[`games.${ping.g}.rounds`] = 1
  }
  await daily.updateOne({ _id: day as any }, { $inc: inc }, { upsert: true })

  // Only a parent who chose to share has an id at all.
  if (ping.id && ping.name) {
    const set: Record<string, unknown> = { name: ping.name, lastSeen: now }
    if (ping.age) set.age = ping.age
    const update: Record<string, unknown> = { $set: set, $setOnInsert: { firstSeen: now } }
    if (ping.e === 'round') update.$inc = { rounds: 1, [`games.${ping.g}`]: 1 }
    await shared.updateOne({ _id: ping.id }, update as any, { upsert: true })
  }
}
