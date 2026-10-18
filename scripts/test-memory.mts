// scripts/test-memory.mts
// Checks Memory pairs: every round has each picture exactly twice, a card is never turned in a way that breaks the
// rules, a pair that matches stays, one that does not turns back, a hint always points at a real card, and a player
// who remembers everything finishes while one who guesses still does.
//
//     node scripts/test-memory.mts

import { readFileSync } from 'node:fs'
import { MEMORY_LEVELS, flip, makeMemoryRound, memoryDone, memoryHint, memoryLevel, startState, turnBack, type MemCard } from '../src/games/memory/logic.ts'
import { THINGS } from '../src/games/thinking/rounds.ts'
import { seeded } from '../src/games/spot/generate.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 25) console.error('FAIL', what) }
const art = readFileSync(new URL('../src/games/spot/art.tsx', import.meta.url), 'utf8')
const things: MemCard[] = THINGS.map(t => ({ kind: t.kind, colour: t.colour, word: t.word }))
const SEEDS = 400

check(Object.values(MEMORY_LEVELS).map(l => l.pairs * 2).join() === '6,12,16', 'six, twelve and sixteen cards')
check(Object.values(MEMORY_LEVELS).every(l => (l.pairs * 2) % l.cols === 0), 'every grid is full: no card on its own in the last row')
check(memoryLevel(0).pairs === 3 && memoryLevel(9).pairs === 8 && memoryLevel(1.6).pairs === 6, 'a level outside 1 to 3 is held to the nearest')
check(things.length >= 8, 'enough different pictures for the biggest round')

// ── The rounds ──
for (let level = 1; level <= 3; level++) {
  const { pairs, cols } = memoryLevel(level)
  for (let s = 1; s <= SEEDS; s++) {
    const r = makeMemoryRound(level, things, seeded(s * 7 + level)), tag = `level ${level} seed ${s}`
    const count = new Map<string, number>()
    r.cards.forEach(c => count.set(c.kind, (count.get(c.kind) || 0) + 1))
    check(r.cols === cols && r.cards.length === pairs * 2, `${tag}: ${r.cards.length} cards`)
    check(count.size === pairs && [...count.values()].every(n => n === 2), `${tag}: every picture exactly twice`)
    check(r.cards.every(c => art.includes(`'${c.kind}':`) && c.word.length > 1), `${tag}: every picture exists and has a word`)
    check(r.cards.every((c, i) => i === 0 || c.kind !== r.cards[i - 1].kind), `${tag}: two of a kind never sit side by side in the list`)
  }
}
const a = makeMemoryRound(3, things, seeded(1)).cards.map(c => c.kind).join(), b = makeMemoryRound(3, things, seeded(2)).cards.map(c => c.kind).join()
check(a !== b, 'two rounds are laid out differently')

// ── Turning cards ──
{
  const cards: MemCard[] = ['a', 'b', 'a', 'b'].map(k => ({ kind: k, colour: 'y', word: k }))
  let s = startState()
  check(flip(cards, s, 9).event === 'ignore' && flip(cards, s, -1).event === 'ignore' && flip(cards, s, 1.5).event === 'ignore', 'a card that does not exist is ignored')
  let r = flip(cards, s, 0); s = r.state
  check(r.event === 'first' && s.up.join() === '0' && s.seen.join() === '0', 'the first card turns over')
  check(flip(cards, s, 0).event === 'ignore', 'the same card again is ignored')
  r = flip(cards, s, 1); s = r.state
  check(r.event === 'miss' && s.up.join() === '0,1' && s.matched.length === 0, 'two that differ: a miss, both stay up for a moment')
  check(flip(cards, s, 2).event === 'ignore', 'while two are up, a third is ignored')
  s = turnBack(s)
  check(s.up.length === 0 && s.seen.join() === '0,1', 'they turn back, and the child has seen them')
  check(turnBack(s) === s, 'turning back when nothing is up changes nothing')
  s = flip(cards, s, 0).state
  r = flip(cards, s, 2); s = r.state
  check(r.event === 'match' && s.matched.join() === '0,2' && s.up.length === 0, 'two that match stay face up')
  check(flip(cards, s, 0).event === 'ignore' && flip(cards, s, 2).event === 'ignore', 'a matched card is ignored')
  check(!memoryDone(cards, s), 'not done yet')
  s = flip(cards, flip(cards, s, 1).state, 3).state
  check(memoryDone(cards, s) && s.matched.length === 4, 'all matched: done')
  check(!memoryDone([], startState()), 'no cards is not "done"')
  check(JSON.stringify(startState()) === '{"up":[],"matched":[],"seen":[]}', 'a fresh state is empty')
}

// ── Hints ──
{
  const cards: MemCard[] = ['a', 'b', 'a', 'b'].map(k => ({ kind: k, colour: 'y', word: k }))
  check(memoryHint(cards, startState()) === 0, 'at the start: point at a card')
  let s = flip(cards, startState(), 0).state
  check(memoryHint(cards, s) === 2, 'one card up: point at its mate')
  s = flip(cards, s, 1).state
  check(memoryHint(cards, s) === null, 'two up: nothing to point at')
  s = turnBack(s)
  check(memoryHint(cards, s) === 2 || memoryHint(cards, s) === 3, 'nothing up: a card not seen yet')
  s = flip(cards, flip(cards, flip(cards, s, 0).state, 2).state, 1).state   // match a, then b is up
  check(memoryHint(cards, s) === 3, 'b is up: its mate')
  s = flip(cards, s, 3).state
  check(memoryHint(cards, s) === null, 'done: no hint')
  // both cards of a pair seen, nothing up: point at that pair
  const c2: MemCard[] = ['a', 'b', 'c', 'a', 'b', 'c'].map(k => ({ kind: k, colour: 'y', word: k }))
  let t = turnBack(flip(c2, flip(c2, startState(), 0).state, 1).state)       // saw a and b
  t = turnBack(flip(c2, flip(c2, t, 4).state, 2).state)                      // saw b (second) and c
  const h = memoryHint(c2, t)
  check(h === 1 || h === 4, `a pair whose cards were both seen is pointed at (${h})`)
}

// ── Whole games ──
function play(cards: MemCard[], rand: () => number, remembers: boolean) {
  let s = startState(), flips = 0, guard = 0
  while (!memoryDone(cards, s) && guard++ < 2000) {
    const free = cards.map((_, i) => i).filter(i => !s.matched.includes(i))
    let first: number
    const known = remembers ? free.filter(i => s.seen.includes(i) && free.some(j => j !== i && s.seen.includes(j) && cards[j].kind === cards[i].kind)) : []
    first = known.length ? known[0] : free.filter(i => !s.seen.includes(i))[0] ?? free[0]
    let r = flip(cards, s, first); s = r.state; flips++
    check(r.event === 'first', 'a first flip')
    const mate = remembers ? free.find(j => j !== first && s.seen.includes(j) && cards[j].kind === cards[first].kind) : undefined
    const pool = free.filter(j => j !== first)
    const unseen = pool.filter(j => !s.seen.includes(j))
    const second = mate ?? (remembers && unseen.length ? unseen[Math.floor(rand() * unseen.length)] : pool[Math.floor(rand() * pool.length)])
    r = flip(cards, s, second); s = r.state; flips++
    check(r.event === 'match' || r.event === 'miss', 'a second flip is a match or a miss')
    if (r.event === 'miss') s = turnBack(s)
    check(s.up.length === 0 && s.matched.length % 2 === 0 && new Set(s.matched).size === s.matched.length, 'state stays sound')
    const h = memoryHint(cards, s)
    check(memoryDone(cards, s) ? h === null : h !== null && h >= 0 && h < cards.length && !s.matched.includes(h), 'a hint points at a card still in play')
  }
  return { done: memoryDone(cards, s), flips }
}
let guessTotal = 0, rememberTotal = 0
for (let level = 1; level <= 3; level++) {
  for (let seed = 1; seed <= 120; seed++) {
    const { cards } = makeMemoryRound(level, things, seeded(seed * 3 + level))
    const g = play(cards, seeded(seed), false), m = play(cards, seeded(seed), true)
    check(g.done && m.done, `level ${level} seed ${seed}: the game can be finished`)
    check(m.flips <= cards.length * 2 + 2, `level ${level} seed ${seed}: someone who remembers needs ${m.flips} flips`)
    guessTotal += g.flips; rememberTotal += m.flips
  }
}
check(rememberTotal < guessTotal, 'remembering helps, so the game is about memory and not luck')

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('memory: all checks passed')
