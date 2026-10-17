// Spot the Differences: the picture generator.
//
// A scene is a handful of objects placed on a grid of cells. The second scene is a
// copy with N changes made on purpose, so the differences are DATA we know, never
// something found by comparing pixels. That is what lets a script check thousands
// of generated pairs: exactly N differences, far enough apart, big enough, and
// visible by lightness as well as by hue. If a pair is ever wrong, fix this file,
// not the one picture.
//
// Dependency-free on purpose: scripts/test-spot.ts imports it directly.

export type ThemeId = 'farm' | 'sea' | 'town' | 'school' | 'home'
export type DiffKind = 'colour' | 'missing' | 'extra' | 'size'

export type Obj = { id: number; kind: string; slot: number; x: number; y: number; scale: number; colour: string }
export type Scene = { theme: ThemeId; bg: string; objs: Obj[] }
export type Diff = { id: number; kind: DiffKind; x: number; y: number; r: number }
export type Pair = { a: Scene; b: Scene; diffs: Diff[] }

export const VIEW = { w: 400, h: 300 }
const COLS = 4, ROWS = 3, CELL = 100
export const SLOTS = COLS * ROWS
export const BASE_SCALE = 0.8   // an object is drawn 80 units high at scale 1
export const BIG_SCALE = 1.12   // a "bigger" object: 1.4 times the base
export const MAX_OBJECTS = 10   // leaves free cells for added objects

// Soft, friendly colours. Yellow is the hub: it differs in lightness from every
// other colour, so each colour change can be seen without telling hues apart.
export const COLOURS: Record<string, string> = {
  y: '#F5CE4F', o: '#EF8F3F', g: '#3F9F68', r: '#C9392F', b: '#2F58B8', p: '#6B3FAE', k: '#F2A0BE',
}
export const MIN_LIGHTNESS_GAP = 0.18

export function luminance(hex: string) {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const visiblyDifferent = (a: string, b: string) =>
  Math.abs(luminance(COLOURS[a]) - luminance(COLOURS[b])) >= MIN_LIGHTNESS_GAP

// Each kind of object and the colours that suit it (letters from COLOURS). Every
// pool holds yellow, so any colour in it has a partner it can change to.
export const THEMES: { id: ThemeId; label: string; emoji: string; bg: string; kinds: Record<string, string> }[] = [
  { id: 'farm', label: 'Farm', emoji: '🐄', bg: '#EAF3DC', kinds: {
    'farm.barn': 'yrb', 'farm.tree': 'ygo', 'farm.cow': 'ypb', 'farm.pig': 'ykr', 'farm.hen': 'yor',
    'farm.hay': 'yrb', 'farm.tractor': 'yrg', 'farm.flower': 'ykp' } },
  { id: 'sea', label: 'Sea', emoji: '🐠', bg: '#E1F0FA', kinds: {
    'sea.fish': 'yor', 'sea.crab': 'yrp', 'sea.star': 'yor', 'sea.octopus': 'ykp', 'sea.boat': 'yrb',
    'sea.shell': 'ykg', 'sea.jelly': 'ykp', 'sea.weed': 'ygo' } },
  { id: 'town', label: 'Town', emoji: '🏘️', bg: '#F4F0E3', kinds: {
    'town.house': 'yrb', 'town.car': 'yrb', 'town.bus': 'yrg', 'town.light': 'yrg', 'town.tree': 'ygo',
    'town.lamp': 'yrb', 'town.bike': 'yrb', 'town.shop': 'ykp' } },
  { id: 'school', label: 'School', emoji: '🎒', bg: '#F6EEDD', kinds: {
    'school.book': 'yrb', 'school.pencil': 'yrb', 'school.bag': 'yrb', 'school.ruler': 'ygb', 'school.clock': 'yrb',
    'school.globe': 'ygb', 'school.apple': 'yrg', 'school.bell': 'yrb' } },
  { id: 'home', label: 'Home', emoji: '🛋️', bg: '#F8EBE2', kinds: {
    'home.sofa': 'yrb', 'home.lamp': 'yrb', 'home.bed': 'ykb', 'home.cup': 'yrb', 'home.plant': 'ygo',
    'home.chair': 'yrb', 'home.teddy': 'ykb', 'home.clock': 'yrb' } },
]
export const themeById = (id: ThemeId) => THEMES.find(t => t.id === id)!

/** A small seeded random source, so a pair can be rebuilt from its seed in a test. */
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rand: () => number) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const pick = <T,>(arr: T[], rand: () => number) => arr[Math.floor(rand() * arr.length)]

const slotCentre = (slot: number, rand: () => number) => ({
  // A little jitter keeps it from looking like a grid. It is small enough that even
  // the biggest object (BIG_SCALE) stays inside its own cell, and so inside the picture.
  x: (slot % COLS) * CELL + CELL / 2 + (rand() - 0.5) * 8,
  y: Math.floor(slot / COLS) * CELL + CELL / 2 + (rand() - 0.5) * 8,
})

/** How many objects a scene holds for N differences: busier as it gets harder. */
export const objectCount = (n: number) => Math.min(MAX_OBJECTS, 5 + n)

export function makePair(theme: ThemeId, n: number, rand: () => number = Math.random): Pair {
  const th = themeById(theme)
  const kinds = Object.keys(th.kinds)
  const total = objectCount(n)

  // Base scene: distinct cells, at most two of any one kind.
  const slots = shuffle([...Array(SLOTS).keys()], rand)
  const kindBag = shuffle([...kinds, ...kinds], rand)
  let nextId = 1
  const base: Obj[] = slots.slice(0, total).map((slot, i) => {
    const kind = kindBag[i]
    const { x, y } = slotCentre(slot, rand)
    return { id: nextId++, kind, slot, x, y, scale: BASE_SCALE, colour: pick(th.kinds[kind].split(''), rand) }
  })
  const freeSlots = slots.slice(total)

  // The kinds of change: all different up to four, then one more repeat of a
  // non-colour kind, and never more than one colour change.
  const pool = shuffle<DiffKind>(['missing', 'extra', 'size', 'colour'], rand)
  const kindsOfChange: DiffKind[] = pool.slice(0, Math.min(n, 4))
  if (n === 5) kindsOfChange.push(pick<DiffKind>(['missing', 'extra', 'size'], rand))

  const b: Obj[] = base.map(o => ({ ...o }))
  const diffs: Diff[] = []
  const candidates = shuffle(base.map(o => o.id), rand)
  let freeUsed = 0

  kindsOfChange.forEach((kind, i) => {
    if (kind === 'extra') {
      const slot = freeSlots[freeUsed++]
      const k = pick(kinds, rand)
      const { x, y } = slotCentre(slot, rand)
      const o: Obj = { id: nextId++, kind: k, slot, x, y, scale: BASE_SCALE, colour: pick(th.kinds[k].split(''), rand) }
      b.push(o)
      diffs.push({ id: i + 1, kind, x: o.x, y: o.y, r: 38 })
      return
    }
    const id = candidates.pop()!
    const idx = b.findIndex(o => o.id === id)
    const o = b[idx]
    if (kind === 'missing') b.splice(idx, 1)
    if (kind === 'size') o.scale = BIG_SCALE
    if (kind === 'colour') {
      const others = th.kinds[o.kind].split('').filter(c => c !== o.colour && visiblyDifferent(c, o.colour))
      o.colour = pick(others, rand)
    }
    diffs.push({ id: i + 1, kind, x: o.x, y: o.y, r: kind === 'size' ? 46 : 38 })
  })

  // Which picture is "the original" is a coin toss, so the extra and the missing
  // one are not always on the same side.
  const sceneA: Scene = { theme, bg: th.bg, objs: base }
  const sceneB: Scene = { theme, bg: th.bg, objs: b }
  return rand() < 0.5 ? { a: sceneA, b: sceneB, diffs } : { a: sceneB, b: sceneA, diffs }
}

export type TapResult =
  | { type: 'new'; diff: Diff }
  | { type: 'again' }
  | { type: 'miss' }

/** What a tap at (x, y) in picture units means. `slack` forgives small fingers. */
export function classifyTap(diffs: Diff[], found: Set<number>, x: number, y: number, slack = 20): TapResult {
  let best: { d: Diff; dist: number } | null = null
  for (const d of diffs) {
    const dist = Math.hypot(d.x - x, d.y - y)
    if (dist <= d.r + slack && (!best || dist < best.dist)) best = { d, dist }
  }
  if (!best) return { type: 'miss' }
  return found.has(best.d.id) ? { type: 'again' } : { type: 'new', diff: best.d }
}

/** For the hint: the first difference not found yet. */
export const nextUnfound = (diffs: Diff[], found: Set<number>) => diffs.find(d => !found.has(d.id))

/** Everything that must hold for a pair. Returns the problems; empty means sound. */
export function validate(pair: Pair, n: number): string[] {
  const problems: string[] = []
  const { a, b, diffs } = pair
  if (diffs.length !== n) problems.push(`expected ${n} differences, got ${diffs.length}`)

  // Rebuild the differences by comparing the two scenes cell by cell.
  const byId = (s: Scene) => new Map(s.objs.map(o => [o.id, o]))
  const A = byId(a), B = byId(b)
  const found: string[] = []
  for (const [id, oa] of A) {
    const ob = B.get(id)
    if (!ob) found.push(`only-in-a:${id}`)
    else if (oa.colour !== ob.colour) found.push(`colour:${id}`)
    else if (oa.scale !== ob.scale) found.push(`size:${id}`)
    else if (oa.kind !== ob.kind || oa.slot !== ob.slot) problems.push(`object ${id} changed in an unlisted way`)
  }
  for (const id of B.keys()) if (!A.has(id)) found.push(`only-in-b:${id}`)
  if (found.length !== n) problems.push(`scenes differ in ${found.length} places, expected ${n}`)

  for (const s of [a, b]) {
    const slotsUsed = new Set<number>()
    for (const o of s.objs) {
      if (slotsUsed.has(o.slot)) problems.push(`two objects share cell ${o.slot}`)
      slotsUsed.add(o.slot)
      const half = 40 * o.scale
      if (o.x - half < 0 || o.x + half > VIEW.w || o.y - half < 0 || o.y + half > VIEW.h) problems.push(`object ${o.id} leaves the picture`)
    }
    if (s.objs.length > MAX_OBJECTS + 2) problems.push('too many objects')
  }

  for (let i = 0; i < diffs.length; i++) {
    for (let j = i + 1; j < diffs.length; j++) {
      const d = Math.hypot(diffs[i].x - diffs[j].x, diffs[i].y - diffs[j].y)
      if (d < 80) problems.push(`differences ${diffs[i].id} and ${diffs[j].id} are only ${Math.round(d)} apart`)
    }
  }

  for (const d of diffs) {
    if (d.kind === 'colour') {
      const [x] = [...A.values()].filter(o => Math.hypot(o.x - d.x, o.y - d.y) < 1)
      const y = [...B.values()].find(o => x && o.id === x.id)
      if (!x || !y || !visiblyDifferent(x.colour, y.colour)) problems.push(`colour change ${d.id} is not clear by lightness`)
    }
    if (d.kind === 'size') {
      const x = [...A.values()].find(o => Math.hypot(o.x - d.x, o.y - d.y) < 1)
      const y = x && B.get(x.id)
      if (!x || !y || Math.max(x.scale, y.scale) / Math.min(x.scale, y.scale) < 1.35) problems.push(`size change ${d.id} is too small to see`)
    }
  }
  return problems
}
