'use client'
// Odd one out: three or four pictures, all but one alike. Tap the one that is different. No timer, no score.
// A wrong tap buzzes and shakes that picture; the right one gets the sparkle and a short sentence saying why.
// If the child is stuck, the odd one gently pulses.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ODD_QUESTIONS, makeOddRound, type OddPiece, type OddQuestion } from './thinking/rounds'
import { Pic } from './Pic'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const SETTLE_MS = 1100
const sentence = (q: OddQuestion) => {
  const w = q.pieces[q.odd]
  return w.kind ? `The ${w.word} is not like the others.` : `This one is a different ${q.why.split(' ').pop()}.`
}

const PieceArt = ({ p }: { p: OddPiece }) => <Pic shape={p.shape} kind={p.kind} colour={p.colour} scale={p.big === false ? 0.55 : 1} />

export default function OddGame({ level, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
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
  const [round, setRound] = useState<OddQuestion[]>([])
  const [qi, setQi] = useState(0)
  const [found, setFound] = useState(false)
  const [misses, setMisses] = useState(0)
  const [shake, setShake] = useState<{ n: number; at: number }>({ n: 0, at: -1 })
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const newRound = useCallback(() => {
    clearTimeout(timer.current)
    setRound(makeOddRound(level))
    setQi(0)
    setFound(false)
    setMisses(0)
    setShake({ n: 0, at: -1 })
    setDone(false)
    setMessage('')
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])
  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => clearTimeout(timer.current), [])

  const q: OddQuestion | undefined = done ? undefined : round[qi]
  // Handy for testing in development only; never exposed in production.
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') (window as any).__odd = q
  useEffect(() => { onActive?.(!done && qi > 0) }, [done, qi, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  const stuck = useStuck(!!q && !found, hintSec, misses, `${qi}:${shake.n}`)
  const hintAt = q && stuck && !found ? q.odd : null

  function pick(i: number) {
    if (!q || found) return
    if (i !== q.odd) {
      buzz()
      setShake(s => ({ n: s.n + 1, at: i }))
      setMisses(m => m + 1)
      return
    }
    ding()
    setFound(true)
    setMisses(0)
    setMessage(sentence(q))
    say(sentence(q))
    if (qi + 1 < round.length) {
      timer.current = setTimeout(() => { setQi(n => n + 1); setFound(false); setMessage('') }, SETTLE_MS)
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

  return (
    <div className="th-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">Which is different?</div>
          <div className="sp-dots" aria-hidden="true">
            {Array.from({ length: round.length || ODD_QUESTIONS }, (_, i) => <span key={i} className={i < qi || done ? 'on' : ''} />)}
          </div>
        </div>
        <InfoButton say={say} text="Look at the pictures. They are all alike, except one. Tap the one that is different." />
      </div>

      <div className={`od-grid n${q?.pieces.length ?? 3}`} role="group" aria-label="Which one is different?">
        {q && q.pieces.map((p, i) => (
          <button key={`${qi}-${i}-${shake.at === i ? shake.n : 0}`} type="button"
            className={`th-choice od-item${hintAt === i ? ' hint' : ''}${found && i === q.odd ? ' right' : ''}${shake.n > 0 && shake.at === i ? ' shake' : ''}`}
            aria-label={p.word} onClick={() => pick(i)} disabled={found && i !== q.odd}>
            <PieceArt p={p} />
          </button>
        ))}
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">{q ? `Question ${qi + 1} of ${round.length}.${hintAt !== null ? ' Hint: try the glowing one.' : ''}` : ''}</span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another round</button>
          : <button className="sq-btn" onClick={newRound}>Other pictures</button>}
      </div>
    </div>
  )
}
