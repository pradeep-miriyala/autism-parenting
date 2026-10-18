'use client'
// Maze: draw the way from the start to the end with a finger. The line follows the finger as long as there is a
// passage; at a wall it simply stops, and the wall glows for a moment. No buzz, no timer, no score. Lift and carry on
// by pressing the end of the line again, or press anywhere on the line to go back to that place. Tapping the cell next
// to the end of the line moves it one step, for anyone who finds drawing hard. If the child is stuck, a dotted line
// shows the way on (or the way back out of a dead end).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { canMove, cellAt, cellXY, hintCells, makeMaze, walk, type Maze } from './maze/maze'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const W = 400, H = 300, PAD = 6
const WALL = '#3B3B4F'
/** Who sets off, what they are heading for, and what to call it. */
const PAIRS: [string, string, string][] = [
  ['🐰', '🥕', 'carrot'], ['🐝', '🌸', 'flower'], ['🚗', '🏠', 'house'], ['🐶', '🦴', 'bone'],
  ['🐢', '🌊', 'sea'], ['🦆', '🐟', 'fish'], ['🐭', '🧀', 'cheese'], ['🐻', '🍯', 'honey'],
]

export default function MazeGame({ level, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
  level: number
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec: number
  onActive?: (active: boolean) => void
  onDone?: () => void
}) {
  const { say, praise, chime, ding } = useFeedback(sound)
  const fx = useSprinkles()
  const [maze, setMaze] = useState<Maze | null>(null)
  const [pair, setPair] = useState(PAIRS[0])
  const [path, setPath] = useState<number[]>([])
  const [bump, setBump] = useState<{ n: number; head: number; cell: number } | null>(null)
  const [bumps, setBumps] = useState(0)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const svg = useRef<SVGSVGElement>(null)
  const live = useRef<{ maze: Maze | null; path: number[]; done: boolean }>({ maze: null, path: [], done: false })
  const drawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const lastPair = useRef(-1)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const newRound = useCallback(() => {
    clearTimeout(timer.current)
    const m = makeMaze(level)
    let k = Math.floor(Math.random() * PAIRS.length)
    if (k === lastPair.current) k = (k + 1) % PAIRS.length
    lastPair.current = k
    setMaze(m)
    setPair(PAIRS[k])
    setPath([m.start])
    live.current = { maze: m, path: [m.start], done: false }
    drawing.current = false
    lastPoint.current = null
    setBump(null)
    setBumps(0)
    setDone(false)
    setMessage('')
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])
  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => { onActive?.(!done && path.length > 1) }, [done, path.length, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  const stuck = useStuck(!!maze && !done, hintSec, bumps, `${path.length}`)
  const guide = useMemo(() => (maze && stuck && !done ? hintCells(maze, path) : []), [maze, stuck, done, path])

  const toPoint = (e: { clientX: number; clientY: number }) => {
    const r = svg.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * (W + 2 * PAD) - PAD, y: ((e.clientY - r.top) / r.height) * (H + 2 * PAD) - PAD }
  }
  /** A press at this cell would do something: it is on the line, or it is the cell beside the end of the line. */
  const usable = (c: number) => {
    const { maze: m, path: p } = live.current
    return !!m && c >= 0 && (p.includes(c) || canMove(m, p[p.length - 1], c))
  }

  // A touch that starts where a line can be drawn must not scroll the page. A touch anywhere else scrolls as usual.
  useEffect(() => {
    const el = svg.current
    if (!el) return
    const hold = (e: TouchEvent) => {
      const t = e.touches[0], m = live.current.maze
      if (!t || !m || live.current.done) return
      const r = el.getBoundingClientRect()
      const c = cellAt(m, ((t.clientX - r.left) / r.width) * (W + 2 * PAD) - PAD, ((t.clientY - r.top) / r.height) * (H + 2 * PAD) - PAD, W, H)
      if (usable(c)) e.preventDefault()
    }
    el.addEventListener('touchstart', hold, { passive: false })
    return () => el.removeEventListener('touchstart', hold)
  }, [])

  function update(next: number[]) {
    live.current.path = next
    setPath(next)
    const m = live.current.maze!
    if (next[next.length - 1] !== m.end) return
    // the end: the line stops and the way is found
    drawing.current = false
    live.current.done = true
    ding()
    const c = celebration(profile)
    setMessage(`You found the way to the ${pair[2]}!`)
    say('You found the way!')
    timer.current = setTimeout(() => {
      setDone(true)
      onDone?.()
      setMessage(c.shown)
      if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
      praise(c.spoken, true)
      timer.current = setTimeout(chime, 800)
    }, 1000)
  }

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    const { maze: m, path: p, done: d } = live.current
    if (!m || d || e.button > 0) return
    const pt = toPoint(e), c = cellAt(m, pt.x, pt.y, W, H)
    if (!usable(c)) return
    try { svg.current?.setPointerCapture(e.pointerId) } catch {}
    const at = p.indexOf(c)
    if (at >= 0) update(p.slice(0, at + 1))                  // press on the line: go back to there, and carry on
    else update([...p, c])                                    // the cell beside the end: one step
    if (live.current.done) return
    drawing.current = true
    lastPoint.current = pt
  }

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drawing.current || !lastPoint.current) return
    const m = live.current.maze!
    const pt = toPoint(e)
    const head = live.current.path[live.current.path.length - 1]
    const r = walk(m, live.current.path, lastPoint.current, pt, W, H)
    lastPoint.current = pt
    if (r.blocked !== null) { setBump(b => ({ n: (b?.n ?? 0) + 1, head, cell: r.blocked! })); setBumps(n => n + 1) }
    if (r.path.length !== live.current.path.length || r.path[r.path.length - 1] !== head) update(r.path)
  }

  function end(e: React.PointerEvent<SVGSVGElement>) {
    drawing.current = false
    lastPoint.current = null
    try { svg.current?.releasePointerCapture(e.pointerId) } catch {}
  }

  const cw = maze ? W / maze.cols : 1, ch = maze ? H / maze.rows : 1
  const centre = (c: number) => { const { x, y } = cellXY(maze!, c); return { x: (x + 0.5) * cw, y: (y + 0.5) * ch } }
  const walls = useMemo(() => {
    if (!maze) return ''
    let d = `M0 0H${W}V${H}H0Z`
    for (let i = 0; i < maze.open.length; i++) {
      const { x, y } = cellXY(maze, i)
      if (x < maze.cols - 1 && !(maze.open[i] & 2)) d += `M${(x + 1) * cw} ${y * ch}V${(y + 1) * ch}`
      if (y < maze.rows - 1 && !(maze.open[i] & 4)) d += `M${x * cw} ${(y + 1) * ch}H${(x + 1) * cw}`
    }
    return d
  }, [maze, cw, ch])
  const size = Math.min(cw, ch)
  const line = path.map(c => { const p = centre(c); return `${p.x},${p.y}` }).join(' ')
  const head = path.length ? centre(path[path.length - 1]) : null
  // the wall the line bumped into: the side between the end of the line and the cell it tried to enter
  const bumpWall = (() => {
    if (!maze || !bump) return null
    const a = cellXY(maze, bump.head), b = cellXY(maze, bump.cell)
    if (b.x > a.x) return { x1: b.x * cw, y1: a.y * ch, x2: b.x * cw, y2: (a.y + 1) * ch }
    if (b.x < a.x) return { x1: a.x * cw, y1: a.y * ch, x2: a.x * cw, y2: (a.y + 1) * ch }
    if (b.y > a.y) return { x1: a.x * cw, y1: b.y * ch, x2: (a.x + 1) * cw, y2: b.y * ch }
    return { x1: a.x * cw, y1: a.y * ch, x2: (a.x + 1) * cw, y2: a.y * ch }
  })()

  return (
    <div className="th-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">Find the way</div>
        </div>
        <InfoButton say={say} text="Put your finger on the start and draw a line through the maze to the end. The line stops at a wall. You can lift your finger and carry on from where the line ends." />
      </div>

      <div className="mz-board">
        <svg ref={svg} viewBox={`${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`} role="group"
          aria-label={maze ? `Maze, ${path.length} of ${solutionLength(maze)} steps along the way` : 'Maze'}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={end} onPointerCancel={end}>
          {maze && (
            <>
              <rect x={-PAD} y={-PAD} width={W + 2 * PAD} height={H + 2 * PAD} fill="#fff" />
              {guide.length > 1 && <polyline className="mz-guide" fill="none" points={guide.map(c => { const p = centre(c); return `${p.x},${p.y}` }).join(' ')} />}
              <polyline className={`mz-path${done || live.current.done ? ' won' : ''}`} fill="none" points={line} style={{ strokeWidth: size * 0.42 }} />
              <path d={walls} fill="none" stroke={WALL} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              {bumpWall && <line key={bump!.n} className="mz-bump" {...bumpWall} />}
              {!done && head && <circle className="mz-head" cx={head.x} cy={head.y} r={size * 0.3} />}
              <text className="mz-emoji" x={centre(maze.start).x} y={centre(maze.start).y} fontSize={size * 0.62} textAnchor="middle" dominantBaseline="central">{pair[0]}</text>
              <text className="mz-emoji" x={centre(maze.end).x} y={centre(maze.end).y} fontSize={size * 0.62} textAnchor="middle" dominantBaseline="central">{pair[1]}</text>
            </>
          )}
        </svg>
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">{maze ? `Line is ${path.length} cells long.` : ''}</span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another maze</button>
          : <button className="sq-btn" onClick={newRound}>Other maze</button>}
      </div>
    </div>
  )
}

function solutionLength(m: Maze) { return hintCells(m, [m.start], 10_000).length }
