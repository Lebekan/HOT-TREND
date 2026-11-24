import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Nav'
import { DataPanel } from './components/DataPanel'
import { ToastProvider } from './components/ui'
import { useData } from './hooks/useData'
import { useFavorites } from './hooks/useFavorites'
import { useTheme } from './hooks/useTheme'
import { getRouteDef, parseHash, routeToHash } from './lib/router'
import type { RouteKey } from './types'
import { SITE } from './config'
import { TodayPage } from './pages/TodayPage'
import { AudiosPage } from './pages/AudiosPage'
import { EffectsPage } from './pages/EffectsPage'
import { CopiesPage } from './pages/CopiesPage'
import { QuotesPage } from './pages/QuotesPage'
import { DouyinPage } from './pages/DouyinPage'
import { KuaishouPage } from './pages/KuaishouPage'
import { RisingPage } from './pages/RisingPage'
import { FavoritesPage } from './pages/FavoritesPage'

function Shell() {
  const [route, setRoute] = useState<RouteKey>(() => parseHash(window.location.hash))
  const [query, setQuery] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const { data, state, reload } = useData()
  const favorites = useFavorites()
  const { mode: themeMode, cycle } = useTheme()

  /* ---------- 路由：hash 变化同步 ---------- */
  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = useCallback((key: RouteKey) => {
    const next = routeToHash(key)
    if (window.location.hash === next) return
    window.location.hash = next
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  /* 切换栏目时清空搜索，避免「以为数据丢了」 */
  useEffect(() => {
    setQuery('')
  }, [route])

  const def = getRouteDef(route)

  const statusTone: 'ok' | 'warn' | 'error' = state.error
    ? 'error'
    : data.meta?.mode === 'sample' || state.fromCache
      ? 'warn'
      : 'ok'

  const pageProps = useMemo(
    () => ({ data, state, favorites, query, onOpenDataPanel: () => setPanelOpen(true) }),
    [data, state, favorites, query]
  )

  const page = (() => {
    switch (route) {
      case 'today':
        return <TodayPage {...pageProps} />
      case 'audios':
        return <AudiosPage {...pageProps} />
      case 'effects':
        return <EffectsPage {...pageProps} />
      case 'copies':
        return <CopiesPage {...pageProps} />
      case 'quotes':
        return <QuotesPage {...pageProps} />
      case 'douyin':
        return <DouyinPage {...pageProps} />
      case 'kuaishou':
        return <KuaishouPage {...pageProps} />
      case 'rising':
        return <RisingPage {...pageProps} />
      case 'favorites':
        return <FavoritesPage {...pageProps} />
      default:
        return <TodayPage {...pageProps} />
    }
  })()

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        current={route}
        onNavigate={navigate}
        favoritesCount={favorites.list.length}
        onOpenDataPanel={() => setPanelOpen(true)}
        statusTone={statusTone}
      />

      <div className="lg:pl-[236px]">
        <Header
          routeTitle={def.label}
          routeDesc={def.desc}
          current={route}
          onNavigate={navigate}
          favoritesCount={favorites.list.length}
          query={query}
          onQueryChange={setQuery}
          themeMode={themeMode}
          onCycleTheme={cycle}
          onOpenDataPanel={() => setPanelOpen(true)}
          updatedAt={data.meta?.updatedAt ?? null}
          statusTone={statusTone}
          loading={state.loading}
        />

        <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-4 lg:px-8 lg:pt-6">
          <div key={route} className="animate-fade-up">
            {page}
          </div>

          <footer className="mt-10 border-t border-line pt-5 text-2xs leading-relaxed text-muted/80">
            <p>
              {SITE.name} {SITE.version} · 个人自用热点观察台 · 数据以 JSON 静态文件形式托管于 GitHub Pages，
              无后端、无账号体系、不采集任何个人信息。
            </p>
            <p className="mt-1.5">
              指标口径以数据来源为准；平台未公开的数值一律显示「未公开」，本项目不做估算。
              视频与音频均通过官方页面链接访问，不在本站二次分发。
            </p>
            <p className="mt-1.5">
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="underline underline-offset-2 hover:text-ink cursor-pointer"
              >
                数据来源与更新日志
              </button>
            </p>
          </footer>
        </main>
      </div>

      <DataPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        meta={data.meta}
        logs={data.logs}
        isSample={data.meta?.mode === 'sample'}
        fromCache={state.fromCache}
        onReload={reload}
      />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}
