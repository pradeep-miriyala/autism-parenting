// scripts/test-home.mts
// Checks the front screen's panels: which are closed is read back safely from saved settings, and opening and closing
// one never disturbs the others.
//
//     node scripts/test-home.mts

import { cleanClosed, toggleClosed } from '../src/games/homePanels.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 20) console.error('FAIL', what) }
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const K = ['numbers', 'thinking', 'letters', 'life']

// ── Reading what was saved ──
check(same(cleanClosed(['thinking', 'life'], K), ['thinking', 'life']), 'saved closed panels are kept')
check(same(cleanClosed(['life', 'numbers'], K), ['numbers', 'life']), 'and put in the order the screen shows them')
for (const raw of [undefined, null, 'thinking', 5, {}, true, { 0: 'thinking' }]) check(same(cleanClosed(raw, K), []), `${JSON.stringify(raw)} means nothing is closed`)
check(same(cleanClosed(['thinking', 'thinking', 'thinking'], K), ['thinking']), 'a panel listed twice counts once')
check(same(cleanClosed(['nonsense', 7, null, 'life', {}, ['thinking']], K), ['life']), 'unknown groups and wrong kinds are dropped')
check(same(cleanClosed(['__proto__', 'constructor', 'toString'], K), []), 'odd names do nothing')
check(same(cleanClosed(['thinking'], []), []), 'with no groups, nothing is closed')
check(same(cleanClosed(['sensory'], K), []), 'a group that no longer exists is forgotten')
// a group added later starts open, because only the closed ones are saved
check(!cleanClosed(['thinking'], [...K, 'music']).includes('music'), 'a new group starts open')

// ── Opening and closing ──
check(same(toggleClosed([], 'thinking', K), ['thinking']), 'an open panel closes')
check(same(toggleClosed(['thinking'], 'thinking', K), []), 'a closed panel opens')
check(same(toggleClosed(['thinking'], 'life', K), ['thinking', 'life']), 'closing one leaves the other closed one alone')
check(same(toggleClosed(['numbers', 'life'], 'numbers', K), ['life']), 'opening one leaves the other closed one alone')
check(same(toggleClosed(['life'], 'numbers', K), ['numbers', 'life']), 'the order stays the screen\'s order')
check(same(toggleClosed(['life'], 'nonsense', K), ['life']), 'a group that does not exist changes nothing')
const input = ['thinking']; toggleClosed(input, 'life', K)
check(same(input, ['thinking']), 'the list it was given is not changed')
let list: string[] = []
for (let i = 0; i < 200; i++) list = toggleClosed(list, K[i % 4], K)
check(same(list, []) , 'toggling each panel the same number of times returns to all open')
for (let i = 0; i < 4; i++) list = toggleClosed(list, K[i], K)
check(same(list, K) && same(toggleClosed(list, 'numbers', K), K.slice(1)), 'every panel can be closed at once')

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('home: all checks passed')
