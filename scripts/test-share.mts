// scripts/test-share.mts
// Checks what a parent can share: the links carry the app's address and nothing else, are properly encoded, and the
// QR code is a real, steady square with the three corner marks a phone camera looks for.
//
//     node scripts/test-share.mts

import { SHARE_TEXT, SHARE_TITLE, emailLink, qrGrid, qrPath, whatsappLink } from '../src/games/share/share.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 20) console.error('FAIL', what) }
const URLS = ['https://little-steps.example/', 'https://little-steps.example.in/', 'http://localhost:3000/', 'https://a-much-longer-address.example.org/with/a/path?and=query&more=1']

// ── The words ──
check(SHARE_TEXT.length > 40 && SHARE_TEXT.length < 300, 'the message is short enough to send')
check(!/—|–|--/.test(SHARE_TEXT + SHARE_TITLE), 'no dashes in the message')
check(!/child's name|your child's/i.test(SHARE_TEXT), 'nothing about a particular child')

// ── The links ──
for (const u of URLS) {
  const w = whatsappLink(u), m = emailLink(u)
  check(w.startsWith('https://wa.me/?text='), `${u}: WhatsApp address`)
  check(decodeURIComponent(w.slice('https://wa.me/?text='.length)) === `${SHARE_TEXT} ${u}`, `${u}: WhatsApp carries the message and the address, intact`)
  check(!/[ \n]/.test(w) && !/[ \n]/.test(m), `${u}: no raw spaces or line breaks in a link`)
  const q = new URLSearchParams(m.slice('mailto:?'.length))
  check(m.startsWith('mailto:?') && q.get('subject') === SHARE_TITLE && q.get('body') === `${SHARE_TEXT}\n\n${u}`, `${u}: email subject and body`)
}

// ── The QR code ──
// Version 1 is 21 squares across and each version adds 4. Our addresses need versions 1 to 6.
const finder = (g: boolean[][], r0: number, c0: number) => {
  // a 7 by 7 ring, a 3 by 3 centre, and a light ring between: dark, light, dark from the outside in
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
    const edge = r === 0 || r === 6 || c === 0 || c === 6, centre = r >= 2 && r <= 4 && c >= 2 && c <= 4
    if (g[r0 + r][c0 + c] !== (edge || centre)) return false
  }
  return true
}
for (const u of URLS) {
  const g = qrGrid(u), n = g.length
  check(n >= 21 && n <= 41 && (n - 21) % 4 === 0, `${u}: ${n} squares across is a real QR size`)
  check(g.every(row => row.length === n), `${u}: a square grid`)
  check(finder(g, 0, 0) && finder(g, 0, n - 7) && finder(g, n - 7, 0), `${u}: the three corner marks`)
  const dark = g.flat().filter(Boolean).length / (n * n)
  check(dark > 0.3 && dark < 0.7, `${u}: about half dark (${(dark * 100).toFixed(0)}%)`)
  check(JSON.stringify(qrGrid(u)) === JSON.stringify(g), `${u}: the same address gives the same code`)
  const p = qrPath(u)
  check(p.size === n + 8 && /^(M\d+ \d+h1v1h-1z)+$/.test(p.d), `${u}: the path is squares with a four-square border`)
  check((p.d.match(/M/g) || []).length === g.flat().filter(Boolean).length, `${u}: a square for every dark one`)
}
check(JSON.stringify(qrGrid(URLS[0])) !== JSON.stringify(qrGrid(URLS[1])), 'different addresses give different codes')

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('share: all checks passed')
