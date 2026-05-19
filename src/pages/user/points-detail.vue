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
          <text class="card-icon">💰</text>
          <text class="card-title">生态积分</text>
        </view>
        <text class="points-value">{{ ecoPoints.toLocaleString() }}</text>
        <text class="points-tips">可理财 · 可换购</text>
      </view>
      <view class="points-card credit-card">
        <view class="card-header">
          <text class="card-icon">🎫</text>
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

.page-container {
  min-height: 100vh;
  background: $bg-primary;
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 32rpx;
  
  .nav-back {
    font-size: 40rpx;
    color: #fff;
  }
  
  .nav-title {
    flex: 1;
    text-align: center;
    font-size: 34rpx;
    font-weight: 600;
    color: #fff;
    margin-right: 60rpx;
  }
}

.points-overview {
  display: flex;
  gap: $spacing-base;
  padding: 0 $spacing-lg;
  margin-bottom: $spacing-lg;
  
  .points-card {
    flex: 1;
    padding: $spacing-lg;
    border-radius: $radius-md;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      margin-bottom: $spacing-sm;
      
      .card-icon {
        font-size: 36rpx;
      }
      
      .card-title {
        font-size: 26rpx;
        color: $text-secondary;
      }
    }
    
    .points-value {
      font-size: 48rpx;
      font-weight: 700;
      display: block;
    }
    
    .points-tips {
      font-size: 22rpx;
      color: $text-muted;
      margin-top: 4rpx;
      display: block;
    }
    
    &.eco-card {
      background: linear-gradient(135deg, rgba($gold, 0.2), rgba($gold, 0.05));
      border: 1rpx solid rgba($gold, 0.3);
      
      .points-value { color: $gold; }
    }
    
    &.credit-card {
      background: linear-gradient(135deg, rgba($primary, 0.2), rgba($primary, 0.05));
      border: 1rpx solid rgba($primary, 0.3);
      
      .points-value { color: $primary; }
    }
  }
}

.filter-tabs {
  display: flex;
  padding: 0 $spacing-lg;
  margin-bottom: $spacing-base;
  
  .filter-tab {
    padding: 12rpx 32rpx;
    font-size: 28rpx;
    color: $text-secondary;
    border-radius: 50rpx;
    margin-right: $spacing-sm;
    
    &.active {
      background: $primary;
      color: #fff;
    }
  }
}

.record-list {
  height: calc(100vh - 400rpx);
  padding: 0 $spacing-lg;
}

.record-item {
  display: flex;
  align-items: center;
  padding: $spacing-base 0;
  border-bottom: 1rpx solid $border-light;
  
  .record-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 700;
    margin-right: $spacing-base;
    
    &.income {
      background: rgba($profit, 0.2);
      color: $profit;
    }
    
    &.expense {
      background: rgba($danger, 0.2);
      color: $danger;
    }
  }
  
  .record-info {
    flex: 1;
    
    .record-title {
      font-size: 28rpx;
      color: $text-primary;
      display: block;
    }
    
    .record-time {
      font-size: 22rpx;
      color: $text-muted;
    }
  }
  
  .record-points {
    font-size: 32rpx;
    font-weight: 700;
    
    &.income { color: $profit; }
    &.expense { color: $danger; }
  }
}

.empty-state {
  text-align: center;
  padding: $spacing-2xl;
  color: $text-muted;
}
</style>
