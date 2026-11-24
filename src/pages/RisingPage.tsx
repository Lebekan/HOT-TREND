import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { TrendList } from '../components/TrendList'
import { DataNotice } from '../components/DataPanel'
import { SectionHeader } from '../components/ui'
import type { PageProps } from './common'

export function RisingPage({ data, state, favorites, query, onOpenDataPanel }: PageProps) {
  /**
   * 上升排序规则（不新增任何推算）：
   * 1) 若来源提供了 risingPercent，按它降序；
   * 2) 否则若提供了 rankDelta，按名次上升幅度降序；
   * 3) 都没有则保持来源顺序，并在页面上明确说明。
   */
  const sorted = useMemo(() => {
    const list = [...data.rising]
    const hasPercent = list.some((i) => typeof i.risingPercent === 'number')
    const hasDelta = list.some((i) => typeof i.rankDelta === 'number')
    if (hasPercent) {
      return list.sort((a, b) => (b.risingPercent ?? -Infinity) - (a.risingPercent ?? -Infinity))
    }
    if (hasDelta) {
      return list.sort((a, b) => (b.rankDelta ?? -Infinity) - (a.rankDelta ?? -Infinity))
    }
    return list
  }, [data.rising])

  const basis = useMemo(() => {
    if (data.rising.some((i) => typeof i.risingPercent === 'number')) return '按来源提供的上升幅度降序'
    if (data.rising.some((i) => typeof i.rankDelta === 'number')) return '按来源提供的名次上升幅度降序'
    return '来源未提供上升幅度，按采集顺序展示'
  }, [data.rising])

  return (
    <div>
      <DataNotice
        isSample={data.meta?.mode === 'sample'}
        fromCache={state.fromCache}
        error={state.error}
        onOpen={onOpenDataPanel}
      />

      <SectionHeader
        title="上升最快榜"
        desc={`排序依据：${basis}`}
        right={
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <TrendingUp size={13} className="text-douyin" />
            <b className="tnum font-semibold text-ink">{data.rising.length}</b> 条
          </span>
        }
      />

      <TrendList
        items={sorted}
        kind="video"
        favorites={favorites}
        query={query}
        showRank
        loading={state.loading}
        emptyTitle="上升榜暂无数据"
        emptyDesc="上升幅度需由来源同时给出「当前名次」与「前一次名次」，或直接给出上升百分比；本方案不自行计算、不推测。"
        emptyAction={
          <button type="button" onClick={onOpenDataPanel} className="btn-primary">
            查看数据与更新说明
          </button>
        }
      />
    </div>
  )
}
