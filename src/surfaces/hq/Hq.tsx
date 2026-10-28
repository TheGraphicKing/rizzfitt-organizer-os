import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUp, Archive, BadgeCheck, CircleCheck, Eye, Gauge, Inbox, KeyRound, LayoutGrid, ListChecks, MessageCircle, Plus, ShieldCheck, Sparkles, Upload, Users, Wallet, X } from 'lucide-react'
import { useData } from '../../store/hooks'
import { useUi } from '../../store/store'
import { collected, entryCount, paymentsOf } from '../../store/selectors'
import { addMaster, archiveMaster, createKey, decideApproval, moveMaster, revokeKey, setTakeOver, updateFee, updateHqUser } from '../../store/hqActions'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { FilterChip, StatusChip, Tabs, Toggle } from '../../components/ui/Controls'
import { Input, Select, Textarea } from '../../components/ui/Field'
import { EmptyState, StatTile, Avatar, SpotIcon } from '../../components/ui/Display'
import { Dialog, Drawer, toast, useConfirm } from '../../components/ui/Overlay'
import { DataTable } from '../../components/ui/DataTable'
import { FileDropzone, Logo } from '../../components/ui/Misc'
import { StatusPill } from '../workspace/WorkspaceLayout'
import { EventGlyph, PageHeader } from '../workspace/shared'
import { fmtDate, fmtDateTime, fmtPhone, inr, num, plural, ago } from '../../lib/format'
import { SPORT_META, TYPE_META } from '../../mock/constants'
import { cn } from '../../lib/cn'
import type { Approval, DemoData, EventItem, Organizer } from '../../mock/types'

/* ------------------------------------------------------------------ layout */

export function HqLayout() {
  const d = useData()
  const pending = d.approvals.filter((a) => a.status === 'pending').length
  const nav: [string, string, typeof Gauge, number?][] = [
    ['/hq', 'Overview', Gauge],
    ['/hq/approvals', 'Approvals', Inbox, pending],
    ['/hq/organizers', 'Organizers', Users],
    ['/hq/events', 'Events', LayoutGrid],
    ['/hq/platform', 'Platform', ShieldCheck],
    ['/hq/whats-new', "What's new", Sparkles],
  ]
  return (
    <div className="min-h-dvh overflow-x-clip bg-base">
      <div className="sticky top-0 z-40 flex h-9 items-center justify-center gap-2 bg-hq text-[13px] font-bold tracking-wide text-fg">
        <ShieldCheck size={14} aria-hidden /> RIZZFITT HQ · internal console
      </div>
      <div className="md:flex">
        <aside className="hidden w-[240px] shrink-0 border-r border-line-subtle bg-canvas md:block" aria-label="HQ">
          <div className="sticky top-9 flex h-[calc(100dvh-36px)] flex-col p-4">
            <Link to="/hq" className="mb-6 flex items-center gap-2"><Logo size="sm" /><StatusChip tone="hq">HQ</StatusChip></Link>
            <nav className="flex flex-col gap-0.5">
              {nav.map(([to, l, I, n]) => (
                <NavLink key={to} to={to} end={to === '/hq'} className={({ isActive }) => cn('relative flex h-11 items-center gap-3 rounded-md px-3 text-[14px] font-semibold', isActive ? 'bg-s2 text-fg before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-hq' : 'text-fg2 hover:bg-s1 hover:text-fg')}>
                  <I size={18} aria-hidden /> <span className="flex-1">{l}</span>
                  {!!n && <span className="rounded-pill bg-hq-soft px-2 text-[12px] text-hq-text tnum">{n}</span>}
                </NavLink>
              ))}
            </nav>
            <p className="mt-auto pb-14 t-small text-fg4">Signed in as Priya Raghavan, Super admin</p>
          </div>
        </aside>
        <nav className="no-scrollbar flex max-w-[100vw] gap-1 overflow-x-auto border-b border-line-subtle px-3 py-2 md:hidden" aria-label="HQ">
          {nav.map(([to, l, , n]) => (
            <NavLink key={to} to={to} end={to === '/hq'} className={({ isActive }) => cn('h-9 shrink-0 rounded-pill px-3 py-2 text-[13px] font-semibold', isActive ? 'bg-hq-soft text-hq-text' : 'text-fg2')}>{l}{n ? ` (${n})` : ''}</NavLink>
          ))}
        </nav>
        <main id="main" className="min-w-0 flex-1 px-4 py-6 pb-28 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function orgOf(d: DemoData, id: string) {
  return d.organizers.find((o) => o.id === id)
}

/* -------------------------------------------------------------- H-01 */

export function HqOverview() {
  const d = useData()
  const navigate = useNavigate()
  const live = d.events.filter((e) => e.status === 'live')
  const pend = d.approvals.filter((a) => a.status === 'pending')
  const captured = d.payments.filter((p) => p.status === 'captured')
  const weekAgo = d.now - 7 * 86400000
  const entriesWeek = d.registrations.filter((r) => Date.parse(r.createdAt) > weekAgo && r.status !== 'refunded').length + d.participants.filter((p) => Date.parse(p.registeredAt) > weekAgo).length
  const bySport = useMemo(() => {
    const m = new Map<string, number>()
    d.events.forEach((e) => m.set(SPORT_META[e.sport].label, (m.get(SPORT_META[e.sport].label) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [d.events])
  const byDay = useMemo(() => {
    const out: number[] = Array(14).fill(0)
    captured.forEach((p) => {
      const k = Math.floor((d.now - Date.parse(p.at)) / 86400000)
      if (k >= 0 && k < 14) out[13 - k]++
    })
    return out
  }, [captured, d.now])
  const maxDay = Math.max(1, ...byDay)
  return (
    <div>
      <PageHeader title="Platform overview" subtitle={`Today, ${fmtDate(d.now)}`} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card><StatTile label="Organizers active" value={d.organizers.filter((o) => o.approval === 'approved').length} /></Card>
        <Card><StatTile label="Events live today" value={live.length} /></Card>
        <Card><StatTile label="Entries this week" value={entriesWeek} /></Card>
        <Card><StatTile label="Collections" value={captured.reduce((s, p) => s + p.amount, 0)} format={(n) => inr(n)} /></Card>
        <Card><StatTile label="Fees total" value={captured.reduce((s, p) => s + p.fee, 0)} format={(n) => inr(n)} tone="brand" /></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Today's queue" action={<Link to="/hq/approvals" className="t-small font-semibold text-hq-text">All approvals</Link>} />
          {pend.length === 0 ? <EmptyState compact icon={CircleCheck} title="Inbox zero" help="No organizers waiting for approval." /> : (
            <ul className="flex flex-col divide-y divide-line-subtle">
              {pend.slice(0, 6).map((a) => (
                <li key={a.id}><Link to={`/hq/approvals?id=${a.id}`} className="flex items-center gap-3 py-2.5 hover:text-fg"><KindIcon kind={a.kind} /><span className="min-w-0 flex-1"><span className="block truncate text-fg">{orgOf(d, a.organizerId)?.orgName || orgOf(d, a.organizerId)?.name}</span><span className="t-small text-fg3">{KIND_LABEL[a.kind]} · {ago(a.submittedAt, d.now)}</span></span><ArrowRight size={14} className="text-fg3" aria-hidden /></Link></li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Live events" />
          <ul className="flex flex-col divide-y divide-line-subtle">
            {live.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <EventGlyph ev={e} size={32} />
                <span className="min-w-0 flex-1"><span className="block truncate text-fg">{e.name}</span><span className="t-small text-fg3">{orgOf(d, e.organizerId)?.orgName}</span></span>
                {!e.hqOnly && <Button size="sm" variant="ghost" icon={<Eye size={14} />} onClick={() => { useUi.getState().set({ viewAs: { organizerId: e.organizerId, eventId: e.id, mode: 'view' }, persona: 'hq' }); navigate(`/e/${e.id}`) }}>Open</Button>}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Payments by day" subtitle="Last 14 days" />
          <div className="flex h-36 items-end gap-1.5" role="img" aria-label={`Payments per day over the last 14 days: ${byDay.join(', ')}`}>
            {byDay.map((v, i) => <div key={i} className="flex-1 rounded-t-sm bg-hq" style={{ height: `${(v / maxDay) * 130 + 2}px` }} />)}
          </div>
        </Card>
        <Card>
          <CardHeader title="Events by sport" />
          <ul className="flex flex-col gap-2">
            {bySport.map(([s, n]) => (
              <li key={s} className="flex items-center gap-3 text-[14px]"><span className="w-28 text-fg2">{s}</span><span className="h-2 flex-1 rounded-full bg-s3"><span className="block h-full rounded-full bg-brand" style={{ width: `${(n / d.events.length) * 100}%` }} /></span><span className="w-6 text-right tnum text-fg">{n}</span></li>
            ))}
          </ul>
          <p className="mt-4 t-small text-fg3">Visits this week: <strong className="text-fg tnum">{num(14230)}</strong> · Top event: Coimbatore Open 2026 · 68% on mobile</p>
        </Card>
      </div>
    </div>
  )
}

const KIND_LABEL: Record<Approval['kind'], string> = { organizer: 'New organizer', payout: 'Payout account', custom_category: 'Custom category' }
function KindIcon({ kind }: { kind: Approval['kind'] }) {
  const I = kind === 'organizer' ? Users : kind === 'payout' ? Wallet : ListChecks
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-hq-soft text-hq-text"><I size={16} aria-hidden /></span>
}

/* -------------------------------------------------------------- H-02 */

export function HqApprovals() {
  const d = useData()
  const confirm = useConfirm()
  const params = new URLSearchParams(window.location.search)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [kind, setKind] = useState<Approval['kind'] | null>(null)
  const [openId, setOpenId] = useState<string | null>(params.get('id'))
  const [notes, setNotes] = useState('')
  const [ask, setAsk] = useState(false)
  const list = d.approvals.filter((a) => (filter === 'all' || a.status === 'pending') && (!kind || a.kind === kind)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const cur = d.approvals.find((a) => a.id === openId)
  const org = cur ? orgOf(d, cur.organizerId) : undefined
  const decide = async (decision: 'approved' | 'rejected' | 'changes_requested') => {
    if (!cur) return
    if (decision === 'rejected' && !(await confirm({ title: 'Reject this request?', body: 'The organizer is told and can apply again. This is logged.', confirmLabel: 'Reject', tone: 'danger' }))) return
    decideApproval(cur.id, decision, notes)
    toast.success(decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Asked for changes', { body: decision === 'approved' && cur.kind === 'payout' ? `${org?.name}'s go-live checklist updates now.` : undefined })
    setOpenId(null)
    setNotes('')
    setAsk(false)
  }
  return (
    <div>
      <PageHeader title="Approvals" subtitle="New organizers, payout accounts and custom categories." />
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={filter === 'pending'} onClick={() => setFilter('pending')} count={d.approvals.filter((a) => a.status === 'pending').length}>Waiting</FilterChip>
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
        <span className="mx-1 w-px bg-line" aria-hidden />
        {(Object.keys(KIND_LABEL) as Approval['kind'][]).map((k) => <FilterChip key={k} active={kind === k} onClick={() => setKind(kind === k ? null : k)}>{KIND_LABEL[k]}</FilterChip>)}
      </div>
      {list.length === 0 ? <EmptyState icon={CircleCheck} title="Inbox zero" help="No organizers waiting for approval." /> : (
        <ul className="flex flex-col gap-2">
          {list.map((a) => {
            const o = orgOf(d, a.organizerId)
            return (
              <li key={a.id}>
                <button type="button" onClick={() => setOpenId(a.id)} className="card flex w-full items-center gap-4 p-4 text-left hover:border-line-strong">
                  <KindIcon kind={a.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-fg">{o?.orgName || o?.name} <span className="font-normal text-fg3">· {o?.name}</span></span>
                    <span className="t-small text-fg3">{KIND_LABEL[a.kind]}{a.payload?.name ? `: ${a.payload.name}` : ''} · {o?.city || 'City not set'} · {ago(a.submittedAt, d.now)}</span>
                  </span>
                  <StatusChip tone={a.status === 'pending' ? 'warning' : a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'info'}>{a.status === 'pending' ? 'Waiting' : a.status === 'changes_requested' ? 'Changes asked' : a.status[0].toUpperCase() + a.status.slice(1)}</StatusChip>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <Drawer
        open={!!cur}
        onClose={() => setOpenId(null)}
        title={cur ? KIND_LABEL[cur.kind] : ''}
        subtitle={org ? `${org.orgName || org.name} · submitted ${cur ? fmtDateTime(cur.submittedAt) : ''}` : ''}
        footer={cur?.status === 'pending' ? (
          <>
            <Button variant="ghost" onClick={() => decide('rejected')}>Reject</Button>
            <Button variant="secondary" onClick={() => setAsk(true)}>Ask for changes</Button>
            <Button variant="hq" icon={<BadgeCheck size={16} />} onClick={() => decide('approved')}>Approve</Button>
          </>
        ) : undefined}
      >
        {cur && org && (
          <div className="flex flex-col gap-5">
            <OrgCard d={d} o={org} />
            {cur.kind === 'payout' && org.payoutAccount && (
              <div className="card p-4">
                <p className="t-overline text-fg4">Payout account</p>
                <p className="font-semibold text-fg">{org.payoutAccount.type === 'upi' ? 'UPI' : 'Bank account'} · {org.payoutAccount.maskedNumber}</p>
                <p className="t-small text-fg3">Holder: {org.payoutAccount.holderName} · PAN on file (masked) · Name match: yes</p>
              </div>
            )}
            {cur.kind === 'custom_category' && (
              <div className="card p-4">
                <p className="t-overline text-fg4">Requested category</p>
                <p className="font-semibold text-fg">{cur.payload?.name}</p>
                <p className="t-small text-fg2">{cur.payload?.description}</p>
                <p className="mt-2 t-small text-fg3">Approving adds it to the shared division list for every organizer.</p>
              </div>
            )}
            <Textarea label="Risk notes (internal)" value={notes || cur.notes} onChange={(e) => setNotes(e.target.value)} placeholder="Checked club registration, spoke to the organizer..." />
          </div>
        )}
      </Drawer>
      <Dialog open={ask} onClose={() => setAsk(false)} title="Ask for changes" description="The organizer gets this message on WhatsApp and in their workspace." footer={<><Button variant="secondary" onClick={() => setAsk(false)}>Cancel</Button><Button disabled={notes.trim().length < 5} onClick={() => decide('changes_requested')}>Send</Button></>}>
        <Textarea label="Message" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Please upload a cancelled cheque in the account holder's name." />
      </Dialog>
    </div>
  )
}

function OrgCard({ d, o }: { d: DemoData; o: Organizer }) {
  const evs = d.events.filter((e) => e.organizerId === o.id)
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <Avatar name={o.name} color={o.avatarColor} size={44} />
        <div><p className="font-semibold text-fg">{o.name}</p><p className="t-small text-fg3">{o.orgName} · {o.city} · {fmtPhone(o.mobile)}</p></div>
      </div>
      <p className="t-small text-fg2">{plural(evs.length, 'event')} · joined {fmtDate(o.joinedAt)} · {o.eventsPerYear ?? '?'} events a year</p>
      {evs.length > 0 && <ul className="flex flex-col gap-1">{evs.slice(0, 4).map((e) => <li key={e.id} className="flex items-center gap-2 t-small text-fg2"><EventGlyph ev={e} size={20} /> {e.name} <StatusPill status={e.status} /></li>)}</ul>}
    </div>
  )
}

/* -------------------------------------------------------------- H-03 */

export function HqOrganizers() {
  const d = useData()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [st, setSt] = useState<string | null>(null)
  const rows = d.organizers.filter((o) => (!st || o.approval === st) && `${o.name} ${o.orgName} ${o.city}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <PageHeader title="Organizers" subtitle={`${d.organizers.length} organizers`} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Input aria-label="Search organizers" placeholder="Search name, club or city" value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />
        {['approved', 'pending', 'not_started', 'rejected'].map((s) => <FilterChip key={s} active={st === s} onClick={() => setSt(st === s ? null : s)}>{s === 'not_started' ? 'New' : s[0].toUpperCase() + s.slice(1)}</FilterChip>)}
      </div>
      <DataTable
        caption="Organizers"
        rows={rows}
        rowKey={(o) => o.id}
        onRowClick={(o) => navigate(`/hq/organizers/${o.id}`)}
        mobileTitle={(o) => <span className="font-semibold text-fg">{o.orgName || o.name}</span>}
        columns={[
          { key: 'o', header: 'Organization', sortValue: (o) => o.orgName, cell: (o) => <span className="flex items-center gap-3"><Avatar name={o.name} color={o.avatarColor} size={30} /><span><span className="block font-semibold text-fg">{o.orgName || 'Not set'}</span><span className="t-small text-fg3">{o.name}</span></span></span> },
          { key: 'c', header: 'City', mobile: true, cell: (o) => o.city || '-' },
          { key: 's', header: 'Status', mobile: true, cell: (o) => <StatusChip tone={o.approval === 'approved' ? 'success' : o.approval === 'pending' ? 'warning' : o.approval === 'rejected' ? 'danger' : 'neutral'}>{o.approval === 'not_started' ? 'New' : o.approval === 'changes_requested' ? 'Changes asked' : o.approval[0].toUpperCase() + o.approval.slice(1)}</StatusChip> },
          { key: 'p', header: 'Payout', mobile: true, cell: (o) => (o.payoutAccount ? <StatusChip tone={o.payoutAccount.status === 'verified' ? 'success' : 'warning'}>{o.payoutAccount.status === 'verified' ? 'Verified' : 'Under review'}</StatusChip> : <span className="text-fg3">None</span>) },
          { key: 'e', header: 'Events', align: 'right', mobile: true, cell: (o) => d.events.filter((e) => e.organizerId === o.id).length },
          { key: 'j', header: 'Joined', optional: true, cell: (o) => fmtDate(o.joinedAt) },
        ]}
      />
    </div>
  )
}

export function HqOrganizerDetail() {
  const { orgId } = useParams()
  const d = useData()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const o = d.organizers.find((x) => x.id === orgId)
  const [msg, setMsg] = useState(false)
  const [text, setText] = useState('')
  if (!o) return <EmptyState icon={Users} title="Organizer not found" help="They may have been removed." />
  const evs = d.events.filter((e) => e.organizerId === o.id)
  const mems = d.members.filter((m) => m.organizerId === o.id)
  const pays = evs.flatMap((e) => paymentsOf(d, e.id))
  const view = (e: EventItem) => {
    useUi.getState().set({ persona: 'hq', viewAs: { organizerId: o.id, eventId: e.id, mode: 'view' }, currentEventId: e.id })
    navigate(`/e/${e.id}`)
  }
  const take = async (e: EventItem) => {
    if (e.takenOver) {
      setTakeOver(e.id, false)
      toast.success('Handed back to the organizer')
      return
    }
    if (!(await confirm({ title: `Take over ${e.name}?`, body: `Rizzfitt can edit everything in this event. ${o.name} sees a banner saying Rizzfitt is managing the event.`, confirmLabel: 'Take over event', tone: 'danger' }))) return
    setTakeOver(e.id, true)
    useUi.getState().set({ persona: 'hq', viewAs: { organizerId: o.id, eventId: e.id, mode: 'takeover' }, currentEventId: e.id })
    navigate(`/e/${e.id}`)
  }
  return (
    <div>
      <Link to="/hq/organizers" className="mb-3 inline-flex t-small font-semibold text-fg3 hover:text-fg">Organizers</Link>
      <PageHeader title={o.orgName || o.name} subtitle={`${o.name} · ${o.city || 'City not set'} · ${fmtPhone(o.mobile)}`} actions={<Button variant="secondary" icon={<MessageCircle size={16} />} onClick={() => setMsg(true)}>Send message</Button>} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader title="Events" />
          {evs.length === 0 && <p className="text-fg3">No events yet.</p>}
          <ul className="flex flex-col divide-y divide-line-subtle">
            {evs.map((e) => (
              <li key={e.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <EventGlyph ev={e} size={36} />
                  <span className="min-w-0"><span className="block truncate font-semibold text-fg">{e.name}</span><span className="t-small text-fg3">{TYPE_META[e.type].label} · {fmtDate(e.startDate)} · {entryCount(d, e.id)} entries · {inr(collected(d, e.id))}</span></span>
                </span>
                <StatusPill status={e.status} />
                {e.takenOver && <StatusChip tone="hq">Rizzfitt managing</StatusChip>}
                {!e.hqOnly && (
                  <span className="flex gap-1">
                    <Button size="sm" variant="ghost" icon={<Eye size={14} />} onClick={() => view(e)}>View as organizer</Button>
                    <Button size="sm" variant={e.takenOver ? 'secondary' : 'hq'} onClick={() => take(e)}>{e.takenOver ? 'Hand back' : 'Take over event'}</Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <div className="flex flex-col gap-4">
          <OrgCard d={d} o={o} />
          <Card>
            <CardHeader title="Team" />
            {mems.length ? <ul className="flex flex-col gap-1.5">{mems.map((m) => <li key={m.id} className="flex justify-between t-small"><span className="text-fg">{m.name}</span><span className="text-fg3">{m.role.replace('_', ' ')}</span></li>)}</ul> : <p className="t-small text-fg3">Just the owner.</p>}
          </Card>
          <Card>
            <CardHeader title="Payments" />
            <p className="text-fg2">{plural(pays.length, 'payment')} · {inr(pays.filter((p) => p.status === 'captured').reduce((s, p) => s + p.amount, 0))} captured</p>
            <p className="t-small text-fg3">Payout account: {o.payoutAccount ? `${o.payoutAccount.maskedNumber}, ${o.payoutAccount.status}` : 'not connected'}</p>
          </Card>
        </div>
      </div>
      <Dialog open={msg} onClose={() => setMsg(false)} title={`Message ${o.name}`} footer={<><Button variant="secondary" onClick={() => setMsg(false)}>Cancel</Button><Button disabled={text.trim().length < 3} onClick={() => { setMsg(false); setText(''); toast.success('Message sent on WhatsApp') }}>Send</Button></>}>
        <Textarea label="Message" value={text} onChange={(e) => setText(e.target.value)} />
      </Dialog>
    </div>
  )
}

export function HqEvents() {
  const d = useData()
  const navigate = useNavigate()
  const [st, setSt] = useState<string | null>(null)
  const rows = d.events.filter((e) => !st || e.status === st).sort((a, b) => b.startDate.localeCompare(a.startDate))
  return (
    <div>
      <PageHeader title="All events" subtitle={`${d.events.length} events across ${d.organizers.length} organizers`} />
      <div className="mb-4 flex flex-wrap gap-2">{['live', 'registrations_open', 'scheduled', 'awaiting_approval', 'draft', 'completed'].map((s) => <FilterChip key={s} active={st === s} onClick={() => setSt(st === s ? null : s)}>{s.replace('_', ' ')}</FilterChip>)}</div>
      <DataTable
        caption="All events"
        rows={rows}
        rowKey={(e) => e.id}
        onRowClick={(e) => navigate(`/hq/organizers/${e.organizerId}`)}
        mobileTitle={(e) => <span className="font-semibold text-fg">{e.name}</span>}
        columns={[
          { key: 'n', header: 'Event', sortValue: (e) => e.name, cell: (e) => <span className="flex items-center gap-2"><EventGlyph ev={e} size={28} /><span className="font-semibold text-fg">{e.name}</span></span> },
          { key: 'o', header: 'Organizer', mobile: true, cell: (e) => orgOf(d, e.organizerId)?.orgName },
          { key: 't', header: 'Type', cell: (e) => `${SPORT_META[e.sport].label}, ${TYPE_META[e.type].label.toLowerCase()}` },
          { key: 'd', header: 'Date', mobile: true, sortValue: (e) => e.startDate, cell: (e) => fmtDate(e.startDate) },
          { key: 's', header: 'Status', mobile: true, cell: (e) => <StatusPill status={e.status} /> },
          { key: 'v', header: 'Created', optional: true, cell: (e) => (e.createdVia === 'self_serve' ? 'Self-serve' : 'Rizzfitt team') },
          { key: 'en', header: 'Entries', align: 'right', cell: (e) => entryCount(d, e.id) },
          { key: 'c', header: 'Collected', align: 'right', cell: (e) => inr(collected(d, e.id)) },
        ]}
      />
    </div>
  )
}

/* -------------------------------------------------------------- H-04 */

const SCREENS = ['Dashboard', 'Overview & Registration', 'Upload Players', 'Teams', 'Tournament Players', 'Categories', 'Generate Fixture', 'Manage Fixture', 'Court Assignment', 'Umpire Management', 'Sponsors', 'Live TV Media', 'Live TV Configuration', 'Tournament Configuration', 'Reports', 'Email Broadcast']
const PERMS = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Export']

export function HqPlatform() {
  const d = useData()
  const confirm = useConfirm()
  const [tab, setTab] = useState<'fees' | 'masters' | 'payments' | 'access' | 'integrations'>('fees')
  const [feeEdit, setFeeEdit] = useState<{ id: string; amount: string; note: string } | null>(null)
  const [newMaster, setNewMaster] = useState({ kind: 'division' as 'category' | 'division', name: '' })
  const [payEvent, setPayEvent] = useState('')
  const [payStatus, setPayStatus] = useState<string | null>(null)
  const [ref, setRef] = useState('')
  const [settle, setSettle] = useState(false)
  const [grid, setGrid] = useState<Record<string, boolean>>({})
  const [keyName, setKeyName] = useState('')
  const pays = d.payments.filter((p) => (!payEvent || p.eventId === payEvent) && (!payStatus || p.status === payStatus) && (!ref || p.orderRef.toLowerCase().includes(ref.toLowerCase()) || p.paymentRef.toLowerCase().includes(ref.toLowerCase()))).sort((a, b) => b.at.localeCompare(a.at))
  return (
    <div>
      <PageHeader title="Platform" subtitle="Settings only Rizzfitt can change." />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'fees', label: 'Fees' }, { value: 'masters', label: 'Masters' }, { value: 'payments', label: 'Payments', count: d.payments.length }, { value: 'access', label: 'Access' }, { value: 'integrations', label: 'Integrations' }]} />
      {tab === 'fees' && (
        <Card>
          <CardHeader title="Platform fees" subtitle="Organizers see one fees total in Money. Rates appear only here." />
          <ul className="flex flex-col divide-y divide-line-subtle">
            {d.fees.map((f) => (
              <li key={f.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                <span className="flex-1"><span className="block font-semibold text-fg">{f.label}</span><span className="t-small text-fg3">{f.appliesTo} · updated {fmtDate(f.updatedAt)}{f.note ? ` · ${f.note}` : ''}</span></span>
                <code className="rounded-sm bg-s2 px-2 py-1 text-[13px] text-fg">{f.amount}</code>
                <Button size="sm" variant="secondary" onClick={() => setFeeEdit({ id: f.id, amount: f.amount, note: '' })}>Edit</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {tab === 'masters' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {(['category', 'division'] as const).map((kind) => {
            const list = (kind === 'category' ? d.categoryMasters : d.divisionMasters).slice().sort((a, b) => a.position - b.position)
            return (
              <Card key={kind}>
                <CardHeader title={kind === 'category' ? 'Categories' : 'Divisions'} subtitle="Shared by every organizer." />
                <ul className="flex flex-col gap-1.5">
                  {list.map((m, i) => (
                    <li key={m.id} className={cn('flex items-center gap-2 rounded-md border border-line-subtle bg-s1 px-3 py-1.5', m.archived && 'opacity-50')}>
                      <span className="w-6 t-small text-fg3 tnum">{i + 1}</span>
                      <span className="flex-1 text-fg">{m.name}</span>
                      {m.archived && <StatusChip tone="neutral">Archived</StatusChip>}
                      <button type="button" aria-label={`Move ${m.name} up`} disabled={i === 0} onClick={() => moveMaster(kind, m.id, -1)} className="flex h-8 w-8 items-center justify-center text-fg3 disabled:opacity-30"><ArrowUp size={14} /></button>
                      <button type="button" aria-label={`Move ${m.name} down`} disabled={i === list.length - 1} onClick={() => moveMaster(kind, m.id, 1)} className="flex h-8 w-8 items-center justify-center text-fg3 disabled:opacity-30"><ArrowDown size={14} /></button>
                      <button type="button" aria-label={m.archived ? `Restore ${m.name}` : `Archive ${m.name}`} onClick={() => archiveMaster(kind, m.id, !m.archived)} className="flex h-8 w-8 items-center justify-center text-fg3 hover:text-fg"><Archive size={14} /></button>
                    </li>
                  ))}
                </ul>
                <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newMaster.name.trim().length < 2) return; addMaster(kind, newMaster.name.trim()); setNewMaster({ kind, name: '' }); toast.success('Added to the shared list') }}>
                  <Input aria-label={`New ${kind}`} placeholder={`New ${kind}`} className="flex-1" value={newMaster.kind === kind ? newMaster.name : ''} onChange={(e) => setNewMaster({ kind, name: e.target.value })} />
                  <Button type="submit" variant="secondary" icon={<Plus size={14} />}>Add</Button>
                </form>
              </Card>
            )
          })}
          <Card className="lg:col-span-2">
            <CardHeader title="Custom requests" />
            <ul>{d.approvals.filter((a) => a.kind === 'custom_category').map((a) => <li key={a.id} className="flex items-center justify-between py-1.5 text-[14px]"><span className="text-fg">{a.payload?.name} <span className="text-fg3">from {orgOf(d, a.organizerId)?.orgName}</span></span><Link to={`/hq/approvals?id=${a.id}`} className="t-small font-semibold text-hq-text">{a.status === 'pending' ? 'Review' : a.status}</Link></li>)}</ul>
          </Card>
        </div>
      )}
      {tab === 'payments' && (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <Select label="Event" className="w-64" value={payEvent} onChange={(e) => setPayEvent(e.target.value)} options={[{ value: '', label: 'All events' }, ...d.events.map((e) => ({ value: e.id, label: e.name }))]} />
            <Input label="Order or payment ID" className="w-56" value={ref} onChange={(e) => setRef(e.target.value)} />
            <div className="flex gap-2">{['captured', 'refunded', 'failed'].map((s) => <FilterChip key={s} active={payStatus === s} onClick={() => setPayStatus(payStatus === s ? null : s)}>{s}</FilterChip>)}</div>
            <Button variant="secondary" className="ml-auto" icon={<Upload size={16} />} onClick={() => setSettle(true)}>Upload settlement</Button>
          </div>
          <DataTable
            caption="All payments"
            rows={pays.slice(0, 200)}
            rowKey={(p) => p.id}
            mobileTitle={(p) => <span className="font-semibold text-fg">{p.customer}</span>}
            columns={[
              { key: 'at', header: 'Created', sortValue: (p) => p.at, cell: (p) => fmtDateTime(p.at) },
              { key: 'e', header: 'Event', mobile: true, cell: (p) => d.events.find((e) => e.id === p.eventId)?.name },
              { key: 'o', header: 'Order', cell: (p) => <code className="text-[12px] text-fg3">{p.orderRef}</code> },
              { key: 'pid', header: 'Payment', optional: true, cell: (p) => <code className="text-[12px] text-fg3">{p.paymentRef}</code> },
              { key: 'c', header: 'Paid by', cell: (p) => p.customer },
              { key: 'a', header: 'Amount', align: 'right', mobile: true, sortValue: (p) => p.amount, cell: (p) => inr(p.amount) },
              { key: 'f', header: 'Fee', align: 'right', cell: (p) => inr(p.fee) },
              { key: 'm', header: 'Method', optional: true, cell: (p) => p.method },
              { key: 's', header: 'Status', mobile: true, cell: (p) => <StatusChip tone={p.status === 'captured' ? 'success' : p.status === 'refunded' ? 'neutral' : 'danger'}>{p.status}</StatusChip> },
            ]}
          />
        </>
      )}
      {tab === 'access' && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="HQ team and roles" subtitle="Organizer is the new role: modules follow from setup answers." />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[14px]">
                <thead><tr className="t-overline text-fg4"><th className="py-2 text-left">Name</th><th className="text-left">Role</th><th>Email login</th><th>Mobile login</th><th>Username login</th><th>Active</th></tr></thead>
                <tbody>
                  {d.hqUsers.map((u) => (
                    <tr key={u.id} className="border-t border-line-subtle">
                      <td className="py-2.5"><span className="block font-semibold text-fg">{u.name}</span><span className="t-small text-fg3">{u.email}</span></td>
                      <td><select aria-label={`${u.name} role`} value={u.role} onChange={(e) => updateHqUser(u.id, { role: e.target.value as typeof u.role })} className="h-9 rounded-md border border-line bg-s2 px-2 text-fg">{['super_admin', 'admin', 'organizer', 'user', 'trainer'].map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}</select>{u.role === 'organizer' && <StatusChip tone="hq" className="ml-2">New</StatusChip>}</td>
                      {(['email', 'mobile', 'username'] as const).map((k) => <td key={k} className="text-center"><input type="checkbox" aria-label={`${u.name} ${k} login`} checked={u.login[k]} onChange={(e) => updateHqUser(u.id, { login: { ...u.login, [k]: e.target.checked } })} className="h-4 w-4 accent-[var(--hq)]" /></td>)}
                      <td className="text-center"><Toggle hideLabel label={`${u.name} active`} checked={u.active} onChange={(v) => updateHqUser(u.id, { active: v })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <CardHeader title="Permission overrides" subtitle="For edge cases only. Organizers normally get permissions from their setup answers. Showing 16 of 64 screens." />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead><tr className="t-overline text-fg4"><th className="py-2 text-left">Screen</th>{PERMS.map((p) => <th key={p}>{p}</th>)}</tr></thead>
                <tbody>
                  {SCREENS.map((s) => (
                    <tr key={s} className="border-t border-line-subtle">
                      <td className="py-1.5 text-fg2">{s}</td>
                      {PERMS.map((p) => { const k = `${s}:${p}`; const v = grid[k] ?? p === 'View'; return <td key={p} className="text-center"><input type="checkbox" aria-label={`${s} ${p}`} checked={v} onChange={(e) => setGrid({ ...grid, [k]: e.target.checked })} className="h-4 w-4 accent-[var(--hq)]" /></td> })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
      {tab === 'integrations' && (
        <Card>
          <CardHeader title="API keys" subtitle="Court displays, scoreboards and the DUPR sync worker." />
          <ul className="flex flex-col divide-y divide-line-subtle">
            {d.apiKeys.map((k) => (
              <li key={k.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                <KeyRound size={18} className="text-fg3" aria-hidden />
                <span className="flex-1"><span className="block font-semibold text-fg">{k.name}</span><span className="t-small text-fg3"><code>{k.masked}</code> · {k.scopes.join(', ')} · {k.rateLimit}/min</span></span>
                <StatusChip tone={k.status === 'active' ? 'success' : 'neutral'}>{k.status}</StatusChip>
                {k.status === 'active' && <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={async () => { if (await confirm({ title: `Revoke ${k.name}?`, body: 'Anything using this key stops working straight away.', confirmLabel: 'Revoke key', tone: 'danger' })) { revokeKey(k.id); toast.success('Key revoked') } }}>Revoke</Button>}
              </li>
            ))}
          </ul>
          <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (keyName.trim().length < 3) return; createKey(keyName.trim(), ['scores:read']); setKeyName(''); toast.success('Key created', { body: 'Shown once. Copy it to the device now.' }) }}>
            <Input aria-label="New key name" placeholder="New key name" className="flex-1" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
            <Button type="submit" variant="secondary" icon={<Plus size={14} />}>Create key</Button>
          </form>
        </Card>
      )}
      <Dialog open={!!feeEdit} onClose={() => setFeeEdit(null)} title="Edit fee" description="Every change is logged with your note." footer={<><Button variant="secondary" onClick={() => setFeeEdit(null)}>Cancel</Button><Button variant="hq" disabled={!feeEdit || feeEdit.note.trim().length < 3} onClick={() => { updateFee(feeEdit!.id, feeEdit!.amount, feeEdit!.note); setFeeEdit(null); toast.success('Fee updated and logged') }}>Save</Button></>}>
        {feeEdit && <div className="flex flex-col gap-3"><Input label="Amount" value={feeEdit.amount} onChange={(e) => setFeeEdit({ ...feeEdit, amount: e.target.value })} /><Input label="Audit note (required)" value={feeEdit.note} onChange={(e) => setFeeEdit({ ...feeEdit, note: e.target.value })} /></div>}
      </Dialog>
      <Drawer open={settle} onClose={() => setSettle(false)} title="Upload Razorpay settlement">
        <FileDropzone label="Settlement file" hint="CSV from the Razorpay dashboard" samples={['razorpay-settlement-oct-17.csv']} accept=".csv" onPick={(n) => { setSettle(false); toast.success(`${n} reconciled`, { body: '209 payments matched, 0 mismatches.' }) }} />
      </Drawer>
    </div>
  )
}

/* -------------------------------------------------------------- H-05 */

const NEW: { t: string; phase: number; to: string }[] = [
  { t: 'Guided setup wizard with branching by event type and sport', phase: 1, to: '/setup/evt-cdn/format' },
  { t: 'Organizer role with modules switched on by setup answers', phase: 1, to: '/e/evt-szl' },
  { t: 'Organizer sign-up with mobile OTP, and HQ approval before taking money', phase: 1, to: '/start' },
  { t: 'Payout account onboarding (bank or UPI, KYC status)', phase: 1, to: '/account' },
  { t: 'Match rule defaults per category', phase: 1, to: '/e/evt-cbe/settings' },
  { t: 'One consistent registration count everywhere', phase: 0, to: '/e/evt-cbe/registrations' },
  { t: 'Schedule as a per-category checklist, plus courts-and-times auto-assign', phase: 1, to: '/e/evt-cbe/schedule' },
  { t: 'Organizer score entry and correction with an audit trail', phase: 1, to: '/e/evt-cbe/match-day' },
  { t: 'Match day court map with live status and blockers feed', phase: 1, to: '/e/evt-cbe/match-day' },
  { t: 'WhatsApp messaging and message templates', phase: 3, to: '/e/evt-cbe/messages' },
  { t: 'Launch kit: event page theming, poster generator, templates', phase: 3, to: '/e/evt-cbe/launch-kit' },
  { t: 'Confirmation for destructive and live-changing actions', phase: 0, to: '/e/evt-cbe/settings' },
  { t: 'Co-organizer invites with simple roles', phase: 1, to: '/e/evt-cbe/settings' },
  { t: 'HQ console: approvals, organizer list, View as organizer, Take over', phase: 1, to: '/hq/approvals' },
  { t: 'Custom category requests reviewed by HQ', phase: 2, to: '/hq/platform' },
]
const PHASES = [
  { n: 0, name: 'Make it safe', scope: 'Hide internal notes and fee rates from organizers, confirm live switches, fix count mismatches', gate: 'Safe to share with new organizers', modules: ['Registrations', 'Money', 'Settings'] },
  { n: 1, name: 'Tournaments', scope: 'Setup wizard (tournament branch), Organizer role, Registrations, Schedule, Match day, Home', gate: '3 organizers run an event without team help', modules: ['Home', 'Schedule', 'Match day', 'Umpire app', 'Court TV', 'Results'] },
  { n: 2, name: 'Leagues and auctions', scope: 'League, auction and draft branches, team builder, ties and line-ups, auction room', gate: '1 league run without team help', modules: ['Team builder', 'Ties & line-ups', 'Auction room', 'Draft board'] },
  { n: 3, name: 'Grow', scope: 'Launch kit, WhatsApp, social events, organizer analytics, open sign-ups', gate: 'Open sign-up from the website', modules: ['Launch kit', 'Messages', 'Participants', 'Landing page'] },
]
const ASSUMPTIONS = [
  ['Umpire scoring', 'Umpires score in a phone web app opened from a court link or QR code. No install. Results need a final confirmation.', '/u/evt-cbe-c1'],
  ['Payouts', "Players pay through Rizzfitt's Razorpay. Rizzfitt pays out to the organizer after fees, on a schedule shown in Money.", '/e/evt-cbe/money'],
  ['Pricing', 'Creating events is free; a per-entry platform fee applies to online payments, shown as [PLATFORM FEE].', '/hq/platform'],
  ['Public pages', 'Every event gets a microsite at rizzfitt.com/e/[event-slug] with registration, schedule, live scores and brackets.', '/p/coimbatore-open-2026'],
  ['Draft leagues', 'Draft leagues work as a setup branch with a draft board (they do not open today).', '/setup/evt-cdn/format'],
  ['Cricket scoring', 'Cricket scoring is simplified (runs, wickets, overs).', '/setup/evt-cdn/event'],
  ['WhatsApp', 'Messages go out from a Rizzfitt business number. The prototype simulates sending.', '/e/evt-cbe/messages'],
  ['Approvals', "Rizzfitt approves new organizers' payout accounts, usually within a day.", '/hq/approvals'],
]

export function HqWhatsNew() {
  return (
    <div>
      <PageHeader title="What's new in this design" subtitle="Build scope, rollout phases and assumptions to confirm. Each item opens the screen that shows it." />
      <section className="mb-8">
        <h2 className="mb-3 t-h2 text-fg">New capabilities</h2>
        <ul className="grid gap-2 md:grid-cols-2">
          {NEW.map((n, i) => (
            <li key={n.t}><Link to={n.to} className="card flex items-center gap-3 p-4 hover:border-line-strong"><span className="w-6 t-small font-bold text-fg3 tnum">{i + 1}</span><span className="flex-1 text-fg">{n.t}</span><StatusChip tone="hq">Phase {n.phase}</StatusChip><StatusChip tone="brand">New</StatusChip></Link></li>
          ))}
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="mb-3 t-h2 text-fg">Rollout phases</h2>
        <ol className="grid gap-3 lg:grid-cols-4">
          {PHASES.map((p) => (
            <li key={p.n} className="card flex flex-col gap-2 p-5">
              <SpotIcon icon={p.n === 0 ? ShieldCheck : p.n === 1 ? Gauge : p.n === 2 ? Users : Sparkles} size={44} color="var(--hq-text)" float={false} />
              <p className="t-overline text-hq-text">Phase {p.n}</p>
              <p className="t-title text-fg">{p.name}</p>
              <p className="t-small text-fg2">{p.scope}</p>
              <p className="t-small text-fg3">Gate: {p.gate}</p>
              <div className="mt-1 flex flex-wrap gap-1">{p.modules.map((m) => <StatusChip key={m} tone="neutral">{m}</StatusChip>)}</div>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h2 className="mb-3 t-h2 text-fg">Assumptions to confirm</h2>
        <ul className="flex flex-col gap-2">
          {ASSUMPTIONS.map(([t, b, to], i) => (
            <li key={t}><Link to={to} className="card flex items-start gap-4 p-4 hover:border-line-strong"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hq-soft font-bold text-hq-text tnum">{i + 1}</span><span className="flex-1"><span className="block font-semibold text-fg">{t}</span><span className="t-small text-fg2">{b}</span></span><ArrowRight size={16} className="mt-1 text-fg3" aria-hidden /></Link></li>
          ))}
        </ul>
      </section>
    </div>
  )
}
