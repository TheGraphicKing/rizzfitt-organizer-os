import { Compass } from 'lucide-react'
import { ButtonLink } from '../components/ui/Button'
import { SpotIcon } from '../components/ui/Display'

export function NotFound() {
  return (
    <main id="main" className="bg-courtlines floodlight flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <SpotIcon icon={Compass} size={84} />
      <h1 className="t-h1 text-fg">This court is empty</h1>
      <p className="max-w-md text-fg2">The page you were looking for is not here. It may have moved, or the link may be old.</p>
      <ButtonLink to="/events">Go to my events</ButtonLink>
    </main>
  )
}
