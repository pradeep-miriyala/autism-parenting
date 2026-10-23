'use client'
// "Your voice": a parent records up to three congratulations, which are played at the end of a round instead
// of the computer voice. Tap Record, say it, tap Stop, listen, then Keep or try again. The recordings are
// kept in this browser only (see voice/store.ts) and never sent anywhere. The microphone is asked for only
// when Record is tapped, and is let go of the moment the recording stops.
import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_SECONDS, MIN_MS, SLOTS } from './voice/pick'
import { deleteClip, listClips, saveClip, type Clip } from './voice/store'
import { loadClips, playBlob } from './voice/player'
import { CheckIcon, CloseIcon, PlayIcon, RecordIcon, RedoIcon, StopIcon, TrashIcon } from './icons'

const MIMES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
const pickMime = () => { try { return MIMES.find(m => MediaRecorder.isTypeSupported(m)) } catch { return undefined } }
const seconds = (ms: number) => `${Math.max(1, Math.round(ms / 1000))} s`

type Preview = { slot: number; blob: Blob; ms: number; type: string }

export default function VoiceSettings({ useRecordings, onUseRecordings }: {
  useRecordings: boolean
  onUseRecordings: (on: boolean) => void
}) {
  const [clips, setClips] = useState<Record<number, Clip>>({})
  const [rec, setRec] = useState<{ slot: number; startedAt: number } | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [askDelete, setAskDelete] = useState<number | null>(null)
  const root = useRef<HTMLElement>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const discard = useRef(false)

  const refresh = useCallback(async () => {
    const list = await listClips()
    setClips(Object.fromEntries(list.filter(c => c.slot < SLOTS).map(c => [c.slot, c])))
    await loadClips()   // and into what the games play from
  }, [])
  useEffect(() => { refresh() }, [refresh])

  // Let go of the microphone and stop any recording, keeping nothing.
  const teardown = useCallback(() => {
    clearTimeout(stopTimer.current)
    discard.current = true
    try { if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop() } catch {}
    stream.current?.getTracks().forEach(t => t.stop())
    stream.current = null
    recorder.current = null
    setRec(null)
  }, [])
  useEffect(() => teardown, [teardown])

  // Closing the settings while recording stops it.
  useEffect(() => {
    const dlg = root.current?.closest('dialog')
    if (!dlg) return
    const onClose = () => { teardown(); setPreview(null); setAskDelete(null) }
    dlg.addEventListener('close', onClose)
    return () => dlg.removeEventListener('close', onClose)
  }, [teardown])

  useEffect(() => {
    if (!rec) return
    const t = setInterval(() => setElapsed(Date.now() - rec.startedAt), 150)
    return () => clearInterval(t)
  }, [rec])

  async function start(slot: number) {
    setError('')
    setAskDelete(null)
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot record. Try Chrome or Safari, or the installed app.')
      return
    }
    let s: MediaStream
    try {
      s = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('The microphone is blocked. Allow it for this page in the browser’s settings, then try again.')
      return
    }
    stream.current = s
    const mime = pickMime()
    let r: MediaRecorder
    try { r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined) } catch {
      s.getTracks().forEach(t => t.stop())
      setError('This browser cannot record. Try Chrome or Safari, or the installed app.')
      return
    }
    const chunks: Blob[] = []
    const startedAt = Date.now()
    discard.current = false
    r.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data) }
    r.onstop = () => {
      s.getTracks().forEach(t => t.stop())
      clearTimeout(stopTimer.current)
      setRec(null)
      if (discard.current) return
      const ms = Date.now() - startedAt
      if (ms < MIN_MS || chunks.length === 0) { setError('That was very short. Tap Record and try again.'); return }
      const type = r.mimeType || mime || 'audio/webm'
      setPreview({ slot, blob: new Blob(chunks, { type }), ms: Math.min(ms, MAX_SECONDS * 1000), type })
    }
    recorder.current = r
    r.start()
    setElapsed(0)
    setRec({ slot, startedAt })
    stopTimer.current = setTimeout(() => { try { r.stop() } catch {} }, MAX_SECONDS * 1000)
  }

  function stop() { try { recorder.current?.stop() } catch {} }

  async function keep() {
    if (!preview) return
    const ok = await saveClip({ slot: preview.slot, blob: preview.blob, type: preview.type, ms: preview.ms, at: Date.now() })
    if (!ok) { setError('Could not save it on this device. A private window does not keep recordings.'); return }
    setPreview(null)
    setError('')
    await refresh()
  }

  async function remove(slot: number) {
    if (askDelete !== slot) { setAskDelete(slot); return }
    setAskDelete(null)
    await deleteClip(slot)
    await refresh()
  }

  const any = Object.keys(clips).length > 0
  const busy = !!rec || !!preview

  return (
    <section ref={root} aria-labelledby="sq-voice-title">
      <h3 id="sq-voice-title" className="sq-subhead">Your voice</h3>
      <p className="sq-note">
        Record your own congratulations to play at the end of a round, in place of the computer voice. Record up to
        three: one is chosen each time, never the same one twice running. Say something like “Well done! I am so proud
        of you.” and use your child’s name if you like. Anything you do not record keeps the computer voice.
      </p>
      <p className="sq-note">
        Recordings stay on this phone or computer. They are never uploaded, and they play even when Sound is off.
      </p>

      <ul className="vc-list">
        {Array.from({ length: SLOTS }, (_, slot) => {
          const clip = clips[slot]
          const recording = rec?.slot === slot
          const previewing = preview?.slot === slot
          return (
            <li key={slot} className="vc-row">
              <span className="vc-name">
                Message {slot + 1}
                <small>
                  {recording ? ` · recording ${Math.min(MAX_SECONDS, Math.floor(elapsed / 1000))} of ${MAX_SECONDS} s`
                    : previewing ? ` · ${seconds(preview!.ms)}, not kept yet`
                    : clip ? ` · ${seconds(clip.ms)}` : ' · not recorded'}
                </small>
              </span>
              <span className="vc-actions">
                {recording ? (
                  <button type="button" className="sq-btn ico primary" onClick={stop}><StopIcon />Stop</button>
                ) : previewing ? (
                  <>
                    <button type="button" className="sq-btn ico" onClick={() => playBlob(preview!.blob)}><PlayIcon />Listen</button>
                    <button type="button" className="sq-btn ico primary" onClick={keep}><CheckIcon />Keep</button>
                    <button type="button" className="sq-btn ico" onClick={() => { setPreview(null); start(slot) }}><RedoIcon />Again</button>
                    <button type="button" className="sq-btn ico" onClick={() => setPreview(null)}><CloseIcon />Cancel</button>
                  </>
                ) : (
                  <>
                    {clip && <button type="button" className="sq-btn ico" disabled={busy} onClick={() => playBlob(clip.blob)}><PlayIcon />Play</button>}
                    <button type="button" className="sq-btn ico rec" disabled={busy} onClick={() => start(slot)}>{clip ? <RedoIcon /> : <RecordIcon />}{clip ? 'Record again' : 'Record'}</button>
                    {clip && <button type="button" className="sq-btn ico" disabled={busy} onClick={() => remove(slot)}><TrashIcon />{askDelete === slot ? 'Tap again to delete' : 'Delete'}</button>}
                  </>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      {error && <p className="sq-note vc-error" role="alert">{error}</p>}

      <label className="sq-inline">
        <input type="checkbox" checked={useRecordings} disabled={!any} onChange={e => onUseRecordings(e.target.checked)} />
        <span>Play my recordings at the end of a round</span>
      </label>
      <p className="sq-note">
        On an iPhone, add this page to the home screen to keep your recordings safe: Safari can clear a website’s saved
        data after about a week without a visit.
      </p>
    </section>
  )
}
