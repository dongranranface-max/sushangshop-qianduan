<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">我的订单</text>
      <text class="nav-placeholder"></text>
    </view>

    <view class="mall-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: currentTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <scroll-view class="order-list" scroll-y @scrolltolower="loadMore">
      <view class="order-card" v-for="order in orders" :key="order.id">
        <view class="order-header">
          <text class="order-no">{{ order.orderNo }}</text>
          <text class="order-status" :class="'status-' + order.status">
            {{ getStatusText(order.status) }}
          </text>
        </view>

        <view class="order-items">
          <view class="order-item" v-for="item in order.items" :key="item.id">
            <image class="item-image" :src="item.coverImage" mode="aspectFill" />
            <view class="item-info">
              <text class="item-name">{{ item.productName }}</text>
              <text class="item-quantity">×{{ item.quantity }}</text>
            </view>
            <text class="item-price">¥{{ item.price }}</text>
          </view>
        </view>

        <view class="order-footer">
          <text class="order-time">{{ formatTime(order.createdAt) }}</text>
          <view class="order-amount">
            <text class="amount-label">{{ orderLabel(order) }}：</text>
            <text class="amount-value">
              <text v-if="order.orderType === 3">{{ order.consumerPointsConverted || 0 }}积分</text>
              <text v-else>¥{{ order.payAmount }}</text>
            </text>
          </view>
        </view>

        <view class="order-actions" @click.stop>
          <template v-if="order.status === 1">
            <view class="action-btn btn-pay" @click="payOrder(order)">去支付</view>
          </template>
          <template v-else-if="order.status === 2">
            <view class="action-btn btn-remind">等待发货</view>
          </template>
          <template v-else-if="order.status === 3">
            <view class="action-btn btn-confirm">确认收货</view>
          </template>
        </view>
      </view>

      <view v-if="loading" class="loading">加载中...</view>
      <view v-if="!loading && orders.length === 0" class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无订单</text>
      </view>
    </scroll-view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { orderApi } from '@/utils/api'

const statusBarHeight = ref(20)
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

const statusMap: Record<number, string> = {
  0: '已取消', 1: '待付款', 2: '已付款', 3: '已完成', 4: '已退款',
  // OrderStatus
}

function getStatusText(status: number) {
  const map: Record<number, string> = {
    0: '已取消', 1: '待付款', 2: '待发货', 3: '已完成', 4: '已退款',
  }
  return map[status] || '未知'
}

function orderLabel(order: any): string {
  const labels: Record<number, string> = { 1: '消费', 2: '换购', 3: '兑换' }
  return labels[order.orderType] || '合计'
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getUserId(): string {
  return uni.getStorageSync('userId') || ''
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  loadOrders()
})

async function loadOrders() {
  if (loading.value) return
  loading.value = true
  try {
    const userId = getUserId()
    const params: any = { page: page.value, limit: 20 }
    if (currentTab.value !== 'all') {
      params.status = Number(currentTab.value)
    }
    const res = await orderApi.getList(userId, params)
    if (page.value === 1) {
      orders.value = res.items || []
    } else {
      orders.value.push(...(res.items || []))
    }
    hasMore.value = res.items?.length === 20
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
  if (hasMore.value) loadOrders()
}

function goBack() { uni.navigateBack() }

async function payOrder(order: any) {
  uni.showLoading({ title: '支付中...' })
  try {
    await orderApi.paymentCallback(order.orderNo, 'wechat')
    uni.showToast({ title: '支付成功', icon: 'success' })
    setTimeout(() => switchTab('all'), 1500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '支付失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container { min-height: 100vh; background: $bg-primary; }

.nav-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16rpx 32rpx;
  .nav-back { font-size: 40rpx; color: #fff; }
  .nav-title { font-size: 34rpx; font-weight: 600; color: #fff; }
  .nav-placeholder { width: 60rpx; }
}

.mall-tabs {
  display: flex; padding: $spacing-base 32rpx; border-bottom: 1rpx solid $border-color;
  .tab-item { flex: 1; text-align: center; font-size: 28rpx; color: $text-secondary; padding: $spacing-sm 0; border-bottom: 4rpx solid transparent;
    &.active { color: $primary; border-bottom-color: $primary; }
  }
}

.order-list { height: calc(100vh - 200rpx); padding: $spacing-base $spacing-lg; }

.order-card {
  background: $bg-card; border-radius: $radius-md; padding: $spacing-base; margin-bottom: $spacing-base;

  .order-header { display: flex; justify-content: space-between; margin-bottom: $spacing-base;
    .order-no { font-size: 24rpx; color: $text-secondary; }
    .order-status { font-size: 26rpx; font-weight: 600; color: $primary;
      &.status-1 { color: $warning; }
      &.status-4 { color: $text-muted; }
    }
  }

  .order-items {
    .order-item { display: flex; align-items: center; padding: $spacing-xs 0;
      .item-image { width: 120rpx; height: 120rpx; border-radius: $radius-sm; }
      .item-info { flex: 1; margin-left: $spacing-sm;
        .item-name { font-size: 26rpx; color: $text-primary; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .item-quantity { font-size: 24rpx; color: $text-muted; }
      }
      .item-price { font-size: 28rpx; color: $text-primary; }
    }
  }

  .order-footer { display: flex; justify-content: space-between; align-items: center; padding: $spacing-base 0; border-top: 1rpx solid $border-light; margin-top: $spacing-xs;
    .order-time { font-size: 24rpx; color: $text-muted; }
    .order-amount { text-align: right;
      .amount-label { font-size: 24rpx; color: $text-secondary; }
      .amount-value { font-size: 32rpx; font-weight: 700; color: $primary; }
    }
  }

  .order-actions { display: flex; justify-content: flex-end; gap: $spacing-sm; padding-top: $spacing-base; border-top: 1rpx solid $border-light;
    .action-btn { padding: 12rpx 32rpx; border-radius: 50rpx; font-size: 26rpx;
      &.btn-pay { background: linear-gradient(135deg, $primary, darken($primary, 10%)); color: #0a0a0b; font-weight: 600; }
      &.btn-remind, &.btn-confirm { background: transparent; border: 1rpx solid $primary; color: $primary; }
    }
  }
}

.loading { text-align: center; padding: $spacing-base; color: $text-muted; font-size: 26rpx; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0;
  .empty-icon { font-size: 120rpx; margin-bottom: $spacing-base; }
  .empty-text { font-size: 28rpx; color: $text-secondary; }
}
</style>
