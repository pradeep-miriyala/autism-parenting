// scripts/test-feedback.mts
// Checks what a parent's feedback is allowed to be before it is kept: only a known kind, a message of a sensible
// length with nothing hidden in it, an email only if it looks like one, and nothing that a script fills in. Then
// checks what is kept: those fields and the time, and nothing else, with a year's life.
//
//     node scripts/test-feedback.mts

import {
  FEEDBACK_KINDS, FEEDBACK_LABELS, FEEDBACK_PER_HOUR, FEEDBACK_TTL_S, MAX_CONTACT, MAX_MESSAGE, MIN_MESSAGE,
  checkFeedback, cleanMessage, recordFeedback,
} from '../src/lib/feedback.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 25) console.error('FAIL', what) }
const good = { kind: 'idea', message: 'Please add a game about shapes. My son would love it.' }
const ok = (raw: unknown) => { const c = checkFeedback(raw); return c.ok ? c.feedback : null }
const why = (raw: unknown) => { const c = checkFeedback(raw); return c.ok ? 'ok' : c.reason }

// ── The limits ──
check(FEEDBACK_KINDS.length === 4 && FEEDBACK_KINDS.every(k => FEEDBACK_LABELS[k].length > 3), 'four kinds, each with a label')
check(MIN_MESSAGE === 5 && MAX_MESSAGE === 1000 && MAX_CONTACT === 120 && FEEDBACK_PER_HOUR === 5, 'the limits')
check(FEEDBACK_TTL_S === 365 * 24 * 3600, 'kept for a year')

// ── What is accepted ──
check(JSON.stringify(ok(good)) === JSON.stringify(good), 'a good message passes unchanged')
for (const kind of FEEDBACK_KINDS) check(ok({ ...good, kind })?.kind === kind, `kind ${kind}`)
check(ok({ ...good, contact: 'parent@example.com' })?.contact === 'parent@example.com', 'an email is kept')
check(ok({ ...good, contact: '  parent@example.com  ' })?.contact === 'parent@example.com', 'an email is trimmed')
check(!('contact' in ok({ ...good, contact: '' })!) && !('contact' in ok({ ...good, contact: '   ' })!) && !('contact' in ok({ ...good })!), 'no email: no contact field')
check(ok({ ...good, contact: null }) !== null && ok({ ...good, site: '' }) !== null && ok({ ...good, site: '  ' }) !== null, 'empty optional fields are fine')
check(ok({ ...good, message: 'x'.repeat(MAX_MESSAGE) }) !== null, `${MAX_MESSAGE} letters is allowed`)
check(ok({ ...good, message: 'Is this ok?\n\nYes, it is.' })!.message === 'Is this ok?\n\nYes, it is.', 'paragraphs are kept')
check(ok({ ...good, message: 'Great, see https://a.example and https://b.example' }) !== null, 'two links are fine')
check(ok({ ...good, message: 'हमें यह ऐप बहुत पसंद है, धन्यवाद' }) !== null, 'other languages are fine')

// ── What is not ──
for (const raw of [null, undefined, 'text', 42, [], [good]]) check(why(raw) === 'invalid', `${JSON.stringify(raw)} is not a message`)
check(why({ ...good, kind: 'rant' }) === 'invalid' && why({ message: good.message }) === 'invalid' && why({ ...good, kind: 7 }) === 'invalid', 'an unknown kind')
check(why({ kind: 'idea' }) === 'invalid' && why({ ...good, message: 123 }) === 'invalid' && why({ ...good, message: ['a'] }) === 'invalid', 'no message, or not text')
check(why({ ...good, message: 'Hi' }) === 'short' && why({ ...good, message: '     ' }) === 'short' && why({ ...good, message: 'a'.repeat(MIN_MESSAGE - 1) }) === 'short', 'too short')
check(why({ ...good, message: 'a'.repeat(MIN_MESSAGE) }) === 'ok', 'the shortest allowed')
check(why({ ...good, message: 'x'.repeat(MAX_MESSAGE + 1) }) === 'long', 'too long')
check(why({ ...good, message: ' '.repeat(2000) + 'a good message here' }) === 'ok', 'blank space does not count towards the length')
for (const contact of ['not an email', 'a@b', '@example.com', 'a b@example.com', 'a@@example.com', 'x@y.z, other@y.z', '<a@b.co>', 'a'.repeat(MAX_CONTACT) + '@example.com']) check(why({ ...good, contact }) === 'contact', `"${contact.slice(0, 30)}" is not an email`)
check(why({ ...good, contact: 5 }) === 'invalid' && why({ ...good, contact: ['a@b.co'] }) === 'invalid', 'an email that is not text')

// ── Scripts ──
check(why({ ...good, site: 'http://spam.example' }) === 'spam' && why({ ...good, site: 'x' }) === 'spam', 'the hidden box filled in is spam')
check(why({ kind: 'idea', message: 'Buy now http://a.example http://b.example https://c.example and www.d.example' }) === 'spam', 'a message full of links is spam')
check(why({ ...good, site: 'x', message: 'hi' }) === 'spam', 'the hidden box is checked first')

// ── Cleaning ──
check(cleanMessage('a\u0000b​c‮d﻿') === 'abcd', 'hidden and control characters are dropped')
check(cleanMessage('  too   many    spaces\t\there  ') === 'too many spaces here', 'spaces and tabs are collapsed')
check(cleanMessage('a\r\nb\rc') === 'a\nb\nc', 'line endings are made alike')
check(cleanMessage('a\n\n\n\n\nb') === 'a\n\nb', 'no more than one blank line')
check(cleanMessage('a \n b') === 'a\nb', 'no spaces round a line break')
check(cleanMessage('<b>hi</b> & "you"') === '<b>hi</b> & "you"', 'letters are kept as written (they are never shown as HTML)')
check(cleanMessage(cleanMessage('  a \r\n\r\n\r\n\r\n b  ')) === cleanMessage('  a \r\n\r\n\r\n\r\n b  '), 'cleaning twice changes nothing')

// ── What is kept ──
type Doc = Record<string, unknown>
const made: { name: string; spec: unknown; opts: unknown }[] = []
const saved: Doc[] = []
let indexCalls = 0
const fakeDb = {
  collection: (name: string) => ({
    createIndex: async (spec: unknown, opts: unknown) => { indexCalls++; made.push({ name, spec, opts }) },
    insertOne: async (doc: Doc) => { saved.push({ ...doc, _into: name }) },
  }),
} as any
const when = new Date('2026-03-04T05:06:07Z')
await recordFeedback(fakeDb, ok({ ...good, contact: 'parent@example.com' })!, when)
await recordFeedback(fakeDb, ok(good)!, when)
check(saved.length === 2 && saved.every(d => d._into === 'parenting_feedback'), 'kept in parenting_feedback')
check(JSON.stringify(Object.keys(saved[0]).sort()) === JSON.stringify(['_into', 'at', 'contact', 'kind', 'message']), `a message with an email keeps only: ${Object.keys(saved[0])}`)
check(JSON.stringify(Object.keys(saved[1]).sort()) === JSON.stringify(['_into', 'at', 'kind', 'message']), `a message without one keeps only: ${Object.keys(saved[1])}`)
check((saved[0].at as Date).getTime() === when.getTime(), 'the time it was sent')
check(indexCalls === 1 && made[0].name === 'parenting_feedback' && JSON.stringify(made[0].spec) === '{"at":1}' && (made[0].opts as any).expireAfterSeconds === FEEDBACK_TTL_S, 'one index, which deletes a message after a year')
// the stored record has no field a person could be found by
const names = new Set(saved.flatMap(d => Object.keys(d)))
for (const bad of ['ip', 'userAgent', 'ua', 'headers', 'name', 'child', 'id', 'session']) check(!names.has(bad), `nothing called ${bad} is kept`)

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('feedback: all checks passed')
