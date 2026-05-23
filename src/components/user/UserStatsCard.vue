<template>
  <view class="user-stats-card" @click="$emit('profile')">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="card-glow" />
      <view class="user-inner">
        <view class="avatar-wrap" :class="levelClass">
          <image
            class="avatar-img"
            :src="avatarSrc"
            mode="aspectFill"
          />
          <view class="avatar-ring" />
        </view>
        <view class="user-info">
          <view class="user-name-row">
            <text class="user-name">{{ userInfo.name || '游客' }}</text>
            <view class="member-badge" :class="'v' + (userInfo.level || 1)">
              <text class="badge-text">V{{ userInfo.level || 1 }}</text>
            </view>
          </view>
          <text class="user-id">ID: {{ shortId }}</text>
          <view class="vip-progress-mini">
            <text class="vip-label">V{{ userInfo.level || 1 }}</text>
            <view class="mini-bar">
              <view class="mini-fill" :style="{ width: vipProgress + '%' }" />
            </view>
            <text class="vip-label">V{{ Math.min((userInfo.level || 1) + 1, 9) }}</text>
          </view>
        </view>
        <view class="invite-btn" @click.stop="$emit('invite')">
          <text class="invite-icon">邀</text>
          <text class="invite-text">邀请</text>
        </view>
      </view>

      <!-- 资产摘要行 -->
      <view class="asset-row">
        <view class="asset-mini">
          <text class="asset-mini-value">{{ ecoPointsDisplay }}</text>
          <text class="asset-mini-label">生态积分</text>
        </view>
        <view class="asset-divider" />
        <view class="asset-mini">
          <text class="asset-mini-value accent">{{ consumerPointsDisplay }}</text>
          <text class="asset-mini-label">消费积分</text>
        </view>
        <view class="asset-divider" />
        <view class="asset-mini">
          <text class="asset-mini-value gold">¥{{ balanceDisplay }}</text>
          <text class="asset-mini-label">账户余额</text>
        </view>
      </view>
    </view>

    <!-- 每日分红 Banner -->
    <view class="dividend-banner">
      <view class="dividend-inner">
        <view class="dividend-left">
          <text class="dividend-icon">红</text>
          <view class="dividend-info">
            <text class="dividend-title">昨日分红</text>
            <text class="dividend-value">+{{ yesterdayProfit }}积分</text>
          </view>
        </view>
        <view class="dividend-btn" @click="$emit('signin')">
          <text class="dividend-btn-text">签到领积分</text>
        </view>
      </view>
    </view>

    <!-- 9级能量球展示 -->
    <view class="energy-orbs">
      <view
        v-for="i in 9"
        :key="i"
        class="energy-orb"
        :class="['orb-' + i, { active: (userInfo.level || 1) >= i }, 'v' + Math.ceil(i / 3)]"
      >
        <text class="orb-label">V{{ i }}</text>
      </view>
    </view>

    <!-- VIP 进度信息 -->
    <view class="vip-progress-row">
      <text class="progress-label">距离 V{{ Math.min((userInfo.level || 1) + 1, 9) }} 还差</text>
      <text class="progress-value">{{ remainingPerformance }}业绩</text>
    </view>
    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: vipProgress + '%' }" />
    </view>
    <view class="vip-perks">
      <text class="perk-tag" v-if="userInfo.level >= 3">③ 每日分红</text>
      <text class="perk-tag" v-if="userInfo.level >= 5">⑤ 专属客服</text>
      <text class="perk-tag" v-if="userInfo.level >= 7">⑦ 优先发货</text>
      <text class="perk-tag" v-if="userInfo.level >= 9">⑨ 最高权益</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveAvatar } from '@/utils/media'

interface UserInfo {
  name?: string
  id?: string
  level?: number
  avatar?: string
}

const props = withDefaults(
  defineProps<{
    userInfo: UserInfo
    ecoPointsDisplay?: string
    consumerPointsDisplay?: string
    balanceDisplay?: string
    yesterdayProfit?: string
    vipProgress?: number
    remainingPerformance?: string
    levelName?: string
  }>(),
  {
    userInfo: () => ({ name: '', id: '', level: 1, avatar: '' }),
    ecoPointsDisplay: '0',
    consumerPointsDisplay: '0',
    balanceDisplay: '0.00',
    yesterdayProfit: '0.00',
    vipProgress: 0,
    remainingPerformance: '0',
    levelName: '',
  }
)

defineEmits<{
  (e: 'profile'): void
  (e: 'invite'): void
  (e: 'signin'): void
}>()

const levelClass = computed(() => `level-${props.userInfo.level || 1}`)

const avatarSrc = computed(() => resolveAvatar(props.userInfo.avatar))

const shortId = computed(() => {
  const id = props.userInfo.id || ''
  return id.length > 6 ? id.slice(-6) : id
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

// ================================
// 用户信息卡片
// ================================
.user-card {
  @include premium-surface($warm-yellow);
  border: 1rpx solid $border-primary;
  border-radius: $radius-2xl;
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-base);
  box-shadow: $shadow-gold;
  position: relative;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: -30%;
  right: -10%;
  width: 55%;
  height: 60%;
  background: radial-gradient(circle, rgba(184, 152, 118, 0.28) 0%, transparent 68%);
  pointer-events: none;
  z-index: 0;
}

.user-inner {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-base);
  position: relative;
  z-index: 1;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;

  .avatar-img {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    border: 3rpx solid rgba(184, 152, 118, 0.6);
  }

  .avatar-ring {
    position: absolute;
    inset: -5rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(184, 152, 118, 0.3);
  }
}

.user-info {
  flex: 1;
  min-width: 0;

  .user-name-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: 4rpx;
  }

  .user-name {
    font-size: 34rpx;
    font-weight: 700;
    color: $navy;
    max-width: 200rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .member-badge {
    padding: 2rpx 12rpx;
    border-radius: 20rpx;
    background: $navy;
    border: 1rpx solid rgba($navy, 0.3);

    .badge-text {
      font-size: 20rpx;
      font-weight: 700;
      color: $text-inverse;
    }
  }

  .user-id {
    font-size: 22rpx;
    color: $text-muted;
    display: block;
    margin-bottom: 8rpx;
  }
}

.vip-progress-mini {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .vip-label {
    font-size: 20rpx;
    color: $text-muted;
  }

  .mini-bar {
    flex: 1;
    height: 6rpx;
    background: rgba($navy, 0.12);
    border-radius: 3rpx;
    overflow: hidden;
  }

  .mini-fill {
    height: 100%;
    background: $gold-gradient;
    border-radius: 3rpx;
  }
}

.invite-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 8rpx 20rpx;
  background: $navy;
  border-radius: 20rpx;
  box-shadow: $shadow-glow;
  flex-shrink: 0;

  .invite-icon {
    font-size: 24rpx;
    font-weight: 700;
    color: $gold-light;
  }

  .invite-text {
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.75);
  }
}

.asset-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16rpx 0 0;
  border-top: 1rpx solid rgba($navy, 0.08);
  position: relative;
  z-index: 1;

  .asset-mini {
    text-align: center;

    &-value {
      font-size: 30rpx;
      font-weight: 700;
      color: $navy;
      display: block;

      &.accent { color: $accent-dark; }
      &.gold { color: $accent-dark; }
    }

    &-label {
      font-size: 20rpx;
      color: $text-muted;
      display: block;
      margin-top: 4rpx;
    }
  }

  .asset-divider {
    width: 1rpx;
    height: 40rpx;
    background: rgba($navy, 0.12);
  }
}

// ================================
// 分红 Banner
// ================================
.dividend-banner {
  @include premium-surface($warm-yellow);
  border: 1rpx solid $border-primary;
  border-radius: $radius-lg;
  padding: var(--spacing-base) var(--spacing-lg);
  margin-bottom: var(--spacing-base);
  box-shadow: $shadow-gold;

  .dividend-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dividend-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .dividend-icon {
    width: 56rpx;
    height: 56rpx;
    line-height: 56rpx;
    text-align: center;
    font-size: 24rpx;
    font-weight: var(--weight-heavy);
    color: $navy;
    background: rgba($accent-dark, 0.15);
    border-radius: 50%;
    border: 1rpx solid rgba($accent-dark, 0.3);
    flex-shrink: 0;
  }

  .dividend-info {
    .dividend-title {
      font-size: 22rpx;
      color: $text-muted;
      display: block;
    }

    .dividend-value {
      font-size: 32rpx;
      font-weight: 700;
      color: $accent-dark;
      display: block;
    }
  }

  .dividend-btn {
    background: $navy;
    padding: 12rpx 28rpx;
    border-radius: 50rpx;
    box-shadow: $shadow-glow;

    &-text {
      font-size: 24rpx;
      color: $text-inverse;
      font-weight: 600;
    }
  }
}

// ================================
// 能量球
// ================================
.energy-orbs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  margin-bottom: var(--spacing-sm);
}

.energy-orb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba($navy, 0.08);
  border: 2rpx solid rgba($navy, 0.15);
  transition: all 0.3s ease;

  &.active {
    background: $bronze-gradient;
    border-color: $bronze-gold;
    box-shadow: 0 0 12rpx rgba(184, 152, 118, 0.5);
  }

  &.v1 .orb-label,
  &.v2 .orb-label,
  &.v3 .orb-label { color: $navy-light; }
  &.v4 .orb-label,
  &.v5 .orb-label,
  &.v6 .orb-label { color: $navy-light; }
  &.v7 .orb-label,
  &.v8 .orb-label,
  &.v9 .orb-label { color: $navy-light; }

  .orb-label {
    font-size: 18rpx;
    font-weight: 700;
  }
}

.vip-progress-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;

  .progress-label {
    font-size: 22rpx;
    color: $text-muted;
  }

  .progress-value {
    font-size: 22rpx;
    font-weight: 600;
    color: $accent-dark;
  }
}

.progress-bar {
  height: 10rpx;
  background: rgba($navy, 0.1);
  border-radius: 5rpx;
  overflow: hidden;
  margin-bottom: var(--spacing-sm);

  .progress-fill {
    height: 100%;
    background: $gold-gradient;
    border-radius: 5rpx;
    transition: width 0.5s ease;
  }
}

.vip-perks {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;

  .perk-tag {
    font-size: 20rpx;
    padding: 4rpx 12rpx;
    background: rgba($accent-dark, 0.1);
    color: $accent-dark;
    border-radius: 20rpx;
    border: 1rpx solid rgba($accent-dark, 0.25);
  }
}
</style>
