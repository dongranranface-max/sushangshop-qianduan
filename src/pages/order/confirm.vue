<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 顶部导航 -->
    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">{{ modeLabel }}确认</text>
      <view class="page-nav__action" />
    </view>

    <!-- 加载中 -->
    <view v-if="loading && !orderItems.length" class="loading-wrap">
      <view class="loading-spinner" />
      <text>加载中...</text>
    </view>

    <!-- 未登录 -->
    <view v-if="!loggedIn && !loading" class="empty-state">
      <view class="empty-state__icon">单</view>
      <text class="empty-state__text">请先登录</text>
      <view class="empty-state__btn" @click="goLogin"><text>去登录</text></view>
    </view>

    <template v-else>
      <!-- ====== 银行卡拦截横幅（换购订单未绑卡时显示） ====== -->
      <view v-if="mode === 'exchange' && !hasBankCard" class="bank-card-banner" @click="goBindCard">
        <text class="bank-card-banner__icon">!</text>
        <text class="bank-card-banner__text">请先绑定银行卡解锁换购</text>
        <text class="bank-card-banner__arrow">›</text>
      </view>

      <scroll-view class="confirm-scroll" scroll-y>
        <!-- ========== 收货地址 ========== -->
        <view class="address-card" @click="selectAddress">
          <view class="address-card__icon">址</view>
          <view class="address-card__content" v-if="address">
            <view class="address-card__top">
              <text class="address-name">{{ address.consignee }}</text>
              <text class="address-phone">{{ maskPhone(address.phone) }}</text>
              <view v-if="address.isDefault === 1" class="address-tag">默认</view>
              <view v-if="address.tag" class="address-tag address-tag--muted">{{ address.tag }}</view>
            </view>
            <text class="address-detail">
              {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}
            </text>
          </view>
          <view class="address-card__empty" v-else>
            <text class="address-empty-text">请添加收货地址</text>
            <view class="address-add-btn"><text>添加</text></view>
          </view>
          <text class="address-card__arrow">›</text>
        </view>

        <!-- ========== 商品清单 ========== -->
        <view class="items-section">
          <view
            v-for="item in orderItems"
            :key="item.productId || item.id"
            class="order-item"
          >
            <image class="order-item__img" :src="item.coverImage || item.image" mode="aspectFill" lazy-load />
            <view class="order-item__info">
              <text class="order-item__name">{{ item.productName || item.name }}</text>
              <!-- SKU 规格 -->
              <text v-if="item.specs" class="order-item__sku">{{ item.specs }}</text>
              <view class="order-item__tags">
                <view class="tag-box" :class="'tag-' + mode">{{ modeName }}</view>
              </view>
              <view class="order-item__bottom">
                <!-- 消费商品：现金价 -->
                <template v-if="mode === 'consume'">
                  <text class="order-item__price">
                    <text class="price-cash">¥{{ item.price }}</text>
                  </text>
                </template>
                <!-- 换购商品：现金 + 积分拆分（70%资金） -->
                <template v-else-if="mode === 'exchange'">
                  <view class="exchange-price-wrap">
                    <text class="price-cash">¥{{ item.cashPrice || getCashPrice(item) }}</text>
                    <text class="price-plus">+{{ item.pointsPrice || getPointsPrice(item) }}积分</text>
                  </view>
                </template>
                <!-- 兑换商品：积分全额 -->
                <template v-else>
                  <text class="order-item__price">
                    <text class="price-points">{{ item.requiredPoints || item.points }}积分</text>
                  </text>
                </template>
                <text class="order-item__qty">×{{ item.quantity }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- ========== 发票信息 ========== -->
        <view class="invoice-card">
          <view class="invoice-card__header" @click="toggleInvoice">
            <view class="invoice-card__left">
              <text class="invoice-card__label">发票信息</text>
              <text class="invoice-card__value">
                <template v-if="!invoiceEnabled">不开发票</template>
                <template v-else>{{ invoiceType === 1 ? '个人' : '企业' }} {{ invoiceTaxNo ? '（税号已填）' : '（请填写税号）' }}</template>
              </text>
            </view>
            <text class="invoice-card__toggle">{{ invoiceExpanded ? '收起 ∧' : '开发票 ∨' }}</text>
          </view>

          <view v-if="invoiceExpanded" class="invoice-card__body">
            <view class="invoice-type-row">
              <view
                class="invoice-type-btn"
                :class="{ active: invoiceType === 1 }"
                @click="invoiceType = 1"
              >
                <text>个人</text>
              </view>
              <view
                class="invoice-type-btn"
                :class="{ active: invoiceType === 2 }"
                @click="invoiceType = 2"
              >
                <text>企业</text>
              </view>
            </view>
            <view v-if="invoiceType === 2" class="invoice-tax-row">
              <input
                v-model="invoiceTaxNo"
                class="invoice-tax-input"
                placeholder="请输入税号"
                placeholder-class="invoice-tax-placeholder"
                maxlength="20"
              />
            </view>
            <view class="invoice-disable-row" @click="invoiceEnabled = false; invoiceExpanded = false">
              <text>不开具发票</text>
            </view>
          </view>
        </view>

        <!-- ========== 优惠券 ========== -->
        <view class="coupon-card" @click="showCouponPanel = true">
          <view class="coupon-card__left">
            <text class="coupon-card__label">优惠券</text>
            <text class="coupon-card__tip">
              <template v-if="availableCoupons.length > 0">
                有 {{ availableCoupons.length }} 张可用
              </template>
              <template v-else>暂无可用</template>
            </text>
          </view>
          <view class="coupon-card__right">
            <template v-if="selectedCoupon">
              <text class="coupon-card__selected-name">{{ selectedCoupon.name }}</text>
            </template>
            <text class="coupon-card__arrow">›</text>
          </view>
        </view>

        <!-- ========== 积分抵扣（仅消费订单） ========== -->
        <view v-if="mode === 'consume'" class="points-deduct-card">
          <view class="points-deduct-card__left">
            <text class="points-deduct-card__label">积分抵扣</text>
            <text class="points-deduct-card__sub">
              可用 {{ assetStore.ecoPointsDisplay }} 积分
              <text v-if="pointsDeductRatio > 0">，抵扣比例 {{ (pointsDeductRatio * 100).toFixed(0) }}%</text>
            </text>
          </view>
          <view class="points-deduct-card__right">
            <text v-if="pointsDeductEnabled && pointsDeductAmount > 0" class="points-deduct-amount">
              -¥{{ pointsDeductAmount.toFixed(2) }}
            </text>
            <view class="switch-wrap" @click="togglePointsDeduct">
              <view class="switch" :class="{ active: pointsDeductEnabled }">
                <view class="switch-thumb" />
              </view>
            </view>
          </view>
        </view>

        <!-- 资金分配说明（换购订单专用，v5.2 spec） -->
        <view v-if="mode === 'exchange'" class="fund-allocation-card">
          <view class="fund-allocation-card__title">资金自动分配说明</view>
          <view class="fund-allocation-item">
            <view class="fund-allocation-item__icon">①</view>
            <view class="fund-allocation-item__text">
              <text class="fund-allocation-item__amount">70% 资金</text>
              <text class="fund-allocation-item__desc">→ 平台代付至您的绑定银行卡（自动处理）</text>
            </view>
          </view>
          <view class="fund-allocation-item">
            <view class="fund-allocation-item__icon">②</view>
            <view class="fund-allocation-item__text">
              <text class="fund-allocation-item__amount">30% 金额</text>
              <text class="fund-allocation-item__desc">→ 转化为等值消费积分，存入您的积分账户</text>
            </view>
          </view>
          <view class="fund-allocation-card__footer">
            换购订单完成后，积分将直接可用于兑换商城，全部流程自动完成
          </view>
        </view>

        <!-- ========== 订单摘要 ========== -->
        <view class="summary-section">
          <!-- 消费型 -->
          <template v-if="mode === 'consume'">
            <view class="summary-row">
              <text class="summary-label">商品金额</text>
              <text class="summary-value">¥{{ goodsAmount }}</text>
            </view>
            <view class="summary-row">
              <text class="summary-label">运费</text>
              <text class="summary-value summary-free">免运费</text>
            </view>
            <view v-if="selectedCoupon" class="summary-row">
              <text class="summary-label">优惠券</text>
              <text class="summary-value summary-discount">-¥{{ getCouponDiscount() }}</text>
            </view>
            <view v-if="pointsDeductEnabled && pointsDeductAmount > 0" class="summary-row">
              <text class="summary-label">积分抵扣</text>
              <text class="summary-value summary-discount">-¥{{ pointsDeductAmount.toFixed(2) }}</text>
            </view>
            <view v-if="estimatedEcoPoints" class="summary-row">
              <text class="summary-label">预计可得积分</text>
              <text class="summary-value summary-gold">+{{ estimatedEcoPoints }} 积分</text>
            </view>
          </template>

          <!-- 换购型：资金拆分显示 -->
          <template v-else-if="mode === 'exchange'">
            <view class="summary-row">
              <text class="summary-label">商品金额</text>
              <text class="summary-value">¥{{ goodsAmount }}</text>
            </view>
            <view class="summary-row">
              <text class="summary-label">运费</text>
              <text class="summary-value summary-free">免运费</text>
            </view>
            <view class="summary-row summary-split">
              <text class="summary-label">资金拆分</text>
              <view class="summary-split__detail">
                <view class="split-item">
                  <text class="split-item__label">现金</text>
                  <text class="split-item__value">¥{{ exchangeCashAmount }}</text>
                </view>
                <view class="split-divider" />
                <view class="split-item">
                  <text class="split-item__label">积分</text>
                  <text class="split-item__value">{{ exchangePointsAmount }}积分</text>
                </view>
              </view>
            </view>
            <view v-if="exchangePointsDeduct > 0" class="summary-row">
              <text class="summary-label">积分抵扣</text>
              <text class="summary-value summary-discount">-{{ exchangePointsDeduct }}积分</text>
            </view>
            <view class="summary-row summary-highlight">
              <text class="summary-label">实付金额</text>
              <text class="summary-value summary-highlight">¥{{ actualAmount }}</text>
            </view>
          </template>

          <!-- 兑换型 -->
          <template v-else-if="mode === 'redeem'">
            <view class="summary-row">
              <text class="summary-label">兑换积分</text>
              <text class="summary-value summary-gold">{{ totalPoints }} 积分</text>
            </view>
            <view class="summary-row">
              <text class="summary-label">运费</text>
              <text class="summary-value summary-free">免运费</text>
            </view>
          </template>
        </view>

        <!-- ========== 订单备注 ========== -->
        <view class="remark-card">
          <text class="remark-label">订单备注</text>
          <textarea
            v-model="remark"
            class="remark-textarea"
            placeholder="选填，可输入备注信息（最多100字）"
            placeholder-class="remark-placeholder"
            maxlength="100"
            :show-confirm-bar="false"
          />
          <text class="remark-counter">{{ remark.length }}/100</text>
        </view>

        <view class="scroll-bottom" />
      </scroll-view>

      <!-- ========== 底部结算栏 ========== -->
      <view class="bottom-bar">
        <view class="bottom-bar__total">
          <text class="total-label">合计</text>
          <view class="total-amount">
            <template v-if="mode === 'redeem'">
              <text class="total-points">{{ totalPoints }}积分</text>
            </template>
            <template v-else>
              <text class="total-cash">¥{{ settlementAmount }}</text>
              <text v-if="mode === 'exchange' && exchangePointsAmount > 0" class="total-points">+{{ exchangePointsAmount }}积分</text>
            </template>
          </view>
        </view>
        <view
          class="bottom-bar__btn btn-fire"
          :class="{ disabled: submitting || (mode === 'exchange' && !hasBankCard) }"
          @click="handleSubmit"
        >
          <text v-if="submitting" class="btn-text">提交中...</text>
          <text v-else class="btn-text">提交订单</text>
        </view>
      </view>
    </template>

    <view class="safe-area-bottom" />

    <!-- ========== 优惠券选择面板 ========== -->
    <view v-if="showCouponPanel" class="coupon-overlay" @click="showCouponPanel = false">
      <view class="coupon-panel" @click.stop>
        <view class="coupon-panel__header">
          <text class="coupon-panel__title">选择优惠券</text>
          <view class="coupon-panel__close" @click="showCouponPanel = false"><text>×</text></view>
        </view>

        <!-- 不使用优惠券选项 -->
        <view class="coupon-no-use" :class="{ selected: !selectedCoupon }" @click="selectCoupon(null)">
          <text>不使用优惠券</text>
          <view v-if="!selectedCoupon" class="coupon-no-use__check">✓</view>
        </view>

        <scroll-view scroll-y class="coupon-panel__list">
          <view v-if="availableCoupons.length === 0" class="coupon-empty">
            <text>暂无可用优惠券</text>
          </view>
          <view
            v-for="coupon in allCoupons"
            :key="coupon.id"
            class="coupon-option"
            :class="{ disabled: !canUseCoupon(coupon), selected: selectedCoupon?.id === coupon.id }"
            @click="canUseCoupon(coupon) && selectCoupon(coupon)"
          >
            <view class="coupon-option__left">
              <view class="coupon-option__value">
                <template v-if="coupon.type === 1">
                  <text class="coupon-option__amount">新人券</text>
                </template>
                <template v-else-if="coupon.type === 2">
                  <text class="coupon-option__amount">¥{{ coupon.value }}</text>
                </template>
                <template v-else>
                  <text class="coupon-option__amount">{{ coupon.value }}积分</text>
                </template>
              </view>
              <view class="coupon-option__condition">
                <template v-if="coupon.type === 1">新人专享</template>
                <template v-else-if="coupon.type === 2">满{{ coupon.minAmount }}元可用</template>
                <template v-else>{{ coupon.value }}积分兑换</template>
              </view>
            </view>
            <view class="coupon-option__right">
              <text class="coupon-option__name">{{ coupon.name }}</text>
              <text class="coupon-option__date">有效期至 {{ formatDate(coupon.validTo) }}</text>
              <view v-if="selectedCoupon?.id === coupon.id" class="coupon-option__check">✓</view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- ========== 网络错误/库存不足等提示 ========== -->
    <view v-if="errorMsg" class="error-toast" @click="errorMsg = ''">
      <text>{{ errorMsg }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { orderApi, addressApi, marketingApi, walletApi, productApi, userApi } from '@/utils/api'
import { checkAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'
import { useToast } from '@/composables/useToast'

const toast = useToast()

// ===========================================
//  Type Definitions
// ===========================================
interface OrderItem {
  productId: string
  id?: string
  name: string
  productName?: string
  coverImage?: string
  image?: string
  price: string | number
  cashPrice?: string | number
  pointsPrice?: string | number
  requiredPoints?: string | number
  points?: string | number
  quantity: number
  specs?: string
  type?: number
  ecoPoints?: number
  [k: string]: unknown
}

interface AddressItem {
  id: string
  consignee: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: number
  tag?: string
  [k: string]: unknown
}

interface CouponItem {
  id: string
  name: string
  type: number
  value: string | number
  minAmount: string | number
  validFrom: string
  validTo: string
  status: number
  claimedAt?: string
  [k: string]: unknown
}

// ===========================================
//  State
// ===========================================
const statusBarHeight = ref(20)
const loggedIn = ref(checkAuth())
const loading = ref(false)
const submitting = ref(false)
const errorMsg = ref('')

const orderItems = ref<OrderItem[]>([])
const address = ref<AddressItem | null>(null)
const remark = ref('')

// 发票
const invoiceEnabled = ref(false)
const invoiceExpanded = ref(false)
const invoiceType = ref<1 | 2>(1)
const invoiceTaxNo = ref('')

// 优惠券
const showCouponPanel = ref(false)
const availableCoupons = ref<CouponItem[]>([])
const selectedCoupon = ref<CouponItem | null>(null)

// 积分抵扣
const pointsDeductEnabled = ref(true)
const pointsDeductRatio = ref(0.1) // 10% 抵扣比例
const walletPoints = ref(0)

// 银行卡
const hasBankCard = ref(false)

// mode: consume(1) / exchange(2) / redeem(3)
const mode = ref<'consume' | 'exchange' | 'redeem'>('consume')

// ===========================================
//  Computed
// ===========================================
const modeLabel = computed(() =>
  mode.value === 'consume' ? '消费' : mode.value === 'exchange' ? '换购' : '兑换'
)

const modeName = computed(() =>
  mode.value === 'consume' ? '自营' : mode.value === 'exchange' ? '换购' : '兑换'
)

// 商品总价（现金部分）
const goodsAmount = computed(() => {
  const total = orderItems.value.reduce((s, i) => s + Number(i.price || 0) * (i.quantity || 1), 0)
  return total.toFixed(2)
})

// 换购订单：现金部分（70%）
const exchangeCashAmount = computed(() => {
  const total = orderItems.value.reduce((s, i) => {
    const cash = Number(i.cashPrice || i.price || 0) * (i.quantity || 1)
    return s + cash
  }, 0)
  return total.toFixed(2)
})

// 换购订单：积分部分
const exchangePointsAmount = computed(() =>
  orderItems.value.reduce((s, i) => s + (Number(i.pointsPrice || i.requiredPoints || i.points || 0) * (i.quantity || 1)), 0)
)

// 积分抵扣金额
const pointsDeductAmount = computed(() => {
  if (!pointsDeductEnabled.value) return 0
  const orderCash = Number(goodsAmount.value)
  const maxDeduct = orderCash * pointsDeductRatio.value
  return Math.min(walletPoints.value, maxDeduct)
})

// 积分抵扣后实付（消费订单）
const actualAmount = computed(() => {
  if (mode.value === 'consume') {
    const cash = Number(goodsAmount.value)
    const couponDiscount = getCouponDiscount()
    const afterCoupon = Math.max(0, cash - couponDiscount)
    const afterPoints = Math.max(0, afterCoupon - pointsDeductAmount.value)
    return afterPoints.toFixed(2)
  }
  if (mode.value === 'exchange') {
    return Number(exchangeCashAmount.value).toFixed(2)
  }
  return '0.00'
})

// 结算金额（底部栏显示）
const settlementAmount = computed(() => actualAmount.value)

// 预计可得积分
const estimatedEcoPoints = computed(() =>
  orderItems.value.reduce((s, i) => s + ((i.ecoPoints || 0) * (i.quantity || 1)), 0)
)

// 换购积分抵扣
const exchangePointsDeduct = computed(() => {
  const needed = exchangePointsAmount.value
  return Math.min(needed, walletPoints.value)
})

// 兑换总积分
const totalPoints = computed(() =>
  orderItems.value.reduce((s, i) => s + (Number(i.requiredPoints || i.points || 0) * (i.quantity || 1)), 0)
)

// 所有优惠券（可用 + 已用/过期以供展示）
const allCoupons = computed(() => availableCoupons.value)

// ===========================================
//  Lifecycle
// ===========================================
onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (loggedIn.value) {
    assetStore.fetchBalance()
    loadWalletPoints()
    loadBankCardStatus()
    loadAvailableCoupons()
  }
  loadSelectedAddress()
  loadData()
})

// ===========================================
//  Data Loading
// ===========================================
async function loadData() {
  loading.value = true
  try {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    const options = (current as unknown as { options?: Record<string, string> })?.options || {}
    const { cartIds, productId, quantity } = options

    // 从上一页面传入的商品数据（立即购买 / 购物车选择后）
    const goodsListRaw = uni.getStorageSync('goodsList')
    if (goodsListRaw) {
      const list = Array.isArray(goodsListRaw) ? goodsListRaw : [goodsListRaw]
      orderItems.value = list.map((g: OrderItem) => ({
        productId: g.productId || g.id || '',
        name: g.productName || g.name || '',
        productName: g.productName || g.name || '',
        coverImage: g.coverImage || g.image || '',
        price: g.price || 0,
        cashPrice: g.cashPrice || g.price || 0,
        pointsPrice: g.pointsPrice || g.requiredPoints || g.points || 0,
        requiredPoints: g.requiredPoints || g.points || 0,
        quantity: g.quantity || 1,
        specs: g.specs || '',
        type: g.type || 1,
        ecoPoints: g.ecoPoints || 0,
      }))
      // 根据商品类型判断订单模式
      const firstType = list[0]?.type
      mode.value = firstType === 3 ? 'redeem' : firstType === 2 ? 'exchange' : 'consume'
      uni.removeStorageSync('goodsList')
    } else if (cartIds) {
      // 从本地购物车数据读取（已由上一页传入）
      const cartRaw = uni.getStorageSync('cartGoodsList')
      if (cartRaw) {
        orderItems.value = cartRaw as OrderItem[]
        const firstType = (cartRaw as OrderItem[])[0]?.type
        mode.value = firstType === 3 ? 'redeem' : firstType === 2 ? 'exchange' : 'consume'
      }
    } else if (productId) {
      const qty = Number(quantity || 1)
      try {
        const res = await productApi.getDetail(String(productId))
        if (res) {
          orderItems.value = [{
            productId: res.id,
            name: res.name,
            productName: res.name,
            coverImage: res.coverImage,
            price: res.price,
            cashPrice: res.price,
            pointsPrice: res.points || res.requiredPoints || 0,
            requiredPoints: res.points || res.requiredPoints || 0,
            quantity: qty,
            specs: '',
            type: res.type,
            ecoPoints: 0,
          }]
          mode.value = res.type === 3 ? 'redeem' : res.type === 2 ? 'exchange' : 'consume'
        }
      } catch {
        errorMsg.value = '商品信息加载失败，请返回重试'
        setTimeout(() => errorMsg.value = '', 3000)
      }
    }
  } catch {
    orderItems.value = []
  } finally {
    loading.value = false
  }
}

async function loadWalletPoints() {
  try {
    const balance = await walletApi.getBalance()
    walletPoints.value = Number(balance.ecoPoints || 0)
  } catch {
    walletPoints.value = assetStore.ecoPoints
  }
}

async function loadBankCardStatus() {
  try {
    const profile = await userApi.getProfile()
    hasBankCard.value = !!(profile?.bankCard?.bankCard)
  } catch {
    hasBankCard.value = false
  }
}

async function loadAvailableCoupons() {
  try {
    const res = await marketingApi.getMyCoupons({ status: 0 })
    const now = new Date()
    availableCoupons.value = (res.list || []).filter((c: CouponItem) => {
      const validTo = new Date(c.validTo)
      const validFrom = new Date(c.validFrom)
      return c.status === 0 && validTo >= now && validFrom <= now
    })
  } catch {
    availableCoupons.value = []
  }
}

async function loadAddress() {
  if (!checkAuth()) return
  try {
    const list = await addressApi.list()
    const def = list.find((a: AddressItem) => a.isDefault === 1) || list[0]
    if (def) address.value = def as AddressItem
  } catch {}
}

function loadSelectedAddress() {
  try {
    const sel = uni.getStorageSync('selectedAddress')
    if (sel) {
      address.value = sel as AddressItem
      uni.removeStorageSync('selectedAddress')
    } else {
      loadAddress()
    }
  } catch {}
}

// ===========================================
//  Actions
// ===========================================
function selectAddress() {
  if (!checkAuth()) return
  uni.navigateTo({ url: '/pages/address/list' })
}

function goBindCard() {
  uni.navigateTo({ url: '/pages/user/bank-card' })
}

function toggleInvoice() {
  if (!invoiceEnabled.value) {
    invoiceEnabled.value = true
    invoiceExpanded.value = true
  } else {
    invoiceExpanded.value = !invoiceExpanded.value
  }
}

function togglePointsDeduct() {
  pointsDeductEnabled.value = !pointsDeductEnabled.value
}

function selectCoupon(coupon: CouponItem | null) {
  selectedCoupon.value = coupon
  showCouponPanel.value = false
}

function canUseCoupon(coupon: CouponItem): boolean {
  const orderCash = Number(goodsAmount.value)
  // 满减券需满足门槛
  if (coupon.type === 2 && orderCash < Number(coupon.minAmount || 0)) return false
  // 积分兑换券不能与新人券/满减券叠加（统一规则）
  // 以下互斥：新人券(1) + 满减券(2) 不能叠加
  if (selectedCoupon.value) {
    const sel = selectedCoupon.value
    if (coupon.type === 1 && sel.type === 2) return false
    if (coupon.type === 2 && sel.type === 1) return false
  }
  return true
}

function getCouponDiscount(): number {
  if (!selectedCoupon.value) return 0
  const coupon = selectedCoupon.value
  if (coupon.type === 2) {
    return Number(coupon.value || 0)
  }
  return 0
}

function getCashPrice(item: OrderItem): string {
  const total = Number(item.price || 0)
  return (total * 0.7).toFixed(2)
}

function getPointsPrice(item: OrderItem): number {
  return Number(item.requiredPoints || item.points || 0)
}

// 手机号脱敏
function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 日期格式化
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

async function handleSubmit() {
  if (!checkAuth()) return

  // 地址校验
  if (!address.value) {
    toast.warning('请选择收货地址')
    return
  }

  // 换购订单银行卡校验
  if (mode.value === 'exchange' && !hasBankCard.value) {
    toast.warning('请先绑定银行卡')
    return
  }

  if (submitting.value) return
  submitting.value = true
  uni.showLoading({ title: '' })

  try {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    const options = (current as unknown as { options?: Record<string, string> })?.options || {}
    const { cartIds, productId, quantity } = options

    // 构建订单类型
    const orderType = mode.value === 'redeem' ? 3 : mode.value === 'exchange' ? 2 : 1

    // 构建商品项
    const items = orderItems.value.map(item => ({
      productId: item.productId,
      quantity: item.quantity || 1,
    }))

    // 构建发票信息
    const invoiceInfo = invoiceEnabled.value ? {
      type: invoiceType.value,
      taxNo: invoiceType.value === 2 ? invoiceTaxNo.value : '',
    } : null

    const payload: Parameters<typeof orderApi.createOrder>[0] & { cartIds?: string; productId?: string; quantity?: number } = {
      orderType,
      addressId: address.value.id,
      items,
      remark: remark.value || undefined,
      couponId: selectedCoupon.value?.id || undefined,
      pointsDeducted: pointsDeductEnabled.value && pointsDeductAmount.value > 0,
      invoice: invoiceInfo || undefined,
    }

    // 购物车下单时传入 cartIds
    if (cartIds) {
      payload.cartIds = cartIds
    }
    // 立即购买时传入 productId + quantity
    if (productId) {
      payload.productId = productId
      payload.quantity = Number(quantity || 1)
    }

    await orderApi.createOrder(payload)
    uni.hideLoading()

    // 成功后清理 storage 并跳转
    uni.removeStorageSync('cartGoodsList')
    uni.removeStorageSync('selectedAddress')

    toast.success('下单成功')
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/order/list?tab=1' })
    }, 1500)
  } catch (err: { message?: string; code?: number }) {
    uni.hideLoading()
    const code = err?.code
    const msg = err?.message || '下单失败'

    if (code === 422) {
      if (msg.includes('库存') || msg.includes('stock')) {
        errorMsg.value = '商品库存不足，请返回购物车重新选择'
      } else if (msg.includes('下架') || msg.includes('delist')) {
        errorMsg.value = '商品已下架，请返回重新选择'
      } else {
        errorMsg.value = msg
      }
      setTimeout(() => errorMsg.value = '', 4000)
    } else if (code === 401) {
      toast.error('请重新登录')
      setTimeout(() => uni.navigateTo({ url: '/pages/auth/login' }), 1200)
    } else {
      toast.error(msg)
    }
  } finally {
    submitting.value = false
  }
}

function goBack() { uni.navigateBack() }
function goLogin() { uni.navigateTo({ url: '/pages/auth/login' }) }
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  @include page-bg;
  display: flex;
  flex-direction: column;
}

.status-bar { width: 100%; }

// ========== 导航栏 ==========
.page-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx $spacing-base;
  background: rgba(249, 249, 249, 0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1rpx solid rgba(20, 20, 20, 0.04);

  &__back, &__action {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    border: 1rpx solid rgba(20, 20, 20, 0.06);
    border-radius: 50%;
    font-size: 28rpx;
    color: $mineral-gray;
    flex-shrink: 0;
  }

  &__title {
    flex: 1;
    font-size: 32rpx;
    font-weight: 700;
    color: $mineral-gray;
    text-align: center;
    letter-spacing: 0.5rpx;
  }
}

// ========== 银行卡拦截横幅 ==========
.bank-card-banner {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: $spacing-base $spacing-base 0;
  padding: 20rpx $spacing-base;
  background: rgba(192, 69, 74, 0.08);
  border: 1rpx solid rgba(192, 69, 74, 0.20);
  border-radius: $radius-md;
  cursor: pointer;

  &__icon {
    width: 36rpx;
    height: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $danger;
    border-radius: 50%;
    font-size: 22rpx;
    font-weight: 800;
    color: #fff;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    font-size: 26rpx;
    font-weight: 600;
    color: $danger;
  }

  &__arrow {
    font-size: 32rpx;
    color: $danger;
  }
}

// ========== 滚动区域 ==========
.confirm-scroll {
  flex: 1;
  height: calc(100vh - 120rpx);
}

// ========== 收货地址卡片 ==========
.address-card {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  margin: $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;
  transition: transform 0.2s ease;

  &:active { transform: scale(0.99); }

  &__icon {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(184, 152, 118, 0.10);
    border-radius: $radius-md;
    font-size: 24rpx;
    font-weight: 700;
    color: $accent-dark;
    border: 1rpx solid rgba(184, 152, 118, 0.20);
    flex-shrink: 0;
  }

  &__content { flex: 1; min-width: 0; }

  &__top {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-bottom: 6rpx;
    flex-wrap: wrap;
  }

  &__empty {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  &__arrow {
    font-size: 36rpx;
    color: $text-muted;
    flex-shrink: 0;
  }
}

.address-name { font-size: 30rpx; font-weight: 700; color: $text-primary; }
.address-phone { font-size: 26rpx; color: $text-secondary; }
.address-tag {
  font-size: 20rpx;
  font-weight: 600;
  padding: 2rpx 10rpx;
  background: rgba(184, 152, 118, 0.10);
  color: $accent-dark;
  border-radius: 20rpx;
  border: 1rpx solid rgba(184, 152, 118, 0.25);

  &--muted {
    background: rgba(47, 53, 66, 0.06);
    color: $text-secondary;
    border-color: rgba(47, 53, 66, 0.10);
  }
}
.address-detail { font-size: 26rpx; color: $text-muted; line-height: 1.5; display: block; }
.address-empty-text { font-size: 28rpx; color: $text-muted; }
.address-add-btn {
  height: 52rpx;
  padding: 0 24rpx;
  background: $danger;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;

  text { font-size: 24rpx; font-weight: 700; color: #fff; }
}

// ========== 商品清单 ==========
.items-section {
  margin: 0 $spacing-base $spacing-base;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;
  overflow: hidden;
}

.order-item {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: $spacing-base;

  & + & { border-top: 1rpx solid $border-light; }

  &__img {
    width: 140rpx;
    height: 140rpx;
    border-radius: $radius-md;
    background: $bg-tertiary;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  &__name {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    line-height: 1.4;
  }

  &__sku {
    font-size: 22rpx;
    color: $text-muted;
    background: $bg-tertiary;
    padding: 2rpx 10rpx;
    border-radius: 8rpx;
    align-self: flex-start;
  }

  &__tags { display: flex; gap: 8rpx; }

  &__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__price { display: flex; align-items: baseline; gap: 4rpx; }

  &__qty { font-size: 24rpx; color: $text-muted; }
}

.tag-box {
  font-size: 20rpx;
  font-weight: 600;
  padding: 3rpx 12rpx;
  border-radius: 20rpx;
  background: rgba(47, 53, 66, 0.06);
  color: $mineral-gray;
  border: 1rpx solid rgba(47, 53, 66, 0.10);

  &.tag-consume { background: rgba(184, 152, 118, 0.08); color: $accent-dark; border-color: rgba(184, 152, 118, 0.15); }
  &.tag-exchange { background: rgba(184, 152, 118, 0.10); color: $accent-dark; border-color: rgba(184, 152, 118, 0.20); }
  &.tag-redeem { background: rgba(184, 152, 118, 0.12); color: $accent-dark; border-color: rgba(184, 152, 118, 0.25); }
}

.price-cash { font-family: $asset-balance-font; font-size: 28rpx; font-weight: 700; color: $mineral-gray; }
.price-points { font-size: 24rpx; font-weight: 700; color: $accent-dark; }
.price-plus { font-size: 22rpx; font-weight: 600; color: $accent-dark; }
.exchange-price-wrap { display: flex; align-items: baseline; gap: 6rpx; }

// ========== 发票卡片 ==========
.invoice-card {
  margin: 0 $spacing-base $spacing-base;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-base $spacing-lg;
    cursor: pointer;
  }

  &__left { flex: 1; }

  &__label {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    display: block;
    margin-bottom: 4rpx;
  }

  &__value { font-size: 24rpx; color: $text-muted; }

  &__toggle {
    font-size: 26rpx;
    color: $accent-dark;
    font-weight: 600;
  }

  &__body {
    border-top: 1rpx solid $border-light;
    padding: $spacing-base $spacing-lg;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }
}

.invoice-type-row { display: flex; gap: 16rpx; }

.invoice-type-btn {
  flex: 1;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-tertiary;
  border: 2rpx solid transparent;
  border-radius: $radius-md;
  font-size: 28rpx;
  color: $text-secondary;
  transition: all 0.2s;

  &.active {
    background: rgba(184, 152, 118, 0.08);
    border-color: $accent-dark;
    color: $accent-dark;
    font-weight: 600;
  }
}

.invoice-tax-input {
  height: 80rpx;
  padding: 0 $spacing-base;
  background: $bg-tertiary;
  border-radius: $radius-md;
  font-size: 28rpx;
  color: $text-primary;
  border: 1rpx solid $border-light;

  &::placeholder { color: $text-muted; }
}
.invoice-tax-placeholder { color: $text-muted; }

.invoice-disable-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx;
  font-size: 26rpx;
  color: $text-muted;
  cursor: pointer;
}

// ========== 优惠券卡片 ==========
.coupon-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 $spacing-base $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;
  cursor: pointer;

  &__left { flex: 1; }

  &__label {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    display: block;
    margin-bottom: 4rpx;
  }

  &__tip { font-size: 24rpx; color: $text-muted; }

  &__right {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  &__selected-name {
    font-size: 26rpx;
    color: $accent-dark;
    font-weight: 600;
    max-width: 200rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__arrow { font-size: 32rpx; color: $text-muted; }
}

// ========== 积分抵扣卡片 ==========
.points-deduct-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 $spacing-base $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;

  &__left { flex: 1; }

  &__label {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    display: block;
    margin-bottom: 4rpx;
  }

  &__sub { font-size: 24rpx; color: $text-muted; }

  &__right {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }
}

.points-deduct-amount {
  font-size: 28rpx;
  font-weight: 700;
  color: $accent-dark;
}

.switch-wrap { cursor: pointer; }
.switch {
  width: 88rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: $bg-tertiary;
  border: 1rpx solid $border-light;
  position: relative;
  transition: all 0.25s ease;

  &.active {
    background: $accent;
    border-color: $accent-dark;
  }
}

.switch-thumb {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #fff;
  position: absolute;
  top: 3rpx;
  left: 3rpx;
  transition: transform 0.25s ease;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15);

  .switch.active & {
    transform: translateX(40rpx);
  }
}
// ========== 资金分配说明卡片（v5.2） ==========
.fund-allocation-card {
  margin: 0 $spacing-base $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(12px);
  border: 1rpx solid $border-primary;
  border-radius: $radius-lg;

  &__title {
    font-size: 26rpx;
    font-weight: 700;
    color: $mineral-navy;
    margin-bottom: 16rpx;
  }

  &__footer {
    font-size: 22rpx;
    color: $text-muted;
    margin-top: 12rpx;
    padding-top: 12rpx;
    border-top: 1rpx solid $border-light;
  }
}

.fund-allocation-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 8rpx 0;

  &__icon {
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    background: $gold;
    color: $mineral-navy;
    font-size: 22rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2rpx;
  }

  &__amount {
    font-size: 26rpx;
    font-weight: 600;
    color: $gold-dark;
  }

  &__desc {
    font-size: 22rpx;
    color: $text-muted;
  }
}

// ========== 订单摘要 ==========
.summary-section {
  margin: 0 $spacing-base $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 0;
  border-bottom: 1rpx solid $border-light;

  &:last-child { border-bottom: none; }

  &.summary-highlight {
    padding-top: $spacing-base;
    border-top: 2rpx solid rgba(184, 152, 118, 0.20);
    margin-top: 8rpx;
  }

  &.summary-split {
    flex-direction: column;
    align-items: flex-start;
    gap: 12rpx;
  }
}

.summary-label { font-size: 26rpx; color: $text-muted; }
.summary-value { font-size: 28rpx; font-weight: 600; color: $text-primary; }
.summary-free { color: $success; }
.summary-discount { color: $danger; }
.summary-gold { color: $accent-dark; }
.summary-highlight { font-size: 34rpx; font-weight: 700; color: $mineral-gray; font-family: $asset-balance-font; }

.summary-split__detail {
  display: flex;
  align-items: center;
  gap: 20rpx;
  width: 100%;
  justify-content: flex-end;
}

.split-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2rpx;

  &__label { font-size: 22rpx; color: $text-muted; }
  &__value { font-size: 28rpx; font-weight: 700; color: $text-primary; font-family: $asset-balance-font; }
}

.split-divider { width: 1rpx; height: 40rpx; background: $border-light; }

// ========== 备注 ==========
.remark-card {
  margin: 0 $spacing-base $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;
  position: relative;
}

.remark-label { font-size: 26rpx; color: $text-muted; display: block; margin-bottom: 12rpx; }
.remark-textarea {
  width: 100%;
  font-size: 28rpx;
  color: $text-primary;
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  min-height: 120rpx;
  line-height: 1.6;
  box-sizing: border-box;
}
.remark-placeholder { color: $text-muted; font-size: 26rpx; }
.remark-counter {
  position: absolute;
  bottom: $spacing-base;
  right: $spacing-lg;
  font-size: 22rpx;
  color: $text-muted;
}

// ========== 底部结算栏 ==========
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx $spacing-base;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(20px);
  border-top: 1rpx solid rgba(20, 20, 20, 0.06);
  box-shadow: 0 -8rpx 32rpx rgba(47, 53, 66, 0.06);

  &__total {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4rpx;
  }

  &__btn {
    height: 88rpx;
    padding: 0 56rpx;
    background: $btn-gold-gradient;
    border-radius: $radius-full;
    box-shadow: $btn-gold-shadow;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease;

    &:active { transform: scale(0.97); }

    &.disabled {
      background: $btn-disabled-bg;
      box-shadow: none;
      pointer-events: none;
    }
  }
}

.total-label { font-size: 22rpx; color: $text-muted; }
.total-amount { display: flex; align-items: baseline; gap: 6rpx; }
.total-cash { font-family: $asset-balance-font; font-size: 36rpx; font-weight: 700; color: $mineral-gray; font-variant-numeric: tabular-nums; }
.total-points { font-size: 22rpx; color: $accent-dark; font-weight: 600; }
.btn-text { font-size: 30rpx; font-weight: 700; color: #fff; letter-spacing: 1rpx; }

// ========== 优惠券选择面板 ==========
.coupon-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
}

.coupon-panel {
  width: 100%;
  max-height: 70vh;
  background: $bg-secondary;
  border-radius: $radius-2xl $radius-2xl 0 0;
  display: flex;
  flex-direction: column;
  animation: slide-up 0.28s ease;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-lg $spacing-base;
    border-bottom: 1rpx solid $border-light;
  }

  &__title {
    font-size: 32rpx;
    font-weight: 700;
    color: $text-primary;
    flex: 1;
    text-align: center;
  }

  &__close {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
    color: $text-muted;
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-base;
  }
}

.coupon-no-use {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 $spacing-base $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: $bg-tertiary;
  border: 2rpx solid transparent;
  border-radius: $radius-lg;

  &.selected {
    border-color: $accent-dark;
    background: rgba(184, 152, 118, 0.06);
  }

  text { font-size: 28rpx; color: $text-primary; font-weight: 600; }

  &__check { font-size: 28rpx; color: $accent-dark; font-weight: 700; }
}

.coupon-empty {
  text-align: center;
  padding: 60rpx;
  font-size: 28rpx;
  color: $text-muted;
}

.coupon-option {
  display: flex;
  gap: $spacing-base;
  margin-bottom: $spacing-base;
  padding: $spacing-base;
  background: $bg-secondary;
  border: 2rpx solid $border-light;
  border-radius: $radius-lg;
  position: relative;
  transition: all 0.2s;

  &.disabled {
    opacity: 0.45;
    pointer-events: none;
  }

  &.selected {
    border-color: $accent-dark;
    background: rgba(184, 152, 118, 0.06);
  }

  &__left {
    width: 180rpx;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6rpx;
    border-right: 1rpx dashed $border-light;
  }

  &__value { display: flex; align-items: baseline; gap: 4rpx; }
  &__amount { font-size: 36rpx; font-weight: 800; color: $accent-dark; font-family: $asset-balance-font; }
  &__condition { font-size: 20rpx; color: $text-muted; text-align: center; }

  &__right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6rpx;
    position: relative;
  }

  &__name { font-size: 28rpx; font-weight: 600; color: $text-primary; }
  &__date { font-size: 22rpx; color: $text-muted; }

  &__check {
    position: absolute;
    top: 0;
    right: 0;
    width: 36rpx;
    height: 36rpx;
    background: $accent-dark;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22rpx;
    color: #fff;
    font-weight: 700;
  }
}

// ========== 错误提示 ==========
.error-toast {
  position: fixed;
  top: 120rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 300;
  background: rgba(192, 69, 74, 0.95);
  color: #fff;
  padding: 20rpx 40rpx;
  border-radius: $radius-full;
  font-size: 26rpx;
  font-weight: 600;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(192, 69, 74, 0.3);
}

// ========== 空/加载状态 ==========
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx;
  gap: 16rpx;
  font-size: 28rpx;
  color: $text-muted;
}
.loading-spinner {
  width: 56rpx;
  height: 56rpx;
  border: 3rpx solid rgba(184, 152, 118, 0.2);
  border-top-color: $accent-dark;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
  text-align: center;

  &__icon {
    width: 140rpx;
    height: 140rpx;
    line-height: 140rpx;
    text-align: center;
    font-size: 56rpx;
    font-weight: 800;
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: 50%;
    color: $accent-dark;
    margin-bottom: 32rpx;
  }

  &__text { font-size: 32rpx; font-weight: 600; color: $text-primary; margin-bottom: 40rpx; }

  &__btn {
    height: 80rpx;
    padding: 0 56rpx;
    background: $btn-gold-gradient;
    border-radius: $radius-full;
    box-shadow: $btn-gold-shadow;
    display: flex;
    align-items: center;
    justify-content: center;

    text { font-size: 30rpx; font-weight: 700; color: #fff; letter-spacing: 1rpx; }
  }
}

.scroll-bottom { height: 200rpx; }
</style>
