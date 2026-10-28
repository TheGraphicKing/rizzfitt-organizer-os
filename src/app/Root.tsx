import { Outlet, ScrollRestoration } from 'react-router-dom'
import { ConfirmProvider, Toaster } from '../components/ui/Overlay'
import { PrototypeSwitcher } from './PrototypeSwitcher'
import { CommandPalette } from './CommandPalette'

/** Wraps every route: confirm dialogs, toasts, the Demo switcher and the command palette. */
export function Root() {
  return (
    <ConfirmProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand">
        Skip to content
      </a>
      <Outlet />
      <PrototypeSwitcher />
      <CommandPalette />
      <Toaster />
      <ScrollRestoration />
    </ConfirmProvider>
  )
}
