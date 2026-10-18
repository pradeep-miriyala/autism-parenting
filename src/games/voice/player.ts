'use client'
// Plays the parent's recorded messages. One shared audio engine for the page, woken by the first touch (iPhones
// start it asleep and only let a tap wake it), the same way the sparkle and chime sounds work. Recordings play
// whether or not the "Sound" setting is on: the parent made them to be heard. If there are none, or one cannot
// be played for any reason, the answer is "no" and the caller uses the computer voice as before.
import { listClips, type Clip } from './store'
import { SLOTS, pickSlot } from './pick'

let ctx: AudioContext | null = null
let enabled = true
let clips = new Map<number, Clip>()
const decoded = new Map<string, AudioBuffer>()
let last: number | null = null
let unlocking = false

function context(): AudioContext | null {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return null
    ctx = ctx || new Ctx()
    return ctx
  } catch { return null }
}

/** Wake the audio engine on the first touch, key press or click. */
export function unlockOnGesture() {
  if (unlocking || typeof window === 'undefined') return
  unlocking = true
  const wake = () => { const c = context(); if (c && c.state === 'suspended') c.resume().catch(() => {}) }
  for (const e of ['pointerdown', 'touchend', 'keydown']) window.addEventListener(e, wake, { passive: true })
}

export function setEnabled(on: boolean) { enabled = on }
export const recordedSlots = () => [...clips.keys()].sort()
export const hasRecordings = () => clips.size > 0

/** Read what has been saved into memory. Call at start-up and after a save or a delete. */
export async function loadClips() {
  const list = await listClips()
  clips = new Map(list.filter(c => c.slot >= 0 && c.slot < SLOTS).map(c => [c.slot, c]))
  for (const k of [...decoded.keys()]) if (![...clips.values()].some(c => `${c.slot}:${c.at}` === k)) decoded.delete(k)
}

function decode(c: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    // Older Safari only takes callbacks; newer ones return a promise too.
    const p = c.decodeAudioData(data, resolve, reject) as Promise<AudioBuffer> | undefined
    p?.then?.(resolve, reject)
  })
}

async function ready(): Promise<AudioContext | null> {
  const c = context()
  if (!c) return null
  if (c.state === 'suspended') {
    try { await Promise.race([c.resume(), new Promise(r => setTimeout(r, 400))]) } catch {}
  }
  return c.state === 'running' ? c : null
}

async function start(c: AudioContext, buffer: AudioBuffer, afterMs: number) {
  const src = c.createBufferSource()
  src.buffer = buffer
  src.connect(c.destination)
  src.start(c.currentTime + Math.max(0, afterMs) / 1000)
}

const blobBuffers = new WeakMap<Blob, AudioBuffer>()

/** Play a recording (the parent listening back, or a family member's name). It is remembered once decoded, so a short clip plays at once the next time. */
export async function playBlob(blob: Blob): Promise<boolean> {
  try {
    const c = await ready()
    if (!c) return false
    let buffer = blobBuffers.get(blob)
    if (!buffer) { buffer = await decode(c, await blob.arrayBuffer()); blobBuffers.set(blob, buffer) }
    await start(c, buffer, 0)
    return true
  } catch { return false }
}

/** Play one of the parent's "well done" messages, `afterMs` from now. True if one started. */
export async function playPraise(afterMs = 0): Promise<boolean> {
  if (!enabled || clips.size === 0) return false
  try {
    const slot = pickSlot(recordedSlots(), last)
    if (slot === null) return false
    const clip = clips.get(slot)!
    const c = await ready()
    if (!c) return false
    const key = `${clip.slot}:${clip.at}`
    let buffer = decoded.get(key)
    if (!buffer) {
      buffer = await decode(c, await clip.blob.arrayBuffer())
      decoded.set(key, buffer)
    }
    last = slot
    await start(c, buffer, afterMs)
    return true
  } catch { return false }
}
