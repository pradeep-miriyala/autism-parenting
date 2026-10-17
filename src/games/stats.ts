'use client'
// Tells the site how many people are playing, and nothing else about them. See
// src/lib/stats.ts for exactly what the server keeps.
//
//  * A heartbeat every 30 seconds while the page is open, visible and in use (a forgotten tab stops
//    counting after three quiet minutes), saying only which game is open, or that it is the tiles.
//  * A note when a round is finished.
//  * Nothing at all if the parent switched counting off, or the browser says Do Not Track / Global
//    Privacy Control, and nothing from a development build.
//  * The visit id is made fresh on every page load and never stored.
//  * A child's first name and age group go only when a parent switched sharing on. They are sent
//    with a random id the browser keeps, so that switching sharing off can delete them.
import { useCallback, useEffect, useRef } from 'react'

const BEAT_MS = 30_000
const IDLE_MS = 3 * 60_000
const ENDPOINT = '/api/ping'

export type AgeBand = 'u4' | '5-6' | '7-8' | '9+'
export type Share = { id: string; name: string; age: AgeBand | null }

export const ageBand = (age: number | null): AgeBand | null =>
  age === null ? null : age <= 4 ? 'u4' : age <= 6 ? '5-6' : age <= 8 ? '7-8' : '9+'

/** A random id the browser can keep, for a parent who shares. */
export function newShareId(): string {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  return Array.from(b, x => x.toString(36).padStart(2, '0')).join('').slice(0, 24)
}

function allowed(): boolean {
  if (process.env.NODE_ENV !== 'production') return false
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
  if (nav.doNotTrack === '1' || nav.msDoNotTrack === '1' || nav.globalPrivacyControl === true) return false
  return true
}

function post(body: Record<string, unknown>) {
  try {
    fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(body), keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {})
  } catch {}
}

/** Ask the server to delete a shared name. Works even when counting is off. */
export function forgetShared(id: string) {
  if (process.env.NODE_ENV !== 'production') return
  const visit = 'forget_' + newShareId()
  post({ e: 'forget', v: visit, g: 'home', id })
}

export function useStats({ enabled, game, share }: { enabled: boolean; game: string; share: Share | null }) {
  const visit = useRef('')
  const lastInput = useRef(0)
  const sentShare = useRef('')
  const live = useRef({ enabled, game, share })
  live.current = { enabled, game, share }

  const extras = useCallback((always: boolean) => {
    const s = live.current.share
    if (!s || !s.name) return {}
    const sig = `${s.id}|${s.name}|${s.age}`
    if (!always && sig === sentShare.current) return {}
    sentShare.current = sig
    return { id: s.id, name: s.name, ...(s.age ? { age: s.age } : {}) }
  }, [])

  const beat = useCallback(() => {
    const { enabled: on, game: g } = live.current
    if (!on || !allowed() || !visit.current) return
    if (document.visibilityState !== 'visible' || Date.now() - lastInput.current > IDLE_MS) return
    post({ e: 'hb', v: visit.current, g, ...extras(false) })
  }, [extras])

  useEffect(() => {
    visit.current = 'v' + newShareId()
    lastInput.current = Date.now()
    const touch = () => { lastInput.current = Date.now() }
    const events = ['pointerdown', 'keydown', 'touchstart'] as const
    events.forEach(e => window.addEventListener(e, touch, { passive: true }))
    const timer = setInterval(beat, BEAT_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') { touch(); beat() } }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      events.forEach(e => window.removeEventListener(e, touch))
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [beat])

  // Moving between the tiles and a game, or switching counting or sharing on, is reported at once.
  useEffect(() => { lastInput.current = Date.now(); beat() }, [enabled, game, share?.id, share?.name, share?.age, beat])

  const round = useCallback((g: string) => {
    const { enabled: on } = live.current
    if (!on || !allowed() || !visit.current) return
    post({ e: 'round', v: visit.current, g, ...extras(true) })
  }, [extras])

  return { round }
}
