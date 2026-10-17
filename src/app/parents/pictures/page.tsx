import type { Metadata } from 'next'
import PicturesPage from '@/games/parents/PicturesPage'

export const metadata: Metadata = { title: 'Your pictures' }

export default function Page() {
  return <PicturesPage />
}
