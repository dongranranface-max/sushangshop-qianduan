// ============================================
//  SkeletonScreen.vue - 骨架屏组件
//  用于列表/卡片加载占位，提升感知性能
// ============================================
<template>
  <view class="skeleton" :class="[`skeleton--${variant}`]">
    <view v-if="avatar" class="skeleton__avatar" :class="[`skeleton__avatar--${avatarShape}`]" />
    <view class="skeleton__content">
      <view v-if="title" class="skeleton__title" />
      <view class="skeleton__rows">
        <view
          v-for="i in rows"
          :key="i"
          class="skeleton__row"
          :class="[`skeleton__row--${rowWidths[i - 1] || 'full'}`]"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  /** 变体：card / list / avatar / text */
  variant?: 'card' | 'list' | 'avatar' | 'text' | 'product'
  /** 是否显示头像 */
  avatar?: boolean
  /** 头像形状：circle / square */
  avatarShape?: 'circle' | 'square'
  /** 标题行是否显示 */
  title?: boolean
  /** 内容行数 */
  rows?: number
  /** 每行宽度（数组，'full' | 'medium' | 'short'） */
  rowWidths?: Array<'full' | 'medium' | 'short'>
}

withDefaults(defineProps<Props>(), {
  variant: 'text',
  avatar: false,
  avatarShape: 'circle',
  title: false,
  rows: 3,
  rowWidths: () => ['full', 'full', 'medium'],
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/animations.scss';

.skeleton {
  display: flex;
  gap: 20rpx;

  &--card {
    flex-direction: column;
    gap: 0;
  }

  &--product {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20rpx;
  }

  &--list {
    align-items: center;
  }

  &__avatar {
    flex-shrink: 0;
    width: 80rpx;
    height: 80rpx;

    &--circle {
      border-radius: 50%;
    }

    &--square {
      border-radius: $radius-md;
    }
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  &__title {
    height: 32rpx;
    width: 60%;
    border-radius: $radius-sm;
    @extend .shimmer;
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  &__row {
    height: 24rpx;
    border-radius: $radius-sm;

    &--full { width: 100%; }
    &--medium { width: 70%; }
    &--short { width: 40%; }

    @extend .shimmer;
  }
}
</style>