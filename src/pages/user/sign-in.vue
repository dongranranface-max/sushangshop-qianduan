<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">签到中心</text>
      <view class="page-nav__action" />
    </view>

    <scroll-view scroll-y class="sign-body">
      <!-- 签到卡片 -->
      <view class="sign-card">
        <view class="sign-card__header">
          <text class="sign-card__date">{{ todayStr }}</text>
          <view class="sign-card__status" :class="{ 'sign-card__status--done': isSigned }">
            <text>{{ isSigned ? '已签到' : '签到领积分' }}</text>
          </view>
        </view>

        <view class="calendar-grid">
          <view class="weekday" v-for="day in weekdays" :key="day"><text>{{ day }}</text></view>
          <view
            class="day-cell"
            v-for="(day, index) in calendarDays"
            :key="index"
            :class="{
              'day-cell--today': day === todayDate,
              'day-cell--signed': day > 0 && signedDays.includes(day),
              'day-cell--future': day === 0 || day > todayDate
            }"
          >
            <text class="day-text">{{ day || '' }}</text>
            <text v-if="day > 0 && signedDays.includes(day)" class="day-mark">✓</text>
          </view>
        </view>

        <view class="reward-strip">
          <view class="reward-strip__icon">礼</view>
          <text class="reward-strip__text">连续签到 {{ signedDays.length }} 天，本周已领 {{ signedDays.length * signReward }} 积分</text>
        </view>
      </view>

      <!-- 签到按钮 -->
      <view class="sign-btn" :class="{ 'sign-btn--done': isSigned }" @click="doSign">
        <text class="sign-btn__text">{{ isSigned ? '今日已签到' : '立即签到' }}</text>
        <text class="sign-btn__sub">+{{ signReward }} 积分</text>
      </view>

      <!-- 规则 -->
      <view class="rules-section">
        <text class="section-head">签到规则</text>
        <view class="rule-list">
          <view class="rule-item">
            <view class="rule-item__num"><text>1</text></view>
            <text class="rule-item__text">每日签到可获得 {{ signReward }} 积分</text>
          </view>
          <view class="rule-item">
            <view class="rule-item__num"><text>2</text></view>
            <text class="rule-item__text">连续签到 7 天额外奖励 100 积分</text>
          </view>
          <view class="rule-item">
            <view class="rule-item__num"><text>3</text></view>
            <text class="rule-item__text">积分可兑换商品或参与理财</text>
          </view>
        </view>
      </view>

      <!-- 记录 -->
      <view class="records-section">
        <text class="section-head">签到记录</text>
        <view class="records-list">
          <view class="record-item" v-for="record in signRecords" :key="record.date">
            <text class="record-item__date">{{ record.date }}</text>
            <text class="record-item__points">+{{ record.points }} 积分</text>
          </view>
          <view v-if="!signRecords.length" class="records-empty">
            <text>暂无签到记录</text>
          </view>
        </view>
      </view>

      <view class="bottom-placeholder" :style="{ height: (100 + safeAreaBottom) + 'px' }" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { signInApi } from '@/utils/api'
import { checkAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const signReward = ref(10)
const isSigned = ref(false)
const signedDays = ref<number[]>([])
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const todayDate = ref(now.getDate())
const todayStr = computed(() => `${currentYear.value}年${currentMonth.value}月${todayDate.value}日`)

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1)
  let startWeekday = firstDay.getDay() - 1
  if (startWeekday < 0) startWeekday = 6
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: number[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(0)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(0)
  return cells
})

const signRecords = computed(() =>
  signedDays.value.map(day => ({
    date: `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    points: signReward.value,
  })).reverse()
)

async function loadSignedDays() {
  try {
    const res = await signInApi.getMonthly({ year: currentYear.value, month: currentMonth.value })
    signedDays.value = res?.records?.map((r: { date: string }) => parseInt(r.date.split('-')[2], 10)) || []
    isSigned.value = signedDays.value.includes(todayDate.value)
  } catch {
    const key = `signin_${currentYear.value}_${currentMonth.value}`
    const saved = uni.getStorageSync(key)
    if (saved) {
      try { signedDays.value = JSON.parse(saved) } catch {}
    }
    isSigned.value = signedDays.value.includes(todayDate.value)
  }
}

function saveSignedDays() {
  const key = `signin_${currentYear.value}_${currentMonth.value}`
  uni.setStorageSync(key, JSON.stringify(signedDays.value))
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
  if (checkAuth()) loadSignedDays()
})

function goBack() { uni.navigateBack() }

async function doSign() {
  if (isSigned.value) return
  uni.showLoading({ title: '签到中...' })
  try {
    const res = await signInApi.signIn()
    if (res?.success) {
      isSigned.value = true
      if (!signedDays.value.includes(todayDate.value)) {
        signedDays.value.push(todayDate.value)
        saveSignedDays()
      }
      uni.showToast({ title: `签到成功！+${res.points}积分`, icon: 'success' })
    } else {
      uni.showToast({ title: res?.message || '签到失败', icon: 'none' })
    }
  } catch {
    uni.showToast({ title: '签到失败，请稍后重试', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  @include page-bg;
  display: flex;
  flex-direction: column;
}

.status-bar { width: 100%; }

// ========== 导航栏 ==========
.page-nav {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx $spacing-base;
  background: rgba(249, 249, 249, 0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1rpx solid rgba(20, 20, 20, 0.04);

  &__back, &__action {
    width: 64rpx; height: 64rpx;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(12px);
    border: 1rpx solid rgba(20, 20, 20, 0.06);
    border-radius: 50%;
    font-size: 28rpx; color: $mineral-gray; flex-shrink: 0;
  }

  &__title {
    flex: 1; font-size: 32rpx; font-weight: 700;
    color: $mineral-gray; text-align: center;
  }
}

// ========== 内容区 ==========
.sign-body {
  flex: 1;
  padding: $spacing-base;
}

// ========== 签到卡片 ==========
.sign-card {
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.60);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;
  padding: $spacing-lg;
  margin-bottom: $spacing-base;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-lg;
  }

  &__date {
    font-size: 32rpx;
    font-weight: 700;
    color: $text-primary;
  }

  &__status {
    padding: 6rpx 20rpx;
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: $radius-full;

    text {
      font-size: 22rpx;
      font-weight: 700;
      color: $accent-dark;
    }

    &--done {
      background: rgba(61, 139, 110, 0.12);
      border-color: rgba(61, 139, 110, 0.25);

      text { color: $success; }
    }
  }
}

// ========== 日历 ==========
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
  margin-bottom: $spacing-base;
}

.weekday {
  text-align: center;
  padding: 8rpx 0;

  text {
    font-size: 22rpx;
    color: $text-muted;
    font-weight: 500;
  }
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(47, 53, 66, 0.04);
  border-radius: $radius-md;
  position: relative;
  transition: background 0.2s;

  .day-text {
    font-size: 26rpx;
    color: $text-primary;
    line-height: 1;
  }

  .day-mark {
    font-size: 14rpx;
    color: $success;
    position: absolute;
    bottom: 4rpx;
  }

  &--today {
    background: $warm-yellow;
    border: 1rpx solid $border-primary;

    .day-text { color: $accent-dark; font-weight: 700; }
  }

  &--signed {
    background: rgba(61, 139, 110, 0.10);
    border: 1rpx solid rgba(61, 139, 110, 0.20);

    .day-text { color: $success; }
  }

  &--future {
    opacity: 0.25;

    .day-text { color: $text-muted; }
  }
}

// ========== 奖励条 ==========
.reward-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: $spacing-base;
  background: rgba(184, 152, 118, 0.10);
  border: 1rpx solid rgba(184, 152, 118, 0.20);
  border-radius: $radius-md;

  &__icon {
    width: 40rpx; height: 40rpx;
    display: flex; align-items: center; justify-content: center;
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: 50%;
    font-size: 22rpx; font-weight: 800; color: $accent-dark;
    flex-shrink: 0;
  }

  &__text {
    font-size: 26rpx;
    color: $accent-dark;
    font-weight: 500;
  }
}

// ========== 签到按钮 ==========
.sign-btn {
  height: 96rpx;
  background: $accent-gradient;
  border-radius: 48rpx;
  box-shadow: $btn-gold-shadow;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-base;
  transition: transform 0.2s ease;

  &:active { transform: scale(0.98); }

  &--done {
    background: rgba(47, 53, 66, 0.08);
    box-shadow: none;

    .sign-btn__text { color: $text-muted; }
    .sign-btn__sub { color: $text-muted; }
  }

  &__text {
    font-size: 32rpx;
    font-weight: 700;
    color: #fff;
  }

  &__sub {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

// ========== 规则 ==========
.section-head {
  @include section-head;
  margin-bottom: $spacing-base;
}

.rules-section {
  margin-bottom: $spacing-base;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: $spacing-base;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.60);
  border-radius: $radius-md;

  &__num {
    width: 40rpx; height: 40rpx;
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;

    text { font-size: 20rpx; font-weight: 700; color: $accent-dark; }
  }

  &__text {
    font-size: 26rpx;
    color: $text-secondary;
    line-height: 1.5;
  }
}

// ========== 记录 ==========
.records-section { margin-bottom: $spacing-base; }

.records-list {
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.60);
  border-radius: $radius-lg;
  overflow: hidden;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-base $spacing-base;
  border-bottom: 1rpx solid $border-light;

  &:last-child { border-bottom: none; }

  &__date {
    font-size: 26rpx;
    color: $text-secondary;
  }

  &__points {
    font-size: 26rpx;
    font-weight: 700;
    color: $success;
  }
}

.records-empty {
  padding: $spacing-xl;
  text-align: center;

  text { font-size: 26rpx; color: $text-muted; }
}

.bottom-placeholder { width: 100%; }
</style>
