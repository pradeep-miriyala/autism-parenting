import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'

// Little Steps: three rising blocks holding 1, 2 and 3 dots (counting, with no
// text so it survives 48px and needs no font), in the same soft pastels as the
// sprinkles, with a star on the top step. The calm teal ground keeps it apart
// from the Learning Lab's indigo tile on a home screen.
const GROUND = '#2F6F6B'
const DOT    = '#1F4A47'
const BLOCKS = [
  { x: 78,  h: 120, fill: '#F2D07A', dots: 1 },
  { x: 202, h: 200, fill: '#F0B5C4', dots: 2 },
  { x: 326, h: 280, fill: '#C8B8F0', dots: 3 },
]
const BOTTOM = 404, W = 108

const art = `
  <g>
    ${BLOCKS.map(b => {
      const top = BOTTOM - b.h
      const cx = b.x + W / 2
      // dots stacked from the top of the block, evenly spaced
      const dots = Array.from({ length: b.dots }, (_, i) =>
        `<circle cx="${cx}" cy="${top + 52 + i * 50}" r="14" fill="${DOT}"/>`).join('')
      return `<rect x="${b.x}" y="${top}" width="${W}" height="${b.h}" rx="16" fill="${b.fill}"/>${dots}`
    }).join('\\n    ')}
    <path d="M380.0 44.0 L390.6 71.4 L419.9 73.0 L397.1 91.6 L404.7 120.0 L380.0 104.0 L355.3 120.0 L362.9 91.6 L340.1 73.0 L369.4 71.4 Z"
          transform="translate(0 -8)" fill="#FFF4D6"/>
  </g>`

// The composition spans y 36..404, so nudge it down to sit centred on the tile.
// Maskable: same art scaled to the centre 72% so nothing falls outside Android's safe circle.
const svg = (scale = 1) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${GROUND}"/>
  <g transform="translate(${256 * (1 - scale)} ${256 * (1 - scale) + 36 * scale}) scale(${scale})">${art}</g>
</svg>`

const out = fileURLToPath(new URL('../public', import.meta.url))
writeFileSync(`${out}/icon.svg`, svg(1))
const jobs = [
  ['icon-192.png', svg(1), 192],
  ['icon-512.png', svg(1), 512],
  ['icon-maskable-512.png', svg(0.72), 512],
  ['apple-touch-icon.png', svg(1), 180],
]
for (const [name, src, size] of jobs) {
  await sharp(Buffer.from(src)).resize(size, size).png({ compressionLevel: 9 }).toFile(`${out}/${name}`)
  console.log('wrote', name, size)
}
