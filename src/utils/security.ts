// ============================================
//  security.ts - 安全工具函数
//  XSS 防护、输入校验、敏感信息处理
// ============================================

/**
 * HTML 转义（防止 XSS）
 * 用于用户输入的内容展示
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
 * 还原 HTML 转义
 */
export function unescapeHtml(str: unknown): string {
  if (str === null || str === undefined) return ''
  const s = String(str)
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}

/**
 * URL 参数安全转义
 * 用于 URL path/query 中的用户输入
 */
export function escapeUrlParam(str: unknown): string {
  if (str === null || str === undefined) return ''
  return encodeURIComponent(String(str))
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
}

/**
 * 手机号脱敏展示
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

/**
 * 银行卡号脱敏展示
 */
export function maskBankCard(card: string): string {
  if (!card || card.length < 8) return card
  return `${card.slice(0, 4)} **** **** ${card.slice(-4)}`
}

/**
 * 姓名脱敏
 */
export function maskName(name: string): string {
  if (!name || name.length < 2) return name
  return `${name[0]}${'*'.repeat(name.length - 1)}`
}

/**
 * 身份证号脱敏
 */
export function maskIdCard(id: string): string {
  if (!id || id.length < 10) return id
  return `${id.slice(0, 4)} **** **** ${id.slice(-4)}`
}

/**
 * 输入长度限制（防 DoS）
 */
export function truncate(str: unknown, maxLen = 200): string {
  const s = String(str || '')
  return s.length > maxLen ? s.slice(0, maxLen) : s
}

/**
 * 过滤emoji（如果业务不需要）
 */
export function stripEmoji(str: unknown): string {
  return String(str || '').replace(
    /(?:[\u2700-\u27BF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|[\u2600-\u2B55])/g,
    ''
  )
}

/**
 * 检查字符串是否为纯数字（用于 ID/数量等）
 */
export function isNumeric(str: unknown): boolean {
  if (str === null || str === undefined) return false
  return /^[0-9]+$/.test(String(str))
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
 * 验证手机号格式（中国大陆）
 */
export function isValidPhone(phone: unknown): boolean {
  return /^1[3-9]\d{9}$/.test(String(phone || ''))
}

/**
 * 验证密码强度（至少6位字母+数字）
 */
export function isValidPassword(pwd: unknown): boolean {
  const s = String(pwd || '')
  return s.length >= 6 && s.length <= 32
}
