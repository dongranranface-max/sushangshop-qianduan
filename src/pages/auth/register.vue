<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- ========== 背景特效 ========== -->
    <view class="bg-scene">
      <view class="orb orb-1"></view>
      <view class="orb orb-2"></view>
    </view>

    <!-- ========== 页面头部 ========== -->
    <view class="page-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="page-title">创建账户</text>
      <view class="header-spacer"></view>
    </view>

    <!-- ========== Logo 区 ========== -->
    <view class="logo-section">
      <view class="logo-wrap">
        <image class="logo-img" src="/static/logo/logo.png" mode="aspectFit" />
      </view>
      <text class="app-name">集享公社</text>
      <text class="app-slogan">加入我们 · 共享生态红利</text>
    </view>

    <!-- ========== 注册表单 ========== -->
    <view class="register-form">
      <!-- 手机号 -->
      <view class="input-wrap" :class="{ focused: focus.phone }">
        <text class="input-label">📱 手机号</text>
        <input
          class="input-field"
          v-model="form.phone"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          placeholder-class="input-placeholder"
          @focus="focus.phone = true"
          @blur="focus.phone = false"
        />
      </view>

      <!-- 密码 -->
      <view class="input-wrap" :class="{ focused: focus.password }">
        <text class="input-label">🔐 登录密码</text>
        <input
          class="input-field"
          v-model="form.password"
          :password="!showPwd"
          placeholder="设置6位以上登录密码"
          placeholder-class="input-placeholder"
          @focus="focus.password = true"
          @blur="focus.password = false"
        />
        <view class="eye-btn" @click="showPwd = !showPwd">
          <text>{{ showPwd ? '👁' : '👁‍🗨' }}</text>
        </view>
      </view>

      <!-- 邀请码 -->
      <view class="input-wrap" :class="{ focused: focus.invite, 'has-value': form.inviteCode }">
        <text class="input-label">🎁 邀请码</text>
        <input
          class="input-field"
          v-model="form.inviteCode"
          placeholder="选填（加速注册审核）"
          placeholder-class="input-placeholder"
          @focus="focus.invite = true"
          @blur="focus.invite = false"
        />
        <view class="invite-tip" v-if="!form.inviteCode">
          <text class="tip-text">无邀请码可填 DEFAULT</text>
        </view>
      </view>

      <!-- 注册按钮 -->
      <view
        class="register-btn btn-fire"
        :class="{ loading: submitting }"
        @click="doRegister"
      >
        <view class="btn-inner">
          <text class="btn-text">立即注册</text>
        </view>
      </view>

      <!-- 协议 -->
      <view class="agreement">
        <text class="agreement-text">
          注册即表示同意
          <text class="link" @click.stop="openAgreement('user')">《用户协议》</text>
          和
          <text class="link" @click.stop="openAgreement('privacy')">《隐私政策》</text>
        </text>
      </view>

      <!-- 已有账号 -->
      <view class="login-row">
        <text class="login-hint">已有账号？</text>
        <text class="login-link" @click="goLogin">立即登录 →</text>
      </view>
    </view>

    <!-- ========== 底部装饰 ========== -->
    <view class="footer-deco">
      <text class="footer-text">智蓝火炼 · 安全加密</text>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { authApi } from '@/utils/api'

const statusBarHeight = ref(20)
const submitting = ref(false)
const showPwd = ref(false)

const form = ref({
  phone: '',
  password: '',
  inviteCode: '',
})

const focus = reactive({
  phone: false,
  password: false,
  invite: false,
})

// #ifdef H5
const sys = uni.getSystemInfoSync()
statusBarHeight.value = sys.statusBarHeight || 20
// #endif

// 如果从邀请链接进来，自动填入邀请码
// #ifdef H5
const pages = getCurrentPages()
const current = pages[pages.length - 1]
const opts = (current as any)?.options || {}
if (opts.code) {
  form.value.inviteCode = opts.code
}
// #endif

function goBack() { uni.navigateBack() }
function goLogin() { uni.navigateTo({ url: '/pages/auth/login' }) }

function openAgreement(type: string) {
  uni.showToast({ title: `《${type === 'user' ? '用户协议' : '隐私政策'}》`, icon: 'none' })
}

async function doRegister() {
  if (submitting.value) return
  if (!form.value.phone || form.value.phone.length !== 11) {
    return uni.showToast({ title: '请输入正确的11位手机号', icon: 'none' })
  }
  if (!form.value.password || form.value.password.length < 6) {
    return uni.showToast({ title: '密码至少6位', icon: 'none' })
  }

  submitting.value = true
  uni.showLoading({ title: '注册中...' })
  try {
    await authApi.register(
      form.value.phone,
      form.value.password,
      form.value.inviteCode || 'DEFAULT'
    )
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
  background: radial-gradient(ellipse at 50% 0%, #0A1628 0%, #060B28 40%, #020510 100%);
  padding: 0 $spacing-xl;
  position: relative;
  overflow: hidden;
}

// ========== 背景特效 ==========
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
  width: 400rpx; height: 400rpx;
  background: radial-gradient(circle, rgba(0,242,254,0.1) 0%, transparent 70%);
  top: -100rpx; left: -100rpx;
  animation: orb-float 9s ease-in-out infinite;
}

.orb-2 {
  width: 350rpx; height: 350rpx;
  background: radial-gradient(circle, rgba(77,142,255,0.15) 0%, transparent 70%);
  bottom: 150rpx; right: -100rpx;
  animation: orb-float 7s ease-in-out infinite reverse;
}

@keyframes orb-float {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(15rpx, -15rpx); }
  66% { transform: translate(-10rpx, 10rpx); }
}

// ========== 页面头部 ==========
.page-header {
  display: flex;
  align-items: center;
  padding: $spacing-base 0;
  position: relative;
  z-index: 1;
}

.back-btn {
  width: 72rpx; height: 72rpx;
  display: flex; align-items: center; justify-content: center;
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: 1rpx solid $glass-border;
  border-radius: 50%;

  .back-icon {
    font-size: 36rpx;
    color: $text-primary;
  }
}

.page-title {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
  letter-spacing: 4rpx;
}

.header-spacer { width: 72rpx; }

// ========== Logo 区 ==========
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0 40rpx;
  position: relative;
  z-index: 1;
}

.logo-wrap {
  width: 160rpx; height: 160rpx;
  border-radius: 40rpx;
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: 1rpx solid rgba(77,142,255,0.25);
  box-shadow: 0 0 60rpx rgba(77,142,255,0.15);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24rpx;
  animation: logo-glow 4s ease-in-out infinite;
}

@keyframes logo-glow {
  0%, 100% { box-shadow: 0 0 40rpx rgba(77,142,255,0.15); }
  50% { box-shadow: 0 0 80rpx rgba(77,142,255,0.3); }
}

.logo-img {
  width: 120rpx; height: 120rpx;
  border-radius: 32rpx;
}

.app-name {
  font-size: 48rpx; font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 4rpx;
  text-shadow: 0 0 30rpx rgba(77,142,255,0.4);
  margin-bottom: 8rpx;
}

.app-slogan {
  font-size: 26rpx;
  color: $text-secondary;
  letter-spacing: 1rpx;
}

// ========== 注册表单 ==========
.register-form {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.input-wrap {
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: 1rpx solid $glass-border;
  border-radius: $radius-xl;
  padding: 24rpx 28rpx;
  transition: all 0.3s ease;

  &.focused {
    border-color: rgba(77,142,255,0.5);
    box-shadow: 0 0 0 4rpx rgba(77,142,255,0.10), $shadow-glow;
  }

  &.has-value {
    border-color: rgba(77,142,255,0.3);
  }
}

.input-label {
  display: block;
  font-size: 22rpx;
  color: $primary-light;
  font-weight: 600;
  letter-spacing: 2rpx;
  margin-bottom: 12rpx;
}

.input-field {
  width: 100%;
  font-size: 30rpx;
  color: $text-primary;
  letter-spacing: 2rpx;

  &::placeholder { color: $text-muted; }
}

.eye-btn {
  position: absolute;
  right: 28rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 36rpx;
  opacity: 0.6;
}

.invite-tip {
  position: absolute;
  right: 28rpx;
  top: 50%;
  transform: translateY(-50%);

  .tip-text {
    font-size: 20rpx;
    color: $text-muted;
    background: rgba(255,140,0,0.1);
    padding: 4rpx 12rpx;
    border-radius: 999rpx;
    border: 1rpx solid rgba(255,140,0,0.2);
  }
}

// ========== 注册按钮 ==========
.register-btn {
  height: 100rpx;
  border-radius: $radius-xl;
  overflow: hidden;
  margin-top: 8rpx;

  &.loading { opacity: 0.7; }
}

.btn-inner {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
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
  font-size: 34rpx; font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 4rpx;
}

// ========== 协议 ==========
.agreement {
  text-align: center;
  margin-top: 4rpx;

  .agreement-text {
    font-size: 22rpx;
    color: $text-muted;
    line-height: 1.6;
  }

  .link {
    color: $primary-light;
    font-weight: 500;
  }
}

// ========== 登录入口 ==========
.login-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 4rpx;
}

.login-hint { font-size: 26rpx; color: $text-muted; }
.login-link {
  font-size: 26rpx;
  color: $primary-light;
  font-weight: 600;
  text-shadow: 0 0 10rpx rgba(0,242,254,0.3);
}

// ========== 底部 ==========
.footer-deco {
  text-align: center;
  padding: 40rpx 0 32rpx;
  position: relative;
  z-index: 1;

  .footer-text {
    font-size: 22rpx;
    color: $text-muted;
    letter-spacing: 2rpx;
  }
}
</style>
