<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 导航栏 -->
    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">限时秒杀</text>
      <view class="page-nav__action" />
    </view>

    <!-- 秒杀状态横幅 -->
    <view class="flash-banner" :class="`flash-banner--${flashStatus}`">
      <view class="flash-banner__left">
        <text class="flash-banner__icon">⚡</text>
        <view class="flash-banner__text">
          <text class="flash-banner__title">{{ STATUS_CONFIG[flashStatus].title }}</text>
          <text class="flash-banner__sub">{{ STATUS_CONFIG[flashStatus].sub }}</text>
        </view>
      </view>
      <view class="flash-banner__countdown" v-if="flashStatus !== 'ended'">
        <text class="countdown-label">{{ flashStatus === 'upcoming' ? '距开始' : '距结束' }}</text>
        <view class="countdown-nums">
          <view class="countdown-unit"><text class="countdown-num">{{ String(countdown.d).padStart(2, '0') }}</text></view>
          <text class="countdown-sep">:</text>
          <view class="countdown-unit"><text class="countdown-num">{{ String(countdown.h).padStart(2, '0') }}</text></view>
          <text class="countdown-sep">:</text>
          <view class="countdown-unit"><text class="countdown-num">{{ String(countdown.m).padStart(2, '0') }}</text></view>
          <text class="countdown-sep">:</text>
          <view class="countdown-unit"><text class="countdown-num">{{ String(countdown.s).padStart(2, '0') }}</text></view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="flash-body" @scrolltolower="loadMore">
      <!-- 加载骨架屏 -->
      <view v-if="loading && !products.length" class="flash-grid">
        <view v-for="i in 6" :key="i" class="flash-card">
          <view class="sk-cover shimmer" />
          <view class="sk-info">
            <view class="sk-line shimmer" />
            <view class="sk-line shimmer" style="width:60%" />
          </view>
        </view>
      </view>

      <!-- 秒杀商品列表 -->
      <view v-else class="flash-grid">
        <view
          v-for="item in products"
          :key="item.id"
          class="flash-card"
          :class="{ 'flash-card--soldout': item.stock <= 0 }"
          @click="goDetail(item)"
        >
          <!-- 封面 -->
          <view class="flash-card__cover">
            <image class="flash-card__img" :src="item.coverImage || '/static/logo.png'" mode="aspectFill" lazy-load />
            <view class="flash-card__discount" v-if="item.discount"><text>{{ item.discount }}折</text></view>
            <view class="flash-card__stock-bar" v-if="item.totalStock">
              <view class="flash-card__stock-fill" :style="{ width: Math.max(0, Math.min(100, (item.stock / item.totalStock) * 100)) + '%' }" />
            </view>
          </view>

          <!-- 信息 -->
          <view class="flash-card__body">
            <text class="flash-card__name">{{ item.name }}</text>

            <!-- 价格行 -->
            <view class="flash-card__price-row">
              <text class="flash-card__price">¥{{ item.flashPrice || item.price }}</text>
              <text class="flash-card__orig" v-if="item.originalPrice">¥{{ item.originalPrice }}</text>
            </view>

            <!-- 库存 -->
            <view class="flash-card__stock-row" v-if="item.stock > 0">
              <text class="flash-card__stock-text">剩余 {{ item.stock }} 件</text>
              <view class="flash-card__buy-btn"><text>马上抢</text></view>
            </view>
            <view class="flash-card__soldout" v-else><text>已售罄</text></view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loading && products.length" class="load-more">
        <view class="loading-spinner" /><text>加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && !products.length" class="empty-state">
        <view class="empty-state__icon">秒</view>
        <text class="empty-state__text">暂无秒杀场次</text>
        <text class="empty-state__sub">更多秒杀即将开始</text>
      </view>

      <view v-if="!hasMore && products.length > 0" class="no-more"><text>— 没有更多了 —</text></view>

      <view class="bottom-placeholder" :style="{ height: (120 + safeAreaBottom) + 'px' }" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const loading = ref(false)
const products = ref<FlashProduct[]>([])
const page = ref(1)
const hasMore = ref(true)
const flashStatus = ref<'upcoming' | 'ongoing' | 'ended'>('ongoing')
const countdown = ref({ d: 0, h: 0, m: 0, s: 0 })
let countdownTimer: ReturnType<typeof setInterval> | null = null

const STATUS_CONFIG = {
  upcoming: { title: '即将开始', sub: '秒杀即将开始，敬请期待' },
  ongoing: { title: '秒杀进行中', sub: '限时限量，抢完即止' },
  ended: { title: '秒杀已结束', sub: '感谢参与，下次再来' },
}

interface FlashProduct {
  id: string
  name: string
  coverImage?: string
  price: string | number
  originalPrice?: string | number
  flashPrice?: string | number
  discount?: number
  stock: number
  totalStock?: number
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
  loadProducts()
  startCountdown()
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

function startCountdown() {
  // 模拟倒计时：距离秒杀结束还有 2小时 34分 12秒
  let totalSec = 2 * 3600 + 34 * 60 + 12
  countdownTimer = setInterval(() => {
    if (totalSec <= 0) {
      countdown.value = { d: 0, h: 0, m: 0, s: 0 }
      if (countdownTimer) clearInterval(countdownTimer)
      flashStatus.value = 'ended'
      return
    }
    totalSec--
    countdown.value = {
      d: Math.floor(totalSec / 86400),
      h: Math.floor((totalSec % 86400) / 3600),
      m: Math.floor((totalSec % 3600) / 60),
      s: totalSec % 60,
    }
  }, 1000)
  countdown.value = {
    d: Math.floor(totalSec / 86400),
    h: Math.floor((totalSec % 86400) / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  }
}

async function loadProducts() {
  if (loading.value) return
  if (!hasMore.value) return
  loading.value = true
  try {
    // TODO: 替换为真实 API: marketingApi.getFlashProducts()
    await new Promise(r => setTimeout(r, 500))
    const mock: FlashProduct[] = [
      { id: '1', name: '有机生态大米5kg装', coverImage: '/static/logo.png', price: 89, originalPrice: 158, flashPrice: 59, discount: 3.7, stock: 23, totalStock: 200 },
      { id: '2', name: '东北黑木耳干货礼盒', coverImage: '/static/logo.png', price: 68, originalPrice: 128, flashPrice: 38, discount: 3.0, stock: 45, totalStock: 150 },
      { id: '3', name: '农家土鸡蛋30枚', coverImage: '/static/logo.png', price: 55, originalPrice: 99, flashPrice: 39, discount: 3.9, stock: 8, totalStock: 100 },
      { id: '4', name: '纯正蜂蜜礼盒装500g', coverImage: '/static/logo.png', price: 128, originalPrice: 236, flashPrice: 88, discount: 3.7, stock: 0, totalStock: 80 },
      { id: '5', name: '有机糙米5kg', coverImage: '/static/logo.png', price: 76, originalPrice: 138, flashPrice: 49, discount: 3.6, stock: 67, totalStock: 200 },
      { id: '6', name: '手工红糖姜茶礼盒', coverImage: '/static/logo.png', price: 58, originalPrice: 108, flashPrice: 36, discount: 3.3, stock: 34, totalStock: 120 },
    ]
    if (page.value === 1) products.value = mock
    else products.value.push(...mock)
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (hasMore.value || loading.value) return
  page.value++
  loadProducts()
}

function goDetail(item: FlashProduct) {
  if (item.stock <= 0) return
  uni.navigateTo({ url: `/pages/product/detail?id=${item.id}&type=1` })
}

function goBack() { uni.navigateBack() }
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

$gap-4: 4rpx; $gap-8: 8rpx; $gap-16: 16rpx; $gap-24: 24rpx;

.page { min-height: 100vh; background: $bg-primary; display: flex; flex-direction: column; box-sizing: border-box; }
.status-bar { width: 100%; }

.page-nav {
  display: flex; align-items: center; gap: $gap-16; padding: 12rpx $gap-16;
  background: rgba(249,249,249,0.88); backdrop-filter: blur(16px); border-bottom: 1rpx solid rgba(20,20,20,0.04); box-sizing: border-box;
  &__back, &__action { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.88); backdrop-filter: blur(12px); border: 1rpx solid rgba(20,20,20,0.06); border-radius: 50%; font-size: 28rpx; color: $mineral-gray; flex-shrink: 0; box-sizing: border-box; }
  &__title { flex: 1; font-size: 32rpx; font-weight: 700; color: $mineral-gray; text-align: center; letter-spacing: 0.5rpx; }
}

// ========== 秒杀横幅 ==========
.flash-banner {
  display: flex; align-items: center; justify-content: space-between; gap: $gap-16;
  padding: $gap-16 $gap-24; margin: $gap-16; border-radius: $radius-lg; box-sizing: border-box;
  &--ongoing { background: linear-gradient(135deg, #c0392b 0%, #e74c3c 50%, #c0392b 100%); box-shadow: 0 8rpx 32rpx rgba(192,57,43,0.30); }
  &--upcoming { background: linear-gradient(135deg, #e67e22 0%, #f39c12 100%); box-shadow: 0 8rpx 32rpx rgba(243,156,18,0.25); }
  &--ended { background: linear-gradient(135deg, #7f8c8d 0%, #95a5a6 100%); box-shadow: 0 8rpx 32rpx rgba(127,140,141,0.20); }
  &__left { display: flex; align-items: center; gap: 12rpx; }
  &__icon { font-size: 44rpx; }
  &__text { display: flex; flex-direction: column; gap: 2rpx; }
  &__title { font-size: 32rpx; font-weight: 800; color: #fff; letter-spacing: 1rpx; }
  &__sub { font-size: 22rpx; color: rgba(255,255,255,0.75); }
  &__countdown { display: flex; flex-direction: column; align-items: flex-end; gap: 4rpx; }
}

.countdown-label { font-size: 20rpx; color: rgba(255,255,255,0.75); }
.countdown-nums { display: flex; align-items: center; gap: 4rpx; }
.countdown-unit { min-width: 48rpx; height: 48rpx; background: rgba(255,255,255,0.20); border-radius: 8rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
.countdown-num { font-family: $font-sans; font-size: 30rpx; font-weight: 800; color: #fff; font-variant-numeric: tabular-nums; }
.countdown-sep { font-size: 28rpx; color: rgba(255,255,255,0.60); font-weight: 700; }

// ========== 秒杀网格 ==========
.flash-body { flex: 1; }
.flash-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: $gap-16; padding: 0 $gap-16; }

.flash-card {
  background: rgba(255,255,255,0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255,255,255,0.60); border-radius: $radius-lg; box-shadow: $clay-shadow;
  overflow: hidden; transition: transform 0.2s ease; box-sizing: border-box;
  &:active { transform: scale(0.98); }
  &--soldout { opacity: 0.6; }
  &__cover { position: relative; width: 100%; aspect-ratio: 1; overflow: hidden; background: $bg-tertiary; }
  &__img { width: 100%; height: 100%; object-fit: cover; display: block; }
  &__discount { position: absolute; top: 0; right: 0; background: $danger; padding: 4rpx 12rpx; border-radius: 0 $radius-md 0 $radius-md;
    text { font-size: 20rpx; font-weight: 800; color: #fff; } }
  &__stock-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 6rpx; background: rgba(255,255,255,0.30); box-sizing: border-box; }
  &__stock-fill { height: 100%; background: linear-gradient(90deg, #e74c3c, #ff6b6b); transition: width 0.3s ease; }
  &__body { padding: $gap-16; display: flex; flex-direction: column; gap: 6rpx; }
  &__name { font-size: 26rpx; font-weight: 600; color: $text-primary; line-height: 1.4; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
  &__price-row { display: flex; align-items: baseline; gap: 8rpx; margin-top: 4rpx; }
  &__price { font-family: $font-sans; font-size: 34rpx; font-weight: 800; color: $danger; font-variant-numeric: tabular-nums; }
  &__orig { font-size: 22rpx; color: $text-muted; text-decoration: line-through; }
  &__stock-row { display: flex; align-items: center; justify-content: space-between; margin-top: 4rpx; }
  &__stock-text { font-size: 20rpx; color: $text-muted; }
  &__buy-btn { height: 56rpx; padding: 0 20rpx; background: $btn-gold-gradient; border-radius: $radius-full; box-shadow: 0 4rpx 12rpx rgba(184,152,118,0.35); display: flex; align-items: center; justify-content: center; box-sizing: border-box;
    text { font-size: 24rpx; font-weight: 700; color: #fff; } }
  &__soldout { height: 56rpx; background: rgba(20,20,20,0.08); border-radius: $radius-full; display: flex; align-items: center; justify-content: center; box-sizing: border-box;
    text { font-size: 24rpx; font-weight: 600; color: $text-muted; } }
}

// ========== 骨架屏 ==========
.flash-card .sk-cover { width: 100%; aspect-ratio: 1; background: $bg-tertiary; display: block; }
.flash-card .sk-info { padding: $gap-16; display: flex; flex-direction: column; gap: 10rpx; }
.flash-card .sk-line { height: 22rpx; border-radius: 8rpx; background: $bg-tertiary; }

// ========== 加载/空状态 ==========
.load-more { display: flex; flex-direction: column; align-items: center; gap: 12rpx; padding: $gap-24 0; font-size: 26rpx; color: $text-muted; }
.loading-spinner { width: 40rpx; height: 40rpx; border: 3rpx solid rgba(184,152,118,0.2); border-top-color: $accent-dark; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.no-more { text-align: center; padding: $gap-24 0; font-size: 24rpx; color: $text-muted; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 160rpx 40rpx; text-align: center;
  &__icon { width: 120rpx; height: 120rpx; line-height: 120rpx; text-align: center; font-size: 48rpx; font-weight: 800; background: $warm-yellow; border: 1rpx solid $border-primary; border-radius: 50%; color: $accent-dark; margin-bottom: 24rpx; box-sizing: border-box; }
  &__text { font-size: 30rpx; font-weight: 600; color: $text-primary; margin-bottom: 8rpx; }
  &__sub { font-size: 26rpx; color: $text-muted; }
}

.bottom-placeholder { width: 100%; }
</style>
