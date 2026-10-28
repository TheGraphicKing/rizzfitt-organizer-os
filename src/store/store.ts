import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { produce, setAutoFreeze } from 'immer'
import type { DemoData, Persona, Quality } from '../mock/types'
import { buildSeed, IDS, SEED_VERSION } from '../mock/seed'

setAutoFreeze(false)

const DATA_KEY = `rizzfitt-demo-data-v${SEED_VERSION}`
const UI_KEY = `rizzfitt-demo-ui-v${SEED_VERSION}`

/* ------------------------------------------------------------------- data */

interface DataStore {
  data: DemoData
}

export const useDemo = create<DataStore>()(
  persist(() => ({ data: buildSeed() }), {
    name: DATA_KEY,
    storage: createJSONStorage(() => localStorage),
    version: SEED_VERSION,
  }),
)

/* ---------------------------------------------------------------------- ui */

export interface UiState {
  persona: Persona
  /** Signed-in organizer for the workspace. */
  organizerId: string | null
  currentEventId: string
  quality: Quality
  /** null follows the OS setting. */
  reducedMotion: boolean | null
  viewAs: { organizerId: string; eventId?: string; mode: 'view' | 'takeover' } | null
  sidebarCollapsed: boolean
  playerMobile: string | null
  set: (patch: Partial<Omit<UiState, 'set'>>) => void
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      persona: 'organizer',
      organizerId: IDS.meera,
      currentEventId: IDS.hero,
      quality: 'auto',
      reducedMotion: null,
      viewAs: null,
      sidebarCollapsed: false,
      playerMobile: null,
      set: (patch) => set(patch),
    }),
    { name: UI_KEY, storage: createJSONStorage(() => localStorage), version: SEED_VERSION },
  ),
)

/* ---------------------------------------------------------- cross-tab sync */

const channel: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('rizzfitt-demo') : null
let rev = 0

function broadcast(data: DemoData) {
  rev++
  try {
    channel?.postMessage({ type: 'data', rev, data })
  } catch {
    // Data too large or not cloneable: other tabs still get the storage event.
  }
}

let revSeq = 0
function nextRev(prev?: number): number {
  revSeq++
  return Math.max((prev ?? 0) + 1, Date.now() * 1000 + (revSeq % 1000))
}
/** Apply another tab's data only if it is newer than ours. */
function applyRemote(data: DemoData) {
  const cur = useDemo.getState().data
  if ((data.rev ?? 0) > (cur.rev ?? 0)) useDemo.setState({ data })
}

if (channel) {
  channel.onmessage = (ev: MessageEvent) => {
    if (ev.data?.type === 'data') applyRemote(ev.data.data as DemoData)
  }
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (ev) => {
    if (ev.key !== DATA_KEY || !ev.newValue) return
    try {
      const parsed = JSON.parse(ev.newValue)
      if (parsed?.state?.data) applyRemote(parsed.state.data as DemoData)
    } catch {
      /* ignore malformed */
    }
  })
}

/** Called when a change is blocked because HQ is viewing a workspace read-only. */
export const guards: { onReadOnly: (() => void) | null } = { onReadOnly: null }

function isReadOnlyNow(): boolean {
  const v = useUi.getState().viewAs
  if (!v || v.mode !== 'view' || typeof window === 'undefined') return false
  const p = window.location.pathname
  return p.startsWith('/e/') || p === '/events' || p === '/account'
}

/** The only way to change demo data. Immer recipe, then persist and sync to other tabs. */
export function mutate(recipe: (d: DemoData) => void): void {
  if (isReadOnlyNow()) {
    guards.onReadOnly?.()
    return
  }
  const next = produce(useDemo.getState().data, (d) => {
    recipe(d)
    d.rev = nextRev(d.rev)
  })
  useDemo.setState({ data: next })
  broadcast(next)
}

export function getData(): DemoData {
  return useDemo.getState().data
}

/** Advance the demo clock a little and return an ISO stamp for new records. */
export function stamp(d: DemoData, seconds = 30): string {
  d.now += seconds * 1000
  return new Date(d.now).toISOString()
}

/** Simulated async: 300 to 900 ms. */
export function fakeDelay(min = 300, max = 900): Promise<void> {
  return new Promise((r) => setTimeout(r, min + Math.random() * (max - min)))
}

let idCounter = 0
export function newId(prefix: string): string {
  idCounter++
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}`
}

export function resetDemo(): void {
  const seed = { ...buildSeed(), rev: nextRev(useDemo.getState().data.rev) }
  useDemo.setState({ data: seed })
  broadcast(seed)
  useUi.getState().set({ persona: 'organizer', organizerId: IDS.meera, currentEventId: IDS.hero, viewAs: null, playerMobile: null })
}
