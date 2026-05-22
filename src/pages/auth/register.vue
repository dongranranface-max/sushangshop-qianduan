<template>
  <view class="auth-page">

    <!-- ============================================
      页面顶部品牌栏
    ============================================ -->
    <view class="auth-header">
      <view class="auth-header__brand">
        <view class="auth-header__logo">
          <image class="auth-header__logo-img" src="/static/logo.png" mode="aspectFit" />
        </view>
        <view class="auth-header__name-group">
          <text class="auth-header__name">集享公社</text>
          <text class="auth-header__slogan">集轻奢·享财富</text>
        </view>
      </view>
      <view class="auth-header__nav">
        <text class="auth-header__nav-link" @click="goLogin">登录</text>
      </view>
    </view>

    <!-- ============================================
      表单卡片区
    ============================================ -->
    <view class="auth-body">
      <view class="auth-card">

        <!-- 标题组 -->
        <view class="auth-card__head">
          <text class="auth-card__title">创建账号</text>
          <text class="auth-card__sub">开启您的生态积分之旅</text>
        </view>

        <!-- 分隔线 -->
        <view class="auth-divider" />

        <!-- 手机号 -->
        <view class="field-group">
          <text class="field-label">手机号</text>
          <view
            class="field"
            :class="{ 'is-focused': focusState.phone, 'is-filled': form.phone.length === 11 }"
          >
            <input
              class="field__input"
              v-model="form.phone"
              type="number"
              maxlength="11"
              placeholder="请输入手机号"
              placeholder-class="field__placeholder"
              @focus="focusState.phone = true"
              @blur="focusState.phone = false"
            />
            <view class="field__line" />
          </view>
        </view>

        <!-- 验证码 -->
        <view class="field-group">
          <text class="field-label">短信验证码</text>
          <view
            class="field"
            :class="{ 'is-focused': focusState.code, 'is-filled': form.code.length === 6 }"
          >
            <input
              class="field__input"
              v-model="form.code"
              type="number"
              maxlength="6"
              placeholder="请输入6位验证码"
              placeholder-class="field__placeholder"
              @focus="focusState.code = true"
              @blur="focusState.code = false"
            />
            <view class="field__line" />
          </view>
          <!-- 验证码按钮：独立成行 -->
          <view class="code-btn-row">
            <view
              class="code-btn"
              :class="{ 'is-counting': countdown > 0 || sending }"
              @click="sendCode"
            >
              <text>{{ codeBtnText }}</text>
            </view>
          </view>
        </view>

        <!-- 密码 -->
        <view class="field-group">
          <text class="field-label">设置密码</text>
          <view
            class="field"
            :class="{ 'is-focused': focusState.pwd, 'is-filled': form.password.length >= 6 }"
          >
            <input
              class="field__input"
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="6位以上，数字与字母组合"
              placeholder-class="field__placeholder"
              @focus="focusState.pwd = true"
              @blur="focusState.pwd = false"
            />
            <view class="field__line" />
            <view class="field__eye" @click="showPwd = !showPwd">
              <text class="field__eye-icon">{{ showPwd ? '⊙' : '◉' }}</text>
            </view>
          </view>
        </view>

        <!-- 邀请码（必填）-->
        <view class="field-group">
          <text class="field-label">邀请码 <text class="field-label__required">必填</text></text>
          <view
            class="field field--muted"
            :class="{ 'is-focused': focusState.invite, 'is-filled': form.inviteCode.length > 0 }"
          >
            <input
              class="field__input"
              v-model="form.inviteCode"
              placeholder="请输入邀请码"
              placeholder-class="field__placeholder"
              @focus="focusState.invite = true"
              @blur="focusState.invite = false"
            />
            <view class="field__line" />
          </view>
        </view>

        <!-- 协议勾选 -->
        <view class="terms-row">
          <view class="terms-check" @click="agreed = !agreed">
            <view class="check-square" :class="{ 'is-checked': agreed }">
              <text v-if="agreed" class="check-square__icon">✓</text>
            </view>
          </view>
          <text class="terms-text">
            我已阅读并同意
            <text class="terms-link">《用户协议》</text>
            和
            <text class="terms-link">《隐私政策》</text>
          </text>
        </view>

        <!-- 提交按钮 -->
        <view
          class="btn-submit"
          :class="{ 'is-disabled': !agreed || submitting, 'is-loading': submitting }"
          @click="doRegister"
        >
          <view v-if="!submitting" class="btn-submit__inner">
            <text class="btn-submit__text">注册</text>
          </view>
          <view v-else class="btn-submit__loading">
            <view class="btn-submit__spinner" />
            <text class="btn-submit__loading-text">注册中...</text>
          </view>
        </view>

      </view>
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
  if (!form.value.inviteCode) {
    return uni.showToast({ title: '请输入邀请码', icon: 'none' })
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

.auth-page {
  width: 100vw;
  min-height: 100vh;
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

// ============================================
//  顶部品牌栏
// ============================================
.auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(16rpx + env(safe-area-inset-top)) 40rpx 20rpx;
  background: $bg-primary;
  flex-shrink: 0;

  &__brand {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  &__logo {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    background: $mineral-gray;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;

    &-img {
      width: 56rpx;
      height: 56rpx;
      display: block;
    }
  }

  &__name-group {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__name {
    font-size: 32rpx;
    font-weight: 700;
    color: $mineral-gray;
    letter-spacing: 1rpx;
    line-height: 1;
  }

  &__slogan {
    font-size: 20rpx;
    color: $mineral-blue;
    letter-spacing: 0.5rpx;
    line-height: 1;
  }

  &__nav { flex-shrink: 0; }

  &__nav-link {
    font-size: 28rpx;
    color: $accent-dark;
    font-weight: 600;
    padding: 8rpx 4rpx;
  }
}

// ============================================
//  内容区
// ============================================
.auth-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 32rpx 40rpx;
}

.auth-card {
  width: 100%;
  max-width: 580rpx;
  background: $bg-secondary;
  border-radius: $radius-xl;
  padding: 48rpx 40rpx;
  box-shadow: 0 4rpx 32rpx rgba(47, 53, 66, 0.06), 0 1rpx 4rpx rgba(0, 0, 0, 0.03);
  border: 1rpx solid rgba(20, 20, 20, 0.05);

  &__head { margin-bottom: 36rpx; }

  &__title {
    display: block;
    font-size: 48rpx;
    font-weight: 700;
    color: $mineral-gray;
    letter-spacing: 0;
    margin-bottom: 10rpx;
    line-height: 1.1;
  }

  &__sub {
    display: block;
    font-size: 26rpx;
    color: $text-muted;
    font-weight: 400;
    line-height: 1.4;
  }
}

.auth-divider {
  height: 1rpx;
  background: linear-gradient(90deg, rgba(184, 152, 118, 0.3) 0%, rgba(184, 152, 118, 0.08) 80%, transparent 100%);
  margin-bottom: 36rpx;
}

// ============================================
//  字段组
// ============================================
.field-group {
  margin-bottom: 28rpx;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: $text-secondary;
  font-weight: 500;
  margin-bottom: 10rpx;
  letter-spacing: 0.5rpx;

  &__required {
    font-size: 20rpx;
    color: $accent-dark;
    font-weight: 400;
  }
}

.field {
  position: relative;

  &__input {
    width: 100%;
    height: 84rpx;
    background: transparent;
    border: none;
    border-radius: 0;
    font-size: 30rpx;
    font-weight: 500;
    color: $mineral-gray;
    padding: 0 8rpx;
    box-sizing: border-box;

    &::placeholder { color: $text-muted; font-weight: 400; }
    &:focus { outline: none; background: transparent; }
  }

  &__line {
    position: absolute;
    bottom: 0;
    left: 8rpx;
    right: 8rpx;
    height: 2rpx;
    background: linear-gradient(90deg, $accent-dark 0%, $bronze-light 50%, $accent-dark 100%);
    border-radius: 2rpx;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.35s ease;

    .is-focused & { transform: scaleX(1); }
    .is-filled & { transform: scaleX(1); }
  }

  &__eye {
    position: absolute;
    right: 8rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    &-icon {
      font-size: 32rpx;
      color: $text-muted;
      line-height: 1;
    }
  }

  // 邀请码弱化
  &--muted {
    .field__input {
      font-size: 28rpx;
      color: $text-muted;
      &::placeholder { color: rgba(112, 123, 140, 0.5); }
    }
    .field__line {
      height: 1rpx;
      opacity: 0.5;
    }
  }
}

// ============================================
//  验证码按钮（独立成行）
// ============================================
.code-btn-row {
  margin-top: 16rpx;
  display: flex;
}

.code-btn {
  height: 64rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.5rpx solid $accent-dark;
  border-radius: 32rpx;
  font-size: 24rpx;
  color: $accent-dark;
  font-weight: 600;
  letter-spacing: 0.5rpx;
  transition: all 0.3s ease;

  &:active {
    background: rgba(142, 116, 89, 0.08);
    transform: scale(0.98);
  }

  &.is-counting {
    color: $text-muted;
    border-color: rgba(20, 20, 20, 0.12);
  }
}

// ============================================
//  协议勾选
// ============================================
.terms-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  margin-bottom: 32rpx;
}

.terms-check { flex-shrink: 0; padding-top: 2rpx; }

.check-square {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  border: 2rpx solid rgba(20, 20, 20, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;

  &.is-checked {
    background: $accent-dark;
    border-color: $accent-dark;
  }

  &__icon {
    font-size: 20rpx;
    color: #FFFFFF;
    font-weight: 700;
    line-height: 1;
  }
}

.terms-text {
  font-size: 24rpx;
  color: $text-muted;
  line-height: 1.6;
  flex: 1;
}

.terms-link {
  color: $accent-dark;
  font-weight: 600;
}

// ============================================
//  提交按钮
// ============================================
.btn-submit {
  height: 96rpx;
  border-radius: 48rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 8rpx 32rpx rgba(47, 53, 66, 0.18);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:active {
    transform: scale(0.985);
    box-shadow: 0 4rpx 16rpx rgba(47, 53, 66, 0.12);
  }

  &.is-disabled {
    opacity: 0.45;
    pointer-events: none;
  }

  &.is-loading { opacity: 0.75; }

  &__inner,
  &__loading {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $mineral-gray;
    border-radius: inherit;
  }

  &__text {
    font-size: 30rpx;
    font-weight: 700;
    color: $text-inverse;
    letter-spacing: 6rpx;
  }

  &__spinner {
    width: 32rpx;
    height: 32rpx;
    border: 3rpx solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 12rpx;
  }

  &__loading-text {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 2rpx;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>