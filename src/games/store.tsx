'use client'
// Everything the screens share: the parent's settings, the child's details, rounds and stickers, play mode and
// the toast. It lives in the root layout, so it survives moving between pages; a reload reads it back from
// localStorage (the same two keys the single-page version used, so nothing a family has saved is lost).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ALL_GAME_IDS, GAME_SETTINGS, LETTER_CASES, WORD_TYPES, isGameId, type GameId, type WordType } from './gameDefs'
import { THEMES, type ThemeId } from './spot/generate'
import { WORD_SETS, type MatchSet } from './match/generate'
import { allCharacters, type LetterCase } from './trace/letters'
import type { TraceMode } from './TraceGame'
import { ageBand, forgetShared, newShareId, useStats } from './stats'
import { DEFAULT_JIGSAW, cleanJigsaw, type JigsawPrefs } from './pictures/prefs'
import { setEnabled as setRecordingsEnabled, loadClips, unlockOnGesture } from './voice/player'
import { EMPTY_PROGRESS, cleanProgress, recordRound, type GameKey, type Progress } from './progress'
import { AGES, COLOURS, EMPTY_PROFILE, cleanName, startingLengths, type ColourId, type Profile } from './profile'

const STORE = 'parentingGames.v1'
const PROGRESS_STORE = 'parentingProgress.v1'   // rounds finished and stickers: this device only

/** How long a child may pause before the next key glows. 0 turns hints off. */
export const HINT_CHOICES = [0, 6, 10, 15, 20]
const DEFAULT_HINT_SEC = 10
const DEFAULT_LENGTHS = Object.fromEntries(ALL_GAME_IDS.map(id => [id, GAME_SETTINGS[id].def])) as Record<GameId, number>

export type Store = {
  ready: boolean
  // settings
  sound: boolean; setSound: (v: boolean) => void
  sprinklesOn: boolean; setSprinklesOn: (v: boolean) => void
  hintSec: number; setHintSec: (v: number) => void
  lengths: Record<GameId, number>; changeLength: (id: GameId, n: number) => void
  traceMode: TraceMode; setTraceMode: (m: TraceMode) => void
  useRecordings: boolean; setUseRecordings: (v: boolean) => void
  jigsaw: JigsawPrefs; setJigsaw: (patch: Partial<JigsawPrefs>) => void
  // what each game remembers
  spotTheme: ThemeId; setSpotTheme: (t: ThemeId) => void
  matchSet: MatchSet; setMatchSet: (s: MatchSet) => void
  letterCase: LetterCase; setLetterCase: (c: LetterCase) => void
  wordType: WordType; setWordType: (t: WordType) => void
  letterPos: Record<string, string>; rememberLetter: (key: string, ch: string) => void; restartLetterOrder: () => void
  // the child
  profile: Profile; editProfile: (patch: Partial<Profile>) => void; chooseAge: (raw: string) => void; forgetChild: () => void
  setupSeen: boolean; markSetupSeen: () => void
  // counting and sharing
  shareCounts: boolean; changeCounting: (on: boolean) => void
  shareName: boolean; shareId: string; startSharing: () => void; stopSharing: () => void
  // progress
  progress: Progress; finishRound: (id: GameKey) => void; clearProgress: () => void
  newSticker: number | null; dismissSticker: () => void
  // play mode and where the child was
  playMode: boolean; setPlayMode: (on: boolean) => void
  lastGame: GameId; setLastGame: (id: GameId) => void
  roundActive: boolean; setRoundActive: (on: boolean) => void
  // the phone held sideways, and the way to ask for it
  compact: boolean; toggleRotate: () => void
  toast: string; showToast: (text: string) => void
}

const Ctx = createContext<Store | null>(null)
export function useApp(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useApp needs <AppProvider>')
  return s
}

/** Which "game" the stats should say is open: a game's own id, or "home" for everything else. */
function statsGame(pathname: string): string {
  const m = /^\/games\/([a-z]+)\/?$/.exec(pathname)
  return m && isGameId(m[1]) ? m[1] : 'home'
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [lengths, setLengths] = useState<Record<GameId, number>>(DEFAULT_LENGTHS)
  const [spotTheme, setSpotTheme] = useState<ThemeId>('farm')
  const [matchSet, setMatchSet] = useState<MatchSet>('farm')
  const [letterPos, setLetterPos] = useState<Record<string, string>>({})
  const letterPosRef = useRef<Record<string, string>>({})
  const [traceMode, setTraceMode] = useState<TraceMode>('trace')
  const [letterCase, setLetterCase] = useState<LetterCase>('upper')
  const [wordType, setWordType] = useState<WordType>('nouns')
  const [sound, setSound] = useState(false)
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE)
  const [setupSeen, setSetupSeen] = useState(false)
  const [sprinklesOn, setSprinklesOn] = useState(true)
  const [playMode, setPlayMode] = useState(false)
  const [lastGame, setLastGameState] = useState<GameId>('numbers')
  // A game page that opens before the saved settings are read must not have its game overwritten by the saved one.
  const lastGameTouched = useRef(false)
  const setLastGame = useCallback((id: GameId) => { lastGameTouched.current = true; setLastGameState(id) }, [])
  const [hintSec, setHintSec] = useState(DEFAULT_HINT_SEC)
  const [shareCounts, setShareCounts] = useState(true)
  const [shareName, setShareName] = useState(false)
  const [shareId, setShareId] = useState('')
  const [useRecordings, setUseRecordings] = useState(true)
  const [jigsaw, setJigsawState] = useState<JigsawPrefs>(DEFAULT_JIGSAW)
  const [roundActive, setRoundActive] = useState(false)
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS)
  const progressRef = useRef<Progress>(EMPTY_PROGRESS)
  const progressLoaded = useRef(false)
  const [newSticker, setNewSticker] = useState<number | null>(null)
  const stickerTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [compact, setCompact] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const loaded = useRef(false)

  // ── Read what is saved ──
  useEffect(() => {
    const lens: Record<GameId, number> = { ...DEFAULT_LENGTHS }
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || '{}')
      if (isGameId(s.game) && !lastGameTouched.current) setLastGameState(s.game)
      for (const gid of ALL_GAME_IDS) {
        const n = s.lengths?.[gid], st = GAME_SETTINGS[gid]
        if (Number.isInteger(n) && n >= st.min && n <= st.max) lens[gid] = n
      }
      if (LETTER_CASES.some(c => c.id === s.letterCase)) setLetterCase(s.letterCase)
      if (THEMES.some(t => t.id === s.spotTheme)) setSpotTheme(s.spotTheme)
      if (s.matchSet === 'letters' || (WORD_SETS as readonly string[]).includes(s.matchSet) || THEMES.some(t => t.id === s.matchSet)) setMatchSet(s.matchSet)
      if (s.letterPos && typeof s.letterPos === 'object') {
        const valid = new Set(allCharacters())
        const pos: Record<string, string> = {}
        for (const [k, v] of Object.entries(s.letterPos)) if (/^(upper|lower|both|numbers)$/.test(k) && typeof v === 'string' && valid.has(v)) pos[k] = v
        letterPosRef.current = pos
        setLetterPos(pos)
      }
      if (s.traceMode === 'trace' || s.traceMode === 'trace-copy') setTraceMode(s.traceMode)
      if (WORD_TYPES.some(w => w.id === s.wordType)) setWordType(s.wordType)
      if (typeof s.sound === 'boolean') setSound(s.sound)
      if (typeof s.sprinkles === 'boolean') setSprinklesOn(s.sprinkles)
      if (s.playMode === true) setPlayMode(true)
      if (typeof s.shareCounts === 'boolean') setShareCounts(s.shareCounts)
      if (typeof s.useRecordings === 'boolean') setUseRecordings(s.useRecordings)
      setJigsawState(cleanJigsaw(s.jigsaw))
      if (s.shareName === true && typeof s.shareId === 'string' && /^[A-Za-z0-9_-]{12,40}$/.test(s.shareId)) { setShareName(true); setShareId(s.shareId) }
      if (HINT_CHOICES.includes(s.hintSec)) setHintSec(s.hintSec)
      const pr = s.profile
      let seen = !!s.setupSeen
      if (pr && typeof pr === 'object') {
        setProfile({
          name: cleanName(String(pr.name ?? '')).trim(),
          say: cleanName(String(pr.say ?? '')).trim(),
          age: AGES.includes(pr.age) ? pr.age : null,
          colour: COLOURS.some(c => c.id === pr.colour) ? pr.colour : 'mix',
        })
        if (pr.name) seen = true
      }
      setSetupSeen(seen)
    } catch {}
    setLengths(lens)
    try {
      const p = cleanProgress(JSON.parse(localStorage.getItem(PROGRESS_STORE) || 'null'))
      progressRef.current = p
      setProgress(p)
    } catch {}
    progressLoaded.current = true
    loaded.current = true
    setReady(true)
    return () => clearTimeout(stickerTimer.current)
  }, [])

  useEffect(() => {
    if (!progressLoaded.current) return
    try { localStorage.setItem(PROGRESS_STORE, JSON.stringify(progress)) } catch {}
  }, [progress])

  useEffect(() => {
    if (!loaded.current) return
    try {
      localStorage.setItem(STORE, JSON.stringify({
        game: lastGame, wordType, spotTheme, matchSet, letterPos, traceMode, letterCase, lengths, sound,
        sprinkles: sprinklesOn, hintSec, profile, setupSeen, playMode, shareCounts, shareName,
        shareId: shareName ? shareId : '', useRecordings, jigsaw,
      }))
    } catch {}
  }, [lastGame, wordType, spotTheme, matchSet, letterPos, traceMode, letterCase, lengths, sound, sprinklesOn, hintSec, profile, setupSeen, playMode, shareCounts, shareName, shareId, useRecordings, jigsaw])

  // The recordings are read at start-up, and the audio engine is woken by the first touch.
  useEffect(() => { unlockOnGesture(); loadClips() }, [])
  useEffect(() => { setRecordingsEnabled(useRecordings) }, [useRecordings])

  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape) and (max-height: 520px)')
    const on = () => setCompact(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // ── Toast ──
  const showToast = useCallback((text: string) => {
    setToast(text)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 4000)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // ── Landscape: one control for every game. Browsers only allow a page to lock orientation in fullscreen or as an
  // installed app, and iPhone Safari not at all. Try, and if refused, say what to do by hand. The layout itself
  // follows how the phone is actually held, so it works either way.
  const releaseOrientation = useCallback(() => {
    try { (screen.orientation as any)?.unlock?.() } catch {}
    try { if (document.fullscreenElement) document.exitFullscreen() } catch {}
  }, [])
  useEffect(() => releaseOrientation, [releaseOrientation])
  const toggleRotate = useCallback(async () => {
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
  }, [compact, releaseOrientation, showToast])

  // ── Rounds and stickers ──
  const statsRound = useRef<(g: string) => void>(() => {})
  const finishRound = useCallback((id: GameKey) => {
    statsRound.current(id)
    const r = recordRound(progressRef.current, id, new Date(), Math.random)
    progressRef.current = r.progress
    setProgress(r.progress)
    clearTimeout(stickerTimer.current)
    setNewSticker(r.sticker)
    if (r.sticker !== null) stickerTimer.current = setTimeout(() => setNewSticker(null), 5000)
  }, [])
  const dismissSticker = useCallback(() => { clearTimeout(stickerTimer.current); setNewSticker(null) }, [])
  const clearProgress = useCallback(() => {
    progressRef.current = EMPTY_PROGRESS
    setProgress(EMPTY_PROGRESS)
    setNewSticker(null)
  }, [])

  // ── Letters and numbers remember where they got to ──
  const rememberLetter = useCallback((key: string, ch: string) => {
    if (letterPosRef.current[key] === ch) return
    letterPosRef.current = { ...letterPosRef.current, [key]: ch }
    setLetterPos(letterPosRef.current)
  }, [])
  const restartLetterOrder = useCallback(() => {
    letterPosRef.current = {}
    setLetterPos({})
    showToast('Letters and numbers will start again from the first one.')
  }, [showToast])

  // ── The child ──
  const editProfile = useCallback((patch: Partial<Profile>) => setProfile(p => ({ ...p, ...patch })), [])
  // Setting the age for the first time suggests a starting length; a parent can still move the sliders, and the
  // game never changes them again by itself.
  const chooseAge = useCallback((raw: string) => {
    const age = raw === '' ? null : Number(raw)
    const first = profile.age === null && age !== null
    setProfile(p => ({ ...p, age: age as Profile['age'] }))
    if (first) setLengths(startingLengths(age!))
  }, [profile.age])
  const setJigsaw = useCallback((patch: Partial<JigsawPrefs>) => setJigsawState(j => ({ ...j, ...patch })), [])
  const changeLength = useCallback((id: GameId, n: number) => setLengths(l => ({ ...l, [id]: n })), [])

  // ── Sharing the name is a parent's choice, and undoing it deletes what was shared ──
  const startSharing = useCallback(() => { setShareId(newShareId()); setShareName(true) }, [])
  const stopSharing = useCallback(() => {
    if (shareName && shareId) forgetShared(shareId)
    setShareName(false)
    setShareId('')
  }, [shareName, shareId])
  const changeCounting = useCallback((on: boolean) => {
    setShareCounts(on)
    if (!on) stopSharing()
  }, [stopSharing])
  const forgetChild = useCallback(() => { setProfile(EMPTY_PROFILE); stopSharing() }, [stopSharing])

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
  statsRound.current = useStats({ enabled: shareCounts, game: statsGame(pathname), share: sharing }).round

  const value = useMemo<Store>(() => ({
    ready, sound, setSound, sprinklesOn, setSprinklesOn, hintSec, setHintSec, lengths, changeLength, traceMode, setTraceMode,
    useRecordings, setUseRecordings, jigsaw, setJigsaw, spotTheme, setSpotTheme, matchSet, setMatchSet, letterCase, setLetterCase, wordType, setWordType,
    letterPos, rememberLetter, restartLetterOrder, profile, editProfile, chooseAge, forgetChild,
    setupSeen, markSetupSeen: () => setSetupSeen(true),
    shareCounts, changeCounting, shareName, shareId, startSharing, stopSharing,
    progress, finishRound, clearProgress, newSticker, dismissSticker,
    playMode, setPlayMode, lastGame, setLastGame, roundActive, setRoundActive,
    compact, toggleRotate, toast, showToast,
  }), [ready, sound, sprinklesOn, hintSec, lengths, changeLength, traceMode, useRecordings, jigsaw, setJigsaw, spotTheme, matchSet, letterCase, wordType,
    letterPos, rememberLetter, restartLetterOrder, profile, editProfile, chooseAge, forgetChild, setupSeen,
    shareCounts, changeCounting, shareName, shareId, startSharing, stopSharing, progress, finishRound, clearProgress,
    newSticker, dismissSticker, playMode, lastGame, roundActive, compact, toggleRotate, toast, showToast])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
