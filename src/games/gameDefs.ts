// Game definitions. The engine in Games.tsx only knows about symbols on a keypad,
// a target made of those symbols, and how to say them aloud.

import { HABIT_ROUND } from './habits/data'

export type KeyGameId = 'numbers' | 'spelling'
/** Every game there is. Adding one: its id here, an entry in GAME_SETTINGS and GAME_TILES, and its screen in Games.tsx. */
export const ALL_GAME_IDS = [
  'numbers', 'spelling', 'spot', 'trace', 'letters', 'match', 'habits',
  'count', 'pattern', 'sort', 'odd', 'puzzle', 'dots',
  'memory',
  'shapes',
  'maze',
  'colouring',
] as const
export type GameId = (typeof ALL_GAME_IDS)[number]

export type WordType = 'nouns' | 'actions' | 'describing'

export type Round = { target: string[]; picture?: string; spoken: string }

export type Game = {
  id: KeyGameId
  title: string
  blurb: string
  keys: string[] // flat grid keys (Number Steps)
  cols: number
  rows?: string[][] // keyboard rows (Spelling Bees); used instead of keys when present
  minLen: number
  maxLen: number
  defaultLen: number
  makeRound: (len: number, wordType?: WordType) => Round
  say: (symbol: string) => string
}

const DIGIT_WORDS: Record<string, string> = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
}

// Letter names spelled out so the voice says "bee", not "buh".
const LETTER_NAMES: Record<string, string> = {
  A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'eff', G: 'jee', H: 'aitch',
  I: 'eye', J: 'jay', K: 'kay', L: 'ell', M: 'em', N: 'en', O: 'oh', P: 'pee',
  Q: 'cue', R: 'ar', S: 'ess', T: 'tee', U: 'you', V: 'vee', W: 'double you',
  X: 'ex', Y: 'why', Z: 'zed',
}

// Short sequences never repeat a number twice in a row; from this length on they may.
const REPEATS_FROM = 4

function numberRound(len: number): Round {
  const target: string[] = []
  const pool = Object.keys(DIGIT_WORDS)
  const repeats = len >= REPEATS_FROM
  while (target.length < len) {
    const d = pool[Math.floor(Math.random() * pool.length)]
    if (repeats || d !== target[target.length - 1]) target.push(d)
  }
  return { target, spoken: target.map(d => DIGIT_WORDS[d]).join(', ') }
}

// Everyday words a young child can picture. The picture is the clue; the word is
// shown too, so the child is copying, not guessing.
const NOUNS: Record<number, [string, string][]> = {
  3: [['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['hat', '🎩'], ['bus', '🚌'], ['pig', '🐷'],
      ['car', '🚗'], ['bee', '🐝'], ['egg', '🥚'], ['fox', '🦊'], ['owl', '🦉'], ['ant', '🐜'],
      ['bed', '🛏️'], ['key', '🔑'], ['map', '🗺️'], ['hen', '🐔'], ['cow', '🐮']],
  4: [['fish', '🐟'], ['bird', '🐦'], ['cake', '🍰'], ['tree', '🌳'], ['moon', '🌙'], ['star', '⭐'],
      ['frog', '🐸'], ['duck', '🦆'], ['ball', '⚽'], ['book', '📖'], ['boat', '⛵'], ['milk', '🥛'],
      ['rain', '🌧️'], ['shoe', '👟'], ['bear', '🐻'], ['door', '🚪'], ['lion', '🦁'], ['corn', '🌽']],
  5: [['apple', '🍎'], ['bread', '🍞'], ['house', '🏠'], ['train', '🚆'], ['horse', '🐴'], ['tiger', '🐯'],
      ['zebra', '🦓'], ['mouse', '🐭'], ['water', '💧'], ['clock', '🕐'], ['snake', '🐍'], ['plane', '✈️'],
      ['whale', '🐋'], ['grape', '🍇'], ['chair', '🪑'], ['heart', '❤️'], ['robot', '🤖'], ['pizza', '🍕']],
  6: [['banana', '🍌'], ['orange', '🍊'], ['rabbit', '🐰'], ['monkey', '🐒'], ['flower', '🌸'], ['spider', '🕷️'],
      ['turtle', '🐢'], ['guitar', '🎸'], ['pencil', '✏️'], ['carrot', '🥕'], ['rocket', '🚀'], ['cheese', '🧀'],
      ['bridge', '🌉'], ['castle', '🏰']],
}

// Action words (verbs). Each has a picture that shows the action.
const ACTIONS: Record<number, [string, string][]> = {
  3: [['run', '🏃'], ['eat', '🍽️'], ['cry', '😢'], ['hug', '🤗'], ['nap', '😴'], ['dig', '⛏️'], ['hop', '🐇']],
  4: [['jump', '🤸'], ['walk', '🚶'], ['swim', '🏊'], ['read', '📖'], ['sing', '🎤'], ['clap', '👏'],
      ['wave', '👋'], ['kick', '🦵'], ['ride', '🚲'], ['cook', '🍳'], ['draw', '🖍️'], ['wash', '🧼'], ['dive', '🤿']],
  5: [['sleep', '😴'], ['drink', '🥤'], ['write', '✍️'], ['dance', '💃'], ['laugh', '😂'], ['climb', '🧗'],
      ['paint', '🎨'], ['smile', '😊'], ['point', '👉'], ['brush', '🪥'], ['skate', '⛸️']],
  6: [['listen', '👂'], ['splash', '💦'], ['cuddle', '🤗'], ['bounce', '⛹️'], ['gallop', '🐎'], ['tickle', '🪶']],
}

// Describing words (adjectives), each with a picture that makes the word easy to see.
const DESCRIBING: Record<number, [string, string][]> = {
  3: [['big', '🐘'], ['hot', '🔥'], ['wet', '💦'], ['sad', '😢'], ['red', '🔴'], ['old', '👴'], ['new', '🆕']],
  4: [['cold', '🥶'], ['soft', '🧸'], ['loud', '📢'], ['fast', '🐆'], ['slow', '🐢'], ['tall', '🦒'],
      ['blue', '🔵'], ['pink', '🩷'], ['calm', '😌'], ['dark', '🌑']],
  5: [['happy', '😊'], ['green', '🟢'], ['brown', '🟤'], ['sweet', '🍬'], ['angry', '😠'], ['quiet', '🤫'],
      ['clean', '🧼'], ['shiny', '✨']],
  6: [['yellow', '🟡'], ['purple', '🟣'], ['sleepy', '😴'], ['hungry', '🍽️'], ['bright', '💡'], ['sticky', '🍯']],
}

export const WORD_TYPES: { id: WordType; label: string; icon: string }[] = [
  { id: 'nouns', label: 'Nouns', icon: '🍎' },
  { id: 'actions', label: 'Action words', icon: '🏃' },
  { id: 'describing', label: 'Describing words', icon: '🌈' },
]
const WORD_SETS: Record<WordType, Record<number, [string, string][]>> = {
  nouns: NOUNS, actions: ACTIONS, describing: DESCRIBING,
}

function spellingRound(len: number, wordType: WordType = 'nouns'): Round {
  const set = WORD_SETS[wordType] || NOUNS
  const list = set[len] || set[3]
  const [word, picture] = list[Math.floor(Math.random() * list.length)]
  const target = word.toUpperCase().split('')
  return { target, picture, spoken: word }
}

// A real phone keyboard, so practising here is practising for typing messages.
// English on-screen keyboards are QWERTY almost everywhere (including India);
// French and German-family locales use their own variants.
const ROWS = {
  qwerty: ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'],
  azerty: ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'],
  qwertz: ['QWERTZUIOP', 'ASDFGHJKL', 'YXCVBNM'],
}

export function keyboardRows(locale: string): string[][] {
  const lang = (locale || '').toLowerCase().split('-')[0]
  const layout =
    lang === 'fr' ? ROWS.azerty :
    ['de', 'cs', 'sk', 'hu', 'sl', 'hr'].includes(lang) ? ROWS.qwertz :
    ROWS.qwerty
  return layout.map(r => r.split(''))
}

/** The games a child chooses from, in groups. A game appears once the screen for it exists. */
export type GameGroupId = 'numbers' | 'thinking' | 'letters' | 'life'
export const GAME_GROUPS: { id: GameGroupId; title: string; blurb: string; icon: string }[] = [
  { id: 'numbers', title: 'Numbers', blurb: 'Counting and number order', icon: '🔢' },
  { id: 'thinking', title: 'Thinking', blurb: 'Patterns, sorting, puzzles and matching', icon: '🧩' },
  { id: 'letters', title: 'Letters and writing', blurb: 'Words, letters and drawing', icon: '✏️' },
  { id: 'life', title: 'Everyday life', blurb: 'Habits and routines', icon: '🏠' },
]

export const GAME_TILES: { id: GameId; group: GameGroupId; title: string; blurb: string; icon: string }[] = [
  { id: 'numbers', group: 'numbers', title: 'Number Steps', blurb: 'Copy the numbers.', icon: '🔢' },
  { id: 'count', group: 'numbers', title: 'How Many?', blurb: 'Count, then choose.', icon: '🧮' },
  { id: 'dots', group: 'numbers', title: 'Connect the Dots', blurb: 'Join 1, 2, 3.', icon: '🔵' },
  { id: 'pattern', group: 'thinking', title: 'What Comes Next?', blurb: 'Carry on the pattern.', icon: '🔁' },
  { id: 'sort', group: 'thinking', title: 'Sort It', blurb: 'Put them in bins.', icon: '🗂️' },
  { id: 'odd', group: 'thinking', title: 'Odd One Out', blurb: 'Which is different?', icon: '❓' },
  { id: 'puzzle', group: 'thinking', title: 'Jigsaw', blurb: 'Finish the picture.', icon: '🧩' },
  { id: 'spot', group: 'thinking', title: 'Spot the Differences', blurb: 'Find what is different.', icon: '🔍' },
  { id: 'match', group: 'thinking', title: 'Matching Objects', blurb: 'Join the pairs.', icon: '🔗' },
  { id: 'spelling', group: 'letters', title: 'Spelling Bees', blurb: 'Copy the word.', icon: '🐝' },
  { id: 'letters', group: 'letters', title: 'Letters & Numbers', blurb: 'Draw the letter or number.', icon: '🔤' },
  { id: 'trace', group: 'letters', title: 'Trace the Lines', blurb: 'Draw along the line.', icon: '✏️' },
  { id: 'habits', group: 'life', title: 'Helpful Habits', blurb: 'Sort what helps.', icon: '🪣' },
  { id: 'memory', group: 'thinking', title: "Memory Pairs", blurb: "Find the matching cards.", icon: '🃏' },
  { id: 'shapes', group: 'thinking', title: "Colours and Shapes", blurb: "Find the colour or shape.", icon: '🔶' },
  { id: 'maze', group: 'thinking', title: "Maze", blurb: "Draw the way through.", icon: '🌀' },
  { id: 'colouring', group: 'letters', title: "Colour It In", blurb: "Paint the picture.", icon: '🖍️' },
]

/** Spot the Differences has no keys: its "length" is how many differences to find. */
export const SPOT = { minLen: 1, maxLen: 5, defaultLen: 2 }

/** Trace the Lines: the "length" is how hard the lines are, from straight (1) to loops and crosses (5). */
export const TRACE = { minLen: 1, maxLen: 5, defaultLen: 1 }

/** Letters & Numbers: how hard the letters and numbers are, from straight strokes (1) to the hardest curves (4). */
export const MATCH = { minLen: 2, maxLen: 6, defaultLen: 3 }
export const LETTERS = { minLen: 1, maxLen: 3, defaultLen: 1 }

export const LETTER_CASES: { id: 'upper' | 'lower' | 'both' | 'numbers'; label: string; icon: string }[] = [
  { id: 'upper', label: 'Capital letters', icon: 'A' },
  { id: 'lower', label: 'Small letters', icon: 'a' },
  { id: 'both', label: 'Both letters', icon: 'Aa' },
  { id: 'numbers', label: 'Numbers', icon: '123' },
]

export const GAMES: Record<KeyGameId, Game> = {
  numbers: {
    id: 'numbers',
    title: 'Number Steps',
    blurb: 'Copy the numbers in order.',
    keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''], // T9 layout
    cols: 3, minLen: 2, maxLen: 6, defaultLen: 3,
    makeRound: numberRound,
    say: d => DIGIT_WORDS[d],
  },
  spelling: {
    id: 'spelling',
    title: 'Spelling Bees',
    blurb: 'Copy the word letter by letter.',
    keys: [],
    rows: keyboardRows('en'),
    cols: 10, minLen: 3, maxLen: 6, defaultLen: 3,
    makeRound: spellingRound,
    say: l => LETTER_NAMES[l],
  },
}


// ── How hard / how long, for every game, in one place ──
// The slider in the settings, what a saved value may be, and the starting value all come from here.

export const NEW_LEVELS = { minLen: 1, maxLen: 3, defaultLen: 1 }

export const GAME_SETTINGS: Record<GameId, { min: number; max: number; def: number; label: string; note?: string }> = {
  numbers: { min: GAMES.numbers.minLen, max: GAMES.numbers.maxLen, def: GAMES.numbers.defaultLen, label: 'Number Steps: numbers in a round', note: 'From 4 numbers on, a number may repeat.' },
  spelling: { min: GAMES.spelling.minLen, max: GAMES.spelling.maxLen, def: GAMES.spelling.defaultLen, label: 'Spelling Bees: letters in a word' },
  spot: { min: SPOT.minLen, max: SPOT.maxLen, def: SPOT.defaultLen, label: 'Spot the Differences: differences to find' },
  trace: { min: TRACE.minLen, max: TRACE.maxLen, def: TRACE.defaultLen, label: 'Trace the Lines: how hard (1 is straight lines)' },
  letters: { min: LETTERS.minLen, max: LETTERS.maxLen, def: LETTERS.defaultLen, label: 'Letters & Numbers: how much to trace (1 is the start of each, 3 is all of it)' },
  match: { min: MATCH.minLen, max: MATCH.maxLen, def: MATCH.defaultLen, label: 'Matching Objects: pairs to join' },
  habits: { min: HABIT_ROUND.minLen, max: HABIT_ROUND.maxLen, def: HABIT_ROUND.defaultLen, label: 'Helpful Habits: cards in a round' },
  count: { min: 1, max: 3, def: 1, label: 'How many?: how big the numbers get (1 is up to 3, 3 is up to 10)' },
  pattern: { min: 1, max: 3, def: 1, label: 'What comes next?: how long the pattern is (1 is two things, 3 is three)' },
  sort: { min: 1, max: 3, def: 1, label: 'Sort it: how many things to sort (1 is four, 3 is eight)' },
  odd: { min: 1, max: 3, def: 1, label: 'Odd one out: how alike they are (1 is very different)' },
  puzzle: { min: 1, max: 6, def: 1, label: 'Jigsaw: pieces (1 is four, 4 is twelve, 5 is 24, 6 is 36)', note: 'Levels 5 and 6 are for your own photos. The drawn pictures stop at twelve pieces.' },
  dots: { min: 1, max: 3, def: 1, label: 'Connect the dots: how many dots (1 is up to 6, 3 is up to 15)' },
  memory: { min: 1, max: 3, def: 1, label: "Memory pairs: how many cards (1 is six, 3 is sixteen)" },
  shapes: { min: 1, max: 3, def: 1, label: "Colours and shapes: how many to choose from (1 is three, 3 is six, asking colour and shape together)" },
  maze: { min: 1, max: 3, def: 1, label: "Maze: how big (1 is small, 3 is the biggest)" },
  colouring: { min: 1, max: 3, def: 1, label: "Colour it in: how many parts to paint (1 is a few big parts, 3 is many small ones)" },
}

export const isGameId = (x: unknown): x is GameId => (ALL_GAME_IDS as readonly string[]).includes(x as string)
