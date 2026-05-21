import { LOGO_SRC } from '@/config'

/** 商品默认封面 */
export const DEFAULT_PRODUCT_COVER = LOGO_SRC

/** 用户默认头像 */
export const DEFAULT_AVATAR = LOGO_SRC

/** 首页轮播占位（品牌渐变底图，不依赖外网） */
export const HOME_BANNERS = [
  {
    image: '',
    link: 'consume',
    tag: '新人专享',
    title: '悦享消费 · 智蕴资产 · 积分抵现',
    sub: '消费商城热卖 · 确认收货返生态积分',
    cta: '去逛逛',
    theme: 'consume',
  },
  {
    image: '',
    link: 'exchange',
    tag: '省钱换购',
    title: '积分抵现更划算',
    sub: '绑定银行卡 · 生态积分换算好物',
    cta: '去看看',
    theme: 'exchange',
  },
  {
    image: '',
    link: 'wealth',
    tag: '12%+ 年化',
    title: '增值专区理财',
    sub: '每日收益 · 等级分红 · 资产稳健增值',
    cta: '了解详情',
    theme: 'wealth',
  },
] as const

export function resolveProductCover(product?: {
  coverImage?: string
  coverImages?: string[] | string
  image?: string
}): string {
  if (!product) return DEFAULT_PRODUCT_COVER
  // coverImages 可能返回 JSON 字符串或数组
  let imgs = product.coverImages
  if (typeof imgs === 'string') {
    try { imgs = JSON.parse(imgs) } catch { imgs = [] }
  }
  if (Array.isArray(imgs) && imgs.length > 0) {
    // 支持 [{url: '...'}] 或 ['url1', 'url2'] 两种格式
    const first = imgs[0]
    if (typeof first === 'object' && first !== null && 'url' in first) {
      return (first as { url: string }).url || DEFAULT_PRODUCT_COVER
    }
    return String(first) || DEFAULT_PRODUCT_COVER
  }
  if (product.coverImage) return product.coverImage
  if (product.image) return product.image
  return DEFAULT_PRODUCT_COVER
}

export function resolveAvatar(url?: string): string {
  return url && String(url).trim() ? url : DEFAULT_AVATAR
}
