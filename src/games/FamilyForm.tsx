'use client'
// "Family pictures": a parent adds the people their child knows, each with a photo, the name the child uses for them
// ("Amma", "Uncle Ravi"), what they are to the child and, if they like, a recording of themselves saying the name (the
// computer voice may say a family name oddly). Family Faces plays with them. The photo is made ready on this device
// (cropped square, shrunk, hidden details such as where it was taken dropped) and everything is kept in this browser
// only (family/store.ts), never sent anywhere. The microphone is asked for only when Record is pressed.
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_PEOPLE, deletePerson, freePlace, listPeople, savePerson, type StoredPerson } from './family/store'
import { MIN_FAMILY, relationLabel, NAME_VOICE_MIN_MS, NAME_VOICE_SECONDS, RELATIONS, cleanPersonName, cleanRelation, relationIcon, sameName, MAX_NAME } from './family/logic'
import { preparePhoto } from './pictures/prepare'
import { CameraIcon, CheckIcon, CloseIcon, LockIcon, MicIcon, PencilIcon, PlayIcon, RecordIcon, RedoIcon, StopIcon, TrashIcon } from './icons'
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

/** What the person is to the child, chosen from pictures with names. */
function RelationPicker({ id, value, disabled, onChange }: { id: string; value: string; disabled?: boolean; onChange: (r: string) => void }) {
  return (
    <div className="fa-chips" role="radiogroup" aria-labelledby={id}>
      {RELATIONS.map(r => (
        <button key={r.id} type="button" role="radio" aria-checked={value === r.id} disabled={disabled}
          className={`fa-chip${value === r.id ? ' on' : ''}`} onClick={() => onChange(r.id)}>
          <span aria-hidden="true">{relationIcon(r.id)}</span>{r.label}
        </button>
      ))}
    </div>
  )
}

function PersonCard({ person, url, others, busy, onSave, onDelete }: {
  person: StoredPerson
  url: string
  others: StoredPerson[]
  busy: boolean
  onSave: (p: StoredPerson, note?: string) => Promise<void>
  onDelete: (slot: number) => void
}) {
  const [open, setOpen] = useState(false)
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
  function close() { setOpen(false); setSure(false); setProblem('') }

  return (
    <li className={`fa-card${open ? ' open' : ''}`}>
      <div className="fa-card-top">
        <div className="fa-card-photo">
          {url ? <img src={url} alt={`Photo of ${person.name}`} /> : <div className="pc-blank" />}
          {person.voice && <span className="fa-badge" title="Name recorded" aria-label="Name recorded"><MicIcon /></span>}
        </div>
        <div className="fa-card-text">
          <strong className="fa-card-name">{person.name}</strong>
          <span className="fa-card-rel"><span aria-hidden="true">{relationIcon(person.relation)}</span> {relationLabel(person.relation)}</span>
        </div>
        <button type="button" className="sq-ib fa-edit" title={open ? 'Done' : `Edit ${person.name}`} aria-label={open ? 'Done' : `Edit ${person.name}`}
          aria-expanded={open} onClick={() => (open ? close() : setOpen(true))}>
          {open ? <CheckIcon /> : <PencilIcon />}
        </button>
      </div>
      {open && (
        <div className="fa-fields">
          <label className="sq-note fa-label" htmlFor={`fa-n-${person.slot}`}>What your child calls them</label>
          <input id={`fa-n-${person.slot}`} className="fb-line" value={name} maxLength={MAX_NAME} disabled={busy}
            onChange={e => setName(e.target.value)} onBlur={saveName} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
          {problem && <p className="sq-note vc-error" role="alert">{problem}</p>}
          <span className="sq-note fa-label" id={`fa-r-${person.slot}`}>They are the child’s</span>
          <RelationPicker id={`fa-r-${person.slot}`} value={person.relation} disabled={busy} onChange={r => onSave({ ...person, relation: cleanRelation(r) })} />
          <NameVoice name={person.name} disabled={busy}
            voice={person.voice ? { blob: person.voice, ms: person.voiceMs ?? 0 } : null}
            onChange={v => onSave({ ...person, voice: v?.blob, voiceMs: v?.ms })} />
          <div className="fa-card-actions">
            <button type="button" className={`sq-ib bad${sure ? ' armed' : ''}`} disabled={busy}
              title={sure ? 'Tap again to delete' : 'Delete'} aria-label={sure ? 'Tap again to delete' : 'Delete'}
              onClick={() => { if (!sure) setSure(true); else onDelete(person.slot) }}>
              <TrashIcon />{sure && <span>Sure?</span>}
            </button>
          </div>
        </div>
      )}
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
        Add the people your child knows. Each one has a photo, the name your child uses and what they are to your child.
        You can also record yourself saying the name. Family Faces uses them to ask “Who is this?” and “Where is Amma?”.
      </p>
      <p className="sq-note fa-privacy">
        <LockIcon />Everything stays on this phone or computer. Photos are cropped square and hidden details are dropped.
      </p>

      <h3 className="sq-subhead">Add a person</h3>
      <form onSubmit={add} noValidate className="fa-add">
        <input ref={input} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0] ?? null; e.target.value = ''; setFile(f); setError('') }} />
        <div className="fa-add-top">
          <button type="button" className={`fa-photo${preview ? ' has' : ''}`} disabled={busy || full}
            aria-label={file ? 'Choose another photo' : 'Choose a photo'} onClick={() => input.current?.click()}>
            {preview
              ? <img src={preview} alt="The photo you chose" />
              : <><CameraIcon /><span>Add photo</span></>}
          </button>
          <div className="fa-add-name">
            <label className="sq-note fa-label" htmlFor="fa-name">What does your child call them?</label>
            <input id="fa-name" className="fb-line" value={name} maxLength={MAX_NAME} placeholder="Amma" disabled={busy || full} onChange={e => setName(e.target.value)} />
          </div>
        </div>

        <span className="sq-note fa-label" id="fa-relation">They are your child’s</span>
        <RelationPicker id="fa-relation" value={relation} disabled={busy || full} onChange={setRelation} />

        <NameVoice name={name} voice={voice} disabled={busy || full} onChange={setVoice} />

        {error && <p className="sq-note vc-error" role="alert">{error}</p>}
        {note && <p className="sq-note" role="status">{note}</p>}
        <button type="submit" className="sq-btn primary fa-submit" disabled={busy || full}>{busy ? 'Saving…' : 'Add person'}</button>
      </form>

      <h3 className="sq-subhead">Your people ({people.length} of {MAX_PEOPLE})</h3>
      {!people.length && <p className="sq-note">No one added yet.</p>}
      {people.length === 1 && <p className="sq-note">Add at least one more person to play Family Faces.</p>}
      {people.length > 0 && (
        <ul className="fa-list">
          {people.map(p => (
            <PersonCard key={p.slot} person={p} url={urls[p.slot]} others={people.filter(o => o.slot !== p.slot)} busy={busy} onSave={save} onDelete={remove} />
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
