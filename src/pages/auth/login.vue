<template>
  <view class="auth-page">

    <!-- ============================================
      品牌英雄区（大 Logo 视觉锚点）
    ============================================ -->
    <view class="brand-hero">
      <view class="brand-hero__halo" />
      <view class="brand-hero__logo-card">
        <image class="brand-hero__logo" src="/static/logo.png" mode="aspectFit" />
      </view>
      <view class="brand-hero__warm-glow" />
    </view>

    <!-- ============================================
      右上角 Ghost Button 注册入口
    ============================================ -->
    <view class="auth-ghost-corner">
      <view class="ghost-btn" @click="goRegister">
        <text class="ghost-btn__text">注册账号</text>
      </view>
    </view>

    <!-- ============================================
      表单区域（光学居中：center + 上移 5dvh）
    ============================================ -->
    <view class="auth-body">
      <view class="auth-card">

        <!-- 标题 ─ font-weight 500，letter-spacing 3rpx，flex-end 基线 -->
        <view class="auth-card__head">
          <view class="auth-card__title-wrap">
            <text class="auth-card__title">欢迎回来</text>
          </view>
          <text class="auth-card__sub">请输入您的账号信息登录</text>
        </view>

        <!-- 手机号 -->
        <view class="field-group">
          <view class="field-group__label-row">
            <text class="field-group__label">手机号</text>
          </view>
          <view class="field-line" :class="{ 'is-focused': focusState.phone }">
            <input
              class="field-line__input"
              v-model="form.phone"
              inputmode="numeric"
              type="number"
              maxlength="11"
              placeholder="请输入手机号"
              @focus="onFocus('phone')"
              @blur="onBlur('phone')"
            />
            <!-- 光随影动效果 -->
            <view class="field-line__glow" />
          </view>
        </view>

        <!-- 密码 ─ 忘记密码内嵌右下方 -->
        <view class="field-group">
          <view class="field-group__label-row">
            <text class="field-group__label">登录密码</text>
          </view>
          <view class="field-line field-line--with-action" :class="{ 'is-focused': focusState.pwd }">
            <input
              class="field-line__input"
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="请输入登录密码"
              @focus="onFocus('pwd')"
              @blur="onBlur('pwd')"
            />
            <!-- 光随影动 -->
            <view class="field-line__glow" />
            <view class="field-line__eye-wrap" @click="showPwd = !showPwd">
              <svg v-if="showPwd" class="field-line__eye" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1"/>
              </svg>
              <svg v-else class="field-line__eye" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
              </svg>
            </view>
            <view class="field-line__forget" @click="goForgot">
              <text class="field-line__forget-text">忘记密码？</text>
            </view>
          </view>
        </view>

        <!-- 提交按钮 ─ 金色渐变 + 扫光动画 -->
        <view class="btn-submit" :class="{ 'is-loading': submitting }" @click="doLogin">
          <view v-if="!submitting" class="btn-submit__inner">
            <!-- 扫光动画层 -->
            <view class="btn-submit__shimmer" />
            <text class="btn-submit__text">登 录</text>
          </view>
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

        <!-- 第三方登录（灰度图标） -->
        <view class="third-party">
          <view class="third-party__item" @click="thirdPartyLogin('wechat')">
            <view class="third-party__icon">
              <svg class="third-party__svg" viewBox="0 0 24 24" fill="none">
                <path class="third-party__path" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.667c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 6.847c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.108.24-.243 0-.06-.022-.12-.038-.173l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.59a5.794 5.794 0 0 0-.406-.056zm-1.834 2.994c.536 0 .97.44.97.983a.976.976 0 0 1-.97.983.976.976 0 0 1-.97-.983c0-.542.434-.983.97-.983zm4.857 0c.536 0 .97.44.97.983a.976.976 0 0 1-.97.983.976.976 0 0 1-.97-.983c0-.542.434-.983.97-.983z" fill="currentColor"/>
              </svg>
            </view>
            <text class="third-party__label">微信</text>
          </view>
          <view class="third-party__item" @click="thirdPartyLogin('alipay')">
            <view class="third-party__icon">
              <svg class="third-party__svg" viewBox="0 0 24 24" fill="none">
                <path class="third-party__path" d="M12 2C6.48 2 2 6.03 2 11c0 2.76 1.36 5.22 3.49 6.87L4.23 21.5a.5.5 0 0 0 .61.61l3.63-1.26C9.78 21.72 10.86 22 12 22c5.52 0 10-4.03 10-9S17.52 2 12 2zm.32 13.49c-.47.2-.98.32-1.52.32-.38 0-.75-.06-1.1-.16L9.5 16H8.4c-.6 0-1.1-.4-1.25-.96l-.5-1.9-1.6-6.1A7.94 7.94 0 0 1 12 4.5c.38 0 .75.04 1.1.1l2.2 8.35c.11.43.5.73.95.73h1.1c.42 0 .8-.25.96-.64l.52-1.33a8.02 8.02 0 0 1-.05-.28z" fill="currentColor"/>
              </svg>
            </view>
            <text class="third-party__label">支付宝</text>
          </view>
          <view class="third-party__item" @click="thirdPartyLogin('apple')">
            <view class="third-party__icon">
              <svg class="third-party__svg" viewBox="0 0 24 24" fill="none">
                <path class="third-party__path" d="M17.05 12.54c-.02-1.52 1.23-2.27 1.29-2.3-.7-1.03-1.8-1.17-2.18-1.19-1.03-.1-2 .6-2.52.6-.54 0-1.37-.58-2.26-.56C10.5 8.77 7.89 10.6 7.89 14.18c0 4.37 3.55 6.73 8.68 6.73 4.1 0 6.9-2.6 6.9-6.4-.08-.88-1.03-2.21-2.52-2.97zM14.82 4.36c.9-1.12 1.5-2.67 1.33-4.22-1.29.05-2.85.86-3.77 1.96-.8.93-1.5 2.42-1.32 3.84 1.45.11 2.94-.82 3.76-1.58z" fill="currentColor"/>
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
import { ref, reactive } from 'vue'
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
  width: 100%;
  min-height: 100dvh;
  background: radial-gradient(ellipse 120% 100% at 50% 0%, #FFFFFF 0%, #F5F5F5 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  overflow-x: hidden;
  position: relative;

  // ── 四角弥散光 Mesh Gradient ─────────────────────
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 8% 5%, rgba(184, 152, 118, 0.07) 0%, transparent 60%),
      radial-gradient(ellipse 55% 45% at 92% 95%, rgba(184, 152, 118, 0.05) 0%, transparent 55%),
      radial-gradient(ellipse 40% 35% at 85% 8%, rgba(212, 196, 174, 0.04) 0%, transparent 50%),
      radial-gradient(ellipse 50% 40% at 15% 92%, rgba(212, 196, 174, 0.04) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  // ── 若隐若现品牌纹理圆环 ───────────────────────
  &::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='55' fill='none' stroke='%23B89876' stroke-width='0.5' opacity='0.06'/%3E%3C/svg%3E");
    background-size: 240rpx 240rpx;
    background-position: center 18%;
    background-repeat: no-repeat;
    pointer-events: none;
    z-index: 0;
  }
}

// ============================================
//  右上角 Ghost Button
// ============================================
.auth-ghost-corner {
  position: fixed;
  top: calc(14rpx + env(safe-area-inset-top));
  right: 32rpx;
  z-index: 10;
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 56rpx;
  padding: 0 4rpx;
  cursor: pointer;
  position: relative;

  // 底部 1px 金色虚线下划线
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
    transition: opacity 0.2s;
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

// ============================================
//  品牌英雄区（大 Logo + 金色光晕特效）
// ============================================
.brand-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0 20rpx;
  position: relative;
  flex-shrink: 0;
  z-index: 1;

  &__halo {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 320rpx;
    height: 200rpx;
    background: radial-gradient(ellipse at 50% 40%, rgba(184, 152, 118, 0.15) 0%, transparent 68%);
    pointer-events: none;
  }

  // Logo 透明背景 + 金色光晕特效
  &__logo-card {
    width: 140rpx;
    height: 140rpx;
    border-radius: 38rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;    // 让光晕可以超出圆角
    position: relative;
    z-index: 2;
    background: transparent;
    box-shadow: none;
    // 金色外发光
    filter: drop-shadow(0 0 20rpx rgba(184, 152, 118, 0.30))
            drop-shadow(0 0 8rpx rgba(184, 152, 118, 0.15));
    transition: filter 0.3s ease;

    &:active {
      filter: drop-shadow(0 0 28rpx rgba(184, 152, 118, 0.45))
              drop-shadow(0 0 12rpx rgba(184, 152, 118, 0.20));
    }
  }

  &__logo {
    width: 90rpx;
    height: 90rpx;
    object-fit: contain;
    display: block;
    position: relative;
    z-index: 1;
  }

  &__warm-glow {
    width: 200rpx;
    height: 48rpx;
    background: radial-gradient(ellipse at 50% 50%, rgba(184, 152, 118, 0.22) 0%, transparent 68%);
    margin-top: -6rpx;
    position: relative;
    z-index: 1;
  }
}

// ============================================
//  表单区域（光学居中：center + 上移 5dvh）
// ============================================
.auth-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 5dvh;     // 向上偏移 5dvh，光学中心补偿
  padding-bottom: 0;
  padding-left: 40rpx;
  padding-right: 40rpx;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.auth-card {
  width: 100%;
  max-width: 600rpx;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1rpx solid rgba(184, 152, 118, 0.10);
  border-radius: 40rpx;
  box-shadow:
    0 4rpx 20rpx rgba(47, 53, 66, 0.08),
    0 24rpx 80rpx rgba(47, 53, 66, 0.12),
    0 48rpx 100rpx rgba(47, 53, 66, 0.06);
  padding: 52rpx 48rpx 48rpx;
  box-sizing: border-box;

  &__head { margin-bottom: 44rpx; }

  // 标题包覆层 ─ flex-end 基线对齐，视觉重心稳
  &__title-wrap {
    display: flex;
    align-items: flex-end;    // 标题视觉下压
    margin-bottom: 12rpx;
  }

  // font-weight 500，letter-spacing 3rpx
  &__title {
    display: block;
    font-size: 52rpx;
    font-weight: 500;        // 中等加粗，不过重
    color: $mineral-gray;
    letter-spacing: 3rpx;    // 3rpx 舒展呼吸感
    line-height: 1.1;
  }

  &__sub {
    display: block;
    font-size: 26rpx;
    color: #888888;
    font-weight: 400;
    line-height: 1.6;
  }
}

// ============================================
//  字段组 ─ 亲密性原则
// ============================================
.field-group {
  margin-bottom: 40rpx;

  &__label-row {
    height: 36rpx;
    display: flex;
    align-items: center;
    margin-bottom: 8rpx;    // Label → Input 间距 8rpx
  }

  &__label {
    font-size: 22rpx;
    color: $text-secondary;
    font-weight: 500;
    letter-spacing: 0.5rpx;
  }
}

// ============================================
//  极简输入框 ─ 透明底 + 底部细线
// ============================================
.field-line {
  position: relative;
  height: 88rpx;
  display: flex;
  align-items: center;
  border-bottom: 1.5rpx solid rgba(47, 53, 66, 0.12);
  overflow: visible;

  &.is-focused {
    border-bottom-color: $bronze-gold;
  }

  // 光随影动：左侧金色光线从左→右扫过
  &__glow {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(212, 180, 131, 0.12) 40%,
      rgba(212, 180, 131, 0.20) 60%,
      transparent 100%
    );
    pointer-events: none;
    transition: none;
  }

  &.is-focused &__glow {
    animation: light-sweep 0.5s ease-out forwards;
  }

  &--with-action {
    padding-right: 148rpx;
  }

  &__input {
    flex: 1;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-size: 30rpx;
    font-weight: 500;
    color: $mineral-gray;
    padding: 0;
    box-sizing: border-box;

    &::placeholder {
      color: rgba(138, 138, 138, 0.5);
      font-weight: 400;
    }
  }

  &__eye-wrap {
    position: absolute;
    right: 80rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 64rpx;
    height: 64rpx;
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

    &:active { color: $bronze-gold; }
  }

  &__forget {
    position: absolute;
    right: 0;
    bottom: -52rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  &__forget-text {
    font-size: 22rpx;
    color: $bronze-gold;
    font-weight: 500;
    letter-spacing: 0.3rpx;
    transition: opacity 0.2s;

    &:active { opacity: 0.55; }
  }
}

// 光随影动动画
@keyframes light-sweep {
  0%   { width: 0; left: 0; opacity: 0.8; }
  60%  { width: 100%; left: 0; opacity: 0.4; }
  100% { width: 0; left: 100%; opacity: 0; }
}

// ============================================
//  提交按钮 ─ 金色渐变 + 扫光动画
// ============================================
.btn-submit {
  height: 104rpx;
  border-radius: 52rpx;
  overflow: hidden;
  position: relative;
  margin-top: 8rpx;

  &:active { transform: scale(0.984); }
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
      background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 50%);
      pointer-events: none;
    }
  }

  // 扫光动画层
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
    animation: btn-shimmer 2.8s ease-in-out infinite;
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

// 扫光动画（倾斜亮光周期性划过）
@keyframes btn-shimmer {
  0%   { background-position: -200% 0; }
  60%  { background-position: 150% 0; }
  100% { background-position: 150% 0; }
}

@keyframes btn-flow-load {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

// ============================================
//  分割线
// ============================================
.divider-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin: 36rpx 0 28rpx;
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
//  第三方登录 ─ 灰度图标，1px 描边
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

    &:active { transform: scale(0.90); }

    &:active .third-party__path {
      color: unset;
    }
  }

  &__icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.80);
    border: 1rpx solid rgba(47, 53, 66, 0.06);
    box-shadow: 0 4rpx 20rpx rgba(47, 53, 66, 0.05);
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
    object-fit: contain;
    filter: grayscale(100%) opacity(0.45);
    transition: filter 0.25s ease;
  }

  &:active &__svg {
    filter: grayscale(0%) opacity(1);
  }

  &__label {
    font-size: 20rpx;
    color: $text-muted;
    font-weight: 400;
    letter-spacing: 0.3rpx;
  }
}

// ============================================
//  底部协议
// ============================================
.auth-footer {
  margin-top: 32rpx;
  display: flex;
  justify-content: center;

  &__text {
    font-size: 22rpx;
    color: rgba(20, 20, 20, 0.40);
    text-align: center;
    line-height: 1.7;
    letter-spacing: 0.2rpx;
  }

  &__link {
    color: $bronze-gold;
    font-weight: 500;
  }
}
</style>
