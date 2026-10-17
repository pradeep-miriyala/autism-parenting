'use client'
// Connect the dots: numbered dots round the edge of a picture. Press on dot 1 and draw a line to dot 2, then on to
// 3: the line follows the finger, and when it gets to the next dot it clicks on and carries on from there, so a
// whole picture can be drawn without lifting. Lift early and the loose line just goes: unfinished, not wrong.
// Tapping the next dot still joins it, for anyone who finds drawing hard. When the last dot is reached the shape
// closes and the picture fills in. No timer, no score. Tapping or lifting on a dot that is not next buzzes and
// shakes it; nothing already joined is lost. If the child is stuck, the next dot pulses and a dotted line
// shows the way to it.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { dotAt, dotReach, makeDotsRound, type DotsRound, type P } from './thinking/rounds'
import { COLOURS } from './spot/generate'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const INK = '#2E3A6B'
const W = 400, H = 300

export default function DotsGame({ level, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
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
  const [round, setRound] = useState<DotsRound | null>(null)
  const [next, setNext] = useState(0)            // how many are joined
  const [pen, setPen] = useState<P | null>(null) // where the finger is while a line is being drawn
  const [misses, setMisses] = useState(0)
  const [shake, setShake] = useState<{ n: number; at: number }>({ n: 0, at: -1 })
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const last = useRef<string | undefined>(undefined)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const svg = useRef<SVGSVGElement>(null)
  // What the pointer handlers read, so a fast finger never sees a number that is one step old.
  const joined = useRef(0)
  const drawing = useRef(false)
  const live = useRef<{ dots: P[]; reach: number }>({ dots: [], reach: 0 })
  /** Every dot is joined: nothing more to draw, even before the picture has filled in. */
  const finished = () => live.current.dots.length > 0 && joined.current >= live.current.dots.length

  const newRound = useCallback(() => {
    clearTimeout(timer.current)
    const r = makeDotsRound(level, Math.random, last.current)
    last.current = r.design.id
    setRound(r)
    setNext(0)
    setPen(null)
    joined.current = 0
    drawing.current = false
    setMisses(0)
    setShake({ n: 0, at: -1 })
    setDone(false)
    setMessage('')
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])
  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => clearTimeout(timer.current), [])

  const reach = useMemo(() => (round ? dotReach(round.dots) : 0), [round])
  live.current = { dots: round?.dots ?? [], reach }

  useEffect(() => { onActive?.(!done && next > 0) }, [done, next, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  const stuck = useStuck(!!round && !done, hintSec, misses, `${next}:${shake.n}`)
  const hintDot = round && stuck && !done ? next : null

  // A finger that starts on a dot draws; it must not scroll the page. A touch anywhere else scrolls as usual.
  useEffect(() => {
    const el = svg.current
    if (!el) return
    const hold = (e: TouchEvent) => {
      const t = e.touches[0], { dots, reach: r } = live.current
      if (!t || finished()) return
      const box = el.getBoundingClientRect()
      const p = { x: ((t.clientX - box.left) * W) / box.width, y: ((t.clientY - box.top) * H) / box.height }
      if (dotAt(dots, p, r) >= 0) e.preventDefault()
    }
    el.addEventListener('touchstart', hold, { passive: false })
    return () => el.removeEventListener('touchstart', hold)
  }, [])

  const point = (e: React.PointerEvent): P => {
    const box = svg.current!.getBoundingClientRect()
    return {
      x: Math.min(W, Math.max(0, ((e.clientX - box.left) * W) / box.width)),
      y: Math.min(H, Math.max(0, ((e.clientY - box.top) * H) / box.height)),
    }
  }

  function wrong(at: number) {
    buzz()
    setShake(s => ({ n: s.n + 1, at }))
    setMisses(m => m + 1)
  }

  /** Dot `i` is reached: the line clicks on to it. */
  function join(i: number) {
    const { dots } = live.current
    ding()
    say(String(i + 1))
    setMisses(0)
    joined.current = i + 1
    setNext(i + 1)
    if (i + 1 < dots.length) return
    // the last dot: the line stops, the shape closes and fills in
    drawing.current = false
    setPen(null)
    const c = celebration(profile)
    setMessage(`You made ${round!.design.name}!`)
    say(`You made ${round!.design.name}.`)
    timer.current = setTimeout(() => {
      setDone(true)
      onDone?.()
      setMessage(c.shown)
      if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
      praise(c.spoken, true)
      timer.current = setTimeout(chime, 800)
    }, 1300)
  }

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    const { dots, reach: r } = live.current
    if (!round || finished() || e.button > 0) return
    const p = point(e)
    const hit = dotAt(dots, p, r)
    const at = joined.current
    if (hit < 0 || hit < at - 1) return                       // empty paper, or a dot already behind us
    if (hit > at) { wrong(hit); return }                      // a dot that is not next
    if (hit === at) join(hit)                                 // the next dot: tapping it joins it
    if (finished()) return
    drawing.current = true                                    // press on the last joined dot: start a line from it
    try { svg.current?.setPointerCapture(e.pointerId) } catch {}
    setPen(p)
  }

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drawing.current) return
    const { dots, reach: r } = live.current
    const p = point(e)
    setPen(p)
    const at = joined.current
    if (at < dots.length && Math.hypot(p.x - dots[at].x, p.y - dots[at].y) <= r) join(at)
  }

  function onUp(e: React.PointerEvent<SVGSVGElement>) {
    if (!drawing.current) return
    drawing.current = false
    setPen(null)
    try { svg.current?.releasePointerCapture(e.pointerId) } catch {}
    // let go on a dot that is not next: the same gentle "not that one" as tapping it
    const { dots, reach: r } = live.current
    if (finished()) return
    const hit = dotAt(dots, point(e), r)
    if (hit > joined.current) wrong(hit)
  }

  function onCancel() { drawing.current = false; setPen(null) }

  const pts = round?.dots ?? []
  const joinedPts = pts.slice(0, next).map(p => `${p.x},${p.y}`).join(' ')
  const closed = !!round && next >= pts.length && pts.length > 0
  const total = pts.length
  const anchor = next > 0 ? pts[next - 1] : null
  const showGuide = hintDot !== null && anchor !== null && pts[hintDot]

  return (
    <div className="th-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">Draw from dot to dot</div>
        </div>
        <InfoButton say={say} text="Press on dot one and draw a line to dot two, then on to three. You can keep going without lifting your finger. You can also tap the next dot. When you reach the end, a picture appears." />
      </div>

      <div className="dt-board">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`Connect the dots: ${next} of ${total} joined`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}>
          {closed && round && (
            <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill={COLOURS[round.design.colour]} fillOpacity="0.6"
              stroke={INK} strokeWidth="5" strokeLinejoin="round" className="dt-fill" />
          )}
          {!closed && next > 1 && <polyline points={joinedPts} fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />}
          {showGuide && <line className="dt-guide" x1={anchor.x} y1={anchor.y} x2={pts[hintDot].x} y2={pts[hintDot].y} />}
          {pen && anchor && !closed && <line className="dt-pen" x1={anchor.x} y1={anchor.y} x2={pen.x} y2={pen.y} />}
          {pts.map((p, i) => {
            const isJoined = i < next
            return (
              <g key={`${i}-${shake.at === i ? shake.n : 0}`}
                className={`dt-dot${isJoined ? ' joined' : ''}${hintDot === i ? ' hint' : ''}${shake.n > 0 && shake.at === i ? ' shake' : ''}`}
                role="button" aria-label={`Dot ${i + 1}${isJoined ? ', joined' : ''}`}>
                <circle cx={p.x} cy={p.y} r="27" fill="transparent" />
                <circle cx={p.x} cy={p.y} r="15" fill={isJoined ? INK : '#fff'} stroke={INK} strokeWidth="3" />
                <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={isJoined ? '#fff' : INK}>{i + 1}</text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">{round ? `${next} of ${total} dots joined.${hintDot !== null ? ` Hint: next is dot ${hintDot + 1}.` : ''}` : ''}</span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another picture</button>
          : <button className="sq-btn" onClick={newRound}>Other picture</button>}
      </div>
    </div>
  )
}
