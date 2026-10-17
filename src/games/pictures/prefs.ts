// What a parent chose for the Jigsaw, and which picture the next round uses. No browser code, so it is tested
// in scripts/test-jigsaw.mts.

/** 'mix': their photos and the drawn pictures take turns. 'mine': only their photos. 'cartoons': only the drawn ones. */
export type PictureMode = 'mix' | 'mine' | 'cartoons'
export const PICTURE_MODES: { id: PictureMode; label: string }[] = [
  { id: 'mix', label: 'My photos and the drawn pictures' },
  { id: 'mine', label: 'Only my photos' },
  { id: 'cartoons', label: 'Only the drawn pictures' },
]

export type JigsawPrefs = {
  pictures: PictureMode
  /** Plain edges: straight cuts with no knobs. */
  plain: boolean
  /** The faint picture on the board. */
  guide: boolean
}
export const DEFAULT_JIGSAW: JigsawPrefs = { pictures: 'mix', plain: false, guide: true }

/** Read from saved settings, so a damaged or old entry cannot break the page. */
export function cleanJigsaw(raw: unknown): JigsawPrefs {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    pictures: PICTURE_MODES.some(m => m.id === r.pictures) ? (r.pictures as PictureMode) : DEFAULT_JIGSAW.pictures,
    plain: typeof r.plain === 'boolean' ? r.plain : DEFAULT_JIGSAW.plain,
    guide: typeof r.guide === 'boolean' ? r.guide : DEFAULT_JIGSAW.guide,
  }
}

/** The photo (by its slot) for the next round, or null for a drawn picture. Never the same photo twice running. */
export function pickPhoto(mode: PictureMode, slots: number[], last: number | null, rand: () => number = Math.random): number | null {
  if (mode === 'cartoons' || slots.length === 0) return null
  if (mode === 'mix' && rand() < 0.5) return null
  const pool = slots.length > 1 ? slots.filter(s => s !== last) : slots
  return pool[Math.floor(rand() * pool.length)]
}
