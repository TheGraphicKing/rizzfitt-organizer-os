import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CalendarDays, CalendarPlus, ChevronDown, CircleCheck, Clock, AtSign, MapPin, MessageCircle, Radio, Search, Smartphone, Ticket, Trophy, Users } from 'lucide-react'
import { useData } from '../../store/hooks'
import { useUi, fakeDelay } from '../../store/store'
import { categoriesOf, entryCount, eventBySlug, matchTitle, playerName, sideLabel } from '../../store/selectors'
import { addEntry, addParticipant, type NewPlayerInput } from '../../store/regActions'
import { Button } from '../../components/ui/Button'
import { Input, PhoneInput, Select } from '../../components/ui/Field'
import { Checkbox, LiveBadge, Segmented, StatusChip, Tabs } from '../../components/ui/Controls'
import { ProgressBar } from '../../components/ui/Display'
import { Logo, QR, ScoreBug, downloadText } from '../../components/ui/Misc'
import { toast } from '../../components/ui/Overlay'
import { Bracket } from '../../components/data/Bracket'
import { StandingsTable } from '../../components/data/MatchBits'
import { EventGlyph } from '../workspace/shared'
import { CoverThumb } from '../setup/Preview'
import { NotFound } from '../../app/NotFound'
import { accentVars } from '../../lib/color'
import { fmtDate, fmtDateTime, fmtPhone, fmtRange, fmtTime, inr, maskPhone, plural } from '../../lib/format'
import { ageOn, eligibilityLine, eligibilityOf, REFUND_LABEL } from '../../lib/eligibility'
import { celebrate } from '../../lib/celebrate'
import { COMPANY_LINE } from '../../lib/brand'
import { SPORT_META } from '../../mock/constants'
import { useSceneMode } from '../../components/3d/perf/quality'
import { cn } from '../../lib/cn'
import type { DemoData, EventItem, Match } from '../../mock/types'

const LivingCourt = lazy(() => import('../../components/3d/scenes/LivingCourt'))

function useSiteEvent(): EventItem | undefined {
  const { slug } = useParams()
  return eventBySlug(useData(), slug ?? '')
}

/* ------------------------------------------------------------------ layout */

export function MicrositeLayout() {
  const ev = useSiteEvent()
  const d = useData()
  const loc = useLocation()
  useEffect(() => {
    if (ev) document.title = `${ev.name} · Rizzfitt`
  }, [ev])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [loc.pathname])
  if (!ev || ev.hqOnly) return <NotFound />
  const org = d.organizers.find((o) => o.id === ev.organizerId)
  const base = `/p/${ev.slug}`
  return (
    <div className="min-h-dvh" style={{ ...(accentVars(ev.accent, ev.ground) as React.CSSProperties), background: 'var(--event-ground)' }}>
      {ev.status === 'draft' && <div className="bg-warning-soft px-4 py-2 text-center t-small font-semibold text-warning">Preview: this event is not live yet. Only you can see it.</div>}
      {ev.cancelled && <div className="bg-danger-soft px-4 py-2 text-center t-small font-semibold text-danger">This event has been cancelled. Online payments are being refunded.</div>}
      <header className="glass sticky top-0 z-30 border-b border-line-subtle">
        <div className="mx-auto flex h-14 max-w-[1080px] items-center gap-3 px-4">
          <Link to={base} className="flex min-w-0 items-center gap-2">
            <EventGlyph ev={ev} size={30} />
            <span className="truncate font-bold text-fg">{ev.name}</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1" aria-label="Event">
            {ev.settings.publicLivePage && ev.type !== 'social' && (
              <NavLink to={`${base}/live`} className={({ isActive }) => cn('flex h-10 items-center gap-1.5 rounded-md px-3 text-[14px] font-semibold', isActive ? 'text-accent' : 'text-fg2 hover:text-fg')}>
                {ev.status === 'live' && <span className="animate-live h-2 w-2 rounded-full bg-live" aria-hidden />} Live
              </NavLink>
            )}
            {ev.type !== 'social' && (
              <NavLink to={`${base}/me`} className={({ isActive }) => cn('hidden h-10 items-center rounded-md px-3 text-[14px] font-semibold sm:flex', isActive ? 'text-accent' : 'text-fg2 hover:text-fg')}>
                My matches
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="border-t border-line-subtle px-4 py-8 pb-28 text-center">
        <p className="text-fg2">
          Organized by <strong className="text-fg">{org?.orgName || org?.name}</strong>
          {org?.instagram && <span className="ml-2 inline-flex items-center gap-1 text-fg3"><AtSign size={14} aria-hidden /> {org.instagram}</span>}
        </p>
        <p className="mt-3 flex items-center justify-center gap-2 t-small text-fg3">
          Powered by <Logo size="sm" />
        </p>
        <p className="mt-2 t-small text-fg4">{COMPANY_LINE}</p>
      </footer>
    </div>
  )
}

function regOpen(ev: EventItem) {
  return ev.status === 'registrations_open' && !ev.cancelled
}

/* ------------------------------------------------------------------ P-01 */

export function EventHome() {
  const ev = useSiteEvent()!
  const d = useData()
  const { tier } = useSceneMode()
  const cats = categoriesOf(d, ev.id)
  const org = d.organizers.find((o) => o.id === ev.organizerId)
  const sponsors = d.sponsors.filter((s) => s.eventId === ev.id && s.active).sort((a, b) => a.order - b.order)
  const live = d.matches.filter((m) => m.eventId === ev.id && m.status === 'live')
  const open = regOpen(ev)
  const p = ev.settings.page
  const socialLeft = ev.type === 'social' ? (ev.social?.capacity ?? 0) - d.participants.filter((x) => x.eventId === ev.id).length : 0
  const status = ev.status === 'live' ? 'Live now' : open ? (ev.regClosesAt ? `Registrations open, closes ${fmtDate(ev.regClosesAt).replace(/ \d{4}$/, '')}` : 'Registrations open') : ev.status === 'completed' ? 'Finished' : ev.status === 'draft' ? 'Coming soon' : 'Entries closed'
  return (
    <>
      <section className="relative overflow-hidden">
        <CoverThumb style={ev.coverStyle} accent={ev.accent} name="" fill />
        {(tier === 'high' || tier === 'medium') && ev.coverStyle === 'court' && (
          <Suspense fallback={null}>
            <LivingCourt lite accent={ev.accent} className="absolute inset-0 opacity-80 md:left-[35%]" />
          </Suspense>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_10%,var(--bg-canvas)_92%)] md:bg-[linear-gradient(90deg,var(--bg-canvas)_15%,transparent_75%)]" aria-hidden />
        <div className="relative mx-auto flex min-h-[420px] max-w-[1080px] flex-col justify-end px-4 pb-8 pt-24 md:min-h-[520px] md:justify-center">
          <span className={cn('inline-flex w-fit items-center gap-2 rounded-pill px-3 py-1 text-[12px] font-bold tracking-wide', ev.status === 'live' ? 'bg-danger-soft text-live' : 'bg-accent-soft text-accent')}>
            {ev.status === 'live' && <span className="animate-live h-2 w-2 rounded-full bg-live" />} {status.toUpperCase()}
          </span>
          <h1 className="mt-3 max-w-[620px] t-display-l text-fg">{ev.name}</h1>
          {p.headline && <p className="mt-2 max-w-[560px] t-body-l text-fg2">{p.headline}</p>}
          <ul className="mt-4 flex flex-col gap-1.5 text-fg2">
            <li className="flex items-center gap-2"><CalendarDays size={16} aria-hidden /> {fmtRange(ev.startDate, ev.endDate)}, first match {fmtTime(ev.startDate)}</li>
            <li className="flex items-center gap-2"><MapPin size={16} aria-hidden /> {ev.venue.name}{ev.venue.address ? `, ${ev.venue.address}` : ''}</li>
            <li className="flex items-center gap-2"><Users size={16} aria-hidden /> By {org?.orgName || org?.name}{ev.certifications.dupr ? ' · DUPR rated' : ''}</li>
            {(ev.settings.regOpensAt || ev.regClosesAt) && ev.status !== 'completed' && <li className="flex items-center gap-2"><Ticket size={16} aria-hidden /> Registration {ev.settings.regOpensAt ? `opens ${fmtDateTime(ev.settings.regOpensAt)}` : 'open'}{ev.regClosesAt ? `, closes ${fmtDateTime(ev.regClosesAt)}` : ''}</li>}
          </ul>
          <div className="mt-6 hidden gap-3 md:flex">
            {open && <Link to="register" className="inline-flex h-[52px] items-center rounded-md bg-accent px-7 font-bold text-on-accent hover:brightness-110">Register now</Link>}
            {ev.settings.publicLivePage && ev.type !== 'social' && (ev.status === 'live' || ev.status === 'completed' || ev.status === 'scheduled') && <Link to="live" className="inline-flex h-[52px] items-center gap-2 rounded-md border border-line bg-s2 px-6 font-semibold text-fg">Live scores and draw</Link>}
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1080px] flex-col gap-10 px-4 py-8">
        {live.length > 0 && p.sections.live && (
          <section aria-labelledby="live-now">
            <div className="mb-3 flex items-center justify-between"><h2 id="live-now" className="t-h2 text-fg">Live now</h2><Link to="live" className="t-small font-semibold text-accent">All scores</Link></div>
            <div className="grid gap-3 sm:grid-cols-2">{live.map((m) => <LiveBug key={m.id} d={d} m={m} />)}</div>
          </section>
        )}
        {p.sections.categories && ev.type !== 'social' && (
          <section aria-labelledby="cats">
            <h2 id="cats" className="mb-3 t-h2 text-fg">Categories</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {cats.map((c) => {
                const n = entryCount(d, ev.id, c.id)
                const left = Math.max(0, c.cap - n)
                return (
                  <li key={c.id} className="card flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="t-title text-fg">{c.label}</p><p className="t-small text-fg3">{c.team ? 'Team entry, per team' : c.teamSize === 2 ? 'Doubles, per team' : 'Singles'} · {c.format === 'groups_knockout' ? 'Groups then knockout' : c.format === 'round_robin' ? 'Round robin' : c.format === 'knockout' ? 'Knockout' : 'King of the Court'}</p><p className="mt-1 t-small text-fg2">{eligibilityLine(c)}</p>{c.prize && <p className="mt-1 flex items-center gap-1.5 t-small font-semibold text-fg"><Trophy size={14} className="text-brand" aria-hidden /> {c.prize}</p>}</div>
                      <p className="text-[20px] font-bold text-fg tnum">{inr(c.price)}</p>
                    </div>
                    {ev.settings.showRegisteredCount && <div><ProgressBar value={n} max={c.cap} color="var(--event-accent)" /><p className="mt-1 t-small text-fg3">{left ? `${plural(left, 'spot')} left` : c.waitlist ? 'Full, join the waitlist' : 'Full'}</p></div>}
                    {open && !c.entriesClosed && <Link to={`register?cat=${c.id}`} className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--event-accent)] text-[14px] font-bold text-accent hover:bg-accent-soft">{left ? 'Register' : 'Join waitlist'}</Link>}
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        {ev.type === 'social' && (
          <section className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <div className="flex-1"><p className="t-title text-fg">Entry {inr(ev.social?.pricePerPerson ?? 0)} per person</p><p className="t-small text-fg3">{plural(Math.max(0, socialLeft), 'spot')} left of {ev.social?.capacity}. Dinner included.</p></div>
            {open && socialLeft > 0 && <Link to="register" className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 font-bold text-on-accent">Grab a spot</Link>}
          </section>
        )}
        {p.about && (
          <section aria-labelledby="about"><h2 id="about" className="mb-2 t-h2 text-fg">About</h2><p className="max-w-[720px] t-body-l text-fg2">{p.about}</p></section>
        )}
        {p.sections.schedule && ev.publishedAt && ev.type !== 'social' && (
          <section aria-labelledby="sch"><div className="mb-3 flex items-center justify-between"><h2 id="sch" className="t-h2 text-fg">Schedule</h2><Link to="live?tab=schedule" className="t-small font-semibold text-accent">Full schedule</Link></div><p className="text-fg2">The schedule is out. Find your matches with your mobile number.</p><Link to="me" className="mt-3 inline-flex h-11 items-center gap-2 rounded-md border border-line bg-s2 px-4 font-semibold text-fg"><Search size={16} aria-hidden /> My matches</Link></section>
        )}
        {p.sections.sponsors && sponsors.length > 0 && (
          <section aria-labelledby="sp"><h2 id="sp" className="mb-3 t-h2 text-fg">Thanks to our sponsors</h2><ul className="flex flex-wrap gap-3">{sponsors.map((s) => <li key={s.id} className="rounded-md px-4 py-2 text-[14px] font-bold tracking-wider text-on-brand" style={{ background: s.color }}>{s.logoText}</li>)}</ul></section>
        )}
        <section aria-labelledby="venue" className="grid gap-4 md:grid-cols-2">
          <div><h2 id="venue" className="mb-2 t-h2 text-fg">Venue</h2><p className="text-fg2">{ev.venue.name}</p><p className="t-small text-fg3">{ev.venue.address}. {ev.venue.indoor ? 'Indoor' : 'Outdoor'}, {ev.courts} {SPORT_META[ev.sport].courtWord.toLowerCase()}.</p></div>
          <div className="relative h-40 overflow-hidden rounded-lg border border-line bg-s2" role="img" aria-label={`Map of ${ev.venue.name}`}>
            <svg viewBox="0 0 300 160" className="h-full w-full" aria-hidden><path d="M0 120 C80 100 160 140 300 110" stroke="var(--surface-3)" strokeWidth="16" fill="none" /><path d="M110 0 L130 160" stroke="var(--surface-3)" strokeWidth="10" /><rect x="150" y="50" width="48" height="30" rx="4" fill="var(--court-surface)" /></svg>
            <MapPin className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-full text-accent" size={30} fill="var(--event-accent)" aria-hidden />
          </div>
        </section>
        {p.sections.faq && (
          <section aria-labelledby="faq">
            <h2 id="faq" className="mb-3 t-h2 text-fg">FAQ</h2>
            {[
              ['How do I pay?', ev.settings.payments.online ? 'By UPI, card or netbanking on this page. You can also pay at the desk if the organizer allows it.' : 'At the desk on the day.'],
              ...(cats.some((c) => c.teamSize === 2) ? [['Can I change my partner?', ev.settings.partnerRule === 'find_partner' ? 'Yes. You can also register alone and the organizer pairs you before the draw.' : 'Yes. WhatsApp the organizer before the draw and they will update it.']] : []),
              ['When do I get my schedule?', 'On WhatsApp as soon as the draw is published, usually 2 days before the event.'],
              ['Refunds?', `${REFUND_LABEL[ev.settings.refundPolicy ?? 'full_until_close']}. Refunds go back to the way you paid within 5 to 7 working days.`],
            ].map(([q, a]) => (
              <details key={q} className="group border-b border-line-subtle py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-fg">{q}<ChevronDown size={16} className="text-fg3 transition-transform group-open:rotate-180" aria-hidden /></summary>
                <p className="mt-2 text-fg2">{a}</p>
              </details>
            ))}
          </section>
        )}
        <section className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
          <MessageCircle className="text-success" aria-hidden />
          <div className="flex-1">
            <p className="text-fg2">Questions? Message {org?.name.split(' ')[0]} from {org?.orgName} on WhatsApp.</p>
            <p className="mt-0.5 t-small text-fg3 tnum">{fmtPhone(ev.contact?.mobile ?? org?.mobile ?? '')} · {ev.contact?.email ?? org?.email}</p>
          </div>
          <Button variant="secondary" onClick={() => toast.info('Opening WhatsApp is simulated in this prototype')}>WhatsApp the organizer</Button>
        </section>
      </div>
      {open && (
        <div className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line-subtle p-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden">
          <Link to="register" className="flex h-[52px] items-center justify-center rounded-md bg-accent text-[17px] font-bold text-on-accent">Register now</Link>
        </div>
      )}
    </>
  )
}

function LiveBug({ d, m }: { d: DemoData; m: Match }) {
  const done = m.games.slice(0, -1)
  return <ScoreBug title={`Court ${m.court} · ${matchTitle(d, m)}`} a={sideLabel(d, m.sideA, true)} b={sideLabel(d, m.sideB, true)} games={{ a: done.filter((g) => g.a > g.b).length, b: done.filter((g) => g.b > g.a).length }} current={m.games[m.games.length - 1]} server={m.live?.server} live />
}

/* ------------------------------------------------------------------ P-02 */

const blank: NewPlayerInput = { firstName: '', lastName: '', gender: 'M', mobile: '' }

export function RegisterFlow() {
  const ev = useSiteEvent()!
  const d = useData()
  const navigate = useNavigate()
  const loc = useLocation()
  const cats = categoriesOf(d, ev.id).filter((c) => !c.entriesClosed)
  const social = ev.type === 'social'
  const pre = new URLSearchParams(loc.search).get('cat')
  const steps = social ? ['You', 'Details', 'Consent', 'Pay'] : ['Category', 'You', 'Partner', 'Team', 'Details', 'Consent', 'Pay']
  const [i, setI] = useState(pre && !social ? 1 : 0)
  const [catId, setCatId] = useState(pre ?? cats[0]?.id ?? '')
  const [me, setMe] = useState<NewPlayerInput>(blank)
  const [partner, setPartner] = useState<NewPlayerInput>({ ...blank, gender: 'F' })
  const [extra, setExtra] = useState({ tshirt: 'M', dupr: '', dob: '', district: '', alias: '', meal: 'veg' as 'veg' | 'non_veg' | 'vegan' })
  const [consent, setConsent] = useState(false)
  const [paySheet, setPaySheet] = useState(false)
  const [paying, setPaying] = useState<string | null>(null)
  const [done, setDone] = useState<{ id: string; desk: boolean } | null>(null)
  const [solo, setSolo] = useState(false)
  const [teamName, setTeamName] = useState('')
  const cat = cats.find((c) => c.id === catId)
  const doubles = !social && (cat?.teamSize ?? 1) === 2
  const teamEntry = !social && !!cat?.team
  const canSolo = doubles && ev.settings.partnerRule === 'find_partner'
  const el = cat ? eligibilityOf(cat) : undefined
  const ageLimited = !!(el?.minAge || el?.maxAge)
  const age = extra.dob ? ageOn(extra.dob, ev.startDate) : null
  const ageError = ageLimited && age !== null && ((el?.minAge && age < el.minAge) || (el?.maxAge && age > el.maxAge)) ? `This category is for ages ${el?.minAge ?? 0} to ${el?.maxAge ?? 99} on ${fmtDate(ev.startDate)}. You will be ${age}.` : null
  const genderError = el && (el.gender === 'men' || el.gender === 'women') && !teamEntry && (me.existingId || me.firstName) ? (el.gender === 'men' ? me.gender !== 'M' : me.gender !== 'F') ? `${cat?.label} is for ${el.gender} only. Go back and pick another category.` : null : null
  const visible = steps.filter((s) => (s !== 'Partner' || doubles) && (s !== 'Team' || teamEntry))
  const step = visible[i]
  const price = social ? ev.social?.pricePerPerson ?? 0 : cat?.price ?? 0
  const known = me.mobile.length === 10 ? d.players.find((p) => p.mobile === me.mobile) : undefined
  const knownPartner = partner.mobile.length === 10 ? d.players.find((p) => p.mobile === partner.mobile) : undefined
  useEffect(() => {
    if (known && me.existingId !== known.id) setMe({ existingId: known.id, firstName: known.firstName, lastName: known.lastName, gender: known.gender, mobile: known.mobile })
  }, [known?.id]) // autofill returning players
  useEffect(() => {
    if (knownPartner && partner.existingId !== knownPartner.id) setPartner({ existingId: knownPartner.id, firstName: knownPartner.firstName, lastName: knownPartner.lastName, gender: knownPartner.gender, mobile: knownPartner.mobile })
  }, [knownPartner?.id])
  if (!regOpen(ev) && !done)
    return (
      <div className="mx-auto max-w-[520px] px-4 py-16 text-center">
        <Ticket size={40} className="mx-auto text-fg3" aria-hidden />
        <h1 className="mt-4 t-h1 text-fg">{ev.status === 'draft' ? 'Registrations open soon' : 'Registrations are closed'}</h1>
        <p className="mt-2 text-fg2">{ev.status === 'draft' ? 'The organizer is getting things ready. Check back shortly.' : 'Entries for this event have closed. Follow live scores instead.'}</p>
        <Link to={`/p/${ev.slug}`} className="mt-6 inline-flex h-11 items-center rounded-md border border-line px-4 font-semibold text-fg">Back to the event</Link>
      </div>
    )
  const valid = (() => {
    if (step === 'Category') return !!cat
    if (step === 'You') return me.mobile.length === 10 && (!!me.existingId || me.firstName.trim().length > 1) && !genderError
    if (step === 'Partner') return (canSolo && solo) || (partner.mobile.length === 10 && partner.mobile !== me.mobile && (!!partner.existingId || partner.firstName.trim().length > 1))
    if (step === 'Team') return teamName.trim().length > 1
    if (step === 'Details') return !ageLimited || (!!extra.dob && !ageError)
    if (step === 'Consent') return consent
    return true
  })()
  const finish = async (method: 'online' | 'desk') => {
    setPaying(method)
    await fakeDelay(900, 1300)
    let id: string
    if (social) id = addParticipant(ev.id, { name: `${me.firstName} ${me.lastName}`.trim(), mobile: me.mobile, gender: me.gender, alias: extra.alias, meal: extra.meal, tshirt: extra.tshirt as 'M' }, method === 'online')
    else id = addEntry(ev.id, catId, doubles && !solo ? [me, partner] : [me], method === 'online' ? 'online' : 'pending', 'Microsite', teamEntry ? { teamName: teamName.trim(), notes: `Captain: ${me.firstName} ${me.lastName}. Squad of ${cat?.team?.squadSize} to be added.` } : doubles && solo ? { notes: 'Looking for a partner' } : undefined)
    useUi.getState().set({ playerMobile: me.mobile })
    setPaying(null)
    setPaySheet(false)
    setDone({ id, desk: method === 'desk' })
    celebrate()
  }
  if (done) {
    const reg = d.registrations.find((r) => r.id === done.id)
    return (
      <div className="mx-auto max-w-[440px] px-4 py-10">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="overflow-hidden rounded-xl border border-line-strong bg-s1 shadow-float">
          <div className="bg-accent px-5 py-4 text-on-accent">
            <p className="text-[12px] font-bold tracking-wider">{reg?.status === 'waitlist' ? 'ON THE WAITLIST' : done.desk ? 'RESERVED, PAY AT THE DESK' : 'YOU ARE IN'}</p>
            <p className="t-h2">{ev.name}</p>
          </div>
          <div className="relative flex flex-col gap-3 border-b border-dashed border-line px-5 py-5">
            <span className="absolute -left-3 -bottom-3 h-6 w-6 rounded-full bg-canvas" aria-hidden />
            <span className="absolute -right-3 -bottom-3 h-6 w-6 rounded-full bg-canvas" aria-hidden />
            <p className="t-overline text-fg4">{social ? 'Entry' : 'Category'}</p>
            <p className="t-title text-fg">{social ? 'Sunday social' : cat?.label}</p>
            <p className="t-overline text-fg4">{doubles || teamEntry ? 'Team' : 'Player'}</p>
            <p className="font-semibold text-fg">{teamEntry ? `${teamName}, captain ${me.firstName} ${me.lastName}` : doubles && !solo ? `${me.firstName} ${me.lastName} and ${partner.firstName} ${partner.lastName}` : doubles ? `${me.firstName} ${me.lastName}, partner to be paired` : `${me.firstName} ${me.lastName}`}</p>
            <p className="t-small text-fg3">{fmtRange(ev.startDate, ev.endDate)} · {ev.venue.name}</p>
          </div>
          <div className="flex items-center gap-4 px-5 py-5">
            <QR value={`rizzfitt:${done.id}`} size={96} />
            <div className="t-small text-fg2">
              <p>Show this at the desk to check in.</p>
              <p className="mt-1 font-semibold text-fg">{done.desk ? `Pay ${inr(price)} at the desk` : `Paid ${inr(price)}`}</p>
            </div>
          </div>
        </motion.div>
        <p className="mt-5 flex items-center gap-2 text-fg2"><Smartphone size={16} aria-hidden /> We will WhatsApp your schedule to {maskPhone(me.mobile)} as soon as the draw is out.</p>
        <div className="mt-5 flex flex-col gap-2">
          <Button variant="secondary" icon={<CalendarPlus size={16} />} onClick={() => { downloadText(`${ev.slug}.ics`, `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${ev.name}\nDTSTART:${ev.startDate.replace(/[-:]/g, '').slice(0, 15)}\nLOCATION:${ev.venue.name}\nEND:VEVENT\nEND:VCALENDAR`, 'text/calendar'); toast.success('Added to calendar') }}>Add to calendar</Button>
          {ev.settings.whatsappGroupUrl && ev.settings.whatsappAfterPayment && <>{ev.settings.whatsappMessage && <p className="t-small text-fg2">{ev.settings.whatsappMessage}</p>}<Button variant="secondary" icon={<MessageCircle size={16} />} onClick={() => toast.info('Joining the WhatsApp group is simulated')}>Join WhatsApp group</Button></>}
          <Button variant="ghost" onClick={() => navigate(`/p/${ev.slug}`)}>Back to the event</Button>
        </div>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-[520px] px-4 py-6 pb-32">
      <button type="button" onClick={() => (i ? setI(i - 1) : navigate(`/p/${ev.slug}`))} className="mb-4 flex h-11 items-center gap-1 font-semibold text-fg2"><ArrowLeft size={16} aria-hidden /> {i ? 'Back' : 'Event'}</button>
      <div className="mb-5 flex gap-1.5" role="progressbar" aria-valuenow={i + 1} aria-valuemin={1} aria-valuemax={visible.length} aria-label={`Step ${i + 1} of ${visible.length}: ${step}`}>
        {visible.map((s, j) => <span key={s} className={cn('h-1.5 flex-1 rounded-full', j <= i ? 'bg-accent' : 'bg-s3')} />)}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
          {step === 'Category' && (
            <>
              <h1 className="t-h1 text-fg">Pick your category</h1>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Category">
                {cats.map((c) => {
                  const left = Math.max(0, c.cap - entryCount(d, ev.id, c.id))
                  return (
                    <button key={c.id} type="button" role="radio" aria-checked={catId === c.id} onClick={() => setCatId(c.id)} className={cn('flex items-center justify-between gap-3 rounded-lg border-2 p-4 text-left', catId === c.id ? 'border-[var(--event-accent)] bg-accent-soft' : 'border-line')}>
                      <span><span className="block font-semibold text-fg">{c.label}</span><span className="block t-small text-fg2">{eligibilityLine(c)}</span><span className="t-small text-fg3">{left ? `${plural(left, 'spot')} left` : 'Full, you join the waitlist'}</span></span>
                      <span className="font-bold text-fg tnum">{inr(c.price)}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
          {step === 'You' && (
            <>
              <h1 className="t-h1 text-fg">{known ? `Welcome back, ${known.firstName}` : 'About you'}</h1>
              <PhoneInput value={me.mobile} onChange={(m) => setMe({ ...me, mobile: m, existingId: undefined })} autoFocus helper="Your schedule and receipts come here on WhatsApp." />
              {known ? (
                <p className="flex items-center gap-2 rounded-md bg-success-soft px-3 py-2 text-success"><CircleCheck size={16} aria-hidden /> We found your profile from earlier events.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First name" value={me.firstName} onChange={(e) => setMe({ ...me, firstName: e.target.value })} autoComplete="given-name" />
                    <Input label="Last name" value={me.lastName} onChange={(e) => setMe({ ...me, lastName: e.target.value })} autoComplete="family-name" />
                  </div>
                  <Segmented label="Gender" value={me.gender} onChange={(g) => setMe({ ...me, gender: g })} options={[{ value: 'M', label: 'Man' }, { value: 'F', label: 'Woman' }]} />
                </>
              )}
              {genderError && <p role="alert" className="rounded-[12px] bg-danger-soft px-3 py-2 t-small text-danger">{genderError}</p>}
              <p className="t-small text-fg3">Demo: try 90000 10005 to see a returning player.</p>
            </>
          )}
          {step === 'Partner' && (
            <>
              <h1 className="t-h1 text-fg">Your partner</h1>
              {canSolo && <Checkbox checked={solo} onChange={setSolo} label="I don't have a partner yet" description="The organizer pairs you with someone at your level before the draw." />}
              {!solo && <>
              <PhoneInput label="Partner's mobile" value={partner.mobile} onChange={(m) => setPartner({ ...partner, mobile: m, existingId: undefined })} error={partner.mobile.length === 10 && partner.mobile === me.mobile ? 'That is your number' : null} />
              {knownPartner ? (
                <p className="flex items-center gap-2 rounded-md bg-success-soft px-3 py-2 text-success"><CircleCheck size={16} aria-hidden /> {playerName(knownPartner)} is on Rizzfitt.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First name" value={partner.firstName} onChange={(e) => setPartner({ ...partner, firstName: e.target.value })} />
                    <Input label="Last name" value={partner.lastName} onChange={(e) => setPartner({ ...partner, lastName: e.target.value })} />
                  </div>
                  <Segmented label="Partner gender" value={partner.gender} onChange={(g) => setPartner({ ...partner, gender: g })} options={[{ value: 'M', label: 'Man' }, { value: 'F', label: 'Woman' }]} />
                  <p className="t-small text-fg3">They get a WhatsApp invite to confirm their details.</p>
                </>
              )}
              </>}
            </>
          )}
          {step === 'Team' && (
            <>
              <h1 className="t-h1 text-fg">Your team</h1>
              <Input label="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Peelamedu Strikers" />
              <div className="card p-4">
                <p className="t-overline text-fg3">Captain</p>
                <p className="mt-1 font-semibold text-fg">{me.firstName} {me.lastName} · {fmtPhone(me.mobile)}</p>
                <p className="mt-2 t-small text-fg3">You register as captain. After paying, you get a link to add your squad of {cat?.team?.squadSize} ({cat?.team?.subs} substitutes). Squads lock when the draw is published.</p>
              </div>
            </>
          )}
          {step === 'Details' && (
            <>
              <h1 className="t-h1 text-fg">A few details</h1>
              {social ? (
                <>
                  {ev.social?.collect.includes('alias') && <Input label="Fun alias for the scoreboard" optional value={extra.alias} onChange={(e) => setExtra({ ...extra, alias: e.target.value })} placeholder="Dink King" />}
                  {ev.social?.collect.includes('meal') && <Segmented label="Meal" value={extra.meal} onChange={(v) => setExtra({ ...extra, meal: v })} options={[{ value: 'veg', label: 'Veg' }, { value: 'non_veg', label: 'Non-veg' }, { value: 'vegan', label: 'Vegan' }]} />}
                </>
              ) : (
                <>
                  {ev.settings.registrationFields.includes('dupr') && <Input label="DUPR ID" optional value={extra.dupr} onChange={(e) => setExtra({ ...extra, dupr: e.target.value.toUpperCase() })} helper="On your DUPR profile. Results sync after the event." />}
                  {(ev.settings.registrationFields.includes('dob') || ageLimited) && <Input label="Date of birth" type="date" value={extra.dob} onChange={(e) => setExtra({ ...extra, dob: e.target.value })} error={ageError} helper={ageLimited && !ageError ? `Needed: this category has an age limit (${eligibilityLine(cat!).split(' · ').find((x) => /Age|\+|Under/.test(x))}).` : undefined} />}
                  {ev.settings.registrationFields.includes('district') && <Input label="District" value={extra.district} onChange={(e) => setExtra({ ...extra, district: e.target.value })} />}
                </>
              )}
              {(social ? ev.social?.collect.includes('tshirt') : ev.settings.registrationFields.includes('tshirt')) && <Select label="T-shirt size" value={extra.tshirt} onChange={(e) => setExtra({ ...extra, tshirt: e.target.value })} options={['S', 'M', 'L', 'XL', 'XXL'].map((s) => ({ value: s, label: s }))} />}
            </>
          )}
          {step === 'Consent' && (
            <>
              <h1 className="t-h1 text-fg">Rules and consent</h1>
              <p className="rounded-lg border border-line-subtle bg-s1 p-4 text-fg2">{ev.settings.consentText}</p>
              {ev.settings.registrationNote && <p className="t-small text-fg3">{ev.settings.registrationNote}</p>}
              <p className="t-small text-fg3">Refunds: {REFUND_LABEL[ev.settings.refundPolicy ?? 'full_until_close']}.</p>
              <Checkbox checked={consent} onChange={setConsent} label="I agree" description={doubles ? 'On behalf of my partner too.' : undefined} />
            </>
          )}
          {step === 'Pay' && (
            <>
              <h1 className="t-h1 text-fg">Pay {inr(price)}</h1>
              <div className="card p-4">
                <div className="flex justify-between text-fg2"><span>{social ? 'Entry' : cat?.label}</span><span className="tnum">{inr(price)}</span></div>
                <div className="mt-2 flex justify-between border-t border-line-subtle pt-2 font-bold text-fg"><span>Total</span><span className="tnum">{inr(price)}</span></div>
              </div>
              <p className="t-small text-fg3">Secure payment through Rizzfitt. Demo only: no money moves.</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line-subtle p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-[520px] flex-col gap-2">
          {step === 'Pay' ? (
            <>
              {ev.settings.payments.online && <button type="button" onClick={() => setPaySheet(true)} className="flex h-[52px] items-center justify-center rounded-md bg-accent text-[17px] font-bold text-on-accent">Pay {inr(price)} with UPI</button>}
              {ev.settings.payments.desk && <Button variant="secondary" loading={paying === 'desk'} onClick={() => finish('desk')}>Pay at the desk instead</Button>}
            </>
          ) : (
            <button type="button" disabled={!valid} onClick={() => setI(i + 1)} className="flex h-[52px] items-center justify-center rounded-md bg-accent text-[17px] font-bold text-on-accent disabled:opacity-40">Continue</button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {paySheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/70" role="dialog" aria-modal="true" aria-label="Pay with UPI" onClick={() => !paying && setPaySheet(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.28 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-[520px] rounded-t-xl border-t border-line-strong bg-s1 p-5 pb-8">
              <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-s3" />
              <p className="t-overline text-fg3">Rizzfitt secure checkout</p>
              <p className="t-h2 text-fg">{inr(price)}</p>
              <p className="t-small text-fg3">{ev.name}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {['GPay', 'PhonePe', 'Paytm', 'Any UPI app'].map((a) => (
                  <Button key={a} variant="secondary" size="lg" loading={paying === 'online'} onClick={() => finish('online')}>{a}</Button>
                ))}
              </div>
              <p className="mt-3 text-center t-small text-fg3">Demo: tap any app to complete the payment.</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ P-03 */

export function LivePage() {
  const ev = useSiteEvent()!
  const d = useData()
  const loc = useLocation()
  const isMe = loc.pathname.endsWith('/me')
  const [tab, setTab] = useState<'live' | 'schedule' | 'draw' | 'standings' | 'me'>(isMe ? 'me' : (new URLSearchParams(loc.search).get('tab') as 'schedule') ?? 'live')
  useEffect(() => {
    setTab(isMe ? 'me' : 'live')
  }, [isMe])
  const cats = categoriesOf(d, ev.id)
  const [catId, setCatId] = useState(cats.find((c) => c.stage === 'in_play')?.id ?? cats[0]?.id)
  const [by, setBy] = useState<'court' | 'category'>('court')
  const cat = cats.find((c) => c.id === catId)
  const ms = d.matches.filter((m) => m.eventId === ev.id)
  const live = ms.filter((m) => m.status === 'live' || m.status === 'called' || m.status === 'paused')
  const recent = ms.filter((m) => m.status === 'done' && m.scheduledAt).sort((a, b) => b.scheduledAt!.localeCompare(a.scheduledAt!)).slice(0, 6)
  return (
    <div className="mx-auto max-w-[1080px] px-4 py-6">
      <h1 className="t-h1 text-fg">{isMe ? 'My matches' : 'Live'}</h1>
      <p className="mb-4 flex items-center gap-2 text-fg3">{ev.status === 'live' && <LiveBadge />} Updates on their own, no need to refresh.</p>
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'live', label: 'Live', count: live.length }, { value: 'schedule', label: 'Schedule' }, { value: 'draw', label: 'Draw' }, { value: 'standings', label: 'Standings' }, { value: 'me', label: 'Me' }]} />
      {tab === 'live' && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {live.map((m) => (m.status === 'live' || m.status === 'paused' ? <LiveBug key={m.id} d={d} m={m} /> : <div key={m.id} className="card p-4"><p className="t-small text-warning">Court {m.court} · Players called</p><p className="font-semibold text-fg">{sideLabel(d, m.sideA, true)} vs {sideLabel(d, m.sideB, true)}</p><p className="t-small text-fg3">{matchTitle(d, m)}</p></div>))}
            {!live.length && <p className="text-fg3">No matches on court right now.</p>}
          </div>
          {recent.length > 0 && (
            <section><h2 className="mb-2 t-h3 text-fg">Just finished</h2><ul className="flex flex-col divide-y divide-line-subtle">{recent.map((m) => <li key={m.id} className="flex items-center gap-3 py-2.5 text-[14px]"><span className="min-w-0 flex-1"><span className="block truncate text-fg">{sideLabel(d, m.sideA, true)} vs {sideLabel(d, m.sideB, true)}</span><span className="t-small text-fg3">{matchTitle(d, m)}</span></span><span className="font-semibold text-fg tnum">{m.games.map((g) => `${g.a}-${g.b}`).join(', ')}</span></li>)}</ul></section>
          )}
        </div>
      )}
      {tab === 'schedule' && (
        <>
          <Segmented className="mb-4" label="Group by" value={by} onChange={setBy} options={[{ value: 'court', label: 'By court' }, { value: 'category', label: 'By category' }]} />
          {!ev.publishedAt && !ms.some((m) => m.scheduledAt) ? <p className="text-fg3">The schedule is not published yet.</p> : (
            <div className="grid gap-4 md:grid-cols-2">
              {(by === 'court' ? Array.from({ length: ev.courts }, (_, i) => ({ key: `c${i + 1}`, title: `Court ${i + 1}`, list: ms.filter((m) => m.court === i + 1) })) : cats.map((c) => ({ key: c.id, title: c.label, list: ms.filter((m) => m.categoryId === c.id) }))).map((g) => (
                <section key={g.key} className="card p-4">
                  <h2 className="mb-2 t-title text-fg">{g.title}</h2>
                  <ul className="flex flex-col gap-1">
                    {g.list.filter((m) => m.scheduledAt && m.status !== 'done' && m.status !== 'walkover').sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!)).slice(0, 8).map((m) => (
                      <li key={m.id} className="flex gap-3 text-[14px]"><span className="w-16 shrink-0 font-semibold text-fg2 tnum">{fmtTime(m.scheduledAt!)}</span><span className="min-w-0 truncate text-fg">{sideLabel(d, m.sideA, true)} vs {sideLabel(d, m.sideB, true)}</span></li>
                    ))}
                    {!g.list.some((m) => m.scheduledAt && m.status !== 'done') && <li className="t-small text-fg3">All done here.</li>}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
      {(tab === 'draw' || tab === 'standings') && cat && (
        <>
          <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">{cats.map((c) => <button key={c.id} type="button" aria-pressed={catId === c.id} onClick={() => setCatId(c.id)} className={cn('h-9 shrink-0 rounded-pill border px-3 text-[13px] font-semibold', catId === c.id ? 'border-[var(--event-accent)] bg-accent-soft text-fg' : 'border-line text-fg2')}>{c.label}</button>)}</div>
          {tab === 'draw' && (ms.some((m) => m.categoryId === cat.id && m.stage !== 'group') ? <div className="card p-0"><Bracket d={d} cat={cat} accent={ev.accent} compact /></div> : <p className="text-fg3">The draw for this category is not out yet.</p>)}
          {tab === 'standings' && (
            <div className="grid gap-4 md:grid-cols-2">
              {d.groups.filter((g) => g.categoryId === cat.id).sort((a, b) => a.name.localeCompare(b.name)).map((g) => <div key={g.id} className="card p-4"><h2 className="mb-2 t-title text-fg">{cat.format === 'round_robin' ? 'Standings' : `Group ${g.name}`}</h2><StandingsTable d={d} group={g} cat={cat} compact /></div>)}
              {!d.groups.some((g) => g.categoryId === cat.id) && <p className="text-fg3">Groups appear after the draw.</p>}
            </div>
          )}
        </>
      )}
      {tab === 'me' && <MyMatches ev={ev} />}
    </div>
  )
}

function MyMatches({ ev }: { ev: EventItem }) {
  const d = useData()
  const stored = useUi((s) => s.playerMobile)
  const [mobile, setMobile] = useState(stored ?? '')
  const p = mobile.length === 10 ? d.players.find((x) => x.mobile === mobile) : undefined
  const regs = p ? d.registrations.filter((r) => r.eventId === ev.id && r.playerIds.includes(p.id) && r.status !== 'refunded') : []
  const mine = useMemo(() => d.matches.filter((m) => regs.some((r) => r.id === m.sideA || r.id === m.sideB)), [d.matches, regs])
  const next = mine.filter((m) => m.status !== 'done' && m.status !== 'walkover').sort((a, b) => (a.scheduledAt ?? '9').localeCompare(b.scheduledAt ?? '9'))[0]
  const oppOf = (m: Match) => {
    const mineSide = regs.some((r) => r.id === m.sideA) ? 'A' : 'B'
    return sideLabel(d, mineSide === 'A' ? m.sideB : m.sideA, true)
  }
  return (
    <div className="max-w-[520px]">
      <PhoneInput value={mobile} onChange={(v) => { setMobile(v); if (v.length === 10) useUi.getState().set({ playerMobile: v }) }} helper="Demo: try 90000 10005." />
      {mobile.length === 10 && !p && <p className="mt-3 text-fg3">We could not find that number in this event.</p>}
      {p && (
        <div className="mt-5 flex flex-col gap-4">
          <p className="text-fg2">Hi {p.firstName}. {regs.length ? `You are in ${plural(regs.length, 'category', 'categories')}.` : 'You have no entries here yet.'}</p>
          {next ? (
            <div className="rounded-xl border-2 border-[var(--event-accent)] bg-accent-soft p-5">
              <p className="t-overline text-accent">Your next match</p>
              <p className="mt-1 t-h2 text-fg">{next.scheduledAt ? fmtTime(next.scheduledAt) : 'Time to be confirmed'}{next.court ? `, Court ${next.court}` : ''}</p>
              <p className="text-fg2">vs {oppOf(next)}</p>
              <p className="t-small text-fg3">{matchTitle(d, next)}</p>
              {next.status === 'called' && <StatusChip tone="warning" className="mt-2" icon={<Radio size={12} />}>Called, go to the court now</StatusChip>}
            </div>
          ) : regs.length ? <p className="flex items-center gap-2 text-fg2"><Trophy size={16} className="text-warning" aria-hidden /> No more matches scheduled for you.</p> : null}
          <ul className="flex flex-col divide-y divide-line-subtle">
            {mine.sort((a, b) => (a.scheduledAt ?? '9').localeCompare(b.scheduledAt ?? '9')).map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5 text-[14px]">
                <Clock size={14} className="text-fg3" aria-hidden />
                <span className="w-16 tnum text-fg2">{m.scheduledAt ? fmtTime(m.scheduledAt) : 'TBD'}</span>
                <span className="min-w-0 flex-1 truncate text-fg">vs {oppOf(m)}</span>
                <span className="tnum text-fg3">{m.games.map((g) => `${g.a}-${g.b}`).join(' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
