'use client'
// One game on its own page: the option chips for that game (themes, letter case, kinds of word) and the game
// itself. The header, the menu and play mode belong to the shell around it (AppShell). On a phone held sideways the
// shell's header steps aside and the slim bar in here (.sq-nav) carries the controls instead, so the game keeps
// the room.
import Link from 'next/link'
import { useCallback, useEffect } from 'react'
import { GAME_TILES, LETTER_CASES, WORD_TYPES, type GameId } from './gameDefs'
import { THEMES } from './spot/generate'
import SpotGame from './SpotGame'
import TraceGame from './TraceGame'
import MatchGame from './MatchGame'
import HabitsGame from './HabitsGame'
import CountGame from './CountGame'
import PatternGame from './PatternGame'
import SortGame from './SortGame'
import OddGame from './OddGame'
import JigsawGame from './JigsawGame'
import DotsGame from './DotsGame'
import MemoryGame from './MemoryGame'
import ShapesGame from './ShapesGame'
import MazeGame from './MazeGame'
import ColouringGame from './ColouringGame'
import KeyGame from './KeyGame'
import { WORD_SETS } from './match/generate'
import { AlbumIcon, LandscapeIcon, MenuIcon, PlayIcon, PortraitIcon } from './icons'
import { useApp } from './store'
import { useShell } from './shellContext'

/** Matching a word to its picture: things, animals and colours. */
const WORD_SET_CHIPS: { id: (typeof WORD_SETS)[number]; label: string; short: string; icon: string }[] = [
  { id: 'words-objects', label: 'Words and things', short: 'Things', icon: '📖' },
  { id: 'words-animals', label: 'Words and animals', short: 'Animals', icon: '🐾' },
  { id: 'words-colours', label: 'Words and colours', short: 'Colours', icon: '🎨' },
]

const THINKING: GameId[] = ['count', 'pattern', 'sort', 'odd', 'puzzle', 'dots', 'memory', 'shapes', 'maze', 'colouring']

export default function GameScreen({ id }: { id: GameId }) {
  const app = useApp()
  const { openMenu, goHome } = useShell()
  const { setLastGame, setRoundActive, finishRound, playMode, compact } = app
  const tile = GAME_TILES.find(g => g.id === id)

  useEffect(() => { setLastGame(id) }, [id, setLastGame])
  // A game that is not under way must not leave the "round under way" flag behind.
  useEffect(() => () => setRoundActive(false), [setRoundActive])

  const done = useCallback(() => finishRound(id), [finishRound, id])
  const common = {
    sound: app.sound, profile: app.profile, sprinklesOn: app.sprinklesOn, hintSec: app.hintSec,
    onActive: setRoundActive, onDone: done,
  }
  const level = app.lengths[id]

  // In a sideways phone the choices are a row that slides; keep the chosen one in view.
  useEffect(() => {
    if (!compact) return
    document.querySelector('.sq-types.wrap .sq-type.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [compact, app.matchSet, id])

  const startPlay = () => { app.setPlayMode(true); app.showToast('Play mode is on. To leave it, press and hold the lock.') }

  const cls = ['sq-wrap',
    playMode ? 'playmode' : '',
    id === 'spelling' ? 'spelling' : '', id === 'spot' ? 'spot' : '',
    id === 'trace' || id === 'letters' ? 'trace' : '', id === 'numbers' ? 'numbers' : '',
    id === 'match' ? 'match' : '', id === 'habits' ? 'habits' : '',
    THINKING.includes(id) ? `th ${id}` : ''].filter(Boolean).join(' ')

  return (
    <div className={cls}>
      {!playMode && (
        <div className="sq-nav">
          {/* The icons and the way back show only on a phone held sideways, where the header is out of the way. */}
          <button type="button" className="sq-icon sq-rotate-nav" onClick={app.toggleRotate} aria-label={compact ? 'Portrait view' : 'Landscape view'}>
            {compact ? <PortraitIcon /> : <LandscapeIcon />}
          </button>
          <Link href="/stickers" className="sq-icon sq-album-nav" aria-label="My stickers"><AlbumIcon /></Link>
          <button type="button" className="sq-icon sq-gear-nav" onClick={openMenu} aria-label="Menu" aria-haspopup="dialog"><MenuIcon /></button>
          <button type="button" className="sq-icon sq-play sq-play-nav" onClick={startPlay}
            aria-label="Start play mode: lock the screen to this game for your child" title="Play mode"><PlayIcon /></button>
          <div className="sq-gamehead">
            <button type="button" className="sq-homebtn" onClick={goHome} aria-label="Back to all games">
              <span aria-hidden="true">‹</span><span className="sq-homebtn-text">Games</span>
            </button>
            <span className="sq-here">
              <span className="sq-ico" aria-hidden="true">{tile?.icon}</span>
              <strong>{tile?.title}</strong>
            </span>
          </div>

          {id === 'spot' && (
            <div className="sq-types sq-themes" role="tablist" aria-label="Choose a picture theme">
              <span className="sq-subcap" aria-hidden="true">Theme</span>
              {THEMES.map(t => (
                <button key={t.id} role="tab" aria-selected={t.id === app.spotTheme} aria-label={t.label} title={t.label}
                  className={`sq-type${t.id === app.spotTheme ? ' on' : ''}`} onClick={() => app.setSpotTheme(t.id)}>
                  <span className="sq-ico" aria-hidden="true">{t.emoji}</span>
                  {t.id === app.spotTheme && <span className="sq-typetext">{t.label}</span>}
                </button>
              ))}
            </div>
          )}

          {id === 'match' && (
            <div className="sq-types sq-themes wrap" role="tablist" aria-label="Choose what to match">
              <span className="sq-subcap" aria-hidden="true">Match</span>
              {THEMES.map(t => (
                <button key={t.id} role="tab" aria-selected={t.id === app.matchSet} aria-label={t.label} title={t.label}
                  className={`sq-type${t.id === app.matchSet ? ' on' : ''}`} onClick={() => app.setMatchSet(t.id)}>
                  <span className="sq-ico" aria-hidden="true">{t.emoji}</span>
                  {t.id === app.matchSet && <span className="sq-typetext">{t.label}</span>}
                </button>
              ))}
              <button role="tab" aria-selected={app.matchSet === 'letters'} aria-label="Capital and small letters" title="Capital and small letters"
                className={`sq-type${app.matchSet === 'letters' ? ' on' : ''}`} onClick={() => app.setMatchSet('letters')}>
                <span className="sq-ico txt" aria-hidden="true">Aa</span>
                {app.matchSet === 'letters' && <span className="sq-typetext">Letters</span>}
              </button>
              {WORD_SET_CHIPS.map(w => (
                <button key={w.id} role="tab" aria-selected={app.matchSet === w.id} aria-label={w.label} title={w.label}
                  className={`sq-type${app.matchSet === w.id ? ' on' : ''}`} onClick={() => app.setMatchSet(w.id)}>
                  <span className="sq-ico" aria-hidden="true">{w.icon}</span>
                  {app.matchSet === w.id && <span className="sq-typetext">{w.short}</span>}
                </button>
              ))}
            </div>
          )}

          {id === 'letters' && (
            <div className="sq-types" role="tablist" aria-label="Choose capital letters, small letters or numbers">
              <span className="sq-subcap" aria-hidden="true">Trace</span>
              {LETTER_CASES.map(c => (
                <button key={c.id} role="tab" aria-selected={c.id === app.letterCase} aria-label={c.label} title={c.label}
                  className={`sq-type${c.id === app.letterCase ? ' on' : ''}`} onClick={() => app.setLetterCase(c.id)}>
                  <span className="sq-ico txt" aria-hidden="true">{c.icon}</span>
                  {c.id === app.letterCase && <span className="sq-typetext">{c.label}</span>}
                </button>
              ))}
            </div>
          )}

          {id === 'spelling' && (
            <div className="sq-types" role="tablist" aria-label="Choose a kind of word">
              <span className="sq-subcap" aria-hidden="true">Words</span>
              {WORD_TYPES.map(w => (
                <button key={w.id} role="tab" aria-selected={w.id === app.wordType} aria-label={w.label} title={w.label}
                  className={`sq-type${w.id === app.wordType ? ' on' : ''}`} onClick={() => app.setWordType(w.id)}>
                  <span className="sq-ico" aria-hidden="true">{w.icon}</span>
                  {w.id === app.wordType && <span className="sq-typetext">{w.label}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {id === 'spot' ? <SpotGame theme={app.spotTheme} count={level} {...common} />
        : id === 'trace' ? <TraceGame level={level} mode={app.traceMode} {...common} />
        : id === 'letters' ? <TraceGame source="letters" letterCase={app.letterCase} level={level} mode={app.traceMode} {...common}
            position={app.letterPos} onPosition={app.rememberLetter} />
        : id === 'match' ? <MatchGame theme={app.matchSet} pairs={level} {...common} />
        : id === 'count' ? <CountGame level={level} {...common} />
        : id === 'pattern' ? <PatternGame level={level} {...common} />
        : id === 'sort' ? <SortGame level={level} {...common} />
        : id === 'odd' ? <OddGame level={level} {...common} />
        : id === 'puzzle' ? <JigsawGame level={level} {...common} />
        : id === 'dots' ? <DotsGame level={level} {...common} />
        : id === 'memory' ? <MemoryGame level={level} {...common} />
        : id === 'shapes' ? <ShapesGame level={level} {...common} />
        : id === 'maze' ? <MazeGame level={level} {...common} />
        : id === 'colouring' ? <ColouringGame level={level} {...common} />
        : id === 'habits' ? <HabitsGame count={level} {...common} />
        : <KeyGame id={id} length={level} wordType={app.wordType} {...common} />}
    </div>
  )
}
