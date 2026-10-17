import type { Metadata } from 'next'
import FeedbackPage from '@/games/parents/FeedbackPage'

export const metadata: Metadata = { title: 'Feedback' }

export default function Page() {
  return <FeedbackPage />
}
