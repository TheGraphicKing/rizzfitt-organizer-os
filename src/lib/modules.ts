import type { EventItem, ModuleKey } from '../mock/types'

/** Module rules from design/09 section 4. Single function so setup, sidebar and HQ agree. */
export function computeModules(e: Pick<EventItem, 'type' | 'settings' | 'league' | 'social' | 'sponsorsOn'>): ModuleKey[] {
  const m: ModuleKey[] = ['home']
  const t = e.type
  const payments = e.settings.payments.online || e.settings.payments.desk
  const playRounds = e.social?.format === 'play_rounds'
  if (t === 'social') m.push('participants')
  else m.push('registrations', 'people')
  const formation = e.league?.teamFormation
  if (t === 'league' && (formation === 'organizer_assigns' || formation === 'auto_balance' || formation === 'captains_submit')) m.push('team_builder')
  if (t === 'auction' || t === 'draft') m.push('team_builder')
  m.push('launch_kit')
  if (t !== 'social' || playRounds) m.push('schedule')
  if (t !== 'tournament' && t !== 'social' && e.league?.ties) m.push('ties')
  if (t === 'auction') m.push('auction')
  if (t === 'draft') m.push('draft_board')
  if (t !== 'social' || playRounds) m.push('matchday')
  m.push('messages')
  if (t !== 'social') m.push('results')
  if (t === 'social' || payments) m.push('money')
  if (t === 'social' ? e.sponsorsOn : e.sponsorsOn || e.settings.tv.enabled) m.push('sponsors_screens')
  m.push('settings')
  return m
}

export const MODULE_META: Record<ModuleKey, { label: string; path: string; group: 'top' | 'before' | 'during' | 'after' | 'bottom' }> = {
  home: { label: 'Home', path: '', group: 'top' },
  registrations: { label: 'Registrations', path: 'registrations', group: 'before' },
  participants: { label: 'Participants', path: 'participants', group: 'before' },
  people: { label: 'Players & teams', path: 'people', group: 'before' },
  team_builder: { label: 'Team builder', path: 'team-builder', group: 'before' },
  launch_kit: { label: 'Launch kit', path: 'launch-kit', group: 'before' },
  schedule: { label: 'Schedule', path: 'schedule', group: 'during' },
  ties: { label: 'Ties & line-ups', path: 'ties', group: 'during' },
  auction: { label: 'Auction room', path: 'auction', group: 'during' },
  draft_board: { label: 'Draft board', path: 'draft', group: 'during' },
  matchday: { label: 'Match day', path: 'match-day', group: 'during' },
  messages: { label: 'Messages', path: 'messages', group: 'during' },
  results: { label: 'Results', path: 'results', group: 'after' },
  money: { label: 'Money', path: 'money', group: 'after' },
  sponsors_screens: { label: 'Sponsors & screens', path: 'screens', group: 'bottom' },
  settings: { label: 'Settings', path: 'settings', group: 'bottom' },
}

/** What a co-organizer role can open. */
export function roleAllows(role: 'owner' | 'manager' | 'desk' | 'court_captain', mod: ModuleKey): boolean {
  if (role === 'owner') return true
  if (role === 'manager') return mod !== 'money' && mod !== 'settings'
  if (role === 'desk') return mod === 'home' || mod === 'registrations' || mod === 'participants'
  return mod === 'home' || mod === 'matchday'
}
