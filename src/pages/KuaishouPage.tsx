import { KuaishouIconFallback } from '../components/BrandMarks'
import { TrendList } from '../components/TrendList'
import { DataNotice } from '../components/DataPanel'
import { SectionHeader } from '../components/ui'
import type { PageProps } from './common'

export function KuaishouPage({ data, state, favorites, query, onOpenDataPanel }: PageProps) {
  return (
    <div>
      <DataNotice
        isSample={data.meta?.mode === 'sample'}
        fromCache={state.fromCache}
        error={state.error}
        onOpen={onOpenDataPanel}
      />

      <SectionHeader
        title="快手热门榜"
        desc="仅记录来源明确给出的名次；来源未提供排名时，仅按采集顺序展示"
        right={<KuaishouIconFallback count={data.kuaishou.length} />}
      />

      <TrendList
        items={data.kuaishou}
        kind="video"
        favorites={favorites}
        query={query}
        showRank
        showPlatform={false}
        loading={state.loading}
        emptyTitle="快手榜暂无数据"
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
