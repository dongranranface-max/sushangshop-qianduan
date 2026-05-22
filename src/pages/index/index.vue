<template>
  <view
    class="page-container"
    :style="{ '--home-top-offset': homeTopOffset + 'px' }"
  >
    <view
      class="home-top"
      :class="{ 'home-top--scrolled': pageScrolled }"
      :style="{ paddingTop: statusBarHeight + 'px' }"
    >
      <BrandLogo size="sm" :show-text="false" />
      <view class="search-bar" @click="goSearch">
        <text class="search-bar__icon">⌕</text>
        <text class="search-bar__ph">{{ searchHint }}</text>
      </view>
      <view class="home-top__cart" @click="goCart">
        <text class="home-top__cart-t">购物车</text>
      </view>
    </view>

    <view class="page-body">
      <view class="banner-wrap">
        <swiper
          class="banner"
          indicator-dots
          indicator-active-color="#9A7B4F"
          indicator-color="rgba(0,0,0,0.1)"
          autoplay
          circular
          :interval="4500"
        >
          <swiper-item v-for="(b, i) in banners" :key="i">
            <view class="banner__slide" @click="onBanner(i)">
              <image class="banner__img" :src="b.image" mode="aspectFill" :lazy-load="i > 0" />
              <view class="banner__shade" />
              <view class="banner__content">
                <text v-if="b.tag" class="banner__tag">{{ b.tag }}</text>
                <text class="banner__title">{{ b.title }}</text>
                <text class="banner__sub">{{ b.sub }}</text>
                <view class="banner__cta" @click.stop="onBanner(i)">
                  <text>{{ b.cta }}</text>
                </view>
              </view>
              <view v-if="!loggedIn && i === 0" class="banner__login-pill" @click.stop="goLogin">
                <text>登录领积分</text>
              </view>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <view class="home-block">
        <RewardTicker variant="feed" label="动态信息" @click="goWealthTab" />
      </view>

      <view v-if="loggedIn" class="home-divider" />

      <view v-if="loggedIn" class="home-block">
        <HomeAssetStrip />
      </view>

      <view class="home-divider" />

      <view class="home-block home-section">
        <text class="home-section__title">商城服务</text>
        <MallPortalGrid @select="onPortal" />
      </view>

      <view class="home-divider" />

      <view class="home-block home-block--category">
        <view class="block-head">
          <text class="block-head__title">热门分类</text>
          <text class="block-head__more" @click="goCatalog()">全部分类 ›</text>
        </view>
        <HomeCategoryNav
          :categories="homeCategories"
          @select="onCategory"
          @all="goCatalog()"
        />
      </view>

      <view class="home-divider" />

      <view id="feed-anchor" class="home-block feed-section">
        <view class="feed-tabs feed-tabs--sticky">
          <view
            v-for="t in feedTabs"
            :key="t.type"
            class="feed-tab"
            :class="{ active: feedType === t.type }"
            @click="switchFeedTab(t.type)"
          >
            <text class="feed-tab__abbr">{{ t.abbr }}</text>
            <text class="feed-tab__label">{{ t.label }}</text>
          </view>
        </view>

        <view class="feed-head">
          <view class="feed-head__row">
            <text class="feed-head__title">{{ feedTitle }}</text>
            <text class="feed-head__more" @click="goFeedMore">查看更多 ›</text>
          </view>
          <text class="feed-head__hint">{{ feedHint }}</text>
        </view>

        <HomeProductSkeleton v-if="feedLoading" :count="4" />
        <view v-else-if="!feedList.length" class="feed-empty" @click="goCatalog()">
          <text>暂无商品，去分类逛逛 ›</text>
        </view>
        <view v-else :key="feedType" class="product-grid product-grid--fade">
          <HomeProductCard
            v-for="p in feedVisibleList"
            :key="p.id"
            :product="p"
            :type="feedType"
            :default-cover="defaultCover"
            @click="goProduct(p.id, feedType)"
          />
        </view>

        <view
          v-if="!feedLoading && !feedExpanded && feedList.length > FEED_PREVIEW"
          class="feed-more-btn"
          @click="expandFeed"
        >
          <text>展开更多 ({{ feedList.length - FEED_PREVIEW }}+)</text>
        </view>
      </view>

    </view>

    <view class="safe-area-bottom" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow, onPullDownRefresh, onPageScroll } from '@dcloudio/uni-app'
import { productApi } from '@/utils/api'
import { checkAuth, requireAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'
import BrandLogo from '@/components/BrandLogo.vue'
import MallPortalGrid from '@/components/MallPortalGrid.vue'
import type { PortalType } from '@/components/MallPortalGrid.vue'
import HomeCategoryNav from '@/components/HomeCategoryNav.vue'
import type { HomeCategory } from '@/utils/category'
import { normalizeCategoryTree, flattenCategories, HOME_CATEGORY_FALLBACK } from '@/utils/category'
import HomeAssetStrip from '@/components/HomeAssetStrip.vue'
import HomeProductCard from '@/components/HomeProductCard.vue'
import HomeProductSkeleton from '@/components/HomeProductSkeleton.vue'
import RewardTicker from '@/components/RewardTicker.vue'

const CATALOG_PRESET_KEY = 'catalog_preset'
const FEED_PREVIEW = 4

const statusBarHeight = ref(20)
const homeTopOffset = ref(56)
const pageScrolled = ref(false)
const loggedIn = ref(checkAuth())
const feedType = ref<1 | 2 | 3>(1)
const feedLoading = ref(false)
const feedExpanded = ref(false)
const homeCategories = ref<HomeCategory[]>([...HOME_CATEGORY_FALLBACK])
let categoriesLoadSeq = 0
const consumeList = ref<any[]>([])
const exchangeList = ref<any[]>([])
const redeemList = ref<any[]>([])
const defaultCover = 'https://picsum.photos/300/300?random=home'

const searchHints = ['搜索商品、品牌', '搜索换购好物', '搜索积分兑换礼']
const searchHintIdx = ref(0)
let searchTimer: ReturnType<typeof setInterval> | null = null
const searchHint = computed(() => searchHints[searchHintIdx.value])

/** 16:9 专题图 + 底部文案区（由 API 替换 image 即可） */
const banners = [
  {
    image: 'https://picsum.photos/id/225/1200/675',
    link: 'consume',
    tag: '新人专享',
    title: '悦享消费 · 智蕴资产 · 积分抵现',
    sub: '消费商城热卖 · 确认收货返生态积分',
    cta: '去逛逛',
  },
  {
    image: 'https://picsum.photos/id/119/1200/675',
    link: 'exchange',
    tag: '省钱换购',
    title: '积分抵现更划算',
    sub: '绑定银行卡 · 生态积分换算好物',
    cta: '去看看',
  },
  {
    image: 'https://picsum.photos/id/164/1200/675',
    link: 'wealth',
    tag: '12%+ 年化',
    title: '增值专区理财',
    sub: '每日收益 · 等级分红 · 资产稳健增值',
    cta: '了解详情',
  },
]

const feedTabs = [
  { type: 1 as const, label: '精选消费', abbr: '购' },
  { type: 2 as const, label: '换购好物', abbr: '换' },
  { type: 3 as const, label: '积分兑换', abbr: '兑' },
]

const feedList = computed(() => {
  if (feedType.value === 1) return consumeList.value
  if (feedType.value === 2) return exchangeList.value
  return redeemList.value
})

const feedVisibleList = computed(() => {
  const list = feedList.value
  return feedExpanded.value ? list : list.slice(0, FEED_PREVIEW)
})

const feedTitle = computed(() => feedTabs.find((x) => x.type === feedType.value)?.label || '精选好物')

const feedHint = computed(() => {
  if (feedType.value === 1) return '现金购 · 确认收货返生态积分'
  if (feedType.value === 2) return '积分抵现 · 需绑定银行卡'
  return '消费积分免费兑好物'
})

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  homeTopOffset.value = statusBarHeight.value + 44
  loadCategories()
  loadProducts()
  searchTimer = setInterval(() => {
    searchHintIdx.value = (searchHintIdx.value + 1) % searchHints.length
  }, 3200)
})

onUnmounted(() => {
  if (searchTimer) clearInterval(searchTimer)
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (loggedIn.value) assetStore.fetchBalance()
  loadCategories()
})

onPageScroll((e) => {
  pageScrolled.value = e.scrollTop > 8
})

onPullDownRefresh(async () => {
  feedExpanded.value = false
  await Promise.all([
    loadCategories(),
    loadProducts(),
    loggedIn.value ? assetStore.fetchBalance() : Promise.resolve(),
  ])
  uni.stopPullDownRefresh()
})

async function loadCategories() {
  const seq = ++categoriesLoadSeq
  try {
    const res = await productApi.getCategories()
    if (seq !== categoriesLoadSeq) return
    const tree = normalizeCategoryTree(res)
    const flat = flattenCategories(tree)
    homeCategories.value = flat.length ? flat : [...HOME_CATEGORY_FALLBACK]
  } catch (e) {
    if (seq !== categoriesLoadSeq) return
    console.warn('[home] loadCategories failed, use fallback', e)
    homeCategories.value = [...HOME_CATEGORY_FALLBACK]
  }
}

async function loadProducts() {
  feedLoading.value = true
  try {
    const [c, e, r] = await Promise.all([
      productApi.getList({ type: 1, limit: 8 }),
      productApi.getList({ type: 2, limit: 8 }),
      productApi.getList({ type: 3, limit: 8 }),
    ])
    consumeList.value = c.list || []
    exchangeList.value = e.list || []
    redeemList.value = r.list || []
  } catch (err) {
    console.error('[home] loadProducts', err)
  } finally {
    feedLoading.value = false
  }
}

function switchFeedTab(type: 1 | 2 | 3) {
  feedType.value = type
  feedExpanded.value = false
}

function expandFeed() {
  feedExpanded.value = true
}

function presetCatalog(type: number, categoryId = '') {
  uni.setStorageSync(CATALOG_PRESET_KEY, { type, categoryId })
}

function goLogin() {
  uni.navigateTo({ url: '/pages/auth/login' })
}
function goSearch() {
  uni.navigateTo({ url: '/pages/search/index' })
}
function goCart() {
  uni.switchTab({ url: '/pages/cart/index' })
}
function goWealthTab() {
  if (!requireAuth()) return
  uni.switchTab({ url: '/pages/wealth/index' })
}
function goCatalog(type = 1, categoryId = '') {
  presetCatalog(type, categoryId)
  uni.switchTab({ url: '/pages/catalog/index' })
}
function goBuy() {
  uni.navigateTo({ url: '/pages/buy/index' })
}
function goExchange() {
  if (!requireAuth()) return
  uni.navigateTo({ url: '/pages/exchange/list' })
}
function goRedeem() {
  if (!requireAuth()) return
  uni.navigateTo({ url: '/pages/redeem/list' })
}
function goProduct(id: string, type: number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}&type=${type}` })
}

function goFeedMore() {
  if (feedType.value === 1) goBuy()
  else if (feedType.value === 2) goExchange()
  else goRedeem()
}

function onCategory(cat: HomeCategory) {
  goCatalog(1, cat.id)
}

function onBanner(i: number) {
  const link = banners[i]?.link
  if (link === 'consume') goBuy()
  else if (link === 'exchange') goExchange()
  else if (link === 'wealth') {
    goWealthTab()
  }
}

function onPortal(type: PortalType) {
  if (type !== 'consume' && !requireAuth()) return
  switch (type) {
    case 'consume':
      goBuy()
      break
    case 'exchange':
      goExchange()
      break
    case 'redeem':
      goRedeem()
      break
    case 'wealth':
      goWealthTab()
      break
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  overflow-x: hidden;
}

.page-body {
  padding: 12rpx 0 $spacing-xl;
}

/* 首页模块间距 48rpx + 区块分隔线 */
.home-block {
  margin-bottom: $home-module-gap;
}
.home-divider {
  height: 1rpx;
  background: $border-light;
  margin-bottom: $home-module-gap;
}

.home-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 0 16rpx;
  margin: 0 (-$spacing-base);
  padding-left: $spacing-base;
  padding-right: $spacing-base;
  position: sticky;
  top: 0;
  z-index: 110;
  background: linear-gradient(180deg, rgba(245, 244, 241, 0.98), rgba(245, 244, 241, 0.92));
  &--scrolled {
    box-shadow: 0 8rpx 32rpx rgba(26, 36, 56, 0.06);
    border-bottom: 1rpx solid $border-light;
  }
}
.home-top__cart {
  padding: 0 20rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  @include premium-surface($bg-secondary);
  border-radius: $radius-full;
  flex-shrink: 0;
}
.home-top__cart-t {
  font-size: var(--font-xs);
  color: $text-primary;
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
}

.home-section__title {
  @include section-head;
  margin-bottom: 24rpx;
}
.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  height: 72rpx;
  padding: 0 28rpx;
  @include premium-surface($bg-secondary);
  border-radius: $radius-full;
  min-width: 0;
  &__icon {
    color: $text-accent;
    margin-right: 12rpx;
    font-size: 28rpx;
    font-weight: var(--weight-medium);
  }
  &__ph {
    font-size: var(--font-sm);
    color: $text-muted;
    letter-spacing: var(--tracking-normal);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* 全屏沉浸式 Banner：突破 page 左右内边距，圆角 0，16:9 */
.banner-wrap {
  margin: 0 (-$spacing-base) $home-module-gap;
  width: calc(100% + #{$spacing-base * 2});
}
.banner {
  height: 422rpx; /* 750rpx 宽 × 16:9 */
  border-radius: 0;
  overflow: hidden;
}
.banner__slide {
  position: relative;
  width: 100%;
  height: 100%;
}
.banner__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
/* 底部 20% 文字区渐变遮罩：下深上浅 */
.banner__shade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 45%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.35) 35%, transparent 100%);
  pointer-events: none;
  z-index: 1;
}
.banner__content {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 38%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 0 $spacing-base 36rpx;
  box-sizing: border-box;
}
.banner__tag {
  font-size: var(--font-xs);
  padding: 6rpx 16rpx;
  border-radius: $radius-sm;
  margin-bottom: 12rpx;
  background: rgba(255, 255, 255, 0.14);
  border: 1rpx solid rgba(255, 255, 255, 0.35);
  color: rgba(255, 255, 255, 0.95);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
}
.banner__title {
  @include type-banner-title;
  color: #fff;
  text-align: left;
  text-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.35);
}
.banner__sub {
  font-size: var(--font-body);
  font-weight: var(--weight-regular);
  color: rgba(255, 255, 255, 0.88);
  margin-top: 10rpx;
  letter-spacing: var(--tracking-normal);
  text-align: left;
  line-height: var(--leading-normal);
}
.banner__cta {
  margin-top: 20rpx;
  padding: 12rpx 36rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.92);
  border-radius: $radius-full;
  background: transparent;
  text {
    font-size: var(--font-sm);
    font-weight: var(--weight-semibold);
    color: #fff;
    letter-spacing: var(--tracking-wide);
  }
  &:active {
    background: rgba(255, 255, 255, 0.12);
  }
}
.banner__login-pill {
  position: absolute;
  top: 20rpx;
  right: $spacing-base;
  z-index: 3;
  padding: 10rpx 26rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  border-radius: $radius-full;
  background: rgba(0, 0, 0, 0.28);
  font-size: var(--font-xs);
  color: #fff;
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
}

.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  &__title {
    @include section-head;
  }
  &__more {
    font-size: var(--font-sm);
    color: $text-accent;
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-normal);
  }
}

.feed-section {
  margin-bottom: 0;
}
.feed-tabs {
  display: flex;
  gap: $home-card-pad;
  margin-bottom: 24rpx;
}
.feed-tabs--sticky {
  position: sticky;
  top: var(--home-top-offset, 56px);
  z-index: 100;
  padding: 12rpx 0;
  margin: 0 (-$spacing-base);
  padding-left: $spacing-base;
  padding-right: $spacing-base;
  background: linear-gradient(180deg, rgba(245, 244, 241, 0.98) 85%, rgba(245, 244, 241, 0));
}
.feed-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 10rpx;
  border-radius: $radius-lg;
  @include premium-surface($bg-secondary);
  &.active {
    border-color: $border-primary;
    background: $warm-yellow;
    box-shadow: $shadow-gold;
  }
  &__abbr {
    width: 48rpx;
    height: 48rpx;
    line-height: 48rpx;
    text-align: center;
    font-size: 26rpx;
    font-weight: var(--weight-heavy);
    color: $navy;
    background: $bg-tertiary;
    border-radius: 50%;
  }
  &.active .feed-tab__abbr {
    background: $navy;
    color: $gold-light;
  }
  &__label {
    font-size: var(--font-xs);
    color: $text-secondary;
    margin-top: 8rpx;
  }
  &.active .feed-tab__label {
    color: $text-primary;
    font-weight: var(--weight-bold);
  }
}

.feed-head {
  margin-bottom: 24rpx;
  padding: $home-card-pad $home-card-pad + 4rpx;
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;
  }
  &__title {
    @include type-card-title;
  }
  &__hint {
    @include type-caption;
    @include line-clamp(2);
  }
  &__more {
    font-size: 24rpx;
    color: $text-secondary;
    margin-left: 16rpx;
  }
}

.feed-empty {
  padding: 48rpx;
  text-align: center;
  font-size: 26rpx;
  color: $text-muted;
}

.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $home-card-pad;
}
.product-grid--fade {
  animation: feed-fade 0.2s ease;
}
@keyframes feed-fade {
  from { opacity: 0.6; }
  to { opacity: 1; }
}

.feed-more-btn {
  margin-top: $home-module-gap;
  padding: $home-card-pad $home-card-pad + 4rpx;
  text-align: center;
  font-size: var(--font-sm);
  color: $text-accent;
  letter-spacing: var(--tracking-wide);
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
}
</style>
