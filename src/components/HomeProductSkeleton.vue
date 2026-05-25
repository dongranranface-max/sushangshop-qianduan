<template>
  <view class="sk-grid">
    <view v-for="i in count" :key="i" class="sk-card glass-card">
      <view class="sk-card__img shimmer" />
      <view class="sk-card__line shimmer" />
      <view class="sk-card__line sk-card__line--short shimmer" />
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 4 })
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.sk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $home-card-pad;
}
.sk-card {
  position: relative;
  overflow: hidden;
}
.sk-card__img {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: rgba(47, 53, 66, 0.07);
  position: relative;
  overflow: hidden;
}
.sk-card__line {
  height: 22rpx;
  margin: 12rpx 16rpx 0;
  border-radius: 8rpx;
  background: rgba(47, 53, 66, 0.07);
  position: relative;
  overflow: hidden;
  &--short { width: 55%; margin-bottom: 14rpx; }
}

// 使用 page-shell.scss 中定义的扫光骨架屏（.shimmer class）
</style>
