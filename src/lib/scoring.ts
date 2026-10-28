import type { GameScore, Match, MatchLive, MatchRules } from '../mock/types'

export function winsNeeded(bestOf: number): number {
  return Math.ceil(bestOf / 2)
}

/**
 * Game end. goldenPoint 0: win by `winBy`. 1: at (target-1) all, next point wins.
 * 2: deuce is allowed for two extra points, then next point wins.
 */
export function isGameOver(g: GameScore, r: Pick<MatchRules, 'pointsToWin' | 'winBy' | 'goldenPoint'>): boolean {
  const hi = Math.max(g.a, g.b)
  const lo = Math.min(g.a, g.b)
  const diff = hi - lo
  if (hi < r.pointsToWin) return false
  if (r.goldenPoint === 1 && lo >= r.pointsToWin - 1) return diff >= 1
  if (r.goldenPoint === 2 && lo >= r.pointsToWin + 1) return diff >= 1
  return diff >= r.winBy
}

export function gameWins(games: GameScore[], r: Pick<MatchRules, 'pointsToWin' | 'winBy' | 'goldenPoint'>): { a: number; b: number } {
  let a = 0
  let b = 0
  for (const g of games) {
    if (!isGameOver(g, r)) continue
    if (g.a > g.b) a++
    else b++
  }
  return { a, b }
}

export function isMatchOver(games: GameScore[], bestOf: number, r: Pick<MatchRules, 'pointsToWin' | 'winBy' | 'goldenPoint'>): 'A' | 'B' | null {
  const w = gameWins(games, r)
  const need = winsNeeded(bestOf)
  if (w.a >= need) return 'A'
  if (w.b >= need) return 'B'
  return null
}

export function freshLive(firstServer: 'A' | 'B', scoring: MatchRules['scoring']): MatchLive {
  return {
    server: firstServer,
    // Side-out doubles starts at "0-0-2": the first serving team gets only one server.
    serverNo: scoring === 'side_out' ? 2 : 1,
    firstServerSide: firstServer,
    history: [],
    timeoutsUsed: { a: 0, b: 0 },
  }
}

export interface PointResult {
  games: GameScore[]
  live: MatchLive
  scored: boolean
  sideOut: boolean
  gameOver: boolean
  matchOver: 'A' | 'B' | null
}

/** One rally won by `side`. Rally scoring: winner always scores. Side-out: only the serving side scores. */
export function rallyWonBy(
  m: Pick<Match, 'games' | 'bestOf' | 'live'>,
  side: 'A' | 'B',
  r: MatchRules,
  doubles: boolean,
): PointResult {
  const live: MatchLive = m.live ? { ...m.live, history: [...m.live.history] } : freshLive('A', r.scoring)
  const games = m.games.length ? m.games.map((g) => ({ ...g })) : [{ a: 0, b: 0 }]
  live.history.push({ games: m.games.map((g) => ({ ...g })), server: live.server, serverNo: live.serverNo })
  if (live.history.length > 200) live.history.shift()
  let cur = games[games.length - 1]
  if (isGameOver(cur, r)) {
    cur = { a: 0, b: 0 }
    games.push(cur)
  }
  let scored = false
  let sideOut = false
  if (r.scoring === 'rally') {
    if (side === 'A') cur.a++
    else cur.b++
    scored = true
    live.server = side
    live.serverNo = 1
  } else if (side === live.server) {
    if (side === 'A') cur.a++
    else cur.b++
    scored = true
  } else if (doubles && live.serverNo === 1) {
    live.serverNo = 2
  } else {
    live.server = side
    live.serverNo = 1
    sideOut = true
  }
  const gameOver = isGameOver(cur, r)
  const matchOver = gameOver ? isMatchOver(games, m.bestOf, r) : null
  if (gameOver && !matchOver) {
    // Next game: the side that received first in the previous game serves first.
    const nextFirst = live.firstServerSide === 'A' ? 'B' : 'A'
    live.firstServerSide = nextFirst
    live.server = nextFirst
    live.serverNo = r.scoring === 'side_out' && doubles ? 2 : 1
  }
  return { games, live, scored, sideOut, gameOver, matchOver }
}

export function undoPoint(m: Pick<Match, 'games' | 'live'>): { games: GameScore[]; live: MatchLive } | null {
  if (!m.live || m.live.history.length === 0) return null
  const history = [...m.live.history]
  const prev = history.pop()!
  return {
    games: prev.games.length ? prev.games : [],
    live: { ...m.live, history, server: prev.server, serverNo: prev.serverNo },
  }
}

/** "Game point" or "Match point" for the leading side, or null. */
export function pointSituation(
  games: GameScore[],
  bestOf: number,
  r: MatchRules,
  live?: MatchLive,
): { side: 'A' | 'B'; kind: 'game' | 'match' } | null {
  const cur = games[games.length - 1]
  if (!cur || isGameOver(cur, r)) return null
  for (const side of ['A', 'B'] as const) {
    if (r.scoring === 'side_out' && live && live.server !== side) continue
    const next = { ...cur }
    if (side === 'A') next.a++
    else next.b++
    if (isGameOver(next, r)) {
      const after = [...games.slice(0, -1), next]
      return { side, kind: isMatchOver(after, bestOf, r) ? 'match' : 'game' }
    }
  }
  return null
}

/** Plain-words rule summary used in setup and match drawers. */
export function rulesSentence(r: MatchRules): string {
  const scoring = r.scoring === 'rally' ? 'Rally' : 'Side-out'
  const games = r.games === 1 ? 'best of 1' : 'best of 3'
  const finals = r.finalsGames !== r.games ? `. Finals ${r.finalsGames === 3 ? 'best of 3' : 'best of 1'}` : ''
  const golden = r.goldenPoint ? `. Golden point ${r.goldenPoint}` : ''
  return `${scoring} to ${r.pointsToWin}, win by ${r.winBy}, ${games}${finals}${golden}.`
}

/** Random but realistic finished game for seeding. */
export function randomGame(rand: () => number, r: Pick<MatchRules, 'pointsToWin' | 'winBy'>, aWins: boolean): GameScore {
  const t = r.pointsToWin
  let w = t
  let l = Math.floor(rand() * (t - 2))
  if (rand() < 0.18) {
    l = t - 1 + Math.floor(rand() * 2)
    w = l + r.winBy
  }
  return aWins ? { a: w, b: l } : { a: l, b: w }
}
