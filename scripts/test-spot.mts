// scripts/test-spot.mts
// Checks the Spot the Differences generator: every pair it can make must be sound.
//
//     node scripts/test-spot.mts
//
// Fix the generator, not the instance: this runs thousands of seeded pairs through
// validate() and fails if any one has the wrong number of differences, differences
// too close together, a colour change that is invisible by lightness, and so on.

import {
  THEMES, COLOURS, makePair, seeded, validate, classifyTap, luminance, MIN_LIGHTNESS_GAP, type Pair,
} from '../src/games/spot/generate.ts'
import { readFileSync } from 'node:fs'

let failures = 0
const fail = (msg: string) => { failures++; if (failures <= 20) console.error('FAIL', msg) }

// 1. Every colour pool has a yellow hub and every member can change to something clearly different.
for (const t of THEMES) for (const [kind, pool] of Object.entries(t.kinds)) {
  const cs = pool.split('')
  if (!cs.includes('y')) fail(`${kind}: pool ${pool} has no yellow hub`)
  for (const c of cs) {
    if (!(c in COLOURS)) fail(`${kind}: unknown colour ${c}`)
    const partners = cs.filter(o => o !== c && Math.abs(luminance(COLOURS[o]) - luminance(COLOURS[c])) >= MIN_LIGHTNESS_GAP)
    if (!partners.length) fail(`${kind}: colour ${c} has no clearly different partner in ${pool}`)
  }
}

// 2. Every kind has a drawing.
const art = readFileSync(new URL('../src/games/spot/art.tsx', import.meta.url), 'utf8')
for (const t of THEMES) for (const kind of Object.keys(t.kinds)) {
  if (!art.includes(`'${kind}'`)) fail(`no drawing for ${kind}`)
}

// 3. Thousands of seeded pairs.
let pairs = 0
const kindCounts: Record<string, number> = {}
for (const theme of THEMES) for (let n = 1; n <= 5; n++) for (let seed = 1; seed <= 400; seed++) {
  const pair: Pair = makePair(theme.id, n, seeded(seed * 7919 + n * 131))
  pairs++
  for (const p of validate(pair, n)) fail(`${theme.id} n=${n} seed=${seed}: ${p}`)
  for (const d of pair.diffs) kindCounts[d.kind] = (kindCounts[d.kind] || 0) + 1

  // 4. A tap on each difference finds it, a tap in an empty corner does not.
  const found = new Set<number>()
  for (const d of pair.diffs) {
    const r = classifyTap(pair.diffs, found, d.x, d.y)
    if (r.type !== 'new' || r.diff.id !== d.id) fail(`${theme.id} n=${n} seed=${seed}: tap on difference ${d.id} did not find it`)
    found.add(d.id)
    if (classifyTap(pair.diffs, found, d.x, d.y).type !== 'again') fail(`repeat tap on ${d.id} should be "again"`)
  }
  const farFromAll = (x: number, y: number) => pair.diffs.every(d => Math.hypot(d.x - x, d.y - y) > d.r + 20)
  for (const [x, y] of [[2, 2], [398, 2], [2, 298], [398, 298]]) {
    if (farFromAll(x, y) && classifyTap(pair.diffs, new Set(), x, y).type !== 'miss') fail(`corner tap should miss`)
  }
}

console.log(`checked ${pairs} pairs; differences by kind:`, kindCounts)
if (failures) { console.error(`\n${failures} problem(s)`); process.exit(1) }
console.log('all sound')
