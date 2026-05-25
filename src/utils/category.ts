export interface HomeCategory {
  id: string
  name: string
  icon?: string
}

/** 首页 / 分类 API 不可用时的默认分类 */
export const HOME_CATEGORY_FALLBACK: HomeCategory[] = [
  { id: 'cat-1', name: '数码电子' },
  { id: 'cat-2', name: '生活用品' },
  { id: 'cat-3', name: '食品生鲜' },
  { id: 'cat-4', name: '服饰箱包' },
  { id: 'cat-5', name: '美妆护肤' },
  { id: 'cat-6', name: '家电厨具' },
  { id: 'cat-7', name: '母婴玩具' },
]

/** 兼容 /products/categories 多种响应：数组或 { list | categories | data } */
export function normalizeCategoryTree(res: unknown): HomeCategory[] {
  if (Array.isArray(res)) return res
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>
    for (const key of ['list', 'categories', 'data', 'items']) {
      const val = o[key]
      if (Array.isArray(val)) return val
    }
  }
  return []
}

export function flattenCategories(list: HomeCategory[]): { id: string; name: string; icon: string }[] {
  const out: { id: string; name: string; icon: string }[] = []
  for (const c of list) {
    if (!c?.id || !c?.name) continue
    out.push({ id: String(c.id), name: String(c.name), icon: c.icon || '' })
    if (c.children?.length) {
      for (const ch of c.children) {
        if (!ch?.id || !ch?.name) continue
        out.push({ id: String(ch.id), name: String(ch.name), icon: ch.icon || '' })
      }
    }
  }
  return out
}
