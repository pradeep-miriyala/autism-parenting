'use client'
// Number Steps and Spelling Bees: look at the target, tap the same symbols in order. No timers, no scores. A wrong
// tap gets a soft buzz and a short shake; nothing the child has already got right is lost.
import { useCallback, useEffect, useRef, useState } from 'react'
import { GAMES, keyboardRows, type KeyGameId, type WordType } from './gameDefs'
import InfoButton from './InfoButton'
import { SpeakerIcon } from './icons'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

export default function KeyGame({ id, length, wordType, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
  id: KeyGameId
  length: number
  wordType: WordType
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec: number
  onActive?: (active: boolean) => void
  onDone?: () => void
}) {
  const game = GAMES[id]
  const { say, praise, chime, ding, buzz } = useFeedback(sound)
  const fx = useSprinkles()
  const [target, setTarget] = useState<string[]>([])
  const [picture, setPicture] = useState<string | undefined>()
  const [spoken, setSpoken] = useState('')
  const [entered, setEntered] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [shake, setShake] = useState(0)
  const [misses, setMisses] = useState(0)   // wrong taps in a row on this symbol
  const [done, setDone] = useState(false)
  const [fine, setFine] = useState(false)   // a mouse/trackpad is present, so probably a real keyboard too
  const [flashKey, setFlashKey] = useState('')
  const [rows, setRows] = useState(GAMES.spelling.rows!)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pressRef = useRef<(k: string) => void>(() => {})

  const start = useCallback(() => {
    const r = GAMES[id].makeRound(length, wordType)
    setTarget(r.target)
    setPicture(r.picture)
    setSpoken(r.spoken)
    setEntered([])
    setDone(false)
    fx.clear()
    setMessage('')
    setShake(0)
    setMisses(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, length, wordType])
  useEffect(() => { start() }, [start])

  // Match the keyboard to the visitor's language once we are in the browser.
  useEffect(() => { setRows(keyboardRows(navigator.language)) }, [])
  useEffect(() => { setFine(window.matchMedia('(pointer: fine)').matches) }, [])

  // A round under way: something has been entered and it is not finished.
  useEffect(() => { onActive?.(!done && entered.length > 0) }, [done, entered.length, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  // Stuck? Two wrong taps in a row, or a pause, makes the next key glow. Any tap starts the wait again, and the
  // game never gives the answer any other way.
  const hint = useStuck(!done && target.length > 0, hintSec, misses, `${target.join('')}:${entered.length}:${shake}`)

  function press(k: string) {
    if (done || !k) return
    if (k === target[entered.length]) {
      const next = [...entered, k]
      setEntered(next)
      setMessage('')
      setShake(0) // a wrong tap must not leave the next box shaking
      setMisses(0)
      ding() // every right choice gets the sparkle, with sound on or off
      if (next.length === target.length) {
        const c = celebration(profile)
        setDone(true)
        onDone?.()
        if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
        setMessage(c.shown)
        // The last symbol is announced like any other; the chime and the message then follow it instead of cutting it off.
        say(game.say(k))
        praise(c.spoken, true)
        setTimeout(chime, 800)
      } else {
        say(game.say(k))
      }
    } else {
      buzz()
      setShake(n => n + 1)
      setMisses(m => m + 1)
    }
  }
  pressRef.current = press

  // Typing on a real keyboard plays the game too. It reads the character that was typed, not the key's position, so
  // AZERTY, QWERTZ and any other layout work without extra code. Typing in a form or a dialog is left alone.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.closest?.('dialog'))) return
      const spelling = id === 'spelling'
      const k = spelling
        ? (/^[a-z]$/i.test(e.key) ? e.key.toUpperCase() : '')
        : (/^[0-9]$/.test(e.key) ? e.key : '')
      if (!k) return
      setFlashKey(k)
      clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setFlashKey(''), 160)
      pressRef.current(k)
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(flashTimer.current) }
  }, [id])

  return (
    <div className="sq-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div className="sq-label">Look at {game.id === 'numbers' ? 'these' : 'this'}</div>
        <InfoButton say={say} text={game.id === 'numbers'
          ? 'Look at the numbers. Tap the same numbers, in the same order.'
          : 'Look at the picture and the word. Tap the letters to spell the word, one at a time.'} />
      </div>

      {picture && <div className="sq-pic" aria-hidden="true">{picture}</div>}

      <div className="sq-line sq-tline">
        <div className="sq-row" aria-label={`To copy: ${target.join(' ')}`}>
          {target.map((d, i) => (
            <div key={i} className={`sq-box target${hint && !done && i === entered.length ? ' hint' : ''}`}>{d}</div>
          ))}
        </div>
        <button type="button" className="sq-icon" aria-label="Hear it" onClick={() => say(spoken, true)}>
          <SpeakerIcon />
        </button>
      </div>

      <div className="sq-label sq-alabel">Tap {game.id === 'numbers' ? 'them' : 'it'} here</div>
      <div className="sq-line sq-aline">
        <div className="sq-row">
          {target.map((_, i) => {
            const got = i < entered.length
            const isNext = i === entered.length && !done
            return (
              <div key={`${i}-${isNext ? shake : 0}`}
                className={`sq-box${got ? ' got' : ''}${isNext ? ' next' : ''}${isNext && shake ? ' shake' : ''}`}>
                {got ? entered[i] : ''}
              </div>
            )
          })}
        </div>
        <span className="sq-slot" aria-hidden="true" />
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">
        {hint && !done ? `Hint: the next one is ${game.say(target[entered.length] ?? '')}` : ''}
      </span>

      {game.rows ? (
        <div className="sq-kb">
          {rows.map((r, ri) => (
            <div key={ri} className="sq-kbrow">
              {r.map(k => (
                <button key={k} className={`sq-key${hint && !done && k === target[entered.length] ? ' hint' : ''}${flashKey === k ? ' pressed' : ''}`}
                  onClick={() => press(k)} disabled={done} aria-label={game.say(k)}>{k}</button>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="sq-pad" style={{ '--cols': game.cols } as React.CSSProperties}>
          {game.keys.map((k, i) => k === ''
            ? <span key={i} className="sq-key sq-blank" aria-hidden="true" />
            : <button key={i} className={`sq-key${hint && !done && k === target[entered.length] ? ' hint' : ''}${flashKey === k ? ' pressed' : ''}`}
                onClick={() => press(k)} disabled={done} aria-label={game.say(k)}>{k}</button>)}
        </div>
      )}

      {fine && <p className="sq-kbhint">You can also type on your keyboard.</p>}

      <div className="sq-actions" style={{ marginTop: '1rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={start}>Another one</button>
          : <button className="sq-btn" onClick={() => setEntered([])}>Start again</button>}
      </div>
    </div>
  )
}
