'use client'
// src/app/admin/login/page.tsx — sign in to the dashboard
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.ok) {
      router.push('/admin')
    } else {
      setError('Invalid credentials. Try again.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--amber-dark)',
    border: '1px solid var(--border)', color: 'var(--ink)',
    padding: '0.75rem 1rem', fontSize: '0.82rem', outline: 'none',
    marginBottom: '0.75rem', fontFamily: 'var(--f-ui)',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
      <div style={{ width: '100%', maxWidth: 380, animation: 'fadeUp 0.7s ease both' }}>
        {/* Header */}
        <div style={{ background: 'var(--ink)', borderBottom: '3px solid var(--rust)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--amber)' }}>Little Steps</div>
            <div style={{ fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(163,155,142,0.6)', marginTop: '0.1rem' }}>Admin Access</div>
          </div>
          <span style={{ fontSize: '0.58rem', letterSpacing: '0.15em', color: 'rgba(245,240,224,0.25)', textTransform: 'uppercase' }}>Restricted</span>
        </div>

        {/* Form */}
        <div style={{ border: '1px solid var(--border)', borderTop: 'none', background: 'rgba(245,240,224,0.6)', padding: '2rem 1.5rem' }}>
          <form onSubmit={handleLogin}>
            <label style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-30)', display: 'block', marginBottom: '0.3rem' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com" style={inputStyle} />
            <label style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-30)', display: 'block', marginBottom: '0.3rem' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={{ ...inputStyle, marginBottom: '1.25rem' }} />
            {error && <p style={{ fontSize: '0.72rem', color: 'var(--rust)', marginBottom: '0.75rem' }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--rust)', color: 'var(--amber)', border: 'none', padding: '0.8rem', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Authenticating...' : 'Enter Admin →'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
