'use client'
// Family faces: the people a parent added, as photos with the names the child uses for them.
//   level 1  "Who is this?"   a photo, and pictures of who it might be (mother, father, grandfather ...)
//   level 2  "Where is Amma?" a picture and a name, and photos to choose from
//   level 3  the family map   drag or tap each photo to the place for what that person is: grandparents, parents, ...
// Everything a child needs to understand is a picture, not a word: each relation has its own icon. A word is only ever
// heard when the child presses a speaker button, and then only that word is said (even with the sound setting off).
// The photos and names stay on this device (family/store.ts). No timer, no score. A wrong choice buzzes and shakes;
// nothing is lost. If the child is stuck, the right one gently pulses.
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FAMILY_QUESTIONS, MIN_FAMILY, ROW_ICONS, ROW_LABELS, ROW_ORDER, familyLevel, fits, makeFamilyMap, makeFamilyQuestions, relationIcon, relationLabel,
  type FamilyMap, type FamilyQuestion, type MapSlot, type Person,
} from './family/logic'
import { listPeople, type StoredPerson } from './family/store'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import { SpeakerIcon } from './icons'
import InfoButton from './InfoButton'
import { celebration, isYoung, sprinklePalette, type Profile } from './profile'

const SETTLE_MS = 1200
const REACH = 14

/** A speaker button: says just this one word, whether or not the sound setting is on, and does nothing else. */
function Speak({ word, say, big }: { word: string; say: (text: string, force?: boolean) => void; big?: boolean }) {
  return (
    <button type="button" className={`fm-say${big ? ' big' : ''}`} aria-label={`Hear the word: ${word}`}
      onClick={e => { e.stopPropagation(); say(word, true) }}
      onPointerDown={e => e.stopPropagation()}>
      <SpeakerIcon />
    </button>
  )
}

/** What shows when the right one is chosen: the picture and the name, no sentence. */
const found = (p: Person) => `${relationIcon(p.relation)} ${p.name}`

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
    const who = byId.get(id)!
    setMessage(found(who))
    say(who.name)
    if (qi + 1 < questions.length) {
      // the next question starts clean: nothing left shaking from the last one
      timer.current = setTimeout(() => { setQi(i => i + 1); setSettling(false); setMessage(''); setShake({ n: 0, at: '' }) }, SETTLE_MS + 400)
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
    setMessage(found(p))
    say(p.name)
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
        <InfoButton say={say} text={lv === 1 ? 'Look at the photo. Tap the picture of who it is. Tap a speaker to hear that word.' : lv === 2 ? 'Tap the speaker to hear the word. Then tap the photo of that person.' : 'Put each photo in the right place on the family map. Drag it there, or tap the photo and then the place. Tap a speaker to hear that word.'} />
      </div>

      {lv === 1 && q && (
        <>
          <div className="fm-photo"><img src={urls[q.answer]} alt="" /></div>
          <div className="fm-opts" role="group" aria-label="Who is this?">
            {q.options.map(id => {
              const p = byId.get(id)!
              return (
                <div key={`${qi}-${id}-${shake.at === String(id) ? shake.n : 0}`} className="fm-opt">
                  <button type="button" aria-label={`${p.name}, ${relationLabel(p.relation)}`}
                    className={`fm-opt-main${hintOption === id ? ' hint' : ''}${shake.n > 0 && shake.at === String(id) ? ' shake' : ''}${settling && id === q.answer ? ' right' : ''}`}
                    disabled={settling && id !== q.answer} onClick={() => choose(id)}>
                    <span className="fm-icon" aria-hidden="true">{relationIcon(p.relation)}</span>
                    <span className="fm-word">{p.name}</span>
                  </button>
                  <Speak word={p.name} say={say} />
                </div>
              )
            })}
          </div>
        </>
      )}

      {lv === 2 && q && (() => {
        const target = byId.get(q.answer)!
        const word = q.ask === 'relation' ? relationLabel(target.relation) : target.name
        return (
          <>
            <div className="fm-ask" role="group" aria-label={q.prompt}>
              <Speak word={word} say={say} big />
              <span className="fm-icon big" aria-hidden="true">{relationIcon(target.relation)}</span>
              <span className="fm-askword">{word}</span>
            </div>
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
        )
      })()}

      {lv === 3 && map && (
        <>
          <div className="fm-map" role="group" aria-label={`Family map, ${placedCount} of ${map.slots.length} in place`}>
            {ROW_ORDER.map(row => {
              const slots = map.slots.filter(s => s.row === row)
              if (!slots.length) return null
              return (
                <div key={row} className="fm-maprow">
                  <div className="fm-rowname" role="img" aria-label={ROW_LABELS[row]}>{ROW_ICONS[row]}</div>
                  <div className="fm-row">
                    {slots.map(s => {
                      const who = placed[s.key]
                      return (
                        <div key={`${s.key}-${shake.at === s.key ? shake.n : 0}`} className="fm-slotwrap">
                          <div ref={el => { slotRefs.current[s.key] = el }} role="button"
                            aria-label={who !== undefined ? `${s.label}: ${byId.get(who)!.name}` : `${s.label}, empty`}
                            className={`fm-slot${who !== undefined ? ' filled' : ''}${drag?.over === s.key ? ' over' : ''}${hintSlot === s.key ? ' hint' : ''}${shake.n > 0 && shake.at === s.key ? ' shake' : ''}`}
                            onClick={() => { if (selected !== null && who === undefined) put(selected, s) }}>
                            {who !== undefined
                              ? <><img src={urls[who]} alt="" /><span className="fm-slot-label">{byId.get(who)!.name}</span></>
                              : <span className="fm-slot-hole" aria-hidden="true"><span className="fm-icon">{relationIcon(s.relation)}</span></span>}
                          </div>
                          <Speak word={who !== undefined ? byId.get(who)!.name : s.label} say={say} />
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
