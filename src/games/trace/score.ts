// Trace the Lines: how close is a drawing to a shape?
//
// Two questions, both asked of the points, not the pixels:
//   coverage  - how much of the shape did the drawing reach?
//   precision - how much of the drawing stayed near the shape?
// Both have to be high. A drawing is never marked "wrong": the screen only ever
// reads this as "done" or "not yet". Thresholds are generous because small fingers
// wobble; scripts/test-trace.mts checks them against thousands of simulated tries.
//
// Dependency-free on purpose.

import type { Pt } from './shapes.ts'

/** `drawn` is how much line was drawn compared with the shape (1 = about the right amount). */
export type Verdict = { pass: boolean; coverage: number; precision: number; drawn: number; reason?: 'short' | 'small' | 'big' | 'busy' }

// `maxDrawn` is how many times the shape's own line may be drawn before it is just a scribble.
export const TRACE = { tolerance: 28, coverage: 0.85, precision: 0.85, maxDrawn: 2.2 }

/** Tracing options for a shape: its own margin (see TOLERANCE in shapes.ts) with the usual thresholds. */
export const traceOptions = (tolerance: number) => ({ ...TRACE, tolerance })
// Copying is judged on shape, after sliding and resizing, so it is a little more forgiving.
// `ink` is how much line was drawn compared with the shape, once both are the same size: a scribble
// has far too much, a few dabs far too little.
export const COPY = { tolerance: 0.08, coverage: 0.8, precision: 0.75, minSize: 0.45, maxSize: 2.2, minInk: 0.75, maxInk: 1.5, strokeCoverage: 0.7 }
const STEP = 5

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

/** Points spaced evenly along a polyline. */
export function resample(stroke: Pt[], step = STEP): Pt[] {
  if (stroke.length === 0) return []
  const out: Pt[] = [stroke[0]]
  let carry = 0
  for (let i = 1; i < stroke.length; i++) {
    let a = stroke[i - 1]
    const b = stroke[i]
    let seg = dist(a, b)
    while (carry + seg >= step) {
      const t = (step - carry) / seg
      a = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
      out.push(a)
      seg = dist(a, b)
      carry = 0
    }
    carry += seg
  }
  return out
}

export const resampleAll = (strokes: Pt[][], step = STEP) => strokes.flatMap(s => resample(s, step))

export function pathLength(strokes: Pt[][]) {
  return strokes.reduce((sum, s) => sum + s.slice(1).reduce((n, p, i) => n + dist(s[i], p), 0), 0)
}

function share(from: Pt[], to: Pt[], tol: number) {
  if (from.length === 0 || to.length === 0) return 0
  let near = 0
  for (const p of from) {
    for (const q of to) {
      if (dist(p, q) <= tol) { near++; break }
    }
  }
  return near / from.length
}

/** Trace: the drawing is judged where it lies, against the shape where it lies. */
export function scoreTrace(target: Pt[][], drawn: Pt[][], opts = TRACE, required?: Pt[][]): Verdict {
  // `target` is the whole shape, which the line may follow; `required` (default: all of it) is the part that
  // has to be traced. For the start of a letter, the line may carry on along the rest without penalty.
  const need = required ?? target
  const T = resampleAll(need)
  const U = resampleAll(drawn)
  // The line that joins one stroke to the next, when the finger is not lifted, is travel, not drawing:
  // it does not count towards "how much was drawn".
  const along = courseStats(target, drawn, opts.tolerance)
  const ink = Math.max(0, pathLength(drawn) - along.travel)
  const amount = ink / (pathLength(need) || 1)
  if (amount < 0.25) return { pass: false, coverage: 0, precision: 0, drawn: amount, reason: 'short' }
  if (ink / (pathLength(target) || 1) > opts.maxDrawn) return { pass: false, coverage: 0, precision: 0, drawn: amount, reason: 'busy' }
  const coverage = share(T, U, opts.tolerance)
  // Coverage: how much of the shape was reached. Precision: how much of the drawing stayed on
  // the course, following the shape along (see makeCourse), not merely near some part of it.
  const precision = along.precision
  return { pass: coverage >= opts.coverage && precision >= opts.precision, coverage, precision, drawn: amount }
}

function bounds(pts: Pt[]) {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, size: Math.max(maxX - minX, maxY - minY, 1) }
}

/** Copy: slide both to the middle and scale to the same size, but never turn them. */
export function scoreCopy(target: Pt[][], drawn: Pt[][], opts = COPY): Verdict {
  const T = resampleAll(target)
  const U = resampleAll(drawn)
  const amount = pathLength(drawn) / (pathLength(target) || 1)
  if (amount < 0.25 || U.length < 3) return { pass: false, coverage: 0, precision: 0, drawn: amount, reason: 'short' }
  const bt = bounds(T), bu = bounds(U)
  const ratio = bu.size / bt.size
  if (ratio < opts.minSize) return { pass: false, coverage: 0, precision: 0, drawn: amount, reason: 'small' }
  if (ratio > opts.maxSize) return { pass: false, coverage: 0, precision: 0, drawn: amount, reason: 'big' }
  // Measured on evenly spaced points, so tiny jitter between samples does not count as line.
  const ink = (pathLength([U]) / bu.size) / (pathLength([T]) / bt.size)
  if (ink > opts.maxInk) return { pass: false, coverage: 0, precision: 0, drawn: ink, reason: 'busy' }
  if (ink < opts.minInk) return { pass: false, coverage: 0, precision: 0, drawn: ink, reason: 'short' }
  const nT = T.map(p => ({ x: (p.x - bt.cx) / bt.size, y: (p.y - bt.cy) / bt.size }))
  const nU = U.map(p => ({ x: (p.x - bu.cx) / bu.size, y: (p.y - bu.cy) / bu.size }))
  const coverage = share(nT, nU, opts.tolerance)
  const precision = share(nU, nT, opts.tolerance)
  // Every stroke of the shape must be there on its own. Without this, b and d (the same round part,
  // the stem on opposite sides) and E and F (an E has one more bar) look almost alike overall.
  // Tiny strokes, like the dot on an i, are left out: a child may skip them.
  const weakest = Math.min(1, ...target
    .filter(st => pathLength([st]) >= 20)
    .map(st => share(resample(st).map(p => ({ x: (p.x - bt.cx) / bt.size, y: (p.y - bt.cy) / bt.size })), nU, opts.tolerance)))
  return { pass: coverage >= opts.coverage && precision >= opts.precision && weakest >= opts.strokeCoverage, coverage, precision, drawn: amount }
}

/**
 * Has the drawing strayed (a scribble, the wrong line, the wrong size) as opposed to being
 * unfinished? Only strays get "try again" and the buzz; an unfinished line is left alone so
 * the child can carry on. A drawing is judged for straying only once enough line is down for
 * its precision to mean something: tracing is judged in place, so about half the line is enough.
 */
export function isOffCourse(v: Verdict, step: 'trace' | 'copy'): boolean {
  if (v.pass) return false
  if (v.reason === 'busy' || v.reason === 'big') return true
  // Too little line, or a drawing that is simply small, is just unfinished: half a shape is
  // small because it is half.
  if (v.reason === 'short' || v.reason === 'small') return false
  // A copy is judged on shape, and half a shape drawn large looks just like a wrong one, so
  // a copy is only ever called off course for being a scribble or far too big (above); a
  // shape that does not match yet is simply not done yet.
  if (step === 'copy') return false
  return v.drawn >= 0.45 && v.precision < TRACE.precision
}

/**
 * Follows a child along a shape. "Near the shape" is the wrong question for shapes whose parts
 * sit side by side (a zigzag, loops, a plus): a stray line lands near the NEXT part and still
 * looks on target. So the question here is "near the part of the line you should be on by now":
 * from where the drawing started, only the stretch just behind and a little way ahead counts.
 * Being close to some other part of the shape is a stray.
 */
export const COURSE = { ahead: 90, back: 20, start: 1.8 }
export const STRAY_RUN = 40   // how much line off the course makes it a wander, not a wobble
// A finger gives a point every few units. When the screen is busy (the hint dot is being redrawn
// every frame, a slow phone) or the finger is quick, the points arrive far apart. Over a gap this
// big the course is allowed to be that much further along.
export const SPARSE = 30
const SPARSE_REACH = 1.3     // a line is a little longer than the straight distance across it
// Finishing a stroke and carrying on. A child who does not lift the finger between the strokes of a
// shape (1, 2, 3...) draws a connecting line to the next one, and one who draws a little past the end
// of a line overshoots. Neither is a wander: once the end of a stroke has been reached, travelling on
// is allowed up to this far, as long as it ends up on another stroke (or back on this one). A line
// that goes on past that is a stray as before. With no other stroke left to go to, only an overshoot
// is allowed.
export const TRAVEL = 500
export const OVERSHOOT = 32
const END_NEAR = 5           // samples of 3 units: within about 15 units of the end is the end
const TRACED = 20            // samples: a stroke is finished only after at least this much was really traced along it
const START_ZONE = 8         // samples: the line carries on to another stroke only by arriving near its start...
const COMMIT = 10            // ...and then going 30 units along it. Passing near or across a stroke on the way to another is not joining it.

export function makeCourse(target: Pt[][], tolerance: number) {
  const strokes = target.map(s => resample(s, 3))
  const aheadN = Math.round(COURSE.ahead / 3), backN = Math.round(COURSE.back / 3)
  // Where the child might be on the shape. More than one at a crossing (the middle of a plus):
  // both strokes stay possible until the direction of travel shows which one it is.
  let cands: { s: number; ci: number; from: number }[] = []
  let run = 0
  let last: Pt | null = null
  const finished = new Set<number>()   // strokes whose end has been reached
  let travelled = 0                    // how far the line has gone since the end of a stroke
  let travelling = false               // was the last point travel, between strokes or past an end?
  let overshooting = false             // was it a small overshoot past the last end (forgiven unless it goes on)?
  let pursuits: { s: number; ci: number; from: number }[] = []   // strokes the travelling line may be heading to

  // Land on every part of the shape that is close enough: the nearest point of each stroke, and,
  // where a stroke passes through the same spot twice (the middle of a star, a loop), each pass.
  function find(p: Pt, allowed: (k: number) => boolean, startOnly = false) {
    const found: { s: number; ci: number; from: number }[] = []
    const near = tolerance * COURSE.start
    strokes.forEach((st, k) => {
      if (!allowed(k)) return
      let best = -1, bd = Infinity, lastNear = -999
      const close = (i: number) => { if (best >= 0) found.push({ s: k, ci: best, from: best }); best = -1; bd = Infinity; lastNear = i }
      st.forEach((q, i) => {
        if (startOnly && i > START_ZONE) return
        const d = dist(p, q)
        if (d <= near) {
          if (best >= 0 && i - lastNear > 10) close(i)   // a new pass: more than ~30 units further along
          if (d < bd) { bd = d; best = i }
          lastNear = i
        }
      })
      if (best >= 0) found.push({ s: k, ci: best, from: best })
      // A closed shape starts and ends at one place, so at that place the child may be at either:
      // just starting out, or just finishing. Keep the start in mind as well as the end.
      const closed = dist(st[0], st[st.length - 1]) < 8
      if (closed && dist(p, st[0]) <= near && !found.some(c => c.s === k && c.ci === 0)) found.push({ s: k, ci: 0, from: 0 })
    })
    return found
  }
  function acquire(p: Pt) {
    cands = find(p, () => true)
    return cands.length > 0
  }
  // Short strokes (the bars of an E, the dot of an i) need only most of their length traced.
  const reached = (c: { s: number; ci: number; from: number }) =>
    c.ci >= strokes[c.s].length - 1 - END_NEAR && c.ci - c.from >= Math.min(TRACED, Math.floor((strokes[c.s].length - 1) * 0.6))
  const atEnd = () => cands.some(reached)
  // While travelling: which unfinished stroke is the line going along? One that it came to the start of
  // and has since followed for a little way. A start it only passed on the way somewhere else drops out.
  function pursue(p: Pt) {
    const aheadN = Math.round(COURSE.ahead / 3), backN = Math.round(COURSE.back / 3)
    const next: { s: number; ci: number; from: number }[] = []
    for (const c of pursuits) {
      const st = strokes[c.s]
      let hit = -1, hd = Infinity
      for (let j = Math.max(0, c.ci - backN); j <= Math.min(st.length - 1, c.ci + aheadN); j++) {
        const d = dist(p, st[j])
        if (d <= tolerance && d < hd) { hd = d; hit = j }
      }
      if (hit >= 0) next.push({ s: c.s, ci: Math.max(c.ci, hit), from: c.from })
    }
    for (const f of find(p, k => !finished.has(k), true)) if (!next.some(n => n.s === f.s)) next.push(f)
    pursuits = next
    return next.find(c => c.ci - c.from >= Math.min(COMMIT, Math.max(1, strokes[c.s].length - 1 - c.from))) ?? null
  }
  function follow(p: Pt, extra = 0) {
    if (cands.length === 0) return acquire(p)
    const reach = aheadN + extra
    const next: { s: number; ci: number; from: number }[] = []
    for (const c of cands) {
      const st = strokes[c.s]
      // The nearest point of the window is where the child is. (Not the furthest one in reach: at a
      // sharp corner the next arm of a V is within reach while the child is still on this one.)
      let hit = -1, hd = Infinity
      for (let j = Math.max(0, c.ci - backN); j <= Math.min(st.length - 1, c.ci + reach); j++) {
        const d = dist(p, st[j])
        if (d <= tolerance && d < hd) { hd = d; hit = j }
      }
      if (hit >= 0) next.push({ s: c.s, ci: Math.max(c.ci, hit), from: c.from })
    }
    if (next.length === 0) return false
    cands = next
    return true
  }
  const note = (p: Pt, on: boolean) => {
    if (on) run = 0
    else if (last) run += dist(last, p)
    last = p
    return on
  }
  return {
    /** A new stroke begins at p. Returns whether it began on the shape. */
    begin(p: Pt) { cands = []; run = 0; last = null; travelled = 0; travelling = false; overshooting = false; pursuits = []; return note(p, acquire(p)) },
    /** Forget which strokes have been finished: a fresh start on the same shape. */
    reset() { finished.clear(); travelled = 0; travelling = false; overshooting = false; pursuits = [] },
    /** Was the last point travel (between strokes, or past an end), not tracing? It counts for nothing either way. */
    get travelling() { return travelling },
    /** Was the last point a small overshoot past the end? Forgiven if the line stops or comes back soon; not if it goes on. */
    get overshooting() { return overshooting },
    /** The next point of the stroke. Returns whether it is on course. */
    add(p: Pt) {
      const gap = last ? dist(last, p) : 0
      travelling = false
      overshooting = false
      if (follow(p, gap > SPARSE ? Math.ceil((gap * SPARSE_REACH) / 3) : 0)) {
        travelled = 0
        pursuits = []
        cands.forEach(c => { if (reached(c)) finished.add(c.s) })
        return note(p, true)
      }
      // Off the line. Right after the end of a stroke this is travel, not a wander.
      if (cands.length > 0 && atEnd()) {
        cands.forEach(c => { if (reached(c)) finished.add(c.s) })
        const more = strokes.some((_, k) => !finished.has(k))
        travelled += last ? dist(last, p) : 0
        const go = more ? pursue(p) : null
        if (go) {                           // heading along another stroke without lifting: carry on there
          cands = [go]
          pursuits = []
          travelled = 0
          run = 0
          last = p
          return true
        }
        if (more && travelled <= TRAVEL) { last = p; travelling = true; return true }   // on the way to another stroke: counts for nothing
        // Past the end with nowhere to go: a little overshoot is no wander, but it is not on the line either.
        if (!more && travelled <= OVERSHOOT) { last = p; overshooting = true; return false }
      }
      return note(p, false)
    },
    /** Has the line been off course for long enough to call it a wander? */
    get strayed() { return run >= STRAY_RUN },
  }
}

/**
 * Following each stroke along the shape: how much of what was drawn stayed on course (`precision`), and how
 * much line was only travel from one stroke to the next (`travel`, in picture units).
 */
export function courseStats(target: Pt[][], drawn: Pt[][], tolerance: number): { precision: number; travel: number } {
  const course = makeCourse(target, tolerance)
  let on = 0, total = 0, travel = 0
  for (const stroke of drawn) {
    const pts = resample(stroke, 4)
    if (pts.length === 0) continue
    total++; if (course.begin(pts[0])) on++
    let pending = 0   // overshoot points past the end: free if it stays small, off the line if it goes on
    for (let i = 1; i < pts.length; i++) {
      const ok = course.add(pts[i])
      if (course.travelling) { travel += dist(pts[i - 1], pts[i]); continue }   // between strokes: counts for nothing
      if (course.overshooting) { pending++; continue }
      if (ok) { pending = 0; total++; on++ } else { total += pending + 1; pending = 0 }
    }
  }
  return { precision: total === 0 ? 0 : on / total, travel }
}

/** How much of what was drawn stayed on course, following each stroke along the shape. */
export const precisionAlong = (target: Pt[][], drawn: Pt[][], tolerance: number) => courseStats(target, drawn, tolerance).precision

/** The point a given distance along a stroke, for the moving hint. */
export function pointAlong(stroke: Pt[], d: number): Pt {
  let left = d
  for (let i = 1; i < stroke.length; i++) {
    const seg = dist(stroke[i - 1], stroke[i])
    if (left <= seg) {
      const t = seg === 0 ? 0 : left / seg
      return { x: stroke[i - 1].x + (stroke[i].x - stroke[i - 1].x) * t, y: stroke[i - 1].y + (stroke[i].y - stroke[i - 1].y) * t }
    }
    left -= seg
  }
  return stroke[stroke.length - 1]
}
