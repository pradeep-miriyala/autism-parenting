// scripts/test-maze.mts
// Checks the maze: every maze is perfect (one way through, no loops, no closed-off corners), the way through can be
// walked, and no movement of a finger, however fast or wild, can take the path through a wall.
//
//     node scripts/test-maze.mts

import { MAZE_LEVELS, N, E, S, W, canMove, cellAt, cellXY, hintCells, makeMaze, mazeLevel, neighbours, route, solution, stepPath, walk, type Maze } from '../src/games/maze/maze.ts'
import { seeded } from '../src/games/spot/generate.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 25) console.error('FAIL', what) }
const SEEDS = 300, WIDTH = 400, HEIGHT = 300

check(Object.values(MAZE_LEVELS).map(l => `${l.cols}x${l.rows}`).join() === '4x3,5x4,8x6', 'three sizes')
check(mazeLevel(0).cols === 4 && mazeLevel(9).cols === 8 && mazeLevel(1.6).cols === 5, 'a level outside 1 to 3 is held to the nearest')
check(Object.values(MAZE_LEVELS).every(l => { const cw = WIDTH / l.cols, ch = HEIGHT / l.rows; return Math.abs(cw / ch - 1) < 0.1 }), 'every cell is nearly square')

const validPath = (m: Maze, p: readonly number[]) => p.length >= 1 && new Set(p).size === p.length && p.every((c, i) => i === 0 || canMove(m, p[i - 1], c))

for (let level = 1; level <= 3; level++) {
  const { cols, rows } = mazeLevel(level), n = cols * rows
  for (let s = 1; s <= SEEDS; s++) {
    const m = makeMaze(level, seeded(s * 19 + level)), tag = `level ${level} seed ${s}`
    // the walls are the same from both sides, and the outside is closed
    let passages = 0, ok = true
    for (let i = 0; i < n; i++) {
      const { x, y } = cellXY(m, i)
      if (m.open[i] & N && y === 0) ok = false
      if (m.open[i] & S && y === rows - 1) ok = false
      if (m.open[i] & W && x === 0) ok = false
      if (m.open[i] & E && x === cols - 1) ok = false
      if (m.open[i] & E && !(m.open[i + 1] & W)) ok = false
      if (m.open[i] & S && !(m.open[i + cols] & N)) ok = false
      passages += neighbours(m, i).length
      if (neighbours(m, i).length === 0) ok = false
    }
    check(ok, `${tag}: walls agree from both sides, the outside is closed, no cell is shut in`)
    // a tree: n - 1 passages, every cell reachable
    check(passages / 2 === n - 1, `${tag}: ${passages / 2} passages for ${n} cells`)
    const reach = new Set([0]); const q = [0]
    for (let k = 0; k < q.length; k++) for (const nb of neighbours(m, q[k])) if (!reach.has(nb)) { reach.add(nb); q.push(nb) }
    check(reach.size === n, `${tag}: every cell can be reached`)
    // start and end are opposite corners, and the way through is long enough to be a maze
    const corner = (i: number) => (i === 0 || i === cols - 1 || i === (rows - 1) * cols || i === n - 1)
    const a = cellXY(m, m.start), b = cellXY(m, m.end)
    check(corner(m.start) && corner(m.end) && Math.abs(a.x - b.x) === cols - 1 && Math.abs(a.y - b.y) === rows - 1, `${tag}: opposite corners`)
    const way = solution(m)
    check(way[0] === m.start && way[way.length - 1] === m.end && validPath(m, way), `${tag}: the way through is a legal path`)
    check(way.length >= cols + rows - 1, `${tag}: the way is ${way.length} cells long`)
    check(JSON.stringify(route(m, m.end, m.start)) === JSON.stringify([...way].reverse()), `${tag}: the same way back`)
    // following the way, one step at a time, ends at the end
    let p = [m.start]
    for (const c of way.slice(1)) p = stepPath(m, p, c)
    check(p.length === way.length && p[p.length - 1] === m.end, `${tag}: stepping along the way reaches the end`)
    // a straight drag through the middle of each cell on the way reaches the end too
    let drawn = [m.start]
    const mid = (c: number) => ({ x: ((c % cols) + 0.5) * (WIDTH / cols), y: (Math.floor(c / cols) + 0.5) * (HEIGHT / rows) })
    for (let k = 1; k < way.length; k++) drawn = walk(m, drawn, mid(way[k - 1]), mid(way[k]), WIDTH, HEIGHT).path
    check(drawn[drawn.length - 1] === m.end && drawn.length === way.length, `${tag}: drawing along the way reaches the end`)
  }
}

// ── No movement can cross a wall ──
for (let level = 1; level <= 3; level++) {
  const rand = seeded(level * 101)
  for (let s = 1; s <= 120; s++) {
    const m = makeMaze(level, seeded(s * 7 + level)), tag = `level ${level} maze ${s}`
    let p = [m.start]
    for (let k = 0; k < 150; k++) {
      // a wild swipe: anywhere to anywhere, even outside the maze
      const a = { x: rand() * WIDTH * 1.2 - 20, y: rand() * HEIGHT * 1.2 - 15 }, b = { x: rand() * WIDTH * 1.2 - 20, y: rand() * HEIGHT * 1.2 - 15 }
      const r = walk(m, p, a, b, WIDTH, HEIGHT)
      check(validPath(m, r.path), `${tag}: a swipe made an illegal path`)
      check(r.path[0] === m.start, `${tag}: the path always begins at the start`)
      check(Math.abs(r.path.length - p.length) <= Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (Math.min(WIDTH / m.cols, HEIGHT / m.rows) / 4)) + 1, `${tag}: it does not jump`)
      p = r.path
    }
    // single steps into any cell
    for (let c = 0; c < m.open.length; c++) check(validPath(m, stepPath(m, p, c)), `${tag}: stepping into ${c}`)
  }
}

// ── Steps ──
{
  const m = makeMaze(1, seeded(5)), way = solution(m)
  const wall = [...Array(m.open.length).keys()].find(c => c !== way[0] && !canMove(m, way[0], c))!
  check(JSON.stringify(stepPath(m, [way[0]], wall)) === JSON.stringify([way[0]]), 'a wall stops the path')
  const two = stepPath(m, [way[0]], way[1])
  check(JSON.stringify(two) === JSON.stringify([way[0], way[1]]), 'an open side lets it grow')
  check(JSON.stringify(stepPath(m, two, way[0])) === JSON.stringify([way[0]]), 'going back shrinks it')
  check(JSON.stringify(stepPath(m, two, way[1])) === JSON.stringify(two), 'staying put changes nothing')
  check(JSON.stringify(stepPath(m, two, -1)) === JSON.stringify(two) && JSON.stringify(stepPath(m, two, 999)) === JSON.stringify(two), 'a cell that is not there changes nothing')
  // pushing into a wall says which cell it tried, and moves nothing
  for (let level = 1; level <= 3; level++) for (let k = 1; k <= 60; k++) {
    const mm = makeMaze(level, seeded(k * 3 + level)), cw = WIDTH / mm.cols, ch = HEIGHT / mm.rows
    const head = mm.start, hx = cellXY(mm, head).x, hy = cellXY(mm, head).y
    const shut = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: hx + dx, y: hy + dy })).filter(c => c.x >= 0 && c.y >= 0 && c.x < mm.cols && c.y < mm.rows).map(c => c.y * mm.cols + c.x).filter(c => !canMove(mm, head, c))
    for (const c of shut) {
      const r = walk(mm, [head], { x: (hx + 0.5) * cw, y: (hy + 0.5) * ch }, { x: ((c % mm.cols) + 0.5) * cw, y: (Math.floor(c / mm.cols) + 0.5) * ch }, WIDTH, HEIGHT)
      check(r.blocked === c && r.path.length === 1, `level ${level} maze ${k}: pushing into the wall to cell ${c} is noticed and moves nothing`)
    }
    const open = neighbours(mm, head)[0]
    const free = walk(mm, [head], { x: (hx + 0.5) * cw, y: (hy + 0.5) * ch }, { x: ((open % mm.cols) + 0.5) * cw, y: (Math.floor(open / mm.cols) + 0.5) * ch }, WIDTH, HEIGHT)
    check(free.blocked === null && free.path.length === 2, `level ${level} maze ${k}: going through an open side is not a bump`)
  }
  const input = [way[0]]; stepPath(m, input, way[1])
  check(input.length === 1, 'the path it was given is not changed')
  check(cellAt(m, -1, 5, WIDTH, HEIGHT) === -1 && cellAt(m, 5, HEIGHT, WIDTH, HEIGHT) === -1 && cellAt(m, 0, 0, WIDTH, HEIGHT) === 0 && cellAt(m, WIDTH - 0.1, HEIGHT - 0.1, WIDTH, HEIGHT) === m.open.length - 1, 'points map to cells, and outside is -1')
}

// ── Hints ──
for (let level = 1; level <= 3; level++) {
  for (let s = 1; s <= 120; s++) {
    const m = makeMaze(level, seeded(s * 23 + level)), way = solution(m)
    const h0 = hintCells(m, [m.start])
    check(h0[0] === m.start && h0.length === Math.min(5, way.length) && h0.every((c, i) => c === way[i]), `level ${level} maze ${s}: at the start the hint is the way on`)
    // take a wrong turn into a dead end: the hint begins where to go back to
    let p = [m.start]
    for (let k = 1; k < way.length - 1 && k < 4; k++) p = stepPath(m, p, way[k])
    const off = neighbours(m, p[p.length - 1]).find(c => !way.includes(c))
    if (off !== undefined) {
      const q = stepPath(m, p, off)
      const h = hintCells(m, q)
      check(h[0] === p[p.length - 1] && h.every(c => way.includes(c)), `level ${level} maze ${s}: after a wrong turn the hint points back to where it left the way`)
    }
    check(hintCells(m, way).length >= 1 && hintCells(m, way)[0] === m.end, `level ${level} maze ${s}: at the end there is nothing more`)
  }
}

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('maze: all checks passed')
