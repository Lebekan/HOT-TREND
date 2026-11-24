import { useMemo, useState } from 'react'
import { Copy, Quote } from 'lucide-react'
import { DataNotice } from '../components/DataPanel'
import { QuoteCard } from '../components/cards'
import { Chip, EmptyState, SectionHeader, SkeletonRows, useToast } from '../components/ui'
import { copyText } from '../lib/clipboard'
import type { PageProps } from './common'

export function QuotesPage({ data, state, favorites, query, onOpenDataPanel }: PageProps) {
  const [cat, setCat] = useState<string>('all')
  const { show } = useToast()

  const categories = useMemo(() => {
    const s = new Set<string>()
    data.quotes.forEach((q) => s.add(q.category))
    return Array.from(s)
  }, [data.quotes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.quotes.filter((item) => {
      if (cat !== 'all' && item.category !== cat) return false
      if (!q) return true
      return [item.content, item.author, item.category, ...item.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [data.quotes, cat, query])

  const copyAll = async () => {
    if (filtered.length === 0) return
    const text = filtered.map((q) => `「${q.content}」${q.author ? ` —— ${q.author}` : ''}`).join('\n')
    const ok = await copyText(text)
    show(ok ? `已复制 ${filtered.length} 条语录` : '复制失败', ok ? 'success' : 'error')
  }

  return (
    <div>
      <DataNotice
        isSample={data.meta?.mode === 'sample'}
        fromCache={state.fromCache}
        error={state.error}
        onOpen={onOpenDataPanel}
      />

      <SectionHeader
        title="经典语录"
        desc="可复用的金句素材；出处不详的条目标注为「出处待考」，不做杜撰"
        right={
          <button type="button" onClick={copyAll} className="btn-outline h-8 px-3 text-xs" disabled={filtered.length === 0}>
            <Copy size={13} />
            复制当前 {filtered.length} 条
          </button>
        }
      />

      <div className="no-scrollbar -mx-4 mb-3 flex items-center gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        <Chip active={cat === 'all'} onClick={() => setCat('all')}>
          全部
        </Chip>
        {categories.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <p className="mb-2 text-2xs text-muted/80">
        共 <b className="tnum font-semibold text-ink/80">{filtered.length}</b> 条
      </p>

      {state.loading ? (
        <SkeletonRows count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Quote size={20} />}
          title="没有匹配的语录"
          desc="语录库可在 public/data/quotes.json 中维护，支持分类与标签。"
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <QuoteCard
              key={item.id}
              item={item}
              favorited={favorites.isFavorite('quote', item.id)}
              onFavorite={() => favorites.toggle('quote', item, 'quotes')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
