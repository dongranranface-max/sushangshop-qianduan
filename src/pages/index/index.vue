<template>
  <view class="page-container">
    <!-- 毛玻璃状态栏 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 搜索栏 -->
    <view class="search-header" @click="goSearch">
      <view class="search-bar">
        <text class="search-icon">⌕</text>
        <text class="search-placeholder">搜索商品/服务</text>
      </view>
    </view>

    <!-- 全屏轮播 -->
    <view class="banner-section">
      <swiper
        class="banner-swiper"
        :current="currentBanner"
        @change="onBannerChange"
        autoplay
        interval="5000"
        circular
        duration="400"
      >
        <swiper-item v-for="(banner, idx) in banners" :key="idx" class="banner-item">
          <image class="banner-img" :src="banner.image" mode="aspectFill" />
          <view class="banner-overlay">
            <text class="banner-title">{{ banner.title }}</text>
            <text class="banner-sub">{{ banner.sub }}</text>
          </view>
        </swiper-item>
      </swiper>
      <!-- 轮播指示器 -->
      <view class="banner-dots">
        <view
          v-for="(_, idx) in banners"
          :key="idx"
          class="banner-dot"
          :class="{ active: currentBanner === idx }"
        />
      </view>
    </view>

    <!-- 平台实时数据滚动 -->
    <view class="ticker-strip">
      <view class="ticker-left">
        <text class="ticker-tag">实时</text>
        <view class="ticker-content">
          <text class="ticker-text">{{ tickerText }}</text>
        </view>
      </view>
      <text class="ticker-arrow">›</text>
    </view>

    <!-- 三大商城入口 -->
    <view class="mall-portals">
      <view
        v-for="mall in mallPortals"
        :key="mall.id"
        class="mall-portal-card"
        :style="{ background: mall.gradient }"
        @click="goMall(mall)"
      >
        <view class="mall-portal-glow" />
        <view class="mall-portal-inner">
          <view class="mall-icon-wrap">
            <text class="mall-icon">{{ mall.icon }}</text>
          </view>
          <view class="mall-info">
            <text class="mall-name">{{ mall.name }}</text>
            <text class="mall-desc">{{ mall.desc }}</text>
          </view>
          <view class="mall-arrow">
            <text>›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 热门分类 -->
    <view class="section-block">
      <view class="section-head">
        <view class="section-head__left">
          <text class="section-title">热门分类</text>
        </view>
        <view class="section-head__right" @click="goCatalog">
          <text class="section-more">查看全部 ›</text>
        </view>
      </view>
      <scroll-view class="category-scroll" scroll-x>
        <view class="category-list">
          <view
            v-for="cat in hotCategories"
            :key="cat.id"
            class="category-item"
            @click="goCatalogCategory(cat)"
          >
            <view class="category-icon-wrap" :style="{ background: cat.bg }">
              <text class="category-icon">{{ cat.icon }}</text>
            </view>
            <text class="category-name">{{ cat.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 精品推荐 -->
    <view class="section-block">
      <view class="section-head">
        <view class="section-head__left">
          <text class="section-title">精品推荐</text>
        </view>
      </view>
      <view v-if="loading && !products.length" class="boutique-grid">
        <view v-for="i in 4" :key="i" class="boutique-skeleton shimmer" />
      </view>
      <view v-else class="boutique-grid">
        <view
          v-for="p in products"
          :key="p.id"
          class="boutique-card"
          @click="goProduct(p)"
        >
          <image class="boutique-img" :src="p.coverImage || p.image" mode="aspectFill" />
          <view class="boutique-info">
            <text class="boutique-name">{{ p.name }}</text>
            <view class="boutique-price">
              <text class="boutique-cash">¥{{ p.price }}</text>
              <text v-if="p.requiredPoints" class="boutique-points">+{{ p.requiredPoints }}积分</text>
            </view>
          </view>
          <view v-if="p.type === 1" class="boutique-badge">购</view>
          <view v-else-if="p.type === 2" class="boutique-badge boutique-badge--gold">换</view>
          <view v-else class="boutique-badge boutique-badge--dark">兑</view>
        </view>
      </view>
    </view>

    <!-- 底部安全区 -->
    <view class="safe-area-bottom" :style="{ height: (100 + safeAreaBottom) + 'px' }" />

    <!-- 自定义毛玻璃 TabBar -->
    <LuxuryTabbar />

    <!-- 资产状态栏 -->
    <AssetStatusBar v-if="loggedIn" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { productApi } from '@/utils/api'
import { checkAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'
import LuxuryTabbar from '@/components/LuxuryTabbar.vue'
import AssetStatusBar from '@/components/AssetStatusBar.vue'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const loggedIn = ref(checkAuth())
const currentBanner = ref(0)
const loading = ref(false)
const products = ref<any[]>([])

const banners = ref([
  { image: '/static/logo.png', title: '集享生活', sub: '品质生活 从集享开始' },
  { image: '/static/logo.png', title: '消费即返', sub: '购买商品 积分双重收益' },
  { image: '/static/logo.png', title: '增值理财', sub: '算力增值 稳健收益' },
])

const tickerText = ref('')
const tickerQueue = [
  '平台用户突破 128,000+',
  '今日订单 3,892 单',
  '生态积分发行量 8.8亿',
  '累计分红 2,100万+',
  '服务商覆盖 32 省份',
]
let tickerIndex = 0

const mallPortals = [
  {
    id: 'consume',
    name: '消费商城',
    desc: '精选商品 消费即返积分',
    icon: '购',
    gradient: 'linear-gradient(135deg, #F9F7F4 0%, #EDE9E1 100%)',
    type: 1,
  },
  {
    id: 'exchange',
    name: '换购商城',
    desc: '积分抵现 超值换购',
    icon: '换',
    gradient: 'linear-gradient(135deg, #F0EDE8 0%, #E8E4DC 100%)',
    type: 2,
  },
  {
    id: 'redeem',
    name: '兑换商城',
    desc: '积分全额兑换 零元好物',
    icon: '兑',
    gradient: 'linear-gradient(135deg, #F0EDE8 0%, #E8E4DC 100%)',
    type: 3,
  },
]

const hotCategories = [
  { id: 1, name: '手机数码', icon: '📱', bg: 'rgba(184,152,118,0.10)' },
  { id: 2, name: '电脑办公', icon: '💻', bg: 'rgba(65,75,94,0.08)' },
  { id: 3, name: '家居生活', icon: '🏠', bg: 'rgba(142,116,89,0.10)' },
  { id: 4, name: '美妆护肤', icon: '💄', bg: 'rgba(65,75,94,0.08)' },
  { id: 5, name: '食品生鲜', icon: '🍎', bg: 'rgba(142,116,89,0.10)' },
  { id: 6, name: '服饰鞋帽', icon: '👟', bg: 'rgba(184,152,118,0.10)' },
  { id: 7, name: '母婴用品', icon: '🍼', bg: 'rgba(65,75,94,0.08)' },
  { id: 8, name: '图书文具', icon: '📚', bg: 'rgba(142,116,89,0.10)' },
]

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
  loadProducts()
  startTicker()
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (loggedIn.value) assetStore.fetchBalance()
})

function startTicker() {
  tickerText.value = tickerQueue[0]
  tickerIndex = 0
  setInterval(() => {
    tickerIndex = (tickerIndex + 1) % tickerQueue.length
    tickerText.value = tickerQueue[tickerIndex]
  }, 4000)
}

async function loadProducts() {
  loading.value = true
  try {
    const res = await productApi.getList({ type: 1, limit: 8, page: 1 })
    products.value = (res.list || []).slice(0, 4)
  } catch {
    products.value = []
  } finally {
    loading.value = false
  }
}

function onBannerChange(e: any) {
  currentBanner.value = e.detail.current
}

function goSearch() { uni.navigateTo({ url: '/pages/search/index' }) }
function goCatalog() { uni.switchTab({ url: '/pages/catalog/index' }) }
function goMall(mall: any) {
  uni.navigateTo({ url: `/pages/catalog/index?type=${mall.type}` })
}
function goCatalogCategory(cat: any) {
  uni.navigateTo({ url: `/pages/catalog/index?categoryId=${cat.id}` })
}
function goProduct(p: any) {
  uni.navigateTo({ url: `/pages/product/detail?id=${p.id}&type=${p.type || 1}` })
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

// ========== 搜索栏 ==========
.search-header {
  padding: 12rpx $spacing-base 8rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 80rpx;
  padding: 0 28rpx;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-full;
  box-shadow: $clay-shadow;

  .search-icon {
    font-size: 32rpx;
    color: $text-muted;
    flex-shrink: 0;
  }

  .search-placeholder {
    flex: 1;
    font-size: 28rpx;
    color: $text-muted;
    letter-spacing: 0.3rpx;
  }
}

// ========== 轮播 ==========
.banner-section {
  position: relative;
  margin: 0 $spacing-base;
  border-radius: $radius-xl;
  overflow: hidden;
  box-shadow: 0 16rpx 56rpx rgba(47, 53, 66, 0.12);
}

.banner-swiper {
  width: 100%;
  height: 380rpx;
}

.banner-item {
  width: 100%;
  height: 380rpx;
  position: relative;
}

.banner-img {
  width: 100%;
  height: 100%;
  background: $bg-tertiary;
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40rpx $spacing-lg 32rpx;
  background: linear-gradient(to top, rgba(30, 36, 51, 0.75) 0%, transparent 100%);
  display: flex;
  flex-direction: column;
  gap: 6rpx;

  .banner-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #fff;
    letter-spacing: 1rpx;
  }

  .banner-sub {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
  }
}

.banner-dots {
  position: absolute;
  bottom: 20rpx;
  right: $spacing-lg;
  display: flex;
  gap: 8rpx;
}

.banner-dot {
  width: 24rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;

  &.active {
    width: 40rpx;
    background: #fff;
  }
}

// ========== 数据滚动条 ==========
.ticker-strip {
  margin: $spacing-base $spacing-base 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14rpx $spacing-base;
  background: rgba(47, 53, 66, 0.88);
  border-radius: $radius-full;
  overflow: hidden;
}

.ticker-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  overflow: hidden;
}

.ticker-tag {
  font-size: 18rpx;
  font-weight: 700;
  color: $bronze-light;
  background: rgba(184, 152, 118, 0.2);
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(184, 152, 118, 0.3);
  flex-shrink: 0;
  letter-spacing: 0.5rpx;
}

.ticker-content {
  overflow: hidden;
  flex: 1;
}

.ticker-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  animation: ticker-scroll 8s linear infinite;
}

@keyframes ticker-scroll {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

.ticker-arrow {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

// ========== 三大商城入口 ==========
.mall-portals {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-base $spacing-base 0;
}

.mall-portal-card {
  position: relative;
  border-radius: $radius-xl;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    transform: scale(0.98);
  }

  // 兑换商城深色特殊处理
  &:last-child {
    .mall-icon-wrap {
      background: rgba(255, 255, 255, 0.1);
    }
    .mall-name { color: $bronze-light; }
    .mall-desc { color: rgba(255, 255, 255, 0.55); }
    .mall-arrow { color: rgba(255, 255, 255, 0.4); }
    .ticker-tag { color: $bronze-gold; }
  }
}

.mall-portal-glow {
  position: absolute;
  top: -30%;
  right: -5%;
  width: 50%;
  height: 80%;
  background: radial-gradient(circle, rgba(184, 152, 118, 0.2) 0%, transparent 70%);
  pointer-events: none;
}

.mall-portal-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: 28rpx $spacing-lg;
}

.mall-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(184, 152, 118, 0.15);
  border-radius: $radius-lg;
  border: 1rpx solid rgba(184, 152, 118, 0.2);
  flex-shrink: 0;

  .mall-icon {
    font-size: 32rpx;
    font-weight: 800;
    color: $accent-dark;
  }
}

.mall-info {
  flex: 1;

  .mall-name {
    display: block;
    font-size: 30rpx;
    font-weight: 700;
    color: $accent-dark;
    margin-bottom: 4rpx;
  }

  .mall-desc {
    display: block;
    font-size: 22rpx;
    color: rgba(47, 53, 66, 0.5);
  }
}

.mall-arrow {
  font-size: 36rpx;
  color: rgba(47, 53, 66, 0.2);
  font-weight: 300;
}

// ========== 通用区块 ==========
.section-block {
  padding: $spacing-lg $spacing-base 0;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-base;

  &__left {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__right {}
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $mineral-gray;
  letter-spacing: 0.5rpx;
}

.section-more {
  font-size: 24rpx;
  color: $text-muted;
}

// ========== 热门分类 ==========
.category-scroll {
  white-space: nowrap;
}

.category-list {
  display: inline-flex;
  gap: $spacing-base;
  padding-right: $spacing-base;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:active { transform: scale(0.95); }
}

.category-icon-wrap {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  box-shadow: $clay-shadow;

  .category-icon {
    font-size: 36rpx;
  }
}

.category-name {
  font-size: 22rpx;
  color: $text-secondary;
  font-weight: 500;
  white-space: nowrap;
}

// ========== 精品推荐 ==========
.boutique-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
}

.boutique-card {
  position: relative;
  border-radius: $radius-lg;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  box-shadow: $clay-shadow;
  transition: transform 0.2s ease;

  &:active { transform: scale(0.97); }
}

.boutique-img {
  width: 100%;
  aspect-ratio: 1 / 1;
  display: block;
  background: $bg-tertiary;
}

.boutique-info {
  padding: 14rpx 16rpx 16rpx;
}

.boutique-name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.4;
  margin-bottom: 8rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.boutique-price {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
}

.boutique-cash {
  font-family: $asset-balance-font;
  font-size: 28rpx;
  font-weight: 700;
  color: $mineral-gray;
  font-variant-numeric: tabular-nums;
}

.boutique-points {
  font-size: 20rpx;
  color: $accent-dark;
  font-weight: 600;
}

.boutique-badge {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  min-width: 40rpx;
  height: 40rpx;
  padding: 0 10rpx;
  background: $warm-yellow;
  border: 1rpx solid $border-primary;
  border-radius: 20rpx;
  font-size: 20rpx;
  font-weight: 800;
  color: $accent-dark;
  display: flex;
  align-items: center;
  justify-content: center;

  &--gold {
    background: rgba(47, 53, 66, 0.88);
    border-color: rgba(47, 53, 66, 0.3);
    color: $bronze-light;
  }

  &--dark {
    background: $mineral-gray;
    border-color: rgba(47, 53, 66, 0.3);
    color: $bronze-light;
  }
}

// ========== 骨架屏 ==========
.boutique-skeleton {
  aspect-ratio: 1 / 1;
  background: $bg-tertiary;
  border-radius: $radius-lg;
}

.shimmer {
  animation: shim 1.4s ease-in-out infinite;
}

@keyframes shim {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.7; }
}

.safe-area-bottom {
  width: 100%;
}
</style>
