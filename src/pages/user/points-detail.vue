<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">积分明细</text>
      <view class="page-nav__action" />
    </view>

    <!-- 积分概览 -->
    <view class="points-overview">
      <view class="points-card points-card--eco">
        <view class="points-card__header">
          <view class="points-card__icon">生</view>
          <text class="points-card__title">生态积分</text>
        </view>
        <text class="points-card__value">{{ ecoPoints.toLocaleString() }}</text>
        <text class="points-card__tip">可理财 · 可换购</text>
      </view>

      <view class="points-card points-card--credit">
        <view class="points-card__header">
          <view class="points-card__icon">消</view>
          <text class="points-card__title">消费积分</text>
        </view>
        <text class="points-card__value">{{ creditPoints.toLocaleString() }}</text>
        <text class="points-card__tip">仅可兑换商品</text>
      </view>
    </view>

    <!-- 筛选 Tab -->
    <view class="filter-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="filter-tab"
        :class="{ active: filterType === tab.key }"
        @click="switchTab(tab.key)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 明细列表 -->
    <scroll-view class="record-list" scroll-y @scrolltolower="loadMore">
      <view v-if="loading && !records.length" class="loading-wrap">
        <view class="loading-spinner" />
        <text>加载中...</text>
      </view>

      <view
        class="record-item"
        v-for="record in filteredRecords"
        :key="record.id"
      >
        <view class="record-item__icon" :class="record.type">
          <text>{{ record.type === 'income' ? '↑' : '↓' }}</text>
        </view>
        <view class="record-item__info">
          <text class="record-item__title">{{ record.title }}</text>
          <text class="record-item__time">{{ record.time }}</text>
        </view>
        <text class="record-item__points" :class="record.type">
          {{ record.type === 'income' ? '+' : '-' }}{{ record.points }}
        </text>
      </view>

      <view v-if="!loading && !filteredRecords.length" class="empty-state">
        <view class="empty-state__icon">明细</view>
        <text class="empty-state__text">暂无积分记录</text>
      </view>

      <view v-if="loading && records.length" class="load-more">
        <view class="loading-spinner" />
        <text>加载中...</text>
      </view>

      <view v-if="!hasMore && filteredRecords.length > 0" class="no-more">
        <text>— 没有更多了 —</text>
      </view>

      <view class="list-bottom" :style="{ height: (80 + safeAreaBottom) + 'px' }" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { walletApi } from '@/utils/api'
import { checkAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const filterType = ref<'all' | 'income' | 'expense'>('all')
const loading = ref(false)
const page = ref(1)
const limit = 20
const hasMore = ref(true)
const ecoPoints = ref('0')
const creditPoints = ref('0')
let reqSeq = 0

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'income', label: '收入' },
  { key: 'expense', label: '支出' },
]

interface PointsRecord {
  id: string
  type: number
  amount: string
  sourceName: string
  createdAt: string
}

const records = ref<PointsRecord[]>([])

const filteredRecords = computed(() => {
  return records.value.map(r => {
    const isIncome = r.amount.startsWith('+')
    return {
      id: r.id,
      type: isIncome ? 'income' : 'expense',
      title: r.sourceName || '积分变动',
      time: r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '',
      points: Math.abs(parseFloat(r.amount)).toFixed(2),
    }
  })
})

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
  if (checkAuth()) {
    loadAsset()
    loadRecords(true)
  }
})

async function loadAsset() {
  try {
    const res = await walletApi.getBalance()
    ecoPoints.value = res?.ecoPoints || '0'
    creditPoints.value = res?.consumerPoints || '0'
  } catch {}
}

async function loadRecords(reset = false) {
  if (loading.value) return
  if (!reset && !hasMore.value) return
  if (reset) { page.value = 1; hasMore.value = true }
  loading.value = true
  const seq = ++reqSeq

  const typeMap: Record<string, number | undefined> = { all: undefined, income: 1, expense: 2 }
  try {
    const res = await walletApi.getLogs({ type: typeMap[filterType.value], page: page.value, limit })
    if (seq !== reqSeq) return
    const list = res?.list || []
    if (reset) records.value = list
    else records.value.push(...list)
    hasMore.value = list.length >= limit
    page.value++
  } catch {
    if (seq !== reqSeq) return
  } finally {
    if (seq === reqSeq) loading.value = false
  }
}

function switchTab(key: 'all' | 'income' | 'expense') {
  if (filterType.value === key) return
  filterType.value = key
  records.value = []
  hasMore.value = true
  loadRecords(true)
}

function loadMore() {
  if (hasMore.value && !loading.value) loadRecords(false)
}

function goBack() { uni.navigateBack() }
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  @include page-bg;
  display: flex;
  flex-direction: column;
}

.status-bar { width: 100%; }

// ========== 导航栏 ==========
.page-nav {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx $spacing-base;
  background: rgba(249, 249, 249, 0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1rpx solid rgba(20, 20, 20, 0.04);

  &__back, &__action {
    width: 64rpx; height: 64rpx;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(12px);
    border: 1rpx solid rgba(20, 20, 20, 0.06);
    border-radius: 50%;
    font-size: 28rpx; color: $mineral-gray; flex-shrink: 0;
  }

  &__title {
    flex: 1; font-size: 32rpx; font-weight: 700;
    color: $mineral-gray; text-align: center;
  }
}

// ========== 积分卡片 ==========
.points-overview {
  display: flex;
  gap: $spacing-base;
  padding: $spacing-base;
}

.points-card {
  flex: 1;
  padding: $spacing-base $spacing-lg;
  border-radius: $radius-lg;
  display: flex;
  flex-direction: column;
  gap: 6rpx;

  &__header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 4rpx;
  }

  &__icon {
    width: 44rpx; height: 44rpx;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    font-size: 22rpx; font-weight: 800;
  }

  &__title {
    font-size: 24rpx;
    font-weight: 500;
  }

  &__value {
    font-family: $asset-balance-font;
    font-size: 40rpx;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.5rpx;
  }

  &__tip {
    font-size: 20rpx;
    color: $text-muted;
  }

  &--eco {
    background: rgba(184, 152, 118, 0.12);
    border: 1rpx solid rgba(184, 152, 118, 0.25);

    .points-card__icon { color: $accent-dark; background: rgba(196, 165, 116, 0.25); }
    .points-card__value { color: $accent-dark; }
    .points-card__title { color: $accent-dark; }
  }

  &--credit {
    background: rgba(47, 53, 66, 0.06);
    border: 1rpx solid rgba(47, 53, 66, 0.10);

    .points-card__icon { color: $mineral-gray; background: rgba(47, 53, 66, 0.08); }
    .points-card__value { color: $mineral-gray; }
    .points-card__title { color: $mineral-gray; }
  }
}

// ========== 筛选 Tab ==========
.filter-tabs {
  display: flex;
  padding: 0 $spacing-base $spacing-base;
  gap: 12rpx;
}

.filter-tab {
  height: 72rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1rpx solid rgba(20, 20, 20, 0.06);
  border-radius: $radius-full;
  transition: all 0.2s ease;

  text {
    font-size: 26rpx;
    font-weight: 500;
    color: $text-secondary;
  }

  &.active {
    background: $warm-yellow;
    border-color: $border-primary;

    text { color: $accent-dark; font-weight: 700; }
  }
}

// ========== 列表 ==========
.record-list {
  flex: 1;
  padding: 0 $spacing-base;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 80rpx;
  font-size: 28rpx;
  color: $text-muted;
}

.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 3rpx solid rgba(184, 152, 118, 0.2);
  border-top-color: $accent-dark;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.record-item {
  display: flex;
  align-items: center;
  padding: $spacing-base 0;
  border-bottom: 1rpx solid $border-light;

  &__icon {
    width: 64rpx; height: 64rpx;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 28rpx; font-weight: 700;
    flex-shrink: 0;
    margin-right: $spacing-base;

    &.income {
      background: rgba(184, 152, 118, 0.15);
      color: $accent-dark;
    }

    &.expense {
      background: rgba(47, 53, 66, 0.08);
      color: $text-muted;
    }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__title {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
  }

  &__time {
    font-size: 22rpx;
    color: $text-muted;
  }

  &__points {
    font-family: $asset-balance-font;
    font-size: 32rpx;
    font-weight: 700;
    font-variant-numeric: tabular-nums;

    &.income { color: $accent-dark; }
    &.expense { color: $text-muted; }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  text-align: center;

  &__icon {
    width: 100rpx; height: 100rpx;
    line-height: 100rpx; text-align: center;
    font-size: 36rpx; font-weight: 800;
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: 50%;
    color: $accent-dark;
    margin-bottom: 20rpx;
  }

  &__text {
    font-size: 28rpx;
    color: $text-muted;
  }
}

.load-more, .no-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: $spacing-lg 0;
  font-size: 24rpx;
  color: $text-muted;
}

.list-bottom { width: 100%; }
</style>
