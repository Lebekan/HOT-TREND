import { Music2 } from 'lucide-react'
import { TrendList } from '../components/TrendList'
import { DataNotice } from '../components/DataPanel'
import { SectionHeader } from '../components/ui'
import type { PageProps } from './common'

export function AudiosPage({ data, state, favorites, query, onOpenDataPanel }: PageProps) {
  return (
    <div>
      <DataNotice
        isSample={data.meta?.mode === 'sample'}
        fromCache={state.fromCache}
        error={state.error}
        onOpen={onOpenDataPanel}
      />

      <SectionHeader
        title="热门音频"
        desc="平台公开的热门音乐与配音；版权归原权利人，请在原平台内使用"
        right={
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Music2 size={13} />
            <b className="tnum font-semibold text-ink">{data.audios.length}</b> 条
          </span>
        }
      />

      <TrendList
        items={data.audios}
        kind="audio"
        favorites={favorites}
        query={query}
        loading={state.loading}
        emptyTitle="尚未录入音频数据"
        emptyDesc="音频数据需来自平台公开信息或你本人的整理，脚本只做校验与入库，不生成估算值。"
        emptyAction={
          <button type="button" onClick={onOpenDataPanel} className="btn-primary">
            查看数据与更新说明
          </button>
        }
      />
    </div>
  )
}
