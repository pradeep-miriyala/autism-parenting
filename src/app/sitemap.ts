// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { PARENTING_GAMES } from '@/lib/stats'

// The fallback matters: metadataBase falls back to localhost, which would be a
// harmless placeholder in a page tag but a broken sitemap if it ever shipped.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://littlesteps.miriyala.in'

// The parent pages under /parents are tools for one device — settings, recorded
// voice, progress, pictures. They are not secret, but there is nothing in them
// for a search result, so only the two that explain the site are listed.
const PAGES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '',                  changeFrequency: 'weekly',  priority: 1.0 },
  { path: '/about',            changeFrequency: 'monthly', priority: 0.8 },
  { path: '/parents',          changeFrequency: 'monthly', priority: 0.7 },
  { path: '/parents/privacy',  changeFrequency: 'monthly', priority: 0.6 },
  { path: '/stickers',         changeFrequency: 'monthly', priority: 0.5 },
  { path: '/copyright',        changeFrequency: 'yearly',  priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    ...PAGES.map(p => ({
      url: `${SITE}${p.path}`,
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...PARENTING_GAMES.map(game => ({
      url: `${SITE}/games/${game}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
