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
        <text class="nav-link" @click="goRegister">注册账号</text>
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
      <view class="auth-card">

        <!-- 标题 -->
        <view class="auth-card__head">
          <text class="auth-card__title">欢迎回来</text>
          <text class="auth-card__sub">请输入您的账号信息登录</text>
        </view>

        <!-- 手机号 ─ FL 浮动标签 -->
        <view class="fl-field" :class="phoneFieldClass">
          <view class="fl-field__label-row">
            <text class="fl-field__label" :class="{ 'is-float': phoneFloatState }">
              手机号
            </text>
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
            <!-- FL 占位动画层 -->
            <view class="fl-field__float-label" :class="{ 'is-active': phoneFloatState }">
              <text class="fl-field__float-text">手机号</text>
            </view>
          </view>
        </view>

        <!-- 密码 ─ FL 浮动标签 -->
        <view class="fl-field" :class="pwdFieldClass">
          <view class="fl-field__label-row">
            <text class="fl-field__label" :class="{ 'is-float': pwdFloatState }">
              登录密码
            </text>
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
              <text class="fl-field__float-text">登录密码</text>
            </view>
            <!-- 密码显示切换 -->
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

        <!-- 忘记密码 -->
        <view class="forget-row">
          <text class="forget-link" @click="goForgot">忘记密码？</text>
        </view>

        <!-- 提交按钮 ─ 流动加载 -->
        <view
          class="btn-submit"
          :class="{ 'is-loading': submitting }"
          @click="doLogin"
        >
          <view v-if="!submitting" class="btn-submit__inner">
            <text class="btn-submit__text">登 录</text>
          </view>
          <!-- 流动加载态 -->
          <view v-else class="btn-submit__flow">
            <view class="btn-submit__flow-bar" />
            <text class="btn-submit__flow-text">登录中...</text>
          </view>
        </view>

        <!-- 分割线 -->
        <view class="divider-row">
          <view class="divider" />
          <text class="divider__text">其他登录方式</text>
          <view class="divider" />
        </view>

        <!-- 第三方登录 -->
        <view class="third-party">
          <view class="third-party__item" @click="thirdPartyLogin('wechat')">
            <view class="third-party__icon">
              <svg class="third-party__svg" viewBox="0 0 24 24" fill="none">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.667c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 6.847c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.108.24-.243 0-.06-.022-.12-.038-.173l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.59a5.794 5.794 0 0 0-.406-.056zm-1.834 2.994c.536 0 .97.44.97.983a.976.976 0 0 1-.97.983.976.976 0 0 1-.97-.983c0-.542.434-.983.97-.983zm4.857 0c.536 0 .97.44.97.983a.976.976 0 0 1-.97.983.976.976 0 0 1-.97-.983c0-.542.434-.983.97-.983z" fill="#07C160"/>
              </svg>
            </view>
            <text class="third-party__label">微信</text>
          </view>
          <view class="third-party__item" @click="thirdPartyLogin('alipay')">
            <view class="third-party__icon">
              <svg class="third-party__svg" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.03 2 11c0 2.76 1.36 5.22 3.49 6.87L4.23 21.5a.5.5 0 0 0 .61.61l3.63-1.26C9.78 21.72 10.86 22 12 22c5.52 0 10-4.03 10-9S17.52 2 12 2zm.32 13.49c-.47.2-.98.32-1.52.32-.38 0-.75-.06-1.1-.16L9.5 16H8.4c-.6 0-1.1-.4-1.25-.96l-.5-1.9-1.6-6.1A7.94 7.94 0 0 1 12 4.5c.38 0 .75.04 1.1.1l2.2 8.35c.11.43.5.73.95.73h1.1c.42 0 .8-.25.96-.64l.52-1.33a8.02 8.02 0 0 1-.05-.28z" fill="#1677FF"/>
              </svg>
            </view>
            <text class="third-party__label">支付宝</text>
          </view>
          <view class="third-party__item" @click="thirdPartyLogin('apple')">
            <view class="third-party__icon">
              <svg class="third-party__svg" viewBox="0 0 24 24" fill="none">
                <path d="M17.05 12.54c-.02-1.52 1.23-2.27 1.29-2.3-.7-1.03-1.8-1.17-2.18-1.19-1.03-.1-2 .6-2.52.6-.54 0-1.37-.58-2.26-.56C10.5 8.77 7.89 10.6 7.89 14.18c0 4.37 3.55 6.73 8.68 6.73 4.1 0 6.9-2.6 6.9-6.4-.08-.88-1.03-2.21-2.52-2.97zM14.82 4.36c.9-1.12 1.5-2.67 1.33-4.22-1.29.05-2.85.86-3.77 1.96-.8.93-1.5 2.42-1.32 3.84 1.45.11 2.94-.82 3.76-1.58z" fill="currentColor"/>
              </svg>
            </view>
            <text class="third-party__label">Apple</text>
          </view>
        </view>

        <!-- 底部协议 -->
        <view class="auth-footer">
          <text class="auth-footer__text">
            登录即表示同意
            <text class="auth-footer__link">《用户协议》</text>
            和
            <text class="auth-footer__link">《隐私政策》</text>
          </text>
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
const showPwd = ref(false)

const focusState = reactive({ phone: false, pwd: false })

const form = ref({
  phone: '',
  password: '',
})

// #ifdef MP-WEIXIN
const app = getApp()
statusBarHeight.value = app.globalData?.statusBarHeight || 20
// #endif
// #ifdef H5
statusBarHeight.value = (uni as any).getSystemInfoSync()?.statusBarHeight || 20
// #endif

const token = uni.getStorageSync('token')
if (token) {
  setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 100)
}

// ─── FL 浮动状态 ───────────────────────────────────
const phoneFloatState = computed(() =>
  focusState.phone || form.value.phone.length > 0
)
const pwdFloatState = computed(() =>
  focusState.pwd || form.value.password.length > 0
)

// ─── 字段 class computed（规避模板中 >= 被 SFC 解析误判）───
const phoneFieldClass = computed(() => ({
  'is-focused': focusState.phone,
  'is-filled': form.value.phone.length > 0,
}))
const pwdFieldClass = computed(() => ({
  'is-focused': focusState.pwd,
  'is-filled': form.value.password.length > 0,
}))

// ─── Focus / Blur ──────────────────────────────────
function onFocus(field: 'phone' | 'pwd') { focusState[field] = true }
function onBlur(field: 'phone' | 'pwd') { focusState[field] = false }

function goRegister() { uni.navigateTo({ url: '/pages/auth/register' }) }
function goForgot() { uni.navigateTo({ url: '/pages/auth/forgot-password' }) }

function thirdPartyLogin(_type: 'wechat' | 'alipay' | 'apple') {
  uni.showToast({ title: '暂未开放', icon: 'none' })
}

async function doLogin() {
  if (submitting.value) return
  if (!form.value.phone || form.value.phone.length !== 11) {
    return uni.showToast({ title: '请输入11位手机号', icon: 'none' })
  }
  if (!form.value.password || form.value.password.length < 6) {
    return uni.showToast({ title: '密码至少6位', icon: 'none' })
  }

  submitting.value = true
  uni.showLoading({ title: '登录中...' })
  try {
    await authApi.login(form.value.phone, form.value.password)
    const { assetStore } = await import('@/store/asset')
    await assetStore.fetchBalance()
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 1200)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '登录失败'
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
  padding: 36rpx 0 20rpx;
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
  padding: 12rpx 36rpx 0;
}

.auth-card {
  width: 100%;
  max-width: 600rpx;
  @include auth-card;
  padding: 44rpx 44rpx 40rpx;

  &__head { margin-bottom: 40rpx; }

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
  margin-bottom: 40rpx;

  // 金色 focus 描边 ─────────────────────────────────
  &.is-focused .fl-field__body {
    border-color: $auth-input-border-focus;
    box-shadow:
      inset 0 2rpx 8rpx rgba(47, 53, 66, 0.04),
      0 0 0 4rpx rgba(184, 152, 118, 0.14);
  }

  // 浮动标签行（标题区）
  &__label-row {
    height: 36rpx;
    display: flex;
    align-items: center;
    margin-bottom: 8rpx;
  }

  // 静态标题（未浮动时显示）
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
  }

  // 输入区
  &__body {
    position: relative;
    height: 100rpx;
    background: $auth-input-bg;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1.5rpx solid $auth-input-border;
    border-radius: 24rpx;
    box-shadow: inset 0 2rpx 8rpx rgba(47, 53, 66, 0.04);
    transition:
      border-color 0.28s ease,
      box-shadow 0.28s ease;
    overflow: hidden;
  }

  // 输入框本体
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

  // 浮动标签文字（动画目标）
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

  // 眼睛图标
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
}

// ============================================
//  忘记密码
// ============================================
.forget-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 36rpx;
}

.forget-link {
  font-size: 24rpx;
  color: $bronze-gold;
  font-weight: 500;
  letter-spacing: 0.3rpx;
  opacity: 0.85;
  transition: opacity 0.2s;

  &:active { opacity: 0.55; }
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

  // 流动加载条
  &__flow {
    background: $btn-brand-gradient;
    overflow: hidden;
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
    animation: btn-flow-load $btn-flow-duration linear infinite;
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

// ============================================
//  底部协议
// ============================================
.auth-footer {
  margin-top: 32rpx;
  display: flex;
  justify-content: center;

  &__text {
    font-size: $footer-text-size;
    color: $footer-text-color;
    text-align: center;
    line-height: 1.7;
    letter-spacing: 0.2rpx;
  }

  &__link {
    color: $bronze-gold;
    font-weight: 500;
  }
}

// ============================================
//  分割线
// ============================================
.divider-row {
  display: flex;
  align-items: center;
  margin: 28rpx 0 24rpx;
  gap: 20rpx;
}

.divider {
  flex: 1;
  height: 1rpx;
  background: rgba(47, 53, 66, 0.08);
  border-radius: 1rpx;

  &__text {
    font-size: 21rpx;
    color: $text-muted;
    font-weight: 400;
    white-space: nowrap;
    letter-spacing: 0.4rpx;
  }
}

// ============================================
//  第三方登录
// ============================================
.third-party {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 52rpx;

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10rpx;
    transition: transform 0.2s ease;

    &:active { transform: scale(0.92); }
  }

  &__icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.80);
    border: 1rpx solid rgba(47, 53, 66, 0.07);
    box-shadow: 0 4rpx 20rpx rgba(47, 53, 66, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  &__svg {
    width: 40rpx;
    height: 40rpx;
    display: block;
  }

  &__label {
    font-size: 20rpx;
    color: $text-muted;
    font-weight: 400;
    letter-spacing: 0.3rpx;
  }
}
</style>
