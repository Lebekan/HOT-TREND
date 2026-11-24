/**
 * HOT TREND V1.0 数据契约
 * -------------------------------------------------
 * 设计原则：只承载「可核验」的字段。
 * 平台未公开的指标一律为 null，前端显示「未公开」，
 * 绝不以估算值填充，也不允许把展示顺序当作排名显示。
 */

export type Platform = 'douyin' | 'kuaishou'

export const PLATFORM_LABEL: Record<Platform, string> = {
  douyin: '抖音',
  kuaishou: '快手',
}

/** 指标容器。任一字段为 null / undefined 表示「未公开」 */
export interface Metrics {
  /** 播放量 */
  play?: number | null
  /** 点赞量 */
  like?: number | null
  /** 评论量 */
  comment?: number | null
  /** 分享量 */
  share?: number | null
  /** 收藏量 */
  collect?: number | null
  /** 平台给出的热度值（仅当来源明确给出该口径时才填） */
  heat?: number | null
  /** 指标口径说明，例如「数据来自平台公开榜单页，取整」 */
  note?: string | null
}

/** 每条数据集的统一信封 */
export interface Dataset<T> {
  /** 数据结构版本 */
  version: string
  /** 最近一次成功更新的时间（ISO 8601，含时区偏移） */
  updatedAt: string | null
  /** 最近一次更新状态 */
  status: 'ok' | 'failed' | 'empty'
  /** 数据来源模式 */
  mode: DataMode
  /** 备注，用于说明数据边界 */
  note?: string | null
  items: T[]
}

export type DataMode =
  /** 仅示例骨架，未载入真实数据 */
  | 'sample'
  /** 由人工核验的快照源导入 */
  | 'curated'

/** 视频 / 音频 / 特效 / 榜单条目共用基础字段 */
export interface TrendItem {
  id: string
  platform: Platform
  title: string
  /** 作者昵称 */
  author?: string | null
  /** 内容分类，用于筛选 */
  category: string
  /** 封面图地址（可为空；空则显示占位图） */
  cover?: string | null
  /** 平台原始链接：必须指向官方域名，用于合规跳转 */
  url: string
  /** 一句话看点／摘要 */
  summary?: string | null
  metrics?: Metrics
  /** 平台公开排名。null = 来源未提供排名，此时仅按展示顺序排列 */
  rank?: number | null
  /** 名次变化：正数=上升，负数=下降，0=持平，null=未知 */
  rankDelta?: number | null
  /** 上升幅度（百分比），仅当来源明确给出时填写 */
  risingPercent?: number | null
  /** 标签 */
  tags?: string[]
  /** 数据来源描述 */
  source: string
  /** 采集／核验时间 ISO */
  collectedAt: string
  /** 是否人工核验过 */
  verified: boolean
  /** 是否为示例占位条目 */
  isSample?: boolean
  /** 补充说明 */
  note?: string | null
}

/** 音频条目 */
export interface AudioItem extends TrendItem {
  /** 音频名 */
  audioTitle?: string | null
  /** 演唱／制作 */
  artist?: string | null
  /** 时长（秒） */
  durationSec?: number | null
  /** 使用该音频的作品数（平台公开时才填） */
  usageCount?: number | null
}

/** 特效条目 */
export interface EffectItem extends TrendItem {
  /** 特效名 */
  effectName?: string | null
  /** 特效类型：滤镜／贴纸／转场／道具 */
  effectType?: string | null
  /** 使用该特效的作品数 */
  usageCount?: number | null
  /** 官方教程或使用入口 */
  tutorialUrl?: string | null
}

/** 爆款文案条目（纯文本资产，不含指标） */
export interface CopyItem {
  id: string
  title: string
  content: string
  /** 分类：口播 / 剧情 / 带货 / 情感 / 知识 */
  category: string
  /** 适用平台 */
  platforms: Platform[]
  /** 适用场景说明 */
  usage?: string | null
  tags: string[]
  source: string
  collectedAt: string
  verified: boolean
  isSample?: boolean
}

/** 经典语录条目 */
export interface QuoteItem {
  id: string
  content: string
  /** 出处／作者，未知填 null，不编造 */
  author?: string | null
  category: string
  tags: string[]
  source: string
  collectedAt: string
  verified: boolean
  isSample?: boolean
}

/** 更新执行日志 */
export interface LogEntry {
  /** 执行时间 ISO */
  at: string
  /** 结果 */
  status: 'success' | 'failed' | 'skipped'
  /** 触发方式 */
  trigger: 'schedule' | 'manual' | 'local'
  /** 摘要信息 */
  message: string
  /** 本次写入的数据集与条目数 */
  detail?: { dataset: string; count: number }[]
  /** 失败原因 */
  error?: string | null
}

export interface LogDataset {
  version: string
  logs: LogEntry[]
}

/** 站点元信息 */
export interface MetaDataset {
  version: string
  siteName: string
  updatedAt: string | null
  timezone: string
  mode: DataMode
  platforms: Platform[]
  /** 各数据集条目数快照 */
  counts: Record<string, number>
  /** 数据边界说明，前端「关于数据」面板直接展示 */
  disclosures: string[]
  /** 数据口径备注，首页概览条直接展示 */
  note?: string | null
}

/** 路由键 */
export type RouteKey =
  | 'today'
  | 'audios'
  | 'effects'
  | 'copies'
  | 'quotes'
  | 'douyin'
  | 'kuaishou'
  | 'rising'
  | 'favorites'
