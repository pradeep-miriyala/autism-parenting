// Checks that the service worker (public/sw.js) really makes every page work with no connection.
//
//     npm run build && node scripts/test-offline.mts
//
// It starts the built site, loads the worker's code with a stand-in for the browser's cache, tells it to keep every
// page (as the page itself does), then cuts the connection and asks for each page and each file the pages use.
// Browsers cannot be driven for this here, so the worker's own code runs against the real server's responses.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

// gameDefs.ts cannot be imported here (it imports without file extensions), so the list is read from its text.
const ALL_GAME_IDS = [...readFileSync('src/games/gameDefs.ts', 'utf8').match(/ALL_GAME_IDS = \[([^\]]*)\]/)![1].matchAll(/'([a-z]+)'/g)].map(m => m[1])
const PORT = 3199
const ORIGIN = `http://localhost:${PORT}`
let failed = 0
const check = (ok: boolean, what: string) => { if (!ok) { failed++; console.error('FAIL', what) } }

const server = spawn('npx', ['next', 'start', '-p', String(PORT)], { stdio: 'ignore' })
const stop = () => { try { server.kill() } catch {} }
process.on('exit', stop)
for (let i = 0; ; i++) {
  try { if ((await fetch(ORIGIN)).ok) break } catch {}
  if (i > 60) { console.error('the site did not start (run npm run build first)'); process.exit(1) }
  await new Promise(r => setTimeout(r, 500))
}

// ── A stand-in for the browser's cache storage ──
const stores = new Map<string, Map<string, Response>>()
const keyOf = (r: Request | string) => (typeof r === 'string' ? new URL(r, ORIGIN).href : r.url)
const makeCache = (name: string) => {
  if (!stores.has(name)) stores.set(name, new Map())
  const m = stores.get(name)!
  return {
    put: async (r: Request | string, res: Response) => { m.set(keyOf(r), res.clone()) },
    match: async (r: Request | string) => m.get(keyOf(r))?.clone(),
    addAll: async (urls: string[]) => { for (const u of urls) m.set(keyOf(u), (await fetch(new URL(u, ORIGIN))).clone()) },
    keys: async () => [...m.keys()].map(u => new Request(u)),
  }
}
const caches = {
  open: async (n: string) => makeCache(n),
  keys: async () => [...stores.keys()],
  delete: async (n: string) => stores.delete(n),
  match: async (r: Request | string) => { for (const m of stores.values()) { const hit = m.get(keyOf(r)); if (hit) return hit.clone() } return undefined },
}

// ── The network, which can be cut ──
let online = true
const net = async (input: any, init?: any) => {
  if (!online) throw new TypeError('offline')
  const u = typeof input === 'string' ? new URL(input, ORIGIN) : new URL(input.url)
  return fetch(u, init?.mode === 'no-cors' ? undefined : init)
}

// ── Load the worker ──
const handlers: Record<string, (e: any) => void> = {}
const self: any = {
  location: { origin: ORIGIN },
  addEventListener: (t: string, fn: (e: any) => void) => { handlers[t] = fn },
  skipWaiting: () => {},
  clients: { claim: async () => {} },
}
vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), { self, caches, fetch: net, Request, Response, URL, Promise, setTimeout, clearTimeout, console, encodeURI, decodeURI, Set })
const settle = async (type: string, event: Record<string, unknown> = {}) => {
  const waits: Promise<unknown>[] = []
  handlers[type]({ ...event, waitUntil: (p: Promise<unknown>) => waits.push(p) })
  await Promise.all(waits)
}
await settle('install')
await settle('activate')

// ── What the page asks it to keep: the page itself, and every other page ──
const PAGES = ['/', '/stickers', '/about', '/parents', '/parents/child', '/parents/progress', '/parents/settings', '/parents/voice', '/parents/pictures', '/parents/share',
  '/parents/privacy', ...ALL_GAME_IDS.map(id => `/games/${id}`)]
await settle('message', { data: { type: 'precache', urls: PAGES.map(p => ORIGIN + p) } })

const shell = stores.get('ls-shell-ls-v2')!
for (const p of PAGES) check(shell.has(ORIGIN + p), `saved: ${p}`)
check(shell.has(ORIGIN + '/offline.html'), 'saved: the offline page')
const assets = stores.get('ls-assets-ls-v2') ?? new Map()
check(assets.size >= 10, `the scripts and styles are saved (${assets.size})`)

// ── Every script and style a saved page names must be there ──
const ASSET_RE = /(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\s\\)<>]+?\.(?:js|css|woff2?)/g
let missing = 0
for (const [, res] of shell) {
  const html = await res.clone().text()
  for (const m of html.match(ASSET_RE) || []) {
    const path = encodeURI(decodeURI(m.startsWith('/_next/') ? m : `/_next/${m}`))
    if (!(await caches.match(ORIGIN + path))) { missing++; console.error('  not saved:', path) }
  }
}
check(missing === 0, 'every file a saved page names is saved')

// ── Now with no connection ──
online = false
async function ask(path: string, mode = 'navigate') {
  let answer: Promise<Response> | undefined
  const request = { url: ORIGIN + path, method: 'GET', mode }
  handlers.fetch({ request, respondWith: (p: Promise<Response>) => { answer = Promise.resolve(p) } })
  return answer ? await answer : null
}
for (const p of PAGES) {
  const res = await ask(p)
  check(!!res && res.ok && (await res.text()).includes('<html'), `offline page: ${p}`)
}
const withQuery = await ask('/?src=pwa')
check(!!withQuery && withQuery.ok && (await withQuery.text()).includes('<html'), 'offline: the installed app opens /?src=pwa')
const unknown = await ask('/nowhere')
check(unknown === null, 'an address that is not a page is left to the network')
const api = await ask('/api/ping', 'cors')
check(api === null, 'the API is never answered from a copy')
const lost = await ask('/games/count').then(r => r!.text())
check(lost.includes('How Many'), 'the saved game page is the right one')

stop()
if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log(`offline: ${PAGES.length} pages and ${assets.size} files work with no connection`)
