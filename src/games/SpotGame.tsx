'use client'
// Spot the Differences: two pictures, find what is different. Tap it in either one.
// No timer, no score. A wrong tap buzzes and shakes that picture, exactly as in the
// other games, and nothing already found is lost. If the child is stuck, a gentle
// ring pulses on one that is left.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ART } from './spot/art'
import {
  COLOURS, VIEW, classifyTap, makePair, nextUnfound, type Pair, type Scene, type ThemeId,
} from './spot/generate'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five']
const ACCENT = '#2E3A6B'
const HINT = '#D79A1B'

function Picture({ scene, found, diffs, hintId, label, onTap }: {
  scene: Scene
  found: number[]
  diffs: Pair['diffs']
  hintId: number | null
  label: string
  onTap: (x: number, y: number) => void
}) {
  const ref = useRef<SVGSVGElement>(null)

  function click(e: React.MouseEvent<SVGSVGElement>) {
    const svg = ref.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return
    // Through the screen matrix, so it is right however the picture is scaled or letterboxed.
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(ctm.inverse())
    onTap(p.x, p.y)
  }

  return (
    <svg ref={ref} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label={label} onClick={click}>
      <rect width={VIEW.w} height={VIEW.h} fill={scene.bg} />
      {scene.objs.map(o => {
        const Art = ART[o.kind]
        return (
          <g key={o.id} transform={`translate(${o.x - 40 * o.scale} ${o.y - 40 * o.scale}) scale(${o.scale})`}>
            <Art c={COLOURS[o.colour]} />
          </g>
        )
      })}
      {diffs.filter(d => found.includes(d.id)).map(d => (
        <g key={d.id} fill="none">
          <circle cx={d.x} cy={d.y} r={d.r + 4} stroke="#fff" strokeWidth="8" />
          <circle cx={d.x} cy={d.y} r={d.r + 4} stroke={ACCENT} strokeWidth="4" />
        </g>
      ))}
      {diffs.filter(d => d.id === hintId).map(d => (
        <circle key={`h${d.id}`} className="sp-hint" cx={d.x} cy={d.y} r={d.r + 4} fill="none" stroke={HINT} strokeWidth="5" strokeDasharray="10 8" />
      ))}
    </svg>
  )
}

export default function SpotGame({ theme, count, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
  theme: ThemeId
  count: number
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec: number
  onActive?: (active: boolean) => void
  onDone?: () => void
}) {
  const { say, praise, chime, ding, buzz } = useFeedback(sound)
  const fx = useSprinkles()
  const [pair, setPair] = useState<Pair | null>(null)
  const [found, setFound] = useState<number[]>([])
  const [shake, setShake] = useState<{ side: 'a' | 'b' | null; n: number }>({ side: null, n: 0 })
  const [misses, setMisses] = useState(0)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const chimeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const newRound = useCallback(() => {
    const p = makePair(theme, count)
    setPair(p)
    setFound([])
    setMisses(0)
    setShake({ side: null, n: 0 })
    setDone(false)
    setMessage('')
    fx.clear()
    // Handy for testing in development only; the answers are never exposed in production.
    if (process.env.NODE_ENV !== 'production') (window as any).__spot = p
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, count])

  useEffect(() => { newRound() }, [newRound])
  useEffect(() => () => clearTimeout(chimeTimer.current), [])

  // Tell the page whether a round is under way, so switching games can ask to finish it first.
  useEffect(() => { onActive?.(!done && found.length > 0) }, [done, found.length, onActive])
  useEffect(() => () => onActive?.(false), [onActive])

  const stuck = useStuck(!!pair && !done, hintSec, misses, `${found.length}:${shake.n}`)
  const hintId = pair && stuck && !done ? nextUnfound(pair.diffs, new Set(found))?.id ?? null : null

  const instruction = count === 1
    ? 'Find one thing that is different.'
    : `Find ${WORDS[count]} things that are different.`

  function tap(side: 'a' | 'b', x: number, y: number) {
    if (!pair || done) return
    const r = classifyTap(pair.diffs, new Set(found), x, y)
    if (r.type === 'again') return
    if (r.type === 'miss') {
      buzz()
      setShake(s => ({ side, n: s.n + 1 }))
      setMisses(m => m + 1)
      return
    }
    const next = [...found, r.diff.id]
    setFound(next)
    setMisses(0)
    ding() // every difference found gets the sparkle, with sound on or off
    if (next.length < pair.diffs.length) return

    const c = celebration(profile)
    setDone(true)
    onDone?.()
    setMessage(c.shown)
    if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
    praise(c.spoken)
    clearTimeout(chimeTimer.current)
    chimeTimer.current = setTimeout(chime, 800)
  }

  const labels = { a: 'First picture', b: 'Second picture' } as const

  return (
    <div className="sp-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">{count === 1 ? 'Find 1 difference' : `Find ${count} differences`}</div>
          <div className="sp-dots" aria-hidden="true">
            {(pair?.diffs ?? Array.from({ length: count }, (_, i) => ({ id: i + 1 }))).map(d => (
              <span key={d.id} className={found.includes(d.id) ? 'on' : ''} />
            ))}
          </div>
        </div>
        <InfoButton say={say} text={`${instruction} Tap each one, in either picture.`} />
      </div>

      {pair && (
        <div className="sp-pair">
          {(['a', 'b'] as const).map(side => (
            <div key={`${side}-${shake.side === side ? shake.n : 0}`}
              className={`sp-pic${shake.side === side && shake.n > 0 ? ' shake' : ''}`} style={{ background: pair.a.bg }}>
              <Picture scene={pair[side]} found={found} diffs={pair.diffs} hintId={hintId}
                label={labels[side]} onTap={(x, y) => tap(side, x, y)} />
            </div>
          ))}
        </div>
      )}

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">
        {pair ? `${found.length} of ${pair.diffs.length} found${hintId ? '. Hint: try the highlighted spot.' : ''}` : ''}
      </span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another one</button>
          : <button className="sq-btn" onClick={newRound}>Another picture</button>}
      </div>
    </div>
  )
}
