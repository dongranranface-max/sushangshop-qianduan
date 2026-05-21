<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">签到中心</text>
    </view>
    
    <!-- 签到卡片 -->
    <view class="sign-card">
      <view class="sign-header">
        <text class="sign-date">{{ todayStr }}</text>
        <view class="sign-status" :class="{ signed: isSigned }">
          {{ isSigned ? '已签到' : '签到领积分' }}
        </view>
      </view>
      
      <view class="calendar-grid">
        <view class="weekday" v-for="day in weekdays" :key="day">{{ day }}</view>
        <view 
          class="day-cell" 
          v-for="(day, index) in calendarDays" 
          :key="index"
          :class="{
            'is-today': day === todayDate,
            'is-signed': day > 0 && signedDays.includes(day),
            'is-future': day > todayDate
          }"
        >
          <text class="day-text">{{ day }}</text>
          <text v-if="day > 0 && signedDays.includes(day)" class="sign-mark">✓</text>
        </view>
      </view>
      
      <view class="reward-info">
        <text class="reward-icon">礼</text>
        <text class="reward-text">连续签到 {{ signedDays.length }} 天，本周已领 {{ signedDays.length * signReward }} 积分</text>
      </view>
    </view>
    
    <!-- 签到按钮 -->
    <view class="sign-btn-area">
      <view class="sign-btn" :class="{ disabled: isSigned }" @click="doSign">
        <text class="btn-text">{{ isSigned ? '今日已签到' : '立即签到' }}</text>
        <text class="btn-reward">+{{ signReward }} 积分</text>
      </view>
    </view>
    
    <!-- 签到规则 -->
    <view class="rules-section">
      <view class="rules-title">签到规则</view>
      <view class="rules-list">
        <view class="rule-item">
          <text class="rule-num">1</text>
          <text class="rule-text">每日签到可获得 {{ signReward }} 积分</text>
        </view>
        <view class="rule-item">
          <text class="rule-num">2</text>
          <text class="rule-text">连续签到 7 天额外奖励 100 积分</text>
        </view>
        <view class="rule-item">
          <text class="rule-num">3</text>
          <text class="rule-text">积分可兑换商品或参与理财</text>
        </view>
      </view>
    </view>
    
    <!-- 签到记录 -->
    <view class="records-section">
      <view class="section-title">签到记录</view>
      <view class="records-list">
        <view class="record-item" v-for="record in signRecords" :key="record.date">
          <text class="record-date">{{ record.date }}</text>
          <text class="record-points">+{{ record.points }} 积分</text>
        </view>
      </view>
    </view>
    
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { requireAuth } from '@/utils/auth'
import { signInApi } from '@/utils/api'

const statusBarHeight = ref(20)
const signReward = ref(10)
const isSigned = ref(false)
const signedDays = ref<number[]>([])
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

// 当前日历月
const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const todayDate = ref(now.getDate())
const todayStr = computed(() => `${currentYear.value}年${currentMonth.value}月${todayDate.value}日`)

// 生成当月日历格子
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

async function loadSignedDays() {
  try {
    const res = await signInApi.getMonthly({ year: currentYear.value, month: currentMonth.value })
    signedDays.value = res.records.map(r => parseInt(r.date.split('-')[2], 10))
    isSigned.value = signedDays.value.includes(todayDate.value)
  } catch {
    // 降级到本地存储
    const key = `signin_${currentYear.value}_${currentMonth.value}`
    const saved = uni.getStorageSync(key)
    if (saved) {
      try { signedDays.value = JSON.parse(saved) } catch {}
    }
    isSigned.value = signedDays.value.includes(todayDate.value)
  }
}

async function saveSignedDays() {
  const key = `signin_${currentYear.value}_${currentMonth.value}`
  uni.setStorageSync(key, JSON.stringify(signedDays.value))
}

const signRecords = computed(() =>
  signedDays.value.map(day => ({
    date: `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    points: signReward.value,
  })).reverse()
)

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  if (!requireAuth()) return
  loadSignedDays()
})

function goBack() {
  uni.navigateBack()
}

async function doSign() {
  if (isSigned.value) return

  uni.showLoading({ title: '签到中...' })
  try {
    const res = await signInApi.signIn()
    if (res.success) {
      isSigned.value = true
      if (!signedDays.value.includes(todayDate.value)) {
        signedDays.value.push(todayDate.value)
        saveSignedDays()
      }
      uni.showToast({ title: `签到成功！+${res.points}积分`, icon: 'success' })
    } else {
      uni.showToast({ title: res.message || '签到失败', icon: 'none' })
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
@import '@/styles/page-shell.scss';

.page-container { @include tab-page-shell; }

.nav-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  
  .nav-back { font-size: 40rpx; color: $text-primary; }
  .nav-title {
    flex: 1;
    text-align: center;
    font-size: 34rpx;
    font-weight: 600;
    color: $text-primary;
    margin-right: 60rpx;
  }
}

.sign-card {
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  
  .sign-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
    
    .sign-date {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .sign-status {
      padding: 8rpx 24rpx;
      background: $warm-yellow;
      border-radius: 50rpx;
      font-size: 24rpx;
      color: $accent-dark;
      
      &.signed {
        background: rgba($success, 0.12);
        color: $success;
      }
    }
  }
  
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-base);
    
    .weekday {
      text-align: center;
      font-size: 24rpx;
      color: var(--text-muted);
      padding: 8rpx 0;
    }
    
    .day-cell {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--bg-card);
      border-radius: $radius-sm;
      position: relative;
      
      .day-text {
        font-size: 28rpx;
        color: var(--text-primary);
      }
      
      .sign-mark {
        font-size: 16rpx;
        color: var(--profit);
        margin-top: 2rpx;
      }
      
      &.is-today {
        background: $warm-yellow;
        border: 2rpx solid $border-primary;
        .day-text { color: $navy; font-weight: 600; }
      }
      
      &.is-signed {
        background: rgba($success, 0.12);
        .day-text { color: $success; }
      }
      
      &.is-future {
        opacity: 0.3;
      }
    }
  }
  
  .reward-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-base);
    background: $warm-yellow;
    border-radius: $radius-sm;
    
    .reward-icon {
      width: 40rpx; height: 40rpx; line-height: 40rpx; text-align: center;
      font-size: 24rpx; font-weight: var(--weight-heavy); color: $navy;
      background: rgba(196, 165, 116, 0.25); border-radius: 50%;
    }
    .reward-text { font-size: 26rpx; color: $accent-dark; }
  }
}

.sign-btn-area {
  margin-bottom: var(--spacing-lg);
  
  .sign-btn {
    width: 100%;
    height: 96rpx;
    background: $accent-fire;
    border-radius: 48rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: $shadow-glow;
    
    &.disabled {
      background: var(--bg-card);
      box-shadow: none;
      
      .btn-text { color: var(--text-muted); }
      .btn-reward { color: var(--text-muted); }
    }
    
    .btn-text {
      font-size: 32rpx;
      font-weight: 600;
      color: #fff;
    }
    
    .btn-reward {
      font-size: 22rpx;
      color: rgba(255,255,255,0.8);
    }
  }
}

.rules-section {
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  padding: var(--spacing-base);
  margin-bottom: var(--spacing-lg);
  
  .rules-title {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-base);
  }
  
  .rules-list {
    .rule-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
      
      .rule-num {
        width: 36rpx;
        height: 36rpx;
        background: $warm-yellow;
        border-radius: 50%;
        font-size: 22rpx;
        color: $navy;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .rule-text {
        font-size: 26rpx;
        color: var(--text-secondary);
      }
    }
  }
}

.records-section {
  .section-title {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-base);
  }
  
  .records-list {
    @include premium-surface($bg-secondary);
    border-radius: $radius-lg;
    padding: var(--spacing-base);
    
    .record-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-sm) 0;
      border-bottom: 1rpx solid var(--border-light);
      
      &:last-child { border-bottom: none; }
      
      .record-date {
        font-size: 26rpx;
        color: var(--text-secondary);
      }
      
      .record-points {
        font-size: 26rpx;
        color: var(--profit);
        font-weight: 600;
      }
    }
  }
}
</style>
