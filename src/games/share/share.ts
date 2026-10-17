// Sharing the app: the words that go with the link, the links for WhatsApp and email, and the QR code. No browser
// code, so scripts/test-share.mts can check it. Only the address of the app is ever shared. Nothing about a child
// is in it.
import qrcode from 'qrcode-generator'

export const SHARE_TITLE = 'Little Steps: calm practice games for autistic children'
export const SHARE_TEXT =
  'Little Steps has calm practice games for autistic children: numbers, patterns, puzzles, spelling and drawing. ' +
  'No sign-up, no timers and no scores. Everything stays on the phone.'

export const whatsappLink = (url: string) => `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`
export const emailLink = (url: string) =>
  `mailto:?subject=${encodeURIComponent(SHARE_TITLE)}&body=${encodeURIComponent(`${SHARE_TEXT}\n\n${url}`)}`

/** The QR code as a grid of dark and light squares. The error correction is "medium": it still scans if a corner is scuffed. */
export function qrGrid(text: string): boolean[][] {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  const n = qr.getModuleCount()
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)))
}

/** The grid as one SVG path (a square for each dark one) plus the size, with the empty border a scanner needs. */
export function qrPath(text: string, quiet = 4): { size: number; d: string } {
  const g = qrGrid(text)
  let d = ''
  g.forEach((row, r) => row.forEach((dark, c) => { if (dark) d += `M${c + quiet} ${r + quiet}h1v1h-1z` }))
  return { size: g.length + quiet * 2, d }
}
