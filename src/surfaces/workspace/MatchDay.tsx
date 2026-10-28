import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CircleCheck, ExternalLink, GripVertical, MapPin, Pause, Phone, Play, Plus, Radio, Send, ShieldCheck, Square, TriangleAlert, Tv, Volleyball } from 'lucide-react'
import { useData, useEvent } from '../../store/hooks'
import { blockers, busySides, checkedInSet, courtInfo, courtsOf, matchTitle, sideLabel, sidePlayers, upNext, type CourtInfo } from '../../store/selectors'
import { callNextMatch, confirmResult, endMatch, inviteUmpire, pauseMatch, reassignUmpire, reorderQueue } from '../../store/matchActions'
import { courtToken } from '../../mock/seed'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { LiveBadge, StatusChip, Tabs } from '../../components/ui/Controls'
import { Drawer, Dialog, toast, useConfirm } from '../../components/ui/Overlay'
import { Input, PhoneInput, Select } from '../../components/ui/Field'
import { EmptyState } from '../../components/ui/Display'
import { CopyButton, QR, ScoreBug } from '../../components/ui/Misc'
import { MatchDrawer } from '../../components/data/MatchBits'
import { PageHeader } from './shared'
import { AttentionFeed } from './Home'
import { courtTiles } from './courtTiles'
import { fmtPhone, fmtTime, plural } from '../../lib/format'
import { cn } from '../../lib/cn'
import type { DemoData, EventItem, Match } from '../../mock/types'

const CourtMap = lazy(() => import('../../components/3d/scenes/CourtMap'))

const STATE_TEXT: Record<CourtInfo['state'], string> = { live: 'Live', awaiting: 'Result waiting', late: 'Running late', free: 'Free', paused: 'Paused', called: 'Called' }

export function MatchDayPage() {
  const ev = useEvent()
  const d = useData()
  const [params, setParams] = useSearchParams()
  const [court, setCourt] = useState<number | null>(params.get('court') ? Number(params.get('court')) : null)
  const [match, setMatch] = useState<string | null>(params.get('match'))
  const [tab, setTab] = useState<'courts' | 'attention' | 'next' | 'umpires'>(params.get('tab') === 'umpires' ? 'umpires' : 'courts')
  useEffect(() => {
    if (params.toString()) setParams({}, { replace: true })
  }, []) // read once from the URL
  const tiles = courtTiles(d, ev.id)
  const courts = courtsOf(d, ev.id)
  const items = blockers(d, ev.id)
  const live = d.matches.filter((m) => m.eventId === ev.id && m.status === 'live').length
  const hasMatches = d.matches.some((m) => m.eventId === ev.id && m.stage !== 'league')
  if (!hasMatches)
    return (
      <div>
        <PageHeader title="Match day" />
        <EmptyState icon={Volleyball} title="All courts are quiet" help="Matches appear here once your schedule is published." />
      </div>
    )
  return (
    <div>
      <PageHeader
        title="Match day"
        subtitle={<span className="flex items-center gap-2">{live > 0 && <LiveBadge label={`${live} LIVE`} />} {plural(courts.filter((c) => c.state === 'free').length, 'free court')} · {items.length} need attention</span>}
        actions={
          <>
            <a href={`/tv/${ev.id}/all`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-s2 px-4 font-semibold text-fg hover:bg-s3">
              <Tv size={16} aria-hidden /> Court TV
            </a>
            <Button variant={tab === 'umpires' ? 'primary' : 'secondary'} onClick={() => setTab(tab === 'umpires' ? 'courts' : 'umpires')}>
              Umpires
            </Button>
          </>
        }
      />
      <Tabs className="mb-4 lg:hidden" value={tab} onChange={setTab} tabs={[{ value: 'courts', label: 'Courts' }, { value: 'attention', label: 'Attention', count: items.length }, { value: 'next', label: 'Up next' }, { value: 'umpires', label: 'Umpires' }]} />
      {tab === 'umpires' ? (
        <UmpiresPanel ev={ev} />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className={cn('flex flex-col gap-4', tab !== 'courts' && 'max-lg:hidden')} aria-label="Courts">
              <Card className="relative overflow-hidden p-0">
                <div className="relative h-[460px]">
                  <Suspense fallback={null}>
                    <CourtMap className="absolute inset-0" tiles={tiles} selected={court} onSelect={(c) => setCourt(c || null)} />
                  </Suspense>
                </div>
                <p className="border-t border-line-subtle px-4 py-2 t-small text-fg3">Click a court to zoom in and open it. The list below has the same information.</p>
              </Card>
              <ul className="grid grid-cols-2 gap-2 xl:grid-cols-4" aria-label="Courts list">
                {courts.map((c) => (
                  <li key={c.court}>
                    <button
                      type="button"
                      onClick={() => setCourt(c.court)}
                      aria-pressed={court === c.court}
                      className={cn('card flex w-full flex-col gap-1 p-3 text-left hover:border-line-strong', c.state === 'live' && 'border-brand/50', (c.state === 'late' || c.state === 'awaiting') && 'border-warning/50', court === c.court && 'shadow-[0_0_0_1px_var(--brand)]')}
                    >
                      <span className="flex items-center justify-between">
                        <span className="font-semibold text-fg">Court {c.court}</span>
                        {c.state === 'live' ? <LiveBadge /> : <span className={cn('t-small font-semibold', c.state === 'free' ? 'text-fg3' : 'text-warning')}>{c.state === 'late' ? `${c.lateMin} min late` : STATE_TEXT[c.state]}</span>}
                      </span>
                      <span className="truncate t-small text-fg3">{c.current ? `${sideLabel(d, c.current.sideA, true)} vs ${sideLabel(d, c.current.sideB, true)}` : c.awaiting ? 'Waiting for confirmation' : c.next ? `Next: ${matchTitle(d, c.next)}` : 'Nothing scheduled'}</span>
                      <span className="t-small text-fg4">Umpire: {c.umpire?.name ?? 'none'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section className={cn(tab !== 'attention' && 'max-lg:hidden')} aria-labelledby="att3">
              <h2 id="att3" className="mb-3 t-h3 text-fg">
                Needs attention
              </h2>
              <AttentionFeed ev={ev} items={items} limit={8} />
            </section>
          </div>
          <section className={cn('mt-6', tab !== 'next' && 'max-lg:hidden')} aria-labelledby="next">
            <UpNext ev={ev} onOpen={setMatch} />
          </section>
        </>
      )}
      <CourtPanel ev={ev} court={court} onClose={() => setCourt(null)} onOpenMatch={setMatch} />
      <MatchDrawer matchId={match} onClose={() => setMatch(null)} />
    </div>
  )
}

/* ------------------------------------------------------------- up next */

function UpNext({ ev, onOpen }: { ev: EventItem; onOpen: (id: string) => void }) {
  const d = useData()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const queue = upNext(d, ev.id).slice(0, 10)
  const busy = busySides(d, ev.id)
  const inSet = checkedInSet(d, ev.id)
  const onEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const ids = queue.map((m) => m.id)
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)))
    reorderQueue(next)
    toast.success('Queue reordered', { body: 'Match times swapped to keep the order.' })
  }
  return (
    <Card>
      <CardHeader title="Up next" subtitle="Drag to reorder. Warnings show if a player is still on court or not checked in." />
      {queue.length === 0 ? (
        <p className="text-fg3">Nothing waiting. Finals are being played.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
          <SortableContext items={queue.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {queue.map((m) => (
                <QueueRow key={m.id} d={d} m={m} onOpen={() => onOpen(m.id)} busy={[m.sideA, m.sideB].some((s) => s && busy.has(s))} missing={[m.sideA, m.sideB].flatMap((s) => sidePlayers(d, s)).filter((p) => !inSet.has(p)).length} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </Card>
  )
}

function QueueRow({ d, m, onOpen, busy, missing }: { d: DemoData; m: Match; onOpen: () => void; busy: boolean; missing: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.id })
  const ready = m.sideA && m.sideB
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('flex items-center gap-3 rounded-md border border-line-subtle bg-s1 px-2 py-2', isDragging && 'z-10 rotate-1 border-brand shadow-float')}>
      <button type="button" aria-label="Drag to reorder" className="flex h-10 w-8 cursor-grab items-center justify-center text-fg3" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <span className="w-16 shrink-0 font-semibold text-fg2 tnum">{m.scheduledAt ? fmtTime(m.scheduledAt) : 'TBD'}</span>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[14px] text-fg">
          {sideLabel(d, m.sideA, true)} vs {sideLabel(d, m.sideB, true)}
        </span>
        <span className="block truncate t-small text-fg3">{matchTitle(d, m)}</span>
      </button>
      <span className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
        {!ready && <StatusChip tone="neutral">Waiting for results</StatusChip>}
        {busy && <StatusChip tone="warning" icon={<TriangleAlert size={12} />}>Playing now</StatusChip>}
        {ready && missing > 0 && <StatusChip tone="warning">{missing} not checked in</StatusChip>}
        {ready && !busy && !missing && <StatusChip tone="success" icon={<CircleCheck size={12} />}>Ready</StatusChip>}
      </span>
      <span className="w-16 shrink-0 text-right t-small text-fg3">{m.court ? `Court ${m.court}` : ''}</span>
    </li>
  )
}

/* ---------------------------------------------------------- court panel */

function CourtPanel({ ev, court, onClose, onOpenMatch }: { ev: EventItem; court: number | null; onClose: () => void; onOpenMatch: (id: string) => void }) {
  const d = useData()
  const confirm = useConfirm()
  const [reassign, setReassign] = useState(false)
  const info = court ? courtInfo(d, ev.id, court) : null
  const umpires = d.umpires.filter((u) => u.eventId === ev.id)
  const [pick, setPick] = useState('')
  if (!info) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>
  const m = info.current
  const done = m ? m.games.slice(0, m.status === 'live' ? -1 : undefined) : []
  return (
    <Drawer open onClose={onClose} title={`Court ${info.court}`} subtitle={info.state === 'late' ? `${info.lateMin} min late` : STATE_TEXT[info.state]}>
      <div className="flex flex-col gap-5">
        {m ? (
          <>
            <button type="button" onClick={() => onOpenMatch(m.id)} className="text-left">
              <ScoreBug title={matchTitle(d, m)} a={sideLabel(d, m.sideA, true)} b={sideLabel(d, m.sideB, true)} games={{ a: done.filter((g) => g.a > g.b).length, b: done.filter((g) => g.b > g.a).length }} current={m.status === 'live' || m.status === 'paused' ? m.games[m.games.length - 1] : undefined} server={m.live?.server} live={m.status === 'live'} />
            </button>
            <div className="grid grid-cols-2 gap-2">
              {(m.status === 'live' || m.status === 'paused') && (
                <>
                  <Button variant="secondary" icon={m.status === 'paused' ? <Play size={14} /> : <Pause size={14} />} onClick={() => pauseMatch(m.id, m.status !== 'paused')}>
                    {m.status === 'paused' ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<Square size={14} />}
                    onClick={async () => {
                      if (await confirm({ title: 'End this match now?', body: 'The current score becomes the result and waits for confirmation.', confirmLabel: 'End match', tone: 'danger' })) {
                        endMatch(m.id)
                        toast.success('Match ended. Confirm the result when ready.')
                      }
                    }}
                  >
                    End match
                  </Button>
                </>
              )}
              <Button variant="secondary" icon={<MapPin size={14} />} onClick={() => onOpenMatch(m.id)}>
                Move or correct
              </Button>
              <Button variant="ghost" onClick={() => onOpenMatch(m.id)}>
                Match details
              </Button>
            </div>
          </>
        ) : info.awaiting ? (
          <div className="card flex flex-col gap-3 border-warning/40 p-4">
            <p className="font-semibold text-fg">Result waiting for confirmation</p>
            <p className="t-small text-fg2">
              {matchTitle(d, info.awaiting)}: {sideLabel(d, info.awaiting.sideA, true)} vs {sideLabel(d, info.awaiting.sideB, true)}, {info.awaiting.games.map((g) => `${g.a}-${g.b}`).join(', ')}
            </p>
            <div className="flex gap-2">
              <Button icon={<ShieldCheck size={16} />} onClick={() => { confirmResult(info.awaiting!.id, 'Meera Iyer'); toast.success('Result confirmed') }}>
                Confirm result
              </Button>
              <Button variant="secondary" onClick={() => onOpenMatch(info.awaiting!.id)}>
                Correct score
              </Button>
            </div>
          </div>
        ) : (
          <div className="card p-4">
            <p className="font-semibold text-fg">Court {info.court} is free</p>
            <p className="t-small text-fg3">{info.next ? `Next ready: ${matchTitle(d, info.next)}` : 'Nothing scheduled here. We will pick the next ready match.'}</p>
          </div>
        )}
        {!m && (
          <Button
            size="lg"
            icon={<Radio size={18} />}
            onClick={() => {
              const id = callNextMatch(ev.id, info.court)
              if (id) {
                const mm = d.matches.find((x) => x.id === id)
                toast.success(`Called to Court ${info.court}`, { body: mm ? `${matchTitle(d, mm)}. Players notified on WhatsApp; the umpire sees it now.` : undefined })
              } else toast.info('No match is ready to call yet', { body: 'Matches become ready when both sides are known and free.' })
            }}
          >
            Call next match
          </Button>
        )}
        <section className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="t-overline text-fg4">Umpire</p>
              <p className="font-semibold text-fg">{info.umpire?.name ?? 'No umpire yet'}</p>
              {info.umpire && <p className="t-small text-fg3 capitalize">{info.umpire.status}</p>}
            </div>
            <div className="flex gap-1">
              {info.umpire && (
                <Button size="sm" variant="ghost" icon={<Phone size={14} />} onClick={() => toast.info(`Calling ${info.umpire!.name}`, { body: 'Simulated in this prototype.' })}>
                  Call
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setReassign(true)}>
                Reassign
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`/u/${courtToken(ev.id, info.court)}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-[13px] font-semibold text-fg2 hover:text-fg">
              Open umpire app <ExternalLink size={12} aria-hidden />
            </a>
            <a href={`/tv/${ev.id}/${info.court}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-[13px] font-semibold text-fg2 hover:text-fg">
              Court TV <ExternalLink size={12} aria-hidden />
            </a>
          </div>
        </section>
      </div>
      <Dialog
        open={reassign}
        onClose={() => setReassign(false)}
        title={`Umpire for Court ${info.court}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReassign(false)}>
              Cancel
            </Button>
            <Button disabled={!pick} onClick={() => { reassignUmpire(ev.id, info.court, pick); toast.success('Umpire reassigned', { body: 'They got the court link on WhatsApp.' }); setReassign(false) }}>
              Assign
            </Button>
          </>
        }
      >
        <Select label="Umpire" value={pick} onChange={(e) => setPick(e.target.value)} options={[{ value: '', label: 'Choose an umpire' }, ...umpires.map((u) => ({ value: u.id, label: `${u.name} (Court ${u.court}, ${u.status})` }))]} />
      </Dialog>
    </Drawer>
  )
}

/* ------------------------------------------------------------- umpires */

function UmpiresPanel({ ev }: { ev: EventItem }) {
  const d = useData()
  const ups = d.umpires.filter((u) => u.eventId === ev.id)
  const [add, setAdd] = useState(false)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [court, setCourt] = useState('1')
  const byCourt = useMemo(() => Array.from({ length: ev.courts }, (_, i) => ({ court: i + 1, list: ups.filter((u) => u.court === i + 1) })), [ups, ev.courts])
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button icon={<Plus size={16} />} onClick={() => setAdd(true)}>
          Invite umpire
        </Button>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {byCourt.map(({ court: c, list }) => {
          const link = `https://rizzfitt.com/u/${courtToken(ev.id, c)}`
          return (
            <li key={c} className="card flex gap-4 p-4">
              <QR value={link} size={96} />
              <div className="min-w-0 flex-1">
                <p className="t-title text-fg">Court {c}</p>
                {list.length === 0 && <p className="t-small text-fg3">No umpire yet.</p>}
                <ul className="mt-1 flex flex-col gap-1">
                  {list.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-[14px] text-fg">{u.name}</span>
                      <StatusChip tone={u.status === 'active' ? 'success' : u.status === 'idle' ? 'warning' : 'neutral'}>{u.status === 'active' ? 'Active' : u.status === 'idle' ? 'Idle' : 'Invited'}</StatusChip>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <CopyButton size="sm" variant="ghost" label="Copy link" text={link} />
                  <Button size="sm" variant="ghost" icon={<Send size={14} />} onClick={() => toast.success(`Court ${c} link sent again on WhatsApp`)}>
                    Resend
                  </Button>
                  <a href={`/u/${courtToken(ev.id, c)}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-[13px] font-semibold text-brand-text hover:bg-brand-soft">
                    Open <ExternalLink size={12} aria-hidden />
                  </a>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <Dialog
        open={add}
        onClose={() => setAdd(false)}
        title="Invite an umpire"
        description="They get a WhatsApp with their court link. No app to install."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdd(false)}>
              Cancel
            </Button>
            <Button
              disabled={name.trim().length < 2 || mobile.length !== 10}
              onClick={() => {
                inviteUmpire(ev.id, name.trim(), mobile, Number(court))
                toast.success(`${name.trim()} invited to Court ${court}`)
                setAdd(false)
                setName('')
                setMobile('')
              }}
            >
              Send invite
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <PhoneInput value={mobile} onChange={setMobile} />
          <Select label="Court" value={court} onChange={(e) => setCourt(e.target.value)} options={Array.from({ length: ev.courts }, (_, i) => ({ value: String(i + 1), label: `Court ${i + 1}` }))} />
          <p className="t-small text-fg3">Umpire mobile: {mobile.length === 10 ? fmtPhone(mobile) : 'not entered'}</p>
        </div>
      </Dialog>
    </div>
  )
}
