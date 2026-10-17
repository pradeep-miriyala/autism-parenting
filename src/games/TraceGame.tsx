'use client'
// Trace the Lines: a line is shown; the child draws along it on a canvas, with a dotted
// guide and a green start dot. Optionally they then draw it again by themselves, with
// the guide gone ("trace, then copy"). A drawing that is close enough is done; one that is
// unfinished is simply left to continue; one that has strayed (off the line, a scribble, the
// wrong size) gets the "try again" message together with the same buzz as a wrong tap
// elsewhere, and then a fresh start. There is no shake here: for drawing, trying is the point.
import { useCallback, useEffect, useRef, useState } from 'react'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'
import { VIEW, pickShape, type Pt, type Shape } from './trace/shapes'
import { letterSequence, makeLetter, nextInSequence, portionFor, type LetterCase } from './trace/letters'
import { isOffCourse, makeCourse, pathLength, pointAlong, scoreCopy, scoreTrace, traceOptions } from './trace/score'

export type TraceMode = 'trace' | 'trace-copy'

const INK = '#2E3A6B'
const GUIDE = '#8F9BC9'
const START = '#217D4F'
const HINT = '#D79A1B'
const PAPER = '#FBF9F5'
const IDLE_MS = 900 // how long after lifting the finger before we look at the drawing

type Step = 'trace' | 'copy'
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

export default function TraceGame({ source = 'lines', letterCase = 'both', level, mode, sound, profile, sprinklesOn, hintSec, onActive, onDone, position, onPosition }: {
  source?: 'lines' | 'letters'
  letterCase?: LetterCase
  level: number
  mode: TraceMode
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec: number
  onActive?: (active: boolean) => void
  onDone?: () => void
  /**
   * Where the letters-and-numbers order has got to, by `${case}${level}`: the one to show next time
   * the game opens. Used only at the low levels, where the letters come in order.
   */
  position?: Record<string, string>
  onPosition?: (key: string, ch: string) => void
}) {
  const { say, praise, chime, ding, buzz } = useFeedback(sound)
  const fx = useSprinkles()
  const [shape, setShape] = useState<Shape | null>(null)
  const [step, setStep] = useState<Step>('trace')
  const [strokeCount, setStrokeCount] = useState(0)
  const [misses, setMisses] = useState(0)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const live = useRef<{ strokes: Pt[][]; current: Pt[] | null; pointerId: number | null; frozen: boolean }>({ strokes: [], current: null, pointerId: null, frozen: false })
  // Follows the child along the shape while tracing, to tell a wander the moment it happens.
  const courseRef = useRef<ReturnType<typeof makeCourse> | null>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const chimeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastKind = useRef<string | undefined>(undefined)

  // The drawing code reads these, so it always sees the latest without being rebuilt.
  const shapeRef = useRef<Shape | null>(null)
  const stepRef = useRef<Step>('trace')
  const doneRef = useRef(false)
  const hintRef = useRef(false)
  const modeRef = useRef(mode)
  const inkRef = useRef(INK)
  shapeRef.current = shape
  stepRef.current = step
  doneRef.current = done
  modeRef.current = mode
  inkRef.current = profile.colour === 'mix' ? INK : sprinklePalette(profile.colour)[0]

  const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ── drawing ────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = c.clientWidth, h = c.clientHeight
    if (w === 0 || h === 0) return
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
    }
    // One scale for both directions, centred, so the picture is never squashed.
    const scale = Math.min(w / VIEW.w, h / VIEW.h)
    const ox = (w - VIEW.w * scale) / 2, oy = (h - VIEW.h * scale) / 2
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy)
    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, VIEW.w, VIEW.h)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const sh = shapeRef.current
    // Faint writing lines for letters: the top line, the small letters' line, and the baseline.
    if (sh?.rules) {
      ctx.setLineDash([])
      sh.rules.forEach((y, i) => {
        const base = i === sh.rules!.length - 1
        ctx.lineWidth = base ? 2.5 : 1.5
        ctx.strokeStyle = base ? '#B7C3DE' : '#D5DDEC'
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.w, y); ctx.stroke()
      })
    }
    // When only the start of a letter is asked for, the whole letter shows faintly behind it.
    if (sh?.full && !doneRef.current) {
      ctx.setLineDash([])
      ctx.lineWidth = 11
      ctx.strokeStyle = '#E3E7F2'
      for (const st of sh.full) {
        ctx.beginPath()
        st.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
        ctx.stroke()
      }
    }
    const showGuide = !!sh && !doneRef.current && (stepRef.current === 'trace' || hintRef.current)
    if (sh && showGuide) {
      // The dotted guide.
      ctx.setLineDash([1, 15])
      ctx.lineWidth = 9
      ctx.strokeStyle = GUIDE
      ctx.globalAlpha = stepRef.current === 'trace' ? 1 : 0.65
      for (const s of sh.strokes) {
        ctx.beginPath()
        s.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.setLineDash([])
      // Where each stroke starts, and which way it goes.
      sh.strokes.forEach((s, i) => {
        const a = s[0]
        const b = s[Math.min(s.length - 1, 6)]
        const len = dist(a, b) || 1
        ctx.fillStyle = START
        ctx.beginPath(); ctx.arc(a.x, a.y, 12, 0, Math.PI * 2); ctx.fill()
        // a small arrow just beyond the dot
        const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len
        const tx = a.x + ux * 30, ty = a.y + uy * 30
        ctx.fillStyle = START
        ctx.beginPath()
        ctx.moveTo(tx + ux * 9, ty + uy * 9)
        ctx.lineTo(tx - ux * 5 - uy * 8, ty - uy * 5 + ux * 8)
        ctx.lineTo(tx - ux * 5 + uy * 8, ty - uy * 5 - ux * 8)
        ctx.closePath(); ctx.fill()
        if (sh.strokes.length > 1) {
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 15px sans-serif'
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(String(i + 1), a.x, a.y + 1)
        }
      })
    }

    // The moving hint: a dot that shows the way along the next stroke. It is for a child who has not
    // started or is stuck, so it steps aside while a finger is drawing: it would only be in the way.
    if (sh && hintRef.current && !doneRef.current && !live.current.current) {
      const idx = Math.min(live.current.strokes.length, sh.strokes.length - 1)
      const s = sh.strokes[idx]
      const len = pathLength([s])
      const t = reducedMotion() ? 0 : (performance.now() % 2400) / 2400
      const p = pointAlong(s, t * len)
      ctx.fillStyle = HINT
      ctx.globalAlpha = 0.95
      ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = 1
    }

    // The child's own line.
    ctx.setLineDash([])
    ctx.lineWidth = 10
    ctx.strokeStyle = inkRef.current
    const all = live.current.current ? [...live.current.strokes, live.current.current] : live.current.strokes
    for (const s of all) {
      if (s.length === 0) continue
      ctx.beginPath()
      s.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      if (s.length === 1) ctx.lineTo(s[0].x + 0.1, s[0].y)
      ctx.stroke()
    }
  }, [])

  // ── rounds ─────────────────────────────────────────────────────────────────
  const clearInk = useCallback(() => {
    clearTimeout(idleTimer.current)
    clearTimeout(retryTimer.current)
    live.current = { strokes: [], current: null, pointerId: null, frozen: false }
    courseRef.current?.reset()
    setStrokeCount(0)
  }, [])

  // Letters and numbers always come in order (A to Z, 0 to 9), because that is how children know them.
  // `position` holds the one to show next; finishing a letter moves it on, skipping one does too, and
  // leaving one unfinished does not, so it is still there when the child comes back. The level changes only
  // how much of each letter is traced, so changing it does not lose the place.
  const positionRef = useRef(position ?? {})
  positionRef.current = position ?? positionRef.current
  const ordered = source === 'letters'
  const orderKey = letterCase
  const orderedRef = useRef({ ordered, orderKey })
  orderedRef.current = { ordered, orderKey }
  const portion = ordered ? portionFor(level) : 1

  const newRound = useCallback((skip = false) => {
    clearInk()
    let sh: Shape
    if (source === 'letters') {
      const seq = letterSequence(letterCase)
      const stored = positionRef.current[letterCase]
      // Skipping goes on from the one on screen; otherwise it is whatever was left for next.
      const ch = skip && lastKind.current && seq.includes(lastKind.current)
        ? nextInSequence(seq, lastKind.current)
        : stored && seq.includes(stored) ? stored : seq[0]
      sh = makeLetter(ch, portionFor(level))
      onPosition?.(letterCase, ch)
    } else {
      sh = pickShape(level, Math.random, lastKind.current)
    }
    lastKind.current = sh.kind
    // The line may follow the whole letter; only the part asked for has to be covered.
    courseRef.current = makeCourse(sh.full ?? sh.strokes, sh.tolerance)
    setShape(sh)
    setStep('trace')
    setDone(false)
    setMessage('')
    setNote('')
    setMisses(0)
    fx.clear()
    // Handy for testing in development only; never exposed in production.
    if (process.env.NODE_ENV !== 'production') (window as any).__trace = { shape: sh }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, source, letterCase, clearInk])

  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => { clearTimeout(idleTimer.current); clearTimeout(retryTimer.current); clearTimeout(chimeTimer.current) }, [])

  // Tell the page whether a round is under way, so switching games can ask to finish it first.
  useEffect(() => { onActive?.(!done && strokeCount > 0) }, [done, strokeCount, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  const stuck = useStuck(!!shape && !done, hintSec, misses, `${step}:${strokeCount}:${shape?.kind}`)
  hintRef.current = stuck

  // Redraw whenever what is shown changes, and keep the hint dot moving.
  useEffect(() => { draw() }, [draw, shape, step, strokeCount, stuck, done])
  useEffect(() => {
    if (!stuck || done || reducedMotion()) return
    let raf = 0
    // While a finger is drawing, the pointer handler redraws; doing it here too would only slow the
    // phone down at the moment it most needs to keep up with the finger.
    const tick = () => { if (!live.current.current) draw(); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stuck, done, draw])
  useEffect(() => {
    const c = canvasRef.current
    if (!c || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => draw())
    ro.observe(c)
    return () => ro.disconnect()
  }, [draw])
  // A phone turned sideways changes the canvas size without a resize observer firing on every browser.
  useEffect(() => {
    const on = () => requestAnimationFrame(draw)
    window.addEventListener('orientationchange', on)
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('orientationchange', on); window.removeEventListener('resize', on) }
  }, [draw])

  // ── judging ────────────────────────────────────────────────────────────────
  function evaluate() {
    const sh = shapeRef.current
    if (!sh || doneRef.current) return
    const drawn = live.current.strokes
    if (drawn.length === 0) return
    const v = stepRef.current === 'trace' ? scoreTrace(sh.full ?? sh.strokes, drawn, traceOptions(sh.tolerance), sh.strokes) : scoreCopy(sh.strokes, drawn)

    if (v.pass) {
      // (Drawing it yourself is for whole letters: where only the start is asked for, there is no second step.)
      if (modeRef.current === 'trace-copy' && stepRef.current === 'trace' && !sh.full) {
        ding()
        clearInk()
        setStep('copy')
        setNote('Now draw it by yourself.')
        say('Now draw it by yourself.')
        return
      }
      // In the ordered levels, the next time is the next letter.
      const o = orderedRef.current
      if (o.ordered && sh) onPosition?.(o.orderKey, nextInSequence(letterSequence(letterCase), sh.kind))
      const c = celebration(profile)
      setDone(true)
      onDone?.()
      setNote('')
      setMessage(c.shown)
      if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
      praise(c.spoken)
      clearTimeout(chimeTimer.current)
      chimeTimer.current = setTimeout(chime, 800)
      return
    }

    // Off the line, or a scribble, or the wrong size: let go of it gently and start fresh.
    // Anything else is simply unfinished, and the child may carry on.
    if (isOffCourse(v, stepRef.current)) {
      buzz() // the buzz and the "try again" message arrive together
      setNote('Let’s try again. Start at the green dot.')
      clearTimeout(retryTimer.current)
      retryTimer.current = setTimeout(() => {
        clearInk()
        setMisses(m => m + 1)
      }, 900)
    }
  }

  // The line has wandered off the shape and stayed off: tell the child now, while they are
  // still drawing, with the "try again" message and the buzz. What was drawn stays in view for
  // a moment, then the board clears for a fresh start.
  function strayed() {
    const l = live.current
    if (l.frozen) return
    l.frozen = true
    buzz()
    setNote('Let’s try again. Start at the green dot.')
    clearTimeout(idleTimer.current)
    clearTimeout(retryTimer.current)
    retryTimer.current = setTimeout(() => {
      clearInk()
      setMisses(m => m + 1)
    }, 900)
  }

  // ── pointer ────────────────────────────────────────────────────────────────
  function toPoint(e: { clientX: number; clientY: number }, el: HTMLCanvasElement): Pt {
    const r = el.getBoundingClientRect()
    const scale = Math.min(r.width / VIEW.w, r.height / VIEW.h)
    const ox = (r.width - VIEW.w * scale) / 2, oy = (r.height - VIEW.h * scale) / 2
    return { x: (e.clientX - r.left - ox) / scale, y: (e.clientY - r.top - oy) / scale }
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    if (done || !e.isPrimary || live.current.pointerId !== null) return // a second finger or a palm is ignored
    clearTimeout(idleTimer.current)
    clearTimeout(retryTimer.current)
    setNote('')
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
    live.current.pointerId = e.pointerId
    live.current.frozen = false
    const first = toPoint(e, e.currentTarget)
    live.current.current = [first]
    if (stepRef.current === 'trace') courseRef.current?.begin(first)
    draw()
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    const l = live.current
    if (l.pointerId !== e.pointerId || !l.current || l.frozen) return
    // A busy phone delivers one move event per frame, however far the finger went. The browser keeps
    // the points in between ("coalesced" events); using them keeps the line smooth and the checks
    // honest even when the screen is slow.
    const native = e.nativeEvent as PointerEvent
    const batch = native.getCoalescedEvents?.() ?? []
    for (const ev of batch.length ? batch : [native]) {
      const p = toPoint(ev, e.currentTarget)
      if (dist(p, l.current[l.current.length - 1]) < 2) continue
      l.current.push(p)
      if (stepRef.current === 'trace' && courseRef.current) {
        courseRef.current.add(p)
        if (courseRef.current.strayed) { strayed(); break }
      }
    }
    draw()
  }
  function up(e: React.PointerEvent<HTMLCanvasElement>) {
    const l = live.current
    if (l.pointerId !== e.pointerId) return
    const s = l.current
    l.pointerId = null
    l.current = null
    if (s && pathLength([s]) >= 6) { l.strokes = [...l.strokes, s]; setStrokeCount(l.strokes.length) } // a tap is not a stroke
    draw()
    if (l.frozen) return // already told it has strayed; the board is about to clear
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(evaluate, IDLE_MS)
  }

  // "line", "letter" or "number", for the wording around what is being traced.
  const noun = source === 'lines' ? 'line' : shape && /^[0-9]$/.test(shape.kind) ? 'number' : 'letter'

  const instruction = shape
    ? step === 'trace'
      ? `Trace ${shape.full ? `the ${portion <= 0.5 ? 'start' : 'first part'} of ` : ''}${shape.label}. Start at the green dot, and draw along the dotted line.${shape.strokes.length > 1 ? ' Follow the numbers.' : ''}`
      : `Now draw ${shape.label} by yourself, the way you just traced it.`
    : ''

  return (
    <div className="sp-card tr-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div className="sq-label">{step === 'trace' ? (shape?.full ? `Trace ${portion <= 0.5 ? 'the start of' : 'most of'} the ${noun}` : `Trace the ${noun}`) : 'Now draw it yourself'}</div>
        <InfoButton say={say} text={instruction} />
      </div>

      <div className="sp-pair tr-pair">
        <div className="sp-pic tr-ref" aria-hidden="true">
          {shape && (
            <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}>
              <rect width={VIEW.w} height={VIEW.h} fill={PAPER} />
              {(shape.rules ?? []).map((y, i, all) => (
                <line key={`r${i}`} x1="0" x2={VIEW.w} y1={y} y2={y} stroke={i === all.length - 1 ? '#B7C3DE' : '#D5DDEC'} strokeWidth={i === all.length - 1 ? 2.5 : 1.5} />
              ))}
              {shape.full && shape.full.map((s, i) => (
                <polyline key={`f${i}`} fill="none" stroke="#C7CEE4" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"
                  points={s.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} />
              ))}
              {shape.strokes.map((s, i) => (
                <polyline key={i} fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"
                  points={s.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} />
              ))}
            </svg>
          )}
        </div>
        <div className="sp-pic tr-board">
          <canvas ref={canvasRef} className="tr-canvas" role="img" aria-label="Drawing area"
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        </div>
      </div>

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message || note}</div>
      <span className="sq-sr" role="status" aria-live="polite">{shape ? `${instruction}${stuck ? ' Hint: follow the moving dot.' : ''}` : ''}</span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={() => newRound()}>{ordered ? 'Next one' : 'Another one'}</button>
          : <>
              <button className="sq-btn" onClick={() => { clearInk(); setNote(''); draw() }}>Start again</button>
              <button className="sq-btn" onClick={() => newRound(true)}>{ordered ? `Skip this ${noun}` : `Another ${noun}`}</button>
            </>}
      </div>
    </div>
  )
}
