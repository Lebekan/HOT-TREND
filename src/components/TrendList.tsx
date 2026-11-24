import { useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import type { AudioItem, EffectItem, TrendItem } from '../types'
import type { useFavorites } from '../hooks/useFavorites'
import { cx } from '../lib/cx'
import { FilterBar, DEFAULT_FILTERS, type Filters } from './FilterBar'
import { TrendCard } from './cards'
import { EmptyState, SkeletonRows } from './ui'

type AnyTrend = TrendItem | AudioItem | EffectItem

export function TrendList({
  items,
  kind,
  favorites,
  query,
  showRank = false,
  showPlatform = true,
  loading,
  emptyTitle,
  emptyDesc,
  emptyAction,
}: {
  items: AnyTrend[]
  kind: 'video' | 'audio' | 'effect'
  favorites: ReturnType<typeof useFavorites>
  query: string
  showRank?: boolean
  showPlatform?: boolean
  loading: boolean
  emptyTitle: string
  emptyDesc: string
  emptyAction?: React.ReactNode
}) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const categories = useMemo(() => {
    const set = new Set<string>()
    items.forEach((i) => i.category && set.add(i.category))
    return Array.from(set)
  }, [items])

  const platformCounts = useMemo(() => {
    const c: Record<string, number> = {}
    items.forEach((i) => {
      c[i.platform] = (c[i.platform] ?? 0) + 1
    })
    return c
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      if (filters.platform !== 'all' && i.platform !== filters.platform) return false
      if (filters.category !== 'all' && i.category !== filters.category) return false
      if (!q) return true
      const hay = [i.title, i.author, i.category, i.summary, ...(i.tags ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [items, filters, query])

  /** 只有来源提供过真实排名时，才显示排名列 */
  const hasRealRank = useMemo(() => items.some((i) => i.rank !== null && i.rank !== undefined), [items])

  if (loading) return <SkeletonRows count={6} />

  if (items.length === 0) {
    return <EmptyState icon={<SearchX size={20} />} title={emptyTitle} desc={emptyDesc} action={emptyAction} />
  }

  return (
    <div>
      <FilterBar
        filters={filters}
        onChange={setFilters}
        categories={categories}
        platformCounts={platformCounts}
        resultCount={filtered.length}
        showPlatform={showPlatform}
      />

      {showRank && !hasRealRank && (
        <p className="mb-2 text-2xs text-muted/75">
          说明：数据来源未提供平台排名，当前按采集顺序展示，不构成排名。
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX size={20} />}
          title="没有匹配的结果"
          desc="试试更换关键词，或重置筛选条件。"
        />
      ) : (
        <div className={cx('grid gap-2.5', kind === 'video' ? 'xl:grid-cols-2' : 'xl:grid-cols-2')}>
          {filtered.map((item) => (
            <TrendCard
              key={item.id}
              item={item}
              kind={kind}
              showRank={showRank && hasRealRank}
              favorited={favorites.isFavorite(kind, item.id)}
              onFavorite={() => favorites.toggle(kind, item, '')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
