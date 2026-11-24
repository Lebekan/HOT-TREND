import { useCallback, useEffect, useState } from 'react'
import { readStore, STORAGE_KEYS, writeStore } from '../lib/storage'

export type ThemeMode = 'light' | 'dark' | 'system'

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(mode: ThemeMode) {
  const dark = mode === 'dark' || (mode === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', dark)
  // 同步浏览器 UI 颜色
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#0C0B0E' : '#FAF9F7')
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() =>
    readStore<ThemeMode>(STORAGE_KEYS.theme, 'system')
  )

  useEffect(() => {
    apply(mode)
    writeStore(STORAGE_KEYS.theme, mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => apply('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  const cycle = useCallback(() => {
    setMode((m) => (m === 'light' ? 'dark' : m === 'dark' ? 'system' : 'light'))
  }, [])

  return { mode, setMode, cycle }
}
