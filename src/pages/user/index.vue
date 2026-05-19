<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- ========== 1. 用户信息卡片 ========== -->
    <view class="user-card" @click="goProfile">
      <view class="card-glow"></view>
      <view class="user-inner">
        <!-- 头像 -->
        <view class="avatar-wrap" :class="levelClass">
          <image
            class="avatar-img"
            :src="userInfo.avatar || 'https://picsum.photos/200/200?random=avatar'"
            mode="aspectFill"
          />
          <view class="avatar-ring"></view>
        </view>

        <!-- 用户信息 -->
        <view class="user-info">
          <view class="user-name-row">
            <text class="user-name">{{ userInfo.name || '游客' }}</text>
            <!-- 会员能量徽章 -->
            <view class="member-badge" :class="'v' + (userInfo.level || 1)">
              <text class="badge-text">V{{ userInfo.level || 1 }}</text>
            </view>
          </view>
          <text class="user-id">ID: {{ shortId }}</text>
          <view class="vip-progress-mini">
            <text class="vip-label">V{{ userInfo.level || 1 }}</text>
            <view class="mini-bar">
              <view class="mini-fill" :style="{ width: vipProgress + '%' }"></view>
            </view>
            <text class="vip-label">V{{ Math.min((userInfo.level || 1) + 1, 9) }}</text>
          </view>
        </view>

        <!-- 推广按钮 -->
        <view class="invite-btn" @click.stop="goInvite">
          <text class="invite-icon">👑</text>
          <text class="invite-text">邀请</text>
        </view>
      </view>

      <!-- 资产摘要行 -->
      <view class="asset-row">
        <view class="asset-mini">
          <text class="asset-mini-value">{{ ecoPointsDisplay }}</text>
          <text class="asset-mini-label">生态积分</text>
        </view>
        <view class="asset-divider"></view>
        <view class="asset-mini">
          <text class="asset-mini-value accent">{{ consumerPointsDisplay }}</text>
          <text class="asset-mini-label">消费积分</text>
        </view>
        <view class="asset-divider"></view>
        <view class="asset-mini">
          <text class="asset-mini-value gold">¥{{ balanceDisplay }}</text>
          <text class="asset-mini-label">账户余额</text>
        </view>
      </view>
    </view>

    <!-- ========== 2. 每日分红 Banner ========== -->
    <view class="dividend-banner" v-if="isLoggedIn">
      <view class="dividend-inner">
        <view class="dividend-left">
          <text class="dividend-icon">🔥</text>
          <view class="dividend-info">
            <text class="dividend-title">昨日分红</text>
            <text class="dividend-value">+{{ yesterdayProfit }}积分</text>
          </view>
        </view>
        <view class="dividend-btn" @click="goSignIn">
          <text class="dividend-btn-text">签到领积分</text>
        </view>
      </view>
    </view>

    <!-- ========== 3. 订单入口 ========== -->
    <view class="order-section glass-card">
      <view class="order-header">
        <text class="section-title">我的订单</text>
        <view class="section-more" @click="goOrderList()">
          <text class="more-text">全部订单</text>
          <text class="more-arrow">›</text>
        </view>
      </view>
      <view class="order-tabs">
        <view class="order-tab" v-for="tab in orderTabs" :key="tab.key"
          @click="goOrderList(tab.key)">
          <view class="tab-icon-wrap">
            <text class="tab-icon">{{ tab.icon }}</text>
            <view class="tab-badge" v-if="orderCounts[tab.key] > 0">
              {{ orderCounts[tab.key] > 99 ? '99+' : orderCounts[tab.key] }}
            </view>
          </view>
          <text class="tab-label">{{ tab.label }}</text>
        </view>
      </view>
    </view>

    <!-- ========== 4. 功能网格 ========== -->
    <view class="tools-grid">
      <view class="tool-item" v-for="tool in toolItems" :key="tool.id" @click="tool.action">
        <view class="tool-icon-wrap" :style="{ background: tool.bg }">
          <text class="tool-icon">{{ tool.icon }}</text>
        </view>
        <text class="tool-label">{{ tool.label }}</text>
        <view class="tool-tag" v-if="tool.tag">{{ tool.tag }}</view>
      </view>
    </view>

    <!-- ========== 5. 会员成长体系 ========== -->
    <view class="vip-section glass-card" @click="goLevelDetail">
      <view class="vip-header">
        <view class="vip-title-group">
          <text class="vip-icon">🏆</text>
          <text class="vip-title">会员等级</text>
        </view>
        <view class="vip-level-badge" :class="'v' + (userInfo.level || 1)">
          <text class="vip-badge-text">V{{ userInfo.level || 1 }} {{ levelName }}</text>
        </view>
      </view>

      <!-- 9级能量球展示 -->
      <view class="energy-orbs">
        <view
          class="energy-orb"
          v-for="i in 9"
          :key="i"
          :class="[
            'orb-' + i,
            { active: (userInfo.level || 1) >= i },
            'v' + Math.ceil(i / 3)
          ]"
        >
          <text class="orb-label">V{{ i }}</text>
        </view>
      </view>

      <view class="vip-progress-row">
        <text class="progress-label">距离 V{{ Math.min((userInfo.level || 1) + 1, 9) }} 还差</text>
        <text class="progress-value">{{ remainingPerformance }}业绩</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: vipProgress + '%' }"></view>
      </view>
      <view class="vip-perks">
        <text class="perk-tag" v-if="userInfo.level >= 3">③ 每日分红</text>
        <text class="perk-tag" v-if="userInfo.level >= 5">⑤ 专属客服</text>
        <text class="perk-tag" v-if="userInfo.level >= 7">⑦ 优先发货</text>
        <text class="perk-tag" v-if="userInfo.level >= 9">⑨ 最高权益</text>
      </view>
    </view>

    <!-- ========== 6. 其他功能 ========== -->
    <view class="menu-section glass-card">
      <view class="menu-item" v-for="item in menuItems" :key="item.id" @click="item.action">
        <view class="menu-left">
          <text class="menu-icon">{{ item.icon }}</text>
          <text class="menu-label">{{ item.label }}</text>
        </view>
        <view class="menu-right">
          <text class="menu-value" v-if="item.value">{{ item.value }}</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { userApi, walletApi, levelApi, orderApi } from '@/utils/api'
import { isLoggedIn, requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const userInfo = ref<any>({ name: '', id: '', level: 1, avatar: '' })
const ecoPointsDisplay = ref('0')
const consumerPointsDisplay = ref('0')
const balanceDisplay = ref('0.00')
const yesterdayProfit = ref('0.00')
const vipProgress = ref(0)
const remainingPerformance = ref(0)
const levelName = ref('')
const orderCounts = ref<any>({ pending: 0, shipped: 0, received: 0, completed: 0 })

const orderTabs = [
  { key: 'pending', label: '待付款', icon: '⏳' },
  { key: 'shipped', label: '待发货', icon: '📦' },
  { key: 'received', label: '待收货', icon: '🚚' },
  { key: 'completed', label: '已完成', icon: '✅' },
]

const toolItems = [
  { id: 1, icon: '🏦', label: '银行卡', bg: 'rgba(77,142,255,0.15)', action: () => goPage('/pages/user/bank-card') },
  { id: 2, icon: '📍', label: '收货地址', bg: 'rgba(0,242,254,0.12)', action: () => goPage('/pages/address/list') },
  { id: 3, icon: '🎫', label: '优惠券', bg: 'rgba(255,140,0,0.12)', action: () => goPage('/pages/coupon/list') },
  { id: 4, icon: '⭐', label: '我的收藏', bg: 'rgba(255,215,0,0.12)', action: () => showComing() },
  { id: 5, icon: '📝', label: '签到中心', bg: 'rgba(255,69,0,0.12)', tag: '+10', action: () => goPage('/pages/user/sign-in') },
  { id: 6, icon: '👥', label: '邀请分享', bg: 'rgba(139,92,246,0.15)', action: () => goPage('/pages/user/invite') },
  { id: 7, icon: '💬', label: '客服中心', bg: 'rgba(20,184,166,0.12)', action: () => showComing() },
  { id: 8, icon: '⚙️', label: '设置', bg: 'rgba(100,116,139,0.15)', action: () => showComing() },
]

const menuItems = [
  { id: 1, icon: '💰', label: '积分明细', action: () => goPage('/pages/user/points-detail') },
  { id: 2, icon: '📊', label: '我的团队', action: () => goPage('/pages/user/invite') },
  { id: 3, icon: '🎁', label: '兑换记录', action: () => goPage('/pages/exchange/list') },
  { id: 4, icon: '🛒', label: '退换货', action: () => showComing() },
]

const shortId = computed(() => {
  const id = userInfo.value.id || ''
  return id.length > 8 ? id.slice(0, 8) + '...' : id
})

const levelClass = computed(() => 'level-' + (userInfo.value.level || 1))

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  const loggedIn = isLoggedIn()
  if (loggedIn) loadUserData()
})

async function loadUserData() {
  try {
    const [profile, bal] = await Promise.all([
      userApi.getProfile(),
      walletApi.getBalance(),
    ])
    userInfo.value = {
      name: profile.nickname || profile.phone || '用户',
      id: profile.userId || '',
      level: profile.level || 1,
      avatar: profile.avatar || '',
    }
    ecoPointsDisplay.value = Number(bal.ecoPoints || 0).toLocaleString()
    consumerPointsDisplay.value = Number(bal.consumerPoints || 0).toLocaleString()
    balanceDisplay.value = Number(bal.balance || 0).toFixed(2)
    yesterdayProfit.value = bal.yesterdayProfit || '0.00'
    levelName.value = bal.levelName || '新秀'
    vipProgress.value = bal.vipProgress || 0
    remainingPerformance.value = bal.remainingPerformance || 0

    loadOrderCounts()
  } catch (e) {
    console.error('加载失败', e)
  }
}

async function loadOrderCounts() {
  try {
    const statuses = ['pending', 'shipped', 'received', 'completed']
    const results = await Promise.all(
      statuses.map(s => orderApi.getList({ status: getStatusCode(s), limit: 1 }))
    )
    results.forEach((res: any, i) => {
      orderCounts.value[statuses[i]] = res.total || 0
    })
  } catch (e) {
    console.error('订单计数失败', e)
  }
}

function getStatusCode(key: string): number {
  const map: Record<string, number> = { pending: 1, shipped: 2, received: 3, completed: 4 }
  return map[key] || 1
}

function goPage(url: string) {
  if (!requireAuth()) return
  uni.navigateTo({ url })
}

function goProfile() {
  if (!requireAuth()) return
  uni.navigateTo({ url: '/pages/user/profile' })
}

function goInvite() { goPage('/pages/user/invite') }
function goSignIn() { goPage('/pages/user/sign-in') }
function goOrderList(status?: string) {
  const url = status ? `/pages/order/list?status=${status}` : '/pages/order/list'
  goPage(url)
}
function goLevelDetail() { showComing() }
function showComing() { uni.showToast({ title: '功能开发中', icon: 'none' }) }
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: $bg-primary;
  padding: 0 $spacing-lg;
}

// =============================================
// 1. 用户卡片
// =============================================
.user-card {
  position: relative;
  background: linear-gradient(145deg,
    rgba(30,41,59,0.70) 0%,
    rgba(10,22,40,0.85) 100%);
  backdrop-filter: blur(20px);
  border: 1rpx solid rgba(77,142,255,0.22);
  border-radius: $radius-xl;
  padding: 32rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: -60rpx; right: -60rpx;
  width: 200rpx; height: 200rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(77,142,255,0.15) 0%, transparent 70%);
  pointer-events: none;
}

.user-inner {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  position: relative;
  z-index: 1;
}

// 头像
.avatar-wrap {
  position: relative;
  width: 112rpx; height: 112rpx;
  flex-shrink: 0;

  &.level-7, &.level-8, &.level-9 {
    .avatar-ring {
      background: conic-gradient(from 0deg, #FF4500, #FF8C00, #FF4500);
      animation: ring-spin 3s linear infinite;
    }
  }
}

.avatar-img {
  width: 100rpx; height: 100rpx;
  border-radius: 50%;
  position: absolute;
  top: 6rpx; left: 6rpx;
  z-index: 1;
  border: 3rpx solid rgba(255,255,255,0.2);
}

.avatar-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg, $primary, $primary-light, $primary);
  animation: ring-spin 4s linear infinite;
}

@keyframes ring-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.user-info {
  flex: 1;
  margin-left: 20rpx;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 6rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
}

.user-id {
  font-size: 22rpx;
  color: $text-muted;
  display: block;
  margin-bottom: 10rpx;
}

// VIP 进度条
.vip-progress-mini {
  display: flex;
  align-items: center;
  gap: 10rpx;

  .vip-label {
    font-size: 20rpx;
    color: $text-muted;
    flex-shrink: 0;
  }

  .mini-bar {
    flex: 1;
    height: 4rpx;
    background: rgba(255,255,255,0.08);
    border-radius: 999rpx;
    overflow: hidden;

    .mini-fill {
      height: 100%;
      background: linear-gradient(90deg, $primary-dark, $primary-light);
      border-radius: 999rpx;
    }
  }
}

// 邀请按钮
.invite-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  background: rgba(255,140,0,0.15);
  border: 1rpx solid rgba(255,140,0,0.25);
  border-radius: $radius-lg;
  padding: 16rpx 20rpx;
  flex-shrink: 0;

  .invite-icon { font-size: 40rpx; }
  .invite-text { font-size: 20rpx; color: $accent; font-weight: 600; }
}

// 资产摘要行
.asset-row {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
}

.asset-mini {
  flex: 1;
  text-align: center;

  .asset-mini-value {
    display: block;
    font-size: 36rpx;
    font-weight: 800;
    color: $text-primary;
    letter-spacing: -1rpx;

    &.accent {
      background: linear-gradient(135deg, $accent-light, $accent-dark);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0 0 8rpx rgba(255,140,0,0.4));
    }

    &.gold { color: $gold; }
  }

  .asset-mini-label {
    font-size: 20rpx;
    color: $text-muted;
    display: block;
    margin-top: 2rpx;
  }
}

.asset-divider {
  width: 1rpx; height: 50rpx;
  background: rgba(255,255,255,0.08);
}

// =============================================
// 2. 分红 Banner
// =============================================
.dividend-banner {
  background: linear-gradient(135deg, rgba(255,140,0,0.15), rgba(255,69,0,0.08));
  border: 1rpx solid rgba(255,140,0,0.20);
  border-radius: $radius-lg;
  padding: 24rpx;
  margin-bottom: 20rpx;
  animation: fire-breathe 3s ease-in-out infinite;
}

.dividend-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dividend-left {
  display: flex;
  align-items: center;
  gap: 16rpx;

  .dividend-icon { font-size: 56rpx; }

  .dividend-title {
    font-size: 22rpx;
    color: $text-secondary;
    display: block;
  }

  .dividend-value {
    font-size: 40rpx;
    font-weight: 800;
    background: linear-gradient(135deg, $accent-light, $accent-dark);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 8rpx rgba(255,140,0,0.5));
    display: block;
  }
}

.dividend-btn {
  background: $accent-fire;
  border-radius: 999rpx;
  padding: 14rpx 28rpx;
  box-shadow: $shadow-fire;

  .dividend-btn-text {
    font-size: 26rpx;
    font-weight: 700;
    color: #fff;
  }
}

// =============================================
// 3. 订单入口
// =============================================
.order-section {
  margin-bottom: 20rpx;
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: 700;
    color: $text-primary;
  }

  .section-more {
    display: flex;
    align-items: center;
    gap: 4rpx;

    .more-text { font-size: 24rpx; color: $text-muted; }
    .more-arrow { font-size: 28rpx; color: $primary; }
  }
}

.order-tabs {
  display: flex;
  justify-content: space-around;
}

.order-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.tab-icon-wrap {
  position: relative;
  width: 80rpx; height: 80rpx;
  background: $glass-bg;
  border: 1rpx solid $glass-border;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;

  .tab-icon { font-size: 44rpx; }
}

.tab-badge {
  position: absolute;
  top: -10rpx; right: -10rpx;
  min-width: 32rpx; height: 32rpx;
  background: linear-gradient(135deg, $accent, $accent-dark);
  border-radius: 999rpx;
  font-size: 20rpx;
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
  box-shadow: 0 4rpx 12rpx rgba(255,69,0,0.4);
}

.tab-label {
  font-size: 22rpx;
  color: $text-secondary;
}

// =============================================
// 4. 功能网格
// =============================================
.tools-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.tool-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 20rpx 8rpx;
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: 1rpx solid $glass-border;
  border-radius: $radius-lg;

  &:active {
    border-color: rgba(77,142,255,0.4);
  }
}

.tool-icon-wrap {
  width: 72rpx; height: 72rpx;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;

  .tool-icon { font-size: 40rpx; }
}

.tool-label {
  font-size: 22rpx;
  color: $text-secondary;
  text-align: center;
}

.tool-tag {
  position: absolute;
  top: 10rpx; right: 10rpx;
  background: linear-gradient(135deg, $accent, $accent-dark);
  color: #fff;
  font-size: 18rpx;
  font-weight: 700;
  padding: 2rpx 8rpx;
  border-radius: 999rpx;
}

// =============================================
// 5. VIP 成长体系
// =============================================
.vip-section {
  margin-bottom: 20rpx;
}

.vip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.vip-title-group {
  display: flex;
  align-items: center;
  gap: 10rpx;

  .vip-icon { font-size: 36rpx; }
  .vip-title {
    font-size: 32rpx;
    font-weight: 700;
    color: $text-primary;
  }
}

.vip-level-badge {
  font-size: 22rpx;
  font-weight: 700;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;

  &.v1, &.v2, &.v3 {
    background: rgba(77,142,255,0.2);
    color: $primary-light;
    border: 1rpx solid rgba(77,142,255,0.4);
  }
  &.v4, &.v5, &.v6 {
    background: rgba(0,242,254,0.15);
    color: $primary-light;
    border: 1rpx solid rgba(0,242,254,0.4);
  }
  &.v7, &.v8, &.v9 {
    background: linear-gradient(135deg, rgba(255,69,0,0.3), rgba(139,0,0,0.2));
    color: #fff;
    border: 1rpx solid rgba(255,69,0,0.5);
    animation: badge-pulse 2s ease-in-out infinite;
  }
}

// 9级能量球
.energy-orbs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
  position: relative;
}

.energy-orb {
  width: 64rpx; height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  opacity: 0.3;
  transition: all 0.4s ease;

  &.active { opacity: 1; }

  // 低等级：冰蓝
  &.v1 {
    background: radial-gradient(circle at 30% 30%, rgba(77,142,255,0.5), rgba(77,142,255,0.1));
    border: 2rpx solid rgba(77,142,255,0.5);
    box-shadow: 0 0 16rpx rgba(77,142,255,0.3);
    &.active { box-shadow: 0 0 24rpx rgba(77,142,255,0.5); }
  }

  // 中等级：青蓝
  &.v2 {
    background: radial-gradient(circle at 30% 30%, rgba(0,242,254,0.5), rgba(0,242,254,0.1));
    border: 2rpx solid rgba(0,242,254,0.5);
    box-shadow: 0 0 16rpx rgba(0,242,254,0.3);
    &.active { box-shadow: 0 0 24rpx rgba(0,242,254,0.5); }
  }

  // 高等级：火红
  &.v3 {
    background: radial-gradient(circle at 30% 30%, rgba(255,69,0,0.6), rgba(139,0,0,0.3));
    border: 2rpx solid rgba(255,69,0,0.6);
    box-shadow: 0 0 16rpx rgba(255,69,0,0.4);
    &.active { box-shadow: 0 0 30rpx rgba(255,69,0,0.6); animation: badge-pulse 2s ease-in-out infinite; }
  }

  .orb-label {
    font-size: 20rpx;
    font-weight: 800;
    color: #fff;
  }
}

.vip-progress-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;

  .progress-label { font-size: 22rpx; color: $text-muted; }
  .progress-value { font-size: 22rpx; color: $accent; font-weight: 600; }
}

.vip-perks {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
  margin-top: 16rpx;

  .perk-tag {
    font-size: 20rpx;
    color: $primary-light;
    background: rgba(77,142,255,0.1);
    border: 1rpx solid rgba(77,142,255,0.2);
    padding: 4rpx 12rpx;
    border-radius: 999rpx;
  }
}

// =============================================
// 6. 菜单列表
// =============================================
.menu-section {
  margin-bottom: 40rpx;
  padding: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 4rpx;
  border-bottom: 1rpx solid $border-light;

  &:last-child { border-bottom: none; }

  &:active .menu-arrow { color: $primary-light; }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 16rpx;

  .menu-icon { font-size: 40rpx; }
  .menu-label { font-size: 30rpx; color: $text-primary; }
}

.menu-right {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .menu-value { font-size: 26rpx; color: $text-muted; }
  .menu-arrow { font-size: 28rpx; color: $text-muted; }
}
</style>
