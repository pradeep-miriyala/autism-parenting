// scripts/test-colouring.mts
// Checks Colour it in: every picture is made of regions that can all be touched (none too small, none hidden under
// the ones drawn after it), they stay inside the picture, ids are not repeated, the colours are all different, and each
// level has pictures to draw.
//
//     node scripts/test-colouring.mts

import { PALETTE, PAPER, PICTURES, VIEW, bounds, contains, pickPicture, picturesFor, topmostAt } from '../src/games/colouring/pictures.ts'
import { seeded } from '../src/games/spot/generate.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 25) console.error('FAIL', what) }
const STEP = 3
/** How much of a region can be touched: the points of it that no later region covers. */
function exposed(pi: number, ri: number) {
  const p = PICTURES[pi], r = p.regions[ri], b = bounds(r)
  let n = 0
  for (let y = Math.floor(b.y0); y <= b.y1; y += STEP) for (let x = Math.floor(b.x0); x <= b.x1; x += STEP) if (contains(r, x, y) && topmostAt(p, x, y) === r) n++
  return n
}

// ── The colours ──
check(PALETTE.length === 12, 'twelve colours')
check(new Set(PALETTE.map(c => c.id)).size === 12 && new Set(PALETTE.map(c => c.hex)).size === 12 && new Set(PALETTE.map(c => c.name)).size === 12, 'every colour is different')
check(PALETTE.every(c => /^#[0-9A-F]{6}$/i.test(c.hex) && c.name.length > 2), 'valid colours with a name')
check(PALETTE.filter(c => c.hex === PAPER).length === 1 && PALETTE.at(-1)!.id === 'white', 'one colour is the paper, so painting with it takes colour off')

// ── The pictures ──
check(PICTURES.length >= 10 && new Set(PICTURES.map(p => p.id)).size === PICTURES.length, 'at least nine pictures, none repeated')
for (const t of [1, 2, 3] as const) check(PICTURES.filter(p => p.tier === t).length >= 3, `tier ${t}: at least three pictures`)
const total = PICTURES.reduce((n, p) => n + p.regions.length, 0)
console.log(`  ${PICTURES.length} pictures, ${total} regions`)
PICTURES.forEach((p, pi) => {
  const tag = p.id
  check(p.name.length > 4, `${tag}: a name`)
  check(new Set(p.regions.map(r => r.id)).size === p.regions.length, `${tag}: region names are not repeated`)
  check(p.regions.length >= 4 && p.regions.length <= 14, `${tag}: ${p.regions.length} regions`)
  // more regions at higher tiers
  check(p.tier === 1 ? p.regions.length <= 6 : p.tier === 2 ? p.regions.length >= 7 && p.regions.length <= 9 : p.regions.length >= 10, `${tag}: ${p.regions.length} regions suits tier ${p.tier}`)
  p.regions.forEach((r, ri) => {
    const b = bounds(r), w = b.x1 - b.x0, h = b.y1 - b.y0
    check(b.x0 >= 0 && b.y0 >= 0 && b.x1 <= VIEW.w && b.y1 <= VIEW.h, `${tag}.${r.id}: inside the picture`)
    check(w >= 18 && h >= 18, `${tag}.${r.id}: ${w.toFixed(0)} by ${h.toFixed(0)} is big enough to touch`)
    const e = exposed(pi, ri)
    check(e >= 40, `${tag}.${r.id}: only ${e} touchable points (the rest is under other regions)`)
    if (r.t === 'poly') check(r.pts.length >= 6 && r.pts.length % 2 === 0, `${tag}.${r.id}: a polygon has pairs of points`)
  })
  // the first region is the background and every point of the picture belongs to something
  let bare = 0
  for (let y = 1; y < VIEW.h; y += 7) for (let x = 1; x < VIEW.w; x += 7) if (!topmostAt(p, x, y)) bare++
  check(bare === 0, `${tag}: ${bare} points belong to no region`)
})

// ── The shapes ──
{
  const r = { id: 'a', t: 'rect' as const, x: 10, y: 10, w: 20, h: 20 }
  check(contains(r, 10, 10) && contains(r, 30, 30) && !contains(r, 31, 20) && !contains(r, 20, 9), 'a rectangle includes its edge and nothing past it')
  const c = { id: 'b', t: 'circle' as const, cx: 0, cy: 0, r: 10 }
  check(contains(c, 6, 8) && !contains(c, 8, 8), 'a circle')
  const e = { id: 'c', t: 'ellipse' as const, cx: 0, cy: 0, rx: 20, ry: 10 }
  check(contains(e, 19, 0) && !contains(e, 0, 11) && !contains(e, 15, 8), 'an ellipse')
  const t = { id: 'd', t: 'poly' as const, pts: [0, 0, 20, 0, 10, 20] }
  check(contains(t, 10, 5) && !contains(t, 1, 15) && !contains(t, 25, 5) && !contains(t, 10, 25), 'a triangle')
  const l = { id: 'e', t: 'poly' as const, pts: [0, 0, 30, 0, 30, 10, 10, 10, 10, 30, 0, 30] }   // an L
  check(contains(l, 5, 25) && contains(l, 25, 5) && !contains(l, 25, 25), 'a shape with a corner cut out')
}

// ── Choosing a picture ──
check(picturesFor(1).length === 3 && picturesFor(2).length === 7 && picturesFor(3).length === PICTURES.length && PICTURES.length === 10, 'level 1 draws from the three simplest, level 2 adds four more, level 3 has all ten')
check(picturesFor(0).length === 3 && picturesFor(9).length === PICTURES.length, 'a level outside 1 to 3 is held to the nearest')
for (let level = 1; level <= 3; level++) {
  const rand = seeded(level), seen = new Set<string>()
  let last: string | null = null
  for (let i = 0; i < 400; i++) {
    const p = pickPicture(level, last, rand)
    check(p.id !== last, `level ${level}: the same picture twice running`)
    check(picturesFor(level).includes(p), `level ${level}: a picture that is too hard`)
    seen.add(p.id); last = p.id
  }
  check(seen.size === picturesFor(level).length, `level ${level}: every picture comes up`)
}

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('colouring: all checks passed')
