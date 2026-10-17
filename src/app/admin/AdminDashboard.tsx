'use client'
// src/app/admin/AdminDashboard.tsx
// Little Steps at a glance: who is playing now, how the last two weeks went, and the names
// parents chose to share.

import { useCallback, useEffect, useState } from 'react'
import type { Dashboard } from '@/lib/stats'
import DashboardView from './DashboardView'

const REFRESH_MS = 30_000

export default function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [updated, setUpdated] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard', { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Could not load the numbers.')
      setData(body)
      setUpdated(new Date())
      setError('')
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => clearInterval(t)
  }, [load])

  async function remove(id: string, name: string) {
    if (!confirm(`Delete “${name}” from the shared list? This cannot be undone.`)) return
    setBusy(id)
    try {
      const res = await fetch(`/api/admin/dashboard?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Could not delete.')
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="adm-wrap" style={{ maxWidth: 1000 }}>
      <header className="adm-head" style={{ display: 'block', marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--rust)' }}>Admin</p>
        <h1 style={{ margin: '0.4rem 0 0.5rem' }}>Little Steps</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-60)', maxWidth: '62ch', lineHeight: 1.6 }}>
          How many people are on the games page and playing, counted anonymously. Updates every 30 seconds.
          {updated && <span style={{ color: 'var(--ink-30)' }}> Last updated {updated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}.</span>}
        </p>
        <div className="adm-actions" style={{ marginTop: '0.9rem' }}>
          <a className="adm-link" href="/" target="_blank" rel="noreferrer">View the games ↗</a>
          <a className="adm-link" href="/api/auth/signout">Sign out</a>
        </div>
      </header>

      {error && <p style={{ color: 'var(--rust)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
      {!data && !error && <p style={{ fontSize: '0.85rem', color: 'var(--ink-30)' }}>Loading…</p>}
      {data && <DashboardView data={data} onDelete={remove} busy={busy} />}
    </div>
  )
}
