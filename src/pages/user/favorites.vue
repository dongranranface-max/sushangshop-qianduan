<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">我的收藏</text>
      <view class="page-nav__action" />
    </view>

    <scroll-view scroll-y class="fav-list" @scrolltolower="loadMore">
      <view v-if="loading && !list.length" class="loading-wrap">
        <view class="loading-spinner" />
        <text>加载中...</text>
      </view>

      <view
        class="fav-card"
        v-for="item in list"
        :key="item.favoriteId"
        @click="goDetail(item)"
      >
        <view class="fav-card__cover">
          <image
            class="fav-card__img"
            :src="item.coverImage || '/static/logo.png'"
            mode="aspectFill"
          />
          <view class="fav-card__tag">
            <text>{{ getTypeName(item) }}</text>
          </view>
        </view>
        <view class="fav-card__body">
          <text class="fav-card__name">{{ item.name }}</text>
          <text class="fav-card__price">¥{{ item.price }}</text>
          <view class="fav-card__action" @click.stop="remove(item)">
            <text>取消收藏</text>
          </view>
        </view>
      </view>

      <view v-if="!loading && !list.length" class="empty-state">
        <view class="empty-state__icon">藏</view>
        <text class="empty-state__text">暂无收藏</text>
        <text class="empty-state__sub">去逛逛发现心仪好物吧</text>
      </view>

      <view v-if="loading && list.length" class="load-more">
        <view class="loading-spinner" />
        <text>加载中...</text>
      </view>

      <view v-if="!hasMore && list.length > 0" class="no-more">
        <text>— 没有更多了 —</text>
      </view>

      <view class="list-bottom" :style="{ height: (100 + safeAreaBottom) + 'px' }" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { favoriteApi } from '@/utils/api'
import { checkAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
interface FavoriteItem { favoriteId: string; productId: string; productType: number; name?: string; coverImage?: string; price?: string | number; [k: string]: unknown }
const list = ref<FavoriteItem[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
let reqSeq = 0

function getTypeName(item: FavoriteItem): string {
  const map: Record<number, string> = { 1: '消费', 2: '换购', 3: '兑换' }
  return map[item.productType] || '商品'
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
  if (checkAuth()) loadData(true)
})

async function loadData(reset = false) {
  if (loading.value) return
  if (reset) { page.value = 1; hasMore.value = true }
  if (!hasMore.value) return
  loading.value = true
  const seq = ++reqSeq
  try {
    const res = await favoriteApi.list({ page: page.value, limit: 20 })
    if (seq !== reqSeq) return
    const rows = res?.list || []
    if (reset) list.value = rows
    else list.value.push(...rows)
    hasMore.value = rows.length >= 20
    page.value++
  } catch {
    if (seq !== reqSeq) return
  } finally {
    if (seq === reqSeq) loading.value = false
  }
}

function loadMore() {
  if (hasMore.value && !loading.value) loadData(false)
}

function goBack() { uni.navigateBack() }

function goDetail(item: FavoriteItem) {
  if (!item.productId) return
  uni.navigateTo({ url: `/pages/product/detail?id=${item.productId}&type=${item.productType || 1}` })
}

async function remove(item: FavoriteItem) {
  try {
    await favoriteApi.remove(item.productId)
    list.value = list.value.filter(i => i.favoriteId !== item.favoriteId)
    uni.showToast({ title: '已取消', icon: 'none' })
  } catch (err: { message?: string }) {
    uni.showToast({ title: err?.message || '操作失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  @include page-bg;
  display: flex;
  flex-direction: column;
}

.status-bar { width: 100%; }

// ========== 导航栏 ==========
.page-nav {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx $spacing-base;
  background: rgba(249, 249, 249, 0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1rpx solid rgba(20, 20, 20, 0.04);

  &__back, &__action {
    width: 64rpx; height: 64rpx;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(12px);
    border: 1rpx solid rgba(20, 20, 20, 0.06);
    border-radius: 50%;
    font-size: 28rpx; color: $mineral-gray; flex-shrink: 0;
  }

  &__title {
    flex: 1; font-size: 32rpx; font-weight: 700;
    color: $mineral-gray; text-align: center;
  }
}

// ========== 列表 ==========
.fav-list {
  flex: 1;
  padding: $spacing-base;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 80rpx;
  font-size: 28rpx;
  color: $text-muted;
}

.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 3rpx solid rgba(184, 152, 118, 0.2);
  border-top-color: $accent-dark;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

// ========== 收藏卡片 ==========
.fav-card {
  display: flex;
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.60);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  overflow: hidden;
  margin-bottom: $spacing-base;
  transition: transform 0.2s ease;

  &:active { transform: scale(0.99); }

  &__cover {
    position: relative;
    width: 200rpx;
    height: 200rpx;
    flex-shrink: 0;
    background: $bg-tertiary;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__tag {
    position: absolute;
    top: 8rpx;
    left: 8rpx;
    padding: 4rpx 10rpx;
    background: rgba(47, 53, 66, 0.7);
    backdrop-filter: blur(8px);
    border-radius: $radius-full;

    text {
      font-size: 18rpx;
      font-weight: 700;
      color: #fff;
    }
  }

  &__body {
    flex: 1;
    padding: $spacing-base;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  &__name {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  &__price {
    font-family: $asset-balance-font;
    font-size: 34rpx;
    font-weight: 700;
    color: $mineral-gray;
    font-variant-numeric: tabular-nums;
    margin-top: auto;
  }

  &__action {
    align-self: flex-start;
    padding: 6rpx 20rpx;
    background: rgba(192, 69, 74, 0.06);
    border: 1rpx solid rgba(192, 69, 74, 0.15);
    border-radius: $radius-full;

    text {
      font-size: 22rpx;
      font-weight: 600;
      color: $danger;
    }
  }
}

// ========== 空状态 ==========
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 40rpx;
  text-align: center;

  &__icon {
    width: 120rpx; height: 120rpx;
    line-height: 120rpx; text-align: center;
    font-size: 48rpx; font-weight: 800;
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: 50%;
    color: $accent-dark;
    margin-bottom: 24rpx;
  }

  &__text {
    font-size: 30rpx; font-weight: 600; color: $text-primary; margin-bottom: 8rpx;
  }

  &__sub { font-size: 26rpx; color: $text-muted; }
}

.load-more, .no-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: $spacing-lg 0;
  font-size: 24rpx;
  color: $text-muted;
}

.list-bottom { width: 100%; }
</style>
