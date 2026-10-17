'use client'
// Share the app: pass Little Steps on to another family.
import ShareApp from '../ShareApp'

export default function SharePage() {
  return (
    <div className="ls-page">
      <h1 className="sq-sr">Share the app</h1>
      <div className="sq-parent ls-card">
        <ShareApp />
      </div>
    </div>
  )
}
