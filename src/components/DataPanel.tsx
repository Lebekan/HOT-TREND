import { AlertTriangle, CheckCircle2, ExternalLink, Info, RefreshCw, Terminal, XCircle } from 'lucide-react'
import type { LogEntry, MetaDataset } from '../types'
import { cx } from '../lib/cx'
import { formatDateTime, formatRelative } from '../lib/format'
import { SITE, buildActionsUrl } from '../config'
import { Badge, Sheet } from './ui'

const STATUS_META: Record<LogEntry['status'], { label: string; tone: string; icon: typeof CheckCircle2 }> = {
  success: { label: '成功', tone: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  failed: { label: '失败', tone: 'text-rose-600 dark:text-rose-400', icon: XCircle },
  skipped: { label: '跳过', tone: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle },
}

const TRIGGER_LABEL: Record<LogEntry['trigger'], string> = {
  schedule: '定时任务',
  manual: '手动触发',
  local: '本地命令',
}

/* ============================ 顶部提示条 ============================ */

export function DataNotice({
  isSample,
  fromCache,
  error,
  onOpen,
}: {
  isSample: boolean
  fromCache: boolean
  error: string | null
  onOpen: () => void
}) {
  if (!isSample && !fromCache && !error) return null

  const tone = error
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
    : 'border-line bg-surface-2 text-ink/80'

  return (
    <div className={cx('mb-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-relaxed', tone)}>
      <Info size={14} className="mt-0.5 shrink-0 opacity-80" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {error && <p className="font-medium">{error}</p>}
        {isSample && (
          <p>
            当前为<b>示例骨架数据</b>，不含任何真实播放量 / 点赞量 / 热度 / 排名。请按「数据与更新」面板的说明导入真实数据。
          </p>
        )}
        {!isSample && fromCache && <p>正在使用本机缓存的上一次有效数据，请检查网络后刷新。</p>}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 whitespace-nowrap text-xs font-medium underline underline-offset-2 hover:opacity-70 cursor-pointer"
      >
        查看详情
      </button>
    </div>
  )
}

/* ============================ 数据与更新面板 ============================ */

export function DataPanel({
  open,
  onClose,
  meta,
  logs,
  isSample,
  fromCache,
  onReload,
}: {
  open: boolean
  onClose: () => void
  meta: MetaDataset | null
  logs: LogEntry[]
  isSample: boolean
  fromCache: boolean
  onReload: () => void
}) {
  const actionsUrl = buildActionsUrl(SITE.repoUrl)
  const recent = [...logs].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 12)

  return (
    <Sheet open={open} onClose={onClose} title="数据状态与更新">
      <div className="space-y-5">
        {/* 状态 */}
        <section className="rounded-xl border border-line bg-surface-2/60 p-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <Field label="最近更新" value={formatDateTime(meta?.updatedAt)} />
            <Field label="相对时间" value={formatRelative(meta?.updatedAt)} />
            <Field label="时区" value={meta?.timezone ?? SITE.timezone} />
            <Field
              label="数据模式"
              value={isSample ? '示例骨架（无真实指标）' : fromCache ? '本机缓存' : '人工核验快照'}
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={onReload} className="btn-outline h-8 px-3 text-xs">
              <RefreshCw size={13} />
              重新载入数据
            </button>
            {actionsUrl && (
              <a
                href={actionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline h-8 px-3 text-xs"
              >
                <ExternalLink size={13} />
                打开更新工作流
              </a>
            )}
          </div>
        </section>

        {/* 手动更新入口 */}
        <section>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Terminal size={14} className="text-muted" aria-hidden="true" />
            手动更新入口
          </h4>
          <ol className="space-y-2 text-xs leading-relaxed text-muted">
            <li className="rounded-lg border border-line bg-surface p-2.5">
              <b className="text-ink">① 云端（推荐）</b>
              <p className="mt-1">
                进入 GitHub 仓库 → Actions → 「每日数据更新」→ Run workflow。工作流会执行校验与入库，并在失败时保留上一次有效数据。
              </p>
            </li>
            <li className="rounded-lg border border-line bg-surface p-2.5">
              <b className="text-ink">② 本地命令行</b>
              <p className="mt-1 font-num">npm run update:data&nbsp;&nbsp;# 预演：npm run update:data:dry</p>
            </li>
            <li className="rounded-lg border border-line bg-surface p-2.5">
              <b className="text-ink">③ 网页内手动触发</b>
              <p className="mt-1">
                纯静态站点没有后端，网页按钮无法直接写入仓库（需 Token，出于安全本方案不内置）。请使用 ① 或 ②。
              </p>
            </li>
          </ol>
        </section>

        {/* 执行日志 */}
        <section>
          <h4 className="mb-2 text-sm font-semibold text-ink">执行日志（最近 12 条）</h4>
          {recent.length === 0 ? (
            <p className="rounded-lg border border-line bg-surface p-3 text-xs text-muted">
              暂无日志记录。执行一次更新后，这里会显示时间、结果与写入条目数。
            </p>
          ) : (
            <ul className="space-y-1.5">
              {recent.map((log, i) => {
                const m = STATUS_META[log.status]
                const Icon = m.icon
                return (
                  <li key={`${log.at}-${i}`} className="rounded-lg border border-line bg-surface p-2.5">
                    <div className="flex items-center gap-1.5">
                      <Icon size={13} className={cx('shrink-0', m.tone)} aria-hidden="true" />
                      <span className={cx('text-xs font-medium', m.tone)}>{m.label}</span>
                      <Badge>{TRIGGER_LABEL[log.trigger]}</Badge>
                      <span className="tnum ml-auto text-2xs text-muted/80">
                        {formatDateTime(log.at)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{log.message}</p>
                    {log.detail && log.detail.length > 0 && (
                      <p className="tnum mt-1 text-2xs text-muted/70">
                        {log.detail.map((d) => `${d.dataset} ${d.count} 条`).join(' · ')}
                      </p>
                    )}
                    {log.error && (
                      <p className="mt-1 break-words rounded bg-rose-500/10 px-2 py-1 font-num text-2xs text-rose-700 dark:text-rose-300">
                        {log.error}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* 数据边界 */}
        <section>
          <h4 className="mb-2 text-sm font-semibold text-ink">数据边界说明</h4>
          <ul className="space-y-1.5 text-xs leading-relaxed text-muted">
            {(meta?.disclosures ?? [
              '本项目不调用任何付费接口，也不绕过平台登录、验证码或风控机制。',
            ]).map((d, i) => (
              <li key={i} className="flex gap-1.5">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted/50" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Sheet>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xs text-muted/70">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  )
}
