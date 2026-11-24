/** 平台小标识，避免依赖第三方图标库缺失的品牌图形 */

export function DouyinIconFallback({ count }: { count: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted">
      <span className="h-2 w-2 rounded-full bg-douyin" aria-hidden="true" />
      <b className="tnum font-semibold text-ink">{count}</b> 条
    </span>
  )
}

export function KuaishouIconFallback({ count }: { count: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted">
      <span className="h-2 w-2 rounded-full bg-kuaishou" aria-hidden="true" />
      <b className="tnum font-semibold text-ink">{count}</b> 条
    </span>
  )
}
