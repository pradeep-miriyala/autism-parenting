// Trace the Lines: the shapes.
//
// Lines only: straight, slanted, curved, zigzag, wavy, looped, closed shapes made of lines,
// and a few that cross. The order is the usual pre-writing order (up-and-down, across,
// slanted, round, then pointed and flowing). Each shape is DATA: strokes drawn as dense
// polylines in a 400 x 300 picture, so the scoring and the screen share one truth.
//
// Dependency-free on purpose: scripts/test-trace.mts imports it directly.

export type Pt = { x: number; y: number }
export type ShapeKind =
  | 'vertical' | 'horizontal' | 'two-vertical' | 'two-horizontal'
  | 'diagonal-down' | 'diagonal-up' | 'slanted-pair' | 'v-shape' | 'inverted-v'
  | 'arc' | 'bowl' | 'c-curve' | 'circle'
  | 'zigzag' | 'wave' | 'steps' | 'arches' | 'triangle' | 'square' | 's-curve'
  | 'plus' | 'cross' | 'loops' | 'diamond' | 'hash' | 'spiral' | 'star'

/**
 * Anything that can be traced: a line shape or a letter. `tolerance` is how far from the line
 * still counts as on it. `rules` are y positions of faint writing lines to draw behind it.
 */
export type Shape = {
  kind: string; label: string; strokes: Pt[][]; tolerance: number; rules?: number[]
  /** When only part of a letter is to be traced: the whole letter. `strokes` is then just the part. */
  full?: Pt[][]
}

export const VIEW = { w: 400, h: 300 }

/** Which shapes belong to which level. Each level adds new ones to the last. */
export const LEVELS: Record<number, ShapeKind[]> = {
  1: ['vertical', 'horizontal', 'two-vertical', 'two-horizontal'],
  2: ['diagonal-down', 'diagonal-up', 'slanted-pair', 'v-shape', 'inverted-v'],
  3: ['arc', 'bowl', 'c-curve', 'circle'],
  4: ['zigzag', 'wave', 'steps', 'arches', 'triangle', 'square', 's-curve'],
  5: ['plus', 'cross', 'loops', 'diamond', 'hash', 'spiral', 'star'],
}
export const MIN_LEVEL = 1
export const MAX_LEVEL = 5

const LABELS: Record<ShapeKind, string> = {
  vertical: 'a line going down', horizontal: 'a line going across',
  'two-vertical': 'two lines going down', 'two-horizontal': 'two lines going across',
  'diagonal-down': 'a slanted line going down', 'diagonal-up': 'a slanted line going up',
  'slanted-pair': 'two slanted lines', 'v-shape': 'a V', 'inverted-v': 'an upside-down V',
  arc: 'a hill', bowl: 'a valley', 'c-curve': 'a curve', circle: 'a circle',
  zigzag: 'a zigzag', wave: 'a wave', steps: 'steps', arches: 'two hills', triangle: 'a triangle', square: 'a square',
  's-curve': 'an S', plus: 'a plus', cross: 'a cross', loops: 'loops', diamond: 'a diamond', hash: 'a hash',
  spiral: 'a spiral', star: 'a star',
}

/**
 * How far from the line still counts as on it, per shape. Straight lines are generous. Shapes
 * whose parts sit close together are tighter, so the margin never reaches the next part.
 */
export const TOLERANCE: Record<ShapeKind, number> = {
  vertical: 26, horizontal: 26, 'two-vertical': 24, 'two-horizontal': 24,
  'diagonal-down': 26, 'diagonal-up': 26, 'slanted-pair': 24, 'v-shape': 26, 'inverted-v': 26,
  arc: 24, bowl: 24, 'c-curve': 24, circle: 22,
  zigzag: 22, wave: 22, steps: 22, arches: 22, triangle: 24, square: 24, 's-curve': 22,
  plus: 24, cross: 24, loops: 20, diamond: 24, hash: 22, spiral: 15, star: 22,
}

const jit = (rand: () => number, amount: number) => (rand() - 0.5) * 2 * amount

/** A straight run, densely sampled. */
function line(a: Pt, b: Pt, step = 4): Pt[] {
  const n = Math.max(2, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / step))
  return Array.from({ length: n + 1 }, (_, i) => ({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n }))
}

/** A path through corner points, densely sampled. */
function poly(pts: Pt[]): Pt[] {
  return pts.slice(1).flatMap((p, i) => line(pts[i], p).slice(i === 0 ? 0 : 1))
}

/** Follow a function of t in [0, 1]. */
function curve(f: (t: number) => Pt, steps = 90): Pt[] {
  return Array.from({ length: steps + 1 }, (_, i) => f(i / steps))
}

const quad = (a: Pt, c: Pt, b: Pt) => (t: number): Pt => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
})

/** An arc of an ellipse. Angles in degrees: 0 is right, 90 is down (the picture's y runs down), 270 is up. */
export function arcPts(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, step = 3): Pt[] {
  const sweep = Math.abs(a1 - a0) * Math.PI / 180
  const length = sweep * (rx + ry) / 2
  const n = Math.max(8, Math.round(length / step))
  return Array.from({ length: n + 1 }, (_, i) => {
    const th = (a0 + ((a1 - a0) * i) / n) * Math.PI / 180
    return { x: cx + rx * Math.cos(th), y: cy + ry * Math.sin(th) }
  })
}

export function makeShape(kind: ShapeKind, rand: () => number = Math.random): Shape {
  const cx = 200 + jit(rand, 14)
  const cy = 150 + jit(rand, 10)
  let strokes: Pt[][]
  switch (kind) {
    case 'vertical':
      strokes = [line({ x: cx, y: 50 + jit(rand, 8) }, { x: cx, y: 250 + jit(rand, 8) })]
      break
    case 'horizontal':
      strokes = [line({ x: 55 + jit(rand, 8), y: cy }, { x: 345 + jit(rand, 8), y: cy })]
      break
    case 'two-vertical': {
      const x1 = 150 + jit(rand, 8), x2 = 250 + jit(rand, 8)
      strokes = [line({ x: x1, y: 55 + jit(rand, 6) }, { x: x1, y: 245 + jit(rand, 6) }), line({ x: x2, y: 55 + jit(rand, 6) }, { x: x2, y: 245 + jit(rand, 6) })]
      break
    }
    case 'two-horizontal': {
      const y1 = 105 + jit(rand, 8), y2 = 195 + jit(rand, 8)
      strokes = [line({ x: 70 + jit(rand, 8), y: y1 }, { x: 330 + jit(rand, 8), y: y1 }), line({ x: 70 + jit(rand, 8), y: y2 }, { x: 330 + jit(rand, 8), y: y2 })]
      break
    }
    case 'diagonal-down':
      strokes = [line({ x: 80 + jit(rand, 12), y: 55 + jit(rand, 8) }, { x: 320 + jit(rand, 12), y: 245 + jit(rand, 8) })]
      break
    case 'diagonal-up':
      strokes = [line({ x: 80 + jit(rand, 12), y: 245 + jit(rand, 8) }, { x: 320 + jit(rand, 12), y: 55 + jit(rand, 8) })]
      break
    case 'slanted-pair':
      strokes = [
        line({ x: 95 + jit(rand, 8), y: 55 }, { x: 225 + jit(rand, 8), y: 245 }),
        line({ x: 175 + jit(rand, 8), y: 55 }, { x: 305 + jit(rand, 8), y: 245 }),
      ]
      break
    case 'v-shape':
      strokes = [poly([{ x: 95 + jit(rand, 8), y: 60 }, { x: 200 + jit(rand, 8), y: 245 }, { x: 305 + jit(rand, 8), y: 60 }])]
      break
    case 'inverted-v':
      strokes = [poly([{ x: 95 + jit(rand, 8), y: 245 }, { x: 200 + jit(rand, 8), y: 60 }, { x: 305 + jit(rand, 8), y: 245 }])]
      break
    case 'arc': // a hill, left to right
      strokes = [curve(quad({ x: 60, y: 235 }, { x: 200 + jit(rand, 10), y: 30 + jit(rand, 12) }, { x: 340, y: 235 }))]
      break
    case 'bowl': // a valley, left to right
      strokes = [curve(quad({ x: 60, y: 65 }, { x: 200 + jit(rand, 10), y: 270 + jit(rand, 12) }, { x: 340, y: 65 }))]
      break
    case 'c-curve': // opens to the right, drawn from the top round to the bottom
      strokes = [arcPts(225 + jit(rand, 10), cy, 100 + jit(rand, 6), 95, -50, -310)]
      break
    case 'circle': { // round and round, starting at the top, going anticlockwise
      const r = 92 + jit(rand, 8)
      strokes = [arcPts(cx, cy, r, r - 6, -90, -450)]
      break
    }
    case 'zigzag': {
      const hi = 80 + jit(rand, 8), lo = 220 + jit(rand, 8)
      strokes = [poly([0, 1, 2, 3, 4, 5].map(i => ({ x: 50 + i * 60, y: i % 2 === 0 ? hi : lo })))]
      break
    }
    case 'wave': {
      const amp = 62 + jit(rand, 8)
      strokes = [curve(t => ({ x: 40 + 320 * t, y: cy - amp * Math.sin(2 * Math.PI * 2 * t) }), 140)]
      break
    }
    case 'steps': { // a staircase, climbing to the right
      const x0 = 70 + jit(rand, 8), y0 = 245 + jit(rand, 4), run = 55, rise = 45
      const pts: Pt[] = [{ x: x0, y: y0 }]
      for (let i = 0; i < 4; i++) {
        const last = pts[pts.length - 1]
        pts.push({ x: last.x, y: last.y - rise }, { x: last.x + run, y: last.y - rise })
      }
      strokes = [poly(pts)]
      break
    }
    case 'arches': // two hills side by side
      strokes = [
        curve(quad({ x: 55, y: 235 }, { x: 125 + jit(rand, 6), y: 35 + jit(rand, 10) }, { x: 195, y: 235 })),
        curve(quad({ x: 205, y: 235 }, { x: 275 + jit(rand, 6), y: 35 + jit(rand, 10) }, { x: 345, y: 235 })),
      ]
      break
    case 'triangle': { // from the top, down the right, across, and back up
      const apex = { x: 200 + jit(rand, 8), y: 50 } // a closed shape ends exactly where it began
      strokes = [poly([apex, { x: 310 + jit(rand, 8), y: 240 }, { x: 90 + jit(rand, 8), y: 240 }, apex])]
      break
    }
    case 'square': { // from the top left, clockwise
      const tl = { x: 105 + jit(rand, 6), y: 60 }
      strokes = [poly([tl, { x: 295 + jit(rand, 6), y: 60 }, { x: 295, y: 240 + jit(rand, 6) }, { x: 105, y: 240 }, tl])]
      break
    }
    case 's-curve': {
      const a = arcPts(200, 98, 72, 50, -30, -270)
      const b = arcPts(200, 198, 72, 50, -90, 150)
      strokes = [[...a, ...b.slice(1)]]
      break
    }
    case 'plus':
      strokes = [
        line({ x: cx, y: 50 }, { x: cx, y: 250 }),
        line({ x: 70, y: cy }, { x: 330, y: cy }),
      ]
      break
    case 'cross':
      strokes = [
        line({ x: 110 + jit(rand, 8), y: 50 }, { x: 290 + jit(rand, 8), y: 250 }),
        line({ x: 290 + jit(rand, 8), y: 50 }, { x: 110 + jit(rand, 8), y: 250 }),
      ]
      break
    case 'loops': {
      // A row of looping curls, like cursive "eee".
      const n = 3, r = 44
      strokes = [curve(t => {
        const th = 2 * Math.PI * n * t
        return { x: 55 + 290 * t - r * Math.sin(th) * 0.95, y: cy - r * Math.cos(th) * 1.05 + r }
      }, 180)]
      break
    }
    case 'diamond': { // from the top, clockwise
      const top = { x: 200, y: 45 + jit(rand, 5) }
      strokes = [poly([top, { x: 310 + jit(rand, 8), y: 150 }, { x: 200, y: 255 + jit(rand, 5) }, { x: 90 + jit(rand, 8), y: 150 }, top])]
      break
    }
    case 'hash': { // two down, then two across
      const x1 = 160 + jit(rand, 6), x2 = 245 + jit(rand, 6), y1 = 112 + jit(rand, 5), y2 = 190 + jit(rand, 5)
      strokes = [
        line({ x: x1, y: 50 }, { x: x1, y: 250 }), line({ x: x2, y: 50 }, { x: x2, y: 250 }),
        line({ x: 85, y: y1 }, { x: 315, y: y1 }), line({ x: 85, y: y2 }, { x: 315, y: y2 }),
      ]
      break
    }
    case 'spiral': { // from the middle, turning clockwise as it opens out
      const turns = 2.5
      strokes = [curve(t => {
        const th = 2 * Math.PI * turns * t
        const rad = 10 + 92 * t
        return { x: cx + rad * Math.cos(th), y: cy + rad * Math.sin(th) }
      }, 200)]
      break
    }
    case 'star': { // five points drawn without lifting the finger
      const R = 108
      const v = (k: number): Pt => {
        const a = (-90 + k * 72) * Math.PI / 180
        return { x: 200 + R * Math.cos(a), y: 158 + R * Math.sin(a) }
      }
      strokes = [poly([v(0), v(2), v(4), v(1), v(3), v(0)])]
      break
    }
  }
  return { kind, label: LABELS[kind], strokes, tolerance: TOLERANCE[kind] }
}

/** A shape for a level: half the time one of the newest, otherwise any so far. */
export function pickShape(level: number, rand: () => number = Math.random, avoid?: string): Shape {
  const lv = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)))
  const newest = LEVELS[lv]
  const all = Array.from({ length: lv }, (_, i) => LEVELS[i + 1]).flat()
  let pool = rand() < 0.5 ? newest : all
  if (avoid && pool.length > 1) pool = pool.filter(k => k !== avoid)
  return makeShape(pool[Math.floor(rand() * pool.length)], rand)
}
