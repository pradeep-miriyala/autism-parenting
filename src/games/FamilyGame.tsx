'use client'
// Family faces: the people a parent added, as photos with the names the child uses for them.
//   level 1  "Who is this?"   a photo, and names to choose from
//   level 2  "Where is Amma?" a name (or "Which one is your mother?"), and photos to choose from
//   level 3  the family map   drag or tap each photo to the place for what that person is: grandparents, parents, ...
// The photos and names stay on this device (family/store.ts). No timer, no score. A wrong choice buzzes and shakes;
// nothing is lost. If the child is stuck, the right one gently pulses.
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FAMILY_QUESTIONS, MIN_FAMILY, ROW_LABELS, ROW_ORDER, familyLevel, fits, makeFamilyMap, makeFamilyQuestions, relationLabel,
  type FamilyMap, type FamilyQuestion, type MapSlot, type Person,
} from './family/logic'
import { listPeople, type StoredPerson } from './family/store'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const SETTLE_MS = 1200
const REACH = 14

/** "That is Amma, your mother." */
function introduce(p: Person) {
  if (p.relation === 'me') return `That is you, ${p.name}.`
  if (p.relation === 'other') return `That is ${p.name}.`
  return `That is ${p.name}, your ${relationLabel(p.relation).toLowerCase()}.`
}

export default function FamilyGame({ level, sound, profile, sprinklesOn, hintSec, onActive, onDone }: {
  level: number
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec: number
  onActive?: (active: boolean) => void
  onDone?: () => void
}) {
  const { say, praise, chime, ding, buzz } = useFeedback(sound)
  const fx = useSprinkles()
  const lv = familyLevel(level)
  const [stored, setStored] = useState<StoredPerson[] | null>(null)
  const [urls, setUrls] = useState<Record<number, string>>({})
  const [questions, setQuestions] = useState<FamilyQuestion[]>([])
  const [map, setMap] = useState<FamilyMap | null>(null)
  const [qi, setQi] = useState(0)
  const [placed, setPlaced] = useState<Record<string, number>>({})   // slot key -> person
  const [selected, setSelected] = useState<number | null>(null)
  const [misses, setMisses] = useState(0)
  const [shake, setShake] = useState<{ n: number; at: string }>({ n: 0, at: '' })
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [settling, setSettling] = useState(false)
  const [drag, setDrag] = useState<{ id: number; x: number; y: number; over: string | null } | null>(null)
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const dragRef = useRef<{ id: number; sx: number; sy: number; moved: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // The people are read from this device once, when the game opens.
  useEffect(() => {
    let live = true
    let made: string[] = []
    listPeople().then(list => {
      if (!live) return
      const u: Record<number, string> = {}
      list.forEach(p => { const url = URL.createObjectURL(p.blob); u[p.slot] = url; made.push(url) })
      setUrls(u)
      setStored(list)
    })
    return () => { live = false; made.forEach(u => URL.revokeObjectURL(u)); made = [] }
  }, [])

  const people: Person[] = (stored ?? []).map(p => ({ id: p.slot, name: p.name, relation: p.relation }))
  const byId = new Map(people.map(p => [p.id, p]))
  const enough = people.length >= MIN_FAMILY

  const newRound = useCallback(() => {
    clearTimeout(timer.current)
    const list: Person[] = (stored ?? []).map(p => ({ id: p.slot, name: p.name, relation: p.relation }))
    if (list.length >= MIN_FAMILY) {
      if (lv === 3) { setMap(makeFamilyMap(list)); setQuestions([]) }
      else { setQuestions(makeFamilyQuestions(lv, list)); setMap(null) }
    }
    setQi(0)
    setPlaced({})
    setSelected(null)
    setMisses(0)
    setShake({ n: 0, at: '' })
    setDone(false)
    setMessage('')
    setSettling(false)
    setDrag(null)
    dragRef.current = null
    fx.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored, lv])
  useEffect(() => { if (stored) newRound() }, [stored, newRound])
  useEffect(() => () => clearTimeout(timer.current), [])

  const q: FamilyQuestion | undefined = !done && lv < 3 ? questions[qi] : undefined
  const placedCount = Object.keys(placed).length
  useEffect(() => { onActive?.(!done && (qi > 0 || placedCount > 0)) }, [done, qi, placedCount, onActive])
  useEffect(() => () => onActive?.(false), [onActive])
  // each new question is read out
  useEffect(() => { if (q && !settling) say(q.ask === 'photo' ? 'Who is this?' : q.prompt) }, [qi, q?.prompt]) // eslint-disable-line react-hooks/exhaustive-deps

  const loose = map ? map.people.filter(id => !Object.values(placed).includes(id)) : []
  const stuck = useStuck(enough && !done && !settling, hintSec, misses, `${qi}:${placedCount}:${shake.n}:${selected}`)
  const hintOption = q && stuck && !settling ? q.answer : null
  const hintPerson = map && stuck && !done ? (selected ?? loose[0] ?? null) : null
  const hintSlot = hintPerson !== null && map
    ? map.slots.find(s => !placed[s.key] && fits(byId.get(hintPerson)!, s))?.key ?? null
    : null

  function finish() {
    const c = celebration(profile)
    timer.current = setTimeout(() => {
      setDone(true)
      onDone?.()
      setMessage(c.shown)
      if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
      praise(c.spoken, true)
      timer.current = setTimeout(chime, 800)
    }, SETTLE_MS)
  }

  function choose(id: number) {
    if (!q || settling) return
    if (id !== q.answer) {
      buzz()
      setShake(s => ({ n: s.n + 1, at: String(id) }))
      setMisses(m => m + 1)
      return
    }
    ding()
    setMisses(0)
    setSettling(true)
    const sentence = introduce(byId.get(id)!)
    setMessage(sentence)
    say(sentence)
    if (qi + 1 < questions.length) {
      timer.current = setTimeout(() => { setQi(i => i + 1); setSettling(false); setMessage('') }, SETTLE_MS + 400)
      return
    }
    finish()
  }

  // ── The map ──
  function put(id: number, slot: MapSlot) {
    if (done || placed[slot.key] !== undefined) return
    const p = byId.get(id)!
    if (!fits(p, slot)) {
      buzz()
      setShake(s => ({ n: s.n + 1, at: slot.key }))
      setMisses(m => m + 1)
      return
    }
    ding()
    setMisses(0)
    setSelected(null)
    const next = { ...placed, [slot.key]: id }
    setPlaced(next)
    setMessage(introduce(p))
    say(introduce(p))
    if (map && Object.keys(next).length === map.slots.length) finish()
  }

  function slotAt(x: number, y: number): MapSlot | null {
    if (!map) return null
    let best: MapSlot | null = null, bestD = Infinity
    for (const s of map.slots) {
      const el = slotRefs.current[s.key]
      if (!el || placed[s.key] !== undefined) continue
      const r = el.getBoundingClientRect()
      if (x < r.left - REACH || x > r.right + REACH || y < r.top - REACH || y > r.bottom + REACH) continue
      const d = Math.hypot(x - (r.left + r.right) / 2, y - (r.top + r.bottom) / 2)
      if (d < bestD) { best = s; bestD = d }
    }
    return best
  }
  function down(e: React.PointerEvent<HTMLDivElement>, id: number) {
    if (done || e.button > 0) return
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, moved: false }
    setDrag({ id, x: 0, y: 0, over: null })
  }
  function move(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (!d) return
    const x = e.clientX - d.sx, y = e.clientY - d.sy
    d.moved = d.moved || Math.hypot(x, y) > 6
    setDrag({ id: d.id, x, y, over: d.moved ? slotAt(e.clientX, e.clientY)?.key ?? null : null })
  }
  function up(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (!d) return
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
    if (!d.moved) { setSelected(s => (s === d.id ? null : d.id)); return }   // a tap chooses the photo
    const s = slotAt(e.clientX, e.clientY)
    if (s) put(d.id, s)                                                       // let go elsewhere: it slides back
  }

  const title = lv === 1 ? 'Who is this?' : lv === 2 ? 'Find the person' : 'Family map'
  const total = lv === 3 ? map?.slots.length ?? 0 : FAMILY_QUESTIONS

  if (stored === null) return null
  if (!enough) {
    return (
      <div className="th-card">
        <div className="fm-empty">
          <div className="fm-empty-ico" aria-hidden="true">👨‍👩‍👧</div>
          <p><strong>Family Faces uses your family’s own photos.</strong></p>
          <p>Ask a grown-up to add at least two people, with a photo and the name you use for each.</p>
          <p><Link href="/parents/family" className="sq-btn primary">Add family pictures</Link></p>
        </div>
      </div>
    )
  }

  return (
    <div className="th-card">
      <SprinklesLayer sprinkles={fx.sprinkles} />
      <div className="sq-top">
        <div>
          <div className="sq-label">{title}</div>
          <div className="sp-dots" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => <span key={i} className={(lv === 3 ? i < placedCount : i < qi) || done ? 'on' : ''} />)}
          </div>
        </div>
        <InfoButton say={say} text={lv === 1 ? 'Look at the photo, then tap the name of the person.' : lv === 2 ? 'Read the question, then tap the right photo.' : 'Put each photo in the right place on the family map. Drag it there, or tap the photo and then the place.'} />
      </div>

      {lv === 1 && q && (
        <>
          <div className="fm-photo"><img src={urls[q.answer]} alt="" /></div>
          <div className="fm-names" role="group" aria-label="Who is this?">
            {q.options.map(id => (
              <button key={`${qi}-${id}-${shake.at === String(id) ? shake.n : 0}`} type="button"
                className={`fm-name${hintOption === id ? ' hint' : ''}${shake.n > 0 && shake.at === String(id) ? ' shake' : ''}${settling && id === q.answer ? ' right' : ''}`}
                disabled={settling && id !== q.answer} onClick={() => choose(id)}>{byId.get(id)!.name}</button>
            ))}
          </div>
        </>
      )}

      {lv === 2 && q && (
        <>
          <p className="cs-prompt">{q.prompt}</p>
          <div className="fm-pics" role="group" aria-label={q.prompt}>
            {q.options.map((id, i) => (
              <button key={`${qi}-${id}-${shake.at === String(id) ? shake.n : 0}`} type="button" aria-label={`Photo ${i + 1}`}
                className={`fm-pic${hintOption === id ? ' hint' : ''}${shake.n > 0 && shake.at === String(id) ? ' shake' : ''}${settling && id === q.answer ? ' right' : ''}`}
                disabled={settling && id !== q.answer} onClick={() => choose(id)}>
                <img src={urls[id]} alt="" />
              </button>
            ))}
          </div>
        </>
      )}

      {lv === 3 && map && (
        <>
          <div className="fm-map" role="group" aria-label={`Family map, ${placedCount} of ${map.slots.length} in place`}>
            {ROW_ORDER.map(row => {
              const slots = map.slots.filter(s => s.row === row)
              if (!slots.length) return null
              return (
                <div key={row} className="fm-maprow">
                  <div className="fm-rowname">{ROW_LABELS[row]}</div>
                  <div className="fm-row">
                    {slots.map(s => {
                      const who = placed[s.key]
                      return (
                        <div key={`${s.key}-${shake.at === s.key ? shake.n : 0}`} ref={el => { slotRefs.current[s.key] = el }} role="button"
                          aria-label={who !== undefined ? `${s.label}: ${byId.get(who)!.name}` : `${s.label}, empty`}
                          className={`fm-slot${who !== undefined ? ' filled' : ''}${drag?.over === s.key ? ' over' : ''}${hintSlot === s.key ? ' hint' : ''}${shake.n > 0 && shake.at === s.key ? ' shake' : ''}`}
                          onClick={() => { if (selected !== null && who === undefined) put(selected, s) }}>
                          {who !== undefined ? <img src={urls[who]} alt="" /> : <span className="fm-slot-hole" aria-hidden="true">?</span>}
                          <span className="fm-slot-label">{who !== undefined ? byId.get(who)!.name : s.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="fm-tray" aria-label="Photos to place">
            {loose.map(id => (
              <div key={id} role="button" aria-label={`Photo of a family member${selected === id ? ', chosen' : ''}`} aria-pressed={selected === id}
                className={`fm-card${selected === id ? ' sel' : ''}${drag?.id === id ? ' dragging' : ''}${hintPerson === id ? ' hint' : ''}`}
                style={drag?.id === id ? { transform: `translate(${drag.x}px, ${drag.y}px)` } : undefined}
                onPointerDown={e => down(e, id)} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { dragRef.current = null; setDrag(null) }}>
                <img src={urls[id]} alt="" draggable={false} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
      <span className="sq-sr" role="status" aria-live="polite">{lv === 3 ? `${placedCount} of ${map?.slots.length ?? 0} in place.` : q ? `Question ${qi + 1} of ${questions.length}. ${q.prompt}` : ''}</span>

      <div className="sq-actions" style={{ marginTop: '.5rem', marginBottom: 0 }}>
        {done
          ? <button className="sq-btn primary" onClick={newRound}>Another round</button>
          : <button className="sq-btn" onClick={newRound}>Other questions</button>}
      </div>
    </div>
  )
}
