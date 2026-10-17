import type { Metadata } from 'next'
import PrivacyForm from '@/games/parents/PrivacyForm'

export const metadata: Metadata = { title: 'Privacy' }

export default function Page() {
  return <PrivacyForm />
}
