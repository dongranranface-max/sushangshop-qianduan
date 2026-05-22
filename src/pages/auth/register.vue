<template>
  <view class="auth-split">

    <!-- ============================================
      左侧品牌空间（40%）
    ============================================ -->
    <view class="brand-space">
      <view class="brand-glow brand-glow--top" />
      <view class="brand-glow brand-glow--bottom" />

      <view class="brand-content">
        <view class="brand-logo-wrap stagger-1">
          <image class="brand-logo-img" src="/static/logo/logo.png" mode="aspectFit" />
        </view>
        <text class="brand-name stagger-2">集享公社</text>
        <text class="brand-slogan stagger-3">注册账号 · 共享生态价值</text>

        <view class="brand-divider stagger-4">
          <view class="divider-line divider-line--left" />
          <view class="divider-diamond" />
          <view class="divider-line divider-line--right" />
        </view>

        <view class="brand-footer stagger-5">
          <text class="brand-footer-text">已有账号？</text>
          <text class="brand-footer-link" @click="goLogin">立即登录</text>
        </view>

        <text class="brand-privacy stagger-6">
          注册即表示同意《用户协议》和《隐私政策》
        </text>
      </view>
    </view>

    <!-- ============================================
      右侧操作空间（60%）
    ============================================ -->
    <view class="panel-space">
      <view class="panel-safe-top" :style="{ height: statusBarHeight + 'px' }" />

      <scroll-view class="panel-scroll" scroll-y :show-scrollbar="false" enhanced>
        <view class="panel-inner">

          <view class="panel-header stagger-3">
            <text class="panel-title">创建账号</text>
            <text class="panel-subtitle">开启您的生态积分之旅</text>
          </view>

          <view class="panel-form stagger-4">

            <!-- 手机号 -->
            <view class="input-wrap input-field-wrap" :class="{ 'is-filled': form.phone.length === 11 }">
              <input
                class="input-native"
                v-model="form.phone"
                type="number"
                maxlength="11"
                placeholder="手机号"
                placeholder-class="input-plh"
                @focus="focusState.phone = true"
                @blur="focusState.phone = false"
              />
              <view class="input-gold-line" />
              <view class="input-glow" />
            </view>

            <!-- 验证码 -->
            <view class="input-wrap input-field-wrap code-field" :class="{ 'is-filled': form.code.length === 6 }">
              <input
                class="input-native"
                v-model="form.code"
                type="number"
                maxlength="6"
                placeholder="短信验证码"
                placeholder-class="input-plh"
                @focus="focusState.code = true"
                @blur="focusState.code = false"
              />
              <view class="input-gold-line" />
              <view class="input-glow" />
              <view
                class="code-btn"
                :class="{ 'is-counting': countdown > 0 || sending }"
                @click="sendCode"
              >
                <text>{{ codeBtnText }}</text>
              </view>
            </view>

            <!-- 密码 -->
            <view class="input-wrap input-field-wrap" :class="{ 'is-filled': form.password.length >= 6 }">
              <input
                class="input-native"
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                placeholder="设置登录密码（6位以上）"
                placeholder-class="input-plh"
                @focus="focusState.pwd = true"
                @blur="focusState.pwd = false"
              />
              <view class="input-gold-line" />
              <view class="input-glow" />
              <view class="input-toggle" @click="showPwd = !showPwd">
                <text class="toggle-icon">{{ showPwd ? '⊙' : '◉' }}</text>
              </view>
            </view>

            <!-- 邀请码（可选）-->
            <view class="input-wrap input-field-wrap" :class="{ 'is-filled': form.inviteCode.length > 0 }">
              <input
                class="input-native"
                v-model="form.inviteCode"
                placeholder="邀请码（选填）"
                placeholder-class="input-plh"
                @focus="focusState.invite = true"
                @blur="focusState.invite = false"
              />
              <view class="input-gold-line" />
              <view class="input-glow" />
            </view>

          </view>

          <!-- 提交按钮 -->
          <view class="panel-submit stagger-5">
            <view
              class="submit-btn"
              :class="{ 'is-loading': submitting }"
              @click="doRegister"
            >
              <view v-if="!submitting" class="submit-inner">
                <text class="submit-text">注 册</text>
              </view>
              <view v-else class="submit-loading">
                <view class="loading-spinner" />
                <text class="loading-text">注册中...</text>
              </view>
            </view>
          </view>

          <!-- 服务条款说明 -->
          <view class="panel-terms stagger-6">
            <view class="terms-check" @click="agreed = !agreed">
              <view class="check-box" :class="{ 'is-checked': agreed }">
                <text v-if="agreed" class="check-icon">✓</text>
              </view>
              <text class="terms-text">
                我已阅读并同意
                <text class="terms-link">《用户协议》</text>
                和
                <text class="terms-link">《隐私政策》</text>
              </text>
            </view>
          </view>

        </view>
      </scroll-view>

      <view class="panel-safe-bottom" />
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { authApi } from '@/utils/api'

const statusBarHeight = ref(20)
const submitting = ref(false)
const sending = ref(false)
const showPwd = ref(false)
const agreed = ref(false)
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const focusState = reactive({
  phone: false,
  code: false,
  pwd: false,
  invite: false,
})

const form = ref({
  phone: '',
  code: '',
  password: '',
  inviteCode: '',
})

// #ifdef MP-WEIXIN
const app = getApp()
statusBarHeight.value = app.globalData?.statusBarHeight || 20
// #endif
// #ifdef H5
statusBarHeight.value = (uni as any).getSystemInfoSync()?.statusBarHeight || 20
// #endif

const codeBtnText = computed(() => {
  if (sending.value) return '发送中'
  if (countdown.value > 0) return `${countdown.value}s`
  return '获取验证码'
})

function goLogin() {
  uni.redirectTo({ url: '/pages/auth/login' })
}

async function sendCode() {
  if (countdown.value > 0 || sending.value) return
  if (!/^1\d{10}$/.test(form.value.phone)) {
    return uni.showToast({ title: '请输入正确手机号', icon: 'none' })
  }
  sending.value = true
  try {
    await authApi.sendResetSmsCode(form.value.phone)
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0 && countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (e: any) {
    uni.showToast({ title: e.message || '发送失败', icon: 'none' })
  } finally {
    sending.value = false
  }
}

async function doRegister() {
  if (submitting.value) return
  if (!/^1\d{10}$/.test(form.value.phone)) {
    return uni.showToast({ title: '请输入手机号', icon: 'none' })
  }
  if (!/^\d{6}$/.test(form.value.code)) {
    return uni.showToast({ title: '请输入6位验证码', icon: 'none' })
  }
  if (form.value.password.length < 6) {
    return uni.showToast({ title: '密码至少6位', icon: 'none' })
  }
  if (!agreed.value) {
    return uni.showToast({ title: '请先阅读并同意用户协议', icon: 'none' })
  }

  submitting.value = true
  uni.showLoading({ title: '注册中...' })
  try {
    await authApi.register(
      form.value.phone,
      form.value.password,
      form.value.inviteCode || undefined,
      form.value.code
    )
    uni.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: '/pages/auth/login' }), 1200)
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

// ============================================
//  沉浸式分屏（与登录页一致）
// ============================================
.auth-split {
  display: flex;
  width: 100vw;
  min-height: 100vh;
  background: $bg-primary;
}

.brand-space {
  flex: 0 0 40%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $navy;
  box-shadow: inset -24rpx 0 80rpx rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.brand-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80rpx);

  &--top {
    width: 400rpx;
    height: 400rpx;
    top: -100rpx;
    right: -80rpx;
    background: radial-gradient(circle, rgba(196, 165, 116, 0.15) 0%, transparent 70%);
    animation: glow-float 8s ease-in-out infinite;
  }

  &--bottom {
    width: 350rpx;
    height: 350rpx;
    bottom: -80rpx;
    left: -100rpx;
    background: radial-gradient(circle, rgba(45, 58, 82, 0.4) 0%, transparent 70%);
    animation: glow-float 10s ease-in-out infinite reverse;
  }
}

@keyframes glow-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(16rpx, -16rpx) scale(1.08); }
}

.brand-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 48rpx;
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
}

.brand-logo-wrap {
  width: 144rpx;
  height: 144rpx;
  border-radius: 40rpx;
  background: rgba(196, 165, 116, 0.1);
  border: 1rpx solid rgba(196, 165, 116, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.brand-logo-img {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
}

.brand-name {
  font-size: 48rpx;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 8rpx;
  margin-bottom: 16rpx;
}

.brand-slogan {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 4rpx;
  margin-bottom: 56rpx;
}

.brand-divider {
  display: flex;
  align-items: center;
  width: 180rpx;
  margin-bottom: 56rpx;
}

.divider-line {
  flex: 1;
  height: 1rpx;

  &--left {
    background: linear-gradient(90deg, transparent 0%, rgba(196, 165, 116, 0.45) 100%);
  }

  &--right {
    background: linear-gradient(90deg, rgba(196, 165, 116, 0.45) 0%, transparent 100%);
  }
}

.divider-diamond {
  width: 8rpx;
  height: 8rpx;
  background: $gold;
  transform: rotate(45deg);
  margin: 0 16rpx;
  opacity: 0.7;
}

.brand-footer {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin-bottom: 28rpx;
}

.brand-footer-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.4);
}

.brand-footer-link {
  font-size: 24rpx;
  color: $gold;
  font-weight: 600;
}

.brand-privacy {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.28);
  text-align: center;
  line-height: 1.7;
  padding: 0 16rpx;
}

// ============================================
//  右侧操作空间
// ============================================
.panel-space {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: $bg-primary;
  min-height: 100vh;
}

.panel-safe-top { flex-shrink: 0; }

.panel-scroll {
  flex: 1;
  height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
}

.panel-inner {
  padding: 80rpx 64rpx 120rpx;
  display: flex;
  flex-direction: column;
}

.panel-header {
  margin-bottom: 60rpx;
}

.panel-title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: $text-primary;
  letter-spacing: -0.01em;
  margin-bottom: 12rpx;
}

.panel-subtitle {
  display: block;
  font-size: 26rpx;
  color: $text-muted;
}

// ============================================
//  输入框：金线延伸
// ============================================
.input-field-wrap {
  position: relative;
  margin-bottom: 40rpx;

  .input-native {
    width: 100%;
    height: 96rpx;
    padding: 0 40rpx;
    background: transparent;
    border: none;
    border-radius: 0;
    font-size: 30rpx;
    font-weight: 500;
    color: $text-primary;
    letter-spacing: 1rpx;
    transition: background 0.3s ease;
    box-sizing: border-box;

    &::placeholder { color: $text-muted; font-weight: 400; }
    &:focus { outline: none; background: rgba(255, 255, 255, 0.8); }
  }

  .input-gold-line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 3rpx;
    background: linear-gradient(90deg, $accent 0%, $gold-light 50%, $accent 100%);
    border-radius: 3rpx 3rpx 0 0;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .input-glow {
    position: absolute;
    bottom: -6rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 70%;
    height: 32rpx;
    background: radial-gradient(ellipse at center, rgba(196, 165, 116, 0.18) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  &.is-focused {
    .input-gold-line { width: 100%; }
    .input-glow { opacity: 1; }
  }

  &.is-filled {
    .input-gold-line { width: 100%; }
  }
}

// 验证码按钮
.code-field .code-btn {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 64rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  border-left: 1rpx solid rgba(20, 20, 20, 0.08);
  font-size: 24rpx;
  color: $accent-dark;
  font-weight: 600;
  transition: color 0.3s ease;

  &.is-counting {
    color: $text-muted;
  }
}

// 密码显示切换
.input-toggle {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  .toggle-icon {
    font-size: 32rpx;
    color: $text-muted;
  }
}

// ============================================
//  提交按钮
// ============================================
.submit-btn {
  height: 96rpx;
  border-radius: 9999rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 16rpx 40rpx rgba(26, 36, 56, 0.22);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 8rpx 24rpx rgba(26, 36, 56, 0.18);
  }
}

.submit-inner,
.submit-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $navy;
}

.submit-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.12) 50%, transparent 100%);
  animation: btn-shimmer 3s ease-in-out infinite;
}

@keyframes btn-shimmer {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.submit-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 8rpx;
}

.submit-btn.is-loading { opacity: 0.75; }

.loading-spinner {
  width: 32rpx;
  height: 32rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 12rpx;
}

.loading-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 2rpx;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ============================================
//  协议勾选
// ============================================
.panel-terms {
  margin-top: 40rpx;
}

.terms-check {
  display: flex;
  align-items: center;
  gap: 16rpx;
  cursor: pointer;
}

.check-box {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  border: 2rpx solid rgba(20, 20, 20, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;

  &.is-checked {
    background: $gold;
    border-color: $gold;
    animation: checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.check-icon {
  font-size: 22rpx;
  color: #FFFFFF;
  font-weight: 700;
}

@keyframes checkPop {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.terms-text {
  font-size: 22rpx;
  color: $text-muted;
  line-height: 1.5;
}

.terms-link {
  color: $accent-dark;
  font-weight: 600;
}

// ============================================
//  入场动画
// ============================================
.stagger-1 { animation: fadeSlideUp 600ms cubic-bezier(0.4, 0, 0.2, 1) 0ms both; }
.stagger-2 { animation: fadeSlideUp 600ms cubic-bezier(0.4, 0, 0.2, 1) 120ms both; }
.stagger-3 { animation: fadeSlideUp 600ms cubic-bezier(0.4, 0, 0.2, 1) 240ms both; }
.stagger-4 { animation: fadeSlideUp 600ms cubic-bezier(0.4, 0, 0.2, 1) 360ms both; }
.stagger-5 { animation: fadeSlideUp 600ms cubic-bezier(0.4, 0, 0.2, 1) 480ms both; }
.stagger-6 { animation: fadeSlideUp 600ms cubic-bezier(0.4, 0, 0.2, 1) 600ms both; }

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-safe-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}
</style>