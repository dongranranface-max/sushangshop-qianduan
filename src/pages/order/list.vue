<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 顶部导航 -->
    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">我的订单</text>
    </view>

    <!-- Tab 切换 -->
    <view class="mall-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="mall-tab"
        :class="{ active: currentTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <text class="mall-tab__label">{{ tab.label }}</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view class="order-scroll" scroll-y @scrolltolower="loadMore">
      <!-- 骨架屏 -->
      <view v-if="loading && !orders.length" class="order-list">
        <view v-for="i in 3" :key="i" class="sk-card">
          <view class="sk-head shimmer" />
          <view class="sk-items">
            <view class="sk-product shimmer" />
          </view>
          <view class="sk-foot shimmer" />
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!orders.length" class="empty-state">
        <view class="empty-state__icon">单</view>
        <text class="empty-state__text">暂无订单</text>
        <text class="empty-state__sub">去商城发现好物吧</text>
        <view class="empty-state__btn" @click="goCatalog"><text>去逛逛</text></view>
      </view>

      <!-- 订单卡片 -->
      <view v-else class="order-list">
        <view v-for="order in orders" :key="order.orderNo" class="order-card">
          <!-- 订单头 -->
          <view class="order-card__head">
            <text class="order-card__type">{{ typeName(order.orderType) }}</text>
            <text class="order-card__status" :class="`status--${order.status}`">
              {{ statusName(order.status) }}
            </text>
          </view>

          <!-- 商品项 -->
          <view
            v-for="item in (order.items || []).slice(0, 2)"
            :key="item.productId || item.id"
            class="order-item"
            @click="goDetail(order)"
          >
            <image class="order-item__img" :src="item.coverImage || item.image" mode="aspectFill" />
            <view class="order-item__info">
              <text class="order-item__name">{{ item.productName || item.name }}</text>
              <text class="order-item__spec">{{ item.specs || item.skuInfo }} ×{{ item.quantity }}</text>
            </view>
            <text class="order-item__price">
              {{ order.orderType === 3 ? `${item.points || 0}积分` : `¥${item.price}` }}
            </text>
          </view>

          <view v-if="(order.items || []).length > 2" class="order-more">
            <text>查看全部 {{ order.items.length }} 件商品 ›</text>
          </view>

          <!-- 订单脚 -->
          <view class="order-card__foot">
            <view class="order-card__summary">
              <template v-if="order.orderType === 3">
                <text class="order-total">{{ order.totalPoints }}积分</text>
              </template>
              <template v-else>
                <text class="order-total">¥{{ order.totalAmount }}</text>
                <text v-if="order.totalPoints > 0" class="order-points">+{{ order.totalPoints }}积分</text>
              </template>
            </view>
            <view class="order-card__actions">
              <template v-if="order.status === 1">
                <view class="action-btn action-btn--outline" @click.stop="cancelOrder(order)">取消</view>
                <view class="action-btn" @click.stop="payOrder(order)">去付款</view>
              </template>
              <template v-else-if="order.status === 3">
                <view class="action-btn" @click.stop="confirmReceive(order)">确认收货</view>
              </template>
              <template v-else-if="order.status === 4">
                <view class="action-btn" @click.stop="goDetail(order)">查看详情</view>
              </template>
            </view>
          </view>
        </view>
      </view>

      <view v-if="hasMore && !loading" class="load-more" @click="loadMore">
        <text>加载更多</text>
      </view>
      <view v-if="!hasMore && orders.length > 0" class="no-more">
        <text>— 没有更多了 —</text>
      </view>
    </scroll-view>

    <view class="safe-area-bottom" />

    <LuxuryTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { orderApi } from '@/utils/api'
import { checkAuth } from '@/utils/auth'
import LuxuryTabbar from '@/components/LuxuryTabbar.vue'

const statusBarHeight = ref(20)
const loggedIn = ref(checkAuth())
const currentTab = ref('0')
const orders = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const limit = 20
const hasMore = ref(true)

const tabs = [
  { key: '0', label: '全部' },
  { key: '1', label: '待付款' },
  { key: '2', label: '待发货' },
  { key: '3', label: '待收货' },
  { key: '4', label: '已完成' },
]

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
})

onShow(() => {
  loggedIn.value = checkAuth()
  loadFromQuery()
})

function loadFromQuery() {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as any
  const tab = current?.options?.tab
  if (tab) {
    currentTab.value = String(tab)
  }
  if (loggedIn.value) loadOrders(true)
}

async function loadOrders(reset = false) {
  if (loading.value) return
  if (reset) { page.value = 1; hasMore.value = true }
  if (!hasMore.value) return
  loading.value = true
  try {
    const status = currentTab.value === '0' ? undefined : Number(currentTab.value)
    const res = await orderApi.list({ page: page.value, limit, status })
    const list = res.list || []
    if (reset) orders.value = list
    else orders.value.push(...list)
    hasMore.value = list.length === limit
    page.value++
  } catch {
    if (reset) orders.value = []
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (hasMore.value && !loading.value) loadOrders(false)
}

function switchTab(key: string) {
  if (currentTab.value === key) return
  currentTab.value = key
  loadOrders(true)
}

function typeName(type: number) {
  return type === 1 ? '消费订单' : type === 2 ? '换购订单' : '兑换订单'
}

function statusName(status: number) {
  const map: Record<number, string> = {
    1: '待付款', 2: '待发货', 3: '待收货', 4: '已完成', 5: '已取消',
  }
  return map[status] || '未知'
}

function goBack() { uni.navigateBack() }
function goCatalog() { uni.switchTab({ url: '/pages/index/index' }) }
function goDetail(order: any) { uni.navigateTo({ url: `/pages/order/detail?orderNo=${order.orderNo}` }) }

async function cancelOrder(order: any) {
  uni.showModal({
    title: '确认取消',
    content: '确定取消该订单吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await orderApi.cancel(order.orderNo)
        uni.showToast({ title: '已取消', icon: 'success' })
        loadOrders(true)
      } catch (e: any) {
        uni.showToast({ title: e.message || '取消失败', icon: 'none' })
      }
    },
  })
}

async function payOrder(order: any) {
  try {
    await orderApi.pay(order.orderNo)
    uni.showToast({ title: '付款成功', icon: 'success' })
    loadOrders(true)
  } catch (e: any) {
    uni.showToast({ title: e.message || '付款失败', icon: 'none' })
  }
}

async function confirmReceive(order: any) {
  uni.showModal({
    title: '确认收货',
    content: '确认已收到商品吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await orderApi.confirmReceive(order.orderNo)
        uni.showToast({ title: '已确认收货', icon: 'success' })
        loadOrders(true)
      } catch (e: any) {
        uni.showToast({ title: e.message || '操作失败', icon: 'none' })
      }
    },
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  @include page-bg;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.status-bar { width: 100%; }

.page-nav {
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

// ========== 商城 Tab ==========
.mall-tabs {
  display: flex;
  padding: 0 $spacing-base $spacing-base;
  gap: 8rpx;
}

.mall-tab {
  flex: 1;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1rpx solid rgba(20, 20, 20, 0.06);
  border-radius: $radius-lg;
  transition: all 0.25s ease;

  &.active {
    background: $warm-yellow;
    border-color: $border-primary;
    box-shadow: $shadow-gold;

    .mall-tab__label { color: $accent-dark; font-weight: 700; }
  }

  &__label {
    font-size: 26rpx;
    font-weight: 500;
    color: $text-muted;
  }
}

// ========== 订单列表 ==========
.order-scroll {
  height: calc(100vh - 300rpx);
  padding: 0 $spacing-base;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-base;
}

.sk-card {
  background: rgba(255, 255, 255, 0.7);
  border-radius: $radius-xl;
  overflow: hidden;

  .sk-head { height: 80rpx; background: $bg-tertiary; }
  .sk-items { padding: $spacing-base; }
  .sk-product { height: 140rpx; background: $bg-tertiary; border-radius: $radius-md; }
  .sk-foot { height: 80rpx; background: $bg-tertiary; }
}

.shimmer { animation: shim 1.4s ease-in-out infinite; }

@keyframes shim {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.7; }
}

.order-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;
  overflow: hidden;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx $spacing-base;
    border-bottom: 1rpx solid $border-light;
  }

  &__type { font-size: 26rpx; font-weight: 600; color: $text-secondary; }

  &__status {
    font-size: 26rpx;
    font-weight: 600;

    &.status--1 { color: $warning; }
    &.status--2 { color: $accent-dark; }
    &.status--3 { color: $primary; }
    &.status--4 { color: $success; }
    &.status--5 { color: $text-muted; }
  }

  &__foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx $spacing-base;
    border-top: 1rpx solid $border-light;
  }

  &__summary {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
  }
}

.order-item {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: $spacing-base;
  border-bottom: 1rpx solid $border-light;
  transition: background 0.2s ease;

  &:active { background: rgba(47, 53, 66, 0.02); }

  &__img {
    width: 120rpx;
    height: 120rpx;
    border-radius: $radius-md;
    background: $bg-tertiary;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 6rpx;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    line-height: 1.4;
  }

  &__spec {
    display: block;
    font-size: 22rpx;
    color: $text-muted;
    margin-bottom: 4rpx;
  }

  &__price {
    font-family: $asset-balance-font;
    font-size: 28rpx;
    font-weight: 700;
    color: $mineral-gray;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }
}

.order-more {
  padding: 16rpx $spacing-base;
  text-align: center;
  font-size: 24rpx;
  color: $text-muted;
  border-bottom: 1rpx solid $border-light;
}

.order-total {
  font-family: $asset-balance-font;
  font-size: 30rpx;
  font-weight: 700;
  color: $mineral-gray;
  font-variant-numeric: tabular-nums;
}

.order-points {
  font-size: 22rpx;
  color: $accent-dark;
  font-weight: 600;
}

.order-card__actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  height: 60rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $btn-gold-gradient;
  border-radius: $radius-full;
  box-shadow: $btn-gold-shadow;
  font-size: 26rpx;
  font-weight: 600;
  color: #fff;
  transition: transform 0.15s ease;

  &:active { transform: scale(0.97); }

  &--outline {
    background: rgba(255, 255, 255, 0.95);
    border: 1rpx solid rgba(20, 20, 20, 0.12);
    color: $text-secondary;
    box-shadow: none;
  }
}

.load-more,
.no-more {
  text-align: center;
  padding: $spacing-base 0;
  font-size: 26rpx;
  color: $text-muted;
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
    margin-bottom: 12rpx;
  }

  &__sub {
    font-size: 26rpx;
    color: $text-muted;
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
