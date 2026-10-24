// Checks that the service worker (public/sw.js) really makes every page work with no connection.
//
//     npm run build && node scripts/test-offline.mts
//
// It starts the built site, loads the worker's code with a stand-in for the browser's cache, lets the worker install
// (it saves every page by itself), then cuts the connection and asks for each page and each file the pages use.
// It also covers what went wrong once: a worker update, which clears the old copies, must leave every page saved.
// Browsers cannot be driven for this here, so the worker's own code runs against the real server's responses.
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
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
    add: async (u: string) => { m.set(keyOf(u), (await net(u)).clone()) },
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

// ── Every page of the app, found from the folders, so a page added later is checked too ──
const routes = (dir: string, base = ''): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  if (!e.isDirectory() || e.name === 'api') return []
  const here = `${base}/${e.name}`
  return [...(existsSync(`${dir}/${e.name}/page.tsx`) ? [here] : []), ...routes(`${dir}/${e.name}`, here)]
})
const PAGES = ['/', ...routes('src/app').flatMap(r => r === '/games/[game]' ? ALL_GAME_IDS.map(id => `/games/${id}`) : [r])]

// ── Load a worker; each load is a fresh worker, as after an update. The caches stay, as in a browser. ──
type Handlers = Record<string, (e: any) => void>
const SW_TEXT = readFileSync('public/sw.js', 'utf8')
function loadWorker(text = SW_TEXT) {
  const handlers: Handlers = {}
  const self: any = {
    location: { origin: ORIGIN },
    addEventListener: (t: string, fn: (e: any) => void) => { handlers[t] = fn },
    skipWaiting: () => {},
    clients: { claim: async () => {} },
  }
  vm.runInNewContext(text, { self, caches, fetch: net, Request, Response, URL, Promise, setTimeout, clearTimeout, console, encodeURI, decodeURI, Set, Date })
  return handlers
}
const settle = async (handlers: Handlers, type: string, event: Record<string, unknown> = {}) => {
  const waits: Promise<unknown>[] = []
  handlers[type]({ ...event, waitUntil: (p: Promise<unknown>) => waits.push(p) })
  await Promise.all(waits)
}
async function ask(handlers: Handlers, path: string, mode = 'navigate') {
  let answer: Promise<Response> | undefined
  const request = { url: ORIGIN + path, method: 'GET', mode }
  handlers.fetch({ request, respondWith: (p: Promise<Response>) => { answer = Promise.resolve(p) } })
  return answer ? await answer : null
}
const ASSET_RE = /(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\s\\)<>]+?\.(?:js|css|woff2?)/g

// Cuts the connection and checks every page, and every file each page names, from the saved copies.
async function checkOffline(handlers: Handlers, label: string) {
  const wasOnline = online
  online = false
  for (const p of PAGES) {
    const res = await ask(handlers, p)
    const html = res && res.ok ? await res.text() : ''
    check(html.includes('<html') && !html.includes('You are offline'), `${label}: page ${p}`)
    let missing = 0
    for (const m of html.match(ASSET_RE) || []) {
      const path = encodeURI(decodeURI(m.startsWith('/_next/') ? m : `/_next/${m}`))
      if (!(await caches.match(ORIGIN + path))) missing++
    }
    check(missing === 0, `${label}: every file ${p} names is saved (${missing} missing)`)
  }
  online = wasOnline
}

// ── 1. A first visit. The page sends nothing at all, and the worker still saves every page. ──
let sw = loadWorker()
await settle(sw, 'install')
await settle(sw, 'activate')
const shell = stores.get('ls-shell-ls-v3')!
for (const p of PAGES) check(shell.has(ORIGIN + p), `saved on install: ${p}`)
check(shell.has(ORIGIN + '/offline.html'), 'saved: the offline page')
const assets = stores.get('ls-assets-ls-v3') ?? new Map()
check(assets.size >= 10, `the scripts and styles are saved (${assets.size})`)
await checkOffline(sw, 'first visit')

// ── 2. The cause of the old bug: an update clears the old copies, and the pages must still all be saved ──
const next = SW_TEXT.replace("const VERSION = 'ls-v3'", "const VERSION = 'ls-v4'")
check(next !== SW_TEXT, 'the test can bump the version')
sw = loadWorker(next)
await settle(sw, 'install')
await settle(sw, 'activate')
check(![...stores.keys()].some(k => k.includes('ls-v3')), 'the old copies are removed after the update')
await checkOffline(sw, 'after an update')

// ── 3. An update that cannot finish (the connection drops) must not take the old copies away ──
online = false
sw = loadWorker(SW_TEXT.replace("const VERSION = 'ls-v3'", "const VERSION = 'ls-v5'"))
let installFailed = false
try { await settle(sw, 'install') } catch { installFailed = true }
online = true
check(installFailed, 'an install with no connection fails, so the old worker stays')
check(!!stores.get('ls-shell-ls-v4') && PAGES.every(p => stores.get('ls-shell-ls-v4')!.has(ORIGIN + p)), 'the old copies are untouched after a failed install')
stores.delete('ls-shell-ls-v5'); stores.delete('ls-assets-ls-v5')

// ── 4. A page that went missing is saved again when the page next loads ──
sw = loadWorker(next)
stores.get('ls-shell-ls-v4')!.delete(ORIGIN + '/games/count')
stores.get('ls-shell-ls-v4')!.delete(ORIGIN + '/parents/voice')
stores.get('ls-shell-ls-v4')!.delete(ORIGIN + '/offline.html')
await settle(sw, 'message', { data: { type: 'precache', urls: [ORIGIN + '/'] } })
await checkOffline(sw, 'after a repair')
check(stores.get('ls-shell-ls-v4')!.has(ORIGIN + '/offline.html'), 'the offline page is saved again by a repair')

// ── Other rules ──
online = false
const withQuery = await ask(sw, '/?src=pwa')
check(!!withQuery && withQuery.ok && (await withQuery.text()).includes('<html'), 'offline: the installed app opens /?src=pwa')
check((await ask(sw, '/nowhere')) === null, 'an address that is not a page is left to the network')
check((await ask(sw, '/api/ping', 'cors')) === null, 'the API is never answered from a copy')
check((await ask(sw, '/games/count').then(r => r!.text())).includes('How Many'), 'the saved game page is the right one')

stop()
if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log(`offline: ${PAGES.length} pages work with no connection on a first visit, after an update and after a repair`)
