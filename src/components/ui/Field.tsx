import { forwardRef, useId, useMemo, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { CircleAlert, ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/cn'
import { InfoTip } from './InfoTip'
import { helpFor } from '../../lib/help'

export function Field({
  label,
  helper,
  error,
  htmlFor,
  children,
  className,
  optional,
  right,
  info,
}: {
  label?: ReactNode
  helper?: ReactNode
  error?: string | null
  htmlFor?: string
  children: ReactNode
  className?: string
  optional?: boolean
  right?: ReactNode
  /** Short plain-words explanation shown behind a small (i) next to the label. */
  info?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-end justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <label htmlFor={htmlFor} className="t-overline text-fg3">
              {label}
              {optional && <span className="ml-1 font-normal normal-case tracking-normal">(optional)</span>}
            </label>
            {(info ?? helpFor(label)) && <InfoTip text={(info ?? helpFor(label))!} label={typeof label === 'string' ? label : undefined} />}
          </span>
          {right}
        </div>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 t-small text-danger" role="alert">
          <CircleAlert size={14} aria-hidden /> {error}
        </p>
      ) : helper ? (
        <p className="t-small text-fg3">{helper}</p>
      ) : null}
    </div>
  )
}

/* Brand field: #2B2B2B fill, radius 12, text 15/400, focus 1px orange + 3px orange 18%, error 1px red. */
export const inputBase =
  'w-full bg-control border border-transparent rounded-[12px] text-[15px] text-fg placeholder:text-fg4 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(243,107,28,0.18)] disabled:text-fg4 disabled:cursor-not-allowed'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: ReactNode
  helper?: ReactNode
  error?: string | null
  prefix?: ReactNode
  suffix?: ReactNode
  optional?: boolean
  inputClassName?: string
  right?: ReactNode
  info?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, error, prefix, suffix, optional, className, inputClassName, id, right, info, ...rest },
  ref,
) {
  const auto = useId()
  const iid = id ?? auto
  return (
    <Field label={label} helper={helper} error={error} htmlFor={iid} className={className} optional={optional} right={right} info={info}>
      <div className="relative flex items-center">
        {prefix && <span className="pointer-events-none absolute left-3.5 text-fg3 tnum">{prefix}</span>}
        <input
          ref={ref}
          id={iid}
          aria-invalid={!!error || undefined}
          className={cn(inputBase, 'h-[52px] px-4', error && 'border-danger-solid', inputClassName)}
          style={{ paddingLeft: prefix ? `${typeof prefix === 'string' ? prefix.length * 9 + 22 : 44}px` : undefined, paddingRight: suffix ? `${typeof suffix === 'string' ? suffix.length * 8 + 22 : 44}px` : undefined }}
          {...rest}
        />
        {suffix && <span className="absolute right-3.5 text-fg3">{suffix}</span>}
      </div>
    </Field>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: ReactNode; helper?: ReactNode; error?: string | null; optional?: boolean; info?: string }>(
  function Textarea({ label, helper, error, className, id, optional, info, ...rest }, ref) {
    const auto = useId()
    const iid = id ?? auto
    return (
      <Field label={label} helper={helper} error={error} htmlFor={iid} className={className} optional={optional} info={info}>
        <textarea ref={ref} id={iid} className={cn(inputBase, 'min-h-[104px] px-4 py-3 leading-[22px]')} aria-invalid={!!error || undefined} {...rest} />
      </Field>
    )
  },
)

export function Select({
  label,
  helper,
  error,
  options,
  className,
  id,
  info,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: ReactNode; helper?: ReactNode; error?: string | null; options: { value: string; label: string }[]; info?: string }) {
  const auto = useId()
  const iid = id ?? auto
  return (
    <Field label={label} helper={helper} error={error} htmlFor={iid} className={className} info={info}>
      <div className="relative">
        <select id={iid} className={cn(inputBase, 'h-[52px] appearance-none pl-4 pr-10')} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-s1">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-fg3" aria-hidden />
      </div>
    </Field>
  )
}

/** Typeahead with a listbox. Keyboard: arrows, Enter, Escape. */
export function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder,
  helper,
  className,
  renderOption,
  info,
}: {
  label?: ReactNode
  info?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; sub?: string }[]
  placeholder?: string
  helper?: ReactNode
  className?: string
  renderOption?: (o: { value: string; label: string; sub?: string }) => ReactNode
}) {
  const id = useId()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = options.find((o) => o.value === value)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (s ? options.filter((o) => (o.label + ' ' + (o.sub ?? '')).toLowerCase().includes(s)) : options).slice(0, 8)
  }, [q, options])
  const commit = (v: string) => {
    onChange(v)
    setQ('')
    setOpen(false)
  }
  return (
    <Field label={label} helper={helper} htmlFor={id} className={className} info={info}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          className={cn(inputBase, 'h-[52px] px-4')}
          placeholder={selected ? selected.label : placeholder}
          value={open ? q : selected?.label ?? q}
          onFocus={() => {
            setOpen(true)
            setQ('')
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(filtered.length - 1, a + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(0, a - 1))
            } else if (e.key === 'Enter' && filtered[active]) {
              e.preventDefault()
              commit(filtered[active].value)
            } else if (e.key === 'Escape') setOpen(false)
          }}
        />
        {open && filtered.length > 0 && (
          <ul id={`${id}-list`} role="listbox" className="absolute z-40 mt-1.5 max-h-72 w-full overflow-auto rounded-[12px] border border-line bg-s2 p-1 shadow-float">
            {filtered.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                onMouseDown={(e) => {
                  e.preventDefault()
                  commit(o.value)
                }}
                onMouseEnter={() => setActive(i)}
                className={cn('flex cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2.5', i === active && 'bg-s3')}
              >
                {renderOption ? (
                  renderOption(o)
                ) : (
                  <span className="flex flex-col">
                    <span className="text-fg">{o.label}</span>
                    {o.sub && <span className="t-small text-fg3">{o.sub}</span>}
                  </span>
                )}
                {o.value === value && <Check size={16} className="text-brand-text" aria-hidden />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  )
}

/** +91 mobile input, 10 digits, grouped 5 + 5. */
export function PhoneInput({ value, onChange, label = 'Mobile number', error, autoFocus, id, helper, info }: { value: string; onChange: (v: string) => void; label?: ReactNode; error?: string | null; autoFocus?: boolean; id?: string; helper?: ReactNode; info?: string }) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  const shown = digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits
  return (
    <Input
      id={id}
      label={label}
      error={error}
      helper={helper}
      info={info}
      prefix="+91"
      inputMode="numeric"
      autoComplete="tel-national"
      autoFocus={autoFocus}
      placeholder="90000 12345"
      value={shown}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
      inputClassName="tnum tracking-wide"
    />
  )
}

/** ₹ price input with Indian grouping on blur. */
export function PriceInput({ value, onChange, label, error, className, suffix, ariaLabel, info }: { value: number; onChange: (v: number) => void; label?: ReactNode; error?: string | null; className?: string; suffix?: string; ariaLabel?: string; info?: string }) {
  const [focus, setFocus] = useState(false)
  const shown = focus ? (value ? String(value) : '') : value ? value.toLocaleString('en-IN') : ''
  return (
    <Input
      label={label}
      info={info}
      aria-label={ariaLabel}
      error={error}
      className={className}
      prefix="₹"
      suffix={suffix}
      inputMode="numeric"
      placeholder="0"
      value={shown}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '').slice(0, 7)) || 0)}
      inputClassName="tnum"
    />
  )
}

/** Six boxes, auto-advance, paste support. */
export function OtpInput({ value, onChange, error, shake }: { value: string; onChange: (v: string) => void; error?: boolean; shake?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const chars = value.padEnd(6, ' ').slice(0, 6).split('')
  return (
    <div className={cn('flex gap-2 sm:gap-3', shake && 'animate-shake')} role="group" aria-label="6 digit code">
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          aria-label={`Digit ${i + 1}`}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          value={c.trim()}
          className={cn(inputBase, 'h-14 w-11 text-center text-[22px] font-bold tnum sm:w-12', error && 'border-danger-solid')}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '')
            if (!d) return
            if (d.length > 1) {
              const next = (value.slice(0, i) + d).slice(0, 6)
              onChange(next)
              refs.current[Math.min(5, next.length)]?.focus()
              return
            }
            const arr = value.padEnd(6, ' ').split('')
            arr[i] = d
            onChange(arr.join('').trimEnd())
            refs.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault()
              const arr = value.padEnd(6, ' ').split('')
              if (arr[i].trim()) arr[i] = ' '
              else if (i > 0) {
                arr[i - 1] = ' '
                refs.current[i - 1]?.focus()
              }
              onChange(arr.join('').trimEnd())
            } else if (e.key === 'ArrowLeft') refs.current[i - 1]?.focus()
            else if (e.key === 'ArrowRight') refs.current[i + 1]?.focus()
          }}
          onPaste={(e) => {
            e.preventDefault()
            const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
            onChange(d)
            refs.current[Math.min(5, d.length)]?.focus()
          }}
        />
      ))}
    </div>
  )
}
