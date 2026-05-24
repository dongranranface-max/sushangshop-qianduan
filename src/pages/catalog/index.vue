<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-title">商品分类</text>
      <view class="page-search-icon" @click="goSearch">⌕</view>
    </view>

    <!-- Tab 切换（三大商城） -->
    <view class="mall-tabs">
      <view
        v-for="tab in mallTabs"
        :key="tab.key"
        class="mall-tab"
        :class="{ active: currentType === tab.key }"
        @click="switchType(tab.key)"
      >
        <text class="mall-tab__abbr">{{ tab.abbr }}</text>
        <text class="mall-tab__label">{{ tab.label }}</text>
      </view>
    </view>

    <!-- 主内容 -->
    <view class="content-layout">
      <!-- 左侧商城服务入口 -->
      <scroll-view class="service-nav" scroll-y>
        <view
          v-for="svc in services"
          :key="svc.id"
          class="service-item"
          :class="{ active: currentService === svc.id }"
          @click="selectService(svc)"
        >
          <view class="service-icon-wrap">
            <text class="service-icon">{{ svc.icon }}</text>
          </view>
          <view class="service-info">
            <text class="service-name">{{ svc.name }}</text>
            <text class="service-sub">{{ svc.desc }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 右侧产品分类 -->
      <scroll-view class="product-area" scroll-y @scrolltolower="loadMore">
        <!-- 骨架屏 -->
        <view v-if="loading && !categories.length" class="category-grid">
          <view v-for="i in 6" :key="i" class="sk-card">
            <view class="sk-img shimmer" />
            <view class="sk-info">
              <view class="sk-line shimmer" />
              <view class="sk-line sk-short shimmer" />
            </view>
          </view>
        </view>

        <!-- 产品分类 -->
        <view v-else-if="currentService === 'products'" class="category-grid">
          <HomeProductCard
            v-for="p in products"
            :key="p.id"
            :product="p"
            :type="currentType"
            :default-cover="defaultCover"
            @click="goProduct(p)"
          />
        </view>

        <!-- 商城服务下的分类列表 -->
        <view v-else class="category-list">
          <view
            v-for="cat in categories"
            :key="cat.id"
            class="cat-card"
            @click="goCategoryProducts(cat)"
          >
            <image class="cat-img" :src="cat.coverImage || '/static/logo.png'" mode="aspectFill" />
            <view class="cat-info">
              <text class="cat-name">{{ cat.name }}</text>
              <text class="cat-count">{{ cat.productCount || 0 }} 件商品</text>
            </view>
            <text class="cat-arrow">›</text>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && currentService !== 'products' && !categories.length" class="empty-state">
          <view class="empty-state__icon">分</view>
          <text class="empty-state__text">暂无分类</text>
        </view>

        <view v-if="hasMore && !loading" class="load-more" @click="loadMore">
          <text>加载更多</text>
        </view>
        <view v-if="!hasMore && categories.length > 0" class="no-more">
          <text>— 没有更多了 —</text>
        </view>
      </scroll-view>
    </view>

    <view class="safe-area-bottom" :style="{ height: (100 + safeAreaBottom) + 'px' }" />

    <LuxuryTabbar />
    <AssetStatusBar v-if="loggedIn" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { productApi } from '@/utils/api'
import { checkAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'
import { HOME_CATEGORY_FALLBACK, flattenCategories, normalizeCategoryTree } from '@/utils/category'
import { DEFAULT_PRODUCT_COVER } from '@/utils/media';
import LuxuryTabbar from '@/components/LuxuryTabbar.vue'
import AssetStatusBar from '@/components/AssetStatusBar.vue'
import HomeProductCard from '@/components/HomeProductCard.vue'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const loggedIn = ref(checkAuth())
const currentType = ref(1)
const currentService = ref('consume')
const services = ref<any[]>([])
const categories = ref<any[]>([])
const products = ref<any[]>([])
const defaultCover = DEFAULT_PRODUCT_COVER
const loading = ref(false)
const page = ref(1)
const limit = 20
const hasMore = ref(true)
let categorySeq = 0

const mallTabs = [
  { key: 1, abbr: '消', label: '消费' },
  { key: 2, abbr: '换', label: '换购' },
  { key: 3, abbr: '兑', label: '兑换' },
]

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
  loadPreset()
  loadServices()
  loadCategories()
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (loggedIn.value) assetStore.fetchBalance()
})

function loadPreset() {
  try {
    const preset = uni.getStorageSync('CATALOG_PRESET_KEY')
    if (preset) {
      if (preset.type) currentType.value = preset.type
      if (preset.service) currentService.value = preset.service
      uni.removeStorageSync('CATALOG_PRESET_KEY')
    }
  } catch {}
}

async function loadServices() {
  services.value = [
    { id: 'consume', name: '消费分类', icon: '购', desc: '精选好物' },
    { id: 'exchange', name: '换购分类', icon: '换', desc: '积分抵现' },
    { id: 'redeem', name: '兑换分类', icon: '兑', desc: '零元兑换' },
    { id: 'products', name: '全部商品', icon: '◆', desc: '查看所有商品' },
  ]
}

async function loadCategories() {
  const seq = ++categorySeq
  try {
    const res = await productApi.getCategories()
    if (seq !== categorySeq) return
    const tree = normalizeCategoryTree(res)
    const flat = flattenCategories(tree)
    categories.value = flat.length ? flat : HOME_CATEGORY_FALLBACK
  } catch {
    if (seq !== categorySeq) return
    categories.value = HOME_CATEGORY_FALLBACK
  }
}

async function loadProducts(reset = false) {
  if (loading.value) return
  if (reset) { page.value = 1; hasMore.value = true }
  if (!hasMore.value) return
  loading.value = true
  try {
    const res = await productApi.getList({ type: currentType.value, page: page.value, limit })
    const list = res.list || []
    if (reset) products.value = list
    else products.value.push(...list)
    hasMore.value = list.length === limit
    page.value++
  } catch {
    if (reset) products.value = []
  } finally {
    loading.value = false
  }
}

function switchType(type: number) {
  if (currentType.value === type) return
  currentType.value = type
  if (currentService.value === 'products') {
    loadProducts(true)
  } else {
    loadCategories()
  }
}

function selectService(svc: any) {
  currentService.value = svc.id
  if (svc.id === 'products') {
    loadProducts(true)
  } else {
    // 切换商城类型
    const typeMap: Record<string, number> = { consume: 1, exchange: 2, redeem: 3 }
    if (typeMap[svc.id]) {
      currentType.value = typeMap[svc.id]
    }
    loadCategories()
  }
}

function loadMore() {
  if (currentService.value === 'products' && hasMore.value && !loading.value) {
    loadProducts(false)
  }
}

function goSearch() { uni.navigateTo({ url: '/pages/search/index' }) }
function goProduct(p: any) { uni.navigateTo({ url: `/pages/product/detail?id=${p.id}&type=${currentType.value}` }) }
function goCategoryProducts(cat: any) {
  uni.navigateTo({ url: `/pages/catalog/index?categoryId=${cat.id}&type=${currentType.value}` })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, #F9F9F9 0%, #F0EDE8 100%);
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.status-bar { width: 100%; }

// ========== 顶部标题 ==========
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx $spacing-base;

  .page-title {
    font-size: 36rpx;
    font-weight: 700;
    color: $mineral-gray;
    letter-spacing: 0.5rpx;
  }

  .page-search-icon {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(12px);
    border: 1rpx solid rgba(20, 20, 20, 0.06);
    border-radius: 50%;
    font-size: 32rpx;
    color: $mineral-gray;
  }
}

// ========== 三大商城 Tab ==========
.mall-tabs {
  display: flex;
  padding: 0 $spacing-base $spacing-base;
  gap: 12rpx;
}

.mall-tab {
  flex: 1;
  height: 88rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
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

  &__abbr {
    width: 36rpx;
    height: 36rpx;
    line-height: 36rpx;
    text-align: center;
    font-size: 20rpx;
    font-weight: 800;
    background: $bg-tertiary;
    border-radius: 50%;
    color: $mineral-gray;
  }

  &.active &__abbr {
    background: $accent-dark;
    color: $bronze-light;
  }

  &__label {
    font-size: 22rpx;
    font-weight: 500;
    color: $text-muted;
  }
}

// ========== 内容布局 ==========
.content-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  height: calc(100vh - 320rpx);
}

// ========== 左侧服务导航 ==========
.service-nav {
  width: 180rpx;
  height: 100%;
  border-right: 1rpx solid rgba(20, 20, 20, 0.04);
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 12rpx;
  border-left: 4rpx solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;

  &.active {
    background: rgba(255, 255, 255, 0.9);
    border-left-color: $accent-dark;

    .service-name { color: $accent-dark; font-weight: 700; }
  }
}

.service-icon-wrap {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(184, 152, 118, 0.08);
  border-radius: $radius-md;
  border: 1rpx solid rgba(184, 152, 118, 0.12);

  .service-icon {
    font-size: 24rpx;
    font-weight: 800;
    color: $accent-dark;
  }
}

.service-info {
  text-align: center;

  .service-name {
    display: block;
    font-size: 22rpx;
    font-weight: 600;
    color: $text-secondary;
    line-height: 1.3;
  }

  .service-sub {
    display: block;
    font-size: 18rpx;
    color: $text-muted;
    line-height: 1.3;
  }
}

// ========== 右侧产品区 ==========
.product-area {
  flex: 1;
  height: 100%;
  padding: $spacing-base;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
}

.sk-card {
  background: rgba(255, 255, 255, 0.7);
  border-radius: $radius-lg;
  overflow: hidden;

  .sk-img {
    width: 100%;
    aspect-ratio: 1 / 1;
    background: $bg-tertiary;
  }

  .sk-info {
    padding: $spacing-base;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
  }

  .sk-line {
    height: 22rpx;
    border-radius: 8rpx;
    background: $bg-tertiary;
    width: 80%;

    &.sk-short { width: 40%; }
  }
}

.shimmer { animation: shim 1.4s ease-in-out infinite; }

@keyframes shim {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.7; }
}

// ========== 分类卡片 ==========
.category-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.cat-card {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: $spacing-base;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  transition: transform 0.2s ease;

  &:active { transform: scale(0.98); }
}

.cat-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: $radius-md;
  background: $bg-tertiary;
  flex-shrink: 0;
}

.cat-info {
  flex: 1;

  .cat-name {
    display: block;
    font-size: 28rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 6rpx;
  }

  .cat-count {
    display: block;
    font-size: 22rpx;
    color: $text-muted;
  }
}

.cat-arrow {
  font-size: 36rpx;
  color: $text-muted;
  flex-shrink: 0;
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
  padding: 120rpx 40rpx;
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
  }
}

.safe-area-bottom { width: 100%; }
</style>
