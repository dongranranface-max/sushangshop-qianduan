<template>
  <view class="luxury-tabbar">
    <view
      v-for="(tab, index) in tabs"
      :key="tab.pagePath"
      class="tab-item"
      :class="{ active: currentIndex === index }"
      @click="switchTab(tab, index)"
    >
      <view class="tab-icon-wrap">
        <!-- 主页 -->
        <template v-if="tab.icon === 'home'">
          <svg class="tab-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </template>
        <!-- 分类 -->
        <template v-else-if="tab.icon === 'catalog'">
          <svg class="tab-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </template>
        <!-- 购物车 -->
        <template v-else-if="tab.icon === 'cart'">
          <svg class="tab-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2L3 6V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V6L18 2H6Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 6H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="9" cy="19" r="1.5" fill="currentColor"/>
            <circle cx="17" cy="19" r="1.5" fill="currentColor"/>
          </svg>
        </template>
        <!-- 增值区 -->
        <template v-else-if="tab.icon === 'wealth'">
          <svg class="tab-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </template>
        <!-- 我的 -->
        <template v-else-if="tab.icon === 'user'">
          <svg class="tab-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </template>
        <view v-if="currentIndex === index" class="active-dot" />
      </view>
      <text class="tab-label">{{ tab.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const currentIndex = ref(0)

const tabs = [
  { pagePath: '/pages/index/index', text: '主页', icon: 'home' },
  { pagePath: '/pages/catalog/index', text: '分类', icon: 'catalog' },
  { pagePath: '/pages/cart/index', text: '购物车', icon: 'cart' },
  { pagePath: '/pages/wealth/index', text: '增值区', icon: 'wealth' },
  { pagePath: '/pages/user/index', text: '我的', icon: 'user' },
]

onMounted(() => {
  updateCurrentIndex()
})

function updateCurrentIndex() {
  const pages = getCurrentPages()
  if (!pages.length) return
  const current = pages[pages.length - 1]
  const route = '/' + ((current as any).route || '')
  const idx = tabs.findIndex(t => t.pagePath === route)
  if (idx !== -1) currentIndex.value = idx
}

function switchTab(tab: typeof tabs[0], index: number) {
  currentIndex.value = index
  uni.switchTab({ url: tab.pagePath })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.luxury-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  height: calc(100rpx + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1rpx solid rgba(184, 152, 118, 0.12);
  box-shadow: 0 -8rpx 40rpx rgba(47, 53, 66, 0.05), 0 -2rpx 12rpx rgba(0, 0, 0, 0.03);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 16rpx;
  gap: 6rpx;
  cursor: pointer;
  transition: all 0.25s ease;

  &.active {
    .tab-icon-wrap { color: $accent-dark; }
    .tab-label { color: $accent-dark; font-weight: 700; }
  }

  &:not(.active) {
    .tab-icon-wrap { color: $text-muted; }
    .tab-label { color: $text-muted; }
  }
}

.tab-icon-wrap {
  position: relative;
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}

.tab-svg {
  width: 44rpx;
  height: 44rpx;
}

.active-dot {
  position: absolute;
  bottom: -2rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 8rpx;
  height: 8rpx;
  background: $accent-dark;
  border-radius: 50%;
  box-shadow: 0 0 8rpx rgba(184, 152, 118, 0.5);
}

.tab-label {
  font-size: 20rpx;
  font-weight: 500;
  letter-spacing: 0.3rpx;
  transition: all 0.25s ease;
}
</style>
