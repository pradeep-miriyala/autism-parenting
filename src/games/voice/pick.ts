// Which recorded message to play: one of those that exist, picked at random, and never the same one twice
// in a row when there is a choice (so it does not sound like a loop). Dependency-free: scripts/test-voice.mts.

export const SLOTS = 3          // how many "Well done" messages a parent can record
export const MAX_SECONDS = 8    // each is short: a sentence, said warmly
export const MIN_MS = 600       // anything shorter is a stray tap, not a message

export function pickSlot(available: number[], last: number | null, rand: () => number = Math.random): number | null {
  if (available.length === 0) return null
  if (available.length === 1) return available[0]
  const others = available.filter(s => s !== last)
  const pool = others.length > 0 ? others : available
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))]
}
