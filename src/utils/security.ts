// ============================================
//  security.ts - 安全工具函数
//  仅保留实际使用的工具函数
// ============================================

/**
 * HTML 转义（防止 XSS）
 * 用于 api.ts 错误信息展示
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return ''
  const s = String(str)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * 范围数值安全获取
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

/**
 * 金额精度处理（最多2位小数）
 */
export function formatAmount(value: unknown, decimals = 2): string {
  const num = parseFloat(String(value || '0'))
  if (isNaN(num)) return '0.00'
  return num.toFixed(decimals)
}

/**
 * 积分格式化（千分位）
 */
export function formatPoints(value: unknown): string {
  const num = parseInt(String(value || '0'), 10)
  if (isNaN(num)) return '0'
  return num.toLocaleString('zh-CN')
}

/**
 * 搜索关键词清理（防 XSS）
 */
export function sanitizeKeyword(kw: string): string {
  return String(kw || '').replace(/[<>'"`;\\]/g, '').trim().slice(0, 100)
}

/**
 * 订单号清理
 */
export function sanitizeOrderNo(no: string): string {
  return String(no || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32)
}

/**
 * ID 清理（只留数字+字母）
 */
export function sanitizeId(id: string): string {
  return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
}
