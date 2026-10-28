import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, SlidersHorizontal, Trash } from 'lucide-react'
import { useData, useEvent } from '../../store/hooks'
import { categoriesOf } from '../../store/selectors'
import { setEventStatus, updateCategory, updateEvent } from '../../store/actions'
import { inviteMember, removeMember, setMemberRole } from '../../store/miscActions'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { FilterChip, StatusChip } from '../../components/ui/Controls'
import { Input, PhoneInput, Select } from '../../components/ui/Field'
import { Avatar } from '../../components/ui/Display'
import { Dialog, toast, useConfirm } from '../../components/ui/Overlay'
import { PageHeader } from './shared'
import { EventStep } from '../setup/steps/EventStep'
import { FormatStep } from '../setup/steps/FormatStep'
import { RankingDrawer, RulesStep, TimeoutsEditor } from '../setup/steps/RulesStep'
import { FIELD_LABEL, RegistrationStep } from '../setup/steps/RegistrationStep'
import { LookStep, MatchDayStep } from '../setup/steps/MatchDayLookReview'
import { YouStep } from '../setup/steps/You'
import { fmtPhone } from '../../lib/format'
import { rulesSentence } from '../../lib/scoring'
import { cn } from '../../lib/cn'
import type { FieldKey, MemberRole } from '../../mock/types'

const SECTIONS = [
  ['details', 'Event details'],
  ['format', 'Format and categories'],
  ['rules', 'Match rules'],
  ['registration', 'Registration and payments'],
  ['matchday', 'Match day'],
  ['look', 'Look'],
  ['team', 'Team'],
  ['advanced', 'Advanced'],
  ['danger', 'Danger zone'],
] as const

const ROLE_LABEL: Record<MemberRole, string> = { owner: 'Owner', manager: 'Manager', desk: 'Desk', court_captain: 'Court captain' }
const ROLE_HELP: Record<MemberRole, string> = { owner: 'Everything', manager: 'Everything except money and settings', desk: 'Registrations and check-in only', court_captain: 'Match day for their courts' }

export function SettingsPage() {
  const ev = useEvent()
  const [sec, setSec] = useState<(typeof SECTIONS)[number][0]>('details')
  return (
    <div>
      <PageHeader title="Settings" subtitle="Every answer from setup, plus your team and advanced rules." />
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="no-scrollbar flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:h-fit lg:flex-col">
          {SECTIONS.map(([k, l]) => (
            <button key={k} type="button" aria-current={sec === k} onClick={() => setSec(k)} className={cn('h-10 shrink-0 rounded-md px-3 text-left text-[14px] font-semibold', sec === k ? 'bg-s2 text-fg' : 'text-fg3 hover:text-fg', k === 'danger' && 'text-danger')}>
              {l}
            </button>
          ))}
        </nav>
        <div className="min-w-0 max-w-[820px]">
          {sec === 'details' && <Card className="flex flex-col gap-8"><YouStep ev={ev} compact /><EventStep ev={ev} compact /></Card>}
          {sec === 'format' && <Card><FormatStep ev={ev} compact /></Card>}
          {sec === 'rules' && <Card><RulesStep ev={ev} compact /></Card>}
          {sec === 'registration' && <Card><RegistrationStep ev={ev} compact /></Card>}
          {sec === 'matchday' && <Card><MatchDayStep ev={ev} compact /></Card>}
          {sec === 'look' && <Card><LookStep ev={ev} compact /></Card>}
          {sec === 'team' && <TeamSection />}
          {sec === 'advanced' && <AdvancedSection />}
          {sec === 'danger' && <DangerSection />}
          <p className="mt-3 t-small text-fg3">Changes save as you go and show up across your workspace, event page and screens.</p>
          <span className="sr-only">{ev.name}</span>
        </div>
      </div>
    </div>
  )
}

function TeamSection() {
  const ev = useEvent()
  const d = useData()
  const confirm = useConfirm()
  const team = d.members.filter((m) => m.organizerId === ev.organizerId)
  const [add, setAdd] = useState(false)
  const [f, setF] = useState({ name: '', mobile: '', role: 'desk' as MemberRole, courts: [1] })
  return (
    <Card>
      <CardHeader title="Team" subtitle="Co-organizers get their own login and see only what their role allows." action={<Button size="sm" icon={<Plus size={14} />} onClick={() => setAdd(true)}>Invite</Button>} />
      <ul className="flex flex-col divide-y divide-line-subtle">
        {team.map((m) => (
          <li key={m.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
            <span className="flex flex-1 items-center gap-3">
              <Avatar name={m.name} size={36} />
              <span>
                <span className="block font-semibold text-fg">{m.name} {m.status === 'invited' && <StatusChip tone="warning">Invited</StatusChip>}</span>
                <span className="t-small text-fg3">{fmtPhone(m.mobile)} · {ROLE_HELP[m.role]}{m.role === 'court_captain' && m.courts ? `, courts ${m.courts.join(' and ')}` : ''}</span>
              </span>
            </span>
            {m.role === 'owner' ? (
              <StatusChip tone="brand">Owner</StatusChip>
            ) : (
              <span className="flex items-center gap-2">
                <select aria-label={`${m.name} role`} value={m.role} onChange={(e) => { setMemberRole(m.id, e.target.value as MemberRole); toast.success(`${m.name} is now ${ROLE_LABEL[e.target.value as MemberRole]}`) }} className="h-10 rounded-md border border-line bg-s2 px-2 text-fg">
                  {(['manager', 'desk', 'court_captain'] as MemberRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <button
                  type="button"
                  aria-label={`Remove ${m.name}`}
                  onClick={async () => {
                    if (await confirm({ title: `Remove ${m.name}?`, body: 'They lose access to this workspace straight away. You can invite them again later.', confirmLabel: 'Remove co-organizer', tone: 'danger' })) {
                      removeMember(m.id)
                      toast.success(`${m.name} removed`)
                    }
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-md text-fg3 hover:text-danger"
                >
                  <Trash size={16} />
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 t-small text-fg3">Tip: Ananya is the Desk volunteer persona in the Demo switcher. Change her role here to see her menu change.</p>
      <Dialog
        open={add}
        onClose={() => setAdd(false)}
        title="Invite a co-organizer"
        footer={<><Button variant="secondary" onClick={() => setAdd(false)}>Cancel</Button><Button disabled={f.name.trim().length < 2 || f.mobile.length !== 10} onClick={() => { inviteMember(ev.organizerId, f.name.trim(), f.mobile, f.role, f.role === 'court_captain' ? f.courts : undefined); toast.success('Invite sent on WhatsApp'); setAdd(false); setF({ name: '', mobile: '', role: 'desk', courts: [1] }) }}>Send invite</Button></>}
      >
        <div className="flex flex-col gap-4">
          <Input label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <PhoneInput value={f.mobile} onChange={(v) => setF({ ...f, mobile: v })} />
          <Select label="Role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as MemberRole })} options={(['manager', 'desk', 'court_captain'] as MemberRole[]).map((r) => ({ value: r, label: `${ROLE_LABEL[r]}: ${ROLE_HELP[r]}` }))} />
          {f.role === 'court_captain' && (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: ev.courts }, (_, i) => i + 1).map((c) => (
                <FilterChip key={c} active={f.courts.includes(c)} onClick={() => setF({ ...f, courts: f.courts.includes(c) ? f.courts.filter((x) => x !== c) : [...f.courts, c] })}>Court {c}</FilterChip>
              ))}
            </div>
          )}
        </div>
      </Dialog>
    </Card>
  )
}

function AdvancedSection() {
  const ev = useEvent()
  const d = useData()
  const cats = categoriesOf(d, ev.id)
  const [rank, setRank] = useState(false)
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader title="Ranking criteria" subtitle="Sort order and visible columns for group standings." action={<Button size="sm" variant="secondary" icon={<SlidersHorizontal size={14} />} onClick={() => setRank(true)}>Edit</Button>} />
        <p className="text-fg2">Ranked by {ev.settings.rankingCriteria.filter((c) => c.sort).map((c) => c.label.toLowerCase()).join(', then ')}.</p>
      </Card>
      <Card>
        <CardHeader title="Timeouts by stage" />
        <TimeoutsEditor ev={ev} />
      </Card>
      {cats.length > 0 && (
        <Card>
          <CardHeader title="Per-category rules" subtitle="Override the scoring defaults for one category." />
          <ul className="flex flex-col gap-2">
            {cats.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-md border border-line-subtle bg-s1 px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-semibold text-fg">{c.label}</span>
                <select aria-label={`${c.label} points`} value={c.matchRules.pointsToWin} onChange={(e) => updateCategory(c.id, (x) => (x.matchRules.pointsToWin = Number(e.target.value)))} className="h-9 rounded-md border border-line bg-s2 px-2 text-fg">{[11, 15, 21].map((n) => <option key={n} value={n}>To {n}</option>)}</select>
                <select aria-label={`${c.label} scoring`} value={c.matchRules.scoring} onChange={(e) => updateCategory(c.id, (x) => (x.matchRules.scoring = e.target.value as 'rally' | 'side_out'))} className="h-9 rounded-md border border-line bg-s2 px-2 text-fg"><option value="rally">Rally</option><option value="side_out">Side-out</option></select>
                <span className="w-full t-small text-fg3 sm:w-auto">{rulesSentence(c.matchRules)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <CardHeader title="Registration form fields" />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FIELD_LABEL) as FieldKey[]).map((k) => (
            <FilterChip key={k} active={ev.settings.registrationFields.includes(k)} onClick={() => updateEvent(ev.id, (e) => (e.settings.registrationFields = e.settings.registrationFields.includes(k) ? e.settings.registrationFields.filter((x) => x !== k) : [...e.settings.registrationFields, k]))}>
              {FIELD_LABEL[k]}
            </FilterChip>
          ))}
        </div>
      </Card>
      <RankingDrawer ev={ev} open={rank} onClose={() => setRank(false)} />
    </div>
  )
}

function DangerSection() {
  const ev = useEvent()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const row = (title: string, body: string, label: string, run: () => void) => (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="font-semibold text-fg">{title}</p>
        <p className="t-small text-fg3">{body}</p>
      </div>
      <Button variant="secondary" className="border-danger/50 text-danger" onClick={run}>{label}</Button>
    </li>
  )
  return (
    <Card className="border-danger/40">
      <CardHeader title="Danger zone" subtitle="Each of these asks you to confirm first." />
      <ul className="divide-y divide-line-subtle">
        {ev.status === 'registrations_open' && row('Close registrations', 'Players cannot register or pay. You can reopen.', 'Close registrations', async () => {
          if (await confirm({ title: 'Close registrations?', body: 'Players will not be able to register or pay. You can reopen any time.', confirmLabel: 'Close registrations', tone: 'danger' })) { setEventStatus(ev.id, 'registrations_closed'); toast.success('Registrations closed') }
        })}
        {ev.status !== 'draft' && row('Unpublish event', 'Your event page goes offline and the event returns to draft. Entries and payments stay.', 'Unpublish', async () => {
          if (await confirm({ title: 'Unpublish this event?', body: 'The public page goes offline and players see "This event is not live". Entries and payments stay as they are.', confirmLabel: 'Unpublish event', tone: 'danger' })) { setEventStatus(ev.id, 'draft'); toast.success('Event unpublished') }
        })}
        {row('Cancel event', 'Everyone is refunded and told on WhatsApp. This cannot be undone.', 'Cancel event', async () => {
          if (await confirm({ title: 'Cancel this event?', body: 'All online payments are refunded and every player gets a WhatsApp and email. This cannot be undone.', confirmLabel: 'Cancel event', tone: 'danger', typeToConfirm: 'CANCEL' })) {
            updateEvent(ev.id, (e) => { e.cancelled = true; e.status = 'completed' })
            toast.success('Event cancelled', { body: 'Refunds started. Players notified.' })
            navigate('/events')
          }
        })}
      </ul>
    </Card>
  )
}
