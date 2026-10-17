'use client'
// Jigsaw with a parent's photo: the photo is cut into pieces with knobs and holes, and the pieces lie loose on a
// shelf under the board. Drag a piece anywhere; let go near where it belongs and it clicks in with the sparkle.
// Let go anywhere else and it simply stays there: unfinished, never wrong. There is no buzz and no score. Or tap
// a piece, then tap its place on the board. If the child is stuck, the place for a piece gently pulses.
// Everything is drawn in one SVG so it scales with the screen and every piece moves in the same units.
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { VIEW } from './spot/generate'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'
import { clampPos, homeOf, makeCut, photoGrid, piecePath, scatter, snapRadius, stackOrder, tableFor, type Pt } from './pictures/cut'

const W = VIEW.w, H = VIEW.h
/** Moving less than this (screen pixels) is a tap, not a drag. */
const TAP = 6

type PieceProps = {
  i: number; d: string; clip: string; src: string
  x: number; y: number; ox: number; oy: number
  loose: boolean; lifted: boolean; selected: boolean
  onDown: (e: React.PointerEvent<SVGGElement>, i: number) => void
}

/** One piece: the whole photo, shown through the piece's outline. (x, y) is where its square sits on the table. */
const PieceView = memo(function PieceView({ i, d, clip, src, x, y, ox, oy, loose, lifted, selected, onDown }: PieceProps) {
  return (
    <g className={`pj-piece${loose ? '' : ' placed'}${lifted ? ' lifted' : ''}${selected ? ' sel' : ''}`}
      transform={`translate(${x - ox} ${y - oy})`}
      role={loose ? 'button' : undefined} aria-label={loose ? `Piece ${i + 1}` : undefined} aria-pressed={loose ? selected : undefined}
      onPointerDown={loose ? e => onDown(e, i) : undefined}>
      {loose && <path d={d} className="pj-shadow" transform={lifted ? 'translate(4 7)' : 'translate(2 3.5)'} />}
      <image href={src} x="0" y="0" width={W} height={H} preserveAspectRatio="none" clipPath={`url(#${clip})`} />
      <path d={d} className="pj-edge" />
    </g>
  )
})

export default function PhotoJigsaw({ photo, level, plain, guide, sound, profile, sprinklesOn, hintSec, onActive, onDone, onNext, onBroken }: {
  photo: Blob
  level: number
  plain: boolean
  guide: boolean
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec: number
  onActive?: (active: boolean) => void
  onDone?: () => void
  onNext: () => void
  /** The photo could not be shown: the game moves on to another picture. */
  onBroken: () => void
}) {
  const { praise, chime, ding } = useFeedback(sound)
  const fx = useSprinkles()
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')

  // One round: how it is cut, where the pieces start and how they are stacked. Fixed for as long as it is on screen.
  const [round] = useState(() => {
    const { cols, rows } = photoGrid(level)
    const cut = makeCut(cols, rows, plain)
    const n = cols * rows
    return {
      cols, rows, n, table: tableFor(cols, rows, W, H),
      paths: Array.from({ length: n }, (_, i) => piecePath(cut, i, W, H)),
      start: scatter(cols, rows, W, H),
      stack: stackOrder(n),
    }
  })
  const { cols, rows, n, table, paths } = round

  const [src, setSrc] = useState('')
  const [ready, setReady] = useState(false)
  const [pos, setPos] = useState<Pt[]>(round.start)
  const [order, setOrder] = useState<number[]>(round.stack)   // loose pieces, the top one last
  const [placed, setPlaced] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [near, setNear] = useState<number | null>(null)
  const [lifted, setLifted] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [misses, setMisses] = useState(0)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ piece: number; sx: number; sy: number; from: Pt; scale: number; moved: boolean } | null>(null)
  const posRef = useRef<Pt[]>(round.start)
  posRef.current = pos
  const placedRef = useRef<number[]>([])
  const doneRef = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const brokenRef = useRef(onBroken)
  brokenRef.current = onBroken

  // The photo is shown from a temporary address that exists only while the game is open.
  useEffect(() => {
    const url = URL.createObjectURL(photo)
    let live = true
    const img = new Image()
    img.onload = () => { if (live) { setSrc(url); setReady(true) } }
    img.onerror = () => { if (live) brokenRef.current() }
    img.src = url
    return () => { live = false; URL.revokeObjectURL(url) }
  }, [photo])
  useEffect(() => () => clearTimeout(timer.current), [])

  // A touch that starts on a loose piece moves the piece and must not scroll the page. A touch anywhere else
  // scrolls as usual. (A native listener, because the page's own touch handlers are not allowed to cancel scrolling.)
  useEffect(() => {
    const el = svg.current
    if (!el) return
    const hold = (e: TouchEvent) => { if ((e.target as Element | null)?.closest?.('.pj-piece:not(.placed)')) e.preventDefault() }
    el.addEventListener('touchstart', hold, { passive: false })
    return () => el.removeEventListener('touchstart', hold)
  }, [])

  useEffect(() => { onActive?.(!done && placed.length > 0) }, [done, placed.length, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  const radius = snapRadius(table.cw, table.ch)
  const home = useCallback((i: number) => homeOf(i, cols, rows, W, H), [cols, rows])

  const stuck = useStuck(ready && !done && order.length > 0, hintSec, misses, `${placed.length}:${moves}:${selected}`)
  const hintPiece = stuck && !done ? (selected ?? order[order.length - 1] ?? null) : null

  function place(i: number) {
    if (doneRef.current || placedRef.current.includes(i)) return
    ding()
    placedRef.current = [...placedRef.current, i]
    setPlaced(placedRef.current)
    setPos(p => p.map((q, k) => (k === i ? home(i) : q)))
    setOrder(o => o.filter(k => k !== i))
    setSelected(null)
    setNear(null)
    setLifted(null)
    setMisses(0)
    setMoves(m => m + 1)
    if (placedRef.current.length < n) return
    doneRef.current = true
    const c = celebration(profile)
    timer.current = setTimeout(() => {
      setDone(true)
      onDone?.()
      setMessage(c.shown)
      if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
      praise(c.spoken)
      timer.current = setTimeout(chime, 800)
    }, 500)
  }

  // ── Dragging. The pointer is held by the whole drawing, not by the piece, because a piece that is picked up
  // is moved to the top of the stack and browsers let go of a pointer held by something that moves in the page.
  const onDown = useCallback((e: React.PointerEvent<SVGGElement>, i: number) => {
    const el = svg.current
    if (!el || doneRef.current || placedRef.current.includes(i) || e.button > 0) return
    try { el.setPointerCapture(e.pointerId) } catch {}
    const scale = el.getBoundingClientRect().width / table.view.w
    drag.current = { piece: i, sx: e.clientX, sy: e.clientY, from: { ...posRef.current[i] }, scale: scale || 1, moved: false }
    setLifted(i)
    setOrder(o => [...o.filter(k => k !== i), i])
  }, [table.view.w])

  const at = (d: NonNullable<typeof drag.current>, e: React.PointerEvent<SVGSVGElement>): Pt =>
    clampPos({ x: d.from.x + (e.clientX - d.sx) / d.scale, y: d.from.y + (e.clientY - d.sy) / d.scale }, table, W)

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = drag.current
    if (!d) return
    d.moved = d.moved || Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > TAP
    if (!d.moved) return
    const p = at(d, e), h = home(d.piece)
    setPos(all => all.map((q, k) => (k === d.piece ? p : q)))
    setNear(Math.hypot(p.x - h.x, p.y - h.y) <= radius ? d.piece : null)
  }

  function onUp(e: React.PointerEvent<SVGSVGElement>) {
    const d = drag.current
    drag.current = null
    if (!d) return
    try { svg.current?.releasePointerCapture(e.pointerId) } catch {}
    setLifted(null)
    setNear(null)
    if (!d.moved) { setSelected(s => (s === d.piece ? null : d.piece)); return }   // a tap chooses the piece
    const p = at(d, e), h = home(d.piece)
    if (Math.hypot(p.x - h.x, p.y - h.y) <= radius) { place(d.piece); return }
    setPos(all => all.map((q, k) => (k === d.piece ? p : q)))                       // let go elsewhere: it stays
    setMoves(m => m + 1)
    // dropped on the board but not in its place: count it towards a hint
    if (p.y + table.ch / 2 < H) setMisses(m => m + 1)
  }

  function onCancel() {
    drag.current = null
    setLifted(null)
    setNear(null)
  }

  // Tap a piece, then tap its place. A wrong place lets the piece rest there, like a dropped one.
  function tapCell(c: number) {
    if (selected === null || doneRef.current || placedRef.current.includes(c)) return
    if (selected === c) { place(c); return }
    const h = home(c), sel = selected
    setPos(all => all.map((q, k) => (k === sel ? clampPos({ x: h.x + table.cw * 0.1, y: h.y + table.ch * 0.1 }, table, W) : q)))
    setOrder(o => [...o.filter(k => k !== sel), sel])
    setSelected(null)
    setMoves(m => m + 1)
    setMisses(m => m + 1)
  }

  const allCuts = useMemo(() => paths.join(''), [paths])
  const { view } = table
  const doneCls = done ? ' pj-done' : ''

  return (
    <div className="th-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">Finish the picture</div>
          <div className="sp-dots" aria-hidden="true">
            {Array.from({ length: n }, (_, i) => <span key={i} className={i < placed.length ? 'on' : ''} />)}
          </div>
        </div>
        <InfoButton say={() => {}} text="Drag each piece to where it goes in the picture. It clicks in when it is in the right place. You can also tap a piece, then tap its place." />
      </div>

      <div className="pj-stage" style={{ '--pj-ratio': view.w / view.h } as React.CSSProperties}>
        <svg ref={svg} className={`pj-svg${doneCls}`} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          role="group" aria-label={`Jigsaw, ${placed.length} of ${n} pieces in place`}
          onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}>
          <defs>
            {paths.map((d, i) => <clipPath key={i} id={`pj${uid}c${i}`}><path d={d} /></clipPath>)}
          </defs>

          <rect className="pj-table" x={view.x} y={view.y} width={view.w} height={view.h} rx="10" />
          <rect className="pj-shelf" x="0" y={table.shelfTop} width={W} height={table.shelfH} rx="8" />
          <rect className="pj-board" x="0" y="0" width={W} height={H} />
          {guide && ready && <image href={src} x="0" y="0" width={W} height={H} preserveAspectRatio="none" opacity="0.22" />}
          <path className="pj-cut" d={allCuts} />

          {Array.from({ length: n }, (_, c) => {
            if (placed.includes(c)) return null
            const h = home(c)
            return <rect key={c} className="pj-cell" x={h.x} y={h.y} width={table.cw} height={table.ch} onClick={() => tapCell(c)} />
          })}

          {near !== null && <path className="pj-near" d={paths[near]} />}
          {hintPiece !== null && near === null && <path className="pj-hint" d={paths[hintPiece]} />}

          {ready && placed.map(i => {
            const h = home(i)
            return <PieceView key={i} i={i} d={paths[i]} clip={`pj${uid}c${i}`} src={src} x={h.x} y={h.y} ox={h.x} oy={h.y}
              loose={false} lifted={false} selected={false} onDown={onDown} />
          })}
          {ready && order.map(i => {
            const h = home(i)
            return <PieceView key={i} i={i} d={paths[i]} clip={`pj${uid}c${i}`} src={src} x={pos[i].x} y={pos[i].y} ox={h.x} oy={h.y}
              loose lifted={lifted === i} selected={selected === i} onDown={onDown} />
          })}
        </svg>
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">{`${placed.length} of ${n} pieces in place.`}</span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        <button className={`sq-btn${done ? ' primary' : ''}`} onClick={onNext}>{done ? 'Another picture' : 'Other picture'}</button>
      </div>
    </div>
  )
}
