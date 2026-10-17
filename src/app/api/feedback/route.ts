// src/app/api/feedback/route.ts
// A parent's feedback, from For parents → Feedback. See src/lib/feedback.ts for exactly what is kept.
//
// Unlike /api/ping this one does answer honestly, because a person is waiting to hear whether their message went:
// 200 sent, 400 something to fix (the page says what), 429 too many, 503 could not be kept just now. A script that
// fills in the hidden box is told 200 and nothing is kept.

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { FEEDBACK_PER_HOUR, checkFeedback, recordFeedback } from '@/lib/feedback'

export const dynamic = 'force-dynamic'

// In this server instance's memory, which is enough to stop a stray script. The address is never stored.
const WINDOW_MS = 3_600_000
const hits = new Map<string, { n: number; start: number }>()

function tooMany(ip: string, now: number) {
  const h = hits.get(ip)
  if (!h || now - h.start > WINDOW_MS) {
    if (hits.size > 5000) hits.clear()
    hits.set(ip, { n: 1, start: now })
    return false
  }
  return ++h.n > FEEDBACK_PER_HOUR
}

const reply = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/** A database that does not answer must not leave a parent waiting. */
const within = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, no) => setTimeout(() => no(new Error('timeout')), ms))])

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  if (tooMany(ip, Date.now())) return reply(429, { ok: false, reason: 'many' })

  let body: unknown
  try {
    const text = await req.text()
    if (text.length > 5000) return reply(400, { ok: false, reason: 'long' })
    body = JSON.parse(text)
  } catch {
    return reply(400, { ok: false, reason: 'invalid' })
  }

  const check = checkFeedback(body)
  if (!check.ok) {
    if (check.reason === 'spam') return reply(200, { ok: true })
    return reply(400, { ok: false, reason: check.reason })
  }

  try {
    await within(getDb().then(db => recordFeedback(db, check.feedback)), 8000)
  } catch {
    return reply(503, { ok: false, reason: 'unavailable' })
  }
  return reply(200, { ok: true })
}
