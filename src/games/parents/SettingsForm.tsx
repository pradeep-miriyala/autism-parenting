'use client'
// How the games behave: sound, hints, sprinkles, and how long each game's rounds are. Every setting has a picture so a
// parent can find it at a glance, and each game's own setting folds away until it is opened. The games never change
// these by themselves, and there is no timer and no score.
import { useEffect, useState } from 'react'
import { GAME_SETTINGS, GAME_TILES } from '../gameDefs'
import { detectPlatform, type Platform } from '../profile'
import { HINT_CHOICES, useApp } from '../store'
import type { TraceMode } from '../TraceGame'
import { BulbIcon, SlidersIcon, SparkleIcon, SpeakerIcon } from '../icons'

const ROWS = GAME_TILES.map(t => {
  const s = GAME_SETTINGS[t.id]
  const at = s.label.indexOf(': ')
  return { id: t.id, icon: t.icon, title: t.title, what: at < 0 ? s.label : s.label.slice(at + 2).replace(/^./, ch => ch.toUpperCase()), min: s.min, max: s.max, note: s.note }
})

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`st-switch${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}><span /></button>
  )
}

function Row({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="st-row">
      <span className="st-ico" aria-hidden="true">{icon}</span>
      <span className="st-text"><strong>{title}</strong>{hint && <small>{hint}</small>}</span>
      <span className="st-ctl">{children}</span>
    </div>
  )
}

export default function SettingsForm() {
  const app = useApp()
  const [platform, setPlatform] = useState<Platform>('other')
  useEffect(() => { setPlatform(detectPlatform()) }, [])
  return (
    <div className="ls-page">
      <h1 className="ls-h1">Game settings</h1>

      <div className="sq-parent ls-card st-card">
        <Row icon={<SpeakerIcon />} title="Sound" hint="Say numbers, letters and praise aloud, and play the chime">
          <Switch checked={app.sound} onChange={app.setSound} label="Sound" />
        </Row>
        <Row icon={<BulbIcon />} title="Hints" hint="If my child is stuck, help after">
          <select value={app.hintSec} onChange={e => app.setHintSec(Number(e.target.value))} aria-label="Give a hint after">
            {HINT_CHOICES.map(n => <option key={n} value={n}>{n === 0 ? 'Never' : `${n} s`}</option>)}
          </select>
        </Row>
        <Row icon={<SparkleIcon />} title="Sprinkles" hint="When a round is finished">
          <Switch checked={app.sprinklesOn} onChange={app.setSprinklesOn} label="Sprinkles" />
        </Row>
        <p className="sq-note">Tapping a speaker or a word always plays it. The sparkle for a right choice and the soft buzz for a wrong one always sound.</p>
        {platform === 'android' && (
          <p className="sq-tip">
            Tip: if your device has “Remove animations” turned on, the wrong-tap shake becomes a colour flash and the
            sprinkles fade instead of falling. That suits a child who is sensitive to movement. See{' '}
            <a href="https://support.google.com/accessibility/android/answer/11183305" target="_blank" rel="noopener noreferrer">Android’s guide ↗</a>.
          </p>
        )}
        {platform === 'ios' && (
          <p className="sq-tip">
            Tip: if your device has “Reduce Motion” turned on, the wrong-tap shake becomes a colour flash and the sprinkles
            fade instead of falling. That suits a child who is sensitive to movement. See{' '}
            <a href="https://support.apple.com/en-us/111781" target="_blank" rel="noopener noreferrer">Apple’s guide ↗</a>.
          </p>
        )}
      </div>

      <h2 className="sq-subhead st-head"><SlidersIcon />Rounds, game by game</h2>
      <p className="sq-note st-intro">Tap a game to change it. There is no timer and no score, and nothing changes by itself.</p>
      <div className="sq-parent ls-card st-card st-list">
        {ROWS.map(r => (
          <details key={r.id} className="st-game">
            <summary>
              <span className="st-ico" aria-hidden="true">{r.icon}</span>
              <span className="st-text"><strong>{r.title}</strong></span>
              <span className="st-val" aria-label={`Level ${app.lengths[r.id]}`}>{app.lengths[r.id]}</span>
              <span className="st-chev" aria-hidden="true" />
            </summary>
            <div className="st-body">
              <label className="sq-inline sq-len">
                <span>{r.what}: <strong>{app.lengths[r.id]}</strong></span>
                <input type="range" min={r.min} max={r.max} value={app.lengths[r.id]}
                  onChange={e => app.changeLength(r.id, Number(e.target.value))} />
                {r.note && <small>{r.note}</small>}
              </label>
              {(r.id === 'trace' || r.id === 'letters') && (
                <>
                  <label className="sq-inline st-select">
                    <span>Steps</span>
                    <select value={app.traceMode} onChange={e => app.setTraceMode(e.target.value as TraceMode)}>
                      <option value="trace">Trace it</option>
                      <option value="trace-copy">Trace it, then draw it yourself</option>
                    </select>
                  </label>
                  {r.id === 'letters' && (
                    <>
                      <p className="sq-note">
                        Letters and numbers come in order, as children learn them, and carry on where they left off. The whole
                        letter is always shown faintly.
                      </p>
                      <button type="button" className="sq-btn" onClick={app.restartLetterOrder}>Start the order again</button>
                    </>
                  )}
                </>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
