/**
 * 极简 hash 路由。
 * 选型理由：GitHub Pages 是纯静态托管，没有服务端重写能力。
 * 用 hash 路由（#/today）可避免刷新 404，也不需要 404.html 兜底技巧，
 * 同时保留浏览器前进/后退与可分享深链。
 */
import type { RouteKey } from '../types'

export interface RouteDef {
  key: RouteKey
  path: string
  label: string
  short: string
  group: 'discover' | 'rank' | 'library'
  desc: string
}

export const ROUTES: RouteDef[] = [
  {
    key: 'today',
    path: '/today',
    label: '今日热门视频',
    short: '今日热门',
    group: 'discover',
    desc: '抖音与快手当日公开热点视频，按平台公开信息展示',
  },
  {
    key: 'audios',
    path: '/audios',
    label: '热门音频',
    short: '热门音频',
    group: 'discover',
    desc: '平台公开的热门音乐与配音素材，可跳转原平台使用',
  },
  {
    key: 'effects',
    path: '/effects',
    label: '热门特效',
    short: '热门特效',
    group: 'discover',
    desc: '滤镜、贴纸、转场等平台特效道具',
  },
  {
    key: 'copies',
    path: '/copies',
    label: '爆款文案',
    short: '爆款文案',
    group: 'library',
    desc: '按场景整理的原创文案模板，一键复制',
  },
  {
    key: 'quotes',
    path: '/quotes',
    label: '经典语录',
    short: '经典语录',
    group: 'library',
    desc: '可复用的金句与短文案素材',
  },
  {
    key: 'douyin',
    path: '/douyin',
    label: '抖音热门榜',
    short: '抖音榜',
    group: 'rank',
    desc: '抖音公开榜单记录',
  },
  {
    key: 'kuaishou',
    path: '/kuaishou',
    label: '快手热门榜',
    short: '快手榜',
    group: 'rank',
    desc: '快手公开榜单记录',
  },
  {
    key: 'rising',
    path: '/rising',
    label: '上升最快榜',
    short: '上升最快',
    group: 'rank',
    desc: '名次变化最显著的条目',
  },
  {
    key: 'favorites',
    path: '/favorites',
    label: '历史收藏',
    short: '收藏',
    group: 'library',
    desc: '保存在本机的收藏，不上传任何服务器',
  },
]

export const DEFAULT_ROUTE: RouteKey = 'today'

export function parseHash(hash: string): RouteKey {
  const clean = hash.replace(/^#/, '').replace(/\/+$/, '')
  if (!clean || clean === '/') return DEFAULT_ROUTE
  const found = ROUTES.find((r) => r.path === clean)
  return found ? found.key : DEFAULT_ROUTE
}

export function routeToHash(key: RouteKey): string {
  const found = ROUTES.find((r) => r.key === key)
  return `#${found ? found.path : '/today'}`
}

export function getRouteDef(key: RouteKey): RouteDef {
  return ROUTES.find((r) => r.key === key) ?? ROUTES[0]
}

/** 取当前 hash 中携带的查询参数（形如 #/today?q=xxx） */
export function parseQuery(hash: string): URLSearchParams {
  const idx = hash.indexOf('?')
  return new URLSearchParams(idx >= 0 ? hash.slice(idx + 1) : '')
}
