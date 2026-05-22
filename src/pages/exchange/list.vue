<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="page-header">
      <text class="page-title">换购商城</text>
      <text class="page-sub">生态积分抵现金</text>
    </view>

    <view class="mall-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: currentTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <scroll-view scroll-y class="product-list" @scrolltolower="loadMore">
      <view class="product-grid">
        <view
          v-for="item in filteredProducts"
          :key="item.id"
          class="product-card"
          @click="goDetail(item)"
        >
          <image class="cover" :src="item.coverImage" mode="aspectFill" />
          <view class="info">
            <text class="name">{{ item.name }}</text>
            <view class="price-row">
              <text class="price">¥{{ item.price }}</text>
              <text class="points-tag">+{{ item.ecoPoints || 0 }}积分</text>
            </view>
            <view class="exchange-row">
              <text class="exchange-label">可用{{ item.ecoPoints || 0 }}积分抵扣</text>
              <text class="exchange-btn">立即换购</text>
            </view>
          </view>
        </view>
      </view>
      <view v-if="loading" class="loading">加载中...</view>
      <view v-if="!loading && products.length === 0" class="empty">暂无换购商品</view>
    </scroll-view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { productApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const currentTab = ref('all')
const products = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

const tabs = computed(() => {
  const base = [{ key: 'all', label: '全部' }]
  const cats = categories.value.map((c: any) => ({ key: c.id, label: c.name }))
  return [...base, ...cats]
})

const filteredProducts = computed(() => {
  if (currentTab.value === 'all') return products.value
  return products.value.filter((p: any) => p.categoryId === currentTab.value)
})

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  if (!requireAuth()) return
  loadCategories()
  loadProducts()
})

async function loadCategories() {
  try {
    const res = await productApi.getCategories()
    categories.value = res || []
  } catch (e) {
    console.error('加载分类失败', e)
  }
}

async function loadProducts() {
  if (loading.value || !hasMore.value) return
  loading.value = true
  try {
    const res = await productApi.getList({ type: 2, page: page.value, limit: 20 })
    const list = res.list || []
    if (page.value === 1) {
      products.value = list
    } else {
      products.value.push(...list)
    }
    hasMore.value = list.length === 20
    page.value++
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function switchTab(key: string) {
  currentTab.value = key
  products.value = []
  page.value = 1
  hasMore.value = true
  loadProducts()
}

function loadMore() {
  loadProducts()
}

function goDetail(item: any) {
  uni.navigateTo({ url: `/pages/product/detail?id=${item.id}&mode=exchange` })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.page-container { @include tab-page-shell; }

.page-header {
  padding: var(--spacing-base) 0 var(--spacing-sm);
  .page-title { @include page-title-text; display: block; }
  .page-sub { font-size: 24rpx; color: $accent-dark; display: block; margin-top: 4rpx; }
}

.mall-tabs {
  display: flex;
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-base);
  overflow-x: auto;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1rpx solid var(--border-color);

  .tab-item {
    flex-shrink: 0;
    padding-bottom: var(--spacing-sm);
    font-size: 28rpx;
    color: var(--text-secondary);
    border-bottom: 4rpx solid transparent;
    transition: all 0.2s;

    &.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
  }
}

.product-list {
  height: calc(100vh - 300rpx);
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

  .cover {
    width: 100%;
    height: 320rpx;
  }

  .info {
    padding: var(--spacing-sm);

    .name {
      font-size: 28rpx;
      color: var(--text-primary);
      display: block;
      margin-bottom: 8rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .price-row {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-bottom: 8rpx;

      .price {
        font-size: 32rpx;
        font-weight: 700;
        color: var(--primary);
      }

      .points-tag {
        font-size: 22rpx;
        color: var(--text-secondary);
        background: var(--bg-tertiary);
        padding: 2rpx 8rpx;
        border-radius: 4rpx;
      }
    }

    .exchange-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .exchange-label {
        font-size: 22rpx;
        color: var(--text-muted);
      }

      .exchange-btn {
        background: $accent-fire;
        border-radius: $radius-full;
        font-size: 24rpx;
        font-weight: 600;
        color: $text-inverse;
        padding: 6rpx 16rpx;
      }
    }
  }

}

.loading {
  text-align: center;
  padding: var(--spacing-base);
  color: var(--text-muted);
  font-size: 26rpx;
}

.empty {
  text-align: center;
  padding: 80rpx 0;
  color: var(--text-muted);
  font-size: 28rpx;
}
</style>
