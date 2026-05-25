<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">增值区</text>
      <view class="page-sub">稳健增值 智慧理财</view>
    </view>

    <!-- 资产总览卡 -->
    <view class="asset-overview" v-if="loggedIn">
      <view class="asset-overview__bg" />
      <view class="asset-overview__inner">
        <view class="asset-overview__top">
          <view class="asset-label-row">
            <text class="asset-overview__label">总资产（积分）</text>
            <view class="asset-overview__eye" @click="toggleAsset">
              <text>{{ showAsset ? '👁' : '👁‍🗨' }}</text>
            </view>
          </view>
          <text class="asset-overview__value">
            {{ showAsset ? ecoPointsDisplay : '******' }}
          </text>
        </view>
        <view class="asset-overview__stats">
          <view class="stat-item">
            <text class="stat-value">{{ showAsset ? yesterdayProfit : '****' }}</text>
            <text class="stat-label">昨日收益（积分）</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item">
            <text class="stat-value">{{ showAsset ? consumerPointsDisplay : '****' }}</text>
            <text class="stat-label">消费积分</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item">
            <text class="stat-value">{{ showAsset ? `¥${balanceDisplay}` : '****' }}</text>
            <text class="stat-label">账户余额</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 未登录 -->
    <view v-if="!loggedIn" class="login-prompt" @click="goLogin">
      <text class="login-prompt__text">登录后查看资产详情</text>
      <text class="login-prompt__btn">立即登录 ›</text>
    </view>

    <!-- 三大增值服务入口 -->
    <view class="services-section">
      <view class="section-head">
        <text class="section-title">增值服务</text>
      </view>
      <view class="service-grid">
        <view
          v-for="svc in services"
          :key="svc.id"
          class="service-card"
          :class="`service-card--${svc.id}`"
          @click="goService(svc)"
        >
          <view class="service-card__glow" />
          <view class="service-card__inner">
            <view class="service-card__icon-wrap">
              <text class="service-card__icon">{{ svc.icon }}</text>
            </view>
            <view class="service-card__info">
              <text class="service-card__name">{{ svc.name }}</text>
              <text class="service-card__desc">{{ svc.desc }}</text>
              <view class="service-card__tag">
                <text>{{ svc.tag }}</text>
              </view>
            </view>
          </view>
          <view class="service-card__arrow">›</view>
        </view>
      </view>
    </view>

    <!-- 我的投资入口 -->
    <view class="my-invest-section" v-if="loggedIn">
      <view class="invest-banner" @click="goMyInvest">
        <view class="invest-banner__left">
          <text class="invest-banner__title">我的投资</text>
          <text class="invest-banner__sub">查看全部投资记录</text>
        </view>
        <view class="invest-banner__right">
          <text class="invest-banner__arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 投资记录 -->
    <view class="invest-history" v-if="loggedIn && investRecords.length > 0">
      <view class="section-head">
        <text class="section-title">最近投资</text>
      </view>
      <view class="record-list">
        <view v-for="record in investRecords.slice(0, 3)" :key="record.id" class="record-item">
          <view class="record-icon">{{ record.icon }}</view>
          <view class="record-info">
            <text class="record-name">{{ record.name }}</text>
            <text class="record-date">{{ record.date }}</text>
          </view>
          <view class="record-profit" :class="{ positive: record.profit > 0 }">
            <text>{{ record.profit > 0 ? '+' : '' }}{{ record.profit }}积分</text>
          </view>
        </view>
      </view>
    </view>

    <view class="safe-area-bottom" />

    <LuxuryTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { checkAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'
import { financialApi } from '@/utils/api'
import LuxuryTabbar from '@/components/LuxuryTabbar.vue'

const statusBarHeight = ref(20)
const loggedIn = ref(checkAuth())
const showAsset = ref(true)

const ecoPointsDisplay = computed(() => assetStore.formatEco(assetStore.ecoPoints))
const consumerPointsDisplay = computed(() => assetStore.formatConsumer(assetStore.consumerPoints))
const balanceDisplay = computed(() => assetStore.formatBalance(assetStore.balance))
const yesterdayProfit = computed(() => assetStore.formatProfit(assetStore.yesterdayProfit))

const services = [
  {
    id: 'compute',
    name: '算力中心',
    icon: '🧮',
    desc: '数字资产算力增值',
    tag: '年化 8-15%',
    gradient: 'linear-gradient(135deg, #1E2433 0%, #2A3142 100%)',
  },
  {
    id: 'crossborder',
    name: '跨境电商',
    icon: '🌐',
    desc: '全球好物 积分兑换',
    tag: '新品上架',
    gradient: 'linear-gradient(135deg, #F9F7F4 0%, #EDE9E1 100%)',
  },
  {
    id: 'quant',
    name: '量化交易',
    icon: '📊',
    desc: '智能量化 稳健套利',
    tag: '专业策略',
    gradient: 'linear-gradient(135deg, #2A3142 0%, #1E2433 100%)',
  },
]

interface InvestRecord { id: number; name: string; icon: string; date: string; profit: number; [k: string]: unknown }
interface ServiceItem { id: string; name: string; icon: string; desc: string; tag: string; gradient: string; [k: string]: unknown }
interface EarningsRecord { id: number; productName: string; profit: string; createdAt: string; [k: string]: unknown }
const investRecords = ref<InvestRecord[]>([])

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (loggedIn.value) {
    assetStore.fetchBalance()
    loadInvestRecords()
  }
})

function loadInvestRecords() {
  financialApi.getEarnings({ limit: 5 })
    .then((res) => {
      const list = (res.list || []).slice(0, 5)
      investRecords.value = list.map((item: EarningsRecord, idx: number) => ({
        id: item.id || idx,
        icon: '🧮',
        name: item.productName || '投资收益',
        date: item.createdAt ? item.createdAt.slice(0, 10) : '',
        profit: Number(item.profit || 0),
      }))
    })
    .catch(() => {
      investRecords.value = []
    })
}

function toggleAsset() {
  showAsset.value = !showAsset.value
}

function goLogin() { uni.navigateTo({ url: '/pages/auth/login' }) }
function goService(svc: ServiceItem) {
  if (!checkAuth()) return
  if (svc.id === 'compute') {
    uni.navigateTo({ url: '/pages/wealth/my-invest' })
  } else {
    uni.showToast({ title: `${svc.name}开发中`, icon: 'none' })
  }
}
function goMyInvest() {
  if (!checkAuth()) return
  uni.navigateTo({ url: '/pages/wealth/my-invest' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  @include page-bg;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.status-bar { width: 100%; }

// ========== 页面标题 ==========
.page-header {
  padding: 12rpx $spacing-base 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;

  .page-title {
    font-size: 40rpx;
    font-weight: 700;
    color: $mineral-gray;
    letter-spacing: 1rpx;
  }

  .page-sub {
    font-size: 24rpx;
    color: $text-muted;
    letter-spacing: 0.3rpx;
  }
}

// ========== 资产总览卡 ==========
.asset-overview {
  position: relative;
  margin: $spacing-base;
  border-radius: $radius-2xl;
  overflow: hidden;
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.22);

  &__bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(145deg, #F5F2ED 0%, #EDE9E1 50%, #F0EDE8 100%);
    z-index: 0;
  }

  &__inner {
    position: relative;
    z-index: 1;
    padding: $spacing-lg;
  }

  &__top {
    margin-bottom: $spacing-lg;
  }

  &__label {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.5);
    display: block;
    margin-bottom: 8rpx;
  }

  &__value {
    font-family: $asset-balance-font;
    font-size: 56rpx;
    font-weight: 700;
    color: $bronze-light;
    letter-spacing: -1rpx;
    font-variant-numeric: tabular-nums;
  }

  &__eye {
    display: inline-block;
    font-size: 28rpx;
    margin-left: 12rpx;
    opacity: 0.7;
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: 0;
    padding-top: $spacing-base;
    border-top: 1rpx solid rgba(255, 255, 255, 0.08);
  }
}

.asset-label-row {
  display: flex;
  align-items: center;
}

.stat-item {
  flex: 1;
  text-align: center;

  .stat-value {
    display: block;
    font-family: $asset-balance-font;
    font-size: 28rpx;
    font-weight: 700;
    color: $bronze-light;
    font-variant-numeric: tabular-nums;
    margin-bottom: 4rpx;
  }

  .stat-label {
    display: block;
    font-size: 18rpx;
    color: rgba(255, 255, 255, 0.45);
  }
}

.stat-divider {
  width: 1rpx;
  height: 48rpx;
  background: rgba(255, 255, 255, 0.08);
}

// ========== 未登录 ==========
.login-prompt {
  margin: $spacing-base;
  padding: $spacing-lg;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__text {
    font-size: 28rpx;
    color: $text-secondary;
    font-weight: 500;
  }

  &__btn {
    font-size: 26rpx;
    color: $accent-dark;
    font-weight: 600;
  }
}

// ========== 服务卡片 ==========
.services-section {
  padding: 0 $spacing-base;
  margin-bottom: $spacing-base;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-base;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $mineral-gray;
  letter-spacing: 0.5rpx;
}

.service-grid {
  display: flex;
  flex-direction: column;
  gap: $spacing-base;
}

.service-card {
  position: relative;
  border-radius: $radius-xl;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    transform: scale(0.98);
  }

  &--compute,
  &--quant {
    background: rgba(255, 255, 255, 0.92);
    .service-card__name { color: $accent-dark; }
    .service-card__desc { color: $text-muted; }
    .service-card__tag {
      background: rgba(184, 152, 118, 0.08);
      color: $accent-dark;
      border-color: rgba(184, 152, 118, 0.20);
    }
    .service-card__arrow { color: $text-muted; }
  }

  &--crossborder {
    .service-card__glow {
      background: radial-gradient(circle at 80% 50%, rgba(184, 152, 118, 0.25) 0%, transparent 60%);
    }
    .service-card__name { color: $accent-dark; }
    .service-card__desc { color: rgba(47, 53, 66, 0.5); }
    .service-card__tag {
      background: rgba(184, 152, 118, 0.08);
      color: $accent-dark;
      border-color: rgba(184, 152, 118, 0.2);
    }
    .service-card__arrow { color: rgba(47, 53, 66, 0.2); }
  }

  &__glow {
    position: absolute;
    top: -20%;
    right: -10%;
    width: 55%;
    height: 100%;
    background: radial-gradient(circle, rgba(184, 152, 118, 0.15) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }

  &__inner {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: $spacing-base;
    padding: 28rpx $spacing-lg;
  }

  &__icon-wrap {
    width: 88rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-xl;
    border: 1rpx solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;

    .service-card__icon {
      font-size: 40rpx;
    }
  }

  &--compute &__icon-wrap,
  &--quant &__icon-wrap {
    background: rgba(184, 152, 118, 0.08);
    border-color: rgba(184, 152, 118, 0.15);
  }

  &--crossborder &__icon-wrap {
    background: rgba(184, 152, 118, 0.08);
    border-color: rgba(184, 152, 118, 0.15);
  }

  &__info {
    flex: 1;
  }

  &__name {
    display: block;
    font-size: 30rpx;
    font-weight: 700;
    margin-bottom: 6rpx;
  }

  &__desc {
    display: block;
    font-size: 22rpx;
    margin-bottom: 10rpx;
  }

  &__tag {
    display: inline-flex;
    padding: 4rpx 12rpx;
    border-radius: 20rpx;
    border: 1rpx solid;
    font-size: 20rpx;
    font-weight: 600;
  }

  &__arrow {
    font-size: 40rpx;
    font-weight: 200;
    flex-shrink: 0;
  }
}

// ========== 我的投资 ==========
.my-invest-section {
  padding: 0 $spacing-base;
  margin-bottom: $spacing-base;
}

.invest-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-xl;
  box-shadow: $clay-shadow;

  &__left {}

  &__title {
    display: block;
    font-size: 28rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 4rpx;
  }

  &__sub {
    display: block;
    font-size: 22rpx;
    color: $text-muted;
  }

  &__arrow {
    font-size: 36rpx;
    color: $text-muted;
  }
}

// ========== 投资记录 ==========
.invest-history {
  padding: 0 $spacing-base;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.record-item {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: $spacing-base;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
}

.record-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  background: rgba(47, 53, 66, 0.06);
  border-radius: $radius-md;
  flex-shrink: 0;
}

.record-info {
  flex: 1;

  .record-name {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 4rpx;
  }

  .record-date {
    display: block;
    font-size: 22rpx;
    color: $text-muted;
  }
}

.record-profit {
  font-family: $asset-balance-font;
  font-size: 28rpx;
  font-weight: 700;
  color: $text-muted;
  font-variant-numeric: tabular-nums;

  &.positive {
    color: $success;
  }
}
</style>
