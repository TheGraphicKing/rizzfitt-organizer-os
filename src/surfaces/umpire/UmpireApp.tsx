import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftRight, Check, ChevronRight, CircleCheck, Clock, HeartPulse, Menu, Timer, Undo2, UserRound, X, Flag } from 'lucide-react'
import { useData } from '../../store/hooks'
import { parseCourtToken } from '../../mock/seed'
import { matchTitle, sideLabel, sidePlayers } from '../../store/selectors'
import { addPoints, callTimeout, confirmByPlayers, confirmResult, endMatch, endTimeout, rulesOf, scoreRally, setUmpireStatus, startMatch, undoRally, walkover } from '../../store/matchActions'
import { gameWins, isGameOver, isMatchOver, pointSituation } from '../../lib/scoring'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { Logo } from '../../components/ui/Misc'
import { useConfirm, toast } from '../../components/ui/Overlay'
import { fmtTime } from '../../lib/format'
import { NotFound } from '../../app/NotFound'
import { useReducedMotion } from '../../theme/motion'
import { cn } from '../../lib/cn'
import type { DemoData, Match } from '../../mock/types'

function useStoredName(token: string): [string, (v: string) => void] {
  const key = `rizzfitt-umpire-${token}`
  const [v, setV] = useState(() => {
    try {
      return localStorage.getItem(key) ?? ''
    } catch {
      return ''
    }
  })
  return [
    v,
    (n: string) => {
      setV(n)
      try {
        localStorage.setItem(key, n)
      } catch {
        /* private mode: keep in memory */
      }
    },
  ]
}

export function UmpireApp() {
  const { courtToken = '' } = useParams()
  const parsed = parseCourtToken(courtToken)
  const d = useData()
  const ev = parsed ? d.events.find((e) => e.id === parsed.eventId) : undefined
  const [name, setName] = useStoredName(courtToken)
  const [draft, setDraft] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  if (!parsed || !ev) return <NotFound />
  const court = parsed.court
  const ump = d.umpires.find((u) => u.eventId === ev.id && u.court === court)
  const ms = d.matches.filter((m) => m.eventId === ev.id && m.court === court)
  const now = ms.find((m) => m.status === 'live' || m.status === 'paused') ?? ms.find((m) => m.status === 'called') ?? ms.find((m) => m.status === 'awaiting_confirmation')
  const next = ms.filter((m) => m.status === 'scheduled').sort((a, b) => (a.scheduledAt ?? '9').localeCompare(b.scheduledAt ?? '9')).slice(0, 3)
  const active = openId ? d.matches.find((m) => m.id === openId) : undefined

  if (!name)
    return (
      <Shell title={`Court ${court}`} sub={ev.name}>
        <form
          className="flex flex-1 flex-col justify-center gap-5 px-5"
          onSubmit={(e) => {
            e.preventDefault()
            const n = draft.trim() || ump?.name || ''
            if (n.length < 2) return
            setName(n)
            if (ump) setUmpireStatus(ump.id, 'active')
          }}
        >
          <div>
            <p className="t-overline text-brand-text">Umpire</p>
            <h1 className="mt-1 text-[32px] font-bold leading-tight text-fg">
              Court {court} · {ev.name}
            </h1>
            <p className="mt-2 text-fg2">Confirm your name to start scoring. You will see the matches called to this court.</p>
          </div>
          {ump && !draft && (
            <button type="button" onClick={() => { setName(ump.name); setUmpireStatus(ump.id, 'active') }} className="flex min-h-16 items-center gap-3 rounded-lg border border-brand bg-brand-soft px-4 text-left">
              <UserRound className="text-brand-text" aria-hidden />
              <span className="flex-1">
                <span className="block text-[18px] font-semibold text-fg">I am {ump.name}</span>
                <span className="t-small text-fg3">Invited by the organizer</span>
              </span>
              <ChevronRight className="text-fg3" aria-hidden />
            </button>
          )}
          <Input label={ump ? 'Or type your name' : 'Your name'} value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="name" />
          <Button type="submit" size="lg" block disabled={!(draft.trim().length >= 2 || ump)}>
            Start
          </Button>
        </form>
      </Shell>
    )

  if (active) return <MatchFlow key={active.id} d={d} m={active} umpire={name} onDone={() => setOpenId(null)} />

  return (
    <Shell title={`Court ${court}`} sub={ev.name} right={<span className="t-small text-fg3">{name}</span>}>
      <div className="flex flex-col gap-5 px-4 py-5">
        <section>
          <h2 className="mb-2 t-overline text-fg3">Now</h2>
          {now ? (
            <button type="button" onClick={() => setOpenId(now.id)} className={cn('flex w-full flex-col gap-2 rounded-xl border-2 p-5 text-left', now.status === 'live' ? 'border-live bg-danger-soft' : 'border-brand bg-brand-soft')}>
              <span className="flex items-center justify-between">
                <span className="t-small font-semibold text-fg2">{matchTitle(d, now)}</span>
                <span className="t-small font-bold text-fg">{now.status === 'live' ? 'LIVE, tap to continue' : now.status === 'awaiting_confirmation' ? 'Needs confirmation' : 'Called, tap to start'}</span>
              </span>
              <span className="text-[22px] font-bold leading-tight text-fg">{sideLabel(d, now.sideA, true)}</span>
              <span className="t-small text-fg3">vs</span>
              <span className="text-[22px] font-bold leading-tight text-fg">{sideLabel(d, now.sideB, true)}</span>
            </button>
          ) : (
            <div className="rounded-xl border border-line p-6 text-center">
              <Clock className="mx-auto text-fg3" aria-hidden />
              <p className="mt-2 text-[18px] font-semibold text-fg">Waiting for the next match</p>
              <p className="t-small text-fg3">The organizer calls matches to this court. It appears here instantly.</p>
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-2 t-overline text-fg3">Next on this court</h2>
          <ul className="flex flex-col gap-2">
            {next.map((m) => (
              <li key={m.id} className="rounded-lg border border-line-subtle bg-s1 px-4 py-3">
                <p className="t-small text-fg3">
                  {m.scheduledAt ? fmtTime(m.scheduledAt) : 'TBD'} · {matchTitle(d, m)}
                </p>
                <p className="text-fg">
                  {sideLabel(d, m.sideA, true)} vs {sideLabel(d, m.sideB, true)}
                </p>
              </li>
            ))}
            {next.length === 0 && <li className="t-small text-fg3">Nothing else scheduled here yet.</li>}
          </ul>
        </section>
      </div>
    </Shell>
  )
}

function Shell({ title, sub, right, children }: { title: string; sub: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-14 items-center gap-3 border-b border-line-subtle px-4">
        <Logo size="sm" />
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-fg">
          {title} <span className="font-normal text-fg3">· {sub}</span>
        </span>
        {right}
      </header>
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  )
}

/* ------------------------------------------------------------- one match */

function MatchFlow({ d, m, umpire, onDone }: { d: DemoData; m: Match; umpire: string; onDone: () => void }) {
  const [first, setFirst] = useState<'A' | 'B'>('A')
  const [swapped, setSwapped] = useState(false)
  const [handoff, setHandoff] = useState<{ A: boolean; B: boolean } | null>(null)
  const ev = d.events.find((e) => e.id === m.eventId)!
  if (m.status === 'called' || m.status === 'scheduled')
    return (
      <Shell title={`Court ${m.court}`} sub={matchTitle(d, m)} right={<button type="button" aria-label="Back" onClick={onDone} className="flex h-11 w-11 items-center justify-center text-fg3"><X /></button>}>
        <div className="flex flex-1 flex-col gap-5 px-4 py-5">
          <h1 className="text-[26px] font-bold text-fg">Before you start</h1>
          {(['A', 'B'] as const).map((s) => (
            <div key={s} className="rounded-lg border border-line bg-s1 p-4">
              <p className="t-overline text-fg4">Side {s}</p>
              {sidePlayers(d, s === 'A' ? m.sideA : m.sideB).map((p) => {
                const pl = d.players.find((x) => x.id === p)
                return (
                  <p key={p} className="text-[18px] font-semibold text-fg">
                    {pl?.firstName} {pl?.lastName}
                  </p>
                )
              })}
            </div>
          ))}
          <div>
            <p className="mb-2 font-semibold text-fg">Toss: who serves first?</p>
            <div className="grid grid-cols-2 gap-2">
              {(['A', 'B'] as const).map((s) => (
                <button key={s} type="button" aria-pressed={first === s} onClick={() => setFirst(s)} className={cn('min-h-16 rounded-lg border-2 px-3 text-[16px] font-semibold', first === s ? 'border-brand bg-brand-soft text-fg' : 'border-line text-fg2')}>
                  {sideLabel(d, s === 'A' ? m.sideA : m.sideB, true)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 font-semibold text-fg">Sides</p>
            <button type="button" onClick={() => setSwapped(!swapped)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border border-line text-fg2">
              <ArrowLeftRight size={18} aria-hidden /> {swapped ? 'B on the left, A on the right' : 'A on the left, B on the right'}
            </button>
          </div>
          <Button size="lg" block className="mt-auto h-16 text-[18px]" onClick={() => startMatch(m.id, first)}>
            Start match
          </Button>
        </div>
      </Shell>
    )
  if (m.status === 'awaiting_confirmation' || m.status === 'done' || m.status === 'walkover') {
    const w = gameWins(m.games, rulesOf(d, m))
    const winner = w.a > w.b ? 'A' : 'B'
    return (
      <Shell title={`Court ${m.court}`} sub={matchTitle(d, m)}>
        <div className="flex flex-1 flex-col gap-5 px-4 py-6">
          <div className="text-center">
            <CircleCheck size={44} className="mx-auto text-success" aria-hidden />
            <h1 className="mt-2 text-[26px] font-bold text-fg">{m.status === 'done' || m.status === 'walkover' ? 'Result confirmed' : 'Match over'}</h1>
            <p className="mt-1 text-fg2">{sideLabel(d, winner === 'A' ? m.sideA : m.sideB, true)} win</p>
            <p className="mt-3 text-[32px] font-bold text-fg tnum">{m.games.map((g) => `${g.a}-${g.b}`).join('  ')}</p>
          </div>
          {m.status === 'awaiting_confirmation' && !handoff && (
            <>
              <Button size="lg" block className="h-16 text-[18px]" icon={<Check size={20} />} onClick={() => { confirmResult(m.id, `Umpire ${umpire}`); toast.success('Result confirmed. Thank you.') }}>
                Confirm result
              </Button>
              <Button size="lg" variant="secondary" block className="h-14" onClick={() => setHandoff({ A: false, B: false })}>
                Hand to players to confirm
              </Button>
            </>
          )}
          {m.status === 'awaiting_confirmation' && handoff && (
            <div className="flex flex-col gap-3">
              <p className="text-center text-fg2">Each team taps their name to agree with the score.</p>
              {(['A', 'B'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={handoff[s]}
                  onClick={() => {
                    const n = { ...handoff, [s]: true }
                    setHandoff(n)
                    if (n.A && n.B) {
                      confirmByPlayers(m.id)
                      toast.success('Both teams confirmed')
                    }
                  }}
                  className={cn('flex min-h-16 items-center justify-between rounded-lg border-2 px-4 text-[18px] font-semibold', handoff[s] ? 'border-success bg-success-soft text-success' : 'border-line text-fg')}
                >
                  {sideLabel(d, s === 'A' ? m.sideA : m.sideB, true)}
                  {handoff[s] && <Check aria-hidden />}
                </button>
              ))}
            </div>
          )}
          {(m.status === 'done' || m.status === 'walkover') && (
            <Button size="lg" block className="mt-auto h-16 text-[18px]" onClick={onDone}>
              Next match
            </Button>
          )}
        </div>
      </Shell>
    )
  }
  return <Pad d={d} m={m} sport={ev.sport} swapped={swapped} setSwapped={setSwapped} umpire={umpire} onDone={onDone} />
}

function Pad({ d, m, sport, swapped, setSwapped, umpire, onDone }: { d: DemoData; m: Match; sport: string; swapped: boolean; setSwapped: (v: boolean) => void; umpire: string; onDone: () => void }) {
  const r = rulesOf(d, m)
  const reduced = useReducedMotion()
  const confirm = useConfirm()
  const [menu, setMenu] = useState(false)
  const [toPick, setToPick] = useState(false)
  const [tick, setTick] = useState(0)
  const [ripple, setRipple] = useState<{ side: 'A' | 'B'; x: number; y: number; k: number } | null>(null)
  const cur = m.games[m.games.length - 1] ?? { a: 0, b: 0 }
  const gameDone = isGameOver(cur, r)
  const over = isMatchOver(m.games, m.bestOf, r)
  const wins = gameWins(m.games, r)
  const sit = pointSituation(m.games, m.bestOf, r, m.live)
  const doubles = sidePlayers(d, m.sideA).length > 1
  const racquet = sport === 'pickleball' || sport === 'badminton' || sport === 'multi' || sport === 'circuit'
  const timeoutLeft = m.live?.timeoutUntil ? Math.max(0, Math.ceil((Date.parse(m.live.timeoutUntil) - Date.now()) / 1000)) : 0
  useEffect(() => {
    if (!timeoutLeft) return
    const t = setInterval(() => setTick((x) => x + 1), 250)
    return () => clearInterval(t)
  }, [timeoutLeft])
  useEffect(() => {
    if (m.live?.timeoutUntil && timeoutLeft === 0) endTimeout(m.id)
  }, [tick]) // clear the timeout once the countdown ends
  const order: ('A' | 'B')[] = swapped ? ['B', 'A'] : ['A', 'B']
  const tap = (side: 'A' | 'B', e: React.PointerEvent) => {
    if (over || timeoutLeft) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setRipple({ side, x: e.clientX - rect.left, y: e.clientY - rect.top, k: Date.now() })
    if (racquet) scoreRally(m.id, side)
    else addPoints(m.id, side, 1)
    if (navigator.vibrate) navigator.vibrate(12)
  }
  const label = useMemo(() => ({ A: sideLabel(d, m.sideA, true), B: sideLabel(d, m.sideB, true) }), [d, m.sideA, m.sideB])
  return (
    <div className="flex h-dvh flex-col bg-canvas text-fg">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line-subtle px-2">
        <button type="button" aria-label="Undo last point" onClick={() => undoRally(m.id)} className="flex h-12 items-center gap-1.5 rounded-md px-3 font-semibold text-fg active:bg-s2">
          <Undo2 size={22} /> Undo
        </button>
        <div className="flex-1 text-center">
          <p className="truncate text-[13px] text-fg3">Court {m.court} · Game {m.games.length} of {m.bestOf === 3 ? 'best of 3' : '1'}</p>
          <p className="text-[15px] font-bold tnum">
            Games {wins.a}-{wins.b}
          </p>
        </div>
        <button type="button" aria-label="Timeout" onClick={() => setToPick(true)} className="flex h-12 items-center gap-1.5 rounded-md px-3 font-semibold text-fg active:bg-s2">
          <Timer size={22} />
        </button>
        <button type="button" aria-label="Menu" onClick={() => setMenu(true)} className="flex h-12 w-12 items-center justify-center rounded-md text-fg active:bg-s2">
          <Menu size={22} />
        </button>
      </header>
      <AnimatePresence>
        {sit && !over && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} className={cn('shrink-0 py-2 text-center text-[16px] font-bold tracking-wide', sit.kind === 'match' ? 'bg-brand text-on-brand' : 'bg-warning text-ink')} role="status">
            {sit.kind === 'match' ? 'MATCH POINT' : 'GAME POINT'} · {label[sit.side]}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-1 flex-col landscape:flex-row">
        {order.map((side) => {
          const serving = m.live?.server === side
          const pts = side === 'A' ? cur.a : cur.b
          return (
            <button
              key={side}
              type="button"
              onPointerDown={(e) => tap(side, e)}
              onClick={(e) => {
                // keyboard and screen readers fire click with detail 0; pointers already scored on pointer down
                if (e.detail === 0 && !over && !timeoutLeft) {
                  if (racquet) scoreRally(m.id, side)
                  else addPoints(m.id, side, 1)
                }
              }}
              aria-label={`Point to ${label[side]}. Current score ${pts}.${serving ? ' Serving.' : ''}`}
              className={cn('relative flex flex-1 flex-col items-center justify-center overflow-hidden border-line-subtle transition-colors active:brightness-125', side === order[0] ? 'border-b landscape:border-b-0 landscape:border-r' : '', serving ? 'bg-brand-soft' : 'bg-s1')}
            >
              {ripple?.side === side && !reduced && (
                <motion.span key={ripple.k} className="pointer-events-none absolute rounded-full bg-brand" style={{ left: ripple.x - 20, top: ripple.y - 20, width: 40, height: 40 }} initial={{ opacity: 0.45, scale: 0 }} animate={{ opacity: 0, scale: 14 }} transition={{ duration: 0.6 }} />
              )}
              <span className="relative px-4 text-center text-[20px] font-semibold text-fg2">{label[side]}</span>
              <motion.span key={`${side}-${pts}`} initial={reduced ? false : { rotateX: -90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: 0.25 }} className="relative font-bold leading-none tnum" style={{ fontSize: 'min(34vw, 30vh)' }}>
                {pts}
              </motion.span>
              {serving && racquet && (
                <span className="relative mt-2 flex items-center gap-2 rounded-pill bg-brand px-3 py-1 text-[14px] font-bold text-on-brand">
                  <span className="h-2.5 w-2.5 rounded-full bg-on-brand" aria-hidden />
                  Serving{r.scoring === 'side_out' && doubles ? `, server ${m.live?.serverNo}` : ''}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {(gameDone || over) && (
        <div className="shrink-0 border-t border-line-subtle bg-s1 p-3">
          {over ? (
            <Button size="lg" block className="h-16 text-[18px]" icon={<Flag size={20} />} onClick={() => endMatch(m.id)}>
              End match: {label[over]} win
            </Button>
          ) : (
            <p className="py-2 text-center font-semibold text-fg">Game over. Tap a side to start game {m.games.length + 1}.</p>
          )}
        </div>
      )}
      {timeoutLeft > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-canvas/90" role="alertdialog" aria-label="Timeout">
          <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden>
            <circle cx="100" cy="100" r="88" stroke="var(--surface-3)" strokeWidth="12" fill="none" />
            <circle cx="100" cy="100" r="88" stroke="var(--brand)" strokeWidth="12" fill="none" strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - timeoutLeft / r.timeoutSeconds)} transform="rotate(-90 100 100)" strokeLinecap="round" />
            <text x="100" y="116" textAnchor="middle" fill="var(--text-primary)" fontSize="52" fontWeight="700">{timeoutLeft}</text>
          </svg>
          <p className="text-[20px] font-semibold text-fg">Timeout</p>
          <Button variant="secondary" onClick={() => endTimeout(m.id)}>
            End timeout early
          </Button>
        </div>
      )}
      {toPick && (
        <Sheet onClose={() => setToPick(false)} title="Timeout for">
          {(['A', 'B'] as const).map((s) => {
            const used = s === 'A' ? m.live?.timeoutsUsed.a ?? 0 : m.live?.timeoutsUsed.b ?? 0
            return (
              <button key={s} type="button" disabled={used >= r.timeoutsPerTeam} onClick={() => { callTimeout(m.id, s); setToPick(false) }} className="flex min-h-16 w-full items-center justify-between rounded-lg border border-line px-4 text-left text-[17px] font-semibold text-fg disabled:opacity-40">
                {label[s]}
                <span className="t-small text-fg3">{r.timeoutsPerTeam - used} left</span>
              </button>
            )
          })}
        </Sheet>
      )}
      {menu && (
        <Sheet onClose={() => setMenu(false)} title="Match menu">
          <button type="button" onClick={() => { setSwapped(!swapped); setMenu(false) }} className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-line px-4 text-left text-fg">
            <ArrowLeftRight size={20} aria-hidden /> Switch sides
          </button>
          <button type="button" onClick={() => { toast.info('Medical timeout: up to 5 minutes', { body: 'Logged on the match timeline.' }); setMenu(false) }} className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-line px-4 text-left text-fg">
            <HeartPulse size={20} aria-hidden /> Medical timeout
          </button>
          {(['A', 'B'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={async () => {
                setMenu(false)
                const ok = await confirm({ title: `${label[s]} retire?`, body: `${label[s === 'A' ? 'B' : 'A']} win by walkover. The organizer is told.`, confirmLabel: 'Record retirement', tone: 'danger' })
                if (ok) walkover(m.id, s === 'A' ? 'B' : 'A', `Umpire ${umpire}`)
              }}
              className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-line px-4 text-left text-danger"
            >
              <Flag size={20} aria-hidden /> {label[s]} retire
            </button>
          ))}
          <button type="button" onClick={() => { setMenu(false); onDone() }} className="flex min-h-14 w-full items-center justify-center rounded-lg px-4 text-fg3">
            Back to match list
          </button>
        </Sheet>
      )}
    </div>
  )
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-canvas/70" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full rounded-t-xl border-t border-line-strong bg-s2 p-4 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-fg">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-11 w-11 items-center justify-center text-fg3">
            <X />
          </button>
        </div>
        <div className="flex flex-col gap-2">{children}</div>
      </div>
    </div>
  )
}
