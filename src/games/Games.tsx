'use client'
// Calm practice games: choose Number Steps or Spelling Bees, look at the target,
// tap the same symbols in order. No timers, no scores. A wrong tap gets a soft
// buzz and a short shake; nothing the child has already got right is lost.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ALL_GAME_IDS, GAMES, GAME_GROUPS, GAME_SETTINGS, GAME_TILES, LETTER_CASES, WORD_TYPES, isGameId, keyboardRows, type GameId, type KeyGameId, type WordType } from './gameDefs'
import { THEMES, type ThemeId } from './spot/generate'
import SpotGame from './SpotGame'
import TraceGame, { type TraceMode } from './TraceGame'
import MatchGame from './MatchGame'
import HabitsGame from './HabitsGame'
import CountGame from './CountGame'
import PatternGame from './PatternGame'
import SortGame from './SortGame'
import OddGame from './OddGame'
import PuzzleGame from './PuzzleGame'
import DotsGame from './DotsGame'
import { WORD_SETS, type MatchSet } from './match/generate'
import { ageBand, forgetShared, newShareId, useStats } from './stats'
import { allCharacters, type LetterCase } from './trace/letters'
import InfoButton from './InfoButton'
import HoldToUnlock from './HoldToUnlock'
import VoiceSettings from './VoiceSettings'
import { loadClips, setEnabled as setRecordingsEnabled, unlockOnGesture } from './voice/player'
import { EMPTY_PROGRESS, STICKERS, cleanProgress, recordRound, summarise, type GameKey, type Progress } from './progress'
import { AlbumIcon, GearIcon, LandscapeIcon, PlayIcon, PortraitIcon, SpeakerIcon } from './icons'
import { SprinklesLayer, useSprinkles } from './sprinkles'
import { useFeedback } from './feedback'
import { useStuck } from './useStuck'
import {
  AGES, COLOURS, EMPTY_PROFILE, ageLabel, celebration, cleanName, isYoung,
  detectPlatform, sprinklePalette, startingLengths, type ColourId, type Platform, type Profile,
} from './profile'

const STORE = 'parentingGames.v1'

/** Matching a word to its picture: things, animals and colours. */
const WORD_SET_CHIPS: { id: (typeof WORD_SETS)[number]; label: string; short: string; icon: string }[] = [
  { id: 'words-objects', label: 'Words and things', short: 'Things', icon: '📖' },
  { id: 'words-animals', label: 'Words and animals', short: 'Animals', icon: '🐾' },
  { id: 'words-colours', label: 'Words and colours', short: 'Colours', icon: '🎨' },
]
const PROGRESS_STORE = 'parentingProgress.v1'   // rounds finished and stickers: this device only

// How long a child may pause before the next key glows. 0 turns hints off.
const HINT_CHOICES = [0, 6, 10, 15, 20]
const DEFAULT_HINT_SEC = 10

/** Each game keeps its own length; they are all set together in the settings panel. */
/** The sliders in the settings: one per game that has a screen. */
const LENGTH_ROWS = GAME_TILES.map(t => ({ id: t.id, ...GAME_SETTINGS[t.id] }))
const DEFAULT_LENGTHS = Object.fromEntries(ALL_GAME_IDS.map(id => [id, GAME_SETTINGS[id].def])) as Record<GameId, number>

export default function Games({ parentIntro }: { parentIntro?: React.ReactNode }) {
  const [gameId, setGameId] = useState<GameId>('numbers')
  const [lengths, setLengths] = useState<Record<GameId, number>>(DEFAULT_LENGTHS)
  const [spotTheme, setSpotTheme] = useState<ThemeId>('farm')
  const [matchSet, setMatchSet] = useState<MatchSet>('farm')
  // Where the letters-and-numbers order has got to, per case and level; see TraceGame.
  const [letterPos, setLetterPos] = useState<Record<string, string>>({})
  const letterPosRef = useRef<Record<string, string>>({})
  const [traceMode, setTraceMode] = useState<TraceMode>('trace')
  const [letterCase, setLetterCase] = useState<LetterCase>('upper')
  const [wordType, setWordType] = useState<WordType>('nouns')
  const [sound, setSound] = useState(false)
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE)
  const [setupOpen, setSetupOpen] = useState(false)
  const [setupSeen, setSetupSeen] = useState(false)
  const [sprinklesOn, setSprinklesOn] = useState(true)
  // Play mode: only the game is on screen. Switching games and the settings sit behind a press-and-hold lock.
  const [playMode, setPlayMode] = useState(false)
  // The front screen is a grid of game tiles; a game is opened from it. Play mode stays inside one game.
  const [home, setHome] = useState(true)
  // Counting visits is anonymous and can be switched off. Sharing the child's first name is off until
  // a parent turns it on; the random id lets turning it off delete the name again.
  const [shareCounts, setShareCounts] = useState(true)
  const [shareName, setShareName] = useState(false)
  const [shareId, setShareId] = useState('')
  // The parent's own recorded congratulations (see VoiceSettings): played in place of the computer voice.
  const [useRecordings, setUseRecordings] = useState(true)
  const [roundActive, setRoundActive] = useState(false) // Spot / Trace report a round under way
  const confirmRef = useRef<HTMLDialogElement>(null)
  const albumRef = useRef<HTMLDialogElement>(null)
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS)
  const progressRef = useRef<Progress>(EMPTY_PROGRESS)
  const progressLoaded = useRef(false)
  const [newSticker, setNewSticker] = useState<number | null>(null)
  const stickerTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [clearAsked, setClearAsked] = useState(false)
  const fx = useSprinkles()
  const [target, setTarget] = useState<string[]>([])
  const [picture, setPicture] = useState<string | undefined>()
  const [spoken, setSpoken] = useState('')
  const [entered, setEntered] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [shake, setShake] = useState(0)
  const [misses, setMisses] = useState(0) // wrong taps in a row on this symbol
  const [hintSec, setHintSec] = useState(DEFAULT_HINT_SEC)
  const [done, setDone] = useState(false)
  const [compact, setCompact] = useState(false) // a phone held sideways
  const [platform, setPlatform] = useState<Platform>('other')
  const [fine, setFine] = useState(false) // a mouse/trackpad is present, so probably a real keyboard too
  const [flashKey, setFlashKey] = useState('')
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pressRef = useRef<(k: string) => void>(() => {})
  const [rows, setRows] = useState(GAMES.spelling.rows!)
  const [toast, setToast] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const loaded = useRef(false)

  // Spot the Differences has no keys; the key-based code below uses these definitions.
  const isKeyGame = gameId === 'numbers' || gameId === 'spelling'
  const keyId: KeyGameId = isKeyGame ? gameId : 'numbers'
  const game = GAMES[keyId]
  const gameIdRef = useRef(gameId)
  gameIdRef.current = gameId
  const length = lengths[gameId]

  const start = useCallback((id: KeyGameId, len: number, type: WordType) => {
    const r = GAMES[id].makeRound(len, type)
    setTarget(r.target)
    setPicture(r.picture)
    setSpoken(r.spoken)
    setEntered([])
    setDone(false)
    fx.clear()
    setMessage('')
    setShake(0)
    setMisses(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let id: GameId = 'numbers'
    let type: WordType = 'nouns'
    let seen = false
    let play = false
    let resume: GameId | null = null   // a reload during a game goes back to that game, not to the tiles
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      const open = sessionStorage.getItem('sqOpenGame')
      if (nav?.type === 'reload' && isGameId(open)) resume = open
    } catch {}
    const lens: Record<GameId, number> = { ...DEFAULT_LENGTHS }
    let tmode: TraceMode = 'trace'
    let lcase: LetterCase = 'upper'
    let theme: ThemeId = 'farm'
    let mset: MatchSet = 'farm'
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || '{}')
      if (isGameId(s.game)) id = s.game
      for (const gid of ALL_GAME_IDS) {
        const n = s.lengths?.[gid], st = GAME_SETTINGS[gid]
        if (Number.isInteger(n) && n >= st.min && n <= st.max) lens[gid] = n
      }
      if (LETTER_CASES.some(c => c.id === s.letterCase)) lcase = s.letterCase
      if (THEMES.some(t => t.id === s.spotTheme)) theme = s.spotTheme
      if (s.matchSet === 'letters' || (WORD_SETS as readonly string[]).includes(s.matchSet) || THEMES.some(t => t.id === s.matchSet)) mset = s.matchSet
      if (s.letterPos && typeof s.letterPos === 'object') {
        const valid = new Set(allCharacters())
        const pos: Record<string, string> = {}
        for (const [k, v] of Object.entries(s.letterPos)) if (/^(upper|lower|both|numbers)$/.test(k) && typeof v === 'string' && valid.has(v)) pos[k] = v
        letterPosRef.current = pos
        setLetterPos(pos)
      }
      if (s.traceMode === 'trace' || s.traceMode === 'trace-copy') tmode = s.traceMode
      if (WORD_TYPES.some(w => w.id === s.wordType)) type = s.wordType
      if (typeof s.sound === 'boolean') setSound(s.sound)
      if (typeof s.sprinkles === 'boolean') setSprinklesOn(s.sprinkles)
      if (s.playMode === true) { setPlayMode(true); play = true }
      if (typeof s.shareCounts === 'boolean') setShareCounts(s.shareCounts)
      if (typeof s.useRecordings === 'boolean') setUseRecordings(s.useRecordings)
      if (s.shareName === true && typeof s.shareId === 'string' && /^[A-Za-z0-9_-]{12,40}$/.test(s.shareId)) { setShareName(true); setShareId(s.shareId) }
      if (HINT_CHOICES.includes(s.hintSec)) setHintSec(s.hintSec)
      const pr = s.profile
      if (pr && typeof pr === 'object') {
        setProfile({
          name: cleanName(String(pr.name ?? '')).trim(),
          say: cleanName(String(pr.say ?? '')).trim(),
          age: AGES.includes(pr.age) ? pr.age : null,
          colour: COLOURS.some(c => c.id === pr.colour) ? pr.colour : 'mix',
        })
        if (pr.name) seen = true
      }
      if (s.setupSeen) seen = true
    } catch {}
    // First visit: open the setup so a parent can fill it in before the game.
    setSetupSeen(seen)
    setSetupOpen(!seen)
    if (resume && !play) id = resume
    if (play || resume) { setHome(false); try { history.pushState({ sqGame: id }, '') } catch {} }
    setGameId(id)
    setWordType(type)
    setSpotTheme(theme)
    setMatchSet(mset)
    setTraceMode(tmode)
    setLetterCase(lcase)
    setLengths(lens)
    const kid: KeyGameId = id === 'numbers' || id === 'spelling' ? id : 'numbers'
    start(kid, lens[kid], type)
    loaded.current = true
  }, [start])

  useEffect(() => {
    try {
      const p = cleanProgress(JSON.parse(localStorage.getItem(PROGRESS_STORE) || 'null'))
      progressRef.current = p
      setProgress(p)
    } catch {}
    progressLoaded.current = true
    return () => clearTimeout(stickerTimer.current)
  }, [])
  useEffect(() => {
    if (!progressLoaded.current) return
    try { localStorage.setItem(PROGRESS_STORE, JSON.stringify(progress)) } catch {}
  }, [progress])

  // In a sideways phone the choices are a row that slides; keep the chosen one in view.
  useEffect(() => {
    if (!compact || home) return
    document.querySelector('.sq-types.wrap .sq-type.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [compact, home, matchSet, gameId])

  // The recordings are read at start-up, and the audio engine is woken by the first touch.
  useEffect(() => { unlockOnGesture(); loadClips() }, [])
  useEffect(() => { setRecordingsEnabled(useRecordings) }, [useRecordings])

  // Remember which game is open for the length of this tab, so an accidental reload can go back to it.
  useEffect(() => {
    try {
      if (home) sessionStorage.removeItem('sqOpenGame')
      else sessionStorage.setItem('sqOpenGame', gameId)
    } catch {}
  }, [home, gameId])

  useEffect(() => {
    if (!loaded.current) return
    try { localStorage.setItem(STORE, JSON.stringify({ game: gameId, wordType, spotTheme, matchSet, letterPos, traceMode, letterCase, lengths, sound, sprinkles: sprinklesOn, hintSec, profile, setupSeen, playMode, shareCounts, shareName, shareId: shareName ? shareId : '', useRecordings })) } catch {}
  }, [gameId, wordType, spotTheme, matchSet, letterPos, traceMode, letterCase, lengths, sound, sprinklesOn, hintSec, profile, setupSeen, playMode, shareCounts, shareName, shareId, useRecordings])

  // Match the keyboard to the visitor's language once we are in the browser.
  useEffect(() => { setRows(keyboardRows(navigator.language)) }, [])
  useEffect(() => { setPlatform(detectPlatform()) }, [])
  useEffect(() => { setFine(window.matchMedia('(pointer: fine)').matches) }, [])

  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape) and (max-height: 520px)')
    const on = () => setCompact(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // Landscape is offered for every game; give the screen back when leaving it.
  const releaseOrientation = useCallback(() => {
    try { (screen.orientation as any)?.unlock?.() } catch {}
    try { if (document.fullscreenElement) document.exitFullscreen() } catch {}
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // The settings panel is a real modal dialog: it traps focus, closes on Esc, and
  // the dialog itself is the only record of whether it is open.
  const openSettings = () => { const d = dialogRef.current; if (d && !d.open) d.showModal() }
  const closeSettings = () => dialogRef.current?.close()
  useEffect(() => releaseOrientation, [releaseOrientation])

  // Stuck? Two wrong taps in a row, or a pause, makes the next key glow. Any tap
  // starts the wait again, and the game never gives the answer any other way.
  const hint = useStuck(!done && target.length > 0 && isKeyGame, hintSec, misses,
    `${target.join('')}:${entered.length}:${shake}`)

  function showToast(text: string) {
    setToast(text)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 4000)
  }

  // One landscape control for every game. Browsers only allow a page to lock
  // orientation in fullscreen or as an installed app, and iPhone Safari not at
  // all. Try, and if refused, say what to do by hand. The layout itself follows
  // how the phone is actually held, so it works either way.
  async function toggleRotate() {
    if (compact) {
      releaseOrientation()
      showToast('Turn your phone upright to go back.')
      return
    }
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
      await (screen.orientation as any).lock('landscape')
    } catch {
      try { if (document.fullscreenElement) await document.exitFullscreen() } catch {}
      showToast('Turn your phone sideways for a wider view.')
    }
  }

  const { say, praise, chime, ding, buzz } = useFeedback(sound)
  const statsRound = useRef<(g: string) => void>(() => {})

  function press(k: string) {
    if (done || !k) return
    if (k === target[entered.length]) {
      const next = [...entered, k]
      setEntered(next)
      setMessage('')
      setShake(0) // a wrong tap must not leave the next box shaking
      setMisses(0)
      ding() // every right choice gets the sparkle, with sound on or off
      if (next.length === target.length) {
        const c = celebration(profile)
        setDone(true)
        finishRound(keyId)
        if (sprinklesOn) fx.burst(sprinklePalette(profile.colour), isYoung(profile.age))
        setMessage(c.shown)
        // The last symbol is announced like any other; the chime and the
        // message then follow it instead of cutting it off.
        say(game.say(k))
        praise(c.spoken, true)
        setTimeout(chime, 800)
      } else {
        say(game.say(k))
      }
    } else {
      buzz()
      setShake(n => n + 1)
      setMisses(m => m + 1)
    }
  }

  pressRef.current = press

  // A round was finished: count it, and show the sticker it earned (if the album has room).
  const finishRound = useCallback((id: GameKey) => {
    statsRound.current(id)
    const r = recordRound(progressRef.current, id, new Date(), Math.random)
    progressRef.current = r.progress
    setProgress(r.progress)
    clearTimeout(stickerTimer.current)
    setNewSticker(r.sticker)
    if (r.sticker !== null) stickerTimer.current = setTimeout(() => setNewSticker(null), 5000)
  }, [])
  const finishSpot = useCallback(() => finishRound('spot'), [finishRound])
  const finishTrace = useCallback(() => finishRound('trace'), [finishRound])
  const finishLetters = useCallback(() => finishRound('letters'), [finishRound])
  const finishMatch = useCallback(() => finishRound('match'), [finishRound])
  const finishHabits = useCallback(() => finishRound('habits'), [finishRound])
  const finishCount = useCallback(() => finishRound('count'), [finishRound])
  const finishPattern = useCallback(() => finishRound('pattern'), [finishRound])
  const finishSort = useCallback(() => finishRound('sort'), [finishRound])
  const finishOdd = useCallback(() => finishRound('odd'), [finishRound])
  const finishPuzzle = useCallback(() => finishRound('puzzle'), [finishRound])
  const finishDots = useCallback(() => finishRound('dots'), [finishRound])

  // Typing on a real keyboard plays the game too. It reads the character that was
  // typed, not the key's position, so AZERTY, QWERTZ and any other layout work
  // without extra code. Typing in the parent's name box is left alone.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.closest?.('dialog'))) return
      if (!['numbers', 'spelling'].includes(gameIdRef.current)) return
      const spelling = gameIdRef.current === 'spelling'
      const k = spelling
        ? (/^[a-z]$/i.test(e.key) ? e.key.toUpperCase() : '')
        : (/^[0-9]$/.test(e.key) ? e.key : '')
      if (!k) return
      setFlashKey(k)
      clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setFlashKey(''), 160)
      pressRef.current(k)
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(flashTimer.current) }
  }, [])

  function switchTo(id: GameId) {
    setGameId(id)
    if (id === 'numbers' || id === 'spelling') start(id, lengths[id], wordType)
  }

  // A round under way: in the key games, something has been entered; the others say so themselves.
  const inProgress = isKeyGame ? !done && entered.length > 0 : roundActive

  // The phone's Back button goes from a game back to the tiles, and does nothing in play mode.
  const homeRef = useRef(home)
  homeRef.current = home
  const playRef = useRef(playMode)
  playRef.current = playMode
  const progressRoundRef = useRef(false)
  progressRoundRef.current = inProgress
  const leaving = useRef(false)

  function openGame(id: GameId) {
    switchTo(id)
    setHome(false)
    try { history.pushState({ sqGame: id }, '') } catch {}
  }

  function goHome() {
    setHome(true)
    if (history.state?.sqGame) { leaving.current = true; history.back() }
  }

  // "Games" button: a round under way asks first.
  function askHome() {
    if (inProgress) {
      const d = confirmRef.current
      if (d && !d.open) d.showModal()
      return
    }
    goHome()
  }

  function answerLeave(go: boolean) {
    confirmRef.current?.close()
    if (go) goHome()
  }

  useEffect(() => {
    try { if (history.state?.sqGame) history.replaceState(null, '') } catch {}
    function onPop() {
      if (leaving.current) { leaving.current = false; return }
      if (homeRef.current) return
      if (playRef.current || progressRoundRef.current) {
        // Stay where we are: play mode is locked, and a round under way asks first.
        try { history.pushState({ sqGame: gameIdRef.current }, '') } catch {}
        if (!playRef.current) { const d = confirmRef.current; if (d && !d.open) d.showModal() }
        return
      }
      setHome(true)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const openAlbum = () => { const d = albumRef.current; if (d && !d.open) { setNewSticker(null); d.showModal() } }
  const closeAlbum = () => albumRef.current?.close()

  function clearProgress() {
    if (!clearAsked) { setClearAsked(true); return }
    setClearAsked(false)
    progressRef.current = EMPTY_PROGRESS
    setProgress(EMPTY_PROGRESS)
    setNewSticker(null)
  }

  const rememberLetter = useCallback((key: string, ch: string) => {
    if (letterPosRef.current[key] === ch) return
    letterPosRef.current = { ...letterPosRef.current, [key]: ch }
    setLetterPos(letterPosRef.current)
  }, [])

  function restartLetterOrder() {
    letterPosRef.current = {}
    setLetterPos({})
    showToast('Letters and numbers will start again from the first one.')
  }

  function startPlayMode() {
    closeSettings()
    setSetupOpen(false)
    setSetupSeen(true)
    setPlayMode(true)
    showToast('Play mode is on. To leave it, press and hold the lock.')
  }

  function editProfile(patch: Partial<Profile>) {
    setProfile(p => ({ ...p, ...patch }))
  }

  // Setting the age for the first time suggests a starting length; a parent can
  // still move the slider, and the game never changes it again by itself.
  function chooseAge(raw: string) {
    const age = raw === '' ? null : Number(raw)
    const first = profile.age === null && age !== null
    editProfile({ age })
    if (first) {
      const l = startingLengths(age!)
      setLengths(l)
      if (isKeyGame) start(keyId, l[keyId], wordType)
    }
  }

  function changeLength(id: GameId, n: number) {
    setLengths(l => ({ ...l, [id]: n }))
    if (id === gameId && (id === 'numbers' || id === 'spelling')) start(id, n, wordType)
  }

  function forgetChild() {
    setProfile(EMPTY_PROFILE)
    stopSharing()
  }

  // Sharing the name is a parent's choice, and undoing it deletes what was shared.
  function startSharing() {
    setShareId(newShareId())
    setShareName(true)
  }
  function stopSharing() {
    if (shareName && shareId) forgetShared(shareId)
    setShareName(false)
    setShareId('')
  }
  function changeCounting(on: boolean) {
    setShareCounts(on)
    if (!on) stopSharing()
  }

  function toggleSetup(open: boolean) {
    setSetupOpen(open)
    if (!open) setSetupSeen(true)
  }

  function chooseType(t: WordType) {
    if (t === wordType) return
    setWordType(t)
    start('spelling', lengths.spelling, t)
  }

  const rotateButton = (cls: string) => (
    <button type="button" className={`sq-icon ${cls}`} onClick={toggleRotate}
      aria-label={compact ? 'Portrait view' : 'Landscape view'}>
      {compact ? <PortraitIcon /> : <LandscapeIcon />}
    </button>
  )

  // The way into play mode, in the spot the lock takes over once it is on. On the tiles there is
  // no game to lock the child into yet, so it says what to do instead of doing nothing.
  const playButton = (cls: string) => (
    <button type="button" className={`sq-icon sq-play ${cls}${home ? ' faded' : ''}`}
      aria-label="Start play mode: lock the screen to this game for your child" title="Play mode"
      onClick={() => { if (home) showToast('Open a game first, then tap this button to start play mode.'); else startPlayMode() }}>
      <PlayIcon />
    </button>
  )

  const albumButton = (cls: string) => (
    <button type="button" className={`sq-icon ${cls}`} onClick={openAlbum} aria-label="My stickers"
      aria-haspopup="dialog">
      <AlbumIcon />
    </button>
  )

  const gearButton = (cls: string) => (
    <button type="button" className={`sq-icon ${cls}`} onClick={openSettings} aria-label="Game settings"
      aria-haspopup="dialog">
      <GearIcon />
    </button>
  )

  const atHome = home && !playMode

  // Pulling the page down must not refresh it once a game is open (or play mode is on): a child's
  // drawing or drag that drifts upwards would throw the round away. Chrome and Android honour the CSS
  // switch; iPhone Safari does not, so a pull down from the top of the page is also stopped by hand.
  // The settings dialogs scroll on their own and are left alone.
  const holdPage = !atHome
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

  // The name goes a moment after the parent stops typing, not letter by letter; erasing it deletes it.
  const [nameToShare, setNameToShare] = useState('')
  const hadName = useRef(false)
  useEffect(() => {
    const t = setTimeout(() => setNameToShare(profile.name.trim()), 1500)
    return () => clearTimeout(t)
  }, [profile.name])
  useEffect(() => {
    if (nameToShare) { hadName.current = true; return }
    if (hadName.current && shareName && shareId) { hadName.current = false; forgetShared(shareId) }
  }, [nameToShare, shareName, shareId])
  const sharing = shareCounts && shareName && shareId && nameToShare
    ? { id: shareId, name: nameToShare, age: ageBand(profile.age) } : null
  statsRound.current = useStats({ enabled: shareCounts, game: home ? 'home' : gameId, share: sharing }).round

  return (
    <div className={`sq-wrap${playMode ? ' playmode' : ''}${atHome ? ' home' : ''}${!atHome && gameId === 'spelling' ? ' spelling' : ''}${!atHome && gameId === 'spot' ? ' spot' : ''}${!atHome && (gameId === 'trace' || gameId === 'letters') ? ' trace' : ''}${!atHome && gameId === 'numbers' ? ' numbers' : ''}${!atHome && gameId === 'match' ? ' match' : ''}${!atHome && gameId === 'habits' ? ' habits' : ''}${!atHome && ['count', 'pattern', 'sort', 'odd', 'puzzle', 'dots'].includes(gameId) ? ` th ${gameId}` : ''}`}>
      {/* The bar and the two icons share one row; what the bar opens drops below at full width. */}
      {playMode ? (
        <div className="sq-playbar">
          {albumButton('sq-album-btn')}
          {rotateButton('sq-rotate sq-rotate-play')}
          <HoldToUnlock onUnlock={() => { setPlayMode(false); showToast('Play mode is off.') }} />
        </div>
      ) : (
      <div className="sq-toprow">
        <button type="button" className="sq-parent-bar" aria-expanded={setupOpen} aria-controls="sq-parent-body"
          onClick={() => toggleSetup(!setupOpen)}>
          <span aria-hidden="true">{setupOpen ? '▾' : '▸'}</span>
          For parents{profile.name.trim() ? ` · ${profile.name.trim()}` : ''}
        </button>
        {albumButton('sq-album-btn')}
        {gearButton('sq-gear')}
        {rotateButton('sq-rotate')}
        {playButton('sq-play-btn')}
      </div>
      )}

      <div id="sq-parent-body" className="sq-parent sq-setup" hidden={!setupOpen || playMode}>

        {parentIntro && <div className="sq-ph">{parentIntro}</div>}

        <p className="sq-note">
          Optional. Hearing their own name can be encouraging. These details stay on this phone or
          computer, and are never sent anywhere unless you choose to share them (see Privacy in the
          settings, the gear). To show how many people use these games, visits and finished rounds are
          counted anonymously: no name, no address, nothing that identifies you or your child. You can
          switch that off in the same place.
        </p>

        <div className="sq-field">
          <label htmlFor="sq-name">Child’s name</label>
          <div className="sq-fieldrow">
            <input id="sq-name" type="text" autoComplete="off" maxLength={24} value={profile.name}
              onChange={e => editProfile({ name: cleanName(e.target.value) })} placeholder="e.g. Aarav" />
            <button type="button" className="sq-icon" aria-label="Hear the name" disabled={!profile.name.trim()}
              onClick={() => say(`Well done, ${profile.say.trim() || profile.name.trim()}.`, true)}>
              <SpeakerIcon />
            </button>
          </div>
        </div>
        {profile.name && (
          <div className="sq-field">
            <label htmlFor="sq-say">Say it like (optional)</label>
            <input id="sq-say" type="text" autoComplete="off" maxLength={24} value={profile.say}
              onChange={e => editProfile({ say: cleanName(e.target.value) })}
              placeholder="spell it as it sounds, if the voice gets it wrong" />
          </div>
        )}
        {profile.name && !sound && (
          <p className="sq-note">Turn the sound on in the settings (the gear) so they can hear it.</p>
        )}

        <div className="sq-field">
          <label htmlFor="sq-age">Age</label>
          <select id="sq-age" value={profile.age ?? ''} onChange={e => chooseAge(e.target.value)}>
            <option value="">Not set</option>
            {AGES.map(a => <option key={a} value={a}>{ageLabel(a)}</option>)}
          </select>
        </div>

        <div className="sq-field">
          <span className="sq-flabel">Favourite colour for the sprinkles</span>
          <div className="sq-swatches">
            {COLOURS.map(c => (
              <button key={c.id} type="button" aria-pressed={profile.colour === c.id} aria-label={c.label}
                className={`sq-swatch${profile.colour === c.id ? ' on' : ''}`}
                style={c.hex ? { background: c.hex } : undefined}
                onClick={() => editProfile({ colour: c.id as ColourId })}>
                {c.hex ? '' : 'Mix'}
              </button>
            ))}
          </div>
        </div>

        {(profile.name.trim() || profile.age !== null || profile.colour !== 'mix') && (
          <button type="button" className="sq-btn" onClick={forgetChild}>Forget my child’s details</button>
        )}
      </div>

      <dialog ref={dialogRef} className="sq-dialog" aria-labelledby="sq-dialog-title"
        onClick={e => { if (e.target === e.currentTarget) closeSettings() }}>
        <div className="sq-dialog-head">
          <h2 id="sq-dialog-title">Game settings</h2>
          <button type="button" className="sq-btn primary" onClick={closeSettings}>Done</button>
        </div>

        <div className="sq-playbox">
          <h3 className="sq-subhead">Play mode</h3>
          <p className="sq-note">
            To hand the screen to your child, open a game and tap the round blue <strong>▶</strong> button
            at the top, in the row with this settings button. Only the game stays on screen: no games
            menu, no settings, no site navigation. To leave, press and hold the lock in the same
            place for a few seconds.
          </p>
        </div>

        <hr className="sq-rule" />

        <ProgressPanel progress={progress} name={profile.name.trim()} clearAsked={clearAsked}
          onClear={clearProgress} onCancelClear={() => setClearAsked(false)} />

        <hr className="sq-rule" />

        <label className="sq-inline">
          <input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} />
          <span>Sound: say numbers, letters and praise aloud, and play the end-of-round chime</span>
        </label>
        <p className="sq-note">The speaker next to a number or word always plays it when tapped. The small sparkle for a right choice and the soft buzz for a wrong one always sound.</p>

        <hr className="sq-rule" />

        {LENGTH_ROWS.map(r => (
          <label key={r.id} className="sq-inline sq-len">
            <span>{r.label}: <strong>{lengths[r.id]}</strong></span>
            <input type="range" min={r.min} max={r.max} value={lengths[r.id]}
              onChange={e => changeLength(r.id, Number(e.target.value))} />
            {r.note && <small>{r.note}</small>}
          </label>
        ))}
        <label className="sq-inline">
          <span>Tracing (lines, letters and numbers): steps</span>
          <select value={traceMode} onChange={e => setTraceMode(e.target.value as TraceMode)}>
            <option value="trace">Trace it</option>
            <option value="trace-copy">Trace it, then draw it yourself</option>
          </select>
        </label>
        <p className="sq-note">
          Letters and numbers always come in order, as children learn them (A to Z, a to z, 0 to 9; a capital then its small
          form when both are shown), and carry on where they left off. The level is how much of each to trace: the start
          of it, most of it, or all of it. The whole letter is always shown faintly.
        </p>
        <button type="button" className="sq-btn" onClick={restartLetterOrder}>Start the order again</button>
        <p className="sq-note">The game never changes these by itself. There is no timer and no score.</p>

        <hr className="sq-rule" />

        <label className="sq-inline">
          <span>If my child is stuck, give a hint after</span>
          <select value={hintSec} onChange={e => setHintSec(Number(e.target.value))}>
            {HINT_CHOICES.map(n => <option key={n} value={n}>{n === 0 ? 'Never' : `${n} seconds`}</option>)}
          </select>
        </label>
        <label className="sq-inline">
          <input type="checkbox" checked={sprinklesOn} onChange={e => setSprinklesOn(e.target.checked)} />
          <span>Sprinkles when a round is finished</span>
        </label>
        <hr className="sq-rule" />

        <VoiceSettings useRecordings={useRecordings} onUseRecordings={setUseRecordings} />

        <hr className="sq-rule" />

        <section aria-labelledby="sq-priv-title">
          <h3 id="sq-priv-title" className="sq-subhead">Privacy</h3>
          <p className="sq-note">Your child’s rounds, stickers, details and any voice recordings you make stay on this phone or computer.</p>
          <label className="sq-inline">
            <input type="checkbox" checked={shareCounts} onChange={e => changeCounting(e.target.checked)} />
            <span>Count our visits anonymously, to show how many people use these games</span>
          </label>
          <p className="sq-note">
            Only which game is open and how many rounds are finished. No name, no address, no cookie and
            nothing that identifies you or your child. Nothing is counted if your browser says Do Not Track.
          </p>
          <label className="sq-inline">
            <input type="checkbox" checked={shareName} disabled={!shareCounts || (!shareName && !profile.name.trim())}
              onChange={e => (e.target.checked ? startSharing() : stopSharing())} />
            <span>Also share my child’s first name and age group with the developer</span>
          </label>
          <p className="sq-note">
            Optional, and off unless you turn it on. It helps to see which games children enjoy and at what
            age. Switching it off deletes what was shared.
            {!shareName && !profile.name.trim() ? ' Add your child’s name under For parents first.' : ''}
          </p>
        </section>

        {platform === 'android' && (
          <p className="sq-tip">
            Tip: if your device has “Remove animations” turned on, the wrong-tap shake becomes a colour
            flash and the sprinkles fade instead of falling. That is a good setting for a child who is
            sensitive to movement. To change it, see{' '}
            <a href="https://support.google.com/accessibility/android/answer/11183305"
               target="_blank" rel="noopener noreferrer">Android’s guide ↗</a>.
          </p>
        )}
        {platform === 'ios' && (
          <p className="sq-tip">
            Tip: if your device has “Reduce Motion” turned on, the wrong-tap shake becomes a colour
            flash and the sprinkles fade instead of falling. That is a good setting for a child who is
            sensitive to movement. To change it, see{' '}
            <a href="https://support.apple.com/en-us/111781"
               target="_blank" rel="noopener noreferrer">Apple’s guide ↗</a>.
          </p>
        )}
      </dialog>

      <dialog ref={confirmRef} className="sq-dialog sq-confirm" aria-labelledby="sq-confirm-title"
        onClick={e => { if (e.target === e.currentTarget) answerLeave(false) }}>
        <h2 id="sq-confirm-title">Finish this one first?</h2>
        <div className="sq-confirm-actions">
          <button type="button" className="sq-btn primary" autoFocus onClick={() => answerLeave(false)}>Keep going</button>
          <button type="button" className="sq-btn" onClick={() => answerLeave(true)}>Back to the games</button>
        </div>
      </dialog>

      <dialog ref={albumRef} className="sq-dialog sq-album" aria-labelledby="sq-album-title"
        onClick={e => { if (e.target === e.currentTarget) closeAlbum() }}>
        <div className="sq-dialog-head">
          <h2 id="sq-album-title">My stickers</h2>
          <button type="button" className="sq-btn primary" onClick={closeAlbum}>Done</button>
        </div>
        <p className="sq-note">{progress.stickers.length === 0
          ? 'Finish a round to get your first sticker.'
          : `${progress.stickers.length} of ${STICKERS.length}`}</p>
        <ul className="sq-stickers">
          {STICKERS.map((st, i) => {
            const got = progress.stickers.includes(i)
            return (
              <li key={i} className={got ? 'got' : 'empty'} aria-label={got ? st.label : 'Not yet'}>
                {got ? st.emoji : ''}
              </li>
            )
          })}
        </ul>
      </dialog>

      {!playMode && (
      <div className={`sq-nav${home ? ' home' : ''}`}>
      {rotateButton('sq-rotate-nav')}
      {albumButton('sq-album-nav')}
      {gearButton('sq-gear-nav')}
      {playButton('sq-play-nav')}
      {!home && (
        <div className="sq-gamehead">
          <button type="button" className="sq-homebtn" onClick={askHome} aria-label="Back to all games">
            <span aria-hidden="true">‹</span><span className="sq-homebtn-text">Games</span>
          </button>
          <span className="sq-here" aria-live="polite">
            <span className="sq-ico" aria-hidden="true">{GAME_TILES.find(g => g.id === gameId)?.icon}</span>
            <strong>{GAME_TILES.find(g => g.id === gameId)?.title}</strong>
          </span>
        </div>
      )}

        {!home && gameId === 'spot' && (
          <div className="sq-types sq-themes" role="tablist" aria-label="Choose a picture theme">
            <span className="sq-subcap" aria-hidden="true">Theme</span>
            {THEMES.map(t => (
              <button key={t.id} role="tab" aria-selected={t.id === spotTheme} aria-label={t.label} title={t.label}
                className={`sq-type${t.id === spotTheme ? ' on' : ''}`} onClick={() => setSpotTheme(t.id)}>
                <span className="sq-ico" aria-hidden="true">{t.emoji}</span>
                {t.id === spotTheme && <span className="sq-typetext">{t.label}</span>}
              </button>
            ))}
          </div>
        )}

        {!home && gameId === 'match' && (
          <div className="sq-types sq-themes wrap" role="tablist" aria-label="Choose what to match">
            <span className="sq-subcap" aria-hidden="true">Match</span>
            {THEMES.map(t => (
              <button key={t.id} role="tab" aria-selected={t.id === matchSet} aria-label={t.label} title={t.label}
                className={`sq-type${t.id === matchSet ? ' on' : ''}`} onClick={() => setMatchSet(t.id)}>
                <span className="sq-ico" aria-hidden="true">{t.emoji}</span>
                {t.id === matchSet && <span className="sq-typetext">{t.label}</span>}
              </button>
            ))}
            <button role="tab" aria-selected={matchSet === 'letters'} aria-label="Capital and small letters" title="Capital and small letters"
              className={`sq-type${matchSet === 'letters' ? ' on' : ''}`} onClick={() => setMatchSet('letters')}>
              <span className="sq-ico txt" aria-hidden="true">Aa</span>
              {matchSet === 'letters' && <span className="sq-typetext">Letters</span>}
            </button>
            {WORD_SET_CHIPS.map(w => (
              <button key={w.id} role="tab" aria-selected={matchSet === w.id} aria-label={w.label} title={w.label}
                className={`sq-type${matchSet === w.id ? ' on' : ''}`} onClick={() => setMatchSet(w.id)}>
                <span className="sq-ico" aria-hidden="true">{w.icon}</span>
                {matchSet === w.id && <span className="sq-typetext">{w.short}</span>}
              </button>
            ))}
          </div>
        )}

        {!home && gameId === 'letters' && (
          <div className="sq-types" role="tablist" aria-label="Choose capital letters, small letters or numbers">
            <span className="sq-subcap" aria-hidden="true">Trace</span>
            {LETTER_CASES.map(c => (
              <button key={c.id} role="tab" aria-selected={c.id === letterCase} aria-label={c.label} title={c.label}
                className={`sq-type${c.id === letterCase ? ' on' : ''}`} onClick={() => setLetterCase(c.id)}>
                <span className="sq-ico txt" aria-hidden="true">{c.icon}</span>
                {c.id === letterCase && <span className="sq-typetext">{c.label}</span>}
              </button>
            ))}
          </div>
        )}

        {!home && gameId === 'spelling' && (
          <div className="sq-types" role="tablist" aria-label="Choose a kind of word">
            <span className="sq-subcap" aria-hidden="true">Words</span>
            {WORD_TYPES.map(w => (
              <button key={w.id} role="tab" aria-selected={w.id === wordType} aria-label={w.label} title={w.label}
                className={`sq-type${w.id === wordType ? ' on' : ''}`} onClick={() => chooseType(w.id)}>
                <span className="sq-ico" aria-hidden="true">{w.icon}</span>
                {w.id === wordType && <span className="sq-typetext">{w.label}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      {atHome ? (
        <nav className="sq-home-groups" aria-label="Choose a game">
          {GAME_GROUPS.map(grp => {
            const tiles = GAME_TILES.filter(t => t.group === grp.id)
            if (tiles.length === 0) return null
            return (
              <section key={grp.id} className="sq-group" aria-labelledby={`sq-grp-${grp.id}`}>
                <h2 id={`sq-grp-${grp.id}`} className="sq-group-title">{grp.title}<small>{grp.blurb}</small></h2>
                <div className="sq-tiles">
                  {tiles.map(g => (
                    <button key={g.id} type="button" className="sq-tile" onClick={() => openGame(g.id)}>
                      <span className="sq-tile-ico" aria-hidden="true">{g.icon}</span>
                      <strong>{g.title}</strong>
                      <small>{g.blurb}</small>
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
        </nav>
      ) : gameId === 'spot' ? (
        <SpotGame theme={spotTheme} count={lengths.spot} sound={sound} profile={profile}
          sprinklesOn={sprinklesOn} hintSec={hintSec} onActive={setRoundActive} onDone={finishSpot} />
      ) : gameId === 'trace' ? (
        <TraceGame level={lengths.trace} mode={traceMode} sound={sound} profile={profile}
          sprinklesOn={sprinklesOn} hintSec={hintSec} onActive={setRoundActive} onDone={finishTrace} />
      ) : gameId === 'letters' ? (
        <TraceGame source="letters" letterCase={letterCase} level={lengths.letters} mode={traceMode} sound={sound}
          profile={profile} sprinklesOn={sprinklesOn} hintSec={hintSec} onActive={setRoundActive} onDone={finishLetters}
          position={letterPos} onPosition={rememberLetter} />
      ) : gameId === 'match' ? (
        <MatchGame theme={matchSet} pairs={lengths.match} sound={sound} profile={profile}
          sprinklesOn={sprinklesOn} hintSec={hintSec} onActive={setRoundActive} onDone={finishMatch} />
      ) : gameId === 'count' ? (
        <CountGame level={lengths.count} sound={sound} profile={profile} sprinklesOn={sprinklesOn} hintSec={hintSec} onActive={setRoundActive} onDone={finishCount} />
      ) : gameId === 'pattern' ? (
        <PatternGame level={lengths.pattern} sound={sound} profile={profile} sprinklesOn={sprinklesOn} hintSec={hintSec} onActive={setRoundActive} onDone={finishPattern} />
      ) : gameId === 'sort' ? (
        <SortGame level={lengths.sort} sound={sound} profile={profile} sprinklesOn={sprinklesOn} hintSec={hintSec} onActive={setRoundActive} onDone={finishSort} />
      ) : gameId === 'odd' ? (
        <OddGame level={lengths.odd} sound={sound} profile={profile} sprinklesOn={sprinklesOn} hintSec={hintSec} onActive={setRoundActive} onDone={finishOdd} />
      ) : gameId === 'puzzle' ? (
        <PuzzleGame level={lengths.puzzle} sound={sound} profile={profile} sprinklesOn={sprinklesOn} hintSec={hintSec} onActive={setRoundActive} onDone={finishPuzzle} />
      ) : gameId === 'dots' ? (
        <DotsGame level={lengths.dots} sound={sound} profile={profile} sprinklesOn={sprinklesOn} hintSec={hintSec} onActive={setRoundActive} onDone={finishDots} />
      ) : gameId === 'habits' ? (
        <HabitsGame count={lengths.habits} sound={sound} profile={profile} sprinklesOn={sprinklesOn} hintSec={hintSec}
          onActive={setRoundActive} onDone={finishHabits} />
      ) : (
      <div className="sq-card">
        <SprinklesLayer sprinkles={fx.sprinkles} />
        <div className="sq-top">
          <div className="sq-label">Look at {game.id === 'numbers' ? 'these' : 'this'}</div>
          <InfoButton say={say} text={game.id === 'numbers'
            ? 'Look at the numbers. Tap the same numbers, in the same order.'
            : 'Look at the picture and the word. Tap the letters to spell the word, one at a time.'} />
        </div>

        {picture && <div className="sq-pic" aria-hidden="true">{picture}</div>}

        <div className="sq-line sq-tline">
          <div className="sq-row" aria-label={`To copy: ${target.join(' ')}`}>
            {target.map((d, i) => (
              <div key={i} className={`sq-box target${hint && !done && i === entered.length ? ' hint' : ''}`}>{d}</div>
            ))}
          </div>
          <button type="button" className="sq-icon" aria-label="Hear it" onClick={() => say(spoken, true)}>
            <SpeakerIcon />
          </button>
        </div>

        <div className="sq-label sq-alabel">Tap {game.id === 'numbers' ? 'them' : 'it'} here</div>
        <div className="sq-line sq-aline">
          <div className="sq-row">
            {target.map((_, i) => {
              const got = i < entered.length
              const isNext = i === entered.length && !done
              return (
                <div key={`${i}-${isNext ? shake : 0}`}
                  className={`sq-box${got ? ' got' : ''}${isNext ? ' next' : ''}${isNext && shake ? ' shake' : ''}`}>
                  {got ? entered[i] : ''}
                </div>
              )
            })}
          </div>
          <span className="sq-slot" aria-hidden="true" />
        </div>

        <div className={`sq-msg${done ? ' done' : ''}`} role="status" aria-live="polite">{message}</div>
        <span className="sq-sr" role="status" aria-live="polite">
          {hint && !done ? `Hint: the next one is ${game.say(target[entered.length] ?? '')}` : ''}
        </span>

        {game.rows ? (
          <div className="sq-kb">
            {rows.map((r, ri) => (
              <div key={ri} className="sq-kbrow">
                {r.map(k => (
                  <button key={k} className={`sq-key${hint && !done && k === target[entered.length] ? ' hint' : ''}${flashKey === k ? ' pressed' : ''}`}
                    onClick={() => press(k)} disabled={done} aria-label={game.say(k)}>{k}</button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="sq-pad" style={{ '--cols': game.cols } as React.CSSProperties}>
            {game.keys.map((k, i) => k === ''
              ? <span key={i} className="sq-key sq-blank" aria-hidden="true" />
              : <button key={i} className={`sq-key${hint && !done && k === target[entered.length] ? ' hint' : ''}${flashKey === k ? ' pressed' : ''}`}
                  onClick={() => press(k)} disabled={done} aria-label={game.say(k)}>{k}</button>)}
          </div>
        )}

        {fine && <p className="sq-kbhint">You can also type on your keyboard.</p>}

        <div className="sq-actions" style={{ marginTop: '1rem', marginBottom: 0 }}>
          {done
            ? <button className="sq-btn primary" onClick={() => start(keyId, length, wordType)}>Another one</button>
            : <button className="sq-btn" onClick={() => setEntered([])}>Start again</button>}
        </div>
      </div>
      )}

      {newSticker !== null && (
        <button type="button" className="sq-sticker-pop" onClick={openAlbum}
          aria-label={`New sticker: ${STICKERS[newSticker].label}. Open my stickers.`}>
          <span className="sq-sticker-emoji" aria-hidden="true">{STICKERS[newSticker].emoji}</span>
          <span>A new sticker!</span>
        </button>
      )}

      {toast && <div className="sq-toast" role="status">{toast}</div>}
    </div>
  )
}

const GAME_NAMES = Object.fromEntries(GAME_TILES.map(g => [g.id, g.title])) as Record<GameKey, string>

/** For the parent: this week at a glance. Counts rounds finished; there is no score. */
function ProgressPanel({ progress, name, clearAsked, onClear, onCancelClear }: {
  progress: Progress; name: string; clearAsked: boolean; onClear: () => void; onCancelClear: () => void
}) {
  // "Today" is only known in the browser, so this waits for it rather than guess on the server.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()) }, [progress])
  if (!now) return null
  const sm = summarise(progress, now)
  const who = name || 'Your child'
  const most = Math.max(1, ...sm.daily.map(d => d.count))
  const games = (GAME_TILES.map(g => g.id) as GameKey[]).filter(g => sm.byGame[g])
  return (
    <section aria-labelledby="sq-prog-title">
      <h3 id="sq-prog-title" className="sq-subhead">This week</h3>
      <p className="sq-note">
        {sm.week === 0
          ? `No rounds finished in the last 7 days.`
          : `${who} finished ${sm.week} ${sm.week === 1 ? 'round' : 'rounds'} in the last 7 days${sm.today ? `, ${sm.today} today` : ''}.`}
      </p>
      <div className="sq-bars" role="img"
        aria-label={`Rounds finished each day: ${sm.daily.map(d => `${d.label} ${d.count}`).join(', ')}`}>
        {sm.daily.map(d => (
          <div key={d.key} className="sq-bar">
            <span className="sq-barn">{d.count || ''}</span>
            <span className="sq-barfill" style={{ height: `${Math.round((d.count / most) * 100)}%` }} />
            <span className="sq-bard">{d.label}</span>
          </div>
        ))}
      </div>
      {games.length > 0 && (
        <p className="sq-note">{games.map(g => `${GAME_NAMES[g]} ${sm.byGame[g]}`).join(' · ')}</p>
      )}
      <p className="sq-note">Stickers: {sm.stickers} of {STICKERS.length}. All time: {sm.total} {sm.total === 1 ? 'round' : 'rounds'}.</p>
      <p className="sq-note">Only finished rounds are counted. Your child’s rounds and stickers stay on this phone or computer.</p>
      {(sm.total > 0 || sm.stickers > 0) && (
        <div className="sq-confirm-row">
          <button type="button" className="sq-btn" onClick={onClear}>
            {clearAsked ? 'Tap again to clear' : 'Clear stickers and progress'}
          </button>
          {clearAsked && <button type="button" className="sq-btn" onClick={onCancelClear}>Keep them</button>}
        </div>
      )}
    </section>
  )
}
