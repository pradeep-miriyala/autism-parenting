import type { Metadata } from 'next'
import FamilyPage from '@/games/parents/FamilyPage'

export const metadata: Metadata = { title: 'Family pictures' }

export default function Page() {
  return <FamilyPage />
}
