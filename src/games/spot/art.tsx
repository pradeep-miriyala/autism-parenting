// Spot the Differences: the drawings. Each object is drawn in an 80 x 80 box, resting
// on y = 70, from plain SVG shapes. `c` is the colour that can change in the game
// (the object's main part); everything else stays put. Flat shapes with a soft dark
// outline, so they read clearly on a pale ground at any size.
import type { ReactElement } from 'react'

type P = { c: string }
const O = '#3B3B4F'
const st = { stroke: O, strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const EYE = <></>
const dot = (x: number, y: number, r = 2.6, fill = O) => <circle cx={x} cy={y} r={r} fill={fill} stroke="none" />
const WOOD = '#8B5A3C'
const SKY = '#CFE8F7'
const PALE = 'rgba(255,255,255,0.5)'

export const ART: Record<string, (p: P) => ReactElement> = {
  // ── Farm ──
  'farm.barn': ({ c }) => (
    <g {...st}><rect x="12" y="32" width="56" height="38" fill={c} /><polygon points="6,34 40,10 74,34" fill={WOOD} />
      <rect x="30" y="46" width="20" height="24" fill="#FFF3DC" /><path d="M30 46 L50 70 M50 46 L30 70" fill="none" /></g>),
  'farm.tree': ({ c }) => (
    <g {...st}><rect x="34" y="42" width="12" height="30" fill={WOOD} /><circle cx="40" cy="30" r="25" fill={c} /></g>),
  'farm.cow': ({ c }) => (
    <g {...st}><rect x="16" y="50" width="7" height="18" fill="#fff" /><rect x="44" y="50" width="7" height="18" fill="#fff" />
      <rect x="12" y="26" width="46" height="28" rx="11" fill="#fff" /><ellipse cx="28" cy="36" rx="8" ry="6" fill={c} /><ellipse cx="44" cy="44" rx="6" ry="5" fill={c} />
      <rect x="52" y="20" width="22" height="22" rx="8" fill="#fff" /><ellipse cx="66" cy="36" rx="9" ry="6" fill="#F6B6C1" />{dot(62, 28)}{dot(70, 36, 1.8)}
      <path d="M54 20 L52 12 M72 20 L74 12" fill="none" /></g>),
  'farm.pig': ({ c }) => (
    <g {...st}><path d="M20 22 L28 10 L34 24 Z M60 22 L52 10 L46 24 Z" fill={c} /><circle cx="40" cy="42" r="28" fill={c} />
      <ellipse cx="40" cy="50" rx="13" ry="9" fill={PALE} />{dot(35, 50, 2)}{dot(45, 50, 2)}{dot(30, 36)}{dot(50, 36)}</g>),
  'farm.hen': ({ c }) => (
    <g {...st}><path d="M18 40 L6 30 L8 50 Z" fill={c} /><ellipse cx="38" cy="48" rx="24" ry="19" fill={c} /><circle cx="58" cy="28" r="12" fill={c} />
      <polygon points="68,28 78,32 68,35" fill="#F2A33A" /><path d="M54 16 q3 -7 6 0 q3 -7 6 2" fill="#D93B3B" /><path d="M32 66 v6 M44 66 v6" fill="none" />{dot(60, 26, 2)}</g>),
  'farm.hay': ({ c }) => (
    <g {...st}><path d="M8 70 Q10 22 40 20 Q70 22 72 70 Z" fill={c} /><path d="M20 62 Q40 52 60 62 M24 46 Q40 38 56 46" fill="none" stroke="rgba(59,59,79,0.45)" /></g>),
  'farm.tractor': ({ c }) => (
    <g {...st}><rect x="26" y="14" width="22" height="20" fill="#CFE8F7" /><rect x="14" y="30" width="44" height="24" rx="4" fill={c} /><rect x="10" y="26" width="8" height="12" fill={O} />
      <circle cx="54" cy="56" r="16" fill={O} /><circle cx="54" cy="56" r="6" fill="#B9B9C6" /><circle cx="22" cy="62" r="9" fill={O} /><circle cx="22" cy="62" r="3.5" fill="#B9B9C6" /></g>),
  'farm.flower': ({ c }) => (
    <g {...st}><path d="M40 36 V72" fill="none" stroke="#3F9F68" strokeWidth="4" /><path d="M40 60 q-14 -4 -14 -14 q12 0 14 14" fill="#5BBE84" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => <ellipse key={a} cx="40" cy="14" rx="6" ry="11" fill={c} transform={`rotate(${a} 40 28)`} />)}
      <circle cx="40" cy="28" r="9" fill="#8B5A3C" /></g>),

  // ── Sea ──
  'sea.fish': ({ c }) => (
    <g {...st}><polygon points="58,40 76,24 76,56" fill={c} /><ellipse cx="38" cy="40" rx="25" ry="17" fill={c} /><path d="M32 24 Q38 14 46 24 Z" fill={c} />{dot(24, 36)}
      <path d="M44 30 Q50 40 44 50" fill="none" stroke="rgba(59,59,79,0.45)" /></g>),
  'sea.crab': ({ c }) => (
    <g {...st}><path d="M18 52 L8 62 M26 58 L20 70 M62 52 L72 62 M54 58 L60 70" fill="none" /><path d="M24 38 L14 28 M56 38 L66 28" fill="none" />
      <circle cx="12" cy="24" r="9" fill={c} /><circle cx="68" cy="24" r="9" fill={c} /><ellipse cx="40" cy="48" rx="24" ry="16" fill={c} />
      <path d="M32 34 V28 M48 34 V28" fill="none" />{dot(32, 26, 3.2, '#fff')}{dot(48, 26, 3.2, '#fff')}{dot(32, 26, 1.4)}{dot(48, 26, 1.4)}</g>),
  'sea.star': ({ c }) => (
    <g {...st}><polygon points="40,8 49,30 72,31 54,46 60,69 40,56 20,69 26,46 8,31 31,30" fill={c} />{dot(34, 38, 2)}{dot(46, 38, 2)}</g>),
  'sea.octopus': ({ c }) => (
    <g {...st}><path d="M22 46 Q14 62 20 70 M34 50 Q30 66 34 72 M46 50 Q50 66 46 72 M58 46 Q66 62 60 70" fill="none" stroke={c} strokeWidth="8" />
      <circle cx="40" cy="30" r="22" fill={c} />{dot(32, 30, 3.2, '#fff')}{dot(48, 30, 3.2, '#fff')}{dot(32, 30, 1.5)}{dot(48, 30, 1.5)}</g>),
  'sea.boat': ({ c }) => (
    <g {...st}><path d="M40 8 V50" fill="none" /><polygon points="42,10 70,44 42,44" fill="#fff" /><polygon points="38,18 38,44 16,44" fill="#fff" />
      <path d="M8 48 H72 L62 68 H18 Z" fill={c} /><path d="M4 72 q9 -6 18 0 t18 0 t18 0 t18 0" fill="none" stroke="#5CA3D6" /></g>),
  'sea.shell': ({ c }) => (
    <g {...st}><path d="M40 70 L10 38 Q40 0 70 38 Z" fill={c} /><path d="M40 70 L26 20 M40 70 L40 14 M40 70 L54 20 M40 70 L18 28 M40 70 L62 28" fill="none" stroke="rgba(59,59,79,0.4)" /><rect x="30" y="68" width="20" height="6" rx="2" fill={c} /></g>),
  'sea.jelly': ({ c }) => (
    <g {...st}><path d="M24 50 q-4 10 0 20 M36 52 q-4 10 0 20 M48 52 q4 10 0 20 M58 50 q4 10 0 20" fill="none" stroke={c} strokeWidth="4" />
      <path d="M14 46 Q14 10 40 10 Q66 10 66 46 Z" fill={c} />{dot(32, 30, 2.2)}{dot(48, 30, 2.2)}</g>),
  'sea.weed': ({ c }) => (
    <g fill="none" stroke={c} strokeWidth="8" strokeLinecap="round"><path d="M24 72 Q14 54 26 40 Q36 26 24 10" /><path d="M42 72 Q32 54 44 40 Q54 26 42 8" /><path d="M58 72 Q50 56 60 44 Q68 32 58 18" /></g>),

  // ── Town ──
  'town.house': ({ c }) => (
    <g {...st}><rect x="12" y="34" width="56" height="36" fill={c} /><polygon points="6,36 40,10 74,36" fill={WOOD} /><rect x="32" y="48" width="16" height="22" fill="#FFF3DC" />
      <rect x="16" y="42" width="12" height="12" fill={SKY} /><rect x="52" y="42" width="12" height="12" fill={SKY} /></g>),
  'town.car': ({ c }) => (
    <g {...st}><path d="M20 38 L28 22 H52 L62 38 Z" fill={c} /><rect x="6" y="36" width="68" height="22" rx="8" fill={c} /><path d="M26 36 L31 26 H40 V36 Z M44 36 V26 H51 L57 36 Z" fill={SKY} />
      <circle cx="22" cy="58" r="10" fill={O} /><circle cx="22" cy="58" r="4" fill="#B9B9C6" /><circle cx="58" cy="58" r="10" fill={O} /><circle cx="58" cy="58" r="4" fill="#B9B9C6" /></g>),
  'town.bus': ({ c }) => (
    <g {...st}><rect x="4" y="18" width="72" height="42" rx="7" fill={c} />{[12, 28, 44].map(x => <rect key={x} x={x} y="26" width="12" height="12" fill={SKY} />)}<rect x="60" y="26" width="10" height="26" fill={SKY} />
      <circle cx="22" cy="62" r="8" fill={O} /><circle cx="22" cy="62" r="3" fill="#B9B9C6" /><circle cx="56" cy="62" r="8" fill={O} /><circle cx="56" cy="62" r="3" fill="#B9B9C6" /></g>),
  'town.light': ({ c }) => (
    <g {...st}><rect x="37" y="52" width="6" height="20" fill="#8A8A99" /><rect x="26" y="4" width="28" height="50" rx="7" fill={c} />
      <circle cx="40" cy="16" r="7" fill="#E5534B" /><circle cx="40" cy="29" r="7" fill="#F5D24F" /><circle cx="40" cy="42" r="7" fill="#5BBE84" /></g>),
  'town.tree': ({ c }) => (
    <g {...st}><rect x="36" y="46" width="8" height="26" fill={WOOD} /><ellipse cx="40" cy="30" rx="18" ry="24" fill={c} /></g>),
  'town.lamp': ({ c }) => (
    <g {...st}><rect x="37" y="30" width="6" height="42" fill="#8A8A99" /><path d="M22 28 Q40 4 58 28 Z" fill={c} /><ellipse cx="40" cy="31" rx="10" ry="5" fill="#FFF1A8" /><rect x="30" y="68" width="20" height="5" rx="2" fill="#8A8A99" /></g>),
  'town.bike': ({ c }) => (
    <g {...st}><circle cx="18" cy="54" r="13" fill="none" /><circle cx="62" cy="54" r="13" fill="none" /><path d="M18 54 L34 30 H52 L62 54 M34 30 L42 54 H18 M52 30 L48 20 H56 M34 30 L30 22 H38" fill="none" stroke={c} strokeWidth="4.5" /></g>),
  'town.shop': ({ c }) => (
    <g {...st}><rect x="10" y="30" width="60" height="40" fill={c} /><path d="M6 20 H74 V34 H6 Z" fill="#fff" />{[6, 22, 38, 54].map(x => <rect key={x} x={x} y="20" width="8.5" height="14" fill="#E5534B" stroke="none" />)}<path d="M6 20 H74 V34 H6 Z" fill="none" />
      <rect x="32" y="46" width="16" height="24" fill="#FFF3DC" /><rect x="14" y="42" width="14" height="14" fill={SKY} /><rect x="52" y="42" width="14" height="14" fill={SKY} /></g>),

  // ── School ──
  'school.book': ({ c }) => (
    <g {...st}><rect x="14" y="14" width="52" height="56" rx="4" fill={c} /><rect x="60" y="16" width="8" height="52" fill="#fff" /><path d="M24 14 V70" fill="none" /><path d="M32 30 H54 M32 40 H48" fill="none" stroke="#fff" strokeWidth="3.5" /></g>),
  'school.pencil': ({ c }) => (
    <g {...st} transform="rotate(35 40 40)"><rect x="33" y="8" width="14" height="46" fill={c} /><rect x="33" y="4" width="14" height="8" rx="3" fill="#F4A6B8" /><rect x="33" y="12" width="14" height="5" fill="#C9CCD6" />
      <polygon points="33,54 47,54 40,72" fill="#F2D3A5" /><polygon points="37,64 43,64 40,72" fill={O} /></g>),
  'school.bag': ({ c }) => (
    <g {...st}><path d="M28 24 Q28 8 40 8 Q52 8 52 24" fill="none" /><rect x="16" y="20" width="48" height="50" rx="14" fill={c} /><rect x="24" y="46" width="32" height="18" rx="6" fill={PALE} /><path d="M24 36 H56" fill="none" /></g>),
  'school.ruler': ({ c }) => (
    <g {...st} transform="rotate(-12 40 40)"><rect x="4" y="26" width="72" height="26" rx="3" fill={c} />{[12, 22, 32, 42, 52, 62].map((x, i) => <path key={x} d={`M${x} 26 v${i % 2 ? 8 : 12}`} fill="none" />)}</g>),
  'school.clock': ({ c }) => (
    <g {...st}><circle cx="40" cy="40" r="30" fill={c} /><circle cx="40" cy="40" r="23" fill="#fff" /><path d="M40 40 V24 M40 40 L52 46" fill="none" strokeWidth="3.5" />{dot(40, 40, 3)}
      {[0, 90, 180, 270].map(a => <path key={a} d="M40 19 v4" fill="none" transform={`rotate(${a} 40 40)`} />)}</g>),
  'school.globe': ({ c }) => (
    <g {...st}><path d="M18 62 Q40 80 62 62" fill="none" /><rect x="30" y="66" width="20" height="6" rx="2" fill="#8A8A99" /><circle cx="40" cy="36" r="26" fill={c} />
      <path d="M26 24 q8 -6 12 2 q-4 8 -10 6 Z M44 38 q10 -4 12 6 q-6 10 -12 2 Z" fill={PALE} stroke="none" /></g>),
  'school.apple': ({ c }) => (
    <g {...st}><path d="M40 24 C20 14 8 40 22 58 C30 70 36 66 40 66 C44 66 50 70 58 58 C72 40 60 14 40 24 Z" fill={c} /><path d="M40 24 q0 -10 6 -14" fill="none" stroke={WOOD} strokeWidth="3.5" /><path d="M42 18 q10 -8 16 0 q-8 8 -16 0" fill="#5BBE84" /></g>),
  'school.bell': ({ c }) => (
    <g {...st}><circle cx="40" cy="12" r="5" fill="#C9CCD6" /><path d="M16 60 Q18 20 40 16 Q62 20 64 60 Z" fill={c} /><rect x="12" y="58" width="56" height="8" rx="4" fill={c} /><circle cx="40" cy="70" r="5" fill="#C9CCD6" /></g>),

  // ── Home ──
  'home.sofa': ({ c }) => (
    <g {...st}><rect x="12" y="20" width="56" height="28" rx="10" fill={c} /><rect x="4" y="36" width="16" height="28" rx="7" fill={c} /><rect x="60" y="36" width="16" height="28" rx="7" fill={c} />
      <rect x="14" y="42" width="52" height="22" rx="6" fill={c} /><path d="M22 64 v6 M58 64 v6" fill="none" /></g>),
  'home.lamp': ({ c }) => (
    <g {...st}><rect x="37" y="36" width="6" height="30" fill="#8A8A99" /><ellipse cx="40" cy="68" rx="14" ry="5" fill="#8A8A99" /><polygon points="22,10 58,10 68,38 12,38" fill={c} /></g>),
  'home.bed': ({ c }) => (
    <g {...st}><rect x="4" y="22" width="9" height="46" rx="3" fill={WOOD} /><rect x="4" y="44" width="72" height="16" rx="3" fill={WOOD} /><rect x="12" y="34" width="62" height="14" rx="5" fill="#fff" />
      <rect x="32" y="34" width="42" height="16" rx="5" fill={c} /><ellipse cx="22" cy="34" rx="9" ry="6" fill="#F4F4FA" /></g>),
  'home.cup': ({ c }) => (
    <g {...st}><path d="M54 30 q16 0 12 12 q-4 10 -14 8" fill="none" stroke={c} strokeWidth="5" /><path d="M16 28 H58 V44 Q58 62 37 62 Q16 62 16 44 Z" fill={c} /><ellipse cx="37" cy="66" rx="26" ry="5" fill="#fff" />
      <path d="M28 20 q-4 -6 0 -12 M38 20 q-4 -6 0 -12 M48 20 q-4 -6 0 -12" fill="none" stroke="#B9B9C6" /></g>),
  'home.plant': ({ c }) => (
    <g {...st}><ellipse cx="28" cy="30" rx="8" ry="18" fill="#5BBE84" transform="rotate(-25 28 40)" /><ellipse cx="52" cy="30" rx="8" ry="18" fill="#5BBE84" transform="rotate(25 52 40)" /><ellipse cx="40" cy="26" rx="8" ry="20" fill="#3F9F68" />
      <polygon points="24,48 56,48 50,72 30,72" fill={c} /></g>),
  'home.chair': ({ c }) => (
    <g {...st}><rect x="20" y="8" width="8" height="34" rx="2" fill={c} /><rect x="20" y="8" width="38" height="8" rx="3" fill={c} /><rect x="18" y="38" width="44" height="10" rx="3" fill={c} /><path d="M22 48 V72 M58 48 V72" fill="none" strokeWidth="5" /></g>),
  'home.teddy': ({ c }) => (
    <g {...st}><circle cx="24" cy="14" r="7" fill={c} /><circle cx="56" cy="14" r="7" fill={c} /><ellipse cx="40" cy="54" rx="19" ry="17" fill={c} /><circle cx="22" cy="48" r="7" fill={c} /><circle cx="58" cy="48" r="7" fill={c} />
      <circle cx="40" cy="26" r="17" fill={c} /><ellipse cx="40" cy="31" rx="8" ry="6" fill={PALE} />{dot(33, 22)}{dot(47, 22)}{dot(40, 29, 2.2)}</g>),
  'home.clock': ({ c }) => (
    <g {...st}><rect x="10" y="10" width="60" height="60" rx="14" fill={c} /><circle cx="40" cy="40" r="22" fill="#fff" /><path d="M40 40 V26 M40 40 L50 46" fill="none" strokeWidth="3.5" />{dot(40, 40, 3)}</g>),
  // ── More animals (used by Matching: words to pictures) ──
  'animal.dog': ({ c }) => (
    <g {...st}><rect x="16" y="50" width="7" height="18" fill={c} /><rect x="44" y="50" width="7" height="18" fill={c} />
      <path d="M12 38 Q2 32 6 20" fill="none" strokeWidth="5" /><rect x="10" y="32" width="46" height="24" rx="11" fill={c} />
      <circle cx="60" cy="30" r="14" fill={c} /><path d="M50 20 Q42 34 52 42 Q58 32 56 20 Z" fill={WOOD} />
      <ellipse cx="70" cy="35" rx="8" ry="6" fill={PALE} />{dot(75, 33, 2.4)}{dot(62, 26)}</g>),
  'animal.cat': ({ c }) => (
    <g {...st}><path d="M58 66 Q76 66 72 48 Q70 40 64 44" fill="none" strokeWidth="5" />
      <ellipse cx="38" cy="54" rx="19" ry="16" fill={c} /><circle cx="38" cy="26" r="17" fill={c} />
      <polygon points="23,16 24,0 34,10" fill={c} /><polygon points="53,16 52,0 42,10" fill={c} />
      {dot(32, 24)}{dot(44, 24)}<path d="M38 28 L36 31 L40 31 Z" fill="#F29BB5" /><path d="M38 31 Q34 36 30 34 M38 31 Q42 36 46 34 M20 30 L30 31 M56 30 L46 31" fill="none" strokeWidth="1.8" /></g>),
  'animal.duck': ({ c }) => (
    <g {...st}><path d="M62 20 Q76 18 78 26 Q70 30 62 28 Z" fill="#F2A33A" />
      <path d="M8 44 Q10 66 34 66 Q56 66 58 46 Q56 30 44 34 L40 40 Z" fill={c} /><circle cx="52" cy="22" r="13" fill={c} />
      <path d="M22 46 Q32 38 42 50 Q34 58 22 46 Z" fill="rgba(255,255,255,0.55)" />{dot(55, 19)}
      <path d="M30 66 v6 M40 66 v6" fill="none" stroke="#F2A33A" strokeWidth="3" /></g>),
  'animal.rabbit': ({ c }) => (
    <g {...st}><circle cx="14" cy="52" r="7" fill="#fff" /><ellipse cx="38" cy="54" rx="22" ry="15" fill={c} />
      <rect x="44" y="2" width="9" height="24" rx="4.5" fill={c} /><rect x="30" y="4" width="9" height="22" rx="4.5" fill={c} transform="rotate(-8 34 15)" />
      <circle cx="46" cy="32" r="13" fill={c} /><ellipse cx="54" cy="36" rx="5" ry="4" fill={PALE} />{dot(49, 28)}{dot(57, 35, 1.8)}
      <rect x="40" y="64" width="12" height="6" rx="3" fill={c} /></g>),
  'animal.sheep': () => (
    <g {...st}><rect x="20" y="52" width="6" height="16" fill="#4A4A5C" /><rect x="46" y="52" width="6" height="16" fill="#4A4A5C" />
      <circle cx="22" cy="38" r="12" fill="#fff" /><circle cx="36" cy="30" r="13" fill="#fff" /><circle cx="50" cy="38" r="12" fill="#fff" /><circle cx="36" cy="46" r="13" fill="#fff" />
      <ellipse cx="62" cy="34" rx="11" ry="12" fill="#4A4A5C" />{dot(66, 30, 2.6, '#fff')}<circle cx="54" cy="24" r="4" fill="#4A4A5C" /></g>),
  'animal.elephant': () => (
    <g {...st}><rect x="18" y="50" width="10" height="20" rx="3" fill="#9AA3B5" /><rect x="42" y="50" width="10" height="20" rx="3" fill="#9AA3B5" />
      <ellipse cx="34" cy="40" rx="25" ry="19" fill="#9AA3B5" /><circle cx="58" cy="30" r="15" fill="#9AA3B5" />
      <path d="M64 38 Q76 42 72 56 Q70 62 66 58" fill="none" strokeWidth="6" />
      <ellipse cx="48" cy="30" rx="9" ry="12" fill="#B9C0CF" />{dot(62, 26)}<path d="M66 42 Q72 46 70 50" fill="none" stroke="#FFF3DC" strokeWidth="3" /></g>),
}
