/**
 * 复制到剪贴板。
 * 优先 navigator.clipboard（需要 HTTPS 或 localhost），
 * 降级到 textarea + execCommand，保证在 http 环境与旧浏览器也能用。
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* 继续降级 */
    }
  }

  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, ta.value.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
