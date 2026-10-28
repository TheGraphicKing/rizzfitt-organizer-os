import { lazy, Suspense, useState } from 'react'
import { Gavel, Layers, Medal, PartyPopper, Shield, Trophy, Volleyball, Goal, Feather, Sparkles, MapPin, type LucideIcon } from 'lucide-react'
import { Input, Combobox, PhoneInput } from '../../../components/ui/Field'
import { useData } from '../../../store/hooks'
import { Segmented } from '../../../components/ui/Controls'
import { ChoiceCard, SpotIcon } from '../../../components/ui/Display'
import { DateRangePicker } from '../../../components/ui/Misc'
import { MOCK_VENUES, SAMPLE_LOGOS, SPORT_META, TYPE_META, typeDisabledReason } from '../../../mock/constants'
import type { EventItem, EventType, Sport } from '../../../mock/types'
import { setEventType, setSport, updateEvent } from '../../../store/actions'
import { NumberStepper, Q, StepTitle } from '../common'
import { useSceneMode } from '../../../components/3d/perf/quality'
import { EventGlyph } from '../../workspace/shared'
import { fmtRange, slugify } from '../../../lib/format'
import { cn } from '../../../lib/cn'
import { PUBLIC_HOST } from '../../../lib/brand'

const PickerStage = lazy(() => import('../../../components/3d/scenes/PickerStage'))

const SPORTS: { value: Sport; icon: LucideIcon }[] = [
  { value: 'pickleball', icon: Volleyball },
  { value: 'badminton', icon: Feather },
  { value: 'cricket', icon: Sparkles },
  { value: 'football', icon: Goal },
  { value: 'multi', icon: Medal },
  { value: 'circuit', icon: Medal },
]
const TYPES: { value: EventType; icon: LucideIcon }[] = [
  { value: 'tournament', icon: Trophy },
  { value: 'league', icon: Shield },
  { value: 'auction', icon: Gavel },
  { value: 'draft', icon: Layers },
  { value: 'social', icon: PartyPopper },
]

/** SW-02: name, sport (S2), event type (S3), dates, venue, courts, logo. */
export function EventStep({ ev, compact }: { ev: EventItem; compact?: boolean }) {
  const { tier } = useSceneMode()
  const [hoverSport, setHoverSport] = useState(-1)
  const [hoverType, setHoverType] = useState(-1)
  const show3d = !compact && tier === 'high'
  const courtWord = SPORT_META[ev.sport].courtWord
  const org = useData().organizers.find((o) => o.id === ev.organizerId)
  const contact = ev.contact ?? { mobile: org?.mobile ?? '', email: org?.email ?? '' }
  const setContact = (fn: (c: NonNullable<EventItem['contact']>) => void) =>
    updateEvent(ev.id, (x) => {
      x.contact = x.contact ?? { ...contact }
      fn(x.contact)
    })
  const sportIdx = SPORTS.findIndex((s) => s.value === ev.sport)
  const typeIdx = TYPES.findIndex((t) => t.value === ev.type)
  const disabledTypes = TYPES.map((t, i) => (typeDisabledReason(ev.sport, t.value) ? i : -1)).filter((i) => i >= 0)
  const set = (fn: (e: EventItem) => void) => updateEvent(ev.id, fn)
  const nameError = ev.name.length > 60 ? 'Keep it under 60 characters' : null
  return (
    <div className="flex flex-col gap-8">
      {!compact && <StepTitle title="Now, the event." sub="Pick your sport and the kind of event. The next steps change to match." />}
      <Q title="Name your event">
        <Input
          aria-label="Event name"
          placeholder="Coimbatore Open 2026"
          value={ev.name}
          onChange={(e) => set((x) => (x.name = e.target.value))}
          error={nameError}
          right={<span className="t-small text-fg3 tnum">{ev.name.length}/60</span>}
          helper={ev.name ? <>Your web address: <span className="text-fg2">{PUBLIC_HOST}{ev.slug || slugify(ev.name)}</span></> : 'Players see this everywhere: page, posters, WhatsApp.'}
        />
      </Q>

      <Q title="Which sport?">
        {show3d && (
          <Suspense fallback={<div className="h-[150px]" />}>
            <PickerStage className="-mx-2 mb-2 hidden h-[150px] md:block" kinds={SPORTS.map((s) => s.value)} selected={sportIdx} hovered={hoverSport} fallback={null} />
          </Suspense>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SPORTS.map((s, i) => (
            <div key={s.value} onPointerEnter={() => setHoverSport(i)} onPointerLeave={() => setHoverSport(-1)}>
              <ChoiceCard
                selected={ev.sport === s.value}
                onSelect={() => setSport(ev.id, s.value)}
                title={SPORT_META[s.value].label}
                description={SPORT_META[s.value].line}
                media={show3d ? undefined : <SpotIcon icon={s.icon} size={44} float={false} />}
                className="h-full"
              />
            </div>
          ))}
        </div>
      </Q>

      <Q title="What kind of event?">
        {show3d && (
          <Suspense fallback={<div className="h-[150px]" />}>
            <PickerStage className="-mx-2 mb-2 hidden h-[150px] md:block" kinds={TYPES.map((t) => t.value)} selected={typeIdx} hovered={hoverType} disabled={disabledTypes} fallback={null} />
          </Suspense>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TYPES.map((t, i) => {
            const reason = typeDisabledReason(ev.sport, t.value)
            return (
              <div key={t.value} onPointerEnter={() => setHoverType(i)} onPointerLeave={() => setHoverType(-1)}>
                <ChoiceCard
                  selected={ev.type === t.value}
                  onSelect={() => setEventType(ev.id, t.value)}
                  title={TYPE_META[t.value].label}
                  description={TYPE_META[t.value].line}
                  disabled={!!reason}
                  disabledReason={reason ?? undefined}
                  media={show3d ? undefined : <SpotIcon icon={t.icon} size={44} float={false} />}
                  className="h-full"
                />
              </div>
            )
          })}
        </div>
      </Q>

      <Q title="When is it?" help={fmtRange(ev.startDate, ev.endDate)}>
        <div className="grid gap-4 md:grid-cols-[1fr_200px]">
          <DateRangePicker
            start={ev.startDate}
            end={ev.endDate}
            onChange={(s, e) =>
              set((x) => {
                x.startDate = `${s}T${x.setup.startTime}:00+05:30`
                x.endDate = `${e}T20:00:00+05:30`
              })
            }
          />
          <Input
            label="First match"
            type="time"
            value={ev.setup.startTime}
            onChange={(e) =>
              set((x) => {
                x.setup.startTime = e.target.value
                x.startDate = `${x.startDate.slice(0, 10)}T${e.target.value}:00+05:30`
              })
            }
          />
        </div>
      </Q>

      <Q title="Where?">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="flex flex-col gap-3">
            <Combobox
              label="Venue"
              placeholder="Search venues"
              value={ev.venue.name}
              onChange={(v) =>
                set((x) => {
                  const m = MOCK_VENUES.find((mv) => mv.name === v)
                  x.venue.name = v
                  if (m) {
                    x.venue.address = m.address
                    x.venue.city = m.city
                  }
                  x.setup.venueChosen = true
                })
              }
              options={MOCK_VENUES.map((v) => ({ value: v.name, label: v.name, sub: v.address }))}
              helper={ev.venue.address || 'Pick a suggestion, or type the venue name.'}
            />
            <Segmented label="Indoor or outdoor" value={ev.venue.indoor ? 'in' : 'out'} onChange={(v) => set((x) => (x.venue.indoor = v === 'in'))} options={[{ value: 'out', label: 'Outdoor' }, { value: 'in', label: 'Indoor' }]} />
          </div>
          <MapThumb label={ev.venue.name || 'No venue yet'} />
        </div>
      </Q>

      <Q title={`How many ${courtWord.toLowerCase()}?`} info="We plan matches across this many at once. More courts means a shorter day. You can name each one later.">
        <div className="flex flex-wrap items-center gap-5">
          <NumberStepper label={courtWord.toLowerCase()} value={ev.courts} min={1} max={40} onChange={(n) => set((x) => (x.courts = n))} />
          <div className="flex flex-wrap gap-1.5" aria-hidden>
            {Array.from({ length: Math.min(ev.courts, 16) }, (_, i) => (
              <span key={i} className="relative h-9 w-5 rounded-[3px] border border-brand/70 bg-court">
                <span className="absolute inset-x-0 top-1/2 h-px bg-court-line" />
              </span>
            ))}
            {ev.courts > 16 && <span className="self-center t-small text-fg3">+{ev.courts - 16}</span>}
          </div>
        </div>
      </Q>

      <Q title="Logo" help="Optional. Pick a sample for now; you can upload your own later.">
        <div className="flex flex-wrap gap-3">
          {SAMPLE_LOGOS.map((l, i) => (
            <button
              key={l.label}
              type="button"
              aria-pressed={ev.logo === i}
              aria-label={l.label}
              onClick={() => set((x) => (x.logo = x.logo === i ? null : i))}
              className={cn('rounded-lg border p-2 transition-colors', ev.logo === i ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong')}
            >
              <EventGlyph ev={{ logo: i, name: ev.name, accent: ev.accent }} size={48} />
            </button>
          ))}
          <button type="button" onClick={() => set((x) => (x.logo = null))} aria-pressed={ev.logo === null} className={cn('flex h-[66px] items-center rounded-lg border px-4 text-[14px] font-semibold', ev.logo === null ? 'border-brand bg-brand-soft text-fg' : 'border-line text-fg2')}>
            Use initials
          </button>
        </div>
      </Q>

      <Q title="Event contact" help="Prefilled from your profile. Change it if someone else answers player questions.">
        <div className="grid gap-4 md:grid-cols-2">
          <PhoneInput label="Contact mobile" value={contact.mobile} onChange={(v) => setContact((c) => (c.mobile = v))} error={contact.mobile.replace(/\D/g, '').length > 0 && contact.mobile.replace(/\D/g, '').length < 10 ? 'Enter a 10-digit mobile number' : null} />
          <Input label="Contact email" type="email" value={contact.email} onChange={(e) => setContact((c) => (c.email = e.target.value))} error={contact.email && !/^\S+@\S+\.\S+$/.test(contact.email) ? 'Check the email address' : null} />
          <Input label="Club ID" optional placeholder="RZ-CBE-0042" value={contact.clubId ?? ''} onChange={(e) => setContact((c) => (c.clubId = e.target.value || undefined))} />
        </div>
      </Q>
    </div>
  )
}

/** Static styled map (no network). */
function MapThumb({ label }: { label: string }) {
  return (
    <div className="relative h-[160px] overflow-hidden rounded-lg border border-line bg-s2" role="img" aria-label={`Map of ${label}`}>
      <svg viewBox="0 0 220 160" className="h-full w-full" aria-hidden>
        <rect width="220" height="160" fill="var(--surface-2)" />
        <path d="M0 110 C60 90 120 130 220 100" stroke="var(--surface-3)" strokeWidth="14" fill="none" />
        <path d="M70 0 L90 160" stroke="var(--surface-3)" strokeWidth="10" />
        <path d="M150 0 C140 60 170 100 160 160" stroke="var(--surface-3)" strokeWidth="8" fill="none" />
        <rect x="100" y="40" width="34" height="24" rx="3" fill="var(--court-surface)" />
        <rect x="20" y="20" width="30" height="18" rx="3" fill="var(--surface-3)" />
      </svg>
      <MapPin className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-full text-brand" size={30} fill="var(--brand)" stroke="var(--ink)" aria-hidden />
      <span className="glass absolute inset-x-2 bottom-2 truncate rounded-md px-2 py-1 text-[12px] font-semibold text-fg">{label}</span>
    </div>
  )
}
