<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 导航栏 -->
    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">众筹专区</text>
      <view class="page-nav__action" />
    </view>

    <scroll-view scroll-y class="cf-body" @scrolltolower="loadMore">
      <!-- 运营Banner -->
      <view class="cf-hero">
        <view class="cf-hero__inner">
          <view class="cf-hero__tag"><text>🏆 优质项目</text></view>
          <text class="cf-hero__title">参与众筹 · 共享成长价值</text>
          <text class="cf-hero__sub">每期项目均有实物回报或积分返还</text>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading && !list.length" class="skeleton-list">
        <view v-for="i in 3" :key="i" class="sk-card">
          <view class="sk-cover shimmer" />
          <view class="sk-info">
            <view class="sk-line shimmer" />
            <view class="sk-line sk-short shimmer" />
            <view class="sk-bar shimmer" />
          </view>
        </view>
      </view>

      <!-- 众筹列表 -->
      <view v-else class="cf-list">
        <view
          v-for="item in list"
          :key="item.id"
          class="cf-card"
          @click="goDetail(item)"
        >
          <image class="cf-card__cover" :src="item.coverImage || '/static/logo.png'" mode="aspectFill" lazy-load />
          <view class="cf-card__body">
            <view class="cf-card__header">
              <view class="cf-card__badge" :class="`cf-card__badge--${item.status}`">
                <text>{{ STATUS_MAP[item.status] || item.status }}</text>
              </view>
              <text class="cf-card__category">{{ item.categoryName || '消费众筹' }}</text>
            </view>
            <text class="cf-card__name">{{ item.name }}</text>
            <text class="cf-card__desc">{{ item.description }}</text>

            <!-- 进度条 -->
            <view class="cf-progress">
              <view class="cf-progress__track">
                <view
                  class="cf-progress__fill"
                  :style="{ width: Math.min(item.currentAmount / item.targetAmount * 100, 100) + '%' }"
                />
              </view>
              <text class="cf-progress__pct">{{ Math.round(item.currentAmount / item.targetAmount * 100) }}%</text>
            </view>

            <!-- 统计行 -->
            <view class="cf-stats">
              <view class="cf-stat">
                <text class="cf-stat__val">¥{{ formatAmt(item.currentAmount) }}</text>
                <text class="cf-stat__lab">已筹</text>
              </view>
              <view class="cf-stat">
                <text class="cf-stat__val">¥{{ formatAmt(item.targetAmount) }}</text>
                <text class="cf-stat__lab">目标</text>
              </view>
              <view class="cf-stat">
                <text class="cf-stat__val">{{ item.supporterCount || 0 }}</text>
                <text class="cf-stat__lab">支持者</text>
              </view>
              <view class="cf-stat">
                <text class="cf-stat__val cf-stat__val--accent">{{ item.remainingDays }}</text>
                <text class="cf-stat__lab">剩余天</text>
              </view>
            </view>

            <!-- 底部操作 -->
            <view class="cf-card__footer">
              <view class="cf-price">
                <text class="cf-price__label">起投</text>
                <text class="cf-price__val">¥{{ item.minAmount }}</text>
              </view>
              <view class="cf-btn">
                <text>{{ item.status === 'ongoing' ? '立即参与' : item.status === 'finished' ? '查看结果' : '了解更多' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loading && list.length" class="load-more">
        <view class="loading-spinner" /><text>加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && !list.length" class="empty-state">
        <view class="empty-state__icon">筹</view>
        <text class="empty-state__text">暂无众筹项目</text>
        <text class="empty-state__sub">更多项目即将上线</text>
      </view>

      <!-- 没有更多 -->
      <view v-if="!hasMore && list.length > 0" class="no-more"><text>— 没有更多了 —</text></view>

      <view class="bottom-placeholder" :style="{ height: (120 + safeAreaBottom) + 'px' }" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const loading = ref(false)
const list = ref<CrowdfundingItem[]>([])
const page = ref(1)
const hasMore = ref(true)

const STATUS_MAP: Record<string, string> = {
  ongoing: '众筹中', finished: '已结束', succeeded: '成功', failed: '失败',
}

interface CrowdfundingItem {
  id: string
  name: string
  description: string
  coverImage?: string
  targetAmount: number
  currentAmount: number
  minAmount: number
  supporterCount: number
  remainingDays: number
  status: string
  categoryName?: string
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
  loadList(true)
})

async function loadList(reset = false) {
  if (loading.value) return
  if (!hasMore.value && !reset) return
  if (reset) { page.value = 1; hasMore.value = true }
  loading.value = true
  try {
    // TODO: 替换为真实 API: crowdfundingApi.getList({ page, limit: 10 })
    await new Promise(r => setTimeout(r, 600))
    const mock: CrowdfundingItem[] = [
      {
        id: '1', name: '有机生态大米众筹计划', description: '来自东北黑土地的优质有机大米，全程生态种植，支持者享有实物大米回报和消费积分返还。',
        coverImage: '/static/logo.png', targetAmount: 500000, currentAmount: 328000, minAmount: 500, supporterCount: 1280, remainingDays: 12, status: 'ongoing', categoryName: '消费众筹',
      },
      {
        id: '2', name: '智能健身舱全国布局', description: '新一代AI智能健身舱，24小时营业，预约制。参与众筹可获得会员积分及现金分红权益。',
        coverImage: '/static/logo.png', targetAmount: 2000000, currentAmount: 2000000, minAmount: 1000, supporterCount: 3560, remainingDays: 0, status: 'succeeded', categoryName: '投资众筹',
      },
      {
        id: '3', name: '乡村旅游振兴计划', description: '整合优质乡村旅游资源，参与者可获得乡村民宿入住权益及专属消费积分。',
        coverImage: '/static/logo.png', targetAmount: 800000, currentAmount: 240000, minAmount: 300, supporterCount: 680, remainingDays: 28, status: 'ongoing', categoryName: '消费众筹',
      },
      {
        id: '4', name: '社区生鲜供应链建设', description: '产地直供社区生鲜驿站，减少流通环节，支持者享有积分返利和优先购买权。',
        coverImage: '/static/logo.png', targetAmount: 300000, currentAmount: 285000, minAmount: 200, supporterCount: 2100, remainingDays: 3, status: 'ongoing', categoryName: '消费众筹',
      },
    ]
    if (reset) list.value = mock
    else list.value.push(...mock)
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (hasMore.value && !loading.value) {
    page.value++
    loadList(false)
  }
}

function goDetail(item: CrowdfundingItem) {
  uni.navigateTo({ url: `/pages/crowdfunding/detail?id=${item.id}` })
}

function goBack() { uni.navigateBack() }

function formatAmt(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString()
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

$gap-4: 4rpx; $gap-8: 8rpx; $gap-16: 16rpx; $gap-24: 24rpx;

.page { min-height: 100vh; background: $bg-primary; display: flex; flex-direction: column; box-sizing: border-box; }
.status-bar { width: 100%; }

.page-nav {
  display: flex; align-items: center; gap: $gap-16; padding: 12rpx $gap-16;
  background: rgba(249,249,249,0.88); backdrop-filter: blur(16px); border-bottom: 1rpx solid rgba(20,20,20,0.04);
  box-sizing: border-box;
  &__back, &__action { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.88); backdrop-filter: blur(12px); border: 1rpx solid rgba(20,20,20,0.06); border-radius: 50%; font-size: 28rpx; color: $mineral-gray; flex-shrink: 0; box-sizing: border-box; }
  &__title { flex: 1; font-size: 32rpx; font-weight: 700; color: $mineral-gray; text-align: center; letter-spacing: 0.5rpx; }
}

.cf-body { flex: 1; }

// ========== Hero ==========
.cf-hero {
  margin: $gap-16; padding: $gap-24; border-radius: $radius-lg;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  box-shadow: 0 8rpx 32rpx rgba(15,52,96,0.25);
  box-sizing: border-box;
  &__inner { display: flex; flex-direction: column; gap: 8rpx; }
  &__tag { display: inline-flex; align-items: center; gap: 8rpx; background: rgba(255,255,255,0.12); border: 1rpx solid rgba(255,255,255,0.20); border-radius: $radius-full; padding: 6rpx 16rpx; width: fit-content; margin-bottom: 8rpx;
    text { font-size: 20rpx; color: rgba(255,255,255,0.85); font-weight: 600; } }
  &__title { font-size: 34rpx; font-weight: 700; color: #fff; letter-spacing: 1rpx; }
  &__sub { font-size: 24rpx; color: rgba(255,255,255,0.65); }
}

// ========== 列表 ==========
.cf-list { display: flex; flex-direction: column; gap: $gap-16; padding: 0 $gap-16; }

.cf-card {
  display: flex; flex-direction: column;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255,255,255,0.60); border-radius: $radius-lg; box-shadow: $clay-shadow;
  overflow: hidden; transition: transform 0.2s ease; box-sizing: border-box;
  &:active { transform: scale(0.99); }
  &__cover { width: 100%; height: 320rpx; object-fit: cover; background: $bg-tertiary; display: block; }
  &__body { padding: $gap-16; display: flex; flex-direction: column; gap: 10rpx; }
  &__header { display: flex; align-items: center; gap: 10rpx; }
  &__badge {
    display: inline-flex; align-items: center; padding: 4rpx 12rpx; border-radius: $radius-full; font-size: 18rpx; font-weight: 700;
    &--ongoing { background: rgba(46,204,113,0.15); color: #27ae60; border: 1rpx solid rgba(46,204,113,0.25); }
    &--succeeded { background: rgba(184,152,118,0.15); color: $accent-dark; border: 1rpx solid rgba(184,152,118,0.25); }
    &--failed { background: rgba(192,57,43,0.10); color: $danger; border: 1rpx solid rgba(192,57,43,0.20); }
    &--finished { background: rgba(142,116,89,0.10); color: $text-muted; border: 1rpx solid rgba(142,116,89,0.20); }
  }
  &__category { font-size: 20rpx; color: $text-muted; }
  &__name { font-size: 30rpx; font-weight: 700; color: $text-primary; line-height: 1.3; }
  &__desc { font-size: 24rpx; color: $text-secondary; line-height: 1.5; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
  &__footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8rpx; }
}

.cf-price { display: flex; align-items: baseline; gap: 6rpx;
  &__label { font-size: 22rpx; color: $text-muted; }
  &__val { font-family: $font-sans; font-size: 32rpx; font-weight: 700; color: $danger; font-variant-numeric: tabular-nums; }
}

.cf-btn {
  height: 72rpx; padding: 0 36rpx; background: $btn-gold-gradient; border-radius: $radius-full; box-shadow: $btn-gold-shadow;
  display: flex; align-items: center; justify-content: center; box-sizing: border-box;
  text { font-size: 28rpx; font-weight: 700; color: #fff; letter-spacing: 1rpx; }
}

// ========== 进度条 ==========
.cf-progress {
  display: flex; align-items: center; gap: 12rpx; margin: 4rpx 0;
  &__track { flex: 1; height: 10rpx; background: rgba(20,20,20,0.08); border-radius: $radius-full; overflow: hidden; box-sizing: border-box; }
  &__fill { height: 100%; background: linear-gradient(90deg, $accent-dark 0%, $accent 100%); border-radius: inherit; transition: width 0.4s ease; }
  &__pct { font-size: 24rpx; font-weight: 700; color: $accent-dark; min-width: 72rpx; text-align: right; }
}

// ========== 统计行 ==========
.cf-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: $gap-8; }
.cf-stat { display: flex; flex-direction: column; gap: 2rpx;
  &__val { font-family: $font-sans; font-size: 28rpx; font-weight: 700; color: $text-primary; font-variant-numeric: tabular-nums;
    &--accent { color: $accent-dark; } }
  &__lab { font-size: 20rpx; color: $text-muted; }
}

// ========== 骨架屏 ==========
.skeleton-list { display: flex; flex-direction: column; gap: $gap-16; padding: 0 $gap-16; }
.sk-card { background: rgba(255,255,255,0.70); border-radius: $radius-lg; overflow: hidden;
  .sk-cover { width: 100%; height: 320rpx; background: $bg-tertiary; }
  .sk-info { padding: $gap-16; display: flex; flex-direction: column; gap: 12rpx; }
  .sk-line { height: 24rpx; border-radius: 8rpx; background: $bg-tertiary; width: 75%; }
  .sk-line.sk-short { width: 40%; height: 18rpx; }
  .sk-bar { height: 10rpx; border-radius: $radius-full; background: $bg-tertiary; margin-top: 8rpx; }
}

// ========== 加载/空状态 ==========
.load-more { display: flex; flex-direction: column; align-items: center; gap: 12rpx; padding: $gap-24 0; font-size: 26rpx; color: $text-muted; }
.loading-spinner { width: 40rpx; height: 40rpx; border: 3rpx solid rgba(184,152,118,0.2); border-top-color: $accent-dark; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.no-more { text-align: center; padding: $gap-24 0; font-size: 24rpx; color: $text-muted; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 160rpx 40rpx; text-align: center;
  &__icon { width: 120rpx; height: 120rpx; line-height: 120rpx; text-align: center; font-size: 48rpx; font-weight: 800; background: $warm-yellow; border: 1rpx solid $border-primary; border-radius: 50%; color: $accent-dark; margin-bottom: 24rpx; box-sizing: border-box; }
  &__text { font-size: 30rpx; font-weight: 600; color: $text-primary; margin-bottom: 8rpx; }
  &__sub { font-size: 26rpx; color: $text-muted; }
}

.bottom-placeholder { width: 100%; }
</style>
