'use client'
// "Family pictures": a parent adds the people their child knows, each with a photo, the name the child uses for them
// ("Amma", "Uncle Ravi"), what they are to the child and, if they like, a recording of themselves saying the name (the
// computer voice may say a family name oddly). Family Faces plays with them. The photo is made ready on this device
// (cropped square, shrunk, hidden details such as where it was taken dropped) and everything is kept in this browser
// only (family/store.ts), never sent anywhere. The microphone is asked for only when Record is pressed.
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_PEOPLE, deletePerson, freePlace, listPeople, savePerson, type StoredPerson } from './family/store'
import { MIN_FAMILY, NAME_VOICE_MIN_MS, NAME_VOICE_SECONDS, RELATIONS, cleanPersonName, cleanRelation, relationIcon, sameName, MAX_NAME } from './family/logic'
import { preparePhoto } from './pictures/prepare'
import { CloseIcon, PlayIcon, RecordIcon, RedoIcon, StopIcon } from './icons'
import { useRecorder } from './voice/useRecorder'
import { playBlob } from './voice/player'

type Voice = { blob: Blob; ms: number }
const seconds = (ms: number) => `${Math.max(1, Math.round(ms / 1000))} s`

/** Record, listen to, redo or remove the parent saying a name. The new recording is handed to `onChange` as soon as it stops. */
function NameVoice({ name, voice, disabled, onChange }: { name: string; voice: Voice | null; disabled?: boolean; onChange: (v: Voice | null) => void }) {
  const rec = useRecorder(NAME_VOICE_SECONDS, NAME_VOICE_MIN_MS)
  async function record() {
    const r = await rec.record()
    if (r) onChange({ blob: r.blob, ms: r.ms })
  }
  return (
    <div className="fa-voice">
      <span className="sq-note fa-label">Their name in your voice (optional)</span>
      {rec.active ? (
        <div className="fa-voice-row">
          <span className="sq-note" role="status">Recording… {Math.min(NAME_VOICE_SECONDS, Math.floor(rec.elapsed / 1000))} of {NAME_VOICE_SECONDS} s</span>
          <button type="button" className="sq-ib primary" title="Stop" aria-label="Stop" onClick={rec.stop}><StopIcon /></button>
        </div>
      ) : voice ? (
        <div className="fa-voice-row">
          <span className="sq-note">Recorded, {seconds(voice.ms)}</span>
          <button type="button" className="sq-ib" title="Listen" aria-label="Listen" disabled={disabled} onClick={() => playBlob(voice.blob)}><PlayIcon /></button>
          <button type="button" className="sq-ib" title="Record again" aria-label="Record again" disabled={disabled} onClick={record}><RedoIcon /></button>
          <button type="button" className="sq-ib" title="Remove" aria-label="Remove" disabled={disabled} onClick={() => onChange(null)}><CloseIcon /></button>
        </div>
      ) : (
        <div className="fa-voice-row">
          <span className="sq-note">Not recorded. The computer voice will say it.</span>
          <button type="button" className="sq-ib rec" title="Record" aria-label="Record" disabled={disabled} onClick={record}><RecordIcon /></button>
        </div>
      )}
      {rec.error && <p className="sq-note vc-error" role="alert">{rec.error}</p>}
      <p className="sq-note fa-voice-help">Say it the way you do with your child{name.trim() ? `, for example “${name.trim()}”` : ''}. Up to {NAME_VOICE_SECONDS} seconds. It stays on this device.</p>
    </div>
  )
}

function PersonRow({ person, url, others, busy, onSave, onDelete }: {
  person: StoredPerson
  url: string
  others: StoredPerson[]
  busy: boolean
  onSave: (p: StoredPerson, note?: string) => Promise<void>
  onDelete: (slot: number) => void
}) {
  const [name, setName] = useState(person.name)
  const [problem, setProblem] = useState('')
  const [sure, setSure] = useState(false)
  useEffect(() => setName(person.name), [person.name])

  async function saveName() {
    const clean = cleanPersonName(name)
    if (clean === person.name) { setName(clean); setProblem(''); return }
    if (!clean) { setName(person.name); setProblem('A person needs a name.'); return }
    if (others.some(o => sameName(o.name, clean))) { setName(person.name); setProblem(`There is already someone called ${clean}.`); return }
    setProblem('')
    await onSave({ ...person, name: clean })
  }

  return (
    <li className="fa-person">
      {url ? <img src={url} alt={`Photo of ${person.name}`} /> : <div className="pc-blank" />}
      <div className="fa-fields">
        <label className="sq-note fa-label" htmlFor={`fa-n-${person.slot}`}>What your child calls them</label>
        <input id={`fa-n-${person.slot}`} className="fb-line" value={name} maxLength={MAX_NAME} disabled={busy}
          onChange={e => setName(e.target.value)} onBlur={saveName} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
        <label className="sq-note fa-label" htmlFor={`fa-r-${person.slot}`}>They are the child’s</label>
        <select id={`fa-r-${person.slot}`} className="fb-line" value={person.relation} disabled={busy}
          onChange={e => onSave({ ...person, relation: cleanRelation(e.target.value) })}>
          {RELATIONS.map(r => <option key={r.id} value={r.id}>{relationIcon(r.id)}  {r.label}</option>)}
        </select>
        <NameVoice name={person.name} disabled={busy}
          voice={person.voice ? { blob: person.voice, ms: person.voiceMs ?? 0 } : null}
          onChange={v => onSave({ ...person, voice: v?.blob, voiceMs: v?.ms })} />
        {problem && <p className="sq-note vc-error" role="alert">{problem}</p>}
        <button type="button" className="sq-btn" disabled={busy} onClick={() => { if (!sure) setSure(true); else onDelete(person.slot) }}>
          {sure ? 'Tap again to delete' : 'Delete'}
        </button>
      </div>
    </li>
  )
}

export default function FamilyForm() {
  const [people, setPeople] = useState<StoredPerson[]>([])
  const [urls, setUrls] = useState<Record<number, string>>({})
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('mother')
  const [voice, setVoice] = useState<Voice | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => { const list = await listPeople(); setPeople(list); return list }, [])
  useEffect(() => { refresh() }, [refresh])

  // Small photos, from temporary addresses that are let go of when the list changes or the page closes.
  useEffect(() => {
    const made = Object.fromEntries(people.map(p => [p.slot, URL.createObjectURL(p.blob)]))
    setUrls(made)
    return () => Object.values(made).forEach(u => URL.revokeObjectURL(u))
  }, [people])
  useEffect(() => {
    if (!file) { setPreview(''); return }
    const u = URL.createObjectURL(file)
    setPreview(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setNote('')
    const clean = cleanPersonName(name)
    if (!file) return setError('Choose a photo first.')
    if (!clean) return setError('Type what your child calls them, such as Amma.')
    if (people.some(p => sameName(p.name, clean))) return setError(`There is already someone called ${clean}. Please use a different name, such as “Uncle Ravi”.`)
    const slot = freePlace(people)
    if (slot === null) return setError(`You can add ${MAX_PEOPLE} people. Delete one to add another.`)
    setBusy(true)
    const blob = await preparePhoto(file, 'square')
    if (!blob) { setBusy(false); return setError('That file could not be read as a picture. Please try another photo.') }
    const ok = await savePerson({ slot, name: clean, relation: cleanRelation(relation), blob, at: Date.now(), ...(voice ? { voice: voice.blob, voiceMs: voice.ms } : {}) })
    setBusy(false)
    if (!ok) return setError('Could not save on this device. A private window does not keep photos.')
    setFile(null); setName(''); setVoice(null)
    await refresh()
    setNote(`Added ${clean}.`)
  }

  async function save(p: StoredPerson) {
    setBusy(true); setError(''); setNote('')
    const ok = await savePerson(p)
    setBusy(false)
    if (!ok) setError('Could not save on this device.')
    await refresh()
  }
  async function remove(slot: number) {
    setBusy(true); setNote('')
    await deletePerson(slot)
    setBusy(false)
    await refresh()
  }

  const full = people.length >= MAX_PEOPLE
  const enough = people.length >= MIN_FAMILY

  return (
    <section aria-labelledby="sq-family-title">
      <h3 id="sq-family-title" className="sq-subhead">Family pictures</h3>
      <p className="sq-note">
        Add the people your child knows: family, friends and others. Each one has a photo, the name your child uses for
        them (such as Amma or Uncle Ravi) and what they are to your child. You can also record yourself saying the name, so
        your child hears it the way you say it. The game Family Faces uses them to ask “Who is this?” and “Where is
        Amma?”, and to build a family map.
      </p>
      <p className="sq-note">
        Photos, names and recordings stay on this phone or computer. They are never uploaded. Each photo is cropped square,
        and anything hidden in the file, such as where it was taken, is dropped. The microphone is used only while you
        press Record.
      </p>

      <h3 className="sq-subhead">Add a person</h3>
      <form onSubmit={add} noValidate className="fa-add">
        <div className="fa-photo">
          {preview ? <img src={preview} alt="The photo you chose" /> : <span className="fa-photo-ph" aria-hidden="true">📷</span>}
        </div>
        <input ref={input} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0] ?? null; e.target.value = ''; setFile(f); setError('') }} />
        <p className="ls-links"><button type="button" className="sq-btn" disabled={busy || full} onClick={() => input.current?.click()}>{file ? 'Choose another photo' : 'Choose a photo'}</button></p>

        <label className="sq-note fa-label" htmlFor="fa-name">What does your child call them?</label>
        <input id="fa-name" className="fb-line" value={name} maxLength={MAX_NAME} placeholder="Amma" disabled={busy || full} onChange={e => setName(e.target.value)} />
        <label className="sq-note fa-label" htmlFor="fa-relation">They are your child’s</label>
        <select id="fa-relation" className="fb-line" value={relation} disabled={busy || full} onChange={e => setRelation(e.target.value)}>
          {RELATIONS.map(r => <option key={r.id} value={r.id}>{relationIcon(r.id)}  {r.label}</option>)}
        </select>

        <NameVoice name={name} voice={voice} disabled={busy || full} onChange={setVoice} />

        {error && <p className="sq-note vc-error" role="alert">{error}</p>}
        {note && <p className="sq-note" role="status">{note}</p>}
        <p className="ls-links"><button type="submit" className="sq-btn primary" disabled={busy || full}>{busy ? 'Saving…' : 'Add'}</button></p>
      </form>

      <h3 className="sq-subhead">Your people ({people.length} of {MAX_PEOPLE})</h3>
      {!people.length && <p className="sq-note">No one added yet.</p>}
      {people.length === 1 && <p className="sq-note">Add at least one more person to play Family Faces.</p>}
      {people.length > 0 && (
        <ul className="fa-list">
          {people.map(p => (
            <PersonRow key={p.slot} person={p} url={urls[p.slot]} others={people.filter(o => o.slot !== p.slot)} busy={busy} onSave={save} onDelete={remove} />
          ))}
        </ul>
      )}
      {enough && <p className="ls-links"><Link href="/games/family" className="sq-btn">Try Family Faces</Link></p>}
      <p className="sq-note">
        On an iPhone, add this page to the home screen to keep these safe: Safari can clear a website’s saved data after
        about a week without a visit.
      </p>
    </section>
  )
}
