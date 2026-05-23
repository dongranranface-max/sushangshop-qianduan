<template>
  <view class="level-card" @click="$emit('click')">
    <view class="level-card__glow" />
    <view class="level-card__glow level-card__glow--2" />

    <view class="level-header">
      <view class="level-hero">
        <view class="level-hero__tier">
          <text class="level-tier-label">{{ levelData.levelName || 'VIP' }}</text>
          <text class="level-tier-num">{{ levelData.level || 0 }}</text>
        </view>
        <view class="level-hero__meta">
          <text class="level-name-upper">{{ levelData.levelName || '' }}</text>
          <text class="level-subtitle">享受每日分红特权</text>
        </view>
      </view>

      <view class="level-dividend">
        <text class="dividend-label">昨日分红</text>
        <text class="dividend-value">
          {{ formatPoints(levelData.totalBonus || '0') }}
        </text>
        <text class="dividend-unit">积分</text>
      </view>
    </view>

    <view class="level-progress">
      <view class="progress-info">
        <text class="progress-current">{{ formatPoints(levelData.teamPerformance || '0') }}</text>
        <text class="progress-separator">/</text>
        <text class="progress-target">{{ formatPoints(levelData.nextMinPerformance || levelData.minPerformance || '0') }}</text>
        <text class="progress-unit">积分</text>
      </view>
      <view class="progress-bar">
        <view
          class="progress-fill"
          :style="{ width: Math.min(100, progressPct) + '%' }"
        />
      </view>
      <text class="progress-tip">
        距离 {{ levelData.nextLevelName || '下一等级' }} 还差
        {{ formatPoints(levelData.upgradeNeed || '0') }} 积分
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface LevelData {
  level?: number
  levelName?: string
  icon?: string
  teamPerformance?: string
  minPerformance?: string
  nextMinPerformance?: string
  dailyBonus?: string
  totalBonus?: string
  nextLevel?: number
  nextLevelName?: string
  upgradeNeed?: string
}

const props = withDefaults(
  defineProps<{
    levelData: LevelData
  }>(),
  { levelData: () => ({}) }
)

defineEmits<{ (e: 'click'): void }>()

const progressPct = computed(() => {
  const current = parseFloat(props.levelData.teamPerformance || '0')
  const target = parseFloat(
    props.levelData.nextMinPerformance ||
      props.levelData.minPerformance ||
      '1'
  )
  if (!target) return 0
  return Math.round((current / target) * 100)
})

function formatPoints(v: string | number): string {
  const num = parseFloat(String(v || '0'))
  if (isNaN(num)) return '0'
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  return num.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.level-card {
  position: relative;
  overflow: hidden;
  border-radius: $radius-2xl;
  padding: 40rpx 32rpx 36rpx;
  margin-bottom: var(--spacing-lg);
  @include premium-surface($warm-yellow);
  border: 1rpx solid $border-primary;
  box-shadow: $shadow-gold;

  &__glow {
    position: absolute;
    top: -25%;
    right: -10%;
    width: 50%;
    height: 55%;
    background: radial-gradient(circle, rgba(184, 152, 118, 0.3) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;

    &--2 {
      display: none;
    }
  }
}

.level-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.level-hero {
  flex: 1;
  min-width: 0;

  &__tier {
    display: flex;
    align-items: baseline;
    gap: 6rpx;
    margin-bottom: 12rpx;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }
}

.level-tier-label {
  font-size: var(--font-card-title);
  font-weight: var(--weight-bold);
  letter-spacing: 0.2em;
  color: $accent-dark;
  text-transform: uppercase;
}

.level-tier-num {
  font-size: 64rpx;
  font-weight: var(--weight-heavy);
  line-height: 1;
  color: $navy;
}

.level-name-upper {
  font-size: var(--font-caption);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: $navy-light;
}

.level-subtitle {
  font-size: var(--font-body);
  font-weight: var(--weight-regular);
  color: $text-muted;
}

.level-dividend {
  flex-shrink: 0;
  text-align: right;

  .dividend-label {
    @include type-caption;
    display: block;
    color: $text-muted;
  }

  .dividend-value {
    display: block;
    font-size: var(--font-page-title);
    font-weight: var(--weight-bold);
    color: $accent-dark;
    line-height: 1.2;
  }

  .dividend-unit {
    font-size: var(--font-caption);
    color: $text-muted;
  }
}

.level-progress {
  position: relative;
  z-index: 1;
  margin-top: 36rpx;

  .progress-info {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 6rpx;
    margin-bottom: 16rpx;

    .progress-current {
      font-size: var(--font-page-title);
      font-weight: var(--weight-bold);
      color: $accent-dark;
    }

    .progress-separator,
    .progress-target,
    .progress-unit {
      font-size: var(--font-body);
      font-weight: var(--weight-regular);
      color: $text-muted;
    }
  }

  .progress-bar {
    height: 14rpx;
    background: $bg-tertiary;
    border-radius: $radius-full;
    overflow: visible;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    min-width: 4%;
    max-width: 100%;
    border-radius: $radius-full;
    background: $bronze-gradient;
    box-shadow: 0 0 16rpx rgba(184, 152, 118, 0.5);
    transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .progress-tip {
    @include type-caption;
    margin-top: 14rpx;
    color: $text-muted;
  }
}
</style>
