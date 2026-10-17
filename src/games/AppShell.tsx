'use client'
// The frame around every screen: the header (where am I, the way back, stickers, menu), the menu, play mode, and the
// small things that float over a game (a new sticker, a message). It lives in the root layout, so it stays put while
// the page inside it changes.
//
// Play mode: only the game is on screen. The header goes, and the only controls are the stickers, landscape, and a
// lock that takes a long press to open. A child cannot leave the game by any tap on the screen.
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { STICKERS } from './progress'
import { placeOf } from './nav'
import { useApp } from './store'
import { ShellCtx } from './shellContext'
import HoldToUnlock from './HoldToUnlock'
import PwaInstall from './PwaInstall'
import GatedAnalytics from './GatedAnalytics'
import { AlbumIcon, BackIcon, ChevronIcon, CloseIcon, CopyrightIcon, HomeIcon, InfoIcon, LandscapeIcon, LockIcon, MenuIcon, PlayIcon, PortraitIcon, SpeakerIcon } from './icons'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const app = useApp()
  const pathname = usePathname()
  const router = useRouter()
  const place = placeOf(pathname)
  const menuRef = useRef<HTMLDialogElement>(null)
  const confirmRef = useRef<HTMLDialogElement>(null)
  const { playMode, ready, lastGame, roundActive, setPlayMode, showToast } = app

  const openMenu = useCallback(() => { const d = menuRef.current; if (d && !d.open) d.showModal() }, [])
  const closeMenu = useCallback(() => menuRef.current?.close(), [])

  // "Back to all games": a round under way asks first.
  const goHome = useCallback(() => {
    if (roundActive) { const d = confirmRef.current; if (d && !d.open) d.showModal(); return }
    router.push('/')
  }, [roundActive, router])
  const answerLeave = (go: boolean) => { confirmRef.current?.close(); if (go) router.push('/') }

  // A new page closes the menu.
  useEffect(() => { closeMenu() }, [pathname, closeMenu])

  // Play mode keeps the child inside one game, even after a reload or a Back press.
  const onGame = place.game === true
  useEffect(() => {
    if (ready && playMode && !onGame) router.replace(`/games/${lastGame}`)
  }, [ready, playMode, onGame, lastGame, router])

  // Pulling the page down must not refresh it once a game is open (or play mode is on): a child's drawing or drag
  // that drifts upwards would throw the round away. Chrome and Android honour the CSS switch; iPhone Safari does
  // not, so a pull down from the top of the page is also stopped by hand. The menu and dialogs scroll on their own.
  const holdPage = onGame || playMode
  useEffect(() => {
    if (!holdPage) return
    const root = document.documentElement
    root.classList.add('sq-nopull')
    let startY = 0
    const start = (e: TouchEvent) => { startY = e.touches[0]?.clientY ?? 0 }
    const move = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !e.cancelable) return
      const pulling = e.touches[0].clientY - startY > 0
      if (pulling && window.scrollY <= 0 && !(e.target as Element | null)?.closest?.('dialog')) e.preventDefault()
    }
    document.addEventListener('touchstart', start, { passive: true })
    document.addEventListener('touchmove', move, { passive: false })
    return () => {
      root.classList.remove('sq-nopull')
      document.removeEventListener('touchstart', start)
      document.removeEventListener('touchmove', move)
    }
  }, [holdPage])

  const shell = useMemo(() => ({ openMenu, goHome }), [openMenu, goHome])
  const stickers = app.progress.stickers.length
  const startPlay = () => { setPlayMode(true); showToast('Play mode is on. To leave it, press and hold the lock.') }

  return (
    <ShellCtx.Provider value={shell}>
      <a href="#main" className="ls-skip">Skip to the content</a>

      {playMode ? (
        onGame && (
          <div className="ls-playbar">
            <Link href="/stickers" className="sq-icon" aria-label="My stickers"><AlbumIcon /></Link>
            <button type="button" className="sq-icon ls-rotate" onClick={app.toggleRotate} aria-label={app.compact ? 'Portrait view' : 'Landscape view'}>
              {app.compact ? <PortraitIcon /> : <LandscapeIcon />}
            </button>
            <HoldToUnlock onUnlock={() => { setPlayMode(false); showToast('Play mode is off.') }} />
          </div>
        )
      ) : (
        <header className="ls-header">
          <div className="ls-left">
            {place.up !== null && (
              <button type="button" className="sq-icon ls-back" aria-label={onGame ? 'Back to all games' : 'Back'}
                onClick={() => (onGame ? goHome() : router.push(place.up!))}>
                <BackIcon />
              </button>
            )}
            {place.up === null ? (
              <Link href="/" className="ls-brand" aria-label="Little Steps, home">Little Steps</Link>
            ) : (
              <nav aria-label="Breadcrumb" className="ls-crumbs">
                <ol>
                  {place.crumbs.map((c, i) => {
                    const last = i === place.crumbs.length - 1
                    return (
                      <li key={c.href} className={last ? 'here' : i < place.crumbs.length - 2 ? 'far' : ''}>
                        {i > 0 && <span className="ls-sep" aria-hidden="true"><ChevronIcon /></span>}
                        {last
                          ? <span aria-current="page">{place.icon && <span className="ls-gico" aria-hidden="true">{place.icon}</span>}{c.label}</span>
                          : <Link href={c.href}>{i === 0 ? <HomeIcon /> : c.label}{i === 0 && <span className="sq-sr">Games</span>}</Link>}
                      </li>
                    )
                  })}
                </ol>
              </nav>
            )}
          </div>
          <div className="ls-right">
            {onGame ? (
              <button type="button" className="sq-icon sq-play" onClick={startPlay} title="Play mode"
                aria-label="Start play mode: lock the screen to this game for your child">
                <PlayIcon />
              </button>
            ) : (
              <Link href="/stickers" className="ls-stickers" aria-label={`My stickers: ${stickers} of ${STICKERS.length}`}>
                <AlbumIcon /><span aria-hidden="true">{stickers}</span>
              </Link>
            )}
            <button type="button" className="sq-icon ls-menubtn" onClick={openMenu} aria-label="Menu" aria-haspopup="dialog">
              <MenuIcon />
            </button>
          </div>
        </header>
      )}

      <main id="main" className="ls-main" tabIndex={-1}>{children}</main>

      <dialog ref={menuRef} className="ls-menu" aria-labelledby="ls-menu-title"
        onClick={e => { if (e.target === e.currentTarget) closeMenu() }}>
        <div className="ls-menu-head">
          <h2 id="ls-menu-title">Menu</h2>
          <button type="button" className="sq-icon" onClick={closeMenu} aria-label="Close menu"><CloseIcon /></button>
        </div>
        <nav aria-label="Little Steps">
          <ul className="ls-menu-list" onClick={e => { if ((e.target as HTMLElement).closest('a')) closeMenu() }}>
            <li><Link href="/" aria-current={pathname === '/' ? 'page' : undefined}><HomeIcon /><span>All games</span></Link></li>
            <li><Link href="/stickers" aria-current={pathname === '/stickers' ? 'page' : undefined}><AlbumIcon /><span>My stickers</span><small>{stickers} of {STICKERS.length}</small></Link></li>
            <li>
              <button type="button" role="switch" aria-checked={app.sound} onClick={() => app.setSound(!app.sound)}>
                <SpeakerIcon off={!app.sound} /><span>Sound</span><small className={app.sound ? 'on' : ''}>{app.sound ? 'On' : 'Off'}</small>
              </button>
            </li>
            <li className="ls-touch-only">
              <button type="button" onClick={() => { closeMenu(); app.toggleRotate() }}>
                {app.compact ? <PortraitIcon /> : <LandscapeIcon />}<span>{app.compact ? 'Upright view' : 'Wide view'}</span>
              </button>
            </li>
          </ul>
          <p className="ls-menu-cap">For grown-ups</p>
          <ul className="ls-menu-list" onClick={e => { if ((e.target as HTMLElement).closest('a')) closeMenu() }}>
            <li><Link href="/parents" aria-current={pathname.startsWith('/parents') ? 'page' : undefined}><LockIcon /><span>For parents</span><small>Press and hold</small></Link></li>
            <li><Link href="/about" aria-current={pathname === '/about' ? 'page' : undefined}><InfoIcon /><span>About Little Steps</span></Link></li>
            <li><Link href="/copyright" aria-current={pathname === '/copyright' ? 'page' : undefined}><CopyrightIcon /><span>Copyright</span></Link></li>
          </ul>
        </nav>
      </dialog>

      <dialog ref={confirmRef} className="sq-dialog sq-confirm" aria-labelledby="sq-confirm-title"
        onClick={e => { if (e.target === e.currentTarget) answerLeave(false) }}>
        <h2 id="sq-confirm-title">Finish this one first?</h2>
        <div className="sq-confirm-actions">
          <button type="button" className="sq-btn primary" autoFocus onClick={() => answerLeave(false)}>Keep going</button>
          <button type="button" className="sq-btn" onClick={() => answerLeave(true)}>Back to the games</button>
        </div>
      </dialog>

      {app.newSticker !== null && (
        <Link href="/stickers" className="sq-sticker-pop" onClick={app.dismissSticker}
          aria-label={`New sticker: ${STICKERS[app.newSticker].label}. Open my stickers.`}>
          <span className="sq-sticker-emoji" aria-hidden="true">{STICKERS[app.newSticker].emoji}</span>
          <span>A new sticker!</span>
        </Link>
      )}

      {app.toast && <div className="sq-toast" role="status">{app.toast}</div>}

      <PwaInstall />
      <GatedAnalytics />
    </ShellCtx.Provider>
  )
}
