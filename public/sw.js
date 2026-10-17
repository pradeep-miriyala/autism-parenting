// public/sw.js — Little Steps service worker.
//
// Scoped to the whole site, but it only ever answers the home page (and the files it needs) from its saved
// copy: the dashboard and the API are never touched. It lets the games open and run with no connection once
// they have been visited.

const VERSION = 'ls-v1'
const SHELL = `ls-shell-${VERSION}`
const ASSETS = `ls-assets-${VERSION}`
const OFFLINE_URL = '/offline.html'
const PRECACHE = [OFFLINE_URL, '/icon-192.png', '/manifest.webmanifest']
const NAV_TIMEOUT_MS = 3500

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('ls-') && k !== SHELL && k !== ASSETS)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// Network first, but give up on a slow network rather than leaving a white
// screen; the last good copy of the page is shown only once the network fails.
async function navigationStrategy(request) {
  const cache = await caches.open(SHELL)
  try {
    const network = fetch(request)
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('slow network')), NAV_TIMEOUT_MS)
    )
    const response = await Promise.race([network, timeout])
    if (response && response.ok) cache.put(request, response.clone())
    return response
  } catch {
    // The installed app opens /?src=pwa, an address that may never have been saved on its own; the
    // page is the same, so any saved copy of / will do.
    return (await cache.match(request)) ||
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match(OFFLINE_URL))
  }
}

async function immutableStrategy(request) {
  const hit = await caches.match(request)
  if (hit) return hit
  const cache = await caches.open(ASSETS)
  const response = await fetch(request)
  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone())
  }
  return response
}

// The page tells the worker what it has loaded (see PwaInstall.tsx), because on a first visit the
// worker starts too late to see those requests go by. Only the page itself, its static files, the
// icons and the fonts are accepted; anything else in the list is ignored.
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

async function precacheUrls(urls) {
  const shell = await caches.open(SHELL)
  const assets = await caches.open(ASSETS)
  await Promise.all(urls.slice(0, 80).map(async (u) => {
    try {
      const url = new URL(u, self.location.origin)
      const own = url.origin === self.location.origin
      const font = FONT_HOSTS.includes(url.hostname)
      if (own && url.pathname === '/') {
        const res = await fetch(url.href)
        if (res.ok) await shell.put(url.href, res)
      } else if (font || (own && (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icon')))) {
        if (await caches.match(url.href)) return
        const res = await fetch(url.href, font ? { mode: 'no-cors' } : undefined)
        if (res.ok || res.type === 'opaque') await assets.put(url.href, res)
      }
    } catch {}
  }))
}

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'precache' || !Array.isArray(data.urls)) return
  event.waitUntil(precacheUrls(data.urls.filter((u) => typeof u === 'string')))
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(immutableStrategy(request))
    return
  }
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    // Only the home page; /admin and the rest go straight to the network.
    if (url.pathname === '/') event.respondWith(navigationStrategy(request))
    return
  }
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icon')) {
    event.respondWith(immutableStrategy(request))
  }
})
