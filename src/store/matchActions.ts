import { mutate, stamp } from './store'
import type { DemoData, GameScore, Match, MatchRules } from '../mock/types'
import { propagate, isConfirmed } from '../lib/tournament'
import { freshLive, isMatchOver, rallyWonBy, undoPoint } from '../lib/scoring'
import { sideLabel } from './selectors'

/* Match lifecycle actions shared by Home, Match day, the umpire app and TV. */

export function rulesOf(d: DemoData, m: Match): MatchRules {
  const cat = d.categories.find((c) => c.id === m.categoryId)
  const base = cat?.matchRules ?? { scoring: 'rally', pointsToWin: 11, winBy: 2, games: 1, finalsGames: 3, goldenPoint: 0, fixedSideAlternateServe: false, timeoutsPerTeam: 2, timeoutSeconds: 60 }
  return { ...base, ...(m.rulesOverride ?? {}) }
}

function repropagate(d: DemoData, eventId: string) {
  const ms = d.matches.filter((m) => m.eventId === eventId)
  const next = propagate(ms, d.groups.filter((g) => g.eventId === eventId), d.categories.filter((c) => c.eventId === eventId))
  const byId = new Map(next.map((m) => [m.id, m]))
  d.matches = d.matches.map((m) => byId.get(m.id) ?? m)
  // category stage follows play
  d.categories
    .filter((c) => c.eventId === eventId)
    .forEach((c) => {
      const cm = d.matches.filter((m) => m.categoryId === c.id)
      if (!cm.length) return
      if (cm.every(isConfirmed)) c.stage = 'done'
      else if (cm.some((m) => isConfirmed(m) || m.status === 'live') && (c.stage === 'published' || c.stage === 'scheduled')) c.stage = 'in_play'
    })
}

function withMatch(id: string, fn: (m: Match, d: DemoData) => void) {
  mutate((d) => {
    const m = d.matches.find((x) => x.id === id)
    if (m) fn(m, d as DemoData)
  })
}

export function confirmResult(id: string, by = 'Organizer') {
  withMatch(id, (m, d) => {
    m.status = 'done'
    m.confirmedBy = by
    m.timeline.push({ at: stamp(d), text: `Result confirmed by ${by}` })
    if (d.events.find((e) => e.id === m.eventId)?.certifications.dupr) m.dupr = 'pending'
    const ump = d.umpires.find((u) => u.eventId === m.eventId && u.court === m.court)
    if (ump && !d.matches.some((x) => x.court === m.court && x.eventId === m.eventId && (x.status === 'live' || x.status === 'called'))) ump.status = 'idle'
    repropagate(d, m.eventId)
  })
}

/** Call the next ready match to a court. Returns the match id or null. */
export function callNextMatch(eventId: string, court: number, matchId?: string): string | null {
  let called: string | null = null
  mutate((d) => {
    const busy = new Set<string>()
    d.matches.filter((m) => m.eventId === eventId && (m.status === 'live' || m.status === 'called')).forEach((m) => [m.sideA, m.sideB].forEach((s) => s && busy.add(s)))
    const ready = d.matches
      .filter((m) => m.eventId === eventId && m.status === 'scheduled' && m.sideA && m.sideB && !busy.has(m.sideA) && !busy.has(m.sideB) && m.stage !== 'league')
      .sort((a, b) => (a.court === court ? -1 : 0) - (b.court === court ? -1 : 0) || Date.parse(a.scheduledAt ?? '2100') - Date.parse(b.scheduledAt ?? '2100'))
    const m = matchId ? d.matches.find((x) => x.id === matchId) : ready[0]
    if (!m) return
    m.status = 'called'
    m.court = court
    m.calledAt = stamp(d)
    if (!m.scheduledAt || Date.parse(m.scheduledAt) < d.now) m.scheduledAt = m.calledAt
    const ump = d.umpires.find((u) => u.eventId === eventId && u.court === court)
    if (ump) {
      ump.status = 'active'
      m.umpireId = ump.id
    }
    m.timeline.push({ at: m.calledAt, text: `Called to Court ${court}. Players notified on WhatsApp.` })
    called = m.id
  })
  return called
}

export function startMatch(id: string, firstServer: 'A' | 'B') {
  withMatch(id, (m, d) => {
    const r = rulesOf(d, m)
    m.status = 'live'
    m.games = [{ a: 0, b: 0 }]
    m.live = { ...freshLive(firstServer, r.scoring), startedAt: stamp(d) }
    m.timeline.push({ at: m.live.startedAt!, text: `Match started. ${firstServer === 'A' ? sideLabel(d, m.sideA, true) : sideLabel(d, m.sideB, true)} to serve.` })
  })
}

/** One rally to `side`. Returns nothing; read the store for the result. */
export function scoreRally(id: string, side: 'A' | 'B') {
  withMatch(id, (m, d) => {
    if (m.status !== 'live') return
    const r = rulesOf(d, m)
    const doubles = (d.registrations.find((x) => x.id === m.sideA)?.playerIds.length ?? 2) > 1
    const res = rallyWonBy(m, side, r, doubles)
    m.games = res.games
    m.live = res.live
    if (res.gameOver && !res.matchOver) m.timeline.push({ at: stamp(d, 5), text: `Game ${m.games.length} to ${res.games[res.games.length - 1].a > res.games[res.games.length - 1].b ? 'A' : 'B'}, ${res.games[res.games.length - 1].a}-${res.games[res.games.length - 1].b}` })
  })
}

/** Simple goal / run counter for football and cricket. */
export function addPoints(id: string, side: 'A' | 'B', n = 1) {
  withMatch(id, (m) => {
    if (m.status !== 'live') return
    const g = m.games.length ? m.games : [{ a: 0, b: 0 }]
    const last = { ...g[g.length - 1] }
    if (side === 'A') last.a = Math.max(0, last.a + n)
    else last.b = Math.max(0, last.b + n)
    m.live = m.live ?? freshLive('A', 'rally')
    m.live.history = [...m.live.history, { games: m.games.map((x) => ({ ...x })), server: m.live.server, serverNo: m.live.serverNo }]
    m.games = [...g.slice(0, -1), last]
  })
}

export function undoRally(id: string) {
  withMatch(id, (m) => {
    const u = undoPoint(m)
    if (!u) return
    m.games = u.games.length ? u.games : [{ a: 0, b: 0 }]
    m.live = u.live
  })
}

export function callTimeout(id: string, side: 'A' | 'B') {
  withMatch(id, (m, d) => {
    if (!m.live) return
    const r = rulesOf(d, m)
    const used = side === 'A' ? m.live.timeoutsUsed.a : m.live.timeoutsUsed.b
    if (used >= r.timeoutsPerTeam) return
    if (side === 'A') m.live.timeoutsUsed.a++
    else m.live.timeoutsUsed.b++
    m.live.timeoutUntil = new Date(Date.now() + r.timeoutSeconds * 1000).toISOString()
    m.timeline.push({ at: stamp(d, 5), text: `Timeout, ${side === 'A' ? sideLabel(d, m.sideA, true) : sideLabel(d, m.sideB, true)}` })
  })
}

export function endTimeout(id: string) {
  withMatch(id, (m) => {
    if (m.live) m.live.timeoutUntil = undefined
  })
}

/** Umpire ends the match: it waits for confirmation. */
export function endMatch(id: string) {
  withMatch(id, (m, d) => {
    m.status = 'awaiting_confirmation'
    m.endedAt = stamp(d)
    m.timeline.push({ at: m.endedAt, text: 'Umpire ended the match. Waiting for confirmation.' })
  })
}

export function correctScore(id: string, games: GameScore[], reason: string, by: string) {
  withMatch(id, (m, d) => {
    const from = m.games.map((g) => `${g.a}-${g.b}`).join(', ') || 'no score'
    const to = games.map((g) => `${g.a}-${g.b}`).join(', ')
    m.corrections.push({ at: stamp(d), by, from, to, reason })
    m.timeline.push({ at: stamp(d, 1), text: `Score corrected by ${by}: ${from} to ${to}. Reason: ${reason}` })
    m.games = games.map((g) => ({ ...g }))
    m.winner = undefined
    if (m.dupr === 'synced') m.dupr = 'pending'
    repropagate(d, m.eventId)
  })
}

export function walkover(id: string, winner: 'A' | 'B', by: string) {
  withMatch(id, (m, d) => {
    const r = rulesOf(d, m)
    m.status = 'walkover'
    m.winner = winner
    m.games = [winner === 'A' ? { a: r.pointsToWin, b: 0 } : { a: 0, b: r.pointsToWin }]
    m.timeline.push({ at: stamp(d), text: `Walkover to ${winner === 'A' ? sideLabel(d, m.sideA, true) : sideLabel(d, m.sideB, true)}, recorded by ${by}` })
    repropagate(d, m.eventId)
  })
}

export function pauseMatch(id: string, paused: boolean) {
  withMatch(id, (m, d) => {
    m.status = paused ? 'paused' : 'live'
    m.timeline.push({ at: stamp(d), text: paused ? 'Match paused' : 'Match resumed' })
  })
}

export function moveCourt(id: string, court: number) {
  withMatch(id, (m, d) => {
    m.timeline.push({ at: stamp(d), text: `Moved from Court ${m.court} to Court ${court}` })
    m.court = court
    const ump = d.umpires.find((u) => u.eventId === m.eventId && u.court === court)
    if (ump) m.umpireId = ump.id
  })
}

export function setRulesOverride(id: string, patch: Partial<MatchRules>) {
  withMatch(id, (m, d) => {
    m.rulesOverride = { ...(m.rulesOverride ?? {}), ...patch }
    if (patch.games) m.bestOf = patch.games
    m.timeline.push({ at: stamp(d), text: 'Match rules changed for this match' })
  })
}

export function retryDupr(id: string) {
  withMatch(id, (m) => {
    m.dupr = 'synced'
    m.duprReason = undefined
  })
}

export { isMatchOver }

/** Up-next reorder: the queue keeps its time slots, matches swap into them. */
export function reorderQueue(orderedIds: string[]) {
  mutate((d) => {
    const ms = orderedIds.map((id) => d.matches.find((m) => m.id === id)).filter((m): m is Match => !!m)
    const slots = ms.map((m) => ({ at: m.scheduledAt, court: m.court })).sort((a, b) => (a.at ?? '9').localeCompare(b.at ?? '9'))
    ms.forEach((m, i) => {
      m.scheduledAt = slots[i].at
    })
  })
}

export function reassignUmpire(eventId: string, court: number, umpireId: string) {
  mutate((d) => {
    const u = d.umpires.find((x) => x.id === umpireId)
    if (!u) return
    u.court = court
    u.token = `${eventId}-c${court}`
    d.matches.filter((m) => m.eventId === eventId && m.court === court && (m.status === 'live' || m.status === 'called')).forEach((m) => (m.umpireId = u.id))
  })
}

export function inviteUmpire(eventId: string, name: string, mobile: string, court: number) {
  mutate((d) => {
    d.umpires.push({ id: `ump-${eventId}-${d.now}`, eventId, name, mobile, court, status: 'invited', token: `${eventId}-c${court}` })
  })
}

export function setUmpireStatus(id: string, status: 'invited' | 'active' | 'idle') {
  mutate((d) => {
    const u = d.umpires.find((x) => x.id === id)
    if (u) u.status = status
  })
}

/** Players confirm from the umpire's phone (hand-off). */
export function confirmByPlayers(id: string) {
  confirmResult(id, 'Both teams')
}
