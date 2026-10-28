import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * Small (i) next to a question. Hover or focus shows a one or two line explanation; tap toggles it on phones.
 * Kept quiet (secondary grey, 14 px) so it never competes with the question itself.
 */
export function InfoTip({ text, label, className }: { text: string; label?: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number; w: number; above: boolean } | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const id = useId()
  const show = open || pinned
  useLayoutEffect(() => {
    if (!show || !btn.current) return
    const r = btn.current.getBoundingClientRect()
    const above = r.top > 140
    const vw = window.innerWidth
    const w = Math.min(280, vw - 32)
    // keep the whole bubble on screen: start near the icon, clamp to 16 px from each edge
    const x = Math.min(vw - 16 - w, Math.max(16, r.left + r.width / 2 - 24))
    setPos({ x, y: above ? r.top - 8 : r.bottom + 8, w, above })
  }, [show])
  useEffect(() => {
    if (!pinned) return
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      if (e instanceof MouseEvent && btn.current?.contains(e.target as Node)) return
      setPinned(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [pinned])
  return (
    <>
      <button
        ref={btn}
        type="button"
        // The name stays generic so it never collides with the field's own label; the help text is the description.
        aria-label="More info"
        aria-describedby={`${id}-d`}
        data-for={label}
        aria-expanded={show}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setPinned((p) => !p)
        }}
        className={cn('relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full align-middle text-fg3 transition-colors duration-150 hover:text-fg before:absolute before:-inset-3 before:content-[""]', show && 'text-fg', className)}
      >
        <Info size={14} strokeWidth={2} aria-hidden />
        <span id={`${id}-d`} className="sr-only">
          {text}
        </span>
      </button>
      {show &&
        pos &&
        createPortal(
          <span
            role="tooltip"
            aria-hidden
            className="pointer-events-none fixed z-[200] w-max rounded-[12px] border border-line-strong bg-s2 px-3 py-2 text-[13px] font-normal normal-case leading-[18px] tracking-normal text-fg shadow-float"
            style={{ left: pos.x, top: pos.y, maxWidth: pos.w, transform: pos.above ? 'translateY(-100%)' : undefined }}
          >
            {text}
          </span>,
          document.body,
        )}
    </>
  )
}
