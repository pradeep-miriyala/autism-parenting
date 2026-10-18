'use client'
// The front screen: the games, in groups. Each group is a panel that opens and closes (all open to begin with, and
// the device remembers which ones were closed). Each tile is a real link to that game's own page, so Back, reload
// and a bookmark all go where you would expect. Nothing else competes for the child's attention; the one thing for a
// grown-up is a quiet card on a first visit.
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GAME_GROUPS, GAME_TILES } from './gameDefs'
import { ChevronIcon } from './icons'
import { useApp } from './store'

export default function HomeScreen() {
  const { ready, setupSeen, markSetupSeen, closedGroups, toggleGroup } = useApp()
  // Panels slide only after the saved choices are read, so a panel that was closed last time does not visibly close
  // again on every visit.
  const [slide, setSlide] = useState(false)
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setSlide(true), 80)
    return () => clearTimeout(t)
  }, [ready])
  return (
    <div className="ls-page home">
      <h1 className="sq-sr">Little Steps: calm practice games for autistic children</h1>

      {ready && !setupSeen && (
        <aside className="ls-welcome" aria-label="For parents">
          <div>
            <strong>Welcome to Little Steps</strong>
            <p>Calm games to practise together: no timers, no scores, nothing to sign up for. Choose a game to begin.</p>
            <p className="ls-welcome-links">
              <Link href="/about" onClick={markSetupSeen}>About Little Steps</Link>
              <Link href="/parents/child" onClick={markSetupSeen}>Set up for your child</Link>
            </p>
          </div>
          <button type="button" className="ls-welcome-x" onClick={markSetupSeen} aria-label="Hide this">×</button>
        </aside>
      )}

      <nav className={`sq-home-groups${slide ? ' slide' : ''}`} aria-label="Choose a game">
        {GAME_GROUPS.map(grp => {
          const tiles = GAME_TILES.filter(t => t.group === grp.id)
          if (tiles.length === 0) return null
          const open = !closedGroups.includes(grp.id)
          return (
            <section key={grp.id} className={`sq-panel${open ? '' : ' closed'}`}>
              <h2 className="sq-panel-h">
                <button type="button" id={`sq-pb-${grp.id}`} className="sq-panel-btn" aria-expanded={open} aria-controls={`sq-pp-${grp.id}`}
                  onClick={() => toggleGroup(grp.id)}>
                  <span className="sq-panel-ico" aria-hidden="true">{grp.icon}</span>
                  <span className="sq-panel-text">
                    <span className="sq-panel-title">{grp.title}</span>
                    <small>{grp.blurb}</small>
                  </span>
                  <span className="sq-panel-count">{tiles.length}<span className="sq-sr"> games</span></span>
                  <span className="sq-panel-chev" aria-hidden="true"><ChevronIcon /></span>
                </button>
              </h2>
              <div id={`sq-pp-${grp.id}`} className="sq-panel-body" role="region" aria-labelledby={`sq-pb-${grp.id}`}>
                <div className="sq-panel-inner">
                  <div className="sq-tiles">
                    {tiles.map(g => (
                      <Link key={g.id} href={`/games/${g.id}`} className="sq-tile">
                        <span className="sq-tile-ico" aria-hidden="true">{g.icon}</span>
                        <strong>{g.title}</strong>
                        <small>{g.blurb}</small>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </nav>
    </div>
  )
}
