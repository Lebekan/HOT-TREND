import { SlidersHorizontal, X } from 'lucide-react'
import type { Platform } from '../types'
import { PLATFORM_LABEL } from '../types'
import { Chip } from './ui'

export interface Filters {
  platform: Platform | 'all'
  category: string | 'all'
}

export const DEFAULT_FILTERS: Filters = { platform: 'all', category: 'all' }

export function FilterBar({
  filters,
  onChange,
  categories,
  platformCounts,
  resultCount,
  showPlatform = true,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  categories: string[]
  platformCounts?: Record<string, number>
  resultCount: number
  showPlatform?: boolean
}) {
  const active = filters.platform !== 'all' || filters.category !== 'all'

  return (
    <div className="mb-3 space-y-2">
      <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        <span className="inline-flex shrink-0 items-center gap-1 pr-0.5 text-2xs text-muted/80">
          <SlidersHorizontal size={12} aria-hidden="true" />
          筛选
        </span>

        {showPlatform && (
          <>
            <Chip
              active={filters.platform === 'all'}
              onClick={() => onChange({ ...filters, platform: 'all' })}
            >
              全部平台
            </Chip>
            {(['douyin', 'kuaishou'] as Platform[]).map((p) => (
              <Chip
                key={p}
                active={filters.platform === p}
                onClick={() => onChange({ ...filters, platform: p })}
                count={platformCounts?.[p]}
              >
                {PLATFORM_LABEL[p]}
              </Chip>
            ))}
            <span className="mx-1 h-4 w-px shrink-0 bg-line" aria-hidden="true" />
          </>
        )}

        <Chip
          active={filters.category === 'all'}
          onClick={() => onChange({ ...filters, category: 'all' })}
        >
          全部分类
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c}
            active={filters.category === c}
            onClick={() => onChange({ ...filters, category: c })}
          >
            {c}
          </Chip>
        ))}

        {active && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="ml-1 inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-xs text-muted hover:text-ink cursor-pointer"
          >
            <X size={12} />
            重置
          </button>
        )}
      </div>

      <p className="text-2xs text-muted/80" aria-live="polite">
        共 <b className="tnum font-semibold text-ink/80">{resultCount}</b> 条
        {active && '（已应用筛选）'}
      </p>
    </div>
  )
}
