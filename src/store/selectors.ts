import type { DemoData, EventCategory, EventItem, Match, Player, Registration } from '../mock/types'
import { groupStandings, isConfirmed, STAGE_LABEL } from '../lib/tournament'
import { fmtTime } from '../lib/format'

/* Single source for every derived number. Screens never count on their own. */

export const ACTIVE: Registration['status'][] = ['paid', 'pending']

export function eventById(d: DemoData, id: string): EventItem | undefined {
  return d.events.find((e) => e.id === id)
}
export function eventBySlug(d: DemoData, slug: string): EventItem | undefined {
  return d.events.find((e) => e.slug === slug)
}
export function categoriesOf(d: DemoData, eventId: string): EventCategory[] {
  return d.categories.filter((c) => c.eventId === eventId).sort((a, b) => a.order - b.order)
}
export function regsOf(d: DemoData, eventId: string): Registration[] {
  return d.registrations.filter((r) => r.eventId === eventId)
}

/** Entries: registrations that are paid or pending (not refunded, withdrawn or waitlisted). */
export function entries(d: DemoData, eventId: string, categoryId?: string): Registration[] {
  return d.registrations.filter((r) => r.eventId === eventId && ACTIVE.includes(r.status) && (!categoryId || r.categoryId === categoryId))
}
export function entryCount(d: DemoData, eventId: string, categoryId?: string): number {
  const e = eventById(d, eventId)
  if (e?.hqOnly) return e.hqOnly.entries
  if (e?.type === 'social') return d.participants.filter((p) => p.eventId === eventId).length
  return entries(d, eventId, categoryId).length
}
export function waitlistCount(d: DemoData, eventId: string, categoryId?: string): number {
  return d.registrations.filter((r) => r.eventId === eventId && r.status === 'waitlist' && (!categoryId || r.categoryId === categoryId)).length
}
/** Unique players across entries. */
export function playerIdsOf(d: DemoData, eventId: string): Set<string> {
  const s = new Set<string>()
  entries(d, eventId).forEach((r) => r.playerIds.forEach((p) => s.add(p)))
  return s
}
export function playerCount(d: DemoData, eventId: string): number {
  const e = eventById(d, eventId)
  if (e?.type === 'social') return d.participants.filter((p) => p.eventId === eventId).length
  return playerIdsOf(d, eventId).size
}
/** Check-in is per player across the event: a player in two categories checks in once. */
export function checkedInSet(d: DemoData, eventId: string): Set<string> {
  const s = new Set<string>()
  entries(d, eventId).forEach((r) => r.checkedIn.forEach((p) => s.add(p)))
  return s
}
export function checkedInCount(d: DemoData, eventId: string): number {
  return checkedInSet(d, eventId).size
}

/* money */
export function paymentsOf(d: DemoData, eventId: string) {
  return d.payments.filter((p) => p.eventId === eventId)
}
export function collected(d: DemoData, eventId: string): number {
  const e = eventById(d, eventId)
  if (e?.hqOnly) return e.hqOnly.collected
  return paymentsOf(d, eventId).filter((p) => p.status === 'captured').reduce((s, p) => s + p.amount, 0)
}
export function collectedBy(d: DemoData, eventId: string, channel: 'online' | 'desk'): number {
  return paymentsOf(d, eventId).filter((p) => p.status === 'captured' && p.channel === channel).reduce((s, p) => s + p.amount, 0)
}
export function refunded(d: DemoData, eventId: string): number {
  return paymentsOf(d, eventId).filter((p) => p.status === 'refunded').reduce((s, p) => s + p.amount, 0)
}
/** Rizzfitt and payment fees as one total. Rates stay in HQ. */
export function feesTotal(d: DemoData, eventId: string): number {
  return paymentsOf(d, eventId).filter((p) => p.status === 'captured').reduce((s, p) => s + p.fee, 0)
}
/** Online money that Rizzfitt pays out after fees. Desk money is already with the organizer. */
export function payoutTotal(d: DemoData, eventId: string): number {
  return collectedBy(d, eventId, 'online') - feesTotal(d, eventId)
}
export function pendingDesk(d: DemoData, eventId: string): Registration[] {
  return d.registrations.filter((r) => r.eventId === eventId && r.status === 'pending')
}
export function grossIfFull(cats: EventCategory[]): number {
  return cats.reduce((s, c) => s + c.price * c.cap, 0)
}

/* names */
export function playerMap(d: DemoData): Map<string, Player> {
  return new Map(d.players.map((p) => [p.id, p]))
}
export function playerName(p: Player | undefined): string {
  return p ? `${p.firstName} ${p.lastName}` : 'Unknown player'
}
export function shortName(p: Player | undefined): string {
  return p ? `${p.firstName} ${p.lastName[0]}.` : '?'
}
/** Team or player label for a side id (registration id, or league team id). */
export function sideLabel(d: DemoData, sideId: string | null, short = false): string {
  if (!sideId) return 'TBD'
  const team = d.leagueTeams.find((t) => t.id === sideId)
  if (team) return team.name
  const reg = d.registrations.find((r) => r.id === sideId)
  if (!reg) return 'TBD'
  if (reg.teamName) return reg.teamName
  return reg.playerIds
    .map((id) => {
      const p = d.players.find((x) => x.id === id)
      return short ? shortName(p) : playerName(p)
    })
    .join(short ? ' / ' : ' and ')
}
export function sidePlayers(d: DemoData, sideId: string | null): string[] {
  if (!sideId) return []
  const team = d.leagueTeams.find((t) => t.id === sideId)
  if (team) return team.playerIds
  return d.registrations.find((r) => r.id === sideId)?.playerIds ?? []
}
export function sideRating(d: DemoData, sideId: string | null): number | undefined {
  const ids = sidePlayers(d, sideId)
  const rs = ids.map((id) => d.players.find((p) => p.id === id)?.duprRating).filter((x): x is number => typeof x === 'number')
  if (!rs.length) return undefined
  return Math.round((rs.reduce((a, b) => a + b, 0) / rs.length) * 100) / 100
}

/* matches */
export function matchesOf(d: DemoData, eventId: string, categoryId?: string): Match[] {
  return d.matches.filter((m) => m.eventId === eventId && (!categoryId || m.categoryId === categoryId))
}
export function matchStats(d: DemoData, eventId: string) {
  const ms = matchesOf(d, eventId)
  return { total: ms.length, done: ms.filter(isConfirmed).length, live: ms.filter((m) => m.status === 'live').length }
}
export function matchTitle(d: DemoData, m: Match): string {
  const cat = d.categories.find((c) => c.id === m.categoryId)
  const tie = m.tieId ? d.ties.find((t) => t.id === m.tieId) : undefined
  if (tie) return `Round ${tie.round}, ${m.slotLabel}`
  const stage = m.stage === 'group' ? (cat?.format === 'round_robin' ? `Round ${m.round}` : `Group ${m.groupId?.split('-g-')[1] ?? ''}`) : `${STAGE_LABEL[m.stage]}${m.stage === 'sf' || m.stage === 'qf' || m.stage === 'r16' ? ' ' + m.slot : ''}`
  return `${cat?.label ?? ''} · ${stage}`
}
export function stageLabel(d: DemoData, m: Match): string {
  const cat = d.categories.find((c) => c.id === m.categoryId)
  if (m.stage === 'group') return cat?.format === 'round_robin' ? `Round ${m.round}` : `Group ${m.groupId?.split('-g-')[1] ?? ''}`
  if (m.stage === 'league') return m.slotLabel ?? 'League'
  return `${STAGE_LABEL[m.stage]}${m.stage === 'sf' || m.stage === 'qf' || m.stage === 'r16' || m.stage === 'r32' ? ' ' + m.slot : ''}`
}

/* courts */
export type CourtState = 'live' | 'awaiting' | 'late' | 'free' | 'paused' | 'called'
export interface CourtInfo {
  court: number
  state: CourtState
  current?: Match
  awaiting?: Match
  next?: Match
  lateMin: number
  umpire?: { id: string; name: string; status: string }
}

export function courtInfo(d: DemoData, eventId: string, court: number): CourtInfo {
  const ms = matchesOf(d, eventId).filter((m) => m.court === court)
  const live = ms.find((m) => m.status === 'live' || m.status === 'paused')
  const awaiting = ms.find((m) => m.status === 'awaiting_confirmation')
  const called = ms.find((m) => m.status === 'called')
  const upcoming = ms
    .filter((m) => m.status === 'scheduled' && m.scheduledAt)
    .sort((a, b) => Date.parse(a.scheduledAt!) - Date.parse(b.scheduledAt!))
  const ump = d.umpires.find((u) => u.eventId === eventId && u.court === court && u.status !== 'invited') ?? d.umpires.find((u) => u.eventId === eventId && u.court === court)
  const umpire = ump ? { id: ump.id, name: ump.name, status: ump.status } : undefined
  let state: CourtState = 'free'
  let lateMin = 0
  const current = live ?? called
  if (live) state = live.status === 'paused' ? 'paused' : 'live'
  else if (called) {
    lateMin = Math.round((d.now - Date.parse(called.scheduledAt ?? called.calledAt ?? new Date(d.now).toISOString())) / 60000)
    state = lateMin >= 10 ? 'late' : 'called'
  } else if (awaiting) state = 'awaiting'
  return { court, state, current, awaiting, next: upcoming[0], lateMin: Math.max(0, lateMin), umpire }
}

export function courtsOf(d: DemoData, eventId: string): CourtInfo[] {
  const e = eventById(d, eventId)
  return Array.from({ length: e?.courts ?? 0 }, (_, i) => courtInfo(d, eventId, i + 1))
}

/** Matches ready to call: both sides known, not started, not already on a court as current. */
export function upNext(d: DemoData, eventId: string): Match[] {
  return matchesOf(d, eventId)
    .filter((m) => m.status === 'scheduled' && m.stage !== 'league')
    .sort((a, b) => Date.parse(a.scheduledAt ?? '2100-01-01') - Date.parse(b.scheduledAt ?? '2100-01-01') || a.round - b.round)
}

export function busySides(d: DemoData, eventId: string): Set<string> {
  const s = new Set<string>()
  matchesOf(d, eventId)
    .filter((m) => m.status === 'live' || m.status === 'called' || m.status === 'paused')
    .forEach((m) => {
      if (m.sideA) s.add(m.sideA)
      if (m.sideB) s.add(m.sideB)
    })
  return s
}

/* attention feed */
export interface Blocker {
  id: string
  kind: 'confirm' | 'late' | 'idle_umpire' | 'not_checked_in' | 'desk_pending' | 'near_full' | 'full' | 'payout' | 'unpublished'
  title: string
  body: string
  action: string
  matchId?: string
  court?: number
  categoryId?: string
  tone: 'warning' | 'danger' | 'info'
}

export function blockers(d: DemoData, eventId: string): Blocker[] {
  const e = eventById(d, eventId)
  if (!e) return []
  const out: Blocker[] = []
  const ms = matchesOf(d, eventId)
  ms.filter((m) => m.status === 'awaiting_confirmation').forEach((m) =>
    out.push({
      id: `confirm-${m.id}`,
      kind: 'confirm',
      title: `Court ${m.court}: result waiting`,
      body: `${matchTitle(d, m)}. ${sideLabel(d, m.sideA, true)} vs ${sideLabel(d, m.sideB, true)}, ${m.games.map((g) => `${g.a}-${g.b}`).join(', ')}.`,
      action: 'Confirm result',
      matchId: m.id,
      court: m.court,
      tone: 'warning',
    }),
  )
  if (e.status === 'live') {
    courtsOf(d, eventId).forEach((c) => {
      if (c.state === 'late' && c.current)
        out.push({ id: `late-${c.court}`, kind: 'late', title: `Court ${c.court} running ${c.lateMin} min late`, body: `${matchTitle(d, c.current)} was due at ${fmtTime(c.current.scheduledAt!)}.`, action: 'Message players', matchId: c.current.id, court: c.court, tone: 'warning' })
      if (c.state === 'free' && c.umpire && c.umpire.status === 'idle')
        out.push({ id: `idle-${c.court}`, kind: 'idle_umpire', title: `Court ${c.court} is free`, body: `${c.umpire.name} is waiting.${c.next ? ` Next up: ${matchTitle(d, c.next)}.` : ''}`, action: 'Call next match', court: c.court, tone: 'info' })
    })
    // Players still to play today who have not checked in.
    const pending = ms.filter((m) => m.status === 'called' || m.status === 'scheduled')
    const inSet = checkedInSet(d, eventId)
    const missing = new Set<string>()
    let firstMatch: Match | undefined
    pending.forEach((m) => {
      ;[m.sideA, m.sideB].forEach((sid) => {
        const reg = d.registrations.find((r) => r.id === sid)
        if (!reg) return
        reg.playerIds.forEach((p) => {
          if (!inSet.has(p)) {
            missing.add(p)
            if (!firstMatch || Date.parse(m.scheduledAt ?? '2100') < Date.parse(firstMatch.scheduledAt ?? '2100')) firstMatch = m
          }
        })
      })
    })
    if (missing.size && firstMatch)
      out.push({ id: 'not-checked-in', kind: 'not_checked_in', title: `${missing.size} ${missing.size === 1 ? 'player has' : 'players have'} not checked in`, body: `For ${matchTitle(d, firstMatch)} at ${fmtTime(firstMatch.scheduledAt!)}.`, action: 'Message players', matchId: firstMatch.id, tone: 'warning' })
  }
  const pend = pendingDesk(d, eventId)
  if (pend.length)
    out.push({ id: 'desk-pending', kind: 'desk_pending', title: `${pend.length} desk ${pend.length === 1 ? 'payment' : 'payments'} pending`, body: 'Collect cash or UPI at the desk, then mark them paid.', action: 'Review payments', tone: 'info' })
  if (e.status === 'registrations_open') {
    categoriesOf(d, eventId).forEach((c) => {
      const n = entryCount(d, eventId, c.id)
      if (n >= c.cap && !c.entriesClosed)
        out.push({ id: `full-${c.id}`, kind: 'full', title: `${c.label} is full`, body: c.waitlist ? 'New players join the waitlist.' : 'Open a waitlist so you do not lose players?', action: c.waitlist ? 'View waitlist' : 'Open a waitlist', categoryId: c.id, tone: 'info' })
      else if (c.cap - n <= 2 && c.cap - n > 0)
        out.push({ id: `near-${c.id}`, kind: 'near_full', title: `${c.label} is ${c.cap - n} ${c.cap - n === 1 ? 'entry' : 'entries'} from full`, body: 'Share the link once more or raise the cap.', action: 'Raise the cap', categoryId: c.id, tone: 'info' })
    })
  }
  return out
}

/* go-live checklist */
export interface ChecklistItem {
  key: 'payout' | 'prices' | 'page' | 'umpires' | 'sponsors'
  label: string
  done: boolean
  optional: boolean
  hint: string
  href: string
}
export function goLiveChecklist(d: DemoData, eventId: string): ChecklistItem[] {
  const e = eventById(d, eventId)
  if (!e) return []
  const org = d.organizers.find((o) => o.id === e.organizerId)
  const cats = categoriesOf(d, eventId)
  const paymentsOn = e.settings.payments.online
  const payoutStatus = org?.payoutAccount?.status
  const items: ChecklistItem[] = [
    {
      key: 'payout',
      label: 'Payout account verified',
      done: !paymentsOn || payoutStatus === 'verified',
      optional: false,
      hint: !org?.payoutAccount ? 'Connect a bank account or UPI ID' : payoutStatus === 'pending' ? 'Under review, usually within a day' : payoutStatus === 'changes_requested' ? 'Rizzfitt asked for a change' : 'Verified',
      href: '/account',
    },
    {
      key: 'prices',
      label: e.type === 'social' ? 'Price per person is set' : 'Every category has a price',
      done: e.type === 'social' ? (e.social?.pricePerPerson ?? 0) > 0 : cats.length > 0 && cats.every((c) => c.price > 0),
      optional: false,
      hint: e.type === 'social' ? 'Set it in Settings' : `${cats.filter((c) => c.price > 0).length} of ${cats.length} priced`,
      href: `/e/${eventId}/settings#registration`,
    },
    { key: 'page', label: 'Event page reviewed', done: e.setup.pageReviewed, optional: false, hint: 'Open your page and check it looks right', href: `/e/${eventId}/launch-kit` },
  ]
  if (e.settings.umpiresOn && e.type !== 'social') {
    const n = d.umpires.filter((u) => u.eventId === eventId).length + e.setup.invitedUmpires.length
    items.push({ key: 'umpires', label: 'Umpires invited', done: n > 0, optional: false, hint: n ? `${n} invited` : 'Invite at least one umpire', href: `/e/${eventId}/match-day?tab=umpires` })
  }
  const sp = d.sponsors.filter((s) => s.eventId === eventId).length
  items.push({ key: 'sponsors', label: 'Sponsors added', done: sp > 0, optional: true, hint: sp ? `${sp} sponsors` : 'Optional', href: `/e/${eventId}/screens` })
  return items
}

export function checklistProgress(items: ChecklistItem[]): number {
  const req = items.filter((i) => !i.optional)
  const done = items.filter((i) => i.done).length
  return items.length ? (done / items.length) * (req.every((i) => i.done) ? 1 : 0.999) : 0
}

/** Podium for a finished category: [1st, 2nd, 3rd] side ids. Null while not decided. */
export function categoryPodium(d: DemoData, cat: EventCategory): [string, string, string | null] | null {
  const ms = d.matches.filter((m) => m.categoryId === cat.id)
  if (!ms.length) return null
  const final = ms.find((m) => m.stage === 'final')
  const done = (m: Match) => m.status === 'done' || m.status === 'walkover'
  const winnerOf = (m: Match) => {
    const g = m.games
    const a = g.filter((x) => x.a > x.b).length
    const b = g.filter((x) => x.b > x.a).length
    return m.winner ?? (a > b ? 'A' : 'B')
  }
  if (final) {
    if (!done(final)) return null
    const w = winnerOf(final)
    const first = (w === 'A' ? final.sideA : final.sideB)!
    const second = (w === 'A' ? final.sideB : final.sideA)!
    const third = ms.find((m) => m.stage === 'third')
    let bronze: string | null = null
    if (third && done(third)) bronze = (winnerOf(third) === 'A' ? third.sideA : third.sideB) ?? null
    else {
      const sfLoser = ms.filter((m) => m.stage === 'sf' && done(m)).map((m) => (winnerOf(m) === 'A' ? m.sideB : m.sideA))[0]
      bronze = sfLoser ?? null
    }
    return [first, second, bronze]
  }
  if (!ms.every(done)) return null
  const g = d.groups.find((x) => x.categoryId === cat.id)
  if (!g) return null
  const rows = groupStandingsFor(d, g.id)
  return [rows[0], rows[1], rows[2] ?? null] as [string, string, string | null]
}

function groupStandingsFor(d: DemoData, groupId: string): string[] {
  const g = d.groups.find((x) => x.id === groupId)!
  return groupStandings(g, d.matches, 0).map((r) => r.regId)
}

export interface LeagueRow {
  teamId: string
  p: number
  w: number
  l: number
  tiePts: number
  mw: number
  ml: number
  net: number
  pos: number
}
/** League table from finished ties: tie points, then match wins, then net match difference. */
export function leagueTable(d: DemoData, eventId: string): LeagueRow[] {
  const teams = d.leagueTeams.filter((t) => t.eventId === eventId)
  const rows = new Map(teams.map((t) => [t.id, { teamId: t.id, p: 0, w: 0, l: 0, tiePts: 0, mw: 0, ml: 0, net: 0, pos: 0 }]))
  d.ties
    .filter((t) => t.eventId === eventId && t.status === 'done' && t.result)
    .forEach((t) => {
      const a = rows.get(t.teamA)
      const b = rows.get(t.teamB)
      if (!a || !b || !t.result) return
      a.p++
      b.p++
      a.mw += t.result.a
      a.ml += t.result.b
      b.mw += t.result.b
      b.ml += t.result.a
      a.tiePts += t.result.pointsA
      b.tiePts += t.result.pointsB
      if (t.result.a > t.result.b) {
        a.w++
        b.l++
      } else {
        b.w++
        a.l++
      }
    })
  const list = [...rows.values()].map((r) => ({ ...r, net: r.mw - r.ml }))
  list.sort((x, y) => y.tiePts - x.tiePts || y.mw - x.mw || y.net - x.net || x.teamId.localeCompare(y.teamId))
  list.forEach((r, i) => (r.pos = i + 1))
  return list
}
