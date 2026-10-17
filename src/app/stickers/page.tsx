// src/app/stickers/page.tsx
import type { Metadata } from 'next'
import StickerBook from '@/games/StickerBook'

export const metadata: Metadata = { title: 'My stickers' }

export default function StickersPage() {
  return <StickerBook />
}
