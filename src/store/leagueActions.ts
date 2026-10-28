import { mutate, stamp } from './store'
import type { DemoData, DraftState, LineupSlot } from '../mock/types'
import { roundRobin } from '../lib/tournament'

/* Team builder, ties and line-ups, auction room, draft board, social participants. */

function rating(d: DemoData, pid: string) {
  return d.players.find((p) => p.id === pid)?.duprRating ?? 3.2
}

export function movePlayerToTeam(eventId: string, playerId: string, teamId: string | null) {
  mutate((d) => {
    d.leagueTeams.filter((t) => t.eventId === eventId).forEach((t) => (t.playerIds = t.playerIds.filter((p) => p !== playerId)))
    if (teamId) d.leagueTeams.find((t) => t.id === teamId)?.playerIds.push(playerId)
  })
}

export function toggleLock(teamId: string, playerId: string) {
  mutate((d) => {
    const t = d.leagueTeams.find((x) => x.id === teamId)
    if (!t) return
    t.locked = t.locked.includes(playerId) ? t.locked.filter((p) => p !== playerId) : [...t.locked, playerId]
  })
}

export function setCaptain(teamId: string, playerId: string) {
  mutate((d) => {
    const t = d.leagueTeams.find((x) => x.id === teamId)
    if (t) t.captainId = playerId
  })
}

/** Snake by rating across teams, keeping locked players where they are. */
export function autoBalance(eventId: string, poolIds: string[]) {
  mutate((d) => {
    const teams = d.leagueTeams.filter((t) => t.eventId === eventId)
    const locked = new Set(teams.flatMap((t) => t.locked))
    teams.forEach((t) => (t.playerIds = t.playerIds.filter((p) => locked.has(p))))
    const free = [...new Set([...poolIds, ...d.registrations.filter((r) => r.eventId === eventId && r.status === 'paid').flatMap((r) => r.playerIds)])].filter((p) => !locked.has(p))
    free.sort((a, b) => rating(d, b) - rating(d, a))
    let i = 0
    let dir = 1
    for (const p of free) {
      const order = teams.map((t, j) => ({ t, j })).sort((a, b) => a.t.playerIds.length - b.t.playerIds.length || (dir > 0 ? a.j - b.j : b.j - a.j))
      order[0].t.playerIds.push(p)
      i++
      if (i % teams.length === 0) dir = -dir
    }
    teams.forEach((t) => {
      if (!t.captainId || !t.playerIds.includes(t.captainId)) t.captainId = t.playerIds[0]
    })
  })
}

export function approveLineup(tieId: string, side: 'a' | 'b', approve: boolean) {
  mutate((d) => {
    const t = d.ties.find((x) => x.id === tieId)
    if (!t) return
    t.lineupStatus[side] = approve ? 'approved' : 'changes_requested'
    stamp(d)
  })
}

export function submitLineup(tieId: string, side: 'a' | 'b', slots: LineupSlot[]) {
  mutate((d) => {
    const t = d.ties.find((x) => x.id === tieId)
    if (!t) return
    t.lineups[side] = slots
    t.lineupStatus[side] = 'submitted'
  })
}

/** Ties: every team meets every other once. 8 teams give 7 rounds of 4 ties = 28. */
export function generateTies(eventId: string) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    const teams = d.leagueTeams.filter((t) => t.eventId === eventId)
    if (!e || teams.length < 2) return
    const done = d.ties.filter((t) => t.eventId === eventId && t.status === 'done')
    if (done.length) return
    d.ties = d.ties.filter((t) => t.eventId !== eventId)
    roundRobin(teams.map((t) => t.id)).forEach((pairs, ri) =>
      pairs.forEach(([a, b], ti) =>
        d.ties.push({ id: `${eventId}-tie-${ri + 1}-${ti + 1}`, eventId, round: ri + 1, teamA: a, teamB: b, date: new Date(Date.parse(e.startDate) + ri * 7 * 86400000).toISOString(), court: (ti % e.courts) + 1, status: 'upcoming', matchIds: [], lineupStatus: { a: 'pending', b: 'pending' }, lineups: { a: [], b: [] } }),
      ),
    )
  })
}

/** Rearrange knockout: seed order of the qualified teams. */
export function swapKnockout(eventId: string, order: string[]) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    if (e?.league) e.league.knockoutOrder = order
  })
}

export function resolveTieBreaker(tieId: string, winner: 'a' | 'b') {
  mutate((d) => {
    const t = d.ties.find((x) => x.id === tieId)
    if (!t?.result) return
    if (winner === 'a') { t.result.a++; t.result.pointsA = 2; t.result.pointsB = 0 } else { t.result.b++; t.result.pointsB = 2; t.result.pointsA = 0 }
  })
}

/* --------------------------------------------------------------- auction */

export function auctionBid(eventId: string, teamId: string, amount: number) {
  mutate((d) => {
    const a = d.auctions.find((x) => x.eventId === eventId)
    if (!a || a.status !== 'live' || !a.currentPlayerId) return
    const team = d.leagueTeams.find((t) => t.id === teamId)
    const ev = d.events.find((e) => e.id === eventId)
    if (!team || !ev?.auction) return
    if (amount <= a.currentBid && a.leadingTeamId) return
    if ((team.spent ?? 0) + amount > (team.budget ?? 0) || team.playerIds.length >= ev.auction.squadSize) return
    a.currentBid = amount
    a.leadingTeamId = teamId
    a.bids.push({ id: `bid-${d.now}-${a.bids.length}`, eventId, playerId: a.currentPlayerId, teamId, amount, at: stamp(d, 5) })
    a.deadline = Date.now() + ev.auction.bidSeconds * 1000
  })
}

function nextLot(a: DemoData['auctions'][number]) {
  const nxt = a.lots.filter((l) => l.status === 'upcoming').sort((x, y) => x.order - y.order)[0]
  if (nxt) {
    nxt.status = 'on_block'
    a.currentPlayerId = nxt.playerId
    a.currentBid = nxt.basePrice
  } else {
    a.currentPlayerId = null
    a.status = 'finished'
  }
  a.leadingTeamId = null
  a.deadline = undefined
}

/** Sold to the leading team, or unsold when nobody bid. */
export function auctionHammer(eventId: string): { sold: boolean; playerId?: string; teamId?: string; amount?: number } {
  let res: { sold: boolean; playerId?: string; teamId?: string; amount?: number } = { sold: false }
  mutate((d) => {
    const a = d.auctions.find((x) => x.eventId === eventId)
    if (!a || !a.currentPlayerId) return
    const lot = a.lots.find((l) => l.playerId === a.currentPlayerId)!
    if (a.leadingTeamId) {
      const team = d.leagueTeams.find((t) => t.id === a.leadingTeamId)!
      lot.status = 'sold'
      lot.soldTo = team.id
      lot.soldFor = a.currentBid
      team.playerIds.push(lot.playerId)
      team.spent = (team.spent ?? 0) + a.currentBid
      a.lastSale = { playerId: lot.playerId, teamId: team.id, amount: a.currentBid }
      res = { sold: true, playerId: lot.playerId, teamId: team.id, amount: a.currentBid }
    } else {
      lot.status = 'unsold'
      res = { sold: false, playerId: lot.playerId }
    }
    nextLot(a)
  })
  return res
}

export function auctionUndoLastSale(eventId: string) {
  mutate((d) => {
    const a = d.auctions.find((x) => x.eventId === eventId)
    if (!a?.lastSale) return
    const { playerId, teamId, amount } = a.lastSale
    const lot = a.lots.find((l) => l.playerId === playerId)!
    const team = d.leagueTeams.find((t) => t.id === teamId)!
    team.playerIds = team.playerIds.filter((p) => p !== playerId)
    team.spent = (team.spent ?? 0) - amount
    if (a.currentPlayerId) {
      const cur = a.lots.find((l) => l.playerId === a.currentPlayerId)
      if (cur) cur.status = 'upcoming'
    }
    lot.status = 'on_block'
    lot.soldTo = undefined
    lot.soldFor = undefined
    a.currentPlayerId = playerId
    a.currentBid = lot.basePrice
    a.leadingTeamId = null
    a.status = 'live'
    a.lastSale = undefined
    a.deadline = undefined
  })
}

export function auctionSetStatus(eventId: string, status: 'live' | 'paused') {
  mutate((d) => {
    const a = d.auctions.find((x) => x.eventId === eventId)
    if (!a || a.status === 'finished') return
    a.status = status
    if (status === 'paused') a.deadline = undefined
    if (status === 'live' && !a.currentPlayerId) nextLot(a)
  })
}

export function auctionSkip(eventId: string) {
  mutate((d) => {
    const a = d.auctions.find((x) => x.eventId === eventId)
    if (!a || !a.currentPlayerId) return
    const lot = a.lots.find((l) => l.playerId === a.currentPlayerId)!
    lot.status = 'upcoming'
    lot.order = Math.max(...a.lots.map((l) => l.order)) + 1
    nextLot(a)
  })
}

/* ----------------------------------------------------------------- draft */

export function startDraft(eventId: string) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    const teams = d.leagueTeams.filter((t) => t.eventId === eventId)
    if (!e || !e.league) return
    let pool = [...new Set(d.registrations.filter((r) => r.eventId === eventId && r.status !== 'refunded').flatMap((r) => r.playerIds))].sort((a, b) => rating(d, b) - rating(d, a))
    // captains first: the best remaining player for each team without one
    teams.forEach((t) => {
      if (!t.captainId && pool.length) {
        t.captainId = pool.shift()!
        t.playerIds = [t.captainId]
      }
    })
    pool = pool.filter((p) => !teams.some((t) => t.playerIds.includes(p)))
    const rounds = Math.max(1, e.league.playersPerTeam - 1)
    const picks: DraftState['picks'] = []
    for (let r = 1; r <= rounds; r++) {
      const order = e.draft?.order === 'straight' || r % 2 === 1 ? teams : [...teams].reverse()
      order.forEach((t) => picks.push({ round: r, teamId: t.id, playerId: null }))
    }
    d.drafts = d.drafts.filter((x) => x.eventId !== eventId)
    d.drafts.push({ eventId, status: 'live', teamIds: teams.map((t) => t.id), rounds, picks, pool, deadline: Date.now() + (e.draft?.pickSeconds ?? 60) * 1000 })
  })
}

export function makePick(eventId: string, playerId: string | null, auto = false) {
  mutate((d) => {
    const dr = d.drafts.find((x) => x.eventId === eventId)
    const e = d.events.find((x) => x.id === eventId)
    if (!dr || dr.status !== 'live') return
    const slot = dr.picks.find((p) => !p.playerId)
    if (!slot) return
    const pid = playerId ?? [...dr.pool].sort((a, b) => rating(d, b) - rating(d, a))[0]
    if (!pid) return
    slot.playerId = pid
    slot.auto = auto
    dr.pool = dr.pool.filter((p) => p !== pid)
    d.leagueTeams.find((t) => t.id === slot.teamId)?.playerIds.push(pid)
    if (dr.picks.every((p) => p.playerId)) {
      dr.status = 'finished'
      dr.deadline = undefined
    } else dr.deadline = Date.now() + (e?.draft?.pickSeconds ?? 60) * 1000
  })
}

/* ---------------------------------------------------------------- social */

export function participantPaid(id: string) {
  mutate((d) => {
    const p = d.participants.find((x) => x.id === id)
    if (!p || p.paymentStatus === 'paid') return
    const at = stamp(d)
    p.paymentStatus = 'paid'
    p.history.push({ at, text: 'Marked paid at the desk' })
    const ev = d.events.find((e) => e.id === p.eventId)
    d.payments.push({ id: `pay-${id}-${d.now}`, eventId: p.eventId, participantId: id, customer: p.name, amount: ev?.social?.pricePerPerson ?? 0, fee: 0, method: 'upi', status: 'captured', at, orderRef: `desk_${d.now}`, paymentRef: `desk_${d.now}`, channel: 'desk' })
    d.invoices.push({ id: `inv-${id}-${d.now}`, eventId: p.eventId, number: `RZF-SSM-${2000 + d.invoices.length}`, customer: p.name, amount: ev?.social?.pricePerPerson ?? 0, mailSent: true, sentAt: at })
  })
}

export function participantLink(id: string) {
  mutate((d) => {
    const p = d.participants.find((x) => x.id === id)
    if (!p) return
    p.paymentLinkSentAt = stamp(d)
    if (p.paymentStatus !== 'paid') p.paymentStatus = 'link_sent'
    p.history.push({ at: p.paymentLinkSentAt, text: 'Payment link sent on WhatsApp' })
  })
}

