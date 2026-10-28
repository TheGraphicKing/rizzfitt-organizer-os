import { useState } from 'react'
import { ChevronDown, Copy, Shuffle, Trash, Users, UserCog, Gavel, Layers, ListChecks } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input, PriceInput, Select, Textarea } from '../../../components/ui/Field'
import { FilterChip, Segmented, StatusChip, Toggle } from '../../../components/ui/Controls'
import { ChoiceCard, SpotIcon } from '../../../components/ui/Display'
import { Dialog, Popover, toast, useConfirm } from '../../../components/ui/Overlay'
import { PhoneInput } from '../../../components/ui/Field'
import { CATEGORICAL, SETUP_CATEGORY_IDS, SETUP_DIVISION_IDS, TEAM_NAME_SUGGESTIONS } from '../../../mock/constants'
import type { CategoryFormat, EventCategory, EventItem, LeagueConfig } from '../../../mock/types'
import { addCategory, removeCategory, requestCustomCategory, updateCategory, updateEvent } from '../../../store/actions'
import { useData } from '../../../store/hooks'
import { categoriesOf } from '../../../store/selectors'
import { summarizeFormat } from '../../../lib/tournament'
import { inr } from '../../../lib/format'
import { cn } from '../../../lib/cn'
import { eligibilityOf, isTeamSport, teamCategoryName } from '../../../lib/eligibility'
import { SPORT_META } from '../../../mock/constants'
import type { Sport } from '../../../mock/types'
import { ChipMulti, NumberStepper, Note, Q, StepTitle } from '../common'

/** SW-03: branches by event type, plus the cricket add-on. */
export function FormatStep({ ev, compact }: { ev: EventItem; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-8">
      {!compact && (
        <StepTitle
          title={ev.type === 'tournament' ? 'Categories and format.' : ev.type === 'social' ? 'Your social session.' : 'Teams and how they play.'}
          sub={ev.type === 'tournament' ? 'Pick the categories you will run. We suggest a format for each; change anything.' : ev.type === 'social' ? 'Capacity, price and what you want to know about players.' : 'Set up the teams, the ties and how squads are formed.'}
        />
      )}
      {ev.type === 'tournament' && <TournamentBranch ev={ev} />}
      {(ev.type === 'league' || ev.type === 'auction' || ev.type === 'draft') && <LeagueBranch ev={ev} />}
      {ev.type === 'auction' && <AuctionBranch ev={ev} />}
      {ev.type === 'draft' && <DraftBranch ev={ev} />}
      {ev.type === 'social' && <SocialBranch ev={ev} />}
      {ev.sport === 'circuit' && <CircuitBranch ev={ev} />}
      {ev.sport === 'cricket' && <CricketAddon ev={ev} />}
      {ev.sport === 'football' && <FootballAddon ev={ev} />}
    </div>
  )
}

/* ------------------------------------------------------------- tournament */

const FORMATS: { value: CategoryFormat; label: string; line: string }[] = [
  { value: 'groups_knockout', label: 'Groups then knockout', line: 'Everyone plays a few matches, the best go through.' },
  { value: 'round_robin', label: 'Round robin', line: 'Everyone plays everyone. Best for small categories.' },
  { value: 'knockout', label: 'Knockout', line: 'Lose once and you are out. Fast and dramatic.' },
  { value: 'king_of_court', label: 'King of the Court', line: 'Rotating rounds, winners move up a court.' },
]

function MiniDiagram({ f }: { f: CategoryFormat }) {
  const c = 'var(--brand)'
  return (
    <svg viewBox="0 0 64 32" className="h-6 w-12" aria-hidden>
      {f === 'groups_knockout' && (
        <>
          {[0, 1, 2].map((i) => <rect key={i} x={2 + i * 11} y={4} width={9} height={24} rx={2} fill="var(--surface-3)" />)}
          <path d="M38 8 H46 V24 H38 M46 16 H58" stroke={c} strokeWidth="2" fill="none" />
        </>
      )}
      {f === 'round_robin' && (
        <>
          {[[16, 6], [48, 6], [16, 26], [48, 26]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.5} fill={c} />)}
          <path d="M16 6 L48 6 L48 26 L16 26 Z M16 6 L48 26 M48 6 L16 26" stroke="var(--text-tertiary)" strokeWidth="1.2" fill="none" />
        </>
      )}
      {f === 'knockout' && <path d="M4 4 H18 V12 H4 M4 20 H18 V28 H4 M18 8 H32 V24 H18 M32 16 H46 M46 10 V22" stroke={c} strokeWidth="2" fill="none" />}
      {f === 'king_of_court' && (
        <>
          {[0, 1, 2].map((i) => <rect key={i} x={6 + i * 18} y={10 - i * 3} width={14} height={14} rx={2} fill={i === 2 ? c : 'var(--surface-3)'} />)}
          <path d="M14 30 L50 6" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="2 2" />
        </>
      )}
    </svg>
  )
}

function TournamentBranch({ ev }: { ev: EventItem }) {
  const d = useData()
  const cats = categoriesOf(d, ev.id)
  const [custom, setCustom] = useState(false)
  const [cName, setCName] = useState('')
  const [cDesc, setCDesc] = useState('')
  const [open, setOpen] = useState<string | null>(cats[0]?.id ?? null)
  const confirm = useConfirm()
  const team = isTeamSport(ev.sport)
  // Team sports enter whole teams, so singles masters would duplicate men's and women's teams.
  const masters = d.categoryMasters.filter((c) => SETUP_CATEGORY_IDS.includes(c.id) && !c.archived && !(team && (c.id === 'cm-ms' || c.id === 'cm-ws')))
  const divisions = d.divisionMasters.filter((dv) => SETUP_DIVISION_IDS.includes(dv.id) && !dv.archived)
  return (
    <>
      <Q title="Which categories will you run?" help={team ? 'Tap a category, then pick the divisions. Each entry is a whole team.' : 'Tap a category, then pick the divisions. Each becomes its own draw.'}>
        <div className="flex flex-wrap gap-2">
          {masters.map((m) => {
            const count = cats.filter((c) => c.categoryId === m.id).length
            return (
              <Popover
                key={m.id}
                align="left"
                label={`${m.name} divisions`}
                trigger={({ toggle, open: o }) => (
                  <FilterChip active={count > 0} onClick={toggle} count={count || undefined}>
                    {team ? teamCategoryName(m.name) : m.name === 'Open' ? 'Open category' : m.name} <ChevronDown size={14} className={cn('transition-transform', o && 'rotate-180')} aria-hidden />
                  </FilterChip>
                )}
              >
                {() => (
                  <div className="w-64 p-2">
                    <p className="px-1 pb-2 t-overline text-fg3">Divisions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {divisions.map((dv) => {
                        const id = `${ev.id}-c-${m.id}-${dv.id}`
                        const on = cats.some((c) => c.id === id)
                        return (
                          <FilterChip
                            key={dv.id}
                            active={on}
                            onClick={() => {
                              if (on) removeCategory(id)
                              else {
                                addCategory(ev.id, m.id, dv.id)
                                setOpen(id)
                              }
                            }}
                          >
                            {dv.name}
                          </FilterChip>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Popover>
            )
          })}
          <button type="button" onClick={() => setCustom(true)} className="h-9 rounded-pill px-3 text-[13px] font-semibold text-brand-text hover:bg-brand-soft">
            Request a custom category
          </button>
        </div>
        {ev.setup.customCategoryRequest && (
          <p className="mt-3 flex items-center gap-2 t-small text-fg3">
            <StatusChip tone="info">Sent to Rizzfitt for review</StatusChip> {ev.setup.customCategoryRequest.name}
          </p>
        )}
      </Q>

      <Q
        title={`${cats.length} ${cats.length === 1 ? 'category' : 'categories'}`}
        help="Expected entries only drive the sentence below. You can change format any time before the draw."
        right={
          cats.length > 1 ? (
            <Button
              size="sm"
              variant="ghost"
              icon={<Copy size={14} />}
              onClick={() => {
                const first = cats[0]
                cats.slice(1).forEach((c) =>
                  updateCategory(c.id, (x) => {
                    x.format = first.format
                    x.groupSize = first.groupSize
                    x.advancePerGroup = first.advancePerGroup
                  }),
                )
                toast.success('Settings copied to every category')
              }}
            >
              Copy settings to all
            </Button>
          ) : undefined
        }
      >
        {cats.length === 0 && <Note tone="warning">Add at least one category to continue.</Note>}
        <ul className="flex flex-col gap-3">
          {cats.map((c) => (
            <CategoryRow
              key={c.id}
              ev={ev}
              c={c}
              open={open === c.id}
              onToggle={() => setOpen(open === c.id ? null : c.id)}
              onRemove={async () => {
                if (await confirm({ title: `Remove ${c.label}?`, body: 'Its price, cap and format settings are removed. You can add it back.', confirmLabel: 'Remove category', tone: 'danger' })) removeCategory(c.id)
              }}
            />
          ))}
        </ul>
      </Q>

      <Dialog
        open={custom}
        onClose={() => setCustom(false)}
        title="Request a custom category"
        description="Rizzfitt keeps one shared list of categories. Tell us what you need and we will add it, usually within a day."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCustom(false)}>
              Cancel
            </Button>
            <Button
              disabled={cName.trim().length < 3}
              onClick={() => {
                requestCustomCategory(ev.organizerId, ev.id, cName.trim(), cDesc.trim())
                setCustom(false)
                toast.success('Sent to Rizzfitt for review', { body: 'We will let you know when it is ready.' })
              }}
            >
              Send request
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Category name" placeholder="Parent & Kid Doubles" value={cName} onChange={(e) => setCName(e.target.value)} />
          <Textarea label="Who plays in it?" placeholder="One parent and one child under 14 play together." value={cDesc} onChange={(e) => setCDesc(e.target.value)} />
        </div>
      </Dialog>
    </>
  )
}

function CategoryRow({ ev, c, open, onToggle, onRemove }: { ev: EventItem; c: EventCategory; open: boolean; onToggle: () => void; onRemove: () => void }) {
  const expected = ev.setup.expectedEntries[c.id] ?? Math.min(c.cap, c.teamSize === 2 ? 28 : 10)
  const unit = c.teamSize === 2 || c.team ? 'teams' : 'players'
  const sum = summarizeFormat(expected, c.format, c.groupSize, c.advancePerGroup, unit)
  return (
    <li className="card overflow-hidden p-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-s2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-fg">{c.label}</span>
          <span className="block truncate t-small text-fg3">{FORMATS.find((f) => f.value === c.format)?.label} · {c.team ? 'Team entry' : c.teamSize === 2 ? 'Doubles' : 'Singles'}{c.prize ? ` · ${c.prize}` : ''}</span>
        </span>
        <MiniDiagram f={c.format} />
        <ChevronDown size={18} className={cn('shrink-0 text-fg3 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="flex flex-col gap-5 border-t border-line-subtle px-4 py-4">
          <div role="radiogroup" aria-label="Format" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={c.format === f.value}
                onClick={() => updateCategory(c.id, (x) => (x.format = f.value))}
                className={cn('flex items-start gap-3 rounded-[12px] border p-3 text-left', c.format === f.value ? 'border-brand bg-brand-soft' : 'border-line bg-s2 hover:border-line-strong')}
              >
                <MiniDiagram f={f.value} />
                <span>
                  <span className="block text-[14px] font-semibold text-fg">{f.label}</span>
                  <span className="block t-small text-fg3 font-normal">{f.line}</span>
                </span>
              </button>
            ))}
          </div>
          {c.format === 'groups_knockout' && (
            <div className="grid grid-cols-2 gap-4">
              <Select label="Group size" value={String(c.groupSize)} onChange={(e) => updateCategory(c.id, (x) => (x.groupSize = Number(e.target.value)))} options={[3, 4, 5, 6].map((n) => ({ value: String(n), label: `Groups of ${n}` }))} />
              <Select label="How many advance" value={String(c.advancePerGroup)} onChange={(e) => updateCategory(c.id, (x) => (x.advancePerGroup = Number(e.target.value)))} options={[1, 2, 4].map((n) => ({ value: String(n), label: `Top ${n}` }))} />
            </div>
          )}
          <div>
            <label className="flex items-center justify-between t-small text-fg2" htmlFor={`exp-${c.id}`}>
              Expected entries <span className="font-bold text-fg tnum">{expected}</span>
            </label>
            <input
              id={`exp-${c.id}`}
              type="range"
              min={2}
              max={64}
              value={expected}
              onChange={(e) => updateEvent(ev.id, (x) => (x.setup.expectedEntries[c.id] = Number(e.target.value)))}
              className="mt-2 w-full accent-[var(--brand)]"
            />
          </div>
          <p className="rounded-[12px] border border-brand-stroke bg-brand-soft px-4 py-3 font-semibold text-fg" aria-live="polite">
            {sum.sentence}
          </p>
          <EntryRules ev={ev} c={c} />
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" icon={<Trash size={14} />} onClick={onRemove}>
              Remove category
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

/** Who can enter one category, its prize, and (when relevant) its sport or squad. */
function EntryRules({ ev, c }: { ev: EventItem; c: EventCategory }) {
  const el = eligibilityOf(c)
  const setEl = (fn: (x: NonNullable<EventCategory['eligibility']>) => void) =>
    updateCategory(c.id, (x) => {
      x.eligibility = x.eligibility ?? { ...el }
      fn(x.eligibility)
    })
  const ageOpts = [{ value: '', label: 'No limit' }, ...[8, 10, 12, 14, 16, 18, 21, 35, 40, 45, 50, 55, 60].map((n) => ({ value: String(n), label: String(n) }))]
  return (
    <fieldset className="flex flex-col gap-4 rounded-[12px] bg-s2 p-4">
      <legend className="sr-only">Entry rules for {c.label}</legend>
      <p className="t-overline text-fg3">Who can enter</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Who plays in it?" value={el.gender} onChange={(e) => setEl((x) => (x.gender = e.target.value as typeof x.gender))} options={[{ value: 'open', label: 'Open to everyone' }, { value: 'men', label: 'Men only' }, { value: 'women', label: 'Women only' }, { value: 'mixed', label: c.team ? 'Mixed teams' : 'One man and one woman' }]} />
        {ev.sport === 'multi' && (
          <Select label="Sport" info="In a multi-sport event, each category is played in one sport. Scoring rules follow it." value={c.sport ?? 'pickleball'} onChange={(e) => updateCategory(c.id, (x) => (x.sport = e.target.value as Sport))} options={(['pickleball', 'badminton', 'cricket', 'football'] as Sport[]).map((sp) => ({ value: sp, label: SPORT_META[sp].label }))} />
        )}
        <Select label="Min age" value={String(el.minAge ?? '')} onChange={(e) => setEl((x) => (x.minAge = e.target.value ? Number(e.target.value) : undefined))} options={ageOpts} />
        <Select label="Max age" value={String(el.maxAge ?? '')} onChange={(e) => setEl((x) => (x.maxAge = e.target.value ? Number(e.target.value) : undefined))} options={ageOpts} />
        {ev.sport === 'pickleball' && (
          <Select label="Rating cap" value={String(el.ratingCap ?? '')} onChange={(e) => setEl((x) => (x.ratingCap = e.target.value ? Number(e.target.value) : undefined))} options={[{ value: '', label: 'No cap' }, ...[3, 3.5, 4, 4.5, 5].map((n) => ({ value: String(n), label: `DUPR up to ${n.toFixed(1)}` }))]} />
        )}
        <Input label="Prize for winners" optional placeholder="₹10,000 and trophies" value={c.prize ?? ''} onChange={(e) => updateCategory(c.id, (x) => (x.prize = e.target.value || undefined))} />
      </div>
      {el.minAge && el.maxAge && el.minAge > el.maxAge && <Note tone="warning">Min age is above max age, so nobody can enter. Swap them.</Note>}
      {c.team && (
        <div className="flex flex-wrap gap-6">
          <label className="flex flex-col gap-2 t-small text-fg2">
            Squad size
            <NumberStepper label="squad size" value={c.team.squadSize} min={5} max={20} onChange={(n) => updateCategory(c.id, (x) => x.team && (x.team.squadSize = n))} />
          </label>
          <label className="flex flex-col gap-2 t-small text-fg2">
            Substitutes
            <NumberStepper label="substitutes" value={c.team.subs} min={0} max={8} onChange={(n) => updateCategory(c.id, (x) => x.team && (x.team.subs = n))} />
          </label>
        </div>
      )}
    </fieldset>
  )
}

/* ----------------------------------------------------------------- league */

const MATCH_TYPES: { type: LeagueConfig['matchTypes'][number]['type']; label: string }[] = [
  { type: 'doubles', label: 'Doubles' },
  { type: 'mixed', label: 'Mixed' },
  { type: 'singles', label: 'Singles' },
  { type: 'super_singles', label: 'Super singles' },
  { type: 'team_event', label: 'Team event' },
]

function LeagueBranch({ ev }: { ev: EventItem }) {
  const lg = ev.league!
  const setL = (fn: (l: LeagueConfig) => void) => updateEvent(ev.id, (e) => e.league && fn(e.league))
  const names = ev.setup.owners.length >= lg.teams ? ev.setup.owners.map((o) => o.team) : TEAM_NAME_SUGGESTIONS.slice(0, lg.teams)
  const perTie = lg.matchTypes.reduce((s, m) => s + m.count, 0)
  const rounds = lg.teams % 2 === 0 ? lg.teams - 1 : lg.teams
  const formation: { value: LeagueConfig['teamFormation']; label: string; line: string; icon: typeof Users }[] = [
    { value: 'organizer_assigns', label: 'You assign', line: 'Drag players into teams yourself', icon: UserCog },
    { value: 'auto_balance', label: 'Auto-balance by skill', line: 'We spread ratings evenly', icon: Shuffle },
    { value: 'captains_submit', label: 'Captains submit line-ups', line: 'Captains pick, you approve', icon: ListChecks },
    { value: 'auction', label: 'Auction', line: 'Owners bid for players', icon: Gavel },
    { value: 'draft', label: 'Draft', line: 'Captains pick round by round', icon: Layers },
  ]
  return (
    <>
      <Q title="Teams" help={isTeamSport(ev.sport) ? `${lg.teams} teams play ${rounds} rounds. Each fixture is one match.` : `${lg.teams} teams play ${rounds} rounds. Every team meets every other team once.`}>
        <div className="flex flex-wrap gap-6">
          <label className="flex flex-col gap-2 t-small text-fg2">
            Number of teams
            <NumberStepper label="teams" value={lg.teams} min={3} max={16} onChange={(n) => setL((l) => (l.teams = n))} />
          </label>
          <label className="flex flex-col gap-2 t-small text-fg2">
            Players per team
            <NumberStepper label="players per team" value={lg.playersPerTeam} min={2} max={16} onChange={(n) => setL((l) => (l.playersPerTeam = n))} />
          </label>
          {!isTeamSport(ev.sport) && <label className="flex flex-col gap-2 t-small text-fg2">
            Matches per player per tie
            <NumberStepper label="matches per player" value={lg.matchesPerPlayer} min={1} max={4} onChange={(n) => setL((l) => (l.matchesPerPlayer = n))} />
          </label>}
        </div>
      </Q>
      {!isTeamSport(ev.sport) && (
      <Q title="Matches in each tie" help={`${perTie} matches per tie. Tap a type to add it, then set how many.`}>
        <div className="flex flex-wrap gap-3">
          {MATCH_TYPES.map((m) => {
            const cur = lg.matchTypes.find((x) => x.type === m.type)
            return (
              <div key={m.type} className={cn('flex items-center gap-3 rounded-lg border p-2 pl-3', cur ? 'border-brand bg-brand-soft' : 'border-line')}>
                <button
                  type="button"
                  aria-pressed={!!cur}
                  className="text-[14px] font-semibold text-fg"
                  onClick={() => setL((l) => (l.matchTypes = cur ? l.matchTypes.filter((x) => x.type !== m.type) : [...l.matchTypes, { type: m.type, count: 1 }]))}
                >
                  {m.label}
                </button>
                {cur && <NumberStepper size="sm" label={`${m.label} matches`} value={cur.count} min={1} max={4} onChange={(n) => setL((l) => (l.matchTypes.find((x) => x.type === m.type)!.count = n))} />}
              </div>
            )
          })}
        </div>
      </Q>
      )}
      <Q title="Who can play?" help="Leave empty for open entry.">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 t-small text-fg2">Skill</p>
            <ChipMulti label="Skill" options={['Beginner', 'Intermediate', 'Advanced', 'Open']} value={lg.eligibility.skill} onChange={(v) => setL((l) => (l.eligibility.skill = v))} />
          </div>
          <div>
            <p className="mb-2 t-small text-fg2">Age</p>
            <ChipMulti label="Age" options={['Under 18', '18+', '35+', '50+']} value={lg.eligibility.age} onChange={(v) => setL((l) => (l.eligibility.age = v))} />
          </div>
          <div>
            <p className="mb-2 t-small text-fg2">Gender mix</p>
            <ChipMulti label="Gender" options={['Men', 'Women', 'At least 2 women per team']} value={lg.eligibility.gender} onChange={(v) => setL((l) => (l.eligibility.gender = v))} />
          </div>
        </div>
      </Q>
      <Q title="Ties and knockouts">
        <div className="flex flex-col gap-4">
          {!isTeamSport(ev.sport) && <Toggle checked={lg.ties} onChange={(v) => setL((l) => (l.ties = v))} label="Play as ties" description="Two teams play several matches against each other; the team that wins more takes the tie." />}
          <Toggle checked={lg.autoKnockout} onChange={(v) => setL((l) => (l.autoKnockout = v))} label="Knockouts from the table" description={`Top ${lg.knockoutTeams} play semi-finals when the season ends.`} />
        </div>
      </Q>
      {ev.type === 'league' && (
        <Q title="How are teams formed?">
          <div className="grid gap-3 sm:grid-cols-2">
            {formation.slice(0, 3).map((f) => (
              <ChoiceCard key={f.value} layout="row" selected={lg.teamFormation === f.value} onSelect={() => setL((l) => (l.teamFormation = f.value))} title={f.label} description={f.line} media={<SpotIcon icon={f.icon} size={44} float={false} />} />
            ))}
          </div>
          <p className="mt-3 t-small text-fg3">Want owners to bid, or captains to draft? Choose Auction league or Draft league in the previous step.</p>
        </Q>
      )}
      <Q
        title="Team names and colours"
        help="Suggested names, change any of them."
        right={
          <Button
            size="sm"
            variant="ghost"
            icon={<Shuffle size={14} />}
            onClick={() =>
              updateEvent(ev.id, (e) => {
                const pool = [...TEAM_NAME_SUGGESTIONS].sort(() => Math.random() - 0.5)
                e.setup.owners = Array.from({ length: lg.teams }, (_, i) => ({ team: pool[i], name: e.setup.owners[i]?.name ?? '', mobile: e.setup.owners[i]?.mobile ?? '' }))
              })
            }
          >
            Shuffle
          </Button>
        }
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {names.map((n, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-9 w-9 shrink-0 rounded-[10px]" style={{ background: CATEGORICAL[i % 8] }} aria-hidden />
              <Input
                aria-label={`Team ${i + 1} name`}
                value={n}
                className="flex-1"
                onChange={(e) =>
                  updateEvent(ev.id, (x) => {
                    if (x.setup.owners.length < lg.teams) x.setup.owners = names.map((t) => ({ team: t, name: '', mobile: '' }))
                    x.setup.owners[i].team = e.target.value
                  })
                }
              />
            </li>
          ))}
        </ul>
      </Q>
    </>
  )
}

/* ---------------------------------------------------------------- auction */

function AuctionBranch({ ev }: { ev: EventItem }) {
  const a = ev.auction!
  const lg = ev.league!
  const setA = (fn: (x: NonNullable<EventItem['auction']>) => void) => updateEvent(ev.id, (e) => e.auction && fn(e.auction))
  const owners = Array.from({ length: lg.teams }, (_, i) => ev.setup.owners[i] ?? { team: TEAM_NAME_SUGGESTIONS[i], name: '', mobile: '' })
  return (
    <>
      <Q title="Budget per team" help={`Each owner can spend up to ${inr(a.budgetPerTeam)} on a squad of ${a.squadSize}.`}>
        <div className="flex flex-wrap items-end gap-3">
          <PriceInput ariaLabel="Budget per team" value={a.budgetPerTeam} onChange={(v) => setA((x) => (x.budgetPerTeam = v))} className="w-48" />
          {[50000, 100000, 200000].map((v) => (
            <FilterChip key={v} active={a.budgetPerTeam === v} onClick={() => setA((x) => (x.budgetPerTeam = v))}>
              {inr(v)}
            </FilterChip>
          ))}
        </div>
        <div className="mt-4">
          <p className="mb-2 t-small text-fg2">Squad size</p>
          <NumberStepper label="squad size" value={a.squadSize} min={2} max={16} onChange={(n) => setA((x) => (x.squadSize = n))} />
        </div>
      </Q>
      <Q title="Player tiers and base prices" help="Bidding for a player starts at their tier's base price.">
        <div className="grid grid-cols-3 gap-3">
          {(['A', 'B', 'C'] as const).map((t) => (
            <PriceInput key={t} label={`Tier ${t}`} value={a.basePriceByTier[t]} onChange={(v) => setA((x) => (x.basePriceByTier[t] = v))} />
          ))}
        </div>
      </Q>
      <Q title="Tier assignment" help="How players get their tier before the auction.">
        <div className="flex flex-col gap-4">
          <Segmented label="Tier assignment" value={a.tierRule ?? 'dupr'} onChange={(v) => setA((x) => (x.tierRule = v))} options={[{ value: 'dupr', label: 'By rating' }, { value: 'manual', label: 'I place them' }]} />
          <div className="flex flex-wrap gap-6">
            <label className="flex flex-col gap-2 t-small text-fg2">
              Max tier A per team
              <NumberStepper label="max tier A players per team" value={a.maxTierA ?? 2} min={1} max={a.squadSize} onChange={(n) => setA((x) => (x.maxTierA = n))} />
            </label>
          </div>
          <Select label="Unsold players" className="max-w-sm" value={a.unsold ?? 'second_round'} onChange={(e) => setA((x) => (x.unsold = e.target.value as 'second_round' | 'assign_base'))} options={[{ value: 'second_round', label: 'Back in for a second round' }, { value: 'assign_base', label: 'Placed in teams with space, at base price' }]} />
        </div>
      </Q>
      <Q title="Bid steps" help="The buttons owners tap to raise a bid.">
        <div className="flex flex-wrap gap-2">
          {[500, 1000, 2000, 5000, 10000].map((s) => (
            <FilterChip key={s} active={a.bidSteps.includes(s)} onClick={() => setA((x) => (x.bidSteps = x.bidSteps.includes(s) ? x.bidSteps.filter((y) => y !== s) : [...x.bidSteps, s].sort((p, q) => p - q)))}>
              +{inr(s)}
            </FilterChip>
          ))}
        </div>
      </Q>
      <Q title="Who bids?">
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard selected={a.biddingBy === 'owners'} onSelect={() => setA((x) => (x.biddingBy = 'owners'))} title="Owners on their phones" description="Each owner gets a link and bids live." />
          <ChoiceCard selected={a.biddingBy === 'organizer'} onSelect={() => setA((x) => (x.biddingBy = 'organizer'))} title="You, on their behalf" description="Owners call out bids, you tap them in." />
        </div>
      </Q>
      <Q title="Auction date and time">
        <Input type="datetime-local" aria-label="Auction date and time" className="max-w-xs" value={a.startsAt.slice(0, 16)} onChange={(e) => setA((x) => (x.startsAt = `${e.target.value}:00+05:30`))} />
      </Q>
      <Q title="Team owners" help="They get a WhatsApp invite with their bidding link. You can add them later.">
        <ul className="flex flex-col gap-3">
          {owners.map((o, i) => (
            <li key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr]">
              <p className="flex items-center gap-2 self-center font-semibold text-fg">
                <span className="h-3 w-3 rounded-full" style={{ background: CATEGORICAL[i % 8] }} aria-hidden />
                {o.team}
              </p>
              <Input aria-label={`${o.team} owner name`} placeholder="Owner name" value={o.name} onChange={(e) => updateEvent(ev.id, (x) => { x.setup.owners = owners.map((y) => ({ ...y })); x.setup.owners[i].name = e.target.value })} />
              <PhoneInput label={<span className="sr-only">{o.team} owner mobile</span>} value={o.mobile} onChange={(v) => updateEvent(ev.id, (x) => { x.setup.owners = owners.map((y) => ({ ...y })); x.setup.owners[i].mobile = v })} />
            </li>
          ))}
        </ul>
      </Q>
    </>
  )
}

/* ------------------------------------------------------------------ draft */

function DraftBranch({ ev }: { ev: EventItem }) {
  const dr = ev.draft!
  const lg = ev.league!
  const setD = (fn: (x: NonNullable<EventItem['draft']>) => void) => updateEvent(ev.id, (e) => e.draft && fn(e.draft))
  return (
    <>
      <Q title="Draft order" help={`${lg.playersPerTeam} rounds: one pick per team per round, so every squad fills up.`}>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['snake', 'straight'] as const).map((o) => (
            <ChoiceCard
              key={o}
              selected={dr.order === o}
              onSelect={() => setD((x) => (x.order = o))}
              title={o === 'snake' ? 'Snake' : 'Straight'}
              description={o === 'snake' ? 'Order reverses each round. Fairest for the last pick.' : 'Same order every round.'}
              media={
                <svg viewBox="0 0 80 36" className="h-9 w-20" aria-hidden>
                  <path d={o === 'snake' ? 'M6 8 H70 M70 8 C78 8 78 28 70 28 H6' : 'M6 8 H70 M6 28 H70'} stroke="var(--brand)" strokeWidth="2.5" fill="none" />
                  {[6, 27, 48, 70].map((x) => <circle key={x} cx={x} cy={8} r={3.5} fill="var(--text-secondary)" />)}
                </svg>
              }
            />
          ))}
        </div>
      </Q>
      <Q title="Pick timer">
        <Segmented label="Pick timer" value={String(dr.pickSeconds) as '30' | '60' | '90'} onChange={(v) => setD((x) => (x.pickSeconds = Number(v) as 30 | 60 | 90))} options={[{ value: '30', label: '30 s' }, { value: '60', label: '60 s' }, { value: '90', label: '90 s' }]} />
      </Q>
      <Q title="Captains per team">
        <NumberStepper label="captains per team" value={dr.captainsPerTeam} min={1} max={2} onChange={(n) => setD((x) => (x.captainsPerTeam = n))} />
      </Q>
      <Q title="Captain selection">
        <div className="grid gap-3 sm:grid-cols-3">
          {([['organizer', 'You pick them', 'Choose captains from the player list.'], ['vote', 'Players vote', 'Registered players vote before the draft.'], ['top_rated', 'Highest rated', 'The top rated players become captains.']] as const).map(([v, t, l]) => (
            <ChoiceCard key={v} selected={(dr.captainPick ?? 'organizer') === v} onSelect={() => setD((x) => (x.captainPick = v))} title={t} description={l} />
          ))}
        </div>
      </Q>
    </>
  )
}

/* ----------------------------------------------------------------- social */

function SocialBranch({ ev }: { ev: EventItem }) {
  const so = ev.social!
  const setS = (fn: (x: NonNullable<EventItem['social']>) => void) => updateEvent(ev.id, (e) => e.social && fn(e.social))
  return (
    <>
      <Q title="Capacity and price" help={`If you fill up: ${inr(so.capacity * so.pricePerPerson)} in entries.`}>
        <div className="flex flex-wrap items-end gap-6">
          <label className="flex flex-col gap-2 t-small text-fg2">
            Capacity
            <NumberStepper label="capacity" value={so.capacity} min={4} max={400} onChange={(n) => setS((x) => (x.capacity = n))} />
          </label>
          <PriceInput label="Price per person" value={so.pricePerPerson} onChange={(v) => setS((x) => (x.pricePerPerson = v))} className="w-48" />
        </div>
      </Q>
      <Q title="How will people play?">
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard selected={so.format === 'just_social'} onSelect={() => setS((x) => (x.format = 'just_social'))} title="Just social" description="Open play. No draws, no scores." />
          <ChoiceCard selected={so.format === 'play_rounds'} onSelect={() => setS((x) => (x.format = 'play_rounds'))} title="Play rounds" description="Rotating partners, we schedule and keep score." />
        </div>
        {so.format === 'play_rounds' && (
          <div className="mt-5 flex flex-col gap-4 rounded-[12px] bg-s2 p-4">
            <p className="t-overline text-fg3">Play rounds</p>
            <div className="flex flex-wrap gap-6">
              <label className="flex flex-col gap-2 t-small text-fg2">
                Rounds
                <NumberStepper label="rounds" value={so.rounds ?? 6} min={2} max={16} onChange={(n) => setS((x) => (x.rounds = n))} />
              </label>
              <label className="flex flex-col gap-2 t-small text-fg2">
                Minutes per round
                <NumberStepper label="minutes per round" value={so.roundMin ?? 15} min={8} max={40} onChange={(n) => setS((x) => (x.roundMin = n))} suffix="min" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Partners" info="Every round gives everyone a new partner, or pairs stay together all session." value={so.rotation ?? 'every_round'} onChange={(e) => setS((x) => (x.rotation = e.target.value as 'every_round' | 'fixed'))} options={[{ value: 'every_round', label: 'New partner every round' }, { value: 'fixed', label: 'Same partner all session' }]} />
              <Select label="Mixing" info="Any level mixes everyone. By level keeps similar ratings on the same court." value={so.mixing ?? 'any'} onChange={(e) => setS((x) => (x.mixing = e.target.value as 'any' | 'by_level'))} options={[{ value: 'any', label: 'Any level' }, { value: 'by_level', label: 'Similar levels together' }]} />
            </div>
            <p className="t-small text-fg3">{(so.rounds ?? 6)} rounds of {(so.roundMin ?? 15)} minutes: about {Math.round(((so.rounds ?? 6) * ((so.roundMin ?? 15) + 3)) / 6) / 10} hours of play.</p>
          </div>
        )}
      </Q>
      <Q title="What should we ask?">
        <div className="flex flex-wrap gap-2">
          {([['meal', 'Meal preference'], ['tshirt', 'T-shirt size'], ['alias', 'Fun alias']] as const).map(([k, l]) => (
            <FilterChip key={k} active={so.collect.includes(k)} onClick={() => setS((x) => (x.collect = x.collect.includes(k) ? x.collect.filter((y) => y !== k) : [...x.collect, k]))}>
              {l}
            </FilterChip>
          ))}
        </div>
      </Q>
    </>
  )
}

/* ---------------------------------------------------------------- cricket */

function CricketAddon({ ev }: { ev: EventItem }) {
  const c = ev.cricket ?? { overs: 8, playersPerSide: 8, impactPlayer: false, impactCount: 1, superOver: true }
  const setC = (fn: (x: NonNullable<EventItem['cricket']>) => void) =>
    updateEvent(ev.id, (e) => {
      e.cricket = e.cricket ?? { ...c }
      fn(e.cricket)
    })
  return (
    <Q title="Cricket format" help="Simplified scoring: runs, wickets and overs per innings.">
      <div className="flex flex-wrap gap-6">
        <label className="flex flex-col gap-2 t-small text-fg2">
          Overs per innings
          <NumberStepper label="overs" value={c.overs} min={2} max={50} onChange={(n) => setC((x) => (x.overs = n))} />
        </label>
        <label className="flex flex-col gap-2 t-small text-fg2">
          Players per side
          <NumberStepper label="players per side" value={c.playersPerSide} min={5} max={11} onChange={(n) => setC((x) => (x.playersPerSide = n))} />
        </label>
        <label className="flex flex-col gap-2 t-small text-fg2">
          Squad size
          <NumberStepper label="squad size" value={c.squadSize ?? c.playersPerSide + 3} min={c.playersPerSide} max={20} onChange={(n) => setC((x) => (x.squadSize = n))} />
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <Toggle checked={c.impactPlayer} onChange={(v) => setC((x) => (x.impactPlayer = v))} label="Impact player" description="Each team can bring in a substitute who bats or bowls." />
        {c.impactPlayer && <NumberStepper label="impact players" value={c.impactCount} min={1} max={2} onChange={(n) => setC((x) => (x.impactCount = n))} suffix="per team" />}
      </div>
    </Q>
  )
}

/* --------------------------------------------------------------- football */

function FootballAddon({ ev }: { ev: EventItem }) {
  const f = ev.football ?? { halfMinutes: 20, penalties: true }
  const side = f.sideSize ?? 7
  const setF = (fn: (x: NonNullable<EventItem['football']>) => void) =>
    updateEvent(ev.id, (e) => {
      e.football = e.football ?? { ...f }
      fn(e.football)
    })
  return (
    <Q title="Football format" info="Side size sets how many players are on the field. Squads include substitutes." help="Teams register as a squad. Half length and penalties are in Rules.">
      <div className="flex flex-col gap-4">
        <Segmented label="Side size" value={String(side) as '5' | '7' | '11'} onChange={(v) => setF((x) => (x.sideSize = Number(v) as 5 | 7 | 11))} options={[{ value: '5', label: '5-a-side' }, { value: '7', label: '7-a-side' }, { value: '11', label: '11-a-side' }]} />
        <div className="flex flex-wrap gap-6">
          <label className="flex flex-col gap-2 t-small text-fg2">
            Squad size
            <NumberStepper label="squad size" value={f.squadSize ?? side + 3} min={side} max={side + 9} onChange={(n) => setF((x) => (x.squadSize = n))} />
          </label>
          <label className="flex flex-col gap-2 t-small text-fg2">
            Substitutes per match
            <NumberStepper label="substitutes per match" value={f.subs ?? 3} min={0} max={9} onChange={(n) => setF((x) => (x.subs = n))} />
          </label>
        </div>
      </div>
    </Q>
  )
}

/* ---------------------------------------------------------------- circuit */

const POS_LABELS = ['Winner', 'Runner-up', 'Semi-finalists', 'Quarter-finalists'] as const

function CircuitBranch({ ev }: { ev: EventItem }) {
  const ci = ev.circuit ?? { legs: [{ date: ev.startDate, venue: ev.venue.name }, { date: ev.endDate, venue: '' }], points: [100, 70, 50, 30] as [number, number, number, number], bestOf: 3 }
  const setC = (fn: (x: NonNullable<EventItem['circuit']>) => void) =>
    updateEvent(ev.id, (e) => {
      e.circuit = e.circuit ?? structuredClone(ci)
      fn(e.circuit)
    })
  return (
    <>
      <Q title="Number of legs" help={`${ci.legs.length} ${ci.legs.length === 1 ? 'leg' : 'legs'}. Each leg is one event day with its own draw. The same categories run at every leg.`}>
        <ul className="flex flex-col gap-3">
          {ci.legs.map((l, i) => (
            <li key={i} className="grid items-end gap-3 sm:grid-cols-[80px_1fr_1fr_auto]">
              <p className="t-title text-fg sm:pb-3.5">Leg {i + 1}</p>
              <Input type="date" label="Date" value={l.date.slice(0, 10)} onChange={(e) => setC((x) => (x.legs[i].date = e.target.value))} />
              <Input label="Venue" value={l.venue} placeholder="Venue name" onChange={(e) => setC((x) => (x.legs[i].venue = e.target.value))} />
              <Button size="sm" variant="ghost" icon={<Trash size={14} />} disabled={ci.legs.length <= 2} onClick={() => setC((x) => x.legs.splice(i, 1))} className="sm:mb-3">
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <Button className="mt-3" size="sm" variant="secondary" disabled={ci.legs.length >= 12} onClick={() => setC((x) => x.legs.push({ date: x.legs[x.legs.length - 1].date, venue: '' }))}>
          Add a leg
        </Button>
        {ci.legs.length < 2 && <div className="mt-3"><Note tone="warning">A circuit needs at least 2 legs.</Note></div>}
      </Q>
      <Q title="Circuit points" help="Points each player earns at every leg, by where they finish.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {POS_LABELS.map((lab, i) => (
            <label key={lab} className="flex flex-col gap-2 t-small text-fg2">
              {lab}
              <NumberStepper size="sm" label={`${lab} points`} value={ci.points[i]} min={0} max={500} onChange={(n) => setC((x) => (x.points[i] = n))} />
            </label>
          ))}
        </div>
      </Q>
      <Q title="Best results count">
        <div className="flex items-center gap-3">
          <NumberStepper label="best results that count" value={Math.min(ci.bestOf, ci.legs.length)} min={1} max={Math.max(1, ci.legs.length)} onChange={(n) => setC((x) => (x.bestOf = n))} />
          <span className="text-fg3">of {ci.legs.length} legs count toward the table</span>
        </div>
      </Q>
    </>
  )
}
