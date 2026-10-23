// src/lib/captcha.ts
// A small sum for the feedback form, to keep simple scripts out. It is stateless: the server sends a sum and a token,
// and the token is a signed expiry time that also commits to the answer, so nothing is stored and nothing about the
// person is kept. A script can still read the sum, so this is a speed bump and not a wall; the hourly limit and the
// checks in feedback.ts stay in place.
//
// The signing secret is FEEDBACK_SECRET, or else MONGODB_URI (always set where feedback works). Server only.

import { createHmac, timingSafeEqual } from 'node:crypto'

/** A sum stays valid this long, long enough to write a message. */
export const CAPTCHA_TTL_MS = 30 * 60_000

export type Challenge = { question: string; token: string }

const secret = () => process.env.FEEDBACK_SECRET || process.env.MONGODB_URI || ''
const sign = (exp: number, answer: number, key: string) => createHmac('sha256', key).update(`${exp}:${answer}`).digest('base64url')

/** "7 plus 4" or "9 minus 3". Answers are never negative, and the numbers stay small. */
export function makeChallenge(now = Date.now(), pick: () => number = Math.random): Challenge | null {
  const key = secret()
  if (!key) return null
  const a = 2 + Math.floor(pick() * 8)   // 2..9
  const b = 1 + Math.floor(pick() * 8)   // 1..8
  const plus = pick() < 0.5 || a <= b
  const answer = plus ? a + b : a - b
  const exp = now + CAPTCHA_TTL_MS
  return { question: plus ? `${a} plus ${b}` : `${a} minus ${b}`, token: `${exp}.${sign(exp, answer, key)}` }
}

/** True only for the right answer, to a sum made here, that has not run out. */
export function checkCaptcha(raw: unknown, now = Date.now()): boolean {
  const key = secret()
  if (!key || !raw || typeof raw !== 'object') return false
  const { token, answer } = raw as { token?: unknown; answer?: unknown }
  if (typeof token !== 'string' || token.length > 100) return false
  const n = typeof answer === 'number' ? answer : typeof answer === 'string' && /^\s*\d{1,3}\s*$/.test(answer) ? Number(answer) : NaN
  if (!Number.isInteger(n)) return false
  const [expText, mac] = token.split('.')
  const exp = Number(expText)
  if (!Number.isFinite(exp) || !mac || exp < now || exp > now + CAPTCHA_TTL_MS + 1000) return false
  const want = Buffer.from(sign(exp, n, key)), got = Buffer.from(mac)
  return want.length === got.length && timingSafeEqual(want, got)
}
