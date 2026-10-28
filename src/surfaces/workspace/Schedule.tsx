import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DndContext, PointerSensor, KeyboardSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { ArrowRight, CalendarClock, Check, CircleAlert, Hourglass, Info, Lock, Megaphone, RefreshCw, Send, Shuffle, Sparkles, Wand2 } from 'lucide-react'
import { useData, useEvent } from '../../store/hooks'
import { categoriesOf, entries, entryCount, matchesOf, matchTitle, sideLabel, sidePlayers, sideRating } from '../../store/selectors'
import { autoAssignMatches, createMatches, drawGroups, lockGroups, moveMatch, moveToGroup, publishCategories, resetCategoryDraw } from '../../store/scheduleActions'
import { closeEntries } from '../../store/regActions'
import { updateCategory } from '../../store/actions'
import { findConflicts, isConfirmed, summarizeFormat } from '../../lib/tournament'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { Checkbox, FilterChip, Segmented, StatusChip, Tabs, Toggle } from '../../components/ui/Controls'
import { Input, Select } from '../../components/ui/Field'
import { EmptyState } from '../../components/ui/Display'
import { toast, useConfirm } from '../../components/ui/Overlay'
import { CopyButton } from '../../components/ui/Misc'
import { Bracket } from '../../components/data/Bracket'
import { MatchCard, MatchDrawer, StandingsTable } from '../../components/data/MatchBits'
import { PageHeader } from './shared'
import { NotFound } from '../../app/NotFound'
import { fmtDate, fmtDayMonth, fmtTime, plural } from '../../lib/format'
import { PUBLIC_HOST } from '../../lib/brand'
import { celebrate } from '../../lib/celebrate'
import { useReducedMotion } from '../../theme/motion'
import { cn } from '../../lib/cn'
import type { CategoryStage, DemoData, EventCategory, EventItem, Match } from '../../mock/types'

const GroupDraw = lazy(() => import('../../components/3d/scenes/GroupDraw'))

/* ----------------------------------------------------------------- pipeline */

const PIPE: { key: CategoryStage; label: string }[] = [
  { key: 'registrations', label: 'Entries open' },
  { key: 'ready_to_draw', label: 'Ready to draw' },
  { key: 'drawn', label: 'Drawn' },
  { key: 'matches_created', label: 'Matches created' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'published', label: 'Published' },
]
function stageIndex(s: CategoryStage) {
  if (s === 'in_play' || s === 'done') return 5
  return PIPE.findIndex((p) => p.key === s)
}

export function Pipeline({ stage }: { stage: CategoryStage }) {
  const i = stageIndex(stage)
  const pct = (i / (PIPE.length - 1)) * 100
  return (
    <div aria-label={`Stage: ${PIPE[i].label}`}>
      <div className="relative mx-2 h-5">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-s3" />
        <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
        {PIPE.map((p, j) => (
          <span key={p.key} className={cn('absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full', j <= i ? 'bg-brand' : 'bg-s3')} style={{ left: `${(j / (PIPE.length - 1)) * 100}%` }} />
        ))}
        <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-fg transition-[left] duration-250" style={{ left: `${pct}%` }} aria-hidden />
      </div>
      <ol className="mt-1.5 hidden grid-cols-6 text-center md:grid">
        {PIPE.map((p, j) => (
          <li key={p.key} className={cn('text-[11px] font-semibold', j === i ? 'text-fg' : j < i ? 'text-fg3' : 'text-fg4')}>
            {p.label}
          </li>
        ))}
      </ol>
      <p className="mt-1 t-small text-fg2 md:hidden">{stage === 'in_play' ? 'In play' : stage === 'done' ? 'Finished' : PIPE[i].label}</p>
    </div>
  )
}

/* ------------------------------------------------------------ W-04 overview */

export function ScheduleOverviewPage() {
  const ev = useEvent()
  const d = useData()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const cats = categoriesOf(d, ev.id)
  const ready = cats.filter((c) => c.stage === 'scheduled')
  const needsMatches = cats.some((c) => c.stage === 'drawn')
  if (ev.type !== 'tournament' && !cats.some((c) => d.groups.some((g) => g.categoryId === c.id))) {
    return (
      <div>
        <PageHeader title="Schedule" subtitle="Ties are scheduled round by round." />
        <EmptyState icon={CalendarClock} title={ev.modules.includes('ties') ? 'Your season runs on ties' : 'Nothing to schedule yet'} help={ev.modules.includes('ties') ? 'Generate ties, set dates and approve line-ups in Ties and line-ups.' : 'Once teams are set, matches appear here.'} action={ev.modules.includes('ties') ? <ButtonLink to={`/e/${ev.id}/ties`}>Open ties</ButtonLink> : undefined} />
      </div>
    )
  }
  const next = (c: EventCategory): { label: string; run: () => void } | null => {
    switch (c.stage) {
      case 'registrations':
        return {
          label: 'Close entries',
          run: async () => {
            if (await confirm({ title: `Close entries for ${c.label}?`, body: 'Players cannot register in this category any more. You can reopen it later.', confirmLabel: 'Close entries', tone: 'danger' })) {
              closeEntries([c.id])
              toast.success('Entries closed', { body: 'Ready to draw.' })
            }
          },
        }
      case 'ready_to_draw':
        return { label: c.format === 'round_robin' ? 'Make the round robin' : c.format === 'knockout' ? 'Seed the bracket' : 'Draw groups', run: () => navigate(`/e/${ev.id}/schedule/${c.id}/draw`) }
      case 'drawn':
        return {
          label: 'Create matches',
          run: () => {
            createMatches(c.id)
            toast.success(`Matches created for ${c.label}`)
            navigate(`/e/${ev.id}/schedule/${c.id}/matches`)
          },
        }
      case 'matches_created':
        return { label: 'Assign courts', run: () => navigate(`/e/${ev.id}/schedule/courts`) }
      case 'scheduled':
        return { label: 'Publish', run: () => navigate(`/e/${ev.id}/schedule/publish`) }
      default:
        return { label: 'View matches', run: () => navigate(`/e/${ev.id}/schedule/${c.id}/matches`) }
    }
  }
  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle="One checklist per category: draw, create matches, assign courts, publish."
        actions={
          <>
            <ButtonLink to={`/e/${ev.id}/schedule/courts`} variant="secondary" icon={<CalendarClock size={16} />}>
              Courts and times
            </ButtonLink>
            <Button icon={<Send size={16} />} disabled={!ready.length} onClick={() => navigate(`/e/${ev.id}/schedule/publish`)}>
              Publish all ready{ready.length ? ` (${ready.length})` : ''}
            </Button>
          </>
        }
      />
      {needsMatches && (
        <p className="mb-4 flex items-center gap-2 rounded-md bg-info-soft px-4 py-3 t-small text-info">
          <Info size={16} aria-hidden /> Assign courts after matches are created. Create matches on each drawn category first.
        </p>
      )}
      <ul className="grid gap-4 lg:grid-cols-2">
        {cats.map((c) => {
          const n = entryCount(d, ev.id, c.id)
          const groups = d.groups.filter((g) => g.categoryId === c.id).length
          const ms = matchesOf(d, ev.id, c.id)
          const done = ms.filter(isConfirmed).length
          const action = next(c)
          return (
            <li key={c.id} className="card flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 t-title text-fg">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
                    <span className="truncate">{c.label}</span>
                  </p>
                  <p className="t-small text-fg3">
                    {plural(n, c.teamSize === 2 ? 'team' : 'player')}
                    {groups > 0 && c.format === 'groups_knockout' ? ` · ${plural(groups, 'group')}` : ''}
                    {ms.length > 0 ? ` · ${done} of ${ms.length} matches done` : ''}
                  </p>
                </div>
                {c.stage === 'in_play' && <StatusChip tone="live">In play</StatusChip>}
                {c.stage === 'done' && <StatusChip tone="success" icon={<Check size={12} />}>Finished</StatusChip>}
              </div>
              <Pipeline stage={c.stage} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                {ms.length > 0 ? (
                  <Link to={`/e/${ev.id}/schedule/${c.id}/matches`} className="t-small font-semibold text-fg2 hover:text-fg">
                    Groups and bracket
                  </Link>
                ) : (
                  <span />
                )}
                {action && (
                  <Button size="sm" variant={['in_play', 'done', 'published'].includes(c.stage) ? 'secondary' : 'primary'} iconRight={<ArrowRight size={14} />} onClick={action.run}>
                    {action.label}
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function useCat(): { ev: EventItem; cat: EventCategory | undefined; d: DemoData } {
  const ev = useEvent()
  const d = useData()
  const { catId } = useParams()
  return { ev, d, cat: d.categories.find((c) => c.id === catId && c.eventId === ev.id) }
}

/* ---------------------------------------------------------------- W-05 draw */

export function DrawPage() {
  const { ev, d, cat } = useCat()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const reduced = useReducedMotion()
  const [playKey, setPlayKey] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [edited, setEdited] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor))
  if (!cat) return <NotFound />
  const groups = d.groups.filter((g) => g.categoryId === cat.id).sort((a, b) => a.name.localeCompare(b.name))
  const n = entries(d, ev.id, cat.id).length
  const unit = cat.teamSize === 2 ? 'teams' : 'players'
  const sum = summarizeFormat(n, cat.format, cat.groupSize, cat.advancePerGroup, unit, false)
  const published = ['published', 'in_play', 'done', 'scheduled', 'matches_created'].includes(cat.stage)
  const locked = cat.stage !== 'ready_to_draw' && cat.stage !== 'registrations'
  const sizes = groups.map((g) => g.registrationIds.length)
  const uneven = sizes.length > 1 && Math.max(...sizes) - Math.min(...sizes) > 1
  const clubClash = groups.find((g) => {
    const clubs = g.registrationIds.flatMap((r) => sidePlayers(d, r).map((p) => d.players.find((x) => x.id === p)?.club).filter(Boolean))
    return new Set(clubs).size < clubs.length - 1
  })
  const draw = async () => {
    if (published) {
      const ok = await confirm({ title: 'Regenerate a published draw?', body: 'Every match, court time and result in this category is deleted. Players who already saw the schedule are not told automatically.', confirmLabel: 'Delete and redraw', tone: 'danger', typeToConfirm: 'REDRAW' })
      if (!ok) return
      resetCategoryDraw(cat.id)
    } else if (edited && groups.length) {
      const ok = await confirm({ title: 'Draw again?', body: 'Your manual changes to the groups will be replaced.', confirmLabel: 'Draw again', tone: 'danger' })
      if (!ok) return
    }
    drawGroups(cat.id, cat.seeding === 'manual' ? 'dupr' : cat.seeding, Date.now())
    setEdited(cat.seeding === 'manual')
    setPlayKey((k) => k + 1)
    if (!reduced) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 3000)
    }
  }
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || locked) return
    moveToGroup(cat.id, String(e.active.id), String(e.over.id))
    setEdited(true)
  }
  return (
    <div>
      <PageHeader overline={cat.label} title={cat.format === 'knockout' ? 'Seed the bracket' : cat.format === 'round_robin' ? 'Round robin' : 'Draw groups'} subtitle={sum.sentence} />
      {cat.stage === 'registrations' && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md bg-warning-soft px-4 py-3 text-warning">
          <Hourglass size={18} aria-hidden />
          <span className="flex-1 t-small font-semibold">Entries are still open. Draw once entries close or the category is full.</span>
          <Button size="sm" variant="secondary" onClick={() => { closeEntries([cat.id]); toast.success('Entries closed') }}>
            Close entries for this category
          </Button>
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardHeader title="Settings" />
          <div className="flex flex-col gap-4">
            {cat.format === 'groups_knockout' && (
              <div className="grid grid-cols-2 gap-3">
                <Select label="Group size" disabled={locked} value={String(cat.groupSize)} onChange={(e) => updateCat(cat.id, { groupSize: Number(e.target.value) })} options={[3, 4, 5, 6].map((x) => ({ value: String(x), label: `Groups of ${x}` }))} />
                <Select label="Advance" disabled={locked} value={String(cat.advancePerGroup)} onChange={(e) => updateCat(cat.id, { advancePerGroup: Number(e.target.value) })} options={[1, 2, 4].map((x) => ({ value: String(x), label: `Top ${x}` }))} />
              </div>
            )}
            <div>
              <p className="mb-2 t-small text-fg2">Seeding</p>
              <Segmented label="Seeding" block value={cat.seeding} onChange={(v) => updateCat(cat.id, { seeding: v })} options={[{ value: 'dupr', label: 'DUPR rating' }, { value: 'random', label: 'Random' }, { value: 'manual', label: 'Manual' }]} />
              <p className="mt-2 t-small text-fg3">{cat.seeding === 'dupr' ? 'Best teams spread across groups (snake order).' : cat.seeding === 'random' ? 'Pure luck of the draw.' : 'We start from ratings, you drag teams where you want.'}</p>
            </div>
            <p className="rounded-md border border-brand/40 bg-brand-soft px-3 py-2.5 text-[14px] font-semibold text-fg">{sum.sentence}</p>
            <Button size="lg" icon={groups.length ? <RefreshCw size={16} /> : <Shuffle size={16} />} disabled={n < 2 || cat.stage === 'registrations'} onClick={draw} variant={groups.length ? 'secondary' : 'primary'}>
              {groups.length ? 'Draw again' : 'Draw groups'}
            </Button>
            {groups.length > 0 && !locked && (
              <Button
                size="lg"
                icon={<Lock size={16} />}
                disabled={uneven}
                onClick={() => {
                  lockGroups(cat.id)
                  toast.success('Groups locked', { body: 'Next: create matches.' })
                }}
              >
                Lock groups
              </Button>
            )}
            {locked && cat.stage === 'drawn' && (
              <Button
                size="lg"
                iconRight={<ArrowRight size={16} />}
                onClick={() => {
                  createMatches(cat.id)
                  toast.success('Matches created', { body: `${plural(sum.groupMatches, 'group match', 'group matches')} and the knockout bracket.` })
                  navigate(`/e/${ev.id}/schedule/${cat.id}/matches`)
                }}
              >
                Create matches
              </Button>
            )}
            {locked && cat.stage !== 'drawn' && (
              <ButtonLink to={`/e/${ev.id}/schedule/${cat.id}/matches`} variant="secondary" iconRight={<ArrowRight size={16} />}>
                View matches
              </ButtonLink>
            )}
          </div>
        </Card>
        <div className="min-w-0">
          {animating && (
            <div className="relative mb-4 h-[300px] overflow-hidden rounded-lg border border-line-subtle bg-canvas">
              <Suspense fallback={null}>
                <GroupDraw className="absolute inset-0" groups={groups.map((g) => ({ name: g.name, count: g.registrationIds.length }))} playKey={playKey} />
              </Suspense>
            </div>
          )}
          {groups.length === 0 ? (
            <EmptyState icon={Sparkles} title="Ready when you are" help={`${plural(n, unit === 'teams' ? 'team' : 'player')} waiting. Choose seeding, then draw.`} compact />
          ) : (
            <>
              {uneven && (
                <p className="mb-3 flex items-center gap-2 rounded-md bg-warning-soft px-3 py-2 t-small text-warning" role="alert">
                  <CircleAlert size={14} aria-hidden /> Group sizes differ by more than one. Move a team to even them out before locking.
                </p>
              )}
              {clubClash && !uneven && (
                <p className="mb-3 flex items-center gap-2 rounded-md bg-info-soft px-3 py-2 t-small text-info">
                  <Info size={14} aria-hidden /> Group {clubClash.name} has several teams from the same club. Fine to keep; you may want to swap one.
                </p>
              )}
              {!locked && <p className="mb-3 t-small text-fg3">Drag teams between groups. Changes save as you go.</p>}
              <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                <div className={cn('grid gap-3', groups.length > 1 ? 'sm:grid-cols-2 2xl:grid-cols-4' : '')}>
                  {groups.map((g, gi) => (
                    <GroupColumn key={g.id} id={g.name} title={cat.format === 'groups_knockout' ? `Group ${g.name}` : cat.format === 'knockout' ? 'Seed order' : 'All play all'} count={g.registrationIds.length} delay={animating ? 2.2 + gi * 0.08 : 0}>
                      {g.registrationIds.map((rid, i) => (
                        <TeamToken key={rid} id={rid} disabled={locked} label={sideLabel(d, rid, true)} seed={d.registrations.find((r) => r.id === rid)?.seed} rating={sideRating(d, rid)} delay={animating ? 0.3 + (i * groups.length + gi) * (2 / Math.max(1, n)) : 0} />
                      ))}
                    </GroupColumn>
                  ))}
                </div>
              </DndContext>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function updateCat(id: string, patch: Partial<EventCategory>) {
  updateCategory(id, (c) => Object.assign(c, patch))
}

function GroupColumn({ id, title, count, children, delay }: { id: string; title: string; count: number; children: React.ReactNode; delay: number }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <motion.section ref={setNodeRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={cn('card flex flex-col gap-2 p-3 transition-colors', isOver && 'border-brand shadow-[0_0_0_1px_var(--brand)]')} aria-label={title}>
      <div className="flex items-center justify-between px-1">
        <h3 className="t-title text-fg">{title}</h3>
        <span className="t-small text-fg3 tnum">{count}</span>
      </div>
      <ul className="flex min-h-12 flex-col gap-1.5">{children}</ul>
    </motion.section>
  )
}

function TeamToken({ id, label, seed, rating, disabled, delay }: { id: string; label: string; seed?: number; rating?: number; disabled: boolean; delay: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled })
  return (
    <motion.li initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px) rotate(2deg)` : undefined }}
        className={cn('flex items-center gap-2 rounded-md border border-line-subtle bg-s2 px-2.5 py-2', !disabled && 'cursor-grab hover:border-line-strong', isDragging && 'relative z-20 border-brand shadow-float')}
        aria-label={`${label}${seed ? `, seed ${seed}` : ''}`}
      >
        {seed && <span className="flex h-6 w-7 shrink-0 items-center justify-center rounded-[6px] bg-brand-soft text-[11px] font-bold text-brand-text tnum">{seed}</span>}
        <span className="min-w-0 flex-1 truncate text-[14px] text-fg">{label}</span>
        {rating && <span className="t-small text-fg3 tnum">{rating.toFixed(2)}</span>}
      </div>
    </motion.li>
  )
}

/* ----------------------------------------------------------- W-06 matches */

export function MatchesPage() {
  const { ev, d, cat } = useCat()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'groups' | 'bracket' | 'list'>('groups')
  const [open, setOpen] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'done'>('all')
  if (!cat) return <NotFound />
  const ms = matchesOf(d, ev.id, cat.id)
  const groups = d.groups.filter((g) => g.categoryId === cat.id).sort((a, b) => a.name.localeCompare(b.name))
  const hasKo = ms.some((m) => m.stage !== 'group')
  const tabValue = cat.format === 'knockout' && tab === 'groups' ? 'bracket' : tab
  return (
    <div>
      <PageHeader
        overline={cat.label}
        title="Matches and bracket"
        subtitle={ms.length ? `${ms.filter(isConfirmed).length} of ${ms.length} matches done` : 'No matches yet.'}
        actions={
          ms.length === 0 ? (
            cat.stage === 'drawn' ? (
              <Button onClick={() => { createMatches(cat.id); toast.success('Matches created') }}>Create matches</Button>
            ) : (
              <ButtonLink to={`/e/${ev.id}/schedule/${cat.id}/draw`}>Go to the draw</ButtonLink>
            )
          ) : (
            <ButtonLink to={`/e/${ev.id}/schedule/${cat.id}/draw`} variant="secondary">
              Groups and seeding
            </ButtonLink>
          )
        }
      />
      {ms.length === 0 ? (
        <EmptyState icon={Shuffle} title={cat.stage === 'drawn' ? 'Groups are locked' : 'Draw first'} help={cat.stage === 'drawn' ? 'Create matches to make every group match and the knockout bracket.' : 'Matches appear once groups are drawn and locked.'} action={cat.stage === 'drawn' ? <Button onClick={() => { createMatches(cat.id); toast.success('Matches created') }}>Create matches</Button> : <Button onClick={() => navigate(`/e/${ev.id}/schedule/${cat.id}/draw`)}>Go to the draw</Button>} />
      ) : (
        <>
          <Tabs className="mb-5" value={tabValue} onChange={setTab} tabs={[{ value: 'groups', label: cat.format === 'round_robin' ? 'Round robin' : 'Groups', hidden: cat.format === 'knockout' }, { value: 'bracket', label: 'Bracket', hidden: !hasKo }, { value: 'list', label: 'List', count: ms.length }]} />
          {tabValue === 'groups' && (
            <div className="flex flex-col gap-6">
              {groups.map((g) => {
                const gm = ms.filter((m) => m.groupId === g.id)
                return (
                  <section key={g.id} className="grid gap-4 xl:grid-cols-[1fr_420px]" aria-label={`Group ${g.name}`}>
                    <div>
                      <h2 className="mb-3 t-h3 text-fg">{cat.format === 'round_robin' ? 'All matches' : `Group ${g.name}`}</h2>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {gm.map((m) => (
                          <MatchCard key={m.id} d={d} m={m} onOpen={(x) => setOpen(x.id)} />
                        ))}
                      </div>
                    </div>
                    <Card className="h-fit">
                      <CardHeader title="Standings" subtitle={cat.format === 'groups_knockout' ? `Top ${cat.advancePerGroup} go through (Q)` : 'Most wins takes it'} />
                      <StandingsTable d={d} group={g} cat={cat} />
                    </Card>
                  </section>
                )
              })}
            </div>
          )}
          {tabValue === 'bracket' && (
            <Card className="p-0">
              <Bracket d={d} cat={cat} onOpen={(m) => setOpen(m.id)} />
            </Card>
          )}
          {tabValue === 'list' && (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {(['all', 'live', 'upcoming', 'done'] as const).map((f) => (
                  <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>
                    {f[0].toUpperCase() + f.slice(1)}
                  </FilterChip>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {ms
                  .filter((m) => filter === 'all' || (filter === 'live' ? m.status === 'live' : filter === 'done' ? isConfirmed(m) : !isConfirmed(m) && m.status !== 'live'))
                  .sort((a, b) => (a.scheduledAt ?? '9').localeCompare(b.scheduledAt ?? '9'))
                  .map((m) => (
                    <MatchCard key={m.id} d={d} m={m} onOpen={(x) => setOpen(x.id)} />
                  ))}
              </div>
            </>
          )}
        </>
      )}
      <MatchDrawer matchId={open} onClose={() => setOpen(null)} />
    </div>
  )
}

/* ---------------------------------------------------------- W-07 courts */

const PX_PER_MIN = 3.2

function eventDays(ev: EventItem): string[] {
  const out: string[] = []
  const s = Date.parse(ev.startDate.slice(0, 10) + 'T00:00:00+05:30')
  const e = Date.parse(ev.endDate.slice(0, 10) + 'T00:00:00+05:30')
  for (let t = s; t <= e && out.length < 7; t += 86400000) out.push(new Date(t + 6 * 3600000).toISOString().slice(0, 10))
  return out
}

export function CourtsTimesPage() {
  const ev = useEvent()
  const d = useData()
  const days = eventDays(ev)
  const [day, setDay] = useState(days[Math.min(days.length - 1, d.now > Date.parse(days[days.length - 1]) ? days.length - 1 : 0)])
  const [opts, setOpts] = useState({ lengthMin: ev.settings.matchLengthMin, restMin: ev.settings.restMin, dayStart: ev.settings.dayStart, dayEnd: ev.settings.dayEnd, breakStart: '13:00', breakEnd: '13:45', useBreak: true })
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const cats = categoriesOf(d, ev.id)
  const all = matchesOf(d, ev.id).filter((m) => m.stage !== 'league')
  const dayStartMs = Date.parse(`${day}T${opts.dayStart}:00+05:30`)
  const dayEndMs = Date.parse(`${day}T${opts.dayEnd}:00+05:30`)
  const totalMin = Math.max(60, (dayEndMs - dayStartMs) / 60000)
  const onDay = all.filter((m) => m.scheduledAt && m.court && m.scheduledAt.slice(0, 10) === new Date(Date.parse(`${day}T12:00:00+05:30`)).toISOString().slice(0, 10) && Date.parse(m.scheduledAt) >= dayStartMs - 3600000 * 6 && Date.parse(m.scheduledAt) < dayEndMs + 3600000 * 6)
  const unassigned = all.filter((m) => !m.scheduledAt && !isConfirmed(m))
  const conflicts = useMemo(() => findConflicts(all.filter((m) => !isConfirmed(m)), (id) => sidePlayers(d, id), ev.settings.matchLengthMin, ev.settings.restMin), [all, d, ev.settings.matchLengthMin, ev.settings.restMin])
  const conflictOf = (id: string) => conflicts.find((c) => c.matchId === id)?.reason
  const targets = cats.filter((c) => ['matches_created', 'scheduled', 'published', 'in_play'].includes(c.stage))
  const run = async () => {
    setBusy(true)
    await new Promise((r) => setTimeout(r, 600))
    const res = autoAssignMatches(ev.id, targets.map((c) => c.id), { ...opts, day, breakStart: opts.useBreak ? opts.breakStart : undefined, breakEnd: opts.useBreak ? opts.breakEnd : undefined })
    setBusy(false)
    toast.success(`${res.assigned} matches placed`, { body: res.unassigned ? `${res.unassigned} did not fit. They wait in the tray.` : 'No double-bookings, rest time respected.' })
  }
  const onDragEnd = (e: DragEndEvent) => {
    const over = e.over?.id ? String(e.over.id) : null
    const m = all.find((x) => x.id === e.active.id)
    if (!m) return
    if (over === 'tray') {
      moveMatch(m.id, undefined, undefined)
      return
    }
    if (!over?.startsWith('court-')) return
    const court = Number(over.slice(6))
    const rect = e.active.rect.current.translated
    const row = e.over!.rect
    if (!rect) return
    const min = Math.max(0, Math.round((rect.left - row.left) / PX_PER_MIN / 5) * 5)
    moveMatch(m.id, court, new Date(dayStartMs + min * 60000).toISOString())
  }
  return (
    <div>
      <PageHeader title="Courts and times" subtitle="Auto-assign, then drag to adjust. Conflicts are outlined in red with the reason." />
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader title="Auto-assign" subtitle={targets.length ? `${plural(targets.length, 'category', 'categories')} with matches` : 'Create matches first'} />
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Match length" suffix="min" inputMode="numeric" value={opts.lengthMin} onChange={(e) => setOpts({ ...opts, lengthMin: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
              <Input label="Rest between" suffix="min" inputMode="numeric" value={opts.restMin} onChange={(e) => setOpts({ ...opts, restMin: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
              <Input label="Day starts" type="time" value={opts.dayStart} onChange={(e) => setOpts({ ...opts, dayStart: e.target.value })} />
              <Input label="Day ends" type="time" value={opts.dayEnd} onChange={(e) => setOpts({ ...opts, dayEnd: e.target.value })} />
            </div>
            <Checkbox checked={opts.useBreak} onChange={(v) => setOpts({ ...opts, useBreak: v })} label="Lunch break" />
            {opts.useBreak && (
              <div className="grid grid-cols-2 gap-3">
                <Input aria-label="Break starts" type="time" value={opts.breakStart} onChange={(e) => setOpts({ ...opts, breakStart: e.target.value })} />
                <Input aria-label="Break ends" type="time" value={opts.breakEnd} onChange={(e) => setOpts({ ...opts, breakEnd: e.target.value })} />
              </div>
            )}
            <Button icon={<Wand2 size={16} />} loading={busy} disabled={!targets.length} onClick={run}>
              Auto-assign from {fmtDayMonth(`${day}T12:00:00+05:30`)}
            </Button>
            <p className="t-small text-fg3">Never double-books a player and keeps their rest time. Played matches stay where they are.</p>
          </div>
        </Card>
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Segmented label="Day" value={day} onChange={setDay} options={days.map((x, i) => ({ value: x, label: `Day ${i + 1}, ${fmtDate(`${x}T12:00:00+05:30`)}` }))} />
            {conflicts.length > 0 && (
              <StatusChip tone="danger" icon={<CircleAlert size={12} />}>
                {plural(conflicts.length, 'conflict')}
              </StatusChip>
            )}
          </div>
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <div className="card overflow-x-auto p-0">
              <div style={{ width: totalMin * PX_PER_MIN + 96 }}>
                <div className="sticky top-0 flex border-b border-line-subtle bg-s1 pl-24">
                  {Array.from({ length: Math.ceil(totalMin / 60) }, (_, h) => (
                    <div key={h} className="shrink-0 border-l border-line-subtle px-1 py-2 t-small text-fg3 tnum" style={{ width: 60 * PX_PER_MIN }}>
                      {fmtTime(dayStartMs + h * 3600000)}
                    </div>
                  ))}
                </div>
                {Array.from({ length: ev.courts }, (_, i) => i + 1).map((c) => (
                  <CourtRow key={c} court={c}>
                    {onDay
                      .filter((m) => m.court === c)
                      .map((m) => {
                        const left = ((Date.parse(m.scheduledAt!) - dayStartMs) / 60000) * PX_PER_MIN
                        return <Block key={m.id} m={m} d={d} left={left} width={ev.settings.matchLengthMin * PX_PER_MIN - 3} color={cats.find((x) => x.id === m.categoryId)?.color ?? 'var(--cat-1)'} conflict={conflictOf(m.id)} onOpen={() => setOpen(m.id)} />
                      })}
                  </CourtRow>
                ))}
              </div>
            </div>
            <Tray>
              {unassigned.slice(0, 40).map((m) => (
                <Block key={m.id} m={m} d={d} width={150} color={cats.find((x) => x.id === m.categoryId)?.color ?? 'var(--cat-1)'} onOpen={() => setOpen(m.id)} inTray />
              ))}
              {unassigned.length > 40 && <span className="self-center t-small text-fg3">+{unassigned.length - 40} more</span>}
            </Tray>
          </DndContext>
        </div>
      </div>
      <MatchDrawer matchId={open} onClose={() => setOpen(null)} />
    </div>
  )
}

function CourtRow({ court, children }: { court: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `court-${court}` })
  return (
    <div className="flex border-b border-line-subtle last:border-0">
      <div className="sticky left-0 z-10 flex w-24 shrink-0 items-center border-r border-line-subtle bg-s1 px-3 font-semibold text-fg">Court {court}</div>
      <div ref={setNodeRef} className={cn('relative h-[64px] flex-1 bg-courtlines transition-colors', isOver && 'bg-brand-soft')} aria-label={`Court ${court} timeline`}>
        {children}
      </div>
    </div>
  )
}

function Tray({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'tray' })
  return (
    <section ref={setNodeRef} className={cn('card mt-4 p-4', isOver && 'border-brand')} aria-label="Unassigned matches">
      <h3 className="mb-2 t-title text-fg">Unassigned</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
      <p className="mt-2 t-small text-fg3">Drag a match onto a court at the time you want. Drag one here to take it off the timeline.</p>
    </section>
  )
}

function Block({ m, d, left, width, color, conflict, onOpen, inTray }: { m: Match; d: DemoData; left?: number; width: number; color: string; conflict?: string; onOpen: () => void; inTray?: boolean }) {
  const done = isConfirmed(m)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: m.id, disabled: done || m.status === 'live' })
  const body = (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onDoubleClick={onOpen}
      title={conflict ? `Conflict: ${conflict}` : 'Drag to move. Double-click for details.'}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={cn(
        'overflow-hidden rounded-md border px-2 py-1 text-[11px] leading-tight',
        inTray ? 'relative' : 'absolute top-1.5 bottom-1.5',
        done ? 'border-transparent opacity-55' : 'cursor-grab border-line-strong',
        conflict && 'border-danger shadow-[0_0_0_1px_var(--danger)]',
        m.status === 'live' && 'border-live',
        isDragging && 'z-30 shadow-float',
      )}
      style={{ left, width, background: `color-mix(in oklab, ${color} 28%, var(--surface-2))`, transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined, height: inTray ? 52 : undefined }}
      aria-label={`${matchTitle(d, m)}: ${sideLabel(d, m.sideA, true)} vs ${sideLabel(d, m.sideB, true)}${conflict ? `. Conflict: ${conflict}` : ''}`}
    >
      <p className="truncate font-semibold text-fg">{sideLabel(d, m.sideA, true)}</p>
      <p className="truncate text-fg2">{sideLabel(d, m.sideB, true)}</p>
      {conflict && <p className="truncate font-semibold text-danger">{conflict}</p>}
    </div>
  )
  return body
}

/* ----------------------------------------------------------- W-08 publish */

export function PublishPage() {
  const ev = useEvent()
  const d = useData()
  const confirm = useConfirm()
  const cats = categoriesOf(d, ev.id)
  const ready = cats.filter((c) => c.stage === 'scheduled')
  const live = cats.filter((c) => ['published', 'in_play', 'done'].includes(c.stage))
  const [picked, setPicked] = useState<Set<string>>(new Set(ready.map((c) => c.id)))
  const [notify, setNotify] = useState({ whatsapp: true, email: true })
  const [done, setDone] = useState(false)
  useEffect(() => {
    setPicked(new Set(ready.map((c) => c.id)))
  }, [ready.length])
  const preview = matchesOf(d, ev.id)
    .filter((m) => picked.has(m.categoryId) || live.some((c) => c.id === m.categoryId))
    .filter((m) => m.scheduledAt)
    .sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!))
    .slice(0, 8)
  const publish = async () => {
    const ok = await confirm({ title: `Publish ${plural(picked.size, 'category', 'categories')}?`, body: `Players see their matches on your event page${notify.whatsapp || notify.email ? ` and get a ${[notify.whatsapp && 'WhatsApp', notify.email && 'email'].filter(Boolean).join(' and ')}` : ''}. Changing a published draw later needs a stronger confirmation.`, confirmLabel: 'Publish schedule' })
    if (!ok) return
    publishCategories(ev.id, [...picked], notify)
    celebrate({ count: 90 })
    setDone(true)
  }
  if (done)
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
          <Check size={32} strokeWidth={3} />
        </span>
        <h1 className="t-h1 text-fg">Schedule published</h1>
        <p className="text-fg2">Players can see their matches now{notify.whatsapp ? ' and the WhatsApp messages are on their way' : ''}.</p>
        <CopyButton variant="primary" label="Copy schedule link" text={`https://${PUBLIC_HOST}${ev.slug}/live`} />
        <ButtonLink to={`/e/${ev.id}/schedule`} variant="ghost">
          Back to schedule
        </ButtonLink>
      </div>
    )
  return (
    <div>
      <PageHeader title="Publish the schedule" subtitle="Check what goes out, then tell players." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Ready to publish" subtitle={ready.length ? 'Courts and times are set for these categories.' : 'Nothing is ready yet. Assign courts and times first.'} />
            <ul className="flex flex-col gap-2">
              {ready.map((c) => (
                <li key={c.id}>
                  <Checkbox checked={picked.has(c.id)} onChange={(v) => setPicked((s) => { const n = new Set(s); if (v) n.add(c.id); else n.delete(c.id); return n })} label={c.label} description={`${matchesOf(d, ev.id, c.id).filter((m) => m.scheduledAt).length} matches with courts and times`} />
                </li>
              ))}
              {live.map((c) => (
                <li key={c.id} className="flex items-center gap-3 text-fg3">
                  <Check size={18} className="text-success" aria-hidden /> {c.label} <span className="t-small">already published</span>
                </li>
              ))}
              {!ready.length && (
                <li>
                  <ButtonLink to={`/e/${ev.id}/schedule/courts`} variant="secondary">
                    Go to courts and times
                  </ButtonLink>
                </li>
              )}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Tell players" icon={<Megaphone size={18} className="mt-1 text-fg3" aria-hidden />} />
            <div className="flex flex-col gap-4">
              <Toggle checked={notify.whatsapp} onChange={(v) => setNotify({ ...notify, whatsapp: v })} label="WhatsApp" description="Each player gets their first match time and court." />
              <Toggle checked={notify.email} onChange={(v) => setNotify({ ...notify, email: v })} label="Email" />
              {(notify.whatsapp || notify.email) && (
                <div className="rounded-lg bg-s2 p-4">
                  <div className="ml-auto max-w-[90%] rounded-lg rounded-tr-sm bg-success-soft p-3 text-[14px] text-fg">
                    Hi Arjun, your {ev.name} schedule is out. First match: <strong>9:20 am on Court 2</strong>. Full schedule: {PUBLIC_HOST}
                    {ev.slug}/live
                  </div>
                </div>
              )}
            </div>
          </Card>
          <div>
            <Button size="lg" icon={<Send size={18} />} disabled={!picked.size} onClick={publish}>
              Publish {picked.size ? plural(picked.size, 'category', 'categories') : ''}
            </Button>
          </div>
        </div>
        <div className="mx-auto w-[260px]">
          <p className="mb-2 text-center t-overline text-fg3">What players see</p>
          <div className="h-[520px] overflow-hidden rounded-[34px] border-[7px] border-s3 bg-canvas p-3 pt-6">
            <p className="text-[13px] font-bold text-fg">Schedule</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {preview.map((m) => (
                <li key={m.id} className="rounded-md bg-s1 p-2 text-[11px]">
                  <p className="flex justify-between text-fg3">
                    <span>{fmtTime(m.scheduledAt!)}</span>
                    <span>Court {m.court}</span>
                  </p>
                  <p className="truncate text-fg">{sideLabel(d, m.sideA, true)}</p>
                  <p className="truncate text-fg2">vs {sideLabel(d, m.sideB, true)}</p>
                </li>
              ))}
              {!preview.length && <li className="text-[12px] text-fg3">Matches appear here once courts and times are set.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
