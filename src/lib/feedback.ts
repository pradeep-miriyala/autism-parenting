// src/lib/feedback.ts
// What a parent can send from For parents → Feedback, and how it is kept. Unlike the counts in stats.ts this is
// words a person chose to write, so the rules are strict:
//   * It is sent only when the parent presses Send. Nothing is collected in the background.
//   * Only the message, what kind it is and, if the parent adds one, an email address to reply to. No IP address,
//     no user agent, no cookie, no child's details, and nothing that links it to the counts.
//   * It is kept for a year (a TTL index removes it), and the page says so.
//   * Whatever arrives is checked field by field here. Anything off is dropped.
//
// Takes the Db as an argument, and imports only types from mongodb, so scripts/test-feedback.mts can check all of
// it without a database. The portfolio admin reads the `parenting_feedback` collection (see README).

import type { Db } from 'mongodb'

export const FEEDBACK_KINDS = ['like', 'idea', 'problem', 'other'] as const
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]
export const FEEDBACK_LABELS: Record<FeedbackKind, string> = {
  like: 'Something I like',
  idea: 'An idea',
  problem: 'Something is not working',
  other: 'Something else',
}

export const MIN_MESSAGE = 5
export const MAX_MESSAGE = 1000
export const MAX_CONTACT = 120
/** A message is deleted this long after it was sent. */
export const FEEDBACK_TTL_S = 365 * 24 * 3600
/** One address may send this many messages an hour. Enough for a family on one network, not enough for a script. */
export const FEEDBACK_PER_HOUR = 5

export type Feedback = { kind: FeedbackKind; message: string; contact?: string }

/**
 * `spam` is answered as if it worked (so a script learns nothing) but nothing is kept. The others are for a real
 * person to fix: the page says what to change.
 */
export type FeedbackCheck =
  | { ok: true; feedback: Feedback }
  | { ok: false; reason: 'invalid' | 'short' | 'long' | 'contact' | 'spam' }

/** Control and invisible direction characters, which have no place in a message and can disguise text. */
const HIDDEN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩﻿]/g

/** Plain text with paragraphs: one space between words, no more than one blank line in a row. */
export function cleanMessage(raw: string): string {
  return raw
    .replace(HIDDEN, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const EMAIL = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/
const LINK = /https?:\/\/|www\./gi

export function checkFeedback(raw: unknown): FeedbackCheck {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, reason: 'invalid' }
  const r = raw as Record<string, unknown>
  // A box no person can see: only a script fills it in.
  if (typeof r.site === 'string' && r.site.trim() !== '') return { ok: false, reason: 'spam' }
  if (!(FEEDBACK_KINDS as readonly string[]).includes(r.kind as string)) return { ok: false, reason: 'invalid' }
  if (typeof r.message !== 'string') return { ok: false, reason: 'invalid' }
  const message = cleanMessage(r.message)
  if (message.length < MIN_MESSAGE) return { ok: false, reason: 'short' }
  if (message.length > MAX_MESSAGE) return { ok: false, reason: 'long' }
  if ((message.match(LINK) || []).length > 2) return { ok: false, reason: 'spam' }

  const feedback: Feedback = { kind: r.kind as FeedbackKind, message }
  if (r.contact !== undefined && r.contact !== null && r.contact !== '') {
    if (typeof r.contact !== 'string') return { ok: false, reason: 'invalid' }
    const contact = r.contact.replace(HIDDEN, '').trim()
    if (contact) {
      if (contact.length > MAX_CONTACT || !EMAIL.test(contact)) return { ok: false, reason: 'contact' }
      feedback.contact = contact
    }
  }
  return { ok: true, feedback }
}

let indexes: Promise<unknown> | null = null
function ensureIndexes(db: Db) {
  indexes ||= db.collection('parenting_feedback')
    .createIndex({ at: 1 }, { expireAfterSeconds: FEEDBACK_TTL_S })
    .catch(() => { indexes = null })
  return indexes
}

/** Keeps one message. */
export async function recordFeedback(db: Db, feedback: Feedback, now = new Date()) {
  await ensureIndexes(db)
  await db.collection('parenting_feedback').insertOne({ ...feedback, at: now })
}
