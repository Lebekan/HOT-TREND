#!/usr/bin/env node
/**
 * HOT TREND 数据更新管道
 * =============================================================================
 * 设计原则（与项目要求一一对应）：
 * 1. 不调用任何 API、不使用 API Key、不抓取平台接口、不绕过风控。
 *    数据来源是「人工核验的快照文件」：scripts/sources/curated.json
 * 2. 先校验、后落盘。任何一条不合法 → 整体失败，不写入，旧数据 100% 保留。
 * 3. 平台未公开的指标必须写 null，脚本拒绝任何非整数指标（防止输入估算值）。
 * 4. 每次执行都会留下可追溯记录（时间 / 结果 / 写入条目数 / 失败原因）。
 *
 * 用法：
 *   node scripts/update.mjs                  # 正式执行
 *   node scripts/update.mjs --dry-run        # 只校验并打印计划，不写文件
 *   node scripts/update.mjs --source <path>  # 指定其他快照文件
 *   node scripts/update.mjs --trigger manual # 手动标记触发方式
 * =============================================================================
 */

import { readFile, writeFile, rename, mkdir, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = path.resolve(import.meta.dirname, '..')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const SOURCES_DIR = path.join(ROOT, 'scripts', 'sources')
const LOG_LIMIT = 60
const TZ = 'Asia/Shanghai'

const DATASETS = ['videos', 'audios', 'effects', 'douyin', 'kuaishou', 'rising']
const TEXT_DATASETS = ['copies', 'quotes']

/** 只允许跳转到这两个平台的官方域名，防止快照里混入任意链接 */
const ALLOWED_APEX = ['douyin.com', 'kuaishou.com']

const PLATFORMS = ['douyin', 'kuaishou']

// ----------------------------------------------------------------------------
// 小工具
// ----------------------------------------------------------------------------

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
}

function parseArgs(argv) {
  const out = { dryRun: false, source: null, trigger: null }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--dry-run' || a === '-n') out.dryRun = true
    else if (a === '--source') out.source = argv[++i]
    else if (a === '--trigger') out.trigger = argv[++i]
    else if (a === '--help' || a === '-h') {
      console.log('用法: node scripts/update.mjs [--dry-run] [--source <path>] [--trigger schedule|manual|local]')
      process.exit(0)
    }
  }
  return out
}

/** 生成带时区偏移的 ISO 字符串，例如 2026-11-24T08:00:00+08:00 */
function nowISO() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const g = (t) => parts.find((p) => p.type === t)?.value ?? '00'
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}+08:00`
}

async function exists(p) {
  try {
    await access(p, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function readJson(p, fallback = null) {
  try {
    const raw = await readFile(p, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

/** 原子写入：先写 .tmp 再 rename，避免中途失败留下半个文件 */
async function writeJsonAtomic(p, obj) {
  const tmp = `${p}.tmp`
  const text = `${JSON.stringify(obj, null, 2)}\n`
  await writeFile(tmp, text, 'utf8')
  await rename(tmp, p)
}

// ----------------------------------------------------------------------------
// 校验
// ----------------------------------------------------------------------------

function isNonNegInt(v) {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0
}

function isPosInt(v) {
  return typeof v === 'number' && Number.isInteger(v) && v > 0
}

function checkUrl(url, where, errors) {
  if (typeof url !== 'string' || !url) {
    errors.push(`${where}: url 必填，且必须是平台官方链接`)
    return false
  }
  let u
  try {
    u = new URL(url)
  } catch {
    errors.push(`${where}: url 不是合法地址 → ${url}`)
    return false
  }
  if (u.protocol !== 'https:') {
    errors.push(`${where}: url 必须使用 https → ${url}`)
    return false
  }
  const ok = ALLOWED_APEX.some((apex) => u.hostname === apex || u.hostname.endsWith(`.${apex}`))
  if (!ok) {
    errors.push(`${where}: url 域名不在允许列表（${ALLOWED_APEX.join(' / ')}）→ ${u.hostname}`)
    return false
  }
  return true
}

/** 校验单条热点条目，返回规范化后的对象 */
function normalizeTrendItem(raw, where, errors, seenIds) {
  const before = errors.length
  if (!raw || typeof raw !== 'object') {
    errors.push(`${where}: 条目必须是对象`)
    return null
  }
  const id = typeof raw.id === 'string' ? raw.id.trim() : ''
  if (!id) errors.push(`${where}: id 必填`)
  else if (seenIds.has(id)) errors.push(`${where}: id 重复 → ${id}`)
  else seenIds.add(id)

  if (!PLATFORMS.includes(raw.platform)) {
    errors.push(`${where}: platform 只能是 ${PLATFORMS.join(' / ')}，当前为 ${String(raw.platform)}`)
  }

  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title) errors.push(`${where}: title 必填`)
  if (title.length > 300) errors.push(`${where}: title 超过 300 字`)

  if (raw.url !== undefined) checkUrl(raw.url, where, errors)

  const m = raw.metrics ?? {}
  for (const k of ['play', 'like', 'comment', 'share', 'collect', 'heat']) {
    const v = m[k]
    if (v !== undefined && v !== null && !isNonNegInt(v)) {
      errors.push(
        `${where}: metrics.${k} 必须是非负整数或 null（禁止填入估算值 / 字符串 / 带单位的数值），当前为 ${JSON.stringify(v)}`
      )
    }
  }

  if (raw.rank !== undefined && raw.rank !== null && !isPosInt(raw.rank)) {
    errors.push(`${where}: rank 必须是正整数或 null（名次必须来自平台公开榜单，不要自行编号）`)
  }
  if (raw.rankDelta !== undefined && raw.rankDelta !== null && !Number.isInteger(raw.rankDelta)) {
    errors.push(`${where}: rankDelta 必须是整数或 null`)
  }
  if (
    raw.risingPercent !== undefined &&
    raw.risingPercent !== null &&
    (typeof raw.risingPercent !== 'number' || !Number.isFinite(raw.risingPercent))
  ) {
    errors.push(`${where}: risingPercent 必须是数字或 null`)
  }

  for (const k of ['usageCount']) {
    if (raw[k] !== undefined && raw[k] !== null && !isNonNegInt(raw[k])) {
      errors.push(`${where}: ${k} 必须是非负整数或 null`)
    }
  }
  for (const k of ['durationSec']) {
    if (raw[k] !== undefined && raw[k] !== null && !isPosInt(raw[k])) {
      errors.push(`${where}: ${k} 必须是正整数（秒）或 null`)
    }
  }

  if (!raw.source || typeof raw.source !== 'string') {
    errors.push(`${where}: source 必填，用于说明该条数据的来源口径`)
  }
  if (!raw.collectedAt || typeof raw.collectedAt !== 'string') {
    errors.push(`${where}: collectedAt 必填，格式如 2026-11-24T08:00:00+08:00`)
  }

  if (errors.length > before) return null

  return {
    id,
    platform: raw.platform,
    title,
    author: raw.author ?? null,
    category: raw.category ?? '未分类',
    cover: raw.cover ?? null,
    url: raw.url,
    summary: raw.summary ?? null,
    metrics: {
      play: m.play ?? null,
      like: m.like ?? null,
      comment: m.comment ?? null,
      share: m.share ?? null,
      collect: m.collect ?? null,
      heat: m.heat ?? null,
      note: m.note ?? null,
    },
    rank: raw.rank ?? null,
    rankDelta: raw.rankDelta ?? null,
    risingPercent: raw.risingPercent ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t) => typeof t === 'string') : [],
    source: raw.source,
    collectedAt: raw.collectedAt,
    verified: raw.verified === true,
    isSample: false,
    note: raw.note ?? null,
    ...(raw.audioTitle !== undefined ? { audioTitle: raw.audioTitle ?? null } : {}),
    ...(raw.artist !== undefined ? { artist: raw.artist ?? null } : {}),
    ...(raw.durationSec !== undefined ? { durationSec: raw.durationSec ?? null } : {}),
    ...(raw.usageCount !== undefined ? { usageCount: raw.usageCount ?? null } : {}),
    ...(raw.effectName !== undefined ? { effectName: raw.effectName ?? null } : {}),
    ...(raw.effectType !== undefined ? { effectType: raw.effectType ?? null } : {}),
    ...(raw.tutorialUrl !== undefined ? { tutorialUrl: raw.tutorialUrl ?? null } : {}),
  }
}

// ----------------------------------------------------------------------------
// 主流程
// ----------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const trigger =
    args.trigger ?? (process.env.GITHUB_EVENT_NAME === 'workflow_dispatch' ? 'manual' : process.env.GITHUB_ACTIONS ? 'schedule' : 'local')

  const sourcePath = args.source
    ? path.resolve(ROOT, args.source)
    : path.join(SOURCES_DIR, 'curated.json')

  const stamp = nowISO()
  const logEntry = {
    at: stamp,
    status: 'skipped',
    trigger,
    message: '',
    detail: [],
    error: null,
  }

  const finish = async (code) => {
    if (!args.dryRun && (logEntry.status === 'success' || logEntry.status === 'failed')) {
      const logsPath = path.join(DATA_DIR, 'logs.json')
      const existing = (await readJson(logsPath, null)) ?? { version: '1.0', logs: [] }
      const logs = Array.isArray(existing.logs) ? existing.logs : []
      const next = [logEntry, ...logs].slice(0, LOG_LIMIT)
      await writeJsonAtomic(logsPath, {
        version: '1.0',
        updatedAt: stamp,
        status: logEntry.status === 'failed' ? 'failed' : 'ok',
        mode: 'curated',
        items: [{ version: '1.0', logs: next }],
      })
      console.log(c.dim(`日志已写入 public/data/logs.json（共 ${next.length} 条）`))
    }
    process.exit(code)
  }

  console.log(c.dim(`[HOT TREND] ${stamp} 时区 ${TZ} 触发方式 ${trigger}`))

  if (!(await exists(sourcePath))) {
    logEntry.status = 'skipped'
    logEntry.message = '未找到快照源文件 scripts/sources/curated.json，本次不写入任何数据，示例数据保持不变。'
    console.log(c.yellow(`⚠ ${logEntry.message}`))
    console.log(c.dim('  提示：复制 scripts/sources/curated.example.json 为 curated.json 后按格式填写。'))
    // 跳过不写入日志文件，避免仓库每天产生无意义提交
    process.exit(0)
  }

  const snapshot = await readJson(sourcePath, null)
  if (!snapshot) {
    logEntry.status = 'failed'
    logEntry.message = '快照文件不是合法 JSON。'
    logEntry.error = `无法解析 ${path.relative(ROOT, sourcePath)}`
    console.error(c.red(`✗ ${logEntry.message}`))
    await finish(1)
    return
  }

  const datasets = snapshot.datasets ?? {}
  const errors = []

  // 逐数据集校验
  const normalized = {}
  for (const key of DATASETS) {
    const raw = datasets[key]
    if (raw === undefined) continue // 未提供 = 保持旧数据不动
    if (!Array.isArray(raw)) {
      errors.push(`datasets.${key}: 必须是数组`)
      continue
    }
    const seen = new Set()
    const list = raw
      .map((item, i) => normalizeTrendItem(item, `datasets.${key}[${i}]`, errors, seen))
      .filter(Boolean)
    normalized[key] = list
  }

  if (errors.length > 0) {
    logEntry.status = 'failed'
    logEntry.message = `快照校验未通过，共 ${errors.length} 处问题；已放弃本次写入，上一次有效数据完整保留。`
    logEntry.error = errors.slice(0, 8).join('\n')
    console.error(c.red(`✗ ${logEntry.message}`))
    errors.slice(0, 20).forEach((e) => console.error(c.red(`  · ${e}`)))
    await finish(1)
    return
  }

  const providedKeys = Object.keys(normalized)
  const totalItems = providedKeys.reduce((n, k) => n + normalized[k].length, 0)

  if (providedKeys.length === 0 || totalItems === 0) {
    logEntry.status = 'skipped'
    logEntry.message =
      providedKeys.length === 0
        ? '快照中 datasets 为空，本次无数据可写入，示例数据保持不变。'
        : '快照中各数据集均为空数组，本次无数据可写入，示例数据保持不变。'
    console.log(c.yellow(`⚠ ${logEntry.message}`))
    process.exit(0)
  }

  // ---------- 打印执行计划 ----------
  console.log(c.dim('执行计划：'))
  for (const k of providedKeys) {
    console.log(`  · ${k}: ${normalized[k].length} 条`)
  }
  if (args.dryRun) {
    console.log(c.green('✓ 校验通过（--dry-run，未写入任何文件）'))
    process.exit(0)
  }

  // ---------- 原子写入 ----------
  await mkdir(DATA_DIR, { recursive: true })

  for (const k of providedKeys) {
    const items = normalized[k]
    const payload = {
      version: '1.0',
      updatedAt: stamp,
      status: items.length > 0 ? 'ok' : 'empty',
      mode: 'curated',
      note: snapshot.note ?? null,
      items,
    }
    await writeJsonAtomic(path.join(DATA_DIR, `${k}.json`), payload)
    logEntry.detail.push({ dataset: k, count: items.length })
    console.log(c.green(`✓ 写入 public/data/${k}.json（${items.length} 条）`))
  }

  // ---------- 更新 meta ----------
  const metaPath = path.join(DATA_DIR, 'meta.json')
  const oldMeta = (await readJson(metaPath, null)) ?? { items: [] }
  const oldInner = oldMeta?.items?.[0] ?? {}

  // 统计全部数据集的条目数（读取磁盘最新值）
  const counts = {}
  for (const k of [...DATASETS, ...TEXT_DATASETS]) {
    const d = await readJson(path.join(DATA_DIR, `${k}.json`), null)
    counts[k] = Array.isArray(d?.items) ? d.items.length : 0
  }

  const nextMeta = {
    version: '1.0',
    siteName: oldInner.siteName ?? 'HOT TREND',
    updatedAt: stamp,
    timezone: TZ,
    mode: 'curated',
    platforms: PLATFORMS,
    counts,
    disclosures: Array.isArray(oldInner.disclosures) ? oldInner.disclosures : [],
    note:
      snapshot.note ??
      oldInner.note ??
      '数据来自人工核验快照；平台未公开的指标一律为 null，页面显示「未公开」。',
  }

  const metaPayload = {
    version: '1.0',
    updatedAt: stamp,
    status: 'ok',
    mode: 'curated',
    note: nextMeta.note,
    items: [nextMeta],
  }
  await writeJsonAtomic(metaPath, metaPayload)
  logEntry.detail.push({ dataset: 'meta', count: 1 })
  console.log(c.green('✓ 写入 public/data/meta.json'))

  logEntry.status = 'success'
  logEntry.message = `更新完成，共写入 ${totalItems} 条热点数据。`
  console.log(c.green(`✓ ${logEntry.message}`))
  await finish(0)
}

main().catch(async (e) => {
  console.error(c.red(`✗ 未预期错误：${e?.stack ?? e}`))
  process.exit(1)
})
