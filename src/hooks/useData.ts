import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AudioItem,
  CopyItem,
  Dataset,
  EffectItem,
  LogDataset,
  LogEntry,
  MetaDataset,
  QuoteItem,
  TrendItem,
} from '../types'
import { readStore, writeStore } from '../lib/storage'

const BASE = import.meta.env.BASE_URL || '/'

export interface AllData {
  meta: MetaDataset | null
  videos: TrendItem[]
  audios: AudioItem[]
  effects: EffectItem[]
  douyin: TrendItem[]
  kuaishou: TrendItem[]
  rising: TrendItem[]
  copies: CopyItem[]
  quotes: QuoteItem[]
  logs: LogEntry[]
}

export interface DatasetState {
  loading: boolean
  /** 无法从网络获取、正在使用本机缓存（代表数据可能不是最新的） */
  fromCache: boolean
  /** 整站级错误信息，null 表示一切正常 */
  error: string | null
  /** 每个数据集独立的错误，用于局部提示 */
  errors: Record<string, string>
  updatedAt: string | null
}

const EMPTY: AllData = {
  meta: null,
  videos: [],
  audios: [],
  effects: [],
  douyin: [],
  kuaishou: [],
  rising: [],
  copies: [],
  quotes: [],
  logs: [],
}

/** 数据集文件名与字段映射 */
const FILES = [
  ['meta', 'meta.json'],
  ['videos', 'videos.json'],
  ['audios', 'audios.json'],
  ['effects', 'effects.json'],
  ['douyin', 'douyin.json'],
  ['kuaishou', 'kuaishou.json'],
  ['rising', 'rising.json'],
  ['copies', 'copies.json'],
  ['quotes', 'quotes.json'],
  ['logs', 'logs.json'],
] as const

type FileKey = (typeof FILES)[number][0]

function cacheKey(file: string) {
  return `cache:${file}`
}

/**
 * 读取单个数据集。
 * 顺序：网络 → 本机缓存（上一次有效数据） → 空数据集。
 * 这条链路是「自动更新失败时保留上一次有效数据」的前端保障。
 */
async function loadOne<T>(file: string): Promise<{ data: Dataset<T> | null; cached: boolean; error: string | null }> {
  try {
    const res = await fetch(`${BASE}data/${file}`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as Dataset<T>
    if (!json || !Array.isArray(json.items)) throw new Error('数据结构不符合预期')
    writeStore(cacheKey(file), json)
    return { data: json, cached: false, error: null }
  } catch (e) {
    const cachedData = readStore<Dataset<T> | null>(cacheKey(file), null)
    if (cachedData && Array.isArray(cachedData.items)) {
      return {
        data: cachedData,
        cached: true,
        error: e instanceof Error ? e.message : '读取失败',
      }
    }
    return { data: null, cached: false, error: e instanceof Error ? e.message : '读取失败' }
  }
}

export function useData() {
  const [data, setData] = useState<AllData>(EMPTY)
  const [state, setState] = useState<DatasetState>({
    loading: true,
    fromCache: false,
    error: null,
    errors: {},
    updatedAt: null,
  })
  const [reloadToken, setReloadToken] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))

    ;(async () => {
      const results = await Promise.all(FILES.map(([, file]) => loadOne<unknown>(file)))
      if (cancelled || !mounted.current) return

      const errors: Record<string, string> = {}
      let anyCached = false
      let anyNetworkFail = false
      const next: AllData = { ...EMPTY }

      results.forEach((r, i) => {
        const key = FILES[i][0] as FileKey
        if (r.error) {
          errors[key] = r.error
          anyNetworkFail = true
        }
        if (r.cached) anyCached = true

        if (key === 'meta') {
          next.meta = (r.data as Dataset<MetaDataset> | null)?.items?.[0] ?? null
          return
        }
        if (key === 'logs') {
          next.logs = ((r.data as Dataset<LogDataset> | null)?.items?.[0]?.logs ?? []) as LogEntry[]
          return
        }
        const items = (r.data as Dataset<unknown> | null)?.items ?? []
        switch (key) {
          case 'videos':
            next.videos = items as TrendItem[]
            break
          case 'audios':
            next.audios = items as AudioItem[]
            break
          case 'effects':
            next.effects = items as EffectItem[]
            break
          case 'douyin':
            next.douyin = items as TrendItem[]
            break
          case 'kuaishou':
            next.kuaishou = items as TrendItem[]
            break
          case 'rising':
            next.rising = items as TrendItem[]
            break
          case 'copies':
            next.copies = items as CopyItem[]
            break
          case 'quotes':
            next.quotes = items as QuoteItem[]
            break
        }
      })

      setData(next)
      setState({
        loading: false,
        fromCache: anyCached,
        error: anyNetworkFail && anyCached ? '网络数据获取失败，已切换为本机缓存的上一次有效数据。' : null,
        errors,
        updatedAt: next.meta?.updatedAt ?? null,
      })
    })()

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])

  /** 全站是否为示例/空数据模式 */
  const isSample = useMemo(() => {
    const m = data.meta?.mode
    if (m) return m === 'sample'
    return [...data.videos, ...data.audios, ...data.effects].some((i) => i.isSample)
  }, [data])

  return { data, state, reload, isSample }
}
