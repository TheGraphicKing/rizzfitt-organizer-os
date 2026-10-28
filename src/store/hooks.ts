import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDemo, useUi } from './store'
import type { DemoData, EventItem, MemberRole } from '../mock/types'
import { eventById } from './selectors'

export function useData(): DemoData {
  return useDemo((s) => s.data)
}

/** Event from the :eventId route param; keeps the switcher in step. */
export function useRouteEvent(): EventItem | undefined {
  const { eventId } = useParams()
  const data = useData()
  const ev = eventId ? eventById(data, eventId) : undefined
  const setUi = useUi((s) => s.set)
  const current = useUi((s) => s.currentEventId)
  useEffect(() => {
    if (ev && current !== ev.id) setUi({ currentEventId: ev.id })
  }, [ev, current, setUi])
  return ev
}

/** Must be used under /e/:eventId (WorkspaceLayout guarantees the event exists). */
export function useEvent(): EventItem {
  const ev = useRouteEvent()
  if (!ev) throw new Error('No event in route')
  return ev
}

/** The desk persona is Ananya (mem-3); changing her role in Settings changes what she sees. */
export function useRole(): MemberRole {
  const persona = useUi((s) => s.persona)
  const deskRole = useDemo((s) => s.data.members.find((m) => m.id === 'mem-3')?.role)
  if (persona === 'desk') return deskRole ?? 'desk'
  return 'owner'
}

export function useReadOnly(): boolean {
  const v = useUi((s) => s.viewAs)
  return v?.mode === 'view'
}
