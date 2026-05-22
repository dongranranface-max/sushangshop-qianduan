// ============================================
//  types/api.d.ts - 全项目 API 类型定义
//  消除 any，实现完整 TypeScript 类型安全
// ============================================

// --------------------------------------------
//  基础通用类型
// --------------------------------------------
/** 通用分页响应 */
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  limit: number
}

/** 通用 ID + name 结构 */
export interface IdName {
  id: string
  name: string
}

// --------------------------------------------
//  认证模块 /auth
// --------------------------------------------
export interface LoginResponse {
  token: string
  userId: string
  phone: string
  level: number
  nickname?: string
  avatar?: string
  user?: UserBase
  inviteCode?: string
}

export interface RegisterResponse {
  token: string
  userId: string
  phone: string
  level: number
  inviteCode?: string
  user?: UserBase
}

export interface SmsCodeResponse {
  expireSeconds?: number
}

// --------------------------------------------
//  用户基础信息
// --------------------------------------------
export interface UserBase {
  id: string
  phone: string
  level: number
  nickname: string
  avatar: string
}

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
  bankCard: BankCardInfo | null
}

export interface BankCardInfo {
  bankName: string
  bankCard: string
  realName: string
}

export interface UserAsset {
  ecoPoints: string
  consumerPoints: string
  balance: string
  todayEarnings: string
  totalEarnings: string
}

export interface TeamInfo {
  teamSize: number
  directCount: number
  teamPerformance: string
  currentLevel: number
  nextLevel: number
  upgradeNeed: string
  teamList: TeamMember[]
}

export interface TeamMember {
  id: string
  nickname: string
  avatar: string
  level: number
  levelName: string
  createdAt: string
  performance: string
}

// --------------------------------------------
//  商品模块 /products
// --------------------------------------------
export type MallType = 1 | 2 | 3 // 1=消费 2=换购 3=兑换

export interface ProductCategory {
  id: string
  name: string
  icon?: string
  parentId?: string
  sort?: number
  children?: ProductCategory[]
}

export interface Product {
  id: string
  name: string
  coverImage?: string
  image?: string
  price: string | number
  originalPrice?: string | number
  requiredPoints?: number
  salesCount?: number
  soldCount?: number
  stock?: number
  description?: string
  images?: string[]
  specs?: ProductSpec[]
  mallType?: MallType
  type?: MallType
  categoryId?: string
  categoryName?: string
  tags?: string[]
  flashSale?: boolean
  flashEndAt?: string
}

export interface ProductSpec {
  name: string
  value: string
}

export interface ProductListParams {
  type?: MallType
  categoryId?: string
  keyword?: string
  page?: number
  limit?: number
}

// --------------------------------------------
//  购物车 /cart
// --------------------------------------------
export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  points: number
  quantity: number
  image: string
  selected: boolean
  mall: 'consume' | 'exchange' | 'redeem'
  productType?: MallType
  skuId?: string
  stock?: number
}

export interface CartListResponse {
  list: CartItem[]
  totalCount: number
}

// --------------------------------------------
//  订单模块 /orders
// --------------------------------------------
export type OrderStatus = 1 | 2 | 3 | 4 | 5 | 6 // 1待付款 2待发货 3待收货 4已完成 5已取消 6退款中

export const ORDER_STATUS_NAME: Record<OrderStatus, string> = {
  1: '待付款',
  2: '待发货',
  3: '待收货',
  4: '已完成',
  5: '已取消',
  6: '退款中',
}

export const MALL_TYPE_NAME: Record<MallType, string> = {
  1: '消费商城',
  2: '换购商城',
  3: '兑换商城',
}

export interface OrderItem {
  productName: string
  coverImage: string
  specs?: string
  quantity: number
  price: number
}

export interface Order {
  orderNo: string
  orderType: MallType
  status: OrderStatus
  statusName: string
  items: OrderItem[]
  totalAmount: string
  payAmount: string
  pointsEarned?: string
  createdAt: string
  qrCode?: string
  expireAt?: string
  logistics?: LogisticsInfo
  refund?: RefundInfo
}

export interface LogisticsInfo {
  company: string
  trackingNo: string
  status: string
  traces: LogisticsTrace[]
}

export interface LogisticsTrace {
  time: string
  content: string
}

export interface RefundInfo {
  reason: number
  description?: string
  status: number
  createdAt: string
}

export interface CreateOrderParams {
  orderType: MallType
  addressId: string
  items: Array<{
    productId: string
    skuId?: string
    quantity: number
  }>
  remark?: string
  couponId?: string
}

// --------------------------------------------
//  收货地址 /address
// --------------------------------------------
export interface Address {
  id: string
  consignee: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: 0 | 1
}

export interface AddressCreateParams {
  consignee: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault?: 0 | 1
}

// --------------------------------------------
//  理财模块 /financial
// --------------------------------------------
export type RiskLevel = 1 | 2 | 3 // 1=稳健 2=平衡 3=进取

export interface FinancialProduct {
  id: string
  name: string
  icon: string
  rateType: 1 | 2 | 3 // 1=活期 2=定期 3=全周期
  rateValue: string
  displayRate: string
  cycleDays: number
  cycle: number
  minAmount: string
  maxAmount?: string
  totalAmount?: string
  totalInvested?: string
  riskLevel: RiskLevel
  description?: string
  features?: string[]
}

export interface Holding {
  holdingId: string
  productId: string
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
  createdAt: string
  earnings?: string
}

export interface RedeemResult {
  amount: string
  profit: string
  fee: string
  actualAmount: string
  arrivalType: string
  arrivalAmount: string
}

// --------------------------------------------
//  积分钱包 /wallet
// --------------------------------------------
export interface PointsLog {
  id: string
  type: 1 | 2 // 1=收入 2=支出
  amount: string // "+499.95" or "-2000"
  balance: string
  source: string
  sourceName: string
  orderNo?: string
  createdAt: string
}

export interface PointsBalance {
  ecoPoints: string
  consumerPoints: string
  frozenEcoPoints: string
}

// --------------------------------------------
//  会员等级 /level
// --------------------------------------------
export interface LevelConfig {
  level: number
  levelName: string
  icon: string
  minPerformance: string
  dailyBonus: string
  maxDailyBonus?: string
  rewardRate?: string
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

// --------------------------------------------
//  推荐邀请 /referral
// --------------------------------------------
export interface InviteCodeInfo {
  inviteCode: string
  inviteUrl: string
  qrCode: string
}

export interface ReferralChild {
  id: string
  nickname: string
  avatar: string
  level: number
  levelName: string
  createdAt: string
  performance: string
}

export interface ReferralRewardConfig {
  registerReward: string
  registerRewardUnit: string
  referralRewardRate: string
  referralRewardUnit: string
  referralRewardCondition: string
}

// --------------------------------------------
//  优惠券 /marketing
// --------------------------------------------
export type CouponStatus = 1 | 2 | 3 // 1=可用 2=已使用 3=已过期

export interface Coupon {
  id: string
  name: string
  amount: string
  minAmount: string
  expireAt: string
  usedAt?: string
  type: number
  typeName: string
  status?: CouponStatus
}

// --------------------------------------------
//  工单 /tickets
// --------------------------------------------
export interface TicketOnline {
  online: boolean
  workTime: string
  hotline?: string
  tip: string
}

export type TicketStatus = 1 | 2 | 3 | 4 // 1=待处理 2=处理中 3=待确认 4=已解决
export type TicketType = 1 | 2 | 3 | 4 // 1=物流 2=退款 3=商品 4=其他

export interface Ticket {
  id: string
  ticketNo: string
  type: TicketType
  typeName: string
  title: string
  content: string
  status: TicketStatus
  statusName: string
  images?: string[]
  createdAt: string
  replies?: TicketReply[]
}

export interface TicketReply {
  id: string
  content: string
  images?: string[]
  isCustomer: boolean
  createdAt: string
}

// --------------------------------------------
//  签到 /sign-in
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

// --------------------------------------------
//  收藏 /favorites
// --------------------------------------------
export interface FavoriteItem {
  id: string
  productId: string
  product: Product
  createdAt: string
}

// --------------------------------------------
//  安全类型 - URL 参数
// --------------------------------------------
/** 从 URL 参数获取的原始字符串 */
export type RawQueryString = string

/** 安全转义后的搜索关键字 */
export function sanitizeKeyword(kw: string): string {
  return String(kw)
    .replace(/[<>\"\'\\]/g, '')
    .trim()
    .slice(0, 100)
}

/** 从 URL 参数获取订单号（防注入） */
export function sanitizeOrderNo(no: string): string {
  return String(no).replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 64)
}

/** 从 URL 参数获取 ID（UUID 格式校验） */
export function sanitizeId(id: string): string {
  return String(id).replace(/[^a-fA-F0-9\-]/g, '').slice(0, 36)
}
