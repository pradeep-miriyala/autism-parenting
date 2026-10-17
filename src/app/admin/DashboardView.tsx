'use client'
// src/app/admin/DashboardView.tsx
// Draws the Little Steps numbers. Takes the data as a prop and does no fetching, so it can be shown
// with sample numbers. All counts: nothing here identifies a person, except a name a parent chose to share.

import { AGE_BAND_LABELS, GAME_LABELS, PARENTING_GAMES, type Dashboard } from '@/lib/stats'
import { BAR, BAR_TRACK, box, btnGhost, label } from './ui'

const shortDay = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
const mins = (m: number) => (m >= 120 ? `${Math.round(m / 60)} h` : `${m} min`)

function Stat({ title, value, note }: { title: string; value: string | number; note?: string }) {
  return (
    <div style={{ ...box, padding: '1rem 1.1rem' }}>
      <span style={label}>{title}</span>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: '2rem', lineHeight: 1.1 }}>{value}</div>
      {note && <p style={{ fontSize: '0.72rem', color: 'var(--ink-30)', marginTop: '0.3rem', lineHeight: 1.45 }}>{note}</p>}
    </div>
  )
}

export default function DashboardView({ data, onDelete, busy }: {
  data: Dashboard
  onDelete?: (id: string, name: string) => void
  busy?: string
}) {
  const maxVisits = Math.max(1, ...data.days.map(d => d.visits))
  const maxRounds = Math.max(1, ...data.byGame.map(g => g.rounds))
  const live = data.live
  const liveGames = PARENTING_GAMES.filter(g => live.byGame[g])

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.8rem' }}>
        <Stat title="On the page now" value={live.total} note="Open and in use in the last minute or so." />
        <Stat title="Playing now" value={live.playing}
          note={liveGames.length ? liveGames.map(g => `${GAME_LABELS[g]} ${live.byGame[g]}`).join(' · ') : 'Nobody in a game.'} />
        <Stat title="Choosing a game" value={live.onTiles} note="On the tiles." />
        <Stat title="Today" value={data.today.visits} note={`visits · ${data.today.played} played · ${data.today.rounds} rounds · ${mins(data.today.minutes)}`} />
      </div>

      <section style={box}>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', marginBottom: '0.2rem' }}>Last 14 days</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-60)', marginBottom: '1rem' }}>
          {data.week.visits} visits, {data.week.played} of them opened a game · {data.week.rounds} rounds finished · about {mins(data.week.minutes)} played
        </p>
        <div role="img" aria-label={`Visits per day: ${data.days.map(d => `${shortDay(d.day)} ${d.visits}`).join(', ')}`}
          style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 130 }}>
          {data.days.map(d => (
            <div key={d.day} title={`${shortDay(d.day)}: ${d.visits} visits, ${d.played} played, ${d.rounds} rounds`}
              style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--ink-60)', minHeight: '0.8rem' }}>{d.visits || ''}</span>
              <div style={{ width: '100%', height: `${Math.round((d.visits / maxVisits) * 100)}%`, minHeight: d.visits ? 3 : 1,
                background: BAR_TRACK, display: 'flex', alignItems: 'flex-end', outline: d.visits ? 'none' : '1px solid var(--border)' }}>
                <div style={{ width: '100%', height: `${d.visits ? Math.round((d.played / d.visits) * 100) : 0}%`, background: BAR }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
          {data.days.map((d, i) => (
            <span key={d.day} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: '0.55rem', color: 'var(--ink-30)',
              visibility: i % 2 === data.days.length % 2 ? 'visible' : 'hidden', whiteSpace: 'nowrap' }}>{shortDay(d.day)}</span>
          ))}
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--ink-30)', marginTop: '0.6rem' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, background: BAR_TRACK, marginRight: 5 }} />visits ·{' '}
          <span style={{ display: 'inline-block', width: 10, height: 10, background: BAR, margin: '0 5px 0 4px' }} />opened a game
        </p>
      </section>

      <section style={box}>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', marginBottom: '0.9rem' }}>By game, last 14 days</h2>
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          {data.byGame.map(g => (
            <div key={g.game} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 190px) 1fr auto', gap: '0.7rem', alignItems: 'center', fontSize: '0.82rem' }}>
              <span>{GAME_LABELS[g.game]}</span>
              <div style={{ background: BAR_TRACK, height: 10 }}>
                <div style={{ width: `${Math.round((g.rounds / maxRounds) * 100)}%`, height: '100%', background: BAR }} />
              </div>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-60)', whiteSpace: 'nowrap' }}>{g.rounds} rounds · {mins(g.minutes)}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={box}>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', marginBottom: '0.2rem' }}>Shared by parents</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-60)', marginBottom: '0.9rem', lineHeight: 1.55 }}>
          Only parents who switched sharing on appear here, with the first name they typed and an age group. A parent
          can remove theirs from the settings; you can too. Anything unused for a year is deleted automatically.
        </p>
        {data.shared.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-30)' }}>Nobody has shared a name yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--ink-30)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {['Name', 'Age', 'Rounds', 'Games', 'Last seen', ''].map(h => <th key={h} style={{ padding: '0.4rem 0.6rem 0.4rem 0', fontWeight: 600 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.shared.map(s => (
                  <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.55rem 0.6rem 0.55rem 0', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '0.55rem 0.6rem 0.55rem 0' }}>{s.age ? AGE_BAND_LABELS[s.age] : '—'}</td>
                    <td style={{ padding: '0.55rem 0.6rem 0.55rem 0', fontVariantNumeric: 'tabular-nums' }}>{s.rounds}</td>
                    <td style={{ padding: '0.55rem 0.6rem 0.55rem 0', color: 'var(--ink-60)' }}>
                      {PARENTING_GAMES.filter(g => s.games[g]).map(g => `${GAME_LABELS[g]} ${s.games[g]}`).join(' · ') || '—'}
                    </td>
                    <td style={{ padding: '0.55rem 0.6rem 0.55rem 0', whiteSpace: 'nowrap', color: 'var(--ink-60)' }}>{when(s.lastSeen)}</td>
                    <td style={{ padding: '0.55rem 0', textAlign: 'right' }}>
                      {onDelete && (
                        <button style={{ ...btnGhost, color: 'var(--rust)' }} disabled={busy === s.id} onClick={() => onDelete(s.id, s.name)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p style={{ fontSize: '0.74rem', color: 'var(--ink-30)', lineHeight: 1.6 }}>
        How it is counted: a visit is one page load. “Opened a game” is a visit that got past the tiles. Time is a
        30-second beat while the page is open and in use (a forgotten tab stops after three quiet minutes). Not
        counted: anyone who switched counting off, browsers that send Do Not Track, and development builds. Days are
        India days. Nothing here is a person; there are no cookies, addresses or devices.
      </p>
    </div>
  )
}
