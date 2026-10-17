import type { Metadata } from 'next'
import SharePage from '@/games/parents/SharePage'

export const metadata: Metadata = { title: 'Share the app' }

export default function Page() {
  return <SharePage />
}
