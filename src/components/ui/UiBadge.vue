// ============================================
//  UiBadge.vue - 徽章组件
//  支持：primary / success / warning / danger / gold 五种颜色
//  支持：dot（圆点）/ count（数字）两种模式
// ============================================
<template>
  <view class="ui-badge" :class="[`ui-badge--${color}`, `ui-badge--${variant}`]">
    <text v-if="variant === 'dot'" class="ui-badge__dot" />
    <text v-else-if="variant === 'count'" class="ui-badge__count">
      {{ displayCount }}
    </text>
    <text v-else class="ui-badge__text"><slot /></text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** 颜色类型 */
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'gold'
  /** 样式变体 */
  variant?: 'text' | 'dot' | 'count'
  /** 数字（variant=count 时使用） */
  count?: number
  /** 最大数字（超过显示 max+） */
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'text',
  count: 0,
  max: 99,
})

const displayCount = computed(() => {
  if (props.count > props.max) {
    return `${props.max}+`
  }
  return String(props.count)
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.ui-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-full;
  font-weight: var(--weight-semibold);

  // ---- 变体 ----
  &--dot {
    width: 16rpx;
    height: 16rpx;
    min-width: 16rpx;
    padding: 0;
  }

  &--count {
    min-width: 36rpx;
    height: 36rpx;
    padding: 0 10rpx;
    font-size: 20rpx;
  }

  &--text {
    padding: 4rpx 16rpx;
    font-size: var(--font-xs);
  }

  // ---- 颜色 ----
  &--primary {
    background: $navy;
    color: $text-inverse;
  }

  &--success {
    background: rgba($success, 0.12);
    color: $success;
    border: 1rpx solid rgba($success, 0.3);
  }

  &--warning {
    background: rgba($warning, 0.12);
    color: $warning;
    border: 1rpx solid rgba($warning, 0.3);
  }

  &--danger {
    background: rgba($danger, 0.12);
    color: $danger;
    border: 1rpx solid rgba($danger, 0.3);
  }

  &--gold {
    background: $warm-yellow;
    color: $accent-dark;
    border: 1rpx solid $border-primary;
  }

  &__dot {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: currentColor;
  }

  &__count {
    font-size: inherit;
    color: inherit;
  }

  &__text {
    font-size: inherit;
    color: inherit;
  }
}
</style>