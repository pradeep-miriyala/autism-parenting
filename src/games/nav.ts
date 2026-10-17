// Where each address sits in the app: its title, and the screen "back" goes to. One table, so the header, the menu
// and the breadcrumbs always agree.
import { GAME_TILES, isGameId } from './gameDefs'

export type Crumb = { label: string; href: string }
export type Place = {
  /** The page's own name, for the header. */
  title: string
  /** An emoji shown beside it (games). */
  icon?: string
  /** Where "back" goes; null on the front screen. */
  up: string | null
  /** The path from the front screen to here, last item being this page. */
  crumbs: Crumb[]
  game?: boolean
}

export const PARENT_PAGES: { slug: string; title: string; blurb: string }[] = [
  { slug: 'child', title: 'Your child', blurb: 'Name, age and favourite colour' },
  { slug: 'progress', title: 'This week', blurb: 'Rounds finished and stickers' },
  { slug: 'settings', title: 'Game settings', blurb: 'Sound, how long rounds are, hints, tracing' },
  { slug: 'voice', title: 'Your voice', blurb: 'Record your own congratulations' },
  { slug: 'pictures', title: 'Your pictures', blurb: 'Add photos for the Jigsaw' },
  { slug: 'share', title: 'Share the app', blurb: 'Send Little Steps to another family' },
  { slug: 'privacy', title: 'Privacy', blurb: 'What is counted, and what stays on this device' },
]

const HOME: Crumb = { label: 'Games', href: '/' }

export function placeOf(pathname: string): Place {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { title: 'Little Steps', up: null, crumbs: [HOME] }
  const g = /^\/games\/([a-z]+)$/.exec(path)
  if (g && isGameId(g[1])) {
    const t = GAME_TILES.find(x => x.id === g[1])!
    return { title: t.title, icon: t.icon, up: '/', game: true, crumbs: [HOME, { label: t.title, href: path }] }
  }
  if (path === '/stickers') return { title: 'My stickers', up: '/', crumbs: [HOME, { label: 'My stickers', href: path }] }
  if (path === '/about') return { title: 'About Little Steps', up: '/', crumbs: [HOME, { label: 'About', href: path }] }
  if (path === '/parents') return { title: 'For parents', up: '/', crumbs: [HOME, { label: 'For parents', href: path }] }
  const p = /^\/parents\/([a-z]+)$/.exec(path)
  const page = p && PARENT_PAGES.find(x => x.slug === p[1])
  if (page) return { title: page.title, up: '/parents', crumbs: [HOME, { label: 'For parents', href: '/parents' }, { label: page.title, href: path }] }
  return { title: 'Little Steps', up: '/', crumbs: [HOME] }
}
