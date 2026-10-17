// scripts/test-progress.mts
// Checks the progress record: rounds counted per day and game, stickers earned without repeats,
// the weekly summary, and that a damaged saved entry cannot break anything.
//
//     node scripts/test-progress.mts

import { EMPTY_PROGRESS, STICKERS, cleanProgress, dayKey, recordRound, summarise, type Progress } from '../src/games/progress.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok) { failed++; console.error('FAIL', what) } }

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 15, 30)

// Counting, and a sticker for each finished round.
let p: Progress = EMPTY_PROGRESS
let r = recordRound(p, 'numbers', day(2026, 10, 7), () => 0)
check(r.sticker === 0 && r.progress.stickers.length === 1, 'first round earns a sticker')
check(p.stickers.length === 0 && Object.keys(p.days).length === 0, 'the old record is not changed')
p = r.progress
p = recordRound(p, 'numbers', day(2026, 10, 7), () => 0).progress
p = recordRound(p, 'trace', day(2026, 10, 7), () => 0.999).progress
check(p.days['2026-10-07'].numbers === 2 && p.days['2026-10-07'].trace === 1, 'counts per game')
check(new Set(p.stickers).size === p.stickers.length, 'no sticker twice')

// The whole album fills exactly once, then rounds still count.
let q: Progress = EMPTY_PROGRESS
for (let i = 0; i < STICKERS.length + 5; i++) q = recordRound(q, 'spot', day(2026, 10, 7), Math.random).progress
check(q.stickers.length === STICKERS.length && new Set(q.stickers).size === STICKERS.length, 'album fills once')
check(q.days['2026-10-07'].spot === STICKERS.length + 5, 'rounds still count after the album is full')
check(recordRound(q, 'spot', day(2026, 10, 7), Math.random).sticker === null, 'no sticker when the album is full')

// Summary: today, the last seven days, the older rounds only in the total.
let s: Progress = EMPTY_PROGRESS
s = recordRound(s, 'letters', day(2026, 9, 20), () => 0).progress
s = recordRound(s, 'spelling', day(2026, 10, 1), () => 0).progress   // 6 days before: in the week
s = recordRound(s, 'spelling', day(2026, 9, 30), () => 0).progress   // 7 days before: out
s = recordRound(s, 'numbers', day(2026, 10, 7), () => 0).progress
const sm = summarise(s, day(2026, 10, 7))
check(sm.today === 1, 'today')
check(sm.week === 2 && sm.byGame.spelling === 1 && sm.byGame.numbers === 1 && !sm.byGame.letters, 'the week')
check(sm.total === 4 && sm.stickers === 4, 'total and stickers')
check(sm.daily.length === 7 && sm.daily[6].key === '2026-10-07' && sm.daily[0].key === '2026-10-01', 'seven days, oldest first')
check(summarise(EMPTY_PROGRESS, new Date()).week === 0, 'empty summary')

// Month and year ends, and the day key is local.
check(dayKey(new Date(2026, 0, 5, 23, 59)) === '2026-01-05', 'day key is zero-padded and local')
const edge = summarise(recordRound(EMPTY_PROGRESS, 'trace', day(2026, 12, 30), () => 0).progress, day(2027, 1, 2))
check(edge.week === 1 && edge.daily[3].key === '2026-12-30', 'across the new year')

// Old days are dropped, not kept for ever.
const old = recordRound(recordRound(EMPTY_PROGRESS, 'trace', day(2026, 1, 1), () => 0).progress, 'trace', day(2026, 10, 7), () => 0).progress
check(!('2026-01-01' in old.days), 'days older than the keep window are dropped')

// Damaged entries.
const bad = cleanProgress({ days: { 'x': { numbers: 3 }, '2026-10-07': { numbers: -2, trace: 2.5, spot: 4, other: 9 }, '2026-10-08': 5 }, stickers: [0, 0, 1, 99, -1, 'a', 2.5] })
check(Object.keys(bad.days).join() === '2026-10-07' && bad.days['2026-10-07'].spot === 4 && Object.keys(bad.days['2026-10-07']).length === 1, 'bad days dropped')
check(bad.stickers.join() === '0,1', 'bad stickers dropped')
for (const junk of [null, undefined, 5, 'x', [], { days: 3, stickers: 'no' }]) {
  const c = cleanProgress(junk)
  check(Object.keys(c.days).length === 0 && c.stickers.length === 0, 'junk gives an empty record')
}

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('progress: all checks passed')
