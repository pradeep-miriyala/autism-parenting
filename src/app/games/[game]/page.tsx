// src/app/games/[game]/page.tsx — one game on its own address, e.g. /games/count.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import GameScreen from '@/games/GameScreen'
import { ALL_GAME_IDS, GAME_TILES, isGameId } from '@/games/gameDefs'

export const dynamicParams = false
export const generateStaticParams = () => ALL_GAME_IDS.map(game => ({ game }))

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params
  const t = GAME_TILES.find(x => x.id === game)
  return t ? { title: t.title, description: `${t.title}: ${t.blurb} A calm practice game for autistic children. No timers, no scores.` } : {}
}

export default async function GamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params
  if (!isGameId(game)) notFound()
  return <GameScreen id={game} />
}
