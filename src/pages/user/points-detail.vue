<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">积分明细</text>
    </view>
    
    <!-- 积分概览 -->
    <view class="points-overview">
      <view class="points-card eco-card">
        <view class="card-header">
          <text class="card-icon">生</text>
          <text class="card-title">生态积分</text>
        </view>
        <text class="points-value">{{ ecoPoints.toLocaleString() }}</text>
        <text class="points-tips">可理财 · 可换购</text>
      </view>
      <view class="points-card credit-card">
        <view class="card-header">
          <text class="card-icon">消</text>
          <text class="card-title">消费积分</text>
        </view>
        <text class="points-value">{{ creditPoints.toLocaleString() }}</text>
        <text class="points-tips">仅可兑换商品</text>
      </view>
    </view>
    
    <!-- 筛选 Tab -->
    <view class="filter-tabs">
      <view 
        class="filter-tab" 
        :class="{ active: filterType === 'all' }"
        @click="filterType = 'all'"
      >
        全部
      </view>
      <view 
        class="filter-tab" 
        :class="{ active: filterType === 'income' }"
        @click="filterType = 'income'"
      >
        收入
      </view>
      <view 
        class="filter-tab" 
        :class="{ active: filterType === 'expense' }"
        @click="filterType = 'expense'"
      >
        支出
      </view>
    </view>
    
    <!-- 明细列表 -->
    <scroll-view class="record-list" scroll-y @scrolltolower="loadRecords(false)">
      <view 
        class="record-item" 
        v-for="record in filteredRecords" 
        :key="record.id"
      >
        <view class="record-icon" :class="record.type">
          <text>{{ record.type === 'income' ? '↑' : '↓' }}</text>
        </view>
        <view class="record-info">
          <text class="record-title">{{ record.title }}</text>
          <text class="record-time">{{ record.time }}</text>
        </view>
        <text class="record-points" :class="record.type">
          {{ record.type === 'income' ? '+' : '-' }}{{ record.points }}
        </text>
      </view>
      
      <view class="empty-state" v-if="filteredRecords.length === 0">
        <text>暂无记录</text>
      </view>
      
      <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { walletApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const filterType = ref<'all' | 'income' | 'expense'>('all')
const loading = ref(false)
const page = ref(1)
const limit = ref(20)
const hasMore = ref(true)

const ecoPoints = ref('0')
const creditPoints = ref('0')

interface PointsRecord {
  id: string
  type: number // 1=生态积分 2=消费积分
  typeName: string
  amount: string // "+499.95" or "-2000"
  balance: string
  source: string
  sourceName: string
  orderNo?: string
  createdAt: string
}

const records = ref<PointsRecord[]>([])

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  if (!requireAuth()) return
  loadAsset()
  loadRecords(true)
})

async function loadAsset() {
  try {
    const res = await walletApi.getBalance()
    ecoPoints.value = res.ecoPoints
    creditPoints.value = res.consumerPoints
  } catch { /* ignore */ }
}

async function loadRecords(reset = false) {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true
  if (reset) {
    page.value = 1
    records.value = []
    hasMore.value = true
  }

  try {
    const typeMap: Record<string, number | undefined> = { all: undefined, income: 1, expense: 2 }
    const res = await walletApi.getLogs({ type: typeMap[filterType.value], page: page.value, limit: limit.value })
    const list = res.list || []
    if (reset) {
      records.value = list
    } else {
      records.value.push(...list)
    }
    hasMore.value = list.length >= limit.value
    page.value++
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

const filteredRecords = computed(() => {
  return records.value.map(r => {
    const isIncome = r.amount.startsWith('+')
    return {
      id: r.id,
      type: isIncome ? 'income' : 'expense',
      title: r.sourceName,
      time: r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '',
      points: Math.abs(parseFloat(r.amount)).toString(),
      orderNo: r.orderNo,
    }
  })
})

watch(filterType, () => loadRecords(true))

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.page-container {
  @include tab-page-shell;
  padding-left: 0;
  padding-right: 0;
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 32rpx;
  
  .nav-back { font-size: 40rpx; color: $text-primary; }
  .nav-title {
    flex: 1;
    text-align: center;
    font-size: 34rpx;
    font-weight: 600;
    color: $text-primary;
    margin-right: 60rpx;
  }
}

.points-overview {
  display: flex;
  gap: var(--spacing-base);
  padding: 0 var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  
  .points-card {
    flex: 1;
    padding: var(--spacing-lg);
    border-radius: $radius-lg;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
      
      .card-icon {
        width: 44rpx; height: 44rpx; line-height: 44rpx; text-align: center;
        font-size: 24rpx; font-weight: var(--weight-heavy);
        border-radius: 50%;
      }
      
      .card-title {
        font-size: 26rpx;
        color: var(--text-secondary);
      }
    }
    
    .points-value {
      font-size: 48rpx;
      font-weight: 700;
      display: block;
    }
    
    .points-tips {
      font-size: 22rpx;
      color: var(--text-muted);
      margin-top: 4rpx;
      display: block;
    }
    
    &.eco-card {
      @include premium-surface($warm-yellow);
      .card-icon { color: $navy; background: rgba(196, 165, 116, 0.25); }
      .points-value { color: $accent-dark; }
    }
    
    &.credit-card {
      @include premium-surface($warm-blue);
      .card-icon { color: $navy; background: rgba(26, 36, 56, 0.08); }
      .points-value { color: $navy; }
    }
  }
}

.filter-tabs {
  display: flex;
  padding: 0 var(--spacing-lg);
  margin-bottom: var(--spacing-base);
  
  .filter-tab {
    padding: 12rpx 32rpx;
    font-size: 28rpx;
    color: var(--text-secondary);
    border-radius: 50rpx;
    margin-right: var(--spacing-sm);
    
    &.active {
      background: $warm-yellow;
      color: $navy;
      border: 1rpx solid $border-primary;
      font-weight: var(--weight-heavy);
    }
  }
}

.record-list {
  height: calc(100vh - 400rpx);
  padding: 0 var(--spacing-lg);
}

.record-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-base) 0;
  border-bottom: 1rpx solid var(--border-light);
  
  .record-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 700;
    margin-right: var(--spacing-base);
    
    &.income {
      background: rgba(var(--profit), 0.2);
      color: var(--profit);
    }
    
    &.expense {
      background: rgba(var(--danger), 0.2);
      color: var(--danger);
    }
  }
  
  .record-info {
    flex: 1;
    
    .record-title {
      font-size: 28rpx;
      color: var(--text-primary);
      display: block;
    }
    
    .record-time {
      font-size: 22rpx;
      color: var(--text-muted);
    }
  }
  
  .record-points {
    font-size: 32rpx;
    font-weight: 700;
    
    &.income { color: var(--profit); }
    &.expense { color: var(--danger); }
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}
</style>
