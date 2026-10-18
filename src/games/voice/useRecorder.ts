'use client'
// Recording a short clip from the microphone, for a parent. The microphone is asked for only when Record is pressed, and is
// let go of the moment the recording stops. `record()` resolves with the clip when it stops (by Stop, or by reaching the
// longest allowed), or with null if it was too short, cancelled, or could not start (then `error` says why). Only one
// recording runs at a time on the page: starting another cancels the first. Used by the family pictures page.
import { useCallback, useEffect, useRef, useState } from 'react'

export type Recording = { blob: Blob; ms: number; type: string }

const MIMES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
const pickMime = () => { try { return MIMES.find(m => MediaRecorder.isTypeSupported(m)) } catch { return undefined } }

let running: (() => void) | null = null   // cancels whatever is recording now

export function useRecorder(maxSeconds: number, minMs: number) {
  const [active, setActive] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const live = useRef<{ stop: () => void; cancel: () => void } | null>(null)

  const record = useCallback(async (): Promise<Recording | null> => {
    setError('')
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot record. Try Chrome or Safari, or the installed app.')
      return null
    }
    running?.()
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('The microphone is blocked. Allow it for this page in the browser’s settings, then try again.')
      return null
    }
    const mime = pickMime()
    let r: MediaRecorder
    try { r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined) } catch {
      stream.getTracks().forEach(t => t.stop())
      setError('This browser cannot record. Try Chrome or Safari, or the installed app.')
      return null
    }
    return new Promise<Recording | null>(resolve => {
      const chunks: Blob[] = []
      const started = Date.now()
      let discard = false, finished = false
      const tick = setInterval(() => setElapsed(Date.now() - started), 150)
      const auto = setTimeout(() => { try { if (r.state !== 'inactive') r.stop() } catch {} }, maxSeconds * 1000)
      const finish = (rec: Recording | null) => {
        if (finished) return
        finished = true
        clearInterval(tick); clearTimeout(auto)
        stream.getTracks().forEach(t => t.stop())
        if (live.current === handle) live.current = null
        if (running === handle.cancel) running = null
        setActive(false)
        resolve(rec)
      }
      const handle = {
        stop: () => { try { if (r.state !== 'inactive') r.stop() } catch {} },
        cancel: () => { discard = true; try { if (r.state !== 'inactive') r.stop(); else finish(null) } catch { finish(null) } },
      }
      r.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data) }
      r.onstop = () => {
        if (discard) return finish(null)
        const ms = Date.now() - started
        if (ms < minMs || chunks.length === 0) { setError('That was very short. Tap Record and try again.'); return finish(null) }
        const type = r.mimeType || mime || 'audio/webm'
        finish({ blob: new Blob(chunks, { type }), ms: Math.min(ms, maxSeconds * 1000), type })
      }
      live.current = handle
      running = handle.cancel
      setElapsed(0)
      setActive(true)
      r.start()
    })
  }, [maxSeconds, minMs])

  const stop = useCallback(() => live.current?.stop(), [])
  const cancel = useCallback(() => live.current?.cancel(), [])
  useEffect(() => () => live.current?.cancel(), [])
  return { active, elapsed, error, record, stop, cancel, clearError: () => setError('') }
}
