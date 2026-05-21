<template>
  <view class="auth-page auth-page--luxury">
    <view class="auth-safe safe-area-top" :style="{ height: statusBarHeight + 'px' }" />

    <view class="auth-bg">
      <view class="auth-orb auth-orb--1" />
      <view class="auth-orb auth-orb--2" />
    </view>

    <scroll-view class="auth-scroll" scroll-y :show-scrollbar="false" enhanced>
      <view class="auth-brand">
        <view class="auth-brand__logo-wrap">
          <BrandLogo size="lg" :show-text="false" />
        </view>
        <text class="auth-brand__name">{{ BRAND_NAME }}</text>
        <text class="auth-brand__slogan">智能生活 · 消费即投资 · 积分增值</text>
        <view class="auth-pills">
          <text class="auth-pill">安全加密</text>
          <text class="auth-pill">积分返利</text>
          <text class="auth-pill">理财增值</text>
        </view>
      </view>

      <view class="auth-card auth-card--luxury">
        <text class="auth-card__title">账号登录</text>

        <AuthField
          v-model="form.phone"
          variant="underline"
          label="手机号"
          icon="phone"
          input-type="number"
          :maxlength="11"
          placeholder="请输入11位手机号"
          :focused="focus.phone"
          :error="errors.phone"
          :ok="phoneOk"
          error-text="请输入正确的11位手机号"
          confirm-type="next"
          clearable
          @focus="focus.phone = true"
          @blur="onPhoneBlur"
        />

        <AuthField
          v-model="form.password"
          variant="underline"
          label="登录密码"
          icon="lock"
          :password="!showPassword"
          placeholder="至少6位登录密码"
          :focused="focus.password"
          :error="errors.password"
          :ok="pwdOk"
          error-text="密码至少6位"
          confirm-type="go"
          password-toggle
          @focus="focus.password = true"
          @blur="onPwdBlur"
          @toggle-pwd="showPassword = !showPassword"
          @confirm="doLogin"
        />

        <view class="auth-forgot-row">
          <text class="auth-link" @click="goForgot">忘记密码？</text>
        </view>

        <view class="auth-toolbar">
          <view class="auth-check" @click="rememberPhone = !rememberPhone">
            <view class="auth-check__box" :class="{ 'auth-check__box--on': rememberPhone }">
              <text v-if="rememberPhone">✓</text>
            </view>
            <text>记住手机号</text>
          </view>
        </view>

        <view class="auth-check" @click="agreed = !agreed">
          <view class="auth-check__box" :class="{ 'auth-check__box--on': agreed }">
            <text v-if="agreed">✓</text>
          </view>
          <text>
            我已阅读并同意
            <text class="auth-link" @click.stop="openAgreement('user')">《用户协议》</text>
            与
            <text class="auth-link" @click.stop="openAgreement('privacy')">《隐私政策》</text>
          </text>
        </view>

        <view
          class="auth-btn"
          :class="{
            'auth-btn--disabled': !canSubmit || submitting,
            'auth-btn--loading': submitting,
          }"
          @click="doLogin"
        >
          <view v-if="submitting" class="auth-btn__dot" />
          <text>{{ submitting ? '登录中' : '登 录' }}</text>
        </view>

        <view class="auth-secondary-row">
          <text class="auth-link auth-link--muted" @click="goBrowse">先去逛逛</text>
          <text class="auth-link" @click="goRegister">没有账号？立即注册</text>
        </view>
      </view>
    </scroll-view>

    <view class="auth-footer">
      <text>登录数据经 SSL 加密传输</text>
    </view>
    <view class="auth-safe safe-area-bottom" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { authApi } from '@/utils/api'
import { BRAND_NAME } from '@/config'
import { navigateAfterAuth, buildAuthQuery } from '@/utils/auth-nav'
import BrandLogo from '@/components/BrandLogo.vue'
import AuthField from '@/components/auth/AuthField.vue'

const STORAGE_PHONE = 'saved_phone'
const statusBarHeight = ref(20)
const submitting = ref(false)
const showPassword = ref(false)
const rememberPhone = ref(true)
const agreed = ref(true)
const redirectUrl = ref('')

const form = ref({ phone: '', password: '' })
const focus = reactive({ phone: false, password: false })
const errors = reactive({ phone: false, password: false })

const phoneOk = computed(() => /^1\d{10}$/.test(form.value.phone))
const pwdOk = computed(() => form.value.password.length >= 6)
const canSubmit = computed(() => phoneOk.value && pwdOk.value && agreed.value)

onLoad((opts) => {
  if (opts?.redirect) redirectUrl.value = decodeURIComponent(opts.redirect as string)
})

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  const saved = uni.getStorageSync(STORAGE_PHONE)
  if (saved) form.value.phone = String(saved)

  if (uni.getStorageSync('token')) {
    navigateAfterAuth(redirectUrl.value)
  }
})

function onPhoneBlur() {
  focus.phone = false
  errors.phone = form.value.phone.length > 0 && !phoneOk.value
}

function onPwdBlur() {
  focus.password = false
  errors.password = form.value.password.length > 0 && !pwdOk.value
}

function goRegister() {
  uni.navigateTo({
    url: `/pages/auth/register${buildAuthQuery(redirectUrl.value)}`,
  })
}

function goForgot() {
  const parts: string[] = []
  if (form.value.phone) parts.push(`phone=${form.value.phone}`)
  if (redirectUrl.value) parts.push(`redirect=${encodeURIComponent(redirectUrl.value)}`)
  const q = parts.length ? `?${parts.join('&')}` : ''
  uni.navigateTo({ url: `/pages/auth/forgot-password${q}` })
}

function goBrowse() {
  uni.switchTab({ url: '/pages/index/index' })
}

function openAgreement(type: string) {
  uni.showToast({
    title: type === 'user' ? '用户协议' : '隐私政策',
    icon: 'none',
  })
}

async function doLogin() {
  if (submitting.value) return
  errors.phone = !phoneOk.value
  errors.password = !pwdOk.value

  if (!agreed.value) {
    return uni.showToast({ title: '请先同意用户协议', icon: 'none' })
  }
  if (!canSubmit.value) {
    return uni.showToast({ title: '请填写正确的手机号和密码', icon: 'none' })
  }

  submitting.value = true
  uni.showLoading({ title: '登录中', mask: true })
  try {
    await authApi.login(form.value.phone, form.value.password)
    if (rememberPhone.value) {
      uni.setStorageSync(STORAGE_PHONE, form.value.phone)
    } else {
      uni.removeStorageSync(STORAGE_PHONE)
    }
    const { assetStore } = await import('@/store/asset')
    await assetStore.fetchBalance()
    uni.showToast({ title: '欢迎回来', icon: 'success' })
    setTimeout(() => navigateAfterAuth(redirectUrl.value), 700)
  } catch (e: any) {
    uni.showToast({ title: e.message || '登录失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/auth.scss';
</style>
