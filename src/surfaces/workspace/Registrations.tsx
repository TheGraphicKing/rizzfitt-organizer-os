import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRightLeft,
  Check,
  CircleCheck,
  Download,
  FileSpreadsheet,
  Hourglass,
  ListChecks,
  MessageCircle,
  Phone,
  Plus,
  RotateCcw,
  ScanLine,
  Search,
  Send,
  Ticket,
  TriangleAlert,
  Upload,
  UserCheck,
  UserRoundX,
  X,
} from 'lucide-react'
import { useData, useEvent, useRole } from '../../store/hooks'
import { categoriesOf, checkedInCount, checkedInSet, collected, entryCount, playerCount, playerName, sideLabel, regsOf } from '../../store/selectors'
import {
  addEntry,
  checkInRegs,
  closeEntries,
  markPaid,
  moveCategory,
  promoteWaitlist,
  refund,
  removeEntry,
  replacePartner,
  sendPaymentLink,
  setCheckedIn,
  undoMarkPaid,
  updatePlayer,
  withdraw,
  makePlayer,
  type NewPlayerInput,
} from '../../store/regActions'
import { fakeDelay } from '../../store/store'
import { Button } from '../../components/ui/Button'
import { Input, PhoneInput, Select, Textarea } from '../../components/ui/Field'
import { CategoryChip, FilterChip, Segmented, StatusChip } from '../../components/ui/Controls'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Drawer, toast, useConfirm, Dialog } from '../../components/ui/Overlay'
import { EmptyState, AvatarStack, ProgressBar } from '../../components/ui/Display'
import { CopyButton, downloadText, toCsv, FileDropzone } from '../../components/ui/Misc'
import { PageHeader } from './shared'
import { fmtDate, fmtDateTime, fmtPhone, inr, maskEmail, maskPhone, num } from '../../lib/format'
import { celebrate } from '../../lib/celebrate'
import { cn } from '../../lib/cn'
import { PUBLIC_HOST } from '../../lib/brand'
import type { EventCategory, Player, Registration, RegStatus } from '../../mock/types'

const STATUS: Record<RegStatus, { label: string; tone: 'success' | 'warning' | 'neutral' | 'info'; icon: typeof Check }> = {
  paid: { label: 'Paid', tone: 'success', icon: CircleCheck },
  pending: { label: 'Pending', tone: 'warning', icon: Hourglass },
  refunded: { label: 'Refunded', tone: 'neutral', icon: RotateCcw },
  waitlist: { label: 'Waitlist', tone: 'info', icon: ListChecks },
  withdrawn: { label: 'Withdrawn', tone: 'neutral', icon: UserRoundX },
}

export function RegStatusChip({ s }: { s: RegStatus }) {
  const m = STATUS[s]
  const Icon = m.icon
  return (
    <StatusChip tone={m.tone} icon={<Icon size={13} aria-hidden />}>
      {m.label}
    </StatusChip>
  )
}

export function DuprChip({ p, onFix }: { p: Player; onFix?: () => void }) {
  if (p.duprStatus === 'ok') return <span className="tnum text-fg2">{p.duprRating?.toFixed(2) ?? p.duprId}</span>
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onFix?.() }} className="inline-flex">
      <StatusChip tone={p.duprStatus === 'not_found' ? 'danger' : 'warning'} icon={<TriangleAlert size={12} aria-hidden />}>
        {p.duprStatus === 'not_found' ? 'DUPR ID not found' : 'No DUPR ID'}
      </StatusChip>
    </button>
  )
}

export function RegistrationsPage() {
  const ev = useEvent()
  const d = useData()
  const role = useRole()
  const [params, setParams] = useSearchParams()
  const cats = categoriesOf(d, ev.id)
  const [q, setQ] = useState(params.get('player') ? playerName(d.players.find((p) => p.id === params.get('player'))) : '')
  const [cat, setCat] = useState<string | null>(null)
  const [status, setStatus] = useState<RegStatus | null>((params.get('status') as RegStatus) ?? null)
  const [channel, setChannel] = useState<'online' | 'desk' | null>(null)
  const [checked, setChecked] = useState<'in' | 'out' | null>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<string | null>(params.get('reg'))
  const [adding, setAdding] = useState(params.get('add') === '1')
  const [importing, setImporting] = useState(false)
  const [checkin, setCheckin] = useState(params.get('checkin') === '1')
  const [moveTo, setMoveTo] = useState<string | null>(null)
  const [duprFix, setDuprFix] = useState<Player | null>(null)
  const confirm = useConfirm()
  const pmap = useMemo(() => new Map(d.players.map((p) => [p.id, p])), [d.players])
  const inSet = checkedInSet(d, ev.id)

  useEffect(() => {
    if (params.toString()) setParams({}, { replace: true })
  }, []) // read once from the URL, then clear

  const all = regsOf(d, ev.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const rows = all.filter((r) => {
    if (cat && r.categoryId !== cat) return false
    if (status && r.status !== status) return false
    if (!status && (r.status === 'withdrawn')) return false
    if (channel && r.channel !== channel) return false
    if (checked === 'in' && !r.playerIds.every((p) => inSet.has(p))) return false
    if (checked === 'out' && r.playerIds.every((p) => inSet.has(p))) return false
    if (q.trim()) {
      const s = q.toLowerCase()
      const hay = r.playerIds.map((id) => { const p = pmap.get(id); return `${p?.firstName} ${p?.lastName} ${p?.mobile}` }).join(' ').toLowerCase()
      if (!hay.includes(s.replace(/\s/g, '')) && !hay.includes(s)) return false
    }
    return true
  })
  const counts = (st: RegStatus) => all.filter((r) => r.status === st && (!cat || r.categoryId === cat)).length
  const catOf = (id: string) => cats.find((c) => c.id === id)
  const desk = role === 'desk'

  const exportCsv = (list: Registration[]) => {
    const header = ['Team or player', 'Category', 'Status', 'Paid via', 'Channel', 'Registered', 'Mobiles', 'Emails', 'DUPR IDs', 'T-shirt']
    const body = list.map((r) => {
      const ps = r.playerIds.map((id) => pmap.get(id)!)
      return [sideLabel(d, r.id), catOf(r.categoryId)?.label ?? '', STATUS[r.status].label, r.paidVia ?? '', r.channel, fmtDate(r.createdAt), ps.map((p) => p.mobile).join(' / '), ps.map((p) => p.email ?? '').join(' / '), ps.map((p) => p.duprId ?? '').join(' / '), ps.map((p) => p.tshirt).join(' / ')]
    })
    downloadText(`${ev.slug}-registrations.csv`, toCsv([header, ...body]))
    toast.success(`Exported ${list.length} entries`)
  }

  const columns: Column<Registration>[] = [
    {
      key: 'team',
      header: 'Team or player',
      sortValue: (r) => sideLabel(d, r.id),
      cell: (r) => (
        <span className="flex items-center gap-3">
          <AvatarStack names={r.playerIds.map((id) => playerName(pmap.get(id)))} colors={r.playerIds.map((_, i) => `var(--cat-${((r.id.length + i) % 8) + 1})`)} />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-fg">{sideLabel(d, r.id)}</span>
            {r.seed && <span className="t-small text-fg3">Seed {r.seed}</span>}
          </span>
        </span>
      ),
    },
    { key: 'cat', header: 'Category', mobile: true, sortValue: (r) => catOf(r.categoryId)?.order ?? 0, cell: (r) => <CategoryChip color={catOf(r.categoryId)?.color ?? 'var(--cat-1)'}>{catOf(r.categoryId)?.label}</CategoryChip> },
    { key: 'status', header: 'Status', mobile: true, sortValue: (r) => r.status, cell: (r) => <RegStatusChip s={r.status} /> },
    { key: 'via', header: 'Paid via', mobile: true, cell: (r) => (r.paidVia ? `${r.paidVia === 'cash' ? 'Cash' : r.paidVia.toUpperCase()}${r.channel === 'desk' ? ', desk' : ''}` : r.paymentLinkSentAt ? 'Link sent' : '-') },
    {
      key: 'in',
      header: 'Checked in',
      mobile: true,
      cell: (r) => {
        const n = r.playerIds.filter((p) => inSet.has(p)).length
        return n === r.playerIds.length ? <span className="inline-flex items-center gap-1 text-success"><Check size={14} aria-hidden /> Yes</span> : n ? `${n} of ${r.playerIds.length}` : <span className="text-fg3">No</span>
      },
    },
    { key: 'date', header: 'Registered', sortValue: (r) => r.createdAt, cell: (r) => <span className="tnum">{fmtDate(r.createdAt)}</span> },
    { key: 'amount', header: 'Amount', optional: true, align: 'right', sortValue: (r) => r.amount, cell: (r) => inr(r.amount) },
    { key: 'dupr', header: 'DUPR', optional: ev.sport !== 'pickleball', cell: (r) => <span className="flex flex-col gap-1">{r.playerIds.map((id) => <DuprChip key={id} p={pmap.get(id)!} onFix={() => setDuprFix(pmap.get(id)!)} />)}</span> },
    { key: 'mobile', header: 'Mobile', optional: true, cell: (r) => r.playerIds.map((id) => maskPhone(pmap.get(id)!.mobile)).join(', ') },
    { key: 'tshirt', header: 'T-shirt', optional: true, cell: (r) => r.playerIds.map((id) => pmap.get(id)!.tshirt).join(', ') },
    { key: 'district', header: 'District', optional: true, cell: (r) => r.playerIds.map((id) => pmap.get(id)!.district).join(', ') },
    { key: 'dob', header: 'Date of birth', optional: true, cell: (r) => r.playerIds.map((id) => fmtDate(pmap.get(id)!.dob)).join(', ') },
    { key: 'insta', header: 'Instagram', optional: true, cell: (r) => r.playerIds.map((id) => pmap.get(id)!.instagram ?? '-').join(', ') },
  ]

  const current = open ? d.registrations.find((r) => r.id === open) : null

  return (
    <div>
      <PageHeader
        title="Registrations"
        subtitle={
          <span className="tnum">
            {num(entryCount(d, ev.id))} entries · {num(playerCount(d, ev.id))} players{!desk && <> · {inr(collected(d, ev.id))} collected</>}
          </span>
        }
        actions={
          <>
            {ev.settings.checkIn && (
              <Button variant="secondary" icon={<ScanLine size={16} />} onClick={() => setCheckin(true)}>
                Check-in mode
              </Button>
            )}
            {!desk && (
              <>
                <Button variant="secondary" icon={<Upload size={16} />} onClick={() => setImporting(true)}>
                  Import
                </Button>
                <Button variant="secondary" icon={<Download size={16} />} onClick={() => exportCsv(rows)}>
                  Export
                </Button>
              </>
            )}
            <Button icon={<Plus size={16} />} onClick={() => setAdding(true)}>
              Add entry
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg3" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or mobile" aria-label="Search registrations" className="h-11 w-full rounded-md border border-line bg-s1 pl-11 pr-3 text-fg placeholder:text-fg4 focus:border-brand focus:outline-none" />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Category">
          <FilterChip active={!cat} onClick={() => setCat(null)}>
            All categories
          </FilterChip>
          {cats.map((c) => (
            <FilterChip key={c.id} active={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)} color={c.color} count={entryCount(d, ev.id, c.id)}>
              {c.label}
            </FilterChip>
          ))}
        </div>
        <div className="no-scrollbar flex flex-wrap gap-2" role="group" aria-label="Status">
          {(['paid', 'pending', 'refunded', 'waitlist'] as RegStatus[]).map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => setStatus(status === s ? null : s)} count={counts(s)}>
              {STATUS[s].label}
            </FilterChip>
          ))}
          <span className="mx-1 w-px self-stretch bg-line" aria-hidden />
          <FilterChip active={channel === 'online'} onClick={() => setChannel(channel === 'online' ? null : 'online')}>
            Online
          </FilterChip>
          <FilterChip active={channel === 'desk'} onClick={() => setChannel(channel === 'desk' ? null : 'desk')}>
            Desk
          </FilterChip>
          <span className="mx-1 w-px self-stretch bg-line" aria-hidden />
          <FilterChip active={checked === 'in'} onClick={() => setChecked(checked === 'in' ? null : 'in')}>
            Checked in
          </FilterChip>
          <FilterChip active={checked === 'out'} onClick={() => setChecked(checked === 'out' ? null : 'out')}>
            Not checked in
          </FilterChip>
        </div>
      </div>

      <DataTable
        caption={`Registrations for ${ev.name}`}
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        onRowClick={(r) => setOpen(r.id)}
        selectable
        selected={sel}
        onSelectedChange={setSel}
        onRowKeyDown={(r, e) => {
          if (e.key === ' ' && ev.settings.checkIn) {
            e.preventDefault()
            checkInRegs([r.id])
            toast.success(`${sideLabel(d, r.id, true)} checked in`)
          }
        }}
        mobileTitle={(r) => (
          <span>
            <span className="block font-semibold text-fg">{sideLabel(d, r.id)}</span>
            <span className="t-small text-fg3">{fmtDate(r.createdAt)}</span>
          </span>
        )}
        mobileAside={(r) =>
          ev.settings.checkIn && r.status !== 'refunded' ? (
            <button
              type="button"
              aria-label={`Check in ${sideLabel(d, r.id)}`}
              onClick={() => {
                checkInRegs([r.id])
                toast.success('Checked in')
              }}
              className={cn('flex h-11 w-11 items-center justify-center rounded-md border', r.playerIds.every((p) => inSet.has(p)) ? 'border-success bg-success-soft text-success' : 'border-line text-fg3')}
            >
              <UserCheck size={18} />
            </button>
          ) : null
        }
        rowClassName={(r) => (r.status === 'refunded' || r.status === 'withdrawn' ? 'opacity-60' : undefined)}
        bulkActions={
          <>
            <Button size="sm" variant="secondary" icon={<MessageCircle size={14} />} onClick={() => toast.success(`Message drafted for ${sel.size} entries`, { body: 'Finish it in Messages.' })}>
              Message
            </Button>
            <Button size="sm" variant="secondary" icon={<UserCheck size={14} />} onClick={() => { checkInRegs([...sel]); toast.success(`${sel.size} entries checked in`); setSel(new Set()) }}>
              Check in
            </Button>
            {!desk && (
              <>
                <Button size="sm" variant="secondary" icon={<Download size={14} />} onClick={() => exportCsv(all.filter((r) => sel.has(r.id)))}>
                  Export
                </Button>
                <Button size="sm" variant="secondary" icon={<ArrowRightLeft size={14} />} onClick={() => setMoveTo(cats[0]?.id ?? null)}>
                  Move
                </Button>
              </>
            )}
          </>
        }
        empty={
          all.length === 0 ? (
            <EmptyState icon={Ticket} title="No entries yet" help="Share your event link to start taking entries." action={<CopyButton variant="primary" label="Copy event link" text={`https://${PUBLIC_HOST}${ev.slug}`} />} />
          ) : (
            <p className="p-10 text-center text-fg3">No entries match these filters.</p>
          )
        }
      />

      {!desk && cats.length > 0 && ev.status === 'registrations_open' && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-line-subtle bg-s1 p-4">
          <p className="flex-1 text-fg2">Ready to draw? Close entries for one category or all of them.</p>
          <Button
            variant="secondary"
            onClick={async () => {
              const target = cat ? [cat] : cats.map((c) => c.id)
              const ok = await confirm({ title: cat ? `Close entries for ${catOf(cat)?.label}?` : 'Close entries for every category?', body: 'Players will not be able to register in these categories. You can reopen them any time.', confirmLabel: 'Close entries', tone: 'danger' })
              if (ok) {
                closeEntries(target)
                toast.success('Entries closed', { body: 'These categories are ready to draw.' })
              }
            }}
          >
            {cat ? 'Close this category' : 'Close all entries'}
          </Button>
        </div>
      )}

      <RegDrawer reg={current ?? null} onClose={() => setOpen(null)} cats={cats} desk={desk} onFixDupr={setDuprFix} />
      <AddEntrySheet open={adding} onClose={() => setAdding(false)} cats={cats} eventId={ev.id} paymentsDesk={ev.settings.payments.desk} />
      <ImportSheet open={importing} onClose={() => setImporting(false)} cats={cats} eventId={ev.id} />
      {checkin && <CheckInMode onClose={() => setCheckin(false)} />}
      <Dialog
        open={!!moveTo}
        onClose={() => setMoveTo(null)}
        title={`Move ${sel.size} entries`}
        description="They leave their current draw. Players are told on WhatsApp."
        footer={
          <>
            <Button variant="secondary" onClick={() => setMoveTo(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                sel.forEach((id) => moveCategory(id, moveTo!))
                toast.success(`Moved ${sel.size} entries`)
                setSel(new Set())
                setMoveTo(null)
              }}
            >
              Move entries
            </Button>
          </>
        }
      >
        <Select label="Move to" value={moveTo ?? ''} onChange={(e) => setMoveTo(e.target.value)} options={cats.map((c) => ({ value: c.id, label: c.label }))} />
      </Dialog>
      <DuprFixDialog player={duprFix} onClose={() => setDuprFix(null)} />
    </div>
  )
}

function DuprFixDialog({ player, onClose }: { player: Player | null; onClose: () => void }) {
  const [id, setId] = useState('')
  useEffect(() => {
    setId(player?.duprId ?? '')
  }, [player])
  return (
    <Dialog
      open={!!player}
      onClose={onClose}
      title={`Fix DUPR ID for ${playerName(player ?? undefined)}`}
      description={player?.duprStatus === 'not_found' ? 'DUPR could not find this ID. Check it with the player; it is on their DUPR profile.' : 'This player has not added a DUPR ID yet. Results will sync once it is added.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={id.trim().length < 4}
            onClick={async () => {
              await fakeDelay()
              updatePlayer(player!.id, { duprId: id.trim(), duprStatus: 'ok', duprRating: 3.6 })
              toast.success('DUPR ID saved and verified')
              onClose()
            }}
          >
            Save and verify
          </Button>
        </>
      }
    >
      <Input label="DUPR ID" value={id} onChange={(e) => setId(e.target.value.toUpperCase())} placeholder="D1234567" />
    </Dialog>
  )
}

/* ------------------------------------------------------------- detail drawer */

export function RegDrawer({ reg, onClose, cats, desk, onFixDupr }: { reg: Registration | null; onClose: () => void; cats: EventCategory[]; desk: boolean; onFixDupr: (p: Player) => void }) {
  const d = useData()
  const confirm = useConfirm()
  const [reveal, setReveal] = useState<string | null>(null)
  const [refundOpen, setRefundOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [moving, setMoving] = useState(false)
  const [moveTo, setMoveTo] = useState('')
  const [partnerIdx, setPartnerIdx] = useState<number | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const inSet = reg ? checkedInSet(d, reg.eventId) : new Set<string>()
  if (!reg) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>
  const cat = cats.find((c) => c.id === reg.categoryId)
  const players = reg.playerIds.map((id) => d.players.find((p) => p.id === id)!)
  const run = async (key: string, fn: () => void, msg: string, undo?: () => void) => {
    setBusy(key)
    await fakeDelay(300, 600)
    fn()
    setBusy(null)
    toast.success(msg, undo ? { undo } : undefined)
  }
  return (
    <Drawer open onClose={onClose} title={sideLabel(d, reg.id)} subtitle={<span className="flex items-center gap-2">{cat?.label} <RegStatusChip s={reg.status} /></span>}>
      <div className="flex flex-col gap-6">
        <section aria-label="Players" className="flex flex-col gap-3">
          {players.map((p, i) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-fg">{playerName(p)}</p>
                  <p className="t-small text-fg3">
                    {p.gender === 'M' ? 'Man' : 'Woman'} · {p.city || 'City not given'} · T-shirt {p.tshirt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckedIn(reg.eventId, p.id, !inSet.has(p.id))}
                  className={cn('flex h-10 items-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold', inSet.has(p.id) ? 'border-success bg-success-soft text-success' : 'border-line text-fg2 hover:bg-s2')}
                >
                  <UserCheck size={14} aria-hidden /> {inSet.has(p.id) ? 'Checked in' : 'Check in'}
                </button>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-[14px]">
                <div>
                  <dt className="t-overline text-fg4">Mobile</dt>
                  <dd>
                    <button type="button" className="text-fg2 underline-offset-2 hover:underline tnum" onClick={() => setReveal(reveal === p.id ? null : p.id)}>
                      {reveal === p.id ? fmtPhone(p.mobile) : maskPhone(p.mobile)}
                    </button>
                  </dd>
                </div>
                <div>
                  <dt className="t-overline text-fg4">Email</dt>
                  <dd className="truncate text-fg2">{p.email ? (reveal === p.id ? p.email : maskEmail(p.email)) : <span className="text-warning">No email</span>}</dd>
                </div>
                <div>
                  <dt className="t-overline text-fg4">DUPR</dt>
                  <dd>
                    <DuprChip p={p} onFix={() => onFixDupr(p)} />
                  </dd>
                </div>
                {!desk && reg.playerIds.length > 1 && (
                  <div className="flex items-end justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setPartnerIdx(i)}>
                      Edit partner
                    </Button>
                  </div>
                )}
              </dl>
            </div>
          ))}
        </section>

        <section aria-label="Actions" className="grid grid-cols-2 gap-2">
          {reg.status === 'pending' && (
            <>
              <Button loading={busy === 'cash'} onClick={() => run('cash', () => markPaid(reg.id, 'cash'), 'Marked paid in cash', () => undoMarkPaid(reg.id))}>
                Paid cash
              </Button>
              <Button loading={busy === 'upi'} onClick={() => run('upi', () => markPaid(reg.id, 'upi'), 'Marked paid by UPI', () => undoMarkPaid(reg.id))}>
                Paid UPI
              </Button>
              <Button variant="secondary" icon={<Send size={14} />} loading={busy === 'link'} onClick={() => run('link', () => sendPaymentLink(reg.id), 'Payment link sent on WhatsApp')}>
                Send payment link
              </Button>
            </>
          )}
          {reg.status === 'waitlist' && (
            <Button className="col-span-2" onClick={() => run('promote', () => promoteWaitlist(reg.id), 'Promoted. Payment link sent.')}>
              Promote to entry
            </Button>
          )}
          {!desk && reg.status !== 'refunded' && reg.status !== 'withdrawn' && (
            <>
              <Button variant="secondary" icon={<ArrowRightLeft size={14} />} onClick={() => { setMoveTo(cats.find((c) => c.id !== reg.categoryId)?.id ?? ''); setMoving(true) }}>
                Move category
              </Button>
              {reg.status === 'paid' && (
                <Button variant="secondary" onClick={() => setRefundOpen(true)}>
                  Refund
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={async () => {
                  const ok = await confirm({ title: 'Withdraw this entry?', body: 'They are removed from the draw. Money stays as it is; refund separately if needed.', confirmLabel: 'Withdraw entry', tone: 'danger' })
                  if (ok) {
                    withdraw(reg.id)
                    toast.success('Entry withdrawn')
                    onClose()
                  }
                }}
              >
                Withdraw
              </Button>
            </>
          )}
        </section>

        {reg.notes && <p className="rounded-[12px] bg-s2 px-3 py-2 t-small text-fg2">{reg.notes}</p>}
        <section aria-label="Payment timeline">
          <h3 className="mb-2 t-overline text-fg3">Timeline</h3>
          <ol className="relative flex flex-col gap-3 border-l border-line pl-4">
            {[...reg.history].reverse().map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden />
                <p className="text-[14px] text-fg">{h.text}</p>
                <p className="t-small text-fg3">{fmtDateTime(h.at)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <Dialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        tone="danger"
        title={`Refund ${inr(reg.amount)}?`}
        description="The money goes back to the player in 5 to 7 days and the entry leaves the draw. This cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={reason.trim().length < 3}
              onClick={() => {
                refund(reg.id, reason.trim())
                setRefundOpen(false)
                setReason('')
                toast.success('Refund started', { body: `${inr(reg.amount)} back in 5 to 7 days.` })
              }}
            >
              Refund {inr(reg.amount)}
            </Button>
          </>
        }
      >
        <Textarea label="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Injury, duplicate entry, event change..." />
      </Dialog>
      <Dialog
        open={moving}
        onClose={() => setMoving(false)}
        title="Move to another category"
        description="The entry leaves its current draw. If the price differs, we settle the difference with the player."
        footer={
          <>
            <Button variant="secondary" onClick={() => setMoving(false)}>
              Cancel
            </Button>
            <Button
              disabled={!moveTo}
              onClick={() => {
                moveCategory(reg.id, moveTo)
                setMoving(false)
                toast.success(`Moved to ${cats.find((c) => c.id === moveTo)?.label}`)
              }}
            >
              Move entry
            </Button>
          </>
        }
      >
        <Select label="Category" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} options={cats.filter((c) => c.id !== reg.categoryId).map((c) => ({ value: c.id, label: `${c.label} (${inr(c.price)})` }))} />
      </Dialog>
      <PartnerDialog reg={reg} idx={partnerIdx} onClose={() => setPartnerIdx(null)} />
    </Drawer>
  )
}

export function PartnerDialog({ reg, idx, onClose }: { reg: Registration; idx: number | null; onClose: () => void }) {
  const d = useData()
  const confirm = useConfirm()
  const [p, setP] = useState<NewPlayerInput>({ firstName: '', lastName: '', gender: 'M', mobile: '' })
  const old = idx !== null ? d.players.find((x) => x.id === reg.playerIds[idx]) : undefined
  return (
    <Dialog
      open={idx !== null}
      onClose={onClose}
      title={`Replace ${playerName(old)}`}
      description="Look up the new partner by mobile. Both players are told on WhatsApp."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={p.mobile.length !== 10 || !p.firstName}
            onClick={async () => {
              const ok = await confirm({ title: 'Swap partner?', body: `${playerName(old)} is replaced by ${p.firstName} ${p.lastName}. Both get a WhatsApp.`, confirmLabel: 'Swap partner' })
              if (!ok) return
              replacePartner(reg.id, idx!, makePlayer(p, d.players.length))
              toast.success('Partner changed')
              onClose()
            }}
          >
            Replace partner
          </Button>
        </>
      }
    >
      <PlayerLookup value={p} onChange={setP} label="New partner" />
    </Dialog>
  )
}

/* -------------------------------------------------------------- add entry */

/** Mobile-first player lookup: returning players autofill. */
export function PlayerLookup({ value, onChange, label }: { value: NewPlayerInput; onChange: (v: NewPlayerInput) => void; label: string }) {
  const d = useData()
  const found = value.mobile.length === 10 ? d.players.find((x) => x.mobile === value.mobile) : undefined
  useEffect(() => {
    if (found && value.existingId !== found.id) onChange({ existingId: found.id, firstName: found.firstName, lastName: found.lastName, gender: found.gender, mobile: found.mobile })
    if (!found && value.existingId) onChange({ ...value, existingId: undefined })
  }, [found?.id]) // only when the lookup result changes
  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border border-line-subtle p-3">
      <legend className="px-1 t-small font-semibold text-fg2">{label}</legend>
      <PhoneInput value={value.mobile} onChange={(m) => onChange({ ...value, mobile: m })} helper={found ? undefined : 'Returning players fill in automatically.'} />
      {found ? (
        <p className="flex items-center gap-2 rounded-md bg-success-soft px-3 py-2 text-[14px] text-success">
          <CircleCheck size={16} aria-hidden /> Found {playerName(found)}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Input label="First name" value={value.firstName} onChange={(e) => onChange({ ...value, firstName: e.target.value })} />
          <Input label="Last name" value={value.lastName} onChange={(e) => onChange({ ...value, lastName: e.target.value })} />
          <Segmented label="Gender" value={value.gender} onChange={(g) => onChange({ ...value, gender: g })} options={[{ value: 'M', label: 'Man' }, { value: 'F', label: 'Woman' }]} className="col-span-2" />
        </div>
      )}
    </fieldset>
  )
}

function AddEntrySheet({ open, onClose, cats, eventId, paymentsDesk }: { open: boolean; onClose: () => void; cats: EventCategory[]; eventId: string; paymentsDesk: boolean }) {
  const blank: NewPlayerInput = { firstName: '', lastName: '', gender: 'M', mobile: '' }
  const [catId, setCatId] = useState(cats[0]?.id ?? '')
  const [ps, setPs] = useState<NewPlayerInput[]>([blank, blank])
  const [pay, setPay] = useState<'cash' | 'upi' | 'link' | 'pending'>(paymentsDesk ? 'cash' : 'link')
  const [busy, setBusy] = useState(false)
  const d = useData()
  const entryCountFor = (c: EventCategory) => entryCount(d, eventId, c.id)
  const cat = cats.find((c) => c.id === catId)
  const size = cat?.teamSize ?? 1
  const valid = ps.slice(0, size).every((p) => p.mobile.length === 10 && (p.existingId || p.firstName.trim()))
  useEffect(() => {
    if (open) {
      setPs([blank, blank])
      setCatId(cats[0]?.id ?? '')
    }
  }, [open]) // reset on open
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add an entry"
      subtitle="For walk-ins and phone bookings."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || !cat}
            loading={busy}
            onClick={async () => {
              setBusy(true)
              await fakeDelay()
              const id = addEntry(eventId, catId, ps.slice(0, size), pay, 'Organizer')
              setBusy(false)
              onClose()
              toast.success(`Entry added to ${cat!.label}`, { body: pay === 'cash' || pay === 'upi' ? `Paid ${pay === 'cash' ? 'in cash' : 'by UPI'}, ${inr(cat!.price)}` : pay === 'link' ? 'Payment link sent on WhatsApp' : 'Payment pending at the desk', undo: () => removeEntry(id) })
            }}
          >
            Add entry
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select label="Category" value={catId} onChange={(e) => setCatId(e.target.value)} options={cats.map((c) => ({ value: c.id, label: `${c.label} · ${inr(c.price)}${entryCountFor(c) >= c.cap ? ' · full, joins waitlist' : ''}` }))} />
        {Array.from({ length: size }, (_, i) => (
          <PlayerLookup key={i} label={size === 1 ? 'Player' : i === 0 ? 'Player 1' : 'Partner'} value={ps[i]} onChange={(v) => setPs((old) => old.map((x, j) => (j === i ? v : x)))} />
        ))}
        <div>
          <p className="mb-2 t-small text-fg2">Payment</p>
          <div className="grid grid-cols-2 gap-2">
            {([['cash', 'Paid cash'], ['upi', 'Paid UPI'], ['link', 'Send link'], ['pending', 'Pending']] as const).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={pay === k} onClick={() => setPay(k)} disabled={!paymentsDesk && (k === 'cash' || k === 'upi')} className={cn('h-12 rounded-md border text-[14px] font-semibold disabled:opacity-40', pay === k ? 'border-brand bg-brand-soft text-fg' : 'border-line text-fg2 hover:bg-s2')}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {cat && <p className="t-small text-fg3">Entry fee: {inr(cat.price)} {cat.teamSize === 2 ? 'per team' : 'per player'}</p>}
      </div>
    </Drawer>
  )
}

/* ----------------------------------------------------------------- import */

const SAMPLE_ROWS = [
  { a: 'Hemant Joshi', b: 'Rakesh Pai', m1: '9000017001', m2: '9000017002', issue: null },
  { a: 'Swati Deshmukh', b: 'Payal Rane', m1: '9000017003', m2: '9000017004', issue: null },
  { a: 'Varun Nair', b: 'Tushar Bhat', m1: '9000017005', m2: '', issue: 'Missing mobile for Tushar Bhat' },
  { a: 'Kunal Shah', b: 'Ritesh Verma', m1: '9000017007', m2: '9000017008', issue: null },
  { a: 'Hemant Joshi', b: 'Rakesh Pai', m1: '9000017001', m2: '9000017002', issue: 'Duplicate of row 1' },
  { a: 'Omkar Patil', b: 'Saurabh Kale', m1: '9000017011', m2: '9000017012', issue: null },
]

function ImportSheet({ open, onClose, cats, eventId }: { open: boolean; onClose: () => void; cats: EventCategory[]; eventId: string }) {
  const [step, setStep] = useState(0)
  const [catId, setCatId] = useState(cats[0]?.id ?? '')
  const [file, setFile] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (open) {
      setStep(0)
      setFile(null)
    }
  }, [open])
  const good = SAMPLE_ROWS.filter((r) => !r.issue)
  const cat = cats.find((c) => c.id === catId)
  return (
    <Drawer open={open} onClose={onClose} title="Import from Excel" subtitle={`Step ${step + 1} of 3`} width={560}>
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <Select label="Category" value={catId} onChange={(e) => setCatId(e.target.value)} options={cats.map((c) => ({ value: c.id, label: c.label }))} />
          <p className="text-fg2">Download the template, fill one row per entry, then upload it.</p>
          <div className="grid grid-cols-2 gap-2">
            {(['Singles', 'Doubles'] as const).map((t) => (
              <Button
                key={t}
                variant="secondary"
                icon={<FileSpreadsheet size={16} />}
                onClick={() => {
                  downloadText(`rizzfitt-${t.toLowerCase()}-template.csv`, toCsv(t === 'Singles' ? [['First name', 'Last name', 'Mobile', 'Email', 'Gender', 'DUPR ID']] : [['Player 1 name', 'Player 1 mobile', 'Player 2 name', 'Player 2 mobile', 'Team name']]))
                  toast.success(`${t} template downloaded`)
                }}
              >
                {t} template
              </Button>
            ))}
          </div>
          <Button onClick={() => setStep(1)}>Next: upload</Button>
        </div>
      )}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <FileDropzone label="Upload your filled template" hint="Excel or CSV" samples={['coimbatore-walkins.xlsx']} onPick={(n) => { setFile(n); setStep(2) }} />
          <Button variant="ghost" onClick={() => setStep(0)}>
            Back
          </Button>
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-fg2">
            <strong className="text-fg">{file}</strong>: {SAMPLE_ROWS.length} rows. {good.length} ready, {SAMPLE_ROWS.length - good.length} need a fix and will be skipped.
          </p>
          <ul className="flex flex-col gap-1.5">
            {SAMPLE_ROWS.map((r, i) => (
              <li key={i} className={cn('flex items-center gap-3 rounded-md border px-3 py-2 text-[14px]', r.issue ? 'border-warning/40 bg-warning-soft' : 'border-line-subtle bg-s1')}>
                <span className="w-6 text-fg3 tnum">{i + 1}</span>
                <span className="flex-1 truncate text-fg">
                  {r.a} and {r.b}
                </span>
                {r.issue ? (
                  <span className="flex items-center gap-1 t-small text-warning">
                    <TriangleAlert size={12} aria-hidden /> {r.issue}
                  </span>
                ) : (
                  <Check size={16} className="text-success" aria-label="Ready" />
                )}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              className="flex-1"
              loading={busy}
              onClick={async () => {
                setBusy(true)
                await fakeDelay(600, 900)
                good.forEach((r) => {
                  const [f1, l1] = r.a.split(' ')
                  const [f2, l2] = r.b.split(' ')
                  const players = cat?.teamSize === 1 ? [{ firstName: f1, lastName: l1, gender: 'M' as const, mobile: r.m1 }] : [{ firstName: f1, lastName: l1, gender: 'M' as const, mobile: r.m1 }, { firstName: f2, lastName: l2, gender: 'M' as const, mobile: r.m2 }]
                  addEntry(eventId, catId, players, 'pending', 'Import')
                })
                setBusy(false)
                onClose()
                toast.success(`Imported ${good.length} entries into ${cat?.label}`, { body: 'Payments are pending until they pay.' })
              }}
            >
              Import {good.length} entries
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  )
}

/* -------------------------------------------------------------- check-in mode */

function CheckInMode({ onClose }: { onClose: () => void }) {
  const ev = useEvent()
  const d = useData()
  const [q, setQ] = useState('')
  const inSet = checkedInSet(d, ev.id)
  const total = playerCount(d, ev.id)
  const done = checkedInCount(d, ev.id)
  const celebrated = useRef(done >= total)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  useEffect(() => {
    if (done >= total && total > 0 && !celebrated.current) {
      celebrated.current = true
      celebrate()
      toast.success('Everyone is checked in. Let the games begin.')
    }
  }, [done, total])
  const people = useMemo(() => {
    const ids = new Set<string>()
    d.registrations.filter((r) => r.eventId === ev.id && (r.status === 'paid' || r.status === 'pending')).forEach((r) => r.playerIds.forEach((p) => ids.add(p)))
    return [...ids].map((id) => d.players.find((p) => p.id === id)!).filter(Boolean)
  }, [d.registrations, d.players, ev.id])
  const s = q.trim().toLowerCase()
  const list = people
    .filter((p) => !s || `${p.firstName} ${p.lastName} ${p.mobile}`.toLowerCase().includes(s))
    .sort((a, b) => Number(inSet.has(a.id)) - Number(inSet.has(b.id)) || a.firstName.localeCompare(b.firstName))
    .slice(0, 60)
  const catsFor = (pid: string) => d.registrations.filter((r) => r.eventId === ev.id && r.playerIds.includes(pid) && (r.status === 'paid' || r.status === 'pending')).map((r) => d.categories.find((c) => c.id === r.categoryId)?.label).join(', ')
  const toggle = (p: Player) => {
    const on = !inSet.has(p.id)
    setCheckedIn(ev.id, p.id, on)
    if (on) toast.success(`${p.firstName} checked in`, { undo: () => setCheckedIn(ev.id, p.id, false) })
  }
  return (
    <div className="fixed inset-0 z-[85] flex flex-col bg-canvas" role="dialog" aria-modal="true" aria-label="Check-in mode">
      <header className="glass border-b border-line-subtle px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[900px] items-center gap-4">
          <div className="flex-1">
            <p className="t-overline text-brand-text">Check-in mode</p>
            <p className="t-h2 text-fg tnum" aria-live="polite">
              {done} of {total} checked in
            </p>
          </div>
          <Button variant="secondary" icon={<X size={16} />} onClick={onClose}>
            Done
          </Button>
        </div>
        <div className="mx-auto mt-3 max-w-[900px]">
          <ProgressBar value={done} max={total} color="var(--success)" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-[900px] flex-1 overflow-y-auto px-4 py-4 sm:px-8">
        <div className="relative mb-4">
          <Search size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg3" aria-hidden />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a name or mobile" aria-label="Find a player" className="h-16 w-full rounded-lg border border-line bg-s1 pl-14 pr-4 text-[20px] text-fg placeholder:text-fg4 focus:border-brand focus:outline-none" />
        </div>
        <p className="mb-2 t-small text-fg3">Tap a player, swipe right on a phone, or press Space on a focused row.</p>
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {list.map((p) => (
              <CheckRow key={p.id} p={p} on={inSet.has(p.id)} sub={catsFor(p.id)} onToggle={() => toggle(p)} />
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  )
}

function CheckRow({ p, on, sub, onToggle }: { p: Player; on: boolean; sub: string; onToggle: () => void }) {
  return (
    <motion.li layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.button
        type="button"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.5 }}
        onDragEnd={(_, info) => info.offset.x > 90 && !on && onToggle()}
        onClick={onToggle}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        aria-pressed={on}
        className={cn('flex min-h-[64px] w-full items-center gap-4 rounded-lg border px-4 text-left transition-colors', on ? 'border-success/50 bg-success-soft' : 'border-line bg-s1 hover:bg-s2')}
      >
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', on ? 'bg-success text-ink' : 'border border-line text-fg3')}>{on ? <Check size={20} strokeWidth={3} /> : <UserCheck size={18} />}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold text-fg">{playerName(p)}</span>
          <span className="block truncate t-small text-fg3">{sub}</span>
        </span>
        <span className="hidden t-small text-fg3 tnum sm:block">
          <Phone size={12} className="mr-1 inline" aria-hidden />
          {maskPhone(p.mobile)}
        </span>
      </motion.button>
    </motion.li>
  )
}

