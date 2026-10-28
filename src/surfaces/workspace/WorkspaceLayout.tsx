import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Ellipsis,
  ExternalLink,
  Gavel,
  Headset,
  House,
  Layers,
  LogOut,
  Medal,
  Megaphone,
  PanelLeft,
  PanelLeftClose,
  Radio,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Shuffle,
  Swords,
  Ticket,
  Tv,
  UserRound,
  Users,
  Wallet,
  Eye,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { useData, useRole, useRouteEvent } from '../../store/hooks'
import { useUi, guards } from '../../store/store'
import { MODULE_META, roleAllows } from '../../lib/modules'
import type { EventItem, EventStatus, ModuleKey } from '../../mock/types'
import { Logo, ContactSheet } from '../../components/ui/Misc'
import { Popover, MenuItem, Drawer, useConfirm, toast } from '../../components/ui/Overlay'
import { LiveBadge, StatusChip, Kbd } from '../../components/ui/Controls'
import { Avatar } from '../../components/ui/Display'
import { blockers, matchStats } from '../../store/selectors'
import { setEventStatus, markNotificationsRead } from '../../store/actions'
import { ago } from '../../lib/format'
import { NotFound } from '../../app/NotFound'
import { accentVars } from '../../lib/color'
import { EventGlyph } from './shared'

export const MODULE_ICON: Record<ModuleKey, LucideIcon> = {
  home: House,
  registrations: Ticket,
  participants: Users,
  people: Users,
  team_builder: Shuffle,
  launch_kit: Rocket,
  schedule: CalendarDays,
  ties: Swords,
  auction: Gavel,
  draft_board: Layers,
  matchday: Radio,
  messages: Megaphone,
  results: Medal,
  money: Wallet,
  sponsors_screens: Tv,
  settings: Settings,
}

export const STATUS_LABEL: Record<EventStatus, string> = {
  draft: 'Draft',
  awaiting_approval: 'Awaiting approval',
  registrations_open: 'Registrations open',
  registrations_closed: 'Entries closed',
  scheduled: 'Scheduled',
  live: 'Live',
  completed: 'Finished',
}
export function StatusPill({ status }: { status: EventStatus }) {
  if (status === 'live') return <LiveBadge />
  const tone = status === 'registrations_open' ? 'success' : status === 'draft' || status === 'awaiting_approval' ? 'warning' : status === 'completed' ? 'neutral' : 'info'
  return <StatusChip tone={tone}>{STATUS_LABEL[status]}</StatusChip>
}

function useVisibleModules(ev: EventItem): ModuleKey[] {
  const role = useRole()
  return ev.modules.filter((m) => roleAllows(role, m))
}

export function WorkspaceLayout() {
  const ev = useRouteEvent()
  const collapsed = useUi((s) => s.sidebarCollapsed)
  const viewAs = useUi((s) => s.viewAs)
  const persona = useUi((s) => s.persona)
  const data = useData()
  const [talk, setTalk] = useState(false)
  useEffect(() => {
    guards.onReadOnly = () => toast.warning('Read only', { body: 'You are viewing this workspace as Rizzfitt HQ. Switch to Take over to make changes.' })
    return () => {
      guards.onReadOnly = null
    }
  }, [])
  if (!ev || ev.hqOnly) return <NotFound />
  const org = data.organizers.find((o) => o.id === ev.organizerId)
  const takenOver = ev.takenOver
  return (
    <div className="min-h-dvh bg-base" style={accentVars(ev.accent) as React.CSSProperties}>
      {viewAs && persona === 'hq' && (
        <div className="sticky top-0 z-[45] flex items-center justify-center gap-3 bg-hq px-4 py-2 text-[13px] font-semibold text-fg">
          <Eye size={16} aria-hidden />
          {viewAs.mode === 'view' ? `Viewing as ${org?.name ?? 'organizer'}. Read only.` : 'Rizzfitt is managing this event.'}
          <Link to="/hq/organizers" className="underline underline-offset-2">
            Back to HQ
          </Link>
        </div>
      )}
      {takenOver && persona !== 'hq' && (
        <div className="sticky top-0 z-[45] flex items-center justify-center gap-2 bg-hq-soft px-4 py-2 text-[13px] font-semibold text-hq-text">
          <ShieldCheck size={16} aria-hidden /> Rizzfitt is managing this event with you. Changes may come from the Rizzfitt team.
        </div>
      )}
      <Sidebar ev={ev} collapsed={collapsed} onTalk={() => setTalk(true)} />
      <div className={cn('flex min-h-dvh flex-col transition-[padding] duration-300', collapsed ? 'md:pl-[76px]' : 'md:pl-[264px]')}>
        <TopBar ev={ev} />
        <main id="main" className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-28 pt-5 sm:px-6 md:pb-12 lg:px-8">
          <Outlet />
        </main>
      </div>
      <BottomBar ev={ev} />
      <ContactSheet open={talk} onClose={() => setTalk(false)} />
    </div>
  )
}

/* ----------------------------------------------------------------- sidebar */

function Sidebar({ ev, collapsed, onTalk }: { ev: EventItem; collapsed: boolean; onTalk: () => void }) {
  const mods = useVisibleModules(ev)
  const data = useData()
  const setUi = useUi((s) => s.set)
  const live = matchStats(data, ev.id).live > 0
  const groups: { key: string; label?: string; items: ModuleKey[] }[] = [
    { key: 'top', items: mods.filter((m) => MODULE_META[m].group === 'top') },
    { key: 'before', label: 'Before', items: mods.filter((m) => MODULE_META[m].group === 'before') },
    { key: 'during', label: 'During', items: mods.filter((m) => MODULE_META[m].group === 'during') },
    { key: 'after', label: 'After', items: mods.filter((m) => MODULE_META[m].group === 'after') },
    { key: 'bottom', items: mods.filter((m) => MODULE_META[m].group === 'bottom') },
  ]
  return (
    <aside className={cn('fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line-subtle bg-canvas transition-[width] duration-300 md:flex', collapsed ? 'w-[76px]' : 'w-[264px]')} aria-label="Workspace">
      <div className={cn('flex h-16 shrink-0 items-center', collapsed ? 'justify-center' : 'justify-between px-5')}>
        <Link to="/events" aria-label="All my events">
          {collapsed ? <Logo markOnly size="sm" /> : <Logo size="sm" />}
        </Link>
        {!collapsed && (
          <button type="button" aria-label="Collapse sidebar" onClick={() => setUi({ sidebarCollapsed: true })} className="flex h-9 w-9 items-center justify-center rounded-md text-fg3 hover:bg-s2 hover:text-fg">
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>
      <div className={cn('px-3', collapsed && 'px-2')}>
        <EventSwitcher ev={ev} collapsed={collapsed} />
      </div>
      <nav className="no-scrollbar mt-3 flex-1 overflow-y-auto px-3 pb-4" aria-label="Event modules">
        {groups.map((g) =>
          g.items.length === 0 ? null : (
            <div key={g.key} className={cn('mt-3 first:mt-0', g.key === 'bottom' && 'mt-5 border-t border-line-subtle pt-4')}>
              {g.label && !collapsed && <p className="mb-1 px-3 t-overline text-fg4">{g.label}</p>}
              <ul className="flex flex-col gap-0.5">
                {g.items.map((m) => {
                  const Icon = MODULE_ICON[m]
                  const to = `/e/${ev.id}${MODULE_META[m].path ? '/' + MODULE_META[m].path : ''}`
                  return (
                    <li key={m}>
                      <NavLink
                        to={to}
                        end={m === 'home'}
                        title={collapsed ? MODULE_META[m].label : undefined}
                        className={({ isActive }) =>
                          cn(
                            'relative flex h-11 items-center gap-3 rounded-md text-[14px] font-semibold transition-colors',
                            collapsed ? 'justify-center' : 'px-3',
                            isActive ? 'bg-s2 text-fg before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-brand' : 'text-fg2 hover:bg-s1 hover:text-fg',
                          )
                        }
                      >
                        <Icon size={20} strokeWidth={1.75} aria-hidden />
                        {!collapsed && <span className="flex-1 truncate">{MODULE_META[m].label}</span>}
                        {m === 'matchday' && live && (collapsed ? <span className="animate-live absolute right-3 top-2.5 h-2 w-2 rounded-full bg-live" aria-label="Live" /> : <LiveBadge />)}
                        {m === 'auction' && ev.status === 'live' && !collapsed && <LiveBadge />}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ),
        )}
      </nav>
      <div className={cn('border-t border-line-subtle p-3 pb-[72px]', collapsed && 'flex flex-col items-center gap-2')}>
        {collapsed ? (
          <>
            <button type="button" aria-label="Expand sidebar" onClick={() => setUi({ sidebarCollapsed: false })} className="flex h-11 w-11 items-center justify-center rounded-md text-fg3 hover:bg-s2 hover:text-fg">
              <PanelLeft size={18} />
            </button>
            <button type="button" aria-label="Talk to Rizzfitt" onClick={onTalk} className="flex h-11 w-11 items-center justify-center rounded-md text-fg3 hover:bg-s2 hover:text-fg">
              <Headset size={18} />
            </button>
          </>
        ) : (
          <button type="button" onClick={onTalk} className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-[14px] font-semibold text-fg2 hover:bg-s1 hover:text-fg">
            <Headset size={18} aria-hidden /> Help, talk to Rizzfitt
          </button>
        )}
      </div>
    </aside>
  )
}

function EventSwitcher({ ev, collapsed }: { ev: EventItem; collapsed: boolean }) {
  const data = useData()
  const navigate = useNavigate()
  const mine = data.events.filter((e) => e.organizerId === ev.organizerId && !e.hqOnly)
  return (
    <Popover
      align="left"
      label="Switch event"
      className="w-[300px]"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={`Event: ${ev.name}. Switch event`}
          className={cn('flex w-full items-center gap-3 rounded-lg border border-line-subtle bg-s1 text-left hover:border-line', collapsed ? 'justify-center p-2' : 'p-2.5')}
        >
          <EventGlyph ev={ev} size={collapsed ? 36 : 40} />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-fg">{ev.name}</span>
              <span className="mt-0.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                <span className="truncate text-[12px] text-fg3">{STATUS_LABEL[ev.status]}</span>
              </span>
            </span>
          )}
          {!collapsed && <ChevronDown size={16} className="text-fg3" aria-hidden />}
        </button>
      )}
    >
      {(close) => (
        <div className="flex flex-col">
          {mine.map((e) => (
            <MenuItem
              key={e.id}
              icon={<EventGlyph ev={e} size={28} />}
              onClick={() => {
                close()
                navigate(e.setup.completed ? `/e/${e.id}` : `/setup/${e.id}/format`)
              }}
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{e.name}</span>
                <span className="text-[12px] font-normal text-fg3">{STATUS_LABEL[e.status]}</span>
              </span>
            </MenuItem>
          ))}
          <div className="my-1 border-t border-line-subtle" />
          <MenuItem onClick={() => { close(); navigate('/events') }}>All my events</MenuItem>
        </div>
      )}
    </Popover>
  )
}

/* ----------------------------------------------------------------- top bar */

function Crumbs({ ev }: { ev: EventItem }) {
  const loc = useLocation()
  const rest = loc.pathname.replace(`/e/${ev.id}`, '').split('/').filter(Boolean)
  const mod = (Object.keys(MODULE_META) as ModuleKey[]).find((k) => MODULE_META[k].path === rest[0])
  const data = useData()
  const sub = rest[1] === 'courts' ? 'Courts and times' : rest[1] === 'publish' ? 'Publish' : rest[1] ? data.categories.find((c) => c.id === rest[1])?.label : undefined
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-2 text-[14px]">
        <li className="hidden truncate text-fg3 lg:block">
          <Link to={`/e/${ev.id}`} className="hover:text-fg">
            {ev.name}
          </Link>
        </li>
        {mod && mod !== 'home' && (
          <>
            <li aria-hidden className="hidden text-fg4 lg:block">/</li>
            <li className={cn('truncate', sub ? 'text-fg3' : 'font-semibold text-fg')}>
              {sub ? <Link to={`/e/${ev.id}/${MODULE_META[mod].path}`}>{MODULE_META[mod].label}</Link> : MODULE_META[mod].label}
            </li>
          </>
        )}
        {sub && (
          <>
            <li aria-hidden className="text-fg4">/</li>
            <li className="truncate font-semibold text-fg">{sub}</li>
          </>
        )}
        {(!mod || mod === 'home') && <li className="truncate font-semibold text-fg lg:hidden">{ev.name}</li>}
      </ol>
    </nav>
  )
}

function TopBar({ ev }: { ev: EventItem }) {
  const data = useData()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const org = data.organizers.find((o) => o.id === ev.organizerId)
  const notes = data.notifications.filter((n) => n.organizerId === ev.organizerId)
  const bl = blockers(data, ev.id)
  const unread = notes.filter((n) => !n.read).length
  const role = useRole()
  const setUi = useUi((s) => s.set)

  const statusActions: { label: string; to: EventStatus; confirm: { title: string; body: string; label: string; danger?: boolean } }[] = []
  if (ev.status === 'registrations_open')
    statusActions.push({ label: 'Close registrations', to: 'registrations_closed', confirm: { title: 'Close registrations?', body: 'Players will not be able to register or pay. You can reopen any time.', label: 'Close registrations', danger: true } })
  if (ev.status === 'registrations_closed')
    statusActions.push({ label: 'Reopen registrations', to: 'registrations_open', confirm: { title: 'Reopen registrations?', body: 'Players can register and pay again in every category that has spots.', label: 'Reopen' } })
  if (ev.status === 'live')
    statusActions.push({ label: 'Mark event finished', to: 'completed', confirm: { title: 'Mark the event finished?', body: 'Live scoring stops and results become final. Players get the results message if you send it.', label: 'Mark finished', danger: true } })

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line-subtle px-4 sm:px-6 lg:px-8">
      <div className="md:hidden">
        <EventGlyph ev={ev} size={32} />
      </div>
      <Crumbs ev={ev} />
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="hidden h-10 items-center gap-2 rounded-md border border-line bg-s1 px-3 text-[13px] text-fg3 hover:text-fg lg:flex"
          aria-label="Search and commands"
        >
          <Search size={16} aria-hidden /> Search <Kbd>⌘K</Kbd>
        </button>
        <button type="button" aria-label="Search" onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))} className="flex h-10 w-10 items-center justify-center rounded-md text-fg2 hover:bg-s2 lg:hidden">
          <Search size={18} />
        </button>
        {role !== 'desk' && (
          <Popover
            label="Event status"
            trigger={({ toggle, open }) => (
              <button type="button" onClick={toggle} aria-expanded={open} aria-label={`Event status: ${STATUS_LABEL[ev.status]}`} className="hidden h-10 items-center gap-1.5 rounded-md px-2 hover:bg-s2 sm:flex">
                <StatusPill status={ev.status} />
                <ChevronDown size={14} className="text-fg3" aria-hidden />
              </button>
            )}
          >
            {(close) => (
              <div className="w-64">
                <p className="px-3 pb-1 pt-2 t-overline text-fg3">Event status</p>
                <p className="px-3 pb-2 text-[14px] text-fg">{STATUS_LABEL[ev.status]}</p>
                {statusActions.length === 0 && <p className="px-3 pb-2 t-small text-fg3">{ev.status === 'draft' ? 'Open registrations from Home once the go-live checklist is done.' : 'Nothing to change right now.'}</p>}
                {statusActions.map((a) => (
                  <MenuItem
                    key={a.label}
                    danger={a.confirm.danger}
                    onClick={async () => {
                      close()
                      const ok = await confirm({ title: a.confirm.title, body: a.confirm.body, confirmLabel: a.confirm.label, tone: a.confirm.danger ? 'danger' : 'default' })
                      if (ok) {
                        setEventStatus(ev.id, a.to)
                        toast.success(a.to === 'registrations_closed' ? 'Registrations closed' : a.to === 'completed' ? 'Event finished. Results are final.' : 'Registrations reopened')
                      }
                    }}
                  >
                    {a.label}
                  </MenuItem>
                ))}
              </div>
            )}
          </Popover>
        )}
        <a href={`/p/${ev.slug}`} target="_blank" rel="noreferrer" className="hidden h-10 items-center gap-2 rounded-md border border-line bg-s1 px-3 text-[13px] font-semibold text-fg2 hover:text-fg xl:flex">
          View event page <ExternalLink size={14} aria-hidden />
        </a>
        <Popover
          label="Notifications"
          className="w-[340px]"
          trigger={({ toggle, open }) => (
            <button
              type="button"
              aria-label={`Notifications, ${unread + bl.length} need attention`}
              aria-expanded={open}
              onClick={() => {
                toggle()
                if (!open && org) setTimeout(() => markNotificationsRead(org.id), 1500)
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-md text-fg2 hover:bg-s2 hover:text-fg"
            >
              <Bell size={19} />
              {unread + bl.length > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-on-brand tnum">{unread + bl.length}</span>}
            </button>
          )}
        >
          {(close) => (
            <div className="max-h-[70vh] overflow-auto">
              <p className="px-3 pb-1 pt-2 t-overline text-fg3">Needs your attention</p>
              {bl.length === 0 && <p className="px-3 py-2 t-small text-fg3">Nothing is blocked. Nice.</p>}
              {bl.slice(0, 5).map((b) => (
                <MenuItem key={b.id} onClick={() => { close(); navigate(`/e/${ev.id}${b.kind === 'desk_pending' ? '/registrations?status=pending' : b.matchId || b.court ? '/match-day' : ''}`) }}>
                  <span className="flex flex-col py-1">
                    <span>{b.title}</span>
                    <span className="text-[12px] font-normal text-fg3">{b.body}</span>
                  </span>
                </MenuItem>
              ))}
              <p className="mt-1 border-t border-line-subtle px-3 pb-1 pt-3 t-overline text-fg3">Updates</p>
              {notes.slice(0, 5).map((n) => (
                <MenuItem key={n.id} onClick={() => { close(); if (n.href) navigate(n.href) }}>
                  <span className="flex flex-col py-1">
                    <span className="flex items-center gap-2">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-brand" aria-label="Unread" />}
                      {n.title}
                    </span>
                    <span className="text-[12px] font-normal text-fg3">
                      {n.body} · {ago(n.at, data.now)}
                    </span>
                  </span>
                </MenuItem>
              ))}
            </div>
          )}
        </Popover>
        <Popover
          label="Account"
          trigger={({ toggle, open }) => (
            <button type="button" aria-label="Account menu" aria-expanded={open} onClick={toggle} className="flex h-10 items-center gap-2 rounded-md px-1 hover:bg-s2">
              <Avatar name={role === 'desk' ? 'Ananya Pillai' : org?.name ?? 'Organizer'} color={role === 'desk' ? 'var(--cat-3)' : org?.avatarColor} size={32} />
            </button>
          )}
        >
          {(close) => (
            <div className="w-60">
              <div className="px-3 pb-2 pt-2">
                <p className="font-semibold text-fg">{role === 'desk' ? 'Ananya Pillai' : org?.name}</p>
                <p className="t-small text-fg3">{role === 'desk' ? 'Desk volunteer' : `Owner, ${org?.orgName}`}</p>
              </div>
              {role !== 'desk' && <MenuItem icon={<UserRound size={16} />} onClick={() => { close(); navigate('/account') }}>Account and payouts</MenuItem>}
              <MenuItem icon={<CalendarDays size={16} />} onClick={() => { close(); navigate('/events') }}>Switch event</MenuItem>
              <MenuItem
                icon={<LogOut size={16} />}
                onClick={() => {
                  close()
                  setUi({ organizerId: null })
                  navigate('/')
                  toast.info('Signed out')
                }}
              >
                Sign out
              </MenuItem>
            </div>
          )}
        </Popover>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------- bottom bar */

function BottomBar({ ev }: { ev: EventItem }) {
  const mods = useVisibleModules(ev)
  const [more, setMore] = useState(false)
  const primary = useMemo(() => (['home', ev.type === 'social' ? 'participants' : 'registrations', 'schedule', 'matchday'] as ModuleKey[]).filter((m) => mods.includes(m)), [mods, ev.type])
  const rest = mods.filter((m) => !primary.includes(m))
  const loc = useLocation()
  useEffect(() => {
    setMore(false)
  }, [loc.pathname])
  const item = (m: ModuleKey): ReactNode => {
    const Icon = MODULE_ICON[m]
    return (
      <NavLink
        key={m}
        to={`/e/${ev.id}${MODULE_META[m].path ? '/' + MODULE_META[m].path : ''}`}
        end={m === 'home'}
        className={({ isActive }) => cn('flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold', isActive ? 'text-brand-text' : 'text-fg3')}
      >
        <Icon size={22} strokeWidth={1.75} aria-hidden />
        <span className="max-w-full truncate px-1">{MODULE_META[m].label.replace(' & teams', '')}</span>
      </NavLink>
    )
  }
  return (
    <>
      <nav className="glass fixed inset-x-0 bottom-0 z-40 flex h-[68px] border-t border-line-subtle pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Workspace">
        {primary.map(item)}
        {rest.length > 0 && (
          <button type="button" onClick={() => setMore(true)} className="flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-fg3">
            <Ellipsis size={22} aria-hidden />
            More
          </button>
        )}
      </nav>
      <Drawer open={more} onClose={() => setMore(false)} title="More" side="bottom">
        <ul className="grid grid-cols-3 gap-2">
          {rest.map((m) => {
            const Icon = MODULE_ICON[m]
            return (
              <li key={m}>
                <NavLink to={`/e/${ev.id}/${MODULE_META[m].path}`} className="card flex h-24 flex-col items-center justify-center gap-2 p-2 text-center text-[13px] font-semibold text-fg2 hover:bg-s2">
                  <Icon size={22} aria-hidden />
                  {MODULE_META[m].label}
                </NavLink>
              </li>
            )
          })}
          <li>
            <Link to="/events" className="card flex h-24 flex-col items-center justify-center gap-2 p-2 text-center text-[13px] font-semibold text-fg2 hover:bg-s2">
              <CalendarDays size={22} aria-hidden />
              All events
            </Link>
          </li>
        </ul>
      </Drawer>
    </>
  )
}
