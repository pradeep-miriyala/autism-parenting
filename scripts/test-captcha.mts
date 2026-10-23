// scripts/test-captcha.mts
// Checks the small sum on the feedback form: it is made only when there is a secret, the right answer passes once,
// a wrong, missing, old or tampered one never does, and every sum is small with a answer that is never negative.
//
//     node scripts/test-captcha.mts

import { CAPTCHA_TTL_MS, checkCaptcha, makeChallenge } from '../src/lib/captcha.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 25) console.error('FAIL', what) }
const solve = (q: string) => { const [a, op, b] = q.split(' '); return op === 'plus' ? +a + +b : +a - +b }

delete process.env.FEEDBACK_SECRET
delete process.env.MONGODB_URI
check(makeChallenge() === null, 'no secret, no sum')
check(!checkCaptcha({ token: 'x', answer: '1' }), 'no secret, nothing passes')

process.env.FEEDBACK_SECRET = 'a long random test secret'
const now = 1_700_000_000_000
for (let i = 0; i < 2000; i++) {
  const c = makeChallenge(now)!
  const a = solve(c.question)
  check(/^[2-9] (plus [1-8]|minus [1-8])$/.test(c.question), `shape ${c.question}`)
  check(a >= 0 && a <= 17, `answer in range ${c.question}`)
  check(checkCaptcha({ token: c.token, answer: String(a) }, now), `right answer passes ${c.question}`)
  check(checkCaptcha({ token: c.token, answer: a }, now), 'a number passes too')
  check(!checkCaptcha({ token: c.token, answer: String(a + 1) }, now), 'wrong answer fails')
}
const c = makeChallenge(now)!, a = solve(c.question)
check(!checkCaptcha({ token: c.token, answer: String(a) }, now + CAPTCHA_TTL_MS + 1), 'an old sum fails')
check(checkCaptcha({ token: c.token, answer: String(a) }, now + CAPTCHA_TTL_MS - 1), 'a sum just inside its time passes')
check(!checkCaptcha({ token: c.token, answer: String(a) }, now - 5000), 'a sum from the future fails')
check(!checkCaptcha({ token: c.token }), 'no answer fails')
check(!checkCaptcha({ answer: '3' }), 'no token fails')
check(!checkCaptcha(null) && !checkCaptcha('x') && !checkCaptcha(undefined), 'junk fails')
check(!checkCaptcha({ token: c.token, answer: '' }, now) && !checkCaptcha({ token: c.token, answer: 'abc' }, now), 'empty and letters fail')
check(!checkCaptcha({ token: c.token, answer: '-1' }, now), 'a minus sign fails')
const [exp, mac] = c.token.split('.')
check(!checkCaptcha({ token: `${+exp + 10_000}.${mac}`, answer: String(a) }, now), 'a stretched time fails')
check(!checkCaptcha({ token: `${exp}.${mac.slice(0, -2)}AA`, answer: String(a) }, now), 'a changed signature fails')
check(!checkCaptcha({ token: 'x'.repeat(500), answer: '1' }, now), 'a huge token fails')
process.env.FEEDBACK_SECRET = 'another secret'
check(!checkCaptcha({ token: c.token, answer: String(a) }, now), 'a sum from another secret fails')
delete process.env.FEEDBACK_SECRET
process.env.MONGODB_URI = 'mongodb://example'
const d = makeChallenge(now)!
check(checkCaptcha({ token: d.token, answer: String(solve(d.question)) }, now), 'MONGODB_URI is used when there is no secret')

if (failed) { console.error(`${failed} checks failed`); process.exit(1) }
console.log('captcha: all checks passed')
