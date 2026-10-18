// Memory pairs: the cards, and what happens when one is turned over. No imports, so scripts/test-memory.mts can check
// it. There is no timer, no move count and no score. Two cards that do not match simply turn back, quietly.

export const MEMORY_LEVELS: Record<number, { pairs: number; cols: number }> = {
  1: { pairs: 3, cols: 3 },   // 6 cards
  2: { pairs: 6, cols: 4 },   // 12 cards
  3: { pairs: 8, cols: 4 },   // 16 cards
}
export const memoryLevel = (level: number) => MEMORY_LEVELS[Math.min(3, Math.max(1, Math.round(level)))]

export type MemCard = { kind: string; colour: string; word: string }
export type Rand = () => number

function shuffled<T>(a: readonly T[], rand: Rand): T[] {
  const out = a.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Each picture twice, in a shuffled order. Two of the same never sit side by side in the list, so the first pair is not a gift. */
export function makeMemoryRound(level: number, things: readonly MemCard[], rand: Rand = Math.random): { cols: number; cards: MemCard[] } {
  const { pairs, cols } = memoryLevel(level)
  const chosen = shuffled(things, rand).slice(0, pairs)
  let cards = shuffled([...chosen, ...chosen], rand)
  const touching = (c: MemCard[]) => c.some((x, i) => i > 0 && c[i - 1].kind === x.kind)
  for (let tries = 0; tries < 100 && touching(cards); tries++) cards = shuffled([...chosen, ...chosen], rand)
  return { cols, cards }
}

/** `up`: the cards turned over now (none, one, or two that did not match). `seen`: every card ever turned over. */
export type MemState = { up: number[]; matched: number[]; seen: number[] }
export const startState = (): MemState => ({ up: [], matched: [], seen: [] })
export type MemEvent = 'ignore' | 'first' | 'match' | 'miss'

export function flip(cards: readonly MemCard[], s: MemState, i: number): { state: MemState; event: MemEvent } {
  if (!Number.isInteger(i) || i < 0 || i >= cards.length || s.matched.includes(i) || s.up.includes(i) || s.up.length >= 2) {
    return { state: s, event: 'ignore' }
  }
  const seen = s.seen.includes(i) ? s.seen : [...s.seen, i]
  if (s.up.length === 0) return { state: { ...s, up: [i], seen }, event: 'first' }
  const a = s.up[0]
  if (cards[a].kind === cards[i].kind) return { state: { up: [], matched: [...s.matched, a, i], seen }, event: 'match' }
  return { state: { ...s, up: [a, i], seen }, event: 'miss' }
}

/** After a miss, both cards turn back. */
export const turnBack = (s: MemState): MemState => (s.up.length === 2 ? { ...s, up: [] } : s)

export const memoryDone = (cards: readonly MemCard[], s: MemState) => cards.length > 0 && s.matched.length === cards.length

/** The card to gently point at when the child is stuck, or null. */
export function memoryHint(cards: readonly MemCard[], s: MemState): number | null {
  if (memoryDone(cards, s) || s.up.length === 2) return null
  const free = (j: number) => !s.matched.includes(j)
  if (s.up.length === 1) {
    const a = s.up[0]
    const mate = cards.findIndex((c, j) => j !== a && free(j) && c.kind === cards[a].kind)
    return mate >= 0 ? mate : null
  }
  // nothing turned: a pair whose two cards have both been seen, else a card not yet seen, else any card left
  for (let i = 0; i < cards.length; i++) {
    if (!free(i) || !s.seen.includes(i)) continue
    const mate = cards.findIndex((c, j) => j !== i && free(j) && c.kind === cards[i].kind)
    if (mate >= 0 && s.seen.includes(mate)) return i
  }
  const unseen = cards.findIndex((_, i) => free(i) && !s.seen.includes(i))
  if (unseen >= 0) return unseen
  return cards.findIndex((_, i) => free(i))
}
