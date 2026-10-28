import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Logo } from '../../components/ui/Misc'
import { Button } from '../../components/ui/Button'
import { Input, OtpInput, PhoneInput } from '../../components/ui/Field'
import { toast } from '../../components/ui/Overlay'
import { fakeDelay, useUi, getData } from '../../store/store'
import { createDraftEvent, signInOrganizer, SETUP_STEPS } from '../../store/actions'
import { fmtPhone } from '../../lib/format'

const PaddleBall = lazy(() => import('../../components/3d/scenes/PaddleBall'))

/** Invite tokens prefill the organization (from a Rizzfitt invite link). */
const INVITES: Record<string, { org: string; event: string; name: string }> = {
  'smash-factory': { org: 'Smash Factory Chennai', event: 'Chennai Smash Open', name: 'Rahul Menon' },
}

const DEMO_CODE = '123456'

export function SignIn() {
  const { token } = useParams()
  const invite = token ? INVITES[token] ?? { org: 'Your club', event: 'your event', name: '' } : null
  const navigate = useNavigate()
  const setUi = useUi((s) => s.set)
  const [step, setStep] = useState<'mobile' | 'otp' | 'name'>('mobile')
  const [mobile, setMobile] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState(invite?.name ?? '')
  const [org, setOrg] = useState(invite?.org ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  const sendCode = async () => {
    if (mobile.length !== 10 || !/^[6-9]/.test(mobile)) {
      setErr('Enter a 10 digit Indian mobile number')
      return
    }
    setErr(null)
    setBusy(true)
    await fakeDelay(500, 900)
    setBusy(false)
    setStep('otp')
    setResendIn(30)
    toast.info(`Code sent to ${fmtPhone(mobile)}`, { body: `Demo code: ${DEMO_CODE}` })
  }

  const verify = async (value = code) => {
    if (value.length < 6) {
      setErr('Enter all 6 digits')
      return
    }
    setBusy(true)
    await fakeDelay(400, 800)
    setBusy(false)
    if (value !== DEMO_CODE) {
      setErr('That code is not right. Check the SMS and try again.')
      setShake(true)
      setTimeout(() => setShake(false), 450)
      return
    }
    setErr(null)
    const existing = getData().organizers.find((o) => o.mobile === mobile)
    if (existing && !invite) {
      const isMeera = existing.id === 'org-meera'
      setUi({ organizerId: existing.id, persona: isMeera ? 'organizer' : 'new_organizer', viewAs: null })
      toast.success(`Welcome back, ${existing.name.split(' ')[0]}`)
      const latest = getData().events.filter((e) => e.organizerId === existing.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      if (!isMeera && latest && !latest.setup.completed) navigate(`/setup/${latest.id}/${SETUP_STEPS[Math.min(7, latest.setup.step - 1)]}`)
      else navigate('/events')
      return
    }
    if (mobile === '9000020002' && !name) setName('Rahul Menon')
    setStep('name')
  }

  const finish = async () => {
    if (name.trim().length < 2) {
      setErr('Tell us your name so players know who is organizing')
      return
    }
    setBusy(true)
    await fakeDelay(500, 900)
    const orgId = signInOrganizer(mobile, name, org || undefined)
    const eventId = createDraftEvent(orgId, invite ? { name: invite.event } : undefined)
    setUi({ organizerId: orgId, persona: 'new_organizer', currentEventId: eventId, viewAs: null })
    setBusy(false)
    navigate(`/setup/${eventId}/you`)
  }

  return (
    <div className="flex min-h-dvh bg-canvas">
      <div className="relative hidden flex-1 overflow-hidden lg:block" aria-hidden>
        <div className="bg-courtlines absolute inset-0" />
        <div className="floodlight absolute inset-0" />
        <Suspense fallback={null}>
          <PaddleBall className="absolute inset-0" />
        </Suspense>
        <div className="absolute bottom-10 left-10 max-w-sm">
          <p className="t-overline text-brand-text">Self-serve setup</p>
          <p className="mt-2 t-h1 text-fg">Your event app, ready in about 15 minutes.</p>
        </div>
      </div>
      <main id="main" className="relative flex w-full flex-col px-4 py-6 sm:px-8 lg:w-[560px] lg:shrink-0 lg:border-l lg:border-line-subtle">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Back to home">
            <Logo />
          </Link>
          <Link to="/" className="flex h-11 items-center gap-1 rounded-md px-2 text-[14px] font-semibold text-fg3 hover:text-fg">
            <ArrowLeft size={16} aria-hidden /> Home
          </Link>
        </div>
        <div className="relative mx-auto my-auto w-full max-w-[420px] py-10">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-40 blur-3xl lg:hidden" style={{ background: 'var(--brand-glow)' }} aria-hidden />
          {invite && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-hq bg-hq-soft p-4" role="status">
              <Sparkles size={18} className="mt-0.5 shrink-0 text-hq-text" aria-hidden />
              <p className="text-[14px] text-fg">
                Rizzfitt invited you to set up <strong>{invite.event}</strong>. We filled in {invite.org} for you.
              </p>
            </div>
          )}
          <div className="glass rounded-xl border border-line-strong p-6 shadow-float sm:p-8">
            <AnimatePresence mode="wait">
              {step === 'mobile' && (
                <motion.form
                  key="m"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={(e) => {
                    e.preventDefault()
                    sendCode()
                  }}
                  className="flex flex-col gap-5"
                >
                  <div>
                    <h1 className="t-h1 text-fg">Let's set up your event</h1>
                    <p className="mt-1 text-fg2">Sign in or create your account with your mobile number.</p>
                  </div>
                  <PhoneInput value={mobile} onChange={(v) => { setMobile(v); setErr(null) }} error={err} autoFocus helper="We send a 6 digit code. No password needed." />
                  <Button type="submit" size="lg" block loading={busy}>
                    Send code
                  </Button>
                  <p className="t-small text-fg3">Organizing already? Use the number you signed up with. Demo: 90000 10001 is Meera, 90000 20002 is a new organizer.</p>
                </motion.form>
              )}
              {step === 'otp' && (
                <motion.form
                  key="o"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={(e) => {
                    e.preventDefault()
                    verify()
                  }}
                  className="flex flex-col gap-5"
                >
                  <div>
                    <h1 className="t-h1 text-fg">Enter your code</h1>
                    <p className="mt-1 text-fg2">
                      Sent to {fmtPhone(mobile)}.{' '}
                      <button type="button" className="font-semibold text-brand-text hover:underline" onClick={() => { setStep('mobile'); setCode(''); setErr(null) }}>
                        Change
                      </button>
                    </p>
                  </div>
                  <OtpInput
                    value={code}
                    onChange={(v) => {
                      setCode(v)
                      setErr(null)
                      if (v.length === 6) verify(v)
                    }}
                    error={!!err}
                    shake={shake}
                  />
                  {err ? (
                    <p className="t-small text-danger" role="alert">
                      {err}
                    </p>
                  ) : (
                    <p className="rounded-md bg-brand-soft px-3 py-2 t-small text-brand-text">Demo code: {DEMO_CODE}</p>
                  )}
                  <Button type="submit" size="lg" block loading={busy}>
                    Verify
                  </Button>
                  <button
                    type="button"
                    disabled={resendIn > 0}
                    onClick={() => {
                      setResendIn(30)
                      toast.info('New code sent', { body: `Demo code: ${DEMO_CODE}` })
                    }}
                    className="h-11 t-small font-semibold text-fg2 hover:text-fg disabled:text-fg4"
                  >
                    {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                  </button>
                </motion.form>
              )}
              {step === 'name' && (
                <motion.form
                  key="n"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={(e) => {
                    e.preventDefault()
                    finish()
                  }}
                  className="flex flex-col gap-5"
                >
                  <div>
                    <h1 className="t-h1 text-fg">What should we call you?</h1>
                    <p className="mt-1 text-fg2">Players see this name on your event page.</p>
                  </div>
                  <Input label="Your name" value={name} onChange={(e) => { setName(e.target.value); setErr(null) }} error={err} autoFocus autoComplete="name" placeholder="Rahul Menon" />
                  {invite && <Input label="Organization" value={org} onChange={(e) => setOrg(e.target.value)} />}
                  <Button type="submit" size="lg" block loading={busy}>
                    Start setup
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-6 text-center t-small text-fg3">By continuing you agree to the [TERMS OF SERVICE] and [PRIVACY POLICY].</p>
        </div>
      </main>
    </div>
  )
}
