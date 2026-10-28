import { isTeamSport, teamCategoryName } from '../lib/eligibility'
import { mutate, stamp, getData, useUi } from './store'
import { applyMoment, IDS } from '../mock/seed'
import type { DemoData, EventCategory, EventItem, EventStatus, Moment, Organizer, Persona } from '../mock/types'
import { defaultRules, defaultSettings, CATEGORICAL, RIZZ_ORANGE } from '../mock/constants'
import { slugify } from '../lib/format'
import { computeModules } from '../lib/modules'

/* Shared actions. Each one goes through mutate() so it persists and syncs across tabs. */

export function setMoment(moment: Moment) {
  mutate((d) => {
    const next = applyMoment(d as DemoData, moment)
    Object.assign(d, next)
  })
}

export function setEventStatus(eventId: string, status: EventStatus) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    if (!e) return
    e.status = status
    if (status === 'registrations_closed') d.categories.filter((c) => c.eventId === eventId).forEach((c) => (c.entriesClosed = true))
    if (status === 'registrations_open') d.categories.filter((c) => c.eventId === eventId).forEach((c) => (c.entriesClosed = false))
    stamp(d)
  })
}

export function openRegistrations(eventId: string) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    if (!e) return
    e.status = 'registrations_open'
    e.setup.pageReviewed = true
    d.categories.filter((c) => c.eventId === eventId).forEach((c) => {
      c.entriesClosed = false
      c.stage = 'registrations'
    })
    d.notifications.unshift({ id: `n-open-${eventId}-${d.now}`, eventId, organizerId: e.organizerId, at: stamp(d), title: 'Registrations are open', body: `${e.name} is taking entries.`, kind: 'info', read: false, href: `/e/${eventId}` })
  })
}

export function markNotificationsRead(organizerId: string) {
  mutate((d) => d.notifications.forEach((n) => n.organizerId === organizerId && (n.read = true)))
}

export function recomputeModules(eventId: string) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    if (e) e.modules = computeModules(e)
  })
}

/** Persona switch from the Demo switcher. Returns where to go. */
export function switchPersona(persona: Persona): string {
  const ui = useUi.getState()
  const d = getData()
  if (persona === 'organizer') {
    ui.set({ persona, organizerId: IDS.meera, viewAs: null })
    const ev = d.events.find((e) => e.id === ui.currentEventId && e.organizerId === IDS.meera) ? ui.currentEventId : IDS.hero
    ui.set({ currentEventId: ev })
    return `/e/${ev}`
  }
  if (persona === 'new_organizer') {
    const rahul = d.organizers.find((o) => o.mobile === '9000020002')
    ui.set({ persona, viewAs: null })
    if (!rahul) {
      ui.set({ organizerId: null })
      return '/start'
    }
    ui.set({ organizerId: rahul.id })
    const ev = d.events.filter((e) => e.organizerId === rahul.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    if (!ev) return '/events'
    ui.set({ currentEventId: ev.id })
    return ev.setup.completed ? `/e/${ev.id}` : `/setup/${ev.id}/${['you', 'event', 'format', 'rules', 'registration', 'match-day', 'look', 'review'][Math.min(7, ev.setup.step - 1)]}`
  }
  if (persona === 'desk') {
    ui.set({ persona, organizerId: IDS.meera, viewAs: null, currentEventId: IDS.hero })
    return `/e/${IDS.hero}/registrations`
  }
  if (persona === 'hq') {
    ui.set({ persona, viewAs: null })
    return '/hq'
  }
  if (persona === 'player') {
    ui.set({ persona })
    const ev = d.events.find((e) => e.id === ui.currentEventId) ?? d.events[0]
    return `/p/${ev.slug}`
  }
  ui.set({ persona })
  return ''
}

/* ------------------------------------------------------------- sign up */


/** Creates (or finds) the organizer for a mobile number. Returns the organizer id. */
export function signInOrganizer(mobile: string, name: string, orgName?: string): string {
  const d = getData()
  const existing = d.organizers.find((o) => o.mobile === mobile)
  if (existing) return existing.id
  const id = `org-new-${mobile.slice(-5)}`
  mutate((dd) => {
    const o: Organizer = {
      id,
      name: name.trim() || 'New organizer',
      orgName: orgName ?? '',
      city: '',
      mobile,
      email: `${(name.trim().split(' ')[0] || 'organizer').toLowerCase()}@example.com`,
      avatarColor: CATEGORICAL[1],
      approval: 'not_started',
      joinedAt: stamp(dd),
    }
    dd.organizers.push(o)
    dd.hqUsers.push({ id: `u-${id}`, name: o.name, email: o.email, mobile, role: 'organizer', login: { email: false, mobile: true, username: false }, active: true })
  })
  return id
}

export const SETUP_STEPS = ['you', 'event', 'format', 'rules', 'registration', 'match-day', 'look', 'review'] as const

/** New draft event with valid defaults so "Continue" always works. */
export function createDraftEvent(organizerId: string, prefill?: { name?: string }): string {
  const id = `evt-${Date.now().toString(36)}`
  mutate((d) => {
    const org = d.organizers.find((o) => o.id === organizerId)
    const settings = defaultSettings('pickleball', 'tournament')
    const ev: EventItem = {
      id,
      organizerId,
      name: prefill?.name ?? '',
      slug: '',
      sport: 'pickleball',
      type: 'tournament',
      status: 'draft',
      startDate: '2026-11-21T08:00:00+05:30',
      endDate: '2026-11-22T20:00:00+05:30',
      venue: { name: '', address: '', city: org?.city ?? '', indoor: false },
      courts: 4,
      logo: null,
      accent: RIZZ_ORANGE,
      ground: 'black',
      coverStyle: 'court',
      certifications: { dupr: false, ipa: false, pwr: false },
      modules: [],
      settings,
      createdVia: 'self_serve',
      createdAt: stamp(d),
      sponsorsOn: false,
      setup: {
        step: 1,
        completed: false,
        orgName: org?.orgName ?? '',
        city: org?.city ?? '',
        orgKind: 'club',
        eventsPerYear: '3-10',
        instagram: '',
        startTime: '08:00',
        logoChoice: null,
        expectedEntries: {},
        finalsBestOf3: false,
        applyRulesTo: 'all',
        scoringPreset: 'rally11',
        invitedUmpires: [],
        owners: [],
        pageReviewed: false,
      },
    }
    ev.modules = computeModules(ev)
    d.events.push(ev)
    const defaults: [string, string, string][] = [
      ['cm-md', 'dv-open', "Men's Doubles, Open"],
      ['cm-wd', 'dv-open', "Women's Doubles, Open"],
      ['cm-xd', 'dv-open', 'Mixed Doubles, Open'],
    ]
    defaults.forEach(([c, dv, label], i) => d.categories.push(newCategory(id, c, dv, label, i)))
  })
  return id
}

export function newCategory(eventId: string, categoryId: string, divisionId: string, label: string, order: number, teamSize: 1 | 2 = 2): EventCategory {
  return {
    id: `${eventId}-c-${categoryId}-${divisionId}`,
    eventId,
    categoryId,
    divisionId,
    label,
    format: 'groups_knockout',
    teamSize,
    price: teamSize === 2 ? 1500 : 800,
    cap: teamSize === 2 ? 32 : 16,
    waitlist: true,
    groupSize: 4,
    advancePerGroup: 2,
    seeding: 'dupr',
    matchRules: defaultRules('pickleball'),
    stage: 'registrations',
    entriesClosed: false,
    color: CATEGORICAL[order % CATEGORICAL.length],
    order,
    thirdPlace: false,
  }
}

export function draftSlug(name: string): string {
  return slugify(name)
}

/* ------------------------------------------------------------- setup */

/** Patch an event (setup and settings). Recomputes modules every time. */
export function updateEvent(eventId: string, recipe: (e: EventItem, d: DemoData) => void) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    if (!e) return
    recipe(e, d as DemoData)
    // keep the suggested web address in step with the name until the organizer edits it
    if (e.name && !e.setup.completed && !e.setup.slugLocked) e.slug = slugify(e.name)
    e.modules = computeModules(e)
  })
}

export function updateCategory(categoryId: string, recipe: (c: EventCategory) => void) {
  mutate((d) => {
    const c = d.categories.find((x) => x.id === categoryId)
    if (c) recipe(c)
  })
}

export function addCategory(eventId: string, categoryId: string, divisionId: string) {
  mutate((d) => {
    const cm = d.categoryMasters.find((c) => c.id === categoryId)
    const dv = d.divisionMasters.find((c) => c.id === divisionId)
    if (!cm || !dv) return
    const id = `${eventId}-c-${categoryId}-${divisionId}`
    if (d.categories.some((c) => c.id === id)) return
    const order = d.categories.filter((c) => c.eventId === eventId).length
    const e = d.events.find((x) => x.id === eventId)
    const team = e && isTeamSport(e.sport)
    const cat = newCategory(eventId, categoryId, divisionId, `${team ? teamCategoryName(cm.name) : cm.name}, ${dv.name}`, order, team ? 1 : cm.teamSize)
    if (e) cat.matchRules = defaultRules(e.sport)
    if (team) cat.team = { squadSize: e.sport === 'football' ? (e.football?.sideSize ?? 7) + 3 : (e.cricket?.playersPerSide ?? 8) + 3, subs: 3 }
    d.categories.push(cat)
  })
}

export function removeCategory(id: string) {
  mutate((d) => {
    d.categories = d.categories.filter((c) => c.id !== id)
    d.registrations = d.registrations.filter((r) => r.categoryId !== id || r.status !== 'pending')
  })
}

/** Changing event type resets the format answers to that branch's defaults. */
export function setEventType(eventId: string, type: EventItem['type']) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    if (!e || e.type === type) return
    e.type = type
    const base = defaultSettings(e.sport, type)
    e.settings.umpiresOn = base.umpiresOn
    e.settings.tv.enabled = base.tv.enabled
    d.categories = d.categories.filter((c) => c.eventId !== eventId)
    if (type === 'tournament') {
      ;([['cm-md', 'dv-open', "Men's Doubles, Open"], ['cm-wd', 'dv-open', "Women's Doubles, Open"], ['cm-xd', 'dv-open', 'Mixed Doubles, Open']] as const).forEach(([c, dv, l], i) => d.categories.push(newCategory(eventId, c, dv, l, i)))
      e.league = undefined
    } else if (type !== 'social') {
      const pool = newCategory(eventId, 'cm-open', 'dv-open', type === 'auction' ? 'Player pool' : 'Player sign-up', 0, 1)
      pool.price = type === 'auction' ? 1000 : 2000
      pool.cap = 48
      pool.format = 'round_robin'
      d.categories.push(pool)
      e.league = e.league ?? {
        teams: 8, playersPerTeam: 6, matchesPerPlayer: 2,
        matchTypes: [{ type: 'doubles', count: 2 }, { type: 'mixed', count: 1 }, { type: 'singles', count: 1 }],
        eligibility: { skill: [], age: [], gender: [] }, ties: true, autoKnockout: true, knockoutTeams: 4,
        teamFormation: 'auto_balance', pointsPerMatchWin: 1, tieBreaker: 'super_singles', slotSwap: 'none',
      }
      e.league.teamFormation = type === 'auction' ? 'auction' : type === 'draft' ? 'draft' : e.league.teamFormation === 'auction' || e.league.teamFormation === 'draft' ? 'auto_balance' : e.league.teamFormation
      if (type === 'auction') e.auction = e.auction ?? { budgetPerTeam: 100000, squadSize: 6, bidSteps: [500, 1000, 5000], biddingBy: 'owners', basePriceByTier: { A: 5000, B: 2500, C: 1000 }, startsAt: e.startDate, bidSeconds: 15 }
      if (type === 'draft') e.draft = e.draft ?? { order: 'snake', pickSeconds: 60, captainsPerTeam: 1 }
    } else {
      e.social = e.social ?? { capacity: 32, pricePerPerson: 499, format: 'just_social', collect: ['meal', 'tshirt'] }
    }
    if (e.sport === 'cricket') e.cricket = e.cricket ?? { overs: 8, playersPerSide: 8, impactPlayer: false, impactCount: 1, superOver: true }
    e.modules = computeModules(e)
  })
}

export function setSport(eventId: string, sport: EventItem['sport']) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    if (!e) return
    e.sport = sport
    if (sport === 'cricket') e.cricket = e.cricket ?? { overs: 8, playersPerSide: 8, impactPlayer: false, impactCount: 1, superOver: true }
    if (sport === 'football') e.football = e.football ?? { halfMinutes: 20, penalties: true }
    if (sport !== 'pickleball') e.certifications.dupr = false
    d.categories.filter((c) => c.eventId === eventId).forEach((c) => (c.matchRules = defaultRules(sport)))
    e.settings.registrationFields = sport === 'pickleball' ? Array.from(new Set(['dupr', ...e.settings.registrationFields])) as EventItem['settings']['registrationFields'] : e.settings.registrationFields.filter((f) => f !== 'dupr')
    e.modules = computeModules(e)
  })
}

export function submitPayoutAccount(organizerId: string, acc: { type: 'bank' | 'upi'; holderName: string; number: string }) {
  mutate((d) => {
    const o = d.organizers.find((x) => x.id === organizerId)
    if (!o) return
    const masked = acc.type === 'upi' ? acc.number.replace(/^(.{2}).*(@.*)$/, '$1•••$2') : `XXXX XXXX ${acc.number.slice(-4)}`
    o.payoutAccount = { type: acc.type, maskedNumber: masked, holderName: acc.holderName, status: 'pending', submittedAt: stamp(d) }
    if (o.approval === 'not_started') o.approval = 'pending'
    d.approvals = d.approvals.filter((a) => !(a.organizerId === organizerId && a.kind === 'payout' && a.status === 'pending'))
    d.approvals.unshift({ id: `ap-${organizerId}-${d.now}`, organizerId, kind: 'payout', submittedAt: stamp(d), status: 'pending', notes: '' })
  })
}

export function requestCustomCategory(organizerId: string, eventId: string, name: string, description: string) {
  mutate((d) => {
    d.approvals.unshift({ id: `ap-cc-${d.now}`, organizerId, kind: 'custom_category', submittedAt: stamp(d), status: 'pending', notes: '', payload: { name, description, eventId } })
    const e = d.events.find((x) => x.id === eventId)
    if (e) e.setup.customCategoryRequest = { name, description, status: 'sent' }
  })
}

/** SW-09: turn setup answers into the records the workspace runs on. */
export function completeSetup(eventId: string) {
  mutate((d) => {
    const e = d.events.find((x) => x.id === eventId)
    if (!e) return
    e.setup.completed = true
    e.setup.step = 8
    // The review step shows the event page in the live preview, so it counts as reviewed.
    e.setup.pageReviewed = true
    e.modules = computeModules(e)
    e.setup.invitedUmpires.forEach((u, i) => {
      d.umpires.push({ id: `ump-${eventId}-${i}`, eventId, name: u.name, mobile: u.mobile, court: (i % e.courts) + 1, status: 'invited', token: `${eventId}-c${(i % e.courts) + 1}` })
    })
    e.setup.invitedUmpires = []
    if (e.league && !d.leagueTeams.some((t) => t.eventId === eventId)) {
      const names = Array.from({ length: e.league.teams }, (_, i) => e.setup.owners[i]?.team || ['Marina Smashers', 'Nilgiri Ninjas', 'Cauvery Kings', 'Deccan Dinks', 'Malabar Mavericks', 'Palk Bay Pirates', 'Western Ghats Warriors', 'Coromandel Comets', 'Kaveri Kestrels', 'Bay Breakers', 'Konkan Crushers', 'Vindhya Volleys', 'Charminar Chargers', 'Hooghly Hawks', 'Thar Thunder', 'Ganga Gliders'][i % 16])
      names.forEach((n, i) => {
        d.leagueTeams.push({ id: `${eventId}-t${i + 1}`, eventId, name: n, short: n.split(' ').map((w) => w[0]).join('').slice(0, 3), color: CATEGORICAL[i % 8], playerIds: [], locked: [], budget: e.auction?.budgetPerTeam, spent: e.auction ? 0 : undefined })
        const o = e.setup.owners[i]
        if (e.type === 'auction' && o?.name) d.owners.push({ id: `${eventId}-o${i + 1}`, eventId, name: o.name, mobile: o.mobile, teamId: `${eventId}-t${i + 1}`, status: 'invited' })
      })
    }
    const org = d.organizers.find((o) => o.id === e.organizerId)
    d.notifications.unshift({ id: `n-built-${eventId}`, eventId, organizerId: e.organizerId, at: stamp(d), title: 'Your event app is ready', body: `${e.name} is built. Finish the go-live checklist to take entries.`, kind: 'info', read: false, href: `/e/${eventId}` })
    if (org && org.approval === 'not_started' && org.payoutAccount) org.approval = 'pending'
  })
}
