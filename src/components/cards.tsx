import { useState } from 'react'
import {
  ArrowUpRight,
  Check,
  Copy,
  Film,
  Music2,
  Play,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { AudioItem, CopyItem, EffectItem, QuoteItem, TrendItem } from '../types'
import { PLATFORM_LABEL } from '../types'
import { cx } from '../lib/cx'
import { formatCount, formatDelta, formatDuration, formatMonthDay } from '../lib/format'
import { copyText } from '../lib/clipboard'
import { Badge, useToast } from './ui'

/* ============================ 封面 ============================ */

function Cover({
  src,
  alt,
  kind = 'video',
  className,
}: {
  src?: string | null
  alt: string
  kind?: 'video' | 'audio' | 'effect'
  className?: string
}) {
  const [broken, setBroken] = useState(false)
  const Icon = kind === 'audio' ? Music2 : kind === 'effect' ? Sparkles : Film

  if (!src || broken) {
    return (
      <div
        className={cx(
          'grid place-items-center overflow-hidden rounded-xl bg-surface-2 text-muted/60 ring-1 ring-inset ring-line/70',
          className
        )}
        aria-label={`${alt}（无封面）`}
      >
        <Icon size={18} />
      </div>
    )
  }

  return (
    <div className={cx('overflow-hidden rounded-xl bg-surface-2 ring-1 ring-inset ring-line/70', className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        className="h-full w-full object-cover"
      />
    </div>
  )
}

/* ============================ 通用行内操作 ============================ */

function StarButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? `取消收藏：${label}` : `收藏：${label}`}
      title={active ? '取消收藏' : '收藏'}
      className={cx(
        'grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors duration-150 cursor-pointer',
        active ? 'text-douyin' : 'text-muted hover:bg-surface-2 hover:text-ink'
      )}
    >
      <Star size={17} fill={active ? 'currentColor' : 'none'} strokeWidth={1.8} />
    </button>
  )
}

function CopyButton({ text, label = '复制' }: { text: string; label?: string }) {
  const { show } = useToast()
  const [done, setDone] = useState(false)

  const handle = async () => {
    const ok = await copyText(text)
    if (ok) {
      setDone(true)
      show('已复制到剪贴板')
      window.setTimeout(() => setDone(false), 1600)
    } else {
      show('复制失败，请手动选择文本复制', 'error')
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      className={cx('btn-outline h-8 shrink-0 px-2.5 text-xs', done && 'text-emerald-600 dark:text-emerald-400')}
      aria-label={`${label}：${text.slice(0, 20)}`}
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
      {done ? '已复制' : label}
    </button>
  )
}

function SourceLink({ url, label = '原平台' }: { url?: string | null; label?: string }) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="btn-outline h-8 shrink-0 px-2.5 text-xs"
      aria-label={`在新窗口打开${label}`}
    >
      <ArrowUpRight size={13} />
      {label}
    </a>
  )
}

function PlatformTag({ platform }: { platform: TrendItem['platform'] }) {
  return (
    <Badge tone={platform === 'douyin' ? 'douyin' : 'kuaishou'}>
      {PLATFORM_LABEL[platform]}
    </Badge>
  )
}

/** 指标组：值为 null 时明确显示「未公开」，绝不显示 0 */
function MetricInline({
  items,
}: {
  items: { key: string; label: string; value?: number | null }[]
}) {
  const known = items.filter((i) => i.value !== null && i.value !== undefined)
  if (known.length === 0) {
    return (
      <span className="text-2xs text-muted/80" title="来源未公开该项数据">
        指标未公开
      </span>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-2xs text-muted">
      {items.map((i) => (
        <span key={i.key} className="inline-flex items-center gap-1">
          <span className="text-muted/75">{i.label}</span>
          <b className="tnum font-semibold text-ink/85">{formatCount(i.value, '未公开')}</b>
        </span>
      ))}
    </div>
  )
}

/* ============================ 视频 / 音频 / 特效 卡片 ============================ */

export function TrendCard({
  item,
  kind = 'video',
  favorited,
  onFavorite,
  showRank = false,
}: {
  item: TrendItem | AudioItem | EffectItem
  kind?: 'video' | 'audio' | 'effect'
  favorited: boolean
  onFavorite: () => void
  showRank?: boolean
}) {
  const audio = item as AudioItem
  const effect = item as EffectItem
  const rank = item.rank ?? null

  const title = item.title
  const subtitle =
    kind === 'audio'
      ? [audio.artist, audio.audioTitle].filter(Boolean).join(' · ')
      : kind === 'effect'
        ? [effect.effectType, effect.effectName].filter(Boolean).join(' · ')
        : item.author

  return (
    <article className="card card-hover group flex gap-3 p-3">
      {/* 排名列：仅在来源提供了真实排名时渲染 */}
      {showRank && rank !== null && (
        <div className="flex w-6 shrink-0 flex-col items-center pt-1">
          <span className="tnum text-base font-bold leading-none text-ink">{rank}</span>
          {item.rankDelta !== undefined && item.rankDelta !== null && (
            <DeltaMark delta={item.rankDelta} />
          )}
        </div>
      )}

      <div className="relative shrink-0">
        <Cover
          src={item.cover}
          alt={title}
          kind={kind}
          className="h-[68px] w-[108px] sm:h-[76px] sm:w-[124px]"
        />
        {kind === 'video' && (
          <span className="pointer-events-none absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-black/55 text-white/95">
            <Play size={10} fill="currentColor" />
          </span>
        )}
        {kind === 'audio' && audio.durationSec ? (
          <span className="tnum pointer-events-none absolute bottom-1 right-1 rounded bg-black/55 px-1 text-[10px] leading-4 text-white/95">
            {formatDuration(audio.durationSec)}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start gap-1.5">
          <h3 className="clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug text-ink">
            {title}
          </h3>
          <StarButton active={favorited} onClick={onFavorite} label={title} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-2xs text-muted">
          <PlatformTag platform={item.platform} />
          <span className="truncate">{item.category}</span>
          {subtitle && (
            <>
              <span aria-hidden="true" className="text-line">|</span>
              <span className="max-w-[9rem] truncate">{subtitle}</span>
            </>
          )}
          {item.isSample && <Badge tone="sample">示例</Badge>}
          {item.verified && !item.isSample && (
            <span className="text-2xs text-emerald-600 dark:text-emerald-400">已核验</span>
          )}
        </div>

        <MetricInline
          items={
            kind === 'audio'
              ? [
                  { key: 'play', label: '播放', value: item.metrics?.play },
                  { key: 'use', label: '使用', value: audio.usageCount },
                  { key: 'like', label: '点赞', value: item.metrics?.like },
                ]
              : kind === 'effect'
                ? [
                    { key: 'use', label: '使用', value: effect.usageCount },
                    { key: 'play', label: '播放', value: item.metrics?.play },
                    { key: 'like', label: '点赞', value: item.metrics?.like },
                  ]
                : [
                    { key: 'play', label: '播放', value: item.metrics?.play },
                    { key: 'like', label: '点赞', value: item.metrics?.like },
                    { key: 'comment', label: '评论', value: item.metrics?.comment },
                  ]
          }
        />

        {item.summary && (
          <p className="clamp-2 text-xs leading-relaxed text-muted/90">{item.summary}</p>
        )}

        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <SourceLink url={item.url} label="去原平台" />
          {kind === 'effect' && effect.tutorialUrl && (
            <SourceLink url={effect.tutorialUrl} label="教程" />
          )}
          <span className="ml-auto text-2xs text-muted/70">
            {formatMonthDay(item.collectedAt)}
          </span>
        </div>
      </div>
    </article>
  )
}

function DeltaMark({ delta }: { delta: number }) {
  const d = formatDelta(delta)
  if (d.tone === 'unknown' || d.tone === 'flat') {
    return <span className="mt-0.5 text-[10px] leading-none text-muted/70">—</span>
  }
  const up = d.tone === 'up'
  return (
    <span
      className={cx(
        'tnum mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium leading-none',
        up ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
      )}
      title={up ? '名次上升' : '名次下降'}
    >
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(delta)}
    </span>
  )
}

/* ============================ 文案卡 ============================ */

export function CopyCard({
  item,
  favorited,
  onFavorite,
}: {
  item: CopyItem
  favorited: boolean
  onFavorite: () => void
}) {
  return (
    <article className="card card-hover flex flex-col gap-2.5 p-4">
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink">{item.title}</h3>
        <StarButton active={favorited} onClick={onFavorite} label={item.title} />
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">{item.content}</p>

      <div className="flex flex-wrap items-center gap-1.5 text-2xs text-muted">
        <Badge>{item.category}</Badge>
        {item.platforms.map((p) => (
          <PlatformTag key={p} platform={p} />
        ))}
        {item.isSample && <Badge tone="sample">示例</Badge>}
      </div>

      {item.usage && <p className="text-2xs leading-relaxed text-muted/85">适用：{item.usage}</p>}

      <div className="mt-auto flex items-center gap-1.5 pt-1">
        <CopyButton text={item.content} label="复制文案" />
        <span className="ml-auto text-2xs text-muted/70">{formatMonthDay(item.collectedAt)}</span>
      </div>
    </article>
  )
}

/* ============================ 语录卡 ============================ */

export function QuoteCard({
  item,
  favorited,
  onFavorite,
}: {
  item: QuoteItem
  favorited: boolean
  onFavorite: () => void
}) {
  return (
    <article className="card card-hover relative flex flex-col gap-2.5 overflow-hidden p-4">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-1 -top-4 select-none text-[64px] font-serif leading-none text-line/60"
      >
        &rdquo;
      </span>
      <div className="flex items-start gap-2">
        <Badge>{item.category}</Badge>
        <div className="ml-auto">
          <StarButton active={favorited} onClick={onFavorite} label={item.content.slice(0, 12)} />
        </div>
      </div>

      <p className="relative whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-ink">
        {item.content}
      </p>

      <p className="text-2xs text-muted">
        {item.author ? `—— ${item.author}` : '出处待考'}
      </p>

      <div className="mt-auto flex items-center gap-1.5 pt-1">
        <CopyButton text={item.content} label="复制语录" />
        <span className="ml-auto text-2xs text-muted/70">{formatMonthDay(item.collectedAt)}</span>
      </div>
    </article>
  )
}
