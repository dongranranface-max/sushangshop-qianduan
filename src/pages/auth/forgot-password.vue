<template>
  <view class="auth-page">

    <!-- 顶部进度线 -->
    <view class="progress-line">
      <view class="progress-line__fill" :style="{ width: step === 1 ? '50%' : '100%' }" />
    </view>

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
      <view class="auth-card">

        <!-- ========== Step 1 ========== -->
        <template v-if="step === 1">
          <view class="auth-card__head">
            <view class="auth-card__title-wrap">
              <text class="auth-card__title">短信验证</text>
            </view>
            <text class="auth-card__sub">验证注册手机号后设置新密码</text>
          </view>

          <!-- 步骤指示器 -->
          <view class="step-bar">
            <view class="step-item is-active">
              <view class="step-item__dot"><text class="step-item__num">1</text></view>
              <text class="step-item__label">验证手机</text>
            </view>
            <view class="step-connector" :class="{ 'is-done': step > 1 }" />
            <view class="step-item" :class="{ 'is-active': step > 1 }">
              <view class="step-item__dot"><text class="step-item__num">2</text></view>
              <text class="step-item__label">设置密码</text>
            </view>
          </view>

          <!-- 手机号 -->
          <view class="field-group">
            <view class="field-line" :class="{ 'is-focused': focusState.phone, 'has-value': form.phone }">
              <span class="field-line__fl">注册手机号</span>
              <input
                class="field-line__input"
                v-model="form.phone"
                inputmode="numeric"
                type="number"
                maxlength="11"
                placeholder=" "
                @focus="onFocus('phone')"
                @blur="onBlur('phone')"
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

          <!-- 提交按钮 -->
          <view
            class="btn-submit"
            :class="{ 'is-disabled': !canGoStep2, 'is-loading': submitting }"
            @click="goStep2"
          >
            <view v-if="!submitting" class="btn-submit__inner">
              <view class="btn-submit__shimmer" />
              <text class="btn-submit__text">下一步</text>
            </view>
            <view v-else class="btn-submit__flow">
              <view class="btn-submit__flow-bar" />
              <text class="btn-submit__flow-text">验证中...</text>
            </view>
          </view>
        </template>

        <!-- ========== Step 2 ========== -->
        <template v-else>
          <view class="auth-card__head">
            <view class="auth-card__title-wrap">
              <text class="auth-card__title">设置新密码</text>
            </view>
            <text class="auth-card__sub">
              已为 <text class="phone-marked">{{ maskedPhone }}</text> 验证通过
            </text>
          </view>

          <view class="step-bar">
            <view class="step-item is-done">
              <view class="step-item__dot"><text class="step-item__icon">✓</text></view>
              <text class="step-item__label">验证手机</text>
            </view>
            <view class="step-connector is-active" />
            <view class="step-item is-active">
              <view class="step-item__dot"><text class="step-item__num">2</text></view>
              <text class="step-item__label">设置密码</text>
            </view>
          </view>

          <!-- 新密码 -->
          <view class="field-group">
            <view class="field-line field-line--with-eye" :class="{ 'is-focused': focusState.pwd, 'has-value': form.password }">
              <span class="field-line__fl">新密码</span>
              <input
                class="field-line__input"
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                placeholder=" "
                @focus="onFocus('pwd')"
                @blur="onBlur('pwd')"
                @input="onPwdInput"
              />
              <view class="field-line__eye-wrap" @click="showPwd = !showPwd">
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
            <view v-if="form.password" class="pwd-strength">
              <view class="pwd-track">
                <view class="pwd-fill" :class="`pwd-fill--${pwdLevel}`" :style="{ width: pwdPercent + '%' }" />
              </view>
              <text class="pwd-hint">{{ pwdHint }}</text>
            </view>
          </view>

          <!-- 确认密码 -->
          <view class="field-group">
            <view class="field-line field-line--with-eye" :class="{ 'is-focused': focusState.confirm, 'has-value': form.confirm }">
              <span class="field-line__fl">确认新密码</span>
              <input
                class="field-line__input"
                v-model="form.confirm"
                :type="showConfirm ? 'text' : 'password'"
                placeholder=" "
                @focus="onFocus('confirm')"
                @blur="onBlur('confirm')"
              />
              <view class="field-line__eye-wrap" @click="showConfirm = !showConfirm">
                <svg v-if="showConfirm" class="field-line__eye" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <svg v-else class="field-line__eye" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </view>
            </view>
            <text v-if="confirmDirty && form.confirm !== form.password" class="confirm-error">
              两次密码不一致，请检查
            </text>
          </view>

          <!-- 提交按钮 -->
          <view
            class="btn-submit"
            :class="{ 'is-disabled': !canSubmit || submitting, 'is-loading': submitting }"
            @click="doReset"
          >
            <view v-if="!submitting" class="btn-submit__inner">
              <view class="btn-submit__shimmer" />
              <text class="btn-submit__text">确认重置</text>
            </view>
            <view v-else class="btn-submit__flow">
              <view class="btn-submit__flow-bar" />
              <text class="btn-submit__flow-text">提交中...</text>
            </view>
          </view>

          <!-- 返回上一步 -->
          <view class="back-step" @click="step = 1">
            <text class="back-step__link">← 返回上一步</text>
          </view>
        </template>

      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { authApi } from '@/utils/api'

const step = ref(1)
const submitting = ref(false)
const sending = ref(false)
const showPwd = ref(false)
const showConfirm = ref(false)
const countdown = ref(0)
const confirmDirty = ref(false)
const pwdLevel = ref(0)
const pwdPercent = ref(0)
const pwdHint = ref('')
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

const maskedPhone = computed(() => {
  const p = form.value.phone
  return p.length === 11 ? `${p.slice(0, 3)}****${p.slice(7)}` : p
})

const canGoStep2 = computed(() =>
  /^1\d{10}$/.test(form.value.phone) && /^\d{6}$/.test(form.value.code)
)

const canSubmit = computed(() =>
  form.value.password.length > 0 && form.value.confirm === form.value.password
)

function onFocus(field: 'phone' | 'code' | 'pwd' | 'confirm') { focusState[field] = true }
function onBlur(field: 'phone' | 'code' | 'pwd' | 'confirm') { focusState[field] = false }

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

function goStep2() {
  if (!canGoStep2.value) return uni.showToast({ title: '请完成手机号与验证码', icon: 'none' })
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
    await authApi.resetPassword(form.value.phone, form.value.code.trim(), form.value.password)
    uni.showToast({ title: '密码已重置', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: '/pages/auth/login' }), 1200)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '重置失败'
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

.progress-line {
  position: fixed;
  top: env(safe-area-inset-top);
  left: 0;
  right: 0;
  z-index: 20;
  height: 3rpx;

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, #D4B483 0%, #C4A870 100%);
    border-radius: 0 2rpx 2rpx 0;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
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
    color: $bronze-gold;
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
      rgba(184, 152, 118, 0.5) 0rpx,
      rgba(184, 152, 118, 0.5) 6rpx,
      transparent 6rpx,
      transparent 12rpx
    );
    border-radius: 1rpx;
  }

  &:active { opacity: 0.55; }

  &__text {
    font-size: 26rpx;
    color: $bronze-gold;
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

.auth-card {
  width: 100%;
  max-width: 600rpx;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1rpx solid rgba(212, 180, 131, 0.12);
  border-radius: 40rpx;
  box-shadow:
    0 4rpx 20rpx rgba(47, 53, 66, 0.05),
    0 24rpx 80rpx rgba(47, 53, 66, 0.08),
    0 64rpx 160rpx rgba(47, 53, 66, 0.06);
  padding: 48rpx 44rpx;

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
    letter-spacing: 2rpx;
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

.phone-marked {
  color: #D4B483;
  font-weight: 600;
}

.step-bar {
  display: flex;
  align-items: center;
  margin-bottom: 44rpx;
  padding: 0 12rpx;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;

  &__dot {
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    background: rgba(47, 53, 66, 0.06);
    border: 1.5rpx solid rgba(47, 53, 66, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s ease;
  }

  &__num {
    font-size: 22rpx;
    font-weight: 700;
    color: $text-muted;
    line-height: 1;
    transition: color 0.4s;
  }

  &__icon {
    font-size: 20rpx;
    font-weight: 700;
    color: $success;
    line-height: 1;
  }

  &__label {
    font-size: 22rpx;
    color: $text-muted;
    font-weight: 400;
    white-space: nowrap;
    transition: color 0.3s;
  }

  &.is-active {
    .step-item__dot {
      background: rgba(212, 180, 131, 0.10);
      border-color: #D4B483;
      box-shadow: 0 0 0 5rpx rgba(212, 180, 131, 0.12);
    }
    .step-item__num { color: #D4B483; }
    .step-item__label { color: $mineral-gray; font-weight: 500; }
  }

  &.is-done {
    .step-item__dot {
      background: rgba(90, 122, 106, 0.10);
      border-color: $success;
    }
    .step-item__label { color: $success; }
  }
}

.step-connector {
  flex: 1;
  height: 2rpx;
  background: rgba(47, 53, 66, 0.08);
  margin: 0 16rpx;
  border-radius: 2rpx;
  transition: background 0.4s ease;

  &.is-active { background: #D4B483; }
  &.is-done { background: $success; }
}

.field-group {
  margin-bottom: 40rpx;

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

  &__input {
    flex: 1;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-size: 32rpx;
    font-weight: 500;
    color: #333333;
    padding: 0;
    box-sizing: border-box;
    padding-bottom: 8rpx;

    &::placeholder {
      font-size: 26rpx;
      color: #BBBBBB;
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

.pwd-strength {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 12rpx;
}

.pwd-track {
  flex: 1;
  height: 6rpx;
  background: rgba(47, 53, 66, 0.06);
  border-radius: 3rpx;
  overflow: hidden;
}

.pwd-fill {
  height: 100%;
  border-radius: 3rpx;
  transition: width 0.3s ease, background 0.3s ease;
  &--1 { background: $warning; }
  &--2 { background: $primary; }
  &--3 { background: $success; }
}

.pwd-hint {
  font-size: 20rpx;
  color: $text-muted;
  flex-shrink: 0;
}

.confirm-error {
  display: block;
  font-size: 22rpx;
  color: $danger;
  margin-top: 10rpx;
}

.btn-submit {
  height: 100rpx;
  border-radius: 50rpx;
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
    background: $btn-gold-gradient;
    border-radius: inherit;
    box-shadow: $btn-gold-shadow;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%);
      pointer-events: none;
    }
  }

  &__shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 20%,
      rgba(255, 255, 255, 0.50) 40%,
      rgba(255, 255, 255, 0.70) 50%,
      rgba(255, 255, 255, 0.50) 60%,
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
    font-size: 28rpx;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.92);
    letter-spacing: 4rpx;
  }

  &__text {
    font-size: 28rpx;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: 4rpx;
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

.back-step {
  margin-top: 24rpx;
  display: flex;
  justify-content: center;

  &__link {
    font-size: 24rpx;
    color: $text-muted;
    font-weight: 500;
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
    transition: color 0.2s, background 0.2s;
    letter-spacing: 0.3rpx;

    &:active {
      color: $mineral-gray;
      background: rgba(47, 53, 66, 0.05);
    }
  }
}
</style>