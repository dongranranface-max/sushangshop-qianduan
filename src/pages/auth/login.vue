<template>
  <view class="auth-split">

    <!-- ============================================
      左侧品牌空间（40%）
      深藏青背景 + 金色点缀 + 仪式感动效
    ============================================ -->
    <view class="brand-space">
      <!-- 背景光晕层 -->
      <view class="brand-glow brand-glow--top" />
      <view class="brand-glow brand-glow--bottom" />

      <!-- 品牌内容 -->
      <view class="brand-content">
        <!-- Logo -->
        <view class="brand-logo-wrap stagger-1">
          <image class="brand-logo-img" src="/static/logo/logo.png" mode="aspectFit" />
        </view>

        <!-- 品牌名称 -->
        <text class="brand-name stagger-2">集享公社</text>

        <!-- 品牌宣言 -->
        <text class="brand-slogan stagger-3">智蓝火炼 · 生态积分商城</text>

        <!-- 装饰分隔线 -->
        <view class="brand-divider stagger-4">
          <view class="divider-line divider-line--left" />
          <view class="divider-diamond" />
          <view class="divider-line divider-line--right" />
        </view>

        <!-- 底部文案 -->
        <view class="brand-footer stagger-5">
          <text class="brand-footer-text">已有账号？</text>
          <text class="brand-footer-link" @click="goRegister">立即注册</text>
        </view>

        <!-- 隐私条款 -->
        <text class="brand-privacy stagger-6">
          登录即表示同意《用户协议》和《隐私政策》
        </text>
      </view>
    </view>

    <!-- ============================================
      右侧操作空间（60%）
      象牙白背景 + 金色光感输入框
    ============================================ -->
    <view class="panel-space">
      <!-- 顶部安全区 -->
      <view class="panel-safe-top" :style="{ height: statusBarHeight + 'px' }" />

      <!-- 滚动内容 -->
      <scroll-view class="panel-scroll" scroll-y :show-scrollbar="false" enhanced>
        <view class="panel-inner">

          <!-- 页面标题 -->
          <view class="panel-header stagger-3">
            <text class="panel-title">欢迎回来</text>
            <text class="panel-subtitle">请输入您的账号信息</text>
          </view>

          <!-- 表单区 -->
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
                @focus="onFocus('phone')"
                @blur="onBlur('phone')"
              />
              <view class="input-gold-line" />
              <view class="input-glow" />
            </view>

            <!-- 密码 -->
            <view class="input-wrap input-field-wrap" :class="{ 'is-filled': form.password.length >= 6 }">
              <input
                class="input-native"
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                placeholder="登录密码"
                placeholder-class="input-plh"
                @focus="onFocus('pwd')"
                @blur="onBlur('pwd')"
              />
              <view class="input-gold-line" />
              <view class="input-glow" />
              <!-- 显示/隐藏密码 -->
              <view class="input-toggle" @click="showPwd = !showPwd">
                <text class="toggle-icon">{{ showPwd ? '⊙' : '◉' }}</text>
              </view>
            </view>

            <!-- 忘记密码入口 -->
            <view class="forget-row">
              <text class="forget-link" @click="goForgot">忘记密码？</text>
            </view>

          </view>

          <!-- 提交按钮 -->
          <view class="panel-submit stagger-5">
            <view
              class="submit-btn"
              :class="{ 'is-loading': submitting }"
              @click="doLogin"
            >
              <view v-if="!submitting" class="submit-inner">
                <text class="submit-text">登 录</text>
                <text class="submit-arrow">→</text>
              </view>
              <view v-else class="submit-loading">
                <view class="loading-spinner" />
                <text class="loading-text">登录中...</text>
              </view>
            </view>
          </view>

          <!-- 第三方登录 -->
          <view class="panel-third stagger-6">
            <view class="third-divider">
              <view class="third-line" />
              <text class="third-text">其他方式登录</text>
              <view class="third-line" />
            </view>
            <view class="third-icons">
              <view class="third-icon-item" @click="wxLogin">
                <image class="third-icon-img" src="/static/icons/wx.svg" mode="aspectFit" />
              </view>
            </view>
          </view>

        </view>
      </scroll-view>

      <!-- 底部安全区 -->
      <view class="panel-safe-bottom" />
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

// 自动登录跳转
const token = uni.getStorageSync('token')
if (token) {
  setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 100)
}

function onFocus(field: 'phone' | 'pwd') {
  focusState[field] = true
}
function onBlur(field: 'phone' | 'pwd') {
  focusState[field] = false
}

function goRegister() {
  uni.navigateTo({ url: '/pages/auth/register' })
}

function goForgot() {
  uni.navigateTo({ url: '/pages/auth/forgot-password' })
}

function wxLogin() {
  uni.showToast({ title: '微信登录暂未开放', icon: 'none' })
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
  } catch (e: any) {
    uni.showToast({ title: e.message || '登录失败', icon: 'none' })
  } finally {
    submitting.value = false
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

// ============================================
//  沉浸式分屏布局
//  左侧品牌空间 40% | 右侧操作空间 60%
// ============================================
.auth-split {
  display: flex;
  width: 100vw;
  min-height: 100vh;
  background: $bg-primary;
}

// ============================================
//  左侧品牌空间
// ============================================
.brand-space {
  flex: 0 0 40%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $navy;
  // 右侧内阴影，制造左右层次感
  box-shadow: inset -24rpx 0 80rpx rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

// 背景光晕
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
    background: radial-gradient(
      circle,
      rgba(196, 165, 116, 0.15) 0%,
      transparent 70%
    );
    animation: glow-float 8s ease-in-out infinite;
  }

  &--bottom {
    width: 350rpx;
    height: 350rpx;
    bottom: -80rpx;
    left: -100rpx;
    background: radial-gradient(
      circle,
      rgba(45, 58, 82, 0.4) 0%,
      transparent 70%
    );
    animation: glow-float 10s ease-in-out infinite reverse;
  }
}

@keyframes glow-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(16rpx, -16rpx) scale(1.08); }
}

// 品牌内容居中
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

// Logo 容器
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
  box-shadow: 0 8rpx 32rpx rgba(196, 165, 116, 0.15);
}

.brand-logo-img {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
}

// 品牌名称
.brand-name {
  font-size: 48rpx;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 8rpx;
  margin-bottom: 16rpx;
}

// 品牌宣言
.brand-slogan {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 4rpx;
  margin-bottom: 56rpx;
}

// 装饰分隔线
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
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(196, 165, 116, 0.45) 100%
    );
  }

  &--right {
    background: linear-gradient(
      90deg,
      rgba(196, 165, 116, 0.45) 0%,
      transparent 100%
    );
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

// 底部：已有账号
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

// 隐私条款
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

// 页面标题
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
  font-weight: 400;
}

// ============================================
//  输入框：金线从左向右延伸效果
// ============================================
.input-field-wrap {
  position: relative;
  margin-bottom: 40rpx;

  // 清除默认样式
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

    // 聚焦时：顶部留空间给金线
    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.8);
    }
  }

  // 金色底线：从左向右徐徐展开，600ms
  .input-gold-line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 3rpx;
    background: linear-gradient(
      90deg,
      $accent 0%,
      $gold-light 50%,
      $accent 100%
    );
    border-radius: 3rpx 3rpx 0 0;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  // 聚焦时的柔和光晕
  .input-glow {
    position: absolute;
    bottom: -6rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 70%;
    height: 32rpx;
    background: radial-gradient(
      ellipse at center,
      rgba(196, 165, 116, 0.18) 0%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  // 聚焦态
  &.is-focused {
    .input-gold-line { width: 100%; }
    .input-glow { opacity: 1; }
  }

  // 填满态（保持金线）
  &.is-filled {
    .input-gold-line { width: 100%; }
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
  flex-shrink: 0;

  .toggle-icon {
    font-size: 32rpx;
    color: $text-muted;
  }
}

// 忘记密码
.forget-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 48rpx;
}

.forget-link {
  font-size: 24rpx;
  color: $accent-dark;
  font-weight: 500;
  letter-spacing: 0.02em;
}

// ============================================
//  提交按钮：渐进式入场 + 涟漪动效
// ============================================
.submit-btn {
  height: 96rpx;
  border-radius: 9999rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 16rpx 40rpx rgba(26, 36, 56, 0.22);

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
  gap: 12rpx;
  background: $navy;
}

// 光泽扫过动画
.submit-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.12) 50%,
    transparent 100%
  );
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

.submit-arrow {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
}

.submit-btn.is-loading {
  opacity: 0.75;
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
//  第三方登录
// ============================================
.panel-third {
  margin-top: 64rpx;
}

.third-divider {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

.third-line {
  flex: 1;
  height: 1rpx;
  background: rgba(20, 20, 20, 0.08);
}

.third-text {
  font-size: 22rpx;
  color: $text-muted;
  padding: 0 24rpx;
  letter-spacing: 0.05em;
}

.third-icons {
  display: flex;
  justify-content: center;
  gap: 48rpx;
}

.third-icon-item {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: $bg-secondary;
  border: 1rpx solid rgba(20, 20, 20, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(26, 36, 56, 0.05);
}

.third-icon-img {
  width: 48rpx;
  height: 48rpx;
}

// ============================================
//  入场动画：600ms，缓慢且优雅
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

// ============================================
//  底部安全区
// ============================================
.panel-safe-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}
</style>