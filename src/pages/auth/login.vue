<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="bg-decoration">
      <view class="deco-circle circle-1"></view>
      <view class="deco-circle circle-2"></view>
    </view>

    <view class="logo-section">
      <view class="logo">
        <text class="logo-icon">💎</text>
      </view>
      <text class="app-name">ECO MALL</text>
      <text class="app-slogan">生态积分商城 · 消费即投资</text>
    </view>

    <view class="login-form">
      <view class="input-group">
        <text class="input-icon">📱</text>
        <input
          class="input-field"
          v-model="form.phone"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="input-group">
        <text class="input-icon">🔐</text>
        <input
          class="input-field"
          v-model="form.password"
          :password="!showPassword"
          placeholder="请输入密码"
          placeholder-class="input-placeholder"
        />
        <text class="eye-btn" @click="showPassword = !showPassword">
          {{ showPassword ? '👁' : '👁‍🗨' }}
        </text>
      </view>

      <view class="login-btn" :class="{ loading: submitting }" @click="doLogin">
        <text>{{ submitting ? '登录中...' : '登录' }}</text>
      </view>

      <view class="register-row">
        <text class="register-link" @click="goRegister">还没有账号？立即注册</text>
      </view>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authApi } from '@/utils/api'

const statusBarHeight = ref(20)
const submitting = ref(false)
const showPassword = ref(false)

const form = ref({
  phone: '',
  password: '',
})

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20

  // 自动登录
  const token = uni.getStorageSync('token')
  if (token) {
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 100)
  }
})

function goRegister() {
  uni.navigateTo({ url: '/pages/auth/register' })
}

async function doLogin() {
  if (submitting.value) return
  if (!form.value.phone || form.value.phone.length !== 11) {
    return uni.showToast({ title: '请输入正确手机号', icon: 'none' })
  }
  if (!form.value.password || form.value.password.length < 6) {
    return uni.showToast({ title: '请输入密码（至少6位）', icon: 'none' })
  }

  submitting.value = true
  uni.showLoading({ title: '登录中...' })
  try {
    const res = await authApi.login(form.value.phone, form.value.password)
    uni.setStorageSync('token', res.token)
    uni.setStorageSync('userId', res.user.id)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 1500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '登录失败', icon: 'none' })
  } finally {
    submitting.value = false
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: $bg-primary;
  padding: 0 $spacing-xl;
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  overflow: hidden;

  .deco-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
  }

  .circle-1 {
    width: 600rpx; height: 600rpx;
    background: $primary;
    top: -200rpx; right: -200rpx;
  }

  .circle-2 {
    width: 400rpx; height: 400rpx;
    background: $gold;
    bottom: 100rpx; left: -150rpx;
  }
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
  margin-bottom: 80rpx;

  .logo {
    width: 160rpx; height: 160rpx;
    background: linear-gradient(135deg, $primary, darken($primary, 10%));
    border-radius: 40rpx;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8rpx 32rpx rgba($primary, 0.4);

    .logo-icon { font-size: 80rpx; }
  }

  .app-name {
    font-size: 56rpx; font-weight: 700;
    color: $text-primary;
    margin-top: $spacing-base;
    letter-spacing: 4rpx;
  }

  .app-slogan {
    font-size: 26rpx; color: $text-secondary;
    margin-top: $spacing-sm;
  }
}

.login-form {
  position: relative;
  z-index: 1;

  .input-group {
    display: flex;
    align-items: center;
    background: $bg-card;
    border: 1rpx solid $border-color;
    border-radius: $radius-md;
    padding: 0 $spacing-base;
    margin-bottom: $spacing-base;
    height: 100rpx;

    .input-icon { font-size: 40rpx; margin-right: $spacing-base; }

    .input-field {
      flex: 1;
      font-size: 30rpx;
      color: $text-primary;

      &::placeholder { color: $text-muted; }
    }

    .eye-btn { font-size: 36rpx; padding: 0 $spacing-sm; }
  }

  .login-btn {
    width: 100%; height: 96rpx;
    background: linear-gradient(135deg, $primary, darken($primary, 10%));
    border-radius: 48rpx;
    display: flex; align-items: center; justify-content: center;
    font-size: 34rpx; font-weight: 600;
    color: #0a0a0b;
    box-shadow: 0 8rpx 32rpx rgba($primary, 0.4);
    margin-top: $spacing-lg;

    &.loading { opacity: 0.6; }
  }

  .register-row {
    text-align: center;
    margin-top: $spacing-base;

    .register-link {
      font-size: 28rpx;
      color: $primary;
    }
  }
}
</style>
