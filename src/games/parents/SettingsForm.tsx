'use client'
// How the games behave: sound, how long each game's rounds are, tracing, hints and sprinkles. The games never change
// these by themselves, and there is no timer and no score.
import { useEffect, useState } from 'react'
import { GAME_SETTINGS, GAME_TILES } from '../gameDefs'
import { detectPlatform, type Platform } from '../profile'
import { HINT_CHOICES, useApp } from '../store'
import type { TraceMode } from '../TraceGame'

const LENGTH_ROWS = GAME_TILES.map(t => ({ id: t.id, ...GAME_SETTINGS[t.id] }))

export default function SettingsForm() {
  const app = useApp()
  const [platform, setPlatform] = useState<Platform>('other')
  useEffect(() => { setPlatform(detectPlatform()) }, [])
  return (
    <div className="ls-page">
      <h1 className="ls-h1">Game settings</h1>
      <div className="sq-parent ls-card">
        <label className="sq-inline">
          <input type="checkbox" checked={app.sound} onChange={e => app.setSound(e.target.checked)} />
          <span>Sound: say numbers, letters and praise aloud, and play the end-of-round chime</span>
        </label>
        <p className="sq-note">The speaker next to a number or word always plays it when tapped. The small sparkle for a right choice and the soft buzz for a wrong one always sound.</p>
      </div>

      <h2 className="sq-subhead">How long each round is</h2>
      <div className="sq-parent ls-card">
        {LENGTH_ROWS.map(r => (
          <label key={r.id} className="sq-inline sq-len">
            <span>{r.label}: <strong>{app.lengths[r.id]}</strong></span>
            <input type="range" min={r.min} max={r.max} value={app.lengths[r.id]}
              onChange={e => app.changeLength(r.id, Number(e.target.value))} />
            {r.note && <small>{r.note}</small>}
          </label>
        ))}
        <p className="sq-note">The game never changes these by itself. There is no timer and no score.</p>
      </div>

      <h2 className="sq-subhead">Tracing</h2>
      <div className="sq-parent ls-card">
        <label className="sq-inline">
          <span>Tracing (lines, letters and numbers): steps</span>
          <select value={app.traceMode} onChange={e => app.setTraceMode(e.target.value as TraceMode)}>
            <option value="trace">Trace it</option>
            <option value="trace-copy">Trace it, then draw it yourself</option>
          </select>
        </label>
        <p className="sq-note">
          Letters and numbers always come in order, as children learn them (A to Z, a to z, 0 to 9; a capital then its small
          form when both are shown), and carry on where they left off. The level is how much of each to trace: the start
          of it, most of it, or all of it. The whole letter is always shown faintly.
        </p>
        <button type="button" className="sq-btn" onClick={app.restartLetterOrder}>Start the order again</button>
      </div>

      <h2 className="sq-subhead">Help and celebration</h2>
      <div className="sq-parent ls-card">
        <label className="sq-inline">
          <span>If my child is stuck, give a hint after</span>
          <select value={app.hintSec} onChange={e => app.setHintSec(Number(e.target.value))}>
            {HINT_CHOICES.map(n => <option key={n} value={n}>{n === 0 ? 'Never' : `${n} seconds`}</option>)}
          </select>
        </label>
        <label className="sq-inline">
          <input type="checkbox" checked={app.sprinklesOn} onChange={e => app.setSprinklesOn(e.target.checked)} />
          <span>Sprinkles when a round is finished</span>
        </label>
        {platform === 'android' && (
          <p className="sq-tip">
            Tip: if your device has “Remove animations” turned on, the wrong-tap shake becomes a colour flash and the
            sprinkles fade instead of falling. That is a good setting for a child who is sensitive to movement. To change it, see{' '}
            <a href="https://support.google.com/accessibility/android/answer/11183305" target="_blank" rel="noopener noreferrer">Android’s guide ↗</a>.
          </p>
        )}
        {platform === 'ios' && (
          <p className="sq-tip">
            Tip: if your device has “Reduce Motion” turned on, the wrong-tap shake becomes a colour flash and the sprinkles
            fade instead of falling. That is a good setting for a child who is sensitive to movement. To change it, see{' '}
            <a href="https://support.apple.com/en-us/111781" target="_blank" rel="noopener noreferrer">Apple’s guide ↗</a>.
          </p>
        )}
      </div>
    </div>
  )
}
