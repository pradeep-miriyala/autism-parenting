// Colour it in: the pictures, as plain shapes, and the colours to paint them with. No imports, so
// scripts/test-colouring.mts can check them. A picture is a list of regions in the order they are drawn, so a later
// one sits on top of an earlier one. Each region is painted as a whole. The test makes sure no region is too small to
// touch, or hidden under the ones drawn after it.

export type Region =
  | { id: string; t: 'rect'; x: number; y: number; w: number; h: number; rx?: number }
  | { id: string; t: 'circle'; cx: number; cy: number; r: number }
  | { id: string; t: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { id: string; t: 'poly'; pts: number[] }   // x, y, x, y ...

export type Picture = { id: string; name: string; tier: 1 | 2 | 3; regions: Region[] }

export const VIEW = { w: 400, h: 300 }
/** The colour of an unpainted region. Painting with white takes a colour off again. */
export const PAPER = '#FFFFFF'

export const PALETTE: { id: string; name: string; hex: string }[] = [
  { id: 'red', name: 'Red', hex: '#E8554E' }, { id: 'orange', name: 'Orange', hex: '#F29B3C' },
  { id: 'yellow', name: 'Yellow', hex: '#F5D349' }, { id: 'green', name: 'Green', hex: '#6DB86B' },
  { id: 'blue', name: 'Blue', hex: '#4C8FD6' }, { id: 'sky', name: 'Light blue', hex: '#9BD3F0' },
  { id: 'purple', name: 'Purple', hex: '#9B7BD3' }, { id: 'pink', name: 'Pink', hex: '#F2A0C0' },
  { id: 'brown', name: 'Brown', hex: '#9A6B45' }, { id: 'grey', name: 'Grey', hex: '#A9A9B3' },
  { id: 'black', name: 'Black', hex: '#3B3B4F' }, { id: 'white', name: 'White', hex: PAPER },
]

const rect = (id: string, x: number, y: number, w: number, h: number, rx?: number): Region => ({ id, t: 'rect', x, y, w, h, rx })
const circle = (id: string, cx: number, cy: number, r: number): Region => ({ id, t: 'circle', cx, cy, r })
const ellipse = (id: string, cx: number, cy: number, rx: number, ry: number): Region => ({ id, t: 'ellipse', cx, cy, rx, ry })
const poly = (id: string, ...pts: number[]): Region => ({ id, t: 'poly', pts })
const full = (id: string) => rect(id, 0, 0, 400, 300)

export const PICTURES: Picture[] = [
  // ── a few big parts ──
  { id: 'house', name: 'a house', tier: 1, regions: [
    full('sky'), rect('ground', 0, 215, 400, 85), rect('wall', 110, 120, 180, 110),
    poly('roof', 95, 125, 200, 45, 305, 125), rect('door', 178, 160, 44, 70),
  ] },
  { id: 'fish', name: 'a fish', tier: 1, regions: [
    full('water'), poly('tail', 275, 150, 350, 92, 350, 208), poly('fin', 150, 98, 200, 60, 235, 100),
    ellipse('body', 190, 150, 95, 58), circle('eye', 135, 136, 14),
  ] },
  { id: 'tree', name: 'a tree', tier: 1, regions: [
    full('sky'), circle('sun', 335, 55, 32), rect('grass', 0, 230, 400, 70), rect('trunk', 175, 130, 50, 110), circle('leaves', 200, 100, 75),
  ] },
  // ── more parts ──
  { id: 'car', name: 'a car', tier: 2, regions: [
    full('sky'), rect('road', 0, 225, 400, 75), poly('cabin', 120, 132, 160, 82, 250, 82, 290, 132), rect('body', 70, 130, 260, 70, 14),
    poly('window1', 138, 128, 168, 92, 200, 92, 200, 128), poly('window2', 210, 92, 244, 92, 272, 128, 210, 128),
    circle('wheel1', 125, 205, 34), circle('wheel2', 275, 205, 34),
  ] },
  { id: 'rocket', name: 'a rocket', tier: 2, regions: [
    full('sky'), circle('moon', 330, 70, 35), poly('flame', 175, 230, 200, 285, 225, 230),
    poly('finL', 150, 170, 100, 235, 160, 225), poly('finR', 250, 170, 300, 235, 240, 225),
    ellipse('body', 200, 140, 50, 95), circle('window', 200, 120, 24),
  ] },
  { id: 'butterfly', name: 'a butterfly', tier: 2, regions: [
    full('sky'), ellipse('wingUL', 140, 105, 70, 50), ellipse('wingUR', 260, 105, 70, 50),
    ellipse('wingLL', 150, 190, 52, 42), ellipse('wingLR', 250, 190, 52, 42),
    circle('spotL', 135, 100, 18), circle('spotR', 265, 100, 18), ellipse('body', 200, 150, 14, 80),
  ] },
  { id: 'boat', name: 'a boat', tier: 2, regions: [
    full('sky'), circle('sun', 330, 60, 34), ellipse('cloud', 100, 60, 50, 22), rect('sea', 0, 200, 400, 100),
    poly('hull', 95, 215, 305, 215, 270, 265, 130, 265), rect('mast', 190, 80, 20, 140),
    poly('sail1', 210, 85, 210, 195, 285, 195), poly('sail2', 190, 100, 190, 195, 125, 195), poly('flag', 210, 78, 210, 100, 247, 89),
  ] },
  // ── many small parts ──
  { id: 'flower', name: 'a flower', tier: 3, regions: [
    full('sky'), rect('ground', 0, 235, 400, 65), rect('stem', 190, 150, 20, 95),
    poly('leafL', 192, 215, 140, 185, 135, 228), poly('leafR', 208, 215, 260, 185, 265, 228),
    circle('petal1', 252, 110, 30), circle('petal2', 226, 155, 30), circle('petal3', 174, 155, 30),
    circle('petal4', 148, 110, 30), circle('petal5', 174, 65, 30), circle('petal6', 226, 65, 30), circle('centre', 200, 110, 26),
  ] },
  { id: 'train', name: 'a train', tier: 3, regions: [
    full('sky'), rect('ground', 0, 235, 400, 65), rect('engine', 40, 130, 120, 95, 12), rect('chimney', 58, 92, 30, 40),
    rect('engineWindow', 110, 148, 36, 32), rect('carriage1', 175, 140, 95, 85, 10), rect('carriage2', 285, 140, 95, 85, 10),
    rect('window1', 192, 160, 60, 30), rect('window2', 302, 160, 60, 30), circle('wheelA', 80, 228, 22), circle('wheelB', 130, 228, 22),
  ] },
  { id: 'castle', name: 'a castle', tier: 3, regions: [
    full('sky'), rect('ground', 0, 240, 400, 60), rect('wall', 100, 140, 200, 105),
    rect('towerL', 70, 100, 55, 145), rect('towerR', 275, 100, 55, 145),
    poly('roofL', 62, 102, 97, 50, 133, 102), poly('roofR', 267, 102, 302, 50, 338, 102),
    rect('gate', 175, 175, 50, 70), rect('windowL', 88, 130, 20, 28), rect('windowR', 292, 130, 20, 28),
  ] },
]

/** The pictures a level may draw from: its own kind and the easier ones. */
export const picturesFor = (level: number) => PICTURES.filter(p => p.tier <= Math.min(3, Math.max(1, Math.round(level))))

/** The next picture, never the one just coloured. */
export function pickPicture(level: number, lastId: string | null, rand: () => number = Math.random): Picture {
  const all = picturesFor(level)
  const pool = all.length > 1 ? all.filter(p => p.id !== lastId) : all
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))]
}

export function contains(r: Region, x: number, y: number): boolean {
  if (r.t === 'rect') return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
  if (r.t === 'circle') return Math.hypot(x - r.cx, y - r.cy) <= r.r
  if (r.t === 'ellipse') return ((x - r.cx) / r.rx) ** 2 + ((y - r.cy) / r.ry) ** 2 <= 1
  let inside = false   // a point in a polygon: a line to the right crosses an odd number of edges
  const p = r.pts
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
    const xi = p[i], yi = p[i + 1], xj = p[j], yj = p[j + 1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function bounds(r: Region): { x0: number; y0: number; x1: number; y1: number } {
  if (r.t === 'rect') return { x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h }
  if (r.t === 'circle') return { x0: r.cx - r.r, y0: r.cy - r.r, x1: r.cx + r.r, y1: r.cy + r.r }
  if (r.t === 'ellipse') return { x0: r.cx - r.rx, y0: r.cy - r.ry, x1: r.cx + r.rx, y1: r.cy + r.ry }
  const xs = r.pts.filter((_, i) => i % 2 === 0), ys = r.pts.filter((_, i) => i % 2 === 1)
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
}

/** The region on top at a point: what a finger there would paint. */
export function topmostAt(p: Picture, x: number, y: number): Region | null {
  for (let i = p.regions.length - 1; i >= 0; i--) if (contains(p.regions[i], x, y)) return p.regions[i]
  return null
}
