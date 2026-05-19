<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="page-header">
      <text class="page-title">我的理财</text>
    </view>

    <view v-if="holdings.length === 0" class="empty">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无理财持仓</text>
      <text class="empty-sub">去理财专区申购吧</text>
      <view class="go-invest" @click="goInvest">立即申购</view>
    </view>

    <scroll-view v-else scroll-y class="holding-list">
      <view
        v-for="h in holdings"
        :key="h.id"
        class="holding-card"
      >
        <view class="card-header">
          <text class="product-name">{{ h.productName }}</text>
          <view :class="['status-tag', h.canRedeem ? 'active' : 'inactive']">
            {{ h.status }}
          </view>
        </view>
        <view class="card-stats">
          <view class="stat">
            <text class="stat-label">申购份额</text>
            <text class="stat-val">{{ Number(h.amount).toLocaleString() }}</text>
          </view>
          <view class="stat">
            <text class="stat-label">预期收益</text>
            <text class="stat-val profit">+{{ Number(h.expectedEarning).toLocaleString() }}</text>
          </view>
          <view class="stat">
            <text class="stat-label">实际收益</text>
            <text class="stat-val profit">+{{ Number(h.actualEarning).toLocaleString() }}</text>
          </view>
        </view>
        <view class="card-date">
          <text>起止：{{ formatDate(h.startDate) }} ~ {{ formatDate(h.endDate) }}</text>
        </view>
        <view v-if="h.canRedeem" class="card-actions">
          <view class="redeem-btn" @click="doRedeem(h, false)">到期赎回</view>
          <view class="early-btn" @click="doRedeem(h, true)">提前赎回</view>
        </view>
      </view>
    </scroll-view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { financialApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const holdings = ref<any[]>([])
const loading = ref(false)

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  if (!requireAuth()) return
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const res = await financialApi.getHoldings({ limit: 50 })
    holdings.value = res.list || []
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

function goInvest() {
  uni.navigateTo({ url: '/pages/wealth/invest' })
}

async function doRedeem(h: any, early: boolean) {
  uni.showModal({
    title: '确认赎回',
    content: early ? `提前赎回将收取手续费，确认赎回？` : `确认到期赎回？`,
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading()
      try {
        await financialApi.redeem({ holdingId: h.holdingId || h.id, early })
        uni.showToast({ title: '赎回成功', icon: 'success' })
        loadData()
      } catch (e: any) {
        uni.showToast({ title: e.message || '赎回失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
  })
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
  padding: $spacing-base 0;

  .page-title {
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
  }
}

.empty {
  text-align: center;
  padding: 120rpx 0;

  .empty-icon {
    font-size: 120rpx;
    display: block;
  }

  .empty-text {
    font-size: 32rpx;
    color: $text-primary;
    display: block;
    margin-top: $spacing-base;
  }

  .empty-sub {
    font-size: 26rpx;
    color: $text-muted;
    display: block;
    margin-top: 8rpx;
  }

  .go-invest {
    display: inline-block;
    margin-top: $spacing-xl;
    background: $primary;
    color: #000;
    padding: 16rpx 48rpx;
    border-radius: 50rpx;
    font-size: 28rpx;
    font-weight: 600;
  }
}

.holding-list {
  height: calc(100vh - 200rpx);
}

.holding-card {
  background: $bg-card;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  padding: $spacing-base $spacing-lg;
  margin-bottom: $spacing-base;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .product-name {
      font-size: 30rpx;
      font-weight: 600;
      color: $text-primary;
    }

    .status-tag {
      font-size: 22rpx;
      padding: 4rpx 16rpx;
      border-radius: 8rpx;

      &.active {
        background: rgba($profit, 0.2);
        color: $profit;
      }

      &.inactive {
        background: $bg-secondary;
        color: $text-muted;
      }
    }
  }

  .card-stats {
    display: flex;
    justify-content: space-around;
    margin: $spacing-base 0;

    .stat {
      text-align: center;

      .stat-label {
        font-size: 22rpx;
        color: $text-muted;
        display: block;
      }

      .stat-val {
        font-size: 28rpx;
        font-weight: 600;
        color: $text-primary;
        display: block;
        margin-top: 4rpx;

        &.profit {
          color: $profit;
        }
      }
    }
  }

  .card-date {
    font-size: 22rpx;
    color: $text-muted;
  }

  .card-actions {
    display: flex;
    gap: $spacing-base;
    margin-top: $spacing-base;

    .redeem-btn, .early-btn {
      flex: 1;
      text-align: center;
      padding: 14rpx;
      border-radius: 24rpx;
      font-size: 26rpx;
      font-weight: 600;
    }

    .redeem-btn {
      background: $profit;
      color: #000;
    }

    .early-btn {
      border: 1rpx solid $border-color;
      color: $text-secondary;
    }
  }
}
</style>
