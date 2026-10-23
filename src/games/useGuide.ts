'use client'
// The faint picture behind a jigsaw: it is there when the round starts, fades away slowly once `holdSec` have
// passed, and comes back when the child presses "Show picture". It then fades again after the same wait.
import { useCallback, useEffect, useState } from 'react'

export const GUIDE_HOLD_SEC = 10
export const GUIDE_FADE_SEC = 4

export function useGuide(enabled: boolean, paused: boolean, holdSec = GUIDE_HOLD_SEC) {
  const [shown, setShown] = useState(true)
  const [again, setAgain] = useState(0)
  useEffect(() => {
    if (!enabled || paused || !shown) return
    const t = setTimeout(() => setShown(false), holdSec * 1000)
    return () => clearTimeout(t)
  }, [enabled, paused, shown, again, holdSec])
  const show = useCallback(() => { setShown(true); setAgain(n => n + 1) }, [])
  return { shown, show }
}
