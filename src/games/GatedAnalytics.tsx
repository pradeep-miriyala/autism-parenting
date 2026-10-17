'use client'
// Vercel Analytics, held to the same promise as our own counting: nothing is recorded from a browser that sends Do
// Not Track or Global Privacy Control, or once a parent has switched counting off (Privacy). The script is not even
// loaded for a visit that starts with counting off; and if counting is switched off later, every event still to come
// is dropped before it is sent. It records page views only (no cookies, no names), and never runs in development.
import { Analytics } from '@vercel/analytics/react'
import { useEffect, useRef, useState } from 'react'
import { countingAllowed } from './stats'
import { useApp } from './store'

export default function GatedAnalytics() {
  const { ready, shareCounts } = useApp()
  const on = useRef(shareCounts)
  on.current = shareCounts
  const [armed, setArmed] = useState(false)
  // Wait until the parent's saved choice has been read, so a visit with counting off never starts it.
  useEffect(() => { if (ready && shareCounts && countingAllowed()) setArmed(true) }, [ready, shareCounts])
  if (!armed) return null
  return <Analytics beforeSend={event => (on.current && countingAllowed() ? event : null)} />
}
