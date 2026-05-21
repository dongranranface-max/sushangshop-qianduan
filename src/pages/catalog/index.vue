<template>
  <view class="page-container">
    <AssetStatusBar v-if="loggedIn" />
    <view v-else class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="page-header">
      <BrandLogo size="sm" tagline="类目浏览 · 精选好物" />
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">⌕</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索商品"
          @confirm="onSearch"
        />
      </view>
    </view>

    <!-- 未登录时简化资产提示条 -->
    <view v-if="!loggedIn" class="guest-asset-strip" @click="goLogin">
      <text class="strip-icon">积</text>
      <text class="strip-text">登录后查看资产，享积分抵现</text>
      <text class="strip-arrow">›</text>
    </view>

    <!-- 商城类型切换 -->
    <view class="mall-tabs">
      <view
        class="mall-tab"
        :class="{ active: currentType === 1 }"
        @click="switchType(1)"
      >
        <text class="mall-tab-abbr">购</text>
        <text class="mall-tab-text">消费商城</text>
      </view>
      <view
        class="mall-tab"
        :class="{ active: currentType === 2 }"
        @click="switchType(2)"
      >
        <text class="mall-tab-abbr">换</text>
        <text class="mall-tab-text">换购商城</text>
      </view>
      <view
        class="mall-tab"
        :class="{ active: currentType === 3 }"
        @click="switchType(3)"
      >
        <text class="mall-tab-abbr">兑</text>
        <text class="mall-tab-text">兑换商城</text>
      </view>
    </view>

    <!-- 分类 + 商品横向布局 -->
    <view class="content-layout">
      <!-- 左侧分类导航 -->
      <scroll-view class="category-nav" scroll-y>
        <view
          class="category-item"
          :class="{ active: currentCategoryId === '' }"
          @click="selectCategory('')"
        >
          <text>全部</text>
        </view>
        <view
          class="category-item"
          :class="{ active: currentCategoryId === c.id }"
          v-for="c in categories"
          :key="c.id"
          @click="selectCategory(c.id)"
        >
          <text>{{ c.name }}</text>
        </view>
      </scroll-view>

      <!-- 右侧商品列表 -->
      <scroll-view class="product-list" scroll-y @scrolltolower="loadMore">
        <!-- 加载中骨架屏 -->
        <HomeProductSkeleton v-if="loading" :count="4" />

        <!-- 空状态 -->
        <view v-else-if="products.length === 0" class="empty-wrap">
          <text class="empty-icon">空</text>
          <text class="empty-text">暂无商品</text>
        </view>

        <!-- 商品网格 -->
        <view v-else class="product-grid">
          <view
            class="product-card"
            v-for="p in products"
            :key="p.id"
            @click="goProduct(p)"
          >
            <image
              class="product-image"
              :src="p.coverImage || p.image || 'https://picsum.photos/300/300?random=goods'"
              mode="aspectFill"
            />
            <view class="product-info">
              <text class="product-name">{{ p.name }}</text>
              <view v-if="currentType === 1" class="product-price">
                <text class="price-symbol">¥</text>
                <text class="price-value">{{ p.price }}</text>
                <text v-if="p.originalPrice" class="original-price">¥{{ p.originalPrice }}</text>
              </view>
              <view v-else-if="currentType === 2" class="product-price">
                <text class="price-symbol">¥</text>
                <text class="price-value">{{ p.price }}</text>
                <text class="points-tag">+{{ p.requiredPoints || 0 }}积分</text>
              </view>
              <view v-else class="product-price">
                <text class="points-tag-full">{{ p.requiredPoints }}积分兑换</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view v-if="hasMore && !loading" class="load-more" @click="loadMore">
          <text>加载更多</text>
        </view>
        <view v-if="!hasMore && products.length > 0" class="no-more">
          <text>— 没有更多了 —</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { productApi } from '@/utils/api'
import { checkAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'
import AssetStatusBar from '@/components/AssetStatusBar.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import HomeProductSkeleton from '@/components/HomeProductSkeleton.vue'

const statusBarHeight = ref(20)
const loggedIn = ref(checkAuth())
const keyword = ref('')
const currentType = ref(1)
const currentCategoryId = ref('')
const categories = ref<any[]>([])
const products = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const limit = 20
const hasMore = ref(true)

// 静态模拟分类（API 未接通时兜底）
const mockCategories = [
  { id: 'cat-1', name: '数码电子' },
  { id: 'cat-2', name: '生活用品' },
  { id: 'cat-3', name: '食品生鲜' },
  { id: 'cat-4', name: '服饰箱包' },
  { id: 'cat-5', name: '美妆护肤' },
]

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  loadCategories()
  loadProducts(true)
})

const CATALOG_PRESET_KEY = 'catalog_preset'

onShow(() => {
  loggedIn.value = checkAuth()
  if (loggedIn.value) assetStore.fetchBalance()
  const preset = uni.getStorageSync(CATALOG_PRESET_KEY) as
    | { type?: number; categoryId?: string }
    | ''
  if (preset && typeof preset === 'object') {
    if (preset.type && preset.type !== currentType.value) {
      currentType.value = preset.type
    }
    if (preset.categoryId !== undefined && preset.categoryId !== currentCategoryId.value) {
      currentCategoryId.value = preset.categoryId
    }
    uni.removeStorageSync(CATALOG_PRESET_KEY)
    loadProducts(true)
  }
})

function flattenCategories(list: any[]): any[] {
  const out: any[] = []
  for (const c of list) {
    out.push({ id: c.id, name: c.name })
    if (c.children?.length) {
      for (const ch of c.children) {
        out.push({ id: ch.id, name: ch.name })
      }
    }
  }
  return out
}

async function loadCategories() {
  try {
    const res = await productApi.getCategories()
    if (res && res.length > 0) {
      categories.value = flattenCategories(res)
    } else {
      categories.value = mockCategories
    }
  } catch {
    categories.value = mockCategories
  }
}

async function loadProducts(reset = false) {
  if (loading.value) return
  if (reset) {
    page.value = 1
    hasMore.value = true
  }
  if (!hasMore.value) return

  loading.value = true
  try {
    const res = await productApi.getList({
      type: currentType.value,
      categoryId: currentCategoryId.value || undefined,
      keyword: keyword.value || undefined,
      page: page.value,
      limit,
    })
    const list = res.list || []
    const rows = list.length ? list : (reset ? getMockProducts(currentType.value) : [])
    if (reset) {
      products.value = rows
    } else {
      products.value.push(...rows)
    }
    hasMore.value = list.length === limit
    page.value++
  } catch (e: any) {
    if (reset && products.value.length === 0) {
      products.value = getMockProducts(currentType.value)
    }
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function getMockProducts(type: number) {
  const base = [
    { id: 'mock-1', name: '智能养生壶', price: '299.00', coverImage: 'https://picsum.photos/300/300?random=11', requiredPoints: '2000' },
    { id: 'mock-2', name: '有机山茶油', price: '168.00', coverImage: 'https://picsum.photos/300/300?random=12', requiredPoints: '1500' },
    { id: 'mock-3', name: '蓝牙耳机', price: '199.00', coverImage: 'https://picsum.photos/300/300?random=13', requiredPoints: '8800' },
    { id: 'mock-4', name: '生态大米 5kg', price: '89.00', coverImage: 'https://picsum.photos/300/300?random=14', requiredPoints: '1200' },
  ]
  return base.filter((_, i) => type !== 3 || i >= 2).slice(0, type === 3 ? 2 : 4)
}

function switchType(type: number) {
  if (currentType.value === type) return
  currentType.value = type
  currentCategoryId.value = ''
  loadProducts(true)
}

function selectCategory(id: string) {
  if (currentCategoryId.value === id) return
  currentCategoryId.value = id
  loadProducts(true)
}

function onSearch() {
  loadProducts(true)
}

function loadMore() {
  if (hasMore.value && !loading.value) {
    loadProducts(false)
  }
}

function goProduct(p: any) {
  uni.navigateTo({ url: `/pages/product/detail?id=${p.id}&type=${currentType.value}` })
}

function goLogin() {
  uni.navigateTo({ url: '/pages/auth/login' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.page-container {
  min-height: 100vh;
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
}

.page-header {
  padding: 8rpx $spacing-base 0;
}

// 未登录资产感知条
guest-asset-strip {
  display: flex;
  align-items: center;
  margin: 0 $spacing-base $spacing-base;
  padding: 16rpx 24rpx;
  background: $warm-yellow;
  border: 1rpx solid $border-primary;
  border-radius: $radius-lg;

  .strip-icon {
    width: 40rpx;
    height: 40rpx;
    line-height: 40rpx;
    text-align: center;
    background: $navy;
    color: $gold-light;
    border-radius: 50%;
    font-size: 20rpx;
    font-weight: var(--weight-heavy);
    flex-shrink: 0;
    margin-right: 12rpx;
  }

  .strip-text {
    flex: 1;
    font-size: var(--font-sm);
    color: $accent-dark;
    font-weight: var(--weight-medium);
  }

  .strip-arrow {
    font-size: 28rpx;
    color: $accent-dark;
    flex-shrink: 0;
  }
}

.search-bar {
  padding: 0 $spacing-base $spacing-base;

  .search-input-wrap {
    @include search-bar-shell;
    padding: 0 $spacing-base;
    margin-bottom: 0;
    height: 72rpx;

    .search-icon {
      font-size: 28rpx;
      margin-right: $spacing-sm;
      color: $text-accent;
    }

    .search-input {
      flex: 1;
      font-size: var(--font-md);
      color: $text-primary;
    }
  }
}

.mall-tabs {
  display: flex;
  padding: 0 $spacing-base $spacing-base;
  gap: 12rpx;

  .mall-tab {
    @include mall-tab-item;

    .mall-tab-abbr {
      @include mall-tab-abbr;
    }

    .mall-tab-text {
      font-size: var(--font-xs);
      color: $text-secondary;
    }

    &.active .mall-tab-text {
      color: $text-primary;
      font-weight: var(--weight-bold);
    }

    &.active .mall-tab-abbr {
      background: $navy;
      color: $gold-light;
    }
  }
}

.content-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  height: calc(100vh - 360rpx);
  max-height: calc(100vh - 360rpx);
}

.category-nav {
  width: 180rpx;
  flex-shrink: 0;
  height: 100%;
  background: $bg-tertiary;
  border-right: 1rpx solid $border-light;

  .category-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100rpx;
    font-size: var(--font-sm);
    color: $text-secondary;
    border-left: 4rpx solid transparent;

    &.active {
      background: $bg-secondary;
      color: $navy;
      border-left-color: $accent;
      font-weight: var(--weight-semibold);
    }
  }
}

.product-list {
  flex: 1;
  height: 100%;
  min-height: 0;
  padding: $spacing-base;

  .loading-wrap,
  .empty-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 0;

    .loading-text {
      font-size: 28rpx;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 80rpx;
      margin-bottom: var(--spacing-base);
    }

    .empty-text {
      font-size: 28rpx;
      color: var(--text-muted);
    }
  }
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-base);
}

.product-card {
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  overflow: hidden;

  &:active {
    border-color: $border-primary;
    box-shadow: $shadow-gold;
  }

  .product-image {
    width: 100%;
    aspect-ratio: 4 / 3;
    display: block;
    background: $bg-tertiary;
  }

  .product-info {
    padding: var(--spacing-base);

    .product-name {
      font-size: 26rpx;
      color: var(--text-primary);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      line-height: 1.4;
      margin-bottom: 12rpx;
    }

    .product-price {
      display: flex;
      align-items: center;
      gap: 0;
      flex-wrap: wrap;

      .price-symbol {
        font-size: 22rpx;
        color: $text-primary;
      }

      .price-value {
        font-size: 30rpx;
        font-weight: var(--weight-heavy);
        color: $text-primary;
      }

      .original-price {
        font-size: 22rpx;
        color: var(--text-muted);
        text-decoration: line-through;
        margin-left: 8rpx;
      }

      .points-tag {
        font-size: 20rpx;
        color: $accent-dark;
        background: $warm-yellow;
        padding: 2rpx 10rpx;
        border-radius: 999rpx;
        margin-left: 8rpx;
        font-weight: var(--weight-semibold);
      }

      .points-tag-full {
        font-size: 24rpx;
        color: $accent-dark;
        font-weight: var(--weight-bold);
      }
    }
  }
}

.load-more,
.no-more {
  text-align: center;
  padding: var(--spacing-base) 0;
  font-size: 26rpx;
  color: var(--text-muted);
}
</style>
