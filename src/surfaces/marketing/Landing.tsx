import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Gavel,
  Layers,
  Mail,
  Megaphone,
  MessageCircle,
  PartyPopper,
  Radio,
  Shield,
  Smartphone,
  Ticket,
  Trophy,
  Tv,
  Wallet,
  Clock,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'
import { ButtonLink, Button } from '../../components/ui/Button'
import { Logo, ContactSheet } from '../../components/ui/Misc'
import { TiltCard } from '../../components/ui/Card'
import { SpotIcon } from '../../components/ui/Display'
import { LiveBadge } from '../../components/ui/Controls'
import { useReducedMotion } from '../../theme/motion'
import { COMPANY_LINE, CONTACT_EMAIL, CONTACT_WHATSAPP, TAGLINE } from '../../lib/brand'
import { IDS } from '../../mock/seed'
import { useData } from '../../store/hooks'
import { cn } from '../../lib/cn'

const LivingCourt = lazy(() => import('../../components/3d/scenes/LivingCourt'))

const BENTO: { icon: LucideIcon; title: string; line: string; span?: string }[] = [
  { icon: Ticket, title: 'Registrations and UPI payments', line: 'Players register and pay in about two minutes. You see every entry live.', span: 'md:col-span-2' },
  { icon: CalendarDays, title: 'Draws and brackets', line: 'Groups, round robin and knockouts with byes, drawn in one tap.' },
  { icon: Smartphone, title: 'Umpire scoring on any phone', line: 'A link per court. No app to install.' },
  { icon: Tv, title: 'Court TV screens', line: 'Broadcast-style scores on any TV at the venue.' },
  { icon: MessageCircle, title: 'WhatsApp updates', line: 'Confirmations, schedules and reminders go out for you.', span: 'md:col-span-2' },
  { icon: BadgeCheck, title: 'DUPR sync', line: 'Results sync to DUPR when your event is rated.' },
  { icon: Megaphone, title: 'Sponsors', line: 'Logos on screens, posters and your event page.' },
  { icon: Wallet, title: 'Results and payouts', line: 'Winners, reports and your money, in one place.', span: 'md:col-span-2' },
]

const TYPES: { icon: LucideIcon; label: string; line: string }[] = [
  { icon: Trophy, label: 'Tournament', line: 'Categories, groups, knockouts' },
  { icon: Shield, label: 'League', line: 'A season of team ties' },
  { icon: Gavel, label: 'Auction league', line: 'Owners bid, then play' },
  { icon: Layers, label: 'Draft league', line: 'Captains pick squads' },
  { icon: PartyPopper, label: 'Social mixer', line: 'Pay and play evenings' },
]

const BEATS = [
  { title: 'Answer a few questions.', body: 'Seven short steps. Every question has a sensible default, so you can mostly tap Continue.', kind: 'wizard' as const },
  { title: 'Get your own event app.', body: 'Registration page, prices, draws, umpire links and court screens, shaped by your answers.', kind: 'device' as const },
  { title: 'Run match day from one screen.', body: 'Every court, every score, every blocker. Confirm results and call the next match in a tap.', kind: 'courts' as const },
]

export function Landing() {
  const reduced = useReducedMotion()
  const story = useRef<HTMLDivElement>(null)
  const progress = useRef(0)
  const [beat, setBeat] = useState(-1)
  const [menu, setMenu] = useState(false)
  const [talk, setTalk] = useState(false)
  const data = useData()
  const hero = data.events.find((e) => e.id === IDS.hero)!

  useEffect(() => {
    const onScroll = () => {
      const el = story.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)))
      progress.current = p
      setBeat(p < 0.06 ? -1 : p < 0.4 ? 0 : p < 0.72 ? 1 : 2)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-dvh bg-canvas">
      {/* top bar */}
      <header className="glass fixed inset-x-0 top-0 z-50 border-b border-line-subtle">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4 sm:px-6">
          <Link to="/" aria-label="Rizzfitt home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {[
              ['How it works', '#how'],
              ['Pricing', '#pricing'],
              ['For clubs', '#clubs'],
            ].map(([l, h]) => (
              <a key={l} href={h} className="rounded-md px-3 py-2 text-[14px] font-semibold text-fg2 hover:text-fg">
                {l}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/start" className="hidden rounded-md px-3 py-2 text-[14px] font-semibold text-fg2 hover:text-fg sm:block">
              Sign in
            </Link>
            <ButtonLink to="/start" size="sm" className="h-10">
              Start free
            </ButtonLink>
            <button type="button" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)} className="flex h-11 w-11 items-center justify-center rounded-md text-fg2 md:hidden">
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="flex flex-col border-t border-line-subtle px-4 py-2 md:hidden" aria-label="Mobile">
            {['How it works', 'Pricing', 'For clubs', 'Sign in'].map((l) => (
              <a key={l} href={l === 'Sign in' ? '/start' : `#${l === 'How it works' ? 'how' : l === 'Pricing' ? 'pricing' : 'clubs'}`} onClick={() => setMenu(false)} className="flex h-12 items-center font-semibold text-fg2">
                {l}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main id="main">
        {/* hero + scroll story share one sticky canvas */}
        <div ref={story} className={cn('relative', reduced ? '' : 'h-[300vh]')}>
          <div className="sticky top-0 h-[100svh] overflow-hidden">
            <div className="floodlight absolute inset-0" aria-hidden />
            <Suspense fallback={null}>
              <LivingCourt progress={progress} className="absolute inset-0 md:left-[28%]" />
            </Suspense>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--bg-canvas)_0%,rgba(6,6,10,0.75)_38%,transparent_70%)] max-md:bg-[linear-gradient(180deg,rgba(6,6,10,0.2)_0%,var(--bg-canvas)_75%)]" aria-hidden />

            {/* hero copy: renders before the canvas loads */}
            <motion.div
              className="relative z-10 mx-auto flex h-full max-w-[1280px] flex-col justify-end px-4 pb-16 sm:px-6 md:justify-center md:pb-0"
              animate={{ opacity: beat >= 0 ? 0 : 1, y: beat >= 0 ? -30 : 0 }}
              transition={{ duration: 0.4 }}
              style={{ pointerEvents: beat >= 0 ? 'none' : 'auto' }}
            >
              <p className="t-overline text-brand-text">For tournament organizers</p>
              <h1 className="mt-3 max-w-[640px] t-display-xl text-fg">{TAGLINE}</h1>
              <p className="mt-5 max-w-[520px] t-body-l text-fg2">Set up registrations, draws, live scoring and court screens for your tournament in about 15 minutes. No calls, no spreadsheets.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink to="/start" size="lg" iconRight={<ArrowRight size={18} />}>
                  Start free
                </ButtonLink>
                <a href={`/p/${hero.slug}/live`} target="_blank" rel="noreferrer" className="inline-flex h-[52px] items-center gap-2 rounded-md border border-line bg-s2/80 px-6 font-semibold text-fg hover:bg-s3">
                  <LiveBadge /> See a live event
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 t-small text-fg3" aria-label="Highlights">
                <li>Pickleball, badminton, cricket, football</li>
                <li>DUPR rated events</li>
                <li>Endorsed by [ASSOCIATIONS]</li>
              </ul>
            </motion.div>

            {/* story beats */}
            {!reduced && (
              <div className="pointer-events-none absolute inset-0 z-10 mx-auto flex max-w-[1280px] items-end px-4 pb-10 sm:px-6 md:items-center md:pb-0">
                {BEATS.map((b, i) => (
                  <motion.div
                    key={b.title}
                    className="glass absolute w-[min(420px,calc(100vw-32px))] rounded-xl border border-line-strong p-6 shadow-float"
                    initial={false}
                    animate={{ opacity: beat === i ? 1 : 0, y: beat === i ? 0 : beat > i ? -24 : 24 }}
                    transition={{ duration: 0.45, ease: [0.3, 0, 0, 1] }}
                    aria-hidden={beat !== i}
                  >
                    <p className="t-overline text-brand-text">Step {i + 1} of 3</p>
                    <h2 className="mt-2 t-h1 text-fg">{b.title}</h2>
                    <p className="mt-2 text-fg2">{b.body}</p>
                    <BeatMock kind={b.kind} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* reduced motion: the story as plain cards */}
        {reduced && (
          <section id="how" className="mx-auto grid max-w-[1280px] gap-4 px-4 py-16 sm:px-6 md:grid-cols-3">
            {BEATS.map((b, i) => (
              <div key={b.title} className="card p-6">
                <p className="t-overline text-brand-text">Step {i + 1}</p>
                <h2 className="mt-2 t-h2 text-fg">{b.title}</h2>
                <p className="mt-2 text-fg2">{b.body}</p>
                <BeatMock kind={b.kind} />
              </div>
            ))}
          </section>
        )}

        {/* bento */}
        <section id={reduced ? 'features' : 'how'} className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
          <p className="t-overline text-brand-text">One app, every part of your event</p>
          <h2 className="mt-2 t-display-m text-fg">Everything a tournament needs</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {BENTO.map((b) => (
              <TiltCard key={b.title} className={cn('flex min-h-[200px] flex-col justify-between', b.span)}>
                <SpotIcon icon={b.icon} size={60} />
                <div className="mt-6">
                  <h3 className="t-h3 text-fg">{b.title}</h3>
                  <p className="mt-1 text-fg2">{b.line}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* event types */}
        <section id="clubs" className="border-y border-line-subtle bg-base">
          <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
            <h2 className="t-h1 text-fg">Run any kind of event</h2>
            <p className="mt-2 max-w-xl text-fg2">Clubs, academies, associations and companies use Rizzfitt for every format. You only see the tools your event needs.</p>
            <ul className="no-scrollbar mt-8 flex gap-4 overflow-x-auto pb-2">
              {TYPES.map((t) => (
                <li key={t.label} className="card flex min-w-[200px] flex-1 flex-col items-start gap-4 p-5">
                  <SpotIcon icon={t.icon} size={64} />
                  <div>
                    <p className="t-title text-fg">{t.label}</p>
                    <p className="t-small text-fg3">{t.line}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* pricing + managed */}
        <section id="pricing" className="mx-auto grid max-w-[1280px] gap-4 px-4 py-20 sm:px-6 md:grid-cols-2">
          <div className="card p-8">
            <p className="t-overline text-brand-text">Pricing</p>
            <h2 className="mt-2 t-h1 text-fg">Free to set up</h2>
            <p className="mt-2 text-fg2">Creating events is free. A small fee of [PLATFORM FEE] applies per online entry. You always see it before each payout.</p>
            <ButtonLink to="/start" className="mt-6" iconRight={<ArrowRight size={16} />}>
              Start free
            </ButtonLink>
          </div>
          <div className="card floodlight relative overflow-hidden p-8">
            <p className="t-overline text-brand-text">Prefer we run it for you?</p>
            <h2 className="mt-2 t-h1 text-fg">Our team can set it all up</h2>
            <p className="mt-2 text-fg2">Send us your event details and we will configure everything, then hand it over. You can take control any time.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="secondary" icon={<MessageCircle size={16} />} onClick={() => setTalk(true)}>
                Talk to us
              </Button>
              <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex h-11 items-center gap-2 rounded-md px-4 font-semibold text-fg2 hover:text-fg">
                <Mail size={16} aria-hidden /> {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line-subtle">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-10 pb-28 sm:px-6 md:flex-row md:items-center md:justify-between md:pb-10">
          <Logo size="sm" />
          <p className="t-small text-fg3">
            {COMPANY_LINE} WhatsApp {CONTACT_WHATSAPP}
          </p>
        </div>
      </footer>
      <ContactSheet open={talk} onClose={() => setTalk(false)} />
    </div>
  )
}

function BeatMock({ kind }: { kind: 'wizard' | 'device' | 'courts' }) {
  if (kind === 'wizard')
    return (
      <div className="mt-5 rounded-lg border border-line bg-s1 p-4">
        <p className="t-small text-fg3">Which sport?</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {['Pickleball', 'Badminton', 'Cricket'].map((s, i) => (
            <span key={s} className={cn('rounded-md border px-2 py-2 text-center text-[13px] font-semibold', i === 0 ? 'border-brand bg-brand-soft text-fg' : 'border-line text-fg3')}>
              {s}
            </span>
          ))}
        </div>
      </div>
    )
  if (kind === 'device')
    return (
      <div className="mt-5 flex gap-3">
        <div className="w-28 shrink-0 rounded-lg border border-line bg-s1 p-2">
          {['Home', 'Registrations', 'Schedule', 'Match day'].map((m, i) => (
            <div key={m} className={cn('mb-1 rounded-sm px-2 py-1 text-[11px] font-semibold', i === 0 ? 'bg-s3 text-fg' : 'text-fg3')}>
              {m}
            </div>
          ))}
        </div>
        <div className="flex-1 rounded-lg border border-line bg-s1 p-3">
          <p className="text-[12px] text-fg3">Entries</p>
          <p className="text-[24px] font-bold text-fg tnum">96</p>
          <div className="mt-2 h-1.5 rounded-full bg-s3">
            <div className="h-full w-3/4 rounded-full bg-brand" />
          </div>
        </div>
      </div>
    )
  return (
    <div className="mt-5 grid grid-cols-2 gap-2">
      {[
        ['Court 1', 'live'],
        ['Court 2', 'live'],
        ['Court 3', 'late'],
        ['Court 4', 'free'],
      ].map(([c, s]) => (
        <div key={c} className={cn('rounded-md border p-2', s === 'live' ? 'border-brand bg-brand-soft' : s === 'late' ? 'border-warning bg-warning-soft' : 'border-line bg-s1')}>
          <p className="text-[12px] font-semibold text-fg">{c}</p>
          <p className="flex items-center gap-1 text-[11px] text-fg3">
            {s === 'live' ? <Radio size={12} className="text-live" aria-hidden /> : s === 'late' ? <Clock size={12} className="text-warning" aria-hidden /> : null}
            {s === 'live' ? 'Live 6-4' : s === 'late' ? '20 min late' : 'Call next'}
          </p>
        </div>
      ))}
    </div>
  )
}
