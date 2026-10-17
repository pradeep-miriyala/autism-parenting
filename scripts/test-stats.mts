// scripts/test-stats.mts
// Checks that what the Little Steps games report is cleaned before it is kept.
//
//     node scripts/test-stats.mts
//
// No database needed. (The dashboard's numbers are checked on the portfolio site, which reads them.)

import { AGE_BANDS, cleanPing, cleanSharedName, istDay } from '../src/lib/stats.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok) { failed++; console.error('FAIL', what) } }
const V1 = 'visit_AAAAAAAAAAAA', V2 = 'visit_BBBBBBBBBBBB', V3 = 'visit_CCCCCCCCCCCC', SHARE = 'share_AAAAAAAAAAAA'

// ── Validation: only well-formed pings get through ──
check(cleanPing(null) === null && cleanPing('x') === null && cleanPing([]) === null, 'junk is dropped')
check(cleanPing({ e: 'hb', v: 'short', g: 'spot' }) === null, 'a short visit id is dropped')
check(cleanPing({ e: 'hb', v: V1, g: 'chess' }) === null, 'an unknown game is dropped')
check(cleanPing({ e: 'round', v: V1, g: 'home' }) === null, 'a round on the tiles is dropped')
check(cleanPing({ e: 'forget', v: V1, g: 'home' }) === null, 'forget without an id is dropped')
check(cleanPing({ e: 'nope', v: V1, g: 'spot' }) === null, 'an unknown event is dropped')
check(cleanPing({ e: 'hb', v: V1, g: 'home' })?.g === 'home', 'a heartbeat on the tiles is fine')
const named = cleanPing({ e: 'hb', v: V1, g: 'spot', id: SHARE, name: '  Aarav<script>  ', age: '5-6', extra: 'x' })
check(named?.name === 'Aaravscript' && named.age === '5-6' && !('extra' in (named as object)), 'a name is cleaned and extras are dropped')
check(cleanPing({ e: 'hb', v: V1, g: 'spot', name: 'Aarav' })?.name === undefined, 'a name without an id is ignored')
check(cleanPing({ e: 'hb', v: V1, g: 'spot', id: SHARE, age: '12' })?.age === undefined, 'an unknown age band is ignored')
check(cleanSharedName('x'.repeat(80)).length === 24 && cleanSharedName(5) === '', 'names are capped')
check(AGE_BANDS.length === 4, 'age bands')

// ── Days are India's days ──
check(istDay(new Date('2026-10-07T20:00:00Z')) === '2026-10-08', '20:00 UTC is already tomorrow in India')
check(istDay(new Date('2026-10-07T18:29:00Z')) === '2026-10-07', '18:29 UTC is still today in India')

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('stats cleaning: all checks passed')
