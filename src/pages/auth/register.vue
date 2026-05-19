<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="page-header">
      <text class="close" @click="goBack">×</text>
      <text class="page-title">注册</text>
    </view>

    <view class="logo-area">
      <text class="logo">🏪</text>
      <text class="app-name">ECO积分商城</text>
      <text class="app-slogan">消费即投资 · 积分变财富</text>
    </view>

    <view class="form">
      <view class="form-item">
        <input
          v-model="form.phone"
          class="input"
          type="number"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </view>
      <view class="form-item">
        <input
          v-model="form.password"
          class="input"
          password
          placeholder="设置密码（6位以上）"
        />
      </view>
      <view class="form-item">
        <input
          v-model="form.inviteCode"
          class="input"
          placeholder="邀请码（选填）"
          maxlength="10"
        />
      </view>
    </view>

    <view class="submit-btn" :class="{ loading: submitting }" @click="doRegister">
      {{ submitting ? '注册中...' : '立即注册' }}
    </view>

    <view class="agreement">
      注册即表示同意
      <text class="link">《用户协议》</text>
      和
      <text class="link">《隐私政策》</text>
    </view>

    <view class="login-link">
      已有账号？
      <text @click="goLogin">立即登录</text>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authApi } from '@/utils/api'

const statusBarHeight = ref(20)
const submitting = ref(false)

const form = ref({
  phone: '',
  password: '',
  inviteCode: '',
})

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20

  // 如果从邀请链接进来，自动填入邀请码
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const opts = (current as any).options || {}
  if (opts.code) {
    form.value.inviteCode = opts.code
  }
})

function goBack() { uni.navigateBack() }
function goLogin() { uni.navigateTo({ url: '/pages/auth/login' }) }

async function doRegister() {
  if (submitting.value) return
  if (!form.value.phone || form.value.phone.length !== 11) {
    return uni.showToast({ title: '请输入正确手机号', icon: 'none' })
  }
  if (!form.value.password || form.value.password.length < 6) {
    return uni.showToast({ title: '密码至少6位', icon: 'none' })
  }

  submitting.value = true
  uni.showLoading({ title: '注册中...' })
  try {
    const res = await authApi.register(form.value.phone, form.value.password, form.value.inviteCode || 'DEFAULT')
    uni.setStorageSync('token', res.token)
    uni.setStorageSync('userId', res.user.id)
    uni.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 1500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '注册失败', icon: 'none' })
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
  padding: 0 $spacing-lg;
}

.page-header {
  display: flex;
  align-items: center;
  padding: $spacing-base 0;

  .close {
    font-size: 48rpx;
    color: $text-secondary;
  }

  .page-title {
    flex: 1;
    text-align: center;
    font-size: 36rpx;
    font-weight: 600;
    color: $text-primary;
    margin-right: 48rpx;
  }
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0 48rpx;

  .logo {
    font-size: 80rpx;
    margin-bottom: 16rpx;
  }

  .app-name {
    font-size: 48rpx;
    font-weight: 700;
    color: $primary;
    margin-bottom: 8rpx;
  }

  .app-slogan {
    font-size: 26rpx;
    color: $text-muted;
  }
}

.form {
  .form-item {
    margin-bottom: $spacing-base;
  }

  .input {
    width: 100%;
    height: 96rpx;
    padding: 0 $spacing-base;
    background: $bg-secondary;
    border: 2rpx solid $border-color;
    border-radius: $radius-md;
    font-size: 30rpx;
    color: $text-primary;

    &::placeholder {
      color: $text-muted;
    }
  }
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, $primary, darken($primary, 10%));
  border-radius: $radius-full;
  text-align: center;
  line-height: 96rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #0a0a0b;
  margin-top: $spacing-lg;

  &.loading {
    opacity: 0.6;
  }
}

.agreement {
  text-align: center;
  font-size: 24rpx;
  color: $text-muted;
  margin-top: $spacing-base;

  .link {
    color: $primary;
  }
}

.login-link {
  text-align: center;
  font-size: 28rpx;
  color: $text-secondary;
  margin-top: $spacing-base;
  padding-bottom: 40rpx;

  text {
    color: $primary;
    margin-left: 8rpx;
  }
}
</style>
