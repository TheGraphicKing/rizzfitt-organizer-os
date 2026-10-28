import { useEffect, useRef, useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ExternalLink, GripVertical, Image, Plus, Trash, Tv, Video } from 'lucide-react'
import { useData, useEvent } from '../../store/hooks'
import { removeMedia, removeSponsor, reorderSponsors, updateTv, upsertMedia, upsertSponsor } from '../../store/miscActions'
import { updateEvent } from '../../store/actions'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { FilterChip, Segmented, Toggle, StatusChip } from '../../components/ui/Controls'
import { Input, Select } from '../../components/ui/Field'
import { EmptyState } from '../../components/ui/Display'
import { toast, useConfirm, Dialog } from '../../components/ui/Overlay'
import { CopyButton, QR } from '../../components/ui/Misc'
import { PageHeader } from './shared'
import { TvThumb } from '../setup/steps/MatchDayLookReview'
import { CATEGORICAL } from '../../mock/constants'
import { cn } from '../../lib/cn'
import type { Sponsor, TvSettings } from '../../mock/types'

export function ScreensPage() {
  const ev = useEvent()
  const d = useData()
  const confirm = useConfirm()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const sponsors = d.sponsors.filter((s) => s.eventId === ev.id).sort((a, b) => a.order - b.order)
  const media = d.media.filter((m) => m.eventId === ev.id).sort((a, b) => a.order - b.order)
  const tv = ev.settings.tv
  const [court, setCourt] = useState<string>('1')
  const [add, setAdd] = useState(false)
  const [sp, setSp] = useState({ name: '', tier: 'gold' as Sponsor['tier'] })
  const url = `/tv/${ev.id}/${court}`
  const onEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const ids = sponsors.map((s) => s.id)
    reorderSponsors(arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id))))
  }
  return (
    <div>
      <PageHeader title="Sponsors & screens" subtitle="Logos on court screens, posters and your event page." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Sponsors" subtitle="Drag to set the order they appear in." action={<Button size="sm" icon={<Plus size={14} />} onClick={() => setAdd(true)}>Add sponsor</Button>} />
            {sponsors.length === 0 ? (
              <EmptyState compact icon={Tv} title="Show off your sponsors" help="Add logos to show on court screens and your event page." action={<Button onClick={() => setAdd(true)}>Add sponsor</Button>} />
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
                <SortableContext items={sponsors.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <ul className="flex flex-col gap-2">
                    {sponsors.map((s) => (
                      <SponsorRow
                        key={s.id}
                        s={s}
                        onChange={(patch) => upsertSponsor({ ...s, ...patch })}
                        onRemove={async () => {
                          if (await confirm({ title: `Remove ${s.name}?`, body: 'Their logo disappears from screens, posters and your page.', confirmLabel: 'Remove sponsor', tone: 'danger' })) {
                            removeSponsor(s.id)
                            toast.success('Sponsor removed')
                          }
                        }}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </Card>
          <Card>
            <CardHeader title="Media playlist" subtitle="Plays on screens between matches." action={<Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => { upsertMedia({ id: `md-${d.now}`, eventId: ev.id, kind: 'image', title: 'New image', seconds: 10, order: media.length + 1, active: true }); toast.success('Sample image added') }}>Add media</Button>} />
            <ul className="flex flex-col gap-2">
              {media.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-md border border-line-subtle bg-s1 px-3 py-2">
                  {m.kind === 'image' ? <Image size={18} className="text-fg3" aria-hidden /> : <Video size={18} className="text-fg3" aria-hidden />}
                  <span className="min-w-0 flex-1 truncate text-fg">{m.title}</span>
                  <select aria-label={`${m.title} duration`} value={m.seconds} onChange={(e) => upsertMedia({ ...m, seconds: Number(e.target.value) })} className="h-9 rounded-md border border-line bg-s2 px-2 text-fg">
                    {[5, 8, 10, 15, 30, 60].map((n) => <option key={n} value={n}>{n} s</option>)}
                  </select>
                  <Toggle hideLabel label={`${m.title} active`} checked={m.active} onChange={(v) => upsertMedia({ ...m, active: v })} />
                  <button type="button" aria-label={`Remove ${m.title}`} onClick={() => removeMedia(m.id)} className="flex h-9 w-9 items-center justify-center text-fg3 hover:text-danger"><Trash size={16} /></button>
                </li>
              ))}
              {!media.length && <li className="t-small text-fg3">No media yet.</li>}
            </ul>
          </Card>
        </div>
        <Card>
          <CardHeader title="Court TV designer" subtitle={tv.enabled ? 'Changes show on every screen instantly.' : 'Court TV is off for this event.'} action={<Toggle hideLabel label="Court TV on" checked={tv.enabled} onChange={(v) => updateEvent(ev.id, (e) => (e.settings.tv.enabled = v))} />} />
          {tv.enabled ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <Select label="Screen" className="w-48" value={court} onChange={(e) => setCourt(e.target.value)} options={[...Array.from({ length: ev.courts }, (_, i) => ({ value: String(i + 1), label: `Court ${i + 1}` })), { value: 'all', label: 'All courts' }]} />
              </div>
              <TvPreview src={url} />
              <div className="grid grid-cols-3 gap-3">
                {(['arena', 'glass', 'minimal'] as const).map((t) => (
                  <button key={t} type="button" aria-pressed={tv.template === t} onClick={() => updateTv(ev.id, { template: t })} className={cn('overflow-hidden rounded-lg border text-left', tv.template === t ? 'border-brand shadow-[0_0_0_1px_var(--brand)]' : 'border-line hover:border-line-strong')}>
                    <TvThumb template={t} accent={ev.accent} />
                    <span className="block px-3 py-2 text-[13px] font-semibold capitalize text-fg">{t}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {([['showScore', 'Live score'], ['showUpNext', 'Up next'], ['showSponsors', 'Sponsors'], ['showBracket', 'Bracket'], ['showPlayerCards', 'Player cards']] as const).map(([k, l]) => (
                  <FilterChip key={k} active={tv[k]} onClick={() => updateTv(ev.id, { [k]: !tv[k] } as Partial<TvSettings>)}>{l}</FilterChip>
                ))}
              </div>
              <p className="t-small text-fg3">Colours follow your event colour. Change it in Launch kit or Settings.</p>
              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-line-subtle bg-s1 p-4">
                <QR value={`https://rizzfitt.com${url}`} size={96} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-fg">Open on a screen</p>
                  <p className="truncate t-small text-fg3">rizzfitt.com{url}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <CopyButton size="sm" text={`https://rizzfitt.com${url}`} />
                    <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold text-brand-text hover:bg-brand-soft">Open <ExternalLink size={12} aria-hidden /></a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState compact icon={Tv} title="Screens are off" help="Turn on Court TV to show live scores on any TV at the venue." action={<Button onClick={() => updateEvent(ev.id, (e) => (e.settings.tv.enabled = true))}>Turn on Court TV</Button>} />
          )}
        </Card>
      </div>
      <Dialog
        open={add}
        onClose={() => setAdd(false)}
        title="Add a sponsor"
        footer={<><Button variant="secondary" onClick={() => setAdd(false)}>Cancel</Button><Button disabled={sp.name.trim().length < 2} onClick={() => { upsertSponsor({ id: `sp-${ev.id}-${d.now}`, eventId: ev.id, name: sp.name.trim(), tier: sp.tier, logoText: sp.name.trim().toUpperCase().slice(0, 14), color: CATEGORICAL[(sponsors.length + 2) % 8], order: sponsors.length + 1, active: true }); updateEvent(ev.id, () => {}); setAdd(false); setSp({ name: '', tier: 'gold' }); toast.success('Sponsor added') }}>Add sponsor</Button></>}
      >
        <div className="flex flex-col gap-4">
          <Input label="Sponsor name" value={sp.name} onChange={(e) => setSp({ ...sp, name: e.target.value })} />
          <Segmented label="Tier" value={sp.tier} onChange={(t) => setSp({ ...sp, tier: t })} options={[{ value: 'title', label: 'Title' }, { value: 'gold', label: 'Gold' }, { value: 'partner', label: 'Partner' }]} />
          <p className="t-small text-fg3">In this prototype the logo is drawn as text in the sponsor colour.</p>
        </div>
      </Dialog>
    </div>
  )
}

function SponsorRow({ s, onChange, onRemove }: { s: Sponsor; onChange: (p: Partial<Sponsor>) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id })
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('flex flex-wrap items-center gap-3 rounded-md border border-line-subtle bg-s1 px-2 py-2', isDragging && 'z-10 border-brand shadow-float')}>
      <button type="button" aria-label={`Drag ${s.name}`} className="flex h-10 w-8 cursor-grab items-center justify-center text-fg3" {...attributes} {...listeners}><GripVertical size={16} /></button>
      <span className="rounded-sm px-2 py-1 text-[11px] font-bold tracking-wider text-on-brand" style={{ background: s.color }}>{s.logoText}</span>
      <span className="min-w-0 flex-1 truncate font-semibold text-fg">{s.name}</span>
      <select aria-label={`${s.name} tier`} value={s.tier} onChange={(e) => onChange({ tier: e.target.value as Sponsor['tier'] })} className="h-9 rounded-md border border-line bg-s2 px-2 text-fg">
        <option value="title">Title</option><option value="gold">Gold</option><option value="partner">Partner</option>
      </select>
      {!s.active && <StatusChip tone="neutral">Hidden</StatusChip>}
      <Toggle hideLabel label={`${s.name} active`} checked={s.active} onChange={(v) => onChange({ active: v })} />
      <button type="button" aria-label={`Remove ${s.name}`} onClick={onRemove} className="flex h-9 w-9 items-center justify-center text-fg3 hover:text-danger"><Trash size={16} /></button>
    </li>
  )
}

/** Live T-01 in a scaled frame (same origin, so it follows the shared store). */
export function TvPreview({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(640)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const scale = w / 1920
  return (
    <div ref={ref} className="relative w-full overflow-hidden rounded-lg border-[6px] border-s3 bg-canvas" style={{ aspectRatio: '16 / 9' }}>
      <iframe title="Court TV preview" src={src} className="pointer-events-none absolute left-0 top-0 origin-top-left border-0" style={{ width: 1920, height: 1080, transform: `scale(${scale})` }} tabIndex={-1} />
    </div>
  )
}
