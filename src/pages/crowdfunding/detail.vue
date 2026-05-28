<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 导航栏 -->
    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">众筹详情</text>
      <view class="page-nav__action" />
    </view>

    <scroll-view scroll-y class="detail-body">
      <!-- 加载状态 -->
      <view v-if="loading" class="skeleton-detail">
        <view class="sk-cover shimmer" />
        <view class="sk-info">
          <view class="sk-line shimmer" style="width:80%" />
          <view class="sk-line shimmer" style="width:55%" />
          <view class="sk-bar shimmer" />
        </view>
      </view>

      <template v-else-if="item">
        <!-- 封面图 -->
        <image class="detail-cover" :src="item.coverImage || '/static/logo.png'" mode="aspectFill" />

        <!-- 状态标签 -->
        <view class="detail-status">
          <view class="detail-status__badge" :class="`detail-status__badge--${item.status}`">
            <text>{{ STATUS_MAP[item.status] }}</text>
          </view>
          <text class="detail-status__category">{{ item.categoryName }}</text>
        </view>

        <!-- 基础信息 -->
        <view class="info-card">
          <text class="info-card__name">{{ item.name }}</text>
          <text class="info-card__desc">{{ item.description }}</text>
        </view>

        <!-- 筹款进度 -->
        <view class="progress-card">
          <view class="progress-header">
            <text class="progress-header__title">筹款进度</text>
            <text class="progress-header__pct">{{ Math.round(item.currentAmount / item.targetAmount * 100) }}%</text>
          </view>
          <view class="progress-track">
            <view
              class="progress-fill"
              :style="{ width: Math.min(item.currentAmount / item.targetAmount * 100, 100) + '%' }"
            />
          </view>
          <view class="progress-stats">
            <view class="p-stat">
              <text class="p-stat__val">¥{{ formatAmt(item.currentAmount) }}</text>
              <text class="p-stat__lab">已筹金额</text>
            </view>
            <view class="p-stat">
              <text class="p-stat__val">¥{{ formatAmt(item.targetAmount) }}</text>
              <text class="p-stat__lab">目标金额</text>
            </view>
            <view class="p-stat">
              <text class="p-stat__val">{{ item.supporterCount }}</text>
              <text class="p-stat__lab">支持者</text>
            </view>
          </view>
        </view>

        <!-- 倒计时 -->
        <view class="countdown-card" v-if="item.status === 'ongoing'">
          <text class="countdown-card__label">距离结束</text>
          <view class="countdown-card__timer">
            <view class="timer-unit" v-if="countdown.d > 0">
              <text class="timer-unit__num">{{ String(countdown.d).padStart(2, '0') }}</text>
              <text class="timer-unit__sep">天</text>
            </view>
            <view class="timer-unit">
              <text class="timer-unit__num">{{ String(countdown.h).padStart(2, '0') }}</text>
              <text class="timer-unit__sep">:</text>
            </view>
            <view class="timer-unit">
              <text class="timer-unit__num">{{ String(countdown.d).padStart(2, '0') }}</text>
              <text class="timer-unit__sep">:</text>
            </view>
            <view class="timer-unit">
              <text class="timer-unit__num">{{ String(countdown.s).padStart(2, '0') }}</text>
              <text class="timer-unit__sep" />
            </view>
          </view>
        </view>

        <!-- 项目详情 -->
        <view class="detail-card">
          <text class="detail-card__title">项目详情</text>
          <view class="detail-card__content">
            <view class="detail-row">
              <text class="detail-row__label">起投金额</text>
              <text class="detail-row__val">¥{{ item.minAmount }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-row__label">回报类型</text>
              <text class="detail-row__val">{{ item.returnType || '实物+积分' }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-row__label">项目周期</text>
              <text class="detail-row__val">{{ item.duration || '约90天' }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-row__label">发起时间</text>
              <text class="detail-row__val">{{ item.startTime || '2026-01-01' }}</text>
            </view>
          </view>
        </view>

        <!-- 回报说明 -->
        <view class="reward-card" v-if="item.rewards?.length">
          <text class="reward-card__title">回报方案</text>
          <view v-for="reward in item.rewards" :key="reward.level" class="reward-item">
            <view class="reward-item__header">
              <text class="reward-item__amount">¥{{ reward.amount }}</text>
              <text class="reward-item__name">{{ reward.name }}</text>
            </view>
            <text class="reward-item__desc">{{ reward.description }}</text>
            <text class="reward-item__limit">限{{ reward.limitCount }}份 | 剩余{{ reward.remainCount }}份</text>
          </view>
        </view>
      </template>

      <!-- 空状态 -->
      <view v-else-if="!loading" class="empty-state">
        <view class="empty-state__icon">筹</view>
        <text class="empty-state__text">项目不存在</text>
        <view class="empty-state__btn" @click="goBack"><text>返回</text></view>
      </view>

      <view class="bottom-placeholder" :style="{ height: (160 + safeAreaBottom) + 'px' }" />
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="item && item.status === 'ongoing'" class="action-bar">
      <view class="action-bar__inner">
        <view class="action-info">
          <text class="action-info__label">参与金额</text>
          <view class="action-info__input-wrap">
            <text class="action-info__yuan">¥</text>
            <input
              class="action-info__input"
              type="digit"
              v-model="investAmount"
              :placeholder="'起投 ' + item.minAmount"
              @input="onAmountInput"
            />
          </view>
        </view>
        <view class="action-btn" :class="{ 'action-btn--disabled': !canInvest }" @click="doInvest">
          <text>立即参与</text>
        </view>
      </view>
    </view>

    <view class="safe-area-bottom" :style="{ height: safeAreaBottom + 'px' }" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const loading = ref(false)
const investAmount = ref('')
const countdown = ref({ d: 0, h: 0, m: 0, s: 0 })
let countdownTimer: ReturnType<typeof setInterval> | null = null

interface CrowdfundingItem {
  id: string; name: string; description: string; coverImage?: string
  targetAmount: number; currentAmount: number; minAmount: number
  supporterCount: number; remainingDays: number; status: string
  categoryName?: string; returnType?: string; duration?: string
  startTime?: string; rewards?: { level: number; amount: number; name: string; description: string; limitCount: number; remainCount: number }[]
  endTime?: string
}

const item = ref<CrowdfundingItem | null>(null)
const STATUS_MAP: Record<string, string> = {
  ongoing: '众筹中', finished: '已结束', succeeded: '成功', failed: '失败',
}

const canInvest = computed(() => {
  if (!item.value) return false
  const n = parseFloat(investAmount.value)
  return !isNaN(n) && n >= item.value.minAmount
})

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0

  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const opts = (current as unknown as { options?: Record<string, string> })?.options || {}
  const id = opts.id || ''
  loadDetail(id)
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

async function loadDetail(id: string) {
  loading.value = true
  try {
    // TODO: 替换为真实 API: crowdfundingApi.getDetail(id)
    await new Promise(r => setTimeout(r, 500))
    const mock: CrowdfundingItem = {
      id, name: '有机生态大米众筹计划', description: '来自东北黑土地的优质有机大米，全程生态种植，支持者享有实物大米回报和消费积分返还。项目周期约90天，预计回报率8%-15%。',
      coverImage: '/static/logo.png', targetAmount: 500000, currentAmount: 328000, minAmount: 500,
      supporterCount: 1280, remainingDays: 12, status: 'ongoing', categoryName: '消费众筹',
      returnType: '实物+积分', duration: '约90天', startTime: '2026-05-01',
      rewards: [
        { level: 1, amount: 500, name: '初遇档', description: '支持500元，获得价值600元有机大米 + 50积分', limitCount: 2000, remainCount: 1200 },
        { level: 2, amount: 1000, name: '优享档', description: '支持1000元，获得价值1300元有机大米 + 120积分', limitCount: 1000, remainCount: 580 },
        { level: 3, amount: 5000, name: '尊享档', description: '支持5000元，获得价值7000元有机大米 + 500积分，另享年度会员权益', limitCount: 200, remainCount: 142 },
      ],
    }
    item.value = mock
    startCountdown()
  } finally {
    loading.value = false
  }
}

function startCountdown() {
  // 模拟倒计时：12天若干时分秒
  let totalSec = (item.value?.remainingDays || 0) * 86400 + 8 * 3600 + 32 * 60 + 15
  countdownTimer = setInterval(() => {
    if (totalSec <= 0) {
      countdown.value = { d: 0, h: 0, m: 0, s: 0 }
      if (countdownTimer) clearInterval(countdownTimer)
      return
    }
    totalSec--
    countdown.value = {
      d: Math.floor(totalSec / 86400),
      h: Math.floor((totalSec % 86400) / 3600),
      m: Math.floor((totalSec % 3600) / 60),
      s: totalSec % 60,
    }
  }, 1000)
  countdown.value = {
    d: Math.floor(totalSec / 86400),
    h: Math.floor((totalSec % 86400) / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  }
}

function onAmountInput() {}

function goBack() { uni.navigateBack() }

async function doInvest() {
  if (!canInvest.value) return
  uni.showToast({ title: '参与功能开发中', icon: 'none' })
  // TODO: 替换为真实 API: crowdfundingApi.invest({ id: item.value!.id, amount: parseFloat(investAmount.value) })
}

function formatAmt(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString()
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

$gap-4: 4rpx; $gap-8: 8rpx; $gap-16: 16rpx; $gap-24: 24rpx;

.page { min-height: 100vh; background: $bg-primary; display: flex; flex-direction: column; box-sizing: border-box; }
.status-bar { width: 100%; }

.page-nav {
  display: flex; align-items: center; gap: $gap-16; padding: 12rpx $gap-16;
  background: rgba(249,249,249,0.88); backdrop-filter: blur(16px); border-bottom: 1rpx solid rgba(20,20,20,0.04); box-sizing: border-box;
  &__back, &__action { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.88); backdrop-filter: blur(12px); border: 1rpx solid rgba(20,20,20,0.06); border-radius: 50%; font-size: 28rpx; color: $mineral-gray; flex-shrink: 0; box-sizing: border-box; }
  &__title { flex: 1; font-size: 32rpx; font-weight: 700; color: $mineral-gray; text-align: center; letter-spacing: 0.5rpx; }
}

.detail-body { flex: 1; }

.detail-cover { width: 100%; height: 480rpx; object-fit: cover; display: block; background: $bg-tertiary; }

// ========== 状态 ==========
.detail-status {
  display: flex; align-items: center; gap: 12rpx; padding: $gap-16;
  &__badge {
    display: inline-flex; align-items: center; padding: 6rpx 16rpx; border-radius: $radius-full; font-size: 22rpx; font-weight: 700;
    &--ongoing { background: rgba(46,204,113,0.15); color: #27ae60; border: 1rpx solid rgba(46,204,113,0.25); }
    &--succeeded { background: rgba(184,152,118,0.15); color: $accent-dark; border: 1rpx solid rgba(184,152,118,0.25); }
    &--failed { background: rgba(192,57,43,0.10); color: $danger; border: 1rpx solid rgba(192,57,43,0.20); }
  }
  &__category { font-size: 22rpx; color: $text-muted; }
}

// ========== 信息卡片 ==========
.info-card { padding: 0 $gap-16 $gap-16;
  &__name { display: block; font-size: 36rpx; font-weight: 700; color: $text-primary; line-height: 1.3; margin-bottom: 10rpx; }
  &__desc { display: block; font-size: 26rpx; color: $text-secondary; line-height: 1.6; }
}

// ========== 进度卡片 ==========
.progress-card {
  margin: 0 $gap-16 $gap-16; padding: $gap-16 $gap-24;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255,255,255,0.60); border-radius: $radius-lg; box-shadow: $clay-shadow; box-sizing: border-box;
}
.progress-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx;
  &__title { font-size: 28rpx; font-weight: 700; color: $text-primary; }
  &__pct { font-size: 32rpx; font-weight: 700; color: $accent-dark; }
}
.progress-track { height: 12rpx; background: rgba(20,20,20,0.08); border-radius: $radius-full; overflow: hidden; margin-bottom: 16rpx; box-sizing: border-box; }
.progress-fill { height: 100%; background: linear-gradient(90deg, $accent-dark 0%, $accent 100%); border-radius: inherit; transition: width 0.4s ease; }
.progress-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: $gap-8; }
.p-stat { display: flex; flex-direction: column; gap: 2rpx;
  &__val { font-family: $font-sans; font-size: 28rpx; font-weight: 700; color: $text-primary; font-variant-numeric: tabular-nums; }
  &__lab { font-size: 20rpx; color: $text-muted; }
}

// ========== 倒计时 ==========
.countdown-card {
  margin: 0 $gap-16 $gap-16; padding: $gap-16 $gap-24;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: $radius-lg;
  display: flex; align-items: center; gap: $gap-24; box-sizing: border-box;
  box-shadow: 0 8rpx 32rpx rgba(15,52,96,0.25);
  &__label { font-size: 26rpx; color: rgba(255,255,255,0.65); flex-shrink: 0; }
  &__timer { display: flex; align-items: center; gap: 8rpx; flex: 1; justify-content: flex-end; }
}
.timer-unit { display: flex; align-items: baseline; gap: 2rpx;
  &__num { font-family: $font-sans; font-size: 40rpx; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; min-width: 56rpx; text-align: center; }
  &__sep { font-size: 32rpx; color: rgba(255,255,255,0.50); min-width: 20rpx; text-align: center; }
}

// ========== 详情卡片 ==========
.detail-card {
  margin: 0 $gap-16 $gap-16; padding: $gap-16 $gap-24;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255,255,255,0.60); border-radius: $radius-lg; box-shadow: $clay-shadow; box-sizing: border-box;
  &__title { font-size: 30rpx; font-weight: 700; color: $text-primary; margin-bottom: $gap-16; display: block; }
  &__content { display: flex; flex-direction: column; gap: 14rpx; }
}
.detail-row { display: flex; align-items: center; justify-content: space-between;
  &__label { font-size: 26rpx; color: $text-muted; }
  &__val { font-size: 26rpx; color: $text-primary; font-weight: 600; }
}

// ========== 回报方案 ==========
.reward-card {
  margin: 0 $gap-16 $gap-16; padding: $gap-16 $gap-24;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255,255,255,0.60); border-radius: $radius-lg; box-shadow: $clay-shadow; box-sizing: border-box;
  &__title { font-size: 30rpx; font-weight: 700; color: $text-primary; margin-bottom: $gap-16; display: block; }
}
.reward-item {
  padding: $gap-16; background: rgba(20,20,20,0.03); border-radius: $radius-md; margin-bottom: 12rpx; box-sizing: border-box;
  &:last-child { margin-bottom: 0; }
  &__header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 8rpx; }
  &__amount { font-family: $font-sans; font-size: 30rpx; font-weight: 700; color: $danger; }
  &__name { font-size: 28rpx; font-weight: 700; color: $text-primary; }
  &__desc { display: block; font-size: 24rpx; color: $text-secondary; line-height: 1.5; margin-bottom: 6rpx; }
  &__limit { display: block; font-size: 22rpx; color: $text-muted; }
}

// ========== 骨架屏 ==========
.skeleton-detail { padding: 0;
  .sk-cover { width: 100%; height: 480rpx; background: $bg-tertiary; display: block; }
  .sk-info { padding: $gap-16; display: flex; flex-direction: column; gap: 14rpx; }
  .sk-line { height: 26rpx; border-radius: 8rpx; background: $bg-tertiary; }
  .sk-bar { height: 12rpx; border-radius: $radius-full; background: $bg-tertiary; margin-top: 4rpx; }
}

// ========== 空状态 ==========
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 160rpx 40rpx; text-align: center;
  &__icon { width: 120rpx; height: 120rpx; line-height: 120rpx; text-align: center; font-size: 48rpx; font-weight: 800; background: $warm-yellow; border: 1rpx solid $border-primary; border-radius: 50%; color: $accent-dark; margin-bottom: 24rpx; box-sizing: border-box; }
  &__text { font-size: 30rpx; font-weight: 600; color: $text-primary; margin-bottom: 40rpx; }
  &__btn { height: 80rpx; padding: 0 56rpx; background: $btn-gold-gradient; border-radius: $radius-full; box-shadow: $btn-gold-shadow; display: flex; align-items: center; justify-content: center;
    text { font-size: 30rpx; font-weight: 700; color: #fff; } }
}

.bottom-placeholder { width: 100%; }

// ========== 底部操作栏 ==========
.action-bar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  background: rgba(255,255,255,0.96); backdrop-filter: blur(20px);
  border-top: 1rpx solid rgba(20,20,20,0.06); box-shadow: 0 -8rpx 32rpx rgba(47,53,66,0.06);
  &__inner { display: flex; align-items: center; gap: $gap-16; padding: $gap-16; padding-bottom: calc($gap-16 + env(safe-area-inset-bottom)); }
}
.action-info {
  display: flex; flex-direction: column; gap: 4rpx; flex: 1;
  &__label { font-size: 22rpx; color: $text-muted; }
  &__input-wrap { display: flex; align-items: baseline; gap: 4rpx; }
  &__yuan { font-size: 32rpx; font-weight: 700; color: $danger; }
  &__input { flex: 1; font-size: 32rpx; font-weight: 700; color: $text-primary; background: transparent; min-width: 0; }
}
.action-btn {
  height: 88rpx; padding: 0 48rpx; background: $btn-gold-gradient; border-radius: $radius-full; box-shadow: $btn-gold-shadow;
  display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease; box-sizing: border-box;
  text { font-size: 30rpx; font-weight: 700; color: #fff; letter-spacing: 1rpx; }
  &:active { transform: scale(0.97); }
  &--disabled { background: rgba(47,53,66,0.18); box-shadow: none; pointer-events: none;
    text { color: rgba(255,255,255,0.5); } }
}

.safe-area-bottom { width: 100%; }
</style>
