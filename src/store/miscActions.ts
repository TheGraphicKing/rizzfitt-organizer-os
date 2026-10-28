import { mutate, stamp, newId } from './store'
import type { Message, Member, MemberRole, Sponsor, MediaItem, TvSettings } from '../mock/types'

/* Messages, sponsors and screens, team members. */

export function sendMessage(msg: Omit<Message, 'id' | 'stats' | 'sentAt'> & { count: number; scheduledFor?: string }) {
  const id = newId('msg')
  mutate((d) => {
    const { count, ...rest } = msg
    d.messages.unshift({ ...rest, id, sentAt: msg.scheduledFor ? undefined : stamp(d), stats: { sent: msg.scheduledFor ? 0 : count, delivered: 0, read: 0, failed: 0 } })
  })
  // Simulated delivery receipts arriving over a few seconds.
  if (!msg.scheduledFor) {
    setTimeout(() => mutate((d) => { const m = d.messages.find((x) => x.id === id); if (m) m.stats.delivered = Math.max(0, msg.count - Math.ceil(msg.count * 0.02)) }), 1500)
    setTimeout(() => mutate((d) => { const m = d.messages.find((x) => x.id === id); if (m && msg.channel !== 'email') m.stats.read = Math.round(msg.count * 0.86); if (m) m.stats.failed = Math.ceil(msg.count * 0.02) }), 3500)
  }
  return id
}

export function cancelScheduled(id: string) {
  mutate((d) => {
    d.messages = d.messages.filter((m) => m.id !== id)
  })
}

export function upsertSponsor(s: Sponsor) {
  mutate((d) => {
    const i = d.sponsors.findIndex((x) => x.id === s.id)
    if (i >= 0) d.sponsors[i] = s
    else d.sponsors.push(s)
    const e = d.events.find((x) => x.id === s.eventId)
    if (e) e.sponsorsOn = true
  })
}
export function removeSponsor(id: string) {
  mutate((d) => {
    d.sponsors = d.sponsors.filter((x) => x.id !== id)
  })
}
export function reorderSponsors(ids: string[]) {
  mutate((d) => ids.forEach((id, i) => { const s = d.sponsors.find((x) => x.id === id); if (s) s.order = i + 1 }))
}
export function upsertMedia(m: MediaItem) {
  mutate((d) => {
    const i = d.media.findIndex((x) => x.id === m.id)
    if (i >= 0) d.media[i] = m
    else d.media.push(m)
  })
}
export function removeMedia(id: string) {
  mutate((d) => {
    d.media = d.media.filter((x) => x.id !== id)
  })
}
export function updateTv(eventId: string, patch: Partial<TvSettings>) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    if (e) Object.assign(e.settings.tv, patch)
  })
}

export function inviteMember(organizerId: string, name: string, mobile: string, role: MemberRole, courts?: number[]) {
  mutate((d) => {
    const m: Member = { id: newId('mem'), organizerId, name, mobile, role, courts, status: 'invited' }
    d.members.push(m)
  })
}
export function setMemberRole(id: string, role: MemberRole, courts?: number[]) {
  mutate((d) => {
    const m = d.members.find((x) => x.id === id)
    if (m) {
      m.role = role
      m.courts = role === 'court_captain' ? courts ?? m.courts ?? [1] : undefined
    }
  })
}
export function removeMember(id: string) {
  mutate((d) => {
    d.members = d.members.filter((x) => x.id !== id)
  })
}
