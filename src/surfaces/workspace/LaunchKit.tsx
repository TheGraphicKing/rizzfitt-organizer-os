import { lazy, Suspense, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, ExternalLink, Mail, MessageCircle, Pencil } from 'lucide-react'
import { useData, useEvent } from '../../store/hooks'
import { categoriesOf } from '../../store/selectors'
import { updateEvent } from '../../store/actions'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { FilterChip, Segmented, Tabs, Toggle } from '../../components/ui/Controls'
import { Input, Textarea } from '../../components/ui/Field'
import { Drawer, toast } from '../../components/ui/Overlay'
import { PageHeader } from './shared'
import { CoverThumb, GroundPicker, PagePreview } from '../setup/Preview'
import { drawPoster, downloadDataUrl, POSTER_HEADLINE, POSTER_SIZES, type PosterTemplate } from '../../lib/poster'
import { fmtRange } from '../../lib/format'
import { onColor } from '../../lib/color'
import { cn } from '../../lib/cn'
import { useSceneMode } from '../../components/3d/perf/quality'
import { TEMPLATES } from './Messages'
import type { PosterStudioHandle } from '../../components/3d/scenes/PosterStudio'

const PosterStudio = lazy(() => import('../../components/3d/scenes/PosterStudio'))

export function LaunchKitPage() {
  const ev = useEvent()
  const [params] = useSearchParams()
  const [tab, setTab] = useState<'page' | 'posters' | 'templates'>((params.get('tab') as 'posters') ?? 'page')
  return (
    <div>
      <PageHeader title="Launch kit" subtitle="Your event page, posters and message templates, ready to share." />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'page', label: 'Event page' }, { value: 'posters', label: 'Posters' }, { value: 'templates', label: 'Message templates' }]} />
      {tab === 'page' && <PageEditor />}
      {tab === 'posters' && <Posters />}
      {tab === 'templates' && <Templates />}
      <span className="sr-only">{ev.name}</span>
    </div>
  )
}

function PageEditor() {
  const ev = useEvent()
  const d = useData()
  const cats = categoriesOf(d, ev.id)
  const [device, setDevice] = useState<'phone' | 'desktop'>('phone')
  const p = ev.settings.page
  const set = (fn: (e: typeof ev) => void) => updateEvent(ev.id, fn)
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card className="flex flex-col gap-5">
        <div>
          <p className="mb-2 t-small text-fg2">Cover style</p>
          <div className="grid grid-cols-3 gap-3">
            {(['court', 'neon', 'clay'] as const).map((c) => (
              <button key={c} type="button" aria-pressed={ev.coverStyle === c} onClick={() => set((e) => (e.coverStyle = c))} className={cn('overflow-hidden rounded-lg border text-left', ev.coverStyle === c ? 'border-brand shadow-[0_0_0_1px_var(--brand)]' : 'border-line')}>
                <CoverThumb style={c} accent={ev.accent} name={ev.name} />
                <span className="block px-3 py-2 text-[13px] font-semibold capitalize text-fg">{c}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 t-small text-fg2">Page ground</p>
          <GroundPicker value={ev.ground ?? 'black'} onChange={(g) => set((e) => (e.ground = g))} />
        </div>
        <Input label="Headline" value={p.headline} placeholder="Two days of the best pickleball in town" onChange={(e) => set((x) => (x.settings.page.headline = e.target.value))} />
        <Textarea label="About" value={p.about} onChange={(e) => set((x) => (x.settings.page.about = e.target.value))} />
        <div className="flex flex-col gap-3">
          <p className="t-small text-fg2">Sections</p>
          {([['categories', 'Categories and prices'], ['schedule', 'Schedule'], ['live', 'Live scores'], ['sponsors', 'Sponsors'], ['faq', 'FAQ']] as const).map(([k, l]) => (
            <Toggle key={k} label={l} checked={p.sections[k]} onChange={(v) => set((x) => (x.settings.page.sections[k] = v))} />
          ))}
        </div>
      </Card>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <Segmented label="Device" value={device} onChange={setDevice} options={[{ value: 'phone', label: 'Phone' }, { value: 'desktop', label: 'Desktop' }]} />
          <a href={`/p/${ev.slug}`} target="_blank" rel="noreferrer" onClick={() => set((e) => (e.setup.pageReviewed = true))} className="inline-flex h-12 items-center gap-2 rounded-md border border-line bg-s2 px-4 font-semibold text-fg hover:bg-s3">
            Open page <ExternalLink size={14} aria-hidden />
          </a>
        </div>
        {device === 'phone' ? (
          <div className="h-[600px] w-[300px] overflow-hidden rounded-[36px] border-[7px] border-s3 bg-canvas">
            <iframe title="Event page preview" src={`/p/${ev.slug}`} className="h-full w-full border-0" onLoad={() => set((e) => (e.setup.pageReviewed = true))} />
          </div>
        ) : (
          <div className="w-full overflow-hidden rounded-lg border-[6px] border-s3 bg-canvas" style={{ aspectRatio: '16/10' }}>
            <div className="h-full origin-top-left" style={{ width: '200%', height: '200%', transform: 'scale(0.5)' }}>
              <iframe title="Event page preview, desktop" src={`/p/${ev.slug}`} className="h-full w-full border-0" />
            </div>
          </div>
        )}
        <div className="sr-only">
          <PagePreview ev={ev} cats={cats} />
        </div>
      </div>
    </div>
  )
}

function Posters() {
  const ev = useEvent()
  const { tier } = useSceneMode()
  const [template, setTemplate] = useState<PosterTemplate>('open')
  const [size, setSize] = useState<keyof typeof POSTER_SIZES>('post')
  const [headline, setHeadline] = useState(POSTER_HEADLINE.open)
  const [sub, setSub] = useState(`${fmtRange(ev.startDate, ev.endDate)} · ${ev.venue.name}`)
  const studio = useRef<PosterStudioHandle>(null)
  const sz = POSTER_SIZES[size]
  const download = () => {
    const bg = studio.current?.capture() ?? null
    const url = drawPoster(ev, { template, headline, sub, w: sz.w, h: sz.h, bg })
    downloadDataUrl(url, `${ev.slug}-${template}-${size}.png`)
    toast.success('Poster downloaded', { body: `${sz.label}, ${sz.w} x ${sz.h} PNG` })
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="flex h-fit flex-col gap-5">
        <div>
          <p className="mb-2 t-small text-fg2">Template</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(POSTER_HEADLINE) as PosterTemplate[]).map((t) => (
              <FilterChip key={t} active={template === t} onClick={() => { setTemplate(t); setHeadline(POSTER_HEADLINE[t]) }}>{POSTER_HEADLINE[t]}</FilterChip>
            ))}
          </div>
        </div>
        <Input label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
        <Input label="Line under the name" value={sub} onChange={(e) => setSub(e.target.value)} />
        <div>
          <p className="mb-2 t-small text-fg2">Size</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(POSTER_SIZES) as (keyof typeof POSTER_SIZES)[]).map((k) => (
              <FilterChip key={k} active={size === k} onClick={() => setSize(k)}>{POSTER_SIZES[k].label}</FilterChip>
            ))}
          </div>
        </div>
        <Button size="lg" icon={<Download size={18} />} onClick={download}>Download PNG</Button>
        <p className="t-small text-fg3">Drag the scene to pick an angle. What you see is what you download.</p>
      </Card>
      <div className="flex justify-center">
        <div className="relative w-full max-w-[460px] overflow-hidden rounded-lg border border-line bg-canvas shadow-float" style={{ aspectRatio: `${sz.w} / ${sz.h}` }}>
          <div className="absolute inset-x-0 top-0 h-[62%]">
            {tier !== 'off' ? (
              <Suspense fallback={null}>
                <PosterStudio ref={studio} className="absolute inset-0" template={template} accent={ev.accent} />
              </Suspense>
            ) : (
              <CoverThumb style="court" accent={ev.accent} name="" fill />
            )}
          </div>
          <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, var(--bg-canvas) 65%)' }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-[8%]">
            <p className="text-[13px] font-bold uppercase tracking-wider" style={{ color: ev.accent }}>{headline}</p>
            <p className="mt-1 text-[30px] font-bold leading-tight text-fg">{ev.name}</p>
            <p className="mt-2 text-[13px] text-fg2">{sub}</p>
            <p className="mt-4 rounded-sm px-3 py-2 text-[12px] font-bold" style={{ background: ev.accent, color: onColor(ev.accent) }}>rizzfitt.com/e/{ev.slug}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Templates() {
  const ev = useEvent()
  const [edit, setEdit] = useState<string | null>(null)
  const [bodies, setBodies] = useState<Record<string, string>>(() => Object.fromEntries(TEMPLATES.filter((t) => t.id !== 'custom').map((t) => [t.id, t.body(ev)])))
  const cur = TEMPLATES.find((t) => t.id === edit)
  return (
    <>
      <ul className="grid gap-3 md:grid-cols-2">
        {TEMPLATES.filter((t) => t.id !== 'custom').map((t) => (
          <li key={t.id} className="card flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-fg">{t.label}</p>
              <span className="flex gap-1 text-fg3"><MessageCircle size={16} aria-label="WhatsApp" /><Mail size={16} aria-label="Email" /></span>
            </div>
            <div className="rounded-lg rounded-tl-sm bg-success-soft p-3 text-[14px] text-fg">{bodies[t.id]}</div>
            <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => setEdit(t.id)} className="self-start">Edit</Button>
          </li>
        ))}
      </ul>
      <Drawer open={!!cur} onClose={() => setEdit(null)} title={cur ? `Edit: ${cur.label}` : ''} footer={<Button onClick={() => { setEdit(null); toast.success('Template saved') }}>Save template</Button>}>
        {cur && (
          <div className="flex flex-col gap-3">
            <Textarea label="Message" value={bodies[cur.id]} onChange={(e) => setBodies({ ...bodies, [cur.id]: e.target.value })} />
            <p className="t-small text-fg3">Use {'{player_name}'}, {'{category}'}, {'{match_time}'} and {'{court}'}; they fill in per player.</p>
          </div>
        )}
      </Drawer>
    </>
  )
}
