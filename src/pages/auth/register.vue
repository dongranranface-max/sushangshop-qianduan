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

      <!-- 邀请码（必填） -->
      <view
        class="input-wrap invite-wrap"
        :class="{
          focused: focus.invite,
          'invite-alert': inviteAlert,
        }"
      >
        <text class="input-label">🎁 邀请码（必填）</text>
        <input
          class="input-field"
          v-model="form.inviteCode"
          placeholder="输入邀请码开启理财之旅"
          placeholder-class="input-placeholder"
          maxlength="6"
          @focus="focus.invite = true"
          @blur="onInviteBlur"
        />
        <text v-if="inviteAlert" class="invite-error">请输入有效邀请码（6位）</text>
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
const inviteAlert = ref(false)
const inviteTouched = ref(false)

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

function onInviteBlur() {
  focus.invite = false
  inviteTouched.value = true
  inviteAlert.value = !form.value.inviteCode.trim()
}

async function doRegister() {
  if (submitting.value) return
  if (!form.value.phone || form.value.phone.length !== 11) {
    return uni.showToast({ title: '请输入正确的11位手机号', icon: 'none' })
  }
  if (!form.value.password || form.value.password.length < 6) {
    return uni.showToast({ title: '密码至少6位', icon: 'none' })
  }
  const code = form.value.inviteCode.trim()
  if (!code || code.length < 4) {
    inviteTouched.value = true
    inviteAlert.value = true
    return uni.showToast({ title: '请输入邀请码开启理财之旅', icon: 'none' })
  }

  submitting.value = true
  uni.showLoading({ title: '注册中...' })
  try {
    await authApi.register(form.value.phone, form.value.password, code)
    const { assetStore } = await import('@/store/asset')
    await assetStore.fetchBalance()
    uni.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 1200)
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
  background: linear-gradient(165deg, #FFFFFF 0%, #F5F4F1 38%, #EFEEEB 100%);
  padding: 0 var(--spacing-xl);
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
  background: radial-gradient(circle at 40% 40%, rgba(232, 213, 181, 0.45) 0%, rgba(196, 165, 116, 0.18) 42%, transparent 72%);
  top: -100rpx; left: -100rpx;
  animation: orb-float 9s ease-in-out infinite;
}

.orb-2 {
  width: 350rpx; height: 350rpx;
  background: radial-gradient(circle at 55% 55%, rgba(45, 58, 82, 0.14) 0%, rgba(26, 36, 56, 0.06) 45%, transparent 70%);
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
  padding: var(--spacing-base) 0;
  position: relative;
  z-index: 1;
}

.back-btn {
  width: 72rpx; height: 72rpx;
  display: flex; align-items: center; justify-content: center;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1rpx solid var(--glass-border);
  border-radius: 50%;

  .back-icon {
    font-size: 36rpx;
    color: var(--text-primary);
  }
}

.page-title {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
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
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1rpx solid $border-primary;
  box-shadow: $shadow-gold;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24rpx;
  animation: logo-glow 4s ease-in-out infinite;
}

@keyframes logo-glow {
  0%, 100% { box-shadow: $shadow-gold; }
  50% { box-shadow: $shadow-fire-strong; }
}

.logo-img {
  width: 120rpx; height: 120rpx;
  border-radius: 32rpx;
}

.app-name {
  font-size: 48rpx; font-weight: 800;
  color: $navy;
  letter-spacing: 4rpx;
  margin-bottom: 8rpx;
}

.app-slogan {
  font-size: 26rpx;
  color: var(--text-secondary);
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
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1rpx solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: 24rpx 28rpx;
  transition: all 0.3s ease;

  &.focused {
    border-color: $border-primary;
    box-shadow: 0 0 0 4rpx rgba(196, 165, 116, 0.10), var(--shadow-glow);
  }

  &.has-value {
    border-color: $border-primary;
  }
}

.input-label {
  display: block;
  font-size: 22rpx;
  color: $accent-dark;
  font-weight: 600;
  letter-spacing: 2rpx;
  margin-bottom: 12rpx;
}

.input-field {
  width: 100%;
  font-size: 30rpx;
  color: var(--text-primary);
  letter-spacing: 2rpx;

  &::placeholder { color: var(--text-muted); }
}

.eye-btn {
  position: absolute;
  right: 28rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 36rpx;
  opacity: 0.6;
}

.invite-wrap.invite-alert {
  border-color: rgba(255, 61, 61, 0.65) !important;
  animation: invite-breathe 1.5s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(255, 61, 61, 0.35);
}
@keyframes invite-breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 61, 61, 0.4); }
  50% { box-shadow: 0 0 0 14rpx rgba(255, 61, 61, 0); }
}
.invite-error {
  display: block;
  font-size: 22rpx;
  color: #ff3d3d;
  margin-top: 12rpx;
}
.invite-tip-legacy {
  position: absolute;
  right: 28rpx;
  top: 50%;
  transform: translateY(-50%);

  .tip-text {
    font-size: 20rpx;
    color: var(--text-muted);
    background: rgba(255,140,0,0.1);
    padding: 4rpx 12rpx;
    border-radius: 999rpx;
    border: 1rpx solid rgba(255,140,0,0.2);
  }
}

// ========== 注册按钮 ==========
.register-btn {
  height: 100rpx;
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-top: 8rpx;

  &.loading { opacity: 0.7; }
}

.btn-inner {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-fire);
  box-shadow: var(--shadow-fire);

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
    color: var(--text-muted);
    line-height: 1.6;
  }

  .link {
    color: $accent-dark;
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

.login-hint { font-size: 26rpx; color: var(--text-muted); }
.login-link {
  font-size: 26rpx;
  color: $accent-dark;
  font-weight: 600;
}

// ========== 底部 ==========
.footer-deco {
  text-align: center;
  padding: 40rpx 0 32rpx;
  position: relative;
  z-index: 1;

  .footer-text {
    font-size: 22rpx;
    color: var(--text-muted);
    letter-spacing: 2rpx;
  }
}
</style>
