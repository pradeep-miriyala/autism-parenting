// public/sw.js — Little Steps service worker.
//
// Scoped to the whole site. It answers the app's own pages (the front screen, each game, the stickers, About and the
// parents' pages) and the files they need from a saved copy when there is no connection; the API is never touched.
// Pages are network first, so a visit with a connection always gets the latest.
//
// The worker fills its own cache. While it installs it saves every page and the scripts they use, and the new copy
// replaces the old one only once that has worked, so an update never leaves the app half empty. The page also nudges
// the worker on each load (see PwaInstall.tsx) and anything missing is saved again then.

const VERSION = 'ls-v3'
const SHELL = `ls-shell-${VERSION}`
const ASSETS = `ls-assets-${VERSION}`
const OFFLINE_URL = '/offline.html'
const PRECACHE = [OFFLINE_URL, '/icon-192.png', '/manifest.webmanifest']
const NAV_TIMEOUT_MS = 3500
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

// The addresses that are pages of this app. Anything else (a mistyped address, the API) goes straight to the network.
const PAGE = /^\/(?:games\/[a-z]+|stickers|about|copyright|parents(?:\/[a-z]+)?)?$/

// The pages that are not games. The games are found from the links on the front page, so a new game needs no change here.
const FIXED_PAGES = ['/', '/stickers', '/about', '/copyright', '/parents', '/parents/child', '/parents/progress', '/parents/settings',
  '/parents/voice', '/parents/pictures', '/parents/family', '/parents/share', '/parents/feedback', '/parents/privacy']
const MAX_URLS = 120
const isPage = (pathname) => PAGE.test(pathname.replace(/\/+$/, '') || '/')

// A page is saved under its path alone, so /?src=pwa and / are the same copy.
const pageKey = (url) => new Request(url.origin + (url.pathname.replace(/\/+$/, '') || '/'))

// A new worker only takes over once every page and file is saved. If the network fails half way, the install fails, the
// old worker and its copies stay in charge, and the browser tries again later.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => savePages(true))
      .then(() => self.skipWaiting())
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

// Saves one file. The check looks in this version's cache only, because the old caches are deleted on activate.
async function saveAsset(assets, href, font, strict) {
  try {
    if (await assets.match(href)) return
    const res = await fetch(href, font ? { mode: 'no-cors' } : undefined)
    if (res.ok || res.type === 'opaque') await assets.put(href, res)
    else if (strict) throw new Error(`${href}: ${res.status}`)
  } catch (err) {
    if (strict) throw err
  }
}

// Saves a page and the scripts it names. Returns the page's text so its links can be followed.
async function savePage(shell, assets, url, strict) {
  const res = await fetch(url.href, { cache: 'reload' })
  if (!res.ok) {
    if (strict) throw new Error(`${url.pathname}: ${res.status}`)
    return ''
  }
  const html = await res.clone().text()
  for (const a of assetsIn(html)) await saveAsset(assets, new URL(a, self.location.origin).href, false, strict)
  await shell.put(pageKey(url), res)   // last, so a saved page always has its scripts
  return html
}

// The game pages linked from the front page.
const GAME_LINK = /href="(\/games\/[a-z]+)"/g
const gamesIn = (html) => [...new Set([...html.matchAll(GAME_LINK)].map((m) => m[1]))]

// Runs the jobs three at a time. With strict set, the first failure is thrown once the others have finished.
async function inParallel(jobs, strict) {
  let failure
  const lane = async () => {
    for (let job; (job = jobs.shift()); ) {
      try { await job() } catch (err) { if (strict && !failure) failure = err }
    }
  }
  await Promise.all([lane(), lane(), lane()])
  if (failure) throw failure
}

// Saves every page of the app that is not saved yet. With strict set (while installing), any failure is thrown.
// Otherwise this is a quiet repair, and a page that fails is tried again the next time.
async function savePages(strict) {
  const shell = await caches.open(SHELL)
  const assets = await caches.open(ASSETS)
  for (const file of PRECACHE) {
    if (!(await shell.match(file))) { try { await shell.add(file) } catch { if (strict) throw new Error(`${file} not saved`) } }
  }
  const missing = async (path) => !(await shell.match(pageKey(new URL(path, self.location.origin))))
  const save = async (path) => savePage(shell, assets, new URL(path, self.location.origin), strict)

  // The front page first, because it names the games.
  const home = await shell.match(pageKey(new URL('/', self.location.origin)))
  let homeHtml = home ? await home.text() : ''
  if (!homeHtml) homeHtml = await save('/')
  const paths = [...FIXED_PAGES.filter((p) => p !== '/'), ...gamesIn(homeHtml)].slice(0, MAX_URLS)
  const jobs = []
  for (const path of paths) {
    if (await missing(path)) jobs.push(() => save(path))
  }
  await inParallel(jobs, strict)

  // Pages that were saved before may name scripts that are gone (for example after a cleanup), so fill those in too.
  // That reads every saved page, so it is not done on every load.
  if (!strict && Date.now() - lastAssetCheck > ASSET_CHECK_EVERY_MS) {
    lastAssetCheck = Date.now()
    await repairAssets(shell, assets)
  }
}
let lastAssetCheck = 0
const ASSET_CHECK_EVERY_MS = 5 * 60 * 1000

async function repairAssets(shell, assets) {
  const jobs = []
  for (const req of await shell.keys()) {
    const res = await shell.match(req)
    if (!res || !(res.headers.get('content-type') || '').includes('html')) continue
    for (const a of assetsIn(await res.text())) jobs.push(() => saveAsset(assets, new URL(a, self.location.origin).href, false, false))
  }
  await inParallel(jobs, false)
}

// The page also hands over what it loaded itself (see PwaInstall.tsx): the fonts in particular, which are only known
// once the page is running. Only this app's pages, its static files, the icons and the fonts are accepted; anything
// else in the list is ignored.
async function precacheUrls(urls) {
  const shell = await caches.open(SHELL)
  const assets = await caches.open(ASSETS)
  const pending = urls.slice(0, MAX_URLS)
  const jobs = pending.map((u) => async () => {
    const url = new URL(u, self.location.origin)
    const own = url.origin === self.location.origin
    if (own && isPage(url.pathname)) { if (!(await shell.match(pageKey(url)))) await savePage(shell, assets, url, false) }
    else if (FONT_HOSTS.includes(url.hostname)) await saveAsset(assets, url.href, true, false)
    else if (own && (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icon'))) await saveAsset(assets, url.href, false, false)
  })
  await inParallel(jobs, false)
}

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'precache' || !Array.isArray(data.urls)) return
  event.waitUntil((async () => {
    await precacheUrls(data.urls.filter((u) => typeof u === 'string'))
    try { await savePages(false) } catch {}
  })())
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
