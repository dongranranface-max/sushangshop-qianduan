// ============================================
//  api.ts - API 请求封装（严格遵循 API 契约）
//  Base URL: http://47.96.102.163/api/v1
//  认证方式: Bearer Token（从本地存储获取）
// ============================================
import { API_BASE_URL } from '@/config'
import { sanitizeKeyword, sanitizeOrderNo, sanitizeId, escapeHtml } from './security'
import { generateSignHeaders, needsSign } from './signature'

const BASE_URL = API_BASE_URL

// --------------------------------------------
//  Token 管理
// --------------------------------------------
function getToken(): string {
  return uni.getStorageSync('token') || ''
}

function setToken(token: string) {
  uni.setStorageSync('token', token)
}

function clearToken() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userId')
}

function getUserId(): string {
  return uni.getStorageSync('userId') || ''
}

function setUserInfo(user: { id: string; phone: string; nickname?: string; avatar?: string; level?: number }) {
  uni.setStorageSync('userId', user.id)
  if (user.nickname) uni.setStorageSync('nickname', user.nickname)
  if (user.avatar) uni.setStorageSync('avatar', user.avatar)
  if (user.level !== undefined) uni.setStorageSync('level', user.level)
}

// --------------------------------------------
//  请求核心
// --------------------------------------------
interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

function request<T = unknown>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.header,
    }
    const token = getToken()
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    // 安全增强：清理请求 URL 中的特殊字符（防 XSS）
    const cleanUrl = options.url.replace(/[<>'"`;]/g, '')

    // 防篡改签名（金额/积分相关写操作）
    const method = options.method || 'GET'
    if (needsSign(method, cleanUrl)) {
      const signHeaders = generateSignHeaders(options.data || {})
      Object.assign(header, signHeaders)
    }

    uni.request({
      url: `${BASE_URL}${cleanUrl}`,
      method,
      data: options.data,
      header,
      success: (res: any) => {
        // 业务错误码：{ code, message, data }（API_SPEC v1.2）
        const body = res.data as any
        const errMsg = escapeHtml(body?.message || body?.msg || '请求失败')
        if (body && typeof body.code !== 'undefined') {
          if (body.code === 0 || body.code === 200) {
            resolve(body.data as T)
            return
          }
          if (res.statusCode === 401 || body.code === 401) {
            clearToken()
            uni.showToast({ title: '请重新登录', icon: 'none' })
            setTimeout(() => uni.navigateTo({ url: '/pages/auth/login' }), 1200)
            reject(new Error(errMsg))
            return
          }
          if (body.code === 422) {
            uni.showToast({ title: errMsg, icon: 'none' })
          }
          reject(new Error(errMsg))
          return
        }
        // 无 code 字段的非标准响应（少数情况）
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body as T)
          return
        }
        reject(new Error(`HTTP ${res.statusCode}`))
      },
      fail: (err: any) => {
        reject(new Error(err.errMsg || '网络请求失败'))
      },
    })
  })
}

// --------------------------------------------
//  认证模块 /auth
// --------------------------------------------
export const authApi = {
  // 用户登录
  login: (phone: string, password: string) =>
    request<{
      token: string
      userId: string
      phone: string
      level: number
      nickname?: string
      avatar?: string
      user?: { id: string; phone: string; level: number; nickname: string; avatar: string }
    }>({
      url: '/auth/login',
      method: 'POST',
      data: { phone, password },
    }).then((res) => {
      setToken(res.token)
      const uid = res.userId || res.user?.id || ''
      setUserInfo({
        id: uid,
        phone: res.phone || res.user?.phone || phone,
        nickname: res.nickname || res.user?.nickname,
        avatar: res.avatar || res.user?.avatar,
        level: res.level ?? res.user?.level,
      })
      if (res.phone) uni.setStorageSync('phone', res.phone)
      return res
    }),

  register: (phone: string, password: string, inviteCode: string, verifyCode?: string) =>
    request<{
      token: string
      userId: string
      phone: string
      level: number
      inviteCode?: string
      user?: { id: string; phone: string; level: number; nickname: string; avatar: string }
    }>({
      url: '/auth/register',
      method: 'POST',
      data: { phone, password, inviteCode, verifyCode: verifyCode || '' },
    }).then((res) => {
      setToken(res.token)
      const uid = res.userId || res.user?.id || ''
      setUserInfo({
        id: uid,
        phone: res.phone || res.user?.phone || phone,
        nickname: res.user?.nickname,
        avatar: res.user?.avatar,
        level: res.level ?? res.user?.level ?? 1,
      })
      if (res.inviteCode) uni.setStorageSync('myInviteCode', res.inviteCode)
      return res
    }),

  // 管理员登录（不混用）
  adminLogin: (username: string, password: string) =>
    request<{ token: string; userId: string; username: string; role: string }>({
      url: '/auth/admin/login',
      method: 'POST',
      data: { username, password },
    }),

  /** 发送重置密码短信验证码 */
  sendResetSmsCode: (phone: string) =>
    request<{ expireSeconds?: number }>({
      url: '/auth/sms/send',
      method: 'POST',
      data: { phone, scene: 'reset_password' },
    }),

  /** 短信验证码重置登录密码 */
  resetPassword: (phone: string, verifyCode: string, password: string) =>
    request<void>({
      url: '/auth/password/reset',
      method: 'POST',
      data: { phone, verifyCode, password },
    }),
}

// --------------------------------------------
//  用户模块 /users
// --------------------------------------------
export const userApi = {
  // 个人资料
  getProfile: () =>
    request<{
      userId?: string
      id?: string
      phone: string
      nickname: string
      avatar: string
      level: number
      levelName: string
      createdAt: string
      teamPerformance: string
      inviteCode: string
      parentInviteCode: string
      bankCard: { bankName: string; bankCard: string; realName: string } | null
    }>({ url: '/users/profile' }),

  // 更新资料
  updateProfile: (data: { nickname?: string; avatar?: string }) =>
    request<any>({ url: '/users/profile', method: 'PUT', data }),

  // 个人资产
  getAsset: () =>
    request<{
      ecoPoints: string
      consumerPoints: string
      balance: string
      todayEarnings: string
      totalEarnings: string
    }>({ url: '/users/asset' }),

  // 绑定银行卡
  bindBankCard: (data: { bankCard: string; bankName: string; realName: string }) =>
    request<any>({ url: '/users/bank-card', method: 'POST', data }),

  // 团队信息
  getTeam: () =>
    request<{
      teamSize: number
      directCount: number
      teamPerformance: string
      currentLevel: number
      nextLevel: number
      upgradeNeed: string
      teamList: any[]
    }>({ url: '/users/team' }),
}

// --------------------------------------------
//  积分钱包模块 /wallet
// --------------------------------------------
export const walletApi = {
  // 积分余额
  getBalance: () =>
    request<{
      ecoPoints: string
      consumerPoints: string
      frozenEcoPoints: string
    }>({ url: '/wallet/balance' }),

  // 积分变动明细
  getLogs: (params: { type?: number; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.type) q.append('type', String(params.type))
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<{
      list: any[]
      total: number
      page: number
      limit: number
    }>({ url: `/wallet/logs?${q.toString()}` })
  },
}

// --------------------------------------------
//  商品模块 /products
// --------------------------------------------
export const productApi = {
  // 分类列表
  getCategories: () =>
    request<any[]>({ url: '/products/categories' }),

  // 商品列表
  getList: (params: {
    type?: number
    categoryId?: string
    keyword?: string
    page?: number
    limit?: number
  } = {}) => {
    const q = new URLSearchParams()
    if (params.type) q.append('type', String(params.type))
    if (params.categoryId) q.append('categoryId', params.categoryId)
    if (params.keyword) q.append('keyword', params.keyword)
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<{
      list: any[]
      total: number
      page: number
      limit: number
    }>({ url: `/products?${q.toString()}` })
  },

  // 商品详情
  getDetail: <T = unknown>(id: string) =>
    request<T>({ url: `/products/${id}` }),
}

// --------------------------------------------
//  订单模块 /orders
// --------------------------------------------
export const orderApi = {
  // 订单详情
  getDetail: (orderNo: string) =>
    request<{
      orderNo: string
      orderType: number
      status: number
      createdAt: string
      totalAmount: string
      totalPoints: string
      freightAmount: string
      discountAmount: string
      payAmount: string
      pointsEarned: string
      remark: string
      qrCode: string
      expireAt: string
      address: {
        consignee: string; phone: string
        province: string; city: string; district: string; detail: string
      }
      items: Array<{
        productId: string; productName: string; coverImage: string
        specs: string; quantity: number; price: string; points: string
      }>
      logistics?: { company: string; trackingNo: string; status: string; traces: Array<{ time: string; desc: string }> }
    }>({ url: `/orders/${orderNo}` }),

  // 创建订单
  create: (data: {
    orderType: number
    addressId: string
    items: Array<{
      productId: string
      skuId?: string
      quantity: number
    }>
    remark?: string
    couponId?: string
  }) => request<{
    orderNo: string
    orderType: number
    totalAmount: string
    payAmount: string
    pointsEarned: string
    status: number
    statusName: string
    expireAt: string
    qrCode: string
  }>({ url: '/orders', method: 'POST', data }),

  // 订单列表
  getList: (params: {
    type?: number
    status?: number
    page?: number
    limit?: number
  } = {}) => {
    const q = new URLSearchParams()
    if (params.type) q.append('type', String(params.type))
    if (params.status) q.append('status', String(params.status))
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<{
      list: any[]
      total: number
      page: number
      limit: number
    }>({ url: `/orders?${q.toString()}` })
  },

  // 取消订单
  cancel: (orderNo: string) =>
    request<any>({ url: '/orders/cancel', method: 'POST', data: { orderNo } }),

  // 确认收货
  confirm: (orderNo: string) =>
    request<any>({ url: '/orders/confirm', method: 'POST', data: { orderNo } }),

  // 模拟支付（前端自测用，正式需接第三方支付渠道）
  pay: (orderNo: string) =>
    request<any>({ url: `/orders/callback/${orderNo}`, method: 'POST', data: { payType: 'mock' } }),

  // 支付回调（换购/消费模拟支付或渠道回调）
  paymentCallback: (orderNo: string, payType: string) =>
    request<any>({ url: `/orders/callback/${orderNo}`, method: 'POST', data: { payType } }),

  // 物流信息
  getLogistics: (orderNo: string) =>
    request<any>({ url: `/orders/${orderNo}/logistics` }),

  // 申请退款
  applyRefund: (orderNo: string, data: { reason: number; description?: string; images?: string[] }) =>
    request<any>({ url: `/orders/${orderNo}/refund`, method: 'POST', data }),

  // 退款详情
  getRefundDetail: (orderNo: string) =>
    request<any>({ url: `/orders/${orderNo}/refund` }),
}

// --------------------------------------------
//  收货地址模块 /address
// --------------------------------------------
export const addressApi = {
  // 地址列表
  list: <T = unknown[]>() => request<T>({ url: '/address' }),

  // 新建地址
  create: (data: {
    consignee: string
    phone: string
    province: string
    city: string
    district: string
    detail: string
    isDefault?: number
  }) => request<any>({ url: '/address', method: 'POST', data }),

  // 更新地址
  update: (id: string, data: Partial<{
    consignee: string
    phone: string
    province: string
    city: string
    district: string
    detail: string
    isDefault: number
  }>) => request<any>({ url: `/address/${id}`, method: 'PUT', data }),

  // 删除地址
  delete: (id: string) => request<any>({ url: `/address/${id}`, method: 'DELETE' }),

  // 设为默认
  setDefault: (id: string) =>
    request<any>({ url: `/address/${id}/default`, method: 'POST' }),

  // 获取默认地址
  getDefault: <T = unknown>() => request<T>({ url: '/address/default' }),

  getDetail: <T = unknown>(id: string) => request<T>({ url: `/address/${id}` }),
}

// --------------------------------------------
//  理财模块 /financial
// --------------------------------------------
export const financialApi = {
  // 理财项目列表
  getProducts: () =>
    request<any[]>({ url: '/financial/products' }),

  // 申购理财
  subscribe: (data: { productId: string; amount: string; autoRenew?: boolean }) =>
    request<{
      holdingId: string
      productName: string
      amount: string
      annualRate: string
      dailyProfit: string
      cycle: number
      expectedProfit: string
      expireAt: string
      autoRenew: boolean
      status: number
      statusName: string
    }>({ url: '/financial/subscribe', method: 'POST', data }),

  // 我的持仓
  getHoldings: (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<{
      list: any[]
      total: number
      page: number
      limit: number
    }>({ url: `/financial/holdings?${q.toString()}` })
  },

  // 赎回理财
  redeem: (data: { holdingId: string; early?: boolean }) =>
    request<{
      amount: string
      profit: string
      fee: string
      actualAmount: string
      arrivalType: string
      arrivalAmount: string
    }>({ url: '/financial/redeem', method: 'POST', data }),

  // 收益记录
  getEarnings: (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<{ list: any[]; total: number; page: number; limit: number }>(
      { url: `/financial/earnings?${q.toString()}` }
    )
  },
}

// --------------------------------------------
//  会员等级模块 /level
// --------------------------------------------
export const levelApi = {
  // 等级配置
  getConfigs: () =>
    request<any[]>({ url: '/level/configs' }),

  // 我的等级
  getMyLevel: () =>
    request<{
      level: number
      levelName: string
      icon: string
      teamPerformance: string
      minPerformance: string
      dailyBonus: string
      totalBonus: string
      nextLevel: number
      nextLevelName: string
      nextMinPerformance: string
      upgradeNeed: string
    }>({ url: '/level/my' }),
}

// --------------------------------------------
//  推荐模块 /referral
// --------------------------------------------
export const referralApi = {
  // 我的邀请码
  getInviteCode: () =>
    request<{ inviteCode: string; inviteUrl: string; qrCode: string }>({
      url: '/referral/invite-code',
    }),

  // 直属下级列表
  getChildren: (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<{ list: any[]; total: number; page: number; limit: number }>(
      { url: `/referral/children?${q.toString()}` }
    )
  },

  // 推荐奖励明细
  getBonus: (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<{ list: any[]; total: number; page: number; limit: number }>(
      { url: `/referral/bonus?${q.toString()}` }
    )
  },

  // 推荐关系树
  getTree: () => request<any>({ url: '/referral/tree' }),

  // 奖励规则
  getRewardConfig: () =>
    request<{
      registerReward: string
      registerRewardUnit: string
      referralRewardRate: string
      referralRewardUnit: string
      referralRewardCondition: string
    }>({ url: '/referral/reward-config' }),
}

// --------------------------------------------
//  营销模块 /marketing
// --------------------------------------------
export const marketingApi = {
  // 首页 Banner
  getBanners: () =>
    request<Array<{
      id: number; title: string; sub: string; image: string; link?: string; type?: number
    }>>({ url: '/marketing/banners' }),

  // 热门搜索词
  getHotKeywords: () =>
    request<Array<{ keyword: string; desc?: string; isNew?: boolean }>>({ url: '/marketing/hot-keywords' }),

  // 可领取优惠券列表
  getAvailableCoupons: () => request<any[]>({ url: '/marketing/coupons' }),

  // 领取优惠券
  claimCoupon: (couponId: string) =>
    request<any>({ url: '/marketing/coupons/claim', method: 'POST', data: { couponId } }),

  // 我的优惠券
  getMyCoupons: (params: { status?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.status) q.append('status', String(params.status))
    return request<{ list: any[]; total: number }>({
      url: `/marketing/coupons/my?${q.toString()}`,
    })
  },
}

// --------------------------------------------
//  购物车 /cart
// --------------------------------------------
export const cartApi = {
  list: () => request<{ list: any[]; totalCount: number }>({ url: '/cart' }),

  count: () => request<{ count: number }>({ url: '/cart/count' }),

  add: (data: { productId: string; quantity?: number; skuId?: string }) =>
    request<{ id: string; cartCount: number }>({ url: '/cart', method: 'POST', data }),

  updateQuantity: (id: string, quantity: number) =>
    request<any>({ url: `/cart/${id}`, method: 'PUT', data: { quantity } }),

  updateSelected: (id: string, selected: boolean) =>
    request<any>({ url: `/cart/${id}/selected`, method: 'PUT', data: { selected } }),

  selectAll: (selected: boolean, mall?: string) =>
    request<any>({ url: '/cart/select-all', method: 'POST', data: { selected, mall } }),

  remove: (id: string) => request<any>({ url: `/cart/${id}`, method: 'DELETE' }),

  removeSelected: () => request<any>({ url: '/cart/selected', method: 'DELETE' }),
}

// --------------------------------------------
//  收藏 /favorites
// --------------------------------------------
export const favoriteApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.page) q.append('page', String(params.page))
    if (params?.limit) q.append('limit', String(params.limit))
    const qs = q.toString()
    return request<{ list: any[]; total: number }>({
      url: `/favorites${qs ? `?${qs}` : ''}`,
    })
  },

  check: (productId: string) =>
    request<{ favorited: boolean; favoriteId: string | null }>({
      url: `/favorites/check/${productId}`,
    }),

  add: (productId: string) =>
    request<any>({ url: `/favorites/${productId}`, method: 'POST' }),

  remove: (productId: string) =>
    request<any>({ url: `/favorites/${productId}`, method: 'DELETE' }),
}

// --------------------------------------------
//  工单模块 /tickets
// --------------------------------------------
export const ticketApi = {
  getOnline: () =>
    request<{ online: boolean; workTime: string; hotline?: string; tip: string }>({
      url: '/tickets/online',
    }),

  // 提交工单
  create: (data: {
    type: number
    title: string
    content: string
    orderNo?: string
    images?: string[]
  }) => request<{ ticketId: string; ticketNo: string }>({ url: '/tickets', method: 'POST', data }),

  // 工单列表
  getList: (params: { status?: number; type?: number; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.status) q.append('status', String(params.status))
    if (params.type) q.append('type', String(params.type))
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<{ list: any[]; total: number; page: number; limit: number }>(
      { url: `/tickets?${q.toString()}` }
    )
  },

  // 工单详情
  getDetail: <T = unknown>(id: string) => request<T>({ url: `/tickets/${id}` }),

  // 回复工单
  reply: <T = unknown>(id: string, data: { content: string; images?: string[] }) =>
    request<T>({ url: `/tickets/${id}/reply`, method: 'POST', data }),

  // 确认解决
  confirm: (id: string) =>
    request<any>({ url: `/tickets/${id}/confirm`, method: 'POST' }),
}

// --------------------------------------------
//  签到模块 /sign-in
// --------------------------------------------
export const signInApi = {
  // 签到
  signIn: () =>
    request<{ success: boolean; message?: string; streak: number; points: number; bonus: number }>({
      url: '/sign-in',
      method: 'POST',
    }),

  // 获取当月签到记录
  getMonthly: (params: { year: number; month: number }) =>
    request<{ records: Array<{ date: string; points: number; bonus: number; streak: number }>; total: number }>({
      url: `/sign-in/monthly?year=${params.year}&month=${params.month}`,
    }),
}

// --------------------------------------------
//  导出汇总
// --------------------------------------------
export const api = {
  auth: authApi,
  user: userApi,
  wallet: walletApi,
  product: productApi,
  order: orderApi,
  address: addressApi,
  financial: financialApi,
  level: levelApi,
  referral: referralApi,
  marketing: marketingApi,
  cart: cartApi,
  favorite: favoriteApi,
  ticket: ticketApi,
  signIn: signInApi,
}
