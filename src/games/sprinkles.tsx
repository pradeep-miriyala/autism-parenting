'use client'
// The congratulation sprinkles, shared by every game.
import { useEffect, useRef, useState } from 'react'

export const SPRINKLE_MS = 4200

export type Sprinkle = {
  left: number; top: number; delay: number; dur: number; size: number
  drift: number; spin: number; colour: string; round: boolean
}

// Soft colours only: this is a celebration, not an alarm. Younger children get
// fewer, bigger, slower pieces.
export function makeSprinkles(palette: string[], young: boolean): Sprinkle[] {
  const r = (a: number, b: number) => a + Math.random() * (b - a)
  const k = young ? 1.5 : 1
  return Array.from({ length: young ? 20 : 30 }, () => ({
    left: r(2, 98), top: r(4, 80), delay: r(0, 0.9), dur: r(2.6, 3.6) * (young ? 1.2 : 1), size: r(6, 11) * k,
    drift: r(-24, 24), spin: r(-360, 360),
    colour: palette[Math.floor(Math.random() * palette.length)],
    round: Math.random() < 0.4,
  }))
}

export function useSprinkles() {
  const [sprinkles, setSprinkles] = useState<Sprinkle[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return {
    sprinkles,
    burst(palette: string[], young: boolean) {
      setSprinkles(makeSprinkles(palette, young))
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setSprinkles([]), SPRINKLE_MS)
    },
    clear() { clearTimeout(timer.current); setSprinkles([]) },
  }
}

export function SprinklesLayer({ sprinkles }: { sprinkles: Sprinkle[] }) {
  if (sprinkles.length === 0) return null
  return (
    <div className="sq-sprinkles" aria-hidden="true">
      {sprinkles.map((p, i) => (
        <i key={i} style={{
          left: `${p.left}%`, width: p.size, height: p.round ? p.size : p.size * 1.8,
          background: p.colour, borderRadius: p.round ? '50%' : 2,
          animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
          '--y': `${p.top}%`, '--drift': `${p.drift}px`, '--spin': `${p.spin}deg`,
        } as React.CSSProperties} />
      ))}
    </div>
  )
}
