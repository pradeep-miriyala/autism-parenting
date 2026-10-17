# Little Steps

Calm practice games for autistic children: numbers, patterns, sorting, puzzles, spelling and drawing.
No timers, no scores, no sign-up. Everything a child does stays on their device; the only thing sent is an
anonymous count of visits and finished rounds, which a parent can switch off.

A free project by [Pradeep Miriyala](https://pradeep.miriyala.in). Installable on a phone ("Add to home
screen") and works offline after one visit.

## Run it

```bash
npm install
cp .env.local.example .env.local     # fill in; see below
npm run dev                          # http://localhost:3000
npm test                             # every round of every game, thousands of generated cases
npm run test:stats                   # the dashboard numbers, against a throwaway database
```

The games need nothing but the code. The database is only for the anonymous counts and the dashboard, and
the admin login only for the dashboard: with neither configured, the games still run.

### Environment

| Variable | What for |
|---|---|
| `MONGODB_URI` | The database for the anonymous counts and shared names |
| `MONGODB_DB` | Database name (default `pradeep-site`, where the numbers already live) |
| `ADMIN_EMAIL` · `ADMIN_PASSWORD_PLAIN` · `NEXTAUTH_SECRET` | Sign in to `/admin` |
| `NEXTAUTH_URL` | This site's address (`http://localhost:3000` locally; the real address in production) |
| `NEXT_PUBLIC_SITE_URL` | Optional: this site's address, for previews |
| `NEXT_PUBLIC_PORTFOLIO_URL` | Where the "By Pradeep Miriyala" links go (default `https://pradeep.miriyala.in`) |

## Deploying (Vercel)

1. Import the GitHub repository as a new Vercel project (framework: Next.js, nothing else to set).
2. Add the environment variables above. Set `NEXTAUTH_URL` to the address the site will be served from.
3. Add the subdomain under Project → Settings → Domains, and the `CNAME` record Vercel shows at your DNS.
4. Once it is live, point the portfolio at it: in the portfolio's Vercel project set
   `PARENTING_SITE_URL` to this site's address and redeploy. Its `/parenting` address then redirects here.

## How it works

Calm practice games for autistic children, installable on a phone as its own app ("Little Steps").
No account, no timer, no score. Everything a child does (settings, rounds, stickers, name) stays in the
browser's `localStorage`. The only things that reach the server are **anonymous counts** (see
*Dashboard and privacy* below), which a parent can switch off, and a first name only if a parent
chooses to share it. The page says so, in the "For parents" note and the settings' Privacy section.

### The games

| Game | What the child does | Notes |
|---|---|---|
| Number Steps | Copies a sequence of numbers on a phone-style pad | Length set by the parent; repeats appear from 4 numbers on |
| Spelling Bees | Spells a picture-word on a QWERTY keyboard | Word types: nouns, action words, describing words; keyboard layout follows the browser language |
| Spot the Differences | Finds what differs between two pictures | Themes: farm, sea, town, school, home |
| Trace the Lines | Draws along a line shape, then (optionally) draws it freehand | 27 shapes, from straight lines to spirals and stars |
| Letters & Numbers | The same, for A–Z, a–z and 0–9 | Capital / small / both / numbers. Always **in order** (A to Z, a to z, 0 to 9; for both, a capital then its small form), carrying on where they left off; an unfinished one returns and the settings have "Start the order again". The level is **how much of each is traced**: 1 the start of it (about a third to a half of the line), 2 most of it (about two thirds to four fifths), 3 all of it. The whole letter always shows faintly; only the part has the dotted guide, and tracing on past it is fine |
| Matching Objects | Joins each picture on one side to its twin on the other | Draw a line, or tap one then its twin; 2–6 pairs. Pictures from five themes, or **capital letters on the left matched to small letters on the right** (short rounds use the letters whose small form looks like the capital, such as C/c; an I and an L never share a round), or **a word on the left matched to its picture on the right**: things (30 drawings), animals (14, six drawn just for this) or colours (7 swatches). Words in a round start with different letters |
| How Many? | Counts a group of the same thing and taps the number | Tap each thing to count it (1, 2, 3 appear); 5 questions; level 1 is up to 3, level 3 up to 10 |
| Connect the Dots | Taps numbered dots in order; the shape closes and fills in | 8 pictures (kite, house, boat, arrow, star, rocket, tree, heart); level 1 is 4–6 dots, 3 is 11–16 |
| What Comes Next? | Picks the picture that carries a pattern on | A-B, then A-A-B / A-B-B, then A-B-C; coloured shapes, shapes, or drawings; 5 questions |
| Sort It | Drags a picture to the right bin | By colour, shape, size or what it is; 2–3 bins, 4–8 things |
| Odd One Out | Taps the one that is different | Another kind of thing (3 or 4 pictures), later a different colour, shape or size |
| Jigsaw | Drags pieces onto a board that shows the picture faintly | 4, 6 or 9 pieces; every piece has a drawing of its own, so no two pieces look alike |
| Helpful Habits | A card shows something a child does; drag it to "Helps me" or "Does not help me" (or tap the bucket) | 28 cards; 3–10 per round; right = sparkle and a sentence ("Brushing my teeth helps me."); wrong = buzz and the card slides back; no "good"/"bad" wording |

The home screen groups the games (Numbers, Thinking, Letters and writing, Everyday life) in `GAME_GROUPS` and
`GAME_TILES` (`gameDefs.ts`). **Adding a game** is: its id in `ALL_GAME_IDS`, one entry in `GAME_SETTINGS` (the slider
and its limits), one in `GAME_TILES` (title, group, icon), its screen in `Games.tsx`, and its key in `progress.ts` and
`lib/stats.ts`. The thinking games' content and rounds live in `thinking/rounds.ts`, one dependency-free
file that `scripts/test-thinking.mts` runs thousands of rounds of.

### How it behaves

- **Tile home.** The page opens on a grid of tiles; a game opens from it. A "Games" button (and the
  phone's Back button) returns. Leaving a round that is under way asks "Finish this one first?".
  The tiles carry no scores or counts, on purpose.
- **Feedback is the same everywhere.** A wrong choice gets a soft buzz and a short shake; every
  right choice gets a small sparkle sound. Both play whether or not the sound setting is on (a game
  that only makes noise for mistakes teaches children to hunt for mistakes). The sound setting adds
  spoken numbers, letters and praise.
- **A reload does not lose the game.** The open game is remembered for the life of the tab (`sessionStorage`), so
  an accidental reload (iPhone Safari can still do one) goes back to that game; a fresh visit still opens on the tiles.
- **No accidental refresh.** Once a game is open (or play mode is on), pulling the page down does not refresh
  it: `overscroll-behavior` for Chrome and Android, and a small touch guard for iPhone Safari, which ignores
  the CSS. Scrolling up, the settings dialogs and the tiles are unaffected.
- **Hints, not hurry.** After a pause (parent-set, default 10 s) or two misses in a row, the next
  right answer gently pulses (`useStuck.ts`).
- **Play mode.** A parent opens a game and taps the round blue ▶ button at the end of the top row (on the tiles it
  only explains this). Only the game stays on screen:
  no games menu, no settings, no site navigation. Leaving needs a press-and-hold of the lock for about
  2.5 seconds; the lock sits exactly where the ▶ button was. It survives a reload, and the Back button does nothing while it is on.
- **Works offline.** Everything runs on the device, and a small service worker (`public/sw.js`,
  scoped to the whole site but answering only the home page, never the dashboard or the API) keeps the page, its scripts, the icons and the fonts. One visit is enough:
  the page hands the worker its own file list once it has loaded (`PwaInstall.tsx`), because on a first
  visit the worker starts too late to see them. The installed app's launch address (`?src=pwa`) falls
  back to the saved page. Spoken praise uses the phone's own voices, so some Android voices may stay
  quiet offline; the sparkle, buzz and chime are generated in the browser and always work. Bump `VERSION`
  in `sw.js` to force every phone to drop its saved copy.
- **Your voice.** In the gear settings a parent can record up to three congratulations ("Well done! I am so proud of
  you.", the child's name if they like), up to 8 seconds each (`VoiceSettings.tsx`). At the end of a round one is
  played in place of the computer voice, chosen at random and never the same twice in a row; with none recorded
  (or "Play my recordings" off, or a clip that cannot be played) the computer voice is used exactly as before.
  Recordings play even when Sound is off, because the parent made them to be heard. They are kept in IndexedDB on
  that device only (`voice/store.ts`), never uploaded, never counted. The microphone is asked for only when Record
  is tapped and let go the moment it stops. Playback goes through one shared Web Audio engine woken by the first
  touch (`voice/player.ts`), which is more reliable on iPhones than an audio element. Safari can clear a site's saved
  data after about a week without a visit unless the page is installed, so the settings say to add it to the home
  screen. They are made and kept per device: record on the phone the child plays on.
- **Stickers.** Each finished round earns one of 30 stickers, chosen at random, shown in an album the
  child can open. Nothing is ever taken away; an unfinished round earns nothing.
- **Parent summary.** *Gear → This week*: rounds finished in the last 7 days (a small bar chart and a
  per-game count), stickers and the all-time total. Finished rounds are counted, never scored.
- **Settings (the gear).** Sound, round length per game, tracing steps, hint delay, sprinkles, and the
  child's name / age / favourite colour (used for praise and the sprinkle colours). Setting the age
  suggests starting lengths once; the game never changes them again by itself.

### What is stored, and where

| `localStorage` key | Holds |
|---|---|
| `parentingGames.v1` (the name predates this site, kept so saved settings carry over) | Settings: game, lengths, theme, sound, hint delay, child details, play mode |
| `parentingProgress.v1` | Rounds finished per day per game (120 days kept) and the stickers earned |

Both are read defensively (`cleanProgress`, bounds checks), so a damaged entry cannot break the page.
"Forget my child's details" and "Clear stickers and progress" are in the settings.

### Dashboard and privacy (`/admin`)

The dashboard at `/admin` shows who is on the games page now, the last 14 days (visits, visits that opened a
game, rounds finished, minutes), a per-game breakdown, and any names parents chose to share. It refreshes
every 30 seconds.

What the page sends (`src/games/stats.ts`, to `POST /api/ping`):

| Ping | When | Carries |
|---|---|---|
| heartbeat | every 30 s while the page is open, visible and in use (3 quiet minutes stops it), and on switching between the tiles and a game | which game is open, or "home"; a random id made fresh on each page load |
| round | a round is finished | the game |
| forget | a parent switches sharing off | the random share id |

What the server keeps (`src/lib/stats.ts`; the database is passed in, so it is testable):

| Collection | Holds | Lifetime |
|---|---|---|
| `parenting_daily` | one document per India day, counters only | kept |
| `parenting_live` | the fresh page-load id, the game and a time | TTL index, 15 minutes |
| `parenting_shared` | a first name, an age group and counts, **only for a parent who switched sharing on** | removed when sharing is switched off, deletable from the admin, TTL one year |

There are no cookies, IP addresses, user agents or persistent ids. Counting is off for browsers that
send Do Not Track or Global Privacy Control, when the parent switches it off (Settings → Privacy), and
in development builds. Name sharing is off by default and needs counting on. The ping endpoint
never reports errors to the page, drops malformed bodies, caps size, and rate-limits per address in
memory (the address is never stored).

### Where the code is

```
src/games/
├── styles.ts                           # all the games' CSS (one template string)
├── Games.tsx                           # tile home, settings, play mode, album, key games
├── SpotGame.tsx · TraceGame.tsx · MatchGame.tsx · HabitsGame.tsx
├── CountGame · PatternGame · SortGame · OddGame · PuzzleGame · DotsGame (.tsx) · Pic.tsx
├── gameDefs.ts · profile.ts · progress.ts · stats.ts (anonymous counts)
├── VoiceSettings.tsx · voice/ (store.ts IndexedDB, player.ts Web Audio, pick.ts which clip)
├── feedback.ts (voice, ding, buzz, chime) · sprinkles.tsx · useStuck.ts
├── HoldToUnlock.tsx · InfoButton.tsx · PwaInstall.tsx · CollapsibleFooter.tsx · icons.tsx
├── spot/   generate.ts (scenes + differences as data) · art.tsx (the SVG drawings)
├── trace/  shapes.ts (27 line shapes) · letters.ts (A–Z, a–z, 0–9 as strokes) · score.ts (the judge)
├── match/  generate.ts (a round: objects, capital/small letters or words to pictures, shuffled, none on the same row)
├── habits/ data.ts (the cards, kept gentle, and a round of them)
└── thinking/ rounds.ts (catalogue, count, pattern, sort, odd, puzzle, dots)
public/                       # manifest ("Little Steps"), service worker, icons, offline page
scripts/make-icons.mjs        # regenerates the app icons
src/lib/stats.ts               # what the server keeps and the dashboard reads
src/app/api/ping · src/app/api/admin/dashboard · src/app/admin
```

### How tracing is judged (`trace/score.ts`)

It is **not image comparison.** No pixels are ever looked at. The target is a list of points
(a polyline per stroke) and so is the child's drawing; the judge compares point lists in a
400 × 300 coordinate space that the canvas maps onto, so it behaves the same at any screen size.

1. **Capture.** `TraceGame` records the pointer positions of each stroke (pointer events work for
   finger, pen and mouse alike) and converts them into that coordinate space.
2. **Even spacing.** Strokes are resampled to a point every few units, so a fast scribble and a slow
   careful line weigh the same.
3. **Two questions, both must pass** (*trace* step):
   - *Coverage:* how much of the target line was reached? Every target point must have a drawn point
     within the shape's tolerance (about 15–26 units; tighter for spirals and loops). Needs 85%.
   - *Precision:* how much of the drawing stayed on the line? Judged **along the course**: the tracker
     follows the child from where they started and only counts the stretch just behind and a little way
     ahead as "on". Plain nearest-point distance is not enough for zigzags, loops or a plus, where a stray
     line lands near the *next* part of the shape and still looks right. Needs 85%.
   - Also, the amount drawn must be sensible: under 25% of the line is "unfinished"; over 2.2× is a scribble.
4. **Copy step** (draw it yourself, no guide): both shapes are slid to the middle and scaled to the same
   size, but never rotated, so a rotated or mirrored letter does not pass. Coverage and precision are
   judged on those normalised points, and **each stroke must be present on its own**. That is what stops
   *b* passing for *d*, *p* for *q*, or *E* for *F*, which look almost alike as a whole.
5. **Sparse finger samples.** A phone that is busy (the hint dot redraws every frame) or a quick finger delivers
   points far apart. The live check lets the course be that much further along over a long gap, the page keeps
   the browser's intermediate ("coalesced") points, and the hint dot hides while a finger is drawing. An honest
   line drawn with points up to 120 units apart must not raise the alarm; `test-trace.mts` checks this for every
   shape and character, and that a big wander is still caught when drawn that sparsely.
6. **Not lifting, and overshooting.** A shape with several strokes (1, 2, 3...) is often drawn without lifting
   the finger, the strokes joined by a line, or in another order, and a line is often drawn a little past its
   end. Once the end of a stroke has really been traced, travel on is not a stray: the line may go on to another
   stroke (it must come to that stroke's start and follow it for a little way; passing near or across one on the
   way does not count) and a small overshoot (about 30 units) is forgiven unless it goes on. The joining line is
   left out of "how much was drawn" and of the precision score, so it can't make a good drawing look like a
   scribble. `test-trace.mts` draws every multi-stroke shape and character this way (and past the ends) and
   requires 92–99% to go through cleanly; the old scorer managed about 2%.
7. **"Try again" only for a stray.** An unfinished line is left alone so the child can carry on. A
   wander (a stretch of about 40 units off course), a scribble or the wrong size gets the buzz and a gentle
   reset. A drawing is never marked "wrong"; the screen only says "done" or "not yet".

The thresholds are generous because small fingers wobble. `scripts/test-trace.mts` checks them against
thousands of simulated tries (honest wobble must pass; wanders, scribbles, dots, mirrored letters and
unfinished lines must not) across all 27 shapes and 62 characters. Matching and Spot the Differences are
different: their answers are data (which object pairs with which, where each difference is), so there
is nothing to "recognise".

### Tests

```bash
node scripts/test-trace.mts      # tracing judge: wobble vs wanders, all shapes and characters
node scripts/test-spot.mts       # 10,000 generated picture pairs are sound
node scripts/test-match.mts      # 10,000 picture rounds, 7,500 letter rounds and 12,000 word rounds are sound
node scripts/test-voice.mts      # which recorded message is picked: it exists, random, never the same twice running
node scripts/test-thinking.mts   # How Many?, patterns, Sort It, Odd One Out, Jigsaw and Connect the Dots: every round has one right answer
node scripts/test-habits.mts     # the habit cards: unique, balanced rounds, and gentle wording (no "bad", "naughty"...)
node scripts/test-progress.mts   # counting, stickers, weekly summary, damaged data
node --env-file=.env.local scripts/test-stats.mts   # dashboard numbers and privacy promises,
                                 # run against a throwaway database that is dropped afterwards
```

When a generated round is wrong, fix the generator, not the one instance.

### Adding things

- **A line shape:** add a generator and a `TOLERANCE` entry in `trace/shapes.ts`; the test script picks it up.
- **A picture theme or object:** add the drawing to `spot/art.tsx` and list it under a theme in
  `spot/generate.ts`; Spot the Differences and Matching Objects both use it.
- **A habit card:** add it to `habits/data.ts` (a phrase that reads both as "... helps me" and "... does not help me"); the test checks the wording.
- **A game:** add its id to `gameDefs.ts` (`GameId`, `GAME_TILES`), a length row in `Games.tsx`, and a
  key in `progress.ts` so its rounds are counted.
