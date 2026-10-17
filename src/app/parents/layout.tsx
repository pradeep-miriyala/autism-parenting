// src/app/parents/layout.tsx — everything under /parents is behind the lock.
import type { Metadata } from 'next'
import ParentGate from '@/games/ParentGate'

export const metadata: Metadata = {
  title: { template: '%s — Little Steps', default: 'For parents — Little Steps' },
  robots: { index: false },
}

export default function ParentsLayout({ children }: { children: React.ReactNode }) {
  return <ParentGate>{children}</ParentGate>
}
