import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Eye, Headset } from 'lucide-react'
import { useData } from '../../store/hooks'
import { useUi } from '../../store/store'
import { updateEvent, SETUP_STEPS } from '../../store/actions'
import { categoriesOf } from '../../store/selectors'
import { Logo, ContactSheet } from '../../components/ui/Misc'
import { Button } from '../../components/ui/Button'
import { Stepper } from '../../components/ui/Display'
import { Drawer } from '../../components/ui/Overlay'
import { NotFound } from '../../app/NotFound'
import type { DemoData, EventItem } from '../../mock/types'
import { YouStep } from './steps/You'
import { EventStep } from './steps/EventStep'
import { FormatStep } from './steps/FormatStep'
import { RulesStep } from './steps/RulesStep'
import { RegistrationStep } from './steps/RegistrationStep'
import { LookStep, MatchDayStep, ReviewStep } from './steps/MatchDayLookReview'
import { LivePreview } from './Preview'
import { useReducedMotion } from '../../theme/motion'

type StepKey = (typeof SETUP_STEPS)[number]
const LABEL: Record<StepKey, string> = { you: 'You', event: 'Event', format: 'Format', rules: 'Rules', registration: 'Money', 'match-day': 'Match day', look: 'Look', review: 'Review' }
const MINUTES: Record<StepKey, number> = { you: 1, event: 2, format: 3, rules: 2, registration: 3, 'match-day': 1, look: 1, review: 1 }

/** Steps that apply: social mixers skip Rules and Match day unless they play rounds. */
export function stepsFor(ev: EventItem): StepKey[] {
  const playRounds = ev.type !== 'social' || ev.social?.format === 'play_rounds'
  return SETUP_STEPS.filter((s) => playRounds || (s !== 'rules' && s !== 'match-day'))
}

function validate(step: StepKey, ev: EventItem, d: DemoData): string | null {
  const cats = categoriesOf(d, ev.id)
  if (step === 'event' && ev.name.trim().length < 3) return 'Give your event a name to continue.'
  if (step === 'format' && ev.type === 'tournament' && cats.length === 0) return 'Add at least one category to continue.'
  if (step === 'registration') {
    if (!ev.slug) return 'Add a web address for your event page.'
    if (d.events.some((x) => x.id !== ev.id && x.slug === ev.slug)) return 'That web address is taken.'
    if ((ev.settings.payments.online || ev.settings.payments.desk) && ev.type !== 'social' && cats.some((c) => c.price <= 0)) return 'Every category needs a price, or turn payments off.'
  }
  return null
}

export function SetupShell() {
  const { draftId, step } = useParams()
  const navigate = useNavigate()
  const d = useData()
  const ev = d.events.find((e) => e.id === draftId)
  const setUi = useUi((s) => s.set)
  const reduced = useReducedMotion()
  const [talk, setTalk] = useState(false)
  const [preview, setPreview] = useState(false)
  const [saved, setSaved] = useState(false)
  const first = useRef(true)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ev) setUi({ currentEventId: ev.id })
  }, [ev?.id, setUi])

  // Autosave chip: every change is already persisted; flash "Saved".
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setSaved(true)
    const t = setTimeout(() => setSaved(false), 1400)
    return () => clearTimeout(t)
  }, [ev])

  const steps = useMemo(() => (ev ? stepsFor(ev) : []), [ev])
  if (!ev) return <NotFound />
  const key = (SETUP_STEPS as readonly string[]).includes(step ?? '') ? (step as StepKey) : 'you'
  const idx = Math.max(0, steps.indexOf(key))
  const error = validate(key, ev, d)
  const maxReached = Math.max(idx, steps.indexOf(SETUP_STEPS[Math.min(7, ev.setup.step - 1)]))

  const go = (i: number) => {
    const target = steps[Math.max(0, Math.min(steps.length - 1, i))]
    const n = SETUP_STEPS.indexOf(target) + 1
    if (n > ev.setup.step) updateEvent(ev.id, (e) => (e.setup.step = n))
    navigate(`/setup/${ev.id}/${target}`)
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }
  const build = () => navigate(`/setup/${ev.id}/building`)

  const body = (() => {
    switch (key) {
      case 'you':
        return <YouStep ev={ev} />
      case 'event':
        return <EventStep ev={ev} />
      case 'format':
        return <FormatStep ev={ev} />
      case 'rules':
        return <RulesStep ev={ev} />
      case 'registration':
        return <RegistrationStep ev={ev} />
      case 'match-day':
        return <MatchDayStep ev={ev} />
      case 'look':
        return <LookStep ev={ev} />
      case 'review':
        return <ReviewStep ev={ev} onEdit={(s) => navigate(`/setup/${ev.id}/${s}`)} onBuild={build} />
    }
  })()

  return (
    <div className="floodlight min-h-dvh bg-base">
      <header className="glass sticky top-0 z-30 border-b border-line-subtle">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6">
          <Link to="/events" aria-label="All my events">
            <Logo size="sm" />
          </Link>
          <div className="hidden min-w-0 flex-1 px-6 lg:block">
            <Stepper steps={steps.map((s) => LABEL[s])} current={idx} maxReached={maxReached} onJump={go} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <AnimatePresence>
              {saved && (
                <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1 rounded-pill bg-success-soft px-2.5 py-1 text-[12px] font-semibold text-success" role="status">
                  <Check size={12} aria-hidden /> Saved
                </motion.span>
              )}
            </AnimatePresence>
            <Link to="/events" className="flex h-10 items-center rounded-md px-3 text-[14px] font-semibold text-fg2 hover:bg-s2 hover:text-fg">
              Save and exit
            </Link>
          </div>
        </div>
        <div className="px-4 pb-3 lg:hidden">
          <Stepper steps={steps.map((s) => LABEL[s])} current={idx} maxReached={maxReached} onJump={go} />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] gap-8 px-4 sm:px-6 xl:px-10">
        <main id="main" ref={mainRef} className="w-full max-w-[720px] flex-1 py-8 pb-40 xl:max-w-[680px]">
          <AnimatePresence mode="wait">
            <motion.div key={key} initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0.12 : 0.28 }}>
              {body}
            </motion.div>
          </AnimatePresence>
          {key !== 'review' && (
            <div className="glass fixed inset-x-0 bottom-0 z-20 border-t border-line-subtle px-4 py-3 md:static md:mt-10 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
              <div className="mx-auto flex max-w-[720px] flex-col gap-2 md:mx-0">
                {error && (
                  <p className="t-small text-warning" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" icon={<ArrowLeft size={16} />} disabled={idx === 0} onClick={() => go(idx - 1)}>
                    Back
                  </Button>
                  <button type="button" onClick={() => setPreview(true)} className="ml-auto flex h-11 items-center gap-1.5 rounded-md px-3 text-[14px] font-semibold text-fg2 hover:bg-s2 xl:hidden">
                    <Eye size={16} aria-hidden /> Preview
                  </button>
                  <Button size="lg" className="xl:ml-auto" iconRight={<ArrowRight size={18} />} disabled={!!error} onClick={() => go(idx + 1)}>
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-1 border-t border-line-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="t-small text-fg3">Most organizers finish this step in about {MINUTES[key]} {MINUTES[key] === 1 ? 'minute' : 'minutes'}.</p>
            <button type="button" onClick={() => setTalk(true)} className="flex h-11 items-center gap-2 self-start t-small font-semibold text-brand-text hover:underline">
              <Headset size={14} aria-hidden /> Have Rizzfitt set this up for me
            </button>
          </div>
        </main>
        <aside className="sticky top-16 hidden h-[calc(100dvh-64px)] flex-1 flex-col py-8 xl:flex" aria-label="Live preview">
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-line-subtle bg-canvas p-6" style={{ background: 'radial-gradient(70% 50% at 50% 100%, var(--brand-soft), transparent 70%), var(--bg-canvas)' }}>
            <p className="mb-3 text-center t-overline text-fg3">Live preview</p>
            <LivePreview ev={ev} className="flex-1" />
          </div>
        </aside>
      </div>
      <Drawer open={preview} onClose={() => setPreview(false)} title="Live preview" side="bottom">
        <LivePreview ev={ev} className="min-h-[560px]" />
      </Drawer>
      <ContactSheet open={talk} onClose={() => setTalk(false)} context="Tell us about your event and we will set it up, usually the same day." />
    </div>
  )
}
