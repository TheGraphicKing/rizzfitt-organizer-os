import { mutate, stamp, getData } from './store'
import type { DemoData, EventCategory, Group, Match } from '../mock/types'
import { autoAssign, buildKnockout, GROUP_NAMES, groupSizes, roundRobin, snakeIntoGroups } from '../lib/tournament'
import { mulberry32 } from '../mock/rng'
import { sidePlayers } from './selectors'

/* Schedule: draw, create matches, courts and times, publish. One checklist per category. */

function entriesOf(d: DemoData, catId: string) {
  return d.registrations.filter((r) => r.categoryId === catId && (r.status === 'paid' || r.status === 'pending'))
}
function rating(d: DemoData, regId: string) {
  const ps = sidePlayers(d, regId).map((id) => d.players.find((p) => p.id === id)?.duprRating ?? 3)
  return ps.reduce((a, b) => a + b, 0) / Math.max(1, ps.length)
}

/** Draws groups (draft until locked). Returns the groups' registration ids for the animation. */
export function drawGroups(catId: string, seeding: EventCategory['seeding'], seed = Date.now()) {
  mutate((d) => {
    const cat = d.categories.find((c) => c.id === catId)
    if (!cat) return
    cat.seeding = seeding
    const es = entriesOf(d, catId)
    let order: string[]
    if (seeding === 'random') {
      const rnd = mulberry32(seed)
      order = es.map((r) => r.id).sort(() => rnd() - 0.5)
    } else order = [...es].sort((a, b) => rating(d, b.id) - rating(d, a.id)).map((r) => r.id)
    order.forEach((id, i) => {
      const r = d.registrations.find((x) => x.id === id)
      if (r) r.seed = seeding === 'random' ? undefined : i + 1
    })
    d.groups = d.groups.filter((g) => g.categoryId !== catId)
    d.matches = d.matches.filter((m) => m.categoryId !== catId)
    if (cat.format === 'knockout' || cat.format === 'king_of_court') {
      d.groups.push({ id: `${catId}-g-A`, eventId: cat.eventId, categoryId: catId, name: 'A', registrationIds: order })
      return
    }
    const sizes = cat.format === 'round_robin' ? [order.length] : groupSizes(order.length, cat.groupSize)
    snakeIntoGroups(order, sizes).forEach((ids, i) => d.groups.push({ id: `${catId}-g-${GROUP_NAMES[i]}`, eventId: cat.eventId, categoryId: catId, name: GROUP_NAMES[i], registrationIds: ids }))
    if (cat.stage === 'registrations') cat.stage = 'ready_to_draw'
  })
}

export function moveToGroup(catId: string, regId: string, groupName: string, index?: number) {
  mutate((d) => {
    const groups = d.groups.filter((g) => g.categoryId === catId)
    groups.forEach((g) => (g.registrationIds = g.registrationIds.filter((x) => x !== regId)))
    const to = groups.find((g) => g.name === groupName)
    if (!to) return
    if (index === undefined) to.registrationIds.push(regId)
    else to.registrationIds.splice(index, 0, regId)
  })
}

export function lockGroups(catId: string) {
  mutate((d) => {
    const cat = d.categories.find((c) => c.id === catId)
    if (cat) {
      cat.stage = 'drawn'
      cat.entriesClosed = true
    }
    stamp(d)
  })
}

/** Group matches plus the knockout bracket (byes for top seeds, sources like A1). */
export function createMatches(catId: string) {
  mutate((d) => {
    const cat = d.categories.find((c) => c.id === catId)
    if (!cat) return
    d.matches = d.matches.filter((m) => m.categoryId !== catId)
    const groups = d.groups.filter((g) => g.categoryId === catId).sort((a, b) => a.name.localeCompare(b.name))
    const base = { eventId: cat.eventId, categoryId: catId, bestOf: cat.matchRules.games, finalsBestOf: cat.matchRules.finalsGames }
    const out: Match[] = []
    const mk = (g: Group, ri: number, pi: number, a: string, b: string): Match => ({ id: `${g.id}-${ri + 1}-${pi + 1}`, eventId: cat.eventId, categoryId: catId, stage: 'group', groupId: g.id, round: ri + 1, slot: pi + 1, sideA: a, sideB: b, status: 'scheduled', games: [], bestOf: cat.matchRules.games, corrections: [], timeline: [] })
    if (cat.format === 'knockout') {
      const order = groups[0]?.registrationIds ?? []
      out.push(...buildKnockout(base, order.map((id) => ({ reg: id })), `${catId}-ko`, cat.thirdPlace))
    } else if (cat.format === 'king_of_court') {
      const ids = groups[0]?.registrationIds ?? []
      const rounds = Math.max(3, Math.min(8, ids.length - 1))
      const g = groups[0]
      for (let r = 0; r < rounds; r++) {
        const rot = [...ids.slice(r % ids.length), ...ids.slice(0, r % ids.length)]
        for (let i = 0; i + 1 < rot.length; i += 2) out.push(mk(g, r, i / 2, rot[i], rot[i + 1]))
      }
    } else {
      groups.forEach((g) => roundRobin(g.registrationIds).forEach((pairs, ri) => pairs.forEach(([a, b], pi) => out.push(mk(g, ri, pi, a, b)))))
      if (cat.format === 'groups_knockout') {
        const slots: { reg: null; src: string }[] = []
        for (let pos = 1; pos <= cat.advancePerGroup; pos++) groups.forEach((g) => g.registrationIds.length >= pos && slots.push({ reg: null, src: `${g.name}${pos}` }))
        out.push(...buildKnockout(base, slots, `${catId}-ko`, cat.thirdPlace))
      }
    }
    d.matches.push(...out)
    cat.stage = 'matches_created'
    stamp(d)
  })
}

export interface AssignOpts {
  lengthMin: number
  restMin: number
  dayStart: string
  dayEnd: string
  day: string
  breakStart?: string
  breakEnd?: string
}

/** Auto-assign unplayed matches of the given categories to courts and times. */
export function autoAssignMatches(eventId: string, catIds: string[], o: AssignOpts): { assigned: number; unassigned: number } {
  const d = getData()
  const ev = d.events.find((e) => e.id === eventId)!
  const ms = d.matches.filter((m) => catIds.includes(m.categoryId) && m.status === 'scheduled' && m.stage !== 'league')
  const at = (t: string) => Date.parse(`${o.day}T${t}:00+05:30`)
  const res = autoAssign(ms, (id) => sidePlayers(d, id), {
    courts: ev.courts,
    startMs: at(o.dayStart),
    endMs: at(o.dayEnd) + 86400000 * 2,
    lengthMin: o.lengthMin,
    restMin: o.restMin,
    breaks: o.breakStart && o.breakEnd ? [[at(o.breakStart), at(o.breakEnd)]] : [],
  })
  mutate((dd) => {
    const e = dd.events.find((x) => x.id === eventId)!
    e.settings.matchLengthMin = o.lengthMin
    e.settings.restMin = o.restMin
    e.settings.dayStart = o.dayStart
    e.settings.dayEnd = o.dayEnd
    const byId = new Map(res.assigned.map((m) => [m.id, m]))
    dd.matches.forEach((m) => {
      const a = byId.get(m.id)
      if (a) {
        m.court = a.court
        m.scheduledAt = a.scheduledAt
      } else if (res.unassigned.includes(m.id)) {
        m.court = undefined
        m.scheduledAt = undefined
      }
    })
    dd.categories.filter((c) => catIds.includes(c.id) && c.stage === 'matches_created').forEach((c) => (c.stage = 'scheduled'))
  })
  return { assigned: res.assigned.length, unassigned: res.unassigned.length }
}

export function moveMatch(id: string, court: number | undefined, at: string | undefined) {
  mutate((d) => {
    const m = d.matches.find((x) => x.id === id)
    if (!m) return
    m.court = court
    m.scheduledAt = at
  })
}

export function publishCategories(eventId: string, catIds: string[], notify: { whatsapp: boolean; email: boolean }) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    if (!e) return
    const at = stamp(d)
    d.categories.filter((c) => catIds.includes(c.id)).forEach((c) => (c.stage = 'published'))
    e.publishedAt = at
    if (e.status === 'registrations_closed' || e.status === 'registrations_open') e.status = 'scheduled'
    const n = new Set(d.registrations.filter((r) => catIds.includes(r.categoryId) && (r.status === 'paid' || r.status === 'pending')).flatMap((r) => r.playerIds)).size
    if (notify.whatsapp || notify.email)
      d.messages.unshift({
        id: `msg-pub-${d.now}`, eventId, channel: notify.whatsapp && notify.email ? 'both' : notify.whatsapp ? 'whatsapp' : 'email',
        audience: { kind: 'category', categoryIds: catIds, label: `${catIds.length} ${catIds.length === 1 ? 'category' : 'categories'}` },
        templateId: 'schedule', title: 'Schedule published', body: 'Your schedule is out. First match: {match_time} on {court}.', sentAt: at, stats: { sent: n, delivered: Math.max(0, n - 1), read: Math.round(n * 0.8) },
      })
  })
}

/** Regenerating a published draw throws away its matches and results. */
export function resetCategoryDraw(catId: string) {
  mutate((d) => {
    const c = d.categories.find((x) => x.id === catId)
    if (!c) return
    d.matches = d.matches.filter((m) => m.categoryId !== catId)
    d.groups = d.groups.filter((g) => g.categoryId !== catId)
    c.stage = 'ready_to_draw'
  })
}
