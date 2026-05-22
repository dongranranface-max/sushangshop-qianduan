<template>
  <view class="auth-split">

    <!-- ============================================
      左侧品牌空间（40%）
    ============================================ -->
    <view class="brand-space">
      <view class="brand-glow brand-glow--top" />
      <view class="brand-glow brand-glow--bottom" />

      <view class="brand-content">
        <view class="brand-logo-wrap">
          <image class="brand-logo-img" src="/static/jxgs.png" mode="aspectFit" />
        </view>
        <text class="brand-name">集享公社</text>
        <text class="brand-slogan">找回密码 · 重新启程</text>

        <view class="brand-divider">
          <view class="divider-line divider-line--left" />
          <view class="divider-diamond" />
          <view class="divider-line divider-line--right" />
        </view>

        <view class="brand-footer">
          <text class="brand-footer-text">想起密码了？</text>
          <text class="brand-footer-link" @click="goLogin">返回登录</text>
        </view>

        <text class="brand-privacy">
          找回过程中有任何问题，请联系平台客服
        </text>
      </view>
    </view>

    <!-- ============================================
      右侧操作空间（60%）
      两步流程：① 验证手机 → ② 设置新密码
    ============================================ -->
    <view class="panel-space">
      <view class="panel-safe-top" :style="{ height: statusBarHeight + 'px' }" />

      <!-- 顶部返回栏 -->
      <view class="panel-topbar">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
      </view>

      <scroll-view class="panel-scroll" scroll-y :show-scrollbar="false" enhanced>
        <view class="panel-inner">

          <!-- 步骤指示器 -->
          <view class="step-indicator">
            <view class="step-item" :class="{ 'is-active': step === 1, 'is-done': step > 1 }">
              <view class="step-circle">
                <text v-if="step > 1" class="step-check">✓</text>
                <text v-else>1</text>
              </view>
              <text class="step-label">验证手机</text>
            </view>
            <view class="step-connector" :class="{ 'is-done': step > 1 }" />
            <view class="step-item" :class="{ 'is-active': step === 2 }">
              <view class="step-circle">
                <text>2</text>
              </view>
              <text class="step-label">设置密码</text>
            </view>
          </view>

          <!-- ========== Step 1: 验证手机 ========== -->
          <template v-if="step === 1">
            <view class="panel-header">
              <text class="panel-title">短信验证</text>
              <text class="panel-subtitle">验证注册手机号后设置新密码</text>
            </view>

            <view class="panel-form">

              <!-- 手机号 -->
              <view class="input-wrap input-field-wrap" :class="{ 'is-focused': focusState.phone, 'is-filled': form.phone.length === 11 }">
                <input
                  class="input-native"
                  v-model="form.phone"
                  type="number"
                  maxlength="11"
                  placeholder="注册时的手机号"
                  placeholder-class="input-plh"
                  @focus="focusState.phone = true"
                  @blur="focusState.phone = false"
                />
                <view class="input-gold-line" />
                <view class="input-glow" />
              </view>

              <!-- 验证码 -->
              <view class="input-wrap input-field-wrap" :class="{ 'is-focused': focusState.code, 'is-filled': form.code.length === 6 }">
                <input
                  class="input-native"
                  v-model="form.code"
                  type="number"
                  maxlength="6"
                  placeholder="请输入6位验证码"
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

            </view>

            <view class="panel-submit">
              <view
                class="submit-btn"
                :class="{ 'is-disabled': !canGoStep2 }"
                @click="goStep2"
              >
                <text class="submit-text">下一步</text>
              </view>
            </view>
          </template>

          <!-- ========== Step 2: 设置密码 ========== -->
          <template v-else>
            <view class="panel-header">
              <text class="panel-title">设置新密码</text>
              <text class="panel-subtitle">
                已为 <text class="highlight-phone">{{ maskedPhone }}</text> 验证通过
              </text>
            </view>

            <view class="panel-form">

              <!-- 新密码 -->
              <view class="input-wrap input-field-wrap" :class="{ 'is-focused': focusState.pwd, 'is-filled': form.password.length >= 6 }">
                <input
                  class="input-native"
                  v-model="form.password"
                  :type="showPwd ? 'text' : 'password'"
                  placeholder="新密码（6位以上）"
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

              <!-- 密码强度指示 -->
              <view v-if="form.password" class="pwd-strength">
                <view class="pwd-track">
                  <view
                    class="pwd-fill"
                    :class="`pwd-fill--${pwdLevel}`"
                    :style="{ width: pwdPercent + '%' }"
                  />
                </view>
                <text class="pwd-hint">{{ pwdHint }}</text>
              </view>

              <!-- 确认新密码 -->
              <view class="input-wrap input-field-wrap" :class="{ 'is-focused': focusState.confirm, 'is-filled': form.confirm.length >= 6 }">
                <input
                  class="input-native"
                  v-model="form.confirm"
                  :type="showConfirm ? 'text' : 'password'"
                  placeholder="再次输入新密码"
                  placeholder-class="input-plh"
                  @focus="focusState.confirm = true"
                  @blur="focusState.confirm = false"
                />
                <view class="input-gold-line" />
                <view class="input-glow" />
                <view class="input-toggle" @click="showConfirm = !showConfirm">
                  <text class="toggle-icon">{{ showConfirm ? '⊙' : '◉' }}</text>
                </view>
              </view>

              <!-- 确认密码错误提示 -->
              <text v-if="confirmDirty && form.confirm !== form.password" class="confirm-error">
                两次密码不一致
              </text>

            </view>

            <view class="panel-submit">
              <view
                class="submit-btn"
                :class="{ 'is-disabled': !canSubmit || submitting, 'is-loading': submitting }"
                @click="doReset"
              >
                <view v-if="!submitting" class="submit-inner">
                  <text class="submit-text">确认重置</text>
                </view>
                <view v-else class="submit-loading">
                  <view class="loading-spinner" />
                  <text class="loading-text">提交中...</text>
                </view>
              </view>
            </view>

            <view class="panel-back-link">
              <text class="back-link-text" @click="step = 1">← 返回上一步</text>
            </view>
          </template>

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
const step = ref(1)
const submitting = ref(false)
const sending = ref(false)
const showPwd = ref(false)
const showConfirm = ref(false)
const countdown = ref(0)
const confirmDirty = ref(false)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const focusState = reactive({
  phone: false,
  code: false,
  pwd: false,
  confirm: false,
})

const form = ref({
  phone: '',
  code: '',
  password: '',
  confirm: '',
})

// #ifdef MP-WEIXIN
const app = getApp()
statusBarHeight.value = app.globalData?.statusBarHeight || 20
// #endif
// #ifdef H5
statusBarHeight.value = (uni as any).getSystemInfoSync()?.statusBarHeight || 20
// #endif

const maskedPhone = computed(() => {
  const p = form.value.phone
  return p.length === 11 ? `${p.slice(0, 3)}****${p.slice(7)}` : p
})

const codeBtnText = computed(() => {
  if (sending.value) return '发送中'
  if (countdown.value > 0) return `${countdown.value}s`
  return '获取验证码'
})

const canGoStep2 = computed(() =>
  /^1\d{10}$/.test(form.value.phone) && /^\d{6}$/.test(form.value.code)
)

const pwdLevel = ref(0)
const pwdPercent = ref(0)
const pwdHint = ref('')

const canSubmit = computed(() =>
  form.value.password.length >= 6 && form.value.confirm === form.value.password
)

function goBack() {
  if (step.value === 2) {
    step.value = 1
    return
  }
  uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/auth/login' }) })
}

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

function goStep2() {
  if (!canGoStep2.value) {
    return uni.showToast({ title: '请完成手机号与验证码', icon: 'none' })
  }
  step.value = 2
}

function onPwdInput() {
  const p = form.value.password
  let level = 0
  if (p.length >= 6) level = 1
  if (p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p)) level = 2
  if (p.length >= 10 && /[A-Za-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p)) level = 3
  pwdLevel.value = level
  pwdPercent.value = level === 0 ? Math.min(33, (p.length / 6) * 33) : level * 33
  const hints = ['', '强度一般', '强度良好', '强度优秀']
  pwdHint.value = p.length ? hints[level] || '' : ''
}

async function doReset() {
  if (submitting.value || !canSubmit.value) return

  confirmDirty.value = true

  if (form.value.confirm !== form.value.password) {
    return uni.showToast({ title: '两次密码不一致', icon: 'none' })
  }

  submitting.value = true
  uni.showLoading({ title: '重置中...', mask: true })
  try {
    await authApi.resetPassword(
      form.value.phone,
      form.value.code.trim(),
      form.value.password
    )
    uni.showToast({ title: '密码已重置', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: '/pages/auth/login' }), 1200)
  } catch (e: any) {
    uni.showToast({ title: e.message || '重置失败', icon: 'none' })
  } finally {
    submitting.value = false
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

// ============================================
//  沉浸式分屏（与登录/注册页一致）
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
  background: $mineral-gray;
  box-shadow: inset -24rpx 0 80rpx rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
}

.brand-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  // 静态光晕，无动画，保证丝滑
  &--top {
    width: 480rpx;
    height: 480rpx;
    top: -120rpx;
    right: -120rpx;
    background: radial-gradient(
      circle,
      rgba(184, 152, 118, 0.25) 0%,
      rgba(184, 152, 118, 0.08) 40%,
      transparent 70%
    );
    opacity: 0.85;
  }

  &--bottom {
    width: 400rpx;
    height: 400rpx;
    bottom: -100rpx;
    left: -120rpx;
    background: radial-gradient(
      circle,
      rgba(65, 75, 94, 0.5) 0%,
      rgba(47, 53, 66, 0.15) 50%,
      transparent 70%
    );
    opacity: 0.7;
  }
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
  background: rgba(184, 152, 118, 0.12);
  border: 1rpx solid rgba(184, 152, 118, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  overflow: hidden;
}

.brand-logo-img {
  width: 96rpx;
  height: 96rpx;
  display: block;
}

.brand-logo-img {
  width: 96rpx;
  height: 96rpx;
  display: block;
}

.brand-name {
  font-size: 40rpx;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 2rpx;
  margin-bottom: 16rpx;
}

.brand-slogan {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1rpx;
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
    background: linear-gradient(90deg, transparent 0%, rgba(184, 152, 118, 0.45) 100%);
  }

  &--right {
    background: linear-gradient(90deg, rgba(184, 152, 118, 0.45) 0%, transparent 100%);
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
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.45);
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

// 返回栏
.panel-topbar {
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  height: 88rpx;
}

.back-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(47, 53, 66, 0.06);

  .back-icon {
    font-size: 28rpx;
    color: $mineral-gray;
    font-weight: 500;
  }
}

.panel-scroll {
  flex: 1;
  height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 88rpx);
}

.panel-inner {
  padding: 80rpx 64rpx 120rpx;
  display: flex;
  flex-direction: column;
}

// ============================================
//  步骤指示器
// ============================================
.step-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 56rpx;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;

  .step-circle {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(20, 20, 20, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    font-weight: 700;
    color: $text-muted;
    background: $bg-secondary;
    transition: all 0.4s ease;

    .step-check {
      font-size: 24rpx;
      color: $success;
    }
  }

  .step-label {
    font-size: 22rpx;
    color: $text-muted;
    font-weight: 500;
  }

  &.is-active .step-circle {
    border-color: $gold;
    background: $gold;
    color: #FFFFFF;
  }

  &.is-active .step-label {
    color: $text-primary;
    font-weight: 600;
  }

  &.is-done .step-circle {
    border-color: $success;
    background: $success;
    color: #FFFFFF;
  }

  &.is-done .step-label {
    color: $success;
  }
}

.step-connector {
  flex: 1;
  height: 2rpx;
  background: rgba(20, 20, 20, 0.1);
  margin: 0 16rpx;
  margin-bottom: 36rpx;
  transition: background 0.4s ease;

  &.is-done {
    background: $success;
  }
}

// ============================================
//  页面标题
// ============================================
.panel-header {
  margin-bottom: 56rpx;
}

.panel-title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
  color: $text-primary;
  letter-spacing: 0;
  margin-bottom: 12rpx;
}

.panel-subtitle {
  display: block;
  font-size: 25rpx;
  color: $text-muted;
}

.highlight-phone {
  color: $accent-dark;
  font-weight: 600;
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
    font-size: 28rpx;
    font-weight: 500;
    color: $text-primary;
    letter-spacing: 0;
    transition: background 0.3s ease;
    box-sizing: border-box;

    &::placeholder { color: $text-muted; font-weight: 400; }
    &:focus {
      outline: none;
      background: transparent;
    }
  }

  .input-gold-line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 3rpx;
    background: linear-gradient(90deg, $accent 0%, $gold-light 50%, $accent 100%);
    border-radius: 3rpx 3rpx 0 0;
    transition: width 0.4s ease;
  }

  .input-glow {
    position: absolute;
    bottom: -6rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 70%;
    height: 32rpx;
    background: radial-gradient(ellipse at center, rgba(184, 152, 118, 0.18) 0%, transparent 70%);
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
.code-btn {
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
    font-size: 28rpx;
    color: $text-muted;
    line-height: 1;
  }
}

// ============================================
//  密码强度指示
// ============================================
.pwd-strength {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 40rpx;
}

.pwd-track {
  flex: 1;
  height: 8rpx;
  background: $bg-tertiary;
  border-radius: 9999rpx;
  overflow: hidden;
}

.pwd-fill {
  height: 100%;
  border-radius: 9999rpx;
  transition: width 0.25s ease, background 0.25s ease;

  &--1 { background: $warning; }
  &--2 { background: $primary; }
  &--3 { background: $success; }
}

.pwd-hint {
  font-size: 22rpx;
  color: $text-muted;
  flex-shrink: 0;
}

// ============================================
//  确认密码错误
// ============================================
.confirm-error {
  display: block;
  font-size: 22rpx;
  color: $danger;
  margin-top: -28rpx;
  margin-bottom: 40rpx;
}

// ============================================
//  提交按钮
// ============================================
.submit-btn {
  height: 96rpx;
  border-radius: 9999rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 16rpx 40rpx rgba(47, 53, 66, 0.22);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 8rpx 24rpx rgba(47, 53, 66, 0.18);
  }

  &.is-disabled {
    opacity: 0.45;
    pointer-events: none;
  }

  &.is-loading {
    opacity: 0.75;
  }
}

.submit-inner,
.submit-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $mineral-gray;
  border-radius: inherit;
}

.submit-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 4rpx;
}

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
//  返回上一步
// ============================================
.panel-back-link {
  margin-top: 32rpx;
  text-align: center;
}

.back-link-text {
  font-size: 24rpx;
  color: $text-muted;
  font-weight: 500;
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
