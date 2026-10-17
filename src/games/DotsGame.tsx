'use client'
// Connect the dots: numbered dots round the edge of a picture. Tap them in order, 1, 2, 3, and a line joins each
// to the last; when the last is joined the shape closes and the picture fills in. No timer, no score. A dot
// out of order buzzes and shakes; nothing already joined is lost. If the child is stuck, the next dot pulses.
import { useCallback, useEffect, useRef, useState } from 'react'
import { makeDotsRound, type DotsRound } from './thinking/rounds'
import { COLOURS } from './spot/generate'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const INK = '#2E3A6B'

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
  const [misses, setMisses] = useState(0)
  const [shake, setShake] = useState<{ n: number; at: number }>({ n: 0, at: -1 })
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const last = useRef<string | undefined>(undefined)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const newRound = useCallback(() => {
    clearTimeout(timer.current)
    const r = makeDotsRound(level, Math.random, last.current)
    last.current = r.design.id
    setRound(r)
    setNext(0)
    setMisses(0)
    setShake({ n: 0, at: -1 })
    setDone(false)
    setMessage('')
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])
  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => { onActive?.(!done && next > 0) }, [done, next, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  const stuck = useStuck(!!round && !done, hintSec, misses, `${next}:${shake.n}`)
  const hintDot = round && stuck && !done ? next : null

  function tap(i: number) {
    if (!round || done) return
    if (i < next) return
    if (i !== next) {
      buzz()
      setShake(s => ({ n: s.n + 1, at: i }))
      setMisses(m => m + 1)
      return
    }
    ding()
    say(String(i + 1))
    setMisses(0)
    const joined = next + 1
    setNext(joined)
    if (joined < round.dots.length) return
    // the last dot: the shape closes and fills in
    const c = celebration(profile)
    setMessage(`You made ${round.design.name}!`)
    say(`You made ${round.design.name}.`)
    timer.current = setTimeout(() => {
      setDone(true)
      onDone?.()
      setMessage(c.shown)
      if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
      praise(c.spoken, true)
      timer.current = setTimeout(chime, 800)
    }, 1300)
  }

  const pts = round?.dots ?? []
  const joinedPts = pts.slice(0, next).map(p => `${p.x},${p.y}`).join(' ')
  const closed = !!round && next >= pts.length && pts.length > 0
  const total = pts.length

  return (
    <div className="th-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">Join the dots in order</div>
        </div>
        <InfoButton say={say} text="Tap the dots in order, starting at one. A line joins each dot to the last. When you reach the end, a picture appears." />
      </div>

      <div className="dt-board">
        <svg viewBox="0 0 400 300" role="group" aria-label={`Connect the dots: ${next} of ${total} joined`}>
          {closed && round && (
            <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill={COLOURS[round.design.colour]} fillOpacity="0.6"
              stroke={INK} strokeWidth="5" strokeLinejoin="round" className="dt-fill" />
          )}
          {!closed && next > 1 && <polyline points={joinedPts} fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />}
          {pts.map((p, i) => {
            const joined = i < next
            return (
              <g key={`${i}-${shake.at === i ? shake.n : 0}`}
                className={`dt-dot${joined ? ' joined' : ''}${hintDot === i ? ' hint' : ''}${shake.n > 0 && shake.at === i ? ' shake' : ''}`}
                role="button" aria-label={`Dot ${i + 1}${joined ? ', joined' : ''}`} onPointerDown={() => tap(i)}>
                <circle cx={p.x} cy={p.y} r="27" fill="transparent" />
                <circle cx={p.x} cy={p.y} r="15" fill={joined ? INK : '#fff'} stroke={INK} strokeWidth="3" />
                <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={joined ? '#fff' : INK}>{i + 1}</text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">{round ? `${next} of ${total} dots joined.${hintDot !== null ? ` Hint: tap dot ${hintDot + 1}.` : ''}` : ''}</span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another picture</button>
          : <button className="sq-btn" onClick={newRound}>Other picture</button>}
      </div>
    </div>
  )
}
