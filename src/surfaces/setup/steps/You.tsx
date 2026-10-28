import { Briefcase, Landmark, Trophy, UserRound } from 'lucide-react'
import { Input, Combobox } from '../../../components/ui/Field'
import { Segmented } from '../../../components/ui/Controls'
import { ChoiceCard, SpotIcon } from '../../../components/ui/Display'
import { CITIES } from '../../../mock/names'
import type { EventItem, SetupState } from '../../../mock/types'
import { updateEvent } from '../../../store/actions'
import { Q, StepTitle } from '../common'

const KINDS: { value: SetupState['orgKind']; label: string; line: string; icon: typeof Trophy }[] = [
  { value: 'club', label: 'Club or academy', line: 'You run a venue or coach players', icon: Trophy },
  { value: 'association', label: 'Association or federation', line: 'District, state or sport body', icon: Landmark },
  { value: 'company', label: 'Company or college', line: 'Corporate games, campus events', icon: Briefcase },
  { value: 'independent', label: 'Independent organizer', line: 'You bring people together', icon: UserRound },
]

/** SW-01: about the organizer. Writes to the event setup and the organizer profile. */
export function YouStep({ ev, compact }: { ev: EventItem; compact?: boolean }) {
  const set = (fn: (s: SetupState) => void) =>
    updateEvent(ev.id, (e, d) => {
      fn(e.setup)
      const o = d.organizers.find((x) => x.id === e.organizerId)
      if (o) {
        o.orgName = e.setup.orgName
        o.city = e.setup.city
        o.orgKind = e.setup.orgKind
        o.eventsPerYear = e.setup.eventsPerYear
        o.instagram = e.setup.instagram || undefined
      }
      if (!e.venue.city) e.venue.city = e.setup.city
    })
  return (
    <div className="flex flex-col gap-8">
      {!compact && <StepTitle title="First, tell us about you." sub="This shows on your event page and helps us set sensible defaults." />}
      <Q title="Your organization">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Organization name" placeholder="Smash Factory Chennai" value={ev.setup.orgName} onChange={(e) => set((s) => (s.orgName = e.target.value))} autoComplete="organization" />
          <Combobox label="City" value={ev.setup.city} onChange={(v) => set((s) => (s.city = v))} options={CITIES.map((c) => ({ value: c, label: c }))} placeholder="Start typing your city" />
        </div>
      </Q>
      <Q title="What best describes you?">
        <div className="grid gap-3 sm:grid-cols-2">
          {KINDS.map((k) => (
            <ChoiceCard key={k.value} layout="row" selected={ev.setup.orgKind === k.value} onSelect={() => set((s) => (s.orgKind = k.value))} title={k.label} description={k.line} media={<SpotIcon icon={k.icon} size={48} float={false} />} />
          ))}
        </div>
      </Q>
      <Q title="How many events do you run a year?">
        <Segmented label="Events a year" value={ev.setup.eventsPerYear} onChange={(v) => set((s) => (s.eventsPerYear = v))} options={[{ value: '1-2', label: '1-2' }, { value: '3-10', label: '3-10' }, { value: '10+', label: '10+' }]} />
      </Q>
      <Q title="Instagram handle" help="Optional. We link it from your event page.">
        <Input aria-label="Instagram handle" prefix="@" placeholder="smashfactory" className="max-w-xs" value={ev.setup.instagram.replace(/^@/, '')} onChange={(e) => set((s) => (s.instagram = e.target.value ? '@' + e.target.value.replace(/^@/, '') : ''))} />
      </Q>
    </div>
  )
}
