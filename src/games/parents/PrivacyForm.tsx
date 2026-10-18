'use client'
// What is counted, what is shared, and what never leaves the device.
import { useApp } from '../store'

export default function PrivacyForm() {
  const { shareCounts, changeCounting, shareName, startSharing, stopSharing, profile } = useApp()
  return (
    <div className="ls-page">
      <h1 className="ls-h1">Privacy</h1>
      <div className="sq-parent ls-card">
        <p className="sq-note">Your child’s rounds, stickers, details, any voice recordings you make, any photos you add and the family pictures and names you add stay on this phone or computer.</p>
        <label className="sq-inline">
          <input type="checkbox" checked={shareCounts} onChange={e => changeCounting(e.target.checked)} />
          <span>Count our visits anonymously, to show how many people use these games</span>
        </label>
        <p className="sq-note">
          Only which game is open and how many rounds are finished, and which pages are looked at (through Vercel
          Analytics, which uses no cookies). No name, no address and nothing that identifies you or your child. Nothing
          is counted if your browser says Do Not Track, or if you switch this off.
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
        <p className="sq-note">
          Feedback is different: it is sent only when you press Send on the Feedback page. It holds what you wrote and, if
          you add one, an email address to reply to. It is kept for up to a year and is not linked to anything else.
        </p>
      </div>
    </div>
  )
}
