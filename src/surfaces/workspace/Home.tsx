import { lazy, Suspense, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CircleCheck, Circle, ExternalLink, Lock, MessageCircle, Rocket, Share2, Tv, Clock, Radio, Trophy, Wallet, Ticket, Users, IndianRupee, Armchair } from 'lucide-react'
import { useData, useEvent, useRole } from '../../store/hooks'
import {
  blockers,
  categoriesOf,
  checkedInCount,
  collected,
  courtsOf,
  entryCount,
  goLiveChecklist,
  matchStats,
  matchTitle,
  playerCount,
  sideLabel,
  upNext,
  type Blocker,
} from '../../store/selectors'
import { openRegistrations, updateEvent } from '../../store/actions'
import { confirmResult, callNextMatch } from '../../store/matchActions'
import { updateCategory } from '../../store/actions'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card, CardHeader, TiltCard } from '../../components/ui/Card'
import { StatTile, ProgressBar, SpotIcon } from '../../components/ui/Display'
import { StatusChip, LiveBadge } from '../../components/ui/Controls'
import { ScoreBug, Tooltip, CopyButton, QR } from '../../components/ui/Misc'
import { toast, useConfirm } from '../../components/ui/Overlay'
import { fmtTime, inr, num } from '../../lib/format'
import { PUBLIC_HOST } from '../../lib/brand'
import { celebrate } from '../../lib/celebrate'
import { cn } from '../../lib/cn'
import type { DemoData, EventItem } from '../../mock/types'
import { PageHeader } from './shared'
import { ShareSheet } from './ShareSheet'
import { PagePreview } from '../setup/Preview'
import { courtTiles } from './courtTiles'
import { drawPoster } from '../../lib/poster'

const GoLiveTrophy = lazy(() => import('../../components/3d/scenes/GoLiveTrophy'))
const CourtMap = lazy(() => import('../../components/3d/scenes/CourtMap'))

export function HomePage() {
  const ev = useEvent()
  const role = useRole()
  if (ev.status === 'draft' || ev.status === 'awaiting_approval') return <BeforeLaunch ev={ev} />
  if (ev.status === 'live') return <MatchDayHome ev={ev} />
  if (ev.status === 'completed') return <FinishedHome ev={ev} />
  return <RegistrationsHome ev={ev} desk={role === 'desk'} />
}

/* ---------------------------------------------------------- before launch */

function BeforeLaunch({ ev }: { ev: EventItem }) {
  const d = useData()
  const confirm = useConfirm()
  const [share, setShare] = useState(false)
  const list = goLiveChecklist(d, ev.id)
  const done = list.filter((i) => i.done).length
  const required = list.filter((i) => !i.optional)
  const ready = required.every((i) => i.done)
  const fill = done / list.length
  const blockedBy = required.find((i) => !i.done)
  const reason = blockedBy ? (blockedBy.key === 'payout' && blockedBy.hint.startsWith('Under review') ? 'Payout account under review' : `${blockedBy.label}: ${blockedBy.hint}`) : ''
  const cats = categoriesOf(d, ev.id)
  const open = async () => {
    const ok = await confirm({ title: 'Open registrations?', body: 'Players can now register and pay. You can close entries any time.', confirmLabel: 'Open registrations' })
    if (!ok) return
    openRegistrations(ev.id)
    celebrate()
    toast.success('Nice. Registrations are open.')
    setShare(true)
  }
  return (
    <div className="flex flex-col gap-6">
      <section className="card floodlight relative overflow-hidden p-0">
        <div className="grid items-center gap-2 md:grid-cols-[minmax(0,1fr)_340px]">
          <div className="p-6 sm:p-8">
            <p className="t-overline text-brand-text">Before launch</p>
            <h1 className="mt-2 t-display-m text-fg">{ev.name} is almost ready</h1>
            <p className="mt-2 text-fg2">Finish the checklist and the trophy fills up. Then open registrations.</p>
            <ol className="mt-6 flex flex-col gap-1" aria-label={`Go-live checklist, ${done} of ${list.length} done`}>
              {list.map((it) => (
                <li key={it.key}>
                  <Link to={it.href} onClick={() => it.key === 'page' && updateEvent(ev.id, (e) => (e.setup.pageReviewed = true))} className="group flex min-h-12 items-center gap-3 rounded-md px-2 hover:bg-s2">
                    {it.done ? <CircleCheck size={22} className="shrink-0 text-success" aria-label="Done" /> : <Circle size={22} className="shrink-0 text-fg4" aria-label="To do" />}
                    <span className={cn('flex-1 font-semibold', it.done ? 'text-fg2' : 'text-fg')}>{it.label}</span>
                    <span className={cn('t-small', it.done ? 'text-fg3' : it.hint.startsWith('Under review') ? 'text-warning' : 'text-fg3')}>{it.optional && !it.done ? 'Optional' : it.hint}</span>
                    {!it.done && <ArrowRight size={16} className="text-fg3 group-hover:text-fg" aria-hidden />}
                  </Link>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {ready ? (
                <Button size="lg" icon={<Rocket size={18} />} onClick={open} className="shadow-glow">
                  Open registrations
                </Button>
              ) : (
                <Tooltip text={reason}>
                  <Button size="lg" icon={<Lock size={18} />} disabled aria-describedby="open-reason">
                    Open registrations
                  </Button>
                </Tooltip>
              )}
              {!ready && (
                <p id="open-reason" className="t-small text-warning">
                  {reason}
                </p>
              )}
            </div>
          </div>
          <div className="relative h-[300px] md:h-[420px]">
            <Suspense fallback={null}>
              <GoLiveTrophy className="absolute inset-0" fill={fill} />
            </Suspense>
            <p className="absolute bottom-4 left-0 right-0 text-center t-small text-fg3 tnum">
              {done} of {list.length} done
            </p>
          </div>
        </div>
      </section>
      <section aria-labelledby="kit">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="kit" className="t-h2 text-fg">
            Your launch kit
          </h2>
          <Button variant="secondary" size="sm" icon={<Share2 size={14} />} onClick={() => setShare(true)}>
            Share
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden p-0">
            <div className="h-[260px] overflow-hidden border-b border-line-subtle">
              <div className="origin-top scale-[0.9]">
                <PagePreview ev={ev} cats={cats} />
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="font-semibold text-fg">Event page</span>
              <a href={`/p/${ev.slug}`} target="_blank" rel="noreferrer" onClick={() => updateEvent(ev.id, (e) => (e.setup.pageReviewed = true))} className="flex items-center gap-1 t-small font-semibold text-brand-text">
                Open <ExternalLink size={12} aria-hidden />
              </a>
            </div>
          </Card>
          <Card className="overflow-hidden p-0">
            <PosterThumb ev={ev} />
            <div className="flex items-center justify-between p-4">
              <span className="font-semibold text-fg">Poster</span>
              <Link to={`/e/${ev.id}/launch-kit?tab=posters`} className="t-small font-semibold text-brand-text">
                Edit
              </Link>
            </div>
          </Card>
          <Card className="flex flex-col p-0">
            <div className="flex-1 bg-s2 p-4">
              <div className="ml-auto max-w-[90%] rounded-lg rounded-tr-sm bg-success-soft p-3 text-[14px] text-fg">
                Registrations for <strong>{ev.name}</strong> are open! Pick your category and pay by UPI in 2 minutes: {PUBLIC_HOST}
                {ev.slug}
                <p className="mt-1 text-right text-[11px] text-fg3">9:41 am ✓✓</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="font-semibold text-fg">WhatsApp message</span>
              <CopyButton variant="ghost" size="sm" label="Copy" text={`Registrations for ${ev.name} are open! ${PUBLIC_HOST}${ev.slug}`} />
            </div>
          </Card>
        </div>
      </section>
      <ShareSheet ev={ev} open={share} onClose={() => setShare(false)} title={ev.status === 'registrations_open' ? 'Registrations are open. Share it.' : 'Share your event'} />
      <span className="sr-only" aria-live="polite">{done === list.length ? 'Checklist complete' : ''}</span>
    </div>
  )
}

function PosterThumb({ ev }: { ev: EventItem }) {
  const url = useMemo(() => drawPoster(ev, { template: 'open', w: 540, h: 675 }), [ev])
  return <img src={url} alt={`Registrations open poster for ${ev.name}`} className="h-[260px] w-full border-b border-line-subtle object-cover object-top" />
}

/* ------------------------------------------------------- attention feed */

export function AttentionFeed({ ev, items, limit = 6 }: { ev: EventItem; items: Blocker[]; limit?: number }) {
  const navigate = useNavigate()
  const d = useData()
  const act = (b: Blocker) => {
    switch (b.kind) {
      case 'confirm':
        confirmResult(b.matchId!, 'Meera Iyer')
        toast.success('Result confirmed', { body: 'The bracket has moved on.' })
        break
      case 'idle_umpire': {
        const id = callNextMatch(ev.id, b.court!)
        if (id) {
          const m = d.matches.find((x) => x.id === id)
          toast.success(`Called to Court ${b.court}`, { body: m ? `${matchTitle(d, m)}. Players notified on WhatsApp.` : 'Players notified on WhatsApp.' })
        } else toast.info('No match is ready to call yet')
        break
      }
      case 'late':
      case 'not_checked_in':
        navigate(`/e/${ev.id}/messages?new=1&audience=${b.kind === 'late' ? 'match' : 'not_checked_in'}${b.matchId ? `&match=${b.matchId}` : ''}`)
        break
      case 'desk_pending':
        navigate(`/e/${ev.id}/registrations?status=pending`)
        break
      case 'near_full':
        updateCategory(b.categoryId!, (c) => (c.cap += 4))
        toast.success('Cap raised by 4', { undo: () => updateCategory(b.categoryId!, (c) => (c.cap -= 4)) })
        break
      case 'full':
        updateCategory(b.categoryId!, (c) => (c.waitlist = true))
        toast.success('Waitlist is on', { body: 'New players join the waitlist. Promote them when a spot opens.' })
        break
      default:
        break
    }
  }
  if (!items.length)
    return (
      <div className="flex items-center gap-4 rounded-lg border border-line-subtle bg-s1 p-5">
        <SpotIcon icon={CircleCheck} size={48} color="var(--success)" float={false} />
        <div>
          <p className="font-semibold text-fg">Nothing needs you right now</p>
          <p className="t-small text-fg3">We will flag anything that does.</p>
        </div>
      </div>
    )
  return (
    <ul className="flex flex-col gap-2" aria-label="Needs your attention">
      {items.slice(0, limit).map((b) => (
        <li key={b.id} className={cn('card flex flex-col gap-3 p-4 sm:flex-row sm:items-center', b.tone === 'warning' && 'border-warning/30')}>
          <div className="min-w-0 flex-1">
            <p className="flex items-start gap-2 font-semibold text-fg">
              {b.tone === 'warning' ? <StatusChip tone="warning" icon={<Clock size={12} />}>Now</StatusChip> : <StatusChip tone="info">Next</StatusChip>}
              <span className="pt-0.5">{b.title}</span>
            </p>
            <p className="mt-1 t-small font-normal text-fg3">{b.body}</p>
          </div>
          <Button size="sm" variant={b.kind === 'confirm' || b.kind === 'idle_umpire' ? 'primary' : 'secondary'} onClick={() => act(b)}>
            {b.action}
          </Button>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------ registrations open */

function entriesByDay(d: DemoData, eventId: string): number[] {
  const regs = d.registrations.filter((r) => r.eventId === eventId && (r.status === 'paid' || r.status === 'pending'))
  if (!regs.length) return [0, 0]
  const times = regs.map((r) => Date.parse(r.createdAt)).sort((a, b) => a - b)
  const start = times[0]
  const end = Math.max(times[times.length - 1], start + 1)
  const buckets = Array(8).fill(0)
  times.forEach((t) => buckets[Math.min(7, Math.floor(((t - start) / (end - start)) * 8))]++)
  let acc = 0
  return buckets.map((b) => (acc += b))
}

function Kpis({ ev }: { ev: EventItem }) {
  const d = useData()
  const cats = categoriesOf(d, ev.id)
  const entries = entryCount(d, ev.id)
  const cap = ev.type === 'social' ? ev.social?.capacity ?? 0 : cats.reduce((s, c) => s + c.cap, 0)
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <TiltCard>
        <StatTile label="Entries" value={entries} spark={entriesByDay(d, ev.id)} icon={<Ticket size={16} className="text-fg3" aria-hidden />} />
      </TiltCard>
      <TiltCard>
        <StatTile label="Players" value={playerCount(d, ev.id)} sub="Unique people" icon={<Users size={16} className="text-fg3" aria-hidden />} />
      </TiltCard>
      <TiltCard>
        <StatTile label="Collected" value={collected(d, ev.id)} format={(n) => inr(n)} tone="brand" sub="Online and desk" icon={<IndianRupee size={16} className="text-fg3" aria-hidden />} />
      </TiltCard>
      <TiltCard>
        <StatTile label="Spots left" value={Math.max(0, cap - entries)} sub={`of ${num(cap)}`} icon={<Armchair size={16} className="text-fg3" aria-hidden />} />
      </TiltCard>
    </div>
  )
}

function RegistrationsHome({ ev, desk }: { ev: EventItem; desk: boolean }) {
  const d = useData()
  const cats = categoriesOf(d, ev.id)
  const [share, setShare] = useState(false)
  const items = blockers(d, ev.id)
  const traffic = d.traffic[ev.id] ?? []
  const visits = traffic.reduce((s, t) => s + t.visits, 0)
  const conv = traffic.reduce((s, t) => s + t.entries, 0)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        overline={ev.status === 'registrations_open' ? 'Registrations open' : ev.status === 'registrations_closed' ? 'Entries closed' : 'Scheduled'}
        title={`Hello, ${desk ? 'Ananya' : (d.organizers.find((o) => o.id === ev.organizerId)?.name.split(' ')[0] ?? 'there')}`}
        subtitle={ev.status === 'registrations_open' ? 'Here is what needs you, and how entries are going.' : 'Entries are in. Time to draw and schedule.'}
        actions={
          <>
            {!desk && ev.status !== 'registrations_open' && ev.modules.includes('schedule') && <ButtonLink to={`/e/${ev.id}/schedule`}>Go to schedule</ButtonLink>}
            <Button variant="secondary" icon={<Share2 size={16} />} onClick={() => setShare(true)}>
              Share
            </Button>
          </>
        }
      />
      <section aria-labelledby="att">
        <h2 id="att" className="mb-3 t-h3 text-fg">
          Needs your attention
        </h2>
        <AttentionFeed ev={ev} items={items} />
      </section>
      <Kpis ev={ev} />
      {ev.type !== 'social' && (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader title="Registrations by category" subtitle="The line marks each category's cap." />
            <ul className="flex flex-col gap-4">
              {cats.map((c) => {
                const n = entryCount(d, ev.id, c.id)
                return (
                  <li key={c.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[14px]">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
                        <span className="truncate text-fg">{c.label}</span>
                      </span>
                      <span className="shrink-0 font-semibold text-fg tnum">
                        {n} <span className="font-normal text-fg3">/ {c.cap}</span>
                      </span>
                    </div>
                    <ProgressBar value={n} max={Math.max(c.cap, n)} color={c.color} markers={[c.cap]} />
                  </li>
                )
              })}
            </ul>
          </Card>
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader title="Event page traffic" subtitle="Last 4 weeks" />
              <div className="flex items-end gap-1.5" aria-hidden>
                {traffic.map((t) => (
                  <div key={t.day} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm bg-brand/80" style={{ height: `${Math.max(4, (t.visits / Math.max(...traffic.map((x) => x.visits), 1)) * 80)}px` }} />
                    <span className="text-[10px] text-fg4">{t.day.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 t-small text-fg2">
                <strong className="text-fg tnum">{num(visits)}</strong> visits, <strong className="text-fg tnum">{visits ? ((conv / visits) * 100).toFixed(1) : '0'}%</strong> became entries.
              </p>
            </Card>
            <Card className="flex items-center gap-4">
              <QR value={`https://${PUBLIC_HOST}${ev.slug}`} size={84} />
              <div className="min-w-0">
                <p className="font-semibold text-fg">Share your event</p>
                <p className="truncate t-small text-fg3">
                  {PUBLIC_HOST}
                  {ev.slug}
                </p>
                <Button size="sm" variant="secondary" className="mt-2" onClick={() => setShare(true)}>
                  Link, QR, poster
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
      <ShareSheet ev={ev} open={share} onClose={() => setShare(false)} />
    </div>
  )
}

/* ---------------------------------------------------------- match day home */

function MatchDayHome({ ev }: { ev: EventItem }) {
  const d = useData()
  const navigate = useNavigate()
  const stats = matchStats(d, ev.id)
  const items = blockers(d, ev.id)
  const tiles = courtTiles(d, ev.id)
  const live = d.matches.filter((m) => m.eventId === ev.id && m.status === 'live')
  const next = upNext(d, ev.id).slice(0, 4)
  const courts = courtsOf(d, ev.id)
  return (
    <div className="flex flex-col gap-6">
      <div className="glass flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line-subtle px-4 py-3" role="status">
        <LiveBadge />
        <span className="font-semibold text-fg">{ev.dayLabel ?? 'Match day'}</span>
        <span className="text-fg4" aria-hidden>·</span>
        <span className="text-fg2">Finals day</span>
        <span className="text-fg4" aria-hidden>·</span>
        <span className="text-fg2 tnum">
          {stats.done} of {stats.total} matches done
        </span>
        <span className="text-fg4" aria-hidden>·</span>
        <span className="text-fg2 tnum">
          {checkedInCount(d, ev.id)} of {playerCount(d, ev.id)} checked in
        </span>
        <div className="ml-auto flex gap-2">
          <a href={`/tv/${ev.id}/all`} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-1.5 rounded-md px-2 t-small font-semibold text-fg2 hover:bg-s2 hover:text-fg">
            <Tv size={14} aria-hidden /> Court TV
          </a>
          <a href={`/p/${ev.slug}/live`} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-1.5 rounded-md px-2 t-small font-semibold text-fg2 hover:bg-s2 hover:text-fg">
            <ExternalLink size={14} aria-hidden /> Public page
          </a>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="flex flex-col overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="t-h3 text-fg">Courts</h2>
            <ButtonLink to={`/e/${ev.id}/match-day`} variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>
              Match day
            </ButtonLink>
          </div>
          <div className="relative min-h-[340px] flex-1">
            <Suspense fallback={null}>
              <CourtMap className="absolute inset-0" tiles={tiles} selected={null} compact onSelect={(c) => c && navigate(`/e/${ev.id}/match-day?court=${c}`)} />
            </Suspense>
          </div>
          <ul className="grid grid-cols-2 gap-px border-t border-line-subtle bg-line-subtle sm:grid-cols-4" aria-label="Courts">
            {courts.map((c) => (
              <li key={c.court} className="bg-s1">
                <Link to={`/e/${ev.id}/match-day?court=${c.court}`} className="flex flex-col px-4 py-3 hover:bg-s2">
                  <span className="font-semibold text-fg">Court {c.court}</span>
                  <span className={cn('t-small', c.state === 'live' ? 'text-live' : c.state === 'free' ? 'text-fg3' : 'text-warning')}>
                    {c.state === 'live' ? 'Live' : c.state === 'late' ? `${c.lateMin} min late` : c.state === 'awaiting' ? 'Confirm result' : c.state === 'called' ? 'Called' : c.state === 'paused' ? 'Paused' : 'Free'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <section aria-labelledby="att2">
          <h2 id="att2" className="mb-3 t-h3 text-fg">
            Needs your attention <span className="ml-1 rounded-pill bg-warning-soft px-2 py-0.5 text-[13px] text-warning tnum">{items.length}</span>
          </h2>
          <AttentionFeed ev={ev} items={items} />
        </section>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Live now" icon={<Radio size={18} className="mt-1 text-live" aria-hidden />} />
          <div className="flex flex-col gap-3">
            {live.length === 0 && <p className="text-fg3">No matches live right now.</p>}
            {live.map((m) => {
              const w = { a: m.games.slice(0, -1).filter((g) => g.a > g.b).length, b: m.games.slice(0, -1).filter((g) => g.b > g.a).length }
              const cur = m.games[m.games.length - 1]
              return (
                <Link key={m.id} to={`/e/${ev.id}/match-day?match=${m.id}`}>
                  <ScoreBug title={`Court ${m.court} · ${matchTitle(d, m)}`} a={sideLabel(d, m.sideA, true)} b={sideLabel(d, m.sideB, true)} games={w} current={cur} server={m.live?.server} live className="hover:border-line-strong" />
                </Link>
              )
            })}
          </div>
        </Card>
        <Card>
          <CardHeader title="Up next" action={<ButtonLink to={`/e/${ev.id}/match-day`} variant="ghost" size="sm">See all</ButtonLink>} />
          <ul className="flex flex-col divide-y divide-line-subtle">
            {next.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <span className="w-16 shrink-0 t-small font-semibold text-fg2 tnum">{m.scheduledAt ? fmtTime(m.scheduledAt) : 'TBD'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-fg">
                    {sideLabel(d, m.sideA, true)} vs {sideLabel(d, m.sideB, true)}
                  </span>
                  <span className="block truncate t-small text-fg3">{matchTitle(d, m)}</span>
                </span>
                <span className="shrink-0 t-small text-fg3">{m.court ? `Court ${m.court}` : ''}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- finished */

function FinishedHome({ ev }: { ev: EventItem }) {
  const d = useData()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader overline="Finished" title={`${ev.name} is a wrap`} subtitle="Results are final. Share the winners and check your payout." actions={<ButtonLink to={`/e/${ev.id}/results`} icon={<Trophy size={16} />}>See results</ButtonLink>} />
      <Kpis ev={ev} />
      <div className="grid gap-4 md:grid-cols-2">
        <TiltCard className="flex items-center gap-5" as="div">
          <SpotIcon icon={Trophy} size={72} />
          <div>
            <p className="t-h3 text-fg">Winners podium</p>
            <p className="text-fg2">{categoriesOf(d, ev.id).length} categories decided. DUPR sync in progress.</p>
            <Link to={`/e/${ev.id}/results`} className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-text">
              Open results <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </TiltCard>
        <TiltCard className="flex items-center gap-5" as="div">
          <SpotIcon icon={Wallet} size={72} />
          <div>
            <p className="t-h3 text-fg">Your money</p>
            <p className="text-fg2">{inr(collected(d, ev.id))} collected. Next payout scheduled.</p>
            <Link to={`/e/${ev.id}/money`} className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-text">
              Open money <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </TiltCard>
      </div>
      <Card className="flex items-center gap-4">
        <MessageCircle className="text-success" aria-hidden />
        <p className="flex-1 text-fg2">Send everyone the results and a thank-you.</p>
        <ButtonLink to={`/e/${ev.id}/messages?new=1&template=results`} variant="secondary">
          Send results
        </ButtonLink>
      </Card>
    </div>
  )
}
