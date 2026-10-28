import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { useData } from '../../store/hooks'
import { categoriesOf, courtInfo, matchTitle, sideLabel, sidePlayers, upNext, playerName } from '../../store/selectors'
import { rulesOf } from '../../store/matchActions'
import { gameWins, pointSituation } from '../../lib/scoring'
import { isConfirmed, matchWinner } from '../../lib/tournament'
import { accentVars } from '../../lib/color'
import { fmtTime } from '../../lib/format'
import { BRAND_NAME, PUBLIC_HOST } from '../../lib/brand'
import { NotFound } from '../../app/NotFound'
import { EventGlyph } from '../workspace/shared'
import { useReducedMotion } from '../../theme/motion'
import { QR } from '../../components/ui/Misc'
import { cn } from '../../lib/cn'
import type { DemoData, EventItem, Match } from '../../mock/types'

/** Scales a fixed 1920x1080 stage to fit any window. */
function Stage({ children, accent }: { children: React.ReactNode; accent: string }) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div className="fixed inset-0 overflow-hidden bg-canvas" style={accentVars(accent) as React.CSSProperties}>
      <div className="absolute left-1/2 top-1/2" style={{ width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}

export function FlipNumber({ value, size }: { value: number; size: number }) {
  const reduced = useReducedMotion()
  const digits = String(value).split('')
  return (
    <span className="inline-flex gap-[0.06em] tnum" style={{ fontSize: size, lineHeight: 1, perspective: 800 }} aria-label={String(value)}>
      {digits.map((dg, i) => (
        <span key={`${digits.length}-${i}`} className="relative inline-block overflow-hidden rounded-[0.08em] bg-s2 px-[0.08em] font-bold text-fg shadow-[inset_0_-0.5em_0_rgba(0,0,0,0.18)]" style={{ minWidth: '0.68em', textAlign: 'center' }}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span key={dg} initial={reduced ? { opacity: 0 } : { rotateX: -100, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} exit={reduced ? { opacity: 0 } : { rotateX: 100, opacity: 0 }} transition={{ duration: 0.38, ease: [0.3, 0, 0, 1] }} className="inline-block" style={{ transformOrigin: '50% 50%' }}>
              {dg}
            </motion.span>
          </AnimatePresence>
          <span className="absolute inset-x-0 top-1/2 h-[2px] bg-canvas/70" aria-hidden />
        </span>
      ))}
    </span>
  )
}

function SponsorRail({ d, ev }: { d: DemoData; ev: EventItem }) {
  const sp = d.sponsors.filter((s) => s.eventId === ev.id && s.active).sort((a, b) => a.order - b.order)
  if (!sp.length || !ev.settings.tv.showSponsors) return null
  const items = [...sp, ...sp, ...sp, ...sp]
  return (
    <div className="absolute inset-x-0 bottom-0 h-[110px] overflow-hidden border-t border-line-subtle bg-s1/90">
      <div className="tv-marquee flex h-full items-center gap-24 whitespace-nowrap px-12">
        {items.map((s, i) => (
          <span key={i} className="flex items-center gap-5">
            <span className="rounded-md px-5 py-2 text-[30px] font-bold tracking-[0.12em] text-on-brand" style={{ background: s.color }}>
              {s.logoText}
            </span>
            <span className="text-[22px] text-fg3">{s.tier === 'title' ? 'Title partner' : s.tier === 'gold' ? 'Gold partner' : 'Partner'}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function TopBand({ ev, court, sub }: { ev: EventItem; court: string; sub?: string }) {
  const t = ev.settings.tv.template
  return (
    <div className={cn('absolute inset-x-0 top-0 flex h-[110px] items-center gap-6 px-14', t === 'arena' ? 'bg-accent text-on-accent' : t === 'glass' ? 'glass border-b border-line-strong text-fg' : 'border-b border-line-subtle text-fg')}>
      <EventGlyph ev={ev} size={64} />
      <span className="text-[40px] font-bold tracking-[-0.02em]">{ev.name}</span>
      <span className={cn('ml-auto text-[34px] font-bold', t === 'arena' ? '' : 'text-accent')}>{court}</span>
      {sub && <span className="max-w-[620px] truncate text-[28px] opacity-80">{sub}</span>}
    </div>
  )
}

function Scoreboard({ d, m, ev }: { d: DemoData; m: Match; ev: EventItem }) {
  const r = rulesOf(d, m)
  const cur = m.games[m.games.length - 1] ?? { a: 0, b: 0 }
  const wins = gameWins(m.status === 'live' ? m.games.slice(0, -1) : m.games, r)
  const sit = m.status === 'live' ? pointSituation(m.games, m.bestOf, r, m.live) : null
  const t = ev.settings.tv.template
  const row = (side: 'A' | 'B') => {
    const id = side === 'A' ? m.sideA : m.sideB
    const serving = m.live?.server === side && m.status === 'live'
    const players = sidePlayers(d, id).map((p) => d.players.find((x) => x.id === p))
    return (
      <div className={cn('flex items-center gap-10 rounded-[28px] px-12 py-8', t === 'glass' ? 'glass border border-line-strong' : t === 'arena' ? 'bg-s1' : '')}>
        <span className={cn('h-8 w-8 shrink-0 rounded-full', serving ? 'bg-brand' : 'bg-transparent')} aria-label={serving ? 'Serving' : undefined} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[64px] font-bold leading-tight text-fg">{sideLabel(d, id, true)}</p>
          {ev.settings.tv.showPlayerCards && <p className="truncate text-[28px] text-fg3">{players.map((p) => playerName(p)).join(' and ')}</p>}
        </div>
        <div className="flex gap-3">
          {m.games.slice(0, m.status === 'live' ? -1 : undefined).map((g, i) => (
            <span key={i} className={cn('flex h-[92px] w-[92px] items-center justify-center rounded-[18px] text-[48px] font-bold tnum', (side === 'A' ? g.a > g.b : g.b > g.a) ? 'bg-accent text-on-accent' : 'bg-s2 text-fg3')}>
              {side === 'A' ? g.a : g.b}
            </span>
          ))}
        </div>
        {m.status === 'live' || m.status === 'paused' ? <FlipNumber value={side === 'A' ? cur.a : cur.b} size={180} /> : <span className="w-[200px] text-right text-[64px] font-bold text-fg3 tnum">{side === 'A' ? wins.a : wins.b}</span>}
      </div>
    )
  }
  return (
    <div className="relative flex flex-col gap-6">
      <p className="text-[34px] font-semibold text-fg2">
        {matchTitle(d, m)}
        {m.status === 'live' && <span className="ml-6 inline-flex items-center gap-3 rounded-pill bg-danger-soft px-5 py-1 text-[28px] font-bold text-live"><span className="animate-live h-4 w-4 rounded-full bg-live" /> LIVE</span>}
        {m.status === 'called' && <span className="ml-6 text-[28px] text-warning">Players to the court</span>}
        {m.status === 'awaiting_confirmation' && <span className="ml-6 text-[28px] text-warning">Result being confirmed</span>}
      </p>
      {row('A')}
      {row('B')}
      <AnimatePresence>
        {sit && (
          <motion.div initial={{ x: -120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 120, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }} className={cn('absolute -top-6 right-0 rounded-[18px] px-8 py-3 text-[40px] font-bold tracking-[0.06em]', sit.kind === 'match' ? 'bg-brand text-on-brand' : 'bg-warning text-ink')}>
            {sit.kind === 'match' ? 'MATCH POINT' : 'GAME POINT'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Between({ d, ev }: { d: DemoData; ev: EventItem }) {
  const cats = categoriesOf(d, ev.id)
  const winners = cats
    .map((c) => {
      const f = d.matches.find((m) => m.categoryId === c.id && m.stage === 'final' && isConfirmed(m))
      const rr = c.format === 'round_robin' && d.matches.filter((m) => m.categoryId === c.id).every(isConfirmed)
      if (f) return { cat: c.label, team: sideLabel(d, matchWinner(f) === 'A' ? f.sideA : f.sideB, true) }
      if (rr) return { cat: c.label, team: 'Round robin complete' }
      return null
    })
    .filter((x): x is { cat: string; team: string } => !!x)
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => x + 1), 5000)
    return () => clearInterval(t)
  }, [])
  const w = winners.length ? winners[i % winners.length] : null
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
      <Trophy size={120} className="text-warning" aria-hidden />
      <p className="text-[40px] font-semibold text-fg3">{w ? 'Winners so far' : 'Next match coming up'}</p>
      <AnimatePresence mode="wait">
        {w && (
          <motion.div key={w.cat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <p className="text-[48px] text-accent">{w.cat}</p>
            <p className="text-[96px] font-bold leading-tight text-fg">{w.team}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SingleCourt({ d, ev, court }: { d: DemoData; ev: EventItem; court: number }) {
  const info = courtInfo(d, ev.id, court)
  const m = info.current ?? info.awaiting
  const next = upNext(d, ev.id).filter((x) => x.court === court).slice(0, 2)
  return (
    <>
      <TopBand ev={ev} court={`Court ${court}`} sub={m ? undefined : undefined} />
      <div className="absolute inset-x-14 bottom-[150px] top-[170px] flex gap-12">
        <div className="min-w-0 flex-1">{m ? <Scoreboard d={d} m={m} ev={ev} /> : <Between d={d} ev={ev} />}</div>
        {ev.settings.tv.showUpNext && (
          <aside className="flex w-[480px] shrink-0 flex-col gap-5">
            <p className="text-[32px] font-bold text-fg">Up next on Court {court}</p>
            {next.map((x) => (
              <div key={x.id} className={cn('rounded-[24px] p-7', ev.settings.tv.template === 'glass' ? 'glass border border-line-strong' : 'bg-s1')}>
                <p className="text-[24px] text-fg3">
                  {x.scheduledAt ? fmtTime(x.scheduledAt) : 'Soon'} · {matchTitle(d, x).split(' · ')[1]}
                </p>
                <p className="truncate text-[32px] font-semibold text-fg">{sideLabel(d, x.sideA, true)}</p>
                <p className="truncate text-[32px] font-semibold text-fg2">vs {sideLabel(d, x.sideB, true)}</p>
              </div>
            ))}
            {next.length === 0 && <p className="text-[26px] text-fg3">Check the desk for the next call.</p>}
            <div className="mt-auto flex items-center gap-5">
              <QR value={`https://${PUBLIC_HOST}${ev.slug}/live`} size={120} />
              <p className="text-[24px] text-fg2">Live scores on your phone</p>
            </div>
          </aside>
        )}
      </div>
      <SponsorRail d={d} ev={ev} />
    </>
  )
}

function AllCourts({ d, ev }: { d: DemoData; ev: EventItem }) {
  const courts = Array.from({ length: ev.courts }, (_, i) => courtInfo(d, ev.id, i + 1))
  const shown = [...courts.filter((c) => c.state === 'live'), ...courts.filter((c) => c.state !== 'live')].slice(0, 4).sort((a, b) => a.court - b.court)
  return (
    <>
      <TopBand ev={ev} court="All courts" />
      <div className="absolute inset-x-14 bottom-[150px] top-[160px] grid grid-cols-2 grid-rows-2 gap-8">
        {shown.map((c) => {
          const m = c.current ?? c.awaiting
          const cur = m?.games[m.games.length - 1]
          return (
            <div key={c.court} className={cn('flex flex-col rounded-[28px] border p-8', c.state === 'live' ? 'border-accent bg-s1 shadow-[0_0_60px_-20px_var(--event-accent-glow)]' : 'border-line-subtle bg-s1/60')}>
              <div className="flex items-center justify-between">
                <p className="text-[36px] font-bold text-fg">Court {c.court}</p>
                {c.state === 'live' ? <span className="flex items-center gap-3 text-[26px] font-bold text-live"><span className="animate-live h-4 w-4 rounded-full bg-live" />LIVE</span> : <span className="text-[26px] text-fg3">{c.state === 'late' ? `${c.lateMin} min late` : c.state === 'free' ? 'Next match soon' : c.state === 'awaiting' ? 'Confirming result' : 'Called'}</span>}
              </div>
              {m ? (
                <div className="mt-auto flex flex-col gap-3">
                  <p className="text-[24px] text-fg3">{matchTitle(d, m)}</p>
                  {(['A', 'B'] as const).map((s) => (
                    <div key={s} className="flex items-center gap-4">
                      <span className={cn('h-5 w-5 rounded-full', m.live?.server === s && m.status === 'live' ? 'bg-brand' : '')} />
                      <span className="min-w-0 flex-1 truncate text-[40px] font-semibold text-fg">{sideLabel(d, s === 'A' ? m.sideA : m.sideB, true)}</span>
                      {cur && <FlipNumber value={s === 'A' ? cur.a : cur.b} size={84} />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-auto text-[28px] text-fg3">{c.next ? `Next: ${matchTitle(d, c.next)}` : 'No match on this court'}</p>
              )}
            </div>
          )
        })}
      </div>
      <SponsorRail d={d} ev={ev} />
    </>
  )
}

/** T-01 Court TV. Updates live from the shared store (other tabs included). */
export function CourtTv() {
  const { eventId, court } = useParams()
  const d = useData()
  const ev = d.events.find((e) => e.id === eventId)
  useEffect(() => {
    document.title = ev ? `${ev.name} · Court TV` : `${BRAND_NAME} Court TV`
  }, [ev])
  if (!ev) return <NotFound />
  if (!ev.settings.tv.enabled)
    return (
      <Stage accent={ev.accent}>
        <div className="flex h-full items-center justify-center text-[48px] text-fg3">Court TV is turned off for this event.</div>
      </Stage>
    )
  const n = Number(court)
  return (
    <Stage accent={ev.accent}>
      <div className="tv-ambient absolute inset-0" aria-hidden />
      <main id="main" aria-live="polite" className="absolute inset-0">
        {court === 'all' || !n ? <AllCourts d={d} ev={ev} /> : <SingleCourt d={d} ev={ev} court={n} />}
      </main>
    </Stage>
  )
}
