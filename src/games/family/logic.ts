// Family faces: who is who, and the questions made from the people a parent has added. No imports, so
// scripts/test-family.mts can check all of it for any family. What a child calls a person ("Amma", "Thatha", "Uncle
// Ravi") is the name a parent types; the relations are only what that person is to the child. Every question has exactly
// one right answer, whatever the family looks like: two people who share a name or a relation are never put side by side
// as if one were wrong.

export type RelationRow = 'grand' | 'parent' | 'me' | 'other'

export const RELATIONS: { id: string; label: string; row: RelationRow }[] = [
  { id: 'grandmother', label: 'Grandmother', row: 'grand' }, { id: 'grandfather', label: 'Grandfather', row: 'grand' },
  { id: 'mother', label: 'Mother', row: 'parent' }, { id: 'father', label: 'Father', row: 'parent' },
  { id: 'aunt', label: 'Aunt', row: 'parent' }, { id: 'uncle', label: 'Uncle', row: 'parent' },
  { id: 'me', label: 'Me', row: 'me' }, { id: 'brother', label: 'Brother', row: 'me' },
  { id: 'sister', label: 'Sister', row: 'me' }, { id: 'cousin', label: 'Cousin', row: 'me' },
  { id: 'friend', label: 'Friend', row: 'other' }, { id: 'teacher', label: 'Teacher', row: 'other' },
  { id: 'other', label: 'Someone special', row: 'other' },
]

export const ROW_ORDER: RelationRow[] = ['grand', 'parent', 'me', 'other']
export const ROW_LABELS: Record<RelationRow, string> = {
  grand: 'Grandparents', parent: 'Parents, aunts and uncles', me: 'Me, brothers, sisters and cousins', other: 'Friends and others',
}

/**
 * A picture for each relation, so a child who cannot read yet can still tell "mother" from "grandfather". Each is
 * different from every other, because two choices that look the same cannot be told apart.
 */
export const RELATION_ICONS: Record<string, string> = {
  grandmother: '👵', grandfather: '👴', mother: '👩', father: '👨', aunt: '👩‍🦰', uncle: '👨‍🦰',
  me: '🧒', brother: '👦', sister: '👧', cousin: '🧑', friend: '🧑‍🤝‍🧑', teacher: '🧑‍🏫', other: '💛',
}
/** One picture for each row of the family map. */
export const ROW_ICONS: Record<RelationRow, string> = { grand: '👵👴', parent: '👩👨', me: '🧒', other: '🧑‍🤝‍🧑' }
export const relationIcon = (id: string) => RELATION_ICONS[id] ?? RELATION_ICONS.other

export const isRelation = (x: unknown): x is string => typeof x === 'string' && RELATIONS.some(r => r.id === x)
export const cleanRelation = (x: unknown): string => (isRelation(x) ? x : 'other')
export const relationLabel = (id: string) => RELATIONS.find(r => r.id === id)?.label ?? 'Someone special'
export const relationRow = (id: string): RelationRow => RELATIONS.find(r => r.id === id)?.row ?? 'other'
export const relationIndex = (id: string) => { const i = RELATIONS.findIndex(r => r.id === id); return i < 0 ? RELATIONS.length : i }
/** "Which one is your ...?" makes sense for these. "Me" and "someone special" do not. */
export const askable = (id: string) => isRelation(id) && id !== 'me' && id !== 'other'

export const MAX_NAME = 24
/** A name or what a child calls someone: letters, spaces and the marks names use. */
export function cleanPersonName(raw: unknown, max = MAX_NAME): string {
  if (typeof raw !== 'string') return ''
  return raw.replace(/[^\p{L}\p{M}\s'’.-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, max)
}
/** Two names that would look the same to a child are the same name. */
export const sameName = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase()

// ── Questions ──

export type Person = { id: number; name: string; relation: string }
export type Rand = () => number

export const FAMILY_QUESTIONS = 5
export const MAP_PEOPLE = 6
/** Photos to choose between when a name is asked, the right one included. */
export const PHOTO_CHOICES = 4
/** Names to choose between when a photo is shown. */
export const NAME_CHOICES = 3
/** The fewest people the game needs: with one, there is nothing to choose between. */
export const MIN_FAMILY = 2

function shuffled<T>(a: readonly T[], rand: Rand): T[] {
  const out = a.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export const familyLevel = (level: number): 1 | 2 | 3 => Math.min(3, Math.max(1, Math.round(level))) as 1 | 2 | 3

export type FamilyQuestion = {
  /** 'name': a photo is shown and names are the choices. 'photo': a name or a relation is asked and photos are the choices. */
  mode: 'name' | 'photo'
  /** What is asked: a name, or a relation ("Which one is your mother?"). */
  ask: 'photo' | 'name' | 'relation'
  prompt: string
  /** The people to choose between (their ids), the right one among them. */
  options: number[]
  answer: number
}

/** `count` people to ask about: everyone in turn before anyone twice, and never the same one twice running. */
function targets(people: readonly Person[], count: number, rand: Rand): Person[] {
  const out: Person[] = []
  while (out.length < count) {
    let round = shuffled(people, rand)
    if (out.length && round.length > 1 && round[0].id === out[out.length - 1].id) round = [...round.slice(1), round[0]]
    out.push(...round)
  }
  return out.slice(0, count)
}

export function makeFamilyQuestions(level: number, people: readonly Person[], rand: Rand = Math.random): FamilyQuestion[] {
  if (people.length < MIN_FAMILY) return []
  const lv = familyLevel(level)
  return targets(people, FAMILY_QUESTIONS, rand).map(t => {
    if (lv === 1) {
      // who is this? Each choice is shown with the picture for what that person is, so the choices are all
      // different relations (and names) wherever the family allows it. Only when everyone else is the same relation
      // as the right one are they told apart by name alone.
      const pool = shuffled(people.filter(p => p.id !== t.id && !sameName(p.name, t.name)), rand)
      const chosen: Person[] = []
      for (const p of pool) {
        if (chosen.length >= NAME_CHOICES - 1) break
        if (p.relation !== t.relation && !chosen.some(c => c.relation === p.relation || sameName(c.name, p.name))) chosen.push(p)
      }
      if (!chosen.length) for (const p of pool) if (chosen.length < NAME_CHOICES - 1 && !chosen.some(c => sameName(c.name, p.name))) chosen.push(p)
      const options = shuffled([t, ...chosen], rand).map(p => p.id)
      return { mode: 'name', ask: 'photo', prompt: 'Who is this?', options, answer: t.id } as FamilyQuestion
    }
    // where is Amma? / which one is your mother? The photos to choose from are different people
    const sameRelation = people.filter(p => p.relation === t.relation).length
    const byRelation = askable(t.relation) && sameRelation === 1 && rand() < 0.5
    const others = shuffled(people.filter(p => p.id !== t.id), rand).slice(0, PHOTO_CHOICES - 1)
    const options = shuffled([t, ...others], rand).map(p => p.id)
    return {
      mode: 'photo', ask: byRelation ? 'relation' : 'name',
      prompt: byRelation ? `Which one is your ${relationLabel(t.relation).toLowerCase()}?` : `Where is ${t.name}?`,
      options, answer: t.id,
    } as FamilyQuestion
  })
}

// ── The family map ──

export type MapSlot = { key: string; relation: string; label: string; row: string }
export type FamilyMap = { slots: MapSlot[]; people: number[] }

/** A person fits a place on the map if the place is for what they are to the child. */
export const fits = (p: Person, s: MapSlot) => p.relation === s.relation

/**
 * Up to six people, as different from each other as the family allows, and a place for each, labelled by what they are
 * and laid out in rows: grandparents, parents, the child and brothers and sisters, then friends.
 */
export function makeFamilyMap(people: readonly Person[], rand: Rand = Math.random): FamilyMap {
  const pool = shuffled(people, rand)
  const chosen: Person[] = []
  const seen = new Set<string>()
  for (const p of pool) if (chosen.length < MAP_PEOPLE && !seen.has(p.relation)) { chosen.push(p); seen.add(p.relation) }
  for (const p of pool) if (chosen.length < MAP_PEOPLE && !chosen.includes(p)) chosen.push(p)
  const slots = chosen
    .map((p, i) => ({ key: `slot-${i}`, relation: p.relation, label: relationLabel(p.relation), row: relationRow(p.relation) }))
    .sort((a, b) => ROW_ORDER.indexOf(a.row as never) - ROW_ORDER.indexOf(b.row as never) || relationIndex(a.relation) - relationIndex(b.relation))
  return { slots, people: shuffled(chosen, rand).map(p => p.id) }
}
