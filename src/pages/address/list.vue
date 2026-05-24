<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">收货地址</text>
      <view class="page-nav__action" @click="goAdd"><text>+ 新增</text></view>
    </view>

    <!-- 空状态 -->
    <view v-if="!loading && !addresses.length" class="empty-state">
      <view class="empty-state__icon">址</view>
      <text class="empty-state__text">暂无收货地址</text>
      <text class="empty-state__sub">添加收货地址，购物更方便</text>
      <view class="empty-state__btn" @click="goAdd"><text>添加地址</text></view>
    </view>

    <!-- 地址列表 -->
    <scroll-view v-else class="address-list" scroll-y>
      <view
        v-for="addr in addresses"
        :key="addr.id"
        class="address-card"
        :class="{ 'is-default': addr.isDefault === 1 }"
        @click="selectAddr(addr)"
      >
        <view class="address-card__inner">
          <view class="address-card__top">
            <view class="address-card__user">
              <text class="user-name">{{ addr.consignee }}</text>
              <text class="user-phone">{{ addr.phone }}</text>
              <view v-if="addr.isDefault === 1" class="default-badge">默认</view>
            </view>
          </view>
          <text class="address-card__detail">
            {{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}
          </text>
        </view>
        <view class="address-card__actions" @click.stop>
          <view class="action-btn" @click="setDefault(addr)">
            <text>{{ addr.isDefault === 1 ? '✓ 默认' : '设为默认' }}</text>
          </view>
          <view class="action-group">
            <view class="action-btn" @click="goEdit(addr)"><text>编辑</text></view>
            <view class="action-btn action-btn--danger" @click="deleteAddr(addr)"><text>删除</text></view>
          </view>
        </view>
      </view>
      <view class="list-bottom" />
    </scroll-view>

    <view class="safe-area-bottom" :style="{ height: safeAreaBottom + 'px' }" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { addressApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const addresses = ref<any[]>([])
const loading = ref(false)

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
  if (!requireAuth()) return
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const list = await addressApi.list()
    addresses.value = list || []
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goBack() { uni.navigateBack() }

function goAdd() { uni.navigateTo({ url: '/pages/address/edit' }) }
function goEdit(addr: any) { uni.navigateTo({ url: `/pages/address/edit?id=${addr.id}` }) }

function selectAddr(addr: any) {
  uni.setStorageSync('selectedAddress', addr)
  uni.navigateBack()
}

async function setDefault(addr: any) {
  if (addr.isDefault === 1) return
  try {
    await addressApi.setDefault(addr.id)
    uni.showToast({ title: '设置成功', icon: 'success' })
    loadData()
  } catch (e: any) {
    uni.showToast({ title: e.message || '设置失败', icon: 'none' })
  }
}

function deleteAddr(addr: any) {
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
  @include page-bg;
}

.status-bar { width: 100%; }

.page-nav {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx $spacing-base;

  &__back,
  &__action {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    border: 1rpx solid rgba(20, 20, 20, 0.06);
    border-radius: 50%;
    font-size: 28rpx;
    color: $mineral-gray;
    flex-shrink: 0;
  }

  &__title {
    flex: 1;
    font-size: 32rpx;
    font-weight: 700;
    color: $mineral-gray;
    text-align: center;
    letter-spacing: 0.5rpx;
  }

  &__action {
    font-size: 24rpx;
    font-weight: 600;
    color: $accent-dark;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 40rpx;
  text-align: center;

  &__icon {
    width: 140rpx;
    height: 140rpx;
    line-height: 140rpx;
    text-align: center;
    font-size: 56rpx;
    font-weight: 800;
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: 50%;
    color: $accent-dark;
    margin-bottom: 32rpx;
  }

  &__text {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 12rpx;
  }

  &__sub {
    font-size: 26rpx;
    color: $text-muted;
    margin-bottom: 40rpx;
  }

  &__btn {
    height: 80rpx;
    padding: 0 56rpx;
    background: $btn-gold-gradient;
    border-radius: $radius-full;
    box-shadow: $btn-gold-shadow;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      font-size: 30rpx;
      font-weight: 700;
      color: #fff;
      letter-spacing: 1rpx;
    }
  }
}

.address-list {
  height: calc(100vh - 120rpx);
  padding: 0 $spacing-base;
}

.address-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;
  margin-top: $spacing-base;
  overflow: hidden;
  transition: border-color 0.2s ease;

  &.is-default {
    border-color: rgba(184, 152, 118, 0.30);
    box-shadow: 0 4rpx 24rpx rgba(184, 152, 118, 0.12);
  }

  &__inner {
    padding: $spacing-base $spacing-lg;
  }

  &__top {
    margin-bottom: 10rpx;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 10rpx;

    .user-name {
      font-size: 30rpx;
      font-weight: 700;
      color: $text-primary;
    }

    .user-phone {
      font-size: 26rpx;
      color: $text-secondary;
    }

    .default-badge {
      padding: 3rpx 12rpx;
      background: rgba(184, 152, 118, 0.12);
      color: $accent-dark;
      border: 1rpx solid rgba(184, 152, 118, 0.25);
      border-radius: 20rpx;
      font-size: 20rpx;
      font-weight: 600;
    }
  }

  &__detail {
    font-size: 26rpx;
    color: $text-muted;
    line-height: 1.5;
    display: block;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx $spacing-lg;
    border-top: 1rpx solid $border-light;
  }
}

.action-btn {
  font-size: 26rpx;
  color: $mineral-gray;
  font-weight: 500;
  padding: 8rpx 0;

  &--danger { color: $text-muted; }
}

.action-group {
  display: flex;
  gap: 32rpx;
}

.list-bottom { height: 40rpx; }
</style>