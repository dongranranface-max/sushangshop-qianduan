<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 用户积分Banner -->
    <view class="user-banner" v-if="isLoggedIn">
      <view class="user-info">
        <text class="user-name">{{ userInfo.phone || '用户' }}</text>
        <text class="user-level">V{{ userInfo.level || 1 }}</text>
      </view>
      <view class="points-row">
        <view class="points-item">
          <text class="points-value">{{ ecoPointsDisplay }}</text>
          <text class="points-label">生态积分</text>
        </view>
        <view class="points-divider"></view>
        <view class="points-item">
          <text class="points-value">{{ consumerPointsDisplay }}</text>
          <text class="points-label">消费积分</text>
        </view>
      </view>
    </view>
    <view class="user-banner guest" v-else @click="goLogin">
      <text class="guest-text">点击登录查看积分</text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar-wrapper">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input class="search-input" placeholder="搜索商品" disabled @click="goSearch" />
      </view>
      <view class="message-btn">
        <text class="message-icon">💬</text>
      </view>
    </view>

    <!-- Banner 轮播 -->
    <view class="banner-wrapper">
      <swiper class="banner" :indicator-dots="true" :autoplay="true" :interval="3000" :circular="true"
        indicator-color="rgba(255,255,255,0.3)" indicator-active-color="#8B5CF6">
        <swiper-item v-for="(banner, index) in banners" :key="index">
          <image class="banner-image" :src="banner.image" mode="aspectFill" />
        </swiper-item>
      </swiper>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-entry-grid">
      <view class="quick-entry" v-for="entry in quickEntries" :key="entry.id" @click="onEntryClick(entry)">
        <text class="entry-icon">{{ entry.icon }}</text>
        <text class="entry-label">{{ entry.name }}</text>
      </view>
    </view>

    <!-- 换购推荐 -->
    <view class="section">
      <view class="section-header">
        <view class="section-title-row">
          <text class="section-icon">🔄</text>
          <text class="section-title">换购专区</text>
        </view>
        <view class="section-more" @click="goExchange">
          <text>查看全部</text>
          <text class="arrow">›</text>
        </view>
      </view>
      <scroll-view class="product-scroll" scroll-x>
        <view class="product-scroll-content">
          <view class="product-card-mini" v-for="p in exchangeProducts" :key="p.id" @click="goProduct(p.id, 'exchange')">
            <image class="product-image" :src="p.coverImage || p.image" mode="aspectFill" />
            <text class="product-name">{{ p.name }}</text>
            <view class="product-price-row">
              <text class="price">¥{{ p.price }}</text>
              <text class="points-tag">+{{ p.ecoPoints || 0 }}积分</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 兑换推荐 -->
    <view class="section">
      <view class="section-header">
        <view class="section-title-row">
          <text class="section-icon">🎁</text>
          <text class="section-title">免费兑换</text>
        </view>
        <view class="section-more" @click="goRedeem">
          <text>查看全部</text>
          <text class="arrow">›</text>
        </view>
      </view>
      <view class="product-grid">
        <view class="product-card-mini" v-for="p in redeemProducts" :key="p.id" @click="goProduct(p.id, 'redeem')">
          <image class="product-image" :src="p.coverImage || p.image" mode="aspectFill" />
          <text class="product-name">{{ p.name }}</text>
          <text class="points-price">{{ p.requiredPoints }}积分兑换</text>
        </view>
      </view>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { walletApi, productApi } from '@/utils/api'

const statusBarHeight = ref(20)
const isLoggedIn = ref(false)
const userInfo = ref<any>({})
const ecoPointsDisplay = ref('0')
const consumerPointsDisplay = ref('0')
const exchangeProducts = ref<any[]>([])
const redeemProducts = ref<any[]>([])

const banners = ref([
  { id: 1, image: 'https://picsum.photos/750/400?random=1', link: '' },
  { id: 2, image: 'https://picsum.photos/750/400?random=2', link: '' },
])

const quickEntries = [
  { id: 1, name: '消费商城', icon: '🛍️', type: 'consume' },
  { id: 2, name: '换购商城', icon: '🔄', type: 'exchange' },
  { id: 3, name: '兑换商城', icon: '🎁', type: 'redeem' },
  { id: 4, name: '我的理财', icon: '📈', type: 'wealth' },
]

function getUserId(): string {
  return uni.getStorageSync('userId') || ''
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20

  const userId = getUserId()
  isLoggedIn.value = !!userId

  if (userId) {
    loadUserData(userId)
  }
  loadProducts()
})

async function loadUserData(userId: string) {
  try {
    const bal = await walletApi.getBalance(userId)
    userInfo.value = bal
    ecoPointsDisplay.value = Number(bal.ecoPoints || 0).toLocaleString()
    consumerPointsDisplay.value = Number(bal.consumerPoints || 0).toLocaleString()
  } catch (e) {
    console.error('加载用户数据失败', e)
  }
}

async function loadProducts() {
  try {
    const [exchangeRes, redeemRes] = await Promise.all([
      productApi.getList({ type: 2, limit: 10 }),
      productApi.getList({ type: 3, limit: 6 }),
    ])
    exchangeProducts.value = exchangeRes.items || []
    redeemProducts.value = redeemRes.items || []
  } catch (e) {
    console.error('加载商品失败', e)
  }
}

function goLogin() {
  uni.navigateTo({ url: '/pages/auth/login' })
}

function goSearch() {
  uni.showToast({ title: '搜索开发中', icon: 'none' })
}

function goExchange() {
  uni.navigateTo({ url: '/pages/exchange/list' })
}

function goRedeem() {
  uni.navigateTo({ url: '/pages/redeem/list' })
}

function goProduct(id: string, mode: string) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}&mode=${mode}` })
}

function onEntryClick(entry: { type: string }) {
  const userId = getUserId()
  if (!userId && entry.type !== 'consume') {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/auth/login' }), 1000)
    return
  }
  switch (entry.type) {
    case 'consume': uni.switchTab({ url: '/pages/buy/index' }); break
    case 'exchange': uni.navigateTo({ url: '/pages/exchange/list' }); break
    case 'redeem': uni.navigateTo({ url: '/pages/redeem/list' }); break
    case 'wealth': uni.navigateTo({ url: '/pages/wealth/index' }); break
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container { min-height: 100vh; background: $bg-primary; padding: 0 $spacing-lg; }

.user-banner {
  background: linear-gradient(135deg, rgba($primary, 0.6), rgba($primary, 0.3));
  border: 1rpx solid rgba($primary, 0.3);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-base;

  &.guest {
    text-align: center;
    padding: $spacing-xl;
    .guest-text { font-size: 28rpx; color: $text-secondary; }
  }

  .user-info { display: flex; align-items: center; gap: $spacing-sm; margin-bottom: $spacing-base;
    .user-name { font-size: 32rpx; font-weight: 600; color: $text-primary; }
    .user-level { font-size: 22rpx; background: $primary; color: #0a0a0b; padding: 2rpx 12rpx; border-radius: 20rpx; font-weight: 700; }
  }

  .points-row { display: flex; align-items: center;
    .points-item { flex: 1; text-align: center;
      .points-value { font-size: 44rpx; font-weight: 700; color: #fff; display: block; }
      .points-label { font-size: 22rpx; color: rgba(255,255,255,0.7); display: block; margin-top: 4rpx; }
    }
    .points-divider { width: 1rpx; height: 60rpx; background: rgba(255,255,255,0.3); }
  }
}

.search-bar-wrapper { display: flex; align-items: center; gap: $spacing-base; padding: $spacing-base 0;
  .search-bar { flex: 1; }
  .message-btn { width: 80rpx; height: 80rpx; display: flex; align-items: center; justify-content: center; background: $bg-card; border-radius: 50%;
    .message-icon { font-size: 40rpx; }
  }
}

.banner-wrapper { margin: $spacing-base 0;
  .banner { width: 100%; height: 360rpx; border-radius: $radius-lg; overflow: hidden;
    .banner-image { width: 100%; height: 100%; }
  }
}

.quick-entry-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: $spacing-base; margin-bottom: $spacing-xl;
  .quick-entry { display: flex; flex-direction: column; align-items: center; gap: 8rpx;
    .entry-icon { font-size: 56rpx; }
    .entry-label { font-size: 24rpx; color: $text-secondary; }
  }
}

.section { margin-bottom: $spacing-xl;
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: $spacing-base;
    .section-title-row { display: flex; align-items: center; gap: $spacing-xs;
      .section-icon { font-size: 36rpx; }
      .section-title { font-size: 32rpx; font-weight: 600; color: $text-primary; }
    }
    .section-more { display: flex; align-items: center; font-size: 26rpx; color: $text-secondary;
      .arrow { margin-left: 4rpx; font-size: 28rpx; }
    }
  }
}

.product-scroll { width: 100%; white-space: nowrap; }
.product-scroll-content { display: inline-flex; gap: $spacing-base; padding: $spacing-xs 0; }

.product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: $spacing-base; }

.product-card-mini { background: $bg-card; border-radius: $radius-md; overflow: hidden;
  .product-image { width: 100%; height: 200rpx; }
  .product-name { font-size: 26rpx; color: $text-primary; display: block; padding: $spacing-xs $spacing-xs 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .product-price-row { display: flex; align-items: center; gap: 8rpx; padding: $spacing-xs;
    .price { font-size: 28rpx; font-weight: 700; color: $primary; }
    .points-tag { font-size: 20rpx; color: $text-secondary; background: $bg-tertiary; padding: 2rpx 8rpx; border-radius: 4rpx; }
  }
  .points-price { font-size: 22rpx; color: $gold; display: block; padding: 0 $spacing-xs $spacing-xs; }
}
</style>
