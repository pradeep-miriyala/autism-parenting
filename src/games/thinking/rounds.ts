// The thinking games' content and rounds: How many?, What comes next?, Sort it, Odd one out, Jigsaw and
// Connect the dots. One file, dependency-free, so scripts/test-thinking.mts can check every round the games
// can make. The pictures are the drawings we already have (spot/art.tsx), plain coloured shapes and colours.
//
// ── Sections: catalogue · count · pattern · sort · odd · puzzle · dots ──


// ════════════ catalogue ════════════
// coloured shapes, and colours. Dependency-free: scripts/test-thinking.mts checks the games built on it.

export type Category = 'animals' | 'vehicles' | 'home' | 'school' | 'nature'

export const CATEGORY_LABEL: Record<Category, string> = {
  animals: 'Animals', vehicles: 'Vehicles', home: 'At home', school: 'At school', nature: 'Plants and shells',
}

/** One drawing: its kind (see spot/art.tsx), the word for it, what it is, and the colour key it is drawn in. */
export type Thing = { kind: string; word: string; category: Category; colour: string }

export const THINGS: Thing[] = [
  // animals
  { kind: 'farm.cow', word: 'cow', category: 'animals', colour: 'p' }, { kind: 'farm.pig', word: 'pig', category: 'animals', colour: 'y' },
  { kind: 'farm.hen', word: 'hen', category: 'animals', colour: 'y' }, { kind: 'sea.fish', word: 'fish', category: 'animals', colour: 'y' },
  { kind: 'sea.crab', word: 'crab', category: 'animals', colour: 'y' }, { kind: 'sea.octopus', word: 'octopus', category: 'animals', colour: 'y' },
  { kind: 'sea.star', word: 'starfish', category: 'animals', colour: 'y' }, { kind: 'sea.jelly', word: 'jellyfish', category: 'animals', colour: 'y' },
  { kind: 'animal.dog', word: 'dog', category: 'animals', colour: 'o' }, { kind: 'animal.cat', word: 'cat', category: 'animals', colour: 'y' },
  { kind: 'animal.duck', word: 'duck', category: 'animals', colour: 'y' }, { kind: 'animal.rabbit', word: 'rabbit', category: 'animals', colour: 'k' },
  { kind: 'animal.sheep', word: 'sheep', category: 'animals', colour: 'b' }, { kind: 'animal.elephant', word: 'elephant', category: 'animals', colour: 'b' },
  // vehicles
  { kind: 'farm.tractor', word: 'tractor', category: 'vehicles', colour: 'y' }, { kind: 'town.bus', word: 'bus', category: 'vehicles', colour: 'y' },
  { kind: 'town.car', word: 'car', category: 'vehicles', colour: 'r' }, { kind: 'town.bike', word: 'bicycle', category: 'vehicles', colour: 'y' },
  { kind: 'sea.boat', word: 'boat', category: 'vehicles', colour: 'y' },
  // at home
  { kind: 'home.sofa', word: 'sofa', category: 'home', colour: 'y' }, { kind: 'home.bed', word: 'bed', category: 'home', colour: 'y' },
  { kind: 'home.chair', word: 'chair', category: 'home', colour: 'y' }, { kind: 'home.lamp', word: 'lamp', category: 'home', colour: 'y' },
  { kind: 'home.cup', word: 'cup', category: 'home', colour: 'y' }, { kind: 'home.teddy', word: 'teddy bear', category: 'home', colour: 'y' },
  // at school
  { kind: 'school.book', word: 'book', category: 'school', colour: 'y' }, { kind: 'school.pencil', word: 'pencil', category: 'school', colour: 'y' },
  { kind: 'school.bag', word: 'bag', category: 'school', colour: 'y' }, { kind: 'school.ruler', word: 'ruler', category: 'school', colour: 'y' },
  { kind: 'school.clock', word: 'clock', category: 'school', colour: 'y' }, { kind: 'school.globe', word: 'globe', category: 'school', colour: 'y' },
  { kind: 'school.bell', word: 'bell', category: 'school', colour: 'y' },
  // plants and shells
  { kind: 'farm.tree', word: 'tree', category: 'nature', colour: 'g' }, { kind: 'farm.flower', word: 'flower', category: 'nature', colour: 'k' },
  { kind: 'sea.shell', word: 'shell', category: 'nature', colour: 'y' }, { kind: 'sea.weed', word: 'seaweed', category: 'nature', colour: 'g' },
  { kind: 'home.plant', word: 'plant', category: 'nature', colour: 'g' },
]

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[]
export const inCategory = (c: Category) => THINGS.filter(t => t.category === c)

/** The colours used for shapes (keys of spot's COLOURS) and their words. Six that are easy to tell apart. */
export const SHAPE_COLOURS: { key: string; word: string }[] = [
  { key: 'r', word: 'red' }, { key: 'b', word: 'blue' }, { key: 'g', word: 'green' },
  { key: 'y', word: 'yellow' }, { key: 'o', word: 'orange' }, { key: 'p', word: 'purple' },
]
export const SHAPES = ['circle', 'square', 'triangle', 'star'] as const
export type ShapeName = (typeof SHAPES)[number]

export function shuffle<T>(a: T[], rand: () => number): T[] {
  const out = a.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
export const pickOne = <T,>(a: T[], rand: () => number): T => a[Math.min(a.length - 1, Math.floor(rand() * a.length))]


// ════════════ count ════════════
export const COUNT_QUESTIONS = 5
/** The biggest number at each level. */
export const COUNT_MAX: Record<number, number> = { 1: 3, 2: 5, 3: 10 }
export const countMax = (level: number) => COUNT_MAX[Math.min(3, Math.max(1, Math.round(level)))]

export type CountQuestion = { n: number; thing: Thing; options: number[] }

/** Five questions: different numbers (no number twice in a row), different things, and three numbers to choose from. */
export function makeCountRound(level: number, rand: () => number = Math.random): CountQuestion[] {
  const max = countMax(level)
  const out: CountQuestion[] = []
  let last = 0
  const kinds = shuffle(THINGS, rand)
  for (let i = 0; i < COUNT_QUESTIONS; i++) {
    let n = 1 + Math.floor(rand() * max)
    for (let tries = 0; tries < 20 && n === last; tries++) n = 1 + Math.floor(rand() * max)
    if (n === last) n = n === max ? 1 : n + 1
    last = n
    // the numbers beside the answer are near it, so the child has to count and not just guess a size
    const pool = shuffle(Array.from({ length: max }, (_, k) => k + 1).filter(x => x !== n), rand)
    const near = pool.sort((a, b) => Math.abs(a - n) - Math.abs(b - n)).slice(0, 4)
    const options = shuffle([n, ...shuffle(near, rand).slice(0, Math.min(2, near.length))], rand)
    out.push({ n, thing: kinds[i % kinds.length], options })
  }
  return out
}

/** Where the things sit: rows of up to five, left to right, so there is a clear first, second, third. */
export function countLayout(n: number): { x: number; y: number }[] {
  const perRow = n <= 5 ? n : Math.ceil(n / 2)
  const rows = Math.ceil(n / perRow)
  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / perRow)
    const inRow = row === rows - 1 ? n - row * perRow : perRow
    const col = i - row * perRow
    return { x: (col + 0.5 + (perRow - inRow) / 2) / perRow, y: (row + 0.5) / rows }
  })
}


// ════════════ pattern ════════════
export const PATTERN_QUESTIONS = 5

/** What each pattern is made of, by level: the unit that repeats. 1 is two things alternating. */
export const UNITS: Record<number, string[][]> = {
  1: [['A', 'B']],
  2: [['A', 'A', 'B'], ['A', 'B', 'B']],
  3: [['A', 'B', 'C'], ['A', 'A', 'B'], ['A', 'B', 'B']],
}
export const unitsFor = (level: number) => UNITS[Math.min(3, Math.max(1, Math.round(level)))]

/** One thing in a pattern: a coloured shape, or a drawing. Enough to draw it and to tell it from another. */
export type Piece = { id: string; shape?: ShapeName; colour?: string; kind?: string; word: string }

export type PatternQuestion = {
  shown: Piece[]        // the pattern so far
  answer: Piece         // what comes next
  options: Piece[]      // what to choose from, the answer among them
  unit: string          // for tests and the screen reader: e.g. "ABB"
}

function makePieces(n: number, level: number, rand: () => number): Piece[] {
  // Level 1 is colours or shapes; later levels add drawings.
  const mode = level >= 3 && rand() < 0.4 ? 'things' : rand() < 0.5 ? 'colours' : 'shapes'
  if (mode === 'colours') {
    const shape = pickOne([...SHAPES], rand)
    return shuffle(SHAPE_COLOURS, rand).slice(0, n).map(c => ({ id: `${shape}-${c.key}`, shape, colour: c.key, word: `${c.word} ${shape}` }))
  }
  if (mode === 'shapes') {
    const colour = pickOne(SHAPE_COLOURS, rand)
    return shuffle([...SHAPES], rand).slice(0, n).map(s => ({ id: `${s}-${colour.key}`, shape: s as ShapeName, colour: colour.key, word: `${colour.word} ${s}` }))
  }
  // drawings from one group, so they are alike in kind and differ in look
  const group = shuffle(inCategory(pickOne(['animals', 'vehicles', 'home', 'school'] as const, rand)), rand).slice(0, n)
  return group.map(t => ({ id: t.kind, kind: t.kind, colour: t.colour, word: t.word }))
}

export function makePatternRound(level: number, rand: () => number = Math.random): PatternQuestion[] {
  const out: PatternQuestion[] = []
  let lastUnit = ''
  for (let i = 0; i < PATTERN_QUESTIONS; i++) {
    const units = unitsFor(level)
    const others = units.filter(u => u.join('') !== lastUnit)
    const unit = pickOne(others.length ? others : units, rand)   // a different pattern each time, where there is a choice
    lastUnit = unit.join('')
    const letters = [...new Set(unit)]
    const pieces = makePieces(letters.length + 1, level, rand)         // one spare, for a wrong choice
    const by: Record<string, Piece> = Object.fromEntries(letters.map((l, k) => [l, pieces[k]]))
    // the unit twice, then its first one again: enough to see it repeat, and what comes next is then certain
    const m = unit.length
    const shown = Array.from({ length: 2 * m + 1 }, (_, i) => by[unit[i % m]])
    const answer = by[unit[1]]   // after the first of a unit comes its second
    const wrong = pieces.filter(p => p.id !== answer.id)
    const options = shuffle([answer, ...shuffle(wrong, rand).slice(0, letters.length >= 3 ? 2 : 1)], rand)
    out.push({ shown, answer, options, unit: unit.join('') })
  }
  return out
}


// ════════════ sort ════════════
export type SortBy = 'colour' | 'shape' | 'size' | 'group'

export type SortItem = {
  id: string
  bin: string            // which bin it belongs in
  shape?: ShapeName; colour?: string; kind?: string; big?: boolean
  word: string
}
export type SortBin = { id: string; title: string; colour?: string; shape?: ShapeName; icon?: string }
export type SortRound = { by: SortBy; bins: SortBin[]; items: SortItem[]; rule: string }

export const SORT_LEVELS: Record<number, { items: number; bins: number[] }> = {
  1: { items: 4, bins: [2] },
  2: { items: 6, bins: [2, 3] },
  3: { items: 8, bins: [3] },
}
export const sortLevel = (level: number) => SORT_LEVELS[Math.min(3, Math.max(1, Math.round(level)))]

/** The ways to sort, by level: colour and size first, then shape and group. */
const BY: Record<number, SortBy[]> = { 1: ['colour', 'size'], 2: ['colour', 'size', 'shape', 'group'], 3: ['colour', 'shape', 'group'] }

export function makeSortRound(level: number, rand: () => number = Math.random): SortRound {
  const lv = sortLevel(level)
  const nBins = pickOne(lv.bins, rand)
  const by = pickOne(BY[Math.min(3, Math.max(1, Math.round(level)))], rand)
  const perBin = Math.ceil(lv.items / nBins)
  let bins: SortBin[] = []
  let items: SortItem[] = []

  if (by === 'colour') {
    const cols = shuffle(SHAPE_COLOURS, rand).slice(0, nBins)
    bins = cols.map(c => ({ id: c.key, title: c.word, colour: c.key }))
    items = cols.flatMap(c => Array.from({ length: perBin }, (_, i) => {
      const shape = pickOne([...SHAPES], rand)
      return { id: `${c.key}-${shape}-${i}`, bin: c.key, shape, colour: c.key, word: `${c.word} ${shape}` }
    }))
  } else if (by === 'shape') {
    const shapes = shuffle([...SHAPES], rand).slice(0, nBins)
    bins = shapes.map(s => ({ id: s, title: s, shape: s as ShapeName }))
    items = shapes.flatMap(s => Array.from({ length: perBin }, (_, i) => {
      const c = pickOne(SHAPE_COLOURS, rand)
      return { id: `${s}-${c.key}-${i}`, bin: s, shape: s as ShapeName, colour: c.key, word: `${c.word} ${s}` }
    }))
  } else if (by === 'size') {
    bins = [{ id: 'big', title: 'big', icon: '🐘' }, { id: 'small', title: 'small', icon: '🐭' }]
    const things = shuffle(inCategory(pickOne(['animals', 'vehicles', 'home', 'school'] as Category[], rand)), rand)
    items = Array.from({ length: lv.items }, (_, i) => {
      const t = things[i % things.length]
      const big = i % 2 === 0
      return { id: `${t.kind}-${big ? 'big' : 'small'}-${i}`, bin: big ? 'big' : 'small', kind: t.kind, colour: t.colour, big, word: `${big ? 'big' : 'small'} ${t.word}` }
    })
  } else {
    const cats = shuffle([...CATEGORIES], rand).slice(0, nBins)
    bins = cats.map(c => ({ id: c, title: CATEGORY_LABEL[c] }))
    items = cats.flatMap(c => shuffle(inCategory(c), rand).slice(0, perBin).map(t => ({ id: t.kind, bin: c, kind: t.kind, colour: t.colour, word: t.word })))
  }
  items = items.slice(0, lv.items)
  // an order where the same bin does not come three times running
  const streak = (a: SortItem[]) => a.some((x, i) => i >= 2 && a[i - 1].bin === x.bin && a[i - 2].bin === x.bin)
  let order = shuffle(items, rand)
  for (let tries = 0; tries < 100 && streak(order); tries++) order = shuffle(items, rand)
  const rule = by === 'colour' ? 'Sort by colour.' : by === 'shape' ? 'Sort by shape.' : by === 'size' ? 'Sort by size: big or small.' : 'Sort by what they are.'
  return { by, bins, items: order, rule }
}


// ════════════ odd ════════════
export const ODD_QUESTIONS = 5

export type OddPiece = { id: string; shape?: ShapeName; colour?: string; kind?: string; big?: boolean; word: string }
export type OddQuestion = { pieces: OddPiece[]; odd: number; why: string }

/** Level 1: three things, one of a different kind. 2: four, one of a different kind. 3: four shapes, one different in colour, shape or size. */
export const oddCount = (level: number) => (level <= 1 ? 3 : 4)

function byKind(level: number, rand: () => number): OddQuestion {
  const n = oddCount(level)
  const [a, b] = shuffle([...CATEGORIES] as Category[], rand)
  const same = shuffle(inCategory(a), rand).slice(0, n - 1)
  const other = pickOne(inCategory(b), rand)
  const pieces = same.map(t => ({ id: t.kind, kind: t.kind, colour: t.colour, word: t.word }))
  const odd = { id: other.kind, kind: other.kind, colour: other.colour, word: other.word }
  const at = Math.floor(rand() * n)
  pieces.splice(at, 0, odd)
  return { pieces, odd: at, why: `${other.word} is not like the others` }
}

function byLook(rand: () => number): OddQuestion {
  const n = 4
  const mode = pickOne(['colour', 'shape', 'size'] as const, rand)
  const cols = shuffle(SHAPE_COLOURS, rand)
  const shapes = shuffle([...SHAPES], rand)
  const at = Math.floor(rand() * n)
  const make = (i: number): OddPiece => {
    const odd = i === at
    if (mode === 'colour') { const c = odd ? cols[1] : cols[0]; return { id: `${shapes[0]}-${c.key}`, shape: shapes[0] as ShapeName, colour: c.key, word: `${c.word} ${shapes[0]}` } }
    if (mode === 'shape') { const s = odd ? shapes[1] : shapes[0]; return { id: `${s}-${cols[0].key}`, shape: s as ShapeName, colour: cols[0].key, word: `${cols[0].word} ${s}` } }
    return { id: `${shapes[0]}-${cols[0].key}-${odd ? 'small' : 'big'}`, shape: shapes[0] as ShapeName, colour: cols[0].key, big: !odd, word: `${odd ? 'small' : 'big'} ${shapes[0]}` }
  }
  return { pieces: Array.from({ length: n }, (_, i) => make(i)), odd: at, why: `this one is a different ${mode}` }
}

export function makeOddRound(level: number, rand: () => number = Math.random): OddQuestion[] {
  const out: OddQuestion[] = []
  for (let i = 0; i < ODD_QUESTIONS; i++) {
    let q: OddQuestion
    do {
      q = level >= 3 && rand() < 0.75 ? byLook(rand) : byKind(level, rand)
    } while (out.length > 0 && q.odd === out[out.length - 1].odd && rand() < 0.7)   // the odd one moves about
    out.push(q)
  }
  return out
}


// ════════════ puzzle ════════════
export const PUZZLE_GRID: Record<number, { cols: number; rows: number }> = {
  1: { cols: 2, rows: 2 }, 2: { cols: 3, rows: 2 }, 3: { cols: 3, rows: 3 }, 4: { cols: 4, rows: 3 },
}
export const puzzleGrid = (level: number) => PUZZLE_GRID[Math.min(4, Math.max(1, Math.round(level)))]

/** The pieces are numbered 0.. across then down. `tray` is the order they sit in, never the finished order. */
export function makePuzzle(level: number, rand: () => number = Math.random): { cols: number; rows: number; tray: number[] } {
  const { cols, rows } = puzzleGrid(level)
  const n = cols * rows
  const solved = Array.from({ length: n }, (_, i) => i)
  let tray = shuffle(solved, rand)
  // not the finished order, and not a piece or two already in their place: that would be a gift, not a puzzle
  const home = (t: number[]) => t.filter((p, i) => p === i).length
  for (let tries = 0; tries < 100 && home(tray) > 0; tries++) tray = shuffle(solved, rand)
  return { cols, rows, tray }
}

/** The part of a picture (in its own units) that a piece shows. */
export function pieceBox(index: number, cols: number, rows: number, w: number, h: number) {
  const cw = w / cols, ch = h / rows
  return { x: (index % cols) * cw, y: Math.floor(index / cols) * ch, w: cw, h: ch }
}


// ════════════ dots ════════════
//
// Each picture is a closed outline (its corners). Easy rounds use the corners alone; harder ones add dots
// along the longest sides. Dependency-free: scripts/test-thinking.mts checks every picture at every level.

export type P = { x: number; y: number }
export type Design = { id: string; name: string; colour: string; corners: P[] }

const star = (cx: number, cy: number, R: number, r: number, n = 5): P[] =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / n
    const rad = i % 2 === 0 ? R : r
    return { x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad }
  })
const heart = (cx: number, cy: number, s: number, n = 12): P[] =>
  Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2
    return { x: cx + s * 16 * Math.sin(t) ** 3, y: cy - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) }
  })

export const DESIGNS: Design[] = [
  { id: 'kite', name: 'a kite', colour: 'r', corners: [{ x: 200, y: 25 }, { x: 295, y: 135 }, { x: 200, y: 275 }, { x: 105, y: 135 }] },
  { id: 'house', name: 'a house', colour: 'o', corners: [{ x: 90, y: 270 }, { x: 90, y: 150 }, { x: 200, y: 45 }, { x: 310, y: 150 }, { x: 310, y: 270 }] },
  { id: 'boat', name: 'a boat', colour: 'b', corners: [{ x: 60, y: 185 }, { x: 185, y: 185 }, { x: 185, y: 40 }, { x: 300, y: 165 }, { x: 345, y: 185 }, { x: 290, y: 262 }, { x: 110, y: 262 }] },
  { id: 'arrow', name: 'an arrow', colour: 'g', corners: [{ x: 50, y: 115 }, { x: 215, y: 115 }, { x: 215, y: 40 }, { x: 350, y: 150 }, { x: 215, y: 260 }, { x: 215, y: 185 }, { x: 50, y: 185 }] },
  { id: 'star', name: 'a star', colour: 'y', corners: star(200, 160, 125, 52) },
  { id: 'rocket', name: 'a rocket', colour: 'p', corners: [{ x: 200, y: 20 }, { x: 248, y: 85 }, { x: 248, y: 205 }, { x: 295, y: 255 }, { x: 250, y: 255 }, { x: 226, y: 232 }, { x: 174, y: 232 }, { x: 150, y: 255 }, { x: 105, y: 255 }, { x: 152, y: 205 }, { x: 152, y: 85 }] },
  { id: 'tree', name: 'a tree', colour: 'g', corners: [{ x: 200, y: 20 }, { x: 285, y: 105 }, { x: 242, y: 105 }, { x: 305, y: 180 }, { x: 222, y: 180 }, { x: 222, y: 275 }, { x: 178, y: 275 }, { x: 178, y: 180 }, { x: 95, y: 180 }, { x: 158, y: 105 }, { x: 115, y: 105 }] },
  { id: 'heart', name: 'a heart', colour: 'r', corners: heart(200, 150, 8.2) },
]

/** How many dots at each level. */
export const DOTS_RANGE: Record<number, [number, number]> = { 1: [4, 6], 2: [7, 10], 3: [11, 16] }
export const dotsRange = (level: number) => DOTS_RANGE[Math.min(3, Math.max(1, Math.round(level)))]

const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y)

/** `count` dots round the outline: the corners, then the middles of the longest sides until there are enough. */
export function dotsFor(design: Design, count: number): P[] {
  const pts = design.corners.map(p => ({ ...p }))
  const adds = new Map<number, number>()   // how many extra dots on each side
  const sideLen = (i: number) => dist(pts[i], pts[(i + 1) % pts.length]) / ((adds.get(i) || 0) + 1)
  while (pts.length + [...adds.values()].reduce((a, b) => a + b, 0) < count) {
    let best = 0
    for (let i = 1; i < pts.length; i++) if (sideLen(i) > sideLen(best)) best = i
    adds.set(best, (adds.get(best) || 0) + 1)
  }
  const out: P[] = []
  pts.forEach((p, i) => {
    out.push(p)
    const k = adds.get(i) || 0
    const q = pts[(i + 1) % pts.length]
    for (let j = 1; j <= k; j++) out.push({ x: p.x + ((q.x - p.x) * j) / (k + 1), y: p.y + ((q.y - p.y) * j) / (k + 1) })
  })
  return out
}

export type DotsRound = { design: Design; dots: P[] }

export function makeDotsRound(level: number, rand: () => number = Math.random, avoid?: string): DotsRound {
  const [lo, hi] = dotsRange(level)
  const fits = DESIGNS.filter(d => d.corners.length <= hi && d.id !== avoid)
  const pool = fits.length ? fits : DESIGNS.filter(d => d.corners.length <= hi)
  const design = pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))]
  const want = Math.max(design.corners.length, lo + Math.floor(rand() * (hi - lo + 1)))
  return { design, dots: dotsFor(design, Math.min(want, hi)) }
}

/** Do two segments cross (not just meet at an end)? For checking that an outline does not cross itself. */
export function crosses(a: P, b: P, c: P, d: P): boolean {
  const o = (p: P, q: P, r: P) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x))
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b) && o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0
}


// ── A picture made for a jigsaw ──
// Every piece must have something of its own on it. A piece that is only background looks like any other such
// piece, and a child would be told "wrong" for a fit that looks right. So the picture has one different drawing
// near the middle of every cell, nudged a little so some cross the edges between pieces.

export type PuzzleObj = { id: number; kind: string; x: number; y: number; scale: number; colour: string }
export type PuzzleScene = { bg: string; objs: PuzzleObj[] }

const PUZZLE_BG = ['#EAF3DC', '#E1F0FA', '#F4F0E3', '#F6EEDD', '#F8EBE2']

export function makePuzzleScene(cols: number, rows: number, w: number, h: number, rand: () => number = Math.random): PuzzleScene {
  const cw = w / cols, ch = h / rows
  const kinds = shuffle(THINGS, rand).slice(0, cols * rows)
  const scale = (Math.min(cw, ch) / 80) * 0.85
  const objs = kinds.map((t, i) => ({
    id: i, kind: t.kind, colour: t.colour, scale,
    x: (i % cols + 0.5) * cw + (rand() - 0.5) * cw * 0.25,
    y: (Math.floor(i / cols) + 0.5) * ch + (rand() - 0.5) * ch * 0.25,
  }))
  return { bg: pickOne(PUZZLE_BG, rand), objs }
}
