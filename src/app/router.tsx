import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Root } from './Root'
import { PageLoader } from '../components/ui/BallLoader'
import { NotFound } from './NotFound'

/** Lazy page with its own Suspense so every surface is code split. */
function L<T extends Record<string, unknown>>(loader: () => Promise<T>, name: keyof T) {
  const C = lazy(async () => ({ default: (await loader())[name] as ComponentType }))
  return (
    <Suspense fallback={<PageLoader />}>
      <C />
    </Suspense>
  )
}

const ws = () => import('../surfaces/workspace')
const mk = () => import('../surfaces/marketing')
const st = () => import('../surfaces/setup')
const ms = () => import('../surfaces/microsite')
const hq = () => import('../surfaces/hq')

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: L(mk, 'Landing') },
      { path: '/start', element: L(mk, 'SignIn') },
      { path: '/start/invite/:token', element: L(mk, 'SignIn') },

      { path: '/setup/:draftId', element: <Navigate to="you" replace /> },
      { path: '/setup/:draftId/building', element: L(st, 'Building') },
      { path: '/setup/:draftId/:step', element: L(st, 'SetupShell') },

      { path: '/events', element: L(ws, 'EventsPage') },
      { path: '/account', element: L(ws, 'AccountPage') },
      {
        path: '/e/:eventId',
        element: L(ws, 'WorkspaceLayout'),
        children: [
          { index: true, element: L(ws, 'HomePage') },
          { path: 'registrations', element: L(ws, 'RegistrationsPage') },
          { path: 'participants', element: L(ws, 'ParticipantsPage') },
          { path: 'people', element: L(ws, 'PeoplePage') },
          { path: 'team-builder', element: L(ws, 'TeamBuilderPage') },
          { path: 'schedule', element: L(ws, 'ScheduleOverviewPage') },
          { path: 'schedule/courts', element: L(ws, 'CourtsTimesPage') },
          { path: 'schedule/publish', element: L(ws, 'PublishPage') },
          { path: 'schedule/:catId/draw', element: L(ws, 'DrawPage') },
          { path: 'schedule/:catId/matches', element: L(ws, 'MatchesPage') },
          { path: 'ties', element: L(ws, 'TiesPage') },
          { path: 'auction', element: L(ws, 'AuctionPage') },
          { path: 'draft', element: L(ws, 'DraftPage') },
          { path: 'match-day', element: L(ws, 'MatchDayPage') },
          { path: 'messages', element: L(ws, 'MessagesPage') },
          { path: 'results', element: L(ws, 'ResultsPage') },
          { path: 'money', element: L(ws, 'MoneyPage') },
          { path: 'screens', element: L(ws, 'ScreensPage') },
          { path: 'launch-kit', element: L(ws, 'LaunchKitPage') },
          { path: 'settings', element: L(ws, 'SettingsPage') },
        ],
      },

      {
        path: '/p/:slug',
        element: L(ms, 'MicrositeLayout'),
        children: [
          { index: true, element: L(ms, 'EventHome') },
          { path: 'register', element: L(ms, 'RegisterFlow') },
          { path: 'live', element: L(ms, 'LivePage') },
          { path: 'me', element: L(ms, 'LivePage') },
        ],
      },

      { path: '/u/:courtToken', element: L(() => import('../surfaces/umpire'), 'UmpireApp') },
      { path: '/tv/:eventId/:court', element: L(() => import('../surfaces/tv'), 'CourtTv') },

      {
        path: '/hq',
        element: L(hq, 'HqLayout'),
        children: [
          { index: true, element: L(hq, 'HqOverview') },
          { path: 'approvals', element: L(hq, 'HqApprovals') },
          { path: 'organizers', element: L(hq, 'HqOrganizers') },
          { path: 'organizers/:orgId', element: L(hq, 'HqOrganizerDetail') },
          { path: 'events', element: L(hq, 'HqEvents') },
          { path: 'platform', element: L(hq, 'HqPlatform') },
          { path: 'whats-new', element: L(hq, 'HqWhatsNew') },
        ],
      },

      { path: '/lab/ui', element: L(() => import('../surfaces/lab/LabUi'), 'LabUi') },
      { path: '/lab/3d', element: L(() => import('../surfaces/lab/Lab3d'), 'Lab3d') },
      { path: '*', element: <NotFound /> },
    ],
  },
])
