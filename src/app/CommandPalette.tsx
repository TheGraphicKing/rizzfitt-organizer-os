import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Search, Swords, User, Zap } from 'lucide-react'
import { useData } from '../store/hooks'
import { useUi } from '../store/store'
import { MODULE_META } from '../lib/modules'
import { matchTitle, playerName, sideLabel } from '../store/selectors'
import { cn } from '../lib/cn'

interface Cmd {
  id: string
  label: string
  sub?: string
  group: 'Pages' | 'Actions' | 'Players' | 'Teams' | 'Matches' | 'Events'
  to: string
}

/** Cmd/Ctrl + K: players, teams, matches, pages and actions. */
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const data = useData()
  const eventId = useUi((s) => s.currentEventId)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onOpen)
    }
  }, [])
  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [open])
  const ev = data.events.find((e) => e.id === eventId)
  const all = useMemo<Cmd[]>(() => {
    if (!ev) return []
    const base = `/e/${ev.id}`
    const out: Cmd[] = []
    ev.modules.forEach((m) => out.push({ id: `p-${m}`, label: MODULE_META[m].label, group: 'Pages', to: `${base}${MODULE_META[m].path ? '/' + MODULE_META[m].path : ''}` }))
    if (ev.modules.includes('registrations')) {
      out.push({ id: 'a-add', label: 'Add a walk-in entry', group: 'Actions', to: `${base}/registrations?add=1` })
      out.push({ id: 'a-check', label: 'Open check-in mode', group: 'Actions', to: `${base}/registrations?checkin=1` })
    }
    if (ev.modules.includes('matchday')) out.push({ id: 'a-call', label: 'Call next match', group: 'Actions', to: `${base}/match-day` })
    out.push({ id: 'a-msg', label: 'New message to players', group: 'Actions', to: `${base}/messages?new=1` })
    out.push({ id: 'a-page', label: 'View event page', group: 'Actions', to: `/p/${ev.slug}` })
    const pids = new Set<string>()
    data.registrations.filter((r) => r.eventId === ev.id).forEach((r) => {
      r.playerIds.forEach((p) => pids.add(p))
      if (r.playerIds.length > 1) out.push({ id: `t-${r.id}`, label: sideLabel(data, r.id), sub: data.categories.find((c) => c.id === r.categoryId)?.label, group: 'Teams', to: `${base}/registrations?reg=${r.id}` })
    })
    pids.forEach((id) => {
      const p = data.players.find((x) => x.id === id)
      if (p) out.push({ id: `pl-${id}`, label: playerName(p), sub: p.city, group: 'Players', to: `${base}/registrations?player=${id}` })
    })
    data.matches.filter((m) => m.eventId === ev.id && (m.status === 'live' || m.status === 'scheduled' || m.status === 'awaiting_confirmation' || m.status === 'called')).slice(0, 80).forEach((m) =>
      out.push({ id: `m-${m.id}`, label: `${sideLabel(data, m.sideA, true)} vs ${sideLabel(data, m.sideB, true)}`, sub: matchTitle(data, m), group: 'Matches', to: `${base}/match-day?match=${m.id}` }),
    )
    data.events.filter((e) => e.organizerId === ev.organizerId && e.id !== ev.id).forEach((e) => out.push({ id: `e-${e.id}`, label: e.name, group: 'Events', to: `/e/${e.id}` }))
    return out
  }, [data, ev])
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = s ? all.filter((c) => (c.label + ' ' + (c.sub ?? '')).toLowerCase().includes(s)) : all.filter((c) => c.group === 'Pages' || c.group === 'Actions')
    return list.slice(0, 40)
  }, [q, all])
  const go = (c: Cmd) => {
    setOpen(false)
    navigate(c.to)
  }
  const icon = { Pages: ArrowRight, Actions: Zap, Players: User, Teams: User, Matches: Swords, Events: CalendarDays }
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-canvas/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-[620px] overflow-hidden rounded-xl border border-line-strong shadow-float"
            style={{ background: 'var(--glass-strong)', backdropFilter: 'blur(18px)' }}
          >
            <div className="flex items-center gap-3 border-b border-line-subtle px-4">
              <Search size={18} className="text-fg3" aria-hidden />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setActive(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActive((a) => Math.min(results.length - 1, a + 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActive((a) => Math.max(0, a - 1))
                  } else if (e.key === 'Enter' && results[active]) go(results[active])
                  else if (e.key === 'Escape') setOpen(false)
                }}
                placeholder={ev ? `Search players, teams, matches in ${ev.name}` : 'Search'}
                aria-label="Search"
                role="combobox"
                aria-expanded="true"
                aria-controls="cmd-list"
                className="h-14 flex-1 bg-transparent text-[16px] text-fg placeholder:text-fg4 focus:outline-none"
              />
            </div>
            <ul id="cmd-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-fg3">No matches for "{q}"</li>}
              {results.map((c, i) => {
                const Icon = icon[c.group]
                const showGroup = i === 0 || results[i - 1].group !== c.group
                return (
                  <li key={c.id} role="option" aria-selected={i === active}>
                    {showGroup && <p className="px-3 pb-1 pt-2 t-overline text-fg4">{c.group}</p>}
                    <button type="button" onMouseEnter={() => setActive(i)} onClick={() => go(c)} className={cn('flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left', i === active && 'bg-s3')}>
                      <Icon size={16} className="text-fg3" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-fg">{c.label}</span>
                      {c.sub && <span className="max-w-[45%] truncate text-[12px] text-fg3">{c.sub}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
