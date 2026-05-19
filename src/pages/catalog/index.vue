<template>
  <view class="page-container">
    <!-- 顶部安全区 + 搜索栏 -->
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

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
import { ref } from 'vue'
import { productApi } from '@/utils/api'

const statusBarHeight = ref(20)
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

async function loadCategories() {
  try {
    const res = await productApi.getCategories()
    if (res && res.length > 0) {
      categories.value = res
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
  background: $bg-primary;
  display: flex;
  flex-direction: column;
}

.search-bar {
  padding: $spacing-base $spacing-lg;
  background: $bg-primary;

  .search-input-wrap {
    display: flex;
    align-items: center;
    background: $glass-bg;
    backdrop-filter: blur(20px);
    border: 1rpx solid $glass-border;
    border-radius: 50rpx;
    padding: 0 $spacing-base;
    height: 72rpx;

    .search-icon {
      font-size: 32rpx;
      margin-right: $spacing-sm;
      color: $primary-light;
    }

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: $text-primary;

      &::placeholder {
        color: $text-muted;
      }
    }
  }
}

.mall-tabs {
  display: flex;
  padding: 0 $spacing-lg $spacing-base;
  gap: $spacing-base;
  background: $bg-primary;

  .mall-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;
    padding: $spacing-sm 0;
    border-radius: $radius-lg;
    background: $glass-bg;
    backdrop-filter: blur(20px);
    border: 1rpx solid $glass-border;
    transition: all 0.3s;

    &.active {
      border-color: $primary;
      background: linear-gradient(135deg, rgba(77,142,255,0.15), rgba(77,142,255,0.08));
      box-shadow: $shadow-glow;
    }

    .mall-tab-icon {
      font-size: 40rpx;
    }

    .mall-tab-text {
      font-size: 24rpx;
      color: $text-secondary;
      font-weight: 500;

      .active & {
        color: $primary-light;
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
  background: rgba(10, 22, 40, 0.8);
  border-right: 1rpx solid $border-light;

  .category-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100rpx;
    font-size: 26rpx;
    color: $text-secondary;
    border-left: 4rpx solid transparent;
    transition: all 0.2s;

    &.active {
      background: $bg-primary;
      color: $primary;
      border-left-color: $primary;
      font-weight: 600;
    }
  }
}

.product-list {
  flex: 1;
  height: calc(100vh - 300rpx);
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
      color: $text-muted;
    }

    .empty-icon {
      font-size: 80rpx;
      margin-bottom: $spacing-base;
    }

    .empty-text {
      font-size: 28rpx;
      color: $text-muted;
    }
  }
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
}

.product-card {
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: 1rpx solid $glass-border;
  border-radius: $radius-lg;
  overflow: hidden;

  &:active {
    border-color: rgba(77,142,255,0.4);
    box-shadow: $shadow-glow;
  }

  .product-image {
    width: 100%;
    height: 300rpx;
    background: linear-gradient(135deg, #0A1628 0%, #1E293B 100%);
  }

  .product-info {
    padding: $spacing-base;

    .product-name {
      font-size: 26rpx;
      color: $text-primary;
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
        color: $primary-light;
      }

      .price-value {
        font-size: 30rpx;
        font-weight: 700;
        color: $primary-light;
      }

      .original-price {
        font-size: 22rpx;
        color: $text-muted;
        text-decoration: line-through;
        margin-left: 8rpx;
      }

      .points-tag {
        font-size: 20rpx;
        color: $accent;
        background: rgba($accent, 0.15);
        padding: 2rpx 10rpx;
        border-radius: 999rpx;
        margin-left: 8rpx;
        font-weight: 600;
      }

      .points-tag-full {
        font-size: 24rpx;
        color: $accent;
        font-weight: 700;
        text-shadow: 0 0 8rpx rgba($accent, 0.3);
      }
    }
  }
}

.load-more,
.no-more {
  text-align: center;
  padding: $spacing-base 0;
  font-size: 26rpx;
  color: $text-muted;
}
</style>
