<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 导航栏 -->
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
      <view class="empty-state__btn" @click="goLogin">
        <text>去登录</text>
      </view>
    </view>

    <template v-else>
      <!-- ========== 收货地址 ========== -->
      <view class="address-section" @click="selectAddress">
        <view class="address-icon">址</view>
        <view class="address-info" v-if="address">
          <view class="address-top">
            <text class="address-name">{{ address.consignee }}</text>
            <text class="address-phone">{{ address.phone }}</text>
            <view v-if="address.isDefault" class="address-tag">默认</view>
          </view>
          <text class="address-detail">
            {{ (address as any).province }}{{ (address as any).city }}{{ (address as any).district }}{{ (address as any).detail }}
          </text>
        </view>
        <view class="address-empty" v-else>
          <text>请选择收货地址</text>
        </view>
        <text class="address-arrow">›</text>
      </view>

      <!-- ========== 商品信息 ========== -->
      <view class="items-section">
        <view class="items-section__title">
          <text>商品清单</text>
        </view>
        <view class="order-item" v-for="item in orderItems" :key="item.productId || item.id">
          <image class="order-item__img" :src="item.coverImage || item.image" mode="aspectFill" />
          <view class="order-item__info">
            <text class="order-item__name">{{ item.productName || item.name }}</text>
            <view class="order-item__tags">
              <view class="tag-box" :class="'tag-' + mode">{{ modeName }}</view>
            </view>
            <view class="order-item__bottom">
              <text class="order-item__price">
                <template v-if="mode === 'redeem'">
                  <text class="price-points">{{ item.requiredPoints }}积分</text>
                </template>
                <template v-else>
                  <text class="price-cash">¥{{ item.price }}</text>
                  <text v-if="item.requiredPoints" class="price-plus">+{{ item.requiredPoints }}积分</text>
                </template>
              </text>
              <text class="order-item__qty">×{{ item.quantity }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- ========== 订单信息摘要 ========== -->
      <view class="order-info-section">
        <!-- 消费型订单 -->
        <template v-if="mode === 'consume'">
          <view class="info-row">
            <text class="info-label">商品金额</text>
            <text class="info-value">¥{{ goodsAmount }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">运费</text>
            <text class="info-value info-free">免运费</text>
          </view>
          <view v-if="estimatedEcoPoints" class="info-row">
            <text class="info-label">预计可得积分</text>
            <text class="info-value info-gold">+{{ estimatedEcoPoints }} 积分</text>
          </view>
        </template>

        <!-- 换购型订单 -->
        <template v-else-if="mode === 'exchange'">
          <view class="info-row">
            <text class="info-label">商品金额</text>
            <text class="info-value">¥{{ goodsAmount }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">运费</text>
            <text class="info-value info-free">免运费</text>
          </view>
          <view v-if="exchangePointsDeduct" class="info-row">
            <text class="info-label">生态积分抵扣</text>
            <text class="info-value info-gold">-{{ exchangePointsDeduct }} 积分</text>
          </view>
          <view class="info-row info-row--highlight">
            <text class="info-label">实付金额</text>
            <text class="info-value info-highlight">¥{{ actualAmount }}</text>
          </view>
        </template>

        <!-- 兑换型订单 -->
        <template v-else-if="mode === 'redeem'">
          <view class="info-row">
            <text class="info-label">兑换积分</text>
            <text class="info-value info-gold">{{ totalPoints }} 积分</text>
          </view>
          <view class="info-row">
            <text class="info-label">运费</text>
            <text class="info-value info-free">免运费</text>
          </view>
        </template>
      </view>

      <!-- ========== 备注 ========== -->
      <view class="remark-section">
        <text class="remark-label">订单备注</text>
        <input
          class="remark-input"
          v-model="remark"
          placeholder="选填，可输入备注信息"
          placeholder-class="remark-placeholder"
        />
      </view>

      <!-- ========== 底部支付栏 ========== -->
      <view class="bottom-bar">
        <view class="bottom-bar__total">
          <text class="total-label">合计</text>
          <view class="total-amount">
            <template v-if="mode === 'redeem'">
              <text class="total-points">{{ totalPoints }}积分</text>
            </template>
            <template v-else>
              <text class="total-cash">¥{{ actualAmount }}</text>
              <text v-if="mode === 'exchange' && exchangePointsDeduct" class="total-pts">+{{ exchangePointsDeduct }}积分</text>
              <text v-else-if="mode === 'consume' && estimatedEcoPoints" class="total-pts">+{{ estimatedEcoPoints }}积分</text>
            </template>
          </view>
        </view>
        <view class="bottom-bar__submit" :class="{ disabled: submitting }" @click="handleSubmit">
          <text v-if="submitting" class="btn-text">提交中...</text>
          <text v-else class="btn-text">{{ modeLabel }}下单</text>
        </view>
      </view>
    </template>

    <view class="safe-area-bottom" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { orderApi, addressApi } from '@/utils/api'
import { checkAuth, requireAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'

const statusBarHeight = ref(20)
const loggedIn = ref(checkAuth())
const loading = ref(false)
const submitting = ref(false)
const orderItems = ref<any[]>([])
const address = ref<any>(null)
const remark = ref('')

type OrderMode = 'consume' | 'exchange' | 'redeem'
const mode = ref<OrderMode>('consume')

const modeLabel = computed(() => ({ consume: '消费', exchange: '换购', redeem: '兑换' }[mode.value]))
const modeName = computed(() => ({ consume: '消费', exchange: '换购', redeem: '兑换' }[mode.value]))

const goodsAmount = computed(() =>
  orderItems.value.reduce((s, i) => s + Number(i.price) * (i.quantity || 1), 0).toFixed(2)
)

const exchangePointsDeduct = computed(() => {
  if (mode.value !== 'exchange') return 0
  return Math.min(
    orderItems.value.reduce((s, i) => s + ((i.ecoPoints || 0) * (i.quantity || 1)), 0),
    assetStore.ecoPoints
  )
})

const actualAmount = computed(() => {
  if (mode.value === 'exchange') {
    return orderItems.value.reduce((s, i) => s + Number(i.price) * (i.quantity || 1), 0).toFixed(2)
  }
  return goodsAmount.value
})

const totalPoints = computed(() =>
  orderItems.value.reduce((s, i) => s + ((i.requiredPoints || 0) * (i.quantity || 1)), 0)
)

const estimatedEcoPoints = computed(() => {
  if (mode.value !== 'consume') return 0
  return Math.floor(Number(goodsAmount.value) * 10)
})

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  parseQuery()
  loadAddress()
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (!loggedIn.value) return
  assetStore.fetchBalance()
  loadSelectedAddress()
})

function parseQuery() {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as any
  const options = current?.options || {}

  const t = options.type ? Number(options.type) : 1
  mode.value = t === 3 ? 'redeem' : t === 2 ? 'exchange' : 'consume'

  if (options.cartIds) {
    loadFromCart(options.cartIds)
  } else if (options.productId) {
    loadDirect(options.productId, Number(options.quantity) || 1)
  } else {
    loadFromStorage()
  }
}

async function loadFromCart(cartIds: string) {
  loading.value = true
  try {
    const res = await orderApi.previewFromCart(cartIds)
    orderItems.value = res.items || []
    mode.value = res.type === 3 ? 'redeem' : res.type === 2 ? 'exchange' : 'consume'
  } catch {
    orderItems.value = []
  } finally {
    loading.value = false
  }
}

async function loadDirect(productId: string, quantity: number) {
  loading.value = true
  try {
    const res = await orderApi.previewDirect(productId, quantity)
    orderItems.value = [res].filter(Boolean)
  } catch {
    orderItems.value = []
  } finally {
    loading.value = false
  }
}

async function loadFromStorage() {
  try {
    const raw = uni.getStorageSync('pendingOrder')
    if (raw) orderItems.value = raw
  } catch {}
}

async function loadAddress() {
  if (!checkAuth()) return
  try {
    const list = await addressApi.list()
    const def = list.find((a: any) => a.isDefault === 1) || list[0]
    if (def) address.value = def
  } catch {}
}

function loadSelectedAddress() {
  try {
    const sel = uni.getStorageSync('selectedAddress')
    if (sel) {
      address.value = sel
      uni.removeStorageSync('selectedAddress')
    }
  } catch {}
}

function selectAddress() {
  if (!requireAuth()) return
  uni.navigateTo({ url: '/pages/address/list' })
}

function goBack() { uni.navigateBack() }
function goLogin() { uni.navigateTo({ url: '/pages/auth/login' }) }

async function handleSubmit() {
  if (!requireAuth()) return
  if (!address.value) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true

  try {
    const payload: any = {
      addressId: address.value.id,
      remark: remark.value,
    }

    let res: any
    if (mode.value === 'redeem') {
      res = await orderApi.createRedeem({ ...payload, items: orderItems.value.map((i: any) => ({ productId: i.productId, quantity: i.quantity || 1 })) })
    } else if (mode.value === 'exchange') {
      res = await orderApi.createExchange({ ...payload, items: orderItems.value.map((i: any) => ({ productId: i.productId, quantity: i.quantity || 1 })) })
    } else {
      res = await orderApi.createConsume({ ...payload, items: orderItems.value.map((i: any) => ({ productId: i.productId, quantity: i.quantity || 1 })) })
    }

    uni.showToast({ title: '下单成功', icon: 'success' })
    assetStore.fetchBalance()
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/order/list' })
    }, 1200)
  } catch (e: any) {
    uni.showToast({ title: e.message || '下单失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, #F9F9F9 0%, #F0EDE8 100%);
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.safe-area-top { width: 100%; }

.page-nav {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx $spacing-base;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1rpx solid $border-light;

  &__back,
  &__action {
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

.address-section {
  margin: $spacing-base;
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  transition: all 0.2s ease;

  &:active {
    background: rgba(255, 255, 255, 0.80);
  }

  .address-icon {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(184, 152, 118, 0.12);
    border-radius: 50%;
    font-size: 24rpx;
    font-weight: 700;
    color: $accent-dark;
    flex-shrink: 0;
  }

  .address-info {
    flex: 1;

    .address-top {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 6rpx;
    }

    .address-name {
      font-size: 30rpx;
      font-weight: 700;
      color: $text-primary;
    }

    .address-phone {
      font-size: 26rpx;
      color: $text-secondary;
      font-variant-numeric: tabular-nums;
    }

    .address-tag {
      font-size: 20rpx;
      padding: 4rpx 10rpx;
      background: $warm-yellow;
      color: $accent-dark;
      border-radius: 20rpx;
      border: 1rpx solid $border-primary;
      font-weight: 600;
    }

    .address-detail {
      font-size: 24rpx;
      color: $text-muted;
      line-height: 1.5;
    }
  }

  .address-empty {
    flex: 1;
    font-size: 28rpx;
    color: $text-muted;
  }

  .address-arrow {
    font-size: 36rpx;
    color: $text-muted;
    flex-shrink: 0;
  }
}

.items-section {
  margin: 0 $spacing-base $spacing-base;

  &__title {
    font-size: 28rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: $spacing-sm;
  }
}

.order-item {
  display: flex;
  gap: $spacing-base;
  padding: $spacing-base;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  margin-bottom: $spacing-sm;

  &__img {
    width: 160rpx;
    height: 160rpx;
    border-radius: $radius-md;
    background: $bg-tertiary;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
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

  &__tags {
    display: flex;
    gap: 8rpx;
  }

  &__bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }

  &__price {
    display: flex;
    align-items: baseline;
    gap: 6rpx;

    .price-cash {
      font-family: $asset-balance-font;
      font-size: 30rpx;
      font-weight: 700;
      color: $mineral-gray;
      font-variant-numeric: tabular-nums;
    }

    .price-points {
      font-size: 26rpx;
      font-weight: 700;
      color: $accent-dark;
      font-variant-numeric: tabular-nums;
    }

    .price-plus {
      font-size: 22rpx;
      color: $accent-dark;
    }
  }

  &__qty {
    font-size: 26rpx;
    color: $text-muted;
    font-variant-numeric: tabular-nums;
  }
}

.tag-box {
  font-size: 20rpx;
  padding: 4rpx 10rpx;
  border-radius: 20rpx;
  font-weight: 600;

  &.tag-consume {
    background: rgba(142, 116, 89, 0.10);
    color: $accent-dark;
    border: 1rpx solid rgba(142, 116, 89, 0.25);
  }

  &.tag-exchange {
    background: rgba(65, 75, 94, 0.08);
    color: $text-secondary;
    border: 1rpx solid rgba(65, 75, 94, 0.10);
  }

  &.tag-redeem {
    background: rgba(47, 53, 66, 0.08);
    color: $mineral-gray;
    border: 1rpx solid rgba(47, 53, 66, 0.10);
  }
}

.order-info-section {
  margin: 0 $spacing-base $spacing-base;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  padding: $spacing-base $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .info-label {
    font-size: 28rpx;
    color: $text-secondary;
  }

  .info-value {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    font-variant-numeric: tabular-nums;
  }

  .info-free {
    color: $success;
  }

  .info-gold {
    color: $accent-dark;
  }

  .info-highlight {
    font-family: $asset-balance-font;
    font-size: 34rpx;
    color: $mineral-gray;
    font-weight: 700;
  }

  &--highlight {
    padding-top: 16rpx;
    border-top: 1rpx solid $border-light;
  }
}

.remark-section {
  margin: 0 $spacing-base $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;

  .remark-label {
    font-size: 26rpx;
    font-weight: 600;
    color: $text-primary;
    display: block;
    margin-bottom: 12rpx;
  }

  .remark-input {
    width: 100%;
    font-size: 28rpx;
    color: $text-primary;
  }

  .remark-placeholder {
    font-size: 26rpx;
    color: $text-muted;
  }
}

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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1rpx solid rgba(20, 20, 20, 0.06);
  box-shadow: 0 -8rpx 32rpx rgba(47, 53, 66, 0.06);

  &__total {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4rpx;
    flex: 1;
  }

  &__submit {
    height: 88rpx;
    padding: 0 48rpx;
    background: $btn-gold-gradient;
    border-radius: $radius-full;
    box-shadow: $btn-gold-shadow;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:active:not(.disabled) {
      transform: scale(0.97);
      box-shadow: $btn-gold-shadow-active;
    }

    &.disabled {
      background: $btn-disabled-bg;
      box-shadow: none;
      pointer-events: none;
    }

    .btn-text {
      font-size: 30rpx;
      font-weight: 700;
      color: #fff;
      letter-spacing: 1rpx;
    }
  }
}

.total-label {
  font-size: 22rpx;
  color: $text-muted;
}

.total-amount {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
}

.total-cash {
  font-family: $asset-balance-font;
  font-size: 36rpx;
  font-weight: 700;
  color: $mineral-gray;
  font-variant-numeric: tabular-nums;
}

.total-points {
  font-family: $asset-balance-font;
  font-size: 36rpx;
  font-weight: 700;
  color: $accent-dark;
  font-variant-numeric: tabular-nums;
}

.total-pts {
  font-size: 24rpx;
  color: $accent-dark;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx;
  gap: 20rpx;

  .loading-spinner {
    width: 64rpx;
    height: 64rpx;
    border: 4rpx solid rgba(184, 152, 118, 0.2);
    border-top-color: $accent-dark;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  text {
    font-size: 28rpx;
    color: $text-muted;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 40rpx;
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

  &__text {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 40rpx;
  }

  &__btn {
    height: 80rpx;
    padding: 0 56rpx;
    background: $btn-gold-gradient;
    border-radius: $radius-full;
    box-shadow: $btn-gold-shadow;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      font-size: 30rpx;
      font-weight: 700;
      color: #fff;
      letter-spacing: 1rpx;
    }
  }
}
</style>