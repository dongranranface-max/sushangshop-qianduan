<template>
  <view class="p-card clay-card-hover" @click="emit('click')">
    <view class="p-card__media">
      <view class="p-card__badge" :class="`p-card__badge--t${type}`">{{ badge }}</view>
      <LaxImage class="p-card__img" :src="cover" aspect-ratio="100%" mode="aspectFill" />
    </view>
    <view class="p-card__body">
      <text class="p-card__name">{{ product.name }}</text>
      <view v-if="type === 1" class="p-card__price">
        <text class="p-card__cash">¥{{ product.price }}</text>
        <text class="p-card__tag p-card__tag--ice">返积分</text>
      </view>
      <view v-else-if="type === 2" class="p-card__price">
        <text class="p-card__cash">¥{{ product.price }}</text>
        <text class="p-card__tag p-card__tag--green">+{{ product.requiredPoints || 0 }}积分</text>
      </view>
      <view v-else class="p-card__price">
        <text class="p-card__redeem">{{ product.requiredPoints }} 消费积分</text>
      </view>
      <text v-if="salesText" class="p-card__sales">{{ salesText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LaxImage from '@/components/lazy/LaxImage.vue'

const props = defineProps<{
  product: Record<string, any>
  type: 1 | 2 | 3
  defaultCover?: string
}>()

const emit = defineEmits<{ (e: 'click'): void }>()

const badge = computed(() => {
  if (props.type === 1) return '消费'
  if (props.type === 2) return '换购'
  return '兑换'
})

const cover = computed(
  () => props.product.coverImage || props.product.image || props.defaultCover || ''
)

const salesText = computed(() => {
  const n = props.product.salesCount ?? props.product.soldCount
  if (n != null && Number(n) > 0) {
    const v = Number(n) >= 10000 ? `${(Number(n) / 10000).toFixed(1)}万` : String(n)
    return `已售 ${v}`
  }
  return '热卖'
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.p-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: $radius-lg;
  overflow: hidden;
}

/* 1:1 方图，商品展示更统一 */
.p-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  overflow: hidden;
  background: $bg-tertiary;
}

.p-card__img {
  width: 100%;
  display: block;
  // 高度由 LaxImage 的 padding-bottom: 100% 控制（1:1）
}

.p-card__badge {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  z-index: 2;
  font-size: 18rpx;
  padding: 4rpx 10rpx;
  border-radius: $radius-sm;
  font-weight: 600;
  &--t1 { background: $warm-yellow; color: $accent-dark; border: 1rpx solid $border-primary; }
  &--t2 { background: $warm-blue; color: $navy-light; }
  &--t3 { background: $navy; color: $gold-light; }
}

/* 信息区收窄：约 35% 高度 */
.p-card__body {
  flex: 1;
  min-height: 0;
  padding: 12rpx 16rpx 14rpx;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.p-card__name {
  @include type-card-title;
  line-height: 1.35;
  @include line-clamp(2);
}

.p-card__price {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6rpx;
  margin-top: 6rpx;
}

.p-card__cash,
.p-card__redeem {
  font-size: 20rpx;
  font-weight: var(--weight-heavy);
  color: $text-primary;
  letter-spacing: var(--tracking-tight);
}

.p-card__tag {
  font-size: 20rpx;
  padding: 0;
  border-radius: 0;
  font-weight: var(--weight-semibold);
  &--ice { color: $primary-dark; background: transparent; }
  &--green { color: #2A8A6A; background: transparent; }
}

.p-card__sales {
  display: block;
  font-size: 18rpx;
  color: $text-muted;
  margin-top: 4rpx;
  line-height: 1.2;
}
</style>
