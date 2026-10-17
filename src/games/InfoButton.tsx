'use client'
// The "i" in every game: tap it to hear how to play, and to see the same words for a
// few seconds. It reads aloud even when the game's sound is off, because asking for the
// instructions is asking to hear them.
import { useEffect, useRef, useState } from 'react'
import { InfoIcon } from './icons'

export default function InfoButton({ text, say }: { text: string; say: (text: string, force?: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  // Tapping anywhere else puts the bubble away; it can cover part of the game.
  useEffect(() => {
    if (!open) return
    const away = (e: Event) => {
      if (!(e.target as HTMLElement | null)?.closest?.('.sq-info, .sq-bubble')) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  function toggle() {
    clearTimeout(timer.current)
    if (open) {
      setOpen(false)
      try { speechSynthesis.cancel() } catch {}
      return
    }
    setOpen(true)
    say(text, true)
    timer.current = setTimeout(() => setOpen(false), 9000)
  }

  return (
    <>
      <button type="button" className={`sq-icon sq-info${open ? ' on' : ''}`} aria-label="How to play" aria-expanded={open} onClick={toggle}>
        <InfoIcon />
      </button>
      {open && <div className="sq-bubble" role="status">{text}</div>}
    </>
  )
}
