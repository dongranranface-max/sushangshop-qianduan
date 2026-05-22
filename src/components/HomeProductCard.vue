<template>
  <view
    class="p-card clay-card-hover"
    :class="{ 'p-card--pressed': isPressed }"
    @click="emit('click')"
    @touchstart="isPressed = true"
    @touchend="isPressed = false"
    @touchcancel="isPressed = false"
  >
    <!-- 媒体区 -->
    <view class="p-card__media">
      <!-- 类型徽章 -->
      <view class="p-card__badge" :class="`p-card__badge--t${type}`">
        {{ badge }}
      </view>
      <!-- 商品图片（懒加载） -->
      <LaxImage
        class="p-card__img"
        :src="cover"
        aspect-ratio="100%"
        mode="aspectFill"
      />
      <!-- 销售标签 -->
      <view v-if="salesText" class="p-card__sales-tag">{{ salesText }}</view>
    </view>

    <!-- 信息区 -->
    <view class="p-card__body">
      <text class="p-card__name">{{ product.name }}</text>

      <!-- 价格行 -->
      <view class="p-card__price">
        <template v-if="type === 1">
          <text class="p-card__cash">¥{{ product.price }}</text>
          <text class="p-card__tag p-card__tag--ice">返积分</text>
        </template>
        <template v-else-if="type === 2">
          <text class="p-card__cash">¥{{ product.price }}</text>
          <text class="p-card__tag p-card__tag--green">+{{ product.requiredPoints || 0 }}积分</text>
        </template>
        <template v-else>
          <text class="p-card__redeem">{{ product.requiredPoints }} 消费积分</text>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import LaxImage from '@/components/lazy/LaxImage.vue'

const props = defineProps<{
  product: Record<string, any>
  type: 1 | 2 | 3
  defaultCover?: string
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const isPressed = ref(false)

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
  return ''
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/animations.scss';

.p-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: $radius-lg;
  overflow: hidden;
  // 点击按压反馈
  transition:
    transform var(--duration-base) var(--ease-spring),
    box-shadow var(--duration-base) var(--ease-default);

  &:active {
    transform: scale(0.98);
  }

  &--pressed {
    transform: scale(0.97);
    box-shadow: 0 4rpx 16rpx rgba(26, 36, 56, 0.05);
  }
}

/* 1:1 方图 */
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
}

/* 类型徽章 */
.p-card__badge {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  z-index: 2;
  font-size: 18rpx;
  padding: 4rpx 10rpx;
  border-radius: $radius-sm;
  font-weight: 600;
  letter-spacing: var(--tracking-wide);

  &--t1 {
    background: $warm-yellow;
    color: $accent-dark;
    border: 1rpx solid $border-primary;
  }
  &--t2 {
    background: $warm-blue;
    color: $navy-light;
  }
  &--t3 {
    background: $navy;
    color: $gold-light;
  }
}

/* 销售标签 */
.p-card__sales-tag {
  position: absolute;
  bottom: 10rpx;
  left: 10rpx;
  font-size: 18rpx;
  color: $text-inverse;
  background: rgba($navy, 0.6);
  padding: 4rpx 10rpx;
  border-radius: $radius-sm;
  backdrop-filter: blur(4px);
}

/* 信息区 */
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
  color: $text-primary;
}

.p-card__price {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6rpx;
  margin-top: 6rpx;
}

.p-card__cash {
  font-size: 20rpx;
  font-weight: var(--weight-heavy);
  color: $text-primary;
  letter-spacing: var(--tracking-tight);
}

.p-card__redeem {
  font-size: 20rpx;
  font-weight: var(--weight-semibold);
  color: $navy;
}

.p-card__tag {
  font-size: 20rpx;
  font-weight: var(--weight-semibold);

  &--ice { color: $primary-dark; }
  &--green { color: #2A8A6A; }
}
</style>