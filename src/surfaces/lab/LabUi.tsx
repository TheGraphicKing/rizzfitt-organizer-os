import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CircleCheck, Plus, Send, Ticket, Trophy, Hourglass, Search, Trash2, TriangleAlert } from 'lucide-react'
import { Button, IconButton } from '../../components/ui/Button'
import { Input, Textarea, Select, Combobox, PhoneInput, PriceInput, OtpInput } from '../../components/ui/Field'
import { Toggle, Checkbox, RadioGroup, Segmented, Tabs, FilterChip, StatusChip, CategoryChip, LiveBadge, Kbd } from '../../components/ui/Controls'
import { Card, CardHeader, TiltCard } from '../../components/ui/Card'
import { StatTile, Avatar, TeamCrest, SpotIcon, EmptyState, Skeleton, ChoiceCard, Stepper, ProgressBar } from '../../components/ui/Display'
import { Dialog, Drawer, toast, useConfirm } from '../../components/ui/Overlay'
import { DataTable } from '../../components/ui/DataTable'
import { Logo, QR, CopyButton, ScoreBug, DateRangePicker, FileDropzone, Tooltip } from '../../components/ui/Misc'
import { BallLoader } from '../../components/ui/BallLoader'
import { inr } from '../../lib/format'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 t-overline text-brand-text">{title}</h2>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  )
}

const rows = [
  { id: '1', team: 'Arjun Subramanian and Vikram Rao', cat: "Men's Doubles, Open", status: 'Paid', via: 'UPI', amount: 1500 },
  { id: '2', team: 'Divya Nair and Kavya Reddy', cat: "Women's Doubles, Open", status: 'Pending', via: 'Desk', amount: 1500 },
  { id: '3', team: 'Ishaan Mehta', cat: "Men's Singles, Beginner", status: 'Paid', via: 'Card', amount: 800 },
]

export function LabUi() {
  const [t, setT] = useState(true)
  const [c, setC] = useState(true)
  const [r, setR] = useState('a')
  const [seg, setSeg] = useState<'phone' | 'laptop' | 'page'>('phone')
  const [tab, setTab] = useState('all')
  const [chip, setChip] = useState(true)
  const [choice, setChoice] = useState(0)
  const [step, setStep] = useState(2)
  const [dlg, setDlg] = useState(false)
  const [drw, setDrw] = useState(false)
  const [phone, setPhone] = useState('9000010001')
  const [price, setPrice] = useState(1500)
  const [otp, setOtp] = useState('12')
  const [city, setCity] = useState('cbe')
  const [dates, setDates] = useState({ s: '2026-10-17', e: '2026-10-18' })
  const [sel, setSel] = useState<Set<string>>(new Set())
  const confirm = useConfirm()
  return (
    <div className="min-h-dvh bg-base">
      <header className="glass sticky top-0 z-20 flex items-center gap-4 border-b border-line-subtle px-6 py-3">
        <Link to="/">
          <Logo size="sm" />
        </Link>
        <h1 className="t-h3 text-fg">UI kit</h1>
        <Link to="/lab/3d" className="ml-auto t-small text-brand-text">
          3D kit
        </Link>
      </header>
      <main id="main" className="mx-auto flex max-w-[1200px] flex-col gap-4 p-4 sm:p-6">
        <Section title="Buttons">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger" icon={<Trash2 size={16} />}>
            Danger
          </Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg" icon={<Plus size={18} />}>
            Large
          </Button>
          <IconButton label="Search" tone="secondary">
            <Search size={18} />
          </IconButton>
          <Tooltip text="Tooltips explain disabled actions">
            <Button variant="secondary" disabled>
              With reason
            </Button>
          </Tooltip>
        </Section>
        <Section title="Inputs">
          <Input label="Event name" placeholder="Coimbatore Open 2026" className="w-72" helper="This shows on your event page." />
          <Input label="Web address" prefix="" suffix=".rizzfitt.com" className="w-72" defaultValue="coimbatore-open" />
          <Input label="With error" className="w-72" defaultValue="ab" error="Use at least 3 letters" />
          <Input label="Disabled" className="w-72" disabled defaultValue="Locked after publish" />
          <PhoneInput value={phone} onChange={setPhone} />
          <PriceInput label="Entry fee" value={price} onChange={setPrice} suffix="per team" className="w-64" />
          <Select label="Group size" className="w-48" options={[3, 4, 5, 6].map((n) => ({ value: String(n), label: `Groups of ${n}` }))} />
          <Combobox label="City" value={city} onChange={setCity} className="w-72" options={[{ value: 'cbe', label: 'Coimbatore' }, { value: 'che', label: 'Chennai' }, { value: 'blr', label: 'Bengaluru' }]} />
          <Textarea label="Consent text" className="w-full" defaultValue="I confirm the details I have entered are correct." />
          <div className="flex flex-col gap-2">
            <span className="t-small text-fg2">OTP</span>
            <OtpInput value={otp} onChange={setOtp} />
          </div>
        </Section>
        <Section title="Controls">
          <Toggle checked={t} onChange={setT} label="Court TV screens" description="Show live scores on any TV" className="w-80" />
          <Toggle checked={false} onChange={() => {}} label="Disabled toggle" disabled className="w-80" />
          <Checkbox checked={c} onChange={setC} label="Best of 3 for finals only" />
          <RadioGroup label="Seeding" value={r} onChange={setR} options={[{ value: 'a', label: 'By DUPR rating', description: 'Best teams spread across groups' }, { value: 'b', label: 'Random' }]} className="w-80" />
          <Segmented label="Preview" value={seg} onChange={setSeg} options={[{ value: 'phone', label: 'Phone' }, { value: 'laptop', label: 'Laptop' }, { value: 'page', label: 'Public page' }]} />
          <Tabs value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All', count: 96 }, { value: 'paid', label: 'Paid', count: 92 }, { value: 'pending', label: 'Pending', count: 4 }]} className="w-full" />
        </Section>
        <Section title="Chips and badges">
          <FilterChip active={chip} onClick={() => setChip(!chip)} count={28} color="var(--cat-1)">
            Men's Doubles
          </FilterChip>
          <FilterChip active={false} onClick={() => {}}>
            Not checked in
          </FilterChip>
          <StatusChip tone="success" icon={<CircleCheck size={14} />}>
            Paid
          </StatusChip>
          <StatusChip tone="warning" icon={<Hourglass size={14} />}>
            Pending at desk
          </StatusChip>
          <StatusChip tone="danger" icon={<TriangleAlert size={14} />}>
            DUPR ID not found
          </StatusChip>
          <StatusChip tone="info">Waitlist</StatusChip>
          <CategoryChip color="var(--cat-2)">Women's Doubles, Open</CategoryChip>
          <LiveBadge />
          <Kbd>⌘K</Kbd>
        </Section>
        <Section title="Choice cards and stepper">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            {['Club or academy', 'Association or federation', 'Independent organizer'].map((x, i) => (
              <ChoiceCard key={x} selected={choice === i} onSelect={() => setChoice(i)} title={x} description="One line of help" media={<SpotIcon icon={i === 0 ? Trophy : i === 1 ? Ticket : CalendarDays} size={48} float={false} />} />
            ))}
            <ChoiceCard selected={false} onSelect={() => {}} title="Draft league" description="" disabled disabledReason="Circuits run as tournaments" />
          </div>
          <div className="w-full pt-2">
            <Stepper steps={['You', 'Event', 'Format', 'Rules', 'Money', 'Match day', 'Look', 'Review']} current={step} maxReached={7} onJump={setStep} />
          </div>
        </Section>
        <Section title="Cards and stats">
          <TiltCard className="w-64">
            <StatTile label="Entries" value={96} sub="+6 this week" spark={[2, 5, 9, 12, 18, 30, 45, 60, 96]} />
          </TiltCard>
          <TiltCard className="w-64">
            <StatTile label="Collected" value={120200} format={(n) => inr(n)} sub="Online and desk" tone="brand" />
          </TiltCard>
          <Card className="w-72">
            <CardHeader title="Card title" subtitle="Card subtitle" />
            <ProgressBar value={28} max={32} markers={[32]} />
          </Card>
          <div className="flex items-center gap-3">
            <Avatar name="Meera Iyer" color="var(--cat-1)" />
            <Avatar name="Karthik Rao" color="var(--cat-2)" />
            <TeamCrest name="Marina Smashers" color="var(--cat-3)" />
            <TeamCrest name="Nilgiri Ninjas" color="var(--cat-4)" />
          </div>
          <ScoreBug a="Arjun S. / Vikram R." b="Rohit M. / Sameer K." games={{ a: 1, b: 0 }} current={{ a: 6, b: 4 }} server="A" live title="Court 1 · Final" className="w-72" />
          <div className="flex w-64 flex-col gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
          <BallLoader size={20} />
        </Section>
        <Section title="Overlays and feedback">
          <Button variant="secondary" onClick={() => setDlg(true)}>
            Open dialog
          </Button>
          <Button variant="secondary" onClick={() => setDrw(true)}>
            Open drawer
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const ok = await confirm({ title: 'Refund this entry?', body: '₹1,500 goes back to the player in 5 to 7 days. The entry is removed from the draw.', confirmLabel: 'Refund ₹1,500', tone: 'danger' })
              toast[ok ? 'success' : 'info'](ok ? 'Refund started' : 'Nothing changed')
            }}
          >
            Confirm (destructive)
          </Button>
          <Button variant="secondary" onClick={() => toast.success('Marked paid', { body: 'Cash, ₹1,500', undo: () => toast.info('Undone') })}>
            Toast with undo
          </Button>
          <Button variant="secondary" onClick={() => toast.error('That mobile is already registered', { body: 'Open the existing entry instead.' })}>
            Error toast
          </Button>
          <CopyButton text="rizzfitt.com/e/coimbatore-open-2026" />
          <Dialog open={dlg} onClose={() => setDlg(false)} title="Publish schedule?" description="Players get a WhatsApp and email with their first match." footer={<><Button variant="secondary" onClick={() => setDlg(false)}>Cancel</Button><Button icon={<Send size={16} />} onClick={() => setDlg(false)}>Publish</Button></>} />
          <Drawer open={drw} onClose={() => setDrw(false)} title="Entry details" subtitle="Men's Doubles, Open">
            <p className="text-fg2">Drawer content. On mobile this is a bottom sheet with a grab handle.</p>
          </Drawer>
        </Section>
        <Section title="Table">
          <div className="w-full">
            <DataTable
              caption="Sample registrations"
              rows={rows}
              rowKey={(x) => x.id}
              selectable
              selected={sel}
              onSelectedChange={setSel}
              bulkActions={<Button size="sm" variant="secondary">Mark checked in</Button>}
              mobileTitle={(x) => <span className="font-semibold text-fg">{x.team}</span>}
              columns={[
                { key: 'team', header: 'Team or player', cell: (x) => <span className="font-semibold text-fg">{x.team}</span>, sortValue: (x) => x.team },
                { key: 'cat', header: 'Category', cell: (x) => x.cat, mobile: true },
                { key: 'status', header: 'Status', cell: (x) => <StatusChip tone={x.status === 'Paid' ? 'success' : 'warning'}>{x.status}</StatusChip>, mobile: true },
                { key: 'via', header: 'Paid via', cell: (x) => x.via, optional: true },
                { key: 'amount', header: 'Amount', cell: (x) => inr(x.amount), align: 'right', sortValue: (x) => x.amount, mobile: true },
              ]}
            />
          </div>
        </Section>
        <Section title="Date range, upload, QR">
          <div className="w-80">
            <DateRangePicker start={dates.s} end={dates.e} onChange={(s, e) => setDates({ s, e })} />
          </div>
          <div className="w-80">
            <FileDropzone label="Upload your player list" hint="Excel or CSV, up to 500 rows" samples={['doubles-entries-sample.xlsx']} onPick={(n) => toast.success(`${n} uploaded`)} />
          </div>
          <QR value="https://rizzfitt.com/e/coimbatore-open-2026" label="Scan to open the event page" />
        </Section>
        <Section title="Empty state">
          <div className="w-full">
            <EmptyState icon={Ticket} title="No entries yet" help="Share your event link to start taking entries." action={<Button>Copy event link</Button>} />
          </div>
        </Section>
      </main>
    </div>
  )
}
