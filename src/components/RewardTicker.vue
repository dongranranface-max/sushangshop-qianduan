<template>
  <!-- 首页：动态信息卡片列表 -->
  <view v-if="variant === 'feed'" class="activity-feed" @click="emit('click')">
    <view class="activity-feed__head">
      <view class="activity-feed__title-wrap">
        <view class="activity-feed__live" />
        <text class="activity-feed__title">{{ label }}</text>
      </view>
      <text class="activity-feed__more">{{ moreText }}</text>
    </view>

    <view class="activity-feed__viewport">
      <view class="activity-feed__fade activity-feed__fade--top" />
      <view
        class="activity-feed__track"
        :style="{ '--row-count': items.length, '--row-h': rowHeight }"
      >
        <view
          v-for="(item, idx) in scrollLoopItems"
          :key="`${item.id}-${idx}`"
          class="activity-feed__row"
        >
          <view class="activity-feed__badge" :class="`activity-feed__badge--${item.type}`">
            <text>{{ item.badge }}</text>
          </view>
          <view class="activity-feed__main">
            <view class="activity-feed__line1">
              <text class="activity-feed__user">{{ item.user }}</text>
              <text class="activity-feed__action">{{ item.action }}</text>
            </view>
            <text class="activity-feed__time">{{ item.time }}</text>
          </view>
          <view class="activity-feed__amount-wrap">
            <text class="activity-feed__amount">{{ item.amount }}</text>
            <text v-if="item.amountUnit" class="activity-feed__unit">{{ item.amountUnit }}</text>
          </view>
        </view>
      </view>
      <view class="activity-feed__fade activity-feed__fade--bottom" />
    </view>
  </view>

  <!-- 兼容：单行滚动条 -->
  <view v-else class="ticker" :class="[`ticker--${variant}`]" @click="emit('click')">
    <view class="ticker__label">
      <view class="ticker__dot" />
      <text class="ticker__label-text">{{ label }}</text>
    </view>
    <view class="ticker__track">
      <view class="ticker__mask ticker__mask--left" />
      <view class="ticker__marquee">
        <view class="ticker__content">
          <text v-for="(t, i) in doubled" :key="i" class="ticker__item">{{ t }}</text>
        </view>
      </view>
      <view class="ticker__mask ticker__mask--right" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ActivityItem {
  id: string
  badge: string
  type: 'wealth' | 'exchange' | 'consume' | 'referral' | 'level'
  user: string
  action: string
  amount: string
  amountUnit?: string
  time: string
}

withDefaults(
  defineProps<{
    variant?: 'feed' | 'compact' | 'card'
    label?: string
    moreText?: string
  }>(),
  {
    variant: 'feed',
    label: '动态信息',
    moreText: '增值专区 ›',
  }
)

const items: ActivityItem[] = [
  {
    id: '1',
    badge: '增',
    type: 'wealth',
    user: '138****6721',
    action: '申购理财',
    amount: '+580',
    amountUnit: '积分',
    time: '刚刚',
  },
  {
    id: '2',
    badge: '换',
    type: 'exchange',
    user: '159****3308',
    action: '换购下单',
    amount: '+30%',
    amountUnit: '消费积分',
    time: '1 分钟前',
  },
  {
    id: '3',
    badge: '购',
    type: 'consume',
    user: '186****9012',
    action: '确认收货',
    amount: '+50',
    amountUnit: '生态积分',
    time: '3 分钟前',
  },
  {
    id: '4',
    badge: '邀',
    type: 'referral',
    user: '177****4455',
    action: '推荐奖励',
    amount: '+88',
    amountUnit: '积分',
    time: '5 分钟前',
  },
  {
    id: '5',
    badge: '级',
    type: 'level',
    user: '135****7788',
    action: '升级会员',
    amount: 'V4',
    time: '8 分钟前',
  },
]

const rowHeight = '96rpx'

const scrollLoopItems = computed(() => [...items, ...items])

const marqueeTexts = computed(() =>
  items.map((x) => `${x.user} ${x.action} ${x.amount}${x.amountUnit ? ' ' + x.amountUnit : ''}`)
)

const doubled = computed(() => [...marqueeTexts.value, ...marqueeTexts.value])
const emit = defineEmits<{ (e: 'click'): void }>()
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

// —— 动态信息（首页 feed）——
.activity-feed {
  @include premium-surface($bg-secondary);
  border-radius: $radius-xl;
  padding: $home-card-pad $home-card-pad $home-card-pad;
  margin-bottom: 0;
  box-sizing: border-box;

  &:active {
    opacity: 0.96;
  }
}

.activity-feed__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding-bottom: $home-card-pad;
  border-bottom: 1rpx solid $border-light;
}

.activity-feed__title-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.activity-feed__live {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $gold;
  box-shadow: 0 0 0 4rpx rgba(196, 165, 116, 0.25);
  animation: live-pulse 2s ease-in-out infinite;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.65; transform: scale(0.92); }
}

.activity-feed__title {
  @include type-card-title;
  letter-spacing: var(--tracking-wide);
}

.activity-feed__more {
  font-size: var(--font-xs);
  color: $text-accent;
  font-weight: var(--weight-semibold);
}

.activity-feed__viewport {
  position: relative;
  height: var(--row-h, 96rpx);
  overflow: hidden;
}

.activity-feed__fade {
  position: absolute;
  left: 0;
  right: 0;
  height: 20rpx;
  z-index: 2;
  pointer-events: none;
}

.activity-feed__fade--top {
  top: 0;
  background: linear-gradient(180deg, $bg-secondary, transparent);
}

.activity-feed__fade--bottom {
  bottom: 0;
  background: linear-gradient(0deg, $bg-secondary, transparent);
}

.activity-feed__track {
  display: flex;
  flex-direction: column;
  animation: feed-scroll-vertical calc(var(--row-count, 3) * 2.8s) linear infinite;

  &:hover {
    animation-play-state: paused;
  }
}

@keyframes feed-scroll-vertical {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

.activity-feed__row {
  display: flex;
  align-items: center;
  gap: $home-card-pad;
  height: var(--row-h, 96rpx);
  flex-shrink: 0;
  box-sizing: border-box;
  padding: 0 4rpx;
}

.activity-feed__badge {
  flex-shrink: 0;
  width: 52rpx;
  height: 52rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 26rpx;
    font-weight: var(--weight-heavy);
    color: $navy;
  }

  &--wealth {
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
  }

  &--exchange {
    background: $warm-blue;
  }

  &--consume {
    background: #EEF5F0;
    text { color: $success; }
  }

  &--referral {
    background: $warm-pink;
  }

  &--level {
    background: linear-gradient(135deg, $gold-light, $gold);
    text { color: $navy; }
  }
}

.activity-feed__main {
  flex: 1;
  min-width: 0;
}

.activity-feed__line1 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 6rpx;
}

.activity-feed__user {
  font-size: var(--font-sm);
  font-weight: var(--weight-semibold);
  color: $text-primary;
}

.activity-feed__action {
  font-size: var(--font-sm);
  color: $text-secondary;
}

.activity-feed__time {
  font-size: 22rpx;
  color: $text-muted;
}

.activity-feed__amount-wrap {
  flex-shrink: 0;
  text-align: right;
  max-width: 160rpx;
}

.activity-feed__amount {
  display: block;
  font-size: 30rpx;
  font-weight: var(--weight-heavy);
  color: $accent-dark;
  line-height: 1.2;
}

.activity-feed__unit {
  display: block;
  font-size: 20rpx;
  color: $text-muted;
  margin-top: 4rpx;
}

// —— 单行滚动（compact）——
.ticker {
  display: flex;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.ticker--compact {
  height: 72rpx;
  border-radius: $radius-md;
  @include premium-surface($bg-secondary);
  margin-bottom: 0;
}

.ticker__label {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 0 20rpx;
  border-right: 1rpx solid $border-light;
}

.ticker__dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $gold;
  box-shadow: 0 0 12rpx rgba(196, 165, 116, 0.6);
}

.ticker__label-text {
  font-size: var(--font-xs);
  font-weight: var(--weight-bold);
  color: $text-accent;
  letter-spacing: var(--tracking-wide);
}

.ticker__track {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.ticker__marquee {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.ticker__content {
  display: inline-flex;
  white-space: nowrap;
  animation: ticker-scroll 32s linear infinite;
}

.ticker__item {
  font-size: var(--font-sm);
  color: $text-secondary;
  padding-right: 56rpx;
  letter-spacing: var(--tracking-normal);
}

.ticker__mask {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40rpx;
  z-index: 2;
  pointer-events: none;
}

.ticker__mask--left {
  left: 0;
  background: linear-gradient(90deg, #ffffff, transparent);
}

.ticker__mask--right {
  right: 0;
  background: linear-gradient(270deg, #ffffff, transparent);
}

@keyframes ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
</style>
