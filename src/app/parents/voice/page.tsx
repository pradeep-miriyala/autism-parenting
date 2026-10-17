import type { Metadata } from 'next'
import VoicePage from '@/games/parents/VoicePage'

export const metadata: Metadata = { title: 'Your voice' }

export default function Page() {
  return <VoicePage />
}
