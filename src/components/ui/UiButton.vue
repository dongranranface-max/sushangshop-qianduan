// ============================================
//  UiButton.vue - 统一按钮组件
//  支持：primary / secondary / ghost / danger 四种类型
//  支持：small / medium / large 三种尺寸
//  支持：loading / disabled / block 状态
//  内置：点击涟漪 + 过渡动画
// ============================================
<template>
  <button
    class="ui-btn"
    :class="[
      `ui-btn--${type}`,
      `ui-btn--${size}`,
      { 'ui-btn--block': block, 'ui-btn--loading': loading, 'ui-btn--disabled': disabled },
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <view class="ui-btn__inner">
      <view v-if="loading" class="ui-btn__spinner" />
      <text class="ui-btn__text">
        <slot />
      </text>
    </view>
  </button>
</template>

<script setup lang="ts">
interface Props {
  /** 按钮类型 */
  type?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否块级（占满宽度） */
  block?: boolean
  /** 禁用 */
  disabled?: boolean
  /** 加载中 */
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'md',
  block: false,
  disabled: false,
  loading: false,
})

const emit = defineEmits<{
  (e: 'click', event: any): void
}>()

function handleClick(e: any) {
  emit('click', e)
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/animations.scss';

.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  outline: none;
  padding: 0;
  margin: 0;
  background: transparent;
  border-radius: $radius-full;
  font-family: inherit;

  &__inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    width: 100%;
    height: 100%;
    padding: 0 32rpx;
  }

  // ---- 类型 ----
  &--primary {
    background: $navy;
    color: $text-inverse;
    box-shadow: $shadow-glow;

    .ui-btn__text { color: $text-inverse; }
  }

  &--secondary {
    background: $bg-secondary;
    color: $text-primary;
    border: 1rpx solid $border-color;
    box-shadow: none;
  }

  &--ghost {
    background: transparent;
    color: $text-secondary;
    border: none;

    .ui-btn__text { color: $text-secondary; }
  }

  &--danger {
    background: $danger;
    color: $text-inverse;
    box-shadow: 0 8rpx 32rpx rgba($danger, 0.25);
  }

  &--accent {
    background: $accent-fire;
    color: $text-inverse;
    box-shadow: $shadow-fire;
  }

  // ---- 尺寸 ----
  &--sm {
    height: 64rpx;
    .ui-btn__inner { padding: 0 24rpx; }
    .ui-btn__text { font-size: var(--font-sm); }
  }

  &--md {
    height: 80rpx;
    .ui-btn__text { font-size: var(--font-md); }
  }

  &--lg {
    height: 96rpx;
    .ui-btn__inner { padding: 0 48rpx; }
    .ui-btn__text { font-size: var(--font-lg); }
  }

  // ---- 状态 ----
  &--block {
    display: flex;
    width: 100%;
  }

  &--disabled,
  &--loading {
    opacity: 0.5;
    pointer-events: none;
  }

  // ---- 动画 ----
  &:active {
    transform: scale(0.97);
    transition: transform 0.1s ease;
  }

  &__spinner {
    @extend .loading-spinner;
    width: 28rpx;
    height: 28rpx;
    border-width: 2rpx;
  }

  &__text {
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-wide);
    transition: color 0.2s ease;
  }
}
</style>