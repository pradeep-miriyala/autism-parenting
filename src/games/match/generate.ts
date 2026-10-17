// Matching Objects: the round generator.
//
// A round is a set of objects shown twice, once down the left and once down the right, the
// right-hand column in a different order. The pictures are the same drawings Spot the Differences
// uses, so the games look alike. The order is made so that no object sits on the same row on both
// sides: every line has to cross over, and there is never a pair that is already side by side.
// If a round is ever wrong, fix this file, not one round: scripts/test-match.mts checks thousands.
//
// Dependency-free on purpose.

import type { ThemeId } from '../spot/generate.ts'

/**
 * `colour` is the key of the drawing's colour in spot's COLOURS (its first listed colour).
 * A letter has a `glyph` (the character to draw, in the same strokes the tracing game uses) and no colour.
 */
export type MatchItem = { id: number; kind: string; label: string; colour: string; glyph?: string; word?: string }
/** What a round needs of a theme: its id and its drawings, each with the colours it may be drawn in. */
export type MatchTheme = { id: ThemeId; kinds: Record<string, string> }
export const WORD_SETS = ['words-objects', 'words-animals', 'words-colours'] as const
export type WordSet = (typeof WORD_SETS)[number]
export type MatchSet = ThemeId | 'letters' | WordSet
export type MatchRound = { theme: MatchSet; left: MatchItem[]; right: MatchItem[] }

export const MATCH = { minLen: 2, maxLen: 6, defaultLen: 3 }

// The plain name of a drawing, said aloud and read by screen readers. Most are just the word after the dot.
const NAMES: Record<string, string> = {
  'sea.star': 'starfish', 'sea.jelly': 'jellyfish', 'sea.weed': 'seaweed', 'farm.hay': 'haystack',
  'town.light': 'traffic light', 'town.bike': 'bicycle', 'town.shop': 'shop', 'home.teddy': 'teddy bear',
}
export const nameOf = (kind: string) => NAMES[kind] ?? kind.split('.')[1]

function shuffle<T>(a: T[], rand: () => number): T[] {
  const out = a.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const clampPairs = (pairs: number) => Math.max(MATCH.minLen, Math.min(MATCH.maxLen, Math.round(pairs)))

/** The right-hand column: the same items in another order, with none left on the row it started on. */
function other(left: MatchItem[], right: MatchItem[], rand: () => number): MatchItem[] {
  const n = left.length
  const stays = (r: MatchItem[]) => r.some((it, i) => it.id === left[i].id)
  let out = shuffle(right, rand)
  // Try a few shuffles for one with no item left where it was; for six or fewer a rotation is the fallback.
  for (let tries = 0; tries < 50 && stays(out); tries++) out = shuffle(right, rand)
  if (stays(out)) out = left.map((l, i) => right.find(r => r.id === left[(i + 1) % n].id)!)
  return out
}

/** `pairs` different objects from the theme, shown in two columns; nothing on the same row twice. */
export function makeMatch(t: MatchTheme, pairs: number, rand: () => number = Math.random): MatchRound {
  const n = clampPairs(pairs)
  const kinds = shuffle(Object.keys(t.kinds), rand).slice(0, n)
  const left: MatchItem[] = kinds.map((kind, i) => ({
    id: i, kind, label: nameOf(kind), colour: t.kinds[kind][0],
  }))
  return { theme: t.id, left, right: other(left, left, rand) }
}

// ── Capital and small letters: capitals down the left, the same letters small down the right ──

export const LETTER_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
/** Letters whose small form is just a smaller capital: the easy ones, used first for short rounds. */
export const SAME_SHAPE = 'CKOPSUVWXYZ'

/**
 * A round of capital and small letters. Short rounds (up to three pairs) use only the letters whose small
 * form looks like the capital; four pairs have at least two of those; longer rounds can have any. A
 * capital I and a small l look the same in plain print, so a round never has both an I and an L.
 */
export function makeLetterMatch(pairs: number, rand: () => number = Math.random): MatchRound {
  const n = clampPairs(pairs)
  const easy = shuffle(SAME_SHAPE.split(''), rand)
  const hard = shuffle(LETTER_SET.split('').filter(c => !SAME_SHAPE.includes(c)), rand)
  const wantEasy = n <= 3 ? n : n === 4 ? 2 : 0
  const pool = [...easy.slice(0, wantEasy), ...shuffle([...easy.slice(wantEasy), ...(n <= 3 ? [] : hard)], rand)]
  const chosen: string[] = []
  for (const c of pool) {
    if (chosen.length === n) break
    if ((c === 'I' && chosen.includes('L')) || (c === 'L' && chosen.includes('I'))) continue
    chosen.push(c)
  }
  const left: MatchItem[] = chosen.map((c, i) => ({ id: i, kind: `letter.${c}`, label: `capital ${c}`, colour: '', glyph: c }))
  const small: MatchItem[] = chosen.map((c, i) => ({ id: i, kind: `letter.${c.toLowerCase()}`, label: `small ${c.toLowerCase()}`, colour: '', glyph: c.toLowerCase() }))
  return { theme: 'letters', left, right: other(left, small, rand) }
}

// ── Words to pictures: the word down the left, its picture down the right ──

/** Drawings that exist only for this game, with the colour key the drawing is given (see spot's COLOURS). */
export const EXTRA_KINDS: Record<string, string> = {
  'animal.dog': 'o', 'animal.cat': 'y', 'animal.duck': 'y', 'animal.rabbit': 'k', 'animal.sheep': 'b', 'animal.elephant': 'b',
}

/** Things: one drawing per name (the two lamps and two clocks are not both here, and a tree is one tree). */
export const WORD_OBJECTS: { kind: string; word: string }[] = [
  { kind: 'farm.barn', word: 'barn' }, { kind: 'farm.tree', word: 'tree' }, { kind: 'farm.tractor', word: 'tractor' },
  { kind: 'farm.flower', word: 'flower' }, { kind: 'farm.hay', word: 'haystack' },
  { kind: 'sea.boat', word: 'boat' }, { kind: 'sea.shell', word: 'shell' }, { kind: 'sea.weed', word: 'seaweed' },
  { kind: 'town.house', word: 'house' }, { kind: 'town.car', word: 'car' }, { kind: 'town.bus', word: 'bus' },
  { kind: 'town.light', word: 'traffic light' }, { kind: 'town.lamp', word: 'street lamp' }, { kind: 'town.bike', word: 'bicycle' },
  { kind: 'town.shop', word: 'shop' },
  { kind: 'school.book', word: 'book' }, { kind: 'school.pencil', word: 'pencil' }, { kind: 'school.bag', word: 'bag' },
  { kind: 'school.ruler', word: 'ruler' }, { kind: 'school.clock', word: 'clock' }, { kind: 'school.globe', word: 'globe' },
  { kind: 'school.apple', word: 'apple' }, { kind: 'school.bell', word: 'bell' },
  { kind: 'home.sofa', word: 'sofa' }, { kind: 'home.lamp', word: 'lamp' }, { kind: 'home.bed', word: 'bed' },
  { kind: 'home.cup', word: 'cup' }, { kind: 'home.plant', word: 'plant' }, { kind: 'home.chair', word: 'chair' },
  { kind: 'home.teddy', word: 'teddy bear' },
]

export const WORD_ANIMALS: { kind: string; word: string }[] = [
  { kind: 'farm.cow', word: 'cow' }, { kind: 'farm.pig', word: 'pig' }, { kind: 'farm.hen', word: 'hen' },
  { kind: 'sea.fish', word: 'fish' }, { kind: 'sea.crab', word: 'crab' }, { kind: 'sea.octopus', word: 'octopus' },
  { kind: 'sea.star', word: 'starfish' }, { kind: 'sea.jelly', word: 'jellyfish' },
  { kind: 'animal.dog', word: 'dog' }, { kind: 'animal.cat', word: 'cat' }, { kind: 'animal.duck', word: 'duck' },
  { kind: 'animal.rabbit', word: 'rabbit' }, { kind: 'animal.sheep', word: 'sheep' }, { kind: 'animal.elephant', word: 'elephant' },
]

/** The colour word and the key of its colour in spot's COLOURS. pink and purple share a first letter. */
export const WORD_COLOURS: { word: string; key: string }[] = [
  { word: 'red', key: 'r' }, { word: 'blue', key: 'b' }, { word: 'green', key: 'g' }, { word: 'yellow', key: 'y' },
  { word: 'orange', key: 'o' }, { word: 'purple', key: 'p' }, { word: 'pink', key: 'k' },
]

/** `n` items with different first letters, so a child can use the first letter; only repeats if there is no choice. */
function distinctFirst<T extends { word: string }>(pool: T[], n: number, rand: () => number): T[] {
  const picked: T[] = []
  const used = new Set<string>()
  for (const it of shuffle(pool, rand)) {
    if (picked.length === n) break
    if (!used.has(it.word[0])) { picked.push(it); used.add(it.word[0]) }
  }
  for (const it of shuffle(pool, rand)) {
    if (picked.length === n) break
    if (!picked.includes(it)) picked.push(it)
  }
  return picked
}

/**
 * A round of words and pictures: `pairs` words down the left, their pictures down the right in another
 * order. `colourOf` gives the colour key a drawing is made in (spot's themes and EXTRA_KINDS together).
 */
export function makeWordMatch(set: WordSet, pairs: number, colourOf: Record<string, string>, rand: () => number = Math.random): MatchRound {
  const n = clampPairs(pairs)
  const left: MatchItem[] = []
  const right: MatchItem[] = []
  if (set === 'words-colours') {
    distinctFirst(WORD_COLOURS, n, rand).forEach((c, i) => {
      left.push({ id: i, kind: `word.${c.word}`, label: c.word, colour: '', word: c.word })
      right.push({ id: i, kind: `swatch.${c.word}`, label: c.word, colour: c.key })
    })
  } else {
    distinctFirst(set === 'words-animals' ? WORD_ANIMALS : WORD_OBJECTS, n, rand).forEach((o, i) => {
      left.push({ id: i, kind: `word.${o.word}`, label: o.word, colour: '', word: o.word })
      right.push({ id: i, kind: o.kind, label: o.word, colour: (colourOf[o.kind] ?? EXTRA_KINDS[o.kind] ?? 'y')[0] })
    })
  }
  return { theme: set, left, right: other(left, right, rand) }
}
