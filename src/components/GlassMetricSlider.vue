<template>
  <view class="metric-slider">
    <swiper class="metric-slider__swiper" :current="idx" circular @change="onChange">
      <swiper-item v-for="(m, i) in metrics" :key="i">
        <view class="metric-card clay-dashboard">
          <text class="metric-card__label">{{ m.label }}</text>
          <view class="metric-card__row">
            <text class="metric-card__value" :class="m.theme">{{ m.value }}</text>
            <text class="metric-card__unit">{{ m.unit }}</text>
          </view>
          <text class="metric-card__hint">{{ m.hint }}</text>
        </view>
      </swiper-item>
    </swiper>
    <view class="metric-slider__dots">
      <view v-for="(_, i) in metrics" :key="i" class="dot" :class="{ active: idx === i }" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { assetStore } from '@/store/asset'

const idx = ref(0)

const metrics = computed(() => [
  {
    label: '昨日分红',
    value: assetStore.yesterdayProfitDisplay,
    unit: '积分',
    hint: '等级日分红自动到账',
    theme: 'gold',
  },
  {
    label: '累计收益',
    value: assetStore.stateRef.totalEarnings.toLocaleString('zh-CN'),
    unit: '积分',
    hint: '含理财与推荐奖励',
    theme: 'navy',
  },
  {
    label: '小区业绩',
    value: assetStore.stateRef.teamPerformance.toLocaleString('zh-CN'),
    unit: '积分',
    hint: `当前 ${assetStore.levelName} · 距升级还差 ${assetStore.stateRef.upgradeNeed}`,
    theme: 'accent',
  },
])

function onChange(e: { detail: { current: number } }) {
  idx.value = e.detail.current
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.metric-slider { margin-bottom: 24rpx; }
.metric-slider__swiper { height: 200rpx; }
.metric-card {
  margin: 0 4rpx;
  padding: 28rpx 32rpx;
  height: 168rpx;
}
.metric-card__label { font-size: var(--font-sm); color: $text-muted; }
.metric-card__row {
  display: flex;
  align-items: baseline;
  margin-top: 12rpx;
}
.metric-card__value {
  font-size: 48rpx;
  font-weight: var(--weight-heavy);
  &.navy { color: $navy; }
  &.gold { color: $accent-dark; }
  &.accent { color: $navy-light; }
}
.metric-card__unit {
  font-size: var(--font-sm);
  color: $text-muted;
  margin-left: 8rpx;
}
.metric-card__hint { font-size: var(--font-xs); color: $text-muted; margin-top: 8rpx; }
.metric-slider__dots {
  display: flex;
  justify-content: center;
  gap: 10rpx;
  margin-top: 12rpx;
}
.dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: $border-color;
  &.active {
    width: 24rpx;
    border-radius: 5rpx;
    background: $accent;
  }
}
</style>
