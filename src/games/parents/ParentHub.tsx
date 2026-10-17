'use client'
// The parents' front page: each area as a row, with a line saying where it stands.
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PARENT_PAGES } from '../nav'
import { summarise } from '../progress'
import { useApp } from '../store'
import { ChevronIcon, ChartIcon, GearIcon, MicIcon, ShieldIcon, UserIcon } from '../icons'

const PORTFOLIO = process.env.NEXT_PUBLIC_PORTFOLIO_URL || 'https://pradeep.miriyala.in'
const ICONS: Record<string, React.ReactNode> = {
  child: <UserIcon />, progress: <ChartIcon />, settings: <GearIcon />, voice: <MicIcon />, privacy: <ShieldIcon />,
}

export default function ParentHub() {
  const { profile, progress, sound, useRecordings, shareCounts } = useApp()
  const [week, setWeek] = useState<number | null>(null)
  useEffect(() => { setWeek(summarise(progress, new Date()).week) }, [progress])
  const share = async () => {
    const url = location.origin
    try {
      if (navigator.share) await navigator.share({ title: 'Little Steps', text: 'Calm practice games for autistic children.', url })
      else { await navigator.clipboard.writeText(url) }
    } catch {}
  }
  const line: Record<string, string> = {
    child: profile.name.trim() ? `${profile.name.trim()}${profile.age ? `, ${profile.age}` : ''}` : 'Not set',
    progress: week === null ? '' : week === 0 ? 'No rounds in the last 7 days' : `${week} ${week === 1 ? 'round' : 'rounds'} in the last 7 days`,
    settings: `Sound ${sound ? 'on' : 'off'}`,
    voice: useRecordings ? 'Plays your recordings, if you have made any' : 'Computer voice',
    privacy: shareCounts ? 'Anonymous counts on' : 'Counting off',
  }
  return (
    <div className="ls-page">
      <h1 className="ls-h1">For parents</h1>
      <p className="sq-note">Everything here stays on this phone or computer unless you choose otherwise.</p>

      <div className="ls-callout">
        <strong>Handing the screen to your child?</strong>
        <p>Open a game and tap the blue ▶ at the top. Only that game stays on screen, and the lock takes a long press to open.</p>
        <Link href="/" className="sq-btn primary">Choose a game</Link>
      </div>

      <ul className="ls-rows">
        {PARENT_PAGES.map(p => (
          <li key={p.slug}>
            <Link href={`/parents/${p.slug}`}>
              <span className="ls-row-ico">{ICONS[p.slug]}</span>
              <span className="ls-row-text"><strong>{p.title}</strong><small>{line[p.slug] || p.blurb}</small></span>
              <ChevronIcon />
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="sq-subhead">About the project</h2>
      <p className="sq-note">Little Steps is free, made by Pradeep Miriyala. It is not medical advice.</p>
      <p className="ls-links">
        <button type="button" className="sq-btn" onClick={share}>Share Little Steps</button>
        <Link href="/about" className="sq-btn">About</Link>
        <a href={PORTFOLIO} className="sq-btn" target="_blank" rel="noreferrer">Pradeep Miriyala ↗</a>
        <a href={`${PORTFOLIO}/contact`} className="sq-btn" target="_blank" rel="noreferrer">Get in touch ↗</a>
        <a href="https://github.com/pradeep-miriyala/autism-parenting" className="sq-btn" target="_blank" rel="noreferrer">Source ↗</a>
      </p>
    </div>
  )
}
