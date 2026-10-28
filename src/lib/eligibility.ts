import type { EventCategory, Sport } from '../mock/types'
import { SPORT_META } from '../mock/constants'

export const isTeamSport = (s: Sport) => s === 'cricket' || s === 'football'

const GENDER_BY_MASTER: Record<string, NonNullable<EventCategory['eligibility']>['gender']> = {
  'cm-md': 'men',
  'cm-ms': 'men',
  'cm-wd': 'women',
  'cm-ws': 'women',
  'cm-xd': 'mixed',
}

/** The category's entry rules, with gender set from the category itself when not stored. */
export function eligibilityOf(c: EventCategory): NonNullable<EventCategory['eligibility']> {
  return c.eligibility ?? { gender: GENDER_BY_MASTER[c.categoryId] ?? 'open' }
}

export const GENDER_LABEL = { men: 'Men only', women: 'Women only', mixed: 'One man and one woman per pair', open: 'Open to everyone' } as const

/** One plain line for the event page and review, for example "Men only · 35+ · DUPR up to 4.0". */
export function eligibilityLine(c: EventCategory): string {
  const e = eligibilityOf(c)
  const parts: string[] = [c.team && e.gender === 'mixed' ? 'Mixed teams' : GENDER_LABEL[e.gender]]
  if (e.minAge && e.maxAge) parts.push(`Age ${e.minAge} to ${e.maxAge}`)
  else if (e.minAge) parts.push(`${e.minAge}+`)
  else if (e.maxAge) parts.push(`Under ${e.maxAge + 1}`)
  if (e.ratingCap) parts.push(`DUPR up to ${e.ratingCap.toFixed(1)}`)
  if (c.team) parts.push(`Squad of ${c.team.squadSize}, ${c.team.subs} subs`)
  if (c.sport) parts.push(SPORT_META[c.sport].label)
  return parts.join(' · ')
}

/** Team-sport wording for the shared category list. */
export function teamCategoryName(masterName: string): string {
  if (masterName.startsWith("Men's")) return "Men's teams"
  if (masterName.startsWith("Women's")) return "Women's teams"
  if (masterName.startsWith('Mixed')) return 'Mixed teams'
  return 'Open teams'
}

export const REFUND_LABEL = {
  full_until_close: 'Full refund until registrations close',
  half_until_draw: '50% refund until the draw is published',
  none: 'No refunds',
} as const

/** Whole years old on a given day (age limits apply on the first day of play). */
export function ageOn(dob: string, onIso: string): number {
  const b = new Date(dob)
  const on = new Date(onIso)
  let a = on.getFullYear() - b.getFullYear()
  if (on.getMonth() < b.getMonth() || (on.getMonth() === b.getMonth() && on.getDate() < b.getDate())) a--
  return a
}
