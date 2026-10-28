export type Sport = 'pickleball' | 'badminton' | 'cricket' | 'football' | 'multi' | 'circuit'
export type EventType = 'tournament' | 'league' | 'auction' | 'draft' | 'social'
export type EventStatus =
  | 'draft'
  | 'awaiting_approval'
  | 'registrations_open'
  | 'registrations_closed'
  | 'scheduled'
  | 'live'
  | 'completed'

export type ModuleKey =
  | 'home'
  | 'registrations'
  | 'participants'
  | 'people'
  | 'team_builder'
  | 'schedule'
  | 'ties'
  | 'auction'
  | 'draft_board'
  | 'matchday'
  | 'messages'
  | 'results'
  | 'money'
  | 'sponsors_screens'
  | 'launch_kit'
  | 'settings'

export type ApprovalState = 'not_started' | 'pending' | 'approved' | 'rejected' | 'changes_requested'

export interface PayoutAccount {
  type: 'bank' | 'upi'
  maskedNumber: string
  holderName: string
  status: 'pending' | 'verified' | 'changes_requested'
  submittedAt: string
}

export interface Organizer {
  id: string
  name: string
  orgName: string
  city: string
  mobile: string
  email: string
  avatarColor: string
  approval: ApprovalState
  orgKind?: 'club' | 'association' | 'company' | 'independent'
  eventsPerYear?: '1-2' | '3-10' | '10+'
  instagram?: string
  payoutAccount?: PayoutAccount
  joinedAt: string
  notes?: string
}

export type MemberRole = 'owner' | 'manager' | 'desk' | 'court_captain'
export interface Member {
  id: string
  organizerId: string
  name: string
  mobile: string
  role: MemberRole
  courts?: number[]
  status: 'active' | 'invited'
}

export interface Venue {
  name: string
  address: string
  city: string
  indoor: boolean
}

export type FieldKey = 'dupr' | 'tshirt' | 'dob' | 'district' | 'instagram' | 'emergency' | 'club'

export type RankingPreset = 'wins_diff_h2h' | 'wins_points' | 'custom'
export interface RankingCriterion {
  key: string
  label: string
  sort: boolean
  show: boolean
}

export interface TimeoutRule {
  stage: 'group' | 'knockout' | 'final'
  perTeam: number
  seconds: number
}

export interface TvSettings {
  enabled: boolean
  template: 'arena' | 'glass' | 'minimal'
  showScore: boolean
  showSponsors: boolean
  showUpNext: boolean
  showBracket: boolean
  showPlayerCards: boolean
}

export interface EventSettings {
  payments: { online: boolean; desk: boolean }
  registrationFields: FieldKey[]
  consentText: string
  registrationNote: string
  guidelinesPdf?: string
  whatsappGroupUrl?: string
  whatsappAfterPayment: boolean
  showRegisteredCount: boolean
  waitlist: boolean
  checkIn: boolean
  umpiresOn: boolean
  umpiresPerCourt: 1 | 2
  tv: TvSettings
  publicLivePage: boolean
  ranking: RankingPreset
  rankingCriteria: RankingCriterion[]
  timeouts: TimeoutRule[]
  matchLengthMin: number
  restMin: number
  dayStart: string
  dayEnd: string
  launchKit: { eventPage: boolean; posters: boolean; whatsapp: boolean; email: boolean }
  page: { headline: string; about: string; sections: { categories: boolean; schedule: boolean; live: boolean; sponsors: boolean; faq: boolean } }
  /** ISO date-time registrations open. Close time lives on EventItem.regClosesAt. */
  regOpensAt?: string
  refundPolicy?: 'full_until_close' | 'half_until_draw' | 'none'
  /** Doubles only: partners register together, or singles sign up and get paired. */
  partnerRule?: 'together' | 'find_partner'
  whatsappMessage?: string
  /** Who enters results when umpires are off. */
  scoreEntry?: 'desk' | 'players'
}

export interface LeagueConfig {
  teams: number
  playersPerTeam: number
  matchesPerPlayer: number
  matchTypes: { type: 'doubles' | 'mixed' | 'singles' | 'super_singles' | 'team_event'; count: number }[]
  eligibility: { skill: string[]; age: string[]; gender: string[] }
  ties: boolean
  autoKnockout: boolean
  knockoutTeams: number
  teamFormation: 'organizer_assigns' | 'auto_balance' | 'captains_submit' | 'auction' | 'draft'
  pointsPerMatchWin: number
  tieBreaker: 'super_singles' | 'match_points' | 'golden_game'
  slotSwap: 'none' | 'leading_score'
  knockoutOrder?: string[]
}

export interface AuctionConfig {
  budgetPerTeam: number
  squadSize: number
  bidSteps: number[]
  biddingBy: 'owners' | 'organizer'
  basePriceByTier: { A: number; B: number; C: number }
  startsAt: string
  bidSeconds: number
  tierRule?: 'dupr' | 'manual'
  maxTierA?: number
  unsold?: 'second_round' | 'assign_base'
}

export interface DraftConfig {
  order: 'snake' | 'straight'
  pickSeconds: 30 | 60 | 90
  captainsPerTeam: number
  captainPick?: 'organizer' | 'vote' | 'top_rated'
}

export interface SocialConfig {
  capacity: number
  pricePerPerson: number
  format: 'just_social' | 'play_rounds'
  collect: ('meal' | 'tshirt' | 'alias')[]
  rounds?: number
  roundMin?: number
  rotation?: 'every_round' | 'fixed'
  mixing?: 'any' | 'by_level'
}

export interface CricketConfig {
  overs: number
  playersPerSide: number
  impactPlayer: boolean
  impactCount: number
  superOver: boolean
  squadSize?: number
}

export interface FootballConfig {
  halfMinutes: number
  penalties: boolean
  sideSize?: 5 | 7 | 11
  squadSize?: number
  subs?: number
}

export interface CircuitConfig {
  legs: { date: string; venue: string }[]
  /** Points for 1st, 2nd, 3rd-4th, 5th-8th. */
  points: [number, number, number, number]
  bestOf: number
}

export interface EventContact {
  mobile: string
  email: string
  clubId?: string
}

export interface SetupState {
  step: number
  completed: boolean
  orgName: string
  city: string
  orgKind: 'club' | 'association' | 'company' | 'independent'
  eventsPerYear: '1-2' | '3-10' | '10+'
  instagram: string
  startTime: string
  logoChoice: number | null
  expectedEntries: Record<string, number>
  finalsBestOf3: boolean
  applyRulesTo: 'all' | 'per_category'
  scoringPreset: string
  customCategoryRequest?: { name: string; description: string; status: 'sent' }
  invitedUmpires: { name: string; mobile: string }[]
  owners: { team: string; name: string; mobile: string }[]
  pageReviewed: boolean
  slugLocked?: boolean
  venueChosen?: boolean
}

export interface EventItem {
  id: string
  organizerId: string
  name: string
  slug: string
  sport: Sport
  type: EventType
  status: EventStatus
  startDate: string
  endDate: string
  venue: Venue
  courts: number
  logo: number | null
  /** Always Rizz Orange (the brand allows one action colour). Kept for posters and screens. */
  accent: string
  ground?: 'black' | 'charcoal'
  coverStyle: 'court' | 'neon' | 'clay'
  certifications: { dupr: boolean; ipa: boolean; pwr: boolean }
  modules: ModuleKey[]
  settings: EventSettings
  createdVia: 'self_serve' | 'rizzfitt_team'
  createdAt: string
  league?: LeagueConfig
  auction?: AuctionConfig
  draft?: DraftConfig
  social?: SocialConfig
  cricket?: CricketConfig
  football?: FootballConfig
  setup: SetupState
  regClosesAt?: string
  publishedAt?: string
  takenOver?: boolean
  /** Synthetic HQ-only events carry their headline numbers directly. */
  hqOnly?: { entries: number; collected: number }
  dayLabel?: string
  sponsorsOn: boolean
  cancelled?: boolean
  contact?: EventContact
  circuit?: CircuitConfig
}

export interface CategoryMaster {
  id: string
  name: string
  position: number
  teamSize: 1 | 2
  archived?: boolean
}
export interface DivisionMaster {
  id: string
  name: string
  position: number
  archived?: boolean
}

export type CategoryFormat = 'groups_knockout' | 'round_robin' | 'knockout' | 'king_of_court'
export type CategoryStage =
  | 'registrations'
  | 'ready_to_draw'
  | 'drawn'
  | 'matches_created'
  | 'scheduled'
  | 'published'
  | 'in_play'
  | 'done'

export interface MatchRules {
  scoring: 'rally' | 'side_out'
  pointsToWin: number
  winBy: 1 | 2
  games: 1 | 3
  finalsGames: 1 | 3
  goldenPoint: 0 | 1 | 2
  fixedSideAlternateServe: boolean
  timeoutsPerTeam: number
  timeoutSeconds: number
}

export interface EventCategory {
  id: string
  eventId: string
  categoryId: string
  divisionId: string
  label: string
  format: CategoryFormat
  teamSize: 1 | 2
  price: number
  cap: number
  waitlist: boolean
  groupSize: number
  advancePerGroup: number
  seeding: 'dupr' | 'random' | 'manual'
  matchRules: MatchRules
  stage: CategoryStage
  entriesClosed: boolean
  color: string
  order: number
  thirdPlace: boolean
  /** Who may enter. Gender follows the category name; ages are on the first day of play. */
  eligibility?: { gender: 'men' | 'women' | 'mixed' | 'open'; minAge?: number; maxAge?: number; ratingCap?: number }
  prize?: string
  /** Multi-sport events: the sport this category is played in. */
  sport?: Sport
  /** Team sports (cricket, football): entries are whole teams. */
  team?: { squadSize: number; subs: number }
}

export interface Player {
  id: string
  firstName: string
  lastName: string
  gender: 'M' | 'F'
  dob: string
  mobile: string
  email: string | null
  city: string
  district: string
  duprId?: string
  duprRating?: number
  duprStatus: 'ok' | 'missing' | 'not_found'
  skill: 'beginner' | 'intermediate' | 'advanced' | 'open'
  tshirt: 'S' | 'M' | 'L' | 'XL' | 'XXL'
  instagram?: string
  club?: string
}

export type RegStatus = 'paid' | 'pending' | 'refunded' | 'waitlist' | 'withdrawn'
export interface Registration {
  id: string
  eventId: string
  categoryId: string
  playerIds: string[]
  teamName?: string
  status: RegStatus
  channel: 'online' | 'desk'
  amount: number
  paidVia?: 'upi' | 'card' | 'netbanking' | 'cash'
  createdAt: string
  checkedIn: string[]
  seed?: number
  paymentLinkSentAt?: string
  notes?: string
  history: { at: string; text: string }[]
}

export interface Group {
  id: string
  eventId: string
  categoryId: string
  name: string
  registrationIds: string[]
}

export type MatchStage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final' | 'league'
export type MatchStatus = 'scheduled' | 'called' | 'live' | 'awaiting_confirmation' | 'done' | 'walkover' | 'paused'

export interface Correction {
  at: string
  by: string
  from: string
  to: string
  reason: string
}

export interface GameScore {
  a: number
  b: number
}

export interface MatchLive {
  /** Side currently serving. */
  server: 'A' | 'B'
  /** Pickleball side-out server number (1 or 2). */
  serverNo: 1 | 2
  firstServerSide: 'A' | 'B'
  /** History of point states for undo. */
  history: { games: GameScore[]; server: 'A' | 'B'; serverNo: 1 | 2 }[]
  timeoutUntil?: string
  timeoutsUsed: { a: number; b: number }
  startedAt?: string
  cricket?: { innings: 1 | 2; runs: [number, number]; wickets: [number, number]; balls: [number, number] }
}

export interface Match {
  id: string
  eventId: string
  categoryId: string
  stage: MatchStage
  groupId?: string
  round: number
  slot: number
  sideA: string | null
  sideB: string | null
  /** For knockout slots that are filled later: which match feeds this side. */
  feedA?: string
  feedB?: string
  feedLoserA?: boolean
  feedLoserB?: boolean
  /** Group-position source like "A1" for knockout slots filled from standings. */
  srcA?: string
  srcB?: string
  court?: number
  scheduledAt?: string
  status: MatchStatus
  games: GameScore[]
  bestOf: 1 | 3
  live?: MatchLive
  umpireId?: string
  confirmedBy?: string
  winner?: 'A' | 'B'
  calledAt?: string
  endedAt?: string
  corrections: Correction[]
  timeline: { at: string; text: string }[]
  rulesOverride?: Partial<MatchRules>
  tieId?: string
  slotLabel?: string
  isBye?: boolean
  dupr?: 'synced' | 'pending' | 'failed'
  duprReason?: string
}

export interface Umpire {
  id: string
  eventId: string
  name: string
  mobile: string
  court: number
  status: 'invited' | 'active' | 'idle'
  token: string
}

export interface Sponsor {
  id: string
  eventId: string
  name: string
  tier: 'title' | 'gold' | 'partner'
  logoText: string
  color: string
  order: number
  active: boolean
}

export interface MediaItem {
  id: string
  eventId: string
  kind: 'image' | 'video'
  title: string
  seconds: number
  order: number
  active: boolean
}

export type AudienceKind = 'everyone' | 'category' | 'unpaid' | 'not_checked_in' | 'next_hour' | 'custom'
export interface Message {
  id: string
  eventId: string
  channel: 'whatsapp' | 'email' | 'both'
  audience: { kind: AudienceKind; categoryIds?: string[]; label: string }
  templateId?: string
  title: string
  body: string
  sentAt?: string
  scheduledFor?: string
  stats: { sent: number; delivered: number; read?: number; failed?: number }
}

export interface Payment {
  id: string
  eventId: string
  registrationId?: string
  participantId?: string
  customer: string
  amount: number
  fee: number
  method: 'upi' | 'card' | 'netbanking' | 'cash'
  status: 'captured' | 'refunded' | 'failed'
  at: string
  orderRef: string
  paymentRef: string
  channel: 'online' | 'desk'
  refundReason?: string
}

export interface Payout {
  id: string
  organizerId: string
  eventId: string
  amount: number
  fees: number
  status: 'scheduled' | 'paid'
  date: string
  ref: string
}

export interface LeagueTeam {
  id: string
  eventId: string
  name: string
  short: string
  color: string
  ownerId?: string
  captainId?: string
  playerIds: string[]
  locked: string[]
  budget?: number
  spent?: number
}

export interface LineupSlot {
  label: string
  playerIds: string[]
}
export type LineupState = 'pending' | 'submitted' | 'approved' | 'changes_requested'
export interface Tie {
  id: string
  eventId: string
  round: number
  teamA: string
  teamB: string
  date: string
  court: number
  status: 'upcoming' | 'live' | 'done'
  matchIds: string[]
  lineupStatus: { a: LineupState; b: LineupState }
  lineups: { a: LineupSlot[]; b: LineupSlot[] }
  result?: { a: number; b: number; pointsA: number; pointsB: number }
  knockout?: boolean
}

export interface Owner {
  id: string
  eventId: string
  name: string
  mobile: string
  teamId: string
  status: 'invited' | 'joined'
}

export interface AuctionLot {
  playerId: string
  tier: 'A' | 'B' | 'C'
  basePrice: number
  status: 'upcoming' | 'on_block' | 'sold' | 'unsold'
  soldTo?: string
  soldFor?: number
  order: number
}

export interface Bid {
  id: string
  eventId: string
  playerId: string
  teamId: string
  amount: number
  at: string
}

export interface AuctionState {
  eventId: string
  status: 'not_started' | 'live' | 'paused' | 'finished'
  lots: AuctionLot[]
  currentPlayerId: string | null
  currentBid: number
  leadingTeamId: string | null
  bids: Bid[]
  lastSale?: { playerId: string; teamId: string; amount: number }
  deadline?: number
}

export interface DraftState {
  eventId: string
  status: 'not_started' | 'live' | 'finished'
  teamIds: string[]
  rounds: number
  picks: { round: number; teamId: string; playerId: string | null; auto?: boolean }[]
  pool: string[]
  deadline?: number
}

export interface Participant {
  id: string
  eventId: string
  name: string
  alias: string
  gender: 'M' | 'F'
  age: number
  mobile: string
  email: string | null
  instagram?: string
  mealPreference: 'veg' | 'non_veg' | 'vegan'
  tshirt: 'S' | 'M' | 'L' | 'XL' | 'XXL'
  paymentStatus: 'paid' | 'link_sent' | 'pending'
  paymentLinkSentAt?: string
  registeredAt: string
  history: { at: string; text: string }[]
}

export interface Invoice {
  id: string
  eventId: string
  number: string
  customer: string
  amount: number
  mailSent: boolean
  sentAt?: string
  failedOn?: string
}

export interface Approval {
  id: string
  organizerId: string
  kind: 'organizer' | 'payout' | 'custom_category'
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested'
  notes: string
  payload?: { name?: string; description?: string; eventId?: string }
}

export interface PlatformFee {
  id: string
  label: string
  amount: string
  appliesTo: string
  updatedAt: string
  note?: string
}

export interface HqUser {
  id: string
  name: string
  email: string
  mobile: string
  role: 'super_admin' | 'admin' | 'organizer' | 'user' | 'trainer'
  login: { email: boolean; mobile: boolean; username: boolean }
  active: boolean
}

export interface ApiKey {
  id: string
  name: string
  masked: string
  scopes: string[]
  rateLimit: number
  createdAt: string
  status: 'active' | 'revoked'
}

export interface Notification {
  id: string
  eventId?: string
  organizerId?: string
  at: string
  title: string
  body: string
  kind: 'blocker' | 'approval' | 'payout' | 'info'
  read: boolean
  href?: string
}

export type Persona = 'organizer' | 'new_organizer' | 'desk' | 'umpire' | 'player' | 'tv' | 'hq'
export type Moment = 'before_launch' | 'registrations_open' | 'draw_day' | 'match_day' | 'finished'
export type Quality = 'auto' | 'high' | 'medium' | 'low' | 'off'

export interface DemoData {
  version: number
  /** Monotonic revision so tabs ignore stale echoes of older state. */
  rev?: number
  now: number
  organizers: Organizer[]
  members: Member[]
  events: EventItem[]
  categoryMasters: CategoryMaster[]
  divisionMasters: DivisionMaster[]
  categories: EventCategory[]
  players: Player[]
  registrations: Registration[]
  groups: Group[]
  matches: Match[]
  umpires: Umpire[]
  sponsors: Sponsor[]
  media: MediaItem[]
  messages: Message[]
  payments: Payment[]
  payouts: Payout[]
  leagueTeams: LeagueTeam[]
  ties: Tie[]
  owners: Owner[]
  auctions: AuctionState[]
  drafts: DraftState[]
  participants: Participant[]
  invoices: Invoice[]
  approvals: Approval[]
  fees: PlatformFee[]
  hqUsers: HqUser[]
  apiKeys: ApiKey[]
  notifications: Notification[]
  moment: Moment
  traffic: Record<string, { day: string; visits: number; entries: number }[]>
}
