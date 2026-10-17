// scripts/test-jigsaw.mts
// Checks the photo Jigsaw: that every cut fits together (neighbours share their edge, no gap and no overlap, so
// the pieces add up to exactly the picture), that no knob reaches further than the room left for it, that loose
// pieces start on the table and away from their places, how a photo is cropped, and which picture comes next.
//
//     node scripts/test-jigsaw.mts

import {
  KNOB_REACH, PHOTO_GRID, clampPos, homeOf, makeCut, photoGrid, piecePath, scatter, sideOf, snapRadius, stackOrder, tableFor,
  type Chain, type Pt,
} from '../src/games/pictures/cut.ts'
import { PHOTO_SIZE, cropBox, outputSize } from '../src/games/pictures/prepare.ts'
import { DEFAULT_JIGSAW, PICTURE_MODES, cleanJigsaw, pickPhoto } from '../src/games/pictures/prefs.ts'
import { freeSlot, MAX_PHOTOS } from '../src/games/pictures/store.ts'
import { seeded } from '../src/games/spot/generate.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 25) console.error('FAIL', what) }
const near = (a: number, b: number, eps = 0.01) => Math.abs(a - b) <= eps
const W = 400, H = 300, SEEDS = 150

/** Points along a chain's curves. */
function sample(c: Chain, steps = 24): Pt[] {
  const out: Pt[] = [c.start]
  let p0 = c.start
  for (const s of c.segs) {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, u = 1 - t
      out.push({
        x: u * u * u * p0.x + 3 * u * u * t * s.c1.x + 3 * u * t * t * s.c2.x + t * t * t * s.p.x,
        y: u * u * u * p0.y + 3 * u * u * t * s.c1.y + 3 * u * t * t * s.c2.y + t * t * t * s.p.y,
      })
    }
    p0 = s.p
  }
  return out
}
const SIDES = ['top', 'right', 'bottom', 'left'] as const
const outline = (cut: ReturnType<typeof makeCut>, i: number) => SIDES.flatMap(s => sample(sideOf(cut, i, s, W, H)))
const area = (pts: Pt[]) => Math.abs(pts.reduce((a, p, k) => { const q = pts[(k + 1) % pts.length]; return a + p.x * q.y - q.x * p.y }, 0)) / 2

// ── The grids ──
check(Object.values(PHOTO_GRID).map(g => g.cols * g.rows).join() === '4,6,9,12', 'four, six, nine and twelve pieces')
check(photoGrid(0).cols === 2 && photoGrid(9).cols === 4 && photoGrid(2.4).cols === 3, 'a level outside 1 to 4 is held to the nearest')

// ── The cuts ──
let plus = 0, minus = 0
for (let level = 1; level <= 4; level++) {
  const { cols, rows } = photoGrid(level), n = cols * rows
  const t = tableFor(cols, rows, W, H)
  for (const plain of [false, true]) {
    for (let s = 1; s <= SEEDS; s++) {
      const cut = makeCut(cols, rows, plain, seeded(s * 13 + level))
      const tag = `level ${level}${plain ? ' plain' : ''} seed ${s}`
      let total = 0
      for (let i = 0; i < n; i++) {
        const c = i % cols, r = Math.floor(i / cols), x0 = c * t.cw, y0 = r * t.ch
        // the four sides join up into one closed outline
        const chains = SIDES.map(side => sideOf(cut, i, side, W, H))
        chains.forEach((ch, k) => {
          const end = ch.segs[ch.segs.length - 1].p, next = chains[(k + 1) % 4].start
          check(near(end.x, next.x) && near(end.y, next.y), `${tag}: piece ${i} side ${k} does not meet the next`)
        })
        const pts = outline(cut, i)
        total += area(pts)
        // how far out of its own square the outline goes
        const out = {
          l: Math.max(...pts.map(p => x0 - p.x)), r: Math.max(...pts.map(p => p.x - (x0 + t.cw))),
          t: Math.max(...pts.map(p => y0 - p.y)), b: Math.max(...pts.map(p => p.y - (y0 + t.ch))),
        }
        const reachX = KNOB_REACH * t.ch, reachY = KNOB_REACH * t.cw
        check(out.l <= reachX && out.r <= reachX && out.t <= reachY && out.b <= reachY, `${tag}: piece ${i} reaches past its room`)
        if (plain) check(Math.max(out.l, out.r, out.t, out.b) < 0.001, `${tag}: a plain piece stays in its square`)
        // the edge of the picture is straight
        if (c === 0) check(sample(chains[3]).every(p => near(p.x, 0)), `${tag}: piece ${i} left border is straight`)
        if (c === cols - 1) check(sample(chains[1]).every(p => near(p.x, W)), `${tag}: piece ${i} right border is straight`)
        if (r === 0) check(sample(chains[0]).every(p => near(p.y, 0)), `${tag}: piece ${i} top border is straight`)
        if (r === rows - 1) check(sample(chains[2]).every(p => near(p.y, H)), `${tag}: piece ${i} bottom border is straight`)
        // the neighbour fits: same curve, walked the other way
        if (c < cols - 1) {
          const mine = sample(chains[1]), theirs = sample(sideOf(cut, i + 1, 'left', W, H)).reverse()
          check(mine.every((p, k) => near(p.x, theirs[k].x) && near(p.y, theirs[k].y)), `${tag}: piece ${i} does not fit the one on its right`)
        }
        if (r < rows - 1) {
          const mine = sample(chains[2]), theirs = sample(sideOf(cut, i + cols, 'top', W, H)).reverse()
          check(mine.every((p, k) => near(p.x, theirs[k].x) && near(p.y, theirs[k].y)), `${tag}: piece ${i} does not fit the one below`)
        }
        const d = piecePath(cut, i, W, H)
        check(/^M[\d. -]+(C[\d. -]+)+Z$/.test(d), `${tag}: piece ${i} path is well formed`)
      }
      // no gap and no overlap: the pieces together are exactly the picture
      check(Math.abs(total - W * H) / (W * H) < 0.002, `${tag}: pieces add up to ${total.toFixed(0)}, not ${W * H}`)
    }
  }
  // knobs go both ways, and differ from round to round
  for (let s = 1; s <= 20; s++) {
    const cut = makeCut(cols, rows, false, seeded(s * 7 + level))
    for (const row of [...cut.h, ...cut.v]) for (const k of row) if (k) { if (k.sgn > 0) plus++; else minus++ }
  }
  const a = piecePath(makeCut(cols, rows, false, seeded(1)), 0, W, H), b = piecePath(makeCut(cols, rows, false, seeded(2)), 0, W, H)
  check(cols * rows === 4 || a !== b, `level ${level}: two rounds are cut differently`)
}
check(plus > 50 && minus > 50 && Math.abs(plus - minus) < (plus + minus) * 0.2, `knobs go both ways (${plus} and ${minus})`)
{
  // a 2 by 2 cut has four inner edges; a plain one has none to speak of
  const c = makeCut(2, 2, false, seeded(3)), p = makeCut(2, 2, true, seeded(3))
  check(c.h.flat().length + c.v.flat().length === 4 && c.h.flat().every(Boolean) && c.v.flat().every(Boolean), 'every inner edge has a knob')
  check(p.h.flat().every(k => k === null) && p.v.flat().every(k => k === null), 'plain edges have no knobs')
}

// ── The table ──
for (let level = 1; level <= 4; level++) {
  const { cols, rows } = photoGrid(level), n = cols * rows
  const t = tableFor(cols, rows, W, H)
  check(t.view.x === -t.padX && t.view.y === -t.padY && near(t.view.w, W + 2 * t.padX) && near(t.view.h, t.height + 2 * t.padY), `level ${level}: the view holds the board, the shelf and a margin`)
  check(t.shelfTop > H && near(t.height, t.shelfTop + t.shelfH), `level ${level}: the shelf is under the board`)
  for (let s = 1; s <= SEEDS; s++) {
    const pos = scatter(cols, rows, W, H, seeded(s * 17 + level)), tag = `level ${level} seed ${s}`
    check(pos.length === n, `${tag}: a start for every piece`)
    pos.forEach((p, i) => {
      check(p.x >= 0 && p.x <= W - t.cw && p.y >= 0 && p.y <= t.height - t.ch, `${tag}: piece ${i} starts on the table`)
      const home = homeOf(i, cols, rows, W, H)
      check(Math.hypot(p.x - home.x, p.y - home.y) > snapRadius(t.cw, t.ch) * 2, `${tag}: piece ${i} starts far from its place`)
      check(p.y >= t.shelfTop - 0.001, `${tag}: piece ${i} starts on the shelf`)
    })
    check(new Set(pos.map(p => `${Math.round(p.x)},${Math.round(p.y)}`)).size === n, `${tag}: no two pieces start on the same spot`)
  }
  const o = stackOrder(n, seeded(5))
  check(o.length === n && [...o].sort((a, b) => a - b).every((v, i) => v === i), `level ${level}: every piece is in the stack once`)
}
{
  const t = tableFor(3, 3, W, H)
  const c = clampPos({ x: -50, y: 999 }, t, W)
  check(c.x === 0 && near(c.y, t.height - t.ch), 'a piece cannot leave the table')
  const home = homeOf(4, 3, 3, W, H)
  check(near(home.x, W / 3) && near(home.y, H / 3), 'the middle piece belongs in the middle')
  check(snapRadius(t.cw, t.ch) > 20 && snapRadius(t.cw, t.ch) < Math.min(t.cw, t.ch) / 2, 'the click-in distance is generous but under half a piece')
}

// ── Getting a photo ready ──
{
  const full = cropBox(4000, 3000)
  check(full.sx === 0 && full.sy === 0 && full.sw === 4000 && full.sh === 3000, 'a 4 by 3 photo is not cropped')
  const square = cropBox(3000, 3000)
  check(square.sx === 0 && square.sw === 3000 && square.sh === 2250 && square.sy === 375, 'a square photo loses the top and bottom evenly')
  const tall = cropBox(3000, 4000)
  check(tall.sw === 3000 && tall.sh === 2250 && tall.sy === 875, 'a tall photo is cropped to its middle')
  const wide = cropBox(4000, 1000)
  check(wide.sh === 1000 && near(wide.sw, 1333.33, 0.01) && near(wide.sx, 1333.33, 0.01), 'a very wide photo loses its sides evenly')
  for (const [w, h] of [[4000, 3000], [3000, 3000], [3000, 4000], [4000, 1000], [640, 480], [90, 3000]] as const) {
    const b = cropBox(w, h)
    check(b.sx >= -1e-9 && b.sy >= -1e-9 && b.sx + b.sw <= w + 1e-9 && b.sy + b.sh <= h + 1e-9 && near(b.sw / b.sh, 4 / 3, 1e-9), `${w}x${h}: the crop stays inside the photo and is 4 by 3`)
  }
  check(outputSize(4000).w === PHOTO_SIZE.w && outputSize(4000).h === PHOTO_SIZE.h, 'a big photo is saved at 1200 by 900')
  check(outputSize(300).w === 300 && outputSize(300).h === 225, 'a small photo is not made bigger')
  check(outputSize(1).w >= 4, 'a tiny photo still gets a size')
}

// ── What the parent chose, and which picture comes next ──
{
  check(JSON.stringify(cleanJigsaw(null)) === JSON.stringify(DEFAULT_JIGSAW) && JSON.stringify(cleanJigsaw('x')) === JSON.stringify(DEFAULT_JIGSAW), 'nothing saved: the defaults')
  check(cleanJigsaw({ pictures: 'mine', plain: true, guide: false }).pictures === 'mine' && cleanJigsaw({ pictures: 'mine', plain: true, guide: false }).guide === false, 'good values are kept')
  const bad = cleanJigsaw({ pictures: 'everything', plain: 'yes', guide: 1 })
  check(bad.pictures === 'mix' && bad.plain === false && bad.guide === true, 'bad values fall back to the defaults')
  check(PICTURE_MODES.map(m => m.id).join() === 'mix,mine,cartoons', 'three choices')

  const rand = seeded(99)
  check(pickPhoto('mix', [], null, rand) === null && pickPhoto('mine', [], null, rand) === null, 'no photos: a drawn picture')
  for (let i = 0; i < 200; i++) check(pickPhoto('cartoons', [0, 1, 2], null, rand) === null, 'cartoons only: never a photo')
  for (let i = 0; i < 200; i++) check(pickPhoto('mine', [4], 4, rand) === 4, 'one photo: that one, even twice running')
  let last: number | null = null, mineCount = new Map<number, number>()
  for (let i = 0; i < 3000; i++) {
    const p = pickPhoto('mine', [0, 3, 7], last, rand)
    check(p !== null && [0, 3, 7].includes(p) && p !== last, 'only my photos: always one of them, never the same twice running')
    mineCount.set(p!, (mineCount.get(p!) || 0) + 1)
    last = p
  }
  for (const s of [0, 3, 7]) check((mineCount.get(s) || 0) > 3000 / 3 * 0.8, `photo ${s} comes up often enough`)
  let photos = 0
  last = null
  for (let i = 0; i < 4000; i++) {
    const p = pickPhoto('mix', [1, 2], last, rand)
    if (p !== null) { photos++; check(p !== last, 'mix: not the same photo twice running'); last = p }
  }
  check(photos > 1700 && photos < 2300, `mix: about half the rounds use a photo (${photos} of 4000)`)
  check(pickPhoto('mine', [5, 6], 99, rand) !== null, 'a last photo that was deleted does not matter')
}

// ── The photo slots ──
{
  check(MAX_PHOTOS === 12, 'twelve photos at most')
  check(freeSlot([]) === 0 && freeSlot([{ slot: 0 }, { slot: 1 }]) === 2 && freeSlot([{ slot: 1 }]) === 0, 'the first empty place is used')
  check(freeSlot(Array.from({ length: 12 }, (_, slot) => ({ slot }))) === null, 'all twelve taken: no place left')
}

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('jigsaw: all checks passed')
