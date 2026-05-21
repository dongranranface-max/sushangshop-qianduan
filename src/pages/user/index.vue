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
              <text class="badge-text" :class="{ 'badge-wide': String(userInfo.level || 1).length > 1 }">
                V{{ userInfo.level || 1 }}
              </text>
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
    <view class="dividend-banner" v-if="loggedIn">
      <view class="dividend-inner">
        <view class="dividend-left">
          <text class="dividend-icon">红</text>
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
      <view class="vip-section__glow" />
      <view class="vip-header">
        <view class="vip-hero">
          <view class="vip-hero__tier">
            <text class="vip-tier-label">VIP</text>
            <text class="vip-tier-num">{{ userInfo.level || 1 }}</text>
          </view>
          <text class="vip-tier-name">{{ (levelName || 'V1').toUpperCase() }}</text>
        </view>
        <view class="vip-level-badge" :class="'v' + (userInfo.level || 1)">
          <text class="vip-badge-text">会员成长</text>
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
import { onShow } from '@dcloudio/uni-app'
import { userApi, walletApi, levelApi, orderApi } from '@/utils/api'
import { checkAuth, requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const loggedIn = ref(checkAuth())
const userInfo = ref<any>({ name: '', id: '', level: 1, avatar: '' })
const ecoPointsDisplay = ref('0')
const consumerPointsDisplay = ref('0')
const balanceDisplay = ref('0.00')
const yesterdayProfit = ref('0.00')
const vipProgress = ref(0)
const isDataLoading = ref(false)
const remainingPerformance = ref(0)
const levelName = ref('')
const orderCounts = ref<any>({ pending: 0, shipped: 0, received: 0, completed: 0 })

const orderTabs = [
  { key: 'pending', label: '待付款', icon: '付' },
  { key: 'shipped', label: '待发货', icon: '发' },
  { key: 'received', label: '待收货', icon: '收' },
  { key: 'completed', label: '已完成', icon: '完' },
]

const toolItems = [
  { id: 1, icon: '卡', label: '银行卡', bg: '#F7F3EB', action: () => goPage('/pages/user/bank-card') },
  { id: 2, icon: '址', label: '收货地址', bg: '#EEF1F5', action: () => goPage('/pages/address/list') },
  { id: 3, icon: '券', label: '优惠券', bg: '#F5F0EB', action: () => goPage('/pages/coupon/list') },
  { id: 4, icon: '藏', label: '我的收藏', bg: '#F7F3EB', action: () => showComing() },
  { id: 5, icon: '签', label: '签到中心', bg: '#F5F0EB', tag: '+10', action: () => goPage('/pages/user/sign-in') },
  { id: 6, icon: '邀', label: '邀请分享', bg: '#EEF1F5', action: () => goPage('/pages/user/invite') },
  { id: 7, icon: '服', label: '客服中心', bg: '#EEF1F5', action: () => showComing() },
  { id: 8, icon: '设', label: '设置', bg: '#EEF1F5', action: () => showComing() },
]

const menuItems = [
  { id: 1, icon: '分', label: '积分明细', action: () => goPage('/pages/user/points-detail') },
  { id: 2, icon: '团', label: '我的团队', action: () => goPage('/pages/user/invite') },
  { id: 3, icon: '兑', label: '兑换记录', action: () => goPage('/pages/exchange/list') },
  { id: 4, icon: '退', label: '退换货', action: () => showComing() },
]

const shortId = computed(() => {
  const id = userInfo.value.id || ''
  if (!id) return ''
  return id.length > 8 ? id.slice(0, 8) + '...' : id
})

const levelClass = computed(() => 'level-' + (userInfo.value.level || 1))

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (!loggedIn.value) {
    userInfo.value = { name: '', id: '', level: 1, avatar: '' }
    ecoPointsDisplay.value = '0'
    consumerPointsDisplay.value = '0'
    balanceDisplay.value = '0.00'
    yesterdayProfit.value = '0.00'
    vipProgress.value = 0
    remainingPerformance.value = 0
    levelName.value = ''
    return
  }
  loadUserData()
})

async function loadUserData() {
  isDataLoading.value = true
  try {
    const [profile, bal] = await Promise.all([
      userApi.getProfile(),
      walletApi.getBalance(),
    ])
    userInfo.value = {
      name: profile.nickname || profile.phone || '用户',
      id: profile.id || '',
      level: profile.level || 1,
      avatar: profile.avatar || '',
    }
    ecoPointsDisplay.value = Number(bal.ecoPoints || 0).toLocaleString()
    consumerPointsDisplay.value = Number(bal.consumerPoints || 0).toLocaleString()
    balanceDisplay.value = Number(bal.balance || 0).toFixed(2)
    yesterdayProfit.value = Number(bal.yesterdayProfit || bal.todayEarnings || 0).toFixed(2)
    levelName.value = profile.levelName || 'V1'
    const myPerformance = Number(bal.teamPerformance || 0)
    const target = Number(data.minPerformance || 5000)
    vipProgress.value = target > 0 ? Math.min(100, (myPerformance / target) * 100) : 0
    remainingPerformance.value = Math.max(0, target - myPerformance)

    loadOrderCounts()
  } catch (e) {
    console.error('加载失败', e)
    uni.showToast({ title: '加载失败，请下拉刷新', icon: 'none' })
  } finally {
    isDataLoading.value = false
  }
}

async function loadOrderCounts() {
  try {
    const statuses = ['pending', 'shipped', 'received', 'completed']
    const results = await Promise.all(
      statuses.map(s => orderApi.getList({ status: getStatusCode(s), limit: 1 }))
    )
    results.forEach((res: any, i) => {
      orderCounts.value[statuses[i]] = Number(res?.total ?? 0)
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
  if (!requireAuth()) return
  if (status) uni.setStorageSync('orderListStatus', status)
  else uni.removeStorageSync('orderListStatus')
  uni.navigateTo({ url: '/pages/order/list' })
}
function goLevelDetail() { showComing() }
function showComing() { uni.showToast({ title: '功能开发中', icon: 'none' }) }
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.page-container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0 var(--spacing-lg);
}

// =============================================
// 1. 用户卡片
// =============================================
.user-card {
  position: relative;
  @include premium-surface($bg-secondary);
  border-radius: $radius-2xl;
  padding: 32rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: -60rpx; right: -60rpx;
  width: 200rpx; height: 200rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201,162,39,0.15) 0%, transparent 70%);
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
  // 兼容方案：用线性渐变旋转模拟 conic-gradient 效果
  background: linear-gradient(
    var(--primary),
    var(--primary-light),
    var(--navy-muted),
    var(--primary)
  );
  animation: ring-spin 4s linear infinite;
  // 兼容：不支持 conic-gradient 时保持静态渐变
  @supports (background: conic-gradient(red, blue)) {
    background: conic-gradient(
      from 0deg,
      var(--primary) 0deg,
      var(--primary-light) 120deg,
      var(--primary) 240deg
    );
  }
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

// 会员徽章
.member-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48rpx;
  height: 36rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, $gold, $accent-dark);

  .badge-text {
    font-size: 20rpx;
    font-weight: 800;
    letter-spacing: 0.06em;
    color: #fff;

    &.badge-wide {
      font-size: 18rpx;
      letter-spacing: 0.02em;
    }
  }
}

.user-name {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.user-id {
  font-size: 22rpx;
  color: var(--text-muted);
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
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .mini-bar {
    flex: 1;
    height: 4rpx;
    background: $bg-tertiary;
    border-radius: 999rpx;
    overflow: hidden;

    .mini-fill {
      height: 100%;
      background: $gold-gradient;
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
  background: $warm-yellow;
  border: 1rpx solid $border-primary;
  border-radius: $radius-lg;
  padding: 16rpx 20rpx;
  flex-shrink: 0;

  .invite-icon {
    font-size: 32rpx;
    font-weight: var(--weight-heavy);
    color: $navy;
  }
  .invite-text { font-size: 20rpx; color: $accent-dark; font-weight: 600; }
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
    color: var(--text-primary);
    letter-spacing: -1rpx;

    &.accent { color: $accent-dark; }

    &.gold { color: $gold; }
  }

  .asset-mini-label {
    font-size: 20rpx;
    color: var(--text-muted);
    display: block;
    margin-top: 2rpx;
  }
}

.asset-divider {
  width: 1rpx; height: 50rpx;
  background: $border-color;
}

// =============================================
// 2. 分红 Banner
// =============================================
.dividend-banner {
  @include premium-surface($warm-yellow);
  border-radius: $radius-lg;
  padding: 24rpx;
  margin-bottom: 20rpx;
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
    color: var(--text-secondary);
    display: block;
  }

  .dividend-value {
    font-size: 40rpx;
    font-weight: 800;
    @include ai-jelly-text;
    display: block;
  }
}

.dividend-btn {
  background: $accent-fire;
  border-radius: 999rpx;
  padding: 14rpx 28rpx;
  box-shadow: $shadow-glow;

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
    color: var(--text-primary);
  }

  .section-more {
    display: flex;
    align-items: center;
    gap: 4rpx;

    .more-text { font-size: 24rpx; color: var(--text-muted); }
    .more-arrow { font-size: 28rpx; color: var(--primary); }
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
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;

  .tab-icon {
    font-size: 30rpx;
    font-weight: var(--weight-heavy);
    color: $navy;
  }
}

.tab-badge {
  position: absolute;
  top: -10rpx; right: -10rpx;
  min-width: 32rpx; height: 32rpx;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
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
  color: var(--text-secondary);
}

// =============================================
// 4. 功能网格
// =============================================
.tools-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rpx;
  background: $border-light;
  border-radius: $radius-xl;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.tool-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 24rpx 8rpx;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: none;
  border-radius: 0;
  &:first-child { border-radius: $radius-xl 0 0 0; }
  &:nth-child(4) { border-radius: 0 $radius-xl 0 0; }
  &:nth-child(5) { border-radius: 0 0 0 $radius-xl; }
  &:last-child { border-radius: 0 0 $radius-xl 0; }

  &:active {
    border-color: rgba(201,162,39,0.4);
  }
}

.tool-icon-wrap {
  width: 72rpx; height: 72rpx;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;

  .tool-icon { font-size: 40rpx; }
}

.tool-label {
  font-size: 22rpx;
  color: var(--text-secondary);
  text-align: center;
}

.tool-tag {
  position: absolute;
  top: 10rpx; right: 10rpx;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
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
  position: relative;
  overflow: hidden;
  margin-bottom: 20rpx;
  background: linear-gradient(145deg, rgba(26, 36, 56, 0.04) 0%, rgba(196, 165, 116, 0.08) 100%);
  border: 1rpx solid rgba(196, 165, 116, 0.28);
  box-shadow: 0 16rpx 48rpx rgba(26, 36, 56, 0.08), 0 0 48rpx rgba(196, 165, 116, 0.1);

  &__glow {
    position: absolute;
    top: -30%;
    right: -20%;
    width: 60%;
    height: 70%;
    background: radial-gradient(circle, rgba(196, 165, 116, 0.22) 0%, transparent 70%);
    pointer-events: none;
  }
}

.vip-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.vip-hero {
  display: flex;
  flex-direction: column;
  gap: 6rpx;

  &__tier {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
  }
}

.vip-tier-label {
  font-size: var(--font-card-title);
  font-weight: var(--weight-bold);
  letter-spacing: 0.2em;
  color: $accent-dark;
  text-transform: uppercase;
}

.vip-tier-num {
  font-size: 64rpx;
  font-weight: var(--weight-heavy);
  line-height: 1;
  color: $navy;
  text-shadow: 0 0 40rpx rgba(196, 165, 116, 0.45);
}

.vip-tier-name {
  font-size: var(--font-caption);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.14em;
  color: $text-secondary;
  text-transform: uppercase;
}

.vip-level-badge {
  font-size: 22rpx;
  font-weight: 700;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;

  &.v1, &.v2, &.v3 {
    background: rgba(201,162,39,0.2);
    color: var(--primary-light);
    border: 1rpx solid rgba(201,162,39,0.4);
  }
  &.v4, &.v5, &.v6 {
    background: $warm-blue;
    color: $navy;
    border: 1rpx solid $border-color;
  }
  &.v7, &.v8, &.v9 {
    background: $accent-fire;
    color: $text-inverse;
    border: none;
  }
}

// 9级能量球
.energy-orbs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
  position: relative;

  // 连接线
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 40rpx;
    right: 40rpx;
    height: 2rpx;
    background: $border-primary;
    z-index: 0;
    transform: translateY(-50%);
  }
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
    background: radial-gradient(circle at 30% 30%, rgba(201,162,39,0.5), rgba(201,162,39,0.1));
    border: 2rpx solid rgba(201,162,39,0.5);
    box-shadow: 0 0 16rpx rgba(201,162,39,0.3);
    &.active { box-shadow: 0 0 24rpx rgba(201,162,39,0.5); }
  }

  &.v2 {
    background: radial-gradient(circle at 30% 30%, rgba(45, 58, 82, 0.35), rgba(45, 58, 82, 0.08));
    border: 2rpx solid rgba(45, 58, 82, 0.35);
    box-shadow: 0 0 12rpx rgba(26, 36, 56, 0.12);
    &.active { box-shadow: 0 0 20rpx rgba(26, 36, 56, 0.2); }
  }

  &.v3 {
    background: radial-gradient(circle at 30% 30%, rgba(196, 165, 116, 0.55), rgba(154, 123, 79, 0.15));
    border: 2rpx solid rgba(196, 165, 116, 0.5);
    box-shadow: 0 0 16rpx $accent-glow;
    &.active { box-shadow: 0 0 24rpx $accent-glow; }
  }

  .orb-label {
    font-size: 20rpx;
    font-weight: 800;
    color: $navy;
  }

  &.active.v3 .orb-label { color: $text-inverse; }
}

.vip-progress-row {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;

  .progress-label { @include type-caption; }
  .progress-value {
    font-size: var(--font-body);
    color: $accent-dark;
    font-weight: var(--weight-semibold);
  }
}

.vip-section .progress-bar {
  position: relative;
  z-index: 1;
  height: 14rpx;
  background: rgba(26, 36, 56, 0.08);
  border-radius: $radius-full;
  overflow: visible;
  margin-bottom: 4rpx;

  .progress-fill {
    height: 100%;
    border-radius: $radius-full;
    background: linear-gradient(90deg, $accent-dark 0%, $gold 50%, $gold-light 100%);
    box-shadow:
      0 0 18rpx rgba(196, 165, 116, 0.8),
      0 0 36rpx rgba(196, 165, 116, 0.4);
    transition: width 0.4s ease;
  }
}

.vip-perks {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
  margin-top: 16rpx;

  .perk-tag {
    font-size: 20rpx;
    color: var(--primary-light);
    background: rgba(201,162,39,0.1);
    border: 1rpx solid rgba(201,162,39,0.2);
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
  border-bottom: 1rpx solid var(--border-light);

  &:last-child { border-bottom: none; }

  &:active .menu-arrow { color: var(--primary-light); }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 16rpx;

  .menu-icon { font-size: 40rpx; }
  .menu-label { font-size: 30rpx; color: var(--text-primary); }
}

.menu-right {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .menu-value { font-size: 26rpx; color: var(--text-muted); }
  .menu-arrow { font-size: 28rpx; color: var(--text-muted); }
}
</style>
