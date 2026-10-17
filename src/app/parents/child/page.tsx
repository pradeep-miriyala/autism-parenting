import type { Metadata } from 'next'
import ChildForm from '@/games/parents/ChildForm'

export const metadata: Metadata = { title: 'Your child' }

export default function Page() {
  return <ChildForm />
}
