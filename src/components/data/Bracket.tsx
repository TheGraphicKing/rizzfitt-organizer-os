import { useMemo, useState } from 'react'
import { Minus, Plus, Trophy } from 'lucide-react'
import type { DemoData, EventCategory, Match } from '../../mock/types'
import { isConfirmed, matchWinner, STAGE_LABEL } from '../../lib/tournament'
import { sideLabel } from '../../store/selectors'
import { useReducedMotion } from '../../theme/motion'
import { cn } from '../../lib/cn'

const ORDER = ['r32', 'r16', 'qf', 'sf', 'final'] as const

interface Cell {
  kind: 'match' | 'bye' | 'empty'
  match?: Match
  byeTeam?: string | null
  byeSrc?: string
}

/**
 * S8: knockout bracket on a tilted plane. Byes show as cards that skip round one; TBD slots wait for results.
 * The champion's path lights up; hovering a team highlights theirs. The DOM is the accessible version.
 */
export function Bracket({ d, cat, onOpen, accent = 'var(--brand)', compact }: { d: DemoData; cat: EventCategory; onOpen?: (m: Match) => void; accent?: string; compact?: boolean }) {
  const reduced = useReducedMotion()
  const [hover, setHover] = useState<string | null>(null)
  const [zoom, setZoom] = useState(compact ? 0.85 : 1)
  const ko = d.matches.filter((m) => m.categoryId === cat.id && m.stage !== 'group' && m.stage !== 'league')
  const third = ko.find((m) => m.stage === 'third')
  const rounds = ORDER.filter((s) => ko.some((m) => m.stage === s))
  const columns = useMemo(() => {
    if (!rounds.length) return []
    // the final has 1 slot and each earlier round doubles
    const slots = Math.pow(2, rounds.length - 1)
    return rounds.map((stage, ri) => {
      const n = slots / Math.pow(2, ri)
      const cells: Cell[] = Array.from({ length: n }, (_, i) => {
        const m = ko.find((x) => x.stage === stage && x.slot === i + 1)
        if (m) return { kind: 'match', match: m }
        if (ri === 0) {
          // a bye: the team sits directly in the next round's match
          const next = ko.find((x) => x.stage === rounds[1] && x.slot === Math.floor(i / 2) + 1)
          const isA = i % 2 === 0
          return { kind: 'bye', byeTeam: next ? (isA ? next.sideA : next.sideB) : null, byeSrc: next ? (isA ? next.srcA : next.srcB) : undefined }
        }
        return { kind: 'empty' }
      })
      return { stage, cells }
    })
  }, [ko, rounds])
  const final = ko.find((m) => m.stage === 'final')
  const champ = final && isConfirmed(final) ? (matchWinner(final) === 'A' ? final.sideA : final.sideB) : null
  const focus = hover ?? champ
  if (!rounds.length) return <p className="p-6 text-fg3">No knockout for this category.</p>
  const cellH = compact ? 76 : 92
  const height = columns[0].cells.length * cellH
  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))} className="glass flex h-9 w-9 items-center justify-center rounded-md border border-line text-fg2 hover:text-fg">
          <Minus size={16} />
        </button>
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))} className="glass flex h-9 w-9 items-center justify-center rounded-md border border-line text-fg2 hover:text-fg">
          <Plus size={16} />
        </button>
      </div>
      <div className="overflow-auto rounded-lg" style={{ perspective: 1400 }}>
        <div
          className="origin-top-left p-6 transition-transform duration-500 ease-standard"
          style={{ transform: `${reduced || compact ? '' : 'rotateX(10deg) '}scale(${zoom})`, transformStyle: 'preserve-3d', width: 'max-content' }}
          role="list"
          aria-label={`${cat.label} knockout bracket`}
        >
          <div className="flex gap-6">
            {columns.map((col, ci) => (
              <div key={col.stage} role="listitem" className="flex w-[230px] flex-col">
                <p className="mb-2 t-overline text-fg3">{STAGE_LABEL[col.stage]}</p>
                <div className="flex flex-col justify-around" style={{ height }}>
                  {col.cells.map((c, i) => (
                    <div key={i} className="relative flex items-center" style={{ height: cellH }}>
                      {c.kind === 'match' && c.match && <BracketMatch d={d} m={c.match} focus={focus} onHover={setHover} onOpen={onOpen} accent={accent} />}
                      {c.kind === 'bye' && (
                        <div className="w-full rounded-md border border-dashed border-line px-3 py-2 text-[13px]">
                          <span className="block truncate text-fg2">{c.byeTeam ? sideLabel(d, c.byeTeam, true) : c.byeSrc ? `Group ${c.byeSrc[0]} #${c.byeSrc.slice(1)}` : 'TBD'}</span>
                          <span className="t-small text-fg4">Bye, goes straight through</span>
                        </div>
                      )}
                      {ci < columns.length - 1 && c.kind !== 'empty' && <span aria-hidden className="absolute -right-6 top-1/2 h-px w-6" style={{ background: c.match && focus && (c.match.sideA === focus || c.match.sideB === focus) ? accent : 'var(--border)' }} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex w-[160px] flex-col justify-center" style={{ height: height + 24 }}>
              <div className={cn('flex flex-col items-center gap-2 rounded-lg border p-4 text-center', champ ? 'border-[color:var(--mat-gold)] bg-warning-soft' : 'border-line-subtle')}>
                <Trophy size={28} className={champ ? 'text-warning' : 'text-fg4'} aria-hidden />
                <p className="t-overline text-fg3">Champion</p>
                <p className="text-[14px] font-semibold text-fg">{champ ? sideLabel(d, champ, true) : 'To be decided'}</p>
              </div>
            </div>
          </div>
          {third && (
            <div className="mt-6 w-[230px]">
              <p className="mb-2 t-overline text-fg3">3rd place</p>
              <BracketMatch d={d} m={third} focus={focus} onHover={setHover} onOpen={onOpen} accent={accent} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BracketMatch({ d, m, focus, onHover, onOpen, accent }: { d: DemoData; m: Match; focus: string | null; onHover: (id: string | null) => void; onOpen?: (m: Match) => void; accent: string }) {
  const w = isConfirmed(m) ? matchWinner(m) : undefined
  const lit = !!focus && (m.sideA === focus || m.sideB === focus)
  const row = (side: 'A' | 'B') => {
    const id = side === 'A' ? m.sideA : m.sideB
    const src = side === 'A' ? m.srcA : m.srcB
    const won = w === side
    const label = id ? sideLabel(d, id, true) : src ? `Group ${src[0]} #${src.slice(1)}` : 'TBD'
    return (
      <div className={cn('flex items-center gap-2 px-3 py-1.5', won && 'font-semibold')} onMouseEnter={() => id && onHover(id)} onMouseLeave={() => onHover(null)}>
        <span className={cn('min-w-0 flex-1 truncate text-[13px]', id ? (won ? 'text-fg' : 'text-fg2') : 'text-fg4')}>{label}</span>
        <span className="text-[13px] text-fg3 tnum">{m.games.map((g) => (side === 'A' ? g.a : g.b)).join(' ')}</span>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onOpen?.(m)}
      className={cn('w-full divide-y divide-line-subtle overflow-hidden rounded-md border bg-s1 text-left shadow-[0_8px_20px_-12px_rgba(0,0,0,0.8)] transition-[border-color,box-shadow] hover:border-line-strong', m.status === 'live' && 'border-live')}
      style={lit ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}, 0 10px 30px -12px ${accent}` } : undefined}
      aria-label={`${STAGE_LABEL[m.stage]}: ${m.sideA ? sideLabel(d, m.sideA) : 'TBD'} versus ${m.sideB ? sideLabel(d, m.sideB) : 'TBD'}${m.games.length ? `, ${m.games.map((g) => `${g.a}-${g.b}`).join(', ')}` : ''}`}
    >
      {row('A')}
      {row('B')}
    </button>
  )
}
