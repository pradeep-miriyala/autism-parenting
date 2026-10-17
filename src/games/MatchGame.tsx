'use client'
// Matching Objects: the same pictures down both sides, in a different order. Draw a line from one
// to its twin on the other side, starting from either column. A child who finds dragging hard can
// tap one picture and then its twin instead. No timer, no score. A wrong join buzzes and shakes the
// picture it landed on, as in every game; a line that is let go of on empty space just disappears
// (that is unfinished, not wrong), and nothing already matched is lost. If the child is stuck, a
// pair gently pulses.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ART } from './spot/art'
import { COLOURS, THEMES, themeById } from './spot/generate'
import { EXTRA_KINDS, WORD_SETS, makeLetterMatch, makeMatch, makeWordMatch, type MatchItem, type MatchRound, type MatchSet, type WordSet } from './match/generate'
import { makeLetter } from './trace/letters'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

type Side = 'l' | 'r'
type Ref = { side: Side; id: number }
type Anchor = { x: number; y: number }

// One soft colour per pair, so a finished line and its two pictures read as one thing.
const PAIR_COLOURS = ['#2E3A6B', '#D79A1B', '#3F9F68', '#B04A8A', '#2F8FB8', '#C0623A']
const DRAG_MIN = 8   // how far a finger must move before it counts as drawing a line, not a tap
const REACH = 10     // how far outside a picture a line may be let go and still land on it

/**
 * A letter, drawn from the same strokes the tracing game uses (so the single-storey a and g a child is
 * taught), cropped to the letter so each one fills its picture. A small letter is given a little more
 * room than its height, so it still reads as the smaller one.
 */
function LetterArt({ ch, ink }: { ch: string; ink: string }) {
  const strokes = makeLetter(ch).strokes
  const pts = strokes.flat()
  const x0 = Math.min(...pts.map(p => p.x)), x1 = Math.max(...pts.map(p => p.x))
  const y0 = Math.min(...pts.map(p => p.y)), y1 = Math.max(...pts.map(p => p.y))
  const pad = 14
  const h = Math.max(y1 - y0, 134) + 2 * pad
  const w = Math.max(x1 - x0, 60) + 2 * pad
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  return (
    <svg viewBox={`${cx - w / 2} ${cy - h / 2} ${w} ${h}`} className="mt-art" aria-hidden="true">
      <g fill="none" stroke={ink} strokeWidth="17" strokeLinecap="round" strokeLinejoin="round">
        {strokes.map((s, i) => (
          <polyline key={i} points={s.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} />
        ))}
      </g>
    </svg>
  )
}

/** The colour each drawing is made in: the picture themes' drawings and the extra animals. */
const COLOUR_OF: Record<string, string> = (() => {
  const all: Record<string, string> = { ...EXTRA_KINDS }
  for (const t of THEMES) Object.assign(all, t.kinds)
  return all
})()
const isWordSet = (s: MatchSet): s is WordSet => (WORD_SETS as readonly string[]).includes(s)

export default function MatchGame({ theme, pairs, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
  theme: MatchSet
  pairs: number
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec: number
  onActive?: (active: boolean) => void
  onDone?: () => void
}) {
  const { say, praise, chime, ding, buzz } = useFeedback(sound)
  const fx = useSprinkles()
  const [round, setRound] = useState<MatchRound | null>(null)
  const [matched, setMatched] = useState<number[]>([])
  const [selected, setSelected] = useState<Ref | null>(null)
  const [drag, setDrag] = useState<{ from: Ref; x: number; y: number; moved: boolean } | null>(null)
  const [shake, setShake] = useState<{ side: Side; id: number; n: number }>({ side: 'l', id: -1, n: 0 })
  const [misses, setMisses] = useState(0)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [anchors, setAnchors] = useState<Record<string, Anchor>>({})
  const boardRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const chimeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dragRef = useRef<{ from: Ref; startX: number; startY: number; moved: boolean } | null>(null)

  const newRound = useCallback(() => {
    setRound(theme === 'letters' ? makeLetterMatch(pairs) : isWordSet(theme) ? makeWordMatch(theme, pairs, COLOUR_OF) : makeMatch(themeById(theme), pairs))
    setMatched([])
    setSelected(null)
    setDrag(null)
    dragRef.current = null
    setMisses(0)
    setDone(false)
    setMessage('')
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, pairs])

  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => clearTimeout(chimeTimer.current), [])

  // Tell the page whether a round is under way, so leaving for the games can ask to finish it first.
  useEffect(() => { onActive?.(!done && matched.length > 0) }, [done, matched.length, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  // Where each picture's inner edge is, for the lines to join. Measured, because the pictures are
  // sized by the screen, and again whenever the board changes size (turning the phone, resizing).
  const measure = useCallback(() => {
    const board = boardRef.current
    if (!board) return
    const b = board.getBoundingClientRect()
    const next: Record<string, Anchor> = {}
    for (const [key, el] of Object.entries(itemRefs.current)) {
      if (!el) continue
      const r = el.getBoundingClientRect()
      next[key] = { x: (key[0] === 'l' ? r.right : r.left) - b.left, y: r.top + r.height / 2 - b.top }
    }
    setAnchors(next)
  }, [])
  useLayoutEffect(() => { measure() }, [round, measure])
  useEffect(() => {
    const board = boardRef.current
    if (!board || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measure())
    ro.observe(board)
    return () => ro.disconnect()
  }, [measure])

  const stuck = useStuck(!!round && !done, hintSec, misses, `${matched.length}:${selected?.id ?? ''}:${shake.n}`)
  const hintId = round && stuck && !done
    ? (selected ? selected.id : round.left.find(i => !matched.includes(i.id))?.id ?? null)
    : null

  const key = (s: Side, id: number) => `${s}${id}`
  const colourOf = (id: number) => PAIR_COLOURS[(round?.left.findIndex(i => i.id === id) ?? 0) % PAIR_COLOURS.length]

  function join(from: Ref, to: Ref) {
    if (!round || done) return
    setSelected(null)
    if (from.id !== to.id) {
      buzz()
      setShake(s => ({ side: to.side, id: to.id, n: s.n + 1 }))
      setMisses(m => m + 1)
      return
    }
    const next = [...matched, from.id]
    setMatched(next)
    setMisses(0)
    ding() // every right match gets the sparkle, with sound on or off
    // What is said aloud: the object's name, or for letters the capital and its small twin.
    const item = round.left.find(i => i.id === from.id)
    const twin = round.right.find(i => i.id === from.id)
    const spoken = item ? (item.glyph && twin ? `${item.label}, ${twin.label}` : item.label) : ''
    if (next.length < round.left.length) { if (spoken) say(spoken); return }

    const c = celebration(profile)
    setDone(true)
    onDone?.()
    setMessage(c.shown)
    if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
    if (spoken) say(spoken)
    praise(c.spoken, true)
    clearTimeout(chimeTimer.current)
    chimeTimer.current = setTimeout(chime, 800)
  }

  // A tap on a picture: choose it, or, if the other side already has one chosen, join the two.
  function tap(r: Ref) {
    if (done || matched.includes(r.id)) return
    if (!selected || selected.side === r.side) {
      if (selected && selected.side === r.side && selected.id === r.id) { setSelected(null); return }
      setSelected(r)
      const item = (r.side === 'l' ? round?.left : round?.right)?.find(i => i.id === r.id)
      if (item) say(item.label)
      return
    }
    join(selected, r)
  }

  const toBoard = (e: React.PointerEvent) => {
    const b = boardRef.current!.getBoundingClientRect()
    return { x: e.clientX - b.left, y: e.clientY - b.top }
  }

  /** The picture on `side` under the finger, if any (a little generously, for small fingers). */
  function itemAt(side: Side, clientX: number, clientY: number): Ref | null {
    if (!round) return null
    let best: Ref | null = null
    let bestD = Infinity
    for (const it of round.left) {
      const el = itemRefs.current[key(side, it.id)]
      if (!el || matched.includes(it.id)) continue
      const r = el.getBoundingClientRect()
      if (clientX < r.left - REACH || clientX > r.right + REACH || clientY < r.top - REACH || clientY > r.bottom + REACH) continue
      const d = Math.hypot(clientX - (r.left + r.right) / 2, clientY - (r.top + r.bottom) / 2)
      if (d < bestD) { bestD = d; best = { side, id: it.id } }
    }
    return best
  }

  function down(e: React.PointerEvent, r: Ref) {
    if (done || matched.includes(r.id) || e.button > 0) return
    try { boardRef.current?.setPointerCapture(e.pointerId) } catch {}
    const p = toBoard(e)
    dragRef.current = { from: r, startX: p.x, startY: p.y, moved: false }
    setDrag({ from: r, x: p.x, y: p.y, moved: false })
  }
  function move(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    const p = toBoard(e)
    if (!d.moved && Math.hypot(p.x - d.startX, p.y - d.startY) > DRAG_MIN) d.moved = true
    setDrag({ from: d.from, x: p.x, y: p.y, moved: d.moved })
  }
  function up(e: React.PointerEvent) {
    const d = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (!d) return
    try { boardRef.current?.releasePointerCapture(e.pointerId) } catch {}
    if (!d.moved) { tap(d.from); return }
    const target = itemAt(d.from.side === 'l' ? 'r' : 'l', e.clientX, e.clientY)
    if (target) join(d.from, target)   // let go on empty space: no line, no buzz
  }
  function cancel() { dragRef.current = null; setDrag(null) }

  const label = (it: MatchItem, s: Side) => `${it.label}, ${s === 'l' ? 'left' : 'right'} side${matched.includes(it.id) ? ', matched' : ''}`

  function column(side: Side, items: MatchItem[]) {
    return (
      <div className="mt-col">
        {items.map(it => {
          const Art = it.glyph || it.word || it.kind.startsWith('swatch.') ? null : ART[it.kind]
          const isMatched = matched.includes(it.id)
          const isSel = selected?.side === side && selected.id === it.id
          const isDrag = drag?.moved && drag.from.side === side && drag.from.id === it.id
          const hint = hintId === it.id && !isMatched
          const shaking = shake.n > 0 && shake.side === side && shake.id === it.id
          return (
            <button key={`${side}${it.id}-${shaking ? shake.n : 0}`} type="button"
              ref={el => { itemRefs.current[key(side, it.id)] = el }}
              className={`mt-item${isMatched ? ' matched' : ''}${isSel || isDrag ? ' sel' : ''}${hint ? ' hint' : ''}${shaking ? ' shake' : ''}`}
              style={isMatched ? { '--mc': colourOf(it.id) } as React.CSSProperties : undefined}
              aria-label={label(it, side)} aria-pressed={isSel}
              onPointerDown={e => down(e, { side, id: it.id })}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap({ side, id: it.id }) } }}>
              {it.glyph
                ? <LetterArt ch={it.glyph} ink="#2E3A6B" />
                : it.word
                  ? <span className="mt-word" aria-hidden="true">{it.word}</span>
                  : it.kind.startsWith('swatch.')
                    ? <svg viewBox="0 0 80 80" className="mt-art" aria-hidden="true">
                        <circle cx="40" cy="40" r="30" fill={COLOURS[it.colour]} stroke="#3B3B4F" strokeWidth="2.5" />
                      </svg>
                    : Art && <svg viewBox="0 0 80 80" className="mt-art" aria-hidden="true"><Art c={COLOURS[it.colour]} /></svg>}
            </button>
          )
        })}
      </div>
    )
  }

  const total = round?.left.length ?? pairs
  const dragFrom = drag?.moved ? anchors[key(drag.from.side, drag.from.id)] : undefined

  return (
    <div className="mt-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">Join the pairs</div>
          <div className="sp-dots" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={i < matched.length ? 'on' : ''} />
            ))}
          </div>
        </div>
        <InfoButton say={say}
          text="Look at the pictures on one side. Find the same picture on the other side. Draw a line to join them, or tap one and then the other." />
      </div>

      {round && (
        <div ref={boardRef} className="mt-board" style={{ '--n': round.left.length } as React.CSSProperties}
          onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
          {column('l', round.left)}
          <div className="mt-mid" aria-hidden="true" />
          {column('r', round.right)}
          <svg className="mt-lines" aria-hidden="true">
            {matched.map(id => {
              const a = anchors[key('l', id)], b = anchors[key('r', id)]
              if (!a || !b) return null
              return (
                <g key={id} stroke={colourOf(id)} strokeWidth="5" strokeLinecap="round" fill={colourOf(id)}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                  <circle cx={a.x} cy={a.y} r="5" stroke="none" /><circle cx={b.x} cy={b.y} r="5" stroke="none" />
                </g>
              )
            })}
            {drag?.moved && dragFrom && (
              <line x1={dragFrom.x} y1={dragFrom.y} x2={drag.x} y2={drag.y}
                stroke="#2E3A6B" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 9" />
            )}
          </svg>
        </div>
      )}

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">
        {round ? `${matched.length} of ${total} joined${hintId !== null ? '. Hint: try the pair that is glowing.' : ''}` : ''}
      </span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another one</button>
          : <button className="sq-btn" onClick={newRound}>Other pictures</button>}
      </div>
    </div>
  )
}
