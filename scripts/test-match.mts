// scripts/test-match.mts
// Checks the Matching Objects generator: every round it can make must be sound.
//
//     node scripts/test-match.mts
//
// Fix the generator, not the instance: this builds thousands of rounds and fails if any has repeated
// objects, a right-hand column that is not the same set as the left, an object on the same row on
// both sides, a drawing that does not exist, or a name that is empty.

import { EXTRA_KINDS, LETTER_SET, MATCH, SAME_SHAPE, WORD_ANIMALS, WORD_COLOURS, WORD_OBJECTS, WORD_SETS, makeLetterMatch, makeMatch, makeWordMatch, nameOf } from '../src/games/match/generate.ts'
import { makeLetter } from '../src/games/trace/letters.ts'
import { THEMES, COLOURS, seeded } from '../src/games/spot/generate.ts'
import { readFileSync } from 'node:fs'

// art.tsx is JSX, which node cannot load here, so the drawings are found by name in its source.
const artSource = readFileSync(new URL('../src/games/spot/art.tsx', import.meta.url), 'utf8')
const ART = new Proxy({} as Record<string, boolean>, { get: (_, k) => artSource.includes(`'${String(k)}':`) })

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 20) console.error('FAIL', what) }

let rounds = 0
for (const t of THEMES) {
  for (let pairs = MATCH.minLen; pairs <= MATCH.maxLen; pairs++) {
    for (let seed = 1; seed <= 400; seed++) {
      const r = makeMatch(t, pairs, seeded(seed * 7919 + pairs))
      rounds++
      const tag = `${t.id} x${pairs} seed ${seed}`
      check(r.left.length === pairs && r.right.length === pairs, `${tag}: wrong number of pairs`)
      check(new Set(r.left.map(i => i.kind)).size === pairs, `${tag}: repeated object`)
      check(new Set(r.left.map(i => i.label)).size === pairs, `${tag}: repeated name`)
      check(r.left.every(i => i.kind.startsWith(t.id + '.')), `${tag}: object from another theme`)
      check([...r.left.map(i => i.id)].sort().join() === [...r.right.map(i => i.id)].sort().join(), `${tag}: columns differ`)
      check(r.right.every((it, i) => it.id !== r.left[i].id), `${tag}: an object on the same row on both sides`)
      check(r.left.every(i => i.label.length > 1 && !!ART[i.kind] && !!COLOURS[i.colour]), `${tag}: missing drawing, name or colour`)
    }
  }
}
// ── Capital and small letters ──
let letterRounds = 0
for (let pairs = MATCH.minLen; pairs <= MATCH.maxLen; pairs++) {
  for (let seed = 1; seed <= 1500; seed++) {
    const r = makeLetterMatch(pairs, seeded(seed * 104729 + pairs))
    letterRounds++
    const tag = `letters x${pairs} seed ${seed}`
    check(r.theme === 'letters' && r.left.length === pairs && r.right.length === pairs, `${tag}: wrong number of pairs`)
    check(r.left.every(i => i.glyph && /^[A-Z]$/.test(i.glyph)), `${tag}: the left column is not all capitals`)
    check(r.right.every(i => i.glyph && /^[a-z]$/.test(i.glyph)), `${tag}: the right column is not all small letters`)
    check(new Set(r.left.map(i => i.glyph)).size === pairs, `${tag}: repeated letter`)
    check([...r.left.map(i => i.id)].sort().join() === [...r.right.map(i => i.id)].sort().join(), `${tag}: columns differ`)
    check(r.left.every(l => r.right.find(x => x.id === l.id)!.glyph === l.glyph!.toLowerCase()), `${tag}: a capital is paired with the wrong small letter`)
    check(r.right.every((it, i) => it.id !== r.left[i].id), `${tag}: a pair on the same row on both sides`)
    check(!(r.left.some(i => i.glyph === 'I') && r.left.some(i => i.glyph === 'L')), `${tag}: I and L in one round`)
    if (pairs <= 3) check(r.left.every(i => SAME_SHAPE.includes(i.glyph!)), `${tag}: a short round has a hard pair`)
    if (pairs === 4) check(r.left.filter(i => SAME_SHAPE.includes(i.glyph!)).length >= 2, `${tag}: four pairs need two easy ones`)
    check(r.left.every(i => i.label.startsWith('capital ')) && r.right.every(i => i.label.startsWith('small ')), `${tag}: names`)
  }
}
// Every letter can be drawn, and across many rounds every letter turns up in the longer rounds.
for (const c of LETTER_SET) check(makeLetter(c).strokes.length > 0 && makeLetter(c.toLowerCase()).strokes.length > 0, `${c}: no strokes`)
const seen = new Set<string>()
for (let i = 0; i < 400; i++) for (const it of makeLetterMatch(6, seeded(i + 5)).left) seen.add(it.glyph!)
check(seen.size === 26, `six-pair rounds reach every letter (saw ${seen.size})`)
check(makeLetterMatch(1).left.length === MATCH.minLen && makeLetterMatch(99).left.length === MATCH.maxLen, 'letter sizes are clamped')

// ── Words to pictures ──
const colourOf: Record<string, string> = { ...EXTRA_KINDS }
for (const t of THEMES) Object.assign(colourOf, t.kinds)
let wordRounds = 0
for (const set of WORD_SETS) {
  const pool = set === 'words-colours' ? WORD_COLOURS.map(c => c.word) : (set === 'words-animals' ? WORD_ANIMALS : WORD_OBJECTS).map(o => o.word)
  for (let pairs = MATCH.minLen; pairs <= MATCH.maxLen; pairs++) {
    for (let seed = 1; seed <= 800; seed++) {
      const r = makeWordMatch(set, pairs, colourOf, seeded(seed * 15485863 + pairs))
      wordRounds++
      const tag = `${set} x${pairs} seed ${seed}`
      check(r.theme === set && r.left.length === pairs && r.right.length === pairs, `${tag}: wrong number of pairs`)
      check(r.left.every(i => i.word && pool.includes(i.word)), `${tag}: a word from outside the set`)
      check(new Set(r.left.map(i => i.word)).size === pairs, `${tag}: repeated word`)
      check(new Set(r.left.map(i => i.word![0])).size === pairs, `${tag}: two words start with the same letter`)
      check([...r.left.map(i => i.id)].sort().join() === [...r.right.map(i => i.id)].sort().join(), `${tag}: columns differ`)
      check(r.left.every(l => r.right.find(x => x.id === l.id)!.label === l.word), `${tag}: a word paired with the wrong picture`)
      check(r.right.every((it, i) => it.id !== r.left[i].id), `${tag}: a pair on the same row on both sides`)
      check(r.right.every(i => !i.word && (i.kind.startsWith('swatch.') ? !!COLOURS[i.colour] : !!ART[i.kind] && !!COLOURS[i.colour])), `${tag}: a picture with no drawing or colour`)
    }
  }
}
// Every word and picture in the sets exists and nothing is named twice.
for (const list of [WORD_OBJECTS, WORD_ANIMALS]) {
  check(new Set(list.map(o => o.word)).size === list.length, 'a word is used twice in a set')
  check(new Set(list.map(o => o.kind)).size === list.length, 'a drawing is used twice in a set')
  for (const o of list) check(!!ART[o.kind] && o.word.length > 1, `${o.kind}: no drawing or word`)
}
check(WORD_OBJECTS.every(o => !WORD_ANIMALS.some(a => a.word === o.word || a.kind === o.kind)), 'objects and animals share a word or drawing')
check(WORD_COLOURS.every(c => !!COLOURS[c.key]) && new Set(WORD_COLOURS.map(c => c.key)).size === WORD_COLOURS.length, 'colours')
check(Object.keys(EXTRA_KINDS).every(k => !!ART[k]), 'every extra animal is drawn')

// Every drawing of every theme can be named and drawn.
for (const t of THEMES) for (const k of Object.keys(t.kinds)) check(!!ART[k] && nameOf(k).length > 1, `${k}: no drawing or name`)
// Out-of-range sizes are kept in range.
check(makeMatch(THEMES[0], 1).left.length === MATCH.minLen && makeMatch(THEMES[0], 99).left.length === MATCH.maxLen, 'sizes are clamped')
// Without a seed it still works, and not always in the same order.
const orders = new Set(Array.from({ length: 60 }, () => makeMatch(THEMES[1], 4).right.map(i => i.id).join()))
check(orders.size > 3, 'orders vary')

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log(`match: ${rounds} picture rounds, ${letterRounds} letter rounds and ${wordRounds} word rounds, all checks passed`)
