// src/app/api/ping/route.ts
// The Little Steps games report in here: a heartbeat while someone is playing, a note when a round
// is finished, and a request to forget a shared name. Counts only; see src/lib/parentingStats.ts for
// exactly what is kept and why it holds nothing about a person.
//
// Public and forgiving on purpose. It is called from a child's game, so it never answers with an
// error the page could react to: a bad ping is simply dropped and the answer is always the same.

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { cleanPing, recordPing } from '@/lib/stats'

export const dynamic = 'force-dynamic'

// A page pings twice a minute. This allows well over that from one address (a school or a house
// full of tablets shares one), and stops a script from filling the counters. It lives in this
// server instance's memory, which is enough for a stray script; the address is never stored.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 120
const hits = new Map<string, { n: number; start: number }>()

function tooMany(ip: string, now: number) {
  const h = hits.get(ip)
  if (!h || now - h.start > WINDOW_MS) {
    if (hits.size > 5000) hits.clear()
    hits.set(ip, { n: 1, start: now })
    return false
  }
  return ++h.n > MAX_PER_WINDOW
}

const done = () => new NextResponse(null, { status: 204 })

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    if (tooMany(ip, Date.now())) return done()
    const text = await req.text()
    if (text.length > 1000) return done()
    const ping = cleanPing(JSON.parse(text))
    if (ping) await recordPing(await getDb(), ping)
  } catch {
    // Dropped. Nothing about a child's game should ever fail because of this.
  }
  return done()
}
