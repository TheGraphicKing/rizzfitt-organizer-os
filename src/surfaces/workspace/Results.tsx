import { lazy, Suspense, useMemo, useState } from 'react'
import { Award, CircleCheck, Download, FileSpreadsheet, Hourglass, Medal, RefreshCw, TriangleAlert } from 'lucide-react'
import { useData, useEvent } from '../../store/hooks'
import { categoriesOf, categoryPodium, entries, leagueTable, matchTitle, playerName, sideLabel } from '../../store/selectors'
import { retryDupr } from '../../store/matchActions'
import { fakeDelay } from '../../store/store'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { FilterChip, StatusChip, Tabs } from '../../components/ui/Controls'
import { EmptyState, TeamCrest } from '../../components/ui/Display'
import { toast } from '../../components/ui/Overlay'
import { downloadText, toCsv } from '../../components/ui/Misc'
import { Bracket } from '../../components/data/Bracket'
import { MatchDrawer, StandingsTable } from '../../components/data/MatchBits'
import { PageHeader } from './shared'
import { downloadDataUrl } from '../../lib/poster'
import { token } from '../../components/3d/palette'
import { fmtDate } from '../../lib/format'
import { isConfirmed } from '../../lib/tournament'
import type { DemoData, EventCategory, EventItem } from '../../mock/types'

const WinnersPodium = lazy(() => import('../../components/3d/scenes/WinnersPodium'))

function certificate(ev: EventItem, cat: string, place: string, name: string): string {
  const c = document.createElement('canvas')
  c.width = 1600
  c.height = 1130
  const x = c.getContext('2d')!
  const family = getComputedStyle(document.body).fontFamily
  x.fillStyle = token('--bg-canvas')
  x.fillRect(0, 0, 1600, 1130)
  x.strokeStyle = ev.accent
  x.lineWidth = 14
  x.strokeRect(50, 50, 1500, 1030)
  x.textAlign = 'center'
  x.fillStyle = ev.accent
  x.font = `700 44px ${family}`
  x.fillText('CERTIFICATE OF ACHIEVEMENT', 800, 250)
  x.fillStyle = token('--text-primary')
  x.font = `700 96px ${family}`
  x.fillText(name, 800, 460)
  x.fillStyle = token('--text-secondary')
  x.font = `500 44px ${family}`
  x.fillText(`${place}, ${cat}`, 800, 580)
  x.fillText(`${ev.name} · ${fmtDate(ev.endDate)}`, 800, 660)
  x.font = `600 30px ${family}`
  x.fillText('Signed by the organizer', 800, 900)
  return c.toDataURL('image/png')
}

export function ResultsPage() {
  const ev = useEvent()
  const d = useData()
  const cats = categoriesOf(d, ev.id)
  const league = ev.type !== 'tournament' && ev.type !== 'social'
  const finished = cats.filter((c) => categoryPodium(d, c))
  const [catId, setCatId] = useState<string>(finished[0]?.id ?? cats[0]?.id ?? '')
  const [tab, setTab] = useState<'results' | 'dupr' | 'reports'>('results')
  const [open, setOpen] = useState<string | null>(null)
  const cat = cats.find((c) => c.id === catId)
  return (
    <div>
      <PageHeader title="Results" subtitle="Winners, standings, DUPR sync and every report." />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'results', label: league ? 'League table' : 'Winners and standings' }, { value: 'dupr', label: 'DUPR sync', hidden: !ev.certifications.dupr }, { value: 'reports', label: 'Reports' }]} />
      {tab === 'results' && (league ? <LeagueResults ev={ev} /> : cat ? (
        <>
          <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
            {cats.map((c) => (
              <FilterChip key={c.id} active={catId === c.id} onClick={() => setCatId(c.id)} color={c.color}>
                {c.label} {categoryPodium(d, c) ? <Medal size={12} aria-label="Finished" /> : null}
              </FilterChip>
            ))}
          </div>
          <CategoryResults d={d} ev={ev} cat={cat} onOpen={setOpen} />
        </>
      ) : (
        <EmptyState icon={Medal} title="Results appear as matches finish" help="Winners and standings update live." action={<ButtonLink to={`/e/${ev.id}/match-day`}>Go to match day</ButtonLink>} />
      ))}
      {tab === 'dupr' && <DuprPanel d={d} ev={ev} onOpen={setOpen} />}
      {tab === 'reports' && <Reports d={d} ev={ev} />}
      <MatchDrawer matchId={open} onClose={() => setOpen(null)} />
    </div>
  )
}

function CategoryResults({ d, ev, cat, onOpen }: { d: DemoData; ev: EventItem; cat: EventCategory; onOpen: (id: string) => void }) {
  const podium = categoryPodium(d, cat)
  const groups = d.groups.filter((g) => g.categoryId === cat.id).sort((a, b) => a.name.localeCompare(b.name))
  const names = podium ? (podium.map((p) => (p ? sideLabel(d, p, true) : 'To be decided')) as [string, string, string]) : null
  const hasKo = d.matches.some((m) => m.categoryId === cat.id && m.stage !== 'group')
  return (
    <div className="flex flex-col gap-6">
      {podium && names ? (
        <Card className="grid items-center gap-4 overflow-hidden p-0 lg:grid-cols-[1fr_340px]">
          <div className="relative h-[340px]">
            <Suspense fallback={null}>
              <WinnersPodium key={cat.id} className="absolute inset-0" names={names} accent={ev.accent} burst={1} />
            </Suspense>
          </div>
          <div className="p-6">
            <p className="t-overline text-brand-text">{cat.label}</p>
            <ol className="mt-3 flex flex-col gap-3" aria-label="Winners">
              {names.map((n, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-ink" style={{ background: i === 0 ? 'var(--mat-gold)' : i === 1 ? 'var(--mat-silver)' : 'var(--mat-bronze)' }}>
                    {i + 1}
                  </span>
                  <span className="text-[17px] font-semibold text-fg">{n}</span>
                </li>
              ))}
            </ol>
            <Button
              className="mt-5"
              variant="secondary"
              icon={<Award size={16} />}
              onClick={async () => {
                await fakeDelay()
                podium.forEach((p, i) => p && downloadDataUrl(certificate(ev, cat.label, ['Champions', 'Runners-up', 'Third place'][i], sideLabel(d, p)), `${ev.slug}-${cat.label.replace(/\W+/g, '-').toLowerCase()}-${i + 1}.png`))
                toast.success('Certificates downloaded', { body: 'One for each podium place.' })
              }}
            >
              Download certificates
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-line-subtle bg-s1 p-4 text-fg2">
          <Hourglass className="text-fg3" aria-hidden /> {cat.label} is still being played. The podium appears when the final is confirmed.
        </div>
      )}
      {hasKo && (
        <Card className="p-0">
          <CardHeader className="px-5 pt-5" title="Bracket" />
          <Bracket d={d} cat={cat} onOpen={(m) => onOpen(m.id)} />
        </Card>
      )}
      {groups.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardHeader title={cat.format === 'round_robin' ? 'Standings' : `Group ${g.name}`} />
              <StandingsTable d={d} group={g} cat={cat} compact />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function LeagueResults({ ev }: { ev: EventItem }) {
  const d = useData()
  const rows = leagueTable(d, ev.id)
  const ko = ev.league?.knockoutTeams ?? 4
  return (
    <Card className="overflow-x-auto">
      <CardHeader title="League table" subtitle={`Top ${ko} go to the knockouts. Tie points, then match wins, then net matches.`} />
      <table className="w-full min-w-[560px] text-[14px]">
        <thead>
          <tr className="t-overline text-fg4">
            {['Pos', 'Team', 'P', 'W', 'L', 'Tie pts', 'Matches', 'Net'].map((h) => (
              <th key={h} scope="col" className={h === 'Team' ? 'py-2 text-left' : 'py-2 text-right first:text-left'}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const t = d.leagueTeams.find((x) => x.id === r.teamId)!
            return (
              <tr key={r.teamId} className={`border-t ${r.pos === ko ? 'border-b-2 border-b-brand' : 'border-line-subtle'}`}>
                <td className="py-2.5 font-semibold text-fg2 tnum">{r.pos}</td>
                <td className="py-2.5">
                  <span className="flex items-center gap-2">
                    <TeamCrest name={t.name} color={t.color} short={t.short} size={28} />
                    <span className="font-semibold text-fg">{t.name}</span>
                  </span>
                </td>
                {[r.p, r.w, r.l, r.tiePts, `${r.mw}-${r.ml}`, r.net > 0 ? `+${r.net}` : r.net].map((v, i) => (
                  <td key={i} className="py-2.5 text-right text-fg2 tnum">
                    {v}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-3 t-small text-fg3">The orange line is the qualification line.</p>
    </Card>
  )
}

function DuprPanel({ d, ev, onOpen }: { d: DemoData; ev: EventItem; onOpen: (id: string) => void }) {
  const ms = d.matches.filter((m) => m.eventId === ev.id && isConfirmed(m))
  const [busy, setBusy] = useState<string | null>(null)
  const counts = { synced: ms.filter((m) => m.dupr === 'synced').length, pending: ms.filter((m) => m.dupr === 'pending').length, failed: ms.filter((m) => m.dupr === 'failed').length }
  const issues = ms.filter((m) => m.dupr !== 'synced')
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="t-overline text-fg3">Synced</p>
          <p className="t-display-m text-success tnum">{counts.synced}</p>
        </Card>
        <Card>
          <p className="t-overline text-fg3">Pending</p>
          <p className="t-display-m text-fg tnum">{counts.pending}</p>
        </Card>
        <Card>
          <p className="t-overline text-fg3">Needs attention</p>
          <p className="t-display-m text-warning tnum">{counts.failed}</p>
        </Card>
      </div>
      <Card>
        <CardHeader title="Matches not yet on DUPR" subtitle="Results sync automatically every few minutes. Fix the ones that need you." />
        {issues.length === 0 && <p className="flex items-center gap-2 text-success"><CircleCheck size={16} aria-hidden /> Every finished match is on DUPR.</p>}
        <ul className="flex flex-col divide-y divide-line-subtle">
          {issues.slice(0, 30).map((m) => (
            <li key={m.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
              <button type="button" onClick={() => onOpen(m.id)} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-fg">{sideLabel(d, m.sideA, true)} vs {sideLabel(d, m.sideB, true)}</span>
                <span className="block t-small text-fg3">{matchTitle(d, m)}</span>
              </button>
              {m.dupr === 'failed' ? (
                <StatusChip tone="warning" icon={<TriangleAlert size={12} />}>{m.duprReason ?? 'DUPR could not take this result'}</StatusChip>
              ) : (
                <StatusChip tone="neutral" icon={<Hourglass size={12} />}>Pending</StatusChip>
              )}
              <Button
                size="sm"
                variant="secondary"
                icon={<RefreshCw size={14} />}
                loading={busy === m.id}
                onClick={async () => {
                  setBusy(m.id)
                  await fakeDelay(500, 900)
                  retryDupr(m.id)
                  setBusy(null)
                  toast.success('Synced to DUPR')
                }}
              >
                Retry
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function Reports({ d, ev }: { d: DemoData; ev: EventItem }) {
  const cats = categoriesOf(d, ev.id)
  const ents = entries(d, ev.id)
  const pl = (id: string) => d.players.find((p) => p.id === id)
  const reports = useMemo(
    () => [
      { key: 'winners', title: 'Winners', line: 'Top 3 in every category', rows: () => [['Category', 'Place', 'Team or player'], ...cats.flatMap((c) => (categoryPodium(d, c) ?? []).map((s, i) => [c.label, String(i + 1), s ? sideLabel(d, s) : '']))] },
      { key: 'players', title: 'Registered players', line: 'Everyone with an entry', rows: () => [['Name', 'Mobile', 'Email', 'Category'], ...ents.flatMap((r) => r.playerIds.map((p) => [playerName(pl(p)), pl(p)?.mobile ?? '', pl(p)?.email ?? '', cats.find((c) => c.id === r.categoryId)?.label ?? '']))] },
      { key: 'nodupr', title: 'Players missing DUPR ID', line: 'Ask them before results sync', rows: () => [['Name', 'Mobile', 'Status'], ...ents.flatMap((r) => r.playerIds.map(pl)).filter((p) => p && p.duprStatus !== 'ok').map((p) => [playerName(p), p!.mobile, p!.duprStatus === 'missing' ? 'No DUPR ID' : 'DUPR ID not found'])] },
      { key: 'rating', title: 'DUPR rating and reliability', line: 'Ratings at the time of the event', rows: () => [['Name', 'DUPR ID', 'Rating'], ...ents.flatMap((r) => r.playerIds.map(pl)).filter(Boolean).map((p) => [playerName(p), p!.duprId ?? '', p!.duprRating?.toFixed(2) ?? ''])] },
      { key: 'ko', title: 'Knockout matches', line: 'Every knockout result', rows: () => [['Category', 'Stage', 'Side A', 'Side B', 'Score'], ...d.matches.filter((m) => m.eventId === ev.id && m.stage !== 'group').map((m) => [cats.find((c) => c.id === m.categoryId)?.label ?? '', m.stage, sideLabel(d, m.sideA), sideLabel(d, m.sideB), m.games.map((g) => `${g.a}-${g.b}`).join(' ')])] },
      { key: 'divisions', title: 'Divisions (Excel)', line: 'Entries per category and division', rows: () => [['Category', 'Entries', 'Cap'], ...cats.map((c) => [c.label, String(ents.filter((r) => r.categoryId === c.id).length), String(c.cap)])] },
      { key: 'export', title: 'Players export', line: 'All fields you collected', rows: () => [['Name', 'Gender', 'DOB', 'City', 'T-shirt'], ...ents.flatMap((r) => r.playerIds.map(pl)).filter(Boolean).map((p) => [playerName(p), p!.gender, p!.dob, p!.city, p!.tshirt])] },
      { key: 'category', title: 'Category report', line: 'Money and entries by category', rows: () => [['Category', 'Entries', 'Price', 'Value'], ...cats.map((c) => { const n = ents.filter((r) => r.categoryId === c.id).length; return [c.label, String(n), String(c.price), String(n * c.price)] })] },
    ],
    [d, cats, ents, ev.id],
  )
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {reports.map((r) => (
        <li key={r.key} className="card flex flex-col gap-3 p-5">
          <FileSpreadsheet className="text-success" aria-hidden />
          <div className="flex-1">
            <p className="font-semibold text-fg">{r.title}</p>
            <p className="t-small text-fg3">{r.line}</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<Download size={14} />}
            onClick={() => {
              downloadText(`${ev.slug}-${r.key}.csv`, toCsv(r.rows()))
              toast.success(`${r.title} downloaded`)
            }}
          >
            Download
          </Button>
        </li>
      ))}
    </ul>
  )
}
