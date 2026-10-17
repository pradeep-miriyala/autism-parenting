'use client'
// Sort it: one thing at a time, and two or three bins to put it in. Sort by colour, shape, size or what it is.
// Drag the thing to its bin, or tap the bin. No timer, no score. A wrong bin buzzes and the thing slides back;
// a right one gets the sparkle and a sentence. Let go anywhere else and it slides back: that is unfinished, not
// wrong. If the child is stuck, the right bin gently pulses.
import { useCallback, useEffect, useRef, useState } from 'react'
import { makeSortRound, type SortBin, type SortItem, type SortRound } from './thinking/rounds'
import { Pic } from './Pic'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { COLOURS } from './spot/generate'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const REACH = 14
const SETTLE_MS = 900
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

const ItemArt = ({ it }: { it: SortItem }) => <Pic shape={it.shape} kind={it.kind} colour={it.colour} scale={it.big === false ? 0.55 : 1} />

function BinHead({ b }: { b: SortBin }) {
  if (b.colour) return <span className="so-swatch" style={{ background: COLOURS[b.colour] }} aria-hidden="true" />
  if (b.shape) return <Pic shape={b.shape} colour="b" className="so-shape" />
  if (b.icon) return <span className="so-icon" aria-hidden="true">{b.icon}</span>
  return null
}

export default function SortGame({ level, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
  level: number
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec: number
  onActive?: (active: boolean) => void
  onDone?: () => void
}) {
  const { say, praise, chime, ding, buzz } = useFeedback(sound)
  const fx = useSprinkles()
  const [round, setRound] = useState<SortRound | null>(null)
  const [idx, setIdx] = useState(0)
  const [placed, setPlaced] = useState<Record<string, SortItem[]>>({})
  const [misses, setMisses] = useState(0)
  const [shake, setShake] = useState(0)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [settling, setSettling] = useState(false)
  const [drag, setDrag] = useState<{ x: number; y: number; over: string | null } | null>(null)
  const binRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const dragRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const newRound = useCallback(() => {
    clearTimeout(timer.current)
    setRound(makeSortRound(level))
    setIdx(0)
    setPlaced({})
    setMisses(0)
    setShake(0)
    setDone(false)
    setMessage('')
    setSettling(false)
    setDrag(null)
    dragRef.current = null
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])
  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => clearTimeout(timer.current), [])

  const current: SortItem | undefined = done || !round ? undefined : round.items[idx]
  const sorted = Object.values(placed).reduce((n, a) => n + a.length, 0)
  useEffect(() => { onActive?.(!done && sorted > 0) }, [done, sorted, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  const stuck = useStuck(!!current && !settling, hintSec, misses, `${idx}:${shake}`)
  const hintBin = current && stuck && !settling ? current.bin : null

  function choose(binId: string) {
    if (!current || !round || settling || done) return
    if (current.bin !== binId) {
      buzz()
      setShake(n => n + 1)
      setMisses(m => m + 1)
      return
    }
    ding()
    const bin = round.bins.find(b => b.id === binId)!
    setPlaced(p => ({ ...p, [binId]: [...(p[binId] || []), current] }))
    setMisses(0)
    setSettling(true)
    const line = `${cap(current.word)} goes with ${bin.title.toLowerCase()}.`
    setMessage(line)
    say(line)
    if (idx + 1 < round.items.length) {
      timer.current = setTimeout(() => { setIdx(i => i + 1); setSettling(false) }, SETTLE_MS)
      return
    }
    const c = celebration(profile)
    timer.current = setTimeout(() => {
      setDone(true)
      onDone?.()
      setMessage(c.shown)
      if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
      praise(c.spoken, true)
      timer.current = setTimeout(chime, 800)
    }, SETTLE_MS)
  }

  function binAt(x: number, y: number): string | null {
    let best: string | null = null
    let bestD = Infinity
    for (const b of round?.bins ?? []) {
      const el = binRefs.current[b.id]
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (x < r.left - REACH || x > r.right + REACH || y < r.top - REACH || y > r.bottom + REACH) continue
      const d = Math.hypot(x - (r.left + r.right) / 2, y - (r.top + r.bottom) / 2)
      if (d < bestD) { bestD = d; best = b.id }
    }
    return best
  }
  function down(e: React.PointerEvent<HTMLDivElement>) {
    if (settling || done || e.button > 0) return
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
    dragRef.current = { startX: e.clientX, startY: e.clientY, moved: false }
    setDrag({ x: 0, y: 0, over: null })
  }
  function move(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (!d) return
    const x = e.clientX - d.startX, y = e.clientY - d.startY
    d.moved = d.moved || Math.hypot(x, y) > 6
    setDrag({ x, y, over: binAt(e.clientX, e.clientY) })
  }
  function up(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    dragRef.current = null
    if (!d) return
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
    const over = d.moved ? binAt(e.clientX, e.clientY) : null
    setDrag(null)
    if (over) choose(over)
  }
  function cancel() { dragRef.current = null; setDrag(null) }

  const total = round?.items.length ?? 4

  return (
    <div className="th-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">{round?.rule ?? 'Sort it.'}</div>
          <div className="sp-dots" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => <span key={i} className={i < sorted ? 'on' : ''} />)}
          </div>
        </div>
        <InfoButton say={say} text={`${round?.rule ?? ''} Drag the picture to where it goes. You can also tap the bin.`} />
      </div>

      <div className="hb-stage">
        {done && <span className="hb-star" aria-hidden="true">🌟</span>}
        {current && (
          <div key={`${current.id}-${shake}`}
            className={`so-card${drag ? ' dragging' : ''}${shake ? ' shake' : ''}${settling ? ' gone' : ''}`}
            style={drag ? { transform: `translate(${drag.x}px, ${drag.y}px)` } : undefined}
            role="group" aria-label={`Sort: ${current.word}`}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
            <ItemArt it={current} />
          </div>
        )}
      </div>

      <div className={`so-bins n${round?.bins.length ?? 2}`}>
        {round?.bins.map(b => (
          <button key={b.id} type="button" ref={el => { binRefs.current[b.id] = el }}
            className={`so-bin${drag?.over === b.id ? ' over' : ''}${hintBin === b.id ? ' hint' : ''}`}
            onClick={() => choose(b.id)} aria-label={`${cap(b.title)}${(placed[b.id] || []).length ? `: ${(placed[b.id] || []).map(i => i.word).join(', ')}` : ''}`}>
            <BinHead b={b} />
            <strong>{cap(b.title)}</strong>
            <span className="so-in" aria-hidden="true">
              {(placed[b.id] || []).map(i => <span key={i.id} className="so-mini"><ItemArt it={i} /></span>)}
            </span>
          </button>
        ))}
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">
        {current ? `${sorted} of ${total} sorted. ${current.word}.${hintBin ? ' Hint: try the glowing bin.' : ''}` : ''}
      </span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another round</button>
          : <button className="sq-btn" onClick={newRound}>Other things</button>}
      </div>
    </div>
  )
}
