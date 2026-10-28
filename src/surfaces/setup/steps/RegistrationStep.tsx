import { useEffect, useState } from 'react'
import { Check, CircleAlert, Hourglass, Landmark, ShieldCheck, Upload } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input, PriceInput, Select, Textarea } from '../../../components/ui/Field'
import { FilterChip, Segmented, StatusChip, Toggle } from '../../../components/ui/Controls'
import { Drawer, toast } from '../../../components/ui/Overlay'
import type { EventItem, FieldKey } from '../../../mock/types'
import { submitPayoutAccount, updateCategory, updateEvent } from '../../../store/actions'
import { fakeDelay } from '../../../store/store'
import { useData } from '../../../store/hooks'
import { categoriesOf, grossIfFull } from '../../../store/selectors'
import { inr, slugify } from '../../../lib/format'
import { PUBLIC_HOST } from '../../../lib/brand'
import { DEFAULT_CONSENT } from '../../../mock/constants'
import { Note, Q, StepTitle } from '../common'
import { cn } from '../../../lib/cn'
import { REFUND_LABEL } from '../../../lib/eligibility'
import { HELP } from '../../../lib/help'
import { InfoTip } from '../../../components/ui/InfoTip'

export const FIELD_LABEL: Record<FieldKey, string> = {
  dupr: 'DUPR ID',
  tshirt: 'T-shirt size',
  dob: 'Date of birth',
  district: 'District',
  instagram: 'Instagram',
  emergency: 'Emergency contact',
  club: 'Club name',
}

const SECTIONS = [
  ['fees', 'Entry fees'],
  ['dates', 'Dates and refunds'],
  ['pay', 'Payments'],
  ['fields', 'Questions'],
  ['consent', 'Consent'],
  ['whatsapp', 'WhatsApp'],
  ['certs', 'Certifications'],
  ['address', 'Web address'],
  ['payout', 'Payout'],
] as const

/** SW-05: prices and caps, payments, form fields, consent, WhatsApp, certifications, web address, payout account. */
export function RegistrationStep({ ev, compact }: { ev: EventItem; compact?: boolean }) {
  const d = useData()
  const cats = categoriesOf(d, ev.id)
  const org = d.organizers.find((o) => o.id === ev.organizerId)
  const [payoutOpen, setPayoutOpen] = useState(false)
  const set = (fn: (e: EventItem) => void) => updateEvent(ev.id, fn)
  const s = ev.settings
  const full = ev.type === 'social' ? (ev.social?.capacity ?? 0) * (ev.social?.pricePerPerson ?? 0) : grossIfFull(cats)
  const taken = d.events.some((x) => x.id !== ev.id && x.slug === ev.slug)
  const [checking, setChecking] = useState(false)
  useEffect(() => {
    setChecking(true)
    const t = setTimeout(() => setChecking(false), 450)
    return () => clearTimeout(t)
  }, [ev.slug])
  return (
    <div className="flex flex-col gap-8">
      {!compact && (
        <>
          <StepTitle title="Registration and money." sub="Prices, how players pay, what you ask them, and where your money goes." />
          <nav aria-label="Sections" className="no-scrollbar -mt-4 flex gap-2 overflow-x-auto">
            {SECTIONS.map(([id, l]) => (
              <a key={id} href={`#${id}`} className="h-9 shrink-0 rounded-pill border border-line px-3 py-2 text-[13px] font-semibold text-fg2 hover:text-fg">
                {l}
              </a>
            ))}
          </nav>
        </>
      )}

      {ev.type !== 'social' && (
        <Q id="fees" title="Entry fees and spots" help="Per team for doubles, per player for singles.">
          <div className="hidden grid-cols-[1fr_140px_100px_110px] gap-3 px-1 pb-2 t-overline text-fg4 md:grid">
            <span>Category</span>
            <span>Price</span>
            <span>Spots</span>
            <span>Waitlist</span>
          </div>
          <ul className="flex flex-col gap-2">
            {cats.map((c) => (
              <li key={c.id} className="card grid grid-cols-2 items-center gap-3 p-3 md:grid-cols-[1fr_140px_100px_110px] md:p-2 md:pl-3">
                <span className="col-span-2 flex min-w-0 items-center gap-2 md:col-span-1">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
                  <span className="truncate font-semibold text-fg">{c.label}</span>
                  <span className="shrink-0 t-small text-fg3">{c.teamSize === 2 || c.team ? 'per team' : 'per player'}</span>
                </span>
                <PriceInput ariaLabel={`${c.label} price`} value={c.price} onChange={(v) => updateCategory(c.id, (x) => (x.price = v))} error={c.price <= 0 ? 'Add a price' : null} />
                <Input aria-label={`${c.label} spots`} inputMode="numeric" value={c.cap} onChange={(e) => updateCategory(c.id, (x) => (x.cap = Math.min(512, Number(e.target.value.replace(/\D/g, '')) || 0)))} inputClassName="tnum" />
                <label className="flex items-center gap-2 t-small text-fg2">
                  <input type="checkbox" checked={c.waitlist} onChange={(e) => updateCategory(c.id, (x) => (x.waitlist = e.target.checked))} className="h-5 w-5 accent-[var(--brand)]" />
                  Waitlist
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg border border-brand/40 bg-brand-soft p-4">
            <p className="t-overline text-brand-text">Summary</p>
            <p className="mt-1 t-h3 text-fg">
              If every category fills: <span className="tnum">{inr(full)}</span> in entries.
            </p>
          </div>
        </Q>
      )}
      {ev.type === 'social' && (
        <Q id="fees" title="Entry fee">
          <p className="text-fg2">
            {inr(ev.social?.pricePerPerson ?? 0)} per person, {ev.social?.capacity} spots. If you fill up: <strong className="text-fg">{inr(full)}</strong>. Change it in the previous step.
          </p>
        </Q>
      )}

      <Q id="dates" title="When can players register?" help="Times are in IST. You can close registrations early from Registrations at any time.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input type="datetime-local" label="Registration opens" value={(s.regOpensAt ?? '').slice(0, 16)} onChange={(e) => set((x) => (x.settings.regOpensAt = e.target.value ? `${e.target.value}:00+05:30` : undefined))} helper={s.regOpensAt ? undefined : 'Empty means open as soon as you go live.'} />
          <Input
            type="datetime-local"
            label="Registration closes"
            value={(ev.regClosesAt ?? '').slice(0, 16)}
            onChange={(e) => set((x) => (x.regClosesAt = e.target.value ? `${e.target.value}:00+05:30` : undefined))}
            error={ev.regClosesAt && ev.regClosesAt.slice(0, 10) > ev.startDate.slice(0, 10) ? 'Close registrations before the first day of play.' : s.regOpensAt && ev.regClosesAt && ev.regClosesAt < s.regOpensAt ? 'Closing time is before opening time.' : null}
            helper={ev.regClosesAt ? undefined : 'Empty means the day before play starts.'}
          />
          <Select label="Refund policy" value={s.refundPolicy ?? 'full_until_close'} onChange={(e) => set((x) => (x.settings.refundPolicy = e.target.value as keyof typeof REFUND_LABEL))} options={(Object.keys(REFUND_LABEL) as (keyof typeof REFUND_LABEL)[]).map((k) => ({ value: k, label: REFUND_LABEL[k] }))} />
        </div>
        {cats.some((c) => c.teamSize === 2) && (
          <div className="mt-5">
            <p className="mb-2 flex items-center gap-1.5 t-overline text-fg3">Partner rule <InfoTip text={HELP['Partner rule']} label="Partner rule" /></p>
            <Segmented
              label="Partner rule"
              value={s.partnerRule ?? 'together'}
              onChange={(v) => set((x) => (x.settings.partnerRule = v))}
              options={[
                { value: 'together', label: 'Register together' },
                { value: 'find_partner', label: 'Find me a partner' },
              ]}
            />
            <p className="mt-2 t-small text-fg3">{(s.partnerRule ?? 'together') === 'together' ? 'The first partner names the second; both pay their share.' : 'Players can sign up alone. You pair them in Players & teams before the draw.'}</p>
          </div>
        )}
      </Q>

      <Q id="pay" title="How players pay">
        <div className="flex flex-col gap-4">
          <Toggle checked={s.payments.online} onChange={(v) => set((e) => (e.settings.payments.online = v))} label="Online" description="UPI, cards and netbanking, collected by Rizzfitt and paid out to you." />
          <Toggle checked={s.payments.desk} onChange={(v) => set((e) => (e.settings.payments.desk = v))} label="At the desk" description="Cash or UPI that you collect yourself on the day." />
          {!s.payments.online && !s.payments.desk && <Note tone="warning">Turn on at least one way to pay, or entries will be free.</Note>}
          <Note>Online payments have a [PLATFORM FEE] per entry. You see the exact amount before each payout.</Note>
        </div>
      </Q>

      <Q id="fields" title="What we ask players" help="Name, mobile, email, gender and date of birth are always asked. Add more:">
        <div className="grid gap-5 md:grid-cols-[1fr_240px]">
          <div className="flex flex-wrap content-start gap-2">
            {(Object.keys(FIELD_LABEL) as FieldKey[])
              .filter((k) => k !== 'dob' && (k !== 'dupr' || ev.sport === 'pickleball'))
              .map((k) => (
                <FilterChip key={k} active={s.registrationFields.includes(k)} onClick={() => set((e) => (e.settings.registrationFields = e.settings.registrationFields.includes(k) ? e.settings.registrationFields.filter((x) => x !== k) : [...e.settings.registrationFields, k]))}>
                  {FIELD_LABEL[k]}
                </FilterChip>
              ))}
          </div>
          <div className="rounded-lg border border-line bg-s1 p-3" aria-label="Form preview">
            <p className="mb-2 t-overline text-fg4">Form preview</p>
            {['Full name', 'Mobile', 'Email', 'Gender', 'Date of birth', ...s.registrationFields.filter((f) => f !== 'dob').map((f) => FIELD_LABEL[f])].map((f) => (
              <div key={f} className="mb-1.5 flex h-8 items-center rounded-sm border border-line-subtle bg-s2 px-2 text-[12px] text-fg3">
                {f}
              </div>
            ))}
          </div>
        </div>
      </Q>

      <Q id="consent" title="Rules and consent">
        <div className="flex flex-col gap-4">
          <Textarea label="Consent and declaration" value={s.consentText} onChange={(e) => set((x) => (x.settings.consentText = e.target.value))} helper={s.consentText === DEFAULT_CONSENT ? 'Our suggested wording. Edit it if you like.' : 'Your wording.'} />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={<Upload size={14} />}
              onClick={async () => {
                await fakeDelay()
                set((x) => (x.settings.guidelinesPdf = 'event-guidelines.pdf'))
                toast.success('Guidelines uploaded')
              }}
            >
              {s.guidelinesPdf ? 'Replace guidelines PDF' : 'Upload guidelines PDF'}
            </Button>
            {s.guidelinesPdf && <StatusChip tone="success" icon={<Check size={14} />}>{s.guidelinesPdf}</StatusChip>}
            <span className="t-small text-fg3">Optional</span>
          </div>
          <Input label="Registration note" value={s.registrationNote} onChange={(e) => set((x) => (x.settings.registrationNote = e.target.value))} helper="Shown above the Register button." />
        </div>
      </Q>

      <Q id="whatsapp" title="WhatsApp group" help="Optional. Players join after they pay.">
        <div className="flex flex-col gap-3">
          <Input aria-label="WhatsApp group link" placeholder="https://chat.whatsapp.com/..." value={s.whatsappGroupUrl ?? ''} onChange={(e) => set((x) => (x.settings.whatsappGroupUrl = e.target.value || undefined))} />
          {s.whatsappGroupUrl && <Input label="WhatsApp group message" optional placeholder="Join for draw and schedule updates" value={s.whatsappMessage ?? ''} onChange={(e) => set((x) => (x.settings.whatsappMessage = e.target.value || undefined))} />}
          <Toggle checked={s.whatsappAfterPayment} onChange={(v) => set((x) => (x.settings.whatsappAfterPayment = v))} label="Show the link after payment" />
          <Toggle checked={s.showRegisteredCount} onChange={(v) => set((x) => (x.settings.showRegisteredCount = v))} label="Show how many have registered" description="A little social proof on your page." />
        </div>
      </Q>

      <Q id="certs" title="Certifications">
        <div className="flex flex-col gap-4">
          {ev.sport === 'pickleball' && (
            <Toggle checked={ev.certifications.dupr} onChange={(v) => set((x) => { x.certifications.dupr = v; if (v && !x.settings.registrationFields.includes('dupr')) x.settings.registrationFields.push('dupr') })} label="DUPR rated" description="Results sync to DUPR so players' ratings update. We ask for DUPR IDs." />
          )}
          <Toggle checked={ev.certifications.ipa} onChange={(v) => set((x) => (x.certifications.ipa = v))} label="IPA certified" description="Recognised by the Indian Pickleball Association. Rizzfitt checks with them for you." />
          <Toggle checked={ev.certifications.pwr} onChange={(v) => set((x) => (x.certifications.pwr = v))} label="PWR certified" description="Counts toward PWR rankings." />
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Rizzfitt will WhatsApp you about certification') }} className="t-small font-semibold text-brand-text hover:underline">
            Not sure? Ask Rizzfitt
          </a>
        </div>
      </Q>

      <Q id="address" title="Your event's web address">
        <Input
          aria-label="Web address"
          prefix={PUBLIC_HOST}
          value={ev.slug}
          onChange={(e) =>
            set((x) => {
              x.slug = slugify(e.target.value)
              x.setup.slugLocked = true
            })
          }
          error={taken ? 'That address is taken. Try adding the year or city.' : !ev.slug ? 'Add a web address' : null}
          helper={checking ? 'Checking...' : <span className="inline-flex items-center gap-1 text-success"><Check size={14} aria-hidden /> Available</span>}
        />
      </Q>

      <Q id="payout" title="Where should we send your money?" help="Takes 2 minutes. Needed before you can take payments. Rizzfitt checks it once, usually within a day.">
        <PayoutCard status={org?.payoutAccount?.status} masked={org?.payoutAccount?.maskedNumber} onConnect={() => setPayoutOpen(true)} />
      </Q>
      <PayoutSheet open={payoutOpen} onClose={() => setPayoutOpen(false)} organizerId={ev.organizerId} defaultHolder={org?.orgName || org?.name || ''} />
    </div>
  )
}

export function PayoutCard({ status, masked, onConnect }: { status?: 'pending' | 'verified' | 'changes_requested'; masked?: string; onConnect: () => void }) {
  return (
    <div className={cn('card flex flex-col gap-4 p-4 sm:flex-row sm:items-center', status === 'verified' && 'border-success/40')}>
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-md', status === 'verified' ? 'bg-success-soft text-success' : status === 'pending' ? 'bg-warning-soft text-warning' : 'bg-s3 text-fg2')}>
        {status === 'verified' ? <ShieldCheck size={22} /> : status === 'pending' ? <Hourglass size={22} /> : <Landmark size={22} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-fg">{masked ?? 'No payout account yet'}</p>
        <div className="mt-1">
          {status === 'verified' && <StatusChip tone="success" icon={<Check size={14} />}>Verified</StatusChip>}
          {status === 'pending' && <StatusChip tone="warning" icon={<Hourglass size={14} />}>Under review, usually within a day</StatusChip>}
          {status === 'changes_requested' && <StatusChip tone="danger" icon={<CircleAlert size={14} />}>Rizzfitt asked for a change</StatusChip>}
          {!status && <span className="t-small text-fg3">You can build and preview without it. It blocks go-live only.</span>}
        </div>
      </div>
      <Button variant={status ? 'secondary' : 'primary'} onClick={onConnect}>
        {status ? 'Change account' : 'Connect bank or UPI'}
      </Button>
    </div>
  )
}

export function PayoutSheet({ open, onClose, organizerId, defaultHolder }: { open: boolean; onClose: () => void; organizerId: string; defaultHolder: string }) {
  const [type, setType] = useState<'upi' | 'bank'>('upi')
  const [holder, setHolder] = useState(defaultHolder)
  const [upi, setUpi] = useState('')
  const [acct, setAcct] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [pan, setPan] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    setHolder(defaultHolder)
  }, [defaultHolder])
  const valid = holder.trim().length > 2 && pan.replace(/\W/g, '').length === 10 && (type === 'upi' ? /^[\w.-]{2,}@[a-z]{2,}$/i.test(upi) : acct.replace(/\D/g, '').length >= 9 && /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc))
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Connect your payout account"
      subtitle="Prototype only: nothing you type here is stored or sent."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            I'll do this later
          </Button>
          <Button
            disabled={!valid}
            loading={busy}
            onClick={async () => {
              setBusy(true)
              await fakeDelay(600, 900)
              submitPayoutAccount(organizerId, { type, holderName: holder, number: type === 'upi' ? upi : acct })
              setBusy(false)
              onClose()
              toast.success('Sent for review', { body: 'Rizzfitt usually verifies within a day.' })
            }}
          >
            Submit for review
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented label="Account type" block value={type} onChange={setType} options={[{ value: 'upi', label: 'UPI ID' }, { value: 'bank', label: 'Bank account' }]} />
        <Input label="Account holder name" value={holder} onChange={(e) => setHolder(e.target.value)} />
        {type === 'upi' ? (
          <Input label="UPI ID" placeholder="yourname@okaxis" value={upi} onChange={(e) => setUpi(e.target.value.trim())} helper="Use a UPI ID in the account holder's name." />
        ) : (
          <>
            <Input label="Account number" inputMode="numeric" value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, '').slice(0, 18))} />
            <Input label="IFSC" placeholder="HDFC0001234" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase().slice(0, 11))} />
          </>
        )}
        <Input label="PAN (for KYC)" type="password" autoComplete="off" placeholder="ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))} helper="Shown masked. Demo: type any 10 characters." />
        <Note>Demo tip: try UPI ID smashfactory@okaxis and PAN ABCDE1234F.</Note>
      </div>
    </Drawer>
  )
}
