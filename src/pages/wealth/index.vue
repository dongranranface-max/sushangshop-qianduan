<template>
  <view class="page-container">
    <!-- 顶部沉浸式资产状态栏 -->
    <AssetStatusBar v-if="loggedIn" />
    <view v-else class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 页面标题 -->
    <view class="page-header" v-if="!loggedIn">
      <text class="page-title">增值区</text>
    </view>
    
    <!-- 我的资产卡片 -->
    <view class="asset-card">
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
    
    <!-- 会员等级卡片 · Fitness+ 风格 -->
    <view class="level-card">
      <view class="level-card__glow" />
      <view class="level-card__glow level-card__glow--2" />
      <view class="level-header">
        <view class="level-hero">
          <view class="level-hero__tier">
            <text class="level-tier-label">VIP</text>
            <text class="level-tier-num">{{ levelNum }}</text>
          </view>
          <view class="level-hero__meta">
            <text class="level-name-upper">{{ levelTitleUpper }}</text>
            <text class="level-subtitle">{{ levelData.title }}</text>
          </view>
        </view>
        <view class="level-dividend">
          <text class="dividend-label">每日分红</text>
          <text class="dividend-value">+{{ levelData.dailyDividend }}</text>
          <text class="dividend-unit">积分</text>
        </view>
      </view>

      <view class="level-progress">
        <view class="progress-info">
          <text class="progress-current">{{ levelData.current.toLocaleString() }}</text>
          <text class="progress-separator">/</text>
          <text class="progress-target">{{ levelData.target.toLocaleString() }}</text>
          <text class="progress-unit">业绩</text>
        </view>
        <view class="progress-bar">
          <view
            class="progress-fill"
            :style="{ width: levelProgressPct + '%' }"
          />
        </view>
        <view class="progress-tip">
          <text v-if="levelData.nextLevel">
            距离 {{ levelData.nextLevel.name }} 还差 {{ (levelData.target - levelData.current).toLocaleString() }} 业绩
          </text>
          <text v-else>已是最高等级</text>
        </view>
      </view>
    </view>
    
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
      <!-- 空状态 -->
      <view v-else-if="!investProjects.length" class="invest-empty">
        <text class="empty-icon">理</text>
        <text class="empty-text">暂无理财项目</text>
        <text class="empty-hint">平台正在加紧上架，敬请期待</text>
      </view>
      <!-- 理财列表 -->
      <view v-else class="invest-list">
        <view
          class="invest-card"
          v-for="project in investProjects"
          :key="project.id"
          @click="goProjectDetail(project)"
        >
          <view class="invest-header">
            <view class="invest-type">
              <text class="type-icon">{{ project.icon }}</text>
              <text class="type-name">{{ project.name }}</text>
            </view>
            <view class="invest-tag" :class="'tag-' + project.level">
              {{ project.level === 'high' ? '热门' : project.level === 'new' ? '新品' : '稳健' }}
            </view>
          </view>
          
          <view class="invest-stats">
            <view class="stat-item">
              <text class="stat-value profit">{{ project.yield }}%</text>
              <text class="stat-label">年化收益</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ project.cycle }}天</text>
              <text class="stat-label">投资周期</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ project.minAmount.toLocaleString() }}</text>
              <text class="stat-label">最低申购</text>
            </view>
          </view>
          
          <view class="invest-footer">
            <view class="invest-progress">
              <view class="progress-bar-small">
                <view 
                  class="progress-fill-small" 
                  :style="{ width: project.progress + '%' }"
                ></view>
              </view>
              <text class="progress-text">已申购 {{ project.progress }}%</text>
            </view>
            <view class="invest-btn">
              <text>立即申购</text>
            </view>
          </view>
        </view>
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

const statusBarHeight = ref(20)
const loggedIn = ref(checkAuth())
const ecoPoints = ref(0)
const creditPoints = ref(0)
const yesterdayProfit = ref(0)
const loadingAsset = ref(false)
const loadingProducts = ref(false)

const levelData = ref({
  badge: '级',
  name: 'V1',
  title: '普通会员',
  current: 0,
  target: 5000,
  dailyDividend: '0',
  nextLevel: null as { name: string; target: number } | null
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
  { id: 4, icon: '赎', title: '提前赎回', desc: '收取2-5%手续费' }
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
    yesterdayProfit.value = Number(bal.yesterdayProfit || 0)
  } catch (e) {
    console.error('加载资产失败', e)
  } finally {
    loadingAsset.value = false
  }
}

async function loadLevelData() {
  try {
    const data = await levelApi.getMyLevel()
    levelData.value = {
      badge: data.icon || '级',
      name: data.levelName || 'V1',
      title: data.levelName || '普通会员',
      current: Number(data.teamPerformance || 0),
      target: Number(data.minPerformance || 5000),
      dailyDividend: data.dailyBonus || '0',
      nextLevel: data.nextLevelName
        ? { name: data.nextLevelName, target: Number(data.nextMinPerformance || 0) }
        : null,
    }
  } catch (e) {
    console.error('加载等级失败', e)
  }
}

async function loadFinancialProducts() {
  loadingProducts.value = true
  try {
    const products = await financialApi.getProducts()
    investProjects.value = (products || []).map((p: any) => ({
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

function goMyInvest() {
  uni.navigateTo({ url: '/pages/wealth/my-invest' })
}

function goPointsDetail() {
  uni.navigateTo({ url: '/pages/user/points-detail' })
}

function goInvestList() {
  uni.navigateTo({ url: '/pages/wealth/invest' })
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

.asset-card {
  background: linear-gradient(135deg, $navy 0%, $navy-light 55%, #3D4F6A 100%);
  border: none;
  border-radius: $radius-2xl;
  box-shadow: $shadow-glow;
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  
  .asset-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .asset-label {
      font-size: 30rpx;
      color: rgba(255, 255, 255, 0.92);
      font-weight: 600;
    }
    
    .asset-detail {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.65);
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
      background: var(--border-color);
    }
    
    .asset-item {
      text-align: center;
      
      .asset-value {
        font-size: 56rpx;
        font-weight: 700;
        display: block;
        
        &.text-gold {
          color: var(--gold);
        }
        
        &.text-purple {
          color: var(--primary);
        }
      }
      
      .asset-name {
        font-size: 26rpx;
        color: rgba(255, 255, 255, 0.75);
        margin-top: 8rpx;
        display: block;
      }
      
      .asset-sub {
        font-size: 22rpx;
        color: rgba(255, 255, 255, 0.5);
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
    background: rgba(255, 255, 255, 0.1);
    border-radius: $radius-full;

    .profit-chip-icon { font-size: 28rpx; font-weight: 700; color: $gold-light; }
    .profit-chip-label { font-size: 24rpx; color: rgba(255, 255, 255, 0.7); }
    .profit-chip-value { font-size: 32rpx; font-weight: 700; color: $gold-light; }
    .profit-chip-unit { font-size: 22rpx; color: rgba(255, 255, 255, 0.6); }
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
  background: linear-gradient(145deg, $navy 0%, #243047 48%, $navy-light 100%);
  border: 1rpx solid rgba(196, 165, 116, 0.35);
  box-shadow:
    0 24rpx 64rpx rgba(26, 36, 56, 0.2),
    0 0 72rpx rgba(196, 165, 116, 0.14);

  &__glow {
    position: absolute;
    top: -35%;
    right: -15%;
    width: 70%;
    height: 75%;
    background: radial-gradient(circle, rgba(196, 165, 116, 0.42) 0%, transparent 68%);
    pointer-events: none;
    z-index: 0;

    &--2 {
      top: auto;
      bottom: -25%;
      left: -10%;
      right: auto;
      width: 55%;
      height: 50%;
      background: radial-gradient(circle, rgba(232, 213, 181, 0.2) 0%, transparent 70%);
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
  color: $gold-light;
  text-transform: uppercase;
}

.level-tier-num {
  font-size: 64rpx;
  font-weight: var(--weight-heavy);
  line-height: 1;
  color: $text-inverse;
  text-shadow:
    0 0 48rpx rgba(196, 165, 116, 0.75),
    0 4rpx 16rpx rgba(0, 0, 0, 0.25);
}

.level-name-upper {
  font-size: var(--font-caption);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.level-subtitle {
  font-size: var(--font-body);
  font-weight: var(--weight-regular);
  color: rgba(255, 255, 255, 0.55);
}

.level-dividend {
  flex-shrink: 0;
  text-align: right;

  .dividend-label {
    @include type-caption;
    display: block;
    color: rgba(255, 255, 255, 0.5);
  }

  .dividend-value {
    display: block;
    font-size: var(--font-page-title);
    font-weight: var(--weight-bold);
    color: $gold-light;
    line-height: 1.2;
    text-shadow: 0 0 32rpx rgba(196, 165, 116, 0.5);
  }

  .dividend-unit {
    font-size: var(--font-caption);
    color: rgba(255, 255, 255, 0.65);
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
      color: $gold-light;
    }

    .progress-separator,
    .progress-target,
    .progress-unit {
      font-size: var(--font-body);
      font-weight: var(--weight-regular);
      color: rgba(255, 255, 255, 0.55);
    }
  }

  .progress-bar {
    height: 14rpx;
    background: rgba(255, 255, 255, 0.12);
    border-radius: $radius-full;
    overflow: visible;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    min-width: 4%;
    border-radius: $radius-full;
    background: linear-gradient(90deg, $accent-dark 0%, $gold 45%, $gold-light 100%);
    box-shadow:
      0 0 20rpx rgba(196, 165, 116, 0.85),
      0 0 40rpx rgba(196, 165, 116, 0.45);
    transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .progress-tip {
    @include type-caption;
    margin-top: 14rpx;
    color: rgba(255, 255, 255, 0.6);
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

        &.profit {
          background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent-dark) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 8rpx rgba(255,140,0,0.5));
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
      background: var(--accent-fire);
      color: #fff;
      font-size: 26rpx;
      font-weight: 700;
      padding: 12rpx 32rpx;
      border-radius: 50rpx;
      margin-left: var(--spacing-base);
      box-shadow: var(--shadow-fire);
      text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.2);
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
