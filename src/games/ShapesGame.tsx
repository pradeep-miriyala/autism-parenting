'use client'
// Colours and shapes: "Find the red one." "Find the circle." "Find the blue triangle." Tap the one that fits. The
// question is spoken when the sound is on, and always written. No timer, no score. A wrong choice buzzes and shakes;
// nothing is lost. If the child is stuck, the right one gently pulses.
import { useCallback, useEffect, useRef, useState } from 'react'
import { SHAPES_QUESTIONS, makeShapesRound, type ShapeQuestion } from './thinking/rounds'
import { Pic } from './Pic'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const SETTLE_MS = 900

export default function ShapesGame({ level, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
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
  const [round, setRound] = useState<ShapeQuestion[]>([])
  const [qi, setQi] = useState(0)
  const [misses, setMisses] = useState(0)
  const [shake, setShake] = useState<{ n: number; at: number }>({ n: 0, at: -1 })
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [settling, setSettling] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const newRound = useCallback(() => {
    clearTimeout(timer.current)
    setRound(makeShapesRound(level))
    setQi(0)
    setMisses(0)
    setShake({ n: 0, at: -1 })
    setDone(false)
    setMessage('')
    setSettling(false)
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])
  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => clearTimeout(timer.current), [])

  const q: ShapeQuestion | undefined = done ? undefined : round[qi]
  useEffect(() => { onActive?.(!done && qi > 0) }, [done, qi, onActive])
  useEffect(() => () => onActive?.(false), [onActive])
  // each new question is read out
  useEffect(() => { if (q && !settling) say(q.prompt) }, [q?.prompt, qi]) // eslint-disable-line react-hooks/exhaustive-deps

  const stuck = useStuck(!!q && !settling, hintSec, misses, `${qi}:${shake.n}`)
  const hint = q && stuck && !settling ? q.answer : null

  function choose(i: number) {
    if (!q || settling) return
    if (i !== q.answer) {
      buzz()
      setShake(s => ({ n: s.n + 1, at: i }))
      setMisses(m => m + 1)
      return
    }
    ding()
    setMisses(0)
    setSettling(true)
    const right = q.options[i]
    setMessage(`Yes, the ${right.word}.`)
    say(`Yes, the ${right.word}.`)
    if (qi + 1 < round.length) {
      timer.current = setTimeout(() => { setQi(k => k + 1); setSettling(false); setMessage('') }, SETTLE_MS)
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
          <div className="sq-label">Colours and shapes</div>
          <div className="sp-dots" aria-hidden="true">
            {Array.from({ length: round.length || SHAPES_QUESTIONS }, (_, i) => <span key={i} className={i < qi || done ? 'on' : ''} />)}
          </div>
        </div>
        <InfoButton say={say} text="Read the question, or tap the speaker. Then tap the colour or shape it asks for." />
      </div>

      <p className="cs-prompt">{q ? q.prompt : done ? 'All done.' : ''}</p>

      <div className="th-choices wrap" role="group" aria-label={q ? q.prompt : 'Choices'}>
        {q && q.options.map((o, i) => (
          <button key={`${qi}-${o.id}-${shake.at === i ? shake.n : 0}`} type="button"
            className={`th-choice${hint === i ? ' hint' : ''}${shake.n > 0 && shake.at === i ? ' shake' : ''}${settling && i === q.answer ? ' right' : ''}`}
            aria-label={o.word} onClick={() => choose(i)} disabled={settling && i !== q.answer}>
            <Pic shape={o.shape} colour={o.colour} />
          </button>
        ))}
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">
        {q ? `Question ${qi + 1} of ${round.length}. ${q.prompt}${hint !== null ? ` Hint: try the ${q.options[hint].word}.` : ''}` : ''}
      </span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another round</button>
          : <button className="sq-btn" onClick={newRound}>Other questions</button>}
      </div>
    </div>
  )
}
