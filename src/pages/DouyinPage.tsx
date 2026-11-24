import { DouyinIconFallback } from '../components/BrandMarks'
import { TrendList } from '../components/TrendList'
import { DataNotice } from '../components/DataPanel'
import { SectionHeader } from '../components/ui'
import type { PageProps } from './common'

export function DouyinPage({ data, state, favorites, query, onOpenDataPanel }: PageProps) {
  return (
    <div>
      <DataNotice
        isSample={data.meta?.mode === 'sample'}
        fromCache={state.fromCache}
        error={state.error}
        onOpen={onOpenDataPanel}
      />

      <SectionHeader
        title="抖音热门榜"
        desc="仅记录来源明确给出的名次；来源未提供排名时，仅按采集顺序展示"
        right={<DouyinIconFallback count={data.douyin.length} />}
      />

      <TrendList
        items={data.douyin}
        kind="video"
        favorites={favorites}
        query={query}
        showRank
        showPlatform={false}
        loading={state.loading}
        emptyTitle="抖音榜暂无数据"
        emptyDesc="榜单名次属于平台口径数据，本方案不做推算，需由来源快照提供。"
        emptyAction={
          <button type="button" onClick={onOpenDataPanel} className="btn-primary">
            查看数据与更新说明
          </button>
        }
      />
    </div>
  )
}
