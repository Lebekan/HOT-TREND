import { Flame, Star } from 'lucide-react'
import type { RouteKey } from '../types'
import { ROUTES } from '../lib/router'
import { cx } from '../lib/cx'
import { SITE } from '../config'

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl bg-[#0E0D10] ring-1 ring-black/10"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" width={size * 0.62} height={size * 0.62}>
        <path d="M18 40V26" stroke="#FE2C55" strokeWidth="8" strokeLinecap="round" />
        <path d="M32 44V20" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
        <path d="M46 36V28" stroke="#FF6A00" strokeWidth="8" strokeLinecap="round" />
      </svg>
    </span>
  )
}

const GROUP_LABEL: Record<string, string> = {
  discover: '发现',
  rank: '榜单',
  library: '素材与收藏',
}

const GROUPS = ['discover', 'rank', 'library'] as const

/* ============================ 桌面侧栏 ============================ */

export function Sidebar({
  current,
  onNavigate,
  favoritesCount,
  onOpenDataPanel,
  statusTone,
}: {
  current: RouteKey
  onNavigate: (k: RouteKey) => void
  favoritesCount: number
  onOpenDataPanel: () => void
  statusTone: 'ok' | 'warn' | 'error'
}) {
  const toneClass =
    statusTone === 'ok'
      ? 'bg-emerald-500'
      : statusTone === 'warn'
        ? 'bg-amber-500'
        : 'bg-rose-500'

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col border-r border-line bg-surface/70 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <Logo />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-ink">{SITE.name}</p>
          <p className="truncate text-2xs text-muted">{SITE.tagline}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="主导航">
        {GROUPS.map((g) => (
          <div key={g}>
            <p className="px-2 pb-1.5 text-2xs font-medium uppercase tracking-wider text-muted/70">
              {GROUP_LABEL[g]}
            </p>
            <ul className="space-y-0.5">
              {ROUTES.filter((r) => r.group === g).map((r) => {
                const active = r.key === current
                return (
                  <li key={r.key}>
                    <button
                      type="button"
                      onClick={() => onNavigate(r.key)}
                      aria-current={active ? 'page' : undefined}
                      className={cx(
                        'group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-150 cursor-pointer',
                        active
                          ? 'bg-ink text-bg font-medium'
                          : 'text-ink/80 hover:bg-surface-2 hover:text-ink'
                      )}
                    >
                      <span className="truncate">{r.label}</span>
                      {r.key === 'favorites' && favoritesCount > 0 && (
                        <span
                          className={cx(
                            'tnum ml-auto rounded-full px-1.5 text-2xs',
                            active ? 'bg-white/20 text-bg' : 'bg-surface-2 text-muted'
                          )}
                        >
                          {favoritesCount}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={onOpenDataPanel}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-muted transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer"
        >
          <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', toneClass)} aria-hidden="true" />
          <span className="truncate">数据状态与更新日志</span>
        </button>
        <p className="px-2.5 pt-1 text-2xs text-muted/60">
          {SITE.name} {SITE.version} · 本地存储
        </p>
      </div>
    </aside>
  )
}

/* ============================ 移动端横向导航 ============================ */

export function MobileNav({
  current,
  onNavigate,
  favoritesCount,
}: {
  current: RouteKey
  onNavigate: (k: RouteKey) => void
  favoritesCount: number
}) {
  return (
    <nav
      aria-label="栏目导航"
      className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:hidden"
    >
      {ROUTES.map((r) => {
        const active = r.key === current
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => onNavigate(r.key)}
            aria-current={active ? 'page' : undefined}
            className={cx(
              'inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-xs transition-colors duration-150 cursor-pointer',
              active
                ? 'bg-ink font-medium text-bg'
                : 'border border-line bg-surface text-muted hover:text-ink'
            )}
          >
            {r.key === 'today' && <Flame size={12} />}
            {r.key === 'favorites' && <Star size={12} />}
            {r.short}
            {r.key === 'favorites' && favoritesCount > 0 && (
              <span className="tnum opacity-70">{favoritesCount}</span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
