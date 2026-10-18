import type { GameId } from './gameDefs'
// The child's profile: name, age, favourite colour. It lives in this browser only
// (localStorage) and is never sent anywhere. It personalises the congratulation
// and the sprinkles, and nothing else.

export type ColourId = 'mix' | 'blue' | 'yellow' | 'green' | 'pink' | 'purple'

export type Profile = {
  name: string
  say: string // optional: how to pronounce the name, for the voice
  age: number | null
  colour: ColourId
}

export const EMPTY_PROFILE: Profile = { name: '', say: '', age: null, colour: 'mix' }

export const COLOURS: { id: ColourId; label: string; hex: string | null }[] = [
  { id: 'mix', label: 'Mixed', hex: null },
  { id: 'blue', label: 'Blue', hex: '#8DA2D6' },
  { id: 'yellow', label: 'Yellow', hex: '#E0B64A' },
  { id: 'green', label: 'Green', hex: '#7FBF9E' },
  { id: 'pink', label: 'Pink', hex: '#E8A7B8' },
  { id: 'purple', label: 'Purple', hex: '#B7A6E0' },
]

const MIX = COLOURS.filter(c => c.hex).map(c => c.hex as string)

function lighten(hex: string, amount = 0.45) {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map(v => Math.round(v + (255 - v) * amount))
  return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join('')
}

/** One chosen colour gives a soft pair (itself and a paler shade); "mixed" gives all five. */
export function sprinklePalette(colour: ColourId): string[] {
  const hex = COLOURS.find(c => c.id === colour)?.hex
  return hex ? [hex, lighten(hex)] : MIX
}

export const AGES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
export const ageLabel = (a: number) => (a >= 13 ? '13 or older' : String(a))

/** Younger children get a simpler, bigger, slower celebration. */
export const isYoung = (age: number | null) => age !== null && age <= 6

/** A starting length for each game, offered once when the age is first set. */
export function startingLengths(age: number): Record<GameId, number> {
  // [up to 4, up to 6, up to 8, older]
  const by = (a: number, b: number, c: number, d: number) => (age <= 4 ? a : age <= 6 ? b : age <= 8 ? c : d)
  return {
    numbers: by(2, 3, 4, 5), spelling: by(3, 3, 4, 5), spot: by(1, 2, 3, 4), trace: by(1, 2, 3, 4), letters: by(1, 2, 3, 3),
    match: by(2, 3, 4, 5), habits: by(3, 4, 6, 8),
    count: by(1, 2, 2, 3), pattern: by(1, 2, 2, 3), sort: by(1, 2, 2, 3), odd: by(1, 2, 2, 3), puzzle: by(1, 1, 2, 3), dots: by(1, 1, 2, 3),
    memory: by(1, 1, 2, 3),
  }
}

/** Keep a typed name to letters, spaces and the marks names use. */
export function cleanName(raw: string, max = 24) {
  return raw.replace(/[^\p{L}\p{M}\s'’.-]/gu, '').replace(/\s+/g, ' ').trimStart().slice(0, max)
}

type Say = (name: string) => string

// Praise is for trying and keeping going, in a calm voice. With no name the same
// sentences simply drop it.
const STANDARD: Say[] = [
  n => (n ? `Well done, ${n}. You matched them all.` : 'Well done. You matched them all.'),
  n => (n ? `That was lovely, ${n}, one step at a time.` : 'That was lovely, one step at a time.'),
  n => (n ? `You did it, ${n}. Take a slow breath.` : 'You did it. Take a slow breath.'),
  n => (n ? `Nicely done, ${n}. Everything is in place.` : 'Nicely done. Everything is in place.'),
  n => (n ? `Good work, ${n}. Every one was right.` : 'Good work. Every one was right.'),
  n => (n ? `Thank you for trying, ${n}. You did it.` : 'Thank you for trying. You did it.'),
]
const YOUNG: Say[] = [
  n => (n ? `Yay, ${n}! You did it.` : 'Yay! You did it.'),
  n => (n ? `Hooray, ${n}! Well done.` : 'Hooray! Well done.'),
  n => (n ? `${n}, you kept going. Well done.` : 'You kept going. Well done.'),
  n => (n ? `Great trying, ${n}. You did it.` : 'Great trying. You did it.'),
]

/** The words on screen use the name as typed; the voice uses the "say it like" spelling. */
export function celebration(p: Profile): { shown: string; spoken: string } {
  const name = p.name.trim()
  const say = p.say.trim() || name
  const set = isYoung(p.age) ? YOUNG : STANDARD
  const f = set[Math.floor(Math.random() * set.length)]
  return { shown: f(name), spoken: f(say) }
}

export type Platform = 'android' | 'ios' | 'other'

/** Which phone/tablet system this is, so help text can name the right setting. */
export function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return 'android'
  // iPadOS 13+ reports itself as a Mac; the touch points give it away.
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios'
  return 'other'
}
