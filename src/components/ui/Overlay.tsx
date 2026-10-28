import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, CircleAlert, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from './Button'
import { useReducedMotion } from '../../theme/motion'

/* ------------------------------------------------------------ focus trap */

function useFocusTrap(open: boolean, ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const el = ref.current
    const t = setTimeout(() => {
      const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      first?.focus()
    }, 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key !== 'Tab' || !el) return
      const f = [...el.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null)
      if (!f.length) return
      if (e.shiftKey && document.activeElement === f[0]) {
        e.preventDefault()
        f[f.length - 1].focus()
      } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
        e.preventDefault()
        f[0].focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const ov = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ov
      prev?.focus?.()
    }
  }, [open, ref, onClose])
}

function useIsMobile(bp = 768): boolean {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp)
  useEffect(() => {
    const fn = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [bp])
  return m
}
export { useIsMobile }

/* ------------------------------------------------------------------ dialog */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  tone,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  tone?: 'danger'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const reduced = useReducedMotion()
  useFocusTrap(open, ref, onClose)
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div className="absolute inset-0 bg-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            ref={ref}
            role={tone === 'danger' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby={`${id}-t`}
            aria-describedby={description ? `${id}-d` : undefined}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.3, 0, 0, 1] }}
            className={cn(
              'relative max-h-[92dvh] w-full overflow-auto rounded-t-[24px] border border-line bg-s0 p-6 shadow-sheet sm:rounded-[24px]',
              size === 'sm' ? 'sm:max-w-[440px]' : size === 'md' ? 'sm:max-w-[560px]' : 'sm:max-w-[820px]',
            )}
            style={{ background: 'var(--glass-strong)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={`${id}-t`} className="t-h2 text-fg">
                  {title}
                </h2>
                {description && (
                  <p id={`${id}-d`} className="mt-2 text-fg2">
                    {description}
                  </p>
                )}
              </div>
              <button type="button" aria-label="Close" onClick={onClose} className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-fg3 hover:bg-s2 hover:text-fg">
                <X size={20} />
              </button>
            </div>
            {children && <div className="mt-5">{children}</div>}
            {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ------------------------------------------------------- confirm (promise) */

interface ConfirmOpts {
  title: string
  body: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  typeToConfirm?: string
}
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false)
export const useConfirm = () => useContext(ConfirmCtx)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => {
    setTyped('')
    setBusy(false)
    setState({ ...o, resolve })
  }), [])
  const close = (v: boolean) => {
    state?.resolve(v)
    setState(null)
  }
  const blocked = !!state?.typeToConfirm && typed.trim() !== state.typeToConfirm
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Dialog
        open={!!state}
        onClose={() => close(false)}
        title={state?.title}
        description={state?.body}
        size="sm"
        tone={state?.tone === 'danger' ? 'danger' : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              {state?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              variant={state?.tone === 'danger' ? 'danger' : 'primary'}
              disabled={blocked}
              loading={busy}
              data-autofocus
              onClick={() => {
                setBusy(true)
                setTimeout(() => close(true), 350)
              }}
            >
              {state?.confirmLabel}
            </Button>
          </>
        }
      >
        {state?.typeToConfirm && (
          <label className="flex flex-col gap-1.5">
            <span className="t-small text-fg2">
              Type <strong className="text-fg">{state.typeToConfirm}</strong> to confirm
            </span>
            <input className="h-[52px] w-full rounded-[12px] border border-transparent bg-control px-4 text-fg focus:border-danger-solid focus:outline-none" value={typed} onChange={(e) => setTyped(e.target.value)} />
          </label>
        )}
      </Dialog>
    </ConfirmCtx.Provider>
  )
}

/* ---------------------------------------------------- drawer / bottom sheet */

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 480,
  side = 'right',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number
  side?: 'right' | 'bottom'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mobile = useIsMobile()
  const reduced = useReducedMotion()
  const id = useId()
  useFocusTrap(open, ref, onClose)
  const sheet = mobile || side === 'bottom'
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div className="absolute inset-0 bg-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-t`}
            initial={reduced ? { opacity: 0 } : sheet ? { y: '100%' } : { x: '100%' }}
            animate={reduced ? { opacity: 1 } : sheet ? { y: 0 } : { x: 0 }}
            exit={reduced ? { opacity: 0 } : sheet ? { y: '100%' } : { x: '100%' }}
            transition={{ duration: 0.25, ease: [0.3, 0, 0, 1] }}
            drag={sheet && !reduced ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose()
            }}
            className={cn(
              'absolute flex flex-col border-line bg-s0 shadow-sheet',
              sheet ? 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[24px] border-t' : 'bottom-0 right-0 top-0 border-l',
            )}
            style={sheet ? undefined : { width: `min(${width}px, 100vw)` }}
          >
            {sheet && <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-divider" aria-hidden />}
            <header className="flex items-start justify-between gap-3 border-b border-line-subtle px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 id={`${id}-t`} className="t-h3 text-fg">
                  {title}
                </h2>
                {subtitle && <div className="mt-0.5 t-small text-fg3 font-normal">{subtitle}</div>}
              </div>
              <button type="button" aria-label="Close" onClick={onClose} className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-fg3 hover:bg-s2 hover:text-fg">
                <X size={20} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6" onPointerDownCapture={(e) => e.stopPropagation()}>
              {children}
            </div>
            {footer && <footer className="flex flex-col-reverse gap-2 border-t border-line-subtle px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ------------------------------------------------------------------ toasts */

type ToastKind = 'success' | 'info' | 'warning' | 'error'
interface ToastItem {
  id: number
  kind: ToastKind
  title: string
  body?: string
  undo?: () => void
}
type ToastFn = (title: string, opts?: { body?: string; undo?: () => void }) => void
const listeners = new Set<(t: ToastItem) => void>()
let tid = 0
function push(kind: ToastKind): ToastFn {
  return (title, opts) => {
    tid++
    const t = { id: tid, kind, title, ...opts }
    listeners.forEach((l) => l(t))
  }
}
export const toast = { success: push('success'), info: push('info'), warning: push('warning'), error: push('error') }

const toastIcon = { success: CircleCheck, info: Info, warning: TriangleAlert, error: CircleAlert }
const toastTone = { success: 'text-success', info: 'text-info', warning: 'text-warning', error: 'text-danger' }

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])
  const reduced = useReducedMotion()
  useEffect(() => {
    const l = (t: ToastItem) => {
      setItems((s) => [...s.slice(-3), t])
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), t.undo ? 6000 : 3800)
    }
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return createPortal(
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6 md:right-6 md:left-auto md:items-end">
      <AnimatePresence>
        {items.map((t) => {
          const Icon = toastIcon[t.kind]
          return (
            <motion.div
              key={t.id}
              layout={!reduced}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-[400px] items-start gap-3 rounded-[16px] border border-line bg-s2 px-4 py-3 shadow-float"
            >
              <Icon size={20} className={cn('mt-0.5 shrink-0', toastTone[t.kind])} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-fg">{t.title}</p>
                {t.body && <p className="t-small font-normal text-fg2">{t.body}</p>}
              </div>
              {t.undo && (
                <button
                  type="button"
                  className="h-9 shrink-0 rounded-sm px-2 font-semibold text-brand-text hover:bg-s2"
                  onClick={() => {
                    t.undo?.()
                    setItems((s) => s.filter((x) => x.id !== t.id))
                  }}
                >
                  Undo
                </button>
              )}
              <button type="button" aria-label="Dismiss" className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-fg3 hover:text-fg" onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))}>
                <X size={16} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>,
    document.body,
  )
}

/* ----------------------------------------------------------------- popover */

export function Popover({ trigger, children, align = 'right', className, label }: { trigger: (p: { open: boolean; toggle: () => void }) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right'; className?: string; label?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className={cn('absolute z-[70] mt-2 min-w-[220px] rounded-[12px] border border-line bg-s2 p-1.5 shadow-float', align === 'right' ? 'right-0' : 'left-0', className)}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function MenuItem({ onClick, children, icon, danger, disabled }: { onClick: () => void; children: ReactNode; icon?: ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn('flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-[14px] font-medium transition-colors hover:bg-s3 disabled:opacity-40', danger ? 'text-danger' : 'text-fg')}
    >
      {icon}
      {children}
    </button>
  )
}
