import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Merge, Send, Shuffle, UserCog } from 'lucide-react'
import { useData, useEvent } from '../../store/hooks'
import { categoriesOf, playerName, regsOf, sideLabel } from '../../store/selectors'
import { mergePlayers, updatePlayer } from '../../store/regActions'
import { Tabs, CategoryChip, StatusChip } from '../../components/ui/Controls'
import { DataTable } from '../../components/ui/DataTable'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Drawer, toast, useConfirm } from '../../components/ui/Overlay'
import { Input, Select } from '../../components/ui/Field'
import { TeamCrest, Avatar } from '../../components/ui/Display'
import { PageHeader } from './shared'
import { DuprChip, PartnerDialog, RegStatusChip } from './Registrations'
import { fmtPhone, maskPhone, plural } from '../../lib/format'
import type { Player, Registration } from '../../mock/types'

type Tab = 'players' | 'teams' | 'squads' | 'owners' | 'captains'

export function PeoplePage() {
  const ev = useEvent()
  const d = useData()
  const league = ev.type === 'league' || ev.type === 'auction' || ev.type === 'draft'
  const [tab, setTab] = useState<Tab>(league ? 'squads' : 'players')
  const regs = regsOf(d, ev.id)
  const cats = categoriesOf(d, ev.id)
  const confirm = useConfirm()
  const [edit, setEdit] = useState<Player | null>(null)
  const [swap, setSwap] = useState<{ reg: Registration; idx: number } | null>(null)
  const players = useMemo(() => {
    const ids = new Set<string>()
    regs.forEach((r) => r.playerIds.forEach((p) => ids.add(p)))
    return [...ids].map((id) => d.players.find((p) => p.id === id)!).filter(Boolean)
  }, [regs, d.players])
  const dupes = useMemo(() => {
    const seen = new Map<string, Player>()
    const out: [Player, Player][] = []
    players.forEach((p) => {
      const k = `${p.firstName} ${p.lastName}`.toLowerCase()
      const o = seen.get(k)
      if (o) out.push([o, p])
      else seen.set(k, p)
    })
    return out
  }, [players])
  const entriesOf = (pid: string) => regs.filter((r) => r.playerIds.includes(pid))
  const teams = d.leagueTeams.filter((t) => t.eventId === ev.id)
  const pairs = regs.filter((r) => r.playerIds.length > 1 && r.status !== 'withdrawn')
  return (
    <div>
      <PageHeader title="Players & teams" subtitle={`${plural(players.length, 'player')} · ${league ? plural(teams.length, 'team') : plural(pairs.length, 'pair')}`} actions={league && ev.modules.includes('team_builder') ? <ButtonLink to={`/e/${ev.id}/team-builder`} icon={<Shuffle size={16} />}>Team builder</ButtonLink> : undefined} />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'squads', label: 'Squads', count: teams.length, hidden: !league },
          { value: 'players', label: 'Players', count: players.length },
          { value: 'teams', label: 'Teams', count: pairs.length, hidden: league },
          { value: 'owners', label: 'Owners', count: d.owners.filter((o) => o.eventId === ev.id).length, hidden: ev.type !== 'auction' },
          { value: 'captains', label: 'Captains', count: teams.length, hidden: ev.type !== 'draft' },
        ]}
      />
      {tab === 'players' && (
        <>
          {dupes.map(([a, b]) => (
            <div key={b.id} className="mb-4 flex flex-col gap-3 rounded-lg border border-info/40 bg-info-soft p-4 sm:flex-row sm:items-center">
              <Merge className="text-info" aria-hidden />
              <p className="flex-1 text-fg">
                <strong>2 players may be the same person:</strong> {playerName(a)} ({maskPhone(a.mobile)}) and {playerName(b)} ({maskPhone(b.mobile)}).
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  const ok = await confirm({ title: 'Merge these players?', body: `Entries for ${maskPhone(b.mobile)} move to ${maskPhone(a.mobile)}. The second profile is removed.`, confirmLabel: 'Merge players' })
                  if (ok) {
                    mergePlayers(a.id, b.id)
                    toast.success('Players merged')
                  }
                }}
              >
                Merge
              </Button>
            </div>
          ))}
          <DataTable
            caption="Players"
            rows={players}
            rowKey={(p) => p.id}
            onRowClick={setEdit}
            mobileTitle={(p) => <span className="font-semibold text-fg">{playerName(p)}</span>}
            columns={[
              { key: 'name', header: 'Player', sortValue: (p) => p.firstName, cell: (p) => <span className="flex items-center gap-2"><Avatar name={playerName(p)} size={28} /><span className="font-semibold text-fg">{playerName(p)}</span></span> },
              { key: 'mobile', header: 'Mobile', mobile: true, cell: (p) => <span className="tnum">{maskPhone(p.mobile)}</span> },
              { key: 'city', header: 'City', cell: (p) => p.city || '-' },
              { key: 'dupr', header: 'DUPR', mobile: true, cell: (p) => <DuprChip p={p} /> },
              { key: 'entries', header: 'Entries', mobile: true, cell: (p) => <span className="flex flex-wrap gap-1">{entriesOf(p.id).map((r) => <CategoryChip key={r.id} color={cats.find((c) => c.id === r.categoryId)?.color ?? 'var(--cat-1)'}>{cats.find((c) => c.id === r.categoryId)?.label}</CategoryChip>)}</span> },
              { key: 'tshirt', header: 'T-shirt', optional: true, cell: (p) => p.tshirt },
              { key: 'gender', header: 'Gender', optional: true, cell: (p) => (p.gender === 'M' ? 'Man' : 'Woman') },
            ]}
          />
        </>
      )}
      {tab === 'teams' && (
        <DataTable
          caption="Teams"
          rows={pairs}
          rowKey={(r) => r.id}
          mobileTitle={(r) => <span className="font-semibold text-fg">{sideLabel(d, r.id)}</span>}
          columns={[
            { key: 'team', header: 'Team', sortValue: (r) => sideLabel(d, r.id), cell: (r) => <span className="font-semibold text-fg">{sideLabel(d, r.id)}</span> },
            { key: 'cat', header: 'Category', mobile: true, cell: (r) => <CategoryChip color={cats.find((c) => c.id === r.categoryId)?.color ?? 'var(--cat-1)'}>{cats.find((c) => c.id === r.categoryId)?.label}</CategoryChip> },
            { key: 'status', header: 'Status', mobile: true, cell: (r) => <RegStatusChip s={r.status} /> },
            {
              key: 'act',
              header: 'Actions',
              mobile: true,
              cell: (r) => (
                <span className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSwap({ reg: r, idx: 1 }) }}>
                    Swap partner
                  </Button>
                  <Link to={`/e/${ev.id}/registrations?reg=${r.id}`} className="inline-flex h-9 items-center rounded-md px-3 text-[13px] font-semibold text-fg2 hover:bg-s2">
                    Move category
                  </Link>
                </span>
              ),
            },
          ]}
        />
      )}
      {tab === 'squads' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {teams.map((t) => (
            <Card key={t.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <TeamCrest name={t.name} color={t.color} short={t.short} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-fg">{t.name}</p>
                  <p className="t-small text-fg3">{plural(t.playerIds.length, 'player')}</p>
                </div>
              </div>
              <ul className="flex flex-col gap-1">
                {t.playerIds.map((pid) => {
                  const p = d.players.find((x) => x.id === pid)
                  return (
                    <li key={pid} className="flex items-center justify-between gap-2 text-[14px]">
                      <span className="truncate text-fg2">{playerName(p)}</span>
                      {t.captainId === pid && <StatusChip tone="brand">Captain</StatusChip>}
                    </li>
                  )
                })}
                {t.playerIds.length === 0 && <li className="t-small text-fg3">{ev.type === 'auction' ? 'Filled at the auction.' : ev.type === 'draft' ? 'Filled on draft night.' : 'No players yet.'}</li>}
              </ul>
              {ev.modules.includes('team_builder') && (
                <Link to={`/e/${ev.id}/team-builder`} className="mt-auto inline-flex items-center gap-1 t-small font-semibold text-brand-text">
                  Edit in team builder <ArrowRight size={12} aria-hidden />
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
      {tab === 'owners' && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {d.owners.filter((o) => o.eventId === ev.id).map((o) => {
            const t = teams.find((x) => x.id === o.teamId)
            return (
              <li key={o.id} className="card flex items-center gap-3 p-4">
                <TeamCrest name={t?.name ?? ''} color={t?.color ?? 'var(--cat-1)'} short={t?.short} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-fg">{o.name}</p>
                  <p className="truncate t-small text-fg3">
                    {t?.name} · {fmtPhone(o.mobile)}
                  </p>
                </div>
                <StatusChip tone={o.status === 'joined' ? 'success' : 'warning'}>{o.status === 'joined' ? 'Joined' : 'Invited'}</StatusChip>
                {o.status === 'invited' && (
                  <Button size="sm" variant="ghost" icon={<Send size={14} />} onClick={() => toast.success(`Invite sent again to ${o.name}`)}>
                    Resend
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {tab === 'captains' && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => (
            <li key={t.id} className="card flex items-center gap-3 p-4">
              <TeamCrest name={t.name} color={t.color} short={t.short} size={36} />
              <div className="flex-1">
                <p className="font-semibold text-fg">{t.name}</p>
                <p className="t-small text-fg3">{t.captainId ? playerName(d.players.find((p) => p.id === t.captainId)) : 'Captain not picked yet'}</p>
              </div>
              <UserCog size={18} className="text-fg3" aria-hidden />
            </li>
          ))}
        </ul>
      )}
      <EditPlayer p={edit} onClose={() => setEdit(null)} />
      {swap && <PartnerDialog reg={swap.reg} idx={swap.idx} onClose={() => setSwap(null)} />}
    </div>
  )
}

function EditPlayer({ p, onClose }: { p: Player | null; onClose: () => void }) {
  const [f, setF] = useState<Partial<Player>>({})
  const cur = p ? { ...p, ...f } : null
  return (
    <Drawer
      open={!!p}
      onClose={() => {
        setF({})
        onClose()
      }}
      title={p ? playerName(p) : ''}
      subtitle="Fix a name, email or DUPR ID."
      footer={
        <Button
          onClick={() => {
            if (p) updatePlayer(p.id, f)
            toast.success('Player updated')
            setF({})
            onClose()
          }}
        >
          Save
        </Button>
      }
    >
      {cur && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" value={cur.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} />
            <Input label="Last name" value={cur.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} />
          </div>
          <Input label="Email" value={cur.email ?? ''} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Input label="DUPR ID" value={cur.duprId ?? ''} onChange={(e) => setF({ ...f, duprId: e.target.value.toUpperCase(), duprStatus: e.target.value ? 'ok' : 'missing' })} />
          <Select label="T-shirt" value={cur.tshirt} onChange={(e) => setF({ ...f, tshirt: e.target.value as Player['tshirt'] })} options={['S', 'M', 'L', 'XL', 'XXL'].map((x) => ({ value: x, label: x }))} />
          <p className="t-small text-fg3">Mobile {fmtPhone(cur.mobile)} is the player's login and cannot be changed here.</p>
        </div>
      )}
    </Drawer>
  )
}
