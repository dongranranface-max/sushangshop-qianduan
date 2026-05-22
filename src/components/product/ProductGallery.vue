<template>
  <!-- 商品图册轮播组件 -->
  <swiper
    class="product-swiper"
    :indicator-dots="true"
    indicator-color="rgba(255,255,255,0.35)"
    indicator-active-color="#C4A574"
    :autoplay="autoplay"
    :interval="3000"
    :circular="true"
  >
    <swiper-item v-for="(img, index) in images" :key="index">
      <LaxImage
        class="gallery-img"
        :src="img"
        mode="aspectFill"
        aspect-ratio="100%"
        :no-lazy="index < 2"
      />
    </swiper-item>
  </swiper>
</template>

<script setup lang="ts">
import LaxImage from '@/components/lazy/LaxImage.vue'

withDefaults(
  defineProps<{
    images: string[]
    autoplay?: boolean
  }>(),
  { autoplay: true }
)
</script>

<style lang="scss" scoped>
.product-swiper {
  width: 100%;
  height: 750rpx; // 固定高度，等同 aspect-ratio: 1:1 on 750rpx width
}

.gallery-img {
  width: 100%;
  height: 100%;
}
</style>
