<template>
  <view class="auth-page">

    <!-- ============================================
      顶部导航栏
    ============================================ -->
    <view class="auth-nav">
      <view class="auth-nav__brand">
        <view class="auth-nav__logo">
          <image class="auth-nav__logo-img" src="/static/logo.png" mode="aspectFit" />
        </view>
        <view class="auth-nav__text">
          <text class="auth-nav__name">集享公社</text>
          <text class="auth-nav__slogan">集轻奢 · 享财富</text>
        </view>
      </view>
      <view class="auth-nav__actions">
        <text class="nav-link" @click="goLogin">登录</text>
      </view>
    </view>

    <!-- ============================================
      品牌英雄区
    ============================================ -->
    <view class="brand-hero">
      <view class="brand-hero__halo" />
      <view class="brand-hero__logo-card">
        <image class="brand-hero__logo" src="/static/logo.png" mode="aspectFit" />
      </view>
      <view class="brand-hero__warm-glow" />
    </view>

    <!-- ============================================
      表单区域
    ============================================ -->
    <view class="auth-body">
      <scroll-view scroll-y class="auth-scroll" :show-scrollbar="false">
        <view class="auth-card">

          <!-- 标题 -->
          <view class="auth-card__head">
            <text class="auth-card__title">创建账号</text>
            <text class="auth-card__sub">开启您的生态积分财富之旅</text>
          </view>

          <!-- 手机号 ─ FL 浮动标签 -->
          <view class="fl-field" :class="phoneFieldClass">
            <view class="fl-field__label-row">
              <text class="fl-field__label" :class="{ 'is-float': phoneFloatState }">手机号</text>
            </view>
            <view class="fl-field__body">
              <input
                class="fl-field__input"
                v-model="form.phone"
                inputmode="numeric"
                type="number"
                maxlength="11"
                placeholder=" "
                @focus="onFocus('phone')"
                @blur="onBlur('phone')"
              />
              <view class="fl-field__float-label" :class="{ 'is-active': phoneFloatState }">
                <text class="fl-field__float-text">手机号</text>
              </view>
            </view>
          </view>

          <!-- 验证码 ─ FL + 圆形倒计时 -->
          <view class="fl-field" :class="codeFieldClass">
            <view class="fl-field__label-row">
              <text class="fl-field__label" :class="{ 'is-float': codeFloatState }">短信验证码</text>
            </view>
            <view class="fl-field__body fl-field__body--row">
              <view class="fl-field__code-wrap">
                <input
                  class="fl-field__input"
                  v-model="form.code"
                  inputmode="numeric"
                  type="number"
                  maxlength="6"
                  placeholder=" "
                  @focus="onFocus('code')"
                  @blur="onBlur('code')"
                />
                <view class="fl-field__float-label" :class="{ 'is-active': codeFloatState }">
                  <text class="fl-field__float-text">6位验证码</text>
                </view>
              </view>
              <!-- 圆形倒计时 -->
              <view class="countdown-ring" :class="{ 'is-counting': countdown > 0 }" @click="sendCode">
                <svg class="countdown-ring__svg" viewBox="0 0 56 56">
                  <circle
                    class="countdown-ring__track"
                    cx="28" cy="28" r="24"
                    fill="none"
                    stroke-width="3"
                  />
                  <circle
                    class="countdown-ring__fill"
                    cx="28" cy="28" r="24"
                    fill="none"
                    stroke-width="3"
                    :stroke-dasharray="151.9"
                    :stroke-dashoffset="countdownOffset"
                    stroke-linecap="round"
                  />
                </svg>
                <view class="countdown-ring__inner">
                  <text v-if="countdown === 0 && !sending" class="countdown-ring__text">获取</text>
                  <text v-else-if="sending" class="countdown-ring__text countdown-ring__text--sending">···</text>
                  <text v-else class="countdown-ring__text">{{ countdown }}s</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 密码 ─ FL 浮动标签 -->
          <view class="fl-field" :class="pwdFieldClass">
            <view class="fl-field__label-row">
              <text class="fl-field__label" :class="{ 'is-float': pwdFloatState }">登录密码</text>
            </view>
            <view class="fl-field__body">
              <input
                class="fl-field__input"
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                placeholder=" "
                @focus="onFocus('pwd')"
                @blur="onBlur('pwd')"
              />
              <view class="fl-field__float-label" :class="{ 'is-active': pwdFloatState }">
                <text class="fl-field__float-text">6位以上数字与字母</text>
              </view>
              <view class="fl-field__eye" @click="showPwd = !showPwd">
                <svg v-if="showPwd" class="fl-field__eye-svg" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>
                </svg>
                <svg v-else class="fl-field__eye-svg" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </view>
            </view>
          </view>

          <!-- 邀请码 ─ FL 浮动标签（弱化） -->
          <view class="fl-field fl-field--muted" :class="inviteFieldClass">
            <view class="fl-field__label-row">
              <text class="fl-field__label fl-field__label--muted" :class="{ 'is-float': inviteFloatState }">
                邀请码 <text class="fl-field__optional">（选填）</text>
              </text>
            </view>
            <view class="fl-field__body fl-field__body--muted">
              <input
                class="fl-field__input"
                v-model="form.inviteCode"
                placeholder=" "
                @focus="onFocus('invite')"
                @blur="onBlur('invite')"
              />
              <view class="fl-field__float-label" :class="{ 'is-active': inviteFloatState }">
                <text class="fl-field__float-text">如有邀请码请输入</text>
              </view>
            </view>
          </view>

          <!-- 协议勾选 -->
          <view class="terms-row" @click="agreed = !agreed">
            <view class="check-square" :class="{ 'is-checked': agreed }">
              <text v-if="agreed" class="check-square__icon">✓</text>
            </view>
            <text class="terms-text">
              我已阅读并同意
              <text class="terms-link">《用户协议》</text>
              和
              <text class="terms-link">《隐私政策》</text>
            </text>
          </view>

          <!-- 提交按钮 ─ 流动加载 -->
          <view
            class="btn-submit"
            :class="{
              'is-disabled': !agreed || submitting || !canSubmit,
              'is-loading': submitting
            }"
            @click="doRegister"
          >
            <view v-if="!submitting" class="btn-submit__inner">
              <text class="btn-submit__text">注册</text>
            </view>
            <view v-else class="btn-submit__flow">
              <view class="btn-submit__flow-bar" />
              <text class="btn-submit__flow-text">注册中...</text>
            </view>
          </view>

        </view>
      </scroll-view>
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

// ─── FL 浮动状态 ─────────────────────────────────
const phoneFloatState = computed(() => focusState.phone || form.value.phone.length > 0)
const codeFloatState = computed(() => focusState.code || form.value.code.length > 0)
const pwdFloatState = computed(() => focusState.pwd || form.value.password.length > 0)
const inviteFloatState = computed(() => focusState.invite || form.value.inviteCode.length > 0)

// ─── 字段 class computed ──────────────────────────
const phoneFieldClass = computed(() => ({
  'is-focused': focusState.phone,
  'is-filled': form.value.phone.length > 0,
}))
const codeFieldClass = computed(() => ({
  'is-focused': focusState.code,
  'is-filled': form.value.code.length > 0,
}))
const pwdFieldClass = computed(() => ({
  'is-focused': focusState.pwd,
  'is-filled': form.value.password.length > 0,
}))
const inviteFieldClass = computed(() => ({
  'is-focused': focusState.invite,
  'is-filled': form.value.inviteCode.length > 0,
}))

// ─── 圆形倒计时 offset ────────────────────────────
// 圆环周长 = 2 * PI * 24 ≈ 150.79，取 151.9
const CIRCUMFERENCE = 151.9
const countdownOffset = computed(() => {
  if (countdown.value <= 0) return CIRCUMFERENCE
  const progress = countdown.value / 60
  return CIRCUMFERENCE * (1 - progress)
})

const canSubmit = computed(() => {
  return (
    form.value.phone.length === 11 &&
    form.value.code.length === 6 &&
    form.value.password.length >= 6
  )
})

// ─── Focus / Blur ─────────────────────────────────
function onFocus(field: 'phone' | 'code' | 'pwd' | 'invite') { focusState[field] = true }
function onBlur(field: 'phone' | 'code' | 'pwd' | 'invite') { focusState[field] = false }

function goLogin() { uni.redirectTo({ url: '/pages/auth/login' }) }

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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '发送失败'
    uni.showToast({ title: msg, icon: 'none' })
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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '注册失败'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    submitting.value = false
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.auth-page {
  width: 100vw;
  min-height: 100vh;
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

// ============================================
//  顶部导航栏
// ============================================
.auth-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(16rpx + env(safe-area-inset-top)) 44rpx 14rpx;
  background: $bg-primary;
  flex-shrink: 0;

  &__brand { display: flex; align-items: center; gap: 18rpx; }
  &__logo {
    @include logo-card;
    width: 68rpx;
    height: 68rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    &-img { width: 44rpx; height: 44rpx; display: block; }
  }
  &__text { display: flex; flex-direction: column; gap: 5rpx; }
  &__name {
    font-size: 30rpx;
    font-weight: 800;
    color: $mineral-gray;
    letter-spacing: 1.5rpx;
    line-height: 1;
  }
  &__slogan {
    font-size: 19rpx;
    color: $bronze-gold;
    font-weight: 400;
    letter-spacing: 0.6rpx;
    line-height: 1;
  }
  &__actions { flex-shrink: 0; }
}

.nav-link {
  font-size: 27rpx;
  color: $bronze-gold;
  font-weight: 600;
  padding: 8rpx 2rpx;
  letter-spacing: 0.5rpx;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 4rpx;
    left: 0;
    right: 0;
    height: 2rpx;
    background: $bronze-gold;
    border-radius: 2rpx;
    opacity: 0.5;
  }
}

// ============================================
//  品牌英雄区
// ============================================
.brand-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0 18rpx;
  position: relative;
  flex-shrink: 0;

  &__halo {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 320rpx;
    height: 200rpx;
    background: radial-gradient(ellipse at 50% 40%, rgba(184, 152, 118, 0.13) 0%, transparent 68%);
    pointer-events: none;
  }
  &__logo-card {
    @include logo-card;
    width: 148rpx;
    height: 148rpx;
    border-radius: 38rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    z-index: 2;
  }
  &__logo { width: 96rpx; height: 96rpx; display: block; }
  &__warm-glow {
    width: 220rpx;
    height: 56rpx;
    background: radial-gradient(ellipse at 50% 50%, rgba(184, 152, 118, 0.18) 0%, transparent 68%);
    margin-top: -8rpx;
    position: relative;
    z-index: 1;
  }
}

// ============================================
//  表单区域
// ============================================
.auth-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rpx 36rpx 0;
}

.auth-scroll {
  flex: 1;
  width: 100%;
  max-width: 620rpx;
  &::-webkit-scrollbar { display: none; width: 0; height: 0; }
}

.auth-card {
  width: 100%;
  @include auth-card;
  padding: 40rpx 44rpx 48rpx;

  &__head { margin-bottom: 36rpx; }
  &__title {
    display: block;
    font-size: 52rpx;
    font-weight: 800;
    color: $mineral-gray;
    letter-spacing: 0;
    margin-bottom: 12rpx;
    line-height: 1.1;
  }
  &__sub {
    display: block;
    font-size: 26rpx;
    color: $text-muted;
    font-weight: 400;
    line-height: 1.55;
  }
}

// ============================================
//  FL 浮动标签字段
// ============================================
.fl-field {
  position: relative;
  margin-bottom: 36rpx;

  // 金色 focus
  &.is-focused .fl-field__body {
    border-color: $auth-input-border-focus;
    box-shadow:
      inset 0 2rpx 8rpx rgba(47, 53, 66, 0.04),
      0 0 0 4rpx rgba(184, 152, 118, 0.14);
  }

  &__label-row {
    height: 36rpx;
    display: flex;
    align-items: center;
    margin-bottom: 8rpx;
  }

  &__label {
    font-size: $fl-label-size;
    color: $fl-label-color;
    font-weight: $fl-label-weight;
    transition:
      transform $fl-float-duration $fl-float-timing,
      font-size $fl-float-duration $fl-float-timing,
      color $fl-float-duration $fl-float-timing,
      opacity $fl-float-duration $fl-float-timing;

    &.is-float {
      transform: translateY(-44rpx) scale(0.82);
      font-size: $fl-label-size-float;
      color: $fl-label-color-focus;
      opacity: 0;
    }

    &--muted { color: rgba(92, 92, 92, 0.65); }
  }

  &__optional {
    font-size: 18rpx;
    color: $text-muted;
    font-weight: 400;
  }

  &__body {
    position: relative;
    height: 100rpx;
    background: $auth-input-bg;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1.5rpx solid $auth-input-border;
    border-radius: 24rpx;
    box-shadow: inset 0 2rpx 8rpx rgba(47, 53, 66, 0.04);
    transition: border-color 0.28s ease, box-shadow 0.28s ease;
    overflow: hidden;

    &--row {
      display: flex;
      align-items: center;
      gap: 0;
    }

    &--muted {
      background: rgba(255, 255, 255, 0.48);
      border-style: dashed;
    }
  }

  &__code-wrap {
    position: relative;
    flex: 1;
    height: 100%;
    overflow: hidden;
  }

  &__input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    border-radius: 0;
    font-size: 30rpx;
    font-weight: 500;
    color: $mineral-gray;
    padding: 48rpx 32rpx 0;
    box-sizing: border-box;
    z-index: 2;

    &:focus { outline: none; }
    &::placeholder { color: transparent; }
  }

  &__float-label {
    position: absolute;
    left: 32rpx;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    transition:
      opacity 0.18s ease,
      transform $fl-float-duration $fl-float-timing;

    &.is-active {
      opacity: 1;
      transform: translateY(-52rpx) scale(0.82);
    }
  }

  &__float-text {
    font-size: $fl-label-size;
    color: $bronze-gold;
    font-weight: $fl-label-weight;
    white-space: nowrap;
    letter-spacing: 0.5rpx;
  }

  &__eye {
    position: absolute;
    right: 8rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;

    &-svg {
      width: 36rpx;
      height: 36rpx;
      color: $text-muted;
      transition: color 0.2s ease;
      flex-shrink: 0;
    }
  }

  &--muted { opacity: 0.6; }
}

// ============================================
//  圆形倒计时
// ============================================
.countdown-ring {
  width: 100rpx;
  height: 100rpx;
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 12rpx;

  &__svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  &__track {
    stroke: rgba(47, 53, 66, 0.07);
  }

  &__fill {
    stroke: $bronze-gold;
    transition: stroke-dashoffset 0.95s linear;
  }

  &.is-counting &__fill {
    stroke: $bronze-dark;
  }

  &__inner {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__text {
    font-size: 20rpx;
    font-weight: 700;
    color: $bronze-gold;
    letter-spacing: 0.5rpx;
    line-height: 1;

    &--sending {
      font-size: 28rpx;
      color: $bronze-dark;
    }
  }

  &.is-counting &__text {
    color: $text-muted;
    font-weight: 600;
  }
}

// ============================================
//  协议勾选
// ============================================
.terms-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 32rpx;
  margin-top: 4rpx;
  cursor: pointer;
}

.check-square {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  border: 1.5rpx solid rgba(47, 53, 66, 0.15);
  background: rgba(255, 255, 255, 0.70);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  box-shadow: inset 0 2rpx 6rpx rgba(47, 53, 66, 0.04);
  flex-shrink: 0;

  &.is-checked {
    background: $bronze-gold;
    border-color: $bronze-gold;
    box-shadow: 0 4rpx 16rpx rgba(184, 152, 118, 0.30);
  }

  &__icon {
    font-size: 20rpx;
    color: #FFFFFF;
    font-weight: 700;
    line-height: 1;
  }
}

.terms-text {
  font-size: 23rpx;
  color: rgba(20, 20, 20, 0.42);
  line-height: 1.65;
  flex: 1;
  letter-spacing: 0.2rpx;
}

.terms-link {
  color: $bronze-gold;
  font-weight: 600;
  transition: opacity 0.2s;
  &:active { opacity: 0.6; }
}

// ============================================
//  提交按钮 ─ 流动加载
// ============================================
.btn-submit {
  height: 104rpx;
  border-radius: 52rpx;
  overflow: hidden;
  position: relative;

  &:active { transform: scale(0.984); }

  &.is-disabled {
    background: $btn-disabled-bg;
    box-shadow: none;
    pointer-events: none;
  }

  &.is-loading { opacity: 0.72; }

  &__inner,
  &__flow {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $btn-brand-gradient;
    border-radius: inherit;
    box-shadow: $btn-brand-shadow;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 55%);
      pointer-events: none;
    }
  }

  &__flow {
    background: $btn-brand-gradient;
  }

  &__flow-bar {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      -60deg,
      transparent 0%,
      rgba(212, 196, 174, 0.35) 15%,
      rgba(255, 255, 255, 0.55) 30%,
      rgba(212, 196, 174, 0.35) 45%,
      transparent 60%
    );
    background-size: 200% 100%;
    animation: btn-flow-load 1.4s linear infinite;
  }

  &__flow-text {
    position: relative;
    z-index: 1;
    font-size: 30rpx;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.92);
    letter-spacing: 4rpx;
  }

  &__text {
    font-size: 30rpx;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: 6rpx;
    position: relative;
    z-index: 1;
  }
}

@keyframes btn-flow-load {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
