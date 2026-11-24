import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, Check, Info, X } from 'lucide-react'
import { cx } from '../lib/cx'

/* ============================ Toast ============================ */

type ToastTone = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  msg: string
  tone: ToastTone
}

interface ToastApi {
  show: (msg: string, tone?: ToastTone) => void
}

const ToastCtx = createContext<ToastApi>({ show: () => {} })

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const show = useCallback((msg: string, tone: ToastTone = 'success') => {
    const id = ++seq.current
    setItems((prev) => [...prev.slice(-2), { id, msg, tone }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 2200)
  }, [])

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        className="fixed inset-x-0 bottom-6 z-[80] flex flex-col items-center gap-2 px-4 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              'flex items-center gap-2 max-w-[92vw] rounded-full px-4 py-2.5 text-sm shadow-pop animate-fade-up',
              'bg-ink text-bg'
            )}
          >
            {t.tone === 'success' && <Check size={15} className="shrink-0" />}
            {t.tone === 'error' && <AlertTriangle size={15} className="shrink-0" />}
            {t.tone === 'info' && <Info size={15} className="shrink-0" />}
            <span className="truncate">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* ============================ Badge ============================ */

type BadgeTone = 'neutral' | 'douyin' | 'kuaishou' | 'sample' | 'warn'

const badgeTone: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-muted',
  douyin: 'bg-douyin/10 text-douyin',
  kuaishou: 'bg-kuaishou/10 text-kuaishou',
  sample: 'bg-surface-2 text-muted ring-1 ring-inset ring-line',
  warn: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
}

export function Badge({
  children,
  tone = 'neutral',
  title,
}: {
  children: ReactNode
  tone?: BadgeTone
  title?: string
}) {
  return (
    <span className={cx('badge', badgeTone[tone])} title={title}>
      {children}
    </span>
  )
}

/* ============================ Chip ============================ */

export function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx('chip', active && 'chip-active')}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span className={cx('tnum text-2xs', active ? 'text-bg/70' : 'text-muted/80')}>
          {count}
        </span>
      )}
    </button>
  )
}

/* ============================ EmptyState ============================ */

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon?: ReactNode
  title: string
  desc?: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon && (
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-muted">
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-ink">{title}</p>
        {desc && <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

/* ============================ Skeleton ============================ */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton', className)} />
}

export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex gap-3 p-3">
          <Skeleton className="h-[68px] w-[112px] shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ============================ SectionHeader ============================ */

export function SectionHeader({
  title,
  desc,
  right,
}: {
  title: string
  desc?: string
  right?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {desc && <p className="mt-0.5 text-xs text-muted">{desc}</p>}
      </div>
      {right}
    </div>
  )
}

/* ============================ DetailRow ============================ */

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 text-right text-ink">{children}</span>
    </div>
  )
}

/* ============================ Sheet（移动端详情弹层） ============================ */

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="关闭"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-fade-in cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 max-h-[86vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 shadow-pop animate-fade-up sm:max-w-lg sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button type="button" className="icon-btn -mr-2 -mt-1" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
