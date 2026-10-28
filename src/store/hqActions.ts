import { mutate, stamp } from './store'
import type { HqUser } from '../mock/types'

/* Rizzfitt HQ: approvals, take over, platform settings. */

export function decideApproval(id: string, decision: 'approved' | 'rejected' | 'changes_requested', notes: string) {
  mutate((d) => {
    const a = d.approvals.find((x) => x.id === id)
    if (!a) return
    a.status = decision
    a.notes = notes
    const o = d.organizers.find((x) => x.id === a.organizerId)
    const at = stamp(d)
    if (a.kind === 'payout' && o?.payoutAccount) {
      o.payoutAccount.status = decision === 'approved' ? 'verified' : 'changes_requested'
      if (decision === 'approved') o.approval = 'approved'
      d.notifications.unshift({ id: `n-${id}-${d.now}`, organizerId: o.id, at, title: decision === 'approved' ? 'Payout account verified' : 'Rizzfitt asked for a change', body: decision === 'approved' ? 'You can open registrations and take payments now.' : notes || 'Please check your payout account details.', kind: 'approval', read: false, href: '/account' })
    }
    if (a.kind === 'organizer' && o) {
      o.approval = decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'changes_requested'
      d.notifications.unshift({ id: `n-${id}-${d.now}`, organizerId: o.id, at, title: decision === 'approved' ? 'You are approved' : 'About your Rizzfitt account', body: decision === 'approved' ? 'Welcome to Rizzfitt.' : notes, kind: 'approval', read: false })
    }
    if (a.kind === 'custom_category' && decision === 'approved' && a.payload?.name) {
      const name = a.payload.name.replace(/ Doubles$/, '')
      if (!d.divisionMasters.some((x) => x.name === name)) d.divisionMasters.push({ id: `dv-${d.now}`, name, position: d.divisionMasters.length + 1 })
      if (a.payload.eventId) {
        const e = d.events.find((x) => x.id === a.payload!.eventId)
        if (e?.setup.customCategoryRequest) e.setup.customCategoryRequest = undefined
      }
    }
  })
}

export function setTakeOver(eventId: string, on: boolean) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    if (!e) return
    e.takenOver = on
    d.notifications.unshift({ id: `n-to-${eventId}-${d.now}`, eventId, organizerId: e.organizerId, at: stamp(d), title: on ? 'Rizzfitt is managing your event' : 'You are back in control', body: on ? 'Our team can make changes with you. You will see their changes as they happen.' : 'Rizzfitt has handed the event back to you.', kind: 'info', read: false, href: `/e/${eventId}` })
  })
}

export function updateFee(id: string, amount: string, note: string) {
  mutate((d) => {
    const f = d.fees.find((x) => x.id === id)
    if (!f) return
    f.amount = amount
    f.note = note
    f.updatedAt = stamp(d)
  })
}

export function addMaster(kind: 'category' | 'division', name: string, teamSize: 1 | 2 = 2) {
  mutate((d) => {
    if (kind === 'category') d.categoryMasters.push({ id: `cm-${d.now}`, name, position: d.categoryMasters.length + 1, teamSize })
    else d.divisionMasters.push({ id: `dv-${d.now}`, name, position: d.divisionMasters.length + 1 })
  })
}
export function moveMaster(kind: 'category' | 'division', id: string, dir: -1 | 1) {
  mutate((d) => {
    const list = (kind === 'category' ? d.categoryMasters : d.divisionMasters).sort((a, b) => a.position - b.position)
    const i = list.findIndex((x) => x.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= list.length) return
    const p = list[i].position
    list[i].position = list[j].position
    list[j].position = p
  })
}
export function archiveMaster(kind: 'category' | 'division', id: string, archived: boolean) {
  mutate((d) => {
    const m = (kind === 'category' ? d.categoryMasters : d.divisionMasters).find((x) => x.id === id)
    if (m) m.archived = archived
  })
}

export function updateHqUser(id: string, patch: Partial<HqUser>) {
  mutate((d) => {
    const u = d.hqUsers.find((x) => x.id === id)
    if (u) Object.assign(u, patch)
  })
}

export function revokeKey(id: string) {
  mutate((d) => {
    const k = d.apiKeys.find((x) => x.id === id)
    if (k) k.status = 'revoked'
  })
}
export function createKey(name: string, scopes: string[]) {
  mutate((d) => {
    d.apiKeys.push({ id: `k-${d.now}`, name, masked: `rz_live_••••••••${d.now.toString(16).slice(-4)}`, scopes, rateLimit: 120, createdAt: stamp(d), status: 'active' })
  })
}
