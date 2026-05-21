<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">我的收藏</text>
      <text class="nav-placeholder" />
    </view>

    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore">
      <view v-for="item in list" :key="item.favoriteId" class="card" @click="goDetail(item)">
        <image class="cover" :src="resolveProductCover(item)" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ item.name }}</text>
          <text class="type">{{ item.typeName }}</text>
          <text class="price">¥{{ item.price }}</text>
        </view>
        <view class="remove" @click.stop="remove(item)">取消收藏</view>
      </view>
      <view v-if="!loading && !list.length" class="empty">暂无收藏，去逛逛吧</view>
      <view v-if="loading" class="hint">加载中...</view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { favoriteApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'
import { resolveProductCover } from '@/utils/media'

const statusBarHeight = ref(20)
const list = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  if (!requireAuth()) return
  loadData(true)
})

async function loadData(reset = false) {
  if (loading.value) return
  if (reset) {
    page.value = 1
    hasMore.value = true
    list.value = []
  }
  if (!hasMore.value) return
  loading.value = true
  try {
    const res = await favoriteApi.list({ page: page.value, limit: 20 })
    const rows = res.list || []
    list.value = reset ? rows : [...list.value, ...rows]
    hasMore.value = rows.length >= 20
    page.value++
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function loadMore() {
  loadData()
}

function goBack() {
  uni.navigateBack()
}

function goDetail(item: any) {
  const mode = item.productType === 2 ? 'exchange' : item.productType === 3 ? 'redeem' : 'consume'
  uni.navigateTo({ url: `/pages/product/detail?id=${item.productId}&mode=${mode}` })
}

async function remove(item: any) {
  try {
    await favoriteApi.remove(item.productId)
    list.value = list.value.filter((i) => i.favoriteId !== item.favoriteId)
    uni.showToast({ title: '已取消', icon: 'none' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: $bg-primary;
  padding: 0 $spacing-base;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0 24rpx;
  .nav-back { font-size: 40rpx; }
  .nav-title { font-size: 34rpx; font-weight: 700; }
  .nav-placeholder { width: 40rpx; }
}

.list-scroll {
  height: calc(100vh - 160rpx);
}

.card {
  display: flex;
  align-items: center;
  padding: $spacing-base;
  margin-bottom: $spacing-sm;
  background: $bg-secondary;
  border-radius: $radius-md;
  .cover { width: 140rpx; height: 140rpx; border-radius: 12rpx; }
  .info { flex: 1; margin-left: 16rpx; }
  .name { font-size: 28rpx; font-weight: 600; display: block; }
  .type { font-size: 22rpx; color: $text-muted; }
  .price { font-size: 30rpx; color: $primary; font-weight: 700; margin-top: 8rpx; display: block; }
  .remove { font-size: 24rpx; color: $danger; }
}

.empty, .hint {
  text-align: center;
  padding: 80rpx 0;
  color: $text-muted;
}
</style>
