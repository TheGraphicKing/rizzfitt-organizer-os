import type { CategoryMaster, DivisionMaster, EventSettings, MatchRules, RankingCriterion, Sport, EventType } from './types'

/** Demo clock: Sunday 18 Oct 2026, 4:20 pm IST. Day 2 (finals day) of the Coimbatore Open. */
export const DEMO_NOW = Date.parse('2026-10-18T16:20:00+05:30')

/** Brand avatar hues: markers only (categories, teams, avatars), never buttons or backgrounds. */
export const CATEGORICAL = ['#E67E22', '#3498DB', '#2ECC71', '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB', '#9B59B6'] as const
/** The one action colour (Riz_Orange). */
export const RIZZ_ORANGE = '#F36B1C'
/** Event page grounds approved by the brand for dark layouts with live red (no Deep Blue next to red). */
export const GROUND_PRESETS: { value: 'black' | 'charcoal'; name: string; hex: string; line: string }[] = [
  { value: 'black', name: 'Court Black', hex: '#0A0A0A', line: 'The default. Deepest contrast for scores.' },
  { value: 'charcoal', name: 'Charcoal', hex: '#141414', line: 'A softer ground for long pages.' },
]

export const CATEGORY_MASTERS: CategoryMaster[] = [
  { id: 'cm-md', name: "Men's Doubles", position: 1, teamSize: 2 },
  { id: 'cm-wd', name: "Women's Doubles", position: 2, teamSize: 2 },
  { id: 'cm-xd', name: 'Mixed Doubles', position: 3, teamSize: 2 },
  { id: 'cm-ms', name: "Men's Singles", position: 4, teamSize: 1 },
  { id: 'cm-ws', name: "Women's Singles", position: 5, teamSize: 1 },
  { id: 'cm-s', name: 'Singles', position: 6, teamSize: 1 },
  { id: 'cm-d', name: 'Doubles', position: 7, teamSize: 2 },
  { id: 'cm-open', name: 'Open', position: 8, teamSize: 2 },
]
export const DIVISION_MASTERS: DivisionMaster[] = [
  { id: 'dv-open', name: 'Open', position: 1 },
  { id: 'dv-beg', name: 'Beginner', position: 2 },
  { id: 'dv-int', name: 'Intermediate - Below 4', position: 3 },
  { id: 'dv-adv', name: 'Advanced', position: 4 },
  { id: 'dv-35', name: '35+', position: 5 },
  { id: 'dv-40', name: '40+', position: 6 },
  { id: 'dv-50', name: '50+', position: 7 },
  { id: 'dv-women', name: 'Women', position: 8 },
  { id: 'dv-pk', name: 'Parent & Kid', position: 9 },
]
/** Categories offered as chips in setup (SW-03). */
export const SETUP_CATEGORY_IDS = ['cm-md', 'cm-wd', 'cm-xd', 'cm-ms', 'cm-ws', 'cm-open']
export const SETUP_DIVISION_IDS = ['dv-open', 'dv-beg', 'dv-int', 'dv-adv', 'dv-35', 'dv-40', 'dv-50']

export const ALL_RANKING_CRITERIA: { key: string; label: string }[] = [
  { key: 'tie_wins', label: 'Tie wins' },
  { key: 'tie_losses', label: 'Tie losses' },
  { key: 'ties_played', label: 'Ties played' },
  { key: 'tie_win_pct', label: 'Tie win %' },
  { key: 'match_wins', label: 'Match wins' },
  { key: 'match_losses', label: 'Match losses' },
  { key: 'matches_played', label: 'Matches played' },
  { key: 'match_win_pct', label: 'Match win %' },
  { key: 'points', label: 'Points' },
  { key: 'net_points', label: 'Net points' },
  { key: 'points_for', label: 'Points for' },
  { key: 'points_against', label: 'Points against' },
  { key: 'final_points', label: 'Final points' },
  { key: 'bonus', label: 'Bonus' },
  { key: 'penalty', label: 'Penalty' },
  { key: 'h2h', label: 'Head to head' },
  { key: 'points_diff', label: 'Points difference' },
  { key: 'tie_wins_by_match_points', label: 'Tie wins by match points' },
]

export function defaultRankingCriteria(): RankingCriterion[] {
  const on = ['match_wins', 'points_diff', 'h2h']
  return [
    ...on.map((k) => ({ key: k, label: ALL_RANKING_CRITERIA.find((c) => c.key === k)!.label, sort: true, show: true })),
    ...ALL_RANKING_CRITERIA.filter((c) => !on.includes(c.key)).map((c) => ({
      ...c,
      sort: false,
      show: ['matches_played', 'match_losses', 'points_for', 'points_against'].includes(c.key),
    })),
  ]
}

export function defaultRules(sport: Sport): MatchRules {
  if (sport === 'badminton')
    return { scoring: 'rally', pointsToWin: 21, winBy: 2, games: 3, finalsGames: 3, goldenPoint: 0, fixedSideAlternateServe: false, timeoutsPerTeam: 1, timeoutSeconds: 60 }
  return { scoring: 'rally', pointsToWin: 11, winBy: 2, games: 1, finalsGames: 3, goldenPoint: 0, fixedSideAlternateServe: false, timeoutsPerTeam: 2, timeoutSeconds: 60 }
}

export const DEFAULT_CONSENT =
  'I confirm the details I have entered are correct. I am fit to play and take part at my own risk. I agree to follow the event rules and the decisions of the organizers and umpires. Photos and videos from the event may be shared by the organizers.'

export function defaultSettings(sport: Sport, type: EventType): EventSettings {
  return {
    payments: { online: true, desk: true },
    registrationFields: sport === 'pickleball' ? ['dupr'] : [],
    consentText: DEFAULT_CONSENT,
    registrationNote: 'Entries close when a category is full. Partners must register together.',
    whatsappAfterPayment: true,
    showRegisteredCount: true,
    waitlist: true,
    checkIn: true,
    umpiresOn: type !== 'social',
    umpiresPerCourt: 1,
    tv: { enabled: type !== 'social', template: 'arena', showScore: true, showSponsors: true, showUpNext: true, showBracket: true, showPlayerCards: false },
    publicLivePage: true,
    ranking: 'wins_diff_h2h',
    rankingCriteria: defaultRankingCriteria(),
    timeouts: [
      { stage: 'group', perTeam: 2, seconds: 60 },
      { stage: 'knockout', perTeam: 2, seconds: 60 },
      { stage: 'final', perTeam: 2, seconds: 90 },
    ],
    matchLengthMin: 20,
    restMin: 15,
    dayStart: '08:00',
    dayEnd: '20:00',
    launchKit: { eventPage: true, posters: true, whatsapp: true, email: true },
    page: {
      headline: '',
      about: '',
      sections: { categories: true, schedule: true, live: true, sponsors: true, faq: true },
    },
  }
}

export const SPORT_META: Record<Sport, { label: string; line: string; courtWord: string; courtWordOne: string }> = {
  pickleball: { label: 'Pickleball', line: 'Doubles, singles, mixed. DUPR ready.', courtWord: 'Courts', courtWordOne: 'Court' },
  badminton: { label: 'Badminton', line: 'Rally to 21, best of 3, any category.', courtWord: 'Courts', courtWordOne: 'Court' },
  cricket: { label: 'Cricket', line: 'Box, tennis ball or leather. Overs and squads.', courtWord: 'Pitches', courtWordOne: 'Pitch' },
  football: { label: 'Football', line: '5s, 7s or 11s. Halves, goals, penalties.', courtWord: 'Grounds', courtWordOne: 'Ground' },
  multi: { label: 'Multi-sport', line: 'Several sports under one event.', courtWord: 'Courts', courtWordOne: 'Court' },
  circuit: { label: 'Circuit', line: 'A series of events with one ranking.', courtWord: 'Courts', courtWordOne: 'Court' },
}

export const TYPE_META: Record<EventType, { label: string; line: string }> = {
  tournament: { label: 'Tournament', line: 'Categories, groups and knockouts over 1-3 days' },
  league: { label: 'League', line: 'Teams play a season of ties' },
  auction: { label: 'Auction league', line: 'Owners bid for players, then play' },
  draft: { label: 'Draft league', line: 'Captains pick squads round by round' },
  social: { label: 'Social mixer', line: 'Casual sessions, pay and play' },
}

/** Combinations that make no sense, with the reason shown on the disabled card. */
export function typeDisabledReason(sport: Sport, type: EventType): string | null {
  if (sport === 'circuit' && type !== 'tournament') return 'Circuits run as tournaments'
  if (sport === 'multi' && (type === 'auction' || type === 'draft')) return 'Pick one sport for squad leagues'
  return null
}

export const TEAM_NAME_SUGGESTIONS = [
  'Marina Smashers', 'Nilgiri Ninjas', 'Cauvery Kings', 'Deccan Dinks', 'Malabar Mavericks', 'Palk Bay Pirates',
  'Western Ghats Warriors', 'Coromandel Comets', 'Kaveri Kestrels', 'Bay Breakers', 'Konkan Crushers', 'Vindhya Volleys',
  'Charminar Chargers', 'Hooghly Hawks', 'Thar Thunder', 'Ganga Gliders',
]

export const SAMPLE_LOGOS = [
  { label: 'Orange ball', glyph: 'circle', color: '#E67E22' },
  { label: 'Blue shield', glyph: 'shield', color: '#3498DB' },
  { label: 'Teal paddle', glyph: 'paddle', color: '#1ABC9C' },
  { label: 'Violet star', glyph: 'star', color: '#9B59B6' },
  { label: 'Pink crown', glyph: 'crown', color: '#E74C3C' },
  { label: 'Yellow bolt', glyph: 'bolt', color: '#2ECC71' },
] as const

export const MOCK_VENUES = [
  { name: 'Baseline Pickleball Club', address: 'Saravanampatti, Coimbatore', city: 'Coimbatore' },
  { name: 'Smash Factory Arena', address: 'OMR, Thoraipakkam, Chennai', city: 'Chennai' },
  { name: 'Nungambakkam Sports Hub', address: 'Nungambakkam, Chennai', city: 'Chennai' },
  { name: 'Velachery Indoor Courts', address: 'Velachery Main Road, Chennai', city: 'Chennai' },
  { name: 'Koramangala Racquet Club', address: '5th Block, Koramangala, Bengaluru', city: 'Bengaluru' },
  { name: 'Gachibowli Sports Village', address: 'Gachibowli, Hyderabad', city: 'Hyderabad' },
  { name: 'Panampilly Courts', address: 'Panampilly Nagar, Kochi', city: 'Kochi' },
  { name: 'Andheri Sports Complex', address: 'Andheri West, Mumbai', city: 'Mumbai' },
]
