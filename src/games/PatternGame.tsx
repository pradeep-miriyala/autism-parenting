'use client'
// What comes next? A row of pictures that repeats, with the next one missing, and two or three to choose from.
// Tap the one that carries the pattern on. No timer, no score. A wrong choice buzzes and shakes; the right one
// fills the gap with the sparkle. If the child is stuck, the right choice gently pulses.
import { useCallback, useEffect, useRef, useState } from 'react'
import { PATTERN_QUESTIONS, makePatternRound, type PatternQuestion, type Piece } from './thinking/rounds'
import { Pic } from './Pic'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const SETTLE_MS = 1000

const PieceArt = ({ p }: { p: Piece }) => <Pic shape={p.shape} kind={p.kind} colour={p.colour} />

export default function PatternGame({ level, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
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
  const [round, setRound] = useState<PatternQuestion[]>([])
  const [qi, setQi] = useState(0)
  const [filled, setFilled] = useState(false)       // the gap has the right one in it
  const [misses, setMisses] = useState(0)
  const [shake, setShake] = useState<{ n: number; id: string }>({ n: 0, id: '' })
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const newRound = useCallback(() => {
    clearTimeout(timer.current)
    setRound(makePatternRound(level))
    setQi(0)
    setFilled(false)
    setMisses(0)
    setShake({ n: 0, id: '' })
    setDone(false)
    setMessage('')
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])
  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => clearTimeout(timer.current), [])

  const q: PatternQuestion | undefined = done ? undefined : round[qi]
  useEffect(() => { onActive?.(!done && qi > 0) }, [done, qi, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  const stuck = useStuck(!!q && !filled, hintSec, misses, `${qi}:${shake.n}`)
  const hintId = q && stuck && !filled ? q.answer.id : null

  function choose(p: Piece) {
    if (!q || filled) return
    if (p.id !== q.answer.id) {
      buzz()
      setShake(s => ({ n: s.n + 1, id: p.id }))
      setMisses(m => m + 1)
      return
    }
    ding()
    setFilled(true)
    setMisses(0)
    setMessage('Yes. That carries on the pattern.')
    if (qi + 1 < round.length) {
      timer.current = setTimeout(() => { setQi(i => i + 1); setFilled(false); setMessage('') }, SETTLE_MS)
      return
    }
    const c = celebration(profile)
    timer.current = setTimeout(() => {
      setDone(true)
      onDone?.()
      setMessage(c.shown)
      if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
      praise(c.spoken)
      timer.current = setTimeout(chime, 800)
    }, SETTLE_MS)
  }

  return (
    <div className="th-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">What comes next?</div>
          <div className="sp-dots" aria-hidden="true">
            {Array.from({ length: round.length || PATTERN_QUESTIONS }, (_, i) => <span key={i} className={i < qi || done ? 'on' : ''} />)}
          </div>
        </div>
        <InfoButton say={say} text="Look at the pictures in a row. They repeat. Tap the picture that comes next." />
      </div>

      {q && (
        <div className="pt-row" role="img" aria-label={`A pattern: ${q.shown.map(p => p.word).join(', ')}, then what comes next?`}>
          {q.shown.map((p, i) => <div key={`${qi}-${i}`} className="pt-cell"><PieceArt p={p} /></div>)}
          <div className={`pt-cell pt-gap${filled ? ' filled' : ''}`}>
            {filled ? <PieceArt p={q.answer} /> : <span aria-hidden="true">?</span>}
          </div>
        </div>
      )}

      <div className="th-choices" role="group" aria-label="Choose what comes next">
        {q && q.options.map(p => (
          <button key={`${qi}-${p.id}-${shake.id === p.id ? shake.n : 0}`} type="button"
            className={`th-choice${hintId === p.id ? ' hint' : ''}${shake.n > 0 && shake.id === p.id ? ' shake' : ''}`}
            aria-label={p.word} onClick={() => choose(p)} disabled={filled && p.id !== q.answer.id}>
            <PieceArt p={p} />
          </button>
        ))}
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">{q ? `Question ${qi + 1} of ${round.length}.${hintId ? ' Hint: try the glowing one.' : ''}` : ''}</span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another round</button>
          : <button className="sq-btn" onClick={newRound}>Other patterns</button>}
      </div>
    </div>
  )
}
