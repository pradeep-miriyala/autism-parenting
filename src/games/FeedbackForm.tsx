'use client'
// Feedback: a parent tells the developer what works, what does not and what they would like. It is sent only when
// Send is pressed, and the page says exactly what is kept (see src/lib/feedback.ts). If it cannot be sent, the
// words stay in the box.
import { useRef, useState } from 'react'
import { FEEDBACK_KINDS, FEEDBACK_LABELS, MAX_MESSAGE, MIN_MESSAGE, type FeedbackKind } from '@/lib/feedback'

type State = 'idle' | 'sending' | 'sent' | 'error'

const PROBLEMS: Record<string, string> = {
  short: 'Please write a little more, so the message makes sense.',
  long: `That is too long. Please keep it under ${MAX_MESSAGE} letters.`,
  contact: 'That email address does not look right. You can also leave it empty.',
  many: 'You have sent a few messages already. Please try again a little later.',
  unavailable: 'The message could not be kept just now. It is still here, so please try again in a little while.',
}
const GENERIC = 'The message could not be sent. It is still here, so please check your connection and try again.'

export default function FeedbackForm() {
  const [kind, setKind] = useState<FeedbackKind>('idea')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [trap, setTrap] = useState('')   // a box no person sees; a script that fills it in is ignored
  const [state, setState] = useState<State>('idle')
  const [problem, setProblem] = useState('')
  const sending = useRef(false)

  const long = message.length > MAX_MESSAGE
  const ready = message.trim().length >= MIN_MESSAGE && !long && state !== 'sending'

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!ready || sending.current) return
    sending.current = true
    setState('sending')
    setProblem('')
    const stop = new AbortController()
    const timer = setTimeout(() => stop.abort(), 12_000)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, message, contact: contact.trim() || undefined, site: trap }),
        signal: stop.signal,
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body.ok) {
        setState('sent')
        setMessage('')
        setContact('')
      } else {
        setProblem(PROBLEMS[body.reason as string] || GENERIC)
        setState('error')
      }
    } catch {
      setProblem(GENERIC)
      setState('error')
    } finally {
      clearTimeout(timer)
      sending.current = false
    }
  }

  if (state === 'sent') {
    return (
      <section aria-labelledby="sq-feedback-title">
        <h3 id="sq-feedback-title" className="sq-subhead">Feedback</h3>
        <p className="sq-note" role="status"><strong>Thank you.</strong> Your message was sent to the developer.</p>
        <p className="ls-links"><button type="button" className="sq-btn" onClick={() => setState('idle')}>Send another message</button></p>
      </section>
    )
  }

  return (
    <section aria-labelledby="sq-feedback-title">
      <h3 id="sq-feedback-title" className="sq-subhead">Feedback</h3>
      <p className="sq-note">
        Tell the developer what works, what does not and what you would like to see. It helps to make Little Steps
        better for your child and for others.
      </p>

      <form onSubmit={send} noValidate>
        <fieldset className="fb-kinds">
          <legend className="sq-note">What is it about?</legend>
          {FEEDBACK_KINDS.map(k => (
            <label key={k} className="sq-inline">
              <input type="radio" name="fb-kind" checked={kind === k} onChange={() => setKind(k)} />
              <span>{FEEDBACK_LABELS[k]}</span>
            </label>
          ))}
        </fieldset>

        <label className="sq-note fb-label" htmlFor="fb-message">Your message</label>
        <textarea id="fb-message" className="fb-text" rows={6} value={message} onChange={e => setMessage(e.target.value)}
          aria-describedby="fb-count" />
        <p id="fb-count" className={`sq-note fb-count${long ? ' over' : ''}`}>{message.length} of {MAX_MESSAGE} letters</p>

        <label className="sq-note fb-label" htmlFor="fb-contact">Your email, only if you would like a reply (optional)</label>
        <input id="fb-contact" className="fb-line" type="email" inputMode="email" autoComplete="email" maxLength={120}
          value={contact} onChange={e => setContact(e.target.value)} />

        {/* Hidden from people and from screen readers. */}
        <div className="fb-trap" aria-hidden="true">
          <label>Leave this empty<input type="text" name="site" tabIndex={-1} autoComplete="off" value={trap} onChange={e => setTrap(e.target.value)} /></label>
        </div>

        <p className="sq-note">
          Please do not write your child’s name or other personal details. The message is sent to the developer and is
          kept for up to a year. An email address, if you add one, is used only to reply.
        </p>

        {problem && <p className="sq-note vc-error" role="alert">{problem}</p>}

        <p className="ls-links">
          <button type="submit" className="sq-btn primary" disabled={!ready}>{state === 'sending' ? 'Sending…' : 'Send'}</button>
        </p>
      </form>
    </section>
  )
}
