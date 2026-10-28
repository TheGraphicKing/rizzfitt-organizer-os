import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Circle, CircleCheck, Pencil, Plus, Trash, Globe, Megaphone, Mail, Rocket, Image } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input, PhoneInput, Select } from '../../../components/ui/Field'
import { FilterChip, Segmented, Toggle, StatusChip } from '../../../components/ui/Controls'
import { ChoiceCard, SpotIcon } from '../../../components/ui/Display'
import { toast } from '../../../components/ui/Overlay'
import type { EventItem, TvSettings } from '../../../mock/types'
import { updateEvent } from '../../../store/actions'
import { mutate } from '../../../store/store'
import { useData } from '../../../store/hooks'
import { categoriesOf, goLiveChecklist, grossIfFull } from '../../../store/selectors'
import { GROUND_PRESETS, CATEGORICAL, SPORT_META, TYPE_META } from '../../../mock/constants'
import { MODULE_META } from '../../../lib/modules'
import { MODULE_ICON } from '../../workspace/WorkspaceLayout'
import { fmtRange, inr } from '../../../lib/format'
import { rulesSentence } from '../../../lib/scoring'
import { PUBLIC_HOST } from '../../../lib/brand'
import { cn } from '../../../lib/cn'
import { HELP } from '../../../lib/help'
import { InfoTip } from '../../../components/ui/InfoTip'
import { eligibilityLine, REFUND_LABEL } from '../../../lib/eligibility'
import { fmtDateTime, fmtPhone } from '../../../lib/format'
import { Q, StepTitle, Note } from '../common'
import { CoverThumb, GroundPicker } from '../Preview'

/* ------------------------------------------------------------- SW-06 */

export function MatchDayStep({ ev, compact }: { ev: EventItem; compact?: boolean }) {
  const s = ev.settings
  const set = (fn: (e: EventItem) => void) => updateEvent(ev.id, fn)
  const setTv = (patch: Partial<TvSettings>) => set((e) => Object.assign(e.settings.tv, patch))
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const courtWord = SPORT_META[ev.sport].courtWordOne.toLowerCase()
  return (
    <div className="flex flex-col gap-8">
      {!compact && <StepTitle title="Match day." sub="How scores get in, and where people see them." />}
      <Q title="Scoring">
        <div className="flex flex-col gap-4">
          <Toggle checked={s.umpiresOn} onChange={(v) => set((e) => (e.settings.umpiresOn = v))} label="Umpires score on their phones" description={`Each ${courtWord} gets a link and a QR code. No app to install.`} />
          {!s.umpiresOn && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 t-overline text-fg3">Who enters scores <InfoTip text={HELP['Who enters scores']} label="Who enters scores" /></p>
              <Segmented label="Who enters scores" value={s.scoreEntry ?? 'desk'} onChange={(v) => set((e) => (e.settings.scoreEntry = v))} options={[{ value: 'desk', label: 'Your desk' }, { value: 'players', label: 'Players, the other side confirms' }]} />
            </div>
          )}
          {s.umpiresOn && (
            <>
              <Segmented label={`Umpires per ${courtWord}`} value={String(s.umpiresPerCourt) as '1' | '2'} onChange={(v) => set((e) => (e.settings.umpiresPerCourt = Number(v) as 1 | 2))} options={[{ value: '1', label: `1 per ${courtWord}` }, { value: '2', label: `2 per ${courtWord}` }]} />
              <div className="card p-4">
                <p className="font-semibold text-fg">Invite umpires now</p>
                <p className="t-small text-fg3">Optional. You can invite them from Match day later.</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {ev.setup.invitedUmpires.map((u, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-md bg-s2 px-3 py-2">
                      <span className="flex-1 text-fg">{u.name}</span>
                      <span className="t-small text-fg3 tnum">+91 {u.mobile.slice(0, 5)} {u.mobile.slice(5)}</span>
                      <button type="button" aria-label={`Remove ${u.name}`} onClick={() => set((e) => e.setup.invitedUmpires.splice(i, 1))} className="flex h-9 w-9 items-center justify-center rounded-md text-fg3 hover:text-danger">
                        <Trash size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Umpire name" />
                  <PhoneInput value={mobile} onChange={setMobile} />
                  <Button
                    variant="secondary"
                    icon={<Plus size={16} />}
                    disabled={name.trim().length < 2 || mobile.length !== 10}
                    onClick={() => {
                      set((e) => e.setup.invitedUmpires.push({ name: name.trim(), mobile }))
                      setName('')
                      setMobile('')
                      toast.success('Umpire added', { body: 'They get their court link when you go live.' })
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Q>
      <Q title="Court TV screens" help="Any smart TV or laptop at the venue can show live scores.">
        <div className="flex flex-col gap-4">
          <Toggle checked={s.tv.enabled} onChange={(v) => setTv({ enabled: v })} label="Court TV screens" />
          {s.tv.enabled && (
            <>
              <div className="flex flex-wrap gap-2" role="group" aria-label="What TVs show">
                {([['showScore', 'Live score'], ['showUpNext', 'Up next'], ['showSponsors', 'Sponsors'], ['showBracket', 'Bracket'], ['showPlayerCards', 'Player cards']] as const).map(([k, l]) => (
                  <FilterChip key={k} active={s.tv[k]} onClick={() => setTv({ [k]: !s.tv[k] } as Partial<TvSettings>)}>
                    {l}
                  </FilterChip>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['arena', 'glass', 'minimal'] as const).map((t) => (
                  <button key={t} type="button" aria-pressed={s.tv.template === t} onClick={() => setTv({ template: t })} className={cn('overflow-hidden rounded-lg border text-left', s.tv.template === t ? 'border-brand shadow-[0_0_0_1px_var(--brand)]' : 'border-line hover:border-line-strong')}>
                    <TvThumb template={t} accent={ev.accent} />
                    <span className="block px-3 py-2 text-[13px] font-semibold capitalize text-fg">{t}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </Q>
      <Q title="For players and fans">
        <div className="flex flex-col gap-4">
          <Toggle checked={s.publicLivePage} onChange={(v) => set((e) => (e.settings.publicLivePage = v))} label="Public live scores page" description="Anyone with your link can follow scores and brackets." />
          <Toggle checked={s.checkIn} onChange={(v) => set((e) => (e.settings.checkIn = v))} label="Check players in at the desk" description="A fast check-in mode for your volunteers." />
        </div>
      </Q>
    </div>
  )
}

export function TvThumb({ template, accent }: { template: TvSettings['template']; accent: string }) {
  return (
    <svg viewBox="0 0 160 90" className="block w-full" aria-hidden>
      <rect width="160" height="90" fill={template === 'minimal' ? 'var(--bg-base)' : 'var(--bg-canvas)'} />
      {template === 'arena' && <rect x="0" y="0" width="160" height="14" fill={accent} opacity="0.9" />}
      {template === 'glass' && <rect x="10" y="20" width="140" height="50" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" />}
      <text x="40" y="54" fill="var(--text-primary)" fontSize="26" fontWeight="700" textAnchor="middle">6</text>
      <text x="120" y="54" fill={template === 'minimal' ? 'var(--text-secondary)' : accent} fontSize="26" fontWeight="700" textAnchor="middle">4</text>
      <rect x="0" y="80" width="160" height="10" fill="var(--surface-2)" />
    </svg>
  )
}

/* ------------------------------------------------------------- SW-07 */

export function LookStep({ ev, compact }: { ev: EventItem; compact?: boolean }) {
  const d = useData()
  const sponsors = d.sponsors.filter((s) => s.eventId === ev.id)
  const [spName, setSpName] = useState('')
  const [spTier, setSpTier] = useState<'title' | 'gold' | 'partner'>('gold')
  const set = (fn: (e: EventItem) => void) => updateEvent(ev.id, fn)
  return (
    <div className="flex flex-col gap-8">
      {!compact && <StepTitle title="Look and launch." sub="Pick how your page looks and what we prepare for launch." />}
      <Q title="Page ground" help="Rizz Orange stays the action colour on your page, posters and screens. Pick the ground it sits on.">
        <GroundPicker value={ev.ground ?? 'black'} onChange={(g) => set((e) => (e.ground = g))} />
      </Q>
      <Q title="Cover style">
        <div className="grid grid-cols-3 gap-3">
          {(['court', 'neon', 'clay'] as const).map((c) => (
            <button key={c} type="button" aria-pressed={ev.coverStyle === c} onClick={() => set((e) => (e.coverStyle = c))} className={cn('overflow-hidden rounded-lg border text-left', ev.coverStyle === c ? 'border-brand shadow-[0_0_0_1px_var(--brand)]' : 'border-line hover:border-line-strong')}>
              <CoverThumb style={c} accent={ev.accent} name={ev.name || 'Your event'} />
              <span className="block px-3 py-2 text-[13px] font-semibold capitalize text-fg">{c}</span>
            </button>
          ))}
        </div>
      </Q>
      <Q title="Sponsors" help="Add them now or later. They show on screens, posters and your page.">
        <ul className="mb-3 flex flex-col gap-2">
          {sponsors.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-md bg-s2 px-3 py-2">
              <span className="rounded-sm px-2 py-1 text-[11px] font-bold tracking-wider text-on-brand" style={{ background: s.color }}>
                {s.logoText}
              </span>
              <span className="flex-1 text-fg">{s.name}</span>
              <StatusChip tone="neutral">{s.tier}</StatusChip>
              <button
                type="button"
                aria-label={`Remove ${s.name}`}
                onClick={() =>
                  mutate((dd) => {
                    dd.sponsors = dd.sponsors.filter((x) => x.id !== s.id)
                    const e = dd.events.find((x) => x.id === ev.id)
                    if (e && !dd.sponsors.some((x) => x.eventId === ev.id)) e.sponsorsOn = false
                  })
                }
                className="flex h-9 w-9 items-center justify-center rounded-md text-fg3 hover:text-danger"
              >
                <Trash size={16} />
              </button>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto] sm:items-end">
          <Input label="Sponsor name" value={spName} onChange={(e) => setSpName(e.target.value)} placeholder="Smashline Paddles" />
          <Select label="Tier" value={spTier} onChange={(e) => setSpTier(e.target.value as typeof spTier)} options={[{ value: 'title', label: 'Title' }, { value: 'gold', label: 'Gold' }, { value: 'partner', label: 'Partner' }]} />
          <Button
            variant="secondary"
            icon={<Plus size={16} />}
            disabled={spName.trim().length < 2}
            onClick={() => {
              mutate((dd) => {
                const n = dd.sponsors.filter((x) => x.eventId === ev.id).length
                dd.sponsors.push({ id: `sp-${ev.id}-${dd.now}`, eventId: ev.id, name: spName.trim(), tier: spTier, logoText: spName.trim().toUpperCase().slice(0, 14), color: CATEGORICAL[(n + 2) % 8], order: n + 1, active: true })
                const e = dd.events.find((x) => x.id === ev.id)
                if (e) e.sponsorsOn = true
              })
              updateEvent(ev.id, () => {})
              setSpName('')
            }}
          >
            Add sponsor
          </Button>
        </div>
      </Q>
      <Q title="Launch kit" help="We prepare these for you when the app is built.">
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ['eventPage', 'Event page', 'Your public page with registration', Globe],
            ['posters', 'Posters', 'Registrations open, schedule, finals, champions', Image],
            ['whatsapp', 'WhatsApp templates', 'Confirmations, schedule, reminders', Megaphone],
            ['email', 'Email templates', 'Receipts and results', Mail],
          ] as const).map(([k, l, line, Icon]) => (
            <ChoiceCard key={k} layout="row" selected={ev.settings.launchKit[k]} onSelect={() => set((e) => (e.settings.launchKit[k] = !e.settings.launchKit[k]))} title={l} description={line} media={<SpotIcon icon={Icon} size={44} float={false} />} />
          ))}
        </div>
      </Q>
    </div>
  )
}

/* ------------------------------------------------------------- SW-08 */

export function ReviewStep({ ev, onEdit, onBuild, building }: { ev: EventItem; onEdit: (step: string) => void; onBuild: () => void; building?: boolean }) {
  const d = useData()
  const org = d.organizers.find((o) => o.id === ev.organizerId)
  const cats = categoriesOf(d, ev.id)
  const checklist = goLiveChecklist(d, ev.id)
  const s = ev.settings
  const cards: { step: string; title: string; lines: string[] }[] = [
    { step: 'you', title: 'You', lines: [ev.setup.orgName || 'Organization not set', [ev.setup.city, ev.setup.eventsPerYear + ' events a year'].filter(Boolean).join(' · ')] },
    { step: 'event', title: 'The event', lines: [ev.name || 'Unnamed event', `${SPORT_META[ev.sport].label} ${TYPE_META[ev.type].label.toLowerCase()}`, fmtRange(ev.startDate, ev.endDate), `${ev.venue.name || 'Venue to be added'} · ${ev.courts} ${SPORT_META[ev.sport].courtWord.toLowerCase()}`, `Contact: ${fmtPhone(ev.contact?.mobile ?? org?.mobile ?? '')} · ${ev.contact?.email ?? org?.email ?? ''}`] },
    {
      step: 'format',
      title: 'Format',
      lines:
        ev.type === 'tournament'
          ? [
              ...cats.flatMap((c) => [`${c.label}: ${c.format === 'groups_knockout' ? `groups of ${c.groupSize}, top ${c.advancePerGroup}` : c.format.replace(/_/g, ' ')}`, `  ${eligibilityLine(c)}${c.prize ? ` · Prize: ${c.prize}` : ''}`]),
              ...(ev.circuit ? [`Circuit: ${ev.circuit.legs.length} legs, best ${ev.circuit.bestOf} count, ${ev.circuit.points.join('/')} points`] : []),
            ]
          : ev.type === 'social'
            ? [`${ev.social?.capacity} spots, ${ev.social?.format === 'play_rounds' ? `${ev.social.rounds ?? 6} rounds of ${ev.social.roundMin ?? 15} min, ${ev.social.rotation === 'fixed' ? 'fixed partners' : 'new partner each round'}` : 'just social'}`]
            : [
                `${ev.league?.teams} teams of ${ev.league?.playersPerTeam}`,
                ev.league?.ties ? 'Ties on' : 'No ties',
                `Teams: ${ev.league?.teamFormation.replace(/_/g, ' ')}`,
                ...(ev.auction ? [`Tiers ${ev.auction.tierRule === 'manual' ? 'set by you' : 'by rating'}, max ${ev.auction.maxTierA ?? 2} tier A per team, unsold ${ev.auction.unsold === 'assign_base' ? 'placed at base price' : 'go to round 2'}`] : []),
                ...(ev.draft ? [`${ev.draft.order} draft, ${ev.draft.pickSeconds} s picks, captains: ${ev.draft.captainPick === 'vote' ? 'player vote' : ev.draft.captainPick === 'top_rated' ? 'highest rated' : 'you pick'}`] : []),
              ],
    },
    ...(ev.type !== 'social' || ev.social?.format === 'play_rounds' ? [{ step: 'rules', title: 'Match rules', lines: cats[0] ? [rulesSentence(cats[0].matchRules), s.ranking === 'custom' ? 'Custom ranking' : 'Wins, then point difference'] : ['Defaults'] }] : []),
    { step: 'registration', title: 'Registration and money', lines: [ev.type === 'social' ? `${inr(ev.social?.pricePerPerson ?? 0)} per person` : `If full: ${inr(grossIfFull(cats))}`, [s.payments.online && 'Online', s.payments.desk && 'at the desk'].filter(Boolean).join(' and ').replace(/^at/, 'At') || 'Free entry', `Registration: ${s.regOpensAt ? fmtDateTime(s.regOpensAt) : 'on go-live'} to ${ev.regClosesAt ? fmtDateTime(ev.regClosesAt) : 'the day before play'}`, REFUND_LABEL[s.refundPolicy ?? 'full_until_close'], ...(cats.some((c) => c.teamSize === 2) ? [s.partnerRule === 'find_partner' ? 'Singles can sign up, you pair them' : 'Partners register together'] : []), `${PUBLIC_HOST}${ev.slug}`, `Payout: ${org?.payoutAccount ? (org.payoutAccount.status === 'verified' ? 'verified' : 'under review') : 'not connected'}`] },
    ...(ev.type !== 'social' || ev.social?.format === 'play_rounds' ? [{ step: 'match-day', title: 'Match day', lines: [s.umpiresOn ? `Umpires on phones, ${s.umpiresPerCourt} per court` : s.scoreEntry === 'players' ? 'Players enter scores, the other side confirms' : 'Your desk enters scores', s.tv.enabled ? `Court TV: ${s.tv.template}` : 'No court TV', s.publicLivePage ? 'Public live page on' : 'Live page off'] }] : []),
    { step: 'look', title: 'Look and launch', lines: [`${GROUND_PRESETS.find((g) => g.value === (ev.ground ?? 'black'))?.name} ground, ${ev.coverStyle} cover`, `${d.sponsors.filter((x) => x.eventId === ev.id).length} sponsors`] },
  ]
  return (
    <div className="flex flex-col gap-8">
      <StepTitle title={`Looks great, ${org?.name.split(' ')[0] ?? 'there'}. Here's your event.`} sub="Check everything once. You can change any of it later in Settings." />
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <div key={c.step} className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="t-title text-fg">{c.title}</h2>
              <button type="button" onClick={() => onEdit(c.step)} className="flex h-9 items-center gap-1 rounded-md px-2 t-small font-semibold text-brand-text hover:bg-brand-soft">
                <Pencil size={14} aria-hidden /> Edit
              </button>
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {c.lines.map((l, i) => (
                <li key={i} className="t-small font-normal text-fg2">
                  {l}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Q title={`Your app will include ${ev.modules.length} modules`} info="Built from your answers. Each module is a section of your workspace. Change an answer and the list updates.">
        <ul className="flex flex-wrap gap-2">
          {ev.modules.map((m) => {
            const Icon = MODULE_ICON[m]
            return (
              <li key={m} className="inline-flex h-10 items-center gap-2 rounded-pill border border-line bg-s1 px-3 text-[13px] font-semibold text-fg2">
                <Icon size={16} className="text-brand-text" aria-hidden /> {MODULE_META[m].label}
              </li>
            )
          })}
        </ul>
      </Q>
      <Q title="Before you can take entries">
        <ul className="flex flex-col gap-2">
          {checklist.map((c) => (
            <li key={c.key} className="flex items-center gap-3">
              {c.done ? <CircleCheck size={20} className="text-success" aria-label="Done" /> : <Circle size={20} className="text-fg4" aria-label="To do" />}
              <span className="text-fg">{c.label}</span>
              <span className="t-small text-fg3">{c.optional ? 'Optional' : c.hint}</span>
            </li>
          ))}
        </ul>
        <Note>You can build the app now. Anything left on this list waits on your Home screen.</Note>
      </Q>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" icon={<Rocket size={18} />} onClick={onBuild} loading={building}>
          Build my event app
        </Button>
        <Link to="/events" className="inline-flex h-[52px] items-center justify-center rounded-md px-6 font-semibold text-fg2 hover:bg-s2 hover:text-fg">
          Save and finish later
        </Link>
      </div>
    </div>
  )
}

