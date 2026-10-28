import { useMemo, useState, type ReactNode, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Columns3, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Checkbox } from './Controls'
import { Popover } from './Overlay'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  /** Shown in the Columns picker but hidden by default. */
  optional?: boolean
  width?: string
  align?: 'left' | 'right'
  /** Label + value pair for the mobile card. */
  mobile?: boolean
  sortValue?: (row: T) => string | number
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  selectable,
  selected,
  onSelectedChange,
  bulkActions,
  mobileTitle,
  mobileAside,
  empty,
  onRowKeyDown,
  rowClassName,
  caption,
  maxHeight = '70vh',
}: {
  rows: T[]
  columns: Column<T>[]
  rowKey: (r: T) => string
  onRowClick?: (r: T) => void
  selectable?: boolean
  selected?: Set<string>
  onSelectedChange?: (s: Set<string>) => void
  bulkActions?: ReactNode
  mobileTitle: (r: T) => ReactNode
  mobileAside?: (r: T) => ReactNode
  empty?: ReactNode
  onRowKeyDown?: (r: T, e: KeyboardEvent) => void
  rowClassName?: (r: T) => string | undefined
  caption: string
  maxHeight?: string
}) {
  const [visible, setVisible] = useState<Set<string>>(() => new Set(columns.filter((c) => !c.optional).map((c) => c.key)))
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)
  const cols = columns.filter((c) => visible.has(c.key))
  const sel = selected ?? new Set<string>()
  const sorted = useMemo(() => {
    if (!sort) return rows
    const c = columns.find((x) => x.key === sort.key)
    if (!c?.sortValue) return rows
    return [...rows].sort((a, b) => {
      const va = c.sortValue!(a)
      const vb = c.sortValue!(b)
      return (va > vb ? 1 : va < vb ? -1 : 0) * sort.dir
    })
  }, [rows, sort, columns])
  const allOn = rows.length > 0 && rows.every((r) => sel.has(rowKey(r)))
  const someOn = rows.some((r) => sel.has(rowKey(r)))
  const toggle = (k: string) => {
    const n = new Set(sel)
    if (n.has(k)) n.delete(k)
    else n.add(k)
    onSelectedChange?.(n)
  }
  return (
    <div className="relative">
      <div className="mb-2 flex justify-end">
        <Popover
          label="Columns"
          trigger={({ toggle: t, open }) => (
            <button type="button" onClick={t} aria-expanded={open} className="hidden h-[30px] items-center gap-2 rounded-[8px] bg-control px-3 text-[13px] font-semibold text-fg2 hover:text-fg md:inline-flex">
              <Columns3 size={16} aria-hidden /> Columns
            </button>
          )}
        >
          {() => (
            <div className="max-h-80 w-64 overflow-auto p-2">
              <p className="px-1 pb-2 t-overline text-fg3">Show columns</p>
              {columns.map((c) => (
                <Checkbox
                  key={c.key}
                  className="px-1 py-1.5"
                  checked={visible.has(c.key)}
                  onChange={(v) => {
                    const n = new Set(visible)
                    if (v) n.add(c.key)
                    else n.delete(c.key)
                    setVisible(n)
                  }}
                  label={c.header}
                />
              ))}
            </div>
          )}
        </Popover>
      </div>

      {/* desktop table */}
      <div className="card hidden overflow-auto md:block" style={{ maxHeight }}>
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-10 bg-s0">
            <tr className="border-b border-line-subtle">
              {selectable && (
                <th className="w-12 px-4">
                  <Checkbox
                    label={<span className="sr-only">Select all</span>}
                    checked={allOn}
                    indeterminate={!allOn && someOn}
                    onChange={() => onSelectedChange?.(allOn ? new Set() : new Set(rows.map(rowKey)))}
                  />
                </th>
              )}
              {cols.map((c) => (
                <th key={c.key} scope="col" className={cn('h-12 whitespace-nowrap px-4 t-overline text-fg3', c.align === 'right' && 'text-right')} style={{ width: c.width }}>
                  {c.sortValue ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 uppercase hover:text-fg2"
                      onClick={() => setSort((s) => (s?.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))}
                      aria-sort={sort?.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
                    >
                      {c.header}
                      {sort?.key === c.key && <span aria-hidden>{sort.dir === 1 ? '↑' : '↓'}</span>}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const k = rowKey(r)
              const isSel = sel.has(k)
              return (
                <tr
                  key={k}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(r)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onRowClick?.(r)
                    onRowKeyDown?.(r, e)
                  }}
                  className={cn(
                    'relative h-16 border-b border-line-subtle transition-colors last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-s2 focus-visible:bg-s2',
                    isSel && 'bg-brand-soft shadow-[inset_3px_0_0_var(--brand)]',
                    rowClassName?.(r),
                  )}
                >
                  {selectable && (
                    <td className="w-12 px-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox label={<span className="sr-only">Select row</span>} checked={isSel} onChange={() => toggle(k)} />
                    </td>
                  )}
                  {cols.map((c) => (
                    <td key={c.key} className={cn('px-4 py-2 align-middle text-[14px] text-fg2', c.align === 'right' && 'text-right tnum')}>
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && empty}
      </div>

      {/* mobile cards */}
      <ul className="flex flex-col gap-2 md:hidden" aria-label={caption}>
        {sorted.map((r) => {
          const k = rowKey(r)
          const isSel = sel.has(k)
          return (
            <li key={k} className={cn('card flex flex-col gap-2 p-4', isSel && 'border-brand', rowClassName?.(r))}>
              <div className="flex items-start gap-3">
                {selectable && <Checkbox label={<span className="sr-only">Select</span>} checked={isSel} onChange={() => toggle(k)} />}
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onRowClick?.(r)}>
                  {mobileTitle(r)}
                </button>
                {mobileAside?.(r)}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {cols
                  .filter((c) => c.mobile)
                  .map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="t-overline text-fg4">{c.header}</dt>
                      <dd className="truncate text-[14px] text-fg2">{c.cell(r)}</dd>
                    </div>
                  ))}
              </dl>
            </li>
          )
        })}
        {rows.length === 0 && empty}
      </ul>

      <AnimatePresence>
        {selectable && sel.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            className="fixed inset-x-3 bottom-20 z-[60] mx-auto flex max-w-[760px] flex-wrap items-center gap-2 rounded-[16px] border border-line bg-s2 px-4 py-3 shadow-float md:bottom-6"
            role="toolbar"
            aria-label="Bulk actions"
          >
            <span className="mr-auto font-semibold text-fg tnum">{sel.size} selected</span>
            {bulkActions}
            <button type="button" aria-label="Clear selection" onClick={() => onSelectedChange?.(new Set())} className="flex h-10 w-10 items-center justify-center rounded-md text-fg3 hover:bg-s3 hover:text-fg">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
