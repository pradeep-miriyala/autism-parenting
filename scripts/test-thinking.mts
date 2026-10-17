// scripts/test-thinking.mts
// Checks every round the thinking games can make: How many?, What comes next?, Sort it, Odd one out, Jigsaw
// and Connect the dots. A round that has no right answer, two right answers, or a picture that does not exist
// would be a game that cannot be played; this runs thousands of them.
//
//     node scripts/test-thinking.mts

import { readFileSync } from 'node:fs'
import {
  CATEGORIES, COUNT_QUESTIONS, DESIGNS, DOTS_RANGE, ODD_QUESTIONS, PATTERN_QUESTIONS, SHAPES, SHAPE_COLOURS, SORT_LEVELS, THINGS, UNITS,
  countLayout, countMax, crosses, DOT_REACH_MAX, dotAt, dotReach, dotsFor, makeCountRound, makeDotsRound, makeOddRound, makePatternRound, makePuzzle, makePuzzleScene, puzzleGrid, makeSortRound, oddCount, pieceBox,
} from '../src/games/thinking/rounds.ts'
import { COLOURS, seeded } from '../src/games/spot/generate.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 25) console.error('FAIL', what) }
const artSource = readFileSync(new URL('../src/games/spot/art.tsx', import.meta.url), 'utf8')
const hasArt = (k: string) => artSource.includes(`'${k}':`)
const SEEDS = 600

// ── The catalogue ──
check(new Set(THINGS.map(t => t.kind)).size === THINGS.length, 'a drawing is listed twice')
check(THINGS.every(t => hasArt(t.kind) && !!COLOURS[t.colour] && t.word.length > 1), 'every thing has a drawing, a colour and a word')
for (const c of CATEGORIES) check(THINGS.filter(t => t.category === c).length >= 5, `${c}: at least five things`)
check(SHAPE_COLOURS.every(c => !!COLOURS[c.key]), 'every shape colour exists')

// ── How many? ──
for (let level = 1; level <= 3; level++) {
  const max = countMax(level)
  for (let s = 1; s <= SEEDS; s++) {
    const r = makeCountRound(level, seeded(s * 31 + level)), tag = `count level ${level} seed ${s}`
    check(r.length === COUNT_QUESTIONS, `${tag}: five questions`)
    r.forEach((q, i) => {
      check(q.n >= 1 && q.n <= max, `${tag}: ${q.n} is out of range`)
      check(i === 0 || q.n !== r[i - 1].n, `${tag}: the same number twice in a row`)
      check(q.options.includes(q.n) && new Set(q.options).size === q.options.length, `${tag}: the answer is among distinct options`)
      check(q.options.length === Math.min(3, max) && q.options.every(o => o >= 1 && o <= max), `${tag}: options ${q.options}`)
      check(hasArt(q.thing.kind), `${tag}: a picture`)
      const lay = countLayout(q.n)
      check(lay.length === q.n && lay.every(p => p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1), `${tag}: layout stays inside`)
      check(new Set(lay.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)).size === q.n, `${tag}: things on top of each other`)
    })
  }
}

// ── What comes next? ──
for (let level = 1; level <= 3; level++) {
  for (let s = 1; s <= SEEDS; s++) {
    const r = makePatternRound(level, seeded(s * 37 + level)), tag = `pattern level ${level} seed ${s}`
    check(r.length === PATTERN_QUESTIONS, `${tag}: five questions`)
    r.forEach((q, i) => {
      check(UNITS[level].some(u => u.join('') === q.unit), `${tag}: unit ${q.unit} is not for this level`)
      const m = q.unit.length
      check(q.shown.length === 2 * m + 1, `${tag}: shows two repeats and one more`)
      // the next one really is what the pattern says
      const letters = [...new Set(q.unit)]
      const byLetter = new Map<string, string>()
      q.shown.forEach((p, k) => { const l = q.unit[k % m]; if (byLetter.has(l)) check(byLetter.get(l) === p.id, `${tag}: ${l} is two different pictures`); byLetter.set(l, p.id) })
      check(q.answer.id === byLetter.get(q.unit[1]), `${tag}: the answer is not what comes next`)
      check(new Set(letters.map(l => byLetter.get(l))).size === letters.length, `${tag}: two letters are one picture`)
      // exactly one option continues the pattern
      check(q.options.filter(o => o.id === q.answer.id).length === 1 && new Set(q.options.map(o => o.id)).size === q.options.length, `${tag}: one right option`)
      check(q.options.length >= 2 && q.options.length <= 3, `${tag}: two or three options`)
      check(q.options.every(o => o.shape ? !!COLOURS[o.colour!] : hasArt(o.kind!)), `${tag}: a piece with no picture`)
      check(i === 0 || q.unit !== r[i - 1].unit || UNITS[level].length === 1, `${tag}: the same pattern twice in a row`)
    })
  }
}

// ── Sort it ──
for (let level = 1; level <= 3; level++) {
  const lv = SORT_LEVELS[level]
  for (let s = 1; s <= SEEDS; s++) {
    const r = makeSortRound(level, seeded(s * 41 + level)), tag = `sort level ${level} seed ${s} (${r.by})`
    check(r.items.length === lv.items, `${tag}: ${r.items.length} items`)
    check(lv.bins.includes(r.bins.length) && new Set(r.bins.map(b => b.id)).size === r.bins.length, `${tag}: ${r.bins.length} bins`)
    check(r.items.every(i => r.bins.some(b => b.id === i.bin)), `${tag}: an item with no bin`)
    check(r.bins.every(b => r.items.some(i => i.bin === b.id)), `${tag}: an empty bin`)
    check(new Set(r.items.map(i => i.id)).size === r.items.length, `${tag}: an item twice`)
    check(!r.items.some((x, i) => i >= 2 && r.items[i - 1].bin === x.bin && r.items[i - 2].bin === x.bin) || r.items.length < 5, `${tag}: the same bin three times running`)
    // each item belongs in exactly one bin, by the thing it is sorted on
    for (const it of r.items) {
      if (r.by === 'colour') check(it.colour === it.bin, `${tag}: ${it.id} is not ${it.bin}`)
      if (r.by === 'shape') check(it.shape === it.bin, `${tag}: ${it.id} is not a ${it.bin}`)
      if (r.by === 'size') check((it.big ? 'big' : 'small') === it.bin && hasArt(it.kind!), `${tag}: ${it.id} size`)
      if (r.by === 'group') check(THINGS.find(t => t.kind === it.kind)!.category === it.bin, `${tag}: ${it.id} is not in ${it.bin}`)
    }
    if (r.by === 'size') { const big = r.items.filter(i => i.big).length; check(Math.abs(big - (r.items.length - big)) <= 1, `${tag}: big and small are balanced`) }
  }
}

// ── Odd one out ──
for (let level = 1; level <= 3; level++) {
  for (let s = 1; s <= SEEDS; s++) {
    const r = makeOddRound(level, seeded(s * 43 + level)), tag = `odd level ${level} seed ${s}`
    check(r.length === ODD_QUESTIONS, `${tag}: five questions`)
    r.forEach(q => {
      check(q.pieces.length === (level >= 3 && q.pieces.every(p => p.shape) ? 4 : oddCount(level)), `${tag}: ${q.pieces.length} pieces`)
      check(q.odd >= 0 && q.odd < q.pieces.length, `${tag}: the odd one is in the row`)
      check(new Set(q.pieces.map(p => p.id)).size >= 2, `${tag}: all alike`)
      // exactly one is different: all the others share one id
      const ids = q.pieces.map(p => p.id)
      const rest = ids.filter((_, i) => i !== q.odd)
      check(new Set(rest).size === (q.pieces[0].kind ? rest.length : 1) || !!q.pieces[0].shape, `${tag}: the others are not alike`)
      if (q.pieces[0].shape) check(rest.every(x => x === rest[0]) && ids[q.odd] !== rest[0], `${tag}: shapes: one is different`)
      else {
        const cat = (k: string) => THINGS.find(t => t.kind === k)!.category
        const others = q.pieces.filter((_, i) => i !== q.odd).map(p => cat(p.kind!))
        check(new Set(others).size === 1 && cat(q.pieces[q.odd].kind!) !== others[0], `${tag}: the odd one is of another kind`)
        check(q.pieces.every(p => hasArt(p.kind!)), `${tag}: a picture`)
      }
    })
  }
}

// ── Jigsaw ──
for (let level = 1; level <= 4; level++) {
  for (let s = 1; s <= SEEDS; s++) {
    const p = makePuzzle(level, seeded(s * 47 + level)), n = p.cols * p.rows
    check(p.tray.length === n && [...p.tray].sort((a, b) => a - b).every((v, i) => v === i), `jigsaw level ${level}: every piece once`)
    check(p.tray.every((v, i) => v !== i), `jigsaw level ${level} seed ${s}: a piece already home`)
  }
}
check(puzzleGrid(5).cols * puzzleGrid(5).rows === 12 && puzzleGrid(6).cols * puzzleGrid(6).rows === 12, 'the drawn jigsaw stops at twelve pieces, even when the slider is higher')
check(makePuzzle(1).cols * makePuzzle(1).rows === 4 && makePuzzle(2).cols * makePuzzle(2).rows === 6 && makePuzzle(3).cols * makePuzzle(3).rows === 9 && makePuzzle(4).cols * makePuzzle(4).rows === 12, 'four, six, nine and twelve pieces')
{
  const boxes = Array.from({ length: 6 }, (_, i) => pieceBox(i, 3, 2, 300, 200))
  check(boxes[0].x === 0 && boxes[0].y === 0 && boxes[5].x === 200 && boxes[5].y === 100 && boxes.every(b => b.w === 100 && b.h === 100), 'piece boxes tile the picture')
}

// The jigsaw picture: every piece has a drawing of its own, so no two pieces look alike.
for (let level = 1; level <= 4; level++) {
  const { cols, rows } = { 1: { cols: 2, rows: 2 }, 2: { cols: 3, rows: 2 }, 3: { cols: 3, rows: 3 }, 4: { cols: 4, rows: 3 } }[level]!
  for (let s = 1; s <= SEEDS; s++) {
    const sc = makePuzzleScene(cols, rows, 400, 300, seeded(s * 59 + level)), tag = `jigsaw picture level ${level} seed ${s}`
    check(sc.objs.length === cols * rows && new Set(sc.objs.map(o => o.kind)).size === sc.objs.length && sc.objs.every(o => hasArt(o.kind)), `${tag}: a different drawing in every cell`)
    const cw = 400 / cols, ch = 300 / rows
    sc.objs.forEach((o, i) => {
      const cx = (i % cols + 0.5) * cw, cy = (Math.floor(i / cols) + 0.5) * ch
      check(Math.abs(o.x - cx) <= cw * 0.13 && Math.abs(o.y - cy) <= ch * 0.13, `${tag}: drawing ${i} is near the middle of its cell`)
      check(o.x - 40 * o.scale >= -cw * 0.2 && o.x + 40 * o.scale <= 400 + cw * 0.2 && o.y - 40 * o.scale >= -ch * 0.2 && o.y + 40 * o.scale <= 300 + ch * 0.2, `${tag}: drawing ${i} stays in the picture`)
      // the piece for this cell shows most of this drawing, so it is told apart from the others
      const visibleInCell = Math.min(cx + cw / 2, o.x + 40 * o.scale) - Math.max(cx - cw / 2, o.x - 40 * o.scale)
      check(visibleInCell >= 40 * o.scale, `${tag}: drawing ${i} is mostly in its own piece`)
    })
  }
}

// ── Connect the dots ──
for (const d of DESIGNS) {
  const c = d.corners
  check(c.length >= 4 && !!COLOURS[d.colour], `${d.id}: corners and colour`)
  check(c.every(p => p.x >= 10 && p.x <= 390 && p.y >= 10 && p.y <= 290), `${d.id}: inside the picture`)
  for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) {
    if (Math.abs(i - j) === 1 || (i === 0 && j === c.length - 1)) continue
    check(!crosses(c[i], c[(i + 1) % c.length], c[j], c[(j + 1) % c.length]), `${d.id}: the outline crosses itself`)
  }
}
for (let level = 1; level <= 3; level++) {
  const [lo, hi] = DOTS_RANGE[level]
  for (let s = 1; s <= SEEDS; s++) {
    const r = makeDotsRound(level, seeded(s * 53 + level)), tag = `dots level ${level} seed ${s} (${r.design.id})`
    check(r.dots.length >= lo - 0 && r.dots.length <= hi && r.dots.length >= r.design.corners.length, `${tag}: ${r.dots.length} dots, wanted ${lo}-${hi}`)
    let nearest = Infinity
    for (let i = 0; i < r.dots.length; i++) for (let j = i + 1; j < r.dots.length; j++) nearest = Math.min(nearest, Math.hypot(r.dots[i].x - r.dots[j].x, r.dots[i].y - r.dots[j].y))
    check(nearest >= 28, `${tag}: two dots only ${nearest.toFixed(0)} apart`)
    // Drawing: a finger is "on" a dot within its reach. The reach is big enough to hit, and never shared by two dots.
    const reach = dotReach(r.dots)
    check(reach >= 13 && reach <= DOT_REACH_MAX && reach * 2 < nearest, `${tag}: reach ${reach.toFixed(1)} with dots ${nearest.toFixed(0)} apart`)
    r.dots.forEach((d, i) => {
      check(dotAt(r.dots, d, reach) === i, `${tag}: dot ${i} is found at its own centre`)
      check(dotAt(r.dots, { x: d.x + reach * 0.9, y: d.y }, reach) === i || nearest < reach * 1.9, `${tag}: dot ${i} is found just inside its edge`)
      const next = r.dots[(i + 1) % r.dots.length]
      check(dotAt(r.dots, { x: (d.x + next.x) / 2, y: (d.y + next.y) / 2 }, reach) === -1, `${tag}: halfway between dots is on neither`)
    })
    check(dotAt(r.dots, { x: -50, y: -50 }, reach) === -1, `${tag}: far from every dot`)
    for (let i = 0; i < r.dots.length; i++) for (let j = i + 1; j < r.dots.length; j++) {
      if (Math.abs(i - j) === 1 || (i === 0 && j === r.dots.length - 1)) continue
      check(!crosses(r.dots[i], r.dots[(i + 1) % r.dots.length], r.dots[j], r.dots[(j + 1) % r.dots.length]), `${tag}: crossing lines`)
    }
  }
}
check(dotReach([{ x: 0, y: 0 }, { x: 300, y: 0 }]) === DOT_REACH_MAX && dotReach([{ x: 0, y: 0 }, { x: 50, y: 0 }]) === 24, 'the reach is capped, and shrinks for close dots')
check(dotAt([{ x: 0, y: 0 }, { x: 40, y: 0 }], { x: 22, y: 0 }, 30) === 1, 'the nearer of two dots is chosen')
check(dotsFor(DESIGNS[0], 4).length === 4 && dotsFor(DESIGNS[0], 9).length === 9, 'dotsFor gives the number asked for')

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('thinking: all rounds sound')
