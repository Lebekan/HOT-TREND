import { useMemo, useState } from 'react'
import { Bookmark, Download, Star, Trash2 } from 'lucide-react'
import type { AudioItem, CopyItem, EffectItem, QuoteItem, TrendItem } from '../types'
import type { FavoriteKind } from '../hooks/useFavorites'
import { CopyCard, QuoteCard, TrendCard } from '../components/cards'
import { Chip, EmptyState, SectionHeader, useToast } from '../components/ui'
import type { PageProps } from './common'

const TABS: { key: FavoriteKind | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'video', label: '视频' },
  { key: 'audio', label: '音频' },
  { key: 'effect', label: '特效' },
  { key: 'copy', label: '文案' },
  { key: 'quote', label: '语录' },
]

export function FavoritesPage({ favorites, query }: PageProps) {
  const [tab, setTab] = useState<FavoriteKind | 'all'>('all')
  const { show } = useToast()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return favorites.list.filter((f) => {
      if (tab !== 'all' && f.kind !== tab) return false
      if (!q) return true
      const it = f.item as { title?: string; content?: string }
      return [it.title, it.content].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [favorites.list, tab, query])

  const exportJson = () => {
    try {
      const blob = new Blob([JSON.stringify(favorites.list, null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `hot-trend-favorites-${stamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      show('已导出收藏 JSON')
    } catch {
      show('导出失败', 'error')
    }
  }

  const clearAll = () => {
    if (favorites.list.length === 0) return
    const ok = window.confirm(
      `将删除全部 ${favorites.list.length} 条收藏，仅影响本机浏览器，无法撤销。确认继续？`
    )
    if (!ok) return
    favorites.clear()
    show('已清空收藏', 'info')
  }

  return (
    <div>
      <SectionHeader
        title="历史收藏"
        desc="保存在本机 localStorage，不上传服务器；清除浏览器数据会一并删除，建议定期导出备份"
        right={
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={exportJson}
              className="btn-outline h-8 px-2.5 text-xs"
              disabled={favorites.list.length === 0}
            >
              <Download size={13} />
              导出
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="btn-outline h-8 px-2.5 text-xs text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
              disabled={favorites.list.length === 0}
            >
              <Trash2 size={13} />
              清空
            </button>
          </div>
        }
      />

      <div className="no-scrollbar -mx-4 mb-3 flex items-center gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {TABS.map((t) => {
          const count =
            t.key === 'all' ? favorites.list.length : (favorites.counts[t.key] ?? 0)
          return (
            <Chip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} count={count}>
              {t.label}
            </Chip>
          )
        })}
      </div>

      {favorites.list.length === 0 ? (
        <EmptyState
          icon={<Star size={20} />}
          title="还没有收藏"
          desc="在任意卡片右上角点击星标即可收藏，收藏的是当时的完整快照，即使线上数据轮换也能查看。"
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Bookmark size={20} />} title="该分类下没有收藏" desc="切换上方的分类，或清除搜索关键词。" />
      ) : (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {filtered.map((f) => {
            if (f.kind === 'copy') {
              return (
                <CopyCard
                  key={f.key}
                  item={f.item as CopyItem}
                  favorited
                  onFavorite={() => favorites.remove(f.key)}
                />
              )
            }
            if (f.kind === 'quote') {
              return (
                <QuoteCard
                  key={f.key}
                  item={f.item as QuoteItem}
                  favorited
                  onFavorite={() => favorites.remove(f.key)}
                />
              )
            }
            return (
              <TrendCard
                key={f.key}
                item={f.item as TrendItem | AudioItem | EffectItem}
                kind={f.kind}
                favorited
                onFavorite={() => favorites.remove(f.key)}
              />
            )
          })}
        </div>
      )}

      <p className="mt-4 text-2xs leading-relaxed text-muted/70">
        说明：收藏快照包含你保存当时的标题、指标与链接；若原平台内容已删除，链接可能失效。
      </p>
    </div>
  )
}
