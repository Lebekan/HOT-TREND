/** 类型安全的 localStorage 封装：隐私模式 / 配额不足 / 脏数据都不会让页面崩溃。 */

const PREFIX = 'hot-trend:v1:'

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStore<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeStore(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* 忽略 */
  }
}

export const STORAGE_KEYS = {
  favorites: 'favorites',
  theme: 'theme',
  lastVisit: 'last-visit',
} as const
