'use client'
// "Your pictures": a parent adds photos for the Jigsaw. Each photo is made ready on this device (cropped to the
// board's shape, shrunk, hidden details such as where it was taken dropped) and kept in this browser only (see
// pictures/store.ts), never sent anywhere. The game cuts each one into pieces at random.
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_PHOTOS, deletePhoto, freeSlot, listPhotos, savePhoto, type Photo } from './pictures/store'
import { preparePhoto } from './pictures/prepare'
import { PICTURE_MODES } from './pictures/prefs'
import { useApp } from './store'

export default function PicturesSettings() {
  const { jigsaw, setJigsaw } = useApp()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [urls, setUrls] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [askDelete, setAskDelete] = useState<number | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    const list = await listPhotos()
    setPhotos(list)
    return list
  }, [])
  useEffect(() => { refresh() }, [refresh])

  // Small previews, from temporary addresses that are let go of when the list changes or the page closes.
  useEffect(() => {
    const made = Object.fromEntries(photos.map(p => [p.slot, URL.createObjectURL(p.blob)]))
    setUrls(made)
    return () => Object.values(made).forEach(u => URL.revokeObjectURL(u))
  }, [photos])

  async function add(files: File[]) {
    setError('')
    setNote('')
    setAskDelete(null)
    setBusy(true)
    let list = photos
    let added = 0, unreadable = 0, full = false
    for (const file of files) {
      const slot = freeSlot(list)
      if (slot === null) { full = true; break }
      const blob = await preparePhoto(file)
      if (!blob) { unreadable++; continue }
      const ok = await savePhoto({ slot, blob, at: Date.now() })
      if (!ok) { setError('Could not save on this device. A private window does not keep photos.'); break }
      added++
      list = await refresh()
    }
    setBusy(false)
    const parts: string[] = []
    if (added) parts.push(added === 1 ? 'Added 1 photo.' : `Added ${added} photos.`)
    if (unreadable) parts.push(unreadable === 1 ? 'One file could not be read as a picture.' : `${unreadable} files could not be read as pictures.`)
    if (full) parts.push(`You can keep ${MAX_PHOTOS} photos. Delete one to add another.`)
    setNote(parts.join(' '))
  }

  async function remove(slot: number) {
    if (askDelete !== slot) { setAskDelete(slot); return }
    setAskDelete(null)
    setNote('')
    await deletePhoto(slot)
    await refresh()
  }

  const full = photos.length >= MAX_PHOTOS

  return (
    <section aria-labelledby="sq-pictures-title">
      <h3 id="sq-pictures-title" className="sq-subhead">Your pictures</h3>
      <p className="sq-note">
        Add photos for the Jigsaw game: your child, your family, a pet, a favourite place. Each photo is cut into
        pieces in a different way every time, so it is a new puzzle each round.
      </p>
      <p className="sq-note">
        Photos stay on this phone or computer. They are never uploaded. Each one is cropped to the shape of the board,
        and anything hidden in the file, such as where it was taken, is dropped.
      </p>

      <div className="pc-add">
        <input ref={input} type="file" accept="image/*" multiple hidden
          onChange={e => { const files = Array.from(e.target.files || []); e.target.value = ''; if (files.length) add(files) }} />
        <button type="button" className="sq-btn primary" disabled={busy || full} onClick={() => input.current?.click()}>
          {busy ? 'Adding…' : 'Add photos'}
        </button>
        <span className="sq-note pc-count">{photos.length} of {MAX_PHOTOS} photos</span>
      </div>

      {note && <p className="sq-note" role="status">{note}</p>}
      {error && <p className="sq-note vc-error" role="alert">{error}</p>}

      {photos.length > 0 && (
        <ul className="pc-grid">
          {photos.map(p => (
            <li key={p.slot} className="pc-item">
              {urls[p.slot] ? <img src={urls[p.slot]} alt={`Photo ${p.slot + 1}`} /> : <div className="pc-blank" />}
              <button type="button" className="sq-btn" disabled={busy} onClick={() => remove(p.slot)}>
                {askDelete === p.slot ? 'Tap again to delete' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="sq-subhead">In the Jigsaw game</h3>
      <div role="radiogroup" aria-label="Which pictures the Jigsaw uses" className="pc-choices">
        {PICTURE_MODES.map(m => (
          <label key={m.id} className="sq-inline">
            <input type="radio" name="pc-mode" checked={jigsaw.pictures === m.id} onChange={() => setJigsaw({ pictures: m.id })} />
            <span>{m.label}</span>
          </label>
        ))}
      </div>
      {photos.length === 0 && jigsaw.pictures !== 'cartoons' && (
        <p className="sq-note">With no photos yet, the Jigsaw uses the drawn pictures.</p>
      )}
      <label className="sq-inline">
        <input type="checkbox" checked={jigsaw.guide} onChange={e => setJigsaw({ guide: e.target.checked })} />
        <span>Show a faint picture on the board to help</span>
      </label>
      <label className="sq-inline">
        <input type="checkbox" checked={jigsaw.plain} onChange={e => setJigsaw({ plain: e.target.checked })} />
        <span>Plain edges: straight cuts with no knobs, which are easier to see</span>
      </label>
      <p className="sq-note">
        How many pieces there are is set in Game settings (Jigsaw: from 4 up to 36 pieces).
      </p>
      <p className="ls-links"><Link href="/games/puzzle" className="sq-btn">Try the Jigsaw</Link></p>
      <p className="sq-note">
        On an iPhone, add this page to the home screen to keep your photos safe: Safari can clear a website’s saved
        data after about a week without a visit.
      </p>
    </section>
  )
}
