<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="page-header">
      <text class="page-title">兑换商城</text>
      <text class="page-sub">消费积分免费换商品</text>
    </view>

    <view class="user-points-banner" v-if="consumerPointsData">
      <text class="label">我的消费积分</text>
      <text class="value">{{ Number(consumerPointsData.consumerPoints || 0).toLocaleString() }}</text>
      <text class="tip">仅限消费积分兑换，兑换后不退</text>
    </view>
    <view class="user-points-banner loading" v-else>
      <text class="value">--</text>
      <text class="tip">加载中...</text>
    </view>

    <scroll-view scroll-y class="product-list" @scrolltolower="loadMore">
      <view class="product-grid">
        <view
          v-for="item in products"
          :key="item.id"
          class="product-card"
          @click="goExchange(item)"
        >
          <image class="cover" :src="item.coverImage" mode="aspectFill" />
          <view class="info">
            <text class="name">{{ item.name }}</text>
            <view class="points-price">
              <text class="points">{{ item.requiredPoints }}积分</text>
              <text class="free">免费兑换</text>
            </view>
            <view
              :class="['exchange-btn', { disabled: !canRedeem(item) }]"
            >
              {{ canRedeem(item) ? '立即兑换' : '积分不足' }}
            </view>
          </view>
        </view>
      </view>
      <view v-if="loading" class="loading">加载中...</view>
      <view v-if="!loading && products.length === 0" class="empty">
        <text>暂无兑换商品</text>
      </view>
    </scroll-view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { walletApi, productApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const loading = ref(false)
const consumerPointsData = ref<{ consumerPoints: string } | null>(null)
const products = ref<any[]>([])
const page = ref(1)
const hasMore = ref(true)

function canRedeem(item: any): boolean {
  if (!consumerPointsData.value) return false
  return Number(consumerPointsData.value.consumerPoints || 0) >= Number(item.requiredPoints || 0)
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  loadData()
  loadProducts()
})

async function loadData() {
  try {
    consumerPointsData.value = await walletApi.getBalance()
  } catch (e) {
    console.error('获取积分失败', e)
  }
}

async function loadProducts() {
  if (loading.value || !hasMore.value) return
  loading.value = true
  try {
    const res = await productApi.getList({ type: 3, page: page.value, limit: 20 })
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

function loadMore() {
  loadProducts()
}

function goExchange(item: any) {
  if (!canRedeem(item)) {
    uni.showToast({ title: '消费积分不足', icon: 'none' })
    return
  }
  if (!requireAuth()) return
  uni.navigateTo({ url: `/pages/order/confirm?productId=${item.id}&mode=redeem` })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: $bg-primary;
  padding: 0 $spacing-lg;
}

.page-header {
  padding: $spacing-base 0 $spacing-sm;

  .page-title {
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
    display: block;
  }

  .page-sub {
    font-size: 24rpx;
    color: $primary;
    display: block;
    margin-top: 4rpx;
  }
}

.user-points-banner {
  background: linear-gradient(135deg, rgba($primary, 0.3) 0%, rgba($primary, 0.1) 100%);
  border: 1rpx solid rgba($primary, 0.3);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  text-align: center;
  margin-bottom: $spacing-base;

  .label {
    font-size: 24rpx;
    color: $text-secondary;
    display: block;
  }

  .value {
    font-size: 64rpx;
    font-weight: 700;
    color: $primary;
    display: block;
    margin: 8rpx 0;
  }

  .tip {
    font-size: 22rpx;
    color: $text-muted;
  }
}

.product-list {
  height: calc(100vh - 400rpx);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
}

.product-card {
  background: $bg-secondary;
  border-radius: $radius-lg;
  overflow: hidden;

  .cover {
    width: 100%;
    height: 320rpx;
  }

  .info {
    padding: $spacing-sm;

    .name {
      font-size: 28rpx;
      color: $text-primary;
      display: block;
      margin-bottom: 8rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .points-price {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-bottom: 8rpx;

      .points {
        font-size: 28rpx;
        font-weight: 700;
        color: $primary;
      }

      .free {
        font-size: 22rpx;
        color: #52c41a;
        background: rgba(82, 196, 26, 0.15);
        padding: 2rpx 8rpx;
        border-radius: 4rpx;
      }
    }

    .exchange-btn {
      background: linear-gradient(135deg, $primary, darken($primary, 10%));
      border-radius: $radius;
      text-align: center;
      font-size: 26rpx;
      font-weight: 600;
      color: #0a0a0b;
      padding: 10rpx 0;

      &.disabled {
        background: $bg-tertiary;
        color: $text-muted;
      }
    }
  }
}

.loading {
  text-align: center;
  padding: $spacing-base;
  color: $text-muted;
  font-size: 26rpx;
}

.empty {
  text-align: center;
  padding: 80rpx 0;
  color: $text-muted;
  font-size: 28rpx;
}
</style>
