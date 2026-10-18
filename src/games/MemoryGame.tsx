'use client'
// Memory pairs: cards face down. Turn one over, then another; if they match they stay, if not they turn back, quietly.
// No timer, no move count, no score. Nothing a child has found is ever lost. The picture's word is spoken when the
// sound is on. If the child is stuck, a card gently pulses: the one that matches the card turned over, or a card
// not seen yet.
import { useCallback, useEffect, useRef, useState } from 'react'
import { THINGS } from './thinking/rounds'
import { flip, makeMemoryRound, memoryDone, memoryHint, startState, turnBack, type MemCard, type MemState } from './memory/logic'
import { Pic } from './Pic'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const TURN_BACK_MS = 1300
const things: MemCard[] = THINGS.map(t => ({ kind: t.kind, colour: t.colour, word: t.word }))
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

export default function MemoryGame({ level, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
  level: number
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec: number
  onActive?: (active: boolean) => void
  onDone?: () => void
}) {
  const { say, praise, chime, ding } = useFeedback(sound)
  const fx = useSprinkles()
  const [round, setRound] = useState<{ cols: number; cards: MemCard[] } | null>(null)
  const [state, setState] = useState<MemState>(startState())
  const [turns, setTurns] = useState(0)
  const [misses, setMisses] = useState(0)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const back = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const newRound = useCallback(() => {
    clearTimeout(timer.current)
    clearTimeout(back.current)
    setRound(makeMemoryRound(level, things))
    setState(startState())
    setTurns(0)
    setMisses(0)
    setDone(false)
    setMessage('')
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])
  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(back.current) }, [])

  const cards = round?.cards ?? []
  const pairs = cards.length / 2
  useEffect(() => { onActive?.(!done && state.seen.length > 0) }, [done, state.seen.length, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  const stuck = useStuck(!!round && !done, hintSec, misses, `${turns}`)
  const hint = round && stuck && !done ? memoryHint(cards, state) : null

  function turn(i: number) {
    if (!round || done) return
    const r = flip(cards, state, i)
    if (r.event === 'ignore') return
    setState(r.state)
    setTurns(t => t + 1)
    say(cards[i].word)
    if (r.event === 'first') { setMessage(''); return }
    if (r.event === 'miss') {
      setMisses(m => m + 1)
      back.current = setTimeout(() => setState(s => turnBack(s)), TURN_BACK_MS)
      return
    }
    // a match
    ding()
    setMisses(0)
    setMessage(`A match: ${cards[i].word}.`)
    if (!memoryDone(cards, r.state)) return
    const c = celebration(profile)
    timer.current = setTimeout(() => {
      setDone(true)
      onDone?.()
      setMessage(c.shown)
      if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
      praise(c.spoken, true)
      timer.current = setTimeout(chime, 800)
    }, 700)
  }

  const found = state.matched.length / 2
  const rows = round ? Math.ceil(cards.length / round.cols) : 1

  return (
    <div className="th-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">Find the pairs</div>
          <div className={`sp-dots${pairs > 12 ? ' many' : ''}`} aria-hidden="true">
            {Array.from({ length: pairs || 3 }, (_, i) => <span key={i} className={i < found ? 'on' : ''} />)}
          </div>
        </div>
        <InfoButton say={say} text="Turn over a card, then another. If the pictures are the same, they stay. If not, they turn back. Try to remember where each one is." />
      </div>

      <div className="mm-grid" style={{ gridTemplateColumns: `repeat(${round?.cols ?? 3}, 1fr)`, '--mm-ratio-n': (round?.cols ?? 3) / rows } as React.CSSProperties}
        role="group" aria-label={`Memory cards, ${found} of ${pairs} pairs found`}>
        {cards.map((c, i) => {
          const up = state.up.includes(i) || state.matched.includes(i)
          const matched = state.matched.includes(i)
          return (
            <button key={i} type="button" className={`mm-card${up ? ' up' : ''}${matched ? ' matched' : ''}${hint === i ? ' hint' : ''}`}
              aria-label={up ? `Card ${i + 1}: ${c.word}${matched ? ', found' : ''}` : `Card ${i + 1}, face down`}
              aria-pressed={up} onClick={() => turn(i)} disabled={matched}>
              <span className="mm-inner">
                <span className="mm-face mm-back" aria-hidden="true"><span>?</span></span>
                <span className="mm-face mm-front" aria-hidden="true"><Pic kind={c.kind} colour={c.colour} /></span>
              </span>
            </button>
          )
        })}
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message && cap(message)}</div>
      <span className="sq-sr" role="status" aria-live="polite">{`${found} of ${pairs} pairs found.`}</span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another round</button>
          : <button className="sq-btn" onClick={newRound}>Other cards</button>}
      </div>
    </div>
  )
}
