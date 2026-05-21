<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">提交工单</text>
      <text class="nav-placeholder" />
    </view>

    <view class="form-card">
      <text class="label">问题类型</text>
      <picker :range="typeLabels" @change="onTypeChange">
        <view class="picker-val">{{ typeLabels[typeIndex] }}</view>
      </picker>

      <text class="label">标题</text>
      <input v-model="title" class="input" placeholder="简要描述问题" maxlength="50" />

      <text class="label">详细说明</text>
      <textarea v-model="content" class="textarea" placeholder="请描述您遇到的问题" maxlength="500" />

      <text class="label">关联订单号（选填）</text>
      <input v-model="orderNo" class="input" placeholder="如有订单请填写" />
    </view>

    <view class="btn-primary submit-btn" @click="submit">提交</view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ticketApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const typeValues = [1, 2, 3, 4, 5, 6, 7, 8]
const typeLabels = ['订单问题', '物流咨询', '积分问题', '理财问题', '商品售后', '功能建议', '投诉建议', '其他']
const typeIndex = ref(7)
const title = ref('')
const content = ref('')
const orderNo = ref('')
const submitting = ref(false)

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  requireAuth()
})

function onTypeChange(e: any) {
  typeIndex.value = Number(e.detail.value)
}

function goBack() {
  uni.navigateBack()
}

async function submit() {
  if (!requireAuth()) return
  if (!title.value.trim()) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  if (!content.value.trim()) {
    uni.showToast({ title: '请填写问题说明', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    await ticketApi.create({
      type: typeValues[typeIndex.value],
      title: title.value.trim(),
      content: content.value.trim(),
      orderNo: orderNo.value.trim() || undefined,
    })
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e: any) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: $bg-primary;
  padding: 0 $spacing-base;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0 24rpx;
  .nav-back { font-size: 40rpx; }
  .nav-title { font-size: 34rpx; font-weight: 700; }
  .nav-placeholder { width: 40rpx; }
}

.form-card {
  padding: $spacing-base;
  background: $bg-secondary;
  border-radius: $radius-md;
  .label { font-size: 26rpx; color: $text-muted; display: block; margin: 16rpx 0 8rpx; }
  .picker-val, .input, .textarea {
    width: 100%;
    padding: 20rpx;
    background: $bg-primary;
    border-radius: $radius-sm;
    font-size: 28rpx;
  }
  .textarea { min-height: 200rpx; }
}

.submit-btn {
  margin-top: 48rpx;
  text-align: center;
  padding: 24rpx;
  background: $primary;
  color: #fff;
  border-radius: $radius-full;
  font-size: 30rpx;
}
</style>
