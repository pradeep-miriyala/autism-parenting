'use client'
// For the parent: this week at a glance. Counts rounds finished; there is no score.
import { useEffect, useState } from 'react'
import { GAME_TILES } from '../gameDefs'
import { STICKERS, summarise, type GameKey } from '../progress'
import { useApp } from '../store'

const GAME_NAMES = Object.fromEntries(GAME_TILES.map(g => [g.id, g.title])) as Record<GameKey, string>

export default function ProgressView() {
  const { progress, profile, clearProgress } = useApp()
  const [asked, setAsked] = useState(false)
  // "Today" is only known in the browser, so this waits for it rather than guess on the server.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()) }, [progress])
  if (!now) return <div className="ls-page"><h1 className="ls-h1">This week</h1></div>
  const sm = summarise(progress, now)
  const who = profile.name.trim() || 'Your child'
  const most = Math.max(1, ...sm.daily.map(d => d.count))
  const games = (GAME_TILES.map(g => g.id) as GameKey[]).filter(g => sm.byGame[g])
  return (
    <div className="ls-page">
      <h1 className="ls-h1">This week</h1>
      <div className="sq-parent ls-card">
        <p className="sq-note">
          {sm.week === 0
            ? 'No rounds finished in the last 7 days.'
            : `${who} finished ${sm.week} ${sm.week === 1 ? 'round' : 'rounds'} in the last 7 days${sm.today ? `, ${sm.today} today` : ''}.`}
        </p>
        <div className="sq-bars" role="img"
          aria-label={`Rounds finished each day: ${sm.daily.map(d => `${d.label} ${d.count}`).join(', ')}`}>
          {sm.daily.map(d => (
            <div key={d.key} className="sq-bar">
              <span className="sq-barn">{d.count || ''}</span>
              <span className="sq-barfill" style={{ height: `${Math.round((d.count / most) * 100)}%` }} />
              <span className="sq-bard">{d.label}</span>
            </div>
          ))}
        </div>
        {games.length > 0 && <p className="sq-note">{games.map(g => `${GAME_NAMES[g]} ${sm.byGame[g]}`).join(' · ')}</p>}
        <p className="sq-note">Stickers: {sm.stickers} of {STICKERS.length}. All time: {sm.total} {sm.total === 1 ? 'round' : 'rounds'}.</p>
        <p className="sq-note">Only finished rounds are counted. Your child’s rounds and stickers stay on this phone or computer.</p>
        {(sm.total > 0 || sm.stickers > 0) && (
          <div className="sq-confirm-row">
            <button type="button" className="sq-btn" onClick={() => { if (!asked) setAsked(true); else { setAsked(false); clearProgress() } }}>
              {asked ? 'Tap again to clear' : 'Clear stickers and progress'}
            </button>
            {asked && <button type="button" className="sq-btn" onClick={() => setAsked(false)}>Keep them</button>}
          </div>
        )}
      </div>
    </div>
  )
}
