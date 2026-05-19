<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- ========== 背景特效层 ========== -->
    <view class="bg-scene">
      <!-- 大型光晕 -->
      <view class="orb orb-1"></view>
      <view class="orb orb-2"></view>
      <!-- 电路线条 -->
      <view class="circuit-h1"></view>
      <view class="circuit-h2"></view>
      <view class="circuit-v1"></view>
    </view>

    <!-- ========== Logo 区 ========== -->
    <view class="logo-section">
      <view class="logo-wrap">
        <image class="logo-img" src="/static/logo/logo.png" mode="aspectFit" />
      </view>
      <text class="app-name">集享公社</text>
      <text class="app-slogan">智蓝火炼 · 生态积分商城</text>
    </view>

    <!-- ========== 登录表单 ========== -->
    <view class="login-form">
      <!-- 手机号 -->
      <view class="input-wrap" :class="{ focused: phoneFocus }">
        <view class="input-icon">
          <text class="icon-text">📱</text>
        </view>
        <input
          class="input-field"
          v-model="form.phone"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          placeholder-class="input-placeholder"
          @focus="phoneFocus = true"
          @blur="phoneFocus = false"
        />
      </view>

      <!-- 密码 -->
      <view class="input-wrap" :class="{ focused: pwdFocus }">
        <view class="input-icon">
          <text class="icon-text">🔐</text>
        </view>
        <input
          class="input-field"
          v-model="form.password"
          :password="!showPassword"
          placeholder="请输入登录密码"
          placeholder-class="input-placeholder"
          @focus="pwdFocus = true"
          @blur="pwdFocus = false"
        />
        <view class="eye-btn" @click="showPassword = !showPassword">
          <text>{{ showPassword ? '👁' : '👁‍🗨' }}</text>
        </view>
      </view>

      <!-- 登录按钮 -->
      <view
        class="login-btn btn-fire"
        :class="{ loading: submitting }"
        @click="doLogin"
      >
        <view class="btn-inner" v-if="!submitting">
          <text class="btn-text">登录</text>
          <text class="btn-arrow">→</text>
        </view>
        <view class="btn-inner" v-else>
          <text class="btn-text">登录中...</text>
        </view>
      </view>

      <!-- 注册入口 -->
      <view class="register-row">
        <text class="register-hint">还没有账号？</text>
        <text class="register-link" @click="goRegister">立即注册 →</text>
      </view>
    </view>

    <!-- ========== 底部装饰 ========== -->
    <view class="footer-deco">
      <text class="footer-text">安全加密 · 放心交易</text>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authApi } from '@/utils/api'

const statusBarHeight = ref(20)
const submitting = ref(false)
const showPassword = ref(false)
const phoneFocus = ref(false)
const pwdFocus = ref(false)

const form = ref({
  phone: '',
  password: '',
})

// #ifdef MP-WEIXIN
const app = getApp()
statusBarHeight.value = app.globalData.statusBarHeight || 20
// #endif

// #ifdef H5
const sys = uni.getSystemInfoSync()
statusBarHeight.value = sys.statusBarHeight || 20
// #endif

// 自动登录检测
const token = uni.getStorageSync('token')
if (token) {
  setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 100)
}

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
    await authApi.login(form.value.phone, form.value.password)
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

// =============================================
// 全页背景
// =============================================
.page-container {
  min-height: 100vh;
  background: radial-gradient(ellipse at 50% 0%, #0A1628 0%, #060B28 40%, #020510 100%);
  padding: 0 $spacing-xl;
  position: relative;
  overflow: hidden;
}

// =============================================
// 背景特效层
// =============================================
.bg-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80rpx);
}

.orb-1 {
  width: 500rpx; height: 500rpx;
  background: radial-gradient(circle, rgba(77,142,255,0.18) 0%, transparent 70%);
  top: -150rpx; right: -150rpx;
  animation: orb-float 8s ease-in-out infinite;
}

.orb-2 {
  width: 400rpx; height: 400rpx;
  background: radial-gradient(circle, rgba(255,140,0,0.12) 0%, transparent 70%);
  bottom: 100rpx; left: -120rpx;
  animation: orb-float 10s ease-in-out infinite reverse;
}

@keyframes orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20rpx, -20rpx) scale(1.05); }
  66% { transform: translate(-10rpx, 10rpx) scale(0.95); }
}

// 电路水平线
.circuit-h1 {
  position: absolute;
  top: 25%;
  left: 0; right: 0;
  height: 1rpx;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(0,242,254,0.15) 20%,
    rgba(0,242,254,0.15) 80%,
    transparent 100%);
  animation: circuit-pulse 4s ease-in-out infinite;
}

.circuit-h2 {
  position: absolute;
  bottom: 30%;
  left: 0; right: 0;
  height: 1rpx;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(77,142,255,0.12) 30%,
    rgba(77,142,255,0.12) 70%,
    transparent 100%);
  animation: circuit-pulse 6s ease-in-out infinite reverse;
}

@keyframes circuit-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

// 电路垂直线
.circuit-v1 {
  position: absolute;
  right: 15%;
  top: 0; bottom: 0;
  width: 1rpx;
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(0,242,254,0.08) 40%,
    rgba(0,242,254,0.08) 60%,
    transparent 100%);
}

// =============================================
// Logo 区
// =============================================
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100rpx;
  margin-bottom: 64rpx;
  position: relative;
  z-index: 1;
}

.logo-wrap {
  width: 180rpx;
  height: 180rpx;
  border-radius: 44rpx;
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: 1rpx solid rgba(77,142,255,0.25);
  box-shadow: 0 0 60rpx rgba(77,142,255,0.2), inset 0 0 40rpx rgba(77,142,255,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  animation: logo-glow 3s ease-in-out infinite;
}

@keyframes logo-glow {
  0%, 100% { box-shadow: 0 0 40rpx rgba(77,142,255,0.2), inset 0 0 40rpx rgba(77,142,255,0.05); }
  50% { box-shadow: 0 0 80rpx rgba(77,142,255,0.35), inset 0 0 60rpx rgba(77,142,255,0.1); }
}

.logo-img {
  width: 140rpx;
  height: 140rpx;
  border-radius: 36rpx;
}

.app-name {
  font-size: 56rpx;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 6rpx;
  text-shadow: 0 0 30rpx rgba(77,142,255,0.4);
  margin-bottom: 12rpx;
}

.app-slogan {
  font-size: 26rpx;
  color: $text-secondary;
  letter-spacing: 2rpx;
}

// =============================================
// 登录表单
// =============================================
.login-form {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

// 输入框容器
.input-wrap {
  display: flex;
  align-items: center;
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: 1rpx solid $glass-border;
  border-radius: $radius-xl;
  padding: 0 28rpx;
  height: 100rpx;
  transition: all 0.3s ease;

  &.focused {
    border-color: rgba(77,142,255,0.5);
    box-shadow: 0 0 0 4rpx rgba(77,142,255,0.12), $shadow-glow;
    background: rgba(30,41,59,0.70);
  }
}

.input-icon {
  width: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .icon-text {
    font-size: 36rpx;
    opacity: 0.8;
  }
}

.input-field {
  flex: 1;
  font-size: 30rpx;
  color: $text-primary;
  height: 100%;
  letter-spacing: 2rpx;

  &::placeholder { color: $text-muted; }
}

.eye-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;
  opacity: 0.6;
}

// =============================================
// 火炎登录按钮
// =============================================
.login-btn {
  height: 100rpx;
  border-radius: $radius-xl;
  overflow: hidden;
  position: relative;
  margin-top: 8rpx;

  &.loading {
    opacity: 0.7;
  }
}

.btn-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: $accent-fire;
  box-shadow: $shadow-fire;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: btn-shine 3s ease-in-out infinite;
  }
}

@keyframes btn-shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.btn-text {
  font-size: 34rpx;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 4rpx;
}

.btn-arrow {
  font-size: 32rpx;
  color: rgba(255,255,255,0.8);
}

// =============================================
// 注册入口
// =============================================
.register-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 8rpx;
}

.register-hint {
  font-size: 26rpx;
  color: $text-muted;
}

.register-link {
  font-size: 26rpx;
  color: $primary-light;
  font-weight: 600;
  text-shadow: 0 0 10rpx rgba(0,242,254,0.3);
}

// =============================================
// 底部装饰
// =============================================
.footer-deco {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 48rpx 0 32rpx;
}

.footer-text {
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 2rpx;
}
</style>
