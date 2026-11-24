import { ArrowUpRight, Flame, TrendingUp } from 'lucide-react'
import { formatDateTime, formatRelative, formatToday } from '../lib/format'
import { SITE } from '../config'
import { TrendList } from '../components/TrendList'
import { DataNotice } from '../components/DataPanel'
import { SectionHeader } from '../components/ui'
import type { PageProps } from './common'

export function TodayPage({ data, state, favorites, query, onOpenDataPanel }: PageProps) {
  const douyinCount = data.videos.filter((v) => v.platform === 'douyin').length
  const kuaishouCount = data.videos.filter((v) => v.platform === 'kuaishou').length
  const isSample = data.meta?.mode === 'sample'

  return (
    <div>
      <DataNotice
        isSample={isSample}
        fromCache={state.fromCache}
        error={state.error}
        onOpen={onOpenDataPanel}
      />

      {/* 今日概览 */}
      <section className="card mb-4 overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-2xs font-medium text-muted">
              <Flame size={12} className="text-douyin" aria-hidden="true" />
              今日概览 · {formatToday(SITE.timezone)}
            </p>
            <h2 className="mt-1 flex items-baseline gap-1.5">
              <span className="tnum text-3xl font-bold leading-none tracking-tight text-ink">
                {data.videos.length}
              </span>
              <span className="text-sm text-muted">条视频已收录</span>
            </h2>
            <p className="mt-1.5 text-xs text-muted">
              最近更新 {formatDateTime(data.meta?.updatedAt)}
              <span className="text-muted/60">（{formatRelative(data.meta?.updatedAt)}）</span>
            </p>
          </div>

          <dl className="grid shrink-0 grid-cols-3 gap-0 divide-x divide-line rounded-xl border border-line bg-surface-2/50 sm:w-[300px]">
            <Stat label="抖音" value={douyinCount} />
            <Stat label="快手" value={kuaishouCount} />
            <Stat label="上升榜" value={data.rising.length} />
          </dl>
        </div>
        {data.meta?.note && (
          <p className="border-t border-line bg-surface-2/40 px-4 py-2 text-2xs leading-relaxed text-muted">
            {data.meta.note}
          </p>
        )}
      </section>

      <SectionHeader
        title="今日热门视频"
        desc="抖音 / 快手当日公开热点，点击「去原平台」在官方页面播放"
        right={
          <a
            href="#/rising"
            className="inline-flex shrink-0 items-center gap-1 text-xs text-muted transition-colors hover:text-ink"
          >
            <TrendingUp size={13} />
            上升最快
            <ArrowUpRight size={12} />
          </a>
        }
      />

      <TrendList
        items={data.videos}
        kind="video"
        favorites={favorites}
        query={query}
        loading={state.loading}
        emptyTitle="今日还没有录入数据"
        emptyDesc="本项目不抓取平台接口，需通过「scripts/sources」提供人工核验的快照，再执行更新脚本入库。"
        emptyAction={
          <button type="button" onClick={onOpenDataPanel} className="btn-primary">
            查看数据与更新说明
          </button>
        }
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3 py-2.5 text-center">
      <dd className="tnum text-lg font-semibold leading-none text-ink">{value}</dd>
      <dt className="mt-1 text-2xs text-muted">{label}</dt>
    </div>
  )
}
