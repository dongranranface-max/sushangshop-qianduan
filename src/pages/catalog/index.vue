<template>
  <view class="page-container">
    <AssetStatusBar v-if="loggedIn" />
    <view v-else class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索商品"
          @confirm="onSearch"
        />
      </view>
    </view>

    <!-- 商城类型切换 -->
    <view class="mall-tabs">
      <view
        class="mall-tab"
        :class="{ active: currentType === 1 }"
        @click="switchType(1)"
      >
        <text class="mall-tab-icon">🛍️</text>
        <text class="mall-tab-text">消费商城</text>
      </view>
      <view
        class="mall-tab"
        :class="{ active: currentType === 2 }"
        @click="switchType(2)"
      >
        <text class="mall-tab-icon">🔄</text>
        <text class="mall-tab-text">换购商城</text>
      </view>
      <view
        class="mall-tab"
        :class="{ active: currentType === 3 }"
        @click="switchType(3)"
      >
        <text class="mall-tab-icon">🎁</text>
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
        <!-- 加载中 -->
        <view v-if="loading" class="loading-wrap">
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 空状态 -->
        <view v-else-if="products.length === 0" class="empty-wrap">
          <text class="empty-icon">📦</text>
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
              :src="productCover(p)"
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
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { productApi } from '@/utils/api'
import { checkAuth } from '@/utils/auth'
import { HOME_CATEGORY_FALLBACK, normalizeCategoryTree, flattenCategories } from '@/utils/category'
import { resolveProductCover } from '@/utils/media'

function productCover(p: any) {
  return resolveProductCover(p)
}
import { assetStore } from '@/store/asset'
import AssetStatusBar from '@/components/AssetStatusBar.vue'

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

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  loadCategories()
  loadProducts(true)
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (loggedIn.value) assetStore.fetchBalance()
})

async function loadCategories() {
  try {
    const res = await productApi.getCategories()
    const tree = normalizeCategoryTree(res)
    const flat = flattenCategories(tree)
    categories.value = flat.length > 0 ? flat : HOME_CATEGORY_FALLBACK
  } catch {
    categories.value = HOME_CATEGORY_FALLBACK
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
    if (reset) {
      products.value = list
    } else {
      products.value.push(...list)
    }
    hasMore.value = list.length === limit
    page.value++
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
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
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.search-bar {
  padding: var(--spacing-base) var(--spacing-lg);
  background: var(--bg-primary);

  .search-input-wrap {
    display: flex;
    align-items: center;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1rpx solid var(--glass-border);
    border-radius: 50rpx;
    padding: 0 var(--spacing-base);
    height: 72rpx;

    .search-icon {
      font-size: 32rpx;
      margin-right: var(--spacing-sm);
      color: var(--primary)-light;
    }

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: var(--text-primary);

      &::placeholder {
        color: var(--text-muted);
      }
    }
  }
}

.mall-tabs {
  display: flex;
  padding: 0 var(--spacing-lg) var(--spacing-base);
  gap: var(--spacing-base);
  background: var(--bg-primary);

  .mall-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;
    padding: var(--spacing-sm) 0;
    border-radius: var(--radius-lg);
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1rpx solid var(--glass-border);
    transition: all 0.3s;

    &.active {
      border-color: var(--border-primary);
      background: $warm-yellow;
      box-shadow: var(--shadow-gold);
    }

    .mall-tab-icon {
      font-size: 40rpx;
    }

    .mall-tab-text {
      font-size: 24rpx;
      color: var(--text-secondary);
      font-weight: 500;

      .active & {
        color: var(--primary-light);
        font-weight: 700;
      }
    }
  }
}

.content-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.category-nav {
  width: 160rpx;
  height: calc(100vh - 300rpx);
  background: $bg-tertiary;
  border-right: 1rpx solid var(--border-light);

  .category-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100rpx;
    font-size: 26rpx;
    color: var(--text-secondary);
    border-left: 4rpx solid transparent;
    transition: all 0.2s;

    &.active {
      background: var(--bg-primary);
      color: var(--primary);
      border-left-color: var(--primary);
      font-weight: 600;
    }
  }
}

.product-list {
  flex: 1;
  height: calc(100vh - 300rpx);
  padding: var(--spacing-base);

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
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1rpx solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;

  &:active {
    border-color: $border-primary;
    box-shadow: var(--shadow-gold);
  }

  .product-image {
    width: 100%;
    height: 300rpx;
    background: linear-gradient(135deg, $warm-blue 0%, $bg-tertiary 100%);
  }

  .product-info {
    padding: var(--spacing-base);

    .product-name {
      font-size: 26rpx;
      color: var(--text-primary);
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 12rpx;
    }

    .product-price {
      display: flex;
      align-items: center;
      gap: 0;
      flex-wrap: wrap;

      .price-symbol {
        font-size: 22rpx;
        color: var(--primary-light);
      }

      .price-value {
        font-size: 30rpx;
        font-weight: 700;
        color: var(--primary-light);
      }

      .original-price {
        font-size: 22rpx;
        color: var(--text-muted);
        text-decoration: line-through;
        margin-left: 8rpx;
      }

      .points-tag {
        font-size: 20rpx;
        color: var(--accent);
        background: rgba(255,107,53,0.15);
        padding: 2rpx 10rpx;
        border-radius: 999rpx;
        margin-left: 8rpx;
        font-weight: 600;
      }

      .points-tag-full {
        font-size: 24rpx;
        color: var(--accent);
        font-weight: 700;
        text-shadow: 0 0 8rpx rgba(255,107,53,0.30);
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
