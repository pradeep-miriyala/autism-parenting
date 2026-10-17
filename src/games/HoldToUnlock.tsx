'use client'
// The parent lock: press and hold to open it. A quick tap does nothing, so it needs no reading
// or numbers, and a child pressing it by accident does not get through. A ring fills while it is
// held, so it is clear that something is happening and when it will let go.
import { useEffect, useRef, useState } from 'react'
import { LockIcon } from './icons'

export const HOLD_MS = 2500

export default function HoldToUnlock({ onUnlock, className = '' }: { onUnlock: () => void; className?: string }) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  function begin() {
    setHolding(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { setHolding(false); onUnlock() }, HOLD_MS)
  }
  function cancel() {
    setHolding(false)
    clearTimeout(timer.current)
  }

  return (
    <button type="button" className={`sq-icon sq-lock ${className}${holding ? ' holding' : ''}`}
      aria-label="Parent lock. Press and hold to unlock."
      onPointerDown={begin} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); begin() } }}
      onKeyUp={cancel} onBlur={cancel}
      onContextMenu={e => e.preventDefault()}>
      <svg className="sq-lock-ring" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="20" fill="none" strokeWidth="3" />
      </svg>
      <LockIcon />
    </button>
  )
}
