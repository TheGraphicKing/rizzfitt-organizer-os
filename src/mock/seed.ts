import { Rng } from './rng'
import { DISTRICTS_TN, FEMALE_FIRST, LAST, MALE_FIRST } from './names'
import {
  CATEGORICAL,
  CATEGORY_MASTERS,
  RIZZ_ORANGE,
  DEMO_NOW,
  DIVISION_MASTERS,
  defaultRules,
  defaultSettings,
  TEAM_NAME_SUGGESTIONS,
} from './constants'
import type {
  ApiKey,
  Approval,
  AuctionLot,
  AuctionState,
  DemoData,
  DraftState,
  EventCategory,
  EventItem,
  Group,
  HqUser,
  Invoice,
  LeagueTeam,
  LineupSlot,
  Match,
  MatchStage,
  Member,
  Message,
  Moment,
  Notification,
  Organizer,
  Owner,
  Participant,
  Payment,
  Payout,
  Player,
  Registration,
  SetupState,
  Sponsor,
  Tie,
  Umpire,
  MediaItem,
} from './types'
import { buildKnockout, GROUP_NAMES, groupSizes, propagate, roundRobin, snakeIntoGroups } from '../lib/tournament'
import { computeModules } from '../lib/modules'
import { randomGame } from '../lib/scoring'

export const SEED_VERSION = 10

export const IDS = {
  meera: 'org-meera',
  hero: 'evt-cbe',
  league: 'evt-szl',
  auction: 'evt-fca',
  social: 'evt-ssm',
  draft: 'evt-cdn',
} as const

export function courtToken(eventId: string, court: number): string {
  return `${eventId}-c${court}`
}
export function parseCourtToken(token: string): { eventId: string; court: number } | null {
  const i = token.lastIndexOf('-c')
  if (i < 0) return null
  const court = Number(token.slice(i + 2))
  if (!court) return null
  return { eventId: token.slice(0, i), court }
}

const ist = (date: string, time: string) => new Date(`${date}T${time}:00+05:30`).toISOString()
const addMin = (iso: string, m: number) => new Date(Date.parse(iso) + m * 60000).toISOString()

/* ----------------------------------------------------------------- players */

let mobileCounter = 0
function nextMobile(): string {
  mobileCounter++
  return `900001${String(mobileCounter).padStart(4, '0')}`
}

function makePlayer(rng: Rng, id: string, gender: 'M' | 'F', rating: [number, number], city = 'Coimbatore', usedNames: Set<string>): Player {
  let first = ''
  let last = ''
  for (let tries = 0; tries < 50; tries++) {
    first = rng.pick(gender === 'M' ? MALE_FIRST : FEMALE_FIRST)
    last = rng.pick(LAST)
    if (!usedNames.has(first + last)) break
  }
  usedNames.add(first + last)
  const r = Math.round((rating[0] + rng.float() * (rating[1] - rating[0])) * 100) / 100
  const dupRoll = rng.float()
  const duprStatus: Player['duprStatus'] = dupRoll < 0.9 ? 'ok' : dupRoll < 0.96 ? 'missing' : 'not_found'
  const year = rng.int(1972, 2007)
  const hasEmail = rng.chance(0.95)
  return {
    id,
    firstName: first,
    lastName: last,
    gender,
    dob: `${year}-${String(rng.int(1, 12)).padStart(2, '0')}-${String(rng.int(1, 28)).padStart(2, '0')}`,
    mobile: nextMobile(),
    email: hasEmail ? `${first}.${last}`.toLowerCase() + '@example.com' : null,
    city,
    district: city === 'Coimbatore' ? rng.pick(DISTRICTS_TN) : city,
    duprId: duprStatus === 'missing' ? undefined : String(rng.int(10000000, 99999999)).replace(/^(\d{2})/, 'D$1'),
    duprRating: duprStatus === 'ok' ? r : undefined,
    duprStatus,
    skill: r >= 4.4 ? 'open' : r >= 3.6 ? 'advanced' : r >= 3 ? 'intermediate' : 'beginner',
    tshirt: rng.pick(['S', 'M', 'M', 'L', 'L', 'L', 'XL', 'XXL'] as const),
    instagram: rng.chance(0.4) ? `@${first.toLowerCase()}${rng.int(10, 99)}` : undefined,
    club: rng.chance(0.5) ? rng.pick(['Baseline PC', 'Kovai Racquets', 'Race Course Club', 'RS Puram Smashers', 'Peelamedu Paddlers']) : undefined,
  }
}

function ratingOf(p: Player): number {
  return p.duprRating ?? (p.skill === 'open' ? 4.5 : p.skill === 'advanced' ? 3.8 : p.skill === 'intermediate' ? 3.2 : 2.7)
}

/* -------------------------------------------------------------- organizers */

function organizers(rng: Rng): Organizer[] {
  const meera: Organizer = {
    id: IDS.meera,
    name: 'Meera Iyer',
    orgName: 'Baseline Pickleball Club',
    city: 'Coimbatore',
    mobile: '9000010001',
    email: 'meera.iyer@example.com',
    avatarColor: CATEGORICAL[0],
    approval: 'approved',
    orgKind: 'club',
    eventsPerYear: '3-10',
    instagram: '@baselinepickleball',
    payoutAccount: { type: 'upi', maskedNumber: 'baseline•••@okaxis', holderName: 'Baseline Pickleball Club', status: 'verified', submittedAt: '2026-08-02T10:00:00.000Z' },
    joinedAt: '2026-07-28T09:00:00.000Z',
  }
  const others: [string, string, string, Organizer['approval'], 'none' | 'pending' | 'verified'][] = [
    ['Nikhil Saxena', 'Rally Point Academy', 'Pune', 'pending', 'none'],
    ['Haritha Reddy', 'Hyderabad Racquet League', 'Hyderabad', 'pending', 'none'],
    ['Faizal Ansari', 'Goa Beach Pickleball', 'Goa', 'pending', 'none'],
    ['Sowmya Natarajan', 'Kovai Racquet Collective', 'Coimbatore', 'approved', 'pending'],
    ['Gurpreet Sandhu', 'Tricity Paddle Club', 'Chandigarh', 'approved', 'pending'],
    ['Aparna Menon', 'Kochi Dink Society', 'Kochi', 'approved', 'verified'],
    ['Vikram Kulkarni', 'Deccan Sports Foundation', 'Pune', 'approved', 'verified'],
    ['Sayani Banerjee', 'Salt Lake Smashers', 'Kolkata', 'approved', 'verified'],
    ['Hardik Shah', 'Riverfront Pickleball', 'Ahmedabad', 'approved', 'verified'],
    ['Lakshmi Venkatesh', 'Madurai Badminton Association', 'Madurai', 'approved', 'verified'],
    ['Rohit Malhotra', 'Gurugram Corporate Games', 'Gurugram', 'approved', 'verified'],
    ['Keerthi Rao', 'Vizag Beach Sports', 'Visakhapatnam', 'approved', 'verified'],
    ['Arun Chandran', 'Trivandrum Turf Club', 'Thiruvananthapuram', 'approved', 'verified'],
    ['Deepika Joshi', 'Pink City Pickleball', 'Jaipur', 'approved', 'verified'],
    ['Imran Siddiqui', 'Lucknow Sports Circle', 'Lucknow', 'approved', 'verified'],
    ['Shreyas Hegde', 'Mysuru Racquet Club', 'Mysuru', 'approved', 'verified'],
    ['Ritika Kapoor', 'South Delhi Paddlers', 'Delhi', 'approved', 'verified'],
    ['Teja Varma', 'Gachibowli Box Cricket', 'Hyderabad', 'approved', 'verified'],
    ['Anjali Desai', 'Malabar Football Academy', 'Kochi', 'approved', 'verified'],
    ['Sunil Pandey', 'Indore Shuttlers', 'Indore', 'rejected', 'none'],
    ['Midhun Kurup', 'Bandra Pickleball Club', 'Mumbai', 'approved', 'verified'],
    ['Payal Mehta', 'Andheri Social Sports', 'Mumbai', 'approved', 'verified'],
  ]
  const list = others.map(([name, org, city, approval, payout], i) => {
    const [f, l] = name.toLowerCase().split(' ')
    const o: Organizer = {
      id: `org-${i + 2}`,
      name,
      orgName: org,
      city,
      mobile: `90000${String(10002 + i * 7).padStart(5, '0')}`,
      email: `${f}.${l}@example.com`,
      avatarColor: CATEGORICAL[(i + 1) % CATEGORICAL.length],
      approval,
      orgKind: rng.pick(['club', 'association', 'company', 'independent'] as const),
      eventsPerYear: rng.pick(['1-2', '3-10', '10+'] as const),
      joinedAt: new Date(Date.parse('2026-05-01T09:00:00Z') + i * 6 * 86400000).toISOString(),
    }
    if (payout !== 'none')
      o.payoutAccount = {
        type: rng.chance(0.5) ? 'bank' : 'upi',
        maskedNumber: rng.chance(0.5) ? `XXXX XXXX ${rng.int(1000, 9999)}` : `${f}•••@okhdfc`,
        holderName: org,
        status: payout === 'pending' ? 'pending' : 'verified',
        submittedAt: new Date(DEMO_NOW - (i + 1) * 3600000 * 5).toISOString(),
      }
    return o
  })
  return [meera, ...list]
}

function members(): Member[] {
  return [
    { id: 'mem-1', organizerId: IDS.meera, name: 'Meera Iyer', mobile: '9000010001', role: 'owner', status: 'active' },
    { id: 'mem-2', organizerId: IDS.meera, name: 'Karthik Rao', mobile: '9000010002', role: 'manager', status: 'active' },
    { id: 'mem-3', organizerId: IDS.meera, name: 'Ananya Pillai', mobile: '9000010003', role: 'desk', status: 'active' },
    { id: 'mem-4', organizerId: IDS.meera, name: 'Farhan Qureshi', mobile: '9000010004', role: 'court_captain', courts: [3, 4], status: 'active' },
  ]
}

function baseSetup(partial: Partial<SetupState> = {}): SetupState {
  return {
    step: 8,
    completed: true,
    orgName: 'Baseline Pickleball Club',
    city: 'Coimbatore',
    orgKind: 'club',
    eventsPerYear: '3-10',
    instagram: '',
    startTime: '08:00',
    logoChoice: 0,
    expectedEntries: {},
    finalsBestOf3: true,
    applyRulesTo: 'all',
    scoringPreset: 'rally11',
    invitedUmpires: [],
    owners: [],
    pageReviewed: true,
    ...partial,
  }
}

/* ------------------------------------------------------------ hero event */

interface HeroCatDef {
  key: string
  categoryId: string
  divisionId: string
  label: string
  price: number
  cap: number
  teams: number
  format: EventCategory['format']
  teamSize: 1 | 2
  thirdPlace: boolean
}

const HERO_CATS: HeroCatDef[] = [
  { key: 'mdo', categoryId: 'cm-md', divisionId: 'dv-open', label: "Men's Doubles, Open", price: 1500, cap: 32, teams: 28, format: 'groups_knockout', teamSize: 2, thirdPlace: true },
  { key: 'wdo', categoryId: 'cm-wd', divisionId: 'dv-open', label: "Women's Doubles, Open", price: 1500, cap: 16, teams: 12, format: 'groups_knockout', teamSize: 2, thirdPlace: false },
  { key: 'xdo', categoryId: 'cm-xd', divisionId: 'dv-open', label: 'Mixed Doubles, Open', price: 1500, cap: 24, teams: 18, format: 'groups_knockout', teamSize: 2, thirdPlace: false },
  { key: 'mdi', categoryId: 'cm-md', divisionId: 'dv-int', label: "Men's Doubles, Intermediate - Below 4", price: 1200, cap: 32, teams: 22, format: 'groups_knockout', teamSize: 2, thirdPlace: false },
  { key: 'msb', categoryId: 'cm-ms', divisionId: 'dv-beg', label: "Men's Singles, Beginner", price: 800, cap: 16, teams: 10, format: 'round_robin', teamSize: 1, thirdPlace: false },
  { key: 'wso', categoryId: 'cm-ws', divisionId: 'dv-open', label: "Women's Singles, Open", price: 800, cap: 12, teams: 6, format: 'round_robin', teamSize: 1, thirdPlace: false },
]

export function heroCategoryId(key: string): string {
  return `${IDS.hero}-${key}`
}

const MOMENT_NOW: Record<Moment, number> = {
  before_launch: Date.parse('2026-09-15T11:00:00+05:30'),
  registrations_open: Date.parse('2026-10-03T12:30:00+05:30'),
  draw_day: Date.parse('2026-10-15T18:00:00+05:30'),
  match_day: DEMO_NOW,
  finished: Date.parse('2026-10-19T10:00:00+05:30'),
}

function heroPlayers(rng: Rng, used: Set<string>): { men: Player[]; women: Player[] } {
  const men: Player[] = []
  const women: Player[] = []
  // 106 men, 46 women = 152 unique players.
  for (let i = 0; i < 106; i++) {
    const band: [number, number] = i < 56 ? [3.9, 5.3] : i < 100 ? [3.0, 3.95] : i < 104 ? [3.8, 4.8] : [2.4, 3.1]
    men.push(makePlayer(rng, `p-h-m${i + 1}`, 'M', band, 'Coimbatore', used))
  }
  for (let i = 0; i < 46; i++) {
    women.push(makePlayer(rng, `p-h-f${i + 1}`, 'F', [3.4, 4.9], 'Coimbatore', used))
  }
  // A likely duplicate for the "merge duplicates" suggestion: same person registered with a second number.
  men[69].firstName = men[68].firstName
  men[69].lastName = men[68].lastName
  men[69].email = men[68].email
  return { men, women }
}

/** Team rosters per category, using the overlap plan in BUILD_LOG (152 unique players, 176 slots). */
function heroRosters(men: Player[], women: Player[]): Record<string, string[][]> {
  const pairs = (list: Player[]) => {
    const out: string[][] = []
    for (let i = 0; i + 1 < list.length; i += 2) out.push([list[i].id, list[i + 1].id])
    return out
  }
  const mdOpenMen = men.slice(0, 56)
  const mdIntMen = men.slice(56, 100)
  const mixedMen = [...mdOpenMen.slice(0, 14), ...men.slice(100, 104)]
  const msMen = [...mdIntMen.slice(0, 8), ...men.slice(104, 106)]
  const wdWomen = women.slice(0, 24)
  const mixedWomen = women.slice(24, 42)
  const wsWomen = [...wdWomen.slice(0, 2), ...women.slice(42, 46)]
  return {
    mdo: pairs(mdOpenMen),
    mdi: pairs(mdIntMen),
    wdo: pairs(wdWomen),
    xdo: mixedMen.map((m, i) => [m.id, mixedWomen[i].id]),
    msb: msMen.map((p) => [p.id]),
    wso: wsWomen.map((p) => [p.id]),
  }
}

interface HeroBundle {
  event: EventItem
  categories: EventCategory[]
  registrations: Registration[]
  groups: Group[]
  matches: Match[]
  umpires: Umpire[]
  sponsors: Sponsor[]
  media: MediaItem[]
  messages: Message[]
  payments: Payment[]
  payouts: Payout[]
}

const STAGE_ORDER: MatchStage[] = ['group', 'r32', 'r16', 'qf', 'sf', 'third', 'final']

function heroEvent(moment: Moment, players: Player[], rosters: Record<string, string[][]>): HeroBundle {
  const rng = new Rng(2026)
  const now = MOMENT_NOW[moment]
  const pById = new Map(players.map((p) => [p.id, p]))
  const status: EventItem['status'] =
    moment === 'before_launch' ? 'draft' : moment === 'registrations_open' ? 'registrations_open' : moment === 'draw_day' ? 'registrations_closed' : moment === 'match_day' ? 'live' : 'completed'
  const settings = defaultSettings('pickleball', 'tournament')
  settings.registrationFields = ['dupr', 'tshirt', 'dob']
  settings.matchLengthMin = 15
  settings.restMin = 10
  settings.whatsappGroupUrl = 'https://chat.whatsapp.com/demo-coimbatore-open'
  settings.page.headline = 'Two days of the best pickleball in Kovai'
  settings.page.about =
    'The Coimbatore Open is back for 2026 at Baseline Pickleball Club. Six categories, four floodlit courts, DUPR rated matches and a finals evening you will not want to miss.'
  const event: EventItem = {
    id: IDS.hero,
    organizerId: IDS.meera,
    name: 'Coimbatore Open 2026',
    slug: 'coimbatore-open-2026',
    sport: 'pickleball',
    type: 'tournament',
    status,
    startDate: ist('2026-10-17', '08:00'),
    endDate: ist('2026-10-18', '20:00'),
    venue: { name: 'Baseline Pickleball Club', address: 'Saravanampatti, Coimbatore', city: 'Coimbatore', indoor: false },
    courts: 4,
    logo: 0,
    accent: RIZZ_ORANGE,
    coverStyle: 'court',
    certifications: { dupr: true, ipa: false, pwr: false },
    modules: [],
    settings,
    createdVia: 'self_serve',
    createdAt: '2026-08-20T10:00:00.000Z',
    setup: baseSetup({ pageReviewed: moment !== 'before_launch' }),
    regClosesAt: ist('2026-10-14', '23:59'),
    contact: { mobile: '9000010001', email: 'meera.iyer@example.com', clubId: 'RZ-CBE-0042' },
    publishedAt: moment === 'match_day' || moment === 'finished' ? ist('2026-10-15', '19:30') : undefined,
    sponsorsOn: true,
    dayLabel: moment === 'match_day' ? 'Day 2 of 2' : undefined,
  }
  event.modules = computeModules(event)

  const rules = defaultRules('pickleball')
  const categories: EventCategory[] = HERO_CATS.map((d, i) => ({
    id: heroCategoryId(d.key),
    eventId: IDS.hero,
    categoryId: d.categoryId,
    divisionId: d.divisionId,
    label: d.label,
    format: d.format,
    teamSize: d.teamSize,
    price: d.price,
    cap: d.cap,
    waitlist: true,
    groupSize: 4,
    advancePerGroup: 2,
    seeding: 'dupr',
    matchRules: { ...rules },
    stage: 'registrations',
    entriesClosed: moment !== 'before_launch' && moment !== 'registrations_open',
    color: CATEGORICAL[i % CATEGORICAL.length],
    order: i,
    thirdPlace: d.thirdPlace,
    prize: d.key === 'mdo' || d.key === 'wdo' || d.key === 'xdo' ? '₹15,000 and trophies' : 'Trophies and medals',
    eligibility: d.key === 'mdi' ? { gender: 'men', ratingCap: 4 } : undefined,
  }))
  Object.assign(event.settings, { regOpensAt: ist('2026-09-01', '10:00'), refundPolicy: 'half_until_draw', partnerRule: 'together', whatsappMessage: 'Join for draw, schedule and parking updates.' })

  /* registrations */
  const registrations: Registration[] = []
  const payments: Payment[] = []
  const regStart = Date.parse('2026-09-20T09:00:00+05:30')
  const regEnd = Date.parse('2026-10-12T21:00:00+05:30')
  // Desk entries: 8 paid (cash or UPI), 4 pending (all in ₹1,500 categories so collected lands at ₹1,20,200).
  const pendingKeys = new Set(['mdo:26', 'mdo:27', 'wdo:11', 'xdo:17'])
  const deskPaidKeys = new Set(['mdo:24', 'mdo:25', 'mdi:20', 'mdi:21', 'xdo:16', 'msb:9', 'wso:5', 'wdo:10'])
  let orderNo = 41000
  for (const d of HERO_CATS) {
    rosters[d.key].forEach((playerIds, idx) => {
      const k = `${d.key}:${idx}`
      const desk = pendingKeys.has(k) || deskPaidKeys.has(k)
      const createdAt = new Date(desk ? Date.parse('2026-10-16T18:00:00+05:30') + idx * 60000 * 7 : regStart + rng.float() * (regEnd - regStart)).toISOString()
      const st: Registration['status'] = pendingKeys.has(k) ? 'pending' : 'paid'
      const method: Payment['method'] = desk ? (rng.chance(0.5) ? 'cash' : 'upi') : rng.chance(0.7) ? 'upi' : rng.chance(0.66) ? 'card' : 'netbanking'
      const reg: Registration = {
        id: `r-${d.key}-${idx + 1}`,
        eventId: IDS.hero,
        categoryId: heroCategoryId(d.key),
        playerIds,
        status: st,
        channel: desk ? 'desk' : 'online',
        amount: d.price,
        paidVia: st === 'paid' ? method : undefined,
        createdAt,
        checkedIn: [],
        history: [{ at: createdAt, text: desk ? 'Added at the desk by Ananya Pillai' : 'Registered online' }],
      }
      if (st === 'paid') {
        orderNo++
        reg.history.push({ at: createdAt, text: `Paid ${method === 'cash' ? 'in cash' : 'by ' + method.toUpperCase()}` })
        payments.push({
          id: `pay-${reg.id}`,
          eventId: IDS.hero,
          registrationId: reg.id,
          customer: playerIds.map((id) => `${pById.get(id)!.firstName} ${pById.get(id)!.lastName}`).join(' / '),
          amount: d.price,
          fee: desk ? 0 : Math.round(d.price * 0.03),
          method,
          status: 'captured',
          at: createdAt,
          orderRef: `order_${orderNo.toString(36).toUpperCase()}K${idx}`,
          paymentRef: desk ? `desk_${orderNo}` : `pay_${(orderNo * 7919).toString(36).toUpperCase()}`,
          channel: desk ? 'desk' : 'online',
        })
      }
      registrations.push(reg)
    })
  }
  // Two refunded entries (not counted as entries).
  const refundPlayers = [players.find((p) => p.id === 'p-h-m60')!, players.find((p) => p.id === 'p-h-m61')!]
  ;[
    { cat: 'mdi', pids: [refundPlayers[0].id, refundPlayers[1].id], amount: 1200 },
    { cat: 'msb', pids: ['p-h-m70'], amount: 800 },
  ].forEach((r, i) => {
    const at = new Date(regStart + (i + 3) * 86400000).toISOString()
    const reg: Registration = {
      id: `r-refund-${i + 1}`,
      eventId: IDS.hero,
      categoryId: heroCategoryId(r.cat),
      playerIds: r.pids,
      status: 'refunded',
      channel: 'online',
      amount: r.amount,
      paidVia: 'upi',
      createdAt: at,
      checkedIn: [],
      history: [
        { at, text: 'Registered online' },
        { at: new Date(Date.parse(at) + 3 * 86400000).toISOString(), text: 'Refunded: duplicate entry' },
      ],
    }
    registrations.push(reg)
    payments.push({
      id: `pay-${reg.id}`, eventId: IDS.hero, registrationId: reg.id,
      customer: r.pids.map((id) => `${pById.get(id)!.firstName} ${pById.get(id)!.lastName}`).join(' / '),
      amount: r.amount, fee: 0, method: 'upi', status: 'refunded', at, orderRef: `order_RF${i}`, paymentRef: `pay_RF${i}XZ`, channel: 'online', refundReason: 'Duplicate entry',
    })
  })

  // Filter registrations to what exists at this moment.
  let regs = registrations
  if (moment === 'before_launch') regs = []
  else if (moment === 'registrations_open') regs = registrations.filter((r) => Date.parse(r.createdAt) < now)
  const regIds = new Set(regs.map((r) => r.id))
  const pays = payments.filter((p) => p.registrationId && regIds.has(p.registrationId))

  /* check-ins: match day and finished everyone (3 exceptions set after the draw); earlier nobody */
  if (moment === 'match_day' || moment === 'finished') {
    regs.forEach((r) => {
      if (r.status !== 'refunded') r.checkedIn = [...r.playerIds]
    })
  }

  /* groups and matches */
  const groups: Group[] = []
  let matches: Match[] = []
  const regsByCat = (key: string) => regs.filter((r) => r.categoryId === heroCategoryId(key) && r.status !== 'refunded')
  const teamRating = (r: Registration) => r.playerIds.reduce((s, id) => s + ratingOf(pById.get(id)!), 0) / r.playerIds.length

  const catStage: Record<string, EventCategory['stage']> = {}
  for (const d of HERO_CATS) {
    if (moment === 'before_launch' || moment === 'registrations_open') catStage[d.key] = 'registrations'
    else if (moment === 'draw_day')
      catStage[d.key] = ({ mdo: 'ready_to_draw', wdo: 'ready_to_draw', xdo: 'drawn', mdi: 'matches_created', msb: 'scheduled', wso: 'published' } as const)[d.key as 'mdo']
    else if (moment === 'match_day') catStage[d.key] = ['mdo', 'wdo', 'xdo'].includes(d.key) ? 'in_play' : 'done'
    else catStage[d.key] = 'done'
  }
  categories.forEach((c) => {
    const key = c.id.replace(`${IDS.hero}-`, '')
    c.stage = catStage[key]
  })

  const needsGroups = (st: EventCategory['stage']) => !['registrations', 'ready_to_draw'].includes(st)
  const needsMatches = (st: EventCategory['stage']) => !['registrations', 'ready_to_draw', 'drawn'].includes(st)

  for (const d of HERO_CATS) {
    const cat = categories.find((c) => c.id === heroCategoryId(d.key))!
    const entries = regsByCat(d.key).sort((a, b) => teamRating(b) - teamRating(a))
    entries.forEach((r, i) => (r.seed = i + 1))
    if (!needsGroups(cat.stage)) continue
    const base = { eventId: IDS.hero, categoryId: cat.id, bestOf: rules.games as 1 | 3, finalsBestOf: rules.finalsGames as 1 | 3 }
    if (d.format === 'round_robin') {
      const g: Group = { id: `${cat.id}-g-A`, eventId: IDS.hero, categoryId: cat.id, name: 'A', registrationIds: entries.map((e) => e.id) }
      groups.push(g)
      if (!needsMatches(cat.stage)) continue
      roundRobin(entries.map((e) => e.id)).forEach((pairs, ri) =>
        pairs.forEach(([a, b], pi) =>
          matches.push({ id: `${cat.id}-rr-${ri + 1}-${pi + 1}`, eventId: IDS.hero, categoryId: cat.id, stage: 'group', groupId: g.id, round: ri + 1, slot: pi + 1, sideA: a, sideB: b, status: 'scheduled', games: [], bestOf: 1, corrections: [], timeline: [] }),
        ),
      )
      continue
    }
    const sizes = groupSizes(entries.length, cat.groupSize)
    const split = snakeIntoGroups(entries.map((e) => e.id), sizes)
    split.forEach((ids, gi) => groups.push({ id: `${cat.id}-g-${GROUP_NAMES[gi]}`, eventId: IDS.hero, categoryId: cat.id, name: GROUP_NAMES[gi], registrationIds: ids }))
    if (!needsMatches(cat.stage)) continue
    const catGroups = groups.filter((g) => g.categoryId === cat.id)
    catGroups.forEach((g) =>
      roundRobin(g.registrationIds).forEach((pairs, ri) =>
        pairs.forEach(([a, b], pi) =>
          matches.push({ id: `${g.id}-${ri + 1}-${pi + 1}`, eventId: IDS.hero, categoryId: cat.id, stage: 'group', groupId: g.id, round: ri + 1, slot: pi + 1, sideA: a, sideB: b, status: 'scheduled', games: [], bestOf: 1, corrections: [], timeline: [] }),
        ),
      ),
    )
    // Knockout slots: group winners first (A1, B1...), then runners-up.
    const slots = [] as { reg: string | null; src: string }[]
    for (let pos = 1; pos <= cat.advancePerGroup; pos++) catGroups.forEach((g) => slots.push({ reg: null, src: `${g.name}${pos}` }))
    matches.push(...buildKnockout(base, slots, `${cat.id}-ko`, d.thirdPlace))
  }

  /* play matches according to the moment */
  const playStage: Record<string, MatchStage | 'none' | 'all'> = {}
  for (const d of HERO_CATS) {
    if (moment === 'finished') playStage[d.key] = 'all'
    else if (moment === 'match_day') playStage[d.key] = ({ mdo: 'sf', wdo: 'qf', xdo: 'qf', mdi: 'all', msb: 'all', wso: 'all' } as const)[d.key as 'mdo']
    else playStage[d.key] = 'none'
  }
  const play = (m: Match) => {
    const ra = regs.find((r) => r.id === m.sideA)
    const rb = regs.find((r) => r.id === m.sideB)
    if (!ra || !rb) return
    const pA = 1 / (1 + Math.exp(-(teamRating(ra) - teamRating(rb)) * 2.2))
    const aWins = rng.float() < pA
    if (m.bestOf === 3) {
      const g1 = rng.float() < pA
      const g2 = rng.float() < pA
      const games = [randomGame(() => rng.float(), rules, g1), randomGame(() => rng.float(), rules, g2)]
      if (g1 !== g2) games.push(randomGame(() => rng.float(), rules, aWins))
      m.games = games
    } else m.games = [randomGame(() => rng.float(), rules, aWins)]
    m.status = 'done'
    m.winner = undefined
    m.confirmedBy = rng.chance(0.85) ? 'Umpire' : 'Meera Iyer'
  }
  for (const stage of STAGE_ORDER) {
    for (const d of HERO_CATS) {
      const lim = playStage[d.key]
      if (lim === 'none') continue
      if (lim !== 'all' && STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(lim)) continue
      matches.filter((m) => m.categoryId === heroCategoryId(d.key) && m.stage === stage && m.status === 'scheduled').forEach(play)
    }
    matches = propagate(matches, groups, categories)
  }

  /* times and courts */
  const day1 = '2026-10-17'
  const day2 = '2026-10-18'
  const special = new Map<string, Partial<Match>>()
  const md = (key: string, stage: string, slot: number) => `${heroCategoryId(key)}-ko-${stage}-${slot}`
  if (moment === 'match_day' || moment === 'finished') {
    special.set(md('mdo', 'sf', 1), { court: 1, scheduledAt: ist(day2, '14:40') })
    special.set(md('mdo', 'sf', 2), { court: 2, scheduledAt: ist(day2, '14:40') })
    special.set(md('mdi', 'final', 1), { court: 3, scheduledAt: ist(day2, '14:40') })
    special.set(md('mdo', 'final', 1), { court: 1, scheduledAt: ist(day2, '16:00') })
    special.set(md('wdo', 'sf', 1), { court: 2, scheduledAt: ist(day2, '15:30') })
    special.set(md('wdo', 'sf', 2), { court: 2, scheduledAt: ist(day2, '16:05') })
    special.set(md('xdo', 'sf', 1), { court: 3, scheduledAt: ist(day2, '15:30') })
    special.set(md('xdo', 'sf', 2), { court: 3, scheduledAt: ist(day2, '16:00') })
    special.set(md('mdo', 'third', 1), { court: 4, scheduledAt: ist(day2, '16:20') })
    special.set(md('wdo', 'final', 1), { court: 2, scheduledAt: ist(day2, '17:15') })
    special.set(md('xdo', 'final', 1), { court: 3, scheduledAt: ist(day2, '17:15') })
  }
  const scheduledStages = new Set(['scheduled', 'published', 'in_play', 'done'])
  const schedulable = matches.filter((m) => scheduledStages.has(categories.find((c) => c.id === m.categoryId)!.stage) && !special.has(m.id))
  const day1List = schedulable.filter((m) => m.stage === 'group').sort((a, b) => a.round - b.round || a.categoryId.localeCompare(b.categoryId) || a.slot - b.slot)
  const day2List = schedulable.filter((m) => m.stage !== 'group').sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || a.categoryId.localeCompare(b.categoryId) || a.slot - b.slot)
  day1List.forEach((m, i) => {
    m.court = (i % 4) + 1
    m.scheduledAt = addMin(ist(day1, '08:00'), Math.floor(i / 4) * 15)
  })
  day2List.forEach((m, i) => {
    m.court = (i % 4) + 1
    m.scheduledAt = addMin(ist(day2, '08:30'), Math.floor(i / 4) * 40)
  })
  matches.forEach((m) => {
    const s = special.get(m.id)
    if (s) Object.assign(m, s)
  })

  /* live state for match day */
  if (moment === 'match_day') {
    const set = (id: string, patch: Partial<Match>) => {
      const m = matches.find((x) => x.id === id)
      if (m) Object.assign(m, patch)
    }
    set(md('mdo', 'final', 1), {
      status: 'live', games: [{ a: 11, b: 8 }, { a: 6, b: 4 }], calledAt: ist(day2, '15:58'),
      live: { server: 'A', serverNo: 1, firstServerSide: 'A', history: [], timeoutsUsed: { a: 1, b: 0 }, startedAt: ist(day2, '16:02') },
    })
    set(md('wdo', 'sf', 2), {
      status: 'live', games: [{ a: 7, b: 9 }], calledAt: ist(day2, '16:06'),
      live: { server: 'B', serverNo: 1, firstServerSide: 'A', history: [], timeoutsUsed: { a: 0, b: 1 }, startedAt: ist(day2, '16:08') },
    })
    set(md('wdo', 'sf', 1), { status: 'awaiting_confirmation', games: [{ a: 11, b: 7 }], endedAt: ist(day2, '16:02') })
    set(md('xdo', 'sf', 1), { status: 'awaiting_confirmation', games: [{ a: 9, b: 11 }], endedAt: ist(day2, '16:14') })
    set(md('xdo', 'sf', 2), { status: 'called', calledAt: ist(day2, '16:00') })
    matches = propagate(matches, groups, categories)
    // Three players in the late Mixed semi-final have not checked in yet: that is why Court 3 is late.
    const sf2 = matches.find((m) => m.id === md('xdo', 'sf', 2))!
    const ra = regs.find((r) => r.id === sf2.sideA)
    const rb = regs.find((r) => r.id === sf2.sideB)
    const missing = new Set([...(ra?.playerIds ?? []), ...(rb?.playerIds.slice(1) ?? [])])
    regs.forEach((r) => (r.checkedIn = r.checkedIn.filter((p) => !missing.has(p))))
  }

  /* timelines, umpires, DUPR */
  const umpireNames = ['Sathish Kumar', 'Renu Thomas', 'Bala Murugan', 'Divakar Hegde', 'Nivetha Raj', 'Yusuf Khan']
  const umpires: Umpire[] =
    moment === 'before_launch'
      ? []
      : umpireNames.map((name, i) => {
          const court = [1, 1, 2, 2, 3, 4][i]
          return {
            id: `ump-${i + 1}`,
            eventId: IDS.hero,
            name,
            mobile: `90000${String(12001 + i).padStart(5, '0')}`,
            court,
            status: moment === 'match_day' ? (court === 4 ? 'idle' : 'active') : moment === 'finished' ? 'idle' : 'invited',
            token: courtToken(IDS.hero, court),
          }
        })
  matches.forEach((m) => {
    if (m.court) m.umpireId = umpires.find((u) => u.court === m.court)?.id
    if (m.scheduledAt && (m.status === 'done' || m.status === 'live' || m.status === 'awaiting_confirmation')) {
      const s = m.live?.startedAt ?? m.scheduledAt
      m.timeline = [{ at: m.calledAt ?? s, text: `Called to Court ${m.court}` }, { at: s, text: 'Match started' }]
      if (m.status === 'done') m.timeline.push({ at: m.endedAt ?? addMin(s, 18), text: `Result confirmed by ${m.confirmedBy ?? 'Umpire'}` })
      if (m.status === 'awaiting_confirmation') m.timeline.push({ at: m.endedAt!, text: 'Umpire ended the match. Waiting for confirmation.' })
    }
    if (m.status === 'done') {
      const roll = rng.float()
      m.dupr = roll < 0.92 ? 'synced' : roll < 0.97 ? 'pending' : 'failed'
      if (m.dupr === 'failed') m.duprReason = rng.chance(0.5) ? 'One player has no DUPR ID yet' : 'DUPR did not respond. Try again.'
    }
  })
  // Known corrections for the audit trail demo.
  const corrected = matches.find((m) => m.status === 'done' && m.stage === 'group' && m.categoryId === heroCategoryId('wdo'))
  if (corrected) {
    corrected.corrections = [{ at: addMin(corrected.scheduledAt!, 22), by: 'Karthik Rao', from: `${corrected.games[0].a}-${corrected.games[0].b - 1}`, to: `${corrected.games[0].a}-${corrected.games[0].b}`, reason: 'Umpire missed the last point' }]
  }

  /* sponsors, media, messages */
  const sponsors: Sponsor[] = [
    { id: 'sp-1', eventId: IDS.hero, name: 'Smashline Paddles', tier: 'title', logoText: 'SMASHLINE', color: CATEGORICAL[0], order: 1, active: true },
    { id: 'sp-2', eventId: IDS.hero, name: 'Kovai Fresh Juices', tier: 'gold', logoText: 'KOVAI FRESH', color: CATEGORICAL[6], order: 2, active: true },
    { id: 'sp-3', eventId: IDS.hero, name: 'Ace Physio', tier: 'partner', logoText: 'ACE PHYSIO', color: CATEGORICAL[1], order: 3, active: true },
  ]
  const media: MediaItem[] = [
    { id: 'md-1', eventId: IDS.hero, kind: 'image', title: 'Finals night poster', seconds: 10, order: 1, active: true },
    { id: 'md-2', eventId: IDS.hero, kind: 'video', title: 'Day 1 highlights', seconds: 30, order: 2, active: true },
    { id: 'md-3', eventId: IDS.hero, kind: 'image', title: 'Smashline Paddles offer', seconds: 8, order: 3, active: false },
  ]
  const messages: Message[] =
    moment === 'before_launch'
      ? []
      : [
          { id: 'msg-1', eventId: IDS.hero, channel: 'email', audience: { kind: 'everyone', label: 'Everyone' }, templateId: 'confirmation', title: 'Registration confirmed', body: 'Hi {player_name}, you are in for {category} at Coimbatore Open 2026.', sentAt: '2026-09-21T10:00:00.000Z', stats: { sent: 146, delivered: 141, failed: 5 } },
          { id: 'msg-2', eventId: IDS.hero, channel: 'whatsapp', audience: { kind: 'everyone', label: 'Everyone' }, templateId: 'confirmation', title: 'Registration confirmed', body: 'Hi {player_name}, you are in for {category} at Coimbatore Open 2026. See you on court!', sentAt: '2026-09-21T10:00:00.000Z', stats: { sent: 152, delivered: 150, read: 139 } },
          ...(moment === 'match_day' || moment === 'finished'
            ? [
                { id: 'msg-3', eventId: IDS.hero, channel: 'whatsapp' as const, audience: { kind: 'everyone' as const, label: 'Everyone' }, templateId: 'schedule', title: 'Schedule published', body: 'Your Coimbatore Open schedule is out. First match: {match_time} on {court}.', sentAt: ist('2026-10-15', '19:35'), stats: { sent: 152, delivered: 151, read: 147 } },
                { id: 'msg-4', eventId: IDS.hero, channel: 'whatsapp' as const, audience: { kind: 'everyone' as const, label: 'Players still in' }, templateId: 'reminder', title: 'Day 2 reminder', body: 'Finals day! Check in at the desk 30 minutes before your match. Gates open 7:30 am.', sentAt: ist('2026-10-17', '21:00'), stats: { sent: 64, delivered: 64, read: 61 } },
              ]
            : []),
        ]

  /* payouts */
  const payouts: Payout[] = []
  if (moment === 'match_day' || moment === 'finished' || moment === 'draw_day') {
    const online = pays.filter((p) => p.status === 'captured' && p.channel === 'online')
    const early = online.filter((p) => Date.parse(p.at) < Date.parse('2026-10-10T00:00:00+05:30'))
    const late = online.filter((p) => !early.includes(p))
    const sum = (l: Payment[]) => l.reduce((s, p) => s + p.amount, 0)
    const fees = (l: Payment[]) => l.reduce((s, p) => s + p.fee, 0)
    payouts.push({ id: 'po-1', organizerId: IDS.meera, eventId: IDS.hero, amount: sum(early) - fees(early), fees: fees(early), status: 'paid', date: ist('2026-10-13', '11:00'), ref: 'UTR 4021 7781 0093' })
    payouts.push({ id: 'po-2', organizerId: IDS.meera, eventId: IDS.hero, amount: sum(late) - fees(late), fees: fees(late), status: moment === 'finished' ? 'scheduled' : 'scheduled', date: ist('2026-10-20', '11:00'), ref: 'Scheduled' })
  }

  return { event, categories, registrations: regs, groups, matches, umpires, sponsors, media, messages, payments: pays, payouts }
}

/* ------------------------------------------------------------- league (B) */

function leagueEvent(rng: Rng, used: Set<string>) {
  const eventId = IDS.league
  const players: Player[] = []
  for (let i = 0; i < 48; i++) players.push(makePlayer(rng, `p-l-${i + 1}`, i % 3 === 2 ? 'F' : 'M', [3.2, 4.8], rng.pick(['Chennai', 'Bengaluru', 'Kochi', 'Hyderabad', 'Coimbatore']), used))
  const settings = defaultSettings('pickleball', 'league')
  settings.page.headline = 'Eight cities. One season. One trophy.'
  settings.page.about = 'The South Zone Pickleball League brings eight franchise teams together for a seven-round season, with the top four playing semi-finals in December.'
  const event: EventItem = {
    id: eventId, organizerId: IDS.meera, name: 'South Zone Pickleball League, Season 1', slug: 'south-zone-pickleball-league', sport: 'pickleball', type: 'league', status: 'scheduled',
    startDate: ist('2026-10-10', '09:00'), endDate: ist('2026-11-28', '20:00'),
    venue: { name: 'Nungambakkam Sports Hub', address: 'Nungambakkam, Chennai', city: 'Chennai', indoor: true },
    courts: 4, logo: 1, accent: RIZZ_ORANGE, coverStyle: 'neon', certifications: { dupr: true, ipa: false, pwr: false },
    modules: [], settings, createdVia: 'self_serve', createdAt: '2026-08-25T10:00:00.000Z', setup: baseSetup({ city: 'Chennai' }), sponsorsOn: false,
    league: {
      teams: 8, playersPerTeam: 6, matchesPerPlayer: 2,
      matchTypes: [{ type: 'doubles', count: 2 }, { type: 'mixed', count: 1 }, { type: 'singles', count: 1 }],
      eligibility: { skill: ['Intermediate', 'Advanced'], age: ['18+'], gender: [] },
      ties: true, autoKnockout: true, knockoutTeams: 4, teamFormation: 'auto_balance', pointsPerMatchWin: 1, tieBreaker: 'super_singles', slotSwap: 'none',
    },
    dayLabel: 'Round 3 of 7 next weekend',
  }
  event.modules = computeModules(event)
  const cat: EventCategory = {
    id: `${eventId}-pool`, eventId, categoryId: 'cm-open', divisionId: 'dv-open', label: 'Player sign-up', format: 'round_robin', teamSize: 1, price: 2000, cap: 48, waitlist: true,
    groupSize: 8, advancePerGroup: 4, seeding: 'dupr', matchRules: defaultRules('pickleball'), stage: 'in_play', entriesClosed: true, color: CATEGORICAL[1], order: 0, thirdPlace: false,
  }
  const names = TEAM_NAME_SUGGESTIONS.slice(0, 8)
  const sorted = [...players].sort((a, b) => ratingOf(b) - ratingOf(a))
  const teams: LeagueTeam[] = names.map((name, i) => ({
    id: `lt-${i + 1}`, eventId, name, short: name.split(' ').map((w) => w[0]).join(''), color: CATEGORICAL[i % 8], playerIds: [], locked: [],
  }))
  // Auto-balance: snake draft by rating.
  sorted.forEach((p, i) => {
    const r = Math.floor(i / 8)
    const idx = r % 2 === 0 ? i % 8 : 7 - (i % 8)
    teams[idx].playerIds.push(p.id)
  })
  teams.forEach((t) => (t.captainId = t.playerIds[0]))
  const registrations: Registration[] = players.map((p, i) => ({
    id: `r-l-${i + 1}`, eventId, categoryId: cat.id, playerIds: [p.id], status: 'paid', channel: 'online', amount: 2000, paidVia: 'upi',
    createdAt: new Date(Date.parse('2026-09-01T10:00:00Z') + i * 3600000 * 9).toISOString(), checkedIn: [], history: [{ at: '2026-09-01T10:00:00Z', text: 'Registered online' }],
  }))
  const payments: Payment[] = registrations.map((r, i) => ({
    id: `pay-${r.id}`, eventId, registrationId: r.id, customer: `${players[i].firstName} ${players[i].lastName}`, amount: 2000, fee: 60, method: 'upi', status: 'captured', at: r.createdAt, orderRef: `order_L${i}Q`, paymentRef: `pay_L${i}ZX`, channel: 'online',
  }))
  // Ties: round robin, 7 rounds x 4 ties.
  const ties: Tie[] = []
  const matches: Match[] = []
  const slotLabels = ['Doubles 1', 'Doubles 2', 'Mixed', 'Singles']
  const lineupFor = (team: LeagueTeam): LineupSlot[] => {
    const men = team.playerIds.filter((id) => players.find((p) => p.id === id)!.gender === 'M')
    const women = team.playerIds.filter((id) => players.find((p) => p.id === id)!.gender === 'F')
    return [
      { label: 'Doubles 1', playerIds: [men[0], men[1]].filter(Boolean) },
      { label: 'Doubles 2', playerIds: [men[2], men[3] ?? women[1]].filter(Boolean) },
      { label: 'Mixed', playerIds: [men[1] ?? men[0], women[0]].filter(Boolean) },
      { label: 'Singles', playerIds: [men[3] ?? men[0]].filter(Boolean) },
    ]
  }
  const r3States: [Tie['lineupStatus']['a'], Tie['lineupStatus']['b']][] = [['approved', 'approved'], ['approved', 'submitted'], ['approved', 'submitted'], ['approved', 'pending']]
  roundRobin(teams.map((t) => t.id)).forEach((pairs, ri) => {
    const round = ri + 1
    const date = new Date(Date.parse(ist('2026-10-10', '10:00')) + ri * 7 * 86400000).toISOString()
    pairs.forEach(([a, b], ti) => {
      const id = `tie-${round}-${ti + 1}`
      const ta = teams.find((t) => t.id === a)!
      const tb = teams.find((t) => t.id === b)!
      const done = round <= 2
      const tie: Tie = {
        id, eventId, round, teamA: a, teamB: b, date: addMin(date, ti * 0), court: ti + 1,
        status: done ? 'done' : 'upcoming', matchIds: [],
        lineupStatus: done ? { a: 'approved', b: 'approved' } : round === 3 ? { a: r3States[ti][0], b: r3States[ti][1] } : { a: 'pending', b: 'pending' },
        lineups: { a: round <= 3 ? lineupFor(ta) : [], b: round <= 3 && !(round === 3 && r3States[ti][1] === 'pending') ? lineupFor(tb) : [] },
      }
      if (done) {
        let wa = 0
        let wb = 0
        slotLabels.forEach((label, si) => {
          const aWins = rng.chance(0.5)
          const g = randomGame(() => rng.float(), { pointsToWin: 11, winBy: 2 }, aWins)
          if (aWins) wa++
          else wb++
          const mid = `${id}-m${si + 1}`
          tie.matchIds.push(mid)
          matches.push({ id: mid, eventId, categoryId: cat.id, stage: 'league', round, slot: si + 1, sideA: a, sideB: b, tieId: id, slotLabel: label, court: ti + 1, scheduledAt: addMin(date, si * 25), status: 'done', games: [g], bestOf: 1, corrections: [], timeline: [], dupr: 'synced' })
        })
        if (wa === wb) {
          // Tie breaker: super singles decided it.
          if (rng.chance(0.5)) wa++
          else wb++
        }
        tie.result = { a: wa, b: wb, pointsA: wa > wb ? 2 : 0, pointsB: wb > wa ? 2 : 0 }
      }
      ties.push(tie)
    })
  })
  return { event, cat, players, teams, registrations, payments, ties, matches }
}

/* ------------------------------------------------------------ auction (C) */

function auctionEvent(rng: Rng, used: Set<string>) {
  const eventId = IDS.auction
  const players: Player[] = []
  for (let i = 0; i < 48; i++) {
    const tier = i < 12 ? 'A' : i < 30 ? 'B' : 'C'
    const band: [number, number] = tier === 'A' ? [4.4, 5.4] : tier === 'B' ? [3.7, 4.4] : [2.9, 3.7]
    players.push(makePlayer(rng, `p-a-${i + 1}`, i % 4 === 3 ? 'F' : 'M', band, rng.pick(['Bengaluru', 'Chennai', 'Mumbai', 'Pune']), used))
  }
  const settings = defaultSettings('pickleball', 'auction')
  settings.page.headline = 'Six owners. ₹6 lakh in the purse. One night of bidding.'
  settings.page.about = 'Founders Cup brings startup founders together as team owners. They bid for players live, then the squads battle it out over three weekends.'
  const event: EventItem = {
    id: eventId, organizerId: IDS.meera, name: 'Founders Cup Auction League', slug: 'founders-cup-auction-league', sport: 'pickleball', type: 'auction', status: 'live',
    startDate: ist('2026-10-18', '15:00'), endDate: ist('2026-11-15', '20:00'),
    venue: { name: 'Koramangala Racquet Club', address: '5th Block, Koramangala, Bengaluru', city: 'Bengaluru', indoor: true },
    courts: 3, logo: 3, accent: RIZZ_ORANGE, coverStyle: 'neon', certifications: { dupr: false, ipa: false, pwr: false },
    modules: [], settings, createdVia: 'self_serve', createdAt: '2026-09-05T10:00:00.000Z', setup: baseSetup({ city: 'Bengaluru' }), sponsorsOn: true,
    league: {
      teams: 6, playersPerTeam: 6, matchesPerPlayer: 2, matchTypes: [{ type: 'doubles', count: 2 }, { type: 'mixed', count: 1 }],
      eligibility: { skill: [], age: [], gender: [] }, ties: true, autoKnockout: true, knockoutTeams: 4, teamFormation: 'auction', pointsPerMatchWin: 1, tieBreaker: 'golden_game', slotSwap: 'none',
    },
    auction: { budgetPerTeam: 100000, squadSize: 6, bidSteps: [500, 1000, 5000], biddingBy: 'owners', basePriceByTier: { A: 5000, B: 2500, C: 1000 }, startsAt: ist('2026-10-18', '15:00'), bidSeconds: 15 },
    dayLabel: 'Auction live',
  }
  event.modules = computeModules(event)
  const cat: EventCategory = {
    id: `${eventId}-pool`, eventId, categoryId: 'cm-open', divisionId: 'dv-open', label: 'Player pool', format: 'round_robin', teamSize: 1, price: 1000, cap: 48, waitlist: false,
    groupSize: 6, advancePerGroup: 4, seeding: 'dupr', matchRules: defaultRules('pickleball'), stage: 'registrations', entriesClosed: true, color: CATEGORICAL[3], order: 0, thirdPlace: false,
  }
  const teamNames = ['Byte Ballers', 'Seed Round Smashers', 'Unicorn Dinkers', 'Bootstrap Blasters', 'Pivot Paddlers', 'Series A Aces']
  const ownerNames = ['Rhea Kapoor', 'Vivek Iyengar', 'Sana Ansari', 'Kunal Mehta', 'Tanvi Rao', 'Aditya Bose']
  const teams: LeagueTeam[] = teamNames.map((name, i) => ({
    id: `at-${i + 1}`, eventId, name, short: name.split(' ').map((w) => w[0]).join('').slice(0, 3), color: CATEGORICAL[(i + 1) % 8], ownerId: `own-${i + 1}`, playerIds: [], locked: [], budget: 100000, spent: 0,
  }))
  const owners: Owner[] = ownerNames.map((name, i) => ({ id: `own-${i + 1}`, eventId, name, mobile: `90000${String(13001 + i)}`, teamId: teams[i].id, status: 'joined' }))
  const order = rng.shuffle(players.map((p) => p.id))
  const tierOf = (id: string) => (Number(id.split('-')[2]) <= 12 ? 'A' : Number(id.split('-')[2]) <= 30 ? 'B' : 'C') as 'A' | 'B' | 'C'
  const base = { A: 5000, B: 2500, C: 1000 }
  const lots: AuctionLot[] = order.map((pid, i) => ({ playerId: pid, tier: tierOf(pid), basePrice: base[tierOf(pid)], status: 'upcoming', order: i + 1 }))
  const bids: AuctionState['bids'] = []
  let t = Date.parse(ist('2026-10-18', '15:05'))
  for (let i = 0; i < 17; i++) {
    const lot = lots[i]
    const eligible = teams.filter((tm) => tm.playerIds.length < 6)
    const team = eligible[rng.int(0, eligible.length - 1)]
    const price = lot.basePrice + rng.int(0, lot.tier === 'A' ? 6 : lot.tier === 'B' ? 5 : 3) * (lot.tier === 'A' ? 5000 : 1000)
    lot.status = 'sold'
    lot.soldTo = team.id
    lot.soldFor = price
    team.playerIds.push(lot.playerId)
    team.spent = (team.spent ?? 0) + price
    bids.push({ id: `bid-${i}-a`, eventId, playerId: lot.playerId, teamId: teams[(teams.indexOf(team) + 1) % 6].id, amount: price - (lot.tier === 'C' ? 500 : 1000), at: new Date(t).toISOString() })
    bids.push({ id: `bid-${i}-b`, eventId, playerId: lot.playerId, teamId: team.id, amount: price, at: new Date(t + 20000).toISOString() })
    t += 70000
  }
  lots[17].status = 'on_block'
  const auction: AuctionState = { eventId, status: 'live', lots, currentPlayerId: lots[17].playerId, currentBid: lots[17].basePrice, leadingTeamId: null, bids, lastSale: { playerId: lots[16].playerId, teamId: lots[16].soldTo!, amount: lots[16].soldFor! } }
  const registrations: Registration[] = players.map((p, i) => ({
    id: `r-a-${i + 1}`, eventId, categoryId: cat.id, playerIds: [p.id], status: 'paid', channel: 'online', amount: 1000, paidVia: 'upi',
    createdAt: new Date(Date.parse('2026-09-10T10:00:00Z') + i * 3600000 * 6).toISOString(), checkedIn: [], history: [{ at: '2026-09-10T10:00:00Z', text: 'Registered online' }],
  }))
  const payments: Payment[] = registrations.map((r, i) => ({
    id: `pay-${r.id}`, eventId, registrationId: r.id, customer: `${players[i].firstName} ${players[i].lastName}`, amount: 1000, fee: 30, method: 'upi', status: 'captured', at: r.createdAt, orderRef: `order_A${i}W`, paymentRef: `pay_A${i}MK`, channel: 'online',
  }))
  const sponsors: Sponsor[] = [{ id: 'sp-a1', eventId, name: 'Garage Ventures', tier: 'title', logoText: 'GARAGE VENTURES', color: CATEGORICAL[3], order: 1, active: true }]
  return { event, cat, players, teams, owners, auction, registrations, payments, sponsors }
}

/* ------------------------------------------------------------- social (D) */

function socialEvent(rng: Rng, used: Set<string>) {
  const eventId = IDS.social
  const settings = defaultSettings('pickleball', 'social')
  settings.page.headline = 'Paddles, playlists and a pot of filter coffee'
  settings.page.about = 'A relaxed Sunday evening of rotating doubles for every level. Paddles available at the desk. Dinner included.'
  const event: EventItem = {
    id: eventId, organizerId: IDS.meera, name: 'Sunday Social Mixer', slug: 'sunday-social-mixer', sport: 'pickleball', type: 'social', status: 'registrations_open',
    startDate: ist('2026-10-25', '17:00'), endDate: ist('2026-10-25', '21:00'),
    venue: { name: 'Baseline Pickleball Club', address: 'Saravanampatti, Coimbatore', city: 'Coimbatore', indoor: false },
    courts: 4, logo: 4, accent: RIZZ_ORANGE, coverStyle: 'clay', certifications: { dupr: false, ipa: false, pwr: false },
    modules: [], settings, createdVia: 'self_serve', createdAt: '2026-10-05T10:00:00.000Z', setup: baseSetup(), sponsorsOn: false,
    social: { capacity: 32, pricePerPerson: 499, format: 'just_social', collect: ['meal', 'tshirt', 'alias'] },
  }
  event.modules = computeModules(event)
  const participants: Participant[] = []
  const payments: Payment[] = []
  const invoices: Invoice[] = []
  for (let i = 0; i < 26; i++) {
    const g: 'M' | 'F' = i % 5 < 3 ? 'M' : 'F'
    const p = makePlayer(rng, `tmp-${i}`, g, [2.5, 4], 'Coimbatore', used)
    const at = new Date(Date.parse('2026-10-06T10:00:00+05:30') + i * 3600000 * 9).toISOString()
    const st: Participant['paymentStatus'] = i < 21 ? 'paid' : 'link_sent'
    const part: Participant = {
      id: `pt-${i + 1}`, eventId, name: `${p.firstName} ${p.lastName}`, alias: rng.pick(['Dink King', 'Lob Star', 'Kitchen Queen', 'Erne Ace', 'Smash Bro', 'Third Shot', 'Net Ninja', 'Spin Doctor']) + (i > 7 ? ` ${i}` : ''),
      gender: g, age: rng.int(19, 54), mobile: p.mobile, email: p.email, instagram: p.instagram, mealPreference: rng.pick(['veg', 'veg', 'non_veg', 'vegan'] as const), tshirt: p.tshirt,
      paymentStatus: st, paymentLinkSentAt: st === 'link_sent' ? new Date(DEMO_NOW - (i - 20) * 3600000 * 4).toISOString() : undefined, registeredAt: at,
      history: [{ at, text: 'Registered' }, ...(st === 'paid' ? [{ at, text: 'Paid ₹499 by UPI' }] : [{ at, text: 'Payment link sent on WhatsApp' }])],
    }
    participants.push(part)
    if (st === 'paid') {
      payments.push({ id: `pay-${part.id}`, eventId, participantId: part.id, customer: part.name, amount: 499, fee: 15, method: 'upi', status: 'captured', at, orderRef: `order_S${i}P`, paymentRef: `pay_S${i}TT`, channel: 'online' })
      invoices.push({ id: `inv-${i + 1}`, eventId, number: `RZF-SSM-${String(1001 + i)}`, customer: part.name, amount: 499, mailSent: i !== 7, sentAt: at, failedOn: i === 7 ? at : undefined })
    }
  }
  return { event, participants, payments, invoices }
}

/* --------------------------------------------------------------- draft (E) */

function draftEvent(): EventItem {
  const settings = defaultSettings('pickleball', 'draft')
  const e: EventItem = {
    id: IDS.draft, organizerId: IDS.meera, name: "Captain's Draft Night", slug: 'captains-draft-night', sport: 'pickleball', type: 'draft', status: 'draft',
    startDate: ist('2026-11-07', '18:00'), endDate: ist('2026-11-29', '21:00'),
    venue: { name: 'Baseline Pickleball Club', address: 'Saravanampatti, Coimbatore', city: 'Coimbatore', indoor: false },
    courts: 4, logo: 2, accent: RIZZ_ORANGE, coverStyle: 'court', certifications: { dupr: false, ipa: false, pwr: false },
    modules: [], settings, createdVia: 'self_serve', createdAt: '2026-10-16T21:10:00.000Z', sponsorsOn: false,
    setup: baseSetup({ step: 3, completed: false, pageReviewed: false }),
    league: {
      teams: 6, playersPerTeam: 5, matchesPerPlayer: 2, matchTypes: [{ type: 'doubles', count: 2 }, { type: 'singles', count: 1 }],
      eligibility: { skill: [], age: [], gender: [] }, ties: true, autoKnockout: true, knockoutTeams: 4, teamFormation: 'draft', pointsPerMatchWin: 1, tieBreaker: 'super_singles', slotSwap: 'none',
    },
    draft: { order: 'snake', pickSeconds: 60, captainsPerTeam: 1 },
  }
  e.modules = computeModules(e)
  return e
}

/* ----------------------------------------------------------- HQ synthetic */

function hqEvents(rng: Rng, orgs: Organizer[]): EventItem[] {
  const defs: [number, string, EventItem['sport'], EventItem['type'], EventItem['status'], string][] = [
    [6, 'Kochi Monsoon Classic', 'pickleball', 'tournament', 'completed', '2026-09-12'],
    [7, 'Deccan Corporate Cup', 'badminton', 'tournament', 'registrations_open', '2026-11-08'],
    [8, 'Salt Lake Doubles Bash', 'pickleball', 'tournament', 'live', '2026-10-18'],
    [9, 'Riverfront Pickleball League', 'pickleball', 'league', 'scheduled', '2026-10-25'],
    [10, 'Madurai District Badminton Championship', 'badminton', 'tournament', 'registrations_closed', '2026-10-31'],
    [11, 'Cyber City Box Cricket', 'cricket', 'tournament', 'registrations_open', '2026-11-14'],
    [12, 'Vizag Beach Open', 'pickleball', 'tournament', 'completed', '2026-08-30'],
    [13, 'Trivandrum Turf Sevens', 'football', 'tournament', 'live', '2026-10-18'],
    [14, 'Pink City Pickleball Auction', 'pickleball', 'auction', 'registrations_open', '2026-11-21'],
    [15, 'Lucknow Shuttle Social', 'badminton', 'social', 'registrations_open', '2026-10-24'],
    [16, 'Mysuru Dasara Open', 'pickleball', 'tournament', 'completed', '2026-10-04'],
    [18, 'Gachibowli Night Cricket League', 'cricket', 'league', 'scheduled', '2026-11-01'],
    [19, 'Malabar Youth Football Cup', 'football', 'tournament', 'registrations_open', '2026-11-28'],
    [21, 'Bandra Sunset Mixer', 'pickleball', 'social', 'completed', '2026-10-11'],
    [5, 'Kovai Racquet Rally', 'pickleball', 'tournament', 'awaiting_approval', '2026-11-22'],
  ]
  return defs.map(([orgIdx, name, sport, type, status, date], i) => {
    const org = orgs[orgIdx - 1] ?? orgs[1]
    const settings = defaultSettings(sport, type)
    const e: EventItem = {
      id: `evt-hq-${i + 1}`, organizerId: org.id, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), sport, type, status,
      startDate: ist(date, '08:00'), endDate: ist(date, '20:00'),
      venue: { name: `${org.city} Sports Arena`, address: org.city, city: org.city, indoor: rng.chance(0.5) },
      courts: rng.int(2, 8), logo: i % 6, accent: RIZZ_ORANGE, coverStyle: 'court', certifications: { dupr: sport === 'pickleball', ipa: false, pwr: false },
      modules: [], settings, createdVia: i % 4 === 0 ? 'rizzfitt_team' : 'self_serve', createdAt: new Date(Date.parse(ist(date, '08:00')) - 40 * 86400000).toISOString(), setup: baseSetup(),
      sponsorsOn: false, hqOnly: { entries: status === 'awaiting_approval' ? 0 : rng.int(18, 140), collected: 0 },
    }
    e.hqOnly!.collected = e.hqOnly!.entries * rng.pick([499, 800, 1000, 1200, 1500])
    e.modules = computeModules(e)
    return e
  })
}

function hqPayments(rng: Rng, events: EventItem[], existing: number): Payment[] {
  const out: Payment[] = []
  const live = events.filter((e) => e.hqOnly && e.hqOnly.entries > 0)
  for (let i = 0; existing + out.length < 300; i++) {
    const e = live[i % live.length]
    const amount = rng.pick([499, 800, 1000, 1200, 1500])
    const at = new Date(DEMO_NOW - rng.int(1, 30 * 24) * 3600000).toISOString()
    const st: Payment['status'] = rng.chance(0.94) ? 'captured' : rng.chance(0.5) ? 'refunded' : 'failed'
    out.push({
      id: `pay-hq-${i}`, eventId: e.id, customer: `${rng.pick(MALE_FIRST.concat(FEMALE_FIRST))} ${rng.pick(LAST)}`, amount, fee: Math.round(amount * 0.03), method: rng.pick(['upi', 'upi', 'card', 'netbanking'] as const),
      status: st, at, orderRef: `order_H${(i * 9973).toString(36).toUpperCase()}`, paymentRef: `pay_H${(i * 7919).toString(36).toUpperCase()}Q`, channel: 'online',
    })
  }
  return out
}

/* --------------------------------------------------------------- assemble */

export function buildSeed(moment: Moment = 'match_day'): DemoData {
  mobileCounter = 0
  const rng = new Rng(42)
  const used = new Set<string>()
  const orgs = organizers(rng)
  const { men, women } = heroPlayers(rng, used)
  const hp = [...men, ...women]
  const rosters = heroRosters(men, women)
  const hero = heroEvent(moment, hp, rosters)
  const league = leagueEvent(rng, used)
  const auction = auctionEvent(rng, used)
  const social = socialEvent(rng, used)
  const draft = draftEvent()
  // Draft night sign-ups: 30 players waiting to be picked once setup is finished.
  const draftPlayers: Player[] = []
  for (let i = 0; i < 30; i++) draftPlayers.push(makePlayer(rng, `p-d-${i + 1}`, i % 3 === 2 ? 'F' : 'M', [2.9, 4.9], 'Coimbatore', used))
  const draftRegs: Registration[] = draftPlayers.map((p, i) => ({ id: `r-d-${i + 1}`, eventId: IDS.draft, categoryId: `${IDS.draft}-pool`, playerIds: [p.id], status: 'paid', channel: 'online', amount: 1000, paidVia: 'upi', createdAt: new Date(Date.parse('2026-10-17T10:00:00Z') + i * 3600000).toISOString(), checkedIn: [], history: [{ at: '2026-10-17T10:00:00Z', text: 'Registered online' }] }))
  const synth = hqEvents(rng, orgs)
  const draftPays: Payment[] = draftRegs.map((r, i) => ({ id: `pay-${r.id}`, eventId: IDS.draft, registrationId: r.id, customer: `${draftPlayers[i].firstName} ${draftPlayers[i].lastName}`, amount: 1000, fee: 30, method: 'upi', status: 'captured', at: r.createdAt, orderRef: `order_D${i}R`, paymentRef: `pay_D${i}RT`, channel: 'online' }))
  const allPayments = [...hero.payments, ...league.payments, ...auction.payments, ...social.payments, ...draftPays]
  const payments = [...allPayments, ...hqPayments(rng, synth, allPayments.length)]

  const approvals: Approval[] = [
    { id: 'ap-1', organizerId: 'org-2', kind: 'organizer', submittedAt: new Date(DEMO_NOW - 3 * 3600000).toISOString(), status: 'pending', notes: '' },
    { id: 'ap-2', organizerId: 'org-3', kind: 'organizer', submittedAt: new Date(DEMO_NOW - 9 * 3600000).toISOString(), status: 'pending', notes: '' },
    { id: 'ap-3', organizerId: 'org-4', kind: 'organizer', submittedAt: new Date(DEMO_NOW - 26 * 3600000).toISOString(), status: 'pending', notes: '' },
    { id: 'ap-4', organizerId: 'org-5', kind: 'payout', submittedAt: new Date(DEMO_NOW - 5 * 3600000).toISOString(), status: 'pending', notes: '' },
    { id: 'ap-5', organizerId: 'org-6', kind: 'payout', submittedAt: new Date(DEMO_NOW - 20 * 3600000).toISOString(), status: 'pending', notes: '' },
    { id: 'ap-6', organizerId: 'org-11', kind: 'custom_category', submittedAt: new Date(DEMO_NOW - 30 * 3600000).toISOString(), status: 'pending', notes: '', payload: { name: 'Parent & Kid Doubles', description: 'One parent and one child under 14 play together. Popular at our summer camps.' } },
    { id: 'ap-7', organizerId: IDS.meera, kind: 'payout', submittedAt: '2026-08-02T10:00:00.000Z', status: 'approved', notes: 'UPI verified with a ₹1 test credit.' },
    { id: 'ap-8', organizerId: 'org-21', kind: 'organizer', submittedAt: '2026-09-02T10:00:00.000Z', status: 'rejected', notes: 'Could not verify the organization. Asked them to reapply with club registration.' },
  ]

  const hqUsers: HqUser[] = [
    { id: 'u-1', name: 'Priya Raghavan', email: 'priya.raghavan@example.com', mobile: '9000019001', role: 'super_admin', login: { email: true, mobile: true, username: false }, active: true },
    { id: 'u-2', name: 'Siddharth Nair', email: 'siddharth.nair@example.com', mobile: '9000019002', role: 'admin', login: { email: true, mobile: true, username: false }, active: true },
    { id: 'u-3', name: 'Gauri Patil', email: 'gauri.patil@example.com', mobile: '9000019003', role: 'admin', login: { email: true, mobile: false, username: true }, active: true },
    { id: 'u-4', name: 'Meera Iyer', email: 'meera.iyer@example.com', mobile: '9000010001', role: 'organizer', login: { email: false, mobile: true, username: false }, active: true },
    { id: 'u-5', name: 'Vikram Kulkarni', email: 'vikram.kulkarni@example.com', mobile: '9000010051', role: 'organizer', login: { email: false, mobile: true, username: false }, active: true },
    { id: 'u-6', name: 'Bhavya Trivedi', email: 'bhavya.trivedi@example.com', mobile: '9000019006', role: 'trainer', login: { email: true, mobile: true, username: false }, active: true },
    { id: 'u-7', name: 'Ravi Prasad', email: 'ravi.prasad@example.com', mobile: '9000019007', role: 'user', login: { email: true, mobile: false, username: false }, active: false },
  ]
  const apiKeys: ApiKey[] = [
    { id: 'k-1', name: 'Court display network', masked: 'rz_live_••••••••3f9a', scopes: ['scores:read', 'tv:read'], rateLimit: 600, createdAt: '2026-06-01T10:00:00Z', status: 'active' },
    { id: 'k-2', name: 'Scoreboard hardware (Coimbatore)', masked: 'rz_live_••••••••77c2', scopes: ['scores:read', 'scores:write'], rateLimit: 120, createdAt: '2026-08-11T10:00:00Z', status: 'active' },
    { id: 'k-3', name: 'DUPR sync worker', masked: 'rz_live_••••••••0b1e', scopes: ['matches:read', 'dupr:write'], rateLimit: 60, createdAt: '2026-04-20T10:00:00Z', status: 'active' },
  ]
  const notifications: Notification[] = [
    { id: 'n-1', eventId: IDS.hero, organizerId: IDS.meera, at: new Date(DEMO_NOW - 6 * 60000).toISOString(), title: 'Mixed Doubles semi-final ended', body: 'Court 3 is waiting for you to confirm the result.', kind: 'blocker', read: false, href: `/e/${IDS.hero}/match-day` },
    { id: 'n-2', eventId: IDS.hero, organizerId: IDS.meera, at: new Date(DEMO_NOW - 18 * 60000).toISOString(), title: "Women's Doubles semi-final ended", body: 'Court 2 is waiting for you to confirm the result.', kind: 'blocker', read: false, href: `/e/${IDS.hero}/match-day` },
    { id: 'n-3', organizerId: IDS.meera, at: '2026-10-13T05:30:00.000Z', title: 'Payout sent', body: 'Your first Coimbatore Open payout is on its way.', kind: 'payout', read: true, href: `/e/${IDS.hero}/money` },
  ]

  const traffic: DemoData['traffic'] = {}
  const days = ['20 Sep', '24 Sep', '28 Sep', '2 Oct', '6 Oct', '10 Oct', '14 Oct']
  traffic[IDS.hero] = days.map((day, i) => ({ day, visits: [180, 420, 380, 610, 540, 720, 300][i], entries: [9, 18, 14, 21, 12, 14, 0][i] }))
  traffic[IDS.social] = days.map((day, i) => ({ day, visits: [0, 0, 0, 0, 120, 210, 160][i], entries: [0, 0, 0, 0, 8, 11, 7][i] }))

  return {
    version: SEED_VERSION,
    now: MOMENT_NOW[moment],
    moment,
    organizers: orgs,
    members: members(),
    events: [hero.event, league.event, auction.event, social.event, draft, ...synth],
    categoryMasters: CATEGORY_MASTERS.map((c) => ({ ...c })),
    divisionMasters: DIVISION_MASTERS.map((d) => ({ ...d })),
    categories: [
      ...hero.categories,
      league.cat,
      auction.cat,
      { ...league.cat, id: `${IDS.draft}-pool`, eventId: IDS.draft, label: 'Player sign-up', price: 1000, cap: 30, stage: 'registrations', entriesClosed: false, color: CATEGORICAL[2] },
    ],
    players: [...hp, ...league.players, ...auction.players, ...draftPlayers],
    registrations: [...hero.registrations, ...league.registrations, ...auction.registrations, ...draftRegs],
    groups: hero.groups,
    matches: [...hero.matches, ...league.matches],
    umpires: hero.umpires,
    sponsors: [...hero.sponsors, ...auction.sponsors],
    media: hero.media,
    messages: hero.messages,
    payments,
    payouts: hero.payouts,
    leagueTeams: [...league.teams, ...auction.teams],
    ties: league.ties,
    owners: auction.owners,
    auctions: [auction.auction],
    drafts: [] as DraftState[],
    participants: social.participants,
    invoices: social.invoices,
    approvals,
    fees: [
      { id: 'fee-1', label: 'Platform fee per online entry', amount: '[PLATFORM FEE]', appliesTo: 'All online payments', updatedAt: '2026-07-01T10:00:00Z' },
      { id: 'fee-2', label: 'Payment gateway fee', amount: '[GATEWAY FEE]', appliesTo: 'Razorpay, all methods', updatedAt: '2026-07-01T10:00:00Z' },
      { id: 'fee-3', label: 'GST on fees', amount: '[GST RATE]', appliesTo: 'Platform and gateway fees', updatedAt: '2026-07-01T10:00:00Z' },
    ],
    hqUsers,
    apiKeys,
    notifications,
    traffic,
  }
}

/** Replace only the hero event's records with the chosen moment. Keeps everything else (including user changes). */
export function applyMoment(data: DemoData, moment: Moment): DemoData {
  const fresh = buildSeed(moment)
  const isHero = (x: { eventId: string }) => x.eventId === IDS.hero
  return {
    ...data,
    moment,
    now: fresh.now,
    events: data.events.map((e) => (e.id === IDS.hero ? fresh.events.find((f) => f.id === IDS.hero)! : e)),
    categories: [...data.categories.filter((x) => !isHero(x)), ...fresh.categories.filter(isHero)],
    registrations: [...data.registrations.filter((x) => !isHero(x)), ...fresh.registrations.filter(isHero)],
    groups: [...data.groups.filter((x) => !isHero(x)), ...fresh.groups.filter(isHero)],
    matches: [...data.matches.filter((x) => !isHero(x)), ...fresh.matches.filter(isHero)],
    umpires: [...data.umpires.filter((x) => !isHero(x)), ...fresh.umpires.filter(isHero)],
    messages: [...data.messages.filter((x) => !isHero(x)), ...fresh.messages.filter(isHero)],
    payments: [...data.payments.filter((x) => !isHero(x)), ...fresh.payments.filter(isHero)],
    payouts: [...data.payouts.filter((x) => !isHero(x)), ...fresh.payouts.filter(isHero)],
  }
}

