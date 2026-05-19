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
          {{ isSigned ? '✅ 已签到' : '📝 签到领积分' }}
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
        <text class="reward-icon">🎁</text>
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
      <view class="rules-title">📖 签到规则</view>
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
      <view class="section-title">📋 签到记录</view>
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

function loadSignedDays() {
  const key = `signin_${currentYear.value}_${currentMonth.value}`
  const saved = uni.getStorageSync(key)
  if (saved) {
    try { signedDays.value = JSON.parse(saved) } catch {}
  }
  isSigned.value = signedDays.value.includes(todayDate.value)
}

function saveSignedDays() {
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
    // TODO: 后端需提供签到接口 POST /api/v1/sign-in
    // 目前本地模拟
    isSigned.value = true
    if (!signedDays.value.includes(todayDate.value)) {
      signedDays.value.push(todayDate.value)
      saveSignedDays()
    }
    uni.showToast({ title: `签到成功！+${signReward.value}积分`, icon: 'success' })
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
  background: $bg-primary;
  padding: 0 $spacing-lg;
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  
  .nav-back {
    font-size: 40rpx;
    color: #fff;
  }
  
  .nav-title {
    flex: 1;
    text-align: center;
    font-size: 34rpx;
    font-weight: 600;
    color: #fff;
    margin-right: 60rpx;
  }
}

.sign-card {
  background: $bg-card;
  backdrop-filter: blur(20px);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
  
  .sign-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-lg;
    
    .sign-date {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-primary;
    }
    
    .sign-status {
      padding: 8rpx 24rpx;
      background: rgba($primary, 0.2);
      border-radius: 50rpx;
      font-size: 24rpx;
      color: $primary;
      
      &.signed {
        background: rgba($profit, 0.2);
        color: $profit;
      }
    }
  }
  
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: $spacing-sm;
    margin-bottom: $spacing-base;
    
    .weekday {
      text-align: center;
      font-size: 24rpx;
      color: $text-muted;
      padding: 8rpx 0;
    }
    
    .day-cell {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: $bg-card;
      border-radius: $radius-sm;
      position: relative;
      
      .day-text {
        font-size: 28rpx;
        color: $text-primary;
      }
      
      .sign-mark {
        font-size: 16rpx;
        color: $profit;
        margin-top: 2rpx;
      }
      
      &.is-today {
        background: rgba($primary, 0.2);
        border: 2rpx solid $primary;
        
        .day-text { color: $primary; font-weight: 600; }
      }
      
      &.is-signed {
        background: rgba($profit, 0.15);
        
        .day-text { color: $profit; }
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
    gap: $spacing-sm;
    padding: $spacing-base;
    background: rgba($gold, 0.1);
    border-radius: $radius-sm;
    
    .reward-icon { font-size: 32rpx; }
    .reward-text {
      font-size: 26rpx;
      color: $gold;
    }
  }
}

.sign-btn-area {
  margin-bottom: $spacing-lg;
  
  .sign-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, $primary, $primary-dark);
    border-radius: 48rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: $shadow-glow;
    
    &.disabled {
      background: $bg-card;
      box-shadow: none;
      
      .btn-text { color: $text-muted; }
      .btn-reward { color: $text-muted; }
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
  background: $bg-card;
  backdrop-filter: blur(20px);
  border-radius: $radius-md;
  padding: $spacing-base;
  margin-bottom: $spacing-lg;
  
  .rules-title {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: $spacing-base;
  }
  
  .rules-list {
    .rule-item {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      margin-bottom: $spacing-sm;
      
      .rule-num {
        width: 36rpx;
        height: 36rpx;
        background: rgba($primary, 0.2);
        border-radius: 50%;
        font-size: 22rpx;
        color: $primary;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .rule-text {
        font-size: 26rpx;
        color: $text-secondary;
      }
    }
  }
}

.records-section {
  .section-title {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: $spacing-base;
  }
  
  .records-list {
    background: $bg-card;
    backdrop-filter: blur(20px);
    border-radius: $radius-md;
    padding: $spacing-base;
    
    .record-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $spacing-sm 0;
      border-bottom: 1rpx solid $border-light;
      
      &:last-child { border-bottom: none; }
      
      .record-date {
        font-size: 26rpx;
        color: $text-secondary;
      }
      
      .record-points {
        font-size: 26rpx;
        color: $profit;
        font-weight: 600;
      }
    }
  }
}
</style>
