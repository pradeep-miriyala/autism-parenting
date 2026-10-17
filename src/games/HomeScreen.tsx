'use client'
// The front screen: the games, in groups. Each tile is a real link to that game's own page, so Back, reload and a
// bookmark all go where you would expect. Nothing else competes for the child's attention; the one thing for a
// grown-up is a quiet card on a first visit.
import Link from 'next/link'
import { GAME_GROUPS, GAME_TILES } from './gameDefs'
import { useApp } from './store'

export default function HomeScreen() {
  const { ready, setupSeen, markSetupSeen } = useApp()
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

      <nav className="sq-home-groups" aria-label="Choose a game">
        {GAME_GROUPS.map(grp => {
          const tiles = GAME_TILES.filter(t => t.group === grp.id)
          if (tiles.length === 0) return null
          return (
            <section key={grp.id} className="sq-group" aria-labelledby={`sq-grp-${grp.id}`}>
              <h2 id={`sq-grp-${grp.id}`} className="sq-group-title">{grp.title}<small>{grp.blurb}</small></h2>
              <div className="sq-tiles">
                {tiles.map(g => (
                  <Link key={g.id} href={`/games/${g.id}`} className="sq-tile">
                    <span className="sq-tile-ico" aria-hidden="true">{g.icon}</span>
                    <strong>{g.title}</strong>
                    <small>{g.blurb}</small>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </nav>
    </div>
  )
}
