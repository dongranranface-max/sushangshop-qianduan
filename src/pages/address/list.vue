<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="page-header">
      <text class="back" @click="goBack">&lt;</text>
      <text class="page-title">收货地址</text>
      <text class="add-btn" @click="goAdd">+ 新增</text>
    </view>

    <view v-if="addresses.length === 0" class="empty">
      <text class="empty-icon">📍</text>
      <text>暂无收货地址</text>
      <view class="add-empty" @click="goAdd">添加地址</view>
    </view>

    <view v-else class="address-list">
      <view
        v-for="addr in addresses"
        :key="addr.id"
        :class="['address-card', { default: addr.isDefault === 1 }]"
      >
        <view class="addr-info" @click="selectAddr(addr)">
          <view class="user-row">
            <text class="name">{{ addr.consignee }}</text>
            <text class="phone">{{ addr.phone }}</text>
            <view v-if="addr.isDefault === 1" class="default-tag">默认</view>
          </view>
          <text class="address-text">{{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}</text>
        </view>
        <view class="addr-actions">
          <view @click="setDefault(addr)">
            <text>{{ addr.isDefault === 1 ? '✓ 默认地址' : '设为默认' }}</text>
          </view>
          <view class="action-right">
            <text @click="goEdit(addr)">编辑</text>
            <text @click="deleteAddr(addr)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { addressApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const addresses = ref<any[]>([])

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  if (!requireAuth()) return
  loadData()
})

async function loadData() {
  try {
    const list = await addressApi.list()
    addresses.value = list || []
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  }
}

function goBack() { uni.navigateBack() }

function goAdd() {
  uni.navigateTo({ url: '/pages/address/edit' })
}

function goEdit(addr: any) {
  uni.navigateTo({ url: `/pages/address/edit?id=${addr.id}` })
}

function selectAddr(addr: any) {
  // 通过 storage 传递给确认页
  uni.setStorageSync('selectedAddress', addr)
  uni.navigateBack()
}

async function setDefault(addr: any) {
  try {
    await addressApi.setDefault(addr.id)
    uni.showToast({ title: '设置成功', icon: 'success' })
    loadData()
  } catch (e: any) {
    uni.showToast({ title: e.message || '设置失败', icon: 'none' })
  }
}

async function deleteAddr(addr: any) {
  uni.showModal({
    title: '确认删除',
    content: '确定删除该地址吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await addressApi.delete(addr.id)
        uni.showToast({ title: '已删除', icon: 'success' })
        loadData()
      } catch (e: any) {
        uni.showToast({ title: e.message || '删除失败', icon: 'none' })
      }
    },
  })
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

  .back { font-size: 40rpx; color: $text-primary; }
  .page-title { font-size: 36rpx; font-weight: 700; color: $text-primary; flex: 1; }
  .add-btn { font-size: 28rpx; color: $primary; }
}

.empty {
  text-align: center;
  padding: 120rpx 0;
  font-size: 28rpx;
  color: $text-muted;

  .empty-icon { font-size: 120rpx; display: block; }
  .add-empty {
    display: inline-block;
    margin-top: $spacing-xl;
    background: $primary;
    color: #000;
    padding: 16rpx 48rpx;
    border-radius: 50rpx;
    font-size: 28rpx;
  }
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-base;
}

.address-card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: $spacing-base $spacing-lg;
  border: 1rpx solid $border-color;

  &.default {
    border-color: $primary;
  }

  .addr-info {
    padding-bottom: $spacing-sm;
    border-bottom: 1rpx solid $border-color;

    .user-row {
      display: flex;
      align-items: center;
      gap: $spacing-sm;

      .name { font-size: 30rpx; font-weight: 600; color: $text-primary; }
      .phone { font-size: 26rpx; color: $text-secondary; }
      .default-tag {
        background: $primary; color: #000;
        font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 8rpx;
      }
    }

    .address-text {
      font-size: 26rpx;
      color: $text-secondary;
      display: block;
      margin-top: 8rpx;
      line-height: 1.6;
    }
  }

  .addr-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $spacing-sm;
    font-size: 26rpx;
    color: $primary;

    .action-right {
      display: flex;
      gap: $spacing-lg;
      color: $text-secondary;
    }
  }
}
</style>
