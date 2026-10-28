import { describe, expect, it } from 'vitest'
import { buildSeed, IDS, heroCategoryId } from '../../mock/seed'
import { blockers, checkedInCount, collected, entryCount, matchStats, playerCount, courtsOf, grossIfFull, categoriesOf } from '../selectors'
import { summarizeFormat } from '../../lib/tournament'
import { computeModules } from '../../lib/modules'
import { rallyWonBy, freshLive } from '../../lib/scoring'
import { defaultRules } from '../../mock/constants'

describe('seed and selectors', () => {
  const d = buildSeed('match_day')
  it('hero counts agree with docs/05', () => {
    expect(entryCount(d, IDS.hero)).toBe(96)
    expect(playerCount(d, IDS.hero)).toBe(152)
    expect(collected(d, IDS.hero)).toBe(120200)
    expect(grossIfFull(categoriesOf(d, IDS.hero))).toBe(168800)
  })
  it('same number from every path', () => {
    const byCat = categoriesOf(d, IDS.hero).reduce((s, c) => s + entryCount(d, IDS.hero, c.id), 0)
    expect(byCat).toBe(entryCount(d, IDS.hero))
  })
  it('match day story', () => {
    const s = matchStats(d, IDS.hero)
    expect(s.live).toBe(2)
    const b = blockers(d, IDS.hero)
    expect(b.filter((x) => x.kind === 'confirm')).toHaveLength(2)
    expect(b.find((x) => x.kind === 'late')?.title).toContain('Court 3 running 20 min late')
    expect(b.find((x) => x.kind === 'idle_umpire')?.court).toBe(4)
    expect(b.find((x) => x.kind === 'not_checked_in')?.title).toContain('3 players')
    expect(b.find((x) => x.kind === 'desk_pending')?.title).toContain('4 desk')
    const courts = courtsOf(d, IDS.hero).map((c) => c.state)
    expect(courts).toEqual(['live', 'live', 'late', 'free'])
    expect(checkedInCount(d, IDS.hero)).toBe(149)
    console.log('matches', s)
  })
  it('MD Open groups', () => {
    const groups = d.groups.filter((g) => g.categoryId === heroCategoryId('mdo'))
    expect(groups).toHaveLength(7)
    expect(summarizeFormat(28, 'groups_knockout', 4, 2, 'teams', false).sentence).toBe('28 teams make 7 groups of 4. Top 2 go to a 16-team knockout with 2 byes.')
  })
  it('module rules differ by type', () => {
    const mods = d.events.slice(0, 5).map((e) => computeModules(e).join(','))
    expect(new Set(mods).size).toBe(5)
  })
  it('side-out scoring with first-server exception', () => {
    const r = { ...defaultRules('pickleball'), scoring: 'side_out' as const }
    let m = { games: [{ a: 0, b: 0 }], bestOf: 1 as const, live: freshLive('A', 'side_out') }
    expect(m.live.serverNo).toBe(2)
    let res = rallyWonBy(m, 'A', r, true)
    expect(res.games[0]).toEqual({ a: 1, b: 0 })
    m = { ...m, games: res.games, live: res.live }
    res = rallyWonBy(m, 'B', r, true) // first server exception: straight side out
    expect(res.live.server).toBe('B')
    expect(res.live.serverNo).toBe(1)
    m = { ...m, games: res.games, live: res.live }
    res = rallyWonBy(m, 'A', r, true) // B server 1 loses: server 2
    expect(res.live.server).toBe('B')
    expect(res.live.serverNo).toBe(2)
    expect(res.games[0]).toEqual({ a: 1, b: 0 })
    m = { ...m, games: res.games, live: res.live }
    res = rallyWonBy(m, 'A', r, true) // side out to A
    expect(res.live.server).toBe('A')
    expect(res.live.serverNo).toBe(1)
  })
  it('every moment builds', () => {
    for (const mo of ['before_launch', 'registrations_open', 'draw_day', 'finished'] as const) {
      const x = buildSeed(mo)
      expect(x.events[0].id).toBe(IDS.hero)
      console.log(mo, entryCount(x, IDS.hero), matchStats(x, IDS.hero))
    }
  })
})
