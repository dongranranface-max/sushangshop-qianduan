<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- ========== 一、冰川资产看板 (Ice-Blue Dashboard) ========== -->
    <view class="dashboard-card" v-if="isLoggedIn">
      <!-- 背景流光装饰 -->
      <view class="dashboard-glow"></view>
      <view class="dashboard-glow glow-2"></view>

      <view class="dashboard-inner">
        <!-- 左侧：资产态 -->
        <view class="asset-panel">
          <text class="asset-label">生态积分</text>
          <text class="asset-number">{{ ecoPointsDisplay }}</text>
          <view class="asset-sub">
            <text class="asset-sub-text">消费积分 {{ consumerPointsDisplay }}</text>
          </view>
        </view>

        <!-- 分隔线 -->
        <view class="dashboard-divider"></view>

        <!-- 右侧：动能态 -->
        <view class="profit-panel">
          <text class="asset-label">昨日分红</text>
          <text class="asset-number-fire">+{{ yesterdayProfit }}</text>
          <view class="asset-sub">
            <text class="profit-rate">年化 {{ profitRate }}%</text>
          </view>
        </view>
      </view>

      <!-- 底部：业绩进度条 -->
      <view class="progress-section">
        <view class="progress-header">
          <text class="progress-label">距离 V{{ nextLevel }} 等级</text>
          <text class="progress-percent">{{ progressPercent }}%</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
      </view>
    </view>

    <!-- 未登录引导 -->
    <view class="login-card" v-else @click="goLogin">
      <view class="login-card-inner">
        <text class="login-icon">🔐</text>
        <view class="login-text-group">
          <text class="login-title">登录账户</text>
          <text class="login-subtitle">查看资产明细与专属权益</text>
        </view>
        <text class="login-arrow">›</text>
      </view>
    </view>

    <!-- ========== 二、搜索栏 ========== -->
    <view class="search-bar-wrapper">
      <view class="search-bar" @click="goSearch">
        <text class="search-icon">🔍</text>
        <text class="search-placeholder">搜索商品 / 理财项目</text>
      </view>
      <view class="msg-btn">
        <text class="msg-icon">💬</text>
        <view class="msg-dot" v-if="unreadCount > 0"></view>
      </view>
    </view>

    <!-- ========== 三、Banner 轮播 ========== -->
    <view class="banner-wrapper">
      <swiper class="banner" :indicator-dots="true" :autoplay="true" :interval="4000" :circular="true"
        indicator-color="rgba(255,255,255,0.2)" indicator-active-color="#4D8EFF">
        <swiper-item v-for="(banner, index) in banners" :key="index">
          <image class="banner-image" :src="banner.image" mode="aspectFill" @click="onBannerClick(banner)" />
        </swiper-item>
      </swiper>
    </view>

    <!-- ========== 四、火炎入口区 (Flame Portals) ========== -->
    <view class="portals-grid">
      <view class="portal-item" v-for="entry in portalEntries" :key="entry.id" @click="onEntryClick(entry)">
        <!-- 普通门户 -->
        <template v-if="entry.type !== 'wealth'">
          <view class="portal-icon">{{ entry.icon }}</view>
          <text class="portal-name">{{ entry.name }}</text>
        </template>
        <!-- 增值专区：火炎呼吸效果 -->
        <template v-else>
          <view class="portal-icon fire-portal-icon">{{ entry.icon }}</view>
          <text class="portal-name portal-name-fire">{{ entry.name }}</text>
          <view class="portal-fire-ring"></view>
        </template>
      </view>
    </view>

    <!-- ========== 五、科技生活流 (Life-Tech Stream) ========== -->
    <!-- 消费商城入口横幅 -->
    <view class="section">
      <view class="section-header">
        <view class="section-title-group">
          <text class="section-icon">🛍️</text>
          <text class="section-title">精选好物</text>
        </view>
        <view class="section-more" @click="goCatalog">
          <text class="more-text">查看更多</text>
          <text class="more-arrow">›</text>
        </view>
      </view>

      <view class="product-grid">
        <view class="product-card glass-card-hover" v-for="p in products" :key="p.id" @click="goProduct(p.id)">
          <view class="product-image">
            <image class="img" :src="p.coverImage || p.image" mode="aspectFill" />
            <view class="product-tag" v-if="p.isHot">热</view>
          </view>
          <view class="product-info">
            <text class="product-name">{{ p.name }}</text>
            <!-- 双色价格标签 -->
            <view class="product-price-row">
              <view class="price-tag">
                <text class="price-points">{{ p.price }}积分</text>
                <text class="price-cash">¥{{ p.cashPrice || 0 }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 换购推荐 -->
    <view class="section" v-if="exchangeProducts.length > 0">
      <view class="section-header">
        <view class="section-title-group">
          <text class="section-icon">🔄</text>
          <text class="section-title">换购专区</text>
        </view>
        <view class="section-more" @click="goExchange">
          <text class="more-text">查看更多</text>
          <text class="more-arrow">›</text>
        </view>
      </view>
      <scroll-view class="product-scroll" scroll-x>
        <view class="product-scroll-content">
          <view class="product-card glass-card-hover" v-for="p in exchangeProducts" :key="p.id" @click="goProduct(p.id)">
            <view class="product-image">
              <image class="img" :src="p.coverImage || p.image" mode="aspectFill" />
            </view>
            <view class="product-info">
              <text class="product-name">{{ p.name }}</text>
              <view class="price-tag">
                <text class="price-points">{{ p.ecoPoints || p.price }}积分</text>
                <text class="price-cash">¥{{ p.cashPrice || 0 }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 兑换专区 -->
    <view class="section" v-if="redeemProducts.length > 0">
      <view class="section-header">
        <view class="section-title-group">
          <text class="section-icon">🎁</text>
          <text class="section-title">免费兑换</text>
        </view>
        <view class="section-more" @click="goRedeem">
          <text class="more-text">查看更多</text>
          <text class="more-arrow">›</text>
        </view>
      </view>
      <view class="product-grid">
        <view class="product-card glass-card-hover" v-for="p in redeemProducts" :key="p.id" @click="goProduct(p.id)">
          <view class="product-image">
            <image class="img" :src="p.coverImage || p.image" mode="aspectFill" />
          </view>
          <view class="product-info">
            <text class="product-name">{{ p.name }}</text>
            <view class="tag-fire redeem-tag">{{ p.requiredPoints }}积分</view>
          </view>
        </view>
      </view>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { walletApi, productApi } from '@/utils/api'
import { isLoggedIn, requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const isLoggedIn = ref(false)
const ecoPointsDisplay = ref('0')
const consumerPointsDisplay = ref('0')
const yesterdayProfit = ref('0.00')
const profitRate = ref('0')
const nextLevel = ref(2)
const progressPercent = ref(0)
const unreadCount = ref(0)
const products = ref<any[]>([])
const exchangeProducts = ref<any[]>([])
const redeemProducts = ref<any[]>([])

const banners = ref([
  { id: 1, image: 'https://picsum.photos/750/400?random=10', link: '' },
  { id: 2, image: 'https://picsum.photos/750/400?random=11', link: '' },
  { id: 3, image: 'https://picsum.photos/750/400?random=12', link: '' },
])

const portalEntries = [
  { id: 1, name: '消费商城', icon: '🛍️', type: 'consume' },
  { id: 2, name: '换购商城', icon: '🔄', type: 'exchange' },
  { id: 3, name: '兑换商城', icon: '🎁', type: 'redeem' },
  { id: 4, name: '增值专区', icon: '📈', type: 'wealth' },
]

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20

  const loggedIn = isLoggedIn()
  isLoggedIn.value = loggedIn

  if (loggedIn) {
    loadUserData()
  }
  loadProducts()
})

async function loadUserData() {
  try {
    const bal = await walletApi.getBalance()
    ecoPointsDisplay.value = Number(bal.ecoPoints || 0).toLocaleString()
    consumerPointsDisplay.value = Number(bal.consumerPoints || 0).toLocaleString()
    // 模拟昨日分红（实际接口待接）
    yesterdayProfit.value = bal.yesterdayProfit || '0.00'
    profitRate.value = bal.profitRate || '0'
    nextLevel.value = (bal.level || 1) + 1
    progressPercent.value = bal.progressPercent || 0
  } catch (e) {
    console.error('加载用户数据失败', e)
  }
}

async function loadProducts() {
  try {
    const [exchangeRes, redeemRes, allRes] = await Promise.all([
      productApi.getList({ type: 2, limit: 6 }),
      productApi.getList({ type: 3, limit: 6 }),
      productApi.getList({ limit: 6 }),
    ])
    exchangeProducts.value = exchangeRes.list || []
    redeemProducts.value = redeemRes.list || []
    products.value = allRes.list || []
  } catch (e) {
    console.error('加载商品失败', e)
  }
}

function goLogin() {
  uni.navigateTo({ url: '/pages/auth/login' })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/search/index' })
}

function goCatalog() {
  uni.switchTab({ url: '/pages/catalog/index' })
}

function goExchange() {
  uni.navigateTo({ url: '/pages/exchange/list' })
}

function goRedeem() {
  uni.navigateTo({ url: '/pages/redeem/list' })
}

function goProduct(id: string | number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

function onBannerClick(banner: any) {
  if (banner.link) {
    // TODO: 处理跳转
  }
}

function onEntryClick(entry: { type: string }) {
  if (entry.type !== 'consume' && !requireAuth()) return
  switch (entry.type) {
    case 'consume': uni.switchTab({ url: '/pages/buy/index' }); break
    case 'exchange': uni.navigateTo({ url: '/pages/exchange/list' }); break
    case 'redeem': uni.navigateTo({ url: '/pages/redeem/list' }); break
    case 'wealth': uni.switchTab({ url: '/pages/wealth/index' }); break
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

// =============================================
// 一、冰川资产看板
// =============================================
.dashboard-card {
  position: relative;
  background: linear-gradient(145deg,
    rgba(30, 41, 59, 0.70) 0%,
    rgba(10, 22, 40, 0.85) 100%);
  backdrop-filter: blur(20px);
  border: 1rpx solid rgba(77, 142, 255, 0.22);
  border-radius: 32rpx;
  padding: 36rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
}

// 背景流光
.dashboard-glow {
  position: absolute;
  top: -80rpx; right: -80rpx;
  width: 300rpx; height: 300rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(77,142,255,0.12) 0%, transparent 70%);
  pointer-events: none;
}

.glow-2 {
  top: auto; right: auto;
  bottom: -60rpx; left: -60rpx;
  width: 240rpx; height: 240rpx;
  background: radial-gradient(circle, rgba(0,242,254,0.08) 0%, transparent 70%);
}

.dashboard-inner {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
}

.asset-panel, .profit-panel {
  flex: 1;
}

.asset-label {
  font-size: 24rpx;
  color: rgba(255,255,255,0.6);
  display: block;
  margin-bottom: 8rpx;
}

.asset-number {
  font-size: 56rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -2rpx;
  line-height: 1.1;
  display: block;
}

.asset-number-fire {
  font-size: 56rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #FFB347 0%, #FF4500 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 12rpx rgba(255,140,0,0.5));
  letter-spacing: -2rpx;
  line-height: 1.1;
  display: block;
}

.asset-sub {
  margin-top: 8rpx;
  .asset-sub-text { font-size: 22rpx; color: rgba(255,255,255,0.45); }
  .profit-rate { font-size: 22rpx; color: rgba(255,140,0,0.8); }
}

.dashboard-divider {
  width: 1rpx;
  height: 100rpx;
  background: linear-gradient(180deg, transparent, rgba(77,142,255,0.4), transparent);
  margin: 0 24rpx;
}

.progress-section {
  margin-top: 28rpx;
  position: relative;
  z-index: 1;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;

  .progress-label { font-size: 22rpx; color: rgba(255,255,255,0.5); }
  .progress-percent { font-size: 22rpx; color: $primary-light; font-weight: 600; }
}

.progress-bar {
  width: 100%;
  height: 6rpx;
  background: rgba(255,255,255,0.08);
  border-radius: 999rpx;
  overflow: hidden;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $primary-dark, $primary-light);
    border-radius: 999rpx;
    box-shadow: 0 0 10rpx rgba(0,242,254,0.5);
    transition: width 0.8s ease;
  }
}

// =============================================
// 未登录引导卡片
// =============================================
.login-card {
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: 1rpx solid $glass-border;
  border-radius: $radius-xl;
  padding: 32rpx;
  margin-bottom: 24rpx;

  &:active {
    border-color: rgba(77,142,255,0.4);
  }
}

.login-card-inner {
  display: flex;
  align-items: center;
}

.login-icon { font-size: 56rpx; margin-right: 20rpx; }

.login-text-group { flex: 1;
  .login-title { font-size: 32rpx; font-weight: 600; color: $text-primary; display: block; }
  .login-subtitle { font-size: 24rpx; color: $text-secondary; display: block; margin-top: 4rpx; }
}

.login-arrow { font-size: 40rpx; color: $primary; }

// =============================================
// 二、搜索栏
// =============================================
.search-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 0 24rpx;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  height: 76rpx;
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: 1rpx solid $glass-border;
  border-radius: 999rpx;
  padding: 0 28rpx;

  .search-icon { font-size: 30rpx; margin-right: 12rpx; color: $primary-light; }
  .search-placeholder { font-size: 26rpx; color: $text-muted; }
}

.msg-btn {
  position: relative;
  width: 76rpx; height: 76rpx;
  display: flex; align-items: center; justify-content: center;
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: 1rpx solid $glass-border;
  border-radius: 50%;

  .msg-icon { font-size: 36rpx; }
}

.msg-dot {
  position: absolute;
  top: 14rpx; right: 14rpx;
  width: 14rpx; height: 14rpx;
  background: $accent;
  border-radius: 50%;
  border: 2rpx solid $bg-primary;
}

// =============================================
// 三、Banner
// =============================================
.banner-wrapper {
  margin-bottom: 32rpx;

  .banner {
    width: 100%;
    height: 320rpx;
    border-radius: $radius-xl;
    overflow: hidden;
    border: 1rpx solid $glass-border;
  }

  .banner-image { width: 100%; height: 100%; }
}

// =============================================
// 四、火炎入口区
// =============================================
.portals-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  margin-bottom: 40rpx;
}

.portal-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 8rpx;
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: 1rpx solid $glass-border;
  border-radius: $radius-lg;
  gap: 10rpx;

  &:active {
    background: $glass-bg-hover;
    border-color: rgba(77,142,255,0.35);
  }
}

.portal-icon {
  font-size: 52rpx;
  line-height: 1;
}

.fire-portal-icon {
  position: relative;
  z-index: 2;
}

.portal-name {
  font-size: 24rpx;
  color: $text-secondary;
  font-weight: 500;
  text-align: center;
}

.portal-name-fire {
  color: $accent;
  font-weight: 700;
  text-shadow: 0 0 10rpx rgba(255,140,0,0.4);
  position: relative;
  z-index: 2;
}

// 火炎呼吸环
.portal-fire-ring {
  position: absolute;
  inset: 0;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, rgba(255,140,0,0.10), rgba(255,69,0,0.08));
  border: 1rpx solid rgba(255,140,0,0.25);
  animation: fire-breathe 2.5s ease-in-out infinite;
  pointer-events: none;
}

// =============================================
// 五、商品网格
// =============================================
.section { margin-bottom: 40rpx; }

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.section-icon { font-size: 34rpx; }

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-primary;
}

.section-more {
  display: flex;
  align-items: center;
  gap: 4rpx;

  .more-text { font-size: 24rpx; color: $text-muted; }
  .more-arrow { font-size: 28rpx; color: $primary; }
}

// 双列商品网格
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.product-card {
  border-radius: $radius-lg;
  overflow: hidden;
  border: 1rpx solid $glass-border;
}

.product-image {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #0A1628 0%, #1E293B 100%);
  position: relative;
  overflow: hidden;

  .img { width: 100%; height: 100%; }
}

.product-tag {
  position: absolute;
  top: 12rpx; left: 12rpx;
  background: linear-gradient(135deg, $accent, $accent-dark);
  color: #fff;
  font-size: 20rpx;
  font-weight: 700;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  box-shadow: 0 4rpx 12rpx rgba(255,69,0,0.4);
}

.product-info {
  padding: 16rpx;
}

.product-name {
  font-size: 26rpx;
  color: $text-primary;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 12rpx;
}

.product-price-row { display: flex; align-items: center; justify-content: space-between; }

// 双色价格标签
.price-tag {
  display: inline-flex;
  align-items: center;
  font-size: 24rpx;
  font-weight: 700;
  border-radius: 8rpx;
  overflow: hidden;
  height: 48rpx;

  .price-points {
    background: $accent;
    color: #fff;
    padding: 0 14rpx;
    font-size: 24rpx;
    font-weight: 700;
  }

  .price-cash {
    background: transparent;
    color: $primary-light;
    border: 1.5rpx solid $primary;
    padding: 0 12rpx;
    font-size: 20rpx;
    font-weight: 600;
  }
}

.tag-fire {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 14rpx;
  background: linear-gradient(135deg, rgba(255,140,0,0.2), rgba(255,69,0,0.15));
  border: 1rpx solid rgba(255,69,0,0.35);
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 600;
  color: $accent;
  text-shadow: 0 0 8rpx rgba(255,140,0,0.4);
}

.redeem-tag { margin-top: 8rpx; }

// 单行滚动商品
.product-scroll { width: 100%; white-space: nowrap; }
.product-scroll-content { display: inline-flex; gap: 16rpx; padding: 4rpx 0; }

.product-scroll-content .product-card {
  width: 260rpx;
  flex-shrink: 0;
  border-radius: $radius-lg;
}
</style>
