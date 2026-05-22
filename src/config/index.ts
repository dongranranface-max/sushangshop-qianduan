/** API 基础地址，可通过 .env 或构建时覆盖 */
export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://47.96.102.163/api/v1'

export const BRAND_NAME = '集享公社'

/** 品牌 Logo（统一引用，512×512 高清，由 optimize-assets 从 jixianggongshe/jxgs.png 生成） */
export const LOGO_SRC = '/static/logo.png'

/** 品牌金线渐变 */
export const AI_GRADIENT =
  'linear-gradient(135deg, #E8D5B5 0%, #C4A574 50%, #9A7B4F 100%)'
