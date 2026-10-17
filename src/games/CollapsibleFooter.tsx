'use client'
// The site footer, folded away on this page. A child playing these games tends to
// keep scrolling, and the footer is full of links that lead off the page. So it
// stays closed, and opens when someone keeps scrolling past the end on purpose:
// two separate scrolls at the very bottom, one after the other. A small button
// does the same for keyboards and screen readers.
import { useEffect, useRef, useState } from 'react'

const GAP_MS = 350      // a pause this long between scroll events starts a new scroll
const WINDOW_MS = 4000  // both scrolls must come within this of each other

export default function CollapsibleFooter({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const body = useRef<HTMLDivElement>(null)
  const openRef = useRef(false)
  openRef.current = open

  // A closed footer must not be reachable by tabbing or by screen readers.
  useEffect(() => {
    const el = body.current as (HTMLDivElement & { inert?: boolean }) | null
    if (el) el.inert = !open
  }, [open])

  useEffect(() => {
    let lastEvent = 0
    let lastCounted = 0
    let count = 0
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4

    // Called for every downward scroll attempt. Only the first event of a scroll
    // counts, and only if the page was already at the very bottom when it began;
    // so reaching the end is one thing, and scrolling again twice is another.
    function attempt() {
      if (openRef.current) return
      const now = performance.now()
      const startsNewScroll = now - lastEvent > GAP_MS
      lastEvent = now
      if (!startsNewScroll) return
      if (!atBottom()) { count = 0; return }
      count = now - lastCounted < WINDOW_MS ? count + 1 : 1
      lastCounted = now
      if (count >= 2) {
        count = 0
        setOpen(true)
        // Let the footer unfold, then bring it into view.
        setTimeout(() => body.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
      }
    }

    let touchY = 0
    const onWheel = (e: WheelEvent) => { if (e.deltaY > 0) attempt() }
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => { if (touchY - e.touches[0].clientY > 24) attempt() }
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      if (['ArrowDown', 'PageDown', 'End'].includes(e.key)) attempt()
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <>
      {!open && (
        <div className="sq-more">
          <button type="button" onClick={() => setOpen(true)} aria-expanded={false} aria-controls="sq-footer">
            About Little Steps ▾
          </button>
        </div>
      )}
      <div className={`sq-footwrap${open ? ' open' : ''}`}>
        <div ref={body} id="sq-footer">
          <div className="sq-more sq-less">
            <button type="button" onClick={() => setOpen(false)} aria-expanded={open}>Hide ▴</button>
          </div>
          {children}
        </div>
      </div>
    </>
  )
}
