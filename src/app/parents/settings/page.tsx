import type { Metadata } from 'next'
import SettingsForm from '@/games/parents/SettingsForm'

export const metadata: Metadata = { title: 'Game settings' }

export default function Page() {
  return <SettingsForm />
}
