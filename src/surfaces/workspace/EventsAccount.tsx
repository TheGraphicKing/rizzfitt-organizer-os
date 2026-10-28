import { useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, Copy, Headset, LogOut, Plus, Users } from 'lucide-react'
import { useData } from '../../store/hooks'
import { useUi, mutate } from '../../store/store'
import { createDraftEvent, SETUP_STEPS } from '../../store/actions'
import { collected, entryCount } from '../../store/selectors'
import { Logo, ContactSheet } from '../../components/ui/Misc'
import { Button } from '../../components/ui/Button'
import { FilterChip, Toggle, StatusChip } from '../../components/ui/Controls'
import { Card, CardHeader } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Display'
import { toast, useConfirm } from '../../components/ui/Overlay'
import { EventGlyph, PageHeader } from './shared'
import { StatusPill } from './WorkspaceLayout'
import { PayoutCard, PayoutSheet } from '../setup/steps/RegistrationStep'
import { SPORT_META, TYPE_META } from '../../mock/constants'
import { fmtPhone, fmtRange, inr, num } from '../../lib/format'
import { accentVars } from '../../lib/color'
import { cn } from '../../lib/cn'
import type { EventItem } from '../../mock/types'

function OrganizerShell({ children }: { children: ReactNode }) {
  const d = useData()
  const ui = useUi()
  const navigate = useNavigate()
  const org = d.organizers.find((o) => o.id === ui.organizerId)
  const [talk, setTalk] = useState(false)
  if (!org) return <Navigate to="/start" replace />
  return (
    <div className="floodlight min-h-dvh bg-base">
      <header className="glass sticky top-0 z-30 border-b border-line-subtle">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6">
          <Link to="/events" aria-label="All my events">
            <Logo size="sm" />
          </Link>
          <nav className="ml-4 hidden gap-1 sm:flex" aria-label="Organizer">
            <Link to="/events" className="rounded-md px-3 py-2 text-[14px] font-semibold text-fg2 hover:text-fg">
              Events
            </Link>
            <Link to="/account" className="rounded-md px-3 py-2 text-[14px] font-semibold text-fg2 hover:text-fg">
              Account
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setTalk(true)} className="hidden h-10 items-center gap-2 rounded-md px-3 text-[14px] font-semibold text-fg2 hover:bg-s2 sm:flex">
              <Headset size={16} aria-hidden /> Talk to Rizzfitt
            </button>
            <Link to="/account" aria-label="Account">
              <Avatar name={org.name} color={org.avatarColor} size={34} />
            </Link>
            <button
              type="button"
              aria-label="Sign out"
              onClick={() => {
                ui.set({ organizerId: null })
                navigate('/')
              }}
              className="flex h-10 w-10 items-center justify-center rounded-md text-fg3 hover:bg-s2 hover:text-fg"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[1280px] px-4 py-8 pb-24 sm:px-6">
        {children}
      </main>
      <ContactSheet open={talk} onClose={() => setTalk(false)} />
    </div>
  )
}

type Filter = 'all' | 'upcoming' | 'live' | 'past' | 'drafts'
function bucket(e: EventItem): Exclude<Filter, 'all'> {
  if (!e.setup.completed || e.status === 'draft' || e.status === 'awaiting_approval') return 'drafts'
  if (e.status === 'live') return 'live'
  if (e.status === 'completed') return 'past'
  return 'upcoming'
}

/** W-16 */
export function EventsPage() {
  const d = useData()
  const ui = useUi()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const mine = d.events.filter((e) => e.organizerId === ui.organizerId).sort((a, b) => (bucket(a) === 'live' ? -1 : 0) - (bucket(b) === 'live' ? -1 : 0) || b.createdAt.localeCompare(a.createdAt))
  const shown = mine.filter((e) => filter === 'all' || bucket(e) === filter)
  const org = d.organizers.find((o) => o.id === ui.organizerId)
  const past = mine.find((e) => e.setup.completed && e.type === 'tournament')
  const newEvent = (dup?: EventItem) => {
    const id = createDraftEvent(ui.organizerId!, dup ? { name: `${dup.name.replace(/ 20\d\d$/, '')} 2027` } : undefined)
    if (dup)
      mutate((dd) => {
        const e = dd.events.find((x) => x.id === id)!
        e.sport = dup.sport
        e.courts = dup.courts
        e.venue = { ...dup.venue }
        e.accent = dup.accent
        e.logo = dup.logo
        e.setup.orgName = dup.setup.orgName
        e.setup.city = dup.setup.city
        dd.categories = dd.categories.filter((c) => c.eventId !== id)
        dd.categories.filter((c) => c.eventId === dup.id).forEach((c) => dd.categories.push({ ...c, id: `${id}-c-${c.categoryId}-${c.divisionId}`, eventId: id, stage: 'registrations', entriesClosed: false }))
      })
    ui.set({ currentEventId: id })
    navigate(`/setup/${id}/${dup ? 'event' : 'you'}`)
    if (dup) toast.success('Copied from ' + dup.name, { body: 'Categories, prices and venue carried over.' })
  }
  return (
    <OrganizerShell>
      <PageHeader
        title="All my events"
        subtitle={org ? `${org.orgName || org.name}` : undefined}
        actions={
          <>
            {past && (
              <Button variant="secondary" icon={<Copy size={16} />} onClick={() => newEvent(past)}>
                Duplicate a past event
              </Button>
            )}
            <Button icon={<Plus size={16} />} onClick={() => newEvent()}>
              New event
            </Button>
          </>
        }
      />
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {(['all', 'live', 'upcoming', 'past', 'drafts'] as Filter[]).map((f) => (
          <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)} count={f === 'all' ? mine.length : mine.filter((e) => bucket(e) === f).length}>
            {f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
          </FilterChip>
        ))}
      </div>
      {shown.length === 0 && <p className="py-16 text-center text-fg3">No events here yet.</p>}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((e) => {
          const draft = !e.setup.completed
          const to = draft ? `/setup/${e.id}/${SETUP_STEPS[Math.min(7, e.setup.step - 1)]}` : `/e/${e.id}`
          return (
            <li key={e.id} style={accentVars(e.accent) as React.CSSProperties}>
              <Link to={to} className="card group flex h-full flex-col gap-4 p-5 transition-[box-shadow,border-color] hover:border-[var(--event-accent)] hover:shadow-[0_10px_40px_-12px_var(--event-accent-glow)]">
                <div className="flex items-start gap-3">
                  <EventGlyph ev={e} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate t-title text-fg">{e.name || 'Untitled event'}</p>
                    <p className="t-small text-fg3">
                      {SPORT_META[e.sport].label} {TYPE_META[e.type].label.toLowerCase()}
                    </p>
                  </div>
                  {draft ? <StatusChip tone="warning">Setup {Math.round(((e.setup.step - 1) / 8) * 100)}%</StatusChip> : <StatusPill status={e.status} />}
                </div>
                <p className="text-fg2">{fmtRange(e.startDate, e.endDate)}</p>
                <div className="mt-auto flex items-end justify-between">
                  {draft ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-brand-text">
                      Continue setup <ArrowRight size={16} aria-hidden />
                    </span>
                  ) : (
                    <div>
                      <p className="t-overline text-fg4">{e.type === 'social' ? 'Participants' : 'Entries'}</p>
                      <p className="t-h2 text-fg tnum">{num(entryCount(d, e.id))}</p>
                    </div>
                  )}
                  {!draft && <span className="t-small text-fg3 tnum">{inr(collected(d, e.id))}</span>}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </OrganizerShell>
  )
}

/** W-17 */
export function AccountPage() {
  const d = useData()
  const ui = useUi()
  const confirm = useConfirm()
  const org = d.organizers.find((o) => o.id === ui.organizerId)
  const [payout, setPayout] = useState(false)
  const [prefs, setPrefs] = useState({ whatsapp: true, email: true, daily: false })
  if (!org) return <Navigate to="/start" replace />
  const team = d.members.filter((m) => m.organizerId === org.id)
  return (
    <OrganizerShell>
      <PageHeader title="Account" subtitle="Your profile, payouts and team." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" />
          <div className="flex items-center gap-4">
            <Avatar name={org.name} color={org.avatarColor} size={56} />
            <div>
              <p className="t-title text-fg">{org.name}</p>
              <p className="t-small text-fg3">
                {fmtPhone(org.mobile)} · {org.email}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <dt className="t-overline text-fg4">Organization</dt>
              <dd className="text-fg">{org.orgName || 'Not set'}</dd>
            </div>
            <div>
              <dt className="t-overline text-fg4">City</dt>
              <dd className="text-fg">{org.city || 'Not set'}</dd>
            </div>
            <div>
              <dt className="t-overline text-fg4">Organizer status</dt>
              <dd>
                <StatusChip tone={org.approval === 'approved' ? 'success' : org.approval === 'pending' ? 'warning' : 'neutral'}>{org.approval === 'approved' ? 'Approved' : org.approval === 'pending' ? 'Under review' : org.approval === 'not_started' ? 'Not submitted' : org.approval}</StatusChip>
              </dd>
            </div>
          </dl>
        </Card>
        <Card>
          <CardHeader title="Payout account" subtitle="Where Rizzfitt sends your online collections after fees." />
          <PayoutCard
            status={org.payoutAccount?.status}
            masked={org.payoutAccount?.maskedNumber}
            onConnect={async () => {
              if (org.payoutAccount?.status === 'verified') {
                const ok = await confirm({ title: 'Change your payout account?', body: 'The new account needs to be verified again. Payouts pause until it is.', confirmLabel: 'Change account', tone: 'danger' })
                if (!ok) return
              }
              setPayout(true)
            }}
          />
          <p className="mt-3 t-small text-fg3">Payouts run every week. Fees: [PLATFORM FEE] per online entry, shown before each payout.</p>
        </Card>
        <Card>
          <CardHeader title="Your team" subtitle="Co-organizers across your events. Manage roles in each event's Settings." icon={<Users size={18} className="mt-1 text-fg3" aria-hidden />} />
          {team.length === 0 && <p className="text-fg3">Just you for now.</p>}
          <ul className="flex flex-col divide-y divide-line-subtle">
            {team.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <Avatar name={m.name} size={32} />
                <span className="flex-1 text-fg">{m.name}</span>
                <StatusChip tone="neutral">{m.role === 'court_captain' ? 'Court captain' : m.role[0].toUpperCase() + m.role.slice(1)}</StatusChip>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Notifications" icon={<Bell size={18} className="mt-1 text-fg3" aria-hidden />} />
          <div className="flex flex-col gap-4">
            <Toggle checked={prefs.whatsapp} onChange={(v) => { setPrefs({ ...prefs, whatsapp: v }); toast.success('Saved') }} label="WhatsApp alerts" description="Blockers on match day, payouts and approvals." />
            <Toggle checked={prefs.email} onChange={(v) => { setPrefs({ ...prefs, email: v }); toast.success('Saved') }} label="Email receipts" />
            <Toggle checked={prefs.daily} onChange={(v) => { setPrefs({ ...prefs, daily: v }); toast.success('Saved') }} label="Daily summary" description="Entries and money, every evening at 8 pm." />
          </div>
        </Card>
        <Card className={cn('lg:col-span-2')}>
          <CardHeader title="Plan and fees" />
          <p className="text-fg2">Creating events is free. A platform fee of [PLATFORM FEE] applies per online entry. Want us to run an event for you? Our managed service starts at [MANAGED SERVICE PRICE].</p>
        </Card>
      </div>
      <PayoutSheet open={payout} onClose={() => setPayout(false)} organizerId={org.id} defaultHolder={org.orgName || org.name} />
    </OrganizerShell>
  )
}
