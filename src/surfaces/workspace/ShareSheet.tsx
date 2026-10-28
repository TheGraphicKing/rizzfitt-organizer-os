import { Download, MessageCircle } from 'lucide-react'
import type { EventItem } from '../../mock/types'
import { Drawer, toast } from '../../components/ui/Overlay'
import { Button } from '../../components/ui/Button'
import { CopyButton, QR } from '../../components/ui/Misc'
import { PUBLIC_HOST } from '../../lib/brand'
import { drawPoster, downloadDataUrl } from '../../lib/poster'

export function ShareSheet({ ev, open, onClose, title = 'Share your event' }: { ev: EventItem; open: boolean; onClose: () => void; title?: string }) {
  const url = `https://${PUBLIC_HOST}${ev.slug}`
  return (
    <Drawer open={open} onClose={onClose} title={title} subtitle="Players register from this link.">
      <div className="flex flex-col items-center gap-5">
        <QR value={url} size={180} label={`${PUBLIC_HOST}${ev.slug}`} />
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
          <CopyButton text={url} />
          <Button variant="secondary" icon={<MessageCircle size={16} />} onClick={() => toast.success('WhatsApp share opened', { body: 'Simulated in this prototype.' })}>
            WhatsApp
          </Button>
          <Button
            variant="secondary"
            icon={<Download size={16} />}
            onClick={() => {
              downloadDataUrl(drawPoster(ev, { template: 'open' }), `${ev.slug || 'event'}-poster.png`)
              toast.success('Poster downloaded')
            }}
          >
            Poster
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
