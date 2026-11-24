/** 轻量样式合并，避免为一个小功能引入 clsx 依赖。 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
