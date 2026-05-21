<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">客服中心</text>
      <text class="nav-action" @click="goCreate">提交工单</text>
    </view>

    <view v-if="onlineInfo" class="online-card">
      <text class="online-title">在线客服</text>
      <text class="online-desc">{{ onlineInfo.tip }}</text>
      <text class="online-time">服务时间 {{ onlineInfo.workTime }}</text>
      <text v-if="onlineInfo.hotline" class="online-time">热线 {{ onlineInfo.hotline }}</text>
    </view>

    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore">
      <view v-for="t in list" :key="t.ticketId" class="ticket-card" @click="goDetail(t)">
        <view class="ticket-head">
          <text class="ticket-no">{{ t.ticketNo }}</text>
          <text class="ticket-status">{{ t.statusName }}</text>
        </view>
        <text class="ticket-title">{{ t.title }}</text>
        <text class="ticket-type">{{ t.typeName }}</text>
        <text class="ticket-msg">{{ t.lastMessage || '等待客服回复' }}</text>
      </view>
      <view v-if="!loading && !list.length" class="empty">暂无工单，点击右上角提交</view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ticketApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const list = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const onlineInfo = ref<any>(null)

onMounted(async () => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  try {
    onlineInfo.value = await ticketApi.getOnline()
  } catch {
    onlineInfo.value = { workTime: '09:00-21:00', tip: '提交工单后客服将尽快回复' }
  }
  if (!requireAuth()) return
  loadData(true)
})

async function loadData(reset = false) {
  if (loading.value) return
  if (reset) {
    page.value = 1
    hasMore.value = true
    list.value = []
  }
  if (!hasMore.value) return
  loading.value = true
  try {
    const res = await ticketApi.getList({ page: page.value, limit: 20 })
    const rows = res.list || []
    list.value = reset ? rows : [...list.value, ...rows]
    hasMore.value = rows.length >= 20
    page.value++
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function loadMore() {
  loadData()
}

function goBack() {
  uni.navigateBack()
}

function goCreate() {
  if (!requireAuth()) return
  uni.navigateTo({ url: '/pages/user/service-create' })
}

function goDetail(t: any) {
  uni.navigateTo({ url: `/pages/user/service-detail?id=${t.ticketId}` })
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
  padding: 16rpx 0;
  .nav-back { font-size: 40rpx; }
  .nav-title { flex: 1; text-align: center; font-size: 34rpx; font-weight: 700; }
  .nav-action { font-size: 26rpx; color: $primary; }
}

.online-card {
  padding: $spacing-base;
  background: rgba(154, 123, 79, 0.08);
  border-radius: $radius-md;
  margin-bottom: $spacing-base;
  .online-title { font-size: 30rpx; font-weight: 700; display: block; }
  .online-desc, .online-time { font-size: 24rpx; color: $text-muted; display: block; margin-top: 8rpx; }
}

.list-scroll {
  height: calc(100vh - 280rpx);
}

.ticket-card {
  padding: $spacing-base;
  background: $bg-secondary;
  border-radius: $radius-md;
  margin-bottom: $spacing-sm;
  .ticket-head { display: flex; justify-content: space-between; }
  .ticket-no { font-size: 22rpx; color: $text-muted; }
  .ticket-status { font-size: 24rpx; color: $primary; }
  .ticket-title { font-size: 28rpx; font-weight: 600; margin: 8rpx 0; display: block; }
  .ticket-type { font-size: 22rpx; color: $text-muted; }
  .ticket-msg { font-size: 24rpx; color: $text-secondary; margin-top: 8rpx; display: block; }
}

.empty {
  text-align: center;
  padding: 80rpx 0;
  color: $text-muted;
}
</style>
