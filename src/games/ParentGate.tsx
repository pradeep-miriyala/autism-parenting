'use client'
// The door to everything for grown-ups. Press and hold the lock for a few seconds: a quick tap does nothing, so it
// needs no reading or numbers, and a child pressing it by accident does not get through. Once open it stays open
// for a while in this tab (so moving between the parent pages does not ask again), then closes by itself.
import { useEffect, useState } from 'react'
import HoldToUnlock from './HoldToUnlock'

const KEY = 'ls-parent-open'
const OPEN_MS = 15 * 60_000

const isOpen = () => {
  try { return Date.now() - Number(sessionStorage.getItem(KEY) || 0) < OPEN_MS } catch { return false }
}

export default function ParentGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'locked' | 'open'>('checking')
  useEffect(() => { setState(isOpen() ? 'open' : 'locked') }, [])

  // While the grown-ups are using it, keep it open; when they stop, it closes.
  useEffect(() => {
    if (state !== 'open') return
    const keep = () => { try { sessionStorage.setItem(KEY, String(Date.now())) } catch {} }
    keep()
    const t = setInterval(() => { if (!isOpen()) setState('locked') }, 30_000)
    window.addEventListener('pointerdown', keep, { passive: true })
    return () => { clearInterval(t); window.removeEventListener('pointerdown', keep) }
  }, [state])

  if (state === 'checking') return null
  if (state === 'open') return <>{children}</>

  return (
    <section className="ls-gate" aria-labelledby="ls-gate-title">
      <h1 id="ls-gate-title">For parents</h1>
      <p>The settings, progress and privacy choices are kept behind this lock, so they are not changed by accident while your child plays.</p>
      <HoldToUnlock className="ls-gate-lock" onUnlock={() => { try { sessionStorage.setItem(KEY, String(Date.now())) } catch {}; setState('open') }} />
      <p className="ls-gate-hint">Press and hold the lock for a few seconds.</p>
    </section>
  )
}
