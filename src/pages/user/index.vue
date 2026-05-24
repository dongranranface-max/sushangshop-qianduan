<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 深色用户头部 -->
    <view class="user-header" @click="goProfile">
      <view class="user-header__bg" />
      <view class="user-header__inner">
        <view class="user-avatar-wrap">
          <image class="user-avatar" :src="avatarSrc" mode="aspectFill" />
          <view class="user-avatar-ring" />
        </view>
        <view class="user-info">
          <view class="user-name-row">
            <text class="user-name">{{ userInfo.name || '游客' }}</text>
            <view class="member-badge" :class="'v' + (userInfo.level || 1)">
              <text>V{{ userInfo.level || 1 }}</text>
            </view>
          </view>
          <text class="user-id">ID: {{ shortId }}</text>
        </view>
        <view class="invite-btn" @click.stop="goInvite">
          <text class="invite-icon">邀</text>
          <text class="invite-label">邀请</text>
        </view>
      </view>

      <!-- 资产摘要行 -->
      <view class="asset-strip">
        <view class="asset-item">
          <text class="asset-value">{{ ecoPointsDisplay }}</text>
          <text class="asset-label">生态积分</text>
        </view>
        <view class="asset-divider" />
        <view class="asset-item">
          <text class="asset-value accent">{{ consumerPointsDisplay }}</text>
          <text class="asset-label">消费积分</text>
        </view>
        <view class="asset-divider" />
        <view class="asset-item">
          <text class="asset-value gold">¥{{ balanceDisplay }}</text>
          <text class="asset-label">账户余额</text>
        </view>
      </view>
    </view>

    <!-- 昨日分红 Banner -->
    <view class="dividend-banner" @click="goSignIn">
      <view class="dividend-icon-wrap">
        <text class="dividend-icon">红</text>
      </view>
      <view class="dividend-info">
        <text class="dividend-title">昨日分红</text>
        <text class="dividend-value">+{{ yesterdayProfit }}积分</text>
      </view>
      <view class="dividend-btn">
        <text>签到领积分</text>
      </view>
    </view>

    <!-- VIP 进度 -->
    <view class="vip-card">
      <view class="vip-card__header">
        <text class="vip-card__title">VIP 等级</text>
        <text class="vip-card__sub">距 V{{ nextLevel }} 还差 {{ remainingPerformance }}</text>
      </view>
      <view class="energy-orbs">
        <view
          v-for="i in 9"
          :key="i"
          class="energy-orb"
          :class="{ active: (userInfo.level || 1) >= i }"
        >
          <text>V{{ i }}</text>
        </view>
      </view>
      <view class="vip-progress">
        <view class="vip-progress__bar">
          <view class="vip-progress__fill" :style="{ width: vipProgress + '%' }" />
        </view>
        <view class="vip-perks">
          <text v-if="(userInfo.level || 1) >= 3" class="perk-tag">每日分红</text>
          <text v-if="(userInfo.level || 1) >= 5" class="perk-tag">专属客服</text>
          <text v-if="(userInfo.level || 1) >= 7" class="perk-tag">优先发货</text>
          <text v-if="(userInfo.level || 1) >= 9" class="perk-tag">最高权益</text>
        </view>
      </view>
    </view>

    <!-- 订单入口 -->
    <view class="order-section">
      <view class="order-section__head">
        <text class="section-title">我的订单</text>
        <view class="section-more" @click="goOrderList()">
          <text>全部订单</text>
          <text class="more-arrow">›</text>
        </view>
      </view>
      <view class="order-tabs">
        <view
          v-for="tab in orderTabs"
          :key="tab.key"
          class="order-tab"
          @click="goOrderList(tab.key)"
        >
          <view class="order-tab__icon-wrap">
            <text class="order-tab__icon">{{ tab.icon }}</text>
            <view v-if="orderCounts[tab.key] > 0" class="order-tab__badge">
              {{ orderCounts[tab.key] > 99 ? '99+' : orderCounts[tab.key] }}
            </view>
          </view>
          <text class="order-tab__label">{{ tab.label }}</text>
        </view>
      </view>
    </view>

    <!-- 功能网格 -->
    <view class="tools-grid">
      <view
        v-for="tool in toolItems"
        :key="tool.id"
        class="tool-item"
        @click="tool.action"
      >
        <view class="tool-icon-wrap" :style="{ background: tool.bg }">
          <text class="tool-icon">{{ tool.icon }}</text>
        </view>
        <text class="tool-label">{{ tool.label }}</text>
        <view v-if="tool.tag" class="tool-tag">{{ tool.tag }}</view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view v-if="loggedIn" class="logout-section">
      <view class="logout-btn" @click="logout">
        <text>退出登录</text>
      </view>
    </view>

    <view class="safe-area-bottom" :style="{ height: (100 + safeAreaBottom) + 'px' }" />

    <LuxuryTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { checkAuth, clearAuth } from '@/utils/auth'
import { resolveAvatar } from '@/utils/media'
import { assetStore } from '@/store/asset'
import { userApi } from '@/utils/api'
import LuxuryTabbar from '@/components/LuxuryTabbar.vue'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const loggedIn = ref(checkAuth())
const userInfo = ref<any>({})
const orderCounts = ref<Record<string, number>>({})

const ecoPointsDisplay = computed(() => assetStore.formatEco(assetStore.ecoPoints))
const consumerPointsDisplay = computed(() => assetStore.formatConsumer(assetStore.consumerPoints))
const balanceDisplay = computed(() => assetStore.formatBalance(assetStore.balance))
const yesterdayProfit = computed(() => assetStore.formatProfit(assetStore.yesterdayProfit))

const avatarSrc = computed(() => resolveAvatar(userInfo.value.avatar))
const shortId = computed(() => {
  const id = userInfo.value.id || ''
  return id.length > 6 ? id.slice(-6) : id
})

const vipProgress = computed(() => {
  const level = userInfo.value.level || 1
  return Math.min(((level - 1) / 9) * 100, 100)
})

const nextLevel = computed(() => Math.min((userInfo.value.level || 1) + 1, 9))

const remainingPerformance = computed(() => {
  const need = userInfo.value.nextLevelPerformance || 0
  return need >= 10000 ? `${(need / 10000).toFixed(1)}万` : String(need)
})

const orderTabs = [
  { key: '1', label: '待付款', icon: '待' },
  { key: '2', label: '待发货', icon: '发' },
  { key: '3', label: '待收货', icon: '收' },
  { key: '4', label: '已完成', icon: '完' },
]

const toolItems = [
  { id: 'signin', label: '每日签到', icon: '签', bg: 'rgba(184,152,118,0.12)', action: () => goSignIn() },
  { id: 'address', label: '收货地址', icon: '址', bg: 'rgba(65,75,94,0.08)', action: () => goAddress() },
  { id: 'exchange', label: '积分兑换', icon: '兑', bg: 'rgba(142,116,89,0.10)', action: () => goExchange() },
  { id: 'wealth', label: '我的理财', icon: '财', bg: 'rgba(184,152,118,0.12)', action: () => goWealth() },
  { id: 'help', label: '帮助中心', icon: '帮', bg: 'rgba(65,75,94,0.08)', action: () => goHelp() },
  { id: 'about', label: '关于我们', icon: '关', bg: 'rgba(142,116,89,0.10)', action: () => goAbout() },
]

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
  loadUserInfo()
  loadOrderCounts()
})

onShow(() => {
  loggedIn.value = checkAuth()
  assetStore.fetchBalance()
  if (loggedIn.value) loadUserInfo()
})

async function loadUserInfo() {
  if (!checkAuth()) return
  try {
    const res = await userApi.getUserInfo()
    userInfo.value = res || {}
  } catch {}
}

async function loadOrderCounts() {
  if (!checkAuth()) return
  try {
    const res = await userApi.getOrderCounts()
    orderCounts.value = res || {}
  } catch {}
}

function goProfile() { if (!checkAuth()) return; uni.navigateTo({ url: '/pages/user/profile' }) }
function goInvite() { if (!checkAuth()) return; uni.navigateTo({ url: '/pages/user/invite' }) }
function goSignIn() { if (!checkAuth()) return; uni.navigateTo({ url: '/pages/user/sign-in' }) }
function goOrderList(key = '') {
  if (!checkAuth()) return
  const url = key ? `/pages/order/list?tab=${key}` : '/pages/order/list'
  uni.navigateTo({ url })
}
function goAddress() { if (!checkAuth()) return; uni.navigateTo({ url: '/pages/address/list' }) }
function goExchange() { if (!checkAuth()) return; uni.navigateTo({ url: '/pages/exchange/list' }) }
function goWealth() { if (!checkAuth()) return; uni.navigateTo({ url: '/pages/wealth/my-invest' }) }
function goHelp() { uni.showToast({ title: '帮助中心开发中', icon: 'none' }) }
function goAbout() { uni.showToast({ title: '关于我们开发中', icon: 'none' }) }
function logout() {
  uni.showModal({
    title: '提示',
    content: '确定退出登录？',
    success: (res) => {
      if (res.confirm) {
        clearAuth()
        userInfo.value = {}
        orderCounts.value = {}
        loggedIn.value = false
        uni.showToast({ title: '已退出', icon: 'none' })
      }
    },
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, #F9F9F9 0%, #F0EDE8 100%);
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.status-bar { width: 100%; }

// ========== 深色用户头部 ==========
.user-header {
  margin: $spacing-base;
  border-radius: $radius-2xl;
  overflow: hidden;
  position: relative;
  box-shadow: $shadow-gold;
}

.user-header__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, #1E2433 0%, #2A3142 50%, #1E2433 100%);
  z-index: 0;
}

.user-header__inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: $spacing-lg $spacing-lg $spacing-base;
}

.user-avatar-wrap {
  position: relative;
  flex-shrink: 0;

  .user-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    border: 3rpx solid rgba(184, 152, 118, 0.6);
    background: $bg-tertiary;
  }

  .user-avatar-ring {
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
    gap: 10rpx;
    margin-bottom: 4rpx;
  }

  .user-name {
    font-size: 34rpx;
    font-weight: 700;
    color: #fff;
    max-width: 200rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .member-badge {
    padding: 2rpx 12rpx;
    border-radius: 20rpx;
    background: rgba(255, 255, 255, 0.15);
    border: 1rpx solid rgba(184, 152, 118, 0.4);

    text {
      font-size: 20rpx;
      font-weight: 700;
      color: $bronze-light;
    }
  }

  .user-id {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.5);
    display: block;
  }
}

.invite-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 10rpx 20rpx;
  background: rgba(184, 152, 118, 0.20);
  border: 1rpx solid rgba(184, 152, 118, 0.30);
  border-radius: 20rpx;
  flex-shrink: 0;

  .invite-icon { font-size: 22rpx; font-weight: 700; color: $bronze-light; }
  .invite-label { font-size: 18rpx; color: rgba(255, 255, 255, 0.6); }
}

.asset-strip {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16rpx $spacing-lg $spacing-lg;
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);

  .asset-item {
    text-align: center;

    .asset-value {
      display: block;
      font-family: $asset-balance-font;
      font-size: 32rpx;
      font-weight: 700;
      color: #fff;
      font-variant-numeric: tabular-nums;

      &.accent { color: $bronze-light; }
      &.gold { color: $bronze-gold; }
    }

    .asset-label {
      display: block;
      font-size: 20rpx;
      color: rgba(255, 255, 255, 0.45);
      margin-top: 4rpx;
    }
  }

  .asset-divider {
    width: 1rpx;
    height: 40rpx;
    background: rgba(255, 255, 255, 0.1);
  }
}

// ========== 分红 Banner ==========
.dividend-banner {
  margin: 0 $spacing-base $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid $border-primary;
  border-radius: $radius-lg;
  box-shadow: $shadow-gold;
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .dividend-icon-wrap {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(184, 152, 118, 0.15);
    border: 1rpx solid rgba(184, 152, 118, 0.30);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dividend-icon { font-size: 22rpx; font-weight: 700; color: $accent-dark; }
  .dividend-info { flex: 1; }
  .dividend-title { display: block; font-size: 22rpx; color: $text-muted; }
  .dividend-value { display: block; font-size: 32rpx; font-weight: 700; color: $accent-dark; font-variant-numeric: tabular-nums; }

  .dividend-btn {
    padding: 10rpx 28rpx;
    background: $mineral-gray;
    border-radius: $radius-full;

    text { font-size: 24rpx; color: $bronze-light; font-weight: 600; }
  }
}

// ========== VIP 进度 ==========
.vip-card {
  margin: 0 $spacing-base $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-base;
  }

  &__title { font-size: 28rpx; font-weight: 700; color: $text-primary; }
  &__sub { font-size: 22rpx; color: $text-muted; }
}

.energy-orbs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-base;
}

.energy-orb {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(47, 53, 66, 0.08);
  border: 2rpx solid rgba(47, 53, 66, 0.12);
  transition: all 0.3s ease;

  text { font-size: 18rpx; font-weight: 700; color: $text-muted; }

  &.active {
    background: $bronze-gradient;
    border-color: $bronze-gold;
    box-shadow: 0 0 12rpx rgba(184, 152, 118, 0.4);
    text { color: #fff; }
  }
}

.vip-progress {
  &__bar {
    height: 10rpx;
    background: rgba(47, 53, 66, 0.1);
    border-radius: 5rpx;
    overflow: hidden;
    margin-bottom: 12rpx;
  }

  &__fill {
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
    background: rgba(184, 152, 118, 0.10);
    color: $accent-dark;
    border-radius: 20rpx;
    border: 1rpx solid rgba(184, 152, 118, 0.25);
  }
}

// ========== 订单入口 ==========
.order-section {
  margin: 0 $spacing-base $spacing-base;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
  }
}

.section-title { font-size: 30rpx; font-weight: 700; color: $text-primary; }

.section-more {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 24rpx;
  color: $text-muted;

  .more-arrow { font-size: 28rpx; }
}

.order-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  overflow: hidden;
}

.order-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 0;

  & + & { border-left: 1rpx solid $border-light; }

  &__icon-wrap {
    position: relative;
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(184, 152, 118, 0.10);
    border-radius: $radius-md;
  }

  &__icon { font-size: 22rpx; font-weight: 700; color: $accent-dark; }

  &__badge {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
    min-width: 32rpx;
    height: 32rpx;
    padding: 0 6rpx;
    background: $danger;
    border-radius: 16rpx;
    font-size: 18rpx;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  &__label { font-size: 24rpx; color: $text-secondary; font-weight: 500; }
}

// ========== 功能网格 ==========
.tools-grid {
  margin: 0 $spacing-base;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-base;
}

.tool-item {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  padding: 28rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  position: relative;
  transition: transform 0.2s ease;

  &:active { transform: scale(0.97); }

  .tool-icon-wrap {
    width: 72rpx;
    height: 72rpx;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4rpx;
  }

  .tool-icon { font-size: 28rpx; font-weight: 700; color: $accent-dark; }
  .tool-label { font-size: 24rpx; color: $text-secondary; font-weight: 500; }

  .tool-tag {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    font-size: 16rpx;
    padding: 2rpx 8rpx;
    background: $warm-yellow;
    color: $accent-dark;
    border-radius: 20rpx;
    font-weight: 600;
  }
}

// ========== 退出登录 ==========
.logout-section {
  margin: $spacing-lg $spacing-base 0;
  padding-bottom: $spacing-lg;
}

.logout-btn {
  height: 80rpx;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(20, 20, 20, 0.06);
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
  color: $text-muted;

  &:active { background: rgba(47, 53, 66, 0.04); }
}
</style>
