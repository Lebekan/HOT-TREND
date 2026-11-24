import { Sparkles } from 'lucide-react'
import { TrendList } from '../components/TrendList'
import { DataNotice } from '../components/DataPanel'
import { SectionHeader } from '../components/ui'
import type { PageProps } from './common'

export function EffectsPage({ data, state, favorites, query, onOpenDataPanel }: PageProps) {
  return (
    <div>
      <DataNotice
        isSample={data.meta?.mode === 'sample'}
        fromCache={state.fromCache}
        error={state.error}
        onOpen={onOpenDataPanel}
      />

      <SectionHeader
        title="热门特效"
        desc="滤镜、贴纸、转场等道具；使用请前往原平台官方入口"
        right={
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Sparkles size={13} />
            <b className="tnum font-semibold text-ink">{data.effects.length}</b> 条
          </span>
        }
      />

      <TrendList
        items={data.effects}
        kind="effect"
        favorites={favorites}
        query={query}
        loading={state.loading}
        emptyTitle="尚未录入特效数据"
        emptyDesc="特效条目建议同时填写「使用入口」与「官方教程」链接，便于直接跳转。"
        emptyAction={
          <button type="button" onClick={onOpenDataPanel} className="btn-primary">
            查看数据与更新说明
          </button>
        }
      />
    </div>
  )
}
