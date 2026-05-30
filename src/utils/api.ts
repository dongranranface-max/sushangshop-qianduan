// ============================================
//  api.ts - API 请求封装（严格遵循 API 契约）
//  Base URL: http://47.96.102.163/api/v1
//  认证方式: Bearer Token（从本地存储获取）
// ============================================
import { API_BASE_URL } from '@/config'
import { escapeHtml } from './security'
import { generateSignHeaders, needsSign } from './signature'

const BASE_URL = API_BASE_URL

// --------------------------------------------
//  Token 管理
// --------------------------------------------
function getToken(): string {
  return uni.getStorageSync('token') || ''
}


function clearToken() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('tokenIssueTime')
  uni.removeStorageSync('userId')
}

function setUserInfo(user: { id: string; phone: string; nickname?: string; avatar?: string; level?: number }) {
  uni.setStorageSync('userId', user.id)
  uni.setStorageSync('phone', user.phone)
  if (user.nickname) uni.setStorageSync('nickname', user.nickname)
  if (user.avatar) uni.setStorageSync('avatar', user.avatar)
  if (user.level !== undefined) uni.setStorageSync('level', user.level)
}

// --------------------------------------------
//  Token 静默刷新（30分钟过期机制）
// --------------------------------------------
const TOKEN_EXPIRY_MS = 30 * 60 * 1000   // 30分钟
const REFRESH_BEFORE_MS = 5 * 60 * 1000 // 过期前5分钟主动刷新

function getTokenIssueTime(): number {
  return uni.getStorageSync('tokenIssueTime') || 0
}
function setTokenIssueTime(ts: number) {
  uni.setStorageSync('tokenIssueTime', ts)
}
function isTokenExpiringSoon(): boolean {
  const t = getTokenIssueTime()
  if (!t) return false
  return (Date.now() - t) >= (TOKEN_EXPIRY_MS - REFRESH_BEFORE_MS)
}
function isTokenExpired(): boolean {
  const t = getTokenIssueTime()
  if (!t) return false
  return (Date.now() - t) >= TOKEN_EXPIRY_MS
}

// setToken：存储 token 并记录签发时间（用于静默刷新过期判断）
function setToken(token: string) {
  uni.setStorageSync('token', token)
  setTokenIssueTime(Date.now())
}

// 待刷新队列 + 刷新锁
let refreshLock: Promise<string> | null = null
const pendingQueue: Array<{ opts: RequestOptions; resolve: (v: unknown) => void; reject: (e: unknown) => void }> = []

async function tryRefreshToken(): Promise<string> {
  if (refreshLock) return refreshLock
  refreshLock = _doRefresh().finally(() => { refreshLock = null })
  return refreshLock
}

async function _doRefresh(): Promise<string> {
  // 优先使用静默刷新接口（需后端提供 /auth/refresh）
  // fallback: 读本地 phone 重新登录
  const phone = uni.getStorageSync('phone')
  if (!phone) throw new Error('no_refresh_credential')
  try {
    const data = await _rawRequest<{ token: string }>({ url: '/auth/refresh', method: 'POST', data: { phone }, __bypassRefresh: true })
    if (data?.token) {
      setToken(data.token)
      return data.token
    }
  } catch {}
  throw new Error('refresh_failed')
}

// 原生请求（不触发刷新逻辑）
interface RawRequestOptions {
  url: string; method?: string; data?: unknown; header?: Record<string, string>; __bypassRefresh?: boolean
}

function _rawRequest<T>(opts: RawRequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const header: Record<string, string> = { 'Content-Type': 'application/json', ...opts.header }
    const tok = getToken()
    if (tok) header['Authorization'] = `Bearer ${tok}`
    const cleanUrl = (opts.url || '').replace(/[<>'"`;]/g, '')
    uni.request({
      url: `${BASE_URL}${cleanUrl}`, method: opts.method || 'GET', data: opts.data, header,
      success: (res: { data: unknown; statusCode: number }) => {
        const body = res.data as unknown
        if (body && typeof (body as { code?: number }).code !== 'undefined') {
          if ((body as { code: number }).code === 0 || (body as { code: number }).code === 200) {
            resolve((body as { data: T }).data as T); return
          }
        }
        if (res.statusCode >= 200 && res.statusCode < 300) { resolve(body as T); return }
        reject(new Error(`HTTP ${res.statusCode}`))
      },
      fail: (err: unknown) => reject(new Error((err as { errMsg?: string }).errMsg || '网络请求失败')),
    })
  })
}

function flushQueue(success: boolean, newToken?: string) {
  pendingQueue.splice(0).forEach(item => {
    if (success && newToken) {
      _rawRequest(item.opts)
        .then(item.resolve)
        .catch(item.reject)
    } else {
      item.reject(new Error('登录已过期'))
    }
  })
}

async function handleUnauthorized<T>(
  opts: RequestOptions,
  resolve: (v: T) => void,
  reject: (e: unknown) => void,
) {
  // 已有刷新中的请求：入队等待
  if (refreshLock) {
    pendingQueue.push({ opts, resolve: resolve as (v: unknown) => void, reject: reject as (e: unknown) => void })
    return
  }
  // 第一个触发刷新的请求：先入队，再开始刷新
  pendingQueue.push({ opts, resolve: resolve as (v: unknown) => void, reject: reject as (e: unknown) => void })
  try {
    const newToken = await tryRefreshToken()
    flushQueue(true, newToken)
  } catch {
    clearToken()
    uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
    setTimeout(() => uni.reLaunch({ url: '/pages/auth/login' }), 1200)
    flushQueue(false)
  }
}

// --------------------------------------------
//  请求核心
// --------------------------------------------
interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: unknown
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
      success: (res: { data: unknown; statusCode: number }) => {
        // 业务错误码：{ code, message, data }（API_SPEC v1.2）
        const body = res.data as unknown
        const errMsg = escapeHtml(body?.message || body?.msg || '请求失败')
        if (body && typeof body.code !== 'undefined') {
          if (body.code === 0 || body.code === 200) {
            resolve(body.data as T)
            return
          }
          if (res.statusCode === 401 || body.code === 401) {
            handleUnauthorized(options, resolve, reject)
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
      fail: (err: { errMsg?: string }) => {
        const msg = err.errMsg || '网络请求失败'
        uni.showToast({ title: msg, icon: 'none', duration: 2000 })
        reject(new Error(msg))
      },
    })
  })
}

// --------------------------------------------
//  通用类型
// --------------------------------------------
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  limit: number
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
export interface UserProfile {
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
}

export interface UserAsset {
  ecoPoints: string
  consumerPoints: string
  balance: string
  todayEarnings: string
  totalEarnings: string
}

export interface TeamMember {
  userId: string
  nickname: string
  avatar: string
  level: number
  levelName: string
  createdAt: string
  teamPerformance: string
  parentInviteCode: string
}

export interface UserTeam {
  teamSize: number
  directCount: number
  teamPerformance: string
  currentLevel: number
  nextLevel: number
  upgradeNeed: string
  teamList: TeamMember[]
}

export interface OrderCounts {
  all: number
  pending: number
  paid: number
  shipped: number
  completed: number
  refunded: number
}

export const userApi = {
  // 获取用户信息（调用 getProfile）
  getUserInfo: (): Promise<UserProfile> => userApi.getProfile(),

  // 订单各状态数量
  getOrderCounts: (): Promise<OrderCounts> =>
    request<OrderCounts>({ url: '/users/order-counts' }),

  // 个人资料
  getProfile: () =>
    request<UserProfile>({ url: '/users/profile' }),

  // 更新资料
  updateProfile: (data: { nickname?: string; avatar?: string }) =>
    request<unknown>({ url: '/users/profile', method: 'PUT', data }),

  // 个人资产
  getAsset: (): Promise<UserAsset> =>
    request<UserAsset>({ url: '/users/asset' }),

  // 绑定银行卡
  bindBankCard: (data: { bankCard: string; bankName: string; realName: string }) =>
    request<unknown>({ url: '/users/bank-card', method: 'POST', data }),

  // 团队信息
  getTeam: (): Promise<UserTeam> =>
    request<UserTeam>({ url: '/users/team' }),
}

// --------------------------------------------
//  积分钱包模块 /wallet
// --------------------------------------------
export interface WalletLogItem {
  id: string
  type: number
  typeName: string
  amount: string
  balanceBefore: string
  balanceAfter: string
  remark: string
  createdAt: string
}

export interface WalletBalance {
  ecoPoints: string
  consumerPoints: string
  frozenEcoPoints: string
}

export interface WalletLogsResult {
  list: WalletLogItem[]
  total: number
  page: number
  limit: number
}

export const walletApi = {
  // 积分余额
  getBalance: (): Promise<WalletBalance> =>
    request<WalletBalance>({ url: '/wallet/balance' }),

  // 积分变动明细
  getLogs: (params: { type?: number; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.type) q.append('type', String(params.type))
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<WalletLogsResult>({ url: `/wallet/logs?${q.toString()}` })
  },
}

// --------------------------------------------
//  商品模块 /products
// --------------------------------------------
export interface ProductCategory {
  id: string
  name: string
  icon?: string
  sort: number
}

export interface ProductListItem {
  id: string
  name: string
  coverImage: string
  price: string
  originalPrice: string
  points: string
  type: number
  categoryId: string
  stock: number
  sales: number
  tags?: string[]
}

export interface ProductDetail {
  id: string
  name: string
  coverImage: string
  images: string[]
  price: string
  originalPrice: string
  points: string
  type: number
  categoryId: string
  stock: number
  sales: number
  description: string
  specs: Array<{ name: string; options: string[] }>
  skus: Array<{
    id: string
    specs: string
    price: string
    points: string
    stock: number
  }>
  tags?: string[]
}

export const productApi = {
  // 分类列表
  getCategories: (): Promise<ProductCategory[]> =>
    request<ProductCategory[]>({ url: '/products/categories' }),

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
    return request<PageResult<ProductListItem>>({ url: `/products?${q.toString()}` })
  },

  // 商品详情（支持 optional type 参数）
  getDetail: (id: string, type?: number) => {
    const q = new URLSearchParams()
    if (type !== undefined) q.append('type', String(type))
    const qs = q.toString()
    return request<ProductDetail>({
      url: `/products/${id}${qs ? `?${qs}` : ''}`,
    })
  },

  // 切换收藏状态：先 check，再 add 或 remove
  toggleFavorite: (productId: string): Promise<{ favorited: boolean; favoriteId: string | null }> => {
    return favoriteApi.check(productId).then((checkResult) => {
      if (checkResult.favorited && checkResult.favoriteId) {
        return favoriteApi.remove(productId).then(() => ({ favorited: false, favoriteId: null }))
      } else {
        return favoriteApi.add(productId).then(() => ({ favorited: true, favoriteId: productId }))
      }
    })
  },
}

// --------------------------------------------
//  订单模块 /orders
// --------------------------------------------
export interface OrderAddress {
  consignee: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
}

export interface OrderItem {
  productId: string
  productName: string
  coverImage: string
  specs: string
  quantity: number
  price: string
  points: string
}

export interface OrderLogisticsTrace {
  time: string
  desc: string
}

export interface OrderLogistics {
  company: string
  trackingNo: string
  status: string
  traces: OrderLogisticsTrace[]
}

export interface OrderDetail {
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
  address: OrderAddress
  items: OrderItem[]
  logistics?: OrderLogistics
}

export interface OrderListItem {
  orderNo: string
  orderType: number
  status: number
  statusName: string
  createdAt: string
  totalAmount: string
  totalPoints: string
  payAmount: string
  itemCount: number
  coverImage: string
  productName: string
}

export interface CreateOrderResult {
  orderNo: string
  orderType: number
  totalAmount: string
  payAmount: string
  pointsEarned: string
  status: number
  statusName: string
  expireAt: string
  qrCode: string
}

export const orderApi = {
  // 订单详情
  getDetail: (orderNo: string): Promise<OrderDetail> =>
    request<OrderDetail>({ url: `/orders/${orderNo}` }),

  // 创建订单（基础版）
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
  }): Promise<CreateOrderResult> =>
    request<CreateOrderResult>({ url: '/orders', method: 'POST', data }),

  // 创建订单（完整版，支持积分抵扣/发票/购物车/立即购买）
  createOrder: (data: {
    orderType: number
    addressId: string
    items: Array<{
      productId: string
      skuId?: string
      quantity: number
    }>
    remark?: string
    couponId?: string
    pointsDeducted?: boolean
    invoice?: {
      type: number
      taxNo?: string
    } | null
    // 购物车下单
    cartIds?: string
    // 立即购买
    productId?: string | number
    quantity?: number
  }): Promise<CreateOrderResult> =>
    request<CreateOrderResult>({ url: '/orders', method: 'POST', data }),

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
    return request<PageResult<OrderListItem>>({ url: `/orders?${q.toString()}` })
  },

  // 取消订单
  cancel: (orderNo: string) =>
    request<unknown>({ url: '/orders/cancel', method: 'POST', data: { orderNo } }),

  // 确认收货
  confirm: (orderNo: string) =>
    request<unknown>({ url: '/orders/confirm', method: 'POST', data: { orderNo } }),

  // 模拟支付（前端自测用，正式需接第三方支付渠道）
  pay: (orderNo: string) =>
    request<unknown>({ url: `/orders/callback/${orderNo}`, method: 'POST', data: { payType: 'mock' } }),

  // 支付回调（换购/消费模拟支付或渠道回调）
  paymentCallback: (orderNo: string, payType: string) =>
    request<unknown>({ url: `/orders/callback/${orderNo}`, method: 'POST', data: { payType } }),

  // 物流信息
  getLogistics: (orderNo: string) =>
    request<OrderLogistics>({ url: `/orders/${orderNo}/logistics` }),

  // 申请退款
  applyRefund: (orderNo: string, data: { reason: number; description?: string; images?: string[] }) =>
    request<unknown>({ url: `/orders/${orderNo}/refund`, method: 'POST', data }),

  // 退款详情
  getRefundDetail: (orderNo: string) =>
    request<unknown>({ url: `/orders/${orderNo}/refund` }),
}

// --------------------------------------------
//  收货地址模块 /address
// --------------------------------------------
export interface AddressItem {
  id: string
  consignee: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: number
}

export const addressApi = {
  // 地址列表
  list: (): Promise<AddressItem[]> => request<AddressItem[]>({ url: '/address' }),

  // 新建地址
  create: (data: {
    consignee: string
    phone: string
    province: string
    city: string
    district: string
    detail: string
    isDefault?: number
  }) => request<AddressItem>({ url: '/address', method: 'POST', data }),

  // 更新地址
  update: (id: string, data: Partial<{
    consignee: string
    phone: string
    province: string
    city: string
    district: string
    detail: string
    isDefault: number
  }>) => request<AddressItem>({ url: `/address/${id}`, method: 'PUT', data }),

  // 删除地址
  delete: (id: string) => request<unknown>({ url: `/address/${id}`, method: 'DELETE' }),

  // 设为默认
  setDefault: (id: string) =>
    request<unknown>({ url: `/address/${id}/default`, method: 'POST' }),

  // 获取默认地址
  getDefault: (): Promise<AddressItem | null> => request<AddressItem | null>({ url: '/address/default' }),

  getDetail: (id: string): Promise<AddressItem> => request<AddressItem>({ url: `/address/${id}` }),
}

// --------------------------------------------
//  理财模块 /financial
// --------------------------------------------
export interface FinancialProduct {
  id: string
  name: string
  annualRate: string
  minAmount: string
  maxAmount: string
  cycle: number
  cycleName: string
  riskLevel: number
  tags?: string[]
}

export interface SubscribeResult {
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
}

export interface FinancialHolding {
  holdingId: string
  productId: string
  productName: string
  amount: string
  annualRate: string
  dailyProfit: string
  expectedProfit: string
  earnedProfit: string
  cycle: number
  cycleName: string
  startDate: string
  expireAt: string
  autoRenew: boolean
  status: number
  statusName: string
}

export interface FinancialEarning {
  id: string
  holdingId: string
  productName: string
  amount: string
  profit: string
  createdAt: string
}

export const financialApi = {
  // 理财项目列表
  getProducts: (): Promise<FinancialProduct[]> =>
    request<FinancialProduct[]>({ url: '/financial/products' }),

  // 申购理财
  subscribe: (data: { productId: string; amount: string; autoRenew?: boolean }): Promise<SubscribeResult> =>
    request<SubscribeResult>({ url: '/financial/subscribe', method: 'POST', data }),

  // 我的持仓
  getHoldings: (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<PageResult<FinancialHolding>>({ url: `/financial/holdings?${q.toString()}` })
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
    return request<PageResult<FinancialEarning>>({ url: `/financial/earnings?${q.toString()}` })
  },
}

// --------------------------------------------
//  会员等级模块 /level
// --------------------------------------------
export interface LevelConfig {
  level: number
  levelName: string
  icon: string
  minPerformance: string
  dailyBonus: string
  teamBonus: string
  privileges: string[]
}

export interface MyLevel {
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
}

export const levelApi = {
  // 等级配置
  getConfigs: (): Promise<LevelConfig[]> =>
    request<LevelConfig[]>({ url: '/level/configs' }),

  // 我的等级
  getMyLevel: (): Promise<MyLevel> =>
    request<MyLevel>({ url: '/level/my' }),
}

// --------------------------------------------
//  推荐模块 /referral
// --------------------------------------------
export interface ReferralChild {
  userId: string
  nickname: string
  avatar: string
  level: number
  levelName: string
  createdAt: string
  teamPerformance: string
  parentInviteCode: string
}

export interface ReferralBonusItem {
  id: string
  userId: string
  userNickname: string
  orderNo: string
  amount: string
  reward: string
  createdAt: string
}

export interface InviteCodeInfo {
  inviteCode: string
  inviteUrl: string
  qrCode: string
}

export interface RewardConfig {
  registerReward: string
  registerRewardUnit: string
  referralRewardRate: string
  referralRewardUnit: string
  referralRewardCondition: string
}

export const referralApi = {
  // 我的邀请码
  getInviteCode: (): Promise<InviteCodeInfo> =>
    request<InviteCodeInfo>({ url: '/referral/invite-code' }),

  // 直属下级列表
  getChildren: (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<PageResult<ReferralChild>>({ url: `/referral/children?${q.toString()}` })
  },

  // 推荐奖励明细
  getBonus: (params: { page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<PageResult<ReferralBonusItem>>({ url: `/referral/bonus?${q.toString()}` })
  },

  // 推荐关系树
  getTree: () => request<unknown>({ url: '/referral/tree' }),

  // 奖励规则
  getRewardConfig: (): Promise<RewardConfig> =>
    request<RewardConfig>({ url: '/referral/reward-config' }),
}

// --------------------------------------------
//  营销模块 /marketing
// --------------------------------------------
export interface Banner {
  id: number
  title: string
  sub: string
  image: string
  link?: string
  type?: number
}

export interface HotKeyword {
  keyword: string
  desc?: string
  isNew?: boolean
}

export interface TickerItem {
  id: number
  text: string
}

export interface CouponItem {
  id: string
  name: string
  type: number
  value: string
  minAmount: string
  validFrom: string
  validTo: string
  status: number
}

export interface MyCouponItem extends CouponItem {
  claimedAt: string
}

export const marketingApi = {
  // 首页 Banner
  getBanners: (): Promise<Banner[]> =>
    request<Banner[]>({ url: '/marketing/banners' }),

  // 跑马灯公告
  getTicker: (): Promise<TickerItem[]> =>
    request<TickerItem[]>({ url: '/marketing/ticker' }),

  // 限时秒杀商品
  getFlashProducts: (): Promise<Product[]> =>
    request<Product[]>({ url: '/marketing/flash-products' }),

  // 热门搜索词
  getHotKeywords: (): Promise<HotKeyword[]> =>
    request<HotKeyword[]>({ url: '/marketing/hot-keywords' }),

  // 可领取优惠券列表
  getAvailableCoupons: (): Promise<CouponItem[]> =>
    request<CouponItem[]>({ url: '/marketing/coupons' }),

  // 领取优惠券
  claimCoupon: (couponId: string) =>
    request<unknown>({ url: '/marketing/coupons/claim', method: 'POST', data: { couponId } }),

  // 我的优惠券
  getMyCoupons: (params: { status?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.status) q.append('status', String(params.status))
    return request<{ list: MyCouponItem[]; total: number }>({
      url: `/marketing/coupons/my?${q.toString()}`,
    })
  },
}

// --------------------------------------------
//  购物车 /cart
// --------------------------------------------
export interface CartItem {
  id: string
  productId: string
  productName: string
  coverImage: string
  specs: string
  price: string
  points: string
  quantity: number
  selected: boolean
  stock: number
  skuId?: string
}

export interface CartListResult {
  list: CartItem[]
  totalCount: number
  totalAmount: string
  totalPoints: string
}

export const cartApi = {
  // 列表（包含 count）
  list: (): Promise<CartListResult> =>
    request<CartListResult>({ url: '/cart' }),

  count: (): Promise<{ count: number }> =>
    request<{ count: number }>({ url: '/cart/count' }),

  add: (data: { productId: string; quantity?: number; skuId?: string }) =>
    request<{ id: string; cartCount: number }>({ url: '/cart', method: 'POST', data }),

  updateQuantity: (id: string, quantity: number) =>
    request<unknown>({ url: `/cart/${id}`, method: 'PUT', data: { quantity } }),

  updateSelected: (id: string, selected: boolean) =>
    request<unknown>({ url: `/cart/${id}/selected`, method: 'PUT', data: { selected } }),

  selectAll: (selected: boolean, mall?: string) =>
    request<unknown>({ url: '/cart/select-all', method: 'POST', data: { selected, mall } }),

  remove: (id: string) => request<unknown>({ url: `/cart/${id}`, method: 'DELETE' }),

  removeSelected: () => request<unknown>({ url: '/cart/selected', method: 'DELETE' }),
}

// --------------------------------------------
//  收藏 /favorites
// --------------------------------------------
export interface FavoriteItem {
  id: string
  productId: string
  productName: string
  coverImage: string
  price: string
  points: string
  type: number
  createdAt: string
}

export interface FavoriteCheckResult {
  favorited: boolean
  favoriteId: string | null
}

export const favoriteApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.page) q.append('page', String(params.page))
    if (params?.limit) q.append('limit', String(params.limit))
    const qs = q.toString()
    return request<PageResult<FavoriteItem>>({
      url: `/favorites${qs ? `?${qs}` : ''}`,
    })
  },

  check: (productId: string): Promise<FavoriteCheckResult> =>
    request<FavoriteCheckResult>({ url: `/favorites/check/${productId}` }),

  add: (productId: string) =>
    request<unknown>({ url: `/favorites/${productId}`, method: 'POST' }),

  remove: (productId: string) =>
    request<unknown>({ url: `/favorites/${productId}`, method: 'DELETE' }),
}

// --------------------------------------------
//  工单模块 /tickets
// --------------------------------------------
export interface TicketReply {
  id: string
  content: string
  images?: string[]
  isCustomer: boolean
  createdAt: string
}

export interface TicketDetail {
  id: string
  ticketNo: string
  type: number
  title: string
  content: string
  images?: string[]
  status: number
  statusName: string
  createdAt: string
  updatedAt: string
  replies: TicketReply[]
}

export interface TicketListItem {
  id: string
  ticketNo: string
  type: number
  typeName: string
  title: string
  status: number
  statusName: string
  createdAt: string
  updatedAt: string
  lastReplyAt?: string
}

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
  }): Promise<{ ticketId: string; ticketNo: string }> =>
    request<{ ticketId: string; ticketNo: string }>({ url: '/tickets', method: 'POST', data }),

  // 工单列表
  getList: (params: { status?: number; type?: number; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.status) q.append('status', String(params.status))
    if (params.type) q.append('type', String(params.type))
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<PageResult<TicketListItem>>({ url: `/tickets?${q.toString()}` })
  },

  // 工单详情
  getDetail: (id: string): Promise<TicketDetail> => request<TicketDetail>({ url: `/tickets/${id}` }),

  // 回复工单
  reply: (id: string, data: { content: string; images?: string[] }): Promise<TicketDetail> =>
    request<TicketDetail>({ url: `/tickets/${id}/reply`, method: 'POST', data }),

  // 确认解决
  confirm: (id: string) =>
    request<unknown>({ url: `/tickets/${id}/confirm`, method: 'POST' }),
}

// --------------------------------------------
//  签到模块 /sign-in
// --------------------------------------------
export interface SignInRecord {
  date: string
  points: number
  bonus: number
  streak: number
}

export interface SignInResult {
  success: boolean
  message?: string
  streak: number
  points: number
  bonus: number
}

export interface SignInMonthly {
  records: SignInRecord[]
  total: number
}

export const signInApi = {
  // 签到
  signIn: (): Promise<SignInResult> =>
    request<SignInResult>({ url: '/sign-in', method: 'POST' }),

  // 获取当月签到记录
  getMonthly: (params: { year: number; month: number }): Promise<SignInMonthly> =>
    request<SignInMonthly>({
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
