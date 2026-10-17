// Helpful Habits: the cards, and a round of them.
//
// A card is something a child does, in plain words, with a picture. The child puts it where it belongs:
// "Helps me" or "Does not help me". The wording is deliberately gentle: there is no "good" and "bad", no
// "naughty" or "wrong", because a label like that lands as shame on a child who takes words literally. Each
// phrase is written so that "<phrase> helps me." and "<phrase> does not help me." both read as a sentence.
//
// What is left out on purpose: feelings and the ways a child copes with them (meltdowns, stimming, needing
// quiet), which are never a "habit that does not help"; anything about the body, food as reward or
// punishment, or other people's behaviour. These are everyday routines, safety and getting along: things a
// parent can look at and agree with. The list is meant to be read and changed by a parent.
//
// Dependency-free on purpose: scripts/test-habits.mts checks it.

export type Habit = { id: string; text: string; emoji: string; helps: boolean }

export const HABITS: Habit[] = [
  // Helps me
  { id: 'teeth', text: 'brushing my teeth', emoji: '🪥', helps: true },
  { id: 'wash', text: 'washing my hands', emoji: '🧼', helps: true },
  { id: 'please', text: 'saying please and thank you', emoji: '💬', helps: true },
  { id: 'wait', text: 'waiting for my turn', emoji: '⏳', helps: true },
  { id: 'tell', text: 'telling a grown-up when I am upset', emoji: '🗣️', helps: true },
  { id: 'hand', text: 'holding a hand to cross the road', emoji: '🚸', helps: true },
  { id: 'bed', text: 'going to bed on time', emoji: '🛏️', helps: true },
  { id: 'water', text: 'drinking water', emoji: '💧', helps: true },
  { id: 'veg', text: 'eating fruit and vegetables', emoji: '🥦', helps: true },
  { id: 'share', text: 'sharing my toys', emoji: '🧸', helps: true },
  { id: 'tidy', text: 'putting my toys away', emoji: '🧺', helps: true },
  { id: 'break', text: 'asking for a break when I need one', emoji: '🪑', helps: true },
  { id: 'belt', text: 'wearing my seatbelt in the car', emoji: '🚗', helps: true },
  { id: 'kind', text: 'using a kind voice', emoji: '🙂', helps: true },
  // Does not help me
  { id: 'hit', text: 'hitting when I am cross', emoji: '🥊', helps: false },
  { id: 'shout', text: 'shouting at people', emoji: '📢', helps: false },
  { id: 'take', text: 'taking toys without asking', emoji: '🎁', helps: false },
  { id: 'late', text: 'staying up very late', emoji: '🌙', helps: false },
  { id: 'screen', text: 'looking at a screen all day', emoji: '📱', helps: false },
  { id: 'road', text: 'running into the road', emoji: '🚦', helps: false },
  { id: 'throw', text: 'throwing my food', emoji: '🍝', helps: false },
  { id: 'germs', text: 'forgetting to wash my hands', emoji: '🦠', helps: false },
  { id: 'sweets', text: 'eating only sweets', emoji: '🍬', helps: false },
  { id: 'mess', text: 'leaving my toys on the floor', emoji: '🧩', helps: false },
  { id: 'unbelt', text: 'taking off my seatbelt in the car', emoji: '⚠️', helps: false },
  { id: 'push', text: 'pushing in the queue', emoji: '🚶', helps: false },
  { id: 'skip', text: 'skipping tooth brushing', emoji: '🦷', helps: false },
  { id: 'grab', text: 'grabbing instead of asking', emoji: '🖐️', helps: false },
]

export const HABIT_ROUND = { minLen: 3, maxLen: 10, defaultLen: 5 }

/** What is said, and shown, once a card is in the right place. */
export const sentence = (h: Habit) => `${h.text[0].toUpperCase()}${h.text.slice(1)} ${h.helps ? 'helps me' : 'does not help me'}.`

function shuffle<T>(a: T[], rand: () => number): T[] {
  const out = a.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * `n` different cards, about half and half, in an order where the same answer never comes three times in
 * a row (so a child cannot just keep tapping one bucket).
 */
export function makeHabitRound(n: number, rand: () => number = Math.random): Habit[] {
  const len = Math.max(HABIT_ROUND.minLen, Math.min(HABIT_ROUND.maxLen, Math.round(n)))
  const yes = shuffle(HABITS.filter(h => h.helps), rand)
  const no = shuffle(HABITS.filter(h => !h.helps), rand)
  const extra = rand() < 0.5 ? 1 : 0   // an odd round leans one way or the other
  const nYes = Math.floor(len / 2) + (len % 2 ? extra : 0)
  const picked = [...yes.slice(0, nYes), ...no.slice(0, len - nYes)]
  let order = shuffle(picked, rand)
  const streak = (a: Habit[]) => a.some((h, i) => i >= 2 && a[i - 1].helps === h.helps && a[i - 2].helps === h.helps)
  for (let tries = 0; tries < 100 && streak(order); tries++) order = shuffle(picked, rand)
  return order
}
