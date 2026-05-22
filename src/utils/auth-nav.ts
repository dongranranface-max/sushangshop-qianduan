const TAB_ROUTES = [
  '/pages/index/index',
  '/pages/catalog/index',
  '/pages/cart/index',
  '/pages/wealth/index',
  '/pages/user/index',
]

/** 登录/注册成功后跳转（支持 redirect 回跳） */
export function navigateAfterAuth(redirect?: string) {
  const raw = redirect || '/pages/index/index'
  const pathOnly = raw.split('?')[0]
  const isTab = TAB_ROUTES.some((r) => pathOnly === r)
  if (isTab) {
    uni.switchTab({ url: pathOnly })
  } else {
    uni.redirectTo({
      url: raw,
      fail: () => uni.switchTab({ url: '/pages/index/index' }),
    })
  }
}

export function buildAuthQuery(redirect?: string, extra?: Record<string, string>) {
  const parts: string[] = []
  if (redirect) parts.push(`redirect=${encodeURIComponent(redirect)}`)
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) parts.push(`${k}=${encodeURIComponent(v)}`)
    }
  }
  return parts.length ? `?${parts.join('&')}` : ''
}
