'use client'
// Helpful Habits: a card shows something a child does. Drag it to "Helps me" or "Does not help me", or tap
// the bucket. No timer, no score, no "good" and "bad". A card in the wrong bucket buzzes, shakes and goes
// back (nothing already sorted is lost); one in the right bucket gets the sparkle and a sentence saying
// why ("Brushing my teeth helps me."). Let go anywhere else and the card just slides back: that is
// unfinished, not wrong. If the child is stuck, the right bucket gently pulses.
import { useCallback, useEffect, useRef, useState } from 'react'
import { makeHabitRound, sentence, type Habit } from './habits/data'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { SpeakerIcon } from './icons'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

type Bucket = 'yes' | 'no'
const REACH = 14        // how far outside a bucket a card may be let go and still land in it
const SETTLE_MS = 900   // how long the child sees the card go in before the next one comes

const BUCKETS: { id: Bucket; title: string; icon: string }[] = [
  { id: 'yes', title: 'Helps me', icon: '🙂' },
  { id: 'no', title: 'Does not help me', icon: '😐' },
]

export default function HabitsGame({ count, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
  count: number
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec: number
  onActive?: (active: boolean) => void
  onDone?: () => void
}) {
  const { say, praise, chime, ding, buzz } = useFeedback(sound)
  const fx = useSprinkles()
  const [round, setRound] = useState<Habit[]>([])
  const [idx, setIdx] = useState(0)
  const [placed, setPlaced] = useState<Record<Bucket, Habit[]>>({ yes: [], no: [] })
  const [misses, setMisses] = useState(0)
  const [shake, setShake] = useState(0)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [settling, setSettling] = useState(false)   // the card has just gone in; wait for the next one
  const [drag, setDrag] = useState<{ x: number; y: number; over: Bucket | null } | null>(null)
  const bucketRefs = useRef<Record<Bucket, HTMLButtonElement | null>>({ yes: null, no: null })
  const dragRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const newRound = useCallback(() => {
    clearTimeout(timer.current)
    setRound(makeHabitRound(count))
    setIdx(0)
    setPlaced({ yes: [], no: [] })
    setMisses(0)
    setShake(0)
    setDone(false)
    setMessage('')
    setSettling(false)
    setDrag(null)
    dragRef.current = null
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => clearTimeout(timer.current), [])

  const current: Habit | undefined = done ? undefined : round[idx]
  const sorted = placed.yes.length + placed.no.length

  // Tell the page whether a round is under way, so leaving for the games can ask to finish it first.
  useEffect(() => { onActive?.(!done && sorted > 0) }, [done, sorted, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  // A new card is read out (when the sound is on).
  useEffect(() => { if (current && !settling) say(current.text) }, [current?.id, settling]) // eslint-disable-line react-hooks/exhaustive-deps

  const stuck = useStuck(!!current && !settling, hintSec, misses, `${idx}:${shake}`)
  const hintBucket: Bucket | null = current && stuck && !settling ? (current.helps ? 'yes' : 'no') : null

  function choose(side: Bucket) {
    if (!current || settling || done) return
    if ((current.helps ? 'yes' : 'no') !== side) {
      buzz()
      setShake(n => n + 1)
      setMisses(m => m + 1)
      return
    }
    ding() // every right choice gets the sparkle, with sound on or off
    const nextPlaced = { ...placed, [side]: [...placed[side], current] }
    setPlaced(nextPlaced)
    setMisses(0)
    setMessage(sentence(current))
    setSettling(true)
    if (idx + 1 < round.length) {
      say(sentence(current))
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
    say(sentence(current))
  }

  function bucketAt(x: number, y: number): Bucket | null {
    let best: Bucket | null = null
    let bestD = Infinity
    for (const b of BUCKETS) {
      const el = bucketRefs.current[b.id]
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
    setDrag({ x, y, over: bucketAt(e.clientX, e.clientY) })
  }
  function up(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    dragRef.current = null
    if (!d) return
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
    const over = d.moved ? bucketAt(e.clientX, e.clientY) : null
    setDrag(null)               // the card slides back unless it is in a bucket
    if (over) choose(over)      // let go on empty space: it slides back, no buzz
  }
  function cancel() { dragRef.current = null; setDrag(null) }

  const dots = round.length || count

  return (
    <div className="hb-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">Where does it go?</div>
          <div className="sp-dots" aria-hidden="true">
            {Array.from({ length: dots }, (_, i) => <span key={i} className={i < sorted ? 'on' : ''} />)}
          </div>
        </div>
        <InfoButton say={say}
          text="A card shows something you do. Drag it to Helps me, or to Does not help me. You can also tap the bucket." />
      </div>

      <div className="hb-stage">
        {done && <span className="hb-star" aria-hidden="true">🌟</span>}
        {current && (
          <div key={`${current.id}-${shake}`}
            className={`hb-habit${drag ? ' dragging' : ''}${shake ? ' shake' : ''}${settling ? ' gone' : ''}`}
            style={drag ? { transform: `translate(${drag.x}px, ${drag.y}px)` } : undefined}
            role="group" aria-label={`Habit: ${current.text}`}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
            <span className="hb-emoji" aria-hidden="true">{current.emoji}</span>
            <span className="hb-text">{current.text}</span>
            <button type="button" className="sq-icon hb-hear" aria-label="Hear it"
              onPointerDown={e => e.stopPropagation()} onClick={() => say(current.text, true)}>
              <SpeakerIcon />
            </button>
          </div>
        )}
      </div>

      <div className="hb-buckets">
        {BUCKETS.map(b => (
          <button key={b.id} type="button" ref={el => { bucketRefs.current[b.id] = el }}
            className={`hb-bucket ${b.id}${drag?.over === b.id ? ' over' : ''}${hintBucket === b.id ? ' hint' : ''}`}
            onClick={() => choose(b.id)}
            aria-label={`${b.title}${placed[b.id].length ? `: ${placed[b.id].map(h => h.text).join(', ')}` : ''}`}>
            <span className="hb-bicon" aria-hidden="true">{b.icon}</span>
            <strong>{b.title}</strong>
            <span className="hb-in" aria-hidden="true">
              {placed[b.id].map(h => <span key={h.id}>{h.emoji}</span>)}
            </span>
          </button>
        ))}
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">
        {current ? `${sorted} of ${round.length} sorted. ${current.text}.${hintBucket ? ` Hint: try ${hintBucket === 'yes' ? 'Helps me' : 'Does not help me'}.` : ''}` : ''}
      </span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another round</button>
          : <button className="sq-btn" onClick={newRound}>Other cards</button>}
      </div>
    </div>
  )
}

