'use client'
// Colour it in: pick a colour, then touch a part of the picture to paint it, or drag a finger across several. There is
// no right colour and nothing can go wrong: Undo takes the last stroke back, and white takes a colour off. There is no
// timer and no score. When the picture is how the child wants it, "I am finished" ends the round (and earns a
// sticker like any other game).
import { useCallback, useEffect, useRef, useState } from 'react'
import { PALETTE, PAPER, VIEW, pickPicture, type Picture, type Region } from './colouring/pictures'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const INK = '#3B3B4F'
type Fills = Record<string, string>

function Shape({ r, fill }: { r: Region; fill: string }) {
  const common = { 'data-region': r.id, fill, stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const }
  if (r.t === 'rect') return <rect {...common} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx} />
  if (r.t === 'circle') return <circle {...common} cx={r.cx} cy={r.cy} r={r.r} />
  if (r.t === 'ellipse') return <ellipse {...common} cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} />
  return <polygon {...common} points={r.pts.join(' ')} />
}

export default function ColouringGame({ level, sound, profile, sprinklesOn, onDone }: {
  level: number
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec?: number
  onActive?: (active: boolean) => void
  onDone?: () => void
}) {
  const { say, praise, chime, ding } = useFeedback(sound)
  const fx = useSprinkles()
  const [picture, setPicture] = useState<Picture | null>(null)
  const [fills, setFills] = useState<Fills>({})
  const [history, setHistory] = useState<Fills[]>([])
  const [colour, setColour] = useState(PALETTE[0].id)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const svg = useRef<SVGSVGElement>(null)
  const fillsRef = useRef<Fills>({})
  const painting = useRef(false)
  const marked = useRef(false)          // has this stroke already been saved for Undo?
  const colourRef = useRef(colour)
  colourRef.current = colour
  const lastId = useRef<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const doneRef = useRef(false)

  const newPicture = useCallback(() => {
    clearTimeout(timer.current)
    const p = pickPicture(level, lastId.current)
    lastId.current = p.id
    setPicture(p)
    fillsRef.current = {}
    setFills({})
    setHistory([])
    setDone(false)
    doneRef.current = false
    setMessage('')
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])
  useEffect(() => { newPicture() }, [newPicture])
  useEffect(() => () => clearTimeout(timer.current), [])

  const hex = (id: string) => PALETTE.find(c => c.id === id)!.hex

  // A touch on the picture paints; it must not scroll the page. A touch anywhere else scrolls as usual.
  useEffect(() => {
    const el = svg.current
    if (!el) return
    const hold = (e: TouchEvent) => { if (!doneRef.current) e.preventDefault() }
    el.addEventListener('touchstart', hold, { passive: false })
    return () => el.removeEventListener('touchstart', hold)
  }, [])

  function paintAt(x: number, y: number) {
    const id = (document.elementFromPoint(x, y)?.closest?.('[data-region]') as Element | null)?.getAttribute('data-region')
    if (!id) return
    const to = hex(colourRef.current)
    if ((fillsRef.current[id] ?? PAPER) === to) return
    if (!marked.current) { marked.current = true; const before = fillsRef.current; setHistory(h => [...h.slice(-49), before]); ding() }
    fillsRef.current = { ...fillsRef.current, [id]: to }
    setFills(fillsRef.current)
  }

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    if (doneRef.current || e.button > 0) return
    try { svg.current?.setPointerCapture(e.pointerId) } catch {}
    painting.current = true
    marked.current = false
    paintAt(e.clientX, e.clientY)
  }
  function onMove(e: React.PointerEvent<SVGSVGElement>) { if (painting.current) paintAt(e.clientX, e.clientY) }
  function onUp(e: React.PointerEvent<SVGSVGElement>) {
    painting.current = false
    try { svg.current?.releasePointerCapture(e.pointerId) } catch {}
  }

  function undo() {
    setHistory(h => {
      if (!h.length) return h
      fillsRef.current = h[h.length - 1]
      setFills(h[h.length - 1])
      return h.slice(0, -1)
    })
  }
  function startAgain() {
    if (!Object.keys(fillsRef.current).length) return
    const before = fillsRef.current
    setHistory(h => [...h.slice(-49), before])
    fillsRef.current = {}
    setFills({})
  }

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    setDone(true)
    painting.current = false
    onDone?.()
    const c = celebration(profile)
    setMessage(c.shown)
    if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
    praise(c.spoken, true)
    timer.current = setTimeout(chime, 800)
  }

  function choose(id: string) {
    setColour(id)
    say(PALETTE.find(c => c.id === id)!.name)
  }

  const painted = picture ? picture.regions.filter(r => (fills[r.id] ?? PAPER) !== PAPER).length : 0
  const all = !!picture && painted === picture.regions.length

  return (
    <div className="th-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">Colour it in</div>
        </div>
        <InfoButton say={say} text="Choose a colour, then touch a part of the picture to paint it. You can drag your finger to paint more parts. Press Undo to take the last paint back. When you like your picture, press I am finished." />
      </div>

      <div className="cl-board">
        <svg ref={svg} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="group" aria-label={picture ? `Colouring picture of ${picture.name}, ${painted} of ${picture.regions.length} parts painted` : 'Colouring picture'}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {picture?.regions.map(r => <Shape key={`${picture.id}-${r.id}`} r={r} fill={fills[r.id] ?? PAPER} />)}
        </svg>
      </div>

      <div className="cl-palette" role="group" aria-label="Colours">
        {PALETTE.map(c => (
          <button key={c.id} type="button" className={`cl-swatch${colour === c.id ? ' on' : ''}${c.hex === PAPER ? ' paper' : ''}`}
            style={{ background: c.hex }} aria-label={c.id === 'white' ? 'White, to take colour off' : c.name} aria-pressed={colour === c.id}
            disabled={done} onClick={() => choose(c.id)} />
        ))}
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">{picture ? `${painted} of ${picture.regions.length} parts painted. Colour: ${PALETTE.find(c => c.id === colour)!.name}.` : ''}</span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done ? (
          <button className="sq-btn primary" onClick={newPicture}>Another picture</button>
        ) : (
          <>
            <button className="sq-btn" onClick={undo} disabled={!history.length}>Undo</button>
            <button className="sq-btn" onClick={startAgain} disabled={painted === 0}>Start again</button>
            <button className={`sq-btn${all ? ' primary' : ''}`} onClick={finish} disabled={painted === 0}>I am finished</button>
            <button className="sq-btn" onClick={newPicture}>Other picture</button>
          </>
        )}
      </div>
    </div>
  )
}
