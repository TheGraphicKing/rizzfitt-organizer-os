import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { DndContext, PointerSensor, KeyboardSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays, Check, CircleCheck, Crown, GripVertical, History, Hourglass, Layers, Lock, LockOpen, Mail, MessageCircle, Send, Shuffle, Swords, Timer, TriangleAlert, Users } from 'lucide-react'
import { useData, useEvent } from '../../store/hooks'
import { leagueTable, playerName, shortName } from '../../store/selectors'
import { approveLineup, autoBalance, generateTies, makePick, movePlayerToTeam, participantLink, participantPaid, resolveTieBreaker, setCaptain, startDraft, swapKnockout, toggleLock } from '../../store/leagueActions'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { FilterChip, StatusChip, Tabs } from '../../components/ui/Controls'
import { EmptyState, ProgressBar, TeamCrest, StatTile } from '../../components/ui/Display'
import { Drawer, toast, useConfirm } from '../../components/ui/Overlay'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from './shared'
import { fmtDate, fmtDateTime, inr, maskPhone, plural } from '../../lib/format'
import { cn } from '../../lib/cn'
import { useReducedMotion } from '../../theme/motion'
import type { DemoData, LeagueTeam, LineupState, Participant, Tie } from '../../mock/types'

/* ------------------------------------------------------------ L-01 builder */

export function TeamBuilderPage() {
  const ev = useEvent()
  const d = useData()
  const confirm = useConfirm()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor))
  const teams = d.leagueTeams.filter((t) => t.eventId === ev.id)
  const all = [...new Set(d.registrations.filter((r) => r.eventId === ev.id && (r.status === 'paid' || r.status === 'pending')).flatMap((r) => r.playerIds))]
  const inTeam = new Set(teams.flatMap((t) => t.playerIds))
  const [skill, setSkill] = useState<string | null>(null)
  const [gender, setGender] = useState<'M' | 'F' | null>(null)
  const pool = all.filter((p) => !inTeam.has(p)).map((id) => d.players.find((x) => x.id === id)!).filter((p) => p && (!skill || p.skill === skill) && (!gender || p.gender === gender))
  const size = ev.league?.playersPerTeam ?? 6
  const avgAll = all.reduce((s, id) => s + (d.players.find((p) => p.id === id)?.duprRating ?? 3.2), 0) / Math.max(1, all.length)
  const tiesStarted = d.ties.some((t) => t.eventId === ev.id && t.status === 'done')
  const onEnd = (e: DragEndEvent) => {
    if (!e.over) return
    const to = String(e.over.id)
    movePlayerToTeam(ev.id, String(e.active.id), to === 'pool' ? null : to)
  }
  if (!teams.length) return <div><PageHeader title="Team builder" /><EmptyState icon={Users} title="No teams yet" help="Finish setup to create your teams." /></div>
  return (
    <div>
      <PageHeader
        title="Team builder"
        subtitle={ev.type === 'auction' ? 'Squads from the auction. Adjust before the season starts.' : ev.type === 'draft' ? 'Squads from draft night.' : `${plural(all.length, 'player')} into ${plural(teams.length, 'team')} of ${size}.`}
        actions={
          <>
            <Button variant="secondary" icon={<Shuffle size={16} />} onClick={() => { autoBalance(ev.id, pool.map((p) => p.id)); toast.success('Teams balanced by rating', { body: 'Locked players stayed put.' }) }}>Auto-balance</Button>
            <Button
              icon={<Check size={16} />}
              onClick={async () => {
                const bad = teams.filter((t) => t.playerIds.length !== size)
                if (tiesStarted && !(await confirm({ title: 'Save squads mid-season?', body: 'Ties have already been played. Changes apply from the next round. Captains are told on WhatsApp.', confirmLabel: 'Save squads', tone: 'danger' }))) return
                toast[bad.length ? 'warning' : 'success'](bad.length ? `${plural(bad.length, 'team')} not at ${size} players` : 'Squads saved', bad.length ? { body: 'Saved anyway. Fix them before round 1.' } : { body: 'Captains get their squad on WhatsApp.' })
              }}
            >
              Save squads
            </Button>
          </>
        }
      />
      <DndContext sensors={sensors} onDragEnd={onEnd}>
        <LayoutGroup>
          <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
            <Pool>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {['beginner', 'intermediate', 'advanced', 'open'].map((s) => <FilterChip key={s} active={skill === s} onClick={() => setSkill(skill === s ? null : s)}>{s[0].toUpperCase() + s.slice(1)}</FilterChip>)}
                <FilterChip active={gender === 'M'} onClick={() => setGender(gender === 'M' ? null : 'M')}>Men</FilterChip>
                <FilterChip active={gender === 'F'} onClick={() => setGender(gender === 'F' ? null : 'F')}>Women</FilterChip>
              </div>
              <ul className="flex flex-col gap-1.5">
                {pool.map((p) => <PlayerChip key={p.id} id={p.id} name={playerName(p)} rating={p.duprRating} gender={p.gender} />)}
                {!pool.length && <li className="t-small text-fg3">Everyone is in a team.</li>}
              </ul>
            </Pool>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {teams.map((t) => <TeamColumn key={t.id} d={d} t={t} size={size} avgAll={avgAll} />)}
            </div>
          </div>
        </LayoutGroup>
      </DndContext>
    </div>
  )
}

function Pool({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })
  return (
    <section ref={setNodeRef} className={cn('card h-fit p-4 xl:sticky xl:top-24', isOver && 'border-brand')} aria-label="Player pool">
      <h2 className="mb-2 t-title text-fg">Player pool</h2>
      {children}
    </section>
  )
}

function PlayerChip({ id, name, rating, gender, captain, locked, onLock, onCaptain }: { id: string; name: string; rating?: number; gender: 'M' | 'F'; captain?: boolean; locked?: boolean; onLock?: () => void; onCaptain?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled: locked })
  return (
    <motion.li layout layoutId={id} className="list-none">
      <div ref={setNodeRef} style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px) rotate(2deg)` : undefined }} className={cn('flex items-center gap-2 rounded-md border border-line-subtle bg-s2 px-2 py-1.5', !locked && 'cursor-grab', isDragging && 'relative z-30 border-brand shadow-float', locked && 'border-dashed')}>
        <span {...attributes} {...listeners} className="flex min-w-0 flex-1 items-center gap-2" aria-label={`${name}${locked ? ', locked' : ''}`}>
          <span className={cn('h-2 w-2 shrink-0 rounded-full', gender === 'F' ? 'bg-cat-5' : 'bg-cat-2')} aria-hidden />
          <span className="truncate text-[13px] text-fg">{name}</span>
        </span>
        {rating && <span className="text-[12px] text-fg3 tnum">{rating.toFixed(2)}</span>}
        {onCaptain && <button type="button" aria-label={captain ? 'Captain' : `Make ${name} captain`} onClick={onCaptain} className={cn('flex h-7 w-7 items-center justify-center rounded-sm', captain ? 'text-warning' : 'text-fg4 hover:text-fg2')}><Crown size={14} /></button>}
        {onLock && <button type="button" aria-label={locked ? `Unlock ${name}` : `Lock ${name}`} onClick={onLock} className="flex h-7 w-7 items-center justify-center rounded-sm text-fg3 hover:text-fg">{locked ? <Lock size={14} /> : <LockOpen size={14} />}</button>}
      </div>
    </motion.li>
  )
}

function TeamColumn({ d, t, size, avgAll }: { d: DemoData; t: LeagueTeam; size: number; avgAll: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: t.id })
  const ps = t.playerIds.map((id) => d.players.find((p) => p.id === id)!).filter(Boolean)
  const avg = ps.reduce((s, p) => s + (p.duprRating ?? 3.2), 0) / Math.max(1, ps.length)
  const women = ps.filter((p) => p.gender === 'F').length
  const ok = ps.length === size
  return (
    <section ref={setNodeRef} className={cn('card flex flex-col gap-3 p-4', isOver && 'border-brand shadow-[0_0_0_1px_var(--brand)]')} aria-label={t.name}>
      <div className="flex items-center gap-3">
        <TeamCrest name={t.name} color={t.color} short={t.short} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-fg">{t.name}</p>
          <p className={cn('t-small', ok ? 'text-fg3' : 'text-warning')}>{ps.length} of {size}{!ok && (ps.length > size ? ', too many' : ', needs more')}</p>
        </div>
      </div>
      <div>
        <div className="mb-1 flex justify-between t-small text-fg3"><span>Avg rating {ps.length ? avg.toFixed(2) : '-'}</span><span>{women} women</span></div>
        <ProgressBar value={ps.length ? avg : 0} max={5.5} markers={[avgAll]} color={Math.abs(avg - avgAll) < 0.15 ? 'var(--success)' : 'var(--warning)'} />
      </div>
      <ul className="flex min-h-16 flex-col gap-1.5">
        <AnimatePresence>
          {ps.map((p) => <PlayerChip key={p.id} id={p.id} name={shortName(p)} rating={p.duprRating} gender={p.gender} captain={t.captainId === p.id} locked={t.locked.includes(p.id)} onLock={() => toggleLock(t.id, p.id)} onCaptain={() => setCaptain(t.id, p.id)} />)}
        </AnimatePresence>
      </ul>
    </section>
  )
}

/* ------------------------------------------------------------ L-02 ties */

const LINEUP: Record<LineupState, { label: string; tone: 'success' | 'warning' | 'neutral' | 'danger' }> = {
  approved: { label: 'Approved', tone: 'success' },
  submitted: { label: 'Waiting for you', tone: 'warning' },
  pending: { label: 'Not submitted', tone: 'neutral' },
  changes_requested: { label: 'Changes asked', tone: 'danger' },
}

export function TiesPage() {
  const ev = useEvent()
  const d = useData()
  const confirm = useConfirm()
  const ties = d.ties.filter((t) => t.eventId === ev.id)
  const teams = d.leagueTeams.filter((t) => t.eventId === ev.id)
  const rounds = [...new Set(ties.map((t) => t.round))].sort((a, b) => a - b)
  const nextRound = ties.find((t) => t.status !== 'done')?.round ?? rounds[0] ?? 1
  const [round, setRound] = useState(nextRound)
  const [tab, setTab] = useState<'ties' | 'table' | 'knockout'>('ties')
  const [open, setOpen] = useState<{ tie: Tie; side: 'a' | 'b' } | null>(null)
  const waiting = ties.flatMap((t) => (['a', 'b'] as const).filter((s) => t.lineupStatus[s] === 'submitted').map((s) => ({ tie: t, side: s })))
  const team = (id: string) => teams.find((t) => t.id === id)!
  const n = teams.length
  const perTie = ev.league?.matchTypes.reduce((s, m) => s + m.count, 0) ?? 4
  const totalRounds = n % 2 === 0 ? n - 1 : n
  const level = ties.filter((t) => t.result && t.result.a === t.result.b)
  return (
    <div>
      <PageHeader title="Ties and line-ups" subtitle={`${n} teams play ${totalRounds} rounds, ${Math.floor(n / 2)} ties per round, ${(n * (n - 1)) / 2} ties in total. Each tie has ${perTie} matches.`} actions={<Button variant="secondary" icon={<Layers size={16} />} disabled={ties.some((t) => t.status === 'done')} onClick={async () => { if (!ties.length || (await confirm({ title: 'Generate ties again?', body: 'Every tie and date is rebuilt.', confirmLabel: 'Generate ties', tone: 'danger' }))) { generateTies(ev.id); toast.success('Ties generated') } }}>{ties.length ? 'Ties generated' : 'Generate ties'}</Button>} />
      {waiting.length > 0 && (
        <div className="mb-5 rounded-lg border border-warning/40 bg-warning-soft p-4">
          <p className="mb-3 flex items-center gap-2 font-semibold text-fg"><Hourglass size={16} className="text-warning" aria-hidden /> {plural(waiting.length, 'line-up')} waiting</p>
          <div className="flex flex-wrap gap-2">
            {waiting.map((w) => <Button key={w.tie.id + w.side} size="sm" variant="secondary" onClick={() => setOpen(w)}>{team(w.side === 'a' ? w.tie.teamA : w.tie.teamB).name}, round {w.tie.round}</Button>)}
          </div>
        </div>
      )}
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'ties', label: 'Rounds' }, { value: 'table', label: 'League table' }, { value: 'knockout', label: 'Knockout', hidden: !ev.league?.autoKnockout }]} />
      {tab === 'ties' && (
        <>
          <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto" role="group" aria-label="Rounds">
            {rounds.map((r) => {
              const rs = ties.filter((t) => t.round === r)
              const done = rs.every((t) => t.status === 'done')
              return <FilterChip key={r} active={round === r} onClick={() => setRound(r)}>{done && <CircleCheck size={12} className="text-success" aria-hidden />}Round {r}</FilterChip>
            })}
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {ties.filter((t) => t.round === round).map((t) => (
              <li key={t.id} className="card flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between t-small text-fg3">
                  <span className="flex items-center gap-1.5"><CalendarDays size={12} aria-hidden /> {fmtDate(t.date)} · Court {t.court}</span>
                  {t.status === 'done' ? <StatusChip tone="success">Final</StatusChip> : <StatusChip tone="neutral">Upcoming</StatusChip>}
                </div>
                {(['a', 'b'] as const).map((s) => {
                  const tm = team(s === 'a' ? t.teamA : t.teamB)
                  const st = t.lineupStatus[s]
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <TeamCrest name={tm.name} color={tm.color} short={tm.short} size={30} />
                      <span className="min-w-0 flex-1 truncate font-semibold text-fg">{tm.name}</span>
                      {t.result ? <span className="text-[20px] font-bold text-fg tnum">{s === 'a' ? t.result.a : t.result.b}</span> : (
                        <button type="button" onClick={() => setOpen({ tie: t, side: s })} disabled={st === 'pending'} className="disabled:cursor-default"><StatusChip tone={LINEUP[st].tone}>{LINEUP[st].label}</StatusChip></button>
                      )}
                    </div>
                  )
                })}
              </li>
            ))}
          </ul>
          <Card className="mt-5">
            <CardHeader title="Tie breaker" icon={<Swords size={18} className="mt-1 text-fg3" aria-hidden />} subtitle={ev.league?.tieBreaker === 'super_singles' ? 'If a tie ends level, one super singles match decides it. Each team picks one player.' : ev.league?.tieBreaker === 'golden_game' ? 'If a tie ends level, one golden game to 7 decides it.' : 'If a tie ends level, the team with more points across all matches wins.'} />
            {level.length ? level.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="flex-1 text-fg">{team(t.teamA).name} vs {team(t.teamB).name} is level</span>
                <Button size="sm" onClick={() => { resolveTieBreaker(t.id, 'a'); toast.success('Tie breaker recorded') }}>Start tie breaker</Button>
              </div>
            )) : <p className="t-small text-fg3">No level ties right now.</p>}
          </Card>
        </>
      )}
      {tab === 'table' && <LeagueTableCard ev={ev.id} ko={ev.league?.knockoutTeams ?? 4} />}
      {tab === 'knockout' && <Knockout eventId={ev.id} />}
      <LineupDrawer d={d} state={open} onClose={() => setOpen(null)} />
    </div>
  )
}

function LeagueTableCard({ ev, ko }: { ev: string; ko: number }) {
  const d = useData()
  const rows = leagueTable(d, ev)
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-[14px]">
        <caption className="sr-only">League table</caption>
        <thead><tr className="t-overline text-fg4">{['Pos', 'Team', 'P', 'W', 'L', 'Tie pts', 'Match pts', 'Net'].map((h) => <th key={h} scope="col" className={h === 'Team' || h === 'Pos' ? 'py-2 text-left' : 'py-2 text-right'}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => {
            const t = d.leagueTeams.find((x) => x.id === r.teamId)!
            return (
              <tr key={r.teamId} className={cn('border-t border-line-subtle', r.pos === ko && 'border-b-2 border-b-brand')}>
                <td className="py-2.5 tnum text-fg2">{r.pos}</td>
                <td><span className="flex items-center gap-2"><TeamCrest name={t.name} color={t.color} short={t.short} size={26} /><span className="font-semibold text-fg">{t.name}</span></span></td>
                {[r.p, r.w, r.l, r.tiePts, r.mw, r.net > 0 ? `+${r.net}` : r.net].map((v, i) => <td key={i} className="text-right tnum text-fg2">{v}</td>)}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-3 t-small text-fg3">Top {ko} above the orange line go to the semi-finals.</p>
    </Card>
  )
}

function Knockout({ eventId }: { eventId: string }) {
  const d = useData()
  const ev = d.events.find((e) => e.id === eventId)!
  const confirm = useConfirm()
  const table = leagueTable(d, eventId).slice(0, ev.league?.knockoutTeams ?? 4).map((r) => r.teamId)
  const [order, setOrder] = useState(ev.league?.knockoutOrder ?? table)
  useEffect(() => {
    setOrder(ev.league?.knockoutOrder ?? table)
  }, [ev.league?.knockoutOrder]) // follow the saved order
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const team = (id: string) => d.leagueTeams.find((t) => t.id === id)!
  return (
    <Card>
      <CardHeader title="Rearrange knockout" subtitle="Seed 1 plays seed 4, seed 2 plays seed 3. Drag to change." action={<Button size="sm" onClick={async () => { if (await confirm({ title: 'Save the knockout order?', body: 'Semi-final pairings change. Captains are told.', confirmLabel: 'Save order' })) { swapKnockout(eventId, order); toast.success('Knockout order saved') } }}>Save order</Button>} />
      <DndContext sensors={sensors} onDragEnd={(e) => e.over && e.active.id !== e.over.id && setOrder(arrayMove(order, order.indexOf(String(e.active.id)), order.indexOf(String(e.over.id))))}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-2">
            {order.map((id, i) => <KoRow key={id} id={id} seed={i + 1} name={team(id).name} color={team(id).color} />)}
          </ol>
        </SortableContext>
      </DndContext>
      {order.length >= 4 && <p className="mt-4 text-fg2">Semi-final 1: {team(order[0]).name} vs {team(order[3]).name}. Semi-final 2: {team(order[1]).name} vs {team(order[2]).name}.</p>}
    </Card>
  )
}

function KoRow({ id, seed, name, color }: { id: string; seed: number; name: string; color: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-3 rounded-md border border-line-subtle bg-s1 px-2 py-2">
      <button type="button" aria-label={`Drag ${name}`} className="flex h-10 w-8 cursor-grab items-center justify-center text-fg3" {...attributes} {...listeners}><GripVertical size={16} /></button>
      <span className="w-14 t-small font-bold text-brand-text">Seed {seed}</span>
      <TeamCrest name={name} color={color} size={28} />
      <span className="font-semibold text-fg">{name}</span>
    </li>
  )
}

function LineupDrawer({ d, state, onClose }: { d: DemoData; state: { tie: Tie; side: 'a' | 'b' } | null; onClose: () => void }) {
  if (!state) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>
  const tie = d.ties.find((t) => t.id === state.tie.id)!
  const tm = d.leagueTeams.find((t) => t.id === (state.side === 'a' ? tie.teamA : tie.teamB))!
  const opp = d.leagueTeams.find((t) => t.id === (state.side === 'a' ? tie.teamB : tie.teamA))!
  const slots = tie.lineups[state.side]
  const st = tie.lineupStatus[state.side]
  return (
    <Drawer
      open
      onClose={onClose}
      title={`${tm.name} line-up`}
      subtitle={`Round ${tie.round} vs ${opp.name}`}
      footer={st === 'submitted' ? (
        <>
          <Button variant="secondary" onClick={() => { approveLineup(tie.id, state.side, false); toast.info('Asked for changes', { body: `${tm.name}'s captain gets a WhatsApp.` }); onClose() }}>Ask for changes</Button>
          <Button icon={<Check size={16} />} onClick={() => { approveLineup(tie.id, state.side, true); toast.success('Line-up approved'); onClose() }}>Approve</Button>
        </>
      ) : undefined}
    >
      <ul className="flex flex-col gap-2">
        {slots.map((s) => (
          <li key={s.label} className="card p-3">
            <p className="t-overline text-fg4">{s.label}</p>
            {s.playerIds.map((p) => <p key={p} className="font-semibold text-fg">{playerName(d.players.find((x) => x.id === p))}</p>)}
          </li>
        ))}
        {!slots.length && <li className="t-small text-fg3">Not submitted yet.</li>}
      </ul>
      <p className="mt-4"><StatusChip tone={LINEUP[st].tone}>{LINEUP[st].label}</StatusChip></p>
    </Drawer>
  )
}

/* ------------------------------------------------------------ L-04 draft */

export function DraftPage() {
  const ev = useEvent()
  const d = useData()
  const reduced = useReducedMotion()
  const dr = d.drafts.find((x) => x.eventId === ev.id)
  const teams = d.leagueTeams.filter((t) => t.eventId === ev.id)
  const [, setTick] = useState(0)
  const [skill, setSkill] = useState<string | null>(null)
  useEffect(() => {
    if (dr?.status !== 'live') return
    const t = setInterval(() => {
      setTick((x) => x + 1)
      if (dr.deadline && Date.now() > dr.deadline) {
        makePick(ev.id, null, true)
        toast.info('Time is up: best available picked automatically')
      }
    }, 500)
    return () => clearInterval(t)
  }, [dr?.status, dr?.deadline, ev.id])
  if (!teams.length) return <div><PageHeader title="Draft board" /><EmptyState icon={Layers} title="Teams come first" help="Finish setup to create teams and captains." /></div>
  if (!dr)
    return (
      <div>
        <PageHeader title="Draft board" subtitle={`${plural(teams.length, 'team')}, ${ev.draft?.order === 'straight' ? 'straight' : 'snake'} order, ${ev.draft?.pickSeconds ?? 60} seconds a pick.`} />
        <EmptyState icon={Layers} title="Ready for draft night" help="Captains are the best-rated players; they pick their squads round by round." action={<Button onClick={() => startDraft(ev.id)}>Start the draft</Button>} />
      </div>
    )
  const current = dr.picks.findIndex((p) => !p.playerId)
  const left = dr.deadline ? Math.max(0, Math.ceil((dr.deadline - Date.now()) / 1000)) : 0
  const pool = dr.pool.map((id) => d.players.find((p) => p.id === id)!).filter((p) => p && (!skill || p.skill === skill)).sort((a, b) => (b.duprRating ?? 0) - (a.duprRating ?? 0))
  const onClock = current >= 0 ? teams.find((t) => t.id === dr.picks[current].teamId) : undefined
  return (
    <div>
      <PageHeader title="Draft board" subtitle={dr.status === 'finished' ? 'Draft complete. Review squads in Team builder.' : `Round ${dr.picks[current]?.round} · ${onClock?.name} on the clock`} actions={dr.status === 'finished' ? <ButtonLink to={`/e/${ev.id}/team-builder`}>Team builder</ButtonLink> : <span className="flex items-center gap-2 rounded-pill bg-brand-soft px-4 py-2 font-bold text-brand-text tnum"><Timer size={16} aria-hidden /> {left}s</span>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-x-auto p-4">
          <table className="w-full min-w-[640px] border-separate border-spacing-1.5">
            <caption className="sr-only">Draft board, rounds by teams</caption>
            <thead>
              <tr>
                <th className="w-16 t-overline text-fg4">Round</th>
                {teams.map((t) => <th key={t.id} scope="col" className="text-left"><span className="flex items-center gap-2"><TeamCrest name={t.name} color={t.color} short={t.short} size={24} /><span className="truncate text-[12px] font-semibold text-fg2">{t.name}</span></span></th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: dr.rounds }, (_, r) => (
                <tr key={r}>
                  <th scope="row" className="text-[12px] text-fg3">{r + 1} {ev.draft?.order !== 'straight' && <span aria-label={r % 2 ? 'right to left' : 'left to right'}>{r % 2 ? '←' : '→'}</span>}</th>
                  {teams.map((t) => {
                    const idx = dr.picks.findIndex((p) => p.round === r + 1 && p.teamId === t.id)
                    const pk = dr.picks[idx]
                    const p = pk?.playerId ? d.players.find((x) => x.id === pk.playerId) : undefined
                    return (
                      <td key={t.id} className="h-14" style={{ perspective: 600 }}>
                        <motion.div key={p?.id ?? 'empty'} initial={reduced || !p ? false : { rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ duration: 0.4 }} className={cn('flex h-full flex-col justify-center rounded-md border px-2 text-[12px]', idx === current ? 'border-brand bg-brand-soft shadow-[0_0_20px_-6px_var(--brand-glow)]' : p ? 'border-line-subtle bg-s2' : 'border-dashed border-line-subtle')}>
                          {p ? <><span className="truncate font-semibold text-fg">{shortName(p)}</span><span className="text-fg3">{p.duprRating?.toFixed(2) ?? ''}{pk.auto ? ' · auto' : ''}</span></> : idx === current ? <span className="font-semibold text-brand-text">On the clock</span> : <span className="text-fg4">Pick {idx + 1}</span>}
                        </motion.div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="h-fit">
          <CardHeader title="Available players" subtitle={`${pool.length} left`} />
          <div className="mb-3 flex flex-wrap gap-1.5">{['intermediate', 'advanced', 'open'].map((s) => <FilterChip key={s} active={skill === s} onClick={() => setSkill(skill === s ? null : s)}>{s}</FilterChip>)}</div>
          <ul className="flex max-h-[520px] flex-col gap-1.5 overflow-y-auto">
            {pool.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-md border border-line-subtle bg-s1 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-[14px] text-fg">{playerName(p)}</span>
                <span className="t-small text-fg3 tnum">{p.duprRating?.toFixed(2)}</span>
                <Button size="sm" disabled={dr.status !== 'live'} onClick={() => { makePick(ev.id, p.id); toast.success(`${onClock?.name} pick ${p.firstName}`) }}>Pick</Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

/* ------------------------------------------------------- S-01 participants */

export function ParticipantsPage() {
  const ev = useEvent()
  const d = useData()
  const ps = d.participants.filter((p) => p.eventId === ev.id)
  const [tab, setTab] = useState<'people' | 'invoices'>('people')
  const [hist, setHist] = useState<Participant | null>(null)
  const invoices = d.invoices.filter((i) => i.eventId === ev.id)
  const counts = useMemo(() => ({ reg: ps.length, paid: ps.filter((p) => p.paymentStatus === 'paid').length, links: ps.filter((p) => p.paymentStatus === 'link_sent').length, men: ps.filter((p) => p.gender === 'M').length, women: ps.filter((p) => p.gender === 'F').length }), [ps])
  return (
    <div>
      <PageHeader title="Participants" subtitle={`${counts.reg} of ${ev.social?.capacity} spots taken · ${inr(ev.social?.pricePerPerson ?? 0)} per person`} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[['Registered', counts.reg], ['Paid', counts.paid], ['Links sent', counts.links], ['Men', counts.men], ['Women', counts.women]].map(([l, v]) => <Card key={l as string}><StatTile label={l as string} value={v as number} /></Card>)}
      </div>
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: 'people', label: 'Participants', count: ps.length }, { value: 'invoices', label: 'Invoices', count: invoices.length }]} />
      {tab === 'people' ? (
        <DataTable
          caption="Participants"
          rows={ps}
          rowKey={(p) => p.id}
          onRowClick={setHist}
          mobileTitle={(p) => <span className="font-semibold text-fg">{p.name}</span>}
          columns={[
            { key: 'n', header: 'Name', sortValue: (p) => p.name, cell: (p) => <span><span className="block font-semibold text-fg">{p.name}</span><span className="t-small text-fg3">"{p.alias}"</span></span> },
            { key: 'g', header: 'Gender', mobile: true, cell: (p) => (p.gender === 'M' ? 'Man' : 'Woman') },
            { key: 'meal', header: 'Meal', mobile: true, cell: (p) => (p.mealPreference === 'non_veg' ? 'Non-veg' : p.mealPreference === 'veg' ? 'Veg' : 'Vegan') },
            { key: 't', header: 'T-shirt', cell: (p) => p.tshirt },
            { key: 'm', header: 'Mobile', optional: true, cell: (p) => maskPhone(p.mobile) },
            { key: 's', header: 'Payment', mobile: true, cell: (p) => p.paymentStatus === 'paid' ? <StatusChip tone="success" icon={<CircleCheck size={12} />}>Paid</StatusChip> : p.paymentStatus === 'link_sent' ? <StatusChip tone="info" icon={<Send size={12} />}>Link sent</StatusChip> : <StatusChip tone="warning">Pending</StatusChip> },
            { key: 'a', header: 'Actions', mobile: true, cell: (p) => p.paymentStatus === 'paid' ? <Button size="sm" variant="ghost" icon={<History size={14} />} onClick={(e) => { e.stopPropagation(); setHist(p) }}>History</Button> : (
              <span className="flex gap-1">
                <Button size="sm" variant="ghost" icon={<MessageCircle size={14} />} onClick={(e) => { e.stopPropagation(); participantLink(p.id); toast.success(`Payment link sent to ${p.name.split(' ')[0]} on WhatsApp`) }}>Send link</Button>
                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); participantPaid(p.id); toast.success(`${p.name.split(' ')[0]} marked paid`) }}>Mark paid</Button>
              </span>
            ) },
          ]}
        />
      ) : (
        <DataTable
          caption="Invoices"
          rows={invoices}
          rowKey={(i) => i.id}
          mobileTitle={(i) => <span className="font-semibold text-fg">{i.number}</span>}
          columns={[
            { key: 'n', header: 'Invoice', cell: (i) => <span className="font-semibold text-fg">{i.number}</span> },
            { key: 'c', header: 'Paid by', mobile: true, cell: (i) => i.customer },
            { key: 'a', header: 'Amount', align: 'right', mobile: true, cell: (i) => inr(i.amount) },
            { key: 's', header: 'Sent', mobile: true, cell: (i) => (i.mailSent ? <span className="flex items-center gap-1 text-success"><Mail size={12} aria-hidden /> {i.sentAt ? fmtDate(i.sentAt) : 'Sent'}</span> : <span className="flex items-center gap-1 text-danger"><TriangleAlert size={12} aria-hidden /> Failed</span>) },
          ]}
        />
      )}
      <Drawer open={!!hist} onClose={() => setHist(null)} title={hist?.name ?? ''} subtitle={hist ? `"${hist.alias}" · ${maskPhone(hist.mobile)}` : ''}>
        <ol className="relative flex flex-col gap-3 border-l border-line pl-4">
          {hist?.history.slice().reverse().map((h, i) => (
            <li key={i} className="relative"><span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden /><p className="text-[14px] text-fg">{h.text}</p><p className="t-small text-fg3">{fmtDateTime(h.at)}</p></li>
          ))}
        </ol>
      </Drawer>
    </div>
  )
}
