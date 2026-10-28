import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { BallLoader } from './BallLoader'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'hq'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'relative inline-flex items-center justify-center gap-2 font-semibold select-none whitespace-nowrap transition-[background,box-shadow,transform,color,border-color] duration-150 ease-standard active:scale-[0.98] disabled:active:scale-100 disabled:cursor-not-allowed focus-visible:outline-none'

/* Brand components: primary (orange, white 16/600, glow, one per screen), secondary (control pill), text, danger. */
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand shadow-glow active:bg-brand-pressed disabled:bg-control disabled:text-fg4 disabled:shadow-none',
  accent: 'bg-brand text-on-brand shadow-glow active:bg-brand-pressed disabled:bg-control disabled:text-fg4 disabled:shadow-none',
  secondary: 'bg-control text-fg hover:bg-divider disabled:text-fg4',
  ghost: 'bg-transparent text-fg2 hover:text-fg disabled:text-fg4',
  danger: 'bg-danger-solid text-fg hover:brightness-110 disabled:bg-control disabled:text-fg4',
  hq: 'bg-hq text-fg hover:brightness-125 disabled:bg-control disabled:text-fg4',
}

const sizes: Record<ButtonSize, string> = {
  // small: 30 tall, radius 8, 13/600; the invisible ::before keeps a 44 px touch target
  sm: "h-[30px] rounded-[8px] px-3 text-[13px] before:absolute before:-inset-y-[7px] before:inset-x-0 before:content-['']",
  md: 'h-11 rounded-[12px] px-4 text-[15px]',
  lg: 'h-[52px] rounded-[12px] px-6 text-[16px]',
}

/** Small primary buttons use the brand's outline style: orange 12% fill, orange 45% stroke, orange label. */
function look(variant: ButtonVariant, size: ButtonSize): string {
  if (size === 'sm' && (variant === 'primary' || variant === 'accent')) return 'bg-brand/12 border border-brand-stroke text-brand-text hover:bg-brand/20 disabled:border-transparent disabled:bg-control disabled:text-fg4'
  if (variant === 'secondary' && size !== 'sm') return cn(variants.secondary, '!rounded-pill')
  return variants[variant]
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  block?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, iconRight, block, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, sizes[size], look(variant, size), block && 'w-full', className)}
      {...rest}
    >
      <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>
        {icon}
        {children}
        {iconRight}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <BallLoader size={size === 'sm' ? 12 : 14} tone={(variant === 'primary' || variant === 'accent') && size !== 'sm' ? 'dark' : 'ball'} />
        </span>
      )}
    </button>
  )
})

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  block,
  className,
  children,
  ...rest
}: LinkProps & { variant?: ButtonVariant; size?: ButtonSize; icon?: ReactNode; iconRight?: ReactNode; block?: boolean }) {
  return (
    <Link className={cn(base, sizes[size], look(variant, size), block && 'w-full', className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </Link>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 'sm' | 'md'
  tone?: 'ghost' | 'secondary'
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', tone = 'ghost', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-pill text-fg2 transition-[background,color,transform] duration-150 hover:bg-s2 hover:text-fg active:scale-95 disabled:text-fg4',
        tone === 'secondary' && 'bg-control',
        size === 'md' ? 'h-11 w-11' : 'h-9 w-9',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
