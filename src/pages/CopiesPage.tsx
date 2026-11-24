import { useMemo, useState } from 'react'
import { ClipboardList, Copy, FileText } from 'lucide-react'
import type { Platform } from '../types'
import { PLATFORM_LABEL } from '../types'
import { DataNotice } from '../components/DataPanel'
import { CopyCard } from '../components/cards'
import { Chip, EmptyState, SectionHeader, SkeletonRows, useToast } from '../components/ui'
import { copyText } from '../lib/clipboard'
import type { PageProps } from './common'

export function CopiesPage({ data, state, favorites, query, onOpenDataPanel }: PageProps) {
  const [cat, setCat] = useState<string>('all')
  const [plat, setPlat] = useState<Platform | 'all'>('all')
  const { show } = useToast()

  const categories = useMemo(() => {
    const s = new Set<string>()
    data.copies.forEach((c) => s.add(c.category))
    return Array.from(s)
  }, [data.copies])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.copies.filter((c) => {
      if (cat !== 'all' && c.category !== cat) return false
      if (plat !== 'all' && !c.platforms.includes(plat)) return false
      if (!q) return true
      return [c.title, c.content, c.category, c.usage, ...c.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [data.copies, cat, plat, query])

  const copyAll = async () => {
    if (filtered.length === 0) return
    const text = filtered.map((c, i) => `${i + 1}. ${c.title}\n${c.content}`).join('\n\n')
    const ok = await copyText(text)
    show(ok ? `已复制 ${filtered.length} 条文案` : '复制失败', ok ? 'success' : 'error')
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
        title="爆款文案"
        desc="按场景整理的原创文案模板，可直接复制使用"
        right={
          <button type="button" onClick={copyAll} className="btn-outline h-8 px-3 text-xs" disabled={filtered.length === 0}>
            <Copy size={13} />
            复制当前 {filtered.length} 条
          </button>
        }
      />

      {/* 筛选 */}
      <div className="no-scrollbar -mx-4 mb-3 flex items-center gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        <Chip active={cat === 'all'} onClick={() => setCat('all')}>
          全部场景
        </Chip>
        {categories.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {c}
          </Chip>
        ))}
        <span className="mx-1 h-4 w-px shrink-0 bg-line" aria-hidden="true" />
        <Chip active={plat === 'all'} onClick={() => setPlat('all')}>
          全平台
        </Chip>
        {(['douyin', 'kuaishou'] as Platform[]).map((p) => (
          <Chip key={p} active={plat === p} onClick={() => setPlat(p)}>
            {PLATFORM_LABEL[p]}
          </Chip>
        ))}
      </div>

      <p className="mb-2 text-2xs text-muted/80">
        共 <b className="tnum font-semibold text-ink/80">{filtered.length}</b> 条
      </p>

      {state.loading ? (
        <SkeletonRows count={4} />
      ) : data.copies.length === 0 ? (
        <EmptyState
          icon={<FileText size={20} />}
          title="文案库还是空的"
          desc="文案属于纯文本资产，可直接在 public/data/copies.json 中维护，无需任何接口。"
          action={
            <button type="button" onClick={onOpenDataPanel} className="btn-primary">
              查看数据说明
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<ClipboardList size={20} />} title="没有匹配的文案" desc="换个关键词或切换场景试试。" />
      ) : (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {filtered.map((item) => (
            <CopyCard
              key={item.id}
              item={item}
              favorited={favorites.isFavorite('copy', item.id)}
              onFavorite={() => favorites.toggle('copy', item, 'copies')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
