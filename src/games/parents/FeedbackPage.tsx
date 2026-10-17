'use client'
// Feedback: a parent writes to the developer.
import FeedbackForm from '../FeedbackForm'

export default function FeedbackPage() {
  return (
    <div className="ls-page">
      <h1 className="sq-sr">Feedback</h1>
      <div className="sq-parent ls-card">
        <FeedbackForm />
      </div>
    </div>
  )
}
