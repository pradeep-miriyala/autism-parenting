// scripts/test-voice.mts
// Checks which recorded message is picked: always one that exists, random, and never the same one twice in a row.
//
//     node scripts/test-voice.mts

import { MAX_SECONDS, MIN_MS, SLOTS, pickSlot } from '../src/games/voice/pick.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 20) console.error('FAIL', what) }

check(pickSlot([], null) === null && pickSlot([], 1) === null, 'nothing recorded: nothing to pick')
check(pickSlot([2], null) === 2 && pickSlot([2], 2) === 2, 'one recording: always that one, even twice')
for (const set of [[0, 1], [0, 2], [1, 2], [0, 1, 2]]) {
  let last: number | null = null
  const count = new Map<number, number>()
  for (let i = 0; i < 3000; i++) {
    const s = pickSlot(set, last)!
    check(set.includes(s), `${set}: picked ${s}, which is not recorded`)
    check(s !== last, `${set}: ${s} twice in a row`)
    count.set(s, (count.get(s) || 0) + 1)
    last = s
  }
  for (const s of set) check((count.get(s) || 0) > 3000 / set.length * 0.7, `${set}: ${s} is picked too rarely`)
}
// A previous pick that is no longer recorded does not matter.
check([0, 1, 2].includes(pickSlot([0, 1], 2)!), 'a last pick that was deleted')
check(SLOTS === 3 && MAX_SECONDS === 8 && MIN_MS === 600, 'the limits')

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('voice: all checks passed')
