import type { EventCategory, Group, Match, MatchStage, Registration, RankingCriterion } from '../mock/types'

/* ------------------------------------------------------------------ groups */

/** Split n entries into groups of about `size` (sizes differ by at most one). */
export function groupSizes(n: number, size: number): number[] {
  if (n <= 0) return []
  const count = Math.max(1, Math.ceil(n / size))
  const base = Math.floor(n / count)
  const extra = n % count
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0))
}

export function nextPow2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

export interface FormatSummary {
  groups: number
  sizes: number[]
  qualifiers: number
  bracket: number
  byes: number
  groupMatches: number
  knockoutMatches: number
  sentence: string
}

const word = (n: number) => String(n)

/** The live sentence used in setup and the draw: "28 teams make 7 groups of 4. Top 2 go to a 16-team knockout with 2 byes." */
export function summarizeFormat(
  n: number,
  format: EventCategory['format'],
  groupSize: number,
  advance: number,
  unit: 'teams' | 'players' = 'teams',
  approx = true,
): FormatSummary {
  const about = approx ? 'About ' : ''
  if (n < 2) {
    return { groups: 0, sizes: [], qualifiers: 0, bracket: 0, byes: 0, groupMatches: 0, knockoutMatches: 0, sentence: `Needs at least 2 ${unit} to make matches.` }
  }
  if (format === 'round_robin') {
    const gm = (n * (n - 1)) / 2
    return { groups: 1, sizes: [n], qualifiers: 0, bracket: 0, byes: 0, groupMatches: gm, knockoutMatches: 0, sentence: `${about}${n} ${unit} all play each other: ${gm} matches. Most wins takes the title.` }
  }
  if (format === 'knockout') {
    const b = nextPow2(n)
    const byes = b - n
    return {
      groups: 0, sizes: [], qualifiers: n, bracket: b, byes, groupMatches: 0, knockoutMatches: n - 1,
      sentence: `${about}${n} ${unit} go straight into a ${b}-${unit === 'teams' ? 'team' : 'player'} knockout${byes ? ` with ${byes} ${byes === 1 ? 'bye' : 'byes'} for the top seeds` : ''}. Lose once and you are out.`,
    }
  }
  if (format === 'king_of_court') {
    const rounds = Math.max(3, Math.min(8, n - 1))
    return { groups: 0, sizes: [], qualifiers: 0, bracket: 0, byes: 0, groupMatches: rounds * Math.floor(n / 2), knockoutMatches: 0, sentence: `${about}${n} ${unit} play ${rounds} rotating rounds. Winners move up a court, losers move down.` }
  }
  const sizes = groupSizes(n, groupSize)
  const g = sizes.length
  const q = Math.min(n, g * advance)
  const b = nextPow2(q)
  const byes = b - q
  const gm = sizes.reduce((s, k) => s + (k * (k - 1)) / 2, 0)
  const uniform = sizes.every((s) => s === sizes[0])
  const groupsText = uniform
    ? `${word(g)} ${g === 1 ? 'group' : 'groups'} of ${sizes[0]}`
    : `${g} groups (${summarizeSizes(sizes)})`
  const unitOne = unit === 'teams' ? 'team' : 'player'
  const ko = q < 2 ? 'The group winner takes the title.' : `Top ${advance} go to a ${b}-${unitOne} knockout${byes ? ` with ${byes} ${byes === 1 ? 'bye' : 'byes'}` : ''}.`
  return {
    groups: g, sizes, qualifiers: q, bracket: b, byes, groupMatches: gm, knockoutMatches: Math.max(0, q - 1),
    sentence: `${about}${n} ${unit} make ${groupsText}. ${ko}`,
  }
}

function summarizeSizes(sizes: number[]): string {
  const counts = new Map<number, number>()
  sizes.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1))
  return [...counts.entries()].sort((a, b) => b[0] - a[0]).map(([s, c]) => `${c} of ${s}`).join(', ')
}

export const GROUP_NAMES = 'ABCDEFGHIJKLMNOP'.split('')

/** Snake seeding into groups: best seed to A, next to B... then back. */
export function snakeIntoGroups(orderedIds: string[], sizes: number[]): string[][] {
  const groups: string[][] = sizes.map(() => [])
  let idx = 0
  let dir = 1
  let g = 0
  while (idx < orderedIds.length) {
    if (groups[g].length < sizes[g]) {
      groups[g].push(orderedIds[idx])
      idx++
    }
    if (idx >= orderedIds.length) break
    g += dir
    if (g >= sizes.length) {
      g = sizes.length - 1
      dir = -1
    } else if (g < 0) {
      g = 0
      dir = 1
    }
    if (groups.every((gr, i) => gr.length >= sizes[i])) break
  }
  return groups
}

/* ------------------------------------------------------------- round robin */

/** Circle method. Returns rounds of pairs. */
export function roundRobin<T>(items: T[]): [T, T][][] {
  const list: (T | null)[] = [...items]
  if (list.length % 2 === 1) list.push(null)
  const n = list.length
  const rounds: [T, T][][] = []
  for (let r = 0; r < n - 1; r++) {
    const pairs: [T, T][] = []
    for (let i = 0; i < n / 2; i++) {
      const a = list[i]
      const b = list[n - 1 - i]
      if (a !== null && b !== null) pairs.push(r % 2 === 0 ? [a, b] : [b, a])
    }
    rounds.push(pairs)
    list.splice(1, 0, list.pop()!)
  }
  return rounds
}

/* ---------------------------------------------------------------- brackets */

/** Standard bracket order so seed 1 and 2 can only meet in the final. */
export function seedOrder(size: number): number[] {
  let order = [1]
  while (order.length < size) {
    const n = order.length * 2
    order = order.flatMap((s) => [s, n + 1 - s])
  }
  return order
}

export function stageFor(remaining: number): MatchStage {
  if (remaining === 2) return 'final'
  if (remaining === 4) return 'sf'
  if (remaining === 8) return 'qf'
  if (remaining === 16) return 'r16'
  return 'r32'
}

export const STAGE_LABEL: Record<MatchStage, string> = {
  group: 'Group',
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter-final',
  sf: 'Semi-final',
  third: '3rd place',
  final: 'Final',
  league: 'League',
}

export interface BracketSlot {
  /** Registration id when known, or a source label like "A1". */
  reg: string | null
  src?: string
}

/**
 * Build knockout matches. `slots` are in seed order (index 0 = seed 1). Byes go to the top seeds:
 * a slot paired with a bye skips round one and sits directly in the round-two match.
 */
export function buildKnockout(
  base: { eventId: string; categoryId: string; bestOf: 1 | 3; finalsBestOf: 1 | 3 },
  slots: BracketSlot[],
  idPrefix: string,
  withThird: boolean,
): Match[] {
  const q = slots.length
  if (q < 2) return []
  const size = nextPow2(q)
  const order = seedOrder(size)
  const positioned: (BracketSlot | null)[] = order.map((seed) => (seed <= q ? slots[seed - 1] : null))
  const matches: Match[] = []
  // Each entry in `current` is either a slot (team or source) or a feeding match id.
  type Feed = { slot: BracketSlot } | { matchId: string } | null
  let current: Feed[] = positioned.map((s) => (s ? { slot: s } : null))
  let round = 1
  let remaining = size
  while (remaining >= 2) {
    const stage = stageFor(remaining)
    const next: Feed[] = []
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i]
      const b = current[i + 1]
      if (!a && !b) {
        next.push(null)
        continue
      }
      if (!a || !b) {
        next.push(a ?? b)
        continue
      }
      const id = `${idPrefix}-${stage}-${i / 2 + 1}`
      const isFinal = stage === 'final'
      const m: Match = {
        id,
        eventId: base.eventId,
        categoryId: base.categoryId,
        stage,
        round,
        slot: i / 2 + 1,
        sideA: 'slot' in a ? a.slot.reg : null,
        sideB: 'slot' in b ? b.slot.reg : null,
        feedA: 'matchId' in a ? a.matchId : undefined,
        feedB: 'matchId' in b ? b.matchId : undefined,
        srcA: 'slot' in a ? a.slot.src : undefined,
        srcB: 'slot' in b ? b.slot.src : undefined,
        status: 'scheduled',
        games: [],
        bestOf: isFinal ? base.finalsBestOf : base.bestOf,
        corrections: [],
        timeline: [],
      }
      matches.push(m)
      next.push({ matchId: id })
    }
    current = next
    remaining /= 2
    round++
  }
  if (withThird) {
    const sfs = matches.filter((m) => m.stage === 'sf')
    if (sfs.length === 2) {
      matches.push({
        id: `${idPrefix}-third-1`,
        eventId: base.eventId,
        categoryId: base.categoryId,
        stage: 'third',
        round: round - 1,
        slot: 2,
        sideA: null,
        sideB: null,
        feedA: sfs[0].id,
        feedB: sfs[1].id,
        feedLoserA: true,
        feedLoserB: true,
        status: 'scheduled',
        games: [],
        bestOf: base.bestOf,
        corrections: [],
        timeline: [],
      })
    }
  }
  return matches
}

/* --------------------------------------------------------------- results */

export function gamesWon(m: Pick<Match, 'games'>): { a: number; b: number } {
  let a = 0
  let b = 0
  for (const g of m.games) {
    if (g.a > g.b) a++
    else if (g.b > g.a) b++
  }
  return { a, b }
}

export function matchWinner(m: Pick<Match, 'games' | 'winner' | 'status'>): 'A' | 'B' | undefined {
  if (m.winner) return m.winner
  const w = gamesWon(m)
  if (w.a === w.b) return undefined
  return w.a > w.b ? 'A' : 'B'
}

export function isFinished(m: Match): boolean {
  return m.status === 'done' || m.status === 'walkover' || m.status === 'awaiting_confirmation'
}
export function isConfirmed(m: Match): boolean {
  return m.status === 'done' || m.status === 'walkover'
}

export interface StandingRow {
  regId: string
  p: number
  w: number
  l: number
  pf: number
  pa: number
  diff: number
  pos: number
  qualified: boolean
}

export function groupStandings(
  group: Group,
  matches: Match[],
  advance: number,
  criteria?: RankingCriterion[],
): StandingRow[] {
  const rows = new Map<string, StandingRow>()
  group.registrationIds.forEach((id) => rows.set(id, { regId: id, p: 0, w: 0, l: 0, pf: 0, pa: 0, diff: 0, pos: 0, qualified: false }))
  const gm = matches.filter((m) => m.groupId === group.id && isConfirmed(m))
  for (const m of gm) {
    if (!m.sideA || !m.sideB) continue
    const ra = rows.get(m.sideA)
    const rb = rows.get(m.sideB)
    if (!ra || !rb) continue
    const pfA = m.games.reduce((s, g) => s + g.a, 0)
    const pfB = m.games.reduce((s, g) => s + g.b, 0)
    ra.p++
    rb.p++
    ra.pf += pfA
    ra.pa += pfB
    rb.pf += pfB
    rb.pa += pfA
    const w = matchWinner(m)
    if (w === 'A') {
      ra.w++
      rb.l++
    } else if (w === 'B') {
      rb.w++
      ra.l++
    }
  }
  const list = [...rows.values()].map((r) => ({ ...r, diff: r.pf - r.pa }))
  const sortKeys = (criteria?.filter((c) => c.sort).map((c) => c.key) ?? ['match_wins', 'points_diff', 'h2h'])
  const h2h = (a: StandingRow, b: StandingRow) => {
    const m = gm.find((x) => (x.sideA === a.regId && x.sideB === b.regId) || (x.sideA === b.regId && x.sideB === a.regId))
    if (!m) return 0
    const w = matchWinner(m)
    const winnerId = w === 'A' ? m.sideA : w === 'B' ? m.sideB : null
    return winnerId === a.regId ? -1 : winnerId === b.regId ? 1 : 0
  }
  list.sort((a, b) => {
    for (const k of sortKeys) {
      let d = 0
      if (k === 'match_wins' || k === 'tie_wins') d = b.w - a.w
      else if (k === 'points_diff' || k === 'net_points') d = b.diff - a.diff
      else if (k === 'points_for' || k === 'points') d = b.pf - a.pf
      else if (k === 'points_against') d = a.pa - b.pa
      else if (k === 'match_losses') d = a.l - b.l
      else if (k === 'h2h') d = h2h(a, b)
      if (d !== 0) return d
    }
    return a.regId.localeCompare(b.regId)
  })
  const allDone = gm.length === (group.registrationIds.length * (group.registrationIds.length - 1)) / 2
  list.forEach((r, i) => {
    r.pos = i + 1
    r.qualified = allDone && i < advance
  })
  return list
}

/**
 * Fill knockout sides from group standings (src like "A1") and from feeding matches.
 * Pure: returns a new array.
 */
export function propagate(matches: Match[], groups: Group[], categories: EventCategory[]): Match[] {
  const byId = new Map(matches.map((m) => [m.id, m]))
  const standingsCache = new Map<string, StandingRow[]>()
  const standingsFor = (catId: string, groupName: string): StandingRow[] | null => {
    const key = catId + groupName
    if (standingsCache.has(key)) return standingsCache.get(key)!
    const g = groups.find((x) => x.categoryId === catId && x.name === groupName)
    const cat = categories.find((c) => c.id === catId)
    if (!g || !cat) return null
    const rows = groupStandings(g, matches, cat.advancePerGroup)
    const complete = rows.length > 0 && rows.every((r) => r.qualified || r.pos > cat.advancePerGroup) && rows.some((r) => r.qualified)
    const res = complete ? rows : null
    standingsCache.set(key, res as StandingRow[])
    return res
  }
  const resolve = (src?: string, feed?: string, loser?: boolean, catId?: string): string | null | undefined => {
    if (src && catId) {
      const st = standingsFor(catId, src[0])
      if (!st) return null
      return st[Number(src.slice(1)) - 1]?.regId ?? null
    }
    if (feed) {
      const f = byId.get(feed)
      if (!f || !isConfirmed(f)) return null
      const w = matchWinner(f)
      if (!w) return null
      const winSide = w === 'A' ? f.sideA : f.sideB
      const loseSide = w === 'A' ? f.sideB : f.sideA
      return loser ? loseSide : winSide
    }
    return undefined
  }
  // Iterate rounds in order so changes cascade.
  const sorted = [...matches].sort((a, b) => a.round - b.round)
  for (const m of sorted) {
    if (m.stage === 'group' || m.stage === 'league') continue
    const a = resolve(m.srcA, m.feedA, m.feedLoserA, m.categoryId)
    const b = resolve(m.srcB, m.feedB, m.feedLoserB, m.categoryId)
    let changed = false
    const next = { ...m }
    if (a !== undefined && a !== m.sideA) {
      next.sideA = a
      changed = true
    }
    if (b !== undefined && b !== m.sideB) {
      next.sideB = b
      changed = true
    }
    if (changed) byId.set(m.id, next)
  }
  return matches.map((m) => byId.get(m.id)!)
}

/* ------------------------------------------------------------- scheduling */

export interface Conflict {
  matchId: string
  reason: string
}

/** Auto-assign: earliest slot on any court where no player is busy and rest time is respected. */
export function autoAssign(
  matches: Match[],
  regPlayers: (regId: string | null) => string[],
  opts: { courts: number; startMs: number; endMs: number; lengthMin: number; restMin: number; breaks?: [number, number][] },
): { assigned: Match[]; unassigned: string[] } {
  const len = opts.lengthMin * 60000
  const rest = opts.restMin * 60000
  const courtFree = Array.from({ length: opts.courts }, () => opts.startMs)
  const playerFree = new Map<string, number>()
  const assigned: Match[] = []
  const unassigned: string[] = []
  const ordered = [...matches].sort((a, b) => a.round - b.round || a.slot - b.slot)
  for (const m of ordered) {
    const players = [...regPlayers(m.sideA), ...regPlayers(m.sideB)]
    const earliestPlayers = players.reduce((t, p) => Math.max(t, playerFree.get(p) ?? opts.startMs), opts.startMs)
    let best = -1
    let bestT = Infinity
    for (let c = 0; c < opts.courts; c++) {
      let t = Math.max(courtFree[c], earliestPlayers)
      for (const [bs, be] of opts.breaks ?? []) if (t < be && t + len > bs) t = be
      if (t < bestT) {
        bestT = t
        best = c
      }
    }
    if (best < 0 || bestT + len > opts.endMs) {
      unassigned.push(m.id)
      continue
    }
    courtFree[best] = bestT + len
    players.forEach((p) => playerFree.set(p, bestT + len + rest))
    assigned.push({ ...m, court: best + 1, scheduledAt: new Date(bestT).toISOString() })
  }
  return { assigned, unassigned }
}

export function findConflicts(
  matches: Match[],
  regPlayers: (regId: string | null) => string[],
  lengthMin: number,
  restMin: number,
): Conflict[] {
  const len = lengthMin * 60000
  const out: Conflict[] = []
  const timed = matches.filter((m) => m.scheduledAt && m.court)
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      const a = timed[i]
      const b = timed[j]
      const ta = Date.parse(a.scheduledAt!)
      const tb = Date.parse(b.scheduledAt!)
      const second = ta <= tb ? b : a
      const gap = (Math.max(ta, tb) - Math.min(ta, tb) - len) / 60000
      if (a.court === b.court && Math.abs(ta - tb) < len) {
        out.push({ matchId: second.id, reason: `Overlaps another match on Court ${a.court}` })
        continue
      }
      const pa = new Set([...regPlayers(a.sideA), ...regPlayers(a.sideB)])
      const shared = [...regPlayers(b.sideA), ...regPlayers(b.sideB)].some((p) => pa.has(p))
      if (!shared) continue
      if (gap < 0) out.push({ matchId: second.id, reason: 'A player is double-booked at this time' })
      else if (gap < restMin) out.push({ matchId: second.id, reason: `Player has ${Math.round(gap)} min rest` })
    }
  }
  return out
}

export function registrationLabel(reg: Registration | undefined, nameOf: (id: string) => string): string {
  if (!reg) return 'TBD'
  if (reg.teamName) return reg.teamName
  return reg.playerIds.map(nameOf).join(' / ')
}
