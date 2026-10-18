// scripts/test-shapes.mts
// Checks Colours and shapes: every question has exactly one right answer (so a child is never told "wrong" for a choice
// that fits), the choices are all different, each level asks what it says it asks, and the words are right.
//
//     node scripts/test-shapes.mts

import { SHAPES, SHAPES_OPTIONS, SHAPES_QUESTIONS, SHAPE_COLOURS, makeShapesRound, shapesOptionCount } from '../src/games/thinking/rounds.ts'
import { seeded } from '../src/games/spot/generate.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 25) console.error('FAIL', what) }
const SEEDS = 800
const word = (k: string) => SHAPE_COLOURS.find(c => c.key === k)!.word

check(Object.values(SHAPES_OPTIONS).join() === '3,4,6' && SHAPES_QUESTIONS === 5, 'three, four and six choices; five questions')
check(shapesOptionCount(0) === 3 && shapesOptionCount(9) === 6 && shapesOptionCount(1.6) === 4, 'a level outside 1 to 3 is held to the nearest')
check(SHAPE_COLOURS.length >= 6 && SHAPES.length >= 4, 'enough colours and shapes for the hardest round')

const seenAsk = new Set<string>()
for (let level = 1; level <= 3; level++) {
  const n = shapesOptionCount(level)
  for (let s = 1; s <= SEEDS; s++) {
    const r = makeShapesRound(level, seeded(s * 11 + level)), tag = `level ${level} seed ${s}`
    check(r.length === SHAPES_QUESTIONS, `${tag}: ${r.length} questions`)
    r.forEach((q, i) => {
      const t = `${tag} q${i + 1} "${q.prompt}"`
      seenAsk.add(`${level}:${q.ask}`)
      check(q.options.length === n, `${t}: ${q.options.length} choices`)
      check(new Set(q.options.map(o => o.id)).size === n, `${t}: every choice is different`)
      check(q.options.every(o => (SHAPES as readonly string[]).includes(o.shape) && SHAPE_COLOURS.some(c => c.key === o.colour) && o.word === `${word(o.colour)} ${o.shape}`), `${t}: valid shapes, colours and words`)
      // the right answer fits what was asked, and nothing else does
      const fits = (o: { shape: string; colour: string }) =>
        (q.ask === 'colour' ? o.colour === q.colour : q.ask === 'shape' ? o.shape === q.shape : o.shape === q.shape && o.colour === q.colour)
      const right = q.options.map((o, k) => (fits(o) ? k : -1)).filter(k => k >= 0)
      check(right.length === 1 && right[0] === q.answer, `${t}: the answer is the only one that fits (${right})`)
      // the words match what is asked
      const expect = q.ask === 'colour' ? `Find the ${word(q.colour!)} one.` : q.ask === 'shape' ? `Find the ${q.shape}.` : `Find the ${word(q.colour!)} ${q.shape}.`
      check(q.prompt === expect, `${t}: the prompt says what is asked`)
      check(i === 0 || q.prompt !== r[i - 1].prompt, `${t}: not the same question twice in a row`)
      // what each level changes
      if (level === 1) {
        if (q.ask === 'colour') check(q.options.every(o => o.shape === q.options[0].shape) && new Set(q.options.map(o => o.colour)).size === n, `${t}: only the colour changes`)
        else check(q.options.every(o => o.colour === q.options[0].colour) && new Set(q.options.map(o => o.shape)).size === n, `${t}: only the shape changes`)
      }
      if (level === 2) check(new Set(q.options.map(o => o.shape)).size === n && new Set(q.options.map(o => o.colour)).size === n, `${t}: no two share a colour or a shape`)
      if (level === 3) {
        check(q.ask === 'both', `${t}: asks for colour and shape together`)
        const a = q.options[q.answer]
        check(q.options.filter(o => o.shape === a.shape && o.id !== a.id).length === 2 && q.options.filter(o => o.colour === a.colour && o.id !== a.id).length === 2, `${t}: two look-alikes by shape and two by colour`)
      }
    })
  }
}
check(seenAsk.has('1:colour') && seenAsk.has('1:shape') && seenAsk.has('2:colour') && seenAsk.has('2:shape') && seenAsk.has('3:both'), 'levels 1 and 2 ask about colour and about shape; level 3 about both')
// the right answer is not always in the same place
for (let level = 1; level <= 3; level++) {
  const spots = new Set<number>()
  for (let s = 1; s <= 60; s++) makeShapesRound(level, seeded(s)).forEach(q => spots.add(q.answer))
  check(spots.size === shapesOptionCount(level), `level ${level}: the answer lands in every position`)
}

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('shapes: all checks passed')
