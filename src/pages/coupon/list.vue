<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">我的优惠券</text>
    </view>
    
    <!-- Tab -->
    <view class="coupon-tabs">
      <view 
        class="coupon-tab" 
        :class="{ active: currentTab === 'available' }"
        @click="currentTab = 'available'"
      >
        可用({{ availableCoupons.length }})
      </view>
      <view 
        class="coupon-tab" 
        :class="{ active: currentTab === 'used' }"
        @click="currentTab = 'used'"
      >
        已使用({{ usedCoupons.length }})
      </view>
      <view 
        class="coupon-tab" 
        :class="{ active: currentTab === 'expired' }"
        @click="currentTab = 'expired'"
      >
        已过期({{ expiredCoupons.length }})
      </view>
    </view>
    
    <!-- 优惠券列表 -->
    <scroll-view class="coupon-list" scroll-y>
      <!-- 可用优惠券 -->
      <view v-if="currentTab === 'available'">
        <view 
          class="coupon-card" 
          v-for="coupon in availableCoupons" 
          :key="coupon.id"
          @click="useCoupon(coupon)"
        >
          <view class="coupon-left">
            <view class="coupon-value">
              <text class="value-symbol">¥</text>
              <text class="value-amount">{{ coupon.amount }}</text>
            </view>
            <text class="coupon-desc">满{{ coupon.minAmount }}可用</text>
          </view>
          <view class="coupon-right">
            <text class="coupon-name">{{ coupon.name }}</text>
            <text class="coupon-range">{{ coupon.typeName }}</text>
            <text class="coupon-date">有效期至 {{ formatDate(coupon.expireAt) }}</text>
            <view class="coupon-use-btn">立即使用</view>
          </view>
          <view class="coupon-status available">可用</view>
        </view>
      </view>
      
      <!-- 已使用优惠券 -->
      <view v-if="currentTab === 'used'">
        <view 
          class="coupon-card used" 
          v-for="coupon in usedCoupons" 
          :key="coupon.id"
        >
          <view class="coupon-left">
            <view class="coupon-value">
              <text class="value-symbol">¥</text>
              <text class="value-amount">{{ coupon.amount }}</text>
            </view>
          </view>
          <view class="coupon-right">
            <text class="coupon-name">{{ coupon.name }}</text>
            <text class="coupon-date">使用时间 {{ formatDate(coupon.usedAt) }}</text>
          </view>
          <view class="coupon-status used">已使用</view>
        </view>
      </view>
      
      <!-- 已过期优惠券 -->
      <view v-if="currentTab === 'expired'">
        <view 
          class="coupon-card expired" 
          v-for="coupon in expiredCoupons" 
          :key="coupon.id"
        >
          <view class="coupon-left">
            <view class="coupon-value">
              <text class="value-symbol">¥</text>
              <text class="value-amount">{{ coupon.amount }}</text>
            </view>
          </view>
          <view class="coupon-right">
            <text class="coupon-name">{{ coupon.name }}</text>
            <text class="coupon-date">过期时间 {{ formatDate(coupon.expireAt) }}</text>
          </view>
          <view class="coupon-status expired">已过期</view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="currentList.length === 0">
        <text class="empty-icon">🎫</text>
        <text class="empty-text">暂无优惠券</text>
      </view>
      
      <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { marketingApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const currentTab = ref<'available' | 'used' | 'expired'>('available')
const loading = ref(false)

interface Coupon {
  id: string
  name: string
  amount: string
  minAmount: string
  expireAt: string
  usedAt?: string
  type: number
  typeName: string
}

const availableCoupons = ref<Coupon[]>([])
const usedCoupons = ref<Coupon[]>([])
const expiredCoupons = ref<Coupon[]>([])

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  if (!requireAuth()) return
  loadCoupons()
})

async function loadCoupons() {
  loading.value = true
  try {
    const [availRes, usedRes, expiredRes] = await Promise.all([
      marketingApi.getMyCoupons({ status: 1 }),
      marketingApi.getMyCoupons({ status: 2 }),
      marketingApi.getMyCoupons({ status: 3 }),
    ])
    availableCoupons.value = availRes.list || []
    usedCoupons.value = usedRes.list || []
    expiredCoupons.value = expiredRes.list || []
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

const currentList = computed(() => {
  switch (currentTab.value) {
    case 'available': return availableCoupons.value
    case 'used': return usedCoupons.value
    case 'expired': return expiredCoupons.value
    default: return []
  }
})

function goBack() {
  uni.navigateBack()
}

function useCoupon(_coupon: Coupon) {
  uni.switchTab({ url: '/pages/buy/index' })
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
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

.coupon-tabs {
  display: flex;
  padding: 0 $spacing-lg;
  border-bottom: 1rpx solid $border-color;
  
  .coupon-tab {
    flex: 1;
    text-align: center;
    font-size: 28rpx;
    color: $text-secondary;
    padding: $spacing-base 0;
    border-bottom: 4rpx solid transparent;
    
    &.active {
      color: $primary;
      border-bottom-color: $primary;
      font-weight: 600;
    }
  }
}

.coupon-list {
  height: calc(100vh - 200rpx);
  padding: $spacing-base $spacing-lg;
}

.coupon-card {
  display: flex;
  background: $bg-card;
  border-radius: $radius-md;
  margin-bottom: $spacing-base;
  overflow: hidden;
  position: relative;
  
  &.used, &.expired {
    opacity: 0.6;
    
    .coupon-left {
      .coupon-value { color: $text-muted; }
    }
  }
  
  .coupon-left {
    width: 220rpx;
    background: linear-gradient(135deg, $primary, $primary-dark);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-base;
    
    .coupon-value {
      display: flex;
      align-items: baseline;
      
      .value-symbol {
        font-size: 28rpx;
        color: #fff;
      }
      
      .value-amount {
        font-size: 64rpx;
        font-weight: 700;
        color: #fff;
      }
    }
    
    .coupon-desc {
      font-size: 22rpx;
      color: rgba(255,255,255,0.8);
      margin-top: 8rpx;
    }
  }
  
  .coupon-right {
    flex: 1;
    padding: $spacing-base;
    display: flex;
    flex-direction: column;
    justify-content: center;
    
    .coupon-name {
      font-size: 28rpx;
      font-weight: 600;
      color: $text-primary;
    }
    
    .coupon-range, .coupon-date {
      font-size: 22rpx;
      color: $text-muted;
      margin-top: 8rpx;
    }
    
    .coupon-use-btn {
      width: fit-content;
      padding: 8rpx 24rpx;
      background: linear-gradient(135deg, $primary, $primary-dark);
      border-radius: 50rpx;
      font-size: 22rpx;
      color: #fff;
      margin-top: $spacing-sm;
    }
  }
  
  .coupon-status {
    position: absolute;
    top: 0;
    right: 0;
    padding: 8rpx 24rpx;
    font-size: 20rpx;
    border-radius: 0 $radius-md 0 $radius-sm;
    
    &.available {
      background: $profit;
      color: #000;
    }
    
    &.used {
      background: $text-muted;
      color: #fff;
    }
    
    &.expired {
      background: $danger;
      color: #fff;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-2xl 0;
  
  .empty-icon {
    font-size: 120rpx;
    margin-bottom: $spacing-base;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: $text-secondary;
  }
}
</style>
