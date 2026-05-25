<template>
  <view class="page-container">
    <!-- 毛玻璃状态栏 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 页面导航 -->
    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">{{ navTitle }}</text>
    </view>

    <!-- Tab 切换：全部分类 / 商品 -->
    <view class="service-tabs">
      <view
        class="service-tab"
        :class="{ active: currentService === 'categories' }"
        @click="switchType('categories')"
      >
        <text>全部分类</text>
      </view>
      <view
        class="service-tab"
        :class="{ active: currentService === 'products' }"
        @click="switchType('products')"
      >
        <text>全部商品</text>
      </view>
    </view>

    <!-- 分类视图 -->
    <template v-if="currentService === 'categories'">
      <!-- 骨架屏 -->
      <view v-if="loading" class="category-grid">
        <view v-for="i in 10" :key="i" class="sk-category">
          <view class="sk-category__icon shimmer" />
          <view class="sk-category__name shimmer" />
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!categories.length" class="empty-state">
        <view class="empty-state__icon">📦</view>
        <text class="empty-state__text">暂无分类</text>
      </view>

      <!-- 分类网格 -->
      <view v-else class="category-grid">
        <view
          v-for="item in categories"
          :key="item.id"
          class="category-item"
          @click="goCategory(item)"
        >
          <image class="category-item__icon" :src="item.icon" mode="aspectFill" />
          <text class="category-item__name">{{ item.name }}</text>
        </view>
      </view>
    </template>

    <!-- 商品列表视图 -->
    <template v-else>
      <!-- 骨架屏 -->
      <view v-if="loading" class="product-grid">
        <view v-for="i in 10" :key="i" class="sk-product">
          <view class="sk-product__img shimmer" />
          <view class="sk-product__info">
            <view class="sk-product__line shimmer" />
            <view class="sk-product__line sk-product__line--short shimmer" />
          </view>
        </view>
      </view>

      <!-- 空状态：只对 products 视图展示 -->
      <view v-else-if="!products.length" class="empty-state">
        <view class="empty-state__icon">🛍️</view>
        <text class="empty-state__text">暂无商品</text>
      </view>

      <!-- 商品网格 -->
      <view v-else class="product-grid">
        <view
          v-for="item in products"
          :key="item.id"
          class="product-item"
          @click="goProduct(item)"
        >
          <image class="product-item__img" :src="item.coverImage" mode="aspectFill" />
          <view class="product-item__info">
            <text class="product-item__name">{{ item.name }}</text>
            <view class="product-item__price">
              <text class="product-item__price-text">¥{{ item.price }}</text>
              <text v-if="item.requiredPoints" class="product-item__points">+{{ item.requiredPoints }}积分</text>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view v-if="hasMore && !loading" class="load-more" @click="loadMore">
          <text>加载更多</text>
        </view>
        <view v-if="!hasMore && products.length" class="no-more">
          <text>— 没有更多了 —</text>
        </view>
      </view>
    </template>

    <!-- 安全区 -->
    <view class="safe-area-bottom" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { productApi } from '@/utils/api'

const statusBarHeight = ref(20)
const currentService = ref<'categories' | 'products'>('categories')
const categories = ref<Record<string, unknown>[]>([])
const products = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const loadMoreLoading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)

const navTitle = computed(() =>
  currentService.value === 'categories' ? '全部分类' : '全部商品'
)

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  loadCategories()
})

async function loadCategories(reset = false) {
  if (reset) {
    page.value = 1
  }
  loading.value = true
  try {
    const res = await productApi.getCategories()
    categories.value = res || []
  } catch {
    categories.value = []
  } finally {
    loading.value = false
  }
}

async function loadProducts(reset = false) {
  if (reset) {
    page.value = 1
  }
  loading.value = true
  try {
    const res = await productApi.getList({ page: page.value, limit: pageSize.value })
    const list: Record<string, unknown>[] = res?.list || []
    if (page.value === 1) {
      products.value = list
    } else {
      products.value.push(...list)
    }
    const total = res?.total || 0
    hasMore.value = products.value.length < total
  } catch {
    products.value = []
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

function switchType(type: 'categories' | 'products') {
  if (currentService.value === type) return
  currentService.value = type
  if (type === 'categories') {
    page.value = 1
    loadCategories(true)
  } else {
    page.value = 1
    loadProducts(true)
  }
}

function loadMore() {
  if (loadMoreLoading.value || !hasMore.value) return
  loadMoreLoading.value = true
  page.value++
  loadProducts(false).finally(() => {
    loadMoreLoading.value = false
  })
}

function goCategory(item: Record<string, unknown>) {
  uni.navigateTo({ url: `/pages/catalog/category?id=${item.id}&name=${item.name}` })
}

function goProduct(item: Record<string, unknown>) {
  uni.navigateTo({ url: `/pages/product/detail?id=${item.id}` })
}

function goBack() { uni.navigateBack() }
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
  padding: 12rpx $spacing-base;
  gap: 16rpx;

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

// ========== Tab 切换 ==========
.service-tabs {
  display: flex;
  padding: 0 $spacing-base $spacing-base;
  gap: 12rpx;
}

.service-tab {
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

  text {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-muted;
  }

  &.active {
    background: $warm-yellow;
    border-color: $border-primary;
    box-shadow: $shadow-gold;

    text {
      color: $accent-dark;
      font-weight: 700;
    }
  }
}

// ========== 分类网格 ==========
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-base;
  padding: 0 $spacing-base;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 8rpx;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1rpx solid rgba(20, 20, 20, 0.06);
  border-radius: $radius-lg;

  &__icon {
    width: 96rpx;
    height: 96rpx;
    border-radius: $radius-md;
    background: $bg-tertiary;
  }

  &__name {
    font-size: 24rpx;
    color: $text-secondary;
    text-align: center;
    max-width: 140rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// ========== 商品网格 ==========
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
  padding: 0 $spacing-base;
}

.product-item {
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $clay-shadow;

  &__img {
    width: 100%;
    height: 320rpx;
    background: $bg-tertiary;
  }

  &__info {
    padding: 16rpx;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__name {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    line-height: 1.4;
  }

  &__price {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex-wrap: wrap;
  }

  &__price-text {
    font-size: 30rpx;
    font-weight: 700;
    color: $mineral-gray;
    font-family: $asset-balance-font;
  }

  &__points {
    font-size: 22rpx;
    color: $accent-dark;
    font-weight: 600;
  }
}

// ========== 骨架屏 ==========
.sk-category {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 8rpx;

  &__icon {
    width: 96rpx;
    height: 96rpx;
    border-radius: $radius-md;
    background: $bg-tertiary;
  }

  &__name {
    width: 100rpx;
    height: 24rpx;
    border-radius: 8rpx;
    background: $bg-tertiary;
  }
}

.sk-product {
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  overflow: hidden;

  &__img {
    width: 100%;
    height: 320rpx;
    background: $bg-tertiary;
  }

  &__info {
    padding: 16rpx;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
  }

  &__line {
    height: 24rpx;
    border-radius: 8rpx;
    background: $bg-tertiary;
    width: 80%;

    &--short { width: 50%; }
  }
}

.shimmer { animation: shim 1.4s ease-in-out infinite; }

@keyframes shim {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.7; }
}

// ========== 加载更多 ==========
.load-more {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  color: $text-muted;
  font-size: 26rpx;
}

.no-more {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  color: $text-muted;
  font-size: 24rpx;
}

// ========== 空状态 ==========
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 40rpx;
  text-align: center;

  &__icon {
    font-size: 80rpx;
    margin-bottom: 24rpx;
  }

  &__text {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
  }
}
</style>
