<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 顶部导航 -->
    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">{{ modeLabel }}确认</text>
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
      <scroll-view class="confirm-scroll" scroll-y>
        <!-- ========== 收货地址 ========== -->
        <view class="address-card" @click="selectAddress">
          <view class="address-card__icon">址</view>
          <view class="address-card__content" v-if="address">
            <view class="address-card__top">
              <text class="address-name">{{ address.consignee }}</text>
              <text class="address-phone">{{ address.phone }}</text>
              <view v-if="address.isDefault" class="address-tag">默认</view>
            </view>
            <text class="address-detail">
              {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}
            </text>
          </view>
          <view class="address-card__empty" v-else>
            <text>请选择收货地址</text>
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
            <view v-if="estimatedEcoPoints" class="summary-row">
              <text class="summary-label">预计可得积分</text>
              <text class="summary-value summary-gold">+{{ estimatedEcoPoints }} 积分</text>
            </view>
          </template>

          <!-- 换购型 -->
          <template v-else-if="mode === 'exchange'">
            <view class="summary-row">
              <text class="summary-label">商品金额</text>
              <text class="summary-value">¥{{ goodsAmount }}</text>
            </view>
            <view class="summary-row">
              <text class="summary-label">运费</text>
              <text class="summary-value summary-free">免运费</text>
            </view>
            <view v-if="exchangePointsDeduct" class="summary-row">
              <text class="summary-label">生态积分抵扣</text>
              <text class="summary-value summary-gold">-{{ exchangePointsDeduct }} 积分</text>
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

        <!-- ========== 备注 ========== -->
        <view class="remark-card">
          <text class="remark-label">订单备注</text>
          <input
            class="remark-input"
            v-model="remark"
            placeholder="选填，可输入备注信息"
            placeholder-class="remark-placeholder"
          />
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
              <text class="total-cash">¥{{ actualAmount }}</text>
              <text v-if="mode === 'exchange' && totalPoints > 0" class="total-points">+{{ totalPoints }}积分</text>
            </template>
          </view>
        </view>
        <view
          class="bottom-bar__btn"
          :class="{ disabled: submitting }"
          @click="handleSubmit"
        >
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
const mode = ref<'consume' | 'exchange' | 'redeem'>('consume')

const goodsAmount = computed(() =>
  orderItems.value.reduce((s, i) => s + Number(i.price) * (i.quantity || 1), 0).toFixed(2)
)

const estimatedEcoPoints = computed(() =>
  orderItems.value.reduce((s, i) => s + ((i.ecoPoints || 0) * (i.quantity || 1)), 0)
)

const exchangePointsDeduct = computed(() => {
  const needed = orderItems.value.reduce(
    (s, i) => s + ((i.requiredPoints || 0) * (i.quantity || 1)), 0
  )
  return Math.min(needed, assetStore.ecoPoints)
})

const actualAmount = computed(() => {
  if (mode.value === 'exchange') return Number(goodsAmount.value).toFixed(2)
  return goodsAmount.value
})

const totalPoints = computed(() =>
  orderItems.value.reduce((s, i) => s + ((i.requiredPoints || 0) * (i.quantity || 1)), 0)
)

const modeLabel = computed(() =>
  mode.value === 'consume' ? '消费' : mode.value === 'exchange' ? '换购' : '兑换'
)

const modeName = computed(() =>
  mode.value === 'consume' ? '自营' : mode.value === 'exchange' ? '换购' : '兑换'
)

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (loggedIn.value) assetStore.fetchBalance()
  loadSelectedAddress()
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1] as any
    const options = current?.options || {}
    const { cartIds, productId, quantity } = options

    if (cartIds) {
      const res = await orderApi.previewFromCart(cartIds)
      orderItems.value = res.items || []
      mode.value = res.type === 3 ? 'redeem' : res.type === 2 ? 'exchange' : 'consume'
    } else if (productId) {
      const qty = Number(quantity || 1)
      const res = await orderApi.previewDirect(productId, qty)
      orderItems.value = [res].filter(Boolean)
      mode.value = res.type === 3 ? 'redeem' : res.type === 2 ? 'exchange' : 'consume'
    } else {
      const raw = uni.getStorageSync('pendingOrder')
      if (raw) orderItems.value = raw
    }
  } catch {
    orderItems.value = []
  } finally {
    loading.value = false
  }
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
    } else {
      loadAddress()
    }
  } catch {}
}

function selectAddress() {
  if (!requireAuth()) return
  uni.navigateTo({ url: '/pages/address/list' })
}

async function handleSubmit() {
  if (!requireAuth()) return
  if (!address.value) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1] as any
    const options = current?.options || {}
    const { cartIds, productId, quantity } = options

    const payload: any = {
      addressId: address.value.id,
      remark: remark.value,
    }
    if (cartIds) payload.cartIds = cartIds
    if (productId) { payload.productId = Number(productId); payload.quantity = Number(quantity || 1) }

    const res = await orderApi.create(payload)
    uni.redirectTo({ url: `/pages/order/list?tab=1` })
    uni.showToast({ title: '下单成功', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '下单失败', icon: 'none' })
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
  background: radial-gradient(ellipse 80% 60% at 50% 0%, #F9F9F9 0%, #F0EDE8 100%);
  display: flex;
  flex-direction: column;
}

.status-bar { width: 100%; }

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

  &__back {
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

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__top {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-bottom: 6rpx;
  }

  &__empty {
    flex: 1;
    font-size: 28rpx;
    color: $text-muted;
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
}
.address-detail { font-size: 26rpx; color: $text-muted; line-height: 1.5; display: block; }

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

  &__tags {
    display: flex;
    gap: 8rpx;
  }

  &__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__price {
    display: flex;
    align-items: baseline;
    gap: 4rpx;
  }

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
}

.summary-label { font-size: 26rpx; color: $text-muted; }
.summary-value { font-size: 28rpx; font-weight: 600; color: $text-primary; }
.summary-free { color: $success; }
.summary-gold { color: $accent-dark; }
.summary-highlight { font-size: 34rpx; font-weight: 700; color: $mineral-gray; font-family: $asset-balance-font; }

// ========== 备注 ==========
.remark-card {
  margin: 0 $spacing-base $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;
}

.remark-label { font-size: 26rpx; color: $text-muted; display: block; margin-bottom: 12rpx; }
.remark-input {
  width: 100%;
  font-size: 28rpx;
  color: $text-primary;
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
}
.remark-placeholder { color: $text-muted; font-size: 26rpx; }

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
    height: 84rpx;
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

.scroll-bottom { height: 160rpx; }
</style>
