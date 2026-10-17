'use client'
// "Share the app": a parent passes Little Steps on to another family. The phone's own share sheet where there is
// one, a copy-the-link button, WhatsApp and email, and a QR code for someone standing next to them. Only the
// address of the app is shared, never anything about the child, and nothing is counted.
import { useEffect, useMemo, useRef, useState } from 'react'
import { SHARE_TEXT, SHARE_TITLE, emailLink, qrPath, whatsappLink } from './share/share'

export default function ShareApp() {
  const [url, setUrl] = useState('')
  const [canShare, setCanShare] = useState(false)
  const [note, setNote] = useState('')
  const field = useRef<HTMLInputElement>(null)
  useEffect(() => {
    setUrl(`${location.origin}/`)
    setCanShare(typeof navigator.share === 'function')
  }, [])
  const qr = useMemo(() => (url ? qrPath(url) : null), [url])

  async function share() {
    try { await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url }) } catch {}   // closing the sheet is not an error
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setNote('Link copied.')
    } catch {
      field.current?.select()   // no clipboard here: the link is selected, ready to copy by hand
      setNote('Press and hold the link, then choose Copy.')
    }
  }

  return (
    <section aria-labelledby="sq-share-title">
      <h3 id="sq-share-title" className="sq-subhead">Share the app</h3>
      <p className="sq-note">
        Know another family who might like Little Steps? Send them the link. It is free, and there is nothing to sign up for.
      </p>
      <blockquote className="sh-message">{SHARE_TEXT}</blockquote>

      <p className="ls-links">
        {canShare && <button type="button" className="sq-btn primary" onClick={share}>Share…</button>}
        <button type="button" className={`sq-btn${canShare ? '' : ' primary'}`} onClick={copy} disabled={!url}>Copy link</button>
        {url && <a className="sq-btn" href={whatsappLink(url)} target="_blank" rel="noreferrer">WhatsApp ↗</a>}
        {url && <a className="sq-btn" href={emailLink(url)}>Email</a>}
      </p>
      <p className="sq-note" role="status">{note}</p>

      <label className="sq-note sh-label" htmlFor="sh-link">The link</label>
      <input id="sh-link" ref={field} className="sh-link" readOnly value={url} onFocus={e => e.currentTarget.select()} />

      {qr && (
        <>
          <h3 className="sq-subhead">Or scan this</h3>
          <p className="sq-note">Hold another phone’s camera over this picture to open the app.</p>
          <svg className="sh-qr" viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges" role="img" aria-label={`QR code for ${url}`}>
            <rect width={qr.size} height={qr.size} fill="#fff" />
            <path d={qr.d} fill="#1b1b2f" />
          </svg>
        </>
      )}

      <p className="sq-note">Only the link is shared. Nothing about your child is in it, and nothing here is counted.</p>
    </section>
  )
}
