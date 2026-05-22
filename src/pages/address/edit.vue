<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="page-header">
      <text class="back" @click="goBack">{{ isEdit ? '&lt;' : '×' }}</text>
      <text class="page-title">{{ isEdit ? '编辑地址' : '新增地址' }}</text>
    </view>

    <view class="form">
      <view class="form-item">
        <text class="label">收货人</text>
        <input v-model="form.consignee" class="input" placeholder="请输入收货人姓名" />
      </view>
      <view class="form-item">
        <text class="label">手机号</text>
        <input v-model="form.phone" class="input" type="number" placeholder="请输入手机号" />
      </view>
      <view class="form-item">
        <text class="label">省份</text>
        <input v-model="form.province" class="input" placeholder="如：北京市" />
      </view>
      <view class="form-item">
        <text class="label">城市</text>
        <input v-model="form.city" class="input" placeholder="如：朝阳区" />
      </view>
      <view class="form-item">
        <text class="label">区县</text>
        <input v-model="form.district" class="input" placeholder="如：三元桥" />
      </view>
      <view class="form-item">
        <text class="label">详细地址</text>
        <textarea v-model="form.detail" class="textarea" placeholder="请输入详细地址" />
      </view>
      <view class="form-item default-row">
        <text class="label">设为默认地址</text>
        <switch v-model="form.isDefault" color="#C4A574" />
      </view>
    </view>

    <view class="submit-btn" @click="doSubmit">{{ isEdit ? '保存修改' : '确认添加' }}</view>
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { addressApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const addressId = ref('')
const form = ref({
  consignee: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false,
})

const isEdit = computed(() => !!addressId.value)
const submitting = ref(false)

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  if (!requireAuth()) return

  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const opts = (current as any).options || {}
  addressId.value = opts.id || ''

  if (addressId.value) {
    loadAddress()
  }
})

async function loadAddress() {
  try {
    const list = await addressApi.list()
    const addr = (list as any[]).find((a: any) => a.id === addressId.value)
    if (addr) {
      form.value = {
        consignee: addr.consignee || '',
        phone: addr.phone || '',
        province: addr.province || '',
        city: addr.city || '',
        district: addr.district || '',
        detail: addr.detail || '',
        isDefault: addr.isDefault === 1,
      }
    }
  } catch { /* ignore */ }
}

function goBack() { uni.navigateBack() }

async function doSubmit() {
  if (!form.value.consignee) return uni.showToast({ title: '请输入收货人', icon: 'none' })
  if (!form.value.phone) return uni.showToast({ title: '请输入手机号', icon: 'none' })
  if (!form.value.province || !form.value.city || !form.value.district) return uni.showToast({ title: '请填写完整地址', icon: 'none' })
  if (!form.value.detail) return uni.showToast({ title: '请输入详细地址', icon: 'none' })

  const data = {
    ...form.value,
    isDefault: form.value.isDefault ? 1 : 0,
  }

  uni.showLoading()
  submitting.value = true
  try {
    const payload = {
      consignee: form.value.consignee,
      phone: form.value.phone,
      province: form.value.province,
      city: form.value.city,
      district: form.value.district,
      detail: form.value.detail,
      isDefault: form.value.isDefault ? 1 : 0,
    }
    if (isEdit.value) {
      await addressApi.update(addressId.value, payload)
    } else {
      await addressApi.create(payload)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    uni.hideLoading()
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.page-container { @include tab-page-shell; }

.page-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base) 0;

  .back { font-size: 40rpx; color: var(--text-primary); }
  .page-title { font-size: 36rpx; font-weight: 700; color: var(--text-primary); }
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);

  .form-item {
    .label {
      font-size: 26rpx;
      color: var(--text-secondary);
      display: block;
      margin-bottom: 8rpx;
    }

    .input {
      @include premium-surface($bg-secondary);
      border-radius: $radius-sm;
      padding: 20rpx var(--spacing-base);
      font-size: 30rpx;
      color: var(--text-primary);
      width: 100%;
      box-sizing: border-box;
    }

    .textarea {
      @include premium-surface($bg-secondary);
      border-radius: $radius-sm;
      padding: 20rpx var(--spacing-base);
      font-size: 30rpx;
      color: var(--text-primary);
      width: 100%;
      box-sizing: border-box;
      min-height: 160rpx;
    }
  }

  .default-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .label { margin-bottom: 0; }
  }
}

.submit-btn {
  background: $accent-fire;
  color: $text-inverse;
  font-size: 32rpx;
  font-weight: 700;
  text-align: center;
  padding: var(--spacing-base);
  border-radius: 50rpx;
  margin: var(--spacing-xl) 0;
}
</style>
