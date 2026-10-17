'use client'
// Sound for the games: the voice, the chime, the "found it" ding, and the buzz.
// Shared by every game so they all sound the same.
import { useRef } from 'react'
import { playPraise } from './voice/player'

type Note = { f: number; at: number; len: number; gain: number; type: OscillatorType; hold?: number }

export function useFeedback(sound: boolean) {
  const audio = useRef<AudioContext | null>(null)

  // `force` is for a speaker button: asking to hear something works even when the
  // tap-by-tap sound is off. `queue` adds to what is being said instead of cutting in.
  function say(text: string, force = false, queue = false) {
    if ((!sound && !force) || typeof speechSynthesis === 'undefined') return
    try {
      if (!queue) speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 0.8
      u.lang = 'en-IN'
      speechSynthesis.speak(u)
    } catch {}
  }

  // The congratulation at the end of a round: one of the parent's own recordings if they have made any (these
  // play whether or not "Sound" is on, because the parent made them to be heard), otherwise the computer voice
  // as before. `queue` means it follows something already being said, so a recording waits for that to finish.
  function praise(text: string, queue = false) {
    const wait = queue && sound ? 1400 : 0
    playPraise(wait).then(ok => { if (!ok) say(text, false, queue) })
  }

  function tones(notes: Note[]) {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      audio.current = audio.current || new Ctx()
      const ctx = audio.current
      // iOS creates the engine suspended; it only wakes inside a tap.
      if (ctx.state === 'suspended') ctx.resume()
      notes.forEach(n => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        const t = ctx.currentTime + n.at
        o.type = n.type
        o.frequency.value = n.f
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(n.gain, t + 0.03)
        // `hold` keeps the level steady before the fade, for a tone that is a
        // sound and not just a click; chimes leave it out and ring out instead.
        if (n.hold) g.gain.setValueAtTime(n.gain, t + n.hold)
        g.gain.exponentialRampToValueAtTime(0.0001, t + n.len)
        o.connect(g).connect(ctx.destination)
        o.start(t)
        o.stop(t + n.len + 0.05)
      })
    } catch {}
  }

  const chime = () => sound && tones([523.25, 659.25, 783.99].map((f, i) =>
    ({ f, at: i * 0.22, len: 1.1, gain: 0.12, type: 'sine' as const })))

  // A quick rising sparkle: "yes, that one". It plays on every right choice (a number, a
  // letter, a difference found), whether or not the sound setting is on. It has to: the buzz
  // below always sounds, and a game that only ever makes a noise for mistakes teaches
  // children to go looking for the mistakes.
  const ding = () => tones([
    { f: 784, at: 0, len: 0.4, gain: 0.1, type: 'sine' },
    { f: 988, at: 0.08, len: 0.4, gain: 0.1, type: 'sine' },
    { f: 1319, at: 0.16, len: 0.55, gain: 0.1, type: 'sine' },
  ])

  // A short, soft "not that one". Phone speakers barely reproduce anything under ~250 Hz,
  // so it sits a little above that, as a rounded triangle wave (a square wave is harsh)
  // with two close notes for the slight beating a buzz has. It is deliberately mild: a
  // sound that is fun to trigger gets triggered. It is feedback, like the shake, so it
  // plays whether or not the sound setting is on, and Android phones also give a short
  // vibration.
  const buzz = () => {
    tones([
      { f: 235, at: 0, len: 0.22, hold: 0.1, gain: 0.12, type: 'triangle' },
      { f: 243, at: 0, len: 0.22, hold: 0.1, gain: 0.12, type: 'triangle' },
    ])
    try { navigator.vibrate?.(60) } catch {}
  }

  return { say, praise, chime, ding, buzz }
}
