// Which panels on the front screen are closed. No imports, so scripts/test-home.mts can check it. Only the closed
// ones are kept, so a panel for a new group of games starts open and nothing a parent chose is lost.

/** Read from saved settings: known groups only, each once, in the order the screen shows them. */
export function cleanClosed(raw: unknown, known: readonly string[]): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set(raw.filter((x): x is string => typeof x === 'string'))
  return known.filter(id => seen.has(id))
}

/** Close an open panel, or open a closed one. The order stays that of the screen. */
export function toggleClosed(closed: readonly string[], id: string, known: readonly string[]): string[] {
  const next = new Set(closed)
  if (!known.includes(id)) return known.filter(k => next.has(k))
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return known.filter(k => next.has(k))
}
