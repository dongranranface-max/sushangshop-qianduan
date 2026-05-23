<template>
  <view class="page-container">
    <!-- 顶部沉浸式资产状态栏 -->
    <AssetStatusBar v-if="loggedIn" />
    <view v-else class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 页面标题 -->
    <view class="page-header" v-if="!loggedIn">
      <text class="page-title">增值区</text>
    </view>
    
    <!-- 资产加载骨架屏 -->
    <view class="asset-card" v-if="loadingAsset">
      <view class="asset-header">
        <view class="sk-line sk-short"></view>
        <view class="sk-line sk-short"></view>
      </view>
      <view class="asset-values">
        <view class="asset-item">
          <view class="sk-value"></view>
          <view class="sk-line sk-full"></view>
        </view>
        <view class="asset-divider"></view>
        <view class="asset-item">
          <view class="sk-value"></view>
          <view class="sk-line sk-full"></view>
        </view>
      </view>
    </view>

    <!-- 我的资产卡片 -->
    <view class="asset-card" v-else>
      <view class="asset-header">
        <text class="asset-label">增值资产</text>
        <text class="asset-detail" @click="goAssetDetail">明细 ›</text>
      </view>
      
      <view class="asset-values">
        <view class="asset-item">
          <text class="asset-value text-gold">{{ ecoPoints.toLocaleString() }}</text>
          <text class="asset-name">生态积分</text>
          <text class="asset-sub">≈ ¥{{ (ecoPoints / 100).toFixed(2) }}</text>
        </view>
        <view class="asset-divider"></view>
        <view class="asset-item">
          <text class="asset-value text-primary">{{ creditPoints.toLocaleString() }}</text>
          <text class="asset-name">消费积分</text>
          <text class="asset-sub">可兑免费商品</text>
        </view>
      </view>
      
      <!-- 昨日分红大字 -->
      <view class="yesterday-profit">
        <text class="profit-chip-icon">+</text>
        <text class="profit-chip-label">昨日分红</text>
        <text class="profit-chip-value">+{{ yesterdayProfit.toFixed(2) }}</text>
        <text class="profit-chip-unit">积分</text>
      </view>
    </view>
    
    <!-- 会员等级卡片（已抽取为独立组件） -->
    <WealthLevelCard
      :level-data="levelData"
      @click="goLevelDetail"
    />
    
    <!-- 理财专区 -->
    <view class="section">
      <view class="section-header">
        <view class="section-title-row">
          <text class="section-icon">理</text>
          <text class="section-title">理财专区</text>
        </view>
        <view class="section-more" @click="goInvestList">
          <text>全部</text>
          <text class="arrow">></text>
        </view>
      </view>
      
      <!-- 加载骨架屏 -->
      <HomeProductSkeleton v-if="loadingProducts" :count="3" />
      <!-- 加载失败状态 -->
      <view v-else-if="loadError" class="invest-empty" @click="loadFinancialProducts">
        <text class="empty-icon">理</text>
        <text class="empty-text">加载失败</text>
        <text class="empty-hint">点击重试</text>
      </view>
      <!-- 空状态 -->
      <view v-else-if="!investProjects.length" class="invest-empty">
        <text class="empty-icon">理</text>
        <text class="empty-text">暂无理财项目</text>
        <text class="empty-hint">平台正在加紧上架，敬请期待</text>
      </view>
      <!-- 理财列表 -->
      <view v-else class="invest-list">
        <WealthInvestCard
          v-for="project in investProjects"
          :key="project.id"
          :project="project"
          @click="goProjectDetail"
          @invest="goProjectDetail"
        />
      </view>
    </view>
    
    <!-- 理财规则说明 -->
    <view class="rules-section">
      <view class="rules-header">
        <text class="rules-title">理财规则</text>
      </view>
      <view class="rules-list">
        <view class="rule-item" v-for="rule in rules" :key="rule.id">
          <text class="rule-icon">{{ rule.icon }}</text>
          <view class="rule-content">
            <text class="rule-title">{{ rule.title }}</text>
            <text class="rule-desc">{{ rule.desc }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { walletApi, levelApi, financialApi } from '@/utils/api'
import { checkAuth } from '@/utils/auth'
import AssetStatusBar from '@/components/AssetStatusBar.vue'
import HomeProductSkeleton from '@/components/HomeProductSkeleton.vue'
import WealthLevelCard from '@/components/wealth/WealthLevelCard.vue'
import WealthInvestCard from '@/components/wealth/WealthInvestCard.vue'

const statusBarHeight = ref(20)
const loggedIn = ref(checkAuth())
const ecoPoints = ref(0)
const creditPoints = ref(0)
const yesterdayProfit = ref(0)
const loadingAsset = ref(false)
const loadingProducts = ref(false)
const loadError = ref(false)

const levelData = ref({
  badge: '级',
  name: 'V1',
  title: '普通会员',
  current: 0,
  target: 5000,
  dailyDividend: '0',
  nextLevel: null as { name: string; target: number } | null,
  progressPct: 0,
})

const investProjects = ref<any[]>([])

const levelNum = computed(() => {
  const m = String(levelData.value.name || 'V1').match(/\d+/)
  return m ? m[0] : '1'
})

const levelTitleUpper = computed(() =>
  String(levelData.value.name || 'V1').replace(/\s/g, '').toUpperCase()
)

const levelProgressPct = computed(() => {
  const t = levelData.value.target || 1
  const c = levelData.value.current || 0
  return Math.min(100, Math.max(0, (c / t) * 100))
})

const rules = ref([
  { id: 1, icon: '收', title: '收益计算', desc: '每日结算，自动到账' },
  { id: 2, icon: '期', title: '周期灵活', desc: '30/60/90天可选' },
  { id: 3, icon: '本', title: '本金安全', desc: '到期全额返还' },
  { id: 4, icon: '赎', title: '提前赎回', desc: '收取2-5%手续费' },
])

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (!loggedIn.value) return
  loadAssetData()
  loadLevelData()
  loadFinancialProducts()
})

async function loadAssetData() {
  loadingAsset.value = true
  try {
    const bal = await walletApi.getBalance()
    ecoPoints.value = Number(bal.ecoPoints || 0)
    creditPoints.value = Number(bal.consumerPoints || 0)
    yesterdayProfit.value = Number(bal?.yesterdayProfit ?? bal?.todayEarnings ?? 0)
  } catch (e) {
    console.error('加载资产失败', e)
  } finally {
    loadingAsset.value = false
  }
}

async function loadLevelData() {
  try {
    const data = await levelApi.getMyLevel()
    const current = Number(data.teamPerformance || 0)
    const target = Number(data.minPerformance || 5000)
    levelData.value = {
      badge: data.icon || '级',
      name: data.levelName || 'V1',
      title: data.levelName || '普通会员',
      current,
      target,
      dailyDividend: data.dailyBonus || '0',
      nextLevel: data.nextLevelName
        ? { name: data.nextLevelName, target: Number(data.nextMinPerformance || 0) }
        : null,
      progressPct: target > 0 ? Math.min(100, (current / target) * 100) : 0,
    }
  } catch (e) {
    console.error('加载等级失败', e)
  }
}

async function loadFinancialProducts() {
  loadingProducts.value = true
  loadError.value = false
  try {
    const products = await financialApi.getProducts()
    investProjects.value = ((products || []) as any[]).map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.rateType === 1 ? '活' : p.rateType === 2 ? '稳' : '全',
      yield: p.displayRate || p.rateValue,
      cycle: p.cycleDays || p.cycle,
      minAmount: p.minAmount,
      progress: p.totalInvested && p.totalAmount
        ? Math.round((Number(p.totalInvested) / Number(p.totalAmount)) * 100)
        : 50,
      level: p.riskLevel === 1 ? 'safe' : p.riskLevel === 2 ? 'new' : 'high',
    }))
  } catch (e) {
    console.error('加载理财项目失败', e)
    loadError.value = true
  } finally {
    loadingProducts.value = false
  }
}

function goAssetDetail() {
  uni.navigateTo({ url: '/pages/user/points-detail' })
}

function goInvest() {
  uni.navigateTo({ url: '/pages/wealth/invest' })
}

function goInvestList() {
  uni.navigateTo({ url: '/pages/wealth/invest' })
}

function goLevelDetail() {
  uni.navigateTo({ url: '/pages/user/level-detail' })
}

function goProjectDetail(project: any) {
  uni.navigateTo({ url: `/pages/wealth/invest?productId=${project.id}` })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.page-container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0 var(--spacing-lg);
}

.safe-area-top {
  width: 100%;
}

.page-header {
  padding: var(--spacing-base) 0;
  
  .page-title {
    @include page-title-text;
  }
}

// 资产骨架屏
.asset-card.sk-loading {
  background: $warm-yellow;
  border: 1rpx solid $border-primary;

  .sk-line {
    height: 24rpx;
    background: rgba(26,36,56,0.08);
    border-radius: 8rpx;
    animation: shimmer 1.4s ease-in-out infinite;
  }

  .sk-short { width: 40%; }
  .sk-full { width: 80%; margin-top: 12rpx; }

  .asset-item {
    text-align: center;

    .sk-value {
      width: 120rpx;
      height: 56rpx;
      background: rgba(26,36,56,0.08);
      border-radius: 8rpx;
      margin: 0 auto 12rpx;
      animation: shimmer 1.4s ease-in-out infinite;
    }
  }
}

@keyframes shimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

.asset-card {
  @include premium-surface($warm-yellow);
  border: 1rpx solid $border-primary;
  border-radius: $radius-2xl;
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: $shadow-gold;
  
  .asset-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .asset-label {
      font-size: 30rpx;
      color: $navy;
      font-weight: 600;
    }
    
    .asset-detail {
      font-size: 26rpx;
      color: $accent-dark;
    }
  }
  
  .asset-values {
    display: flex;
    align-items: center;
    justify-content: space-around;
    margin: var(--spacing-lg) 0;
    
    .asset-divider {
      width: 1rpx;
      height: 80rpx;
      background: $border-primary;
    }
    
    .asset-item {
      text-align: center;
      
      .asset-value {
        font-size: 56rpx;
        font-weight: 700;
        display: block;
        color: $navy;
        
        &.text-gold {
          color: $accent-dark;
        }
      }
      
      .asset-name {
        font-size: 26rpx;
        color: $navy-light;
        margin-top: 8rpx;
        display: block;
      }
      
      .asset-sub {
        font-size: 22rpx;
        color: $text-muted;
        margin-top: 4rpx;
        display: block;
      }
    }
  }

  .yesterday-profit {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8rpx;
    margin-top: var(--spacing-base);
    padding: 16rpx 24rpx;
    background: rgba(255,255,255,0.7);
    border: 1rpx solid $border-primary;
    border-radius: $radius-full;

    .profit-chip-icon { font-size: 28rpx; font-weight: 700; color: $accent-dark; }
    .profit-chip-label { font-size: 24rpx; color: $navy-light; }
    .profit-chip-value { font-size: 32rpx; font-weight: 700; color: $accent-dark; }
    .profit-chip-unit { font-size: 22rpx; color: $text-muted; }
  }
  
  .asset-actions {
    display: flex;
    justify-content: space-around;
    margin-top: var(--spacing-base);
    
    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8rpx;
      
      .action-icon {
        font-size: 44rpx;
      }
      
      .action-text {
        font-size: 24rpx;
        color: var(--text-secondary);
      }
    }
  }
}

.level-card {
  position: relative;
  overflow: hidden;
  border-radius: $radius-2xl;
  padding: 40rpx 32rpx 36rpx;
  margin-bottom: var(--spacing-lg);
  @include premium-surface($warm-yellow);
  border: 1rpx solid $border-primary;
  box-shadow: $shadow-gold;

  &__glow {
    position: absolute;
    top: -25%;
    right: -10%;
    width: 50%;
    height: 55%;
    background: radial-gradient(circle, rgba(196, 165, 116, 0.3) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;

    &--2 {
      display: none;
    }
  }
}

.level-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.level-hero {
  flex: 1;
  min-width: 0;

  &__tier {
    display: flex;
    align-items: baseline;
    gap: 6rpx;
    margin-bottom: 12rpx;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }
}

.level-tier-label {
  font-size: var(--font-card-title);
  font-weight: var(--weight-bold);
  letter-spacing: 0.2em;
  color: $accent-dark;
  text-transform: uppercase;
}

.level-tier-num {
  font-size: 64rpx;
  font-weight: var(--weight-heavy);
  line-height: 1;
  color: $navy;
}

.level-name-upper {
  font-size: var(--font-caption);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: $navy-light;
}

.level-subtitle {
  font-size: var(--font-body);
  font-weight: var(--weight-regular);
  color: $text-muted;
}

.level-dividend {
  flex-shrink: 0;
  text-align: right;

  .dividend-label {
    @include type-caption;
    display: block;
    color: $text-muted;
  }

  .dividend-value {
    display: block;
    font-size: var(--font-page-title);
    font-weight: var(--weight-bold);
    color: $accent-dark;
    line-height: 1.2;
  }

  .dividend-unit {
    font-size: var(--font-caption);
    color: $text-muted;
  }
}

.level-progress {
  position: relative;
  z-index: 1;
  margin-top: 36rpx;

  .progress-info {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 6rpx;
    margin-bottom: 16rpx;

    .progress-current {
      font-size: var(--font-page-title);
      font-weight: var(--weight-bold);
      color: $accent-dark;
    }

    .progress-separator,
    .progress-target,
    .progress-unit {
      font-size: var(--font-body);
      font-weight: var(--weight-regular);
      color: $text-muted;
    }
  }

  .progress-bar {
    height: 14rpx;
    background: $bg-tertiary;
    border-radius: $radius-full;
    overflow: visible;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    min-width: 4%;
    border-radius: $radius-full;
    background: $gold-gradient;
    box-shadow: 0 0 16rpx rgba(196, 165, 116, 0.5);
    transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .progress-tip {
    @include type-caption;
    margin-top: 14rpx;
    color: $text-muted;
  }
}

.section {
  margin-bottom: var(--spacing-xl);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-base);
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  
  .section-icon {
    font-size: 36rpx;
  }
  
  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.section-more {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: var(--text-secondary);
  
  .arrow {
    margin-left: 4rpx;
  }
}

.invest-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  @include premium-surface($bg-secondary);
  border-radius: $radius-xl;

  .empty-icon {
    width: 96rpx;
    height: 96rpx;
    line-height: 96rpx;
    text-align: center;
    font-size: 40rpx;
    font-weight: var(--weight-heavy);
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: 50%;
    color: $navy;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: var(--font-card-title);
    font-weight: var(--weight-semibold);
    color: $text-primary;
    margin-bottom: 8rpx;
  }

  .empty-hint {
    font-size: var(--font-sm);
    color: $text-muted;
  }
}

.invest-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.invest-card {
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  padding: var(--spacing-base);
  
  .invest-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-base);
    
    .invest-type {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      
      .type-icon {
        width: 48rpx; height: 48rpx; line-height: 48rpx; text-align: center;
        font-size: 24rpx; font-weight: var(--weight-heavy); color: $navy;
        background: $warm-yellow; border-radius: 50%;
      }
      
      .type-name {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--text-primary);
      }
    }
    
    .invest-tag {
      font-size: 20rpx;
      padding: 4rpx 16rpx;
      border-radius: 8rpx;
      
      &.tag-high {
        background: linear-gradient(135deg, var(--danger), #DC2626);
        color: #fff;
      }
      
      &.tag-new {
        background: linear-gradient(135deg, var(--profit), #00CC00);
        color: #000;
      }
      
      &.tag-safe {
        background: linear-gradient(135deg, var(--primary), var(--primary)-dark);
        color: #fff;
      }
    }
  }
  
  .invest-stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: var(--spacing-base);
    
    .stat-item {
      text-align: center;
      
      .stat-value {
        font-size: 40rpx;
        font-weight: 800;
        display: block;
        letter-spacing: -1rpx;
        color: $navy;

        &.profit {
          @include ai-jelly-text;
        }
      }
      
      .stat-label {
        font-size: 22rpx;
        color: var(--text-secondary);
      }
    }
  }
  
  .invest-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .invest-progress {
      flex: 1;
      
      .progress-bar-small {
        height: 8rpx;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4rpx;
        overflow: hidden;
        
        .progress-fill-small {
          height: 100%;
          background: var(--primary);
          border-radius: 4rpx;
        }
      }
      
      .progress-text {
        font-size: 20rpx;
        color: var(--text-muted);
        margin-top: 4rpx;
        display: block;
      }
    }
    
    .invest-btn {
      background: $navy;
      color: $text-inverse;
      font-size: 26rpx;
      font-weight: 700;
      padding: 12rpx 32rpx;
      border-radius: 50rpx;
      margin-left: var(--spacing-base);
      box-shadow: $shadow-glow;
    }
  }
}

.rules-section {
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  padding: var(--spacing-base);
  margin-bottom: var(--spacing-xl);
  
  .rules-header {
    margin-bottom: var(--spacing-base);
    
    .rules-title {
      font-size: 28rpx;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  .rules-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-base);
    
    .rule-item {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-sm);
      
      .rule-icon {
        width: 48rpx; height: 48rpx; line-height: 48rpx; text-align: center;
        font-size: 24rpx; font-weight: var(--weight-heavy); color: $navy;
        background: $bg-tertiary; border-radius: 50%; flex-shrink: 0;
      }
      
      .rule-content {
        .rule-title {
          font-size: 26rpx;
          color: var(--text-primary);
          font-weight: 600;
          display: block;
        }
        
        .rule-desc {
          font-size: 22rpx;
          color: var(--text-secondary);
        }
      }
    }
  }
}

.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}
</style>
