import type { DemoData } from '../../mock/types'
import { courtsOf, matchTitle, sideLabel } from '../../store/selectors'
import type { CourtTile } from '../../components/3d/scenes/CourtMap'

/** Court map tiles from the shared court selector. */
export function courtTiles(d: DemoData, eventId: string): CourtTile[] {
  return courtsOf(d, eventId).map((c) => {
    const m = c.current ?? c.awaiting
    const done = m ? m.games.slice(0, m.status === 'live' ? -1 : undefined) : []
    const cur = m?.games[m.games.length - 1]
    return {
      court: c.court,
      state: c.state,
      title: m ? matchTitle(d, m) : c.next ? `Next: ${matchTitle(d, c.next)}` : 'No match',
      a: m ? sideLabel(d, m.sideA, true) : undefined,
      b: m ? sideLabel(d, m.sideB, true) : undefined,
      games: m ? { a: done.filter((g) => g.a > g.b).length, b: done.filter((g) => g.b > g.a).length } : undefined,
      points: m?.status === 'live' && cur ? cur : undefined,
      server: m?.live?.server,
      lateMin: c.lateMin,
    }
  })
}
