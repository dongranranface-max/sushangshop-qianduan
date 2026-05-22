<template>
  <view class="brand-logo" :class="[`brand-logo--${size}`]">
    <image
      class="brand-logo__img"
      :src="LOGO_SRC"
      mode="aspectFit"
      :lazy-load="false"
      :show-menu-by-longpress="false"
    />
    <view v-if="showText" class="brand-logo__text">
      <text class="brand-logo__name">{{ BRAND_NAME }}</text>
      <text v-if="tagline" class="brand-logo__tag">{{ tagline }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { BRAND_NAME, LOGO_SRC } from '@/config'

withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    showText?: boolean
    tagline?: string
  }>(),
  { size: 'md', showText: true, tagline: '智能生活 · 轻松享' }
)
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-family: $font-sans;
}
.brand-logo__img {
  flex-shrink: 0;
  border-radius: 50%;
  box-shadow: $shadow-card;
  border: 2rpx solid rgba(196, 165, 116, 0.35);
  /* 高分辨率图源缩小显示，避免发糊 */
  image-rendering: -webkit-optimize-contrast;
}
.brand-logo--sm .brand-logo__img { width: 48rpx; height: 48rpx; }
.brand-logo--md .brand-logo__img { width: 64rpx; height: 64rpx; }
.brand-logo--lg .brand-logo__img { width: 120rpx; height: 120rpx; }

.brand-logo__text { display: flex; flex-direction: column; line-height: var(--leading-tight); }
.brand-logo__name {
  font-size: var(--font-lg);
  font-weight: var(--weight-heavy);
  color: $text-primary;
  letter-spacing: 2rpx;
}
.brand-logo--lg .brand-logo__name { font-size: var(--font-2xl); }
.brand-logo__tag {
  font-size: var(--font-xs);
  color: $text-muted;
  margin-top: 4rpx;
  font-weight: var(--weight-medium);
}
</style>
