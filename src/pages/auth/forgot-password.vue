<template>
  <view class="auth-page auth-page--luxury">
    <view class="auth-safe safe-area-top" :style="{ height: statusBarHeight + 'px' }" />

    <view class="auth-bg">
      <view class="auth-orb auth-orb--1" />
      <view class="auth-orb auth-orb--2" />
    </view>

    <view class="auth-top-bar">
      <view class="auth-back" @click="goBack"><text>←</text></view>
      <text class="auth-top-title">忘记密码</text>
      <view class="auth-top-spacer" />
    </view>

    <scroll-view class="auth-scroll" scroll-y :show-scrollbar="false" enhanced>
      <view class="auth-brand auth-brand--inline">
        <view class="auth-brand__logo-wrap auth-brand__logo-wrap--sm">
          <BrandLogo size="md" :show-text="false" />
        </view>
        <view class="auth-brand__info">
          <text class="auth-brand__name auth-brand__name--sm">找回密码</text>
          <text class="auth-brand__slogan">验证手机号后设置新密码</text>
        </view>
      </view>

      <view class="auth-steps">
        <view class="auth-step" :class="{ 'auth-step--active': step === 1, 'auth-step--done': step > 1 }">
          <text class="auth-step__num">1</text>
          <text>验证手机</text>
        </view>
        <view class="auth-step-line" />
        <view class="auth-step" :class="{ 'auth-step--active': step === 2 }">
          <text class="auth-step__num">2</text>
          <text>设置密码</text>
        </view>
      </view>

      <view class="auth-card auth-card--luxury">
        <text class="auth-card__title">{{ step === 1 ? '短信验证' : '设置新密码' }}</text>

        <template v-if="step === 1">
          <AuthField
            v-model="form.phone"
            variant="underline"
            label="手机号"
            icon="phone"
            input-type="number"
            :maxlength="11"
            placeholder="注册时使用的手机号"
            :focused="focus.phone"
            :error="errors.phone"
            :ok="phoneOk"
            error-text="请输入正确的11位手机号"
            clearable
            @focus="focus.phone = true"
            @blur="onPhoneBlur"
          />

          <AuthField
            v-model="form.verifyCode"
            variant="underline"
            label="短信验证码"
            icon="lock"
            input-type="number"
            :maxlength="6"
            placeholder="请输入6位验证码"
            :focused="focus.code"
            :error="errors.code"
            :ok="codeOk"
            error-text="请输入6位验证码"
            @focus="focus.code = true"
            @blur="onCodeBlur"
          >
            <template #suffix>
              <view
                class="auth-code-btn"
                :class="{ 'auth-code-btn--disabled': !canSendCode || countdown > 0 || sendingCode }"
                @click.stop="sendCode"
              >
                <text>{{ codeBtnText }}</text>
              </view>
            </template>
          </AuthField>

          <view class="auth-hint-box">
            <text>验证码将发送至上述手机号，有效期约 5 分钟</text>
          </view>

          <view
            class="auth-btn"
            :class="{ 'auth-btn--disabled': !canGoStep2 }"
            @click="goStep2"
          >
            <text>下一步</text>
          </view>
        </template>

        <template v-else>
          <view class="auth-hint-box auth-hint-box--compact">
            <text>已为 {{ maskedPhone }} 验证通过</text>
          </view>

          <AuthField
            v-model="form.password"
            variant="underline"
            label="新密码"
            icon="lock"
            :password="!showPwd"
            placeholder="6–20位，建议字母+数字"
            :focused="focus.password"
            :error="errors.password"
            :ok="pwdOk"
            error-text="密码至少6位"
            password-toggle
            @focus="focus.password = true"
            @blur="onPwdBlur"
            @input="onPwdInput"
            @toggle-pwd="showPwd = !showPwd"
          >
            <template v-if="form.password" #hint>
              <view class="auth-pwd-bar">
                <view class="auth-pwd-track">
                  <view
                    class="auth-pwd-fill"
                    :class="pwdLevel ? `auth-pwd-fill--${pwdLevel}` : ''"
                    :style="{ width: pwdPercent + '%' }"
                  />
                </view>
                <text class="auth-pwd-label">{{ pwdHint }}</text>
              </view>
            </template>
          </AuthField>

          <AuthField
            v-model="form.confirmPassword"
            variant="underline"
            label="确认新密码"
            icon="lock"
            :password="!showConfirm"
            placeholder="再次输入新密码"
            :focused="focus.confirm"
            :error="errors.confirm"
            :ok="confirmOk"
            error-text="两次密码不一致"
            confirm-type="done"
            password-toggle
            @focus="focus.confirm = true"
            @blur="onConfirmBlur"
            @toggle-pwd="showConfirm = !showConfirm"
            @confirm="doReset"
          />

          <view
            class="auth-btn"
            :class="{
              'auth-btn--disabled': !canSubmit || submitting,
              'auth-btn--loading': submitting,
            }"
            @click="doReset"
          >
            <view v-if="submitting" class="auth-btn__dot" />
            <text>{{ submitting ? '提交中' : '确认重置' }}</text>
          </view>

          <view class="auth-secondary-row">
            <text class="auth-link auth-link--muted" @click="step = 1">返回上一步</text>
          </view>
        </template>

        <view class="auth-secondary-row">
          <text class="auth-link auth-link--muted">想起密码了？</text>
          <text class="auth-link" @click="goLogin">返回登录</text>
        </view>
      </view>
    </scroll-view>

    <view class="auth-footer">
      <text>如无法接收验证码，请联系平台客服协助找回</text>
    </view>
    <view class="auth-safe safe-area-bottom" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { authApi } from '@/utils/api'
import BrandLogo from '@/components/BrandLogo.vue'
import AuthField from '@/components/auth/AuthField.vue'

const STORAGE_PHONE = 'saved_phone'
const COUNTDOWN_SEC = 60

const statusBarHeight = ref(20)
const step = ref(1)
const submitting = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const showPwd = ref(false)
const showConfirm = ref(false)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const form = ref({
  phone: '',
  verifyCode: '',
  password: '',
  confirmPassword: '',
})

const focus = reactive({
  phone: false,
  code: false,
  password: false,
  confirm: false,
})

const errors = reactive({
  phone: false,
  code: false,
  password: false,
  confirm: false,
})

const phoneOk = computed(() => /^1\d{10}$/.test(form.value.phone))
const codeOk = computed(() => /^\d{6}$/.test(form.value.verifyCode))
const pwdOk = computed(() => form.value.password.length >= 6)
const confirmOk = computed(
  () => form.value.confirmPassword.length >= 6 && form.value.confirmPassword === form.value.password
)

const canSendCode = computed(() => phoneOk.value)
const canGoStep2 = computed(() => phoneOk.value && codeOk.value)
const canSubmit = computed(() => pwdOk.value && confirmOk.value)

const maskedPhone = computed(() => {
  const p = form.value.phone
  if (p.length !== 11) return p
  return `${p.slice(0, 3)}****${p.slice(7)}`
})

const codeBtnText = computed(() => {
  if (sendingCode.value) return '发送中'
  if (countdown.value > 0) return `${countdown.value}s`
  return '获取验证码'
})

const pwdLevel = ref(0)
const pwdPercent = ref(0)
const pwdHint = ref('')

onLoad((opts) => {
  if (opts?.phone) form.value.phone = String(opts.phone)
  if (opts?.redirect) uni.setStorageSync('_forgot_redirect', decodeURIComponent(opts.redirect as string))
})

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  if (!form.value.phone) {
    const saved = uni.getStorageSync(STORAGE_PHONE)
    if (saved) form.value.phone = String(saved)
  }
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

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

function onPhoneBlur() {
  focus.phone = false
  errors.phone = form.value.phone.length > 0 && !phoneOk.value
}

function onCodeBlur() {
  focus.code = false
  errors.code = form.value.verifyCode.length > 0 && !codeOk.value
}

function onPwdBlur() {
  focus.password = false
  errors.password = form.value.password.length > 0 && !pwdOk.value
}

function onConfirmBlur() {
  focus.confirm = false
  errors.confirm =
    form.value.confirmPassword.length > 0 && form.value.confirmPassword !== form.value.password
}

function onPwdInput() {
  const p = form.value.password
  let level = 0
  if (p.length >= 6) level = 1
  if (p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p)) level = 2
  if (p.length >= 10 && /[A-Za-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p)) level = 3
  pwdLevel.value = level
  pwdPercent.value = p.length === 0 ? 0 : level === 0 ? Math.min(33, (p.length / 6) * 33) : level * 33
  const hints = ['', '强度一般', '强度良好', '强度优秀']
  pwdHint.value = p.length ? hints[level] || '' : ''
}

function startCountdown(sec = COUNTDOWN_SEC) {
  countdown.value = sec
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

async function sendCode() {
  if (!canSendCode.value || countdown.value > 0 || sendingCode.value) return

  sendingCode.value = true
  try {
    await authApi.sendResetSmsCode(form.value.phone)
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    startCountdown()
  } catch (e: any) {
    uni.showToast({
      title: e.message || '发送失败，请稍后重试',
      icon: 'none',
      duration: 2500,
    })
  } finally {
    sendingCode.value = false
  }
}

function goStep2() {
  errors.phone = !phoneOk.value
  errors.code = !codeOk.value
  if (!canGoStep2.value) {
    return uni.showToast({ title: '请先完成手机号与验证码填写', icon: 'none' })
  }
  step.value = 2
}

async function doReset() {
  if (submitting.value) return
  errors.password = !pwdOk.value
  errors.confirm = !confirmOk.value

  if (!canSubmit.value) {
    return uni.showToast({ title: '请设置并确认新密码', icon: 'none' })
  }

  submitting.value = true
  uni.showLoading({ title: '重置中', mask: true })
  try {
    await authApi.resetPassword(
      form.value.phone,
      form.value.verifyCode.trim(),
      form.value.password
    )
    uni.setStorageSync(STORAGE_PHONE, form.value.phone)
    uni.showToast({ title: '密码已重置', icon: 'success' })
    setTimeout(() => {
      const redirect = uni.getStorageSync('_forgot_redirect') || ''
      uni.removeStorageSync('_forgot_redirect')
      const q = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
      uni.redirectTo({ url: `/pages/auth/login${q}` })
    }, 900)
  } catch (e: any) {
    uni.showToast({ title: e.message || '重置失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/auth.scss';

.auth-scroll {
  padding-top: 0;
}

.auth-hint-box--compact {
  margin-bottom: 20rpx;
}

.auth-pwd-bar {
  margin-top: 12rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.auth-pwd-track {
  flex: 1;
  height: 8rpx;
  background: $bg-tertiary;
  border-radius: $radius-full;
  overflow: hidden;
}

.auth-pwd-fill {
  height: 100%;
  border-radius: $radius-full;
  transition: width 0.25s ease;
  &--1 { background: $warning; }
  &--2 { background: $primary; }
  &--3 { background: $success; }
}

.auth-pwd-label {
  font-size: var(--font-xs);
  color: $text-muted;
  flex-shrink: 0;
}
</style>
