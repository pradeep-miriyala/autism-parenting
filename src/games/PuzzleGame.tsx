'use client'
// Jigsaw: a picture cut into pieces (four, six or nine). Drag each piece to where it goes on the board, which
// shows the picture faintly; or tap a piece, then its place. No timer, no score. A piece in the wrong place
// buzzes and slides back; in the right place it clicks in with the sparkle. Let go anywhere else and it slides
// back: that is unfinished, not wrong. If the child is stuck, the place for a piece gently pulses.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ART } from './spot/art'
import { COLOURS, VIEW } from './spot/generate'
import { makePuzzle, makePuzzleScene, pieceBox, type PuzzleScene } from './thinking/rounds'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const REACH = 12

/** The whole picture, drawn into whatever box it is given; a piece is the same picture seen through a window. */
function Piece({ scene, index, cols, rows, faint }: { scene: PuzzleScene; index: number; cols: number; rows: number; faint?: boolean }) {
  const b = pieceBox(index, cols, rows, VIEW.w, VIEW.h)
  return (
    <svg viewBox={`${b.x} ${b.y} ${b.w} ${b.h}`} className="pz-svg" style={faint ? { opacity: 0.2 } : undefined} aria-hidden="true">
      <rect x="0" y="0" width={VIEW.w} height={VIEW.h} fill={scene.bg} />
      {scene.objs.map(o => {
        const Art = ART[o.kind]
        return (
          <g key={o.id} transform={`translate(${o.x - 40 * o.scale} ${o.y - 40 * o.scale}) scale(${o.scale})`}>
            <Art c={COLOURS[o.colour]} />
          </g>
        )
      })}
    </svg>
  )
}

export default function PuzzleGame({ level, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
  level: number
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec: number
  onActive?: (active: boolean) => void
  onDone?: () => void
}) {
  const { praise, chime, ding, buzz } = useFeedback(sound)
  const fx = useSprinkles()
  const [scene, setScene] = useState<PuzzleScene | null>(null)
  const [grid, setGrid] = useState({ cols: 2, rows: 2 })
  const [tray, setTray] = useState<number[]>([])
  const [placed, setPlaced] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [misses, setMisses] = useState(0)
  const [shake, setShake] = useState<{ n: number; piece: number }>({ n: 0, piece: -1 })
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [drag, setDrag] = useState<{ piece: number; x: number; y: number; over: number | null } | null>(null)
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
  const dragRef = useRef<{ piece: number; startX: number; startY: number; moved: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const newRound = useCallback(() => {
    clearTimeout(timer.current)
    const p = makePuzzle(level)
    setScene(makePuzzleScene(p.cols, p.rows, VIEW.w, VIEW.h))
    setGrid({ cols: p.cols, rows: p.rows })
    setTray(p.tray)
    setPlaced([])
    setSelected(null)
    setMisses(0)
    setShake({ n: 0, piece: -1 })
    setDone(false)
    setMessage('')
    setDrag(null)
    dragRef.current = null
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])
  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => clearTimeout(timer.current), [])

  const n = grid.cols * grid.rows
  useEffect(() => { onActive?.(!done && placed.length > 0) }, [done, placed.length, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  const loose = tray.filter(p => !placed.includes(p))
  const stuck = useStuck(!!scene && !done && loose.length > 0, hintSec, misses, `${placed.length}:${shake.n}:${selected}`)
  const hintSlot = stuck && !done ? (selected ?? loose[0] ?? null) : null

  function place(piece: number, slot: number) {
    if (done || placed.includes(piece)) return
    if (piece !== slot) {
      buzz()
      setShake(s => ({ n: s.n + 1, piece }))
      setMisses(m => m + 1)
      return
    }
    ding()
    const next = [...placed, piece]
    setPlaced(next)
    setSelected(null)
    setMisses(0)
    if (next.length < n) return
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

  function slotAt(x: number, y: number): number | null {
    let best: number | null = null
    let bestD = Infinity
    slotRefs.current.forEach((el, i) => {
      if (!el || placed.includes(i)) return
      const r = el.getBoundingClientRect()
      if (x < r.left - REACH || x > r.right + REACH || y < r.top - REACH || y > r.bottom + REACH) return
      const d = Math.hypot(x - (r.left + r.right) / 2, y - (r.top + r.bottom) / 2)
      if (d < bestD) { bestD = d; best = i }
    })
    return best
  }

  function down(e: React.PointerEvent<HTMLDivElement>, piece: number) {
    if (done || e.button > 0) return
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
    dragRef.current = { piece, startX: e.clientX, startY: e.clientY, moved: false }
    setDrag({ piece, x: 0, y: 0, over: null })
  }
  function move(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (!d) return
    const x = e.clientX - d.startX, y = e.clientY - d.startY
    d.moved = d.moved || Math.hypot(x, y) > 6
    setDrag({ piece: d.piece, x, y, over: d.moved ? slotAt(e.clientX, e.clientY) : null })
  }
  function up(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (!d) return
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
    if (!d.moved) { setSelected(s => (s === d.piece ? null : d.piece)); return }   // a tap chooses the piece
    const slot = slotAt(e.clientX, e.clientY)
    if (slot !== null) place(d.piece, slot)                                          // let go elsewhere: it slides back
  }
  function cancel() { dragRef.current = null; setDrag(null) }

  const ratio = `${VIEW.w / grid.cols} / ${VIEW.h / grid.rows}`

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
        <InfoButton say={() => {}} text="Drag each piece to where it goes in the picture. You can also tap a piece, then tap its place." />
      </div>

      {scene && (
        <div className="pz-board" style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)`, aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
          role="group" aria-label={`Jigsaw board, ${placed.length} of ${n} pieces in place`}>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} ref={el => { slotRefs.current[i] = el }}
              className={`pz-slot${placed.includes(i) ? ' filled' : ''}${drag?.over === i ? ' over' : ''}${hintSlot === i ? ' hint' : ''}`}
              onClick={() => { if (selected !== null && !placed.includes(i)) place(selected, i) }}>
              <Piece scene={scene} index={i} cols={grid.cols} rows={grid.rows} faint={!placed.includes(i)} />
            </div>
          ))}
        </div>
      )}

      <div className="pz-tray" style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)` }}>
        {scene && loose.map(p => (
          <div key={`${p}-${shake.piece === p ? shake.n : 0}`}
            className={`pz-piece${selected === p ? ' sel' : ''}${drag?.piece === p ? ' dragging' : ''}${shake.n > 0 && shake.piece === p ? ' shake' : ''}`}
            style={{ aspectRatio: ratio, ...(drag?.piece === p ? { transform: `translate(${drag.x}px, ${drag.y}px)` } : {}) }}
            role="button" aria-label={`Piece ${p + 1}`} aria-pressed={selected === p}
            onPointerDown={e => down(e, p)} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
            <Piece scene={scene} index={p} cols={grid.cols} rows={grid.rows} />
          </div>
        ))}
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">{`${placed.length} of ${n} pieces in place.`}</span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another picture</button>
          : <button className="sq-btn" onClick={newRound}>Other picture</button>}
      </div>
    </div>
  )
}
