// scripts/test-trace.mts
// Checks the Trace the Lines scoring against simulated drawing.
//
//     node scripts/test-trace.mts
//
// A child's line wobbles, starts a little late, stops a little early, and is sometimes
// lifted halfway. Those must pass. A line that wanders off the shape, a different shape,
// half a shape, a scribble or a dot must not. Complex shapes are the hard case: their parts
// sit side by side, so a stray line is often near *some* part of the shape. The checks follow
// the child along the line, and this script is what keeps that true.
// Fix the scoring, not the test, if this ever fails.

import { LEVELS, TOLERANCE, makeShape, type Pt, type ShapeKind } from '../src/games/trace/shapes.ts'
import { allCharacters, letterSequence, makeLetter, nextInSequence, partOfStrokes, portionFor, MAX_LETTER_LEVEL } from '../src/games/trace/letters.ts'
import {
  COPY, isOffCourse, makeCourse, resample, scoreCopy, scoreTrace, traceOptions,
} from '../src/games/trace/score.ts'

function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r())

/** Draw a shape the way a small hand might. `sigma` is the wobble in picture units. */
function childDraws(strokes: Pt[][], r: () => number, sigma: number, opts: { transform?: boolean; lift?: boolean } = {}): Pt[][] {
  let ox = 0, oy = 0, s = 1
  if (opts.transform) { s = 0.6 + r() * 1.0; ox = (r() - 0.5) * 120; oy = (r() - 0.5) * 80 }
  const out: Pt[][] = []
  for (const st of strokes) {
    let pts = resample(st, 3)
    const cutA = Math.floor(pts.length * r() * 0.05), cutB = Math.floor(pts.length * r() * 0.05)
    pts = pts.slice(cutA, pts.length - cutB)
    let nx = 0, ny = 0
    const wob = pts.map(p => {
      // Wobble drifts slowly, as a hand does; scaled so it stays about `sigma` however slowly it drifts.
      const a = 0.95, innov = sigma * 0.5 * Math.sqrt(1 - a * a)
      nx = a * nx + gauss(r) * innov
      ny = a * ny + gauss(r) * innov
      return { x: 200 + (p.x - 200) * s + ox + nx, y: 150 + (p.y - 150) * s + oy + ny }
    })
    if (opts.lift && r() < 0.35 && wob.length > 20) {
      const cut = 8 + Math.floor(r() * (wob.length - 16))
      out.push(wob.slice(0, cut), wob.slice(cut + 1 + Math.floor(r() * 3)))
    } else out.push(wob)
  }
  return out
}

/** A drawing that is right except for one wander: it bulges `depth` units sideways for `frac` of the line. */
function wanders(strokes: Pt[][], r: () => number, depth: number, frac: number): Pt[][] {
  return childDraws(strokes, r, 5).map(pts => {
    const n = pts.length, len = Math.max(4, Math.floor(n * frac)), at = Math.floor(r() * (n - len)), sign = r() < 0.5 ? -1 : 1
    return pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]
      const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1
      const k = i >= at && i < at + len ? Math.sin(Math.PI * (i - at) / len) : 0
      return { x: p.x + (-dy / l) * sign * depth * k, y: p.y + (dx / l) * sign * depth * k }
    })
  })
}

/** Did the live detector call a wander while this was being drawn? */
function liveStray(strokes: Pt[][], target: Pt[][], tol: number) {
  const course = makeCourse(target, tol)
  for (const s of strokes) {
    if (s.length === 0) continue
    course.begin(s[0])
    for (const p of s.slice(1)) { course.add(p); if (course.strayed) return true }
  }
  return false
}

const KINDS = Object.values(LEVELS).flat() as ShapeKind[]
const STRAIGHT = new Set<ShapeKind>(['vertical', 'horizontal', 'diagonal-down', 'diagonal-up', 'two-vertical', 'two-horizontal', 'slanted-pair'])
let failures = 0
const fail = (m: string) => { failures++; if (failures <= 25) console.error('FAIL', m) }
const N = 300
const pct = (n: number, of = N) => `${(100 * n / of).toFixed(1)}%`

const verdict = (mode: 'trace' | 'copy', kind: ShapeKind, t: Pt[][], d: Pt[][]) =>
  mode === 'trace' ? scoreTrace(t, d, traceOptions(TOLERANCE[kind])) : scoreCopy(t, d)

// 1. Honest attempts pass, never raise the live alarm, and never get "try again".
// Tracing is judged in place and must be near-perfect for honest drawing. A copy is judged on
// shape alone, so for busy shapes (a star, steps) it is allowed to be a little less sure.
const NEED = { trace: { 5: 0.995, 8: 0.99, 11: 0.95 }, copy: { 5: 0.96, 8: 0.95, 11: 0.9 } } as const
for (const sigma of [5, 8, 11] as const) {
  for (const mode of ['trace', 'copy'] as const) {
    const need = NEED[mode][sigma]
    let worst = 1
    for (const kind of KINDS) {
      let pass = 0, alarm = 0, off = 0
      for (let i = 0; i < N; i++) {
        const r = seeded(1000 * sigma + i * 17 + KINDS.indexOf(kind))
        const shape = makeShape(kind, r)
        const drawn = childDraws(shape.strokes, r, sigma, { transform: mode === 'copy', lift: true })
        const v = verdict(mode, kind, shape.strokes, drawn)
        if (v.pass) pass++
        if (isOffCourse(v, mode)) off++
        if (mode === 'trace' && liveStray(drawn, shape.strokes, TOLERANCE[kind])) alarm++
      }
      worst = Math.min(worst, pass / N)
      if (pass / N < need) fail(`${mode} wobble ${sigma}: ${kind} passes only ${pct(pass)} (need ${(100 * need).toFixed(1)}%)`)
      const limit = sigma <= 5 ? 0.005 : 0.01
      if (sigma <= 8 && (alarm / N > limit || off / N > limit)) fail(`${mode} wobble ${sigma}: ${kind} honest drawing raised the alarm ${pct(alarm)} / off course ${pct(off)}`)
    }
    console.log(`${mode.padEnd(5)} wobble ${String(sigma).padStart(2)}: worst shape passes ${(100 * worst).toFixed(1)}%`)
  }
}

// 2. Wandering off the line is caught, for every shape, complex ones included.
//    "mult" is how far off, as a multiple of the distance that still counts as on the line.
//    A wander is caught if the live detector fires while it is being drawn (the child is
//    interrupted before finishing) or, failing that, the finished drawing is called off course.
//    What must not happen is a wander getting through both and counting as done.
for (const [mult, frac, needAlarm] of [[2.2, 0.2, 0.99], [3, 0.25, 0.99]] as const) {
  let worstCaught = 1, worstShape = '', worstAlarm = 1
  for (const kind of KINDS) {
    let slipped = 0, caught = 0, alarm = 0
    for (let i = 0; i < N; i++) {
      const r = seeded(900 + i + KINDS.indexOf(kind) * 71 + Math.round(mult * 10))
      const shape = makeShape(kind, r)
      const drawn = wanders(shape.strokes, r, mult * TOLERANCE[kind], frac)
      const v = scoreTrace(shape.strokes, drawn, traceOptions(TOLERANCE[kind]))
      const live = liveStray(drawn, shape.strokes, TOLERANCE[kind])
      if (live) alarm++
      if (live || isOffCourse(v, 'trace')) caught++
      if (v.pass && !live) slipped++
    }
    if (slipped / N > 0.01) fail(`a wander of ${mult}x gets through as done ${pct(slipped)} of the time for ${kind}`)
    if (caught / N < 0.99) fail(`a wander of ${mult}x is caught only ${pct(caught)} of the time for ${kind}`)
    if (alarm / N < needAlarm) fail(`a wander of ${mult}x raises the live alarm only ${pct(alarm)} for ${kind} (need ${(100 * needAlarm).toFixed(0)}%)`)
    if (caught / N < worstCaught) { worstCaught = caught / N; worstShape = kind }
    worstAlarm = Math.min(worstAlarm, alarm / N)
  }
  console.log(`wander ${mult}x for ${Math.round(frac * 100)}% of the line: worst shape (${worstShape || 'none'}) caught ${(100 * worstCaught).toFixed(1)}%, live alarm at worst ${(100 * worstAlarm).toFixed(1)}%`)
}

// 2b. Sparse samples. A finger gives a point every few units, but when the screen is busy (the hint dot
//     is redrawn every frame, a slow phone) or the finger is quick, the points arrive far apart. An honest
//     drawing must not raise the "try again" alarm just because its points are far apart, and a real
//     wander must still be caught when it is drawn that way.
{
  const everyNth = (strokes: Pt[][], gap: number) => strokes.map(s => resample(s, gap).concat(s.length ? [s[s.length - 1]] : []))
  const chars = allCharacters()
  const targets = [
    ...KINDS.map(k => ({ id: k, make: (r: () => number) => makeShape(k, r) })),
    ...chars.map(c => ({ id: c, make: () => makeLetter(c) })),
  ]
  for (const gap of [30, 60, 90, 120]) {
    let falseAlarms = 0, tries = 0, worst = ''
    for (const t of targets) {
      let bad = 0
      for (let i = 0; i < 25; i++) {
        const r = seeded(700000 + i + gap * 13 + targets.indexOf(t) * 31)
        const shape = t.make(r)
        const drawn = everyNth(childDraws(shape.strokes, r, 5), gap)
        if (liveStray(drawn, shape.strokes, shape.tolerance)) bad++
        tries++
      }
      falseAlarms += bad
      if (bad / 25 > 0.04) worst += ` ${t.id}`
    }
    if (falseAlarms / tries > 0.005) fail(`sparse samples ${gap} units apart: honest drawings raise the alarm ${pct(falseAlarms, tries)} (limit 0.5%)${worst ? ' worst:' + worst : ''}`)
    console.log(`sparse ${String(gap).padStart(3)} units apart: honest drawings raise the alarm ${pct(falseAlarms, tries)}`)
  }
  for (const gap of [30, 60]) {
    let caught = 0, tries = 0
    for (const kind of KINDS) {
      for (let i = 0; i < 25; i++) {
        const r = seeded(710000 + i + gap * 17 + KINDS.indexOf(kind) * 37)
        const shape = makeShape(kind, r)
        const drawn = everyNth(wanders(shape.strokes, r, 3 * TOLERANCE[kind], 0.25), gap)
        const v = scoreTrace(shape.strokes, drawn, traceOptions(TOLERANCE[kind]))
        if (liveStray(drawn, shape.strokes, TOLERANCE[kind]) || isOffCourse(v, 'trace')) caught++
        tries++
      }
    }
    if (caught / tries < 0.97) fail(`sparse samples ${gap} units apart: a big wander is caught only ${pct(caught, tries)}`)
    console.log(`sparse ${String(gap).padStart(3)} units apart: a big wander is still caught ${pct(caught, tries)}`)
  }
}

// 2c. Letters always come in alphabet order (A to Z, a to z, 0 to 9; a capital then its small form for both),
//     going round again after the last. The level only changes how much of each is traced.
{
  const check = (ok: boolean, what: string) => { if (!ok) fail(what) }
  check(letterSequence('upper').join('') === 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'capitals are A to Z')
  check(letterSequence('lower').join('') === 'abcdefghijklmnopqrstuvwxyz', 'small letters are a to z')
  check(letterSequence('numbers').join('') === '0123456789', 'numbers are 0 to 9')
  check(letterSequence('both').length === 52 && letterSequence('both').slice(0, 6).join('') === 'AaBbCc' && letterSequence('both')[51] === 'z', 'both goes A a B b ... Z z')
  for (const which of ['upper', 'lower', 'both', 'numbers'] as const) {
    const seq = letterSequence(which)
    check(new Set(seq).size === seq.length && seq.every(c => makeLetter(c).strokes.length > 0), `${which}: distinct, and every one can be drawn`)
    let c: string | undefined; const seen: string[] = []
    for (let i = 0; i < seq.length; i++) { c = nextInSequence(seq, c); seen.push(c) }
    check(seen.join() === seq.join() && nextInSequence(seq, seq[seq.length - 1]) === seq[0], `${which}: goes through in order and round again`)
  }
  check(nextInSequence(['A', 'B'], 'Z') === 'A' && nextInSequence(['A', 'B']) === 'A', 'a letter not in the order starts from the first')
  check(MAX_LETTER_LEVEL === 3 && portionFor(1) === 0.5 && portionFor(2) === 0.75 && portionFor(3) === 1 && portionFor(9) === 1 && portionFor(0) === 0.5, 'levels ask for half, most, or all')
}

// 2e. How much of a letter is asked for. Level 1 is the start of it, level 2 most of it, level 3 all of it. The
//     part is made of the letter's own first strokes (or the first part of a single stroke), the line may go
//     on along the rest of the letter, and only the part has to be covered.
{
  const check = (ok: boolean, what: string) => { if (!ok) fail(what) }
  const len = (st: Pt[]) => st.slice(1).reduce((n, p, i) => n + dist2(st[i], p), 0)
  const dist2 = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)
  const total = (ss: Pt[][]) => ss.reduce((n, s) => n + len(s), 0)
  for (const ch of allCharacters()) {
    const whole = makeLetter(ch)
    check(!whole.full && whole.strokes.length > 0, `${ch}: the whole letter has no separate part`)
    let previous = 0
    for (const fraction of [0.5, 0.75]) {
      const part = makeLetter(ch, fraction)
      const ratio = total(part.strokes) / total(whole.strokes)
      check(part.full !== undefined && total(part.full) === total(whole.strokes), `${ch} ${fraction}: the whole letter is kept`)
      check(part.strokes.length > 0 && part.strokes[0][0].x === whole.strokes[0][0].x && part.strokes[0][0].y === whole.strokes[0][0].y, `${ch} ${fraction}: starts where the letter starts`)
      check(ratio >= 0.2 && ratio < 0.95, `${ch} ${fraction}: asks for ${(100 * ratio).toFixed(0)}% of the line`)
      check(ratio >= previous - 1e-9, `${ch}: more is asked for at the next level`)
      previous = ratio
      // each whole stroke in the part is the letter's own stroke, in order
      part.strokes.slice(0, -1).forEach((s, i) => check(s === whole.strokes[i] || JSON.stringify(s) === JSON.stringify(whole.strokes[i]), `${ch} ${fraction}: stroke ${i + 1} is the letter's own`))
    }
    check(total(makeLetter(ch, 0.5).strokes) <= total(makeLetter(ch, 0.75).strokes) + 1e-6, `${ch}: level 1 asks for no more than level 2`)
  }
  // Tracing the part passes; so does going on along the rest of the letter; the live check does not interrupt either;
  // tracing nothing of it, or only the rest, does not.
  for (const fraction of [0.5, 0.75]) {
    let partPass = 0, wholePass = 0, alarms = 0, restPass = 0, restTries = 0, n = 0
    for (const ch of allCharacters()) {
      for (let i = 0; i < 20; i++) {
        const r = seeded(810000 + i * 131 + ch.charCodeAt(0) + fraction * 100)
        const sh = makeLetter(ch, fraction)
        const full = sh.full!
        const opts = traceOptions(sh.tolerance)
        n++
        const drawnPart = childDraws(sh.strokes, r, 5)
        const vPart = scoreTrace(full, drawnPart, opts, sh.strokes)
        if (liveStray(drawnPart, full, sh.tolerance)) alarms++
        if (vPart.pass) partPass++
        const drawnWhole = childDraws(full, r, 5)
        const vWhole = scoreTrace(full, drawnWhole, opts, sh.strokes)
        if (liveStray(drawnWhole, full, sh.tolerance)) alarms++
        if (vWhole.pass) wholePass++
        // only the strokes that were NOT asked for: the part is not covered. (Skipped when the rest is a dab or lies on the part.)
        const rest = full.slice(sh.strokes.length)
        if (rest.length && total(rest) > 0.4 * total(sh.strokes) && fraction === 0.5) {
          restTries++
          if (scoreTrace(full, childDraws(rest, r, 5), opts, sh.strokes).pass) restPass++
        }
      }
    }
    if (partPass / n < 0.97) fail(`level ${fraction}: honestly tracing the part passes only ${pct(partPass, n)}`)
    if (wholePass / n < 0.95) fail(`level ${fraction}: tracing the whole letter anyway passes only ${pct(wholePass, n)}`)
    if (alarms / (2 * n) > 0.005) fail(`level ${fraction}: the live check interrupts honest tracing ${pct(alarms, 2 * n)}`)
    if (fraction === 0.5 && restPass / Math.max(1, restTries) > 0.05) fail(`level 0.5: tracing only the rest of the letter passes ${pct(restPass, restTries)}`)
    console.log(`part of a letter, asking for ${(fraction * 100).toFixed(0)}%: part passes ${pct(partPass, n)}, the whole letter ${pct(wholePass, n)}, interrupted ${pct(alarms, 2 * n)}${fraction === 0.5 ? `, only the rest passes ${pct(restPass, Math.max(1, restTries))}` : ''}`)
  }
}

// 2d. Not lifting the finger, and drawing past the end. A shape with several strokes (1, 2, 3...) is often
//     drawn without lifting, the strokes joined by a line, or in another order, and a line is often drawn a
//     little past its end. None of that is a wander: no "try again", the line must keep being drawn, and it
//     must count as done. Single-stroke shapes drawn a little past the end must too.
{
  const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)
  const connect = (a: Pt, b: Pt): Pt[] => { const n = Math.max(1, Math.round(dist(a, b) / 3)); return Array.from({ length: n }, (_, i) => ({ x: a.x + (b.x - a.x) * (i + 1) / n, y: a.y + (b.y - a.y) * (i + 1) / n })) }
  /** The strokes in `order`, joined by straight lines when `join`, each going `over` units past its end and back. */
  function oneLine(strokes: Pt[][], order: number[], r: () => number, join: boolean, over: number): Pt[][] {
    const lines: Pt[][] = []
    let cur: Pt[] = []
    for (const k of order) {
      const st = resample(strokes[k], 3)
      if (!join && cur.length) { lines.push(cur); cur = [] }
      if (cur.length) cur.push(...connect(cur[cur.length - 1], st[0]))
      cur.push(...st)
      if (over) {
        const a = st[st.length - 2] ?? st[0], b = st[st.length - 1], l = dist(a, b) || 1
        const e = { x: b.x + (b.x - a.x) / l * over, y: b.y + (b.y - a.y) / l * over }
        cur.push(...connect(b, e), ...connect(e, b))
      }
    }
    lines.push(cur)
    // the same slow drift as childDraws
    return lines.map(pts => { let nx = 0, ny = 0; return pts.map(p => { const a = 0.95, innov = 3 * 0.5 * Math.sqrt(1 - a * a); nx = a * nx + gauss(r) * innov; ny = a * ny + gauss(r) * innov; return { x: p.x + nx, y: p.y + ny } }) })
  }
  const multi = [
    ...KINDS.map(k => ({ id: k, make: (r: () => number) => makeShape(k, r) })),
    ...allCharacters().map(c => ({ id: c, make: () => makeLetter(c) })),
  ].filter(t => t.make(seeded(1)).strokes.length > 1)
  const single = [
    ...KINDS.map(k => ({ id: k, make: (r: () => number) => makeShape(k, r) })),
    ...allCharacters().map(c => ({ id: c, make: () => makeLetter(c) })),
  ].filter(t => t.make(seeded(1)).strokes.length === 1)
  const run = (name: string, set: typeof multi, join: boolean, reverse: boolean, over: number, need: number) => {
    let clean = 0, alarms = 0, n = 0; const bad: string[] = []
    for (const t of set) {
      for (let i = 0; i < 20; i++) {
        const r = seeded(730000 + i * 977 + t.id.charCodeAt(0) + over)
        const shape = t.make(r)
        const order = shape.strokes.map((_, k) => k)
        if (reverse) order.reverse()
        const drawn = oneLine(shape.strokes, order, r, join, over)
        const stray = liveStray(drawn, shape.strokes, shape.tolerance)
        const v = scoreTrace(shape.strokes, drawn, traceOptions(shape.tolerance))
        n++
        if (stray) alarms++
        if (v.pass && !stray) clean++
        else if (!bad.includes(t.id) && bad.length < 8) bad.push(t.id)
      }
    }
    if (clean / n < need) fail(`${name}: only ${pct(clean, n)} are drawn through cleanly (need ${(100 * need).toFixed(0)}%) e.g. ${bad.join(' ')}`)
    console.log(`${name.padEnd(46)} clean ${pct(clean, n)}, live alarm ${pct(alarms, n)}`)
  }
  run('several strokes, not lifting, in order', multi, true, false, 0, 0.99)
  run('several strokes, not lifting, any order', multi, true, true, 0, 0.92)
  run('several strokes, lifting, a little past each end', multi, false, false, 25, 0.99)
  run('several strokes, not lifting, past each end', multi, true, false, 25, 0.95)
  run('one stroke, a little past the end', single, false, false, 25, 0.99)
}

// 3. Things that must NOT pass.
for (const mode of ['trace', 'copy'] as const) {
  // a. half the shape. (A shorter straight line is still a good copy of a line.)
  for (const kind of KINDS) {
    if (mode === 'copy' && STRAIGHT.has(kind)) continue
    let pass = 0
    for (let i = 0; i < N; i++) {
      const r = seeded(7000 + i + KINDS.indexOf(kind) * 31)
      const shape = makeShape(kind, r)
      const half = shape.strokes.map(s => s.slice(0, Math.floor(s.length * 0.5)))
      if (verdict(mode, kind, shape.strokes, childDraws(half.length ? half : shape.strokes, r, 6, { transform: mode === 'copy' })).pass) pass++
    }
    if (pass / N > 0.02) fail(`${mode}: half of ${kind} passes ${pct(pass)}`)
  }
  // b. a dot, and a scribble
  for (let i = 0; i < N; i++) {
    const r = seeded(9000 + i)
    const kind = KINDS[i % KINDS.length]
    const shape = makeShape(kind, r)
    const dx = 100 + r() * 200, dy = 100 + r() * 100
    if (verdict(mode, kind, shape.strokes, [[{ x: dx, y: dy }, { x: dx + r() * 4, y: dy + r() * 4 }]]).pass) fail(`${mode}: a dot passed for ${kind}`)
    const scribble: Pt[][] = [Array.from({ length: 220 }, () => ({ x: 20 + r() * 360, y: 20 + r() * 260 }))]
    if (verdict(mode, kind, shape.strokes, scribble).pass) fail(`${mode}: a scribble passed for ${kind}`)
  }
}

// 4. A different shape must not pass for the one asked (copy mode, the lenient one).
//    Zigzag and wave are both "up and down all the way across", so each may be taken for the other.
// A staircase is a slanted line with corners; a square is a circle with corners. Both are close
// enough in outline that a loose copy of one can pass for the other; tracing tells them apart.
const FRIENDS = new Set(['zigzag|wave', 'wave|zigzag', 'steps|diagonal-up', 'diagonal-up|steps', 'circle|square', 'square|circle'])
for (const asked of KINDS) for (const drew of KINDS) {
  if (asked === drew) continue
  let pass = 0
  for (let i = 0; i < 120; i++) {
    const r = seeded(31000 + i + KINDS.indexOf(asked) * 977 + KINDS.indexOf(drew) * 13)
    const target = makeShape(asked, r), other = makeShape(drew, r)
    if (scoreCopy(target.strokes, childDraws(other.strokes, r, 6, { transform: true })).pass) pass++
  }
  if (pass / 120 > 0.05 && !FRIENDS.has(`${asked}|${drew}`)) fail(`copy: ${drew} is accepted for ${asked} (${pct(pass, 120)})`)
}

// 5. "Try again" and its buzz are for strays only. An unfinished line never gets them;
//    a scribble or a plainly wrong line always does.
{
  const cut = (strokes: Pt[][], f: number) => {
    const lens = strokes.map(s => s.slice(1).reduce((n, p, i) => n + Math.hypot(p.x - s[i].x, p.y - s[i].y), 0))
    let left = f * lens.reduce((a, b) => a + b, 0)
    const out: Pt[][] = []
    strokes.forEach((s, i) => {
      if (left <= 0) return
      if (left >= lens[i]) { out.push(s); left -= lens[i]; return }
      const pts = resample(s, 3)
      out.push(pts.slice(0, Math.max(2, Math.floor(pts.length * (left / lens[i])))))
      left = 0
    })
    return out
  }
  for (const mode of ['trace', 'copy'] as const) {
    let wrong = 0, tries = 0, alarms = 0
    for (const kind of KINDS) for (let i = 0; i < 150; i++) {
      const r = seeded(51000 + i + KINDS.indexOf(kind) * 211)
      const shape = makeShape(kind, r)
      const drawn = childDraws(cut(shape.strokes, 0.15 + r() * 0.75), r, 8, { transform: mode === 'copy', lift: true })
      tries++
      if (isOffCourse(verdict(mode, kind, shape.strokes, drawn), mode)) wrong++
      if (mode === 'trace' && liveStray(drawn, shape.strokes, TOLERANCE[kind])) alarms++
    }
    if (wrong / tries > 0.005) fail(`${mode}: ${pct(wrong, tries)} of unfinished lines were called off course`)
    if (alarms / tries > 0.005) fail(`${mode}: ${pct(alarms, tries)} of unfinished lines raised the live alarm`)
    console.log(`${mode.padEnd(5)} unfinished lines called off course: ${pct(wrong, tries)}${mode === 'trace' ? `, live alarm ${pct(alarms, tries)}` : ''}`)

    let missed = 0
    for (let i = 0; i < 300; i++) {
      const r = seeded(61000 + i)
      const kind = KINDS[i % KINDS.length]
      const shape = makeShape(kind, r)
      const scribble: Pt[][] = [Array.from({ length: 220 }, () => ({ x: 20 + r() * 360, y: 20 + r() * 260 }))]
      if (!isOffCourse(verdict(mode, kind, shape.strokes, scribble), mode)) missed++
    }
    if (missed / 300 > 0.02) fail(`${mode}: ${pct(missed, 300)} of scribbles were not called off course`)

    for (let i = 0; i < 100; i++) {
      const r = seeded(71000 + i)
      const kind = KINDS[i % KINDS.length]
      const shape = makeShape(kind, r)
      const x = 100 + r() * 200, y = 100 + r() * 100
      if (isOffCourse(verdict(mode, kind, shape.strokes, [[{ x, y }, { x: x + 3, y: y + 3 }]]), mode)) fail(`${mode}: a dot was called off course`)
    }
  }
  // a whole line drawn the wrong way is off course when tracing
  for (const [asked, drew] of [['vertical', 'horizontal'], ['horizontal', 'vertical'], ['diagonal-down', 'diagonal-up'], ['diagonal-up', 'diagonal-down']] as const) {
    let off = 0
    for (let i = 0; i < 100; i++) {
      const r = seeded(81000 + i)
      const target = makeShape(asked, r), other = makeShape(drew, r)
      if (isOffCourse(scoreTrace(target.strokes, childDraws(other.strokes, r, 6), traceOptions(TOLERANCE[asked])), 'trace')) off++
    }
    if (off < 95) fail(`trace: a ${drew} line drawn for ${asked} was called off course only ${off}% of the time`)
  }
}


// 6. Letters and numbers: every capital, small letter and digit, drawn like the shapes above.
{
  const LET = allCharacters() // every capital, every small letter, and the digits 0 to 9
  const lines = (id: string) => makeLetter(id)
  // Cut a letter after a fraction of its line (see section 5).
  const cutLetter = (strokes: Pt[][], f: number) => {
    const lens = strokes.map(s => s.slice(1).reduce((n, p, i) => n + Math.hypot(p.x - s[i].x, p.y - s[i].y), 0))
    let left = f * lens.reduce((a, b) => a + b, 0)
    const out: Pt[][] = []
    strokes.forEach((st, i) => {
      if (left <= 0) return
      if (left >= lens[i]) { out.push(st); left -= lens[i]; return }
      const pts = resample(st, 3)
      out.push(pts.slice(0, Math.max(2, Math.floor(pts.length * (left / lens[i])))))
      left = 0
    })
    return out
  }
  const NL = 150
  for (const [sigma, need] of [[5, 0.99], [8, 0.98]] as const) {
    let worst = 1, worstId = ''
    for (const ch of LET) {
      const sh = lines(ch)
      let pass = 0, alarm = 0, off = 0
      for (let i = 0; i < NL; i++) {
        const r = seeded(120000 + i * 13 + sigma * 1000 + LET.indexOf(ch) * 7)
        const drawn = childDraws(sh.strokes, r, sigma, { lift: true })
        const v = scoreTrace(sh.strokes, drawn, traceOptions(sh.tolerance))
        if (v.pass) pass++
        if (isOffCourse(v, 'trace')) off++
        if (liveStray(drawn, sh.strokes, sh.tolerance)) alarm++
      }
      if (pass / NL < worst) { worst = pass / NL; worstId = ch }
      if (pass / NL < need) fail(`letters wobble ${sigma}: ${ch} passes only ${pct(pass, NL)} (need ${(100 * need).toFixed(0)}%)`)
      if (alarm / NL > 0.015 || off / NL > 0.015) fail(`letters wobble ${sigma}: ${ch} honest drawing raised the alarm ${pct(alarm, NL)} / off course ${pct(off, NL)}`)
    }
    console.log(`letters wobble ${sigma}: worst letter (${worstId}) passes ${(100 * worst).toFixed(1)}%`)
  }

  // wandering off a letter is caught; unfinished letters, dots and scribbles behave
  let slipped = 0, caughtMin = 1, caughtId = '', unfinishedOff = 0, unfinishedTries = 0
  const shortLetters: string[] = []
  for (const ch of LET) {
    const sh = lines(ch)
    let caught = 0
    for (let i = 0; i < NL; i++) {
      const r = seeded(140000 + i * 11 + LET.indexOf(ch) * 5)
      // A stray is a fixed fraction of the line, but a short letter's line is short: keep the wander at least 60 units long.
      const len = sh.strokes.reduce((n, st) => n + st.slice(1).reduce((m, p, k) => m + Math.hypot(p.x - st[k].x, p.y - st[k].y), 0), 0)
      const drawn = wanders(sh.strokes, r, 2.2 * sh.tolerance, Math.min(0.6, Math.max(0.2, 60 / len)))
      const v = scoreTrace(sh.strokes, drawn, traceOptions(sh.tolerance))
      const live = liveStray(drawn, sh.strokes, sh.tolerance)
      if (live || isOffCourse(v, 'trace')) caught++
      if (v.pass && !live) slipped++
      const part = childDraws(cutLetter(sh.strokes, 0.15 + r() * 0.75), r, 8, { lift: true })
      unfinishedTries++
      if (isOffCourse(scoreTrace(sh.strokes, part, traceOptions(sh.tolerance)), 'trace')) unfinishedOff++
    }
    const total = sh.strokes.reduce((n, st) => n + st.slice(1).reduce((m, p, k) => m + Math.hypot(p.x - st[k].x, p.y - st[k].y), 0), 0)
    // A stray in a short letter is short: it can slip under the "off the line for a stretch" length
    // without ever being a wrong answer (it still does not count as done). Hold those to a lower bar.
    const needCaught = total < 300 ? 0.85 : 0.98
    if (caught / NL < 0.98) shortLetters.push(`${ch} ${(100 * caught / NL).toFixed(0)}%`)
    if (caught / NL < needCaught) fail(`letters: a wander off ${ch} is caught only ${(100 * caught / NL).toFixed(1)}% of the time (need ${(100 * needCaught).toFixed(0)}%)`)
    if (caught / NL < caughtMin) { caughtMin = caught / NL; caughtId = ch }
    for (let i = 0; i < 40; i++) {
      const r = seeded(160000 + i + LET.indexOf(ch) * 3)
      const scribble: Pt[][] = [Array.from({ length: 220 }, () => ({ x: 20 + r() * 360, y: 20 + r() * 260 }))]
      if (!isOffCourse(scoreTrace(sh.strokes, scribble, traceOptions(sh.tolerance)), 'trace')) fail(`letters: a scribble was not called off course for ${ch}`)
      const x = 100 + r() * 200, y = 100 + r() * 100
      const dot: Pt[][] = [[{ x, y }, { x: x + 3, y: y + 3 }]]
      const dv = scoreTrace(sh.strokes, dot, traceOptions(sh.tolerance))
      if (dv.pass || isOffCourse(dv, 'trace')) fail(`letters: a dot was judged for ${ch}`)
    }
  }
  const letterWanders = LET.length * NL
  if (slipped / letterWanders > 0.01) fail(`letters: ${pct(slipped, letterWanders)} of wanders got through as done`)
  if (unfinishedOff / unfinishedTries > 0.01) fail(`letters: ${pct(unfinishedOff, unfinishedTries)} of unfinished letters were called off course`)
  if (shortLetters.length) console.log(`letters below 98% on wanders (short letters, held to 85%): ${shortLetters.join(', ')}`)
  console.log(`letters: wander worst caught ${(100 * caughtMin).toFixed(1)}% (${caughtId}), slipped through ${pct(slipped, letterWanders)}, unfinished called off course ${pct(unfinishedOff, unfinishedTries)}`)

  // Mirror images must not be taken for each other when copying: b/d, p/q, and the like.
  for (const [a, b] of [['b', 'd'], ['p', 'q'], ['n', 'u'], ['M', 'W'], ['b', 'p'], ['d', 'q'], ['N', 'Z'], ['E', 'F'], ['6', '9'], ['2', '5']] as const) {
    for (const [asked, drew] of [[a, b], [b, a]] as const) {
      if (asked === 'F' || drew === 'E') continue // F is part of E; an E is a fine copy of an F is not required to fail
      let pass = 0
      for (let i = 0; i < 100; i++) {
        const r = seeded(180000 + i + asked.charCodeAt(0) * 7)
        if (scoreCopy(lines(asked).strokes, childDraws(lines(drew).strokes, r, 6, { transform: true })).pass) pass++
      }
      if (pass > 3) fail(`letters copy: ${drew} is accepted for ${asked} (${pass}%)`)
    }
  }
  // Tracing the wrong letter over the guide is off course (c with an o, and the like). Shapes that
  // lie almost on top of each other when stacked (a 1 over a 7, an l over an i) are left out: a child
  // following the dotted line is not drawing the other one.
  for (const [asked, drew] of [['c', 'o'], ['T', 'L'], ['H', 'N'], ['v', 'w'], ['u', 'n'], ['3', '8']] as const) {
    let off = 0
    for (let i = 0; i < 60; i++) {
      const r = seeded(190000 + i + asked.charCodeAt(0))
      const sh = lines(asked)
      const v = scoreTrace(sh.strokes, childDraws(lines(drew).strokes, r, 6), traceOptions(sh.tolerance))
      if (v.pass) fail(`letters trace: ${drew} traced over ${asked} counted as done`)
      if (isOffCourse(v, 'trace')) off++
    }
  }
}

console.log(`tolerances (units): ${KINDS.map(k => `${k} ${TOLERANCE[k]}`).join(', ')}; copy ${COPY.tolerance}`)
if (failures) { console.error(`\n${failures} problem(s)`); process.exit(1) }
console.log('all sound')
