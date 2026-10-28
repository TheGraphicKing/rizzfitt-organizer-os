import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarClock, CheckCheck, Mail, MessageCircle, Plus, Send, Trash, Users } from 'lucide-react'
import { useData, useEvent } from '../../store/hooks'
import { categoriesOf, checkedInSet, entries, matchTitle, playerName, sidePlayers } from '../../store/selectors'
import { cancelScheduled, sendMessage } from '../../store/miscActions'
import { fakeDelay } from '../../store/store'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { FilterChip, Segmented, StatusChip } from '../../components/ui/Controls'
import { Input, Textarea } from '../../components/ui/Field'
import { Drawer, toast, useConfirm } from '../../components/ui/Overlay'
import { EmptyState, ProgressBar } from '../../components/ui/Display'
import { PageHeader } from './shared'
import { fmtDateTime, fmtTime, num, plural } from '../../lib/format'
import { PUBLIC_HOST } from '../../lib/brand'
import { cn } from '../../lib/cn'
import type { AudienceKind, DemoData, EventItem, Message, Player } from '../../mock/types'

export const TEMPLATES: { id: string; label: string; body: (ev: EventItem) => string }[] = [
  { id: 'confirmation', label: 'Registration confirmed', body: (ev) => `Hi {player_name}, you are in for {category} at ${ev.name}. We will send your schedule soon.` },
  { id: 'schedule', label: 'Schedule published', body: (ev) => `Hi {player_name}, the ${ev.name} schedule is out. Your first match: {match_time} on {court}. Full schedule: ${PUBLIC_HOST}${ev.slug}/live` },
  { id: 'reminder', label: 'Match reminder', body: () => 'Hi {player_name}, you are on {court} at {match_time}. Please check in at the desk 20 minutes before.' },
  { id: 'results', label: 'Results', body: (ev) => `Thank you for playing ${ev.name}! Results and photos: ${PUBLIC_HOST}${ev.slug}/live` },
  { id: 'custom', label: 'Custom', body: () => '' },
]

const AUD: { kind: AudienceKind; label: string }[] = [
  { kind: 'everyone', label: 'Everyone' },
  { kind: 'category', label: 'By category' },
  { kind: 'unpaid', label: 'Unpaid' },
  { kind: 'not_checked_in', label: 'Not checked in' },
  { kind: 'next_hour', label: 'Playing in the next hour' },
  { kind: 'custom', label: 'One match' },
]

/** Recipients for an audience, from the shared data. */
export function audiencePlayers(d: DemoData, ev: EventItem, kind: AudienceKind, cats: string[], matchId?: string): Player[] {
  const ids = new Set<string>()
  const ents = entries(d, ev.id)
  if (ev.type === 'social') {
    return d.participants
      .filter((p) => p.eventId === ev.id && (kind !== 'unpaid' || p.paymentStatus !== 'paid'))
      .map((p) => ({ id: p.id, firstName: p.name.split(' ')[0], lastName: p.name.split(' ').slice(1).join(' '), gender: p.gender, dob: '', mobile: p.mobile, email: p.email, city: '', district: '', duprStatus: 'missing', skill: 'beginner', tshirt: p.tshirt }) as Player)
  }
  const inSet = checkedInSet(d, ev.id)
  if (kind === 'everyone') ents.forEach((r) => r.playerIds.forEach((p) => ids.add(p)))
  if (kind === 'category') ents.filter((r) => cats.includes(r.categoryId)).forEach((r) => r.playerIds.forEach((p) => ids.add(p)))
  if (kind === 'unpaid') ents.filter((r) => r.status === 'pending').forEach((r) => r.playerIds.forEach((p) => ids.add(p)))
  if (kind === 'not_checked_in') ents.forEach((r) => r.playerIds.forEach((p) => !inSet.has(p) && ids.add(p)))
  if (kind === 'next_hour')
    d.matches
      .filter((m) => m.eventId === ev.id && (m.status === 'called' || (m.status === 'scheduled' && m.scheduledAt && Date.parse(m.scheduledAt) - d.now < 3600000 && Date.parse(m.scheduledAt) > d.now - 1800000)))
      .forEach((m) => [m.sideA, m.sideB].forEach((s) => sidePlayers(d, s).forEach((p) => ids.add(p))))
  if (kind === 'custom' && matchId) {
    const m = d.matches.find((x) => x.id === matchId)
    if (m) [m.sideA, m.sideB].forEach((s) => sidePlayers(d, s).forEach((p) => ids.add(p)))
  }
  return [...ids].map((id) => d.players.find((p) => p.id === id)!).filter(Boolean)
}

function fill(body: string, p: Player | undefined, ev: EventItem, d: DemoData) {
  const reg = p ? d.registrations.find((r) => r.eventId === ev.id && r.playerIds.includes(p.id)) : undefined
  const cat = reg ? d.categories.find((c) => c.id === reg.categoryId)?.label : 'your category'
  const m = reg ? d.matches.find((x) => (x.sideA === reg.id || x.sideB === reg.id) && x.status !== 'done' && x.scheduledAt) : undefined
  return body
    .replace(/\{player_name\}/g, p?.firstName ?? 'Arjun')
    .replace(/\{category\}/g, cat ?? 'your category')
    .replace(/\{match_time\}/g, m?.scheduledAt ? fmtTime(m.scheduledAt) : '9:20 am')
    .replace(/\{court\}/g, m?.court ? `Court ${m.court}` : 'Court 2')
}

export function MessagesPage() {
  const ev = useEvent()
  const d = useData()
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(params.get('new') === '1')
  const confirm = useConfirm()
  const init = useMemo(
    () => ({
      audience: (params.get('audience') === 'match' ? 'custom' : params.get('audience')) as AudienceKind | null,
      match: params.get('match') ?? undefined,
      template: params.get('template') ?? undefined,
    }),
    [], // read once
  )
  useEffect(() => {
    if (params.toString()) setParams({}, { replace: true })
  }, []) // read once from the URL
  const msgs = d.messages.filter((m) => m.eventId === ev.id)
  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="WhatsApp and email to your players. Sent from the Rizzfitt business number."
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setOpen(true)}>
            New message
          </Button>
        }
      />
      {msgs.length === 0 ? (
        <EmptyState icon={MessageCircle} title="Say hello to your players" help="Send confirmations, schedules and reminders on WhatsApp or email." action={<Button onClick={() => setOpen(true)}>New message</Button>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {msgs.map((m) => (
            <MessageRow
              key={m.id}
              m={m}
              onCancel={async () => {
                if (await confirm({ title: 'Cancel this scheduled message?', body: 'It will not be sent.', confirmLabel: 'Cancel message', tone: 'danger' })) {
                  cancelScheduled(m.id)
                  toast.success('Scheduled message cancelled')
                }
              }}
            />
          ))}
        </ul>
      )}
      <Composer ev={ev} open={open} onClose={() => setOpen(false)} initAudience={init.audience ?? undefined} initMatch={init.match} initTemplate={init.template} />
    </div>
  )
}

function MessageRow({ m, onCancel }: { m: Message; onCancel: () => void }) {
  const icons = m.channel === 'both' ? [MessageCircle, Mail] : m.channel === 'whatsapp' ? [MessageCircle] : [Mail]
  return (
    <li>
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <span className="flex gap-1">
          {icons.map((I, i) => (
            <span key={i} className={cn('flex h-10 w-10 items-center justify-center rounded-md', I === MessageCircle ? 'bg-success-soft text-success' : 'bg-info-soft text-info')}>
              <I size={18} aria-hidden />
            </span>
          ))}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-fg">{m.title}</p>
          <p className="truncate t-small font-normal text-fg3">{m.body}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 t-small text-fg3">
            <Users size={12} aria-hidden /> {m.audience.label}
            <span aria-hidden>·</span>
            {m.sentAt ? `Sent ${fmtDateTime(m.sentAt)}` : m.scheduledFor ? <StatusChip tone="info" icon={<CalendarClock size={12} />}>Scheduled {fmtDateTime(m.scheduledFor)}</StatusChip> : null}
          </p>
        </div>
        {m.sentAt ? (
          <dl className="grid w-full grid-cols-3 gap-3 sm:w-[300px]">
            {[
              ['Sent', m.stats.sent],
              ['Delivered', m.stats.delivered],
              [m.channel === 'email' ? 'Failed' : 'Read', m.channel === 'email' ? m.stats.failed ?? 0 : m.stats.read ?? 0],
            ].map(([l, v]) => (
              <div key={l as string}>
                <dt className="t-overline text-fg4">{l}</dt>
                <dd className="font-bold text-fg tnum">{num(v as number)}</dd>
                <ProgressBar value={v as number} max={Math.max(1, m.stats.sent)} className="mt-1 h-1" color={l === 'Failed' ? 'var(--danger)' : 'var(--success)'} />
              </div>
            ))}
          </dl>
        ) : (
          <Button size="sm" variant="ghost" icon={<Trash size={14} />} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </Card>
    </li>
  )
}

function Composer({ ev, open, onClose, initAudience, initMatch, initTemplate }: { ev: EventItem; open: boolean; onClose: () => void; initAudience?: AudienceKind; initMatch?: string; initTemplate?: string }) {
  const d = useData()
  const cats = categoriesOf(d, ev.id)
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'both'>('whatsapp')
  const [kind, setKind] = useState<AudienceKind>(initAudience ?? 'everyone')
  const [catSel, setCatSel] = useState<string[]>([])
  const [tpl, setTpl] = useState(initTemplate ?? (initAudience === 'not_checked_in' || initAudience === 'custom' ? 'reminder' : 'reminder'))
  const [body, setBody] = useState('')
  const [when, setWhen] = useState<'now' | 'later'>('now')
  const [at, setAt] = useState('2026-10-18T17:00')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!open) return
    if (initAudience) setKind(initAudience)
    const t = TEMPLATES.find((x) => x.id === (initTemplate ?? tpl))
    setBody(initAudience === 'not_checked_in' ? 'Hi {player_name}, you are playing soon on {court} at {match_time}. Please check in at the desk now.' : initAudience === 'custom' ? 'Hi {player_name}, your match on {court} is ready. Please come to the court now.' : t?.body(ev) ?? '')
  }, [open]) // set defaults when it opens
  const recips = audiencePlayers(d, ev, kind, catSel, initMatch)
  const noEmail = recips.filter((p) => !p.email).length
  const count = channel === 'email' ? recips.length - noEmail : recips.length
  const sample = recips[0]
  const m = initMatch ? d.matches.find((x) => x.id === initMatch) : undefined
  const audLabel = kind === 'category' ? cats.filter((c) => catSel.includes(c.id)).map((c) => c.label).join(', ') || 'No category picked' : kind === 'custom' ? (m ? matchTitle(d, m) : 'One match') : AUD.find((a) => a.kind === kind)!.label
  const insert = (v: string) => setBody((b) => `${b}${b.endsWith(' ') || !b ? '' : ' '}{${v}}`)
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New message"
      width={720}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            icon={when === 'now' ? <Send size={16} /> : <CalendarClock size={16} />}
            loading={busy}
            disabled={!count || body.trim().length < 5}
            onClick={async () => {
              setBusy(true)
              await fakeDelay(500, 800)
              sendMessage({ eventId: ev.id, channel, audience: { kind, categoryIds: catSel, label: audLabel }, templateId: tpl, title: TEMPLATES.find((x) => x.id === tpl)?.label ?? 'Message', body, count, scheduledFor: when === 'later' ? new Date(`${at}:00+05:30`).toISOString() : undefined })
              setBusy(false)
              onClose()
              toast.success(when === 'now' ? `Sending to ${plural(count, 'player')}` : 'Message scheduled', { body: when === 'now' ? 'Delivery stats update as receipts come in.' : fmtDateTime(`${at}:00+05:30`) })
            }}
          >
            {when === 'now' ? `Send to ${plural(count, 'player')}` : 'Schedule'}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 t-small text-fg2">Channel</p>
            <Segmented label="Channel" value={channel} onChange={setChannel} options={[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'email', label: 'Email' }, { value: 'both', label: 'Both' }]} />
          </div>
          <div>
            <p className="mb-2 t-small text-fg2">Who gets it</p>
            <div className="flex flex-wrap gap-2">
              {AUD.filter((a) => a.kind !== 'custom' || initMatch).map((a) => (
                <FilterChip key={a.kind} active={kind === a.kind} onClick={() => setKind(a.kind)}>
                  {a.label}
                </FilterChip>
              ))}
            </div>
            {kind === 'category' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {cats.map((c) => (
                  <FilterChip key={c.id} color={c.color} active={catSel.includes(c.id)} onClick={() => setCatSel((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))}>
                    {c.label}
                  </FilterChip>
                ))}
              </div>
            )}
            <p className="mt-3 rounded-md bg-s2 px-3 py-2 t-small text-fg2" aria-live="polite">
              <strong className="text-fg tnum">{plural(count, 'player')}</strong> will get this.
              {channel !== 'whatsapp' && noEmail > 0 && <span className="text-warning"> {plural(noEmail, 'player has', 'players have')} no email{channel === 'both' ? ' and will get WhatsApp only' : ' and will be skipped'}.</span>}
            </p>
          </div>
          <div>
            <p className="mb-2 t-small text-fg2">Template</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <FilterChip
                  key={t.id}
                  active={tpl === t.id}
                  onClick={() => {
                    setTpl(t.id)
                    setBody(t.body(ev))
                  }}
                >
                  {t.label}
                </FilterChip>
              ))}
            </div>
          </div>
          <div>
            <Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['player_name', 'category', 'match_time', 'court'].map((v) => (
                <button key={v} type="button" onClick={() => insert(v)} className="h-8 rounded-pill border border-line px-2.5 text-[12px] font-semibold text-fg2 hover:bg-s2">
                  + {v.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Segmented label="When" value={when} onChange={setWhen} options={[{ value: 'now', label: 'Send now' }, { value: 'later', label: 'Schedule' }]} />
            {when === 'later' && <Input className="mt-3 max-w-xs" type="datetime-local" aria-label="Send at" value={at} onChange={(e) => setAt(e.target.value)} />}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <p className="t-overline text-fg3">Preview{sample ? ` for ${sample.firstName}` : ''}</p>
          {channel !== 'email' && (
            <div className="rounded-lg bg-s2 p-3">
              <p className="mb-2 flex items-center gap-1.5 t-small text-success">
                <MessageCircle size={12} aria-hidden /> WhatsApp
              </p>
              <div className="rounded-lg rounded-tl-sm bg-success-soft p-3 text-[14px] text-fg">
                {fill(body, sample, ev, d) || <span className="text-fg3">Your message</span>}
                <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-fg3">
                  4:21 pm <CheckCheck size={12} aria-hidden />
                </p>
              </div>
            </div>
          )}
          {channel !== 'whatsapp' && (
            <div className="overflow-hidden rounded-lg border border-line bg-s1">
              <div className="border-b border-line-subtle bg-s2 px-3 py-2 text-[12px] text-fg3">
                <Mail size={12} className="mr-1 inline" aria-hidden /> {ev.name}
              </div>
              <div className="p-3 text-[14px] text-fg2">{fill(body, sample, ev, d) || 'Your message'}</div>
              <div className="h-1.5 bg-accent" />
            </div>
          )}
          {sample && <p className="t-small text-fg3">Sample recipient: {playerName(sample)}</p>}
        </div>
      </div>
    </Drawer>
  )
}
