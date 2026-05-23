<template>
  <view class="auth-page">

    <!-- 顶部导航栏 -->
    <view class="auth-nav">
      <view class="auth-nav__brand">
        <view class="auth-nav__logo">
          <image class="auth-nav__logo-img logo-image" src="/static/logo.png" mode="aspectFit" />
        </view>
        <view class="auth-nav__text">
          <text class="auth-nav__name">集享公社</text>
          <text class="auth-nav__slogan">集轻奢 · 享财富</text>
        </view>
      </view>
      <view class="ghost-btn" @click="goLogin">
        <text class="ghost-btn__text">登录</text>
      </view>
    </view>

    <!-- 表单区域 -->
    <view class="auth-body">
      <scroll-view scroll-y class="auth-scroll" :show-scrollbar="false">
        <view class="auth-card">

          <view class="auth-card__head">
            <view class="auth-card__title-wrap">
              <text class="auth-card__title">创建账号</text>
            </view>
            <text class="auth-card__sub">开启您的生态积分财富之旅</text>
          </view>

          <!-- 手机号 -->
          <view class="field-group">
            <view class="field-line" :class="{ 'is-focused': focusState.phone, 'has-value': form.phone }">
              <span class="field-line__fl">手机号</span>
              <input
                class="field-line__input"
                v-model="form.phone"
                inputmode="numeric"
                type="number"
                maxlength="11"
                placeholder=" "
                @focus="onFocus('phone')"
                @blur="onBlurPhone"
              />
            </view>
          </view>

          <!-- 验证码 -->
          <view class="field-group">
            <view class="field-line field-line--with-code" :class="{ 'is-focused': focusState.code, 'has-value': form.code }">
              <span class="field-line__fl">短信验证码</span>
              <input
                class="field-line__input"
                v-model="form.code"
                inputmode="numeric"
                type="number"
                maxlength="6"
                placeholder=" "
                @focus="onFocus('code')"
                @blur="onBlur('code')"
              />
              <view
                class="field-line__code-btn"
                :class="{ 'is-counting': countdown > 0 || sending }"
                @click="sendCode"
              >
                <text v-if="countdown === 0 && !sending">获取验证码</text>
                <text v-else-if="sending">发送中...</text>
                <text v-else>{{ countdown }}s</text>
              </view>
            </view>
          </view>

          <!-- 密码 -->
          <view class="field-group">
            <view class="field-line field-line--with-eye" :class="{ 'is-focused': focusState.pwd, 'has-value': form.password }">
              <span class="field-line__fl">登录密码</span>
              <input
                id="reg-pwd"
                class="field-line__input"
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                placeholder=" "
                @focus="onFocus('pwd')"
                @blur="onBlur('pwd')"
              />
              <view class="field-line__eye-wrap" @click="togglePwd">
                <svg v-if="showPwd" class="field-line__eye" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <svg v-else class="field-line__eye" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </view>
            </view>
          </view>

          <!-- 邀请码（弱化）-->
          <view class="field-group field-group--muted">
            <view class="field-line field-line--dashed" :class="{ 'is-focused': focusState.invite, 'has-value': form.inviteCode }">
              <span class="field-line__fl field-line__fl--muted">邀请码 <text class="field-line__opt">(选填)</text></span>
              <input
                class="field-line__input"
                v-model="form.inviteCode"
                placeholder=" "
                @focus="onFocus('invite')"
                @blur="onBlur('invite')"
              />
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

          <!-- 提交按钮 -->
          <view
            class="btn-submit"
            :class="{ 'is-disabled': !agreed || submitting || !canSubmit, 'is-loading': submitting }"
            @click="doRegister"
          >
            <view v-if="!submitting" class="btn-submit__inner">
              <view class="btn-submit__shimmer" />
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

const canSubmit = computed(() =>
  form.value.phone.length === 11 &&
  form.value.code.length === 6 &&
  form.value.password.length >= 6
)

function onFocus(field: 'phone' | 'code' | 'pwd' | 'invite') { focusState[field] = true }
function onBlur(field: 'phone' | 'code' | 'pwd' | 'invite') { focusState[field] = false }

function onBlurPhone() {
  focusState.phone = false
}

function togglePwd() {
  const el = document.getElementById('reg-pwd') as HTMLInputElement | null
  if (!el) { showPwd.value = !showPwd.value; return }
  const pos = el.selectionStart ?? form.value.password.length
  showPwd.value = !showPwd.value
  setTimeout(() => { el.setSelectionRange(pos, pos) }, 0)
}

function goLogin() {
  uni.redirectTo({ url: '/pages/auth/login', animationType: 'slide-in-left', animationDuration: 300 })
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
  width: 100%;
  min-height: 100dvh;
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow-x: hidden;
  position: relative;
  will-change: transform;
}

.auth-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(14rpx + env(safe-area-inset-top)) 32rpx 14rpx;
  background: $bg-primary;
  flex-shrink: 0;
  position: relative;
  z-index: 2;

  &__brand { display: flex; align-items: center; gap: 16rpx; }

  &__logo {
    width: 64rpx;
    height: 64rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $bg-secondary;
    box-shadow: 0 4rpx 20rpx rgba(184, 152, 118, 0.18), 0 1rpx 4rpx rgba(0, 0, 0, 0.04);
    flex-shrink: 0;

    &-img { width: 40rpx; height: 40rpx; object-fit: contain; display: block; }
  }

  &__text { display: flex; flex-direction: column; gap: 5rpx; }
  &__name {
    font-size: 28rpx;
    font-weight: 800;
    color: $mineral-gray;
    letter-spacing: 1.2rpx;
    line-height: 1;
  }
  &__slogan {
    font-size: 18rpx;
    color: #D4B483;
    font-weight: 400;
    letter-spacing: 0.5rpx;
    line-height: 1;
  }
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 56rpx;
  padding: 0 4rpx;
  cursor: pointer;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 6rpx;
    left: 0;
    right: 0;
    height: 1.5rpx;
    background: repeating-linear-gradient(
      90deg,
      rgba(212, 180, 131, 0.5) 0rpx,
      rgba(212, 180, 131, 0.5) 6rpx,
      transparent 6rpx,
      transparent 12rpx
    );
    border-radius: 1rpx;
  }

  &:active { opacity: 0.55; }

  &__text {
    font-size: 26rpx;
    color: #D4B483;
    font-weight: 500;
    letter-spacing: 1rpx;
    line-height: 1;
  }
}

.auth-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5dvh 40rpx 0;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.auth-scroll {
  flex: 1;
  width: 100%;
  max-width: 620rpx;
  &::-webkit-scrollbar { display: none; width: 0; height: 0; }
}

.auth-card {
  width: 100%;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1rpx solid rgba(212, 180, 131, 0.15);
  border-radius: 40rpx;
  box-shadow:
    0 8rpx 32rpx rgba(47, 53, 66, 0.06),
    0 32rpx 120rpx rgba(47, 53, 66, 0.08),
    0 80rpx 200rpx rgba(47, 53, 66, 0.05);
  padding: 48rpx 44rpx 48rpx;

  &__head { margin-bottom: 44rpx; }

  &__title-wrap {
    display: flex;
    align-items: flex-end;
    margin-bottom: 10rpx;
  }

  &__title {
    display: block;
    font-size: 52rpx;
    font-weight: 600;
    color: $mineral-gray;
    letter-spacing: 3rpx;
    line-height: 1.1;
  }

  &__sub {
    display: block;
    font-size: 26rpx;
    color: #888888;
    font-weight: 400;
    line-height: 1.5;
  }
}

.field-group {
  margin-bottom: 44rpx;

  &--muted {
    opacity: 0.6;
    .field-line__fl { color: rgba(138, 138, 138, 0.75) !important; }
  }

  &__label-row {
    height: 32rpx;
    display: flex;
    align-items: center;
    margin-bottom: 10rpx;
  }

  &__label {
    font-size: 22rpx;
    color: $text-secondary;
    font-weight: 500;
    letter-spacing: 0.5rpx;
  }
}

.field-line {
  position: relative;
  height: 96rpx;
  display: flex;
  align-items: flex-end;
  border-bottom: 1.5rpx solid rgba(47, 53, 66, 0.12);
  overflow: visible;
  transition: border-color 0.25s ease;

  &.is-focused { border-bottom-color: #D4B483; }

  &--with-code { padding-right: 156rpx; }
  &--with-eye { padding-right: 72rpx; }

  &--dashed {
    border-bottom-style: dashed;
    border-bottom-color: rgba(142, 116, 89, 0.22);
  }

  &__fl {
    position: absolute;
    left: 0;
    bottom: 14rpx;
    font-size: 28rpx;
    color: $text-muted;
    font-weight: 400;
    transform-origin: left bottom;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    z-index: 1;
  }

  &.has-value &__fl,
  &.is-focused &__fl {
    font-size: 18rpx;
    color: #D4B483;
    font-weight: 600;
    letter-spacing: 0.5rpx;
    transform: translateY(-40rpx) scale(0.85);
  }

  &__fl--muted { color: rgba(138, 138, 138, 0.75) !important; }

  &__opt {
    font-size: 18rpx;
    font-weight: 400;
    color: #888888;
  }

  &__input {
    flex: 1;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-size: 32rpx;
    font-weight: 500;
    color: #333333;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.5rpx;
    padding: 0;
    box-sizing: border-box;
    padding-bottom: 8rpx;

    &::placeholder {
      font-size: 26rpx;
      color: #AAAAAA;
      font-weight: 400;
    }
  }

  &__code-btn {
    position: absolute;
    right: 0;
    bottom: 14rpx;
    height: 52rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: transparent;
    transition: opacity 0.2s ease;

    text {
      font-size: 24rpx;
      color: #D4B483;
      font-weight: 600;
      letter-spacing: 0.3rpx;
      line-height: 1;
      white-space: nowrap;
    }

    &.is-counting text { color: $text-muted; font-weight: 400; }
    &:active { opacity: 0.55; }
  }

  &__eye-wrap {
    position: absolute;
    right: 0;
    bottom: 8rpx;
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2;
  }

  &__eye {
    width: 36rpx;
    height: 36rpx;
    color: $text-muted;
    object-fit: contain;
    flex-shrink: 0;
    transition: color 0.2s ease;

    &:active { color: #D4B483; }
  }
}

.terms-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 8rpx;
  cursor: pointer;
}

.check-square {
  width: 44rpx;
  height: 44rpx;
  border-radius: 12rpx;
  border: 1.5rpx solid rgba(212, 180, 131, 0.45);
  background: rgba(255, 255, 255, 0.60);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  flex-shrink: 0;
  box-sizing: border-box;

  &.is-checked {
    background: rgba(212, 180, 131, 0.12);
    border-color: #D4B483;
    box-shadow: 0 0 0 3rpx rgba(212, 180, 131, 0.10);
  }

  &__icon {
    font-size: 22rpx;
    color: #D4B483;
    font-weight: 700;
    line-height: 1;
  }
}

.terms-text {
  font-size: 22rpx;
  color: rgba(20, 20, 20, 0.50);
  line-height: 1.5;
}

.terms-link {
  color: #D4B483;
  font-weight: 500;
}

.btn-submit {
  height: 100rpx;
  border-radius: 50rpx;
  overflow: hidden;
  position: relative;
  margin-top: 8rpx;

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
    background: $btn-gold-gradient;
    border-radius: inherit;
    box-shadow: $btn-gold-shadow;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 50%);
      pointer-events: none;
    }
  }

  &__shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 20%,
      rgba(255, 255, 255, 0.55) 40%,
      rgba(255, 255, 255, 0.75) 50%,
      rgba(255, 255, 255, 0.55) 60%,
      transparent 80%
    );
    background-size: 200% 100%;
    animation: btn-shimmer 4s ease-in-out infinite;
  }

  &__flow { background: $btn-gold-gradient; }

  &__flow-bar {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      -60deg,
      transparent 0%,
      rgba(212, 196, 174, 0.40) 15%,
      rgba(255, 255, 255, 0.60) 30%,
      rgba(212, 196, 174, 0.40) 45%,
      transparent 60%
    );
    background-size: 200% 100%;
    animation: btn-flow-load 1.4s linear infinite;
  }

  &__flow-text {
    position: relative;
    z-index: 1;
    font-size: 28rpx;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.92);
    letter-spacing: 4rpx;
  }

  &__text {
    font-size: 28rpx;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: 6rpx;
    position: relative;
    z-index: 1;
  }
}

@keyframes btn-shimmer {
  0%   { background-position: -200% 0; }
  60%  { background-position: 150% 0; }
  100% { background-position: 150% 0; }
}

@keyframes btn-flow-load {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>