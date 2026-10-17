// src/app/admin/ui.ts
// Shared inline-style tokens for the dashboard, matching the tokens in globals.css.

import type { CSSProperties } from 'react'

export const box: CSSProperties = {
  border: '1px solid var(--border)', background: '#fff', padding: '1.25rem',
}

export const label: CSSProperties = {
  fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase',
  color: 'var(--ink-30)', display: 'block', marginBottom: '0.35rem',
}

export const input: CSSProperties = {
  width: '100%', padding: '0.55rem 0.7rem', border: '1px solid var(--border)',
  background: 'var(--amber)', fontSize: '0.85rem',
}

export const btn: CSSProperties = {
  padding: '0.6rem 1.1rem', border: '1px solid var(--ink)', background: 'transparent',
  color: 'var(--ink)', fontSize: '0.7rem', letterSpacing: '0.12em',
  textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
}

export const btnPrimary: CSSProperties = {
  ...btn, background: 'var(--teal)', borderColor: 'var(--teal)', color: '#fff',
}

export const btnGhost: CSSProperties = {
  ...btn, border: '1px solid var(--border)', color: 'var(--ink-60)',
  padding: '0.4rem 0.75rem', fontSize: '0.62rem',
}

/** Single hue for all magnitude bars — these charts are one series each, so
 *  there is no categorical identity to encode and no second hue is warranted. */
export const BAR = 'var(--teal)'
export const BAR_TRACK = 'rgba(10,9,8,0.07)'
