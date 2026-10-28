import { useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, GripVertical, SlidersHorizontal } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Checkbox, Segmented, Toggle } from '../../../components/ui/Controls'
import { ChoiceCard } from '../../../components/ui/Display'
import { Drawer } from '../../../components/ui/Overlay'
import { Select } from '../../../components/ui/Field'
import type { EventItem, MatchRules, RankingCriterion, TimeoutRule } from '../../../mock/types'
import { updateCategory, updateEvent } from '../../../store/actions'
import { mutate } from '../../../store/store'
import { useData } from '../../../store/hooks'
import { categoriesOf } from '../../../store/selectors'
import { rulesSentence } from '../../../lib/scoring'
import { defaultRankingCriteria } from '../../../mock/constants'
import { cn } from '../../../lib/cn'
import { NumberStepper, Note, Q, StepTitle } from '../common'

interface Preset {
  key: string
  label: string
  line: string
  rules?: Partial<MatchRules>
}
function presetsFor(sport: EventItem['sport']): Preset[] {
  if (sport === 'badminton')
    return [
      { key: 'bd21', label: '21 points, best of 3', line: 'BWF standard. Win by 2, capped at 30.', rules: { scoring: 'rally', pointsToWin: 21, winBy: 2, games: 3 } },
      { key: 'bd15', label: '15 points, 1 game', line: 'Quick format for big draws.', rules: { scoring: 'rally', pointsToWin: 15, winBy: 2, games: 1 } },
      { key: 'custom', label: 'Custom', line: 'Set points and games yourself.' },
    ]
  if (sport === 'cricket' || sport === 'football') return []
  return [
    { key: 'rally11', label: 'Rally to 11, win by 2', line: 'Every rally scores. The modern default.', rules: { scoring: 'rally', pointsToWin: 11, winBy: 2 } },
    { key: 'rally15', label: 'Rally to 15, win by 2', line: 'Longer games, fewer surprises.', rules: { scoring: 'rally', pointsToWin: 15, winBy: 2 } },
    { key: 'sideout11', label: 'Side-out to 11, win by 2', line: 'Only the serving side scores. Classic.', rules: { scoring: 'side_out', pointsToWin: 11, winBy: 2 } },
    { key: 'custom', label: 'Custom', line: 'Set points and scoring yourself.' },
  ]
}

/** SW-04: scoring defaults per category, timeouts, ranking. */
export function RulesStep({ ev, compact }: { ev: EventItem; compact?: boolean }) {
  const d = useData()
  const cats = categoriesOf(d, ev.id)
  const presets = presetsFor(ev.sport)
  const [adv, setAdv] = useState(false)
  const [rankDrawer, setRankDrawer] = useState(false)
  const first = cats[0]?.matchRules
  const applyAll = (patch: Partial<MatchRules>) => cats.forEach((c) => updateCategory(c.id, (x) => Object.assign(x.matchRules, patch)))
  const isLeague = ev.type === 'league' || ev.type === 'auction' || ev.type === 'draft'
  return (
    <div className="flex flex-col gap-8">
      {!compact && <StepTitle title="Match rules." sub="Set it once for every category. Umpires and players see the same rules." />}

      {presets.length > 0 && first && (
        <Q title="How are matches scored?">
          <div className="grid gap-3 sm:grid-cols-2">
            {presets.map((p) => (
              <ChoiceCard
                key={p.key}
                selected={ev.setup.scoringPreset === p.key}
                onSelect={() => {
                  updateEvent(ev.id, (e) => (e.setup.scoringPreset = p.key))
                  if (p.rules) applyAll(p.rules)
                }}
                title={p.label}
                description={p.line}
              />
            ))}
          </div>
          {ev.setup.scoringPreset === 'custom' && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Select label="Scoring" value={first.scoring} onChange={(e) => applyAll({ scoring: e.target.value as MatchRules['scoring'] })} options={[{ value: 'rally', label: 'Rally' }, { value: 'side_out', label: 'Side-out' }]} />
              <Select label="Points to win" value={String(first.pointsToWin)} onChange={(e) => applyAll({ pointsToWin: Number(e.target.value) })} options={[7, 9, 11, 15, 21].map((n) => ({ value: String(n), label: String(n) }))} />
              <Select label="Win by" value={String(first.winBy)} onChange={(e) => applyAll({ winBy: Number(e.target.value) as 1 | 2 })} options={[{ value: '1', label: '1' }, { value: '2', label: '2' }]} />
            </div>
          )}
        </Q>
      )}

      {ev.sport === 'cricket' && (
        <Q title="Cricket rules" help={`${ev.cricket?.overs ?? 8} overs per innings, ${ev.cricket?.playersPerSide ?? 8} players per side (from the format step).`}>
          <Toggle checked={ev.cricket?.superOver ?? true} onChange={(v) => updateEvent(ev.id, (e) => e.cricket && (e.cricket.superOver = v))} label="Super over for ties" description="If scores are level, each side bats one more over." />
        </Q>
      )}
      {ev.sport === 'football' && (
        <Q title="Football rules">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 t-small text-fg2">
              Two halves of
              <NumberStepper label="minutes per half" value={ev.football?.halfMinutes ?? 20} min={5} max={45} suffix="minutes" onChange={(n) => updateEvent(ev.id, (e) => (e.football = { halfMinutes: n, penalties: e.football?.penalties ?? true }))} />
            </label>
            <Toggle checked={ev.football?.penalties ?? true} onChange={(v) => updateEvent(ev.id, (e) => (e.football = { halfMinutes: e.football?.halfMinutes ?? 20, penalties: v }))} label="Penalties for knockout ties" description="Five each, then sudden death." />
          </div>
        </Q>
      )}

      {first && ev.sport !== 'cricket' && ev.sport !== 'football' && (
        <Q title="Games per match">
          <div className="flex flex-col gap-4">
            <Segmented label="Games per match" value={String(first.games)} onChange={(v) => applyAll({ games: Number(v) as 1 | 3 })} options={[{ value: '1', label: '1 game' }, { value: '3', label: 'Best of 3' }]} />
            {first.games === 1 && (
              <Checkbox
                checked={ev.setup.finalsBestOf3}
                onChange={(v) => {
                  updateEvent(ev.id, (e) => (e.setup.finalsBestOf3 = v))
                  applyAll({ finalsGames: v ? 3 : 1 })
                }}
                label="Best of 3 for finals only"
                description="Semi-finals and finals feel like finals."
              />
            )}
            <div>
              <p className="mb-2 t-small text-fg2">Golden point</p>
              <Segmented label="Golden point" value={String(first.goldenPoint)} onChange={(v) => applyAll({ goldenPoint: Number(v) as 0 | 1 | 2 })} options={[{ value: '0', label: 'None' }, { value: '1', label: '1' }, { value: '2', label: '2' }]} />
              <p className="mt-2 t-small text-fg3">
                {first.goldenPoint === 0 ? 'Games go on until someone leads by 2.' : first.goldenPoint === 1 ? `At ${first.pointsToWin - 1} all, the next point wins.` : `At ${first.pointsToWin + 1} all, the next point wins.`}
              </p>
            </div>
            {ev.sport === 'pickleball' && (
              <Toggle checked={first.fixedSideAlternateServe} onChange={(v) => applyAll({ fixedSideAlternateServe: v })} label="Fixed side, alternate serve" description="Teams stay on their side; the serve alternates. Handy on courts with sun or wind." />
            )}
          </div>
        </Q>
      )}

      {cats.length > 0 && ev.sport !== 'cricket' && ev.sport !== 'football' && (
        <Q title="Apply to">
          <Segmented label="Apply to" value={ev.setup.applyRulesTo} onChange={(v) => updateEvent(ev.id, (e) => (e.setup.applyRulesTo = v))} options={[{ value: 'all', label: 'All categories' }, { value: 'per_category', label: 'Per category' }]} />
          <ul className="mt-4 flex flex-col gap-2">
            {cats.map((c) => (
              <li key={c.id} className="card flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
                  <span className="truncate font-semibold text-fg">{c.label}</span>
                </span>
                {ev.setup.applyRulesTo === 'per_category' ? (
                  <span className="flex gap-2">
                    <select aria-label={`${c.label} points`} value={c.matchRules.pointsToWin} onChange={(e) => updateCategory(c.id, (x) => (x.matchRules.pointsToWin = Number(e.target.value)))} className="h-10 rounded-md border border-line bg-s1 px-2 text-fg">
                      {[11, 15, 21].map((n) => <option key={n} value={n}>To {n}</option>)}
                    </select>
                    <select aria-label={`${c.label} games`} value={c.matchRules.games} onChange={(e) => updateCategory(c.id, (x) => (x.matchRules.games = Number(e.target.value) as 1 | 3))} className="h-10 rounded-md border border-line bg-s1 px-2 text-fg">
                      <option value={1}>1 game</option>
                      <option value={3}>Best of 3</option>
                    </select>
                  </span>
                ) : null}
                <span className="t-small text-fg3">{rulesSentence(c.matchRules)}</span>
              </li>
            ))}
          </ul>
        </Q>
      )}

      {isLeague && ev.league && (
        <Q title="How ties are scored">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 t-small text-fg2">
              Points for each match won in a tie
              <NumberStepper label="points per match win" value={ev.league.pointsPerMatchWin} min={1} max={3} onChange={(n) => updateEvent(ev.id, (e) => e.league && (e.league.pointsPerMatchWin = n))} />
            </label>
            <Select
              label="If a tie is level"
              value={ev.league.tieBreaker}
              onChange={(e) => updateEvent(ev.id, (x) => x.league && (x.league.tieBreaker = e.target.value as typeof ev.league.tieBreaker))}
              options={[
                { value: 'super_singles', label: 'Play a super singles match' },
                { value: 'match_points', label: 'Most points across all matches wins' },
                { value: 'golden_game', label: 'One golden game to 7' },
              ]}
            />
            <Toggle
              checked={ev.league.slotSwap === 'leading_score'}
              onChange={(v) => updateEvent(ev.id, (e) => e.league && (e.league.slotSwap = v ? 'leading_score' : 'none'))}
              label="Leader picks the next slot"
              description="The team ahead in a tie chooses which match is played next. Adds strategy."
            />
          </div>
        </Q>
      )}

      {ev.type !== 'social' && (
        <Q title="How are group standings ranked?">
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ['wins_diff_h2h', 'Wins, then point difference, then head to head'],
              ['wins_points', 'Wins, then points scored'],
              ['custom', 'Custom ranking'],
            ] as const).map(([k, l]) => (
              <ChoiceCard
                key={k}
                selected={ev.settings.ranking === k}
                onSelect={() => {
                  updateEvent(ev.id, (e) => {
                    e.settings.ranking = k
                    if (k === 'wins_diff_h2h') e.settings.rankingCriteria = defaultRankingCriteria()
                    if (k === 'wins_points') {
                      const all = defaultRankingCriteria().map((c) => ({ ...c, sort: c.key === 'match_wins' || c.key === 'points_for' }))
                      e.settings.rankingCriteria = [...['match_wins', 'points_for'].map((key) => all.find((c) => c.key === key)!), ...all.filter((c) => !c.sort)]
                    }
                  })
                  if (k === 'custom') setRankDrawer(true)
                }}
                title={l}
              />
            ))}
          </div>
          {ev.settings.ranking === 'custom' && (
            <Button className="mt-3" variant="secondary" size="sm" icon={<SlidersHorizontal size={14} />} onClick={() => setRankDrawer(true)}>
              Edit ranking criteria
            </Button>
          )}
        </Q>
      )}

      {ev.type !== 'social' && (
        <section className="border-t border-line-subtle pt-6">
          <button type="button" aria-expanded={adv} onClick={() => setAdv(!adv)} className="flex h-11 items-center gap-2 font-semibold text-fg2 hover:text-fg">
            <ChevronDown size={18} className={cn('transition-transform', adv && 'rotate-180')} aria-hidden /> Advanced: timeouts
          </button>
          {adv && <TimeoutsEditor ev={ev} />}
        </section>
      )}

      <RankingDrawer ev={ev} open={rankDrawer} onClose={() => setRankDrawer(false)} />
    </div>
  )
}

export function TimeoutsEditor({ ev }: { ev: EventItem }) {
  const set = (i: number, patch: Partial<TimeoutRule>) => updateEvent(ev.id, (e) => Object.assign(e.settings.timeouts[i], patch))
  return (
    <div className="mt-3 flex flex-col gap-3">
      <Note>Defaults: 2 timeouts per team per game, 60 seconds each. Finals get 90 seconds.</Note>
      {ev.settings.timeouts.map((t, i) => (
        <div key={t.stage} className="card flex flex-wrap items-center gap-4 p-3">
          <span className="w-24 font-semibold capitalize text-fg">{t.stage === 'group' ? 'Groups' : t.stage === 'knockout' ? 'Knockouts' : 'Finals'}</span>
          <NumberStepper size="sm" label={`${t.stage} timeouts per team`} value={t.perTeam} min={0} max={4} suffix="per team" onChange={(n) => set(i, { perTeam: n })} />
          <select aria-label={`${t.stage} timeout length`} value={t.seconds} onChange={(e) => set(i, { seconds: Number(e.target.value) })} className="h-9 rounded-md border border-line bg-s1 px-2 text-fg">
            {[30, 45, 60, 90, 120].map((s) => <option key={s} value={s}>{s} seconds</option>)}
          </select>
        </div>
      ))}
    </div>
  )
}

/** Today's Leaderboard config, made friendly: sort and show toggles, drag to order. */
export function RankingDrawer({ ev, open, onClose }: { ev: EventItem; open: boolean; onClose: () => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const crit = ev.settings.rankingCriteria
  const setCrit = (next: RankingCriterion[]) =>
    mutate((d) => {
      const e = d.events.find((x) => x.id === ev.id)
      if (e) {
        e.settings.rankingCriteria = next
        e.settings.ranking = 'custom'
      }
    })
  const onEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const a = crit.findIndex((c) => c.key === e.active.id)
    const b = crit.findIndex((c) => c.key === e.over!.id)
    setCrit(arrayMove(crit, a, b))
  }
  return (
    <Drawer open={open} onClose={onClose} title="Custom ranking" subtitle="Sort uses the criterion to rank teams, top to bottom. Show adds it as a column in standings." footer={<Button onClick={onClose}>Done</Button>}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
        <SortableContext items={crit.map((c) => c.key)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-1.5">
            {crit.map((c, i) => (
              <SortRow key={c.key} c={c} rank={c.sort ? crit.filter((x) => x.sort).indexOf(c) + 1 : null} onChange={(patch) => setCrit(crit.map((x, j) => (j === i ? { ...x, ...patch } : x)))} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </Drawer>
  )
}

function SortRow({ c, rank, onChange }: { c: RankingCriterion; rank: number | null; onChange: (p: Partial<RankingCriterion>) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.key })
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('flex items-center gap-3 rounded-md border border-line-subtle bg-s1 px-2 py-2', isDragging && 'z-10 rotate-1 border-brand shadow-float')}>
      <button type="button" aria-label={`Drag ${c.label}`} className="flex h-10 w-8 cursor-grab items-center justify-center text-fg3" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <span className="w-6 text-center t-small text-brand-text tnum">{rank ?? ''}</span>
      <span className="flex-1 text-[14px] text-fg">{c.label}</span>
      <label className="flex items-center gap-1.5 t-small text-fg3">
        <input type="checkbox" checked={c.sort} onChange={(e) => onChange({ sort: e.target.checked })} className="h-4 w-4 accent-[var(--brand)]" /> Sort
      </label>
      <label className="flex items-center gap-1.5 t-small text-fg3">
        <input type="checkbox" checked={c.show} onChange={(e) => onChange({ show: e.target.checked })} className="h-4 w-4 accent-[var(--brand)]" /> Show
      </label>
    </li>
  )
}
