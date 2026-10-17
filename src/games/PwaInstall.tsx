'use client'
// Registers the service worker and offers the install pill, the same
// quiet pill the Learning Lab uses. Chrome only fires beforeinstallprompt once
// it judges the visit engaged; iOS Safari never does, so there the pill gives
// the one instruction that works, after the visit has lasted a while.
import { useEffect, useState } from 'react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pr-install-dismissed'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIosSafari() {
  const ua = navigator.userAgent
  const ios = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
}

export default function PwaInstall() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    // Dev chunks change on every edit, so a cache-first worker would break HMR.
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(() => navigator.serviceWorker.ready)
        .then(reg => {
          // The worker only starts after this page has loaded, so it never saw the page or its
          // scripts go by. Hand it the list now, so one visit is enough to work offline.
          const send = () => {
            const urls = [location.href, ...performance.getEntriesByType('resource').map(r => r.name)]
            reg.active?.postMessage({ type: 'precache', urls })
          }
          if (document.readyState === 'complete') send()
          else window.addEventListener('load', send, { once: true })
        })
        .catch(() => {})
    }

    if (isStandalone()) return

    try { if (localStorage.getItem(DISMISS_KEY) === '1') return } catch {}

    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as InstallPromptEvent) }
    const onInstalled = () => setDeferred(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    let timer: ReturnType<typeof setTimeout> | undefined
    if (isIosSafari()) timer = setTimeout(() => setIosHint(true), 25_000)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      if (timer) clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
    setDeferred(null)
    setIosHint(false)
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  if (!deferred && !iosHint) return null

  return (
    <div className="pr-install" role="region" aria-label="Install Little Steps">
      <img src="/icon-192.png" alt="" width={36} height={36} />
      <div className="pr-install-text">
        <strong>Add Little Steps to your home screen</strong>
        <span>{deferred ? 'Opens straight to the games.' : 'Tap Share, then “Add to Home Screen”.'}</span>
      </div>
      {deferred && (
        <button type="button" className="pr-install-go" onClick={install}>Install</button>
      )}
      <button type="button" className="pr-install-x" onClick={dismiss} aria-label="Not now">×</button>
    </div>
  )
}
