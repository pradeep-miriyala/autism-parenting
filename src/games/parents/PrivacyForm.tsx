'use client'
// What is counted, what is shared, and what never leaves the device.
import { useApp } from '../store'

export default function PrivacyForm() {
  const { shareCounts, changeCounting, shareName, startSharing, stopSharing, profile } = useApp()
  return (
    <div className="ls-page">
      <h1 className="ls-h1">Privacy</h1>
      <div className="sq-parent ls-card">
        <p className="sq-note">Your child’s rounds, stickers, details and any voice recordings you make stay on this phone or computer.</p>
        <label className="sq-inline">
          <input type="checkbox" checked={shareCounts} onChange={e => changeCounting(e.target.checked)} />
          <span>Count our visits anonymously, to show how many people use these games</span>
        </label>
        <p className="sq-note">
          Only which game is open and how many rounds are finished. No name, no address, no cookie and nothing that
          identifies you or your child. Nothing is counted if your browser says Do Not Track.
        </p>
        <label className="sq-inline">
          <input type="checkbox" checked={shareName} disabled={!shareCounts || (!shareName && !profile.name.trim())}
            onChange={e => (e.target.checked ? startSharing() : stopSharing())} />
          <span>Also share my child’s first name and age group with the developer</span>
        </label>
        <p className="sq-note">
          Optional, and off unless you turn it on. It helps to see which games children enjoy and at what age. Switching it
          off deletes what was shared.
          {!shareName && !profile.name.trim() ? ' Add your child’s name under Your child first.' : ''}
        </p>
      </div>
    </div>
  )
}
