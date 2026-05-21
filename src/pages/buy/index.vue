<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="page-header">
      <text class="page-title">积分商城</text>
    </view>

    <!-- 商城切换 Tab -->
    <view class="mall-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['mall-tab', { active: currentTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 商品列表 -->
    <scroll-view class="product-list" scroll-y @scrolltolower="loadMore">
      <view class="product-grid">
        <view
          class="product-card"
          v-for="p in products"
          :key="p.id"
          @click="goProduct(p)"
        >
          <image class="product-image" :src="p.coverImage || p.image" mode="aspectFill" />
          <view class="product-info">
            <text class="product-name">{{ p.name }}</text>
            <view class="product-tags">
              <text v-if="currentTab === 'exchange'" class="tag tag-purple">换购</text>
              <text v-else-if="currentTab === 'redeem'" class="tag tag-green">兑换</text>
            </view>
            <view class="product-bottom">
              <view class="price-row">
                <text class="product-price">
                  <text v-if="currentTab !== 'redeem'" class="symbol">¥</text>
                  <text v-if="currentTab === 'redeem'">{{ p.requiredPoints }}</text>
                  <text v-else>{{ p.price }}</text>
                </text>
                <text v-if="currentTab !== 'redeem' && p.ecoPoints" class="product-points">+{{ p.ecoPoints }}积分</text>
                <text v-else-if="currentTab === 'redeem'" class="points-label">积分兑换</text>
              </view>
              <view class="add-cart-btn" @click.stop="addToCart(p)">
                <text class="cart-char">购</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading-more"><text>加载中...</text></view>
      <view v-else-if="!loading && products.length === 0" class="empty"><text>暂无商品</text></view>
      <view v-else-if="noMore" class="no-more"><text>没有更多了</text></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { productApi } from '@/utils/api'

const statusBarHeight = ref(20)
const currentTab = ref('consume')
const products = ref<any[]>([])
const loading = ref(false)
const noMore = ref(false)
const page = ref(1)

const tabs = [
  { key: 'consume', label: '消费商城' },
  { key: 'exchange', label: '换购商城' },
  { key: 'redeem', label: '兑换商城' },
]

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  loadProducts()
})

async function loadProducts() {
  if (loading.value) return
  loading.value = true
  try {
    const typeMap: Record<string, number> = { consume: 1, exchange: 2, redeem: 3 }
    const res = await productApi.getList({ type: typeMap[currentTab.value], page: page.value, limit: 20 })
    const list = res.list || []
    if (page.value === 1) {
      products.value = list
    } else {
      products.value.push(...list)
    }
    noMore.value = list.length < 20
    page.value++
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function switchTab(key: string) {
  if (currentTab.value === key) return
  currentTab.value = key
  products.value = []
  page.value = 1
  noMore.value = false
  loadProducts()
}

function loadMore() {
  if (!noMore.value) loadProducts()
}

function goProduct(p: any) {
  const mode = currentTab.value
  uni.navigateTo({ url: `/pages/product/detail?id=${p.id}&mode=${mode}` })
}

function addToCart(p: any) {
  uni.showToast({ title: '已加入购物车', icon: 'success' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.page-container {
  @include tab-page-shell;
  display: flex;
  flex-direction: column;
}

.page-header { padding: var(--spacing-base) 0;
  .page-title { @include page-title-text; }
}

.mall-tabs {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-base) 0;
  border-bottom: 1rpx solid $border-color;
  .mall-tab {
    font-size: 30rpx;
    color: $text-secondary;
    padding-bottom: var(--spacing-sm);
    border-bottom: 4rpx solid transparent;
    &.active {
      color: $navy;
      border-bottom-color: $accent;
      font-weight: var(--weight-heavy);
    }
  }
}

.product-list { flex: 1; padding-top: var(--spacing-base); height: calc(100vh - 200rpx); }

.product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-base); padding-bottom: var(--spacing-lg); }

.product-card {
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  overflow: hidden;
  .product-image { width: 100%; aspect-ratio: 1; }
  .product-info { padding: var(--spacing-base);
    .product-name { font-size: 28rpx; color: var(--text-primary); @include line-clamp(2); line-height: 1.4; display: block; }
    .product-tags { margin-top: var(--spacing-xs);
      .tag { font-size: 18rpx; padding: 2rpx 12rpx; border-radius: 6rpx;
        &.tag-purple { background: $warm-blue; color: $navy; }
        &.tag-green { background: $warm-yellow; color: $accent-dark; }
      }
    }
    .product-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: var(--spacing-sm);
      .price-row { display: flex; align-items: baseline; gap: var(--spacing-xs);
        .product-price { font-size: 32rpx; font-weight: 700; color: var(--primary);
          .symbol { font-size: 24rpx; }
        }
        .product-points { font-size: 22rpx; color: var(--gold); font-weight: 600; }
        .points-label { font-size: 22rpx; color: $accent-dark; font-weight: 600; }
      }
      .add-cart-btn {
        width: 56rpx; height: 56rpx;
        background: $accent-fire; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        .cart-char { font-size: 24rpx; font-weight: var(--weight-heavy); color: $text-inverse; }
      }
    }
  }
}

.loading-more, .no-more, .empty { text-align: center; padding: var(--spacing-xl) 0; color: var(--text-secondary); font-size: 26rpx; }
</style>
