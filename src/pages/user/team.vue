<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack"><text>‹</text></view>
      <text class="nav-title">团队关系</text>
      <view class="nav-placeholder" />
    </view>

    <!-- 顶部统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ teamInfo.directCount ?? '--' }}</text>
        <text class="stat-label">直推人数</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-value">{{ teamInfo.teamSize ?? '--' }}</text>
        <text class="stat-label">团队总人数</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-value accent">{{ teamInfo.teamPerformance ?? '--' }}</text>
        <text class="stat-label">小区业绩</text>
      </view>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view v-if="activeTab === tab.key" class="tab-indicator" />
      </view>
    </view>

    <!-- 骨架屏 -->
    <view v-if="loading && list.length === 0" class="skeleton-list">
      <view v-for="i in 6" :key="i" class="skeleton-row">
        <view class="skeleton-avatar" />
        <view class="skeleton-content">
          <view class="skeleton-line skeleton-line--short" />
          <view class="skeleton-line skeleton-line--xs" style="margin-top: 8rpx; width: 40%;" />
        </view>
        <view class="skeleton-right">
          <view class="skeleton-line skeleton-line--xs" style="width: 80rpx;" />
          <view class="skeleton-line skeleton-line--xs" style="margin-top: 8rpx; width: 60rpx;" />
        </view>
      </view>
    </view>

    <!-- 列表 -->
    <view v-else class="member-list">
      <view
        v-for="member in list"
        :key="member.userId"
        class="member-row"
      >
        <image class="member-avatar" :src="resolveAvatar(member.avatar)" mode="aspectFill" @error="onAvatarError($event, member)" />
        <view class="member-info">
          <view class="member-name-row">
            <text class="member-name">{{ member.nickname || '匿名用户' }}</text>
            <view class="member-level-badge"><text>V{{ member.level }}</text></view>
          </view>
          <text class="member-performance">小区业绩：{{ member.teamPerformance }}</text>
          <text class="member-time">注册：{{ formatTime(member.createdAt) }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="!loading && list.length === 0" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">{{ activeTab === 'direct' ? '暂无直推用户' : '暂无团队成员' }}</text>
    </view>

    <!-- 加载更多 -->
    <view v-if="list.length > 0 && hasMore && !loading" class="load-more" @click="loadMore">
      <text class="load-more-text">加载更多</text>
    </view>
    <view v-if="loading && list.length > 0" class="load-more">
      <text class="load-more-text">加载中...</text>
    </view>
    <view v-if="!hasMore && list.length > 0 && !loading" class="load-more">
      <text class="load-more-text no-more">没有更多了</text>
    </view>

    <view class="safe-bottom" :style="{ height: (32 + safeAreaBottom) + 'px' }" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { checkAuth } from '@/utils/auth'
import { resolveAvatar } from '@/utils/media'
import { userApi, referralApi, type UserTeam, type TeamMember, type ReferralChild } from '@/utils/api'

const DEFAULT_AVATAR = '/static/images/default-avatar.png'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const activeTab = ref<'direct' | 'all'>('direct')
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const limit = 20
const hasMore = ref(true)

const teamInfo = ref<Partial<UserTeam>>({})
const directList = ref<(ReferralChild | TeamMember)[]>([])
const allList = ref<(ReferralChild | TeamMember)[]>([])
const list = ref<(ReferralChild | TeamMember)[]>([])

const tabs = [
  { key: 'direct' as const, label: '直推列表' },
  { key: 'all' as const, label: '全部团队' },
]

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
})

onShow(() => {
  if (!checkAuth()) return
  refresh()
})

function switchTab(key: 'direct' | 'all') {
  activeTab.value = key
  list.value = key === 'direct' ? directList.value : allList.value
  hasMore.value = true
  page.value = 1
  if (list.value.length === 0) {
    loadList(key, true)
  }
}

async function refresh() {
  loading.value = true
  page.value = 1
  hasMore.value = true
  try {
    const [teamRes] = await Promise.all([
      userApi.getTeam().catch(() => ({} as UserTeam)),
    ])
    teamInfo.value = teamRes || {}
  } catch {}
  await loadList(activeTab.value, true)
  loading.value = false
}

async function loadList(tab: 'direct' | 'all', reset = false) {
  if (loading.value || loadingMore.value) return
  if (!reset) loadingMore.value = true
  else loading.value = true

  try {
    const currentPage = reset ? 1 : page.value
    const res = await referralApi.getChildren({ page: currentPage, limit })
    const items: ReferralChild[] = res?.list ?? []

    if (reset) {
      list.value = items
      directList.value = items
      page.value = currentPage + 1
    } else {
      list.value = [...list.value, ...items]
      directList.value = [...(directList.value ?? []), ...items]
      page.value = currentPage + 1
    }

    hasMore.value = items.length >= limit
  } catch {
    hasMore.value = false
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  loadList(activeTab.value, false)
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '--'
  try {
    const d = new Date(dateStr)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return dateStr
  }
}

function onAvatarError(e: Event, _member: ReferralChild | TeamMember) {
  const target = e.target as HTMLImageElement
  target.src = DEFAULT_AVATAR
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page {
  min-height: 100vh;
  background: $bg-primary;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom);
}

$gap-4: 4rpx; $gap-8: 8rpx; $gap-16: 16rpx; $gap-24: 24rpx; $gap-base: 16rpx; $gap-lg: 24rpx; $gap-sm: 8rpx;

.status-bar { width: 100%; }

// 导航栏
.nav-bar {
  display: flex; align-items: center; justify-content: space-between;
  height: 88rpx; padding: 0 $gap-16; background: rgba(255,255,255,0.92); box-sizing: border-box;
  position: sticky; top: 0; z-index: 100;
}

.nav-back {
  width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center;
  text { font-size: 44rpx; color: $text-primary; font-weight: 300; line-height: 1; }
}

.nav-title { font-size: 32rpx; font-weight: 700; color: $text-primary; }

.nav-placeholder { width: 64rpx; }

// 统计卡片
.stats-card {
  display: flex; align-items: center;
  margin: $gap-16; padding: $gap-24 $gap-16;
  background: rgba(255,255,255,0.92); border: 1rpx solid rgba(255,255,255,0.8);
  border-radius: $radius-2xl; box-shadow: $clay-shadow; box-sizing: border-box;
}

.stat-item {
  flex: 1; text-align: center;
  .stat-value { display: block; font-family: $font-sans; font-size: 40rpx; font-weight: 700; color: $text-primary; font-variant-numeric: tabular-nums; &.accent { color: $accent-dark; } }
  .stat-label { display: block; font-size: 22rpx; color: $text-muted; margin-top: 4rpx; }
}

.stat-divider { width: 1rpx; height: 56rpx; background: rgba(47,53,66,0.08); }

// Tab 栏
.tab-bar {
  display: flex;
  margin: 0 $gap-16 $gap-16;
  background: rgba(255,255,255,0.88); border-radius: $radius-lg;
  border: 1rpx solid rgba(255,255,255,0.6); box-shadow: $clay-shadow; box-sizing: border-box;
  overflow: hidden;
}

.tab-item {
  flex: 1; padding: 24rpx 0;
  display: flex; flex-direction: column; align-items: center; gap: 8rpx;
  position: relative; cursor: pointer;
  &.active .tab-text { color: $accent-dark; font-weight: 700; }
  &:active { opacity: 0.8; }
}

.tab-text { font-size: 28rpx; font-weight: 500; color: $text-muted; transition: color 0.2s ease; }

.tab-indicator {
  width: 40rpx; height: 6rpx;
  background: linear-gradient(90deg, $accent 0%, $accent-dark 100%);
  border-radius: 4rpx;
}

// 骨架屏
.skeleton-list { padding: 0 $gap-16; display: flex; flex-direction: column; gap: $gap-base; }

.skeleton-row {
  display: flex; align-items: center; gap: $gap-16;
  padding: $gap-16; background: rgba(255,255,255,0.88); border-radius: $radius-lg;
  box-shadow: $clay-shadow; box-sizing: border-box;
}

.skeleton-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: rgba(47,53,66,0.07); flex-shrink: 0; position: relative; overflow: hidden;
  &::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.72) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer-sweep 1.4s ease-in-out infinite; }
}

.skeleton-content { flex: 1; }

.skeleton-right { flex-shrink: 0; }

.skeleton-line { height: 28rpx; border-radius: $radius-sm; background: rgba(47,53,66,0.07); position: relative; overflow: hidden;
  &::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.72) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer-sweep 1.4s ease-in-out infinite; }
  &--short { width: 60%; }
  &--xs { height: 20rpx; }
}

// 成员列表
.member-list {
  padding: 0 $gap-16; display: flex; flex-direction: column; gap: $gap-base;
}

.member-row {
  display: flex; align-items: center; gap: $gap-16;
  padding: $gap-base $gap-16;
  background: rgba(255,255,255,0.88); border-radius: $radius-lg;
  border: 1rpx solid rgba(255,255,255,0.6); box-shadow: $clay-shadow; box-sizing: border-box;
}

.member-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; border: 2rpx solid rgba(184,152,118,0.25); background: $bg-tertiary; flex-shrink: 0; }

.member-info { flex: 1; min-width: 0; }

.member-name-row { display: flex; align-items: center; gap: $gap-8; margin-bottom: 4rpx; }

.member-name { font-size: 28rpx; font-weight: 700; color: $text-primary; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.member-level-badge {
  padding: 2rpx 10rpx; border-radius: 20rpx;
  background: rgba(184,152,118,0.12); border: 1rpx solid rgba(184,152,118,0.25);
  text { font-size: 18rpx; font-weight: 700; color: $accent-dark; } box-sizing: border-box; flex-shrink: 0;
}

.member-performance { display: block; font-size: 22rpx; color: $accent-dark; font-weight: 500; margin-bottom: 2rpx; }

.member-time { display: block; font-size: 20rpx; color: $text-muted; }

// 空状态
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 120rpx 0; gap: $gap-16;
  .empty-icon { font-size: 80rpx; }
  .empty-text { font-size: 26rpx; color: $text-muted; font-weight: 500; }
}

// 加载更多
.load-more {
  display: flex; align-items: center; justify-content: center;
  padding: $gap-24 0;
  .load-more-text { font-size: 24rpx; color: $text-muted; }
  .no-more { color: rgba(138,138,138,0.6); }
}

.safe-bottom { width: 100%; }
</style>
