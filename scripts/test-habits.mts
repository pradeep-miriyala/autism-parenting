// scripts/test-habits.mts
// Checks the Helpful Habits cards and rounds.
//
//     node scripts/test-habits.mts
//
// The wording is part of what is tested: a card that says "bad" or "naughty", or a phrase that does not
// make a sentence either way, fails. A parent can add cards; this keeps them gentle and well formed.

import { HABITS, HABIT_ROUND, makeHabitRound, sentence } from '../src/games/habits/data.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 20) console.error('FAIL', what) }

function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── The cards ──
check(new Set(HABITS.map(h => h.id)).size === HABITS.length, 'card ids are unique')
check(new Set(HABITS.map(h => h.text)).size === HABITS.length, 'card texts are unique')
check(HABITS.filter(h => h.helps).length >= 12 && HABITS.filter(h => !h.helps).length >= 12, 'at least twelve of each kind')
const harsh = /\b(bad|naughty|wrong|stupid|dumb|silly|lazy|horrible|nasty|dirty|greedy|selfish|disgusting|punish)\b/i
const autism = /\b(stim|flap|meltdown|tantrum|rock(ing)?|spin(ning)?|cover(ing)? (my )?ears|noise|loud noises|sensory|autis)/i
for (const h of HABITS) {
  check(h.text.length >= 8 && h.text.length <= 42, `${h.id}: text length`)
  check(h.text === h.text.toLowerCase().replace(/\bi\b/g, 'I') || /^[a-z]/.test(h.text), `${h.id}: starts lower case so it can start a sentence`)
  check(!harsh.test(h.text), `${h.id}: harsh word in "${h.text}"`)
  check(!autism.test(h.text), `${h.id}: a way of coping is not a habit that does not help: "${h.text}"`)
  check(!/\bnot\b/.test(h.text), `${h.id}: "${h.text}" is a negative that would read as a double negative`)
  check(h.emoji.length > 0, `${h.id}: a picture`)
  const s = sentence(h)
  check(/^[A-Z].* (helps me|does not help me)\.$/.test(s) && s.endsWith(h.helps ? ' helps me.' : ' does not help me.'), `${h.id}: sentence "${s}"`)
}

// ── Rounds ──
for (let n = HABIT_ROUND.minLen; n <= HABIT_ROUND.maxLen; n++) {
  let nYes = 0
  for (let seed = 1; seed <= 1500; seed++) {
    const r = makeHabitRound(n, seeded(seed * 7919 + n))
    const tag = `round of ${n}, seed ${seed}`
    check(r.length === n, `${tag}: wrong length ${r.length}`)
    check(new Set(r.map(h => h.id)).size === n, `${tag}: a card twice`)
    const yes = r.filter(h => h.helps).length
    check(Math.abs(yes - (n - yes)) <= 1, `${tag}: not balanced (${yes} of ${n} help)`)
    check(!r.some((h, i) => i >= 2 && r[i - 1].helps === h.helps && r[i - 2].helps === h.helps) || n < 5, `${tag}: the same answer three times in a row`)
    nYes += yes
  }
  if (n % 2) check(Math.abs(nYes / 1500 - n / 2) < 0.12, `odd rounds of ${n} lean both ways about equally (${(nYes / 1500).toFixed(2)})`)
}
check(makeHabitRound(1).length === HABIT_ROUND.minLen && makeHabitRound(99).length === HABIT_ROUND.maxLen, 'sizes are clamped')
// Every card turns up.
const seen = new Set<string>()
for (let i = 0; i < 300; i++) for (const h of makeHabitRound(10, seeded(i + 3))) seen.add(h.id)
check(seen.size === HABITS.length, `every card is used (saw ${seen.size} of ${HABITS.length})`)

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log(`habits: ${HABITS.length} cards, all checks passed`)
