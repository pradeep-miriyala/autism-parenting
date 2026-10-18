// Maze: the maze itself, its way through, and how a path grows as a finger moves. No imports, so scripts/test-maze.mts
// can check it. Every maze is a "perfect" one: from the start there is exactly one way to the end and no loops, so
// there is never a choice that looks right and is not. Walls cannot be crossed: the path just stops at one.

export const MAZE_LEVELS: Record<number, { cols: number; rows: number }> = {
  1: { cols: 4, rows: 3 }, 2: { cols: 5, rows: 4 }, 3: { cols: 8, rows: 6 },
}
export const mazeLevel = (level: number) => MAZE_LEVELS[Math.min(3, Math.max(1, Math.round(level)))]

export const N = 1, E = 2, S = 4, W = 8
export type Rand = () => number

export type Maze = {
  cols: number
  rows: number
  /** For each cell, which of its four sides are open (N, E, S, W added together). */
  open: number[]
  start: number
  end: number
}

const DIRS: { bit: number; back: number; dx: number; dy: number }[] = [
  { bit: N, back: S, dx: 0, dy: -1 }, { bit: E, back: W, dx: 1, dy: 0 },
  { bit: S, back: N, dx: 0, dy: 1 }, { bit: W, back: E, dx: -1, dy: 0 },
]

export const cellXY = (m: { cols: number }, i: number) => ({ x: i % m.cols, y: Math.floor(i / m.cols) })

/** The cells you can step to from `i` without meeting a wall. */
export function neighbours(m: Maze, i: number): number[] {
  const { x, y } = cellXY(m, i)
  return DIRS.filter(d => m.open[i] & d.bit).map(d => (y + d.dy) * m.cols + x + d.dx)
}

export function canMove(m: Maze, from: number, to: number): boolean {
  return Number.isInteger(from) && Number.isInteger(to) && from >= 0 && to >= 0 && from < m.open.length && to < m.open.length && neighbours(m, from).includes(to)
}

/** The one way from `a` to `b`, both included, or [] if there is none. */
export function route(m: Maze, a: number, b: number): number[] {
  const from = new Map<number, number>([[a, -1]])
  const queue = [a]
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q]
    if (c === b) break
    for (const n of neighbours(m, c)) if (!from.has(n)) { from.set(n, c); queue.push(n) }
  }
  if (!from.has(b)) return []
  const out: number[] = []
  for (let c = b; c !== -1; c = from.get(c)!) out.push(c)
  return out.reverse()
}
export const solution = (m: Maze) => route(m, m.start, m.end)

export function makeMaze(level: number, rand: Rand = Math.random): Maze {
  const { cols, rows } = mazeLevel(level)
  const open = new Array<number>(cols * rows).fill(0)
  const seen = new Array<boolean>(cols * rows).fill(false)
  // a walk that digs forward and backs up when it is stuck, so the passages wind about
  const stack = [Math.floor(rand() * cols * rows)]
  seen[stack[0]] = true
  while (stack.length) {
    const c = stack[stack.length - 1]
    const { x, y } = cellXY({ cols }, c)
    const options = DIRS.filter(d => {
      const nx = x + d.dx, ny = y + d.dy
      return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny * cols + nx]
    })
    if (!options.length) { stack.pop(); continue }
    const d = options[Math.min(options.length - 1, Math.floor(rand() * options.length))]
    const n = (y + d.dy) * cols + x + d.dx
    open[c] |= d.bit
    open[n] |= d.back
    seen[n] = true
    stack.push(n)
  }
  // start and end in opposite corners: whichever diagonal has the longer way, and either way round
  const maze: Maze = { cols, rows, open, start: 0, end: cols * rows - 1 }
  const diagonals: [number, number][] = [[0, cols * rows - 1], [cols - 1, (rows - 1) * cols]]
  const best = diagonals.reduce((a, b) => (route(maze, ...b).length > route(maze, ...a).length ? b : a))
  const flip = rand() < 0.5
  maze.start = flip ? best[1] : best[0]
  maze.end = flip ? best[0] : best[1]
  return maze
}

/**
 * The path after the pen moves into `cell`. Into the next cell through an open side: the path grows. Back into the cell
 * it came from: it shrinks. Into a wall, or anywhere else: nothing changes.
 */
export function stepPath(m: Maze, path: readonly number[], cell: number): number[] {
  const head = path[path.length - 1]
  if (cell === head || !canMove(m, head, cell)) {
    if (path.length >= 2 && cell === path[path.length - 2]) return path.slice(0, -1)
    return path.slice()
  }
  if (path.includes(cell)) return path.length >= 2 && cell === path[path.length - 2] ? path.slice(0, -1) : path.slice()
  return [...path, cell]
}

/** Which cell a point is in (the maze is drawn `w` by `h`), or -1 outside it. */
export function cellAt(m: Maze, x: number, y: number, w: number, h: number): number {
  if (!(x >= 0 && y >= 0 && x < w && y < h)) return -1
  return Math.floor(y / (h / m.rows)) * m.cols + Math.floor(x / (w / m.cols))
}

/**
 * The finger moves from one point to another. Everything between is looked at in small steps, so a quick swipe does
 * not skip a wall: the path follows as far as the passages allow and stops where a wall is. `blocked` is the cell the
 * finger tried to enter through a wall, if it did.
 */
export function walk(m: Maze, path: readonly number[], a: { x: number; y: number }, b: { x: number; y: number }, w: number, h: number): { path: number[]; blocked: number | null } {
  const step = Math.min(w / m.cols, h / m.rows) / 4
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step))
  let p = path.slice()
  let blocked: number | null = null
  for (let k = 1; k <= n; k++) {
    const c = cellAt(m, a.x + ((b.x - a.x) * k) / n, a.y + ((b.y - a.y) * k) / n, w, h)
    if (c < 0 || c === p[p.length - 1]) continue
    const head = p[p.length - 1]
    const next = stepPath(m, p, c)
    // the finger is in the cell beside the head, and there is a wall between them
    if (next.length === p.length && next.every((v, i) => v === p[i]) && isNextTo(m, head, c) && !canMove(m, head, c)) blocked = c
    p = next
  }
  return { path: p, blocked }
}

function isNextTo(m: Maze, a: number, b: number) {
  const p = cellXY(m, a), q = cellXY(m, b)
  return Math.abs(p.x - q.x) + Math.abs(p.y - q.y) === 1
}

/**
 * The way on, for a hint: from the last cell of the path that is on the way through, the next few cells. If the path
 * has gone up a dead end, that is where to go back to.
 */
export function hintCells(m: Maze, path: readonly number[], count = 4): number[] {
  const way = solution(m)
  // the last cell of the path, counting from the start, that is still on the way through
  let last = 0
  for (const c of path) { const k = way.indexOf(c); if (k < 0) break; last = k }
  return way.slice(last, last + count + 1)
}
