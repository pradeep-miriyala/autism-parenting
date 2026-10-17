'use client'
// How many? A group of the same thing, and three numbers: tap the one that says how many. Tapping a thing marks
// it with its number (1, 2, 3...), so a child can count them one at a time, and the numbers are spoken when
// the sound is on. No timer, no score. A wrong number buzzes and shakes; nothing is lost. If the child is
// stuck, the right number gently pulses.
import { useCallback, useEffect, useRef, useState } from 'react'
import { COUNT_QUESTIONS, countLayout, makeCountRound, type CountQuestion } from './thinking/rounds'
import { Pic } from './Pic'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const SETTLE_MS = 900

export default function CountGame({ level, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
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
  const [round, setRound] = useState<CountQuestion[]>([])
  const [qi, setQi] = useState(0)
  const [counted, setCounted] = useState<number[]>([])   // item indexes, in the order they were tapped
  const [misses, setMisses] = useState(0)
  const [shake, setShake] = useState<{ n: number; at: number }>({ n: 0, at: -1 })
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [settling, setSettling] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const newRound = useCallback(() => {
    clearTimeout(timer.current)
    setRound(makeCountRound(level))
    setQi(0)
    setCounted([])
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

  const q: CountQuestion | undefined = done ? undefined : round[qi]
  useEffect(() => { onActive?.(!done && (qi > 0 || counted.length > 0)) }, [done, qi, counted.length, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  const stuck = useStuck(!!q && !settling, hintSec, misses, `${qi}:${counted.length}:${shake.n}`)
  const hintNumber = q && stuck && !settling ? q.n : null

  function countOne(i: number) {
    if (!q || settling || counted.includes(i)) return
    setCounted(c => [...c, i])
    say(WORDS[counted.length + 1])
  }

  function choose(n: number) {
    if (!q || settling) return
    if (n !== q.n) {
      buzz()
      setShake(s => ({ n: s.n + 1, at: n }))
      setMisses(m => m + 1)
      return
    }
    ding()
    setMisses(0)
    setSettling(true)
    setMessage(`${q.n === 1 ? 'There is' : 'There are'} ${WORDS[q.n]}.`)
    say(WORDS[q.n])
    if (qi + 1 < round.length) {
      timer.current = setTimeout(() => { setQi(i => i + 1); setCounted([]); setSettling(false); setMessage('') }, SETTLE_MS)
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

  const lay = q ? countLayout(q.n) : []

  return (
    <div className="th-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">How many?</div>
          <div className="sp-dots" aria-hidden="true">
            {Array.from({ length: round.length || COUNT_QUESTIONS }, (_, i) => <span key={i} className={i < qi || done ? 'on' : ''} />)}
          </div>
        </div>
        <InfoButton say={say} text="Count the things. Tap each one to count it. Then tap the number that says how many." />
      </div>

      <div className="th-tray" role="group" aria-label={q ? `${q.n} ${q.thing.word}s` : 'Nothing to count'}>
        {q && lay.map((p, i) => {
          const order = counted.indexOf(i)
          return (
            <button key={`${qi}-${i}`} type="button" className={`cnt-item${order >= 0 ? ' counted' : ''}`}
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
              aria-label={order >= 0 ? `${q.thing.word}, counted ${order + 1}` : q.thing.word}
              onClick={() => countOne(i)}>
              <Pic kind={q.thing.kind} colour={q.thing.colour} />
              {order >= 0 && <span className="cnt-badge" aria-hidden="true">{order + 1}</span>}
            </button>
          )
        })}
      </div>

      <div className="th-nums" role="group" aria-label="How many?">
        {q && q.options.map(n => (
          <button key={`${qi}-${n}-${shake.at === n ? shake.n : 0}`} type="button"
            className={`th-num${hintNumber === n ? ' hint' : ''}${shake.n > 0 && shake.at === n ? ' shake' : ''}`}
            onClick={() => choose(n)} disabled={settling && n !== q.n}>
            {n}
          </button>
        ))}
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">
        {q ? `Question ${qi + 1} of ${round.length}. Count the ${q.thing.word}s.${hintNumber ? ` Hint: try ${hintNumber}.` : ''}` : ''}
      </span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another round</button>
          : <button className="sq-btn" onClick={newRound}>Other questions</button>}
      </div>
    </div>
  )
}
