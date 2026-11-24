/** 数字 / 时间 / 差值的统一格式化。所有函数对 null 安全，绝不把未知值显示为 0。 */

/** 数字格式化：1234 → 1,234；>=1万 用「万」；>=1亿 用「亿」。null → '未公开' */
export function formatCount(n?: number | null, emptyText = '未公开'): string {
  if (n === null || n === undefined || Number.isNaN(n)) return emptyText
  if (n < 0) return '0'
  if (n < 10000) return n.toLocaleString('zh-CN')
  if (n < 100000000) {
    const v = n / 10000
    return `${trimZero(v)}万`
  }
  const v = n / 100000000
  return `${trimZero(v)}亿`
}

function trimZero(v: number): string {
  const fixed = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(1)
  return fixed.replace(/\.0$/, '')
}

/** 千分位（不换算单位） */
export function formatPlain(n?: number | null, emptyText = '未公开'): string {
  if (n === null || n === undefined || Number.isNaN(n)) return emptyText
  return n.toLocaleString('zh-CN')
}

/** ISO → 2026-11-24 08:00（按指定时区） */
export function formatDateTime(iso?: string | null, timezone = 'Asia/Shanghai'): string {
  if (!iso) return '尚未更新'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '时间无效'
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`
}

/** 只取月-日 */
export function formatMonthDay(iso?: string | null, timezone = 'Asia/Shanghai'): string {
  const full = formatDateTime(iso, timezone)
  if (full === '尚未更新' || full === '时间无效') return full
  return full.slice(5, 10)
}

/** 相对时间：刚刚 / 3 小时前 / 2 天前 */
export function formatRelative(iso?: string | null): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  const diff = Date.now() - t
  if (diff < 0) return '刚刚'
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day < 30) return `${day} 天前`
  const month = Math.floor(day / 30)
  if (month < 12) return `${month} 个月前`
  return `${Math.floor(month / 12)} 年前`
}

/** 名次变化 → { text, tone } */
export function formatDelta(delta?: number | null): {
  text: string
  tone: 'up' | 'down' | 'flat' | 'unknown'
} {
  if (delta === null || delta === undefined || Number.isNaN(delta)) {
    return { text: '—', tone: 'unknown' }
  }
  if (delta === 0) return { text: '持平', tone: 'flat' }
  if (delta > 0) return { text: `↑ ${delta}`, tone: 'up' }
  return { text: `↓ ${Math.abs(delta)}`, tone: 'down' }
}

/** 时长 235 → 03:55 */
export function formatDuration(sec?: number | null): string {
  if (sec === null || sec === undefined || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 生成日期字符串，如 2026年11月24日 周二 */
export function formatToday(timezone = 'Asia/Shanghai'): string {
  const now = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const y = get('year')
  const m = get('month')
  const d = get('day')
  // weekday 部分有的环境返回「周二」，有的返回「2」
  const rawW = get('weekday')
  const w = rawW.includes('周') ? rawW : weekdays[now.getDay()]
  return `${y}年${m}${d} ${w}`
}
