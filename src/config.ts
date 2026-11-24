/**
 * 站点级配置。仓库地址在创建 GitHub 仓库后填入，
 * 用于「手动更新」面板中的 Actions 跳转链接（不会暴露任何 Token）。
 */
export const SITE = {
  name: 'HOT TREND',
  tagline: '短视频热点观察台',
  version: 'V1.0',
  timezone: 'Asia/Shanghai',
  /** 例：https://github.com/yourname/hot-trend （创建仓库后替换这一行） */
  repoUrl: '',
} as const

export function buildActionsUrl(repoUrl: string): string {
  if (!repoUrl) return ''
  return `${repoUrl.replace(/\/+$/, '')}/actions/workflows/update.yml`
}

export function buildRepoIssuesUrl(repoUrl: string): string {
  if (!repoUrl) return ''
  return `${repoUrl.replace(/\/+$/, '')}/actions`
}
