// scripts/test-stats.mts
// Checks what the Little Steps games report and what the dashboard reads back.
//
//     node --env-file=.env.local scripts/test-stats.mts
//
// Runs against a THROWAWAY database on the same cluster (named below, dropped at the end), never
// the site's own data. The privacy promises are tested here too: the anonymous records must hold no
// name, and a shared name must be removable.

import { MongoClient } from 'mongodb'
import {
  AGE_BANDS, ACTIVE_MS, cleanPing, cleanSharedName, deleteShared, istDay, loadDashboard, recordPing, summariseDaily,
} from '../src/lib/stats.ts'

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

// ── Summary: zero-filled, today last ──
const s = summariseDaily([{ _id: '2026-10-08', visits: 3, played: 2, rounds: 5, homeHb: 2, games: { spot: { hb: 4, rounds: 3 }, match: { hb: 2, rounds: 2 } } }], new Date('2026-10-07T20:00:00Z'))
check(s.days.length === 14 && s.days[13].day === '2026-10-08' && s.days[0].day === '2026-09-25', 'fourteen days, today last')
check(s.days[12].visits === 0 && s.days[13].visits === 3, 'quiet days are zero')
check(s.days[13].minutes === 4 && s.week.rounds === 5 && s.week.minutes === 4, 'minutes: 8 heartbeats of 30 seconds')
check(s.byGame.find(g => g.game === 'spot')!.rounds === 3 && s.byGame.find(g => g.game === 'trace')!.rounds === 0, 'per game')

// ── Against a database ──
const client = new MongoClient(process.env.MONGODB_URI!)
const dbName = `parenting-stats-test-${Date.now()}`
try {
  await client.connect()
  const db = client.db(dbName)
  // Close to the real time: the expiry index would (rightly) delete records dated hours ago.
  const t0 = new Date(Date.now() - 60_000)
  const at = (sec: number) => new Date(t0.getTime() + sec * 1000)

  await recordPing(db, cleanPing({ e: 'hb', v: V1, g: 'home' })!, at(0))          // arrives, on the tiles
  await recordPing(db, cleanPing({ e: 'hb', v: V1, g: 'spot' })!, at(30))         // opens a game
  await recordPing(db, cleanPing({ e: 'hb', v: V1, g: 'spot' })!, at(60))
  await recordPing(db, cleanPing({ e: 'round', v: V1, g: 'spot' })!, at(70))
  await recordPing(db, cleanPing({ e: 'hb', v: V2, g: 'home' })!, at(65))         // someone else, only browsing
  let d = await loadDashboard(db, at(80))
  check(d.today.visits === 2, `two visits (got ${d.today.visits})`)
  check(d.today.played === 1, `one of them played (got ${d.today.played})`)
  check(d.today.rounds === 1 && d.byGame.find(g => g.game === 'spot')!.rounds === 1, 'one round, in Spot')
  check(d.live.total === 2 && d.live.playing === 1 && d.live.onTiles === 1 && d.live.byGame.spot === 1, `live now: ${JSON.stringify(d.live)}`)
  check(d.today.minutes === 2, `four heartbeats (tiles included) is two minutes (got ${d.today.minutes})`)

  d = await loadDashboard(db, at(65 + ACTIVE_MS / 1000 + 1))                        // just over the window after the last ping (65 s)
  check(d.live.total === 0, 'nobody is live once the pings stop')

  // Privacy: the anonymous records carry no name and nothing but counts.
  const liveDoc = await db.collection('parenting_live').findOne({ _id: V1 as any })
  check(liveDoc && Object.keys(liveDoc).sort().join() === '_id,g,played,seenAt', `live record holds only game and time: ${Object.keys(liveDoc || {})}`)
  const dailyDoc = await db.collection('parenting_daily').findOne({})
  check(dailyDoc && !JSON.stringify(dailyDoc).match(/name|age|ip|agent/i), 'the daily record holds only counts')
  check((await db.collection('parenting_shared').countDocuments()) === 0, 'nothing is kept about a child who did not share')

  // Sharing: a name is kept only with an id, grows with rounds, and can be removed.
  await recordPing(db, cleanPing({ e: 'hb', v: V3, g: 'letters', id: SHARE, name: 'Aarav', age: '5-6' })!, at(100))
  await recordPing(db, cleanPing({ e: 'round', v: V3, g: 'letters', id: SHARE, name: 'Aarav', age: '5-6' })!, at(110))
  await recordPing(db, cleanPing({ e: 'round', v: V3, g: 'letters', id: SHARE, name: 'Aarav', age: '5-6' })!, at(120))
  d = await loadDashboard(db, at(130))
  check(d.shared.length === 1 && d.shared[0].name === 'Aarav' && d.shared[0].age === '5-6' && d.shared[0].rounds === 2 && d.shared[0].games.letters === 2, `shared: ${JSON.stringify(d.shared)}`)
  await recordPing(db, cleanPing({ e: 'hb', v: V3, g: 'letters', id: SHARE, name: 'Aarav S', age: '7-8' })!, at(140))
  d = await loadDashboard(db, at(150))
  check(d.shared.length === 1 && d.shared[0].name === 'Aarav S' && d.shared[0].age === '7-8' && d.shared[0].rounds === 2, 'a changed name updates the same record')
  await recordPing(db, cleanPing({ e: 'forget', v: V3, g: 'home', id: SHARE })!, at(160))
  check((await db.collection('parenting_shared').countDocuments()) === 0, 'switching sharing off deletes the name')
  await recordPing(db, cleanPing({ e: 'hb', v: V3, g: 'letters', id: SHARE, name: 'Aarav' })!, at(170))
  check(await deleteShared(db, SHARE) && !(await deleteShared(db, SHARE)), 'the admin can delete a shared name')

  // The records expire on their own.
  const live = await db.collection('parenting_live').indexes()
  const shared = await db.collection('parenting_shared').indexes()
  check(live.some(i => i.expireAfterSeconds === 900), 'live visits expire after 15 minutes')
  check(shared.some(i => i.expireAfterSeconds === 365 * 24 * 3600), 'shared names expire after a year')
} finally {
  await client.db(dbName).dropDatabase().catch(() => {})
  await client.close()
}
if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('parenting stats: all checks passed')
