import type { Metadata } from 'next'
import ProgressView from '@/games/parents/ProgressView'

export const metadata: Metadata = { title: 'This week' }

export default function Page() {
  return <ProgressView />
}
