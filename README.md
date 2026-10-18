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
npm run test:stats                   # that the counts are cleaned before they are kept
npm run build && npm run test:offline   # every page and file works with no connection
```

The games need nothing but the code. The database is only for the anonymous counts: without it the games
still run. There is **no admin here**. The numbers are read in Admin → Little Steps on the portfolio site,
so there is one place to look at everything.

### Environment

| Variable | What for |
|---|---|
| `MONGODB_URI` | The database for the anonymous counts and shared names |
| `MONGODB_DB` | Database name (default `pradeep-site`, where the numbers already live) |
| `NEXT_PUBLIC_SITE_URL` | Optional: this site's address, for previews |
| `NEXT_PUBLIC_PORTFOLIO_URL` | Where the "By Pradeep Miriyala" links go (default `https://pradeep.miriyala.in`) |

## Deploying (Vercel)

1. Import the GitHub repository as a new Vercel project (framework: Next.js, nothing else to set).
2. Add the environment variables above (`MONGODB_URI` must be the same database the portfolio admin reads).
3. Add the subdomain under Project → Settings → Domains, and the `CNAME` record Vercel shows at your DNS.
4. The portfolio already links here and redirects its old `/parenting` address to this site.

## How it works

Calm practice games for autistic children, installable on a phone as its own app ("Little Steps").
No account, no timer, no score. Everything a child does (settings, rounds, stickers, name) stays in the
browser's `localStorage`. The only things that reach the server are **anonymous counts** (see
*Counts and privacy* below), which a parent can switch off, and a first name only if a parent
chooses to share it. The site says so on its About page and in the parents' Privacy page.

### Screens and addresses

Every screen has its own address, so Back, reload and a shared link go where you would expect.

| Address | What it is |
|---|---|
| `/` | The games, in groups; each group is a panel that opens and closes, and each tile is a link |
| `/games/<id>` | One game (`/games/count`, `/games/spelling`...); built ahead of time for every id |
| `/stickers` | The sticker album |
| `/about` | What Little Steps is, in words for a parent. No links that lead off the site |
| `/copyright` | Who made it, what is covered, what stays the parent's (their photos and recordings), and the open source parts it uses. Linked from the menu, About and the parents' page |
| `/parents` · `/parents/child` · `progress` · `settings` · `voice` · `pictures` · `share` · `feedback` · `privacy` | Everything for grown-ups, behind a press-and-hold lock (`ParentGate`). Open for 15 minutes in that tab, then it closes |

A header runs across the top (`AppShell.tsx`): a back arrow, where you are (`nav.ts` is the one table of titles and
"back" targets), the sticker count and a menu panel from the right. In a game it carries the blue ▶ for play mode
instead of the stickers. The menu has the games, stickers, a sound switch, and, under "For grown-ups", the parents'
area and About. Anything that leads off the site (the author, GitHub, Share) is only inside the parents' area.
Settings, the child's details and progress are shared by every screen through one provider (`store.tsx`) that reads
and writes the same two `localStorage` keys as before. On a phone held sideways the header steps aside and a slim bar
inside the game (`GameScreen.tsx`) carries the controls, so the game keeps the room.

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
| Connect the Dots | Draws a line from dot to dot: press on dot 1 and drag to 2, then on to 3 without lifting. Tapping the next dot works too. The shape closes and fills in | 8 pictures (kite, house, boat, arrow, star, rocket, tree, heart); level 1 is 4–6 dots, 3 is 11–16 |
| What Comes Next? | Picks the picture that carries a pattern on | A-B, then A-A-B / A-B-B, then A-B-C; coloured shapes, shapes, or drawings; 5 questions |
| Sort It | Drags a picture to the right bin | By colour, shape, size or what it is; 2–3 bins, 4–8 things |
| Odd One Out | Taps the one that is different | Another kind of thing (3 or 4 pictures), later a different colour, shape or size |
| Jigsaw | Drags pieces onto a board that shows the picture faintly. With a parent's photo it is a free table: pieces lie loose and are moved anywhere (see *Your pictures*) | 4, 6, 9 or 12 pieces, and with a photo also 24 and 36; in the drawn version (which stops at 12) every piece has a drawing of its own, so no two pieces look alike |
| Memory Pairs | Turns over two cards at a time to find matching pictures | 3, 6 or 8 pairs. A pair that matches stays; one that does not turns back after a moment, quietly. No move count, no timer. The word is spoken when sound is on. If stuck, the mate of the turned card (or a card not seen yet) pulses (`memory/logic.ts`) |
| Colours and Shapes | Taps the one that fits: "Find the red one.", "Find the circle.", "Find the blue triangle." | 5 questions; 3, 4 or 6 choices. Level 1 changes one thing at a time, level 2 changes both but asks about one, level 3 asks about both with look-alikes. Every question has exactly one right answer (`makeShapesRound` in `thinking/rounds.ts`) |
| Maze | Draws a line with a finger from the start (an animal) to the end (its food) through a maze | 4 by 3, 5 by 4 or 8 by 6 cells. Every maze has exactly one way through and no loops. The line follows the finger as far as there are passages and stops at a wall, which glows; nothing buzzes. Press the end of the line to carry on, press anywhere on it to go back to that place, or tap the next cell for a single step. If stuck, a dotted line shows the way on, or the way back out of a dead end (`maze/maze.ts`) |
| Colour It In | Picks a colour and touches a part of a picture to paint it, or drags a finger across several | 10 pictures drawn in code as shapes (5 to 12 parts; level 1 uses the three simplest, level 3 all ten), 12 colours. Nothing can go wrong: Undo takes back the last stroke, white takes a colour off, Start again can itself be undone. "I am finished" ends the round and earns a sticker (`colouring/pictures.ts`) |
| Helpful Habits | A card shows something a child does; drag it to "Helps me" or "Does not help me" (or tap the bucket) | 28 cards; 3–10 per round; right = sparkle and a sentence ("Brushing my teeth helps me."); wrong = buzz and the card slides back; no "good"/"bad" wording |

The home screen groups the games (Numbers, Thinking, Letters and writing, Everyday life) in `GAME_GROUPS` and
`GAME_TILES` (`gameDefs.ts`). **Adding a game** is: its id in `ALL_GAME_IDS`, one entry in `GAME_SETTINGS` (the slider
and its limits), one in `GAME_TILES` (title, group, icon), its screen in `GameScreen.tsx`, and its key in `progress.ts` and
`lib/stats.ts`. The service worker's page list comes from `ALL_GAME_IDS`, so it needs nothing. The thinking games' content and rounds live in `thinking/rounds.ts`, one dependency-free
file that `scripts/test-thinking.mts` runs thousands of rounds of.

### How it behaves

- **Tile home.** The page opens on a grid of tiles, one panel for each group of games (Numbers, Thinking, Letters and
  writing, Everyday life). A panel's header, with its icon, name and number of games, opens and closes it; all are open
  to begin with, and the device remembers the closed ones (`closedGroups` in the saved settings, `homePanels.ts`; a new
  group starts open). A closed panel is hidden from the keyboard and from screen readers, takes no room, and slides
  shut unless the phone asks for reduced motion. A game opens from it. A "Games" button (and the
  phone's Back button) returns. Leaving a round that is under way asks "Finish this one first?".
  The tiles carry no scores or progress counts, on purpose (a panel's number is only how many games are in it).
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
- **Play mode.** A parent opens a game and taps the round blue ▶ button in the header. Only the game stays on
  screen: no header, no menu, no site navigation. Leaving needs a press-and-hold of the lock for about
  2.5 seconds. It survives a reload, and any other address (the Back button, a typed one) sends the child straight
  back to the game they were in.
- **Works offline.** Everything runs on the device, and a small service worker (`public/sw.js`,
  scoped to the whole site, answering only the app's own pages and never the API) keeps every page, its scripts, the icons and the fonts. One visit is enough:
  the page hands the worker the list of pages and its own files once it has loaded (`PwaInstall.tsx`; the pages
  again about once a week), because on a first visit the worker starts too late to see them. The worker saves each
  page and reads the scripts out of it. Pages are network first, so a visit with a connection is always current.
  The installed app's launch address (`?src=pwa`) is the same saved page. `scripts/test-offline.mts` checks all of
  this against the built site. Spoken praise uses the phone's own voices, so some Android voices may stay
  quiet offline; the sparkle, buzz and chime are generated in the browser and always work. Bump `VERSION`
  in `sw.js` to force every phone to drop its saved copy.
- **Your voice.** In the parents' area (Your voice) a parent can record up to three congratulations ("Well done! I am so proud of
  you.", the child's name if they like), up to 8 seconds each (`VoiceSettings.tsx`). At the end of a round one is
  played in place of the computer voice, chosen at random and never the same twice in a row; with none recorded
  (or "Play my recordings" off, or a clip that cannot be played) the computer voice is used exactly as before.
  Recordings play even when Sound is off, because the parent made them to be heard. They are kept in IndexedDB on
  that device only (`voice/store.ts`), never uploaded, never counted. The microphone is asked for only when Record
  is tapped and let go the moment it stops. Playback goes through one shared Web Audio engine woken by the first
  touch (`voice/player.ts`), which is more reliable on iPhones than an audio element. Safari can clear a site's saved
  data after about a week without a visit unless the page is installed, so the settings say to add it to the home
  screen. They are made and kept per device: record on the phone the child plays on.
- **Your pictures.** In the parents' area (Your pictures) a parent adds up to 12 photos for the Jigsaw
  (`PicturesSettings.tsx`). Each photo is made ready on the device (`pictures/prepare.ts`): turned the right way up,
  cropped to 4 by 3 from the middle, shrunk to at most 1200 by 900 and saved again as a JPEG, which also drops
  hidden details such as where the photo was taken. Photos are kept in IndexedDB on that device only
  (`pictures/store.ts`), never uploaded, never counted, and the same Safari note as Your voice applies. The Jigsaw
  then plays either a photo or a drawn picture each round: a parent chooses *my photos and the drawn pictures*
  (about half each, never the same photo twice running), *only my photos*, or *only the drawn pictures*. With no
  photos, or a browser that cannot keep them, it is the drawn pictures exactly as before.
  - **How a photo is cut** (`pictures/cut.ts`, pure geometry). A grid of 4, 6, 9, 12, 24 (6 by 4) or 36 (6 by 6) pieces. Every inner edge gets
    a random knob or hole (a different one each round); two neighbours share one curve, so they always fit and the
    pieces add up to exactly the picture. A parent can switch to plain edges (straight cuts, no knobs).
  - **How it plays** (`PhotoJigsaw.tsx`). The board is at the top and the loose pieces lie on a shelf under it, all in
    one SVG. A child drags a piece anywhere. Let go near its place (about 40% of a piece away, and never less than 22 units, so small pieces are still easy to place) and it clicks in with
    the sparkle; let go anywhere else and it stays where it was dropped, with no buzz and no score. Tapping a piece,
    then its place, works too. A faint copy of the photo on the board is on by default and can be switched off. The
    usual hint pulses the place for the piece last touched.
- **Draw the line (Connect the Dots).** A line follows the finger from the last joined dot. When it comes within reach
  of the next dot it clicks on and carries on from there, so a whole picture can be drawn without lifting. Lifting
  early just removes the loose line; nothing joined is lost. Tapping the next dot still joins it, for a child who finds
  drawing hard. Letting go on a dot that is not next gets the same soft buzz and shake as tapping it. How close counts
  as "on a dot" (`dotReach` in `thinking/rounds.ts`) is up to 32 units but never more than 48% of the gap to the
  nearest dot, so two dots never share a place. If the child is stuck, the next dot pulses and a dotted line shows the way.
- **Share the app.** *For parents → Share the app* (`ShareApp.tsx`): the phone's own share sheet where there is one, copy
  the link, WhatsApp, email, and a QR code for another phone to scan (`share/share.ts`; the QR grid comes from the small
  `qrcode-generator` package and is drawn here as one SVG path, so it works offline). Only the address of the app is
  shared, never anything about the child, and sharing is not counted.
- **Feedback.** *For parents → Feedback* (`FeedbackForm.tsx`): a parent picks what it is about (something they like, an
  idea, something not working, something else), writes up to 1000 letters, and may add an email address if they want
  a reply. It is sent only when they press Send, to `POST /api/feedback`, which checks every field (`src/lib/feedback.ts`)
  and saves it in `parenting_feedback`. Unlike the counts it answers honestly, so a parent knows whether it went: if it
  cannot be sent the words stay in the box. A box that people cannot see catches scripts (they are told it worked and
  nothing is kept), and one address can send five an hour. The page asks parents not to write their child's name.
- **Stickers.** Each finished round earns one of 30 stickers, chosen at random, shown in an album the
  child can open. Nothing is ever taken away; an unfinished round earns nothing.
- **Parent summary.** *For parents → This week*: rounds finished in the last 7 days (a small bar chart and a
  per-game count), stickers and the all-time total. Finished rounds are counted, never scored.
- **Settings (For parents).** Sound, round length per game, tracing steps, hint delay, sprinkles, and the
  child's name / age / favourite colour (used for praise and the sprinkle colours). Setting the age
  suggests starting lengths once; the game never changes them again by itself.

### What is stored, and where

| `localStorage` key | Holds |
|---|---|
| `parentingGames.v1` (the name predates this site, kept so saved settings carry over) | Settings: game, lengths, theme, sound, hint delay, child details, play mode |
| `parentingProgress.v1` | Rounds finished per day per game (120 days kept) and the stickers earned |

Both are read defensively (`cleanProgress`, bounds checks), so a damaged entry cannot break the page.
"Forget my child's details" and "Clear stickers and progress" are in the settings.

### Counts and privacy

The portfolio's Admin → Little Steps shows who is on the games page now, the last 14 days (visits, visits that
opened a game, rounds finished, minutes), a per-game breakdown, and any names parents chose to share. That
dashboard lives there, not here; this site only writes the counts. If the records or the list of games change,
change `src/lib/parentingStats.ts` on the portfolio to match.

What the page sends (`src/games/stats.ts`, to `POST /api/ping`):

| Ping | When | Carries |
|---|---|---|
| heartbeat | every 30 s while the page is open, visible and in use (3 quiet minutes stops it), and on switching between the tiles and a game | which game is open, or "home"; a random id made fresh on each page load |
| round | a round is finished | the game |
| forget | a parent switches sharing off | the random share id |

What the server keeps (`src/lib/stats.ts`):

| Collection | Holds | Lifetime |
|---|---|---|
| `parenting_daily` | one document per India day, counters only | kept |
| `parenting_live` | the fresh page-load id, the game and a time | TTL index, 15 minutes |
| `parenting_shared` | a first name, an age group and counts, **only for a parent who switched sharing on** | removed when sharing is switched off, deletable from the portfolio admin, TTL one year |
| `parenting_feedback` | a message a parent chose to write and send, what kind it is, the time, and an email address **only if they added one** (`src/lib/feedback.ts`) | TTL one year. It is not linked to the counts, and no address, user agent or cookie is kept. The portfolio admin does not read it yet: add a reader there, and show the message as plain text, never as HTML |

There are no cookies, IP addresses, user agents or persistent ids. Counting is off for browsers that
send Do Not Track or Global Privacy Control, when the parent switches it off (Settings → Privacy), and
in development builds. Name sharing is off by default and needs counting on. The ping endpoint
never reports errors to the page, drops malformed bodies, caps size, and rate-limits per address in
memory (the address is never stored).

**Vercel Analytics** (page views, no cookies) is held to the same switches by `GatedAnalytics.tsx`: it is not loaded
for a browser that sends Do Not Track or Global Privacy Control, or when counting is off, and if counting is switched
off later every further event is dropped in `beforeSend`. It also has to be enabled in the Vercel project's Analytics tab.

### Where the code is

```
src/games/
├── styles.ts                           # all the games' CSS (one template string)
├── store.tsx                           # settings, child, progress, play mode: shared by every screen
├── AppShell.tsx · nav.ts · shellContext.ts · shellStyles.ts   # header, menu, play bar; addresses and titles
├── HomeScreen.tsx · GameScreen.tsx · KeyGame.tsx · StickerBook.tsx · ParentGate.tsx
├── parents/                            # ParentHub, ChildForm, ProgressView, SettingsForm, PrivacyForm, VoicePage
├── SpotGame.tsx · TraceGame.tsx · MatchGame.tsx · HabitsGame.tsx
├── CountGame · PatternGame · SortGame · OddGame · PuzzleGame · DotsGame (.tsx) · Pic.tsx
├── gameDefs.ts · profile.ts · progress.ts · stats.ts (anonymous counts)
├── VoiceSettings.tsx · voice/ (store.ts IndexedDB, player.ts Web Audio, pick.ts which clip)
├── PicturesSettings.tsx · JigsawGame.tsx (photo or drawn, each round) · PhotoJigsaw.tsx
├── MemoryGame.tsx · memory/logic.ts (cards, turning, hints) · ShapesGame.tsx · MazeGame.tsx · maze/maze.ts (maze, way through, walking the line) · ColouringGame.tsx · colouring/pictures.ts (pictures as shapes, colours)
├── ShareApp.tsx · share/share.ts (message, links, QR) · FeedbackForm.tsx
├── pictures/ cut.ts (the cut and the table) · prepare.ts (crop and shrink) · store.ts (IndexedDB) · prefs.ts (choices, next picture)
├── feedback.ts (voice, ding, buzz, chime) · sprinkles.tsx · useStuck.ts
├── HoldToUnlock.tsx · InfoButton.tsx · PwaInstall.tsx · icons.tsx
├── spot/   generate.ts (scenes + differences as data) · art.tsx (the SVG drawings)
├── trace/  shapes.ts (27 line shapes) · letters.ts (A–Z, a–z, 0–9 as strokes) · score.ts (the judge)
├── match/  generate.ts (a round: objects, capital/small letters or words to pictures, shuffled, none on the same row)
├── habits/ data.ts (the cards, kept gentle, and a round of them)
└── thinking/ rounds.ts (catalogue, count, pattern, sort, odd, puzzle, dots)
public/                       # manifest ("Little Steps"), service worker, icons, offline page
scripts/make-icons.mjs        # regenerates the app icons
src/lib/stats.ts · src/lib/feedback.ts   # what the server keeps (the dashboard that reads it is on the portfolio)
src/app/api/ping
src/app/ (page.tsx, games/[game], stickers, about, parents/*: thin pages that render the screens above)
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
node scripts/test-thinking.mts   # How Many?, patterns, Sort It, Odd One Out, Jigsaw and Connect the Dots: every round has one right answer; dots can be found by a finger without ever sharing a place
node scripts/test-habits.mts     # the habit cards: unique, balanced rounds, and gentle wording (no "bad", "naughty"...)
node scripts/test-progress.mts   # counting, stickers, weekly summary, damaged data
node scripts/test-stats.mts      # pings are cleaned before they are kept; names are capped; India's day
node scripts/test-colouring.mts  # colour it in: every part of every picture is big enough to touch and not hidden under another
node scripts/test-maze.mts       # maze: one way through and no loops at every size, and no swipe, however wild, can cross a wall
node scripts/test-shapes.mts     # colours and shapes: exactly one right answer in every question, at every level
node scripts/test-memory.mts     # memory pairs: every picture twice, turning rules, hints, and a simulated player finishes
node scripts/test-feedback.mts   # feedback: kinds, lengths, emails, hidden characters, scripts; and exactly what is kept
node scripts/test-share.mts      # share links are encoded and carry only the address; the QR code has its three corner marks
node scripts/test-jigsaw.mts     # photo Jigsaw: every cut fits and adds up to the picture, knobs stay in their room, crops, next picture
```

When a generated round is wrong, fix the generator, not the one instance.

### Adding things

- **A line shape:** add a generator and a `TOLERANCE` entry in `trace/shapes.ts`; the test script picks it up.
- **A picture theme or object:** add the drawing to `spot/art.tsx` and list it under a theme in
  `spot/generate.ts`; Spot the Differences and Matching Objects both use it.
- **A habit card:** add it to `habits/data.ts` (a phrase that reads both as "... helps me" and "... does not help me"); the test checks the wording.
- **A game:** add its id to `gameDefs.ts` (`GameId`, `GAME_TILES`), its screen in `GameScreen.tsx`, a length row in `GAME_SETTINGS`, and a
  key in `progress.ts` so its rounds are counted.
