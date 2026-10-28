import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CircleCheck, Download, Hourglass, IndianRupee, Mail, RotateCcw, Wallet } from 'lucide-react'
import { useData, useEvent } from '../../store/hooks'
import { categoriesOf, collected, collectedBy, entries, feesTotal, paymentsOf, payoutTotal, refunded } from '../../store/selectors'
import { refund } from '../../store/regActions'
import { mutate, stamp } from '../../store/store'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, TiltCard } from '../../components/ui/Card'
import { FilterChip, StatusChip, Tabs } from '../../components/ui/Controls'
import { StatTile } from '../../components/ui/Display'
import { DataTable } from '../../components/ui/DataTable'
import { Dialog, toast } from '../../components/ui/Overlay'
import { Textarea } from '../../components/ui/Field'
import { downloadText, toCsv } from '../../components/ui/Misc'
import { PageHeader } from './shared'
import { PayoutCard } from '../setup/steps/RegistrationStep'
import { fmtDate, fmtDateTime, fmtDayMonth, inr } from '../../lib/format'
import type { Payment } from '../../mock/types'

/** W-12. One fees total, never rates. Totals reconcile with Registrations through shared selectors. */
export function MoneyPage() {
  const ev = useEvent()
  const d = useData()
  const [tab, setTab] = useState<'overview' | 'payments' | 'invoices'>('overview')
  const [filter, setFilter] = useState<'all' | 'captured' | 'refunded' | 'online' | 'desk'>('all')
  const [refundFor, setRefundFor] = useState<Payment | null>(null)
  const [reason, setReason] = useState('')
  const org = d.organizers.find((o) => o.id === ev.organizerId)
  const pays = paymentsOf(d, ev.id).sort((a, b) => b.at.localeCompare(a.at))
  const cats = categoriesOf(d, ev.id)
  const online = collectedBy(d, ev.id, 'online')
  const desk = collectedBy(d, ev.id, 'desk')
  const byDay = useMemo(() => {
    const m = new Map<string, number>()
    pays.filter((p) => p.status === 'captured').forEach((p) => m.set(fmtDayMonth(p.at), (m.get(fmtDayMonth(p.at)) ?? 0) + p.amount))
    return [...m.entries()].reverse().slice(-12)
  }, [pays])
  const max = Math.max(1, ...byDay.map(([, v]) => v))
  const payouts = d.payouts.filter((p) => p.eventId === ev.id)
  const invoices = d.invoices.filter((i) => i.eventId === ev.id)
  const total = online + desk
  const onlinePct = total ? online / total : 0
  const shown = pays.filter((p) => filter === 'all' || (filter === 'online' || filter === 'desk' ? p.channel === filter : p.status === filter))
  return (
    <div>
      <PageHeader title="Money" subtitle="What you collected, what goes back, and when it lands in your account." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TiltCard><StatTile label="Collected" value={collected(d, ev.id)} format={(n) => inr(n)} tone="brand" sub={`${entries(d, ev.id).length || d.participants.filter((p) => p.eventId === ev.id && p.paymentStatus === 'paid').length} paid entries`} icon={<IndianRupee size={16} className="text-fg3" aria-hidden />} /></TiltCard>
        <TiltCard><StatTile label="Refunded" value={refunded(d, ev.id)} format={(n) => inr(n)} sub="Back to players" icon={<RotateCcw size={16} className="text-fg3" aria-hidden />} /></TiltCard>
        <TiltCard><StatTile label="Rizzfitt and payment fees" value={feesTotal(d, ev.id)} format={(n) => inr(n)} sub="Online payments only" /></TiltCard>
        <TiltCard><StatTile label="Your payout" value={payoutTotal(d, ev.id)} format={(n) => inr(n)} sub={`Plus ${inr(desk)} collected at the desk`} icon={<Wallet size={16} className="text-fg3" aria-hidden />} /></TiltCard>
      </div>
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'overview', label: 'Overview' }, { value: 'payments', label: 'Payments', count: pays.length }, { value: 'invoices', label: 'Invoices', count: invoices.length, hidden: !invoices.length }]} />
      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Collections by day" />
            <div className="flex h-48 items-end gap-2" role="img" aria-label={`Collections by day: ${byDay.map(([k, v]) => `${k} ${inr(v)}`).join(', ')}`}>
              {byDay.map(([k, v]) => (
                <div key={k} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm bg-brand" style={{ height: `${(v / max) * 160}px` }} title={`${k}: ${inr(v)}`} />
                  <span className="text-[10px] text-fg4">{k.split(' ')[0]}</span>
                </div>
              ))}
              {!byDay.length && <p className="text-fg3">No payments yet.</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="Online and desk" />
            <div className="flex items-center gap-5">
              <svg viewBox="0 0 42 42" className="h-32 w-32 -rotate-90" role="img" aria-label={`Online ${Math.round(onlinePct * 100)} percent, desk ${100 - Math.round(onlinePct * 100)} percent`}>
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--cat-2)" strokeWidth="6" />
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--brand)" strokeWidth="6" strokeDasharray={`${onlinePct * 100} ${100 - onlinePct * 100}`} />
              </svg>
              <ul className="flex flex-col gap-2 text-[14px]">
                <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-brand" /> Online <strong className="text-fg tnum">{inr(online)}</strong></li>
                <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-cat-2" /> Desk <strong className="text-fg tnum">{inr(desk)}</strong></li>
              </ul>
            </div>
          </Card>
          {cats.length > 0 && (
            <Card className="lg:col-span-2 overflow-x-auto">
              <CardHeader title="By category" />
              <table className="w-full min-w-[480px] text-[14px]">
                <thead><tr className="t-overline text-fg4"><th className="py-2 text-left">Category</th><th className="text-right">Entries</th><th className="text-right">Paid</th><th className="text-right">Pending</th><th className="text-right">Collected</th></tr></thead>
                <tbody>
                  {cats.map((c) => {
                    const es = entries(d, ev.id, c.id)
                    const got = pays.filter((p) => p.status === 'captured' && d.registrations.find((r) => r.id === p.registrationId)?.categoryId === c.id).reduce((s, p) => s + p.amount, 0)
                    return (
                      <tr key={c.id} className="border-t border-line-subtle">
                        <td className="py-2.5 text-fg"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: c.color }} />{c.label}</td>
                        <td className="text-right tnum text-fg2">{es.length}</td>
                        <td className="text-right tnum text-fg2">{es.filter((r) => r.status === 'paid').length}</td>
                        <td className="text-right tnum text-warning">{es.filter((r) => r.status === 'pending').length}</td>
                        <td className="text-right tnum font-semibold text-fg">{inr(got)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          )}
          <Card>
            <CardHeader title="Payouts" subtitle="Weekly, after fees." />
            <ol className="relative flex flex-col gap-4 border-l border-line pl-5">
              {payouts.map((p) => (
                <li key={p.id} className="relative">
                  <span className={`absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full ${p.status === 'paid' ? 'bg-success' : 'bg-warning'}`} aria-hidden />
                  <p className="font-semibold text-fg">{inr(p.amount)} {p.status === 'paid' ? <StatusChip tone="success" icon={<CircleCheck size={12} />}>Paid</StatusChip> : <StatusChip tone="warning" icon={<CalendarCheck size={12} />}>Scheduled</StatusChip>}</p>
                  <p className="t-small text-fg3">{fmtDate(p.date)} · fees {inr(p.fees)} · {p.ref}</p>
                </li>
              ))}
              {!payouts.length && <li className="t-small text-fg3">Your first payout is scheduled a week after the first online payment.</li>}
            </ol>
            <div className="mt-4"><PayoutCard status={org?.payoutAccount?.status} masked={org?.payoutAccount?.maskedNumber} onConnect={() => (window.location.href = '/account')} /></div>
          </Card>
        </div>
      )}
      {tab === 'payments' && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {(['all', 'captured', 'refunded', 'online', 'desk'] as const).map((f) => (
              <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>{f === 'captured' ? 'Paid' : f[0].toUpperCase() + f.slice(1)}</FilterChip>
            ))}
            <Button size="sm" variant="ghost" className="ml-auto" icon={<Download size={14} />} onClick={() => { downloadText(`${ev.slug}-payments.csv`, toCsv([['Date', 'Paid by', 'Amount', 'Method', 'Status', 'Order', 'Payment'], ...shown.map((p) => [fmtDateTime(p.at), p.customer, p.amount, p.method, p.status, p.orderRef, p.paymentRef])])); toast.success('Payments exported') }}>Export</Button>
          </div>
          <DataTable
            caption="Payments"
            rows={shown}
            rowKey={(p) => p.id}
            mobileTitle={(p) => <span className="font-semibold text-fg">{p.customer}</span>}
            columns={[
              { key: 'at', header: 'Date', sortValue: (p) => p.at, cell: (p) => <span className="tnum">{fmtDateTime(p.at)}</span> },
              { key: 'c', header: 'Paid by', cell: (p) => <span className="font-semibold text-fg">{p.customer}</span> },
              { key: 'a', header: 'Amount', align: 'right', mobile: true, sortValue: (p) => p.amount, cell: (p) => inr(p.amount) },
              { key: 'm', header: 'Method', mobile: true, cell: (p) => `${p.method === 'cash' ? 'Cash' : p.method.toUpperCase()}${p.channel === 'desk' ? ', desk' : ''}` },
              { key: 's', header: 'Status', mobile: true, cell: (p) => p.status === 'captured' ? <StatusChip tone="success">Paid</StatusChip> : p.status === 'refunded' ? <StatusChip tone="neutral">Refunded</StatusChip> : <StatusChip tone="danger">Failed</StatusChip> },
              { key: 'ref', header: 'Order', optional: true, cell: (p) => <code className="text-[12px] text-fg3">{p.orderRef}</code> },
              { key: 'act', header: '', mobile: true, cell: (p) => p.status === 'captured' && p.registrationId ? <Button size="sm" variant="ghost" onClick={() => setRefundFor(p)}>Refund</Button> : null },
            ]}
          />
        </>
      )}
      {tab === 'invoices' && (
        <DataTable
          caption="Invoices"
          rows={invoices}
          rowKey={(i) => i.id}
          mobileTitle={(i) => <span className="font-semibold text-fg">{i.number}</span>}
          columns={[
            { key: 'n', header: 'Invoice', cell: (i) => <span className="font-semibold text-fg">{i.number}</span> },
            { key: 'c', header: 'Paid by', mobile: true, cell: (i) => i.customer },
            { key: 'a', header: 'Amount', align: 'right', mobile: true, cell: (i) => inr(i.amount) },
            { key: 'm', header: 'Email', mobile: true, cell: (i) => (i.mailSent ? <StatusChip tone="success">Sent</StatusChip> : <StatusChip tone="danger">Failed, retry</StatusChip>) },
            { key: 'x', header: '', cell: (i) => (
              <span className="flex gap-1">
                <Button size="sm" variant="ghost" icon={<Mail size={14} />} onClick={() => { mutate((dd) => { const inv = dd.invoices.find((x) => x.id === i.id); if (inv) { inv.mailSent = true; inv.sentAt = stamp(dd) } }); toast.success('Invoice emailed') }}>Mail</Button>
                <Button size="sm" variant="ghost" icon={<Download size={14} />} onClick={() => { downloadText(`${i.number}.txt`, `${i.number}\n${ev.name}\n${i.customer}\n${inr(i.amount)}\n[GST DETAILS]`, 'text/plain'); toast.success('Invoice downloaded') }}>Download</Button>
              </span>
            ) },
          ]}
        />
      )}
      <Dialog
        open={!!refundFor}
        onClose={() => setRefundFor(null)}
        tone="danger"
        title={refundFor ? `Refund ${inr(refundFor.amount)} to ${refundFor.customer}?` : ''}
        description="The money goes back in 5 to 7 days and the entry leaves the draw. This cannot be undone."
        footer={<><Button variant="secondary" onClick={() => setRefundFor(null)}>Cancel</Button><Button variant="danger" disabled={reason.trim().length < 3} onClick={() => { refund(refundFor!.registrationId!, reason.trim()); setRefundFor(null); setReason(''); toast.success('Refund started') }}>Refund</Button></>}
      >
        <Textarea label="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Dialog>
      <p className="mt-6 flex items-center gap-2 t-small text-fg3"><Hourglass size={14} aria-hidden /> Questions about a payout? <Link to="/account" className="text-brand-text">Account and payouts</Link></p>
    </div>
  )
}
