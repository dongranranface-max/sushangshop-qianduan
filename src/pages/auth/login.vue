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
        <text class="auth-header__nav-link" @click="goRegister">注册</text>
      </view>
    </view>

    <!-- ============================================
      表单卡片区
    ============================================ -->
    <view class="auth-body">
      <view class="auth-card">

        <!-- 标题组 -->
        <view class="auth-card__head">
          <text class="auth-card__title">欢迎回来</text>
          <text class="auth-card__sub">请输入您的账号信息</text>
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
              @focus="onFocus('phone')"
              @blur="onBlur('phone')"
            />
            <view class="field__line" />
          </view>
        </view>

        <!-- 密码 -->
        <view class="field-group">
          <text class="field-label">登录密码</text>
          <view
            class="field"
            :class="{ 'is-focused': focusState.pwd, 'is-filled': form.password.length >= 6 }"
          >
            <input
              class="field__input"
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="请输入登录密码"
              placeholder-class="field__placeholder"
              @focus="onFocus('pwd')"
              @blur="onBlur('pwd')"
            />
            <view class="field__line" />
            <view class="field__eye" @click="showPwd = !showPwd">
              <text class="field__eye-icon">{{ showPwd ? '⊙' : '◉' }}</text>
            </view>
          </view>
        </view>

        <!-- 忘记密码 -->
        <view class="auth-links">
          <text class="auth-link auth-link--right" @click="goForgot">忘记密码？</text>
        </view>

        <!-- 提交按钮 -->
        <view
          class="btn-submit"
          :class="{ 'is-loading': submitting }"
          @click="doLogin"
        >
          <view v-if="!submitting" class="btn-submit__inner">
            <text class="btn-submit__text">登 录</text>
          </view>
          <view v-else class="btn-submit__loading">
            <view class="btn-submit__spinner" />
            <text class="btn-submit__loading-text">登录中...</text>
          </view>
        </view>

        <!-- 第三方登录（暂不开放，隐藏）-->
        <view style="display:none;"></view>

      </view>
    </view>

    <!-- ============================================
      底部隐私协议
    ============================================ -->
    <view class="auth-footer">
      <text class="auth-footer__text">
        登录即表示同意
        <text class="auth-footer__link">《用户协议》</text>
        和
        <text class="auth-footer__link">《隐私政策》</text>
      </text>
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

function onFocus(field: 'phone' | 'pwd') { focusState[field] = true }
function onBlur(field: 'phone' | 'pwd') { focusState[field] = false }

function goRegister() { uni.navigateTo({ url: '/pages/auth/register' }) }
function goForgot() { uni.navigateTo({ url: '/pages/auth/forgot-password' }) }

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
//  全屏页面
// ============================================
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

  &__nav {
    flex-shrink: 0;
  }

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
  padding: 48rpx 32rpx 32rpx;
}

// ============================================
//  表单卡片
// ============================================
.auth-card {
  width: 100%;
  max-width: 580rpx;
  background: $bg-secondary;
  border-radius: $radius-xl;
  padding: 48rpx 40rpx;
  box-shadow: 0 4rpx 32rpx rgba(47, 53, 66, 0.06), 0 1rpx 4rpx rgba(0, 0, 0, 0.03);
  border: 1rpx solid rgba(20, 20, 20, 0.05);

  &__head {
    margin-bottom: 40rpx;
  }

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

// 分隔线
.auth-divider {
  height: 1rpx;
  background: linear-gradient(90deg, rgba(184, 152, 118, 0.3) 0%, rgba(184, 152, 118, 0.08) 80%, transparent 100%);
  margin-bottom: 40rpx;
}

// ============================================
//  字段组
// ============================================
.field-group {
  margin-bottom: 36rpx;
}

.field-label {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  font-weight: 500;
  margin-bottom: 12rpx;
  letter-spacing: 0.5rpx;
}

// 字段容器
.field {
  position: relative;

  &__input {
    width: 100%;
    height: 88rpx;
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

  // 底部铜金线（聚焦/填满时展开）
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

  // 密码眼睛
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
}

// ============================================
//  操作链接
// ============================================
.auth-links {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 40rpx;
}

.auth-link {
  font-size: 24rpx;
  font-weight: 500;

  &--right {
    color: $accent-dark;
  }

  &--left {
    color: $text-muted;
  }
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

  &:active {
    transform: scale(0.985);
    box-shadow: 0 4rpx 16rpx rgba(47, 53, 66, 0.12);
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

// ============================================
//  底部协议
// ============================================
.auth-footer {
  padding: 24rpx 40rpx 40rpx;
  display: flex;
  justify-content: center;
  flex-shrink: 0;

  &__text {
    font-size: 22rpx;
    color: $text-muted;
    text-align: center;
    line-height: 1.6;
    opacity: 0.7;
  }

  &__link {
    color: $accent-dark;
    font-weight: 500;
  }
}
</style>