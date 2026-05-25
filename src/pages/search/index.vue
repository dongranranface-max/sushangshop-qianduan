<template>
  <view class="page-container">
    <!-- 搜索栏 -->
    <view class="search-header">
      <view class="search-bar">
        <text class="search-icon">搜</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索商品"
          placeholder-class="search-placeholder"
          confirm-type="search"
          @confirm="doSearch"
          @input="onInput"
          focus
        />
        <text v-if="keyword" class="clear-icon" @click="clearKeyword">×</text>
      </view>
      <text class="cancel-btn" @click="goBack">取消</text>
    </view>

    <!-- 搜索历史（无关键词时） -->
    <view v-if="!keyword && historyList.length > 0" class="history-section">
      <view class="section-header">
        <text class="section-title">搜索历史</text>
        <text class="clear-history" @click="clearHistory">清空</text>
      </view>
      <view class="history-tags">
        <text
          v-for="(tag, index) in historyList"
          :key="index"
          class="history-tag"
          @click="searchWithKeyword(tag)"
        >
          {{ tag }}
        </text>
      </view>
    </view>

    <!-- 热门搜索 -->
    <view v-if="!keyword" class="hot-section">
      <view class="section-header">
        <text class="section-title">热门搜索</text>
      </view>
      <view class="hot-list">
        <view
          v-for="(item, index) in hotList"
          :key="index"
          class="hot-item"
          @click="searchWithKeyword(item.keyword)"
        >
          <view class="hot-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</view>
          <view class="hot-info">
            <text class="hot-keyword">{{ item.keyword }}</text>
            <text v-if="item.desc" class="hot-desc">{{ item.desc }}</text>
          </view>
          <view v-if="item.isNew" class="hot-tag">新</view>
        </view>
      </view>
    </view>

    <!-- 搜索结果（有关键词时） -->
    <view v-if="keyword" class="result-section">
      <!-- 骨架屏 -->
      <view v-if="loading && !searchResult.length" class="result-grid">
        <view v-for="i in 6" :key="i" class="sk-card">
          <view class="sk-img shimmer" />
          <view class="sk-info">
            <view class="sk-line shimmer" />
            <view class="sk-line sk-short shimmer" />
          </view>
        </view>
      </view>

      <!-- 空结果 -->
      <view v-else-if="!loading && !searchResult.length" class="empty-state">
        <view class="empty-state__icon">未</view>
        <text class="empty-state__text">未找到"{{ keyword }}"相关商品</text>
        <text class="empty-state__sub">换个关键词试试吧</text>
      </view>

      <!-- 结果列表 -->
      <view v-else class="result-grid">
        <HomeProductCard
          v-for="product in searchResult"
          :key="product.id"
          :product="product"
          :type="currentType"
          @click="goProduct(product)"
        />
      </view>

      <!-- 结果计数 -->
      <view v-if="!loading && searchResult.length > 0" class="result-count">
        <text>找到 {{ searchResult.length }} 个商品</text>
      </view>
    </view>

    <view class="safe-area-bottom" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { productApi } from '@/utils/api'
import HomeProductCard from '@/components/HomeProductCard.vue'

interface HotItem { keyword: string; desc?: string; isNew?: boolean }
interface Product { id: string; name: string; coverImage?: string; image?: string; price: string | number; requiredPoints?: number; type?: number; salesCount?: number; [k: string]: unknown }

const keyword = ref('')
const searchResult = ref<Product[]>([])
const statusBarHeight = ref(20)
const loading = ref(false)
const currentType = ref(1)
const historyList = ref<string[]>([])
const hotList = ref<HotItem[]>(
  [{ keyword: '手机', desc: '热门' },
  { keyword: '电脑', desc: '办公' },
  { keyword: '耳机', desc: '影音' },
  { keyword: '积分', desc: '换购' },
])

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  loadHistory()
})

onShow(() => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as { options?: { type?: string } }
  if (current.options?.type) {
    currentType.value = Number(current.options.type)
  } else {
    currentType.value = Number(uni.getStorageSync('search_type') || 1)
  }
})

function loadHistory() {
  try {
    const raw = uni.getStorageSync('search_history')
    if (raw) {
      historyList.value = JSON.parse(raw)
    }
  } catch {}
}

function saveHistory(kw: string) {
  if (!kw.trim()) return
  const list = historyList.value.filter((h) => h !== kw)
  list.unshift(kw)
  historyList.value = list.slice(0, 20)
  try {
    uni.setStorageSync('search_history', JSON.stringify(historyList.value))
  } catch {}
}

function clearHistory() {
  historyList.value = []
  try {
    uni.removeStorageSync('search_history')
  } catch {}
}

function clearKeyword() {
  keyword.value = ''
  searchResult.value = []
}

function onInput() {
  if (!keyword.value.trim()) {
    searchResult.value = []
  }
}

function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) return
  saveHistory(kw)
  performSearch(kw)
}

function searchWithKeyword(kw: string) {
  keyword.value = kw
  saveHistory(kw)
  performSearch(kw)
}

async function performSearch(kw: string) {
  if (!kw) return
  loading.value = true
  try {
    const res = await productApi.getList({
      type: currentType.value,
      keyword: kw,
      page: 1,
      limit: 40,
    })
    searchResult.value = res.list || []
  } catch {
    searchResult.value = []
  } finally {
    loading.value = false
  }
}

function goBack() {
  if (keyword.value) {
    clearKeyword()
  } else {
    uni.navigateBack()
  }
}

function goProduct(p: Product) {
  if (p.id) uni.navigateTo({ url: `/pages/product/detail?id=${p.id}&type=${p.type || currentType.value}` })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.status-bar { width: 100%; }

.page-container {
  min-height: 100vh;
  @include page-bg;
  padding-bottom: env(safe-area-inset-bottom);
}

// ========== 搜索栏 ==========
.search-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx $spacing-base;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1rpx solid $border-light;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 72rpx;
  padding: 0 24rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(20, 20, 20, 0.06);
  border-radius: $radius-full;
  box-shadow: $clay-shadow;

  .search-icon {
    font-size: 24rpx;
    font-weight: 700;
    color: $text-muted;
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    font-size: 28rpx;
    color: $text-primary;
    height: 100%;
  }

  .search-placeholder {
    font-size: 26rpx;
    color: $text-muted;
  }

  .clear-icon {
    font-size: 32rpx;
    color: $text-muted;
    padding: 8rpx;
    flex-shrink: 0;
  }
}

.cancel-btn {
  font-size: 28rpx;
  color: $text-secondary;
  font-weight: 500;
  flex-shrink: 0;
}

// ========== 历史记录 ==========
.history-section,
.hot-section {
  padding: $spacing-base $spacing-base 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-base;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
}

.clear-history {
  font-size: 24rpx;
  color: $text-muted;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.history-tag {
  padding: 10rpx 24rpx;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  border: 1rpx solid rgba(20, 20, 20, 0.06);
  border-radius: $radius-full;
  font-size: 26rpx;
  color: $text-secondary;
  font-weight: 500;
  transition: all 0.2s ease;

  &:active {
    background: rgba(47, 53, 66, 0.04);
    transform: scale(0.97);
  }
}

// ========== 热门搜索 ==========
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: 20rpx 0;
  border-bottom: 1rpx solid $border-light;
  transition: all 0.2s ease;

  &:last-child { border-bottom: none; }
  &:active { opacity: 0.7; }

  .hot-rank {
    width: 44rpx;
    height: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    font-weight: 700;
    border-radius: 50%;
    background: $bg-tertiary;
    color: $text-muted;
    flex-shrink: 0;

    &.rank-1, &.rank-2, &.rank-3 {
      background: $warm-yellow;
      color: $accent-dark;
      border: 1rpx solid $border-primary;
    }
  }

  .hot-info {
    flex: 1;

    .hot-keyword {
      display: block;
      font-size: 28rpx;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 4rpx;
    }

    .hot-desc {
      display: block;
      font-size: 22rpx;
      color: $text-muted;
    }
  }

  .hot-tag {
    font-size: 20rpx;
    padding: 4rpx 12rpx;
    background: rgba(184, 152, 118, 0.10);
    color: $accent-dark;
    border-radius: 20rpx;
    border: 1rpx solid rgba(184, 152, 118, 0.25);
    font-weight: 600;
  }
}

// ========== 搜索结果 ==========
.result-section {
  padding: $spacing-base;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
}

.sk-card {
  background: rgba(255, 255, 255, 0.7);
  border-radius: $radius-lg;
  overflow: hidden;

  .sk-img {
    width: 100%;
    aspect-ratio: 1 / 1;
    background: $bg-tertiary;
  }

  .sk-info {
    padding: $spacing-base;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
  }

  .sk-line {
    height: 22rpx;
    border-radius: 8rpx;
    background: $bg-tertiary;
    width: 80%;

    &.sk-short { width: 40%; }
  }
}

// 骨架屏扫光动画已全局定义在 page-shell.scss

.result-count {
  text-align: center;
  padding: $spacing-base 0;
  font-size: 24rpx;
  color: $text-muted;
}

// ========== 空状态 ==========
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 40rpx;
  text-align: center;

  &__icon {
    width: 120rpx;
    height: 120rpx;
    line-height: 120rpx;
    text-align: center;
    font-size: 48rpx;
    font-weight: 800;
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: 50%;
    color: $accent-dark;
    margin-bottom: 24rpx;
  }

  &__text {
    font-size: 30rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 12rpx;
  }

  &__sub {
    font-size: 26rpx;
    color: $text-muted;
  }
}
</style>
