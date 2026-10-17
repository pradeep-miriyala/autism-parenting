// src/app/layout.tsx — Little Steps
// Faustina (display) · Karla (interface) · the same calm palette the games were designed in.
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PARENTING_CSS } from '@/games/styles'
import { SHELL_CSS } from '@/games/shellStyles'
import { AppProvider } from '@/games/store'
import AppShell from '@/games/AppShell'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Little Steps — calm practice games for autistic children',
    template: '%s — Little Steps',
  },
  description:
    'Calm practice games for autistic children: numbers, patterns, sorting, puzzles, spelling and drawing. No timers, no scores, no sign-up, and nothing leaves the device unless a parent chooses.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Little Steps',
  appleWebApp: { capable: true, title: 'Little Steps', statusBarStyle: 'default' },
  // Named in full because Next replaces this field rather than merging it.
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    shortcut: '/icon-192.png',
  },
  openGraph: { siteName: 'Little Steps', type: 'website', locale: 'en_IN' },
}

export const viewport: Viewport = {
  themeColor: '#F5F2EC',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Faustina:ital,wght@0,400..700;1,400..600&family=Literata:ital,opsz,wght@0,7..72,300..600;1,7..72,300..500&family=Karla:ital,wght@0,300..800;1,300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <style dangerouslySetInnerHTML={{ __html: PARENTING_CSS + SHELL_CSS }} />
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  )
}
