// public/sw.js — Little Steps service worker.
//
// Scoped to the whole site. It answers the app's own pages (the front screen, each game, the stickers, About and the
// parents' pages) and the files they need from a saved copy when there is no connection; the API is never touched.
// Pages are network first, so a visit with a connection always gets the latest. One visit is enough to be able to
// play offline: the page hands over the list of pages, and the worker saves each one and the scripts it uses.

const VERSION = 'ls-v2'
const SHELL = `ls-shell-${VERSION}`
const ASSETS = `ls-assets-${VERSION}`
const OFFLINE_URL = '/offline.html'
const PRECACHE = [OFFLINE_URL, '/icon-192.png', '/manifest.webmanifest']
const NAV_TIMEOUT_MS = 3500
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

// The addresses that are pages of this app. Anything else (a mistyped address, the API) goes straight to the network.
const PAGE = /^\/(?:games\/[a-z]+|stickers|about|parents(?:\/[a-z]+)?)?$/
const isPage = (pathname) => PAGE.test(pathname.replace(/\/+$/, '') || '/')

// A page is saved under its path alone, so /?src=pwa and / are the same copy.
const pageKey = (url) => new Request(url.origin + (url.pathname.replace(/\/+$/, '') || '/'))

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

// Network first, but give up on a slow network rather than leaving a white screen; the last good copy of the page
// is shown only once the network fails.
async function navigationStrategy(request, url) {
  const cache = await caches.open(SHELL)
  const key = pageKey(url)
  try {
    const network = fetch(request)
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('slow network')), NAV_TIMEOUT_MS)
    )
    const response = await Promise.race([network, timeout])
    if (response && response.ok) cache.put(key, response.clone())
    return response
  } catch {
    return (await cache.match(key)) || (await cache.match(OFFLINE_URL))
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

// The scripts and styles a saved page needs: they are named in the page itself, either as /_next/static/... or, in the
// data Next embeds, as static/... relative to /_next/.
const ASSET_RE = /(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\s\\)<>]+?\.(?:js|css|woff2?)/g
function assetsIn(html) {
  const found = new Set()
  for (const m of html.match(ASSET_RE) || []) {
    const path = m.startsWith('/_next/') ? m : `/_next/${m}`
    try { found.add(encodeURI(decodeURI(path))) } catch {}
  }
  return [...found]
}

async function saveAsset(assets, href, font) {
  try {
    if (await caches.match(href)) return
    const res = await fetch(href, font ? { mode: 'no-cors' } : undefined)
    if (res.ok || res.type === 'opaque') await assets.put(href, res)
  } catch {}
}

async function savePage(shell, assets, url) {
  const res = await fetch(url.href)
  if (!res.ok) return
  const html = await res.clone().text()
  await shell.put(pageKey(url), res)
  for (const a of assetsIn(html)) await saveAsset(assets, new URL(a, self.location.origin).href, false)
}

// The page tells the worker what to keep (see PwaInstall.tsx), because on a first visit the worker starts too late to
// see those requests go by. Only this app's pages, its static files, the icons and the fonts are accepted; anything
// else in the list is ignored.
async function precacheUrls(urls) {
  const shell = await caches.open(SHELL)
  const assets = await caches.open(ASSETS)
  let pending = urls.slice(0, 120)
  const worker = async () => {
    for (let u; (u = pending.shift()); ) {
      try {
        const url = new URL(u, self.location.origin)
        const own = url.origin === self.location.origin
        if (own && isPage(url.pathname)) await savePage(shell, assets, url)
        else if (FONT_HOSTS.includes(url.hostname)) await saveAsset(assets, url.href, true)
        else if (own && (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icon'))) await saveAsset(assets, url.href, false)
      } catch {}
    }
  }
  await Promise.all([worker(), worker(), worker()])
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

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(immutableStrategy(request))
    return
  }
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    if (isPage(url.pathname)) event.respondWith(navigationStrategy(request, url))
    return
  }
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icon')) {
    event.respondWith(immutableStrategy(request))
  }
})
