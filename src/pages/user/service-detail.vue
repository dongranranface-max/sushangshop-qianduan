<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">工单详情</text>
      <text class="nav-placeholder" />
    </view>

    <view v-if="detail.ticketId" class="head-card">
      <text class="head-title">{{ detail.title }}</text>
      <text class="head-meta">{{ detail.ticketNo }} · {{ detail.typeName }} · {{ detail.statusName }}</text>
    </view>

    <scroll-view class="msg-scroll" scroll-y>
      <view v-for="(m, i) in detail.messages" :key="i" class="msg" :class="'msg--' + m.role">
        <text class="msg-role">{{ m.role === 'admin' ? '客服' : '我' }}</text>
        <text class="msg-content">{{ m.content }}</text>
      </view>
    </scroll-view>

    <view v-if="detail.status && detail.status < 4" class="reply-bar">
      <input v-model="replyText" class="reply-input" placeholder="补充说明" />
      <text class="reply-btn" @click="sendReply">发送</text>
    </view>
    <view v-if="detail.status === 3" class="confirm-bar">
      <view class="btn-confirm" @click="confirmResolved">确认已解决</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ticketApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const ticketId = ref('')
const detail = ref<any>({})
const replyText = ref('')

onLoad((q) => {
  ticketId.value = (q?.id as string) || ''
})

onMounted(async () => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  if (!requireAuth() || !ticketId.value) return
  await loadDetail()
})

async function loadDetail() {
  try {
    detail.value = await ticketApi.getDetail(ticketId.value)
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  }
}

function goBack() {
  uni.navigateBack()
}

async function sendReply() {
  if (!replyText.value.trim()) return
  try {
    await ticketApi.reply(ticketId.value, { content: replyText.value.trim() })
    replyText.value = ''
    uni.showToast({ title: '已发送', icon: 'success' })
    await loadDetail()
  } catch (e: any) {
    uni.showToast({ title: e.message || '发送失败', icon: 'none' })
  }
}

async function confirmResolved() {
  try {
    await ticketApi.confirm(ticketId.value)
    uni.showToast({ title: '已确认', icon: 'success' })
    await loadDetail()
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: $bg-primary;
  padding: 0 $spacing-base;
  padding-bottom: 160rpx;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  .nav-back { font-size: 40rpx; }
  .nav-title { font-size: 34rpx; font-weight: 700; }
  .nav-placeholder { width: 40rpx; }
}

.head-card {
  padding: $spacing-base;
  background: $bg-secondary;
  border-radius: $radius-md;
  margin-bottom: $spacing-base;
  .head-title { font-size: 30rpx; font-weight: 700; display: block; }
  .head-meta { font-size: 22rpx; color: $text-muted; margin-top: 8rpx; display: block; }
}

.msg-scroll {
  height: calc(100vh - 360rpx);
}

.msg {
  margin-bottom: $spacing-base;
  padding: $spacing-base;
  border-radius: $radius-md;
  &--user { background: $bg-secondary; }
  &--admin { background: rgba(154, 123, 79, 0.12); }
  .msg-role { font-size: 22rpx; color: $text-muted; display: block; }
  .msg-content { font-size: 28rpx; margin-top: 8rpx; display: block; line-height: 1.5; }
}

.reply-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 16rpx $spacing-base;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: $bg-secondary;
  border-top: 1rpx solid $border-primary;
  .reply-input { flex: 1; padding: 16rpx; background: $bg-primary; border-radius: $radius-sm; }
  .reply-btn { margin-left: 16rpx; color: $primary; font-size: 28rpx; }
}

.confirm-bar {
  position: fixed;
  left: $spacing-base;
  right: $spacing-base;
  bottom: calc(32rpx + env(safe-area-inset-bottom));
  .btn-confirm {
    text-align: center;
    padding: 24rpx;
    background: $primary;
    color: #fff;
    border-radius: $radius-full;
  }
}
</style>
