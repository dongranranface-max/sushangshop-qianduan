<template>
  <view class="page">

    <!-- 1. 头部导航 -->
    <header class="header">
      <view class="header__inner">
        <view class="header__brand">
          <view class="header__logo"><text class="header__logo-text">集</text></view>
          <text class="header__brand-name">集享公社</text>
        </view>
        <view class="header__search" @click="goSearch">
          <text class="header__search-icon">⌕</text>
          <text class="header__search-text">搜索商品/服务</text>
        </view>
      </view>
    </header>

    <!-- 2. Banner 轮播 -->
    <BannerCarousel :banners="banners" height="320rpx" @click="onBannerClick" />

    <!-- 3. 四大功能图标 -->
    <section class="section func-grid-section">
      <view class="func-grid">
        <view v-for="item in funcModules" :key="item.id" class="func-item" @click="onFuncClick(item)">
          <view class="func-item__icon-wrap" :style="{ background: item.bg }">
            <text class="func-item__icon">{{ item.icon }}</text>
          </view>
          <text class="func-item__label">{{ item.label }}</text>
          <text class="func-item__sub">{{ item.sub }}</text>
        </view>
      </view>
    </section>

    <!-- 3.5 限时秒杀入口 -->
    <section class="section flash-entry" @click="goFlash">
      <view class="flash-entry__inner">
        <view class="flash-entry__left">
          <text class="flash-entry__icon">⚡</text>
          <view class="flash-entry__text">
            <text class="flash-entry__title">限时秒杀</text>
            <text class="flash-entry__sub">限时限量，抢完即止</text>
          </view>
        </view>
        <view class="flash-entry__right">
          <text class="flash-entry__btn">立即抢购</text>
        </view>
      </view>
    </section>

    <!-- 4. 热门分类 -->
    <section class="section">
      <view class="section__head">
        <text class="section__title">热门分类</text>
        <text class="section__more" @click="goCatalog">查看全部 ›</text>
      </view>
      <view v-if="categories.length === 0" class="category-skeleton">
        <view v-for="i in 8" :key="i" class="category-skeleton__item">
          <view class="category-skeleton__icon" />
          <view class="category-skeleton__name" />
        </view>
      </view>
      <view v-else class="category-grid">
        <view v-for="cat in categories" :key="cat.id" class="category-card" @click="goCategory(cat)">
          <view class="category-card__icon-wrap" :style="{ background: cat.bg }">
            <text class="category-card__icon">{{ cat.icon }}</text>
          </view>
          <text class="category-card__name">{{ cat.name }}</text>
        </view>
      </view>
    </section>

    <!-- 5. 精品推荐 -->
    <section class="section">
      <view class="section__head">
        <text class="section__title">精品推荐</text>
        <text class="section__more" @click="goCatalog">查看全部 ›</text>
      </view>
      <view v-if="loading && products.length === 0" class="product-skeleton">
        <view v-for="i in 6" :key="i" class="product-skeleton__item">
          <view class="product-skeleton__img" />
          <view class="product-skeleton__title" />
          <view class="product-skeleton__price" />
        </view>
      </view>
      <view v-else class="product-grid">
        <view v-for="p in products" :key="p.id" class="product-card" @click="goProduct(p)">
          <view class="product-card__img-wrap">
            <image class="product-card__img" :src="resolveCover(p)" mode="aspectFill" lazy-load />
            <view class="product-card__badge" :class="`product-card__badge--${p.type || 0}`">
              <text>{{ typeLabel(p.type) }}</text>
            </view>
            <view v-if="p.salesCount" class="product-card__sales">
              <text>已售 {{ p.salesCount }}</text>
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
      <view v-if="loadMoreLoading" class="load-tip"><text>加载中...</text></view>
      <view v-else-if="!hasMore && products.length > 0" class="load-tip load-tip--end"><text>— 没有更多了 —</text></view>
    </section>

    <!-- 6. 底部安全区 -->
    <view class="safe-bottom" :style="{ height: (120 + safeAreaBottom) + 'px' }" />

    <LuxuryTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow, onReachBottom } from '@dcloudio/uni-app'
import { productApi, marketingApi, type Banner, type ProductCategory } from '@/utils/api'
import { checkAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'
import { resolveProductCover } from '@/utils/media'
import LuxuryTabbar from '@/components/LuxuryTabbar.vue'
import BannerCarousel from '@/components/BannerCarousel.vue'

const safeAreaBottom = ref(0)
const loggedIn = ref(false)
const loading = ref(false)
const loadMoreLoading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const PAGE_SIZE = 6

const banners = ref<Array<{ id: number; image: string; link?: string }>>([])

const funcModules = [
  { id: 'ji',   label: '集', sub: '积分聚合',   icon: '集', bg: 'rgba(196,165,123,0.12)', action: '/pages/catalog/index?type=0' },
  { id: 'gou',  label: '购', sub: '消费返积分', icon: '购', bg: 'rgba(61,139,110,0.10)',  action: '/pages/catalog/index?type=1' },
  { id: 'huan', label: '换', sub: '积分抵现',   icon: '换', bg: 'rgba(65,75,94,0.10)',   action: '/pages/catalog/index?type=2' },
  { id: 'dui',  label: '兑', sub: '积分兑换',   icon: '兑', bg: 'rgba(142,116,89,0.10)', action: '/pages/catalog/index?type=3' },
]

const categories = ref<Array<{ id: number; name: string; icon: string; bg: string }>>([])

const products = ref<Array<{
  id: number; name: string; price: number; requiredPoints?: number;
  type?: number; salesCount?: number; coverImage?: string; image?: string
}>>([])

function typeLabel(type?: number) {
  if (type === 1) return '购'
  if (type === 2) return '换'
  if (type === 3) return '兑'
  return '集'
}

function resolveCover(p: { coverImage?: string; image?: string }) {
  return resolveProductCover(p)
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
  loadBanners()
  loadCategories()
  loadProducts()
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (loggedIn.value) assetStore.fetchBalance()
})

onReachBottom(() => { loadProducts(false) })

async function loadBanners() {
  try {
    const res = await marketingApi.getBanners()
    banners.value = (res || []).map((b: Banner) => ({ id: b.id, image: b.image || '', link: b.link || '' }))
  } catch { banners.value = [] }
}

async function loadCategories() {
  try {
    const res = await productApi.getCategories()
    const bgPalettes = ['rgba(184,152,118,0.12)', 'rgba(65,75,94,0.08)', 'rgba(142,116,89,0.10)', 'rgba(65,75,94,0.08)']
    categories.value = (res || []).slice(0, 8).map((cat: ProductCategory, idx: number) => ({
      id: cat.id, name: cat.name, icon: cat.icon || '📦', bg: bgPalettes[idx % bgPalettes.length],
    }))
  } catch { categories.value = [] }
}

async function loadProducts(reset = true) {
  if (reset) { page.value = 1; hasMore.value = true; loading.value = true }
  if (!hasMore.value || loadMoreLoading.value) return
  loadMoreLoading.value = true
  try {
    const res = await productApi.getList({ type: 1, limit: PAGE_SIZE, page: page.value })
    const list = (res?.list || []).slice(0, PAGE_SIZE)
    if (reset) products.value = list
    else products.value.push(...list)
    hasMore.value = list.length === PAGE_SIZE
    page.value++
  } catch {
    if (reset) products.value = []
    hasMore.value = false
  } finally { loading.value = false; loadMoreLoading.value = false }
}

function goSearch() { uni.navigateTo({ url: '/pages/search/index' }) }
function onBannerClick(item: { link?: string }) { if (item.link) uni.navigateTo({ url: item.link }) }
function onFuncClick(item: { action?: string }) { if (item.action) uni.navigateTo({ url: item.action }) }
function goCatalog() { uni.switchTab({ url: '/pages/catalog/index' }) }
function goFlash() { uni.navigateTo({ url: '/pages/marketing/flash' }) }
function goCategory(cat: { id: number }) { if (cat.id) uni.navigateTo({ url: `/pages/catalog/index?categoryId=${cat.id}` }) }
function goProduct(p: { id: number; type?: number }) { if (p.id) uni.navigateTo({ url: `/pages/product/detail?id=${p.id}&type=${p.type || 1}` }) }
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page {
  min-height: 100vh;
  background: $bg-primary;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

$gap-4: 4rpx; $gap-8: 8rpx; $gap-16: 16rpx; $gap-24: 24rpx;

// 头部导航
.header {
  position: sticky; top: 0; z-index: 100; height: 120rpx;
  padding-top: env(safe-area-inset-top);
  background: rgba(47,53,66,0.97); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
}

.header__inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 100%; padding: 0 $gap-16; box-sizing: border-box;
}

.header__brand { display: flex; align-items: center; gap: $gap-8; }

.header__logo {
  width: 64rpx; height: 64rpx; border-radius: 16rpx;
  background: linear-gradient(145deg, $accent 0%, $accent-dark 100%);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.header__logo-text { font-size: 32rpx; font-weight: 900; color: #fff; }
.header__brand-name { font-size: 34rpx; font-weight: 700; color: #fff; letter-spacing: 2rpx; }

.header__search {
  display: flex; align-items: center; gap: $gap-8; height: 72rpx; padding: 0 $gap-16;
  background: rgba(255,255,255,0.08); border: 1rpx solid rgba(255,255,255,0.12); border-radius: 36rpx; box-sizing: border-box;
  cursor: pointer; &:active { background: rgba(255,255,255,0.12); }
}

.header__search-icon { font-size: 28rpx; color: rgba(255,255,255,0.5); }
.header__search-text { font-size: 26rpx; color: rgba(255,255,255,0.45); white-space: nowrap; }

// 通用区块
.section { padding: $gap-24 $gap-16; }

.flash-entry {
  padding: $gap-16;
  &__inner {
    display: flex; align-items: center; justify-content: space-between;
    padding: $gap-16 $gap-24; border-radius: $radius-lg;
    background: linear-gradient(135deg, #c0392b 0%, #e74c3c 50%, #c0392b 100%);
    box-shadow: 0 8rpx 24rpx rgba(192,57,43,0.25); box-sizing: border-box;
  }
  &__left { display: flex; align-items: center; gap: 12rpx; }
  &__icon { font-size: 44rpx; }
  &__text { display: flex; flex-direction: column; gap: 2rpx; }
  &__title { font-size: 34rpx; font-weight: 800; color: #fff; letter-spacing: 1rpx; }
  &__sub { font-size: 22rpx; color: rgba(255,255,255,0.75); }
  &__right {}
  &__btn {
    height: 64rpx; padding: 0 28rpx; background: rgba(255,255,255,0.20); border: 2rpx solid rgba(255,255,255,0.45);
    border-radius: $radius-full; display: flex; align-items: center; justify-content: center;
    font-size: 26rpx; font-weight: 700; color: #fff; box-sizing: border-box;
    backdrop-filter: blur(8px);
  }
}

.section__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: $gap-16; }
.section__title { font-size: 32rpx; font-weight: 700; color: $mineral-gray; letter-spacing: 0.5rpx; }
.section__more { font-size: 26rpx; color: $text-muted; &:active { opacity: 0.6; } }

// 四大功能图标
.func-grid-section { padding-top: $gap-16; padding-bottom: $gap-8; }

.func-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: $gap-16; }

.func-item {
  display: flex; flex-direction: column; align-items: center; gap: $gap-8; cursor: pointer;
  &:active { opacity: 0.7; }
}

.func-item__icon-wrap {
  width: 112rpx; height: 112rpx; border-radius: 28rpx;
  display: flex; align-items: center; justify-content: center;
  box-shadow: $clay-shadow; border: 1rpx solid rgba(255,255,255,0.7); box-sizing: border-box;
}

.func-item__icon { font-size: 40rpx; font-weight: 800; color: $accent-dark; }
.func-item__label { font-size: 30rpx; font-weight: 700; color: $mineral-gray; line-height: 1; }
.func-item__sub { font-size: 20rpx; color: $text-muted; line-height: 1; }

// 热门分类
.category-skeleton { display: grid; grid-template-columns: repeat(4, 1fr); gap: $gap-16; }
.category-skeleton__item { display: flex; flex-direction: column; align-items: center; gap: $gap-8; }
.category-skeleton__icon { width: 96rpx; height: 96rpx; border-radius: 24rpx; background: $bg-tertiary; animation: shim 1.4s ease-in-out infinite; }
.category-skeleton__name { width: 60rpx; height: 22rpx; border-radius: 6rpx; background: $bg-tertiary; animation: shim 1.4s ease-in-out infinite; }

.category-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: $gap-16; }

.category-card {
  display: flex; flex-direction: column; align-items: center; gap: $gap-8; cursor: pointer;
  &:active { opacity: 0.7; }
}

.category-card__icon-wrap {
  width: 96rpx; height: 96rpx; border-radius: 24rpx;
  display: flex; align-items: center; justify-content: center;
  box-shadow: $clay-shadow; border: 1rpx solid rgba(255,255,255,0.7); box-sizing: border-box;
}

.category-card__icon { font-size: 36rpx; }

.category-card__name {
  font-size: 24rpx; font-weight: 500; color: $text-secondary;
  text-align: center; line-height: 1.2; max-width: 120rpx;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

// 精品推荐
.product-skeleton { display: grid; grid-template-columns: repeat(2, 1fr); gap: $gap-16; }
.product-skeleton__item { display: flex; flex-direction: column; gap: $gap-8; }
.product-skeleton__img { width: 100%; aspect-ratio: 1/1; border-radius: 16rpx; background: $bg-tertiary; animation: shim 1.4s ease-in-out infinite; }
.product-skeleton__title { width: 100%; height: 32rpx; border-radius: 8rpx; background: $bg-tertiary; animation: shim 1.4s ease-in-out infinite; }
.product-skeleton__price { width: 50%; height: 28rpx; border-radius: 8rpx; background: $bg-tertiary; animation: shim 1.4s ease-in-out infinite; }

.product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: $gap-16; }

.product-card {
  border-radius: 16rpx; overflow: hidden; background: $bg-secondary;
  border: 1rpx solid $border-light; box-shadow: $clay-shadow; box-sizing: border-box; cursor: pointer;
  &:active { transform: scale(0.98); }
}

.product-card__img-wrap { position: relative; width: 100%; aspect-ratio: 1/1; overflow: hidden; }
.product-card__img { width: 100%; height: 100%; display: block; background: $bg-tertiary; }

.product-card__badge {
  position: absolute; top: 12rpx; left: 12rpx; min-width: 44rpx; height: 44rpx; padding: 0 12rpx;
  border-radius: 22rpx; font-size: 22rpx; font-weight: 800;
  display: flex; align-items: center; justify-content: center; box-sizing: border-box;
  &--0 { background: rgba(196,165,123,0.15); color: $accent-dark; border: 1rpx solid $border-primary; }
  &--1 { background: $warm-yellow; color: $accent-dark; border: 1rpx solid $border-primary; }
  &--2 { background: rgba(47,53,66,0.88); color: $accent-light; border: 1rpx solid rgba(47,53,66,0.3); }
  &--3 { background: $mineral-gray; color: $accent-light; border: 1rpx solid rgba(47,53,66,0.3); }
}

.product-card__sales {
  position: absolute; bottom: 12rpx; left: 12rpx; padding: 4rpx 12rpx;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); border-radius: 20rpx;
  font-size: 18rpx; color: rgba(255,255,255,0.85); box-sizing: border-box;
}

.product-card__info { padding: $gap-16; }

.product-card__name {
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
  font-size: 28rpx; font-weight: 600; color: $text-primary; line-height: 1.4; margin-bottom: $gap-8;
}

.product-card__price-row { display: flex; align-items: baseline; gap: $gap-8; }
.product-card__cash { font-family: $font-sans; font-size: 30rpx; font-weight: 700; color: $mineral-gray; font-variant-numeric: tabular-nums; }
.product-card__points { font-size: 22rpx; font-weight: 600; color: $accent-dark; }

// 加载状态
.load-tip { display: flex; align-items: center; justify-content: center; padding: 32rpx 0; text { font-size: 26rpx; color: $text-muted; } &--end text { color: $text-muted; } }
.safe-bottom { width: 100%; }

@keyframes shim { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.7; } }
</style>
