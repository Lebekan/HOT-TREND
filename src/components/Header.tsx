import { Monitor, Moon, Search, Sun, X } from 'lucide-react'
import type { RouteKey } from '../types'
import type { ThemeMode } from '../hooks/useTheme'
import { cx } from '../lib/cx'
import { formatToday, formatRelative } from '../lib/format'
import { SITE } from '../config'
import { Logo, MobileNav } from './Nav'

const THEME_LABEL: Record<ThemeMode, string> = {
  light: '浅色',
  dark: '深色',
  system: '跟随系统',
}

export function Header({
  routeTitle,
  routeDesc,
  current,
  onNavigate,
  favoritesCount,
  query,
  onQueryChange,
  themeMode,
  onCycleTheme,
  onOpenDataPanel,
  updatedAt,
  statusTone,
  loading,
}: {
  routeTitle: string
  routeDesc: string
  current: RouteKey
  onNavigate: (k: RouteKey) => void
  favoritesCount: number
  query: string
  onQueryChange: (v: string) => void
  themeMode: ThemeMode
  onCycleTheme: () => void
  onOpenDataPanel: () => void
  updatedAt: string | null
  statusTone: 'ok' | 'warn' | 'error'
  loading: boolean
}) {
  const ThemeIcon = themeMode === 'light' ? Sun : themeMode === 'dark' ? Moon : Monitor
  const dotClass =
    statusTone === 'ok' ? 'bg-emerald-500' : statusTone === 'warn' ? 'bg-amber-500' : 'bg-rose-500'

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-2.5 pt-3 lg:px-8 lg:pt-5">
        {/* 第一行 */}
        <div className="flex items-center gap-3">
          {/* 移动端品牌 */}
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <Logo size={26} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-ink">{SITE.name}</p>
              <p className="truncate text-[10px] leading-tight text-muted">
                {formatToday(SITE.timezone)}
              </p>
            </div>
          </div>

          {/* 桌面端标题 */}
          <div className="hidden min-w-0 flex-1 lg:block">
            <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{routeTitle}</h1>
            <p className="mt-0.5 truncate text-xs text-muted">{routeDesc}</p>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {/* 桌面端搜索 */}
            <div className="relative hidden w-72 lg:block">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="搜索标题、作者、标签…"
                aria-label="搜索"
                className="h-9 w-full rounded-full border border-line bg-surface pl-9 pr-8 text-sm text-ink placeholder:text-muted/70 focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  aria-label="清除搜索"
                  className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onCycleTheme}
              className="icon-btn"
              aria-label={`切换主题，当前${THEME_LABEL[themeMode]}`}
              title={`主题：${THEME_LABEL[themeMode]}`}
            >
              <ThemeIcon size={17} />
            </button>

            <button
              type="button"
              onClick={onOpenDataPanel}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 text-xs text-muted transition-colors hover:text-ink cursor-pointer"
              aria-label="数据状态与更新日志"
            >
              <span className={cx('h-1.5 w-1.5 rounded-full', dotClass)} aria-hidden="true" />
              <span className="hidden sm:inline">
                {loading ? '载入中' : updatedAt ? `更新于 ${formatRelative(updatedAt)}` : '尚未更新'}
              </span>
              <span className="sm:hidden">{loading ? '载入' : '状态'}</span>
            </button>
          </div>
        </div>

        {/* 第二行：移动端搜索 */}
        <div className="relative mt-2 lg:hidden">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`在「${routeTitle}」中搜索`}
            aria-label="搜索"
            className="h-9 w-full rounded-full border border-line bg-surface pl-9 pr-8 text-sm text-ink placeholder:text-muted/70 focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="清除搜索"
              className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* 第三行：移动端栏目导航 */}
        <div className="mt-2.5">
          <MobileNav current={current} onNavigate={onNavigate} favoritesCount={favoritesCount} />
        </div>
      </div>
    </header>
  )
}
