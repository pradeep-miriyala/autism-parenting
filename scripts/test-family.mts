// scripts/test-family.mts
// Checks Family faces for any family a parent might make: every question has exactly one right answer (even when two
// people share a relation, or a name that looks the same), the choices are all different people, relation questions are
// only asked when only one person fits, the family map has a place for everyone, and a square face photo is cropped right.
//
//     node scripts/test-family.mts

import {
  FAMILY_QUESTIONS, MAP_PEOPLE, MIN_FAMILY, NAME_CHOICES, NAME_VOICE_MIN_MS, NAME_VOICE_SECONDS, PHOTO_CHOICES, RELATIONS, RELATION_ICONS, ROW_ICONS, ROW_LABELS, ROW_ORDER, askable, cleanPersonName, cleanRelation,
  familyLevel, fits, isRelation, relationIcon, makeFamilyMap, makeFamilyQuestions, relationLabel, relationRow, sameName, type Person,
} from '../src/games/family/logic.ts'
import { MAX_PEOPLE, cleanPerson, freePlace } from '../src/games/family/store.ts'
import { PHOTO_SHAPES, cropBox, outputSize } from '../src/games/pictures/prepare.ts'
import { seeded } from '../src/games/spot/generate.ts'

let failed = 0
const check = (ok: boolean, what: string) => { if (!ok && failed++ < 25) console.error('FAIL', what) }

// ── Relations ──
check(RELATIONS.length === 13 && new Set(RELATIONS.map(r => r.id)).size === 13 && new Set(RELATIONS.map(r => r.label)).size === 13, 'thirteen relations, each different')
check(RELATIONS.every(r => ROW_ORDER.includes(r.row) && ROW_LABELS[r.row].length > 4 && r.label.length > 1), 'every relation has a row on the map and a label')
check(ROW_ORDER.every(row => RELATIONS.some(r => r.row === row)), 'every row of the map is used')
// pictures instead of words
check(RELATIONS.every(r => (RELATION_ICONS[r.id] ?? '').length >= 2), 'every relation has a picture')
check(new Set(RELATIONS.map(r => RELATION_ICONS[r.id])).size === RELATIONS.length, 'no two relations share a picture, so two choices are never alike')
check(Object.keys(RELATION_ICONS).length === RELATIONS.length && Object.keys(RELATION_ICONS).every(k => isRelation(k)), 'pictures only for relations that exist')
check(ROW_ORDER.every(row => (ROW_ICONS[row] ?? '').length >= 2) && new Set(ROW_ORDER.map(r => ROW_ICONS[r])).size === ROW_ORDER.length, 'every row of the map has its own picture')
check(relationIcon('mother') === RELATION_ICONS.mother && relationIcon('zzz') === RELATION_ICONS.other && relationIcon('') === RELATION_ICONS.other, 'an unknown relation gets the "someone special" picture')
check(isRelation('mother') && !isRelation('nonsense') && !isRelation(5) && !isRelation(null), 'which are relations')
check(cleanRelation('uncle') === 'uncle' && cleanRelation('x') === 'other' && cleanRelation(undefined) === 'other', 'a damaged relation becomes "someone special"')
check(relationLabel('grandmother') === 'Grandmother' && relationLabel('zzz') === 'Someone special' && relationRow('mother') === 'parent' && relationRow('zzz') === 'other', 'labels and rows')
check(askable('mother') && askable('friend') && !askable('me') && !askable('other') && !askable('zzz'), '"Which one is your ...?" is not asked for "me" or "someone special"')
check(cleanPersonName('  Amma  ') === 'Amma' && cleanPersonName('Uncle   Ravi') === 'Uncle Ravi' && cleanPersonName("D'Souza-Rao") === "D'Souza-Rao", 'names keep their letters and marks')
check(cleanPersonName('<b>Amma</b>1') === 'bAmmab' && cleanPersonName(5) === '' && cleanPersonName('x'.repeat(40)).length === 24, 'names drop symbols and digits, and are held to 24 letters')
check(cleanPersonName('అమ్మ') === 'అమ్మ' && cleanPersonName('अम्मा') === 'अम्मा', 'names in other scripts are kept')
check(sameName('Amma', ' amma ') && !sameName('Amma', 'Ammu') && sameName('É', 'é'), 'names that look the same are the same')

// ── Making families ──
const NAMES = ['Amma', 'Nanna', 'Thatha', 'Ammamma', 'Ravi', 'Sita', 'Anu', 'Kiran', 'Meera', 'Dev', 'Lila', 'Raj']
function family(rand: () => number, n: number, clash = false): Person[] {
  const rel = RELATIONS.map(r => r.id)
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    name: clash && i % 3 === 2 ? NAMES[0] : NAMES[i],              // sometimes two people with the same name
    relation: rel[Math.floor(rand() * (clash ? 3 : rel.length))],   // sometimes only a few relations, so several share one
  }))
}

for (let s = 1; s <= 400; s++) {
  const rand = seeded(s * 17)
  const n = MIN_FAMILY + Math.floor(rand() * (MAX_PEOPLE - MIN_FAMILY + 1))
  const people = family(rand, n, s % 3 === 0)
  const byId = new Map(people.map(p => [p.id, p]))
  for (const level of [1, 2]) {
    const qs = makeFamilyQuestions(level, people, seeded(s * 31 + level)), tag = `family ${s} (${n} people) level ${level}`
    check(qs.length === FAMILY_QUESTIONS, `${tag}: ${qs.length} questions`)
    qs.forEach((q, i) => {
      const t = `${tag} q${i + 1} "${q.prompt}"`
      check(q.options.includes(q.answer) && new Set(q.options).size === q.options.length && q.options.every(id => byId.has(id)), `${t}: the answer is among different real people`)
      check(q.options.length >= MIN_FAMILY && q.options.length <= (level === 1 ? NAME_CHOICES : PHOTO_CHOICES) && q.options.length <= n, `${t}: ${q.options.length} choices`)
      const right = byId.get(q.answer)!
      if (q.mode === 'name') {
        // names on show: none the same, so only one can be right
        const names = q.options.map(id => byId.get(id)!.name)
        check(new Set(names.map(x => x.toLocaleLowerCase())).size === names.length, `${t}: two choices with the same name (${names})`)
        check(q.prompt === 'Who is this?' && q.ask === 'photo', `${t}: asks who it is`)
        // each choice is shown as the picture for what the person is, so no two choices may share one, if the family has others
        const differentOthers = people.some(p => p.id !== right.id && p.relation !== right.relation && !sameName(p.name, right.name))
        const rels = q.options.map(id => byId.get(id)!.relation)
        if (differentOthers) check(new Set(rels).size === rels.length, `${t}: two choices with the same picture (${rels})`)
        else check(rels.filter(r => r === right.relation).length >= 1, `${t}: the right one is there`)
      } else {
        if (q.ask === 'name') check(q.prompt === `Where is ${right.name}?`, `${t}: asks for the right name`)
        else {
          // a relation is asked only when exactly one person is that, so the question has one answer
          check(q.ask === 'relation' && askable(right.relation) && people.filter(p => p.relation === right.relation).length === 1, `${t}: a relation question needs exactly one person who fits`)
          check(q.prompt === `Which one is your ${relationLabel(right.relation).toLowerCase()}?`, `${t}: asks for the right relation`)
          check(q.options.filter(id => byId.get(id)!.relation === right.relation).length === 1, `${t}: only one photo is that relation`)
        }
        // asked by name: nobody else on the screen has that name
        if (q.ask === 'name') check(q.options.filter(id => sameName(byId.get(id)!.name, right.name)).length >= 1, `${t}: the right one is there`)
      }
      check(i === 0 || q.answer !== qs[i - 1].answer || n < 2, `${t}: the same person twice running`)
    })
    // everybody is asked about before anyone is asked about twice
    const first = qs.slice(0, Math.min(n, FAMILY_QUESTIONS)).map(q => q.answer)
    check(new Set(first).size === first.length, `${tag}: someone was asked about twice before everyone had a turn`)
  }

  const map = makeFamilyMap(people, seeded(s * 7))
  const tag = `family ${s} map`
  check(map.slots.length === Math.min(n, MAP_PEOPLE) && map.people.length === map.slots.length && new Set(map.people).size === map.people.length, `${tag}: a place for each of ${map.people.length}`)
  check(new Set(map.slots.map(sl => sl.key)).size === map.slots.length, `${tag}: places are named differently`)
  // everyone can be placed: match each person to a place for what they are, one each
  const free = map.slots.slice()
  let placed = 0
  for (const id of map.people) {
    const k = free.findIndex(sl => fits(byId.get(id)!, sl))
    if (k >= 0) { free.splice(k, 1); placed++ }
  }
  check(placed === map.people.length && free.length === 0, `${tag}: everyone has a place that fits them`)
  // the places are in the order of the rows
  const rows = map.slots.map(sl => ROW_ORDER.indexOf(sl.row as never))
  check(rows.every((r, i) => i === 0 || r >= rows[i - 1]), `${tag}: places run grandparents first, then parents, then the child's row, then friends`)
  check(map.slots.every(sl => sl.label === relationLabel(sl.relation)), `${tag}: each place says what it is for`)
  // as different as the family allows
  const distinct = new Set(people.map(p => p.relation)).size
  check(new Set(map.slots.map(sl => sl.relation)).size === Math.min(distinct, MAP_PEOPLE), `${tag}: as many different relations as there are`)
}
check(makeFamilyQuestions(1, [], seeded(1)).length === 0 && makeFamilyQuestions(1, [{ id: 0, name: 'Amma', relation: 'mother' }], seeded(1)).length === 0, 'with fewer than two people there are no questions')
check(familyLevel(0) === 1 && familyLevel(9) === 3 && familyLevel(2.4) === 2, 'a level outside 1 to 3 is held to the nearest')
{
  // two mothers cannot be told apart by relation, so the question is never asked that way
  const two: Person[] = [{ id: 0, name: 'Amma', relation: 'mother' }, { id: 1, name: 'Ammu', relation: 'mother' }, { id: 2, name: 'Ravi', relation: 'father' }]
  let relationAsks = 0
  for (let s = 1; s <= 200; s++) for (const q of makeFamilyQuestions(2, two, seeded(s))) {
    if (q.ask === 'relation') { relationAsks++; check(q.answer === 2 && q.prompt === 'Which one is your father?', 'only the father can be asked for by relation') }
  }
  check(relationAsks > 0, 'a relation that only one person has is asked about')
  // two people with the same name: the question "Who is this?" never shows both names
  const twins: Person[] = [{ id: 0, name: 'Anu', relation: 'sister' }, { id: 1, name: 'anu', relation: 'cousin' }, { id: 2, name: 'Ravi', relation: 'father' }]
  for (let s = 1; s <= 100; s++) for (const q of makeFamilyQuestions(1, twins, seeded(s))) {
    const names = q.options.map(id => twins[id].name.toLowerCase())
    check(new Set(names).size === names.length, 'the same name is never shown twice')
  }
}

// ── The places for people ──
check(MAX_PEOPLE === 12, 'twelve people at most')
check(freePlace([]) === 0 && freePlace([{ slot: 0 }, { slot: 1 }]) === 2 && freePlace([{ slot: 1 }]) === 0 && freePlace(Array.from({ length: 12 }, (_, slot) => ({ slot }))) === null, 'the first empty place is used; none when full')

// ── A person's saved record, with or without a recording of their name ──
{
  const photo = new Blob(['photo'], { type: 'image/jpeg' }), clip = new Blob(['sound'], { type: 'audio/webm' })
  const base = { slot: 3, name: 'Amma', relation: 'mother', blob: photo, at: 1234 }
  const plain = cleanPerson(base)
  check(!!plain && plain.slot === 3 && plain.name === 'Amma' && plain.relation === 'mother' && plain.blob === photo && plain.at === 1234 && !('voice' in plain) && !('voiceMs' in plain), 'a person with no recording is kept as they are')
  const withVoice = cleanPerson({ ...base, voice: clip, voiceMs: 1800 })
  check(!!withVoice && withVoice.voice === clip && withVoice.voiceMs === 1800, 'a recording of the name is kept, with how long it is')
  check(cleanPerson({ ...base, voice: undefined, voiceMs: undefined }) !== null && !('voice' in cleanPerson({ ...base, voice: undefined, voiceMs: undefined })!), 'a removed recording leaves no trace')
  // a damaged recording never loses the person
  for (const bad of ['sound', 5, {}, null, [], new Blob([])]) {
    const c = cleanPerson({ ...base, voice: bad, voiceMs: 900 })
    check(!!c && c.name === 'Amma' && !('voice' in c) && !('voiceMs' in c), `a recording that is ${bad instanceof Blob ? 'empty' : JSON.stringify(bad)} is dropped and the person kept`)
  }
  for (const ms of [-5, 0, 'long', null, 99_999, NaN]) {
    const c = cleanPerson({ ...base, voice: clip, voiceMs: ms })
    check(!!c && c.voice === clip && !('voiceMs' in c), `a length of ${String(ms)} is dropped and the recording kept`)
  }
  // a person who cannot be used is left out
  for (const bad of [null, undefined, 'x', 5, [], {}, { ...base, blob: 'photo' }, { ...base, slot: -1 }, { ...base, slot: 12 }, { ...base, slot: 1.5 }, { ...base, name: 5 }, { ...base, relation: null }]) {
    check(cleanPerson(bad) === null, `${JSON.stringify(bad)?.slice(0, 40)} is not a person`)
  }
  check(cleanPerson({ ...base, at: 'later' })!.at === 0, 'a missing time becomes 0')
  check(NAME_VOICE_SECONDS === 4 && NAME_VOICE_MIN_MS === 400, 'a name is recorded for up to four seconds, and not less than 0.4')
}

// ── Face photos are square ──
{
  const sq = cropBox(4000, 3000, 'square')
  check(sq.sw === 3000 && sq.sh === 3000 && sq.sx === 500 && sq.sy === 0, 'a wide photo loses its sides')
  const tall = cropBox(3000, 4000, 'square')
  check(tall.sw === 3000 && tall.sh === 3000 && tall.sy === 500, 'a tall photo loses its top and bottom')
  check(cropBox(3000, 3000, 'square').sx === 0, 'a square photo is not cropped')
  check(JSON.stringify(outputSize(4000, 'square')) === '{"w":600,"h":600}' && JSON.stringify(outputSize(200, 'square')) === '{"w":200,"h":200}', 'faces are saved at 600 by 600 at most, never made bigger')
  check(PHOTO_SHAPES.wide.w === 1200 && JSON.stringify(cropBox(4000, 3000)) === JSON.stringify(cropBox(4000, 3000, 'wide')), 'pictures for the jigsaw are as before')
}

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1) }
console.log('family: all checks passed')
