// ============================================
//  api.ts - API 请求封装
// ============================================
const BASE_URL = 'http://47.96.102.163/api/v1'

// 获取本地存储的 token
function getToken(): string {
  return uni.getStorageSync('token') || ''
}

// 通用请求
function request<T = any>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}): Promise<T> {
  return new Promise((resolve, reject) => {
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.header,
    }
    const token = getToken()
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('userId')
          uni.showToast({ title: '请重新登录', icon: 'none' })
          setTimeout(() => uni.switchTab({ url: '/pages/auth/login' }), 1500)
          reject(new Error('未授权'))
        } else {
          const msg = (res.data as any)?.message || `请求失败(${res.statusCode})`
          reject(new Error(msg))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'))
      },
    })
  })
}

// ===== 认证 =====
export const authApi = {
  login: (phone: string, password: string) =>
    request<{ token: string; user: { id: string; phone: string; nickname: string; avatar: string } }>({
      url: '/auth/login',
      method: 'POST',
      data: { phone, password },
    }),

  register: (phone: string, password: string, inviteCode: string) =>
    request<{ token: string; user: { id: string; phone: string; nickname: string; avatar: string; inviteCode: string } }>({
      url: '/auth/register',
      method: 'POST',
      data: { phone, password, inviteCode },
    }),
}

// ===== 用户 =====
export const userApi = {
  getInfo: (userId: string) =>
    request<any>({ url: `/users/${userId}` }),
}

// ===== 积分钱包 =====
export const walletApi = {
  getBalance: (userId: string) =>
    request<{ balance: number; ecoPoints: string; consumerPoints: string; level: string; teamPerformance: string }>({
      url: `/wallet/balance?userId=${userId}`,
    }),

  getLogs: (userId: string, page = 1, limit = 20) =>
    request<any>({ url: `/wallet/logs?userId=${userId}&page=${page}&limit=${limit}` }),
}

// ===== 商品 =====
export const productApi = {
  getList: (params: { type?: number; categoryId?: string; keyword?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params.type) q.append('type', String(params.type))
    if (params.categoryId) q.append('categoryId', params.categoryId)
    if (params.keyword) q.append('keyword', params.keyword)
    if (params.page) q.append('page', String(params.page))
    if (params.limit) q.append('limit', String(params.limit))
    return request<{ items: any[]; total: number; page: number; limit: number }>({
      url: `/products?${q.toString()}`,
    })
  },

  getDetail: (id: string) =>
    request<any>({ url: `/products/${id}` }),

  getCategories: () =>
    request<any[]>({ url: '/products/categories' }),
}

// ===== 订单 =====
export const orderApi = {
  create: (data: {
    userId: string
    orderType: number
    addressId: string
    items: Array<{
      productId: string
      productName: string
      coverImage: string
      price: number
      quantity: number
      requiredPoints?: string
      ecoPointsAmount?: string
    }>
    remark?: string
  }) =>
    request<any>({
      url: '/orders',
      method: 'POST',
      data,
    }),

  getList: (userId: string, params?: { type?: number; status?: number; page?: number; limit?: number }) => {
    const q = new URLSearchParams({ userId })
    if (params?.type) q.append('type', String(params.type))
    if (params?.status) q.append('status', String(params.status))
    if (params?.page) q.append('page', String(params.page))
    if (params?.limit) q.append('limit', String(params.limit))
    return request<{ items: any[]; total: number; page: number; limit: number }>({
      url: `/orders?${q.toString()}`,
    })
  },

  // 支付回调（模拟）
  paymentCallback: (orderNo: string, payType: string) =>
    request<any>({
      url: `/orders/callback/${orderNo}`,
      method: 'POST',
      data: { payType },
    }),
}

// ===== 收货地址 =====
export const addressApi = {
  list: (userId: string) =>
    request<any[]>({ url: `/address?userId=${userId}` }),

  create: (data: {
    userId: string
    consignee: string
    phone: string
    province: string
    city: string
    district: string
    detail: string
    isDefault?: number
  }) =>
    request<any>({ url: '/address', method: 'POST', data }),

  getDefault: (userId: string) =>
    request<any>({ url: `/address/default?userId=${userId}` }),

  setDefault: (id: string, userId: string) =>
    request<any>({ url: `/address/${id}/default`, method: 'POST', data: { userId } }),
}

// ===== 推荐关系 =====
export const referralApi = {
  getChildren: (userId: string) =>
    request<any[]>({ url: `/referral/children?userId=${userId}` }),

  getInviteCode: (userId: string) =>
    request<{ inviteCode: string }>({ url: `/referral/invite-code?userId=${userId}` }),

  getBonus: (userId: string, page = 1) =>
    request<any>({ url: `/referral/bonus?userId=${userId}&page=${page}` }),
}

// ===== 会员等级 =====
export const levelApi = {
  getMyLevel: (userId: string) =>
    request<any>({ url: `/level/my?userId=${userId}` }),

  getConfigs: () =>
    request<any[]>({ url: '/level/configs' }),
}

// ===== 理财 =====
export const financialApi = {
  getProducts: () =>
    request<any[]>({ url: '/financial/products' }),

  getHoldings: (userId: string) =>
    request<any[]>({ url: `/financial/holdings?userId=${userId}` }),

  subscribe: (userId: string, productId: string, amount: string) =>
    request<any>({
      url: '/financial/subscribe',
      method: 'POST',
      data: { userId, productId, amount },
    }),
}
