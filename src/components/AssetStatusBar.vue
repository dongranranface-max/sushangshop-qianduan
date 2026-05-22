<template>
  <view class="asset-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="asset-bar__inner">
      <BrandLogo size="sm" :show-text="false" />
      <scroll-view scroll-x class="asset-bar__scroll" :show-scrollbar="false">
        <view class="asset-bar__chips">
          <view class="chip chip--total">
            <text class="chip__label">总资产</text>
            <text class="chip__value">{{ assetStore.totalAssetsDisplay }}</text>
          </view>
          <view class="chip">
            <text class="chip__label">生态积分</text>
            <text class="chip__value chip__value--eco">{{ assetStore.ecoPointsDisplay }}</text>
          </view>
          <view class="chip">
            <text class="chip__label">消费积分</text>
            <text class="chip__value chip__value--consume">{{ assetStore.consumerPointsDisplay }}</text>
          </view>
          <view class="chip">
            <text class="chip__label">今日分红</text>
            <text class="chip__value chip__value--gold">+{{ assetStore.yesterdayProfitDisplay }}</text>
          </view>
        </view>
      </scroll-view>
      <view class="asset-bar__profit" @click="goWealth">
        <text class="asset-bar__profit-label">增值区</text>
        <text class="asset-bar__profit-arrow">›</text>
      </view>
    </view>
    <view class="asset-bar__formula">生态 + 消费 + 待收分红</view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { assetStore } from '@/store/asset'
import BrandLogo from '@/components/BrandLogo.vue'

const statusBarHeight = ref(20)

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
})

function goWealth() {
  uni.switchTab({ url: '/pages/wealth/index' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.asset-bar {
  position: sticky;
  top: 0;
  z-index: 200;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 244, 241, 0.95));
  border-bottom: 1rpx solid $border-light;
  backdrop-filter: blur(20px);
}

.asset-bar__inner {
  display: flex;
  align-items: center;
  padding: 12rpx 20rpx 8rpx;
  gap: 12rpx;
}

.asset-bar__scroll {
  flex: 1;
  white-space: nowrap;
}

.asset-bar__chips {
  display: inline-flex;
  gap: 12rpx;
}

.chip {
  display: inline-flex;
  flex-direction: column;
  padding: 10rpx 18rpx;
  @include premium-surface($bg-secondary);
  border-radius: $radius-md;
  min-width: 132rpx;
}
.chip--total {
  background: $warm-yellow;
  border-color: $border-primary;
}
.chip__label {
  font-size: var(--font-xs);
  color: $text-muted;
}
.chip__value {
  font-size: var(--font-sm);
  font-weight: var(--weight-heavy);
  color: $text-primary;
  margin-top: 4rpx;
}
.chip__value--eco { color: $navy-light; }
.chip__value--consume { color: $accent-dark; }
.chip__value--gold { color: $accent-dark; }

.asset-bar__profit {
  flex-shrink: 0;
  padding: 12rpx 18rpx;
  background: $navy;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  gap: 4rpx;
}
.asset-bar__profit-label {
  font-size: var(--font-xs);
  color: $text-inverse;
  font-weight: var(--weight-semibold);
}
.asset-bar__profit-arrow {
  color: $gold-light;
  font-size: 28rpx;
}

.asset-bar__formula {
  font-size: var(--font-xs);
  color: $text-muted;
  text-align: center;
  padding-bottom: 10rpx;
}
</style>
