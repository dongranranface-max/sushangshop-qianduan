<template>
  <view
    class="p-card"
    :class="{ 'p-card--pressed': isPressed }"
    @click="emit('click')"
    @touchstart="isPressed = true"
    @touchend="isPressed = false"
    @touchcancel="isPressed = false"
  >
    <!-- 媒体区 -->
    <view class="p-card__media">
      <!-- 类型徽章：左上角 -->
      <view class="p-card__badge" :class="`p-card__badge--t${type}`">
        {{ badge }}
      </view>
      <!-- 商品图片 -->
      <LaxImage
        class="p-card__img"
        :src="cover"
        aspect-ratio="100%"
        mode="aspectFill"
      />
      <!-- 销量标签：左下角 -->
      <view v-if="salesText" class="p-card__sales-tag">{{ salesText }}</view>
    </view>

    <!-- 信息区 -->
    <view class="p-card__body">
      <text class="p-card__name">{{ product.name }}</text>

      <!-- 价格行 -->
      <view class="p-card__price">
        <template v-if="type === 1">
          <text class="p-card__cash">¥{{ product.price }}</text>
          <view class="p-card__tag p-card__tag--ice">
            <text>返积分</text>
          </view>
        </template>
        <template v-else-if="type === 2">
          <text class="p-card__cash">¥{{ product.price }}</text>
          <view class="p-card__tag p-card__tag--gold">
            <text>+{{ product.requiredPoints || 0 }}积分</text>
          </view>
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

interface Product {
  name: string
  coverImage?: string
  image?: string
  price?: string | number
  requiredPoints?: string | number
  salesCount?: number | null
  soldCount?: number | null
  [k: string]: unknown
}

const props = defineProps<{
  product: Product
  type: 1 | 2 | 3
  defaultCover?: string
}>()

const emit = defineEmits<{ (e: 'click'): void }>()

const isPressed = ref(false)

const badge = computed(() => {
  if (props.type === 1) return '购'
  if (props.type === 2) return '换'
  return '兑'
})

const cover = computed(
  () => props.product.coverImage || props.product.image || props.defaultCover || ''
)

const salesText = computed(() => {
  const n = props.product.salesCount ?? props.product.soldCount
  if (n !== null && Number(n) > 0) {
    const v = Number(n) >= 10000 ? `${(Number(n) / 10000).toFixed(1)}万` : String(n)
    return `已售 ${v}`
  }
  return ''
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.p-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $clay-shadow;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active,
  &--pressed {
    transform: scale(0.97);
    box-shadow: 0 4rpx 16rpx rgba(47, 53, 66, 0.08);
    border-color: rgba(212, 180, 131, 0.2);
  }
}

/* 媒体区：1:1 正方形 */
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
  min-width: 40rpx;
  height: 40rpx;
  padding: 0 10rpx;
  border-radius: 20rpx;
  font-size: 20rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.5rpx;

  &--t1 {
    background: $warm-yellow;
    color: $accent-dark;
    border: 1rpx solid rgba(184, 152, 118, 0.35);
  }

  &--t2 {
    background: rgba(65, 75, 94, 0.88);
    color: $bronze-light;
    border: 1rpx solid rgba(184, 152, 118, 0.25);
  }

  &--t3 {
    background: $mineral-gray;
    color: $bronze-light;
    border: 1rpx solid rgba(184, 152, 118, 0.3);
  }
}

/* 销量标签 */
.p-card__sales-tag {
  position: absolute;
  bottom: 10rpx;
  left: 10rpx;
  z-index: 2;
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.95);
  background: rgba(47, 53, 66, 0.55);
  backdrop-filter: blur(4px);
  padding: 4rpx 10rpx;
  border-radius: $radius-sm;
  font-weight: 500;
  letter-spacing: 0.3rpx;
}

/* 信息区 */
.p-card__body {
  flex: 1;
  min-height: 0;
  padding: 14rpx 16rpx 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.p-card__name {
  font-size: 26rpx;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

.p-card__price {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: auto;
  padding-top: 6rpx;
}

.p-card__cash {
  font-family: $asset-balance-font;
  font-size: 30rpx;
  font-weight: 700;
  color: $mineral-gray;
  letter-spacing: -0.5rpx;
  font-variant-numeric: tabular-nums;
}

.p-card__redeem {
  font-size: 22rpx;
  font-weight: 700;
  color: $accent-dark;
  letter-spacing: 0.2rpx;
}

.p-card__tag {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
  font-size: 18rpx;
  font-weight: 600;
  letter-spacing: 0.3rpx;

  &--ice {
    background: rgba(47, 53, 66, 0.06);
    color: $mineral-gray;
    border: 1rpx solid rgba(47, 53, 66, 0.1);
  }

  &--gold {
    background: rgba(184, 152, 118, 0.10);
    color: $accent-dark;
    border: 1rpx solid rgba(184, 152, 118, 0.30);
  }
}
</style>
