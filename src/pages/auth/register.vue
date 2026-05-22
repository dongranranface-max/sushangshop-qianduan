<template>
  <view class="auth-page auth-page--luxury">
    <view class="auth-safe safe-area-top" :style="{ height: statusBarHeight + 'px' }" />

    <view class="auth-bg">
      <view class="auth-orb auth-orb--1" />
      <view class="auth-orb auth-orb--2" />
    </view>

    <view class="auth-top-bar">
      <view class="auth-back" @click="goBack"><text>←</text></view>
      <text class="auth-top-title">注册账号</text>
      <view class="auth-top-spacer" />
    </view>

    <scroll-view class="auth-scroll" scroll-y :show-scrollbar="false" enhanced>
      <view class="auth-brand auth-brand--inline">
        <view class="auth-brand__logo-wrap auth-brand__logo-wrap--sm">
          <BrandLogo size="md" :show-text="false" />
        </view>
        <view class="auth-brand__info">
          <text class="auth-brand__name auth-brand__name--sm">{{ BRAND_NAME }}</text>
          <text class="auth-brand__slogan">填写邀请码，开启积分与理财权益</text>
        </view>
      </view>

      <view class="auth-card auth-card--luxury">
        <text class="auth-card__title">创建账户</text>

        <AuthField
          v-model="form.phone"
          variant="underline"
          label="手机号"
          icon="phone"
          input-type="number"
          :maxlength="11"
          placeholder="11位中国大陆手机号"
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
          label="设置密码"
          icon="lock"
          :password="!showPwd"
          placeholder="6–20位，建议字母+数字"
          :focused="focus.password"
          :error="errors.password"
          :ok="pwdOk"
          error-text="密码至少6位"
          confirm-type="next"
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
          v-model="form.inviteCode"
          variant="underline"
          label="邀请码"
          required
          icon="gift"
          placeholder="请输入邀请码（4–6位）"
          :maxlength="6"
          :focused="focus.invite"
          :error="errors.invite"
          :ok="inviteOk"
          error-text="请输入有效邀请码"
          confirm-type="done"
          @focus="focus.invite = true"
          @blur="onInviteBlur"
          @input="onInviteInput"
        >
          <template v-if="!errors.invite" #hint>
            <view class="auth-hint-box">
              <text>邀请码由推荐人提供，注册后即可使用理财与积分功能</text>
            </view>
          </template>
        </AuthField>

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
          @click="doRegister"
        >
          <view v-if="submitting" class="auth-btn__dot" />
          <text>{{ submitting ? '提交中' : '立即注册' }}</text>
        </view>

        <view class="auth-secondary-row">
          <text class="auth-link auth-link--muted">已有账号？</text>
          <text class="auth-link" @click="goLogin">返回登录</text>
        </view>
      </view>
    </scroll-view>

    <view class="auth-footer">
      <text>注册即开通生态积分与增值专区</text>
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

const statusBarHeight = ref(20)
const submitting = ref(false)
const showPwd = ref(false)
const agreed = ref(false)
const redirectUrl = ref('')

const form = ref({ phone: '', password: '', inviteCode: '' })
const focus = reactive({ phone: false, password: false, invite: false })
const errors = reactive({ phone: false, password: false, invite: false })

const phoneOk = computed(() => /^1\d{10}$/.test(form.value.phone))
const pwdOk = computed(() => form.value.password.length >= 6)
const inviteOk = computed(() => {
  const c = form.value.inviteCode.trim()
  return c.length >= 4 && c.length <= 6
})
const canSubmit = computed(
  () => phoneOk.value && pwdOk.value && inviteOk.value && agreed.value
)

const pwdLevel = ref(0)
const pwdPercent = ref(0)
const pwdHint = ref('')

onLoad((opts) => {
  if (opts?.redirect) redirectUrl.value = decodeURIComponent(opts.redirect as string)
  if (opts?.code) form.value.inviteCode = String(opts.code).toUpperCase()
  const saved = uni.getStorageSync('saved_phone')
  if (saved && !form.value.phone) form.value.phone = String(saved)
})

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
})

function goBack() {
  uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/auth/login' }) })
}

function goLogin() {
  uni.navigateTo({
    url: `/pages/auth/login${buildAuthQuery(redirectUrl.value)}`,
  })
}

function openAgreement(type: string) {
  uni.showToast({
    title: type === 'user' ? '用户协议' : '隐私政策',
    icon: 'none',
  })
}

function onPhoneBlur() {
  focus.phone = false
  errors.phone = form.value.phone.length > 0 && !phoneOk.value
}

function onPwdBlur() {
  focus.password = false
  errors.password = form.value.password.length > 0 && !pwdOk.value
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
  pwdHint.value = p.length ? hints[level] || '继续输入' : ''
}

function onInviteInput() {
  form.value.inviteCode = form.value.inviteCode.toUpperCase().replace(/\s/g, '')
}

function onInviteBlur() {
  focus.invite = false
  const c = form.value.inviteCode.trim()
  errors.invite = c.length > 0 && !inviteOk.value
}

async function doRegister() {
  if (submitting.value) return
  errors.phone = !phoneOk.value
  errors.password = !pwdOk.value
  errors.invite = !inviteOk.value

  if (!agreed.value) {
    return uni.showToast({ title: '请先勾选用户协议', icon: 'none' })
  }
  if (!canSubmit.value) {
    return uni.showToast({ title: '请完善注册信息', icon: 'none' })
  }

  submitting.value = true
  uni.showLoading({ title: '注册中', mask: true })
  try {
    await authApi.register(
      form.value.phone,
      form.value.password,
      form.value.inviteCode.trim()
    )
    uni.setStorageSync('saved_phone', form.value.phone)
    const { assetStore } = await import('@/store/asset')
    await assetStore.fetchBalance()
    uni.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => navigateAfterAuth(redirectUrl.value), 700)
  } catch (e: any) {
    uni.showToast({ title: e.message || '注册失败，请重试', icon: 'none' })
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
</style>
