<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 顶部导航 -->
    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">订单详情</text>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-wrap">
      <view class="loading-spinner" />
      <text class="loading-text">加载中...</text>
    </view>

    <template v-else-if="order.orderNo">
      <scroll-view class="detail-scroll" scroll-y>

        <!-- ========== 订单状态卡片 ========== -->
        <view class="status-card">
          <view class="status-card__icon">
            <text>{{ statusIcon }}</text>
          </view>
          <view class="status-card__info">
            <text class="status-card__name">{{ statusName }}</text>
            <text v-if="order.status === 1 && order.expireAt" class="status-card__sub">
              请在 {{ expireText }} 内完成支付
            </text>
          </view>
        </view>

        <!-- ========== 收货地址 ========== -->
        <view v-if="order.address" class="address-card">
          <view class="address-card__icon">📍</view>
          <view class="address-card__info">
            <view class="address-card__user">
              <text class="address-card__name">{{ order.address.consignee }}</text>
              <text class="address-card__phone">{{ order.address.phone }}</text>
            </view>
            <text class="address-card__addr">
              {{ order.address.province }}{{ order.address.city }}{{ order.address.district }}{{ order.address.detail }}
            </text>
          </view>
        </view>

        <!-- ========== 商品列表 ========== -->
        <view class="section-card">
          <view class="section-card__head">
            <text class="section-card__title">{{ typeName(order.orderType) }}</text>
            <text class="section-card__no">订单号 {{ order.orderNo }}</text>
          </view>

          <view
            v-for="item in order.items"
            :key="item.productId"
            class="order-item"
            @click="goProduct(item)"
          >
            <image class="order-item__img" :src="item.coverImage || '/static/logo.png'" mode="aspectFill" />
            <view class="order-item__info">
              <text class="order-item__name">{{ item.productName }}</text>
              <text class="order-item__spec">{{ item.specs || '默认规格' }} ×{{ item.quantity }}</text>
            </view>
            <text class="order-item__price">
              {{ order.orderType === 3 ? `${item.points || 0}积分` : `¥${item.price}` }}
            </text>
          </view>
        </view>

        <!-- ========== 物流信息 ========== -->
        <view v-if="order.logistics" class="section-card">
          <view class="section-card__head">
            <text class="section-card__title">物流信息</text>
          </view>
          <view class="logistics-info">
            <view class="logistics-row">
              <text class="logistics-company">{{ order.logistics.company }}</text>
              <text class="logistics-no">{{ order.logistics.trackingNo }}</text>
            </view>
            <view v-if="order.logistics.traces?.length" class="logistics-traces">
              <view
                v-for="(trace, i) in order.logistics.traces.slice(0, 3)"
                :key="i"
                class="trace-item"
              >
                <view class="trace-dot" />
                <text class="trace-desc">{{ trace.desc }}</text>
                <text class="trace-time">{{ trace.time }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- ========== 订单摘要 ========== -->
        <view class="section-card summary-card">
          <view class="summary-row">
            <text class="summary-label">商品总额</text>
            <text class="summary-value">¥{{ order.totalAmount }}</text>
          </view>
          <view v-if="Number(order.freightAmount) > 0" class="summary-row">
            <text class="summary-label">运费</text>
            <text class="summary-value">¥{{ order.freightAmount }}</text>
          </view>
          <view v-if="Number(order.discountAmount) > 0" class="summary-row">
            <text class="summary-label">优惠减免</text>
            <text class="summary-value summary-discount">-¥{{ order.discountAmount }}</text>
          </view>
          <view v-if="Number(order.totalPoints) > 0" class="summary-row">
            <text class="summary-label">积分抵扣</text>
            <text class="summary-value">{{ order.totalPoints }}积分</text>
          </view>
          <view class="summary-row summary-row--highlight">
            <text class="summary-label">实付金额</text>
            <text class="summary-value summary-pay">
              {{ order.orderType === 3 ? `${order.totalPoints}积分` : `¥${order.payAmount}` }}
            </text>
          </view>
          <view v-if="Number(order.pointsEarned) > 0" class="summary-row">
            <text class="summary-label">预计可得积分</text>
            <text class="summary-value summary-gold">+{{ order.pointsEarned }}积分</text>
          </view>
        </view>

        <!-- ========== 订单信息 ========== -->
        <view class="section-card info-card">
          <view class="info-row">
            <text class="info-label">下单时间</text>
            <text class="info-value">{{ order.createdAt }}</text>
          </view>
          <view v-if="order.expireAt" class="info-row">
            <text class="info-label">支付期限</text>
            <text class="info-value">{{ order.expireAt }}</text>
          </view>
          <view v-if="order.remark" class="info-row">
            <text class="info-label">订单备注</text>
            <text class="info-value">{{ order.remark }}</text>
          </view>
        </view>

        <view class="scroll-bottom" />
      </scroll-view>

      <!-- ========== 底部操作栏 ========== -->
      <view v-if="order.status === 1" class="bottom-bar">
        <view class="bottom-bar__cancel" @click="cancelOrder">
          <text>取消订单</text>
        </view>
        <view class="bottom-bar__pay" @click="doPay">
          <text>立即支付</text>
        </view>
      </view>
      <view v-else-if="order.status === 3" class="bottom-bar">
        <view class="bottom-bar__confirm" @click="confirmReceive">
          <text>确认收货</text>
        </view>
      </view>
    </template>

    <!-- 加载失败 -->
    <view v-else-if="!loading" class="empty-state">
      <view class="empty-state__icon">📦</view>
      <text class="empty-state__text">订单不存在</text>
      <view class="empty-state__btn" @click="goBack">
        <text>返回</text>
      </view>
    </view>

    <LuxuryTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { orderApi } from '@/utils/api'
import LuxuryTabbar from '@/components/LuxuryTabbar.vue'

interface OrderItem {
  productId: string; productName: string; coverImage: string
  specs: string; quantity: number; price: string; points: string
}
interface OrderAddress {
  consignee: string; phone: string
  province: string; city: string; district: string; detail: string
}
interface LogisticsTrace { time: string; desc: string }
interface Logistics { company: string; trackingNo: string; status: string; traces: LogisticsTrace[] }
interface OrderDetail {
  orderNo: string; orderType: number; status: number; createdAt: string
  totalAmount: string; totalPoints: string; freightAmount: string
  discountAmount: string; payAmount: string; pointsEarned: string
  remark: string; qrCode: string; expireAt: string
  address: OrderAddress; items: OrderItem[]; logistics?: Logistics
}

const statusBarHeight = ref(20)
const loading = ref(false)
const order = ref<Partial<OrderDetail>>({})

const statusMap: Record<number, { name: string; icon: string }> = {
  1: { name: '待付款', icon: '⏱' },
  2: { name: '待发货', icon: '📦' },
  3: { name: '待收货', icon: '🚚' },
  4: { name: '已完成', icon: '✅' },
  5: { name: '已取消', icon: '✕' },
}

const statusName = computed(() => statusMap[order.value.status ?? 0]?.name ?? '未知')
const statusIcon = computed(() => statusMap[order.value.status ?? 0]?.icon ?? '?')

const expireText = computed(() => {
  if (!order.value.expireAt) return ''
  try {
    const diff = new Date(order.value.expireAt).getTime() - Date.now()
    if (diff <= 0) return '已过期'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`
  } catch { return '' }
})

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  loadDetail()
})

function loadDetail() {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as { options?: { orderNo?: string } }
  const orderNo = current?.options?.orderNo
  if (!orderNo) return
  loading.value = true
  orderApi.getDetail(orderNo)
    .then((res) => { order.value = res as OrderDetail })
    .catch(() => { order.value = {} })
    .finally(() => { loading.value = false })
}

function typeName(type: number) {
  return type === 1 ? '消费订单' : type === 2 ? '换购订单' : '兑换订单'
}

function goBack() { uni.navigateBack() }
function goProduct(item: OrderItem) {
  if (item.productId) uni.navigateTo({ url: `/pages/product/detail?id=${item.productId}&type=1` })
}

async function cancelOrder() {
  const res = await uni.showModal({ title: '确认取消', content: '确定取消该订单吗？', confirmText: '确定' })
  if (!res.confirm) return
  try {
    await orderApi.cancel(order.value.orderNo!)
    uni.showToast({ title: '已取消', icon: 'success' })
    loadDetail()
  } catch (err: { message?: string }) {
    uni.showToast({ title: err?.message || '操作失败', icon: 'none' })
  }
}

async function doPay() {
  try {
    await orderApi.pay(order.value.orderNo!)
    uni.showToast({ title: '支付成功', icon: 'success' })
    loadDetail()
  } catch (err: { message?: string }) {
    uni.showToast({ title: err?.message || '支付失败', icon: 'none' })
  }
}

async function confirmReceive() {
  const res = await uni.showModal({ title: '确认收货', content: '确认已收到商品吗？', confirmText: '确认' })
  if (!res.confirm) return
  try {
    await orderApi.confirm(order.value.orderNo!)
    uni.showToast({ title: '已确认收货', icon: 'success' })
    loadDetail()
  } catch (err: { message?: string }) {
    uni.showToast({ title: err?.message || '操作失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  @include page-bg;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}
.status-bar { width: 100%; }

// ========== 导航 ==========
.page-nav {
  display: flex; align-items: center; gap: 16rpx; padding: 12rpx $spacing-base;
  background: rgba(249,249,249,0.88); backdrop-filter: blur(16px);
  border-bottom: 1rpx solid rgba(20,20,20,0.04);
  &__back {
    width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.9); backdrop-filter: blur(12px);
    border: 1rpx solid rgba(20,20,20,0.06); border-radius: 50%;
    font-size: 28rpx; color: $mineral-gray; flex-shrink: 0;
    &:active { opacity: 0.7; transform: scale(0.95); }
  }
  &__title { flex: 1; font-size: 32rpx; font-weight: 700; color: $mineral-gray; text-align: center; }
}

// ========== 加载 ==========
.loading-wrap {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 160rpx 0; gap: 20rpx;
}
.loading-spinner {
  width: 64rpx; height: 64rpx; border: 4rpx solid rgba(184,152,118,0.2);
  border-top-color: $accent; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 26rpx; color: $text-muted; }

// ========== 滚动区 ==========
.detail-scroll { height: calc(100vh - 200rpx); }

// ========== 订单状态卡片 ==========
.status-card {
  display: flex; align-items: center; gap: 24rpx;
  margin: $spacing-base $spacing-base 0;
  padding: 32rpx; background: $mineral-gray;
  border-radius: $radius-xl; box-shadow: $shadow-glow;
  &__icon { font-size: 56rpx; flex-shrink: 0; }
  &__info { display: flex; flex-direction: column; gap: 8rpx; }
  &__name { font-size: 36rpx; font-weight: 700; color: #fff; }
  &__sub { font-size: 22rpx; color: rgba(255,255,255,0.6); }
}

// ========== 地址卡片 ==========
.address-card {
  display: flex; align-items: flex-start; gap: 16rpx;
  margin: $spacing-base $spacing-base 0;
  padding: 24rpx; background: #fff; border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  &__icon { font-size: 36rpx; flex-shrink: 0; margin-top: 4rpx; }
  &__info { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
  &__user { display: flex; align-items: center; gap: 16rpx; }
  &__name { font-size: 28rpx; font-weight: 700; color: $text-primary; }
  &__phone { font-size: 26rpx; color: $text-secondary; }
  &__addr { font-size: 26rpx; color: $text-secondary; line-height: 1.5; }
}

// ========== 商品列表 ==========
.section-card {
  margin: $spacing-base $spacing-base 0;
  background: #fff; border-radius: $radius-lg; box-shadow: $clay-shadow; overflow: hidden;
  &__head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20rpx $spacing-base; border-bottom: 1rpx solid $border-light;
  }
  &__title { font-size: 28rpx; font-weight: 700; color: $text-primary; }
  &__no { font-size: 20rpx; color: $text-muted; }
}
.order-item {
  display: flex; align-items: center; gap: 16rpx;
  padding: 20rpx $spacing-base; border-bottom: 1rpx solid $border-light;
  &:last-child { border-bottom: none; }
  &:active { background: $bg-tertiary; }
  &__img { width: 120rpx; height: 120rpx; border-radius: $radius-md; flex-shrink: 0; object-fit: cover; }
  &__info { flex: 1; display: flex; flex-direction: column; gap: 8rpx; overflow: hidden; }
  &__name { font-size: 26rpx; font-weight: 600; color: $text-primary; @include line-clamp(2); }
  &__spec { font-size: 22rpx; color: $text-muted; }
  &__price { font-size: 26rpx; font-weight: 700; color: $text-primary; flex-shrink: 0; }
}

// ========== 物流 ==========
.logistics-info { padding: 16rpx $spacing-base 20rpx; }
.logistics-row { display: flex; flex-direction: column; gap: 6rpx; margin-bottom: 16rpx; }
.logistics-company { font-size: 26rpx; font-weight: 700; color: $text-primary; }
.logistics-no { font-size: 22rpx; color: $text-muted; font-family: monospace; }
.logistics-traces { display: flex; flex-direction: column; gap: 12rpx; }
.trace-item { display: flex; align-items: flex-start; gap: 12rpx; }
.trace-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: $accent; flex-shrink: 0; margin-top: 6rpx; }
.trace-desc { flex: 1; font-size: 24rpx; color: $text-secondary; line-height: 1.5; }
.trace-time { font-size: 20rpx; color: $text-muted; flex-shrink: 0; }

// ========== 订单摘要 ==========
.summary-card { padding: 8rpx 0; }
.summary-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16rpx $spacing-base;
  &--highlight { border-top: 1rpx solid $border-light; margin-top: 8rpx; padding-top: 20rpx; }
}
.summary-label { font-size: 26rpx; color: $text-secondary; }
.summary-value { font-size: 26rpx; color: $text-primary; font-weight: 600; }
.summary-discount { color: $success; }
.summary-pay { font-size: 36rpx; font-weight: 800; color: $accent-dark; }
.summary-gold { color: $accent-dark; font-weight: 700; }

// ========== 订单信息 ==========
.info-card { padding: 4rpx 0; }
.info-row {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 14rpx $spacing-base;
}
.info-label { font-size: 24rpx; color: $text-muted; flex-shrink: 0; width: 140rpx; }
.info-value { font-size: 24rpx; color: $text-secondary; text-align: right; flex: 1; }

// ========== 底部操作栏 ==========
.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  display: flex; gap: 16rpx; padding: 16rpx $spacing-base;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255,255,255,0.96); backdrop-filter: blur(20px);
  border-top: 1rpx solid $border-light;
  view { flex: 1; height: 88rpx; display: flex; align-items: center; justify-content: center; border-radius: $radius-full; font-size: 30rpx; font-weight: 700; }
  &__cancel { background: $bg-tertiary; color: $text-secondary; border: 1rpx solid $border-color; }
  &__pay { background: $accent-gradient; color: #fff; box-shadow: $btn-gold-shadow; }
  &__confirm { background: $accent-gradient; color: #fff; box-shadow: $btn-gold-shadow; }
  view:active { opacity: 0.85; transform: scale(0.98); }
}

.scroll-bottom { height: 180rpx; }
</style>
