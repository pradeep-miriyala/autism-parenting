// Trace the Letters and Numbers: the alphabet, capital and small, and the digits 0 to 9, as strokes.
//
// Each letter is drawn the way it is taught: strokes in order, tops before bottoms, left
// before right, and round letters starting at the top and going anticlockwise. Plain print
// forms (a and g with one storey), because those are what a child sees in a book.
//
// Letters are laid out in a box 200 high from the top line to the baseline (capitals fill
// it), with the small letters' height at 70 down from the top line and descenders reaching
// 270. makeLetter() scales and centres that onto the 400 x 300 picture, with faint writing
// lines behind it. Dependency-free on purpose (its two helpers are repeated here so the test
// script can import it directly).

import type { Pt, Shape } from './shapes.ts'

type P = [number, number]

/** A path through corner points, densely sampled. */
function line(...pts: P[]): Pt[] {
  const out: Pt[] = []
  for (let k = 1; k < pts.length; k++) {
    const [ax, ay] = pts[k - 1], [bx, by] = pts[k]
    const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 4))
    for (let i = k === 1 ? 0 : 1; i <= n; i++) out.push({ x: ax + ((bx - ax) * i) / n, y: ay + ((by - ay) * i) / n })
  }
  return out
}

/** An arc of an ellipse. Angles in degrees: 0 is right, 90 is down, 270 (or -90) is up. */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Pt[] {
  const n = Math.max(8, Math.round((Math.abs(a1 - a0) * Math.PI / 180) * (rx + ry) / 2 / 3))
  return Array.from({ length: n + 1 }, (_, i) => {
    const th = (a0 + ((a1 - a0) * i) / n) * Math.PI / 180
    return { x: cx + rx * Math.cos(th), y: cy + ry * Math.sin(th) }
  })
}

/** A smooth curve from p0 to p1, bent towards the two control points. */
function bez(p0: P, c1: P, c2: P, p1: P): Pt[] {
  return Array.from({ length: 41 }, (_, i) => {
    const t = i / 40, u = 1 - t
    return {
      x: u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
      y: u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1],
    }
  })
}

/** Strokes drawn one after another without lifting: the next picks up where the last ended. */
const join = (...parts: Pt[][]): Pt[] => parts.flatMap((p, i) => (i === 0 ? p : p.slice(1)))

// ── capitals ───────────────────────────────────────────────────────────────────
const UPPER: Record<string, Pt[][]> = {
  A: [line([50, 0], [0, 200]), line([50, 0], [100, 200]), line([20, 135], [80, 135])],
  B: [
    line([0, 0], [0, 200]),
    join(line([0, 0], [38, 0]), arc(38, 48, 44, 48, -90, 90), line([38, 96], [0, 96])),
    join(line([0, 102], [46, 102]), arc(46, 151, 46, 49, -90, 90), line([46, 200], [0, 200])),
  ],
  C: [arc(52, 100, 52, 100, -40, -320)],
  D: [line([0, 0], [0, 200]), join(line([0, 0], [35, 0]), arc(35, 100, 58, 100, -90, 90), line([35, 200], [0, 200]))],
  E: [line([0, 0], [0, 200]), line([0, 0], [80, 0]), line([0, 100], [65, 100]), line([0, 200], [80, 200])],
  F: [line([0, 0], [0, 200]), line([0, 0], [75, 0]), line([0, 100], [60, 100])],
  G: [join(arc(55, 100, 55, 100, -40, -360), line([110, 100], [62, 100]))],
  H: [line([0, 0], [0, 200]), line([95, 0], [95, 200]), line([0, 100], [95, 100])],
  I: [line([5, 0], [55, 0]), line([30, 0], [30, 200]), line([5, 200], [55, 200])],
  J: [join(line([50, 0], [50, 150]), arc(25, 150, 25, 50, 0, 180))],
  K: [line([0, 0], [0, 200]), line([92, 0], [4, 108]), line([32, 74], [95, 200])],
  L: [join(line([0, 0], [0, 200]), line([0, 200], [70, 200]))],
  M: [line([0, 200], [0, 0]), line([0, 0], [65, 150]), line([65, 150], [130, 0]), line([130, 0], [130, 200])],
  N: [line([0, 200], [0, 0]), line([0, 0], [100, 200]), line([100, 200], [100, 0])],
  O: [arc(57, 100, 57, 100, -90, -450)],
  P: [line([0, 0], [0, 200]), join(line([0, 0], [38, 0]), arc(38, 50, 48, 50, -90, 90), line([38, 100], [0, 100]))],
  Q: [arc(57, 100, 57, 100, -90, -450), line([68, 138], [112, 204])],
  R: [
    line([0, 0], [0, 200]),
    join(line([0, 0], [38, 0]), arc(38, 50, 48, 50, -90, 90), line([38, 100], [0, 100])),
    line([44, 100], [92, 200]),
  ],
  S: [join(arc(45, 50, 40, 50, -30, -270), arc(45, 150, 44, 50, -90, 150))],
  T: [line([0, 0], [100, 0]), line([50, 0], [50, 200])],
  U: [join(line([0, 0], [0, 140]), arc(47, 140, 47, 60, 180, 0), line([94, 140], [94, 0]))],
  V: [line([0, 0], [50, 200], [100, 0])],
  W: [line([0, 0], [38, 200], [75, 50], [112, 200], [150, 0])],
  X: [line([0, 0], [100, 200]), line([100, 0], [0, 200])],
  Y: [line([0, 0], [50, 105]), line([100, 0], [50, 105], [50, 200])],
  Z: [line([0, 0], [90, 0], [0, 200], [90, 200])],
}

// ── numbers ────────────────────────────────────────────────────────────────────
// The same height as the capitals. 8 is two stacked rings, upper first, each from the top.
const DIGITS: Record<string, Pt[][]> = {
  '0': [arc(45, 100, 45, 100, -90, -450)],
  '1': [line([8, 42], [50, 0], [50, 200])],
  '2': [join(arc(45, 55, 42, 55, -160, 40), line([77, 90], [0, 200], [90, 200]))],
  '3': [join(arc(42, 50, 40, 50, -150, 90), arc(42, 150, 46, 50, -90, 150))],
  '4': [line([70, 0], [0, 140], [95, 140]), line([70, 0], [70, 200])],
  '5': [join(line([78, 0], [12, 0], [17, 100]), arc(42, 145, 44, 55, -125, 140))],
  '6': [join(bez([80, 8], [25, 25], [2, 95], [2, 140]), arc(45, 140, 43, 60, 180, 540))],
  '7': [line([0, 0], [85, 0], [30, 200])],
  '8': [arc(45, 50, 36, 50, -90, -450), arc(45, 150, 42, 50, -90, -450)],
  '9': [join(arc(45, 60, 43, 60, 0, -360), bez([88, 60], [88, 125], [78, 180], [15, 198]))],
}

// ── small letters ──────────────────────────────────────────────────────────────
// The round body of a, b, d, g, p and q: centre (45, 135), 90 wide, from the small letters' top (70) to the baseline.
const body = (a0: number, a1: number) => arc(45, 135, 45, 65, a0, a1)
const LOWER: Record<string, Pt[][]> = {
  a: [body(-40, -400), line([90, 70], [90, 200])],
  b: [line([0, 0], [0, 200]), body(180, 540)],
  c: [arc(47, 135, 43, 65, -40, -320)],
  d: [body(-40, -400), line([90, 0], [90, 200])],
  e: [join(line([0, 135], [90, 135]), arc(45, 135, 45, 65, 0, -320))],
  f: [join(arc(70, 40, 40, 40, -25, -180), line([30, 40], [30, 200])), line([5, 72], [62, 72])],
  g: [body(-40, -400), join(line([90, 70], [90, 235]), arc(45, 235, 45, 35, 0, 160))],
  h: [line([0, 0], [0, 200]), join(arc(42, 125, 42, 55, 180, 360), line([84, 125], [84, 200]))],
  i: [line([10, 70], [10, 200]), line([10, 28], [10, 42])],
  j: [join(line([30, 70], [30, 235]), arc(0, 235, 30, 35, 0, 160)), line([30, 28], [30, 42])],
  k: [line([0, 0], [0, 200]), line([75, 70], [4, 142]), line([28, 114], [85, 200])],
  l: [line([10, 0], [10, 200])],
  m: [
    line([0, 70], [0, 200]),
    join(arc(32, 115, 32, 45, 180, 360), line([64, 115], [64, 200])),
    join(arc(96, 115, 32, 45, 180, 360), line([128, 115], [128, 200])),
  ],
  n: [line([0, 70], [0, 200]), join(arc(42, 115, 42, 45, 180, 360), line([84, 115], [84, 200]))],
  o: [arc(47, 135, 47, 65, -90, -450)],
  p: [line([0, 70], [0, 270]), body(180, 540)],
  q: [body(-40, -400), line([90, 70], [90, 270])],
  r: [line([0, 70], [0, 200]), arc(40, 115, 40, 45, 180, 300)],
  s: [join(arc(38, 102, 34, 32, -30, -270), arc(38, 168, 36, 33, -90, 150))],
  t: [join(line([30, 12], [30, 168]), arc(55, 168, 25, 32, 180, 100)), line([5, 72], [60, 72])],
  u: [join(line([0, 70], [0, 150]), arc(42, 150, 42, 50, 180, 0)), line([84, 70], [84, 200])],
  v: [line([0, 70], [47, 200], [95, 70])],
  w: [line([0, 70], [32, 200], [65, 100], [98, 200], [130, 70])],
  x: [line([0, 70], [90, 200]), line([90, 70], [0, 200])],
  y: [line([0, 70], [45, 200]), line([90, 70], [38, 225], [8, 268])],
  z: [line([0, 70], [80, 70], [0, 200], [80, 200])],
}

export type LetterCase = 'upper' | 'lower' | 'both' | 'numbers'

/** The faint writing lines behind a letter, as y positions in the 400 x 300 picture. */
const SCALE = 0.8
const BASELINE = 225
const TOP = BASELINE - 200 * SCALE
const SMALL = BASELINE - 130 * SCALE
const RULES_UPPER = [TOP, BASELINE]
const RULES_LOWER = [TOP, SMALL, BASELINE]

export const LETTER_TOLERANCE = 21

export function allLetters(): string[] {
  return [...Object.keys(UPPER), ...Object.keys(LOWER)]
}

/** Every letter and every digit. */
export function allCharacters(): string[] {
  return [...allLetters(), ...Object.keys(DIGITS)]
}

// ── How much of a letter to trace ──
//
// Children know the alphabet in order, so the letters always come in that order (see letterSequence).
// What changes with the level is how much of each letter is asked for: at level 1 just the start of it
// (its first stroke, or the first half of a single curve), at level 2 most of it, at level 3 all of it.
// The whole letter is always shown, faintly, so the child can see what it is part of; only the part to
// trace has the dotted line. Tracing more than the part is fine.

export const MIN_LETTER_LEVEL = 1
export const MAX_LETTER_LEVEL = 3
export const PORTIONS: Record<number, number> = { 1: 0.5, 2: 0.75, 3: 1 }
export const portionFor = (level: number) => PORTIONS[Math.min(MAX_LETTER_LEVEL, Math.max(MIN_LETTER_LEVEL, Math.round(level)))]

const len = (s: Pt[]) => s.slice(1).reduce((n, p, i) => n + Math.hypot(p.x - s[i].x, p.y - s[i].y), 0)

/** The first `length` units of a stroke. */
function prefixStroke(stroke: Pt[], length: number): Pt[] {
  const out: Pt[] = [stroke[0]]
  let left = length
  for (let i = 1; i < stroke.length; i++) {
    const a = stroke[i - 1], b = stroke[i], seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (seg >= left) {
      const t = seg === 0 ? 0 : left / seg
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
      return out
    }
    out.push(b)
    left -= seg
  }
  return out
}

/**
 * About `fraction` of the letter's line, in the order it is drawn: whole strokes from the first while they
 * fit (a little over is allowed, so a stroke is not left a few units short); then, if the next stroke does not
 * fit but about the right amount is still wanted, the first part of it. A single long stroke (a C, an S, a 6)
 * is cut the same way, so every level asks for roughly what it says.
 */
export function partOfStrokes(strokes: Pt[][], fraction: number): Pt[][] {
  if (fraction >= 1) return strokes
  const total = strokes.reduce((n, s) => n + len(s), 0)
  const want = total * fraction
  const slack = total * 0.1
  const out: Pt[][] = []
  let used = 0
  for (const s of strokes) {
    const l = len(s)
    const remaining = want - used
    if (remaining <= total * 0.05) break
    if (l <= remaining + slack) { out.push(s); used += l; continue }
    if (out.length === 0 || remaining >= 0.4 * l) out.push(prefixStroke(s, remaining))
    break
  }
  return out
}

/** Letters come in alphabet order, always: A to Z, a to z, 0 to 9, and for both a capital then its small form. */
export function letterSequence(which: LetterCase = 'both'): string[] {
  const upper = Object.keys(UPPER).sort(), lower = Object.keys(LOWER).sort(), digits = Object.keys(DIGITS).sort()
  if (which === 'numbers') return digits
  if (which === 'upper') return upper
  if (which === 'lower') return lower
  return upper.flatMap(c => [c, c.toLowerCase()].filter(x => x === c || x in LOWER))
}

/** The one after `last` in the order, going back to the first after the last; the first if `last` is not in it. */
export function nextInSequence(seq: string[], last?: string): string {
  const i = last === undefined ? -1 : seq.indexOf(last)
  return seq[(i + 1) % seq.length]
}

/** A letter or number, whole or (with a `fraction` below 1) just the start of it, with the whole kept in `full`. */
export function makeLetter(ch: string, fraction = 1): Shape {
  const digit = ch in DIGITS
  const upper = !digit && ch in UPPER && ch === ch.toUpperCase()
  const raw = digit ? DIGITS[ch] : upper ? UPPER[ch] : LOWER[ch]
  if (!raw) throw new Error(`no such letter or number: ${ch}`)
  const all = raw.flat()
  const minX = Math.min(...all.map(p => p.x)), maxX = Math.max(...all.map(p => p.x))
  const dx = 200 - ((minX + maxX) / 2) * SCALE
  const strokes = raw.map(s => s.map(p => ({ x: dx + p.x * SCALE, y: BASELINE + (p.y - 200) * SCALE })))
  const part = partOfStrokes(strokes, fraction)
  return {
    kind: ch,
    label: digit ? `the number ${ch}` : `the ${upper ? 'capital' : 'small'} letter ${ch}`,
    strokes: part,
    ...(fraction < 1 ? { full: strokes } : {}),
    tolerance: LETTER_TOLERANCE,
    rules: upper || digit ? RULES_UPPER : RULES_LOWER,
  }
}
