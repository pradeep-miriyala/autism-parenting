'use client'
// "Stuck?": true after the child has paused for `delaySec`, or has missed twice in
// a row. Any change to `resetKey` (a tap, a find) starts the wait again. 0 turns it off.
import { useEffect, useState } from 'react'

export function useStuck(active: boolean, delaySec: number, misses: number, resetKey: string | number) {
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    if (!active || delaySec === 0) { setStuck(false); return }
    setStuck(misses >= 2)
    const t = setTimeout(() => setStuck(true), delaySec * 1000)
    return () => clearTimeout(t)
  }, [active, delaySec, misses, resetKey])
  return stuck
}
