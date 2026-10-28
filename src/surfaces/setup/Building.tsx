import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Circle } from 'lucide-react'
import { celebrate } from '../../lib/celebrate'
import { useData } from '../../store/hooks'
import { completeSetup } from '../../store/actions'
import { categoriesOf } from '../../store/selectors'
import { MODULE_META } from '../../lib/modules'
import { useReducedMotion } from '../../theme/motion'
import { NotFound } from '../../app/NotFound'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/ui/Misc'
import { SPORT_META } from '../../mock/constants'
import { cn } from '../../lib/cn'

const BuildingApp = lazy(() => import('../../components/3d/scenes/BuildingApp'))
const DURATION = 5200

export function Building() {
  const { draftId } = useParams()
  const d = useData()
  const ev = d.events.find((e) => e.id === draftId)
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const progress = useRef(0)
  const [p, setP] = useState(0)
  const done = p >= 1
  const finished = useRef(false)

  const finish = () => {
    if (finished.current || !ev) return
    finished.current = true
    completeSetup(ev.id)
    celebrate()
    navigate(`/e/${ev.id}?built=1`, { replace: true })
  }

  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const v = Math.min(1, (t - start) / DURATION)
      progress.current = v
      setP(v)
      if (v < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  useEffect(() => {
    if (!done) return
    const t = setTimeout(finish, 1400)
    return () => clearTimeout(t)
  }, [done]) // finish is stable for this render

  if (!ev) return <NotFound />
  const cats = categoriesOf(d, ev.id)
  const lines = [
    `Creating ${ev.name || 'your event'}`,
    ev.type === 'tournament' ? `Adding ${cats.length} ${cats.length === 1 ? 'category' : 'categories'}` : ev.type === 'social' ? `Opening ${ev.social?.capacity} spots` : `Setting up ${ev.league?.teams} teams`,
    'Setting match rules',
    'Building your event page',
    `Preparing ${ev.courts} ${SPORT_META[ev.sport].courtWord.toLowerCase()}${ev.settings.umpiresOn ? ' and umpire links' : ''}`,
    'Designing your posters',
    'Done',
  ]
  const labels = ev.modules.map((m) => MODULE_META[m].label)
  return (
    <div className="floodlight relative flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-16 items-center justify-between px-6">
        <Logo size="sm" />
        <Button variant="ghost" onClick={finish}>
          Skip
        </Button>
      </header>
      <main id="main" className="mx-auto grid w-full max-w-[1280px] flex-1 items-center gap-8 px-6 pb-12 lg:grid-cols-[1fr_380px]">
        <div className="relative h-[46vh] min-h-[320px] lg:h-[70vh]">
          {!reduced && (
            <Suspense fallback={null}>
              <BuildingApp className="absolute inset-0" labels={labels} title={ev.name || 'Your event'} accent={ev.accent} progress={progress} done={done} />
            </Suspense>
          )}
          {reduced && (
            <div className="flex h-full flex-wrap content-center justify-center gap-2">
              {labels.map((l, i) => (
                <motion.span key={l} initial={{ opacity: 0 }} animate={{ opacity: p > i / labels.length ? 1 : 0.15 }} className="rounded-md border border-line bg-s2 px-3 py-2 text-[13px] font-semibold text-fg">
                  {l}
                </motion.span>
              ))}
            </div>
          )}
        </div>
        <section aria-live="polite">
          <p className="t-overline text-brand-text">Building your app</p>
          <h1 className="mt-2 t-h1 text-fg">{done ? `${ev.name || 'Your event'} is ready.` : 'Hang tight, this takes a few seconds.'}</h1>
          <ol className="mt-6 flex flex-col gap-3">
            {lines.map((l, i) => {
              const on = p >= (i + 1) / lines.length - 0.02
              return (
                <li key={l} className={cn('flex items-center gap-3 transition-opacity duration-300', on ? 'opacity-100' : 'opacity-40')}>
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', on ? 'bg-brand text-on-brand' : 'border border-line text-fg4')}>{on ? <Check size={16} strokeWidth={3} /> : <Circle size={10} />}</span>
                  <span className={cn('font-semibold', on ? 'text-fg' : 'text-fg3')}>{l}</span>
                </li>
              )
            })}
          </ol>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-s3" role="progressbar" aria-valuenow={Math.round(p * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-brand" style={{ width: `${p * 100}%` }} />
          </div>
        </section>
      </main>
    </div>
  )
}
