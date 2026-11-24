import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AudioItem, CopyItem, EffectItem, QuoteItem, TrendItem } from '../types'
import { readStore, STORAGE_KEYS, writeStore } from '../lib/storage'

export type FavoriteKind = 'video' | 'audio' | 'effect' | 'copy' | 'quote'
export type FavoritePayload = TrendItem | AudioItem | EffectItem | CopyItem | QuoteItem

export interface FavoriteRecord {
  /** 唯一键：kind:id */
  key: string
  kind: FavoriteKind
  /** 收藏时的完整快照，即使线上数据轮换后仍可查看 */
  item: FavoritePayload
  savedAt: string
  /** 收藏来源页面，便于回跳 */
  from: string
  /** 备注，可自行补充 */
  memo?: string
}

function makeKey(kind: FavoriteKind, id: string) {
  return `${kind}:${id}`
}

export function useFavorites() {
  const [list, setList] = useState<FavoriteRecord[]>(() =>
    readStore<FavoriteRecord[]>(STORAGE_KEYS.favorites, [])
  )

  // 多标签页同步
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.endsWith(STORAGE_KEYS.favorites)) {
        setList(readStore<FavoriteRecord[]>(STORAGE_KEYS.favorites, []))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const persist = useCallback((next: FavoriteRecord[]) => {
    setList(next)
    writeStore(STORAGE_KEYS.favorites, next)
  }, [])

  const keySet = useMemo(() => new Set(list.map((f) => f.key)), [list])

  const isFavorite = useCallback(
    (kind: FavoriteKind, id: string) => keySet.has(makeKey(kind, id)),
    [keySet]
  )

  const toggle = useCallback(
    (kind: FavoriteKind, item: FavoritePayload, from = ''): boolean => {
      const key = makeKey(kind, item.id)
      const exists = list.some((f) => f.key === key)
      if (exists) {
        persist(list.filter((f) => f.key !== key))
        return false
      }
      const record: FavoriteRecord = {
        key,
        kind,
        item,
        savedAt: new Date().toISOString(),
        from,
      }
      persist([record, ...list])
      return true
    },
    [list, persist]
  )

  const remove = useCallback(
    (key: string) => persist(list.filter((f) => f.key !== key)),
    [list, persist]
  )

  const clear = useCallback(() => persist([]), [persist])

  const updateMemo = useCallback(
    (key: string, memo: string) =>
      persist(list.map((f) => (f.key === key ? { ...f, memo } : f))),
    [list, persist]
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const f of list) c[f.kind] = (c[f.kind] ?? 0) + 1
    return c
  }, [list])

  return { list, isFavorite, toggle, remove, clear, updateMemo, counts }
}
