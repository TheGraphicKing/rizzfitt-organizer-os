import { useEffect, useState } from 'react'
import { CircleCheck, Clock, Flag, MapPin, Minus, Pause, Play, Plus, Radio, Settings2, ShieldCheck, Whistle } from 'lucide-react'
import type { DemoData, EventCategory, GameScore, Group, Match } from '../../mock/types'
import { groupStandings, isConfirmed, matchWinner, STAGE_LABEL } from '../../lib/tournament'
import { matchTitle, sideLabel, sidePlayers, stageLabel } from '../../store/selectors'
import { confirmResult, correctScore, moveCourt, pauseMatch, rulesOf, setRulesOverride, walkover, callNextMatch } from '../../store/matchActions'
import { Drawer, toast, Dialog } from '../ui/Overlay'
import { Button } from '../ui/Button'
import { StatusChip, LiveBadge, Segmented, Toggle } from '../ui/Controls'
import { Select, Textarea } from '../ui/Field'
import { fmtDateTime, fmtTime } from '../../lib/format'
import { rulesSentence } from '../../lib/scoring'
import { useData, useReadOnly } from '../../store/hooks'
import { cn } from '../../lib/cn'

export function MatchStatusChip({ m, now }: { m: Match; now?: number }) {
  if (m.status === 'live') return <LiveBadge />
  if (m.status === 'done' || m.status === 'walkover') return <StatusChip tone="success" icon={<CircleCheck size={12} aria-hidden />}>{m.status === 'walkover' ? 'Walkover' : 'Final'}</StatusChip>
  if (m.status === 'awaiting_confirmation') return <StatusChip tone="warning" icon={<Flag size={12} aria-hidden />}>Confirm result</StatusChip>
  if (m.status === 'called') return <StatusChip tone="warning" icon={<Whistle size={12} aria-hidden />}>Called</StatusChip>
  if (m.status === 'paused') return <StatusChip tone="neutral" icon={<Pause size={12} aria-hidden />}>Paused</StatusChip>
  const late = now && m.scheduledAt && Date.parse(m.scheduledAt) < now - 10 * 60000
  return <StatusChip tone={late ? 'warning' : 'neutral'} icon={<Clock size={12} aria-hidden />}>{m.scheduledAt ? fmtTime(m.scheduledAt) : 'Not scheduled'}</StatusChip>
}

export function MatchCard({ d, m, onOpen, showCat }: { d: DemoData; m: Match; onOpen: (m: Match) => void; showCat?: boolean }) {
  const w = isConfirmed(m) ? matchWinner(m) : undefined
  const umpire = d.umpires.find((u) => u.id === m.umpireId)
  const line = (side: 'A' | 'B') => {
    const id = side === 'A' ? m.sideA : m.sideB
    return (
      <div className="flex items-center gap-2">
        <span className={cn('min-w-0 flex-1 truncate text-[14px]', w === side ? 'font-semibold text-fg' : 'text-fg2')}>{sideLabel(d, id, true)}</span>
        <span className="flex gap-1">
          {m.games.map((g, i) => (
            <span key={i} className={cn('w-6 rounded-[5px] text-center text-[13px] tnum', (side === 'A' ? g.a > g.b : g.b > g.a) ? 'bg-s3 font-bold text-fg' : 'text-fg3')}>
              {side === 'A' ? g.a : g.b}
            </span>
          ))}
        </span>
      </div>
    )
  }
  return (
    <button type="button" onClick={() => onOpen(m)} className={cn('card flex w-full flex-col gap-2 p-3 text-left hover:border-line-strong', m.status === 'live' && 'border-live/60')}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate t-small text-fg3">{showCat ? matchTitle(d, m) : stageLabel(d, m)}{m.court ? ` · Court ${m.court}` : ''}</span>
        <MatchStatusChip m={m} now={d.now} />
      </div>
      {line('A')}
      {line('B')}
      {umpire && <span className="t-small text-fg4">Umpire: {umpire.name}</span>}
    </button>
  )
}

export function StandingsTable({ d, group, cat, compact }: { d: DemoData; group: Group; cat: EventCategory; compact?: boolean }) {
  const rows = groupStandings(group, d.matches, cat.format === 'round_robin' ? 1 : cat.advancePerGroup, d.events.find((e) => e.id === cat.eventId)?.settings.rankingCriteria)
  return (
    <table className="w-full text-[14px]">
      <caption className="sr-only">Standings, group {group.name}</caption>
      <thead>
        <tr className="t-overline text-fg4">
          <th scope="col" className="w-8 py-2 text-left">Pos</th>
          <th scope="col" className="py-2 text-left">{cat.teamSize === 2 ? 'Team' : 'Player'}</th>
          {['P', 'W', 'L', ...(compact ? [] : ['PF', 'PA']), '+/-'].map((h) => (
            <th key={h} scope="col" className="w-9 py-2 text-right">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.regId} className={cn('border-t border-line-subtle', r.qualified && 'bg-success-soft/40')}>
            <td className="py-2 font-semibold text-fg2 tnum">{r.pos}</td>
            <td className="max-w-0 truncate py-2 text-fg">
              {sideLabel(d, r.regId, true)} {r.qualified && <span className="ml-1 text-[11px] font-bold text-success">Q</span>}
            </td>
            {[r.p, r.w, r.l, ...(compact ? [] : [r.pf, r.pa]), r.diff].map((v, i) => (
              <td key={i} className="py-2 text-right text-fg2 tnum">
                {i === (compact ? 3 : 5) && v > 0 ? `+${v}` : v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ------------------------------------------------------------ match drawer */

export function MatchDrawer({ matchId, onClose, actor = 'Meera Iyer' }: { matchId: string | null; onClose: () => void; actor?: string }) {
  const d = useData()
  const readOnly = useReadOnly()
  const m = matchId ? d.matches.find((x) => x.id === matchId) : undefined
  const [editing, setEditing] = useState(false)
  const [games, setGames] = useState<GameScore[]>([])
  const [reason, setReason] = useState('')
  const [rules, setRules] = useState(false)
  const [moveTo, setMoveTo] = useState<number | null>(null)
  const [wo, setWo] = useState<'A' | 'B' | null>(null)
  useEffect(() => {
    setEditing(false)
    setReason('')
    if (m) setGames(m.games.length ? m.games.map((g) => ({ ...g })) : [{ a: 0, b: 0 }])
  }, [matchId]) // reset when a different match opens
  if (!m) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>
  const ev = d.events.find((e) => e.id === m.eventId)!
  const r = rulesOf(d, m)
  const umpire = d.umpires.find((u) => u.id === m.umpireId)
  const players = (id: string | null) => sidePlayers(d, id).map((p) => d.players.find((x) => x.id === p))
  const canCorrect = m.status !== 'scheduled' && m.status !== 'called'
  return (
    <Drawer open onClose={onClose} title={`${sideLabel(d, m.sideA, true)} vs ${sideLabel(d, m.sideB, true)}`} subtitle={<span className="flex flex-wrap items-center gap-2">{matchTitle(d, m)} <MatchStatusChip m={m} now={d.now} /></span>} width={520}>
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-2 gap-3" aria-label="Teams">
          {(['A', 'B'] as const).map((s) => {
            const id = s === 'A' ? m.sideA : m.sideB
            const won = isConfirmed(m) && matchWinner(m) === s
            return (
              <div key={s} className={cn('card p-3', won && 'border-success/50')}>
                <p className="t-overline text-fg4">{s === 'A' ? 'Side A' : 'Side B'}</p>
                {players(id).map((p) => (
                  <p key={p?.id} className="truncate text-[14px] font-semibold text-fg">
                    {p ? `${p.firstName} ${p.lastName}` : 'TBD'}
                  </p>
                ))}
                {!id && <p className="text-fg4">TBD</p>}
                {won && <StatusChip tone="success" className="mt-2">Winner</StatusChip>}
              </div>
            )
          })}
        </section>

        <section aria-label="Score">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="t-overline text-fg3">Score</h3>
            <span className="t-small text-fg3">{rulesSentence(r)}</span>
          </div>
          {!editing ? (
            <div className="flex flex-wrap gap-2">
              {m.games.length === 0 && <p className="text-fg3">No score yet.</p>}
              {m.games.map((g, i) => (
                <span key={i} className="rounded-md border border-line bg-s1 px-3 py-2 text-[18px] font-bold text-fg tnum">
                  {g.a}-{g.b}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {games.map((g, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-16 t-small text-fg3">Game {i + 1}</span>
                  {(['a', 'b'] as const).map((k) => (
                    <div key={k} className="flex items-center gap-1">
                      <button type="button" aria-label={`Game ${i + 1} side ${k.toUpperCase()} minus`} className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-s2" onClick={() => setGames(games.map((x, j) => (j === i ? { ...x, [k]: Math.max(0, x[k] - 1) } : x)))}>
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-[18px] font-bold text-fg tnum">{g[k]}</span>
                      <button type="button" aria-label={`Game ${i + 1} side ${k.toUpperCase()} plus`} className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-s2" onClick={() => setGames(games.map((x, j) => (j === i ? { ...x, [k]: x[k] + 1 } : x)))}>
                        <Plus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex gap-2">
                {games.length < 3 && <Button size="sm" variant="ghost" onClick={() => setGames([...games, { a: 0, b: 0 }])}>Add game</Button>}
                {games.length > 1 && <Button size="sm" variant="ghost" onClick={() => setGames(games.slice(0, -1))}>Remove last game</Button>}
              </div>
              <Textarea label="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Umpire missed a point, wrong side recorded..." />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={reason.trim().length < 3}
                  onClick={() => {
                    correctScore(m.id, games, reason.trim(), actor)
                    setEditing(false)
                    setReason('')
                    toast.success('Score corrected', { body: 'Standings, bracket and screens are updated. Logged in the audit trail.' })
                  }}
                >
                  Save correction
                </Button>
              </div>
            </div>
          )}
        </section>

        {!readOnly && !editing && (
          <section aria-label="Actions" className="grid grid-cols-2 gap-2">
            {m.status === 'awaiting_confirmation' && (
              <Button className="col-span-2" icon={<ShieldCheck size={16} />} onClick={() => { confirmResult(m.id, actor); toast.success('Result confirmed', { body: 'The bracket has moved on.' }) }}>
                Confirm result
              </Button>
            )}
            {m.status === 'scheduled' && m.sideA && m.sideB && (
              <Button className="col-span-2" icon={<Radio size={16} />} onClick={() => { callNextMatch(m.eventId, m.court ?? 1, m.id); toast.success(`Called to Court ${m.court ?? 1}`, { body: 'Players notified on WhatsApp.' }) }}>
                Call to Court {m.court ?? 1}
              </Button>
            )}
            {canCorrect && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Correct score
              </Button>
            )}
            {(m.status === 'live' || m.status === 'paused') && (
              <Button variant="secondary" icon={m.status === 'paused' ? <Play size={14} /> : <Pause size={14} />} onClick={() => pauseMatch(m.id, m.status !== 'paused')}>
                {m.status === 'paused' ? 'Resume' : 'Pause'}
              </Button>
            )}
            {!isConfirmed(m) && m.sideA && m.sideB && (
              <Button variant="secondary" onClick={() => setWo('A')}>
                Walkover
              </Button>
            )}
            {!isConfirmed(m) && (
              <Button variant="secondary" icon={<MapPin size={14} />} onClick={() => setMoveTo((m.court ?? 1) % ev.courts + 1)}>
                Move court
              </Button>
            )}
            {!isConfirmed(m) && (
              <Button variant="ghost" icon={<Settings2 size={14} />} onClick={() => setRules(true)}>
                Rules for this match
              </Button>
            )}
          </section>
        )}

        <section aria-label="Details" className="grid grid-cols-2 gap-3 text-[14px]">
          <div>
            <p className="t-overline text-fg4">Court and time</p>
            <p className="text-fg2">{m.court ? `Court ${m.court}` : 'Not assigned'}{m.scheduledAt ? `, ${fmtTime(m.scheduledAt)}` : ''}</p>
          </div>
          <div>
            <p className="t-overline text-fg4">Umpire</p>
            <p className="text-fg2">{umpire?.name ?? 'Not assigned'}</p>
          </div>
          <div>
            <p className="t-overline text-fg4">Stage</p>
            <p className="text-fg2">{STAGE_LABEL[m.stage]}</p>
          </div>
          {ev.certifications.dupr && (
            <div>
              <p className="t-overline text-fg4">DUPR</p>
              <p className="text-fg2">{m.dupr === 'synced' ? 'Synced' : m.dupr === 'failed' ? 'Needs attention' : m.dupr === 'pending' ? 'Pending sync' : 'After the result'}</p>
            </div>
          )}
        </section>

        {m.corrections.length > 0 && (
          <section aria-label="Audit trail">
            <h3 className="mb-2 t-overline text-fg3">Audit trail</h3>
            <ul className="flex flex-col gap-2">
              {m.corrections.map((c, i) => (
                <li key={i} className="rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-[14px] text-fg">
                  <strong>{c.by}</strong> changed {c.from} to {c.to}. <span className="text-fg2">Reason: {c.reason}</span>
                  <span className="block t-small text-fg3">{fmtDateTime(c.at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-label="Timeline">
          <h3 className="mb-2 t-overline text-fg3">Timeline</h3>
          {m.timeline.length === 0 ? (
            <p className="t-small text-fg3">Nothing yet.</p>
          ) : (
            <ol className="relative flex flex-col gap-3 border-l border-line pl-4">
              {[...m.timeline].reverse().map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden />
                  <p className="text-[14px] text-fg">{t.text}</p>
                  <p className="t-small text-fg3">{fmtDateTime(t.at)}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <Dialog
        open={moveTo !== null}
        onClose={() => setMoveTo(null)}
        title="Move to another court"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMoveTo(null)}>Cancel</Button>
            <Button onClick={() => { moveCourt(m.id, moveTo!); toast.success(`Moved to Court ${moveTo}`); setMoveTo(null) }}>Move match</Button>
          </>
        }
      >
        <Select label="Court" value={String(moveTo ?? 1)} onChange={(e) => setMoveTo(Number(e.target.value))} options={Array.from({ length: ev.courts }, (_, i) => ({ value: String(i + 1), label: `Court ${i + 1}` }))} />
      </Dialog>
      <Dialog
        open={wo !== null}
        onClose={() => setWo(null)}
        tone="danger"
        title="Record a walkover?"
        description="The winner gets a full win in standings and moves on. The other side is out of this match."
        footer={
          <>
            <Button variant="secondary" onClick={() => setWo(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { walkover(m.id, wo!, actor); toast.success('Walkover recorded'); setWo(null) }}>Record walkover</Button>
          </>
        }
      >
        <Segmented label="Winner" block value={wo ?? 'A'} onChange={setWo} options={[{ value: 'A', label: sideLabel(d, m.sideA, true) }, { value: 'B', label: sideLabel(d, m.sideB, true) }]} />
      </Dialog>
      <Dialog open={rules} onClose={() => setRules(false)} title="Rules for this match" description="Overrides the category defaults for this match only." footer={<Button onClick={() => setRules(false)}>Done</Button>}>
        <div className="flex flex-col gap-4">
          <Segmented label="Scoring" value={r.scoring} onChange={(v) => setRulesOverride(m.id, { scoring: v })} options={[{ value: 'rally', label: 'Rally' }, { value: 'side_out', label: 'Side-out' }]} />
          <Select label="Points" value={String(r.pointsToWin)} onChange={(e) => setRulesOverride(m.id, { pointsToWin: Number(e.target.value) })} options={[11, 15, 21].map((n) => ({ value: String(n), label: `To ${n}` }))} />
          <Segmented label="Games" value={String(m.bestOf) as '1' | '3'} onChange={(v) => setRulesOverride(m.id, { games: Number(v) as 1 | 3 })} options={[{ value: '1', label: '1 game' }, { value: '3', label: 'Best of 3' }]} />
          <Segmented label="Golden point" value={String(r.goldenPoint) as '0' | '1' | '2'} onChange={(v) => setRulesOverride(m.id, { goldenPoint: Number(v) as 0 | 1 | 2 })} options={[{ value: '0', label: 'None' }, { value: '1', label: '1' }, { value: '2', label: '2' }]} />
          <Toggle checked={r.fixedSideAlternateServe} onChange={(v) => setRulesOverride(m.id, { fixedSideAlternateServe: v })} label="Fixed side, alternate serve" />
          <Select label="Timeouts per team" value={String(r.timeoutsPerTeam)} onChange={(e) => setRulesOverride(m.id, { timeoutsPerTeam: Number(e.target.value) })} options={[0, 1, 2, 3].map((n) => ({ value: String(n), label: String(n) }))} />
        </div>
      </Dialog>
    </Drawer>
  )
}
