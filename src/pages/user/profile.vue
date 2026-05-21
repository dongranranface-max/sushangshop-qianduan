<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">个人资料</text>
      <text class="nav-placeholder" />
    </view>

    <view class="form-card glass-card">
      <view class="form-row">
        <text class="label">手机号</text>
        <text class="value">{{ profile.phone || '-' }}</text>
      </view>
      <view class="form-row">
        <text class="label">昵称</text>
        <input v-model="nickname" class="input" placeholder="请输入昵称" maxlength="20" />
      </view>
      <view class="form-row">
        <text class="label">会员等级</text>
        <text class="value">{{ profile.levelName || profile.level || 'V1' }}</text>
      </view>
    </view>

    <view class="btn-primary submit-btn" @click="save">保存</view>
    <view class="safe-area-bottom" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const profile = ref<any>({})
const nickname = ref('')

onMounted(async () => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  if (!requireAuth()) return
  try {
    profile.value = await userApi.getProfile()
    nickname.value = profile.value.nickname || ''
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  }
})

function goBack() {
  uni.navigateBack()
}

async function save() {
  try {
    await userApi.updateProfile({ nickname: nickname.value })
    uni.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e: any) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  padding: 0 $spacing-base;
  background: $bg-primary;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0 24rpx;
  .nav-back { font-size: 40rpx; color: $text-primary; }
  .nav-title { font-size: 34rpx; font-weight: 700; color: $text-primary; }
  .nav-placeholder { width: 40rpx; }
}

.form-card {
  padding: $spacing-base;
  margin-bottom: 32rpx;
}

.form-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid $border-light;
  .label { width: 160rpx; font-size: 28rpx; color: $text-muted; }
  .value { flex: 1; font-size: 28rpx; color: $text-primary; }
  .input { flex: 1; font-size: 28rpx; color: $text-primary; }
}

.submit-btn {
  margin: 48rpx 0;
  text-align: center;
  padding: 28rpx;
  border-radius: $radius-lg;
}
</style>
