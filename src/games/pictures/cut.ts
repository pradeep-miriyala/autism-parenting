// Cutting a photo into jigsaw pieces. Pure geometry with no browser code, so scripts/test-jigsaw.mts can check
// every cut. The picture is cut on a grid; every inner edge gets a random knob (or hole), a little different each
// round. Two neighbours share one curve, so they always fit. Border edges are straight.
//
// Units: the picture is `w` by `h` (the game uses 400 by 300). A piece is named by its number, counted across
// then down. The table is the board at the top, with a shelf of loose pieces under it.

export type Rand = () => number
export type Pt = { x: number; y: number }
/** One cubic curve: two control points and where it ends. A straight edge is a cubic too, so every edge reads alike. */
export type Seg = { c1: Pt; c2: Pt; p: Pt }
export type Chain = { start: Pt; segs: Seg[] }

/** How far a knob can reach out from its edge, as a share of the edge's length. The tests check it. */
export const KNOB_REACH = 0.3
const JITTER = 0.04

/** One knob. `sgn` says which side of the edge it sticks out on; the rest are small random changes of its shape. */
export type Knob = { sgn: 1 | -1; t: number; a: number; b: number; c: number; d: number; e: number }

export type Cut = {
  cols: number
  rows: number
  /** h[r][c]: the edge under the piece in column c, row r. null when the edges are plain. */
  h: (Knob | null)[][]
  /** v[r][c]: the edge to the right of the piece in column c, row r. */
  v: (Knob | null)[][]
}

export const PHOTO_GRID: Record<number, { cols: number; rows: number }> = {
  1: { cols: 2, rows: 2 }, 2: { cols: 3, rows: 2 }, 3: { cols: 3, rows: 3 }, 4: { cols: 4, rows: 3 },
  5: { cols: 6, rows: 4 }, 6: { cols: 6, rows: 6 },
}
export const photoGrid = (level: number) => PHOTO_GRID[Math.min(6, Math.max(1, Math.round(level)))]

function makeKnob(rand: Rand): Knob {
  const j = () => (rand() * 2 - 1) * JITTER
  return { sgn: rand() < 0.5 ? 1 : -1, t: 0.075 + rand() * 0.015, a: j(), b: j(), c: j(), d: j(), e: j() }
}

export function makeCut(cols: number, rows: number, plain: boolean, rand: Rand = Math.random): Cut {
  const edge = () => (plain ? null : makeKnob(rand))
  return {
    cols, rows,
    h: Array.from({ length: Math.max(0, rows - 1) }, () => Array.from({ length: cols }, edge)),
    v: Array.from({ length: rows }, () => Array.from({ length: Math.max(0, cols - 1) }, edge)),
  }
}

const lerp = (p: Pt, q: Pt, f: number): Pt => ({ x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f })

/** The edge from P to Q as three curves; a plain edge is one curve that happens to be straight. */
function edgeSegs(P: Pt, Q: Pt, k: Knob | null): Seg[] {
  if (!k) return [{ c1: lerp(P, Q, 1 / 3), c2: lerp(P, Q, 2 / 3), p: Q }]
  const L = Math.hypot(Q.x - P.x, Q.y - P.y)
  const ux = (Q.x - P.x) / L, uy = (Q.y - P.y) / L
  const nx = -uy * k.sgn, ny = ux * k.sgn
  const at = (l: number, w: number): Pt => ({ x: P.x + (ux * l + nx * w) * L, y: P.y + (uy * l + ny * w) * L })
  const { t, a, b, c, d, e } = k
  return [
    { c1: at(0.2, a), c2: at(0.5 + b + d, -t + c), p: at(0.5 - t + b, t + c) },
    { c1: at(0.5 - 2 * t + b - d, 3 * t + c), c2: at(0.5 + 2 * t + b - d, 3 * t + d), p: at(0.5 + t + b, t + c) },
    { c1: at(0.5 + b + d, -t + c), c2: at(0.8, e), p: Q },
  ]
}

function reversed(P: Pt, segs: Seg[]): Chain {
  const pts = [P, ...segs.map(s => s.p)]
  return {
    start: pts[segs.length],
    segs: segs.map((_, i) => {
      const s = segs[segs.length - 1 - i]
      return { c1: s.c2, c2: s.c1, p: pts[segs.length - 1 - i] }
    }),
  }
}

export type Side = 'top' | 'right' | 'bottom' | 'left'

/** One side of a piece, walked clockwise (top left to right, right downwards, bottom right to left, left upwards). */
export function sideOf(cut: Cut, index: number, side: Side, w: number, h: number): Chain {
  const { cols, rows } = cut
  const c = index % cols, r = Math.floor(index / cols)
  const cw = w / cols, ch = h / rows
  const x0 = c * cw, y0 = r * ch, x1 = x0 + cw, y1 = y0 + ch
  if (side === 'top') {
    const P = { x: x0, y: y0 }, Q = { x: x1, y: y0 }
    return { start: P, segs: edgeSegs(P, Q, r === 0 ? null : cut.h[r - 1][c]) }
  }
  if (side === 'right') {
    const P = { x: x1, y: y0 }, Q = { x: x1, y: y1 }
    return { start: P, segs: edgeSegs(P, Q, c === cols - 1 ? null : cut.v[r][c]) }
  }
  if (side === 'bottom') {
    const P = { x: x0, y: y1 }, Q = { x: x1, y: y1 }
    return reversed(P, edgeSegs(P, Q, r === rows - 1 ? null : cut.h[r][c]))
  }
  const P = { x: x0, y: y0 }, Q = { x: x0, y: y1 }
  return reversed(P, edgeSegs(P, Q, c === 0 ? null : cut.v[r][c - 1]))
}

const SIDES: Side[] = ['top', 'right', 'bottom', 'left']
const num = (n: number) => String(Math.round(n * 10) / 10)
const pt = (p: Pt) => `${num(p.x)} ${num(p.y)}`

/** The outline of one piece, in the picture's own units. */
export function piecePath(cut: Cut, index: number, w: number, h: number): string {
  const chains = SIDES.map(s => sideOf(cut, index, s, w, h))
  const body = chains.map(ch => ch.segs.map(s => `C${pt(s.c1)} ${pt(s.c2)} ${pt(s.p)}`).join('')).join('')
  return `M${pt(chains[0].start)}${body}Z`
}

// ── The table: the board on top, a shelf of loose pieces underneath ──

export type Table = {
  cw: number; ch: number
  /** Room around the picture so a knob that sticks out of a loose piece is never cut off. */
  padX: number; padY: number
  shelfTop: number; shelfH: number
  /** Height of the board and shelf together. */
  height: number
  view: { x: number; y: number; w: number; h: number }
}

export function tableFor(cols: number, rows: number, w: number, h: number): Table {
  const cw = w / cols, ch = h / rows
  const padX = KNOB_REACH * ch, padY = KNOB_REACH * cw
  // three rows of pieces need a taller shelf, or they pile on top of each other
  const shelfTop = h * 1.08, shelfH = h * (rows >= 3 ? 1.05 : 0.9)
  const height = shelfTop + shelfH
  return { cw, ch, padX, padY, shelfTop, shelfH, height, view: { x: -padX, y: -padY, w: w + 2 * padX, h: height + 2 * padY } }
}

/** Where a piece sits when it is in its place: the top left of its square. */
export const homeOf = (index: number, cols: number, rows: number, w: number, h: number): Pt =>
  ({ x: (index % cols) * (w / cols), y: Math.floor(index / cols) * (h / rows) })

/**
 * A piece clicks in when it is let go this close to its place. Generous: small hands are not exact. Small pieces get
 * a little more than 40% of their size, but always under half, so a piece is never taken by the place next door.
 */
export const snapRadius = (cw: number, ch: number) => Math.min(0.49 * Math.min(cw, ch), Math.max(0.4 * Math.min(cw, ch), 22))

/** Keep a piece's square on the table. */
export function clampPos(p: Pt, t: Table, w: number): Pt {
  return {
    x: Math.min(Math.max(p.x, 0), w - t.cw),
    y: Math.min(Math.max(p.y, 0), t.height - t.ch),
  }
}

/** Where every loose piece starts: spread over the shelf in a shuffled order, each a little off its slot. */
export function scatter(cols: number, rows: number, w: number, h: number, rand: Rand = Math.random): Pt[] {
  const t = tableFor(cols, rows, w, h)
  const n = cols * rows
  const slots = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]]
  }
  return Array.from({ length: n }, (_, piece) => {
    const s = slots[piece], sc = s % cols, sr = Math.floor(s / cols)
    const x = (cols > 1 ? (sc * (w - t.cw)) / (cols - 1) : (w - t.cw) / 2) + (rand() - 0.5) * t.cw * 0.2
    const y = t.shelfTop + (rows > 1 ? (sr * (t.shelfH - t.ch)) / (rows - 1) : (t.shelfH - t.ch) / 2) + (rand() - 0.5) * t.ch * 0.16
    const p = clampPos({ x, y }, t, w)
    return { x: p.x, y: Math.max(p.y, t.shelfTop) }   // a nudge never lifts a piece onto the board
  })
}

/** The order the loose pieces are stacked, bottom first. */
export function stackOrder(n: number, rand: Rand = Math.random): number[] {
  const o = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]]
  }
  return o
}
