import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Gavel, Pause, Play, SkipForward, Undo2, UserRound, X } from 'lucide-react'
import { useData, useEvent } from '../../store/hooks'
import { getData } from '../../store/store'
import { playerName } from '../../store/selectors'
import { auctionBid, auctionHammer, auctionSetStatus, auctionSkip, auctionUndoLastSale } from '../../store/leagueActions'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { LiveBadge, Segmented, StatusChip } from '../../components/ui/Controls'
import { Avatar, EmptyState, TeamCrest } from '../../components/ui/Display'
import { toast, useConfirm } from '../../components/ui/Overlay'
import { PageHeader } from './shared'
import { inr } from '../../lib/format'
import { celebrate } from '../../lib/celebrate'
import { cn } from '../../lib/cn'

const AuctionStage = lazy(() => import('../../components/3d/scenes/AuctionStage'))

export function AuctionPage() {
  const ev = useEvent()
  const d = useData()
  const confirm = useConfirm()
  const a = d.auctions.find((x) => x.eventId === ev.id)
  const teams = d.leagueTeams.filter((t) => t.eventId === ev.id)
  const cfg = ev.auction
  const [view, setView] = useState<'organizer' | 'owner'>('organizer')
  const [ownerTeam, setOwnerTeam] = useState(teams[0]?.id ?? '')
  const [strike, setStrike] = useState(0)
  const [sold, setSold] = useState<{ name: string; team: string; amount: number } | null>(null)
  const [, setTick] = useState(0)
  const simRef = useRef(true)

  // Hands-free simulation: rival owners bid within their budgets; the hammer falls when the timer runs out.
  useEffect(() => {
    if (!a || a.status !== 'live' || !cfg) return
    const t = setInterval(() => {
      setTick((x) => x + 1)
      const cur = getData().auctions.find((x) => x.eventId === ev.id)
      if (!cur || cur.status !== 'live' || !cur.currentPlayerId) return
      const now = Date.now()
      if (!cur.deadline) {
        auctionBid(ev.id, getData().leagueTeams.filter((x) => x.eventId === ev.id)[Math.floor(Math.random() * teams.length)].id, cur.currentBid)
        return
      }
      const left = cur.deadline - now
      if (left <= 0) {
        const res = auctionHammer(ev.id)
        setStrike((s) => s + 1)
        if (res.sold) {
          const p = getData().players.find((x) => x.id === res.playerId)
          const tm = getData().leagueTeams.find((x) => x.id === res.teamId)
          setSold({ name: playerName(p), team: tm?.name ?? '', amount: res.amount ?? 0 })
          setTimeout(() => setSold(null), 2200)
          celebrate({ count: 60, y: 0.4 })
        } else toast.info('Unsold. Back in the pool later.')
        return
      }
      if (simRef.current && left > 2500 && Math.random() < 0.32) {
        const lot = cur.lots.find((l) => l.playerId === cur.currentPlayerId)!
        const ceiling = lot.basePrice * (lot.tier === 'A' ? 5 : lot.tier === 'B' ? 3.5 : 2.5)
        if (cur.currentBid >= ceiling) return
        const rivals = getData().leagueTeams.filter((x) => x.eventId === ev.id && x.id !== cur.leadingTeamId && x.playerIds.length < cfg.squadSize && (x.budget ?? 0) - (x.spent ?? 0) > cur.currentBid + 1000 && (view === 'organizer' || x.id !== ownerTeam))
        if (!rivals.length) return
        const step = cfg.bidSteps[Math.min(cfg.bidSteps.length - 1, lot.tier === 'A' ? 1 : 0)]
        auctionBid(ev.id, rivals[Math.floor(Math.random() * rivals.length)].id, cur.currentBid + step)
      }
    }, 700)
    return () => clearInterval(t)
  }, [a?.status, ev.id, cfg, teams.length, view, ownerTeam])

  if (!a || !cfg) return <div><PageHeader title="Auction room" /><EmptyState icon={Gavel} title="No auction yet" help="Finish setup to create the player pool and team budgets." /></div>
  const lot = a.lots.find((l) => l.playerId === a.currentPlayerId)
  const player = lot ? d.players.find((p) => p.id === lot.playerId) : undefined
  const leader = teams.find((t) => t.id === a.leadingTeamId)
  const left = a.deadline ? Math.max(0, (a.deadline - Date.now()) / 1000) : cfg.bidSeconds
  const pct = left / cfg.bidSeconds
  const feed = a.bids.slice(-12).reverse()
  const upcoming = a.lots.filter((l) => l.status === 'upcoming').sort((x, y) => x.order - y.order).slice(0, 6)
  const soldCount = a.lots.filter((l) => l.status === 'sold').length
  const mine = teams.find((t) => t.id === ownerTeam)
  return (
    <div>
      <PageHeader
        title="Auction room"
        subtitle={<span className="flex items-center gap-2">{a.status === 'live' && <LiveBadge />} {soldCount} of {a.lots.length} players sold · {inr(cfg.budgetPerTeam)} per team · squads of {cfg.squadSize}</span>}
        actions={<Segmented label="View" value={view} onChange={setView} options={[{ value: 'organizer', label: 'Organizer' }, { value: 'owner', label: 'Owner view' }]} />}
      />
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
        <Card className="h-fit p-4">
          <CardHeader title="Teams" subtitle="Remaining budget" />
          <ul className="flex flex-col gap-2">
            {teams.map((t) => {
              const rem = (t.budget ?? 0) - (t.spent ?? 0)
              return (
                <li key={t.id} className={cn('flex items-center gap-3 rounded-md border px-3 py-2', t.id === a.leadingTeamId ? 'border-brand bg-brand-soft' : 'border-line-subtle')}>
                  <TeamCrest name={t.name} color={t.color} short={t.short} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-fg">{t.name}</span>
                    <span className="t-small text-fg3">{t.playerIds.length} of {cfg.squadSize} players</span>
                  </span>
                  <span className="text-[14px] font-bold text-fg tnum">{inr(rem)}</span>
                </li>
              )
            })}
          </ul>
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="relative overflow-hidden p-0">
            <div className="floodlight grid items-center gap-6 p-6 sm:grid-cols-[auto_1fr]">
              <div className="relative mx-auto h-[220px] w-[220px]">
                <svg viewBox="0 0 220 220" className="absolute inset-0 -rotate-90" aria-hidden>
                  <circle cx="110" cy="110" r="102" stroke="var(--surface-3)" strokeWidth="8" fill="none" />
                  <circle cx="110" cy="110" r="102" stroke={pct < 0.3 ? 'var(--live)' : 'var(--brand)'} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 102} strokeDashoffset={2 * Math.PI * 102 * (1 - pct)} style={{ transition: 'stroke-dashoffset 700ms linear' }} />
                </svg>
                <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-s2 text-center shadow-[0_0_60px_-10px_var(--brand-glow)]">
                  {player ? <Avatar name={playerName(player)} color="var(--cat-4)" size={64} /> : <UserRound size={40} className="text-fg3" aria-hidden />}
                  <p className="mt-2 px-3 text-[15px] font-bold leading-tight text-fg">{player ? playerName(player) : 'No player'}</p>
                  {lot && <p className="t-small text-fg3">Tier {lot.tier} · base {inr(lot.basePrice)}</p>}
                  <p className="mt-1 text-[13px] font-bold text-brand-text tnum">{a.status === 'live' ? `${Math.ceil(left)}s` : a.status === 'paused' ? 'Paused' : ''}</p>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <p className="t-overline text-fg3">Current bid</p>
                <AnimatePresence mode="popLayout">
                  <motion.p key={a.currentBid} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="t-display-l text-fg tnum" aria-live="polite">{inr(a.currentBid)}</motion.p>
                </AnimatePresence>
                <p className="mt-2 flex items-center justify-center gap-2 text-fg2 sm:justify-start">
                  {leader ? <><TeamCrest name={leader.name} color={leader.color} short={leader.short} size={26} /> {leader.name} leads</> : 'Waiting for the first bid'}
                </p>
                {player && <p className="mt-2 t-small text-fg3">{player.skill} · DUPR {player.duprRating?.toFixed(2) ?? 'not rated'} · {player.city}</p>}
              </div>
            </div>
            <div className="relative h-[180px] border-t border-line-subtle bg-canvas">
              <Suspense fallback={null}>
                <AuctionStage className="absolute inset-0" teams={teams.map((t) => ({ id: t.id, color: t.color, value: Math.max(0, ((t.budget ?? 0) - (t.spent ?? 0)) / cfg.budgetPerTeam) }))} strikeKey={strike} />
              </Suspense>
            </div>
            <AnimatePresence>
              {sold && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-canvas/80 text-center" role="status">
                  <Gavel size={48} className="text-brand" aria-hidden />
                  <p className="mt-2 t-display-m text-fg">SOLD</p>
                  <p className="text-[18px] text-fg2">{sold.name} to {sold.team} for <strong className="text-fg">{inr(sold.amount)}</strong></p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
          {view === 'organizer' ? (
            <Card className="flex flex-wrap gap-2 p-4">
              {a.status === 'live' ? <Button variant="secondary" icon={<Pause size={16} />} onClick={() => auctionSetStatus(ev.id, 'paused')}>Pause</Button> : <Button icon={<Play size={16} />} disabled={a.status === 'finished'} onClick={() => auctionSetStatus(ev.id, 'live')}>{a.status === 'not_started' ? 'Start' : 'Resume'}</Button>}
              <Button icon={<Gavel size={16} />} disabled={!a.leadingTeamId} onClick={() => { const r = auctionHammer(ev.id); setStrike((s) => s + 1); if (r.sold) toast.success('Sold'); }}>Sold</Button>
              <Button variant="secondary" icon={<X size={16} />} disabled={!player} onClick={() => { auctionHammer(ev.id); toast.info('Marked unsold') }}>{a.leadingTeamId ? 'Next player' : 'Unsold'}</Button>
              <Button variant="ghost" icon={<SkipForward size={16} />} disabled={!player} onClick={() => auctionSkip(ev.id)}>Skip for now</Button>
              <Button variant="ghost" icon={<Undo2 size={16} />} disabled={!a.lastSale} onClick={async () => { if (await confirm({ title: 'Undo the last sale?', body: `The player goes back on the block and ${inr(a.lastSale!.amount)} returns to the team's budget.`, confirmLabel: 'Undo sale', tone: 'danger' })) { auctionUndoLastSale(ev.id); toast.success('Last sale undone') } }}>Undo last sale</Button>
              <label className="ml-auto flex items-center gap-2 t-small text-fg3"><input type="checkbox" defaultChecked onChange={(e) => (simRef.current = e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" /> Simulate rival owners</label>
            </Card>
          ) : (
            <Card className="p-4">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="t-small text-fg2">You are bidding for</span>
                <select aria-label="Your team" value={ownerTeam} onChange={(e) => setOwnerTeam(e.target.value)} className="h-10 rounded-md border border-line bg-s2 px-2 text-fg">{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                {mine && <span className="t-small text-fg3">Budget left <strong className="text-fg tnum">{inr((mine.budget ?? 0) - (mine.spent ?? 0))}</strong> · {mine.playerIds.length} of {cfg.squadSize}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {cfg.bidSteps.map((s) => {
                  const amt = (a.leadingTeamId ? a.currentBid : a.currentBid - s) + s
                  const can = !!mine && a.status === 'live' && a.leadingTeamId !== mine.id && (mine.budget ?? 0) - (mine.spent ?? 0) >= amt && mine.playerIds.length < cfg.squadSize
                  return <Button key={s} size="lg" className="h-16 text-[18px]" disabled={!can} onClick={() => { auctionBid(ev.id, ownerTeam, amt); toast.success(`You bid ${inr(amt)}`) }}>Bid {inr(amt)}</Button>
                })}
              </div>
              {mine && a.leadingTeamId === mine.id && <p className="mt-3 text-success">You are leading. Hold on.</p>}
            </Card>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <CardHeader title="Bids" />
            <ul className="flex max-h-[300px] flex-col gap-1.5 overflow-y-auto" aria-live="polite">
              <AnimatePresence initial={false}>
                {feed.map((b) => {
                  const t = teams.find((x) => x.id === b.teamId)
                  return (
                    <motion.li key={b.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-[14px]">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t?.color }} aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-fg2">{t?.name}</span>
                      <span className="font-semibold text-fg tnum">{inr(b.amount)}</span>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          </Card>
          <Card className="p-4">
            <CardHeader title="Up next" />
            <ul className="flex flex-col gap-1.5">
              {upcoming.map((l) => {
                const p = d.players.find((x) => x.id === l.playerId)
                return <li key={l.playerId} className="flex items-center justify-between gap-2 text-[14px]"><span className="truncate text-fg2">{playerName(p)}</span><StatusChip tone={l.tier === 'A' ? 'brand' : 'neutral'}>Tier {l.tier}</StatusChip></li>
              })}
              {!upcoming.length && <li className="t-small text-fg3">Last players on the block.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
