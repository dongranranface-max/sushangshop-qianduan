<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <view class="page-header">
      <view class="header-left">
        <text class="page-title">消费商城</text>
        <text class="page-sub">消费积分免费换商品</text>
      </view>
      <view class="search-btn" @click="goSearch">
        <text>🔍</text>
      </view>
    </view>

    <!-- 消费积分余额 Banner -->
    <view class="points-banner" v-if="balance">
      <view class="points-banner__icon">
        <text>消</text>
      </view>
      <view class="points-banner__info">
        <text class="points-banner__label">我的消费积分</text>
        <text class="points-banner__value">{{ Number(balance.consumerPoints || 0).toLocaleString() }}</text>
      </view>
      <text class="points-banner__tip">兑换后不退</text>
    </view>
    <view class="points-banner points-banner--loading" v-else>
      <view class="points-banner__info">
        <text class="points-banner__value">--</text>
      </view>
    </view>

    <scroll-view scroll-y class="product-list" @scrolltolower="loadMore">
      <view v-if="loading && !products.length" class="skeleton-grid">
        <view v-for="i in 4" :key="i" class="sk-card">
          <view class="sk-img shimmer" />
          <view class="sk-info">
            <view class="sk-line shimmer" />
            <view class="sk-line sk-short shimmer" />
          </view>
        </view>
      </view>

      <view v-else class="product-grid">
        <view
          v-for="item in products"
          :key="item.id"
          class="product-card"
          @click="goExchange(item)"
        >
          <view class="product-card__cover">
            <image class="cover-img" :src="item.coverImage || '/static/logo.png'" mode="aspectFill" lazy-load />
            <view class="cover-tag">
              <text>0元兑</text>
            </view>
          </view>
          <view class="product-card__info">
            <text class="product-name">{{ item.name }}</text>
            <view class="price-row">
              <text class="points-value">{{ item.requiredPoints }}</text>
              <text class="points-unit">积分</text>
              <view class="free-tag">
                <text>免费兑换</text>
              </view>
            </view>
            <view class="action-row">
              <view
                class="redeem-btn"
                :class="{ 'redeem-btn--disabled': !canRedeem(item) }"
              >
                <text>{{ canRedeem(item) ? '立即兑换' : '积分不足' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loading && products.length" class="load-more">
        <view class="loading-spinner" />
        <text>加载中...</text>
      </view>

      <view v-if="!loading && !products.length" class="empty-state">
        <view class="empty-state__icon">兑</view>
        <text class="empty-state__text">暂无兑换商品</text>
        <text class="empty-state__sub">看看其他频道吧</text>
      </view>

      <view v-if="!hasMore && products.length > 0" class="no-more">
        <text>— 没有更多了 —</text>
      </view>
    </scroll-view>

    <view class="safe-area-bottom" :style="{ height: (100 + safeAreaBottom) + 'px' }" />

    <LuxuryTabbar />
    <AssetStatusBar v-if="loggedIn" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { walletApi, productApi, type ProductListItem } from '@/utils/api'
import { checkAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'
import LuxuryTabbar from '@/components/LuxuryTabbar.vue'
import AssetStatusBar from '@/components/AssetStatusBar.vue'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const loggedIn = ref(checkAuth())
const balance = ref<{ consumerPoints?: string } | null>(null)
interface Product extends ProductListItem {
  requiredPoints?: string | number
  [k: string]: unknown
}

const products = ref<Product[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
let reqSeq = 0

function canRedeem(item: Product): boolean {
  if (!balance.value) return false
  return Number(balance.value.consumerPoints || 0) >= Number(item.requiredPoints || 0)
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
  loadBalance()
  loadProducts()
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (loggedIn.value) {
    assetStore.fetchBalance()
    loadBalance()
  }
})

async function loadBalance() {
  try {
    balance.value = await walletApi.getBalance()
  } catch {}
}

async function loadProducts(reset = false) {
  if (loading.value) return
  if (reset) { page.value = 1; hasMore.value = true }
  if (!hasMore.value) return
  loading.value = true
  const seq = ++reqSeq
  try {
    const res = await productApi.getList({ type: 3, page: page.value, limit: 20 })
    if (seq !== reqSeq) return
    const list = res.list || []
    if (reset) products.value = list
    else products.value.push(...list)
    hasMore.value = list.length === 20
    page.value++
  } catch {
    if (seq !== reqSeq) return
  } finally {
    if (seq === reqSeq) loading.value = false
  }
}

function loadMore() {
  if (hasMore.value && !loading.value) loadProducts(false)
}

function goSearch() { uni.navigateTo({ url: '/pages/search/index' }) }
function goExchange(item: Product) {
  if (!canRedeem(item)) {
    uni.showToast({ title: '消费积分不足', icon: 'none' })
    return
  }
  if (!checkAuth()) return
  uni.navigateTo({ url: `/pages/order/confirm?productId=${item.id}&type=3` })
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

// ========== 顶部标题 ==========
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx $spacing-base;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 700;
  color: $mineral-gray;
  letter-spacing: 0.5rpx;
}

.page-sub {
  font-size: 22rpx;
  color: $accent-dark;
  font-weight: 500;
}

.search-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  border: 1rpx solid rgba(20, 20, 20, 0.06);
  border-radius: 50%;
  font-size: 28rpx;
  flex-shrink: 0;
}

// ========== 积分余额 Banner ==========
.points-banner {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  margin: 0 $spacing-base $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.60);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;

  &--loading {
    justify-content: center;
    min-height: 100rpx;
  }

  &__icon {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(184, 152, 118, 0.12);
    border: 1rpx solid rgba(184, 152, 118, 0.25);
    border-radius: $radius-md;
    flex-shrink: 0;

    text {
      font-size: 28rpx;
      font-weight: 800;
      color: $accent-dark;
    }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__label {
    font-size: 22rpx;
    color: $text-muted;
  }

  &__value {
    font-family: $asset-balance-font;
    font-size: 48rpx;
    font-weight: 700;
    color: $accent-dark;
    font-variant-numeric: tabular-nums;
    letter-spacing: -1rpx;
  }

  &__tip {
    font-size: 20rpx;
    color: $text-muted;
    flex-shrink: 0;
  }
}

// ========== 商品列表 ==========
.product-list {
  flex: 1;
  padding: 0 $spacing-base;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
}

.product-card {
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.60);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  overflow: hidden;
  transition: transform 0.2s ease;

  &:active { transform: scale(0.98); }

  &__cover {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    overflow: hidden;
    background: $bg-tertiary;
  }

  &__info {
    padding: $spacing-base;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }
}

.cover-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-tag {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  padding: 4rpx 12rpx;
  background: rgba(61, 139, 110, 0.85);
  backdrop-filter: blur(8px);
  border-radius: $radius-full;
  text {
    font-size: 18rpx;
    font-weight: 700;
    color: #fff;
  }
}

.product-name {
  font-size: 26rpx;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.points-value {
  font-family: $asset-balance-font;
  font-size: 32rpx;
  font-weight: 700;
  color: $accent-dark;
  font-variant-numeric: tabular-nums;
}

.points-unit {
  font-size: 22rpx;
  color: $accent-dark;
}

.free-tag {
  padding: 2rpx 10rpx;
  background: rgba(61, 139, 110, 0.10);
  border: 1rpx solid rgba(61, 139, 110, 0.25);
  border-radius: $radius-full;

  text {
    font-size: 18rpx;
    font-weight: 600;
    color: $success;
  }
}

.action-row { margin-top: 4rpx; }

.redeem-btn {
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $accent-gradient;
  border-radius: $radius-full;
  box-shadow: 0 6rpx 20rpx rgba(184, 152, 118, 0.3);
  transition: transform 0.2s ease;

  text {
    font-size: 26rpx;
    font-weight: 700;
    color: #fff;
  }

  &:active { transform: scale(0.97); }

  &--disabled {
    background: rgba(47, 53, 66, 0.12);
    box-shadow: none;
    pointer-events: none;

    text { color: $text-muted; }
  }
}

// ========== 骨架屏 ==========
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
}

.sk-card {
  background: rgba(255, 255, 255, 0.70);
  border-radius: $radius-lg;
  overflow: hidden;

  .sk-img { width: 100%; aspect-ratio: 1; background: $bg-tertiary; }
  .sk-info { padding: $spacing-base; display: flex; flex-direction: column; gap: 10rpx; }
  .sk-line { height: 22rpx; border-radius: 8rpx; background: $bg-tertiary; width: 80%; }
  .sk-line.sk-short { width: 40%; }
}

// 扫光骨架屏动画已全局定义在 page-shell.scss（shimmer-sweep）

// ========== 加载/空状态 ==========
.load-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: $spacing-lg 0;
  font-size: 26rpx;
  color: $text-muted;
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid rgba(184, 152, 118, 0.2);
  border-top-color: $accent-dark;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.no-more {
  text-align: center;
  padding: $spacing-lg 0;
  font-size: 24rpx;
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
    width: 120rpx;
    height: 120rpx;
    line-height: 120rpx;
    text-align: center;
    font-size: 48rpx;
    font-weight: 800;
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: 50%;
    color: $accent-dark;
    margin-bottom: 24rpx;
  }

  &__text {
    font-size: 30rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 8rpx;
  }

  &__sub { font-size: 26rpx; color: $text-muted; }
}

.safe-area-bottom { width: 100%; }
</style>
