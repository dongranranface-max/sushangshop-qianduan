<template>
  <view class="page-container">

    <!-- ========== 顶部状态栏 ========== -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- ========== 1. 资产状态聚合卡（登录后可见） ========== -->
    <view v-if="loggedIn" class="asset-panel">
      <view class="asset-panel__card">
        <!-- 背景装饰 -->
        <view class="asset-panel__glow asset-panel__glow--tl" />
        <view class="asset-panel__glow asset-panel__glow--br" />

        <view class="asset-panel__main">
          <!-- 左侧：总资产 -->
          <view class="asset-panel__balance">
            <text class="asset-panel__balance-label">总资产</text>
            <view class="asset-panel__balance-row">
              <text class="asset-panel__balance-value">
                {{ hidden ? '****' : assetStore.totalAssetsDisplay }}
              </text>
              <view class="asset-panel__eye" @click="toggleHidden">
                <text class="asset-panel__eye-icon">{{ hidden ? '👁' : '👁‍🗨' }}</text>
              </view>
            </view>
            <view class="asset-panel__sub">
              <text class="asset-panel__sub-label">昨日收益</text>
              <text class="asset-panel__sub-value">+{{ hidden ? '**' : assetStore.yesterdayProfitDisplay }}</text>
            </view>
          </view>

          <!-- 右侧：积分三栏 -->
          <view class="asset-panel__points">
            <view class="asset-panel__point-item">
              <text class="asset-panel__point-value asset-panel__point-value--eco">
                {{ hidden ? '****' : assetStore.ecoPointsDisplay }}
              </text>
              <text class="asset-panel__point-label">生态积分</text>
            </view>
            <view class="asset-panel__point-divider" />
            <view class="asset-panel__point-item">
              <text class="asset-panel__point-value asset-panel__point-value--consumer">
                {{ hidden ? '****' : assetStore.consumerPointsDisplay }}
              </text>
              <text class="asset-panel__point-label">消费积分</text>
            </view>
          </view>
        </view>

        <!-- 底部：快捷操作 -->
        <view class="asset-panel__actions">
          <view class="asset-panel__action" @click="goWealth">
            <text class="asset-panel__action-icon">📈</text>
            <text class="asset-panel__action-text">增值理财</text>
          </view>
          <view class="asset-panel__action" @click="goPoints">
            <text class="asset-panel__action-icon">📊</text>
            <text class="asset-panel__action-text">积分明细</text>
          </view>
          <view class="asset-panel__action" @click="goInvite">
            <text class="asset-panel__action-icon">👥</text>
            <text class="asset-panel__action-text">邀请好友</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 2. Hero 品牌大卡 ========== -->
    <view class="hero-section">
      <view class="hero-card">
        <!-- 动态背景层 -->
        <view class="hero-card__bg">
          <view class="hero-card__gradient" />
          <view class="hero-card__shimmer" />
          <view class="hero-card__particles">
            <view v-for="i in 6" :key="i" class="hero-particle" :class="`hero-particle--${i}`" />
          </view>
        </view>

        <!-- 内容层 -->
        <view class="hero-card__content">
          <view class="hero-card__badge">
            <text class="hero-card__badge-text">平台保障</text>
          </view>
          <text class="hero-card__title">集享生活</text>
          <text class="hero-card__slogan">品质生活 · 从集享开始</text>
          <view class="hero-card__tags">
            <view class="hero-tag">
              <text class="hero-tag__icon">🛡</text>
              <text class="hero-tag__text">资金安全</text>
            </view>
            <view class="hero-tag">
              <text class="hero-tag__icon">⚡</text>
              <text class="hero-tag__text">积分通兑</text>
            </view>
            <view class="hero-tag">
              <text class="hero-tag__icon">💎</text>
              <text class="hero-tag__text">专属服务</text>
            </view>
          </view>
        </view>

        <!-- 搜索栏（嵌在 Hero 底部） -->
        <view class="hero-search" @click="goSearch">
          <text class="hero-search__icon">⌕</text>
          <text class="hero-search__placeholder">搜索商品/服务/积分</text>
        </view>
      </view>
    </view>

    <!-- ========== 3. 实时数据横幅 ========== -->
    <view class="data-strip">
      <view class="data-strip__left">
        <view class="data-strip__live">
          <view class="data-strip__dot" />
          <text class="data-strip__live-text">实时</text>
        </view>
        <view class="data-strip__track">
          <view class="data-strip__content">
            <text class="data-strip__text">{{ tickerText }}</text>
            <text class="data-strip__separator">|</text>
            <text class="data-strip__text">{{ tickerText2 }}</text>
            <text class="data-strip__separator">|</text>
            <text class="data-strip__text">{{ tickerText3 }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 4. 金刚区 3×3 快捷服务 ========== -->
    <view class="quick-grid-section">
      <view class="quick-grid">
        <view
          v-for="item in quickServices"
          :key="item.id"
          class="quick-item"
          @click="onQuickAction(item)"
        >
          <view class="quick-item__icon-wrap" :style="{ background: item.bg }">
            <text class="quick-item__icon">{{ item.icon }}</text>
            <view v-if="item.badge" class="quick-item__badge">{{ item.badge }}</view>
          </view>
          <text class="quick-item__label">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <!-- ========== 5. 限时活动双卡片 ========== -->
    <view class="activity-row">
      <!-- 限时秒杀 -->
      <view class="activity-card activity-card--flash" @click="goFlashSale">
        <view class="activity-card__glow" />
        <view class="activity-card__header">
          <view class="activity-card__title-wrap">
            <text class="activity-card__title">限时秒杀</text>
            <view class="activity-card__hot-tag">
              <text class="activity-card__hot-icon">🔥</text>
            </view>
          </view>
          <view class="countdown">
            <text class="countdown__unit">{{ countdownHours }}</text>
            <text class="countdown__sep">:</text>
            <text class="countdown__unit">{{ countdownMinutes }}</text>
            <text class="countdown__sep">:</text>
            <text class="countdown__unit">{{ countdownSeconds }}</text>
          </view>
        </view>
        <text class="activity-card__desc">每日 10:00 / 15:00 / 20:00</text>
        <view class="activity-card__products">
          <view v-for="p in flashProducts" :key="p.id" class="activity-product">
            <image class="activity-product__img" :src="p.image" mode="aspectFill" />
            <text class="activity-product__price">¥{{ p.price }}</text>
          </view>
        </view>
      </view>

      <!-- 会员专区 -->
      <view class="activity-card activity-card--member" @click="goMember">
        <view class="activity-card__glow activity-card__glow--gold" />
        <view class="activity-card__header">
          <text class="activity-card__title">会员专属</text>
          <view class="activity-card__vip-icon">👑</view>
        </view>
        <text class="activity-card__desc">升级享更多权益</text>
        <view class="activity-card__member-info">
          <text class="activity-card__level">{{ assetStore.levelName }}</text>
          <view class="activity-card__progress">
            <view class="activity-card__progress-bar" :style="{ width: assetStore.progressPercent + '%' }" />
          </view>
          <text class="activity-card__progress-text">{{ assetStore.progressPercent }}%</text>
        </view>
        <text class="activity-card__cta">立即升级 ›</text>
      </view>
    </view>

    <!-- ========== 6. 三大商城入口 ========== -->
    <view class="mall-section">
      <view class="mall-section__head">
        <text class="mall-section__title">精选商城</text>
        <text class="mall-section__more" @click="goCatalog">查看全部 ›</text>
      </view>

      <view class="mall-cards">
        <view
          v-for="mall in mallPortals"
          :key="mall.id"
          class="mall-card"
          :class="`mall-card--${mall.id}`"
          @click="goMall(mall)"
        >
          <view class="mall-card__bg" :style="{ background: mall.gradient }" />
          <view class="mall-card__glow" />
          <view class="mall-card__content">
            <view class="mall-card__icon-wrap">
              <text class="mall-card__icon">{{ mall.icon }}</text>
            </view>
            <view class="mall-card__info">
              <text class="mall-card__name">{{ mall.name }}</text>
              <text class="mall-card__desc">{{ mall.desc }}</text>
            </view>
            <view class="mall-card__arrow">›</view>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 7. 热门分类（网格化） ========== -->
    <view class="category-section">
      <view class="section-head">
        <view class="section-head__left">
          <text class="section-title">热门分类</text>
        </view>
        <view class="section-head__right" @click="goCatalog">
          <text class="section-more">查看全部 ›</text>
        </view>
      </view>
      <view class="category-grid">
        <view
          v-for="(cat, idx) in hotCategories"
          :key="cat.id"
          class="category-grid__item"
          :class="`category-grid__item--${(idx % 4) + 1}`"
          @click="goCatalogCategory(cat)"
        >
          <view class="category-grid__icon-wrap" :style="{ background: cat.bg }">
            <text class="category-grid__icon">{{ cat.icon }}</text>
          </view>
          <text class="category-grid__name">{{ cat.name }}</text>
        </view>
        <!-- 补齐到 8 个，保持双行对称 -->
        <template v-if="hotCategories.length === 0">
          <view v-for="i in 8" :key="`skeleton-${i}`" class="category-grid__item">
            <view class="category-grid__icon-wrap category-grid__icon-wrap--skeleton" />
            <view class="category-grid__name-skeleton" />
          </view>
        </template>
      </view>
    </view>

    <!-- ========== 8. 精品推荐 ========== -->
    <view class="section-block">
      <view class="section-head">
        <view class="section-head__left">
          <text class="section-title">精品推荐</text>
        </view>
      </view>

      <!-- 骨架屏 -->
      <SkeletonProductGrid v-if="loading && products.length === 0" :count="4" />

      <!-- 商品网格（错位布局） -->
      <view v-else class="product-grid">
        <view
          v-for="(p, idx) in products"
          :key="p.id"
          class="product-card"
          :class="{ 'product-card--tall': idx % 3 === 1 }"
          @click="goProduct(p)"
        >
          <view class="product-card__img-wrap">
            <image
              class="product-card__img"
              :src="resolveProductCover(p)"
              mode="aspectFill"
              lazy-load
            />
            <!-- 销量标签 -->
            <view v-if="p.salesCount" class="product-card__sales">
              <text class="product-card__sales-text">已售 {{ p.salesCount }}</text>
            </view>
            <!-- 类型角标 -->
            <view class="product-card__type-badge" :class="`product-card__type-badge--${p.type || 1}`">
              <text>{{ typeLabel(p.type) }}</text>
            </view>
          </view>
          <view class="product-card__info">
            <text class="product-card__name">{{ p.name }}</text>
            <view class="product-card__price-row">
              <text class="product-card__cash">¥{{ p.price }}</text>
              <text v-if="p.requiredPoints" class="product-card__points">+{{ p.requiredPoints }}积分</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 触底加载 -->
      <view v-if="loadMoreLoading" class="load-more-tip">
        <text class="load-more-tip__text">加载中...</text>
      </view>
      <view v-else-if="!hasMore && products.length > 0" class="no-more-tip">
        <text class="no-more-tip__text">— 没有更多了 —</text>
      </view>
    </view>

    <view class="safe-area-bottom" :style="{ height: (100 + safeAreaBottom) + 'px' }" />

    <!-- 自定义毛玻璃 TabBar -->
    <LuxuryTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow, onReachBottom } from '@dcloudio/uni-app'
import { productApi, marketingApi } from '@/utils/api'
import { checkAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'
import { resolveProductCover } from '@/utils/media'
import LuxuryTabbar from '@/components/LuxuryTabbar.vue'
import SkeletonProductGrid from '@/components/SkeletonProductGrid.vue'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const loggedIn = ref(checkAuth())
const loading = ref(false)
const loadMoreLoading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const hidden = ref(false)
const PAGE_SIZE = 8

// 倒计时
const countdownHours = ref('00')
const countdownMinutes = ref('00')
const countdownSeconds = ref('00')
let countdownTimer: ReturnType<typeof setInterval> | null = null

interface Product {
  id: number | string
  name: string
  coverImage?: string
  image?: string
  price?: string | number
  requiredPoints?: number
  type?: number
  salesCount?: number
  [k: string]: unknown
}

interface Banner {
  id: number
  title: string
  sub: string
  image: string
  link?: string
  theme?: string
  [k: string]: unknown
}

interface Category {
  id: number | string
  name: string
  icon: string
  bg: string
  [k: string]: unknown
}

const products = ref<Product[]>([])

const tickerText = ref('平台用户突破 128,000+')
const tickerText2 = ref('今日订单 3,892 单')
const tickerText3 = ref('累计分红 2,100万+')

// 金刚区快捷服务
const quickServices = [
  { id: 'recharge', label: '充值', icon: '⚡', bg: 'rgba(255,200,80,0.12)', action: 'recharge' },
  { id: 'withdraw', label: '提现', icon: '💰', bg: 'rgba(61,139,110,0.10)', action: 'withdraw' },
  { id: 'transfer', label: '转账', icon: '🔄', bg: 'rgba(65,75,94,0.10)', action: 'transfer' },
  { id: 'signin', label: '签到', icon: '📝', bg: 'rgba(196,165,123,0.12)', action: 'signin' },
  { id: 'invite', label: '邀请', icon: '👥', bg: 'rgba(255,100,100,0.08)', action: 'invite' },
  { id: 'coupon', label: '卡券', icon: '🎫', bg: 'rgba(212,133,10,0.10)', action: 'coupon' },
  { id: 'order', label: '订单', icon: '📦', bg: 'rgba(65,75,94,0.08)', action: 'order' },
  { id: 'service', label: '客服', icon: '💬', bg: 'rgba(61,139,110,0.08)', action: 'service' },
  { id: 'points', label: '明细', icon: '📊', bg: 'rgba(142,116,89,0.10)', action: 'points' },
]

// 秒杀商品（静态示例）
const flashProducts = ref<Product[]>([
  { id: 1, name: '示例商品A', price: '99', image: '', type: 1 },
  { id: 2, name: '示例商品B', price: '199', image: '', type: 1 },
  { id: 3, name: '示例商品C', price: '299', image: '', type: 1 },
])

const mallPortals = [
  {
    id: 'consume',
    name: '消费商城',
    desc: '精选商品 消费即返积分',
    icon: '购',
    gradient: 'linear-gradient(135deg, #2F3542 0%, #3D4656 100%)',
    type: 1,
  },
  {
    id: 'exchange',
    name: '换购商城',
    desc: '积分抵现 超值换购',
    icon: '换',
    gradient: 'linear-gradient(135deg, #3D3024 0%, #5C4A32 100%)',
    type: 2,
  },
  {
    id: 'redeem',
    name: '兑换商城',
    desc: '积分全额兑换 零元好物',
    icon: '兑',
    gradient: 'linear-gradient(135deg, #1E2530 0%, #2F3A4A 100%)',
    type: 3,
  },
]

const hotCategories = ref<Category[]>([])

// 类型标签
function typeLabel(type?: number) {
  return type === 1 ? '购' : type === 2 ? '换' : '兑'
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
  loadProducts()
  loadHotCategories()
  startCountdown()
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (loggedIn.value) assetStore.fetchBalance()
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

// 触底加载
onReachBottom(() => {
  loadProducts(false)
})

function startCountdown() {
  // 设置到下一个整点
  const now = new Date()
  const next = new Date(now)
  next.setMinutes(0, 0, 0)
  const hour = next.getHours()
  if (hour >= 20) {
    next.setDate(next.getDate() + 1)
    next.setHours(10, 0, 0, 0)
  } else if (hour >= 15) {
    next.setHours(20, 0, 0, 0)
  } else if (hour >= 10) {
    next.setHours(15, 0, 0, 0)
  } else {
    next.setHours(10, 0, 0, 0)
  }

  function update() {
    const diff = next.getTime() - Date.now()
    if (diff <= 0) {
      // 重置到下一场
      next.setHours(next.getHours() + 5)
      return
    }
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    countdownHours.value = String(h).padStart(2, '0')
    countdownMinutes.value = String(m).padStart(2, '0')
    countdownSeconds.value = String(s).padStart(2, '0')
  }

  update()
  countdownTimer = setInterval(update, 1000)
}

async function loadProducts(reset = false) {
  if (reset) { page.value = 1; hasMore.value = true }
  if (!hasMore.value || loadMoreLoading.value) return
  loadMoreLoading.value = true
  try {
    const res = await productApi.getList({ type: 1, limit: PAGE_SIZE, page: page.value })
    const list: Product[] = (res.list || []).slice(0, 4)
    if (reset) products.value = list
    else products.value.push(...list)
    hasMore.value = list.length === PAGE_SIZE
    page.value++
  } catch {
    if (reset) products.value = []
    hasMore.value = false
  } finally {
    loadMoreLoading.value = false
  }
}

async function loadHotCategories() {
  try {
    const res = await productApi.getCategories()
    const bgPalettes = [
      'rgba(184,152,118,0.12)',
      'rgba(65,75,94,0.08)',
      'rgba(142,116,89,0.10)',
      'rgba(65,75,94,0.08)',
    ]
    hotCategories.value = (res || []).slice(0, 8).map((cat: Category, idx: number) => ({
      id: cat.id,
      name: cat.name,
      icon: (cat as { icon?: string }).icon || '📦',
      bg: bgPalettes[idx % bgPalettes.length],
    }))
  } catch {
    hotCategories.value = []
  }
}

function toggleHidden() { hidden.value = !hidden.value }
function goSearch() { uni.navigateTo({ url: '/pages/search/index' }) }
function goWealth() { uni.switchTab({ url: '/pages/wealth/index' }) }
function goPoints() { uni.navigateTo({ url: '/pages/user/points-detail' }) }
function goInvite() { uni.navigateTo({ url: '/pages/user/invite' }) }
function goCatalog() { uni.switchTab({ url: '/pages/catalog/index' }) }
function goFlashSale() { uni.navigateTo({ url: '/pages/activity/flash-sale' }) }
function goMember() { uni.navigateTo({ url: '/pages/user/level' }) }
function goMall(mall: { type: number }) {
  uni.navigateTo({ url: `/pages/catalog/index?type=${mall.type}` })
}
function goCatalogCategory(cat: { id: string | number }) {
  if (cat.id) uni.navigateTo({ url: `/pages/catalog/index?categoryId=${cat.id}` })
}
function goProduct(p: Product) {
  if (p.id) uni.navigateTo({ url: `/pages/product/detail?id=${p.id}&type=${p.type || 1}` })
}

function onQuickAction(item: { action: string }) {
  const routes: Record<string, string> = {
    recharge: '/pages/wallet/recharge',
    withdraw: '/pages/wallet/withdraw',
    transfer: '/pages/wallet/transfer',
    signin: '/pages/user/sign-in',
    invite: '/pages/user/invite',
    coupon: '/pages/coupon/list',
    order: '/pages/order/list',
    service: '/pages/user/service',
    points: '/pages/user/points-detail',
  }
  const url = routes[item.action]
  if (url) uni.navigateTo({ url })
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

// ========== 1. 资产状态聚合卡 ==========
.asset-panel {
  padding: 0 $spacing-base 0;
  margin-bottom: -16rpx;
  position: relative;
  z-index: 10;
}

.asset-panel__card {
  position: relative;
  padding: 28rpx 32rpx 20rpx;
  background: $asset-card-bg;
  border: 1rpx solid $asset-card-border;
  border-radius: $radius-2xl;
  box-shadow: $asset-card-shadow;
  overflow: hidden;
}

.asset-panel__glow {
  position: absolute;
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  pointer-events: none;
  &--tl {
    top: -60rpx;
    left: -40rpx;
    background: radial-gradient(circle, rgba(196,165,123,0.14) 0%, transparent 70%);
  }
  &--br {
    bottom: -80rpx;
    right: -40rpx;
    width: 240rpx;
    height: 240rpx;
    background: radial-gradient(circle, rgba(65,75,94,0.4) 0%, transparent 70%);
  }
}

.asset-panel__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20rpx;
  position: relative;
  z-index: 1;
}

.asset-panel__balance {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.asset-panel__balance-label {
  font-size: $asset-label-size;
  color: $asset-label-color;
  font-weight: $asset-label-weight;
}

.asset-panel__balance-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.asset-panel__balance-value {
  font-family: $asset-balance-font;
  font-size: 52rpx;
  font-weight: $asset-balance-weight;
  color: $asset-balance-color;
  font-variant-numeric: tabular-nums;
  letter-spacing: -1rpx;
  line-height: 1;
}

.asset-panel__eye {
  .asset-panel__eye-icon {
    font-size: 32rpx;
    color: $asset-eye-color;
  }
}

.asset-panel__sub {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
}

.asset-panel__sub-label {
  font-size: 20rpx;
  color: rgba(255,255,255,0.45);
}

.asset-panel__sub-value {
  font-size: 24rpx;
  font-weight: 600;
  color: $asset-profit-color;
  font-variant-numeric: tabular-nums;
}

.asset-panel__points {
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(255,255,255,0.05);
  border: 1rpx solid rgba(255,255,255,0.06);
  border-radius: $radius-lg;
  padding: 16rpx 20rpx;
  position: relative;
  z-index: 1;
}

.asset-panel__point-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 0 20rpx;
}

.asset-panel__point-value {
  font-family: $asset-balance-font;
  font-size: 28rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  &--eco { color: rgba(212,196,174,0.9); }
  &--consumer { color: rgba(212,180,131,0.95); }
}

.asset-panel__point-label {
  font-size: 18rpx;
  color: rgba(255,255,255,0.45);
  white-space: nowrap;
}

.asset-panel__point-divider {
  width: 1rpx;
  height: 48rpx;
  background: rgba(255,255,255,0.08);
}

.asset-panel__actions {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(255,255,255,0.06);
  position: relative;
  z-index: 1;
}

.asset-panel__action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  flex: 1;
  cursor: pointer;
  &:active { opacity: 0.7; }
}

.asset-panel__action-icon {
  font-size: 32rpx;
}

.asset-panel__action-text {
  font-size: 20rpx;
  color: rgba(255,255,255,0.55);
  font-weight: 500;
}

// ========== 2. Hero 品牌大卡 ==========
.hero-section {
  padding: 0 $spacing-base;
  margin-bottom: $spacing-sm;
}

.hero-card {
  position: relative;
  border-radius: $radius-2xl;
  overflow: hidden;
  height: 340rpx;
  box-shadow: $shadow-fire;
}

.hero-card__bg {
  position: absolute;
  inset: 0;
}

.hero-card__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, #1E2433 0%, #2A3142 40%, #3D3024 100%);
}

.hero-card__shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(196,165,123,0.06) 50%,
    transparent 70%
  );
  animation: hero-shimmer 4s ease-in-out infinite;
}

@keyframes hero-shimmer {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

.hero-card__particles {
  position: absolute;
  inset: 0;
}

.hero-particle {
  position: absolute;
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: rgba(196,165,123,0.4);

  &--1 { top: 20%; left: 15%; animation: float-particle 6s ease-in-out infinite; }
  &--2 { top: 60%; left: 80%; animation: float-particle 8s ease-in-out infinite 1s; width: 4rpx; height: 4rpx; }
  &--3 { top: 30%; left: 70%; animation: float-particle 5s ease-in-out infinite 0.5s; }
  &--4 { top: 70%; left: 30%; animation: float-particle 7s ease-in-out infinite 2s; width: 8rpx; height: 8rpx; }
  &--5 { top: 45%; left: 50%; animation: float-particle 6s ease-in-out infinite 1.5s; }
  &--6 { top: 15%; left: 60%; animation: float-particle 9s ease-in-out infinite 3s; width: 5rpx; height: 5rpx; }
}

@keyframes float-particle {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
  50% { transform: translateY(-20rpx) scale(1.2); opacity: 0.8; }
}

.hero-card__content {
  position: relative;
  z-index: 2;
  padding: 40rpx 40rpx 0;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.hero-card__badge {
  display: inline-flex;
  align-items: center;
  background: rgba(196,165,123,0.15);
  border: 1rpx solid rgba(196,165,123,0.25);
  border-radius: $radius-full;
  padding: 6rpx 16rpx;
  align-self: flex-start;
}

.hero-card__badge-text {
  font-size: 18rpx;
  font-weight: 600;
  color: $bronze-light;
  letter-spacing: 1rpx;
}

.hero-card__title {
  font-size: 56rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 4rpx;
  line-height: 1.1;
}

.hero-card__slogan {
  font-size: 26rpx;
  color: rgba(255,255,255,0.6);
  letter-spacing: 2rpx;
}

.hero-card__tags {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}

.hero-tag {
  display: flex;
  align-items: center;
  gap: 6rpx;
  .hero-tag__icon { font-size: 22rpx; }
  .hero-tag__text {
    font-size: 20rpx;
    color: rgba(255,255,255,0.55);
  }
}

.hero-search {
  position: absolute;
  bottom: 24rpx;
  left: 32rpx;
  right: 32rpx;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 72rpx;
  padding: 0 24rpx;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1rpx solid rgba(255,255,255,0.15);
  border-radius: $radius-full;
  cursor: pointer;
  &:active { background: rgba(255,255,255,0.18); }
}

.hero-search__icon {
  font-size: 28rpx;
  color: rgba(255,255,255,0.5);
}

.hero-search__placeholder {
  flex: 1;
  font-size: 26rpx;
  color: rgba(255,255,255,0.45);
}

// ========== 3. 实时数据横幅 ==========
.data-strip {
  margin: $spacing-sm $spacing-base 0;
  display: flex;
  align-items: center;
  padding: 14rpx 24rpx;
  background: rgba(47,53,66,0.92);
  border-radius: $radius-full;
  overflow: hidden;
}

.data-strip__left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  overflow: hidden;
}

.data-strip__live {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
}

.data-strip__dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: $accent;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.data-strip__live-text {
  font-size: 18rpx;
  font-weight: 700;
  color: $accent-light;
  letter-spacing: 0.5rpx;
}

.data-strip__track {
  overflow: hidden;
  flex: 1;
}

.data-strip__content {
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: max-content;
  animation: data-marquee 20s linear infinite;
}

@keyframes data-marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-33.33%); }
}

.data-strip__text {
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
  white-space: nowrap;
}

.data-strip__separator {
  font-size: 20rpx;
  color: rgba(255,255,255,0.25);
}

// ========== 4. 金刚区 3×3 ==========
.quick-grid-section {
  padding: $spacing-base $spacing-base 0;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rpx;
  background: $border-light;
  border-radius: $radius-xl;
  overflow: hidden;
  border: 1rpx solid $border-light;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 28rpx 16rpx;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  transition: background 0.2s ease;
  position: relative;
  &:active { background: rgba(255,255,255,0.85); }
}

.quick-item__icon-wrap {
  position: relative;
  width: 72rpx;
  height: 72rpx;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-item__icon {
  font-size: 36rpx;
}

.quick-item__badge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 6rpx;
  background: $danger;
  border-radius: $radius-full;
  font-size: 16rpx;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-item__label {
  font-size: 22rpx;
  font-weight: 600;
  color: $text-secondary;
}

// ========== 5. 限时活动双卡片 ==========
.activity-row {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-base $spacing-base 0;
}

.activity-card {
  flex: 1;
  position: relative;
  border-radius: $radius-xl;
  overflow: hidden;
  padding: 24rpx;
  min-height: 200rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  &:active { transform: scale(0.98); }
}

.activity-card__glow {
  position: absolute;
  top: -40%;
  right: -20%;
  width: 70%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,80,80,0.15) 0%, transparent 70%);
  pointer-events: none;
  &--gold {
    background: radial-gradient(circle, rgba(196,165,123,0.2) 0%, transparent 70%);
  }
}

// 限时秒杀
.activity-card--flash {
  background: linear-gradient(145deg, #2F3542 0%, #1E2433 100%);
  border: 1rpx solid rgba(255,80,80,0.15);
  box-shadow: 0 8rpx 32rpx rgba(47,53,66,0.15);
}

.activity-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.activity-card__title-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.activity-card__title {
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
}

.activity-card__hot-tag {
  .activity-card__hot-icon { font-size: 24rpx; }
}

.countdown {
  display: flex;
  align-items: center;
  gap: 2rpx;
}

.countdown__unit {
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 6rpx;
  background: rgba(255,80,80,0.2);
  border: 1rpx solid rgba(255,80,80,0.3);
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: #FF6B6B;
  display: flex;
  align-items: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}

.countdown__sep {
  font-size: 22rpx;
  font-weight: 700;
  color: rgba(255,80,80,0.5);
  margin: 0 2rpx;
}

.activity-card__desc {
  font-size: 20rpx;
  color: rgba(255,255,255,0.45);
  position: relative;
  z-index: 1;
}

.activity-card__products {
  display: flex;
  gap: 12rpx;
  margin-top: auto;
  position: relative;
  z-index: 1;
}

.activity-product {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.activity-product__img {
  width: 80rpx;
  height: 80rpx;
  border-radius: $radius-md;
  background: rgba(255,255,255,0.08);
  border: 1rpx solid rgba(255,255,255,0.08);
}

.activity-product__price {
  font-size: 20rpx;
  font-weight: 700;
  color: $accent-light;
}

// 会员专区
.activity-card--member {
  background: linear-gradient(145deg, #2A2418 0%, #1E1810 100%);
  border: 1rpx solid rgba(196,165,123,0.2);
  box-shadow: 0 8rpx 32rpx rgba(47,53,66,0.12);
}

.activity-card__vip-icon {
  font-size: 28rpx;
}

.activity-card__member-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: auto;
  position: relative;
  z-index: 1;
}

.activity-card__level {
  font-size: 28rpx;
  font-weight: 800;
  color: $bronze-light;
  font-variant-numeric: tabular-nums;
}

.activity-card__progress {
  flex: 1;
  height: 8rpx;
  background: rgba(255,255,255,0.08);
  border-radius: 4rpx;
  overflow: hidden;
}

.activity-card__progress-bar {
  height: 100%;
  background: $accent-gradient;
  border-radius: 4rpx;
  transition: width 0.5s ease;
}

.activity-card__progress-text {
  font-size: 18rpx;
  color: rgba(255,255,255,0.45);
  font-variant-numeric: tabular-nums;
}

.activity-card__cta {
  font-size: 22rpx;
  color: $bronze-light;
  font-weight: 600;
  position: relative;
  z-index: 1;
  &:active { opacity: 0.7; }
}

// ========== 6. 三大商城入口 ==========
.mall-section {
  padding: $spacing-base $spacing-base 0;
}

.mall-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-base;
}

.mall-section__title {
  font-size: 32rpx;
  font-weight: 700;
  color: $mineral-gray;
}

.mall-section__more {
  font-size: 24rpx;
  color: $text-muted;
  &:active { opacity: 0.6; }
}

.mall-cards {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.mall-card {
  position: relative;
  border-radius: $radius-xl;
  overflow: hidden;
  height: 140rpx;
  cursor: pointer;
  &:active { transform: scale(0.99); }
}

.mall-card__bg {
  position: absolute;
  inset: 0;
}

.mall-card__glow {
  position: absolute;
  top: -30%;
  right: -5%;
  width: 50%;
  height: 100%;
  background: radial-gradient(circle, rgba(184,152,118,0.15) 0%, transparent 70%);
  pointer-events: none;
}

.mall-card__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: 28rpx $spacing-lg;
  height: 140rpx;
  box-sizing: border-box;
}

.mall-card__icon-wrap {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  border-radius: $radius-lg;
  border: 1rpx solid rgba(255,255,255,0.12);
  flex-shrink: 0;
  .mall-card__icon {
    font-size: 32rpx;
    font-weight: 800;
    color: $bronze-light;
  }
}

.mall-card__info {
  flex: 1;
  .mall-card__name {
    display: block;
    font-size: 30rpx;
    font-weight: 700;
    color: $bronze-light;
    margin-bottom: 4rpx;
  }
  .mall-card__desc {
    display: block;
    font-size: 22rpx;
    color: rgba(255,255,255,0.5);
  }
}

.mall-card__arrow {
  font-size: 36rpx;
  color: rgba(255,255,255,0.3);
  font-weight: 300;
}

// ========== 7. 热门分类（网格化） ==========
.category-section {
  padding: $spacing-lg $spacing-base 0;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-base;
}

.section-head__left {
  display: flex;
  align-items: center;
  gap: 12rpx;
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

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-sm;
}

.category-grid__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  cursor: pointer;
  &:active { opacity: 0.7; }
}

.category-grid__icon-wrap {
  width: 96rpx;
  height: 96rpx;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $clay-shadow;
  border: 1rpx solid rgba(255,255,255,0.7);
  &--skeleton {
    background: $bg-tertiary;
    animation: shim 1.4s ease-in-out infinite;
  }
}

.category-grid__icon {
  font-size: 36rpx;
}

.category-grid__name {
  font-size: 22rpx;
  color: $text-secondary;
  font-weight: 500;
  text-align: center;
}

.category-grid__name-skeleton {
  width: 60rpx;
  height: 22rpx;
  background: $bg-tertiary;
  border-radius: 6rpx;
  animation: shim 1.4s ease-in-out infinite;
}

// ========== 8. 精品推荐 ==========
.section-block {
  padding: $spacing-lg $spacing-base 0;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
}

.product-card {
  position: relative;
  border-radius: $radius-lg;
  overflow: hidden;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255,255,255,0.6);
  box-shadow: $clay-shadow;
  transition: transform 0.2s ease;
  &:active { transform: scale(0.97); }

  &--tall {
    .product-card__img-wrap {
      aspect-ratio: 4 / 3;
    }
  }
}

.product-card__img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.product-card__img {
  width: 100%;
  height: 100%;
  display: block;
  background: $bg-tertiary;
}

.product-card__sales {
  position: absolute;
  bottom: 8rpx;
  left: 8rpx;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  border-radius: $radius-full;
  padding: 4rpx 12rpx;
  .product-card__sales-text {
    font-size: 16rpx;
    color: rgba(255,255,255,0.85);
    font-weight: 500;
  }
}

.product-card__type-badge {
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
  &--1 { background: $warm-yellow; color: $accent-dark; border-color: $border-primary; }
  &--2 { background: rgba(47,53,66,0.88); color: $bronze-light; border-color: rgba(47,53,66,0.3); }
  &--3 { background: $mineral-gray; color: $bronze-light; border-color: rgba(47,53,66,0.3); }
}

.product-card__info {
  padding: 16rpx;
}

.product-card__name {
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

.product-card__price-row {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.product-card__cash {
  font-family: $asset-balance-font;
  font-size: 28rpx;
  font-weight: 700;
  color: $mineral-gray;
  font-variant-numeric: tabular-nums;
}

.product-card__points {
  font-size: 20rpx;
  color: $accent-dark;
  font-weight: 600;
}

// ========== 骨架屏 & 加载状态 ==========
@keyframes shim {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.7; }
}

.load-more-tip,
.no-more-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0;
}

.load-more-tip__text,
.no-more-tip__text {
  font-size: 24rpx;
  color: $text-muted;
}

.safe-area-bottom {
  width: 100%;
}
</style>
