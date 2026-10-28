import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, FlaskConical, RotateCcw, TriangleAlert, X } from 'lucide-react'
import { cn } from '../lib/cn'
import { useUi, resetDemo } from '../store/store'
import { useData } from '../store/hooks'
import { setMoment, switchPersona } from '../store/actions'
import { IDS, courtToken } from '../mock/seed'
import type { Moment, Persona, Quality } from '../mock/types'
import { useConfirm, toast } from '../components/ui/Overlay'
import { Segmented } from '../components/ui/Controls'
import { GILROY_LOADED, LOGO_FILE } from '../lib/brand'

const PERSONAS: { key: Persona; label: string; sub: string }[] = [
  { key: 'organizer', label: 'Organizer', sub: 'Meera Iyer, Baseline Pickleball Club' },
  { key: 'new_organizer', label: 'New organizer', sub: 'Rahul Menon, Smash Factory Chennai' },
  { key: 'desk', label: 'Desk volunteer', sub: 'Ananya Pillai, registrations and check-in' },
  { key: 'umpire', label: 'Umpire', sub: 'Pick a court below, opens a new tab' },
  { key: 'player', label: 'Player', sub: 'Event microsite' },
  { key: 'tv', label: 'Court TV', sub: 'Pick a court below, opens a new tab' },
  { key: 'hq', label: 'Rizzfitt HQ', sub: 'Approvals, organizers, platform' },
]

const MOMENTS: { key: Moment; label: string }[] = [
  { key: 'before_launch', label: 'Before launch' },
  { key: 'registrations_open', label: 'Registrations open' },
  { key: 'draw_day', label: 'Draw day' },
  { key: 'match_day', label: 'Match day' },
  { key: 'finished', label: 'Finished' },
]

export function PrototypeSwitcher() {
  const [open, setOpen] = useState(false)
  const ui = useUi()
  const data = useData()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const ev = data.events.find((e) => e.id === ui.currentEventId) ?? data.events[0]
  const courtEvent = ev.courts && !ev.hqOnly && ev.type !== 'social' ? ev : data.events[0]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t?.closest('input, textarea, select, [contenteditable]')) return
      if (e.key === '\\') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const embedded = typeof window !== 'undefined' && window.self !== window.top
  const onTv = typeof window !== 'undefined' && window.location.pathname.startsWith('/tv/')

  const go = (p: Persona) => {
    if (p === 'umpire' || p === 'tv') {
      ui.set({ persona: p })
      toast.info(p === 'umpire' ? 'Pick a court to open the umpire app' : 'Pick a court to open its TV screen')
      return
    }
    const to = switchPersona(p)
    if (to) navigate(to)
    setOpen(false)
  }

  const myEvents = data.events.filter((e) => e.organizerId === IDS.meera)
  if (embedded) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="proto-switcher"
        className={cn(
          'glass fixed left-3 z-[95] flex h-11 min-w-11 items-center justify-center gap-2 rounded-pill border border-line-strong px-3 md:px-4 text-[13px] font-bold text-fg shadow-float hover:border-brand md:bottom-4 md:left-4',
          onTv ? 'bottom-3 opacity-30 hover:opacity-100' : 'bottom-[84px]',
        )}
      >
        <FlaskConical size={16} className="text-brand-text" aria-hidden /> <span className="hidden md:inline">Demo</span>
        <span className="sr-only">Prototype switcher, press backslash to toggle</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.section
            id="proto-switcher"
            role="dialog"
            aria-label="Prototype switcher"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass fixed bottom-[136px] left-3 right-3 z-[96] max-h-[70dvh] overflow-y-auto rounded-xl border border-line-strong p-4 shadow-float sm:right-auto sm:w-[400px] md:bottom-[68px] md:left-4"
            style={{ background: 'var(--glass-strong)' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="t-title text-fg">Prototype switcher</h2>
                <p className="t-small text-fg3">Jump between people, events and moments. Press \ to toggle.</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-md text-fg3 hover:bg-s2 hover:text-fg">
                <X size={18} />
              </button>
            </div>

            {(!LOGO_FILE || !GILROY_LOADED) && (
              <p className="mb-3 flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-[12px] text-warning">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
                Dev note: {!LOGO_FILE ? 'no logo files found. ' : ''}
                {!GILROY_LOADED ? 'Gilroy needs a licence, so display headlines use Urbanist (the approved fallback).' : ''}
              </p>
            )}

            <Group title="Persona">
              <div className="grid grid-cols-1 gap-1.5">
                {PERSONAS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => go(p.key)}
                    aria-pressed={ui.persona === p.key}
                    className={cn('flex min-h-11 flex-col items-start rounded-md border px-3 py-2 text-left transition-colors', ui.persona === p.key ? 'border-brand bg-brand-soft' : 'border-line-subtle hover:bg-s2')}
                  >
                    <span className="text-[14px] font-semibold text-fg">{p.label}</span>
                    <span className="text-[12px] text-fg3">{p.sub}</span>
                  </button>
                ))}
              </div>
            </Group>

            <Group title={`Courts: ${courtEvent.name}`}>
              <div className="flex flex-col gap-1.5">
                {Array.from({ length: courtEvent.courts }, (_, i) => i + 1).map((c) => (
                  <div key={c} className="flex items-center gap-2 text-[13px]">
                    <span className="w-16 font-semibold text-fg2">Court {c}</span>
                    <a href={`/u/${courtToken(courtEvent.id, c)}`} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-1 rounded-sm px-2 font-semibold text-brand-text hover:bg-s2">
                      Umpire <ExternalLink size={12} aria-hidden />
                    </a>
                    <a href={`/tv/${courtEvent.id}/${c}`} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-1 rounded-sm px-2 font-semibold text-brand-text hover:bg-s2">
                      TV <ExternalLink size={12} aria-hidden />
                    </a>
                    <code className="ml-auto truncate text-[11px] text-fg4">{courtToken(courtEvent.id, c)}</code>
                  </div>
                ))}
                <a href={`/tv/${courtEvent.id}/all`} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-1 self-start rounded-sm px-2 text-[13px] font-semibold text-brand-text hover:bg-s2">
                  TV: all courts <ExternalLink size={12} aria-hidden />
                </a>
              </div>
            </Group>

            <Group title="Jump to event">
              <div className="flex flex-col gap-1">
                {myEvents.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      ui.set({ currentEventId: e.id, persona: ui.persona === 'hq' || ui.persona === 'new_organizer' ? 'organizer' : ui.persona, organizerId: IDS.meera, viewAs: null })
                      navigate(e.setup.completed ? (ui.persona === 'player' ? `/p/${e.slug}` : `/e/${e.id}`) : `/setup/${e.id}/format`)
                      setOpen(false)
                    }}
                    className={cn('flex min-h-10 items-center justify-between rounded-md px-3 text-left text-[14px] hover:bg-s2', ui.currentEventId === e.id && 'bg-s2 font-semibold text-fg')}
                  >
                    <span className="truncate">{e.name}</span>
                    <span className="ml-2 shrink-0 text-[12px] text-fg3">{e.id === IDS.hero ? 'Live' : e.id === IDS.draft ? 'Setup in progress' : e.type}</span>
                  </button>
                ))}
              </div>
            </Group>

            <Group title="Event moment (Coimbatore Open)">
              <div className="flex flex-wrap gap-1.5">
                {MOMENTS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    aria-pressed={data.moment === m.key}
                    onClick={() => {
                      setMoment(m.key)
                      ui.set({ currentEventId: IDS.hero, persona: 'organizer', organizerId: IDS.meera, viewAs: null })
                      navigate(`/e/${IDS.hero}`)
                      toast.success(`Moment: ${m.label}`)
                    }}
                    className={cn('h-9 rounded-pill border px-3 text-[13px] font-semibold', data.moment === m.key ? 'border-brand bg-brand-soft text-fg' : 'border-line text-fg2 hover:bg-s2')}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </Group>

            <Group title="3D quality">
              <Segmented<Quality>
                label="3D quality"
                size="sm"
                block
                value={ui.quality}
                onChange={(q) => ui.set({ quality: q })}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Med' },
                  { value: 'low', label: 'Low' },
                  { value: 'off', label: 'Off' },
                ]}
              />
            </Group>
            <Group title="Reduced motion">
              <Segmented<'system' | 'on' | 'off'>
                label="Reduced motion"
                size="sm"
                block
                value={ui.reducedMotion === null ? 'system' : ui.reducedMotion ? 'on' : 'off'}
                onChange={(v) => ui.set({ reducedMotion: v === 'system' ? null : v === 'on' })}
                options={[
                  { value: 'system', label: 'System' },
                  { value: 'on', label: 'On' },
                  { value: 'off', label: 'Off' },
                ]}
              />
            </Group>

            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({ title: 'Reset demo data?', body: 'Every change made in this prototype is cleared and the seed data comes back. Other open tabs update too.', confirmLabel: 'Reset demo data', tone: 'danger' })
                if (!ok) return
                resetDemo()
                navigate(`/e/${IDS.hero}`)
                setOpen(false)
                toast.success('Demo data reset')
              }}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line text-[14px] font-semibold text-fg2 hover:border-danger hover:text-danger"
            >
              <RotateCcw size={16} aria-hidden /> Reset demo data
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 t-overline text-fg3">{title}</h3>
      {children}
    </div>
  )
}
