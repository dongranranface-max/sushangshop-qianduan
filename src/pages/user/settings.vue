<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">设置</text>
      <text class="nav-placeholder" />
    </view>

    <view class="menu-card">
      <view class="menu-row" @click="goProfile">
        <text class="menu-label">个人资料</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-row" @click="goAddress">
        <text class="menu-label">收货地址</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-row" @click="goService">
        <text class="menu-label">客服中心</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="menu-card">
      <view class="menu-row">
        <text class="menu-label">当前版本</text>
        <text class="menu-value">v1.0.0</text>
      </view>
      <view class="menu-row" @click="showAbout">
        <text class="menu-label">关于集享公社</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view v-if="loggedIn" class="logout-btn" @click="logout">退出登录</view>
    <view v-else class="logout-btn login-btn" @click="goLogin">去登录</view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { checkAuth, clearAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const loggedIn = ref(checkAuth())

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  loggedIn.value = checkAuth()
})

function goBack() {
  uni.navigateBack()
}

function goProfile() {
  uni.navigateTo({ url: '/pages/user/profile' })
}

function goAddress() {
  uni.navigateTo({ url: '/pages/address/list' })
}

function goService() {
  uni.navigateTo({ url: '/pages/user/service' })
}

function goLogin() {
  uni.navigateTo({ url: '/pages/auth/login' })
}

function showAbout() {
  uni.showModal({
    title: '关于集享公社',
    content: '消费、换购、理财一体化会员商城。如有问题请通过客服中心提交工单。',
    showCancel: false,
  })
}

function logout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    success: (res) => {
      if (res.confirm) {
        clearAuth()
        loggedIn.value = false
        uni.showToast({ title: '已退出', icon: 'none' })
        setTimeout(() => {
          uni.switchTab({ url: '/pages/user/index' })
        }, 600)
      }
    },
  })
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

.menu-card {
  background: $bg-secondary;
  border-radius: $radius-md;
  margin-bottom: $spacing-base;
  overflow: hidden;
}

.menu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx $spacing-base;
  border-bottom: 1rpx solid $border-primary;
  &:last-child { border-bottom: none; }
  .menu-label { font-size: 28rpx; }
  .menu-value { font-size: 26rpx; color: $text-muted; }
  .menu-arrow { font-size: 32rpx; color: $text-muted; }
}

.logout-btn {
  margin-top: 48rpx;
  text-align: center;
  padding: 24rpx;
  background: $bg-secondary;
  color: $danger;
  border-radius: $radius-full;
  font-size: 30rpx;
}

.login-btn {
  color: $primary;
}
</style>
