<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="page-header">
      <text class="back" @click="goBack">&lt;</text>
      <text class="page-title">绑定银行卡</text>
    </view>

    <view class="notice">
      <text>⚠️ 绑定银行卡用于换购商城的资金结算，请务必填写真实信息</text>
    </view>

    <view class="form">
      <view class="form-item">
        <text class="label">持卡人姓名</text>
        <input v-model="form.realName" class="input" placeholder="请输入持卡人姓名" />
      </view>
      <view class="form-item">
        <text class="label">银行卡号</text>
        <input v-model="form.bankCard" class="input" type="number" placeholder="请输入银行卡号" @input="formatCard" />
      </view>
      <view class="form-item">
        <text class="label">开户行</text>
        <input v-model="form.bankName" class="input" placeholder="如：中国工商银行北京分行" />
      </view>
      <view class="form-item">
        <text class="label">预留手机号</text>
        <input v-model="form.phone" class="input" type="number" placeholder="银行预留手机号" />
      </view>
    </view>

    <view class="submit-btn" @click="doSubmit">确认绑定</view>

    <view v-if="hasCard" class="current-card">
      <text class="card-label">当前绑定</text>
      <view class="card-info">
        <text>{{ maskCard(bankCard) }}</text>
        <text class="bank-name">{{ bankName }}</text>
      </view>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const hasCard = ref(false)
const bankCard = ref('')
const bankName = ref('')
const loading = ref(false)

const form = ref({
  realName: '',
  bankCard: '',
  bankName: '',
  phone: '',
})

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  if (!requireAuth()) return
  loadCurrentCard()
})

async function loadCurrentCard() {
  try {
    const profile = await userApi.getProfile()
    if (profile.bankCard) {
      hasCard.value = true
      bankCard.value = profile.bankCard.bankCard || ''
      bankName.value = profile.bankCard.bankName || ''
    }
  } catch { /* ignore */ }
}

function goBack() {
  uni.navigateBack()
}

function formatCard() {
  // 每4位空格
}

function maskCard(no: string) {
  if (!no || no.length < 8) return no
  return no.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2')
}

async function doSubmit() {
  if (!form.value.realName) return uni.showToast({ title: '请输入姓名', icon: 'none' })
  if (!form.value.bankCard || form.value.bankCard.length < 16) return uni.showToast({ title: '请输入正确卡号', icon: 'none' })
  if (!form.value.bankName) return uni.showToast({ title: '请输入开户行', icon: 'none' })

  uni.showLoading()
  loading.value = true
  try {
    await userApi.bindBankCard({
      bankName: form.value.bankName,
      bankCard: form.value.bankCard,
      realName: form.value.realName,
      phone: form.value.phone,
    })
    uni.showToast({ title: '绑定成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch {
    uni.showToast({ title: '绑定失败', icon: 'none' })
  } finally {
    uni.hideLoading()
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: $bg-primary;
  padding: 0 $spacing-lg;
}

.page-header {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: $spacing-base 0;

  .back {
    font-size: 40rpx;
    color: $text-primary;
  }

  .page-title {
    font-size: 36rpx;
    font-weight: 700;
    color: $text-primary;
  }
}

.notice {
  background: rgba($danger, 0.1);
  border: 1rpx solid rgba($danger, 0.3);
  border-radius: $radius-sm;
  padding: $spacing-sm $spacing-base;
  font-size: 24rpx;
  color: $danger;
  margin-bottom: $spacing-xl;
}

.form {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  .form-item {
    .label {
      font-size: 26rpx;
      color: $text-secondary;
      display: block;
      margin-bottom: 8rpx;
    }

    .input {
      background: $bg-card;
      border: 1rpx solid $border-color;
      border-radius: $radius-sm;
      padding: 20rpx $spacing-base;
      font-size: 30rpx;
      color: $text-primary;
    }
  }
}

.submit-btn {
  background: $primary;
  color: #000;
  font-size: 32rpx;
  font-weight: 700;
  text-align: center;
  padding: $spacing-base;
  border-radius: 50rpx;
  margin: $spacing-xl 0;
}

.current-card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: $spacing-base $spacing-lg;
  border: 1rpx solid $border-color;

  .card-label {
    font-size: 24rpx;
    color: $text-muted;
    display: block;
    margin-bottom: 8rpx;
  }

  .card-info {
    display: flex;
    justify-content: space-between;

    text {
      font-size: 28rpx;
      color: $text-primary;
    }

    .bank-name {
      color: $text-secondary;
    }
  }
}
</style>
