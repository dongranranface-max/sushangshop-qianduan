<template>
  <view class="order-status-bar">
    <view
      v-for="item in statusList"
      :key="item.key"
      class="order-status-bar__item"
      @click="goOrders(item.key)"
    >
      <view class="order-status-bar__icon-wrap">
        <text class="order-status-bar__icon">{{ item.icon }}</text>
      </view>
      <text class="order-status-bar__label">{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface StatusItem {
  key: string
  label: string
  icon: string
}

const statusList = ref<StatusItem[]>([
  { key: '0', label: '待付款', icon: '📋' },
  { key: '1', label: '待发货', icon: '📦' },
  { key: '2', label: '待收货', icon: '🚚' },
  { key: '3', label: '已完成', icon: '✅' },
])

function goOrders(tab: string) {
  uni.switchTab({ url: `/pages/order/list?tab=${tab}` })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.order-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 24rpx 16rpx 20rpx;
  background: $bg-secondary;
  border-bottom: 1rpx solid $border-color;
}

.order-status-bar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  flex: 1;
  cursor: pointer;
  &:active { opacity: 0.65; }
}

.order-status-bar__icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  background: $warm-yellow;
  border-radius: 50%;
}

.order-status-bar__icon {
  font-size: 36rpx;
  line-height: 1;
}

.order-status-bar__label {
  font-size: 22rpx;
  color: $text-secondary;
  font-weight: 500;
}
</style>
