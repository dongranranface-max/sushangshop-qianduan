<template>
  <view class="page-container">
    <AssetStatusBar v-if="loggedIn" />
    <view v-else class="safe-area-top" :style="{ height: statusBarHeight + 'px' }" />

    <view class="page-header">
      <text class="page-header__title">我的订单</text>
    </view>

    <view class="status-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="status-tabs__item"
        :class="{ active: currentTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <scroll-view class="order-scroll" scroll-y @scrolltolower="loadMore">
      <view v-for="order in orders" :key="order.orderNo" class="order-card glass-card">
        <view class="order-card__head">
          <text class="order-card__type">{{ typeName(order.orderType) }}</text>
          <text class="order-card__status" :class="'s' + order.status">{{ statusName(order.status) }}</text>
        </view>
        <text class="order-card__no">{{ order.orderNo }}</text>

        <view v-for="item in order.items || []" :key="item.productName" class="order-item">
          <image class="order-item__img" :src="item.coverImage" mode="aspectFill" />
          <view class="order-item__info">
            <text class="order-item__name">{{ item.productName }}</text>
            <text class="order-item__spec">{{ item.specs }} ×{{ item.quantity }}</text>
          </view>
          <text class="order-item__price">¥{{ item.price }}</text>
        </view>

        <view class="order-card__foot">
          <text class="order-card__time">{{ formatTime(order.createdAt) }}</text>
          <text class="order-card__amount">
            {{ order.orderType === 3 ? `${order.pointsEarned || 0} 积分` : `¥${order.payAmount}` }}
          </text>
        </view>

        <view v-if="order.pointsEarned && order.status >= 2" class="order-card__reward">
          预计/已得生态积分 {{ order.pointsEarned }}
        </view>

        <view class="order-card__actions">
          <view v-if="order.status === 1" class="btn-sm btn-fire" @click="cancelOrder(order)">取消</view>
          <view v-if="order.status === 1" class="btn-sm btn-primary" @click="payOrder(order)">去支付</view>
          <view v-if="order.status === 3" class="btn-sm btn-primary" @click="confirmOrder(order)">确认收货</view>
          <view v-if="order.status === 4" class="btn-sm btn-outline" @click="applyRefund(order)">申请退款</view>
        </view>
      </view>

      <view v-if="loading" class="hint">加载中...</view>
      <view v-if="!loading && !orders.length" class="empty">
        <text class="empty__icon">📦</text>
        <text class="empty__text">暂无订单</text>
        <view class="btn-primary btn-sm" @click="goHome">去逛逛</view>
      </view>
    </scroll-view>

    <view class="safe-area-bottom" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { orderApi } from '@/utils/api'
import { checkAuth, requireAuth } from '@/utils/auth'
import { OrderStatusName, MallTypeName } from '@/constants/mall'
import { assetStore } from '@/store/asset'
import AssetStatusBar from '@/components/AssetStatusBar.vue'

const statusBarHeight = ref(20)
const loggedIn = ref(checkAuth())
const currentTab = ref('all')
const orders = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

const tabs = [
  { key: 'all', label: '全部' },
  { key: '1', label: '待付款' },
  { key: '2', label: '待发货' },
  { key: '3', label: '待收货' },
  { key: '4', label: '已完成' },
]

function statusName(s: number) {
  return OrderStatusName[s] || '未知'
}
function typeName(t: number) {
  return MallTypeName[t] || '订单'
}
function formatTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  if (!requireAuth()) return
  applyStatusFromStorage()
  loadOrders()
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (!loggedIn.value) return
  assetStore.fetchBalance()
  applyStatusFromStorage()
  orders.value = []
  page.value = 1
  hasMore.value = true
  loadOrders()
})

function applyStatusFromStorage() {
  const s = uni.getStorageSync('orderListStatus')
  if (s) {
    currentTab.value = String(s)
    uni.removeStorageSync('orderListStatus')
  }
}

async function loadOrders() {
  if (loading.value || !checkAuth()) return
  loading.value = true
  try {
    const params: Record<string, number> = { page: page.value, limit: 20 }
    if (currentTab.value !== 'all') params.status = Number(currentTab.value)
    const res = await orderApi.getList(params)
    const list = res.list || []
    orders.value = page.value === 1 ? list : [...orders.value, ...list]
    hasMore.value = list.length >= 20
    page.value++
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function switchTab(key: string) {
  currentTab.value = key
  orders.value = []
  page.value = 1
  hasMore.value = true
  loadOrders()
}

function loadMore() {
  if (hasMore.value && !loading.value) loadOrders()
}

async function cancelOrder(order: any) {
  try {
    await orderApi.cancel(order.orderNo)
    uni.showToast({ title: '已取消', icon: 'success' })
    switchTab(currentTab.value)
  } catch (e: any) {
    uni.showToast({ title: e.message, icon: 'none' })
  }
}

async function confirmOrder(order: any) {
  try {
    await orderApi.confirm(order.orderNo)
    uni.showToast({ title: '已确认收货', icon: 'success' })
    assetStore.fetchBalance()
    switchTab(currentTab.value)
  } catch (e: any) {
    uni.showToast({ title: e.message, icon: 'none' })
  }
}

function payOrder(order: any) {
  if (order.qrCode) {
    uni.showToast({ title: '请使用微信扫码支付', icon: 'none' })
  } else {
    uni.showToast({ title: '等待支付渠道配置', icon: 'none' })
  }
}

async function applyRefund(order: any) {
  try {
    await orderApi.applyRefund(order.orderNo, { reason: 1, description: '用户申请退款' })
    uni.showToast({ title: '已提交退款申请', icon: 'success' })
    orders.value = []
    page.value = 1
    hasMore.value = true
    loadOrders()
  } catch (e: any) {
    uni.showToast({ title: e.message || '申请失败', icon: 'none' })
  }
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-header {
  padding: 16rpx $spacing-base 8rpx;
  &__title { font-size: 36rpx; font-weight: 800; color: $text-primary; }
}

.status-tabs {
  display: flex;
  padding: 0 $spacing-base 16rpx;
  gap: 8rpx;
  overflow-x: auto;
  &__item {
    flex-shrink: 0;
    padding: 12rpx 24rpx;
    font-size: 26rpx;
    color: $text-muted;
    border-radius: $radius-full;
    border: 1rpx solid transparent;
    &.active {
      color: $accent-dark;
      background: $warm-yellow;
      border-color: $border-primary;
    }
  }
}

.order-scroll {
  height: calc(100vh - 320rpx);
  padding: 0 $spacing-base;
}

.order-card {
  padding: $spacing-base;
  margin-bottom: $spacing-base;
  &__head { display: flex; justify-content: space-between; }
  &__type { font-size: 24rpx; color: $primary; font-weight: 600; }
  &__status { font-size: 26rpx; font-weight: 700; color: $accent-light; &.s4 { color: $text-muted; } }
  &__no { font-size: 22rpx; color: $text-muted; margin: 8rpx 0 16rpx; display: block; }
  &__foot { display: flex; justify-content: space-between; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid $border-light; }
  &__time { font-size: 22rpx; color: $text-muted; }
  &__amount { font-size: 32rpx; font-weight: 700; color: $primary-light; }
  &__reward { font-size: 22rpx; color: $success; margin-top: 8rpx; }
  &__actions { display: flex; justify-content: flex-end; gap: 12rpx; margin-top: 16rpx; }
}

.order-item {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  &__img { width: 120rpx; height: 120rpx; border-radius: 12rpx; background: $bg-tertiary; }
  &__info { flex: 1; margin-left: 16rpx; }
  &__name { font-size: 26rpx; color: $text-primary; @include line-clamp(2); }
  &__spec { font-size: 22rpx; color: $text-muted; }
  &__price { font-size: 28rpx; color: $text-primary; }
}

.hint, .empty { text-align: center; padding: 80rpx 0; color: $text-muted; }
.empty__icon { font-size: 100rpx; display: block; margin-bottom: 16rpx; }
.empty__text { display: block; margin-bottom: 24rpx; }
</style>
