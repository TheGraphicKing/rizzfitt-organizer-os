import { mutate, stamp, newId } from './store'
import type { DemoData, Player, Registration } from '../mock/types'
import { playerName } from './selectors'

/* Registration desk actions. Every one keeps Home, Money and Schedule counts in step (shared selectors). */

function reg(d: DemoData, id: string) {
  return d.registrations.find((r) => r.id === id)
}
function names(d: DemoData, r: Registration) {
  return r.playerIds.map((id) => playerName(d.players.find((p) => p.id === id))).join(' / ')
}

export function markPaid(id: string, via: 'cash' | 'upi', by = 'Organizer') {
  mutate((d) => {
    const r = reg(d, id)
    if (!r || r.status === 'paid') return
    const at = stamp(d)
    r.status = 'paid'
    r.paidVia = via
    if (r.channel !== 'online') r.channel = 'desk'
    r.history.push({ at, text: `Marked paid ${via === 'cash' ? 'in cash' : 'by UPI'} by ${by}` })
    d.payments.push({ id: newId('pay'), eventId: r.eventId, registrationId: r.id, customer: names(d, r), amount: r.amount, fee: 0, method: via, status: 'captured', at, orderRef: `desk_${d.now}`, paymentRef: `desk_${d.now}`, channel: 'desk' })
  })
}

export function undoMarkPaid(id: string) {
  mutate((d) => {
    const r = reg(d, id)
    if (!r) return
    r.status = 'pending'
    r.paidVia = undefined
    const p = [...d.payments].reverse().find((x) => x.registrationId === id && x.status === 'captured')
    if (p) d.payments = d.payments.filter((x) => x !== p)
    r.history.push({ at: stamp(d), text: 'Payment undone' })
  })
}

export function sendPaymentLink(id: string) {
  mutate((d) => {
    const r = reg(d, id)
    if (!r) return
    r.paymentLinkSentAt = stamp(d)
    r.history.push({ at: r.paymentLinkSentAt, text: 'Payment link sent on WhatsApp' })
  })
}

/** Check a player in (or out) across all of their entries in this event. */
export function setCheckedIn(eventId: string, playerId: string, on: boolean) {
  mutate((d) => {
    d.registrations
      .filter((r) => r.eventId === eventId && r.playerIds.includes(playerId))
      .forEach((r) => {
        r.checkedIn = on ? Array.from(new Set([...r.checkedIn, playerId])) : r.checkedIn.filter((p) => p !== playerId)
      })
    stamp(d, 5)
  })
}

export function checkInRegs(ids: string[]) {
  mutate((d) => {
    ids.forEach((id) => {
      const r = reg(d, id)
      if (!r) return
      d.registrations.filter((x) => x.eventId === r.eventId && x.playerIds.some((p) => r.playerIds.includes(p))).forEach((x) => (x.checkedIn = Array.from(new Set([...x.checkedIn, ...r.playerIds.filter((p) => x.playerIds.includes(p))]))))
    })
  })
}

export function moveCategory(id: string, categoryId: string) {
  mutate((d) => {
    const r = reg(d, id)
    const to = d.categories.find((c) => c.id === categoryId)
    if (!r || !to) return
    const from = d.categories.find((c) => c.id === r.categoryId)
    r.categoryId = categoryId
    r.seed = undefined
    r.history.push({ at: stamp(d), text: `Moved from ${from?.label ?? 'another category'} to ${to.label}` })
    d.groups.forEach((g) => (g.registrationIds = g.registrationIds.filter((x) => x !== id)))
  })
}

export function replacePartner(id: string, index: number, player: Player) {
  mutate((d) => {
    const r = reg(d, id)
    if (!r) return
    if (!d.players.some((p) => p.id === player.id)) d.players.push(player)
    const old = d.players.find((p) => p.id === r.playerIds[index])
    r.playerIds[index] = player.id
    r.checkedIn = r.checkedIn.filter((p) => p !== old?.id)
    r.history.push({ at: stamp(d), text: `Partner changed: ${playerName(old)} to ${playerName(player)}. Both notified.` })
  })
}

export function refund(id: string, reason: string) {
  mutate((d) => {
    const r = reg(d, id)
    if (!r) return
    r.status = 'refunded'
    const p = d.payments.find((x) => x.registrationId === id && x.status === 'captured')
    if (p) {
      p.status = 'refunded'
      p.refundReason = reason
    }
    r.history.push({ at: stamp(d), text: `Refunded ${p ? 'in 5 to 7 days' : ''}. Reason: ${reason}` })
    d.groups.forEach((g) => (g.registrationIds = g.registrationIds.filter((x) => x !== id)))
  })
}

export function withdraw(id: string) {
  mutate((d) => {
    const r = reg(d, id)
    if (!r) return
    r.status = 'withdrawn'
    r.history.push({ at: stamp(d), text: 'Withdrawn' })
    d.groups.forEach((g) => (g.registrationIds = g.registrationIds.filter((x) => x !== id)))
  })
}

export function promoteWaitlist(id: string) {
  mutate((d) => {
    const r = reg(d, id)
    if (!r) return
    r.status = 'pending'
    r.paymentLinkSentAt = stamp(d)
    r.history.push({ at: r.paymentLinkSentAt, text: 'Promoted from the waitlist. Payment link sent.' })
  })
}

export interface NewPlayerInput {
  existingId?: string
  firstName: string
  lastName: string
  gender: 'M' | 'F'
  mobile: string
}

export function makePlayer(p: NewPlayerInput, seq: number): Player {
  return {
    id: p.existingId ?? `p-new-${p.mobile}-${seq}`,
    firstName: p.firstName,
    lastName: p.lastName,
    gender: p.gender,
    dob: '1995-01-01',
    mobile: p.mobile,
    email: `${p.firstName}.${p.lastName}`.toLowerCase().replace(/\s+/g, '') + '@example.com',
    city: '',
    district: '',
    duprStatus: 'missing',
    skill: 'intermediate',
    tshirt: 'M',
  }
}

/** Add an entry (desk walk-in, import, or microsite). Returns the registration id. */
export function addEntry(
  eventId: string,
  categoryId: string,
  players: NewPlayerInput[],
  payment: 'cash' | 'upi' | 'link' | 'pending' | 'online',
  by = 'Organizer',
  extra?: Partial<Registration>,
): string {
  const id = newId('r')
  mutate((d) => {
    const cat = d.categories.find((c) => c.id === categoryId)
    if (!cat) return
    const at = stamp(d)
    const ids = players.map((p, i) => {
      const existing = p.existingId ? d.players.find((x) => x.id === p.existingId) : d.players.find((x) => x.mobile === p.mobile)
      if (existing) return existing.id
      const np = makePlayer(p, d.players.length + i)
      d.players.push(np)
      return np.id
    })
    const full = d.registrations.filter((r) => r.categoryId === categoryId && (r.status === 'paid' || r.status === 'pending')).length >= cat.cap
    const paid = payment === 'cash' || payment === 'upi' || payment === 'online'
    const r: Registration = {
      id,
      eventId,
      categoryId,
      playerIds: ids,
      status: full && cat.waitlist ? 'waitlist' : paid ? 'paid' : 'pending',
      channel: payment === 'online' ? 'online' : 'desk',
      amount: cat.price,
      paidVia: payment === 'online' ? 'upi' : paid ? (payment as 'cash' | 'upi') : undefined,
      createdAt: at,
      checkedIn: [],
      history: [{ at, text: payment === 'online' ? 'Registered online' : `Added at the desk by ${by}` }],
      ...extra,
    }
    if (payment === 'link') {
      r.paymentLinkSentAt = at
      r.history.push({ at, text: 'Payment link sent on WhatsApp' })
    }
    d.registrations.push(r)
    if (r.status === 'paid') {
      d.payments.push({
        id: newId('pay'), eventId, registrationId: id, customer: ids.map((x) => playerName(d.players.find((p) => p.id === x))).join(' / '), amount: cat.price,
        fee: payment === 'online' ? Math.round(cat.price * 0.03) : 0, method: payment === 'online' ? 'upi' : (payment as 'cash' | 'upi'), status: 'captured', at,
        orderRef: `order_${d.now.toString(36).toUpperCase()}`, paymentRef: payment === 'online' ? `pay_${d.now.toString(36).toUpperCase()}` : `desk_${d.now}`, channel: payment === 'online' ? 'online' : 'desk',
      })
    }
  })
  return id
}

export function removeEntry(id: string) {
  mutate((d) => {
    d.registrations = d.registrations.filter((r) => r.id !== id)
    d.payments = d.payments.filter((p) => p.registrationId !== id)
  })
}

export function closeEntries(categoryIds: string[], closed = true) {
  mutate((d) => {
    d.categories.filter((c) => categoryIds.includes(c.id)).forEach((c) => {
      c.entriesClosed = closed
      if (closed && c.stage === 'registrations') c.stage = 'ready_to_draw'
      if (!closed && c.stage === 'ready_to_draw') c.stage = 'registrations'
    })
  })
}

export function mergePlayers(keepId: string, dropId: string) {
  mutate((d) => {
    d.registrations.forEach((r) => {
      r.playerIds = r.playerIds.map((p) => (p === dropId ? keepId : p))
      r.checkedIn = r.checkedIn.map((p) => (p === dropId ? keepId : p))
    })
    d.players = d.players.filter((p) => p.id !== dropId)
  })
}

export function updatePlayer(id: string, patch: Partial<Player>) {
  mutate((d) => {
    const p = d.players.find((x) => x.id === id)
    if (p) Object.assign(p, patch)
  })
}

/** Social mixer sign-up from the microsite. */
export function addParticipant(eventId: string, p: { name: string; mobile: string; gender: 'M' | 'F'; alias: string; meal: 'veg' | 'non_veg' | 'vegan'; tshirt: Player['tshirt'] }, paid: boolean): string {
  const id = newId('pt')
  mutate((d) => {
    const ev = d.events.find((e) => e.id === eventId)
    const at = stamp(d)
    d.participants.push({ id, eventId, name: p.name, alias: p.alias || p.name.split(' ')[0], gender: p.gender, age: 30, mobile: p.mobile, email: null, mealPreference: p.meal, tshirt: p.tshirt, paymentStatus: paid ? 'paid' : 'pending', registeredAt: at, history: [{ at, text: 'Registered on the event page' }, ...(paid ? [{ at, text: `Paid ₹${ev?.social?.pricePerPerson ?? 0} by UPI` }] : [])] })
    if (paid) d.payments.push({ id: newId('pay'), eventId, participantId: id, customer: p.name, amount: ev?.social?.pricePerPerson ?? 0, fee: Math.round((ev?.social?.pricePerPerson ?? 0) * 0.03), method: 'upi', status: 'captured', at, orderRef: `order_${d.now.toString(36)}`, paymentRef: `pay_${d.now.toString(36)}`, channel: 'online' })
  })
  return id
}
