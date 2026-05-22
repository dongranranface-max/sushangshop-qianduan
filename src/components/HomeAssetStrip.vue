<template>
  <view class="asset-strip clay-card">
    <view class="asset-strip__bar" @click="expanded = !expanded">
      <view class="asset-strip__main">
        <text class="asset-strip__label">我的资产</text>
        <text class="asset-strip__total">{{ assetStore.totalAssetsDisplay }}</text>
      </view>
      <text class="asset-strip__toggle">{{ expanded ? '收起 ▲' : '展开 ▼' }}</text>
    </view>
    <view v-if="expanded" class="asset-strip__detail">
      <view class="asset-strip__chips">
        <text class="chip chip--ice">生态 {{ assetStore.ecoPointsDisplay }}</text>
        <text class="chip chip--fire">消费 {{ assetStore.consumerPointsDisplay }}</text>
        <text class="chip chip--gold">昨日 +{{ assetStore.yesterdayProfitDisplay }}</text>
      </view>
      <view class="asset-strip__go" @click.stop="goWealth">
        <text>进入增值专区 ›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { assetStore } from '@/store/asset'

const expanded = ref(false)

function goWealth() {
  uni.switchTab({ url: '/pages/wealth/index' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.asset-strip {
  margin-bottom: 0;
  overflow: hidden;
}
.asset-strip__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $home-card-pad $home-card-pad + 4rpx;
  &:active { background: $bg-tertiary; }
}
.asset-strip__label {
  display: block;
  font-size: 20rpx;
  color: $text-muted;
}
.asset-strip__total {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-primary;
}
.asset-strip__toggle {
  font-size: 22rpx;
  color: $text-secondary;
}
.asset-strip__detail {
  padding: 0 $home-card-pad + 4rpx $home-card-pad;
  border-top: 1rpx solid $border-light;
}
.asset-strip__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  padding-top: 16rpx;
}
.chip {
  font-size: 20rpx;
  padding: 6rpx 12rpx;
  border-radius: $radius-sm;
  &--ice { background: $warm-blue; color: $primary-dark; }
  &--fire { background: $warm-pink; color: $accent-dark; }
  &--gold { background: $warm-yellow; color: #8A7020; }
}
.asset-strip__go {
  margin-top: 16rpx;
  text-align: right;
  font-size: 24rpx;
  color: $text-primary;
  font-weight: 600;
}
</style>
