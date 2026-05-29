�<template>
  <view class="page-container">
    <!-- 搜索栏 -->
    <view class="search-header">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索商品"
          placeholder-class="search-placeholder"
          confirm-type="search"
          @confirm="doSearch"
          @input="onInput"
          @focus="showDropdown = true"
          @blur="onInputBlur"
        />
        <text v-if="keyword" class="clear-icon" @click="clearKeyword">×</text>
      </view>
      <text class="cancel-btn" @click="goBack">取消</text>
    </view>

    <!-- 搜索下拉面板（聚焦且有关键词时显示建议词） -->
    <view v-if="showDropdown && inputValue && suggestList.length > 0" class="suggest-panel">
      <view
        v-for="(item, index) in suggestList"
        :key="index"
        class="suggest-item"
        @click="searchWithKeyword(item.keyword)"
      >
        <text class="suggest-icon">🔍</text>
        <text class="suggest-text">{{ item.keyword }}</text>
      </view>
    </view>

    <!-- 历史搜索 + 热门搜索（无关键词时） -->
    <template v-if="!keyword">
      <!-- 历史搜索 -->
      <view v-if="historyList.length > 0" class="history-section">
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
      <view v-if="hotList.length > 0" class="hot-section">
        <view class="section-header">
          <text class="section-title">热门搜索</text>
        </view>
        <view class="hot-tags">
          <text
            v-for="(item, index) in hotList"
            :key="index"
            class="hot-tag"
            :class="{ 'hot-tag--new': item.isNew }"
            @click="searchWithKeyword(item.keyword)"
          >
            {{ item.keyword }}
          </text>
        </view>
      </view>
    </template>

    <!-- 筛选栏（sticky，有关键词时显示） -->
    <view v-if="keyword && !loading && searchResult.length > 0" class="filter-bar">
      <view class="filter-tabs">
        <view
          v-for="tab in sortTabs"
          :key="tab.key"
          class="filter-tab"
          :class="{ 'filter-tab--active': currentSort === tab.key }"
          @click="toggleSort(tab.key)"
        >
          <text>{{ tab.label }}</text>
          <text v-if="tab.key === 'price'" class="sort-arrow">{{ currentSort === 'price_asc' ? '↑' : currentSort === 'price_desc' ? '↓' : '' }}</text>
        </view>
        <view class="filter-tab filter-tab--filter" @click="showFilterPanel = true">
          <text>筛选</text>
          <text class="filter-icon">☰</text>
        </view>
      </view>
    </view>

    <!-- 搜索结果 -->
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
        <view class="empty-illustration">🔍</view>
        <text class="empty-state__text">未找到"{{ keyword }}"相关商品</text>
        <text class="empty-state__sub">换个关键词试试吧</text>
      </view>

      <!-- 错误状态 -->
      <view v-else-if="searchError" class="error-state">
        <text class="error-state__text">加载失败，请稍后重试</text>
        <view class="error-state__btn" @click="retrySearch">重新加载</view>
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

      <!-- 加载更多 -->
      <view v-if="!loading && searchResult.length > 0 && hasMore" class="load-more">
        <text v-if="loadingMore">加载中...</text>
        <text v-else @click="loadMore">加载更多</text>
      </view>

      <!-- 已无更多 -->
      <view v-if="!loading && searchResult.length > 0 && !hasMore" class="no-more">
        <text>— 已加载全部 —</text>
      </view>
    </view>

    <view class="safe-area-bottom" />
  </view>

  <!-- 筛选面板（右侧弹出） -->
  <view v-if="showFilterPanel" class="filter-overlay" @click="showFilterPanel = false" />
  <view v-if="showFilterPanel" class="filter-panel" :class="{ 'filter-panel--open': showFilterPanel }">
    <view class="filter-panel__header">
      <text class="filter-panel__title">筛选</text>
      <text class="filter-panel__close" @click="showFilterPanel = false">×</text>
    </view>
    <scroll-view class="filter-panel__body" scroll-y>
      <!-- 品牌筛选 -->
      <view class="filter-group">
        <text class="filter-group__label">品牌</text>
        <view class="filter-tags">
          <text
            v-for="brand in brandList"
            :key="brand.id"
            class="filter-tag"
            :class="{ 'filter-tag--selected': selectedBrand === brand.id }"
            @click="toggleBrand(brand.id)"
          >
            {{ brand.name }}
          </text>
        </view>
      </view>

      <!-- 分类筛选 -->
      <view class="filter-group">
        <text class="filter-group__label">分类</text>
        <view class="filter-tags">
          <text
            v-for="cat in categoryList"
            :key="cat.id"
            class="filter-tag"
            :class="{ 'filter-tag--selected': selectedCategory === cat.id }"
            @click="toggleCategory(cat.id)"
          >
            {{ cat.name }}
          </text>
        </view>
      </view>

      <!-- 价格区间 -->
      <view class="filter-group">
        <text class="filter-group__label">价格区间</text>
        <view class="price-range">
          <input
            v-model="priceMin"
            class="price-input"
            type="number"
            placeholder="最低价"
          />
          <text class="price-sep">-</text>
          <input
            v-model="priceMax"
            class="price-input"
            type="number"
            placeholder="最高价"
          />
        </view>
      </view>
    </scroll-view>
    <view class="filter-panel__footer">
      <view class="filter-btn filter-btn--reset" @click="resetFilter">重置</view>
      <view class="filter-btn filter-btn--confirm" @click="applyFilter">确定</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow, onReachBottom } from '@dcloudio/uni-app'
import { productApi, marketingApi } from '@/utils/api'
import HomeProductCard from '@/components/HomeProductCard.vue'

// ============ 类型定义 ============
interface HotItem { keyword: string; desc?: string; isNew?: boolean }
interface SuggestItem { keyword: string }
interface Product {
  id: string
  name: string
  coverImage?: string
  image?: string
  price: string | number
  requiredPoints?: number
  type?: number
  salesCount?: number
  soldCount?: number
  brandId?: string
  categoryId?: string
  [k: string]: unknown
}
interface Brand { id: string; name: string }
interface Category { id: string; name: string }

interface SortTab { key: string; label: string }

// ============ 状态 ============
const keyword = ref('')
const inputValue = ref('')
const searchResult = ref<Product[]>([])
const loading = ref(false)
const searchError = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const currentType = ref(1)
const historyList = ref<string[]>([])
const hotList = ref<HotItem[]>([])
const suggestList = ref<SuggestItem[]>([])
const showDropdown = ref(false)
const showFilterPanel = ref(false)

// 筛选相关
const brandList = ref<Brand[]>([])
const categoryList = ref<Category[]>([])
const selectedBrand = ref('')
const selectedCategory = ref('')
const priceMin = ref('')
const priceMax = ref('')

// 排序
const sortTabs: SortTab[] = [
  { key: 'default', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'price', label: '价格' },
]
const currentSort = ref('default')
const priceAsc = ref(false)

// 分页
const currentPage = ref(1)
const pageSize = 20

// ============ 生命周期 ============
onMounted(() => {
  loadHistory()
  loadHotKeywords()
  loadFilterOptions()
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

// 上拉加载
onReachBottom(() => {
  if (!loading.value && !loadingMore.value && hasMore.value && keyword.value) {
    loadMore()
  }
})

// ============ 历史搜索 ============
function loadHistory() {
  try {
    const raw = uni.getStorageSync('search_history')
    if (raw) {
      const list: string[] = JSON.parse(raw)
      historyList.value = list.slice(0, 10) // 限制10条
    }
  } catch {
    historyList.value = []
  }
}

function saveHistory(kw: string) {
  if (!kw.trim()) return
  const list = historyList.value.filter((h) => h !== kw)
  list.unshift(kw)
  historyList.value = list.slice(0, 10) // 限制10条
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
  inputValue.value = ''
  searchResult.value = []
  suggestList.value = []
  hasMore.value = true
  currentPage.value = 1
  showDropdown.value = false
}

// ============ 热门搜索 ============
async function loadHotKeywords() {
  try {
    const res = await marketingApi.getHotKeywords()
    if (res && res.length > 0) {
      hotList.value = res
    }
  } catch {
    hotList.value = []
  }
}

// ============ 搜索建议词 ============
async function loadSuggest(kw: string) {
  if (!kw.trim()) {
    suggestList.value = []
    return
  }
  try {
    // 模拟建议词（实际可调用 searchApi.suggest）
    // const res = await searchApi.suggest(kw)
    // suggestList.value = res
    // 暂时使用过滤后的热门词作为建议
    suggestList.value = hotList.value
      .filter((h) => h.keyword.includes(kw))
      .map((h) => ({ keyword: h.keyword }))
  } catch {
    suggestList.value = []
  }
}

// ============ 筛选选项 ============
async function loadFilterOptions() {
  try {
    const [brands, categories] = await Promise.all([
      productApi.getCategories(),
      productApi.getCategories(),
    ])
    brandList.value = (brands || []).map((c) => ({ id: c.id, name: c.name }))
    categoryList.value = (categories || []).map((c) => ({ id: c.id, name: c.name }))
  } catch {
    brandList.value = []
    categoryList.value = []
  }
}

function toggleBrand(id: string) {
  selectedBrand.value = selectedBrand.value === id ? '' : id
}

function toggleCategory(id: string) {
  selectedCategory.value = selectedCategory.value === id ? '' : id
}

function resetFilter() {
  selectedBrand.value = ''
  selectedCategory.value = ''
  priceMin.value = ''
  priceMax.value = ''
}

function applyFilter() {
  showFilterPanel.value = false
  currentPage.value = 1
  searchResult.value = []
  performSearch(keyword.value, true)
}

// ============ 排序 ============
function toggleSort(key: string) {
  if (key === 'price') {
    if (currentSort.value === 'price') {
      priceAsc.value = !priceAsc.value
      currentSort.value = priceAsc.value ? 'price_asc' : 'price_desc'
    } else {
      currentSort.value = 'price'
      priceAsc.value = false
      currentSort.value = 'price_desc'
    }
  } else {
    currentSort.value = key
  }
  currentPage.value = 1
  searchResult.value = []
  performSearch(keyword.value, true)
}

// ============ 搜索逻辑 ============
let searchTimer: ReturnType<typeof setTimeout> | null = null

function onInput() {
  inputValue.value = keyword.value
  if (!keyword.value.trim()) {
    searchResult.value = []
    suggestList.value = []
    return
  }
  // 防抖 300ms
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadSuggest(keyword.value.trim())
  }, 300)
}

function onInputBlur() {
  // 延迟隐藏下拉，避免点击穿透
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

function doSearch() {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  const kw = keyword.value.trim()
  if (!kw) return
  showDropdown.value = false
  saveHistory(kw)
  currentPage.value = 1
  searchResult.value = []
  performSearch(kw, true)
}

function searchWithKeyword(kw: string) {
  keyword.value = kw
  inputValue.value = kw
  showDropdown.value = false
  saveHistory(kw)
  currentPage.value = 1
  searchResult.value = []
  performSearch(kw, true)
}

async function performSearch(kw: string, reset = false) {
  if (!kw) return
  loading.value = reset
  if (!reset) loadingMore.value = true
  searchError.value = false

  try {
    const params: {
      type: number
      keyword: string
      page: number
      limit: number
      categoryId?: string
      brandId?: string
      minPrice?: number
      maxPrice?: number
      sort?: string
    } = {
      type: currentType.value,
      keyword: kw,
      page: currentPage.value,
      limit: pageSize,
    }

    if (selectedCategory.value) params.categoryId = selectedCategory.value
    if (selectedBrand.value) params.brandId = selectedBrand.value
    if (priceMin.value) params.minPrice = Number(priceMin.value)
    if (priceMax.value) params.maxPrice = Number(priceMax.value)

    // 排序参数映射
    if (currentSort.value === 'sales') params.sort = 'sales_desc'
    else if (currentSort.value === 'price_asc') params.sort = 'price_asc'
    else if (currentSort.value === 'price_desc') params.sort = 'price_desc'

    const res = await productApi.getList(params)

    if (reset) {
      searchResult.value = res.list || []
    } else {
      searchResult.value = [...searchResult.value, ...(res.list || [])]
    }

    hasMore.value = searchResult.value.length < res.total
  } catch {
    searchError.value = true
    if (reset) searchResult.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  currentPage.value++
  performSearch(keyword.value)
}

function retrySearch() {
  searchError.value = false
  currentPage.value = 1
  searchResult.value = []
  performSearch(keyword.value, true)
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

$gap-4: 4rpx; $gap-8: 8rpx; $gap-16: 16rpx; $gap-24: 24rpx; $gap-32: 32rpx;

.page-container {
  min-height: 100vh;
  @include page-bg;
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}

// ========== 搜索栏 ==========
.search-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: $gap-16;
  padding: 12rpx $gap-16;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(16px);
  border-bottom: 1rpx solid rgba(20,20,20,0.06);
  box-sizing: border-box;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 72rpx;
  padding: 0 24rpx;
  background: rgba(255,255,255,0.92);
  border: 1rpx solid rgba(20,20,20,0.06);
  border-radius: $radius-full;
  box-shadow: $clay-shadow;
  box-sizing: border-box;

  .search-icon {
    font-size: 24rpx;
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    font-size: 28rpx;
    color: $text-primary;
    height: 100%;
    background: transparent;
    box-sizing: border-box;
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

// ========== 搜索建议下拉 ==========
.suggest-panel {
  position: fixed;
  top: 96rpx;
  left: 0;
  right: 0;
  z-index: 99;
  background: #fff;
  border-bottom: 1rpx solid $border-light;
  box-shadow: 0 8rpx 32rpx rgba(47,53,66,0.10);
  overflow: hidden;
  box-sizing: border-box;
}

.suggest-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx $spacing-base;
  border-bottom: 1rpx solid $border-light;
  transition: background 0.15s ease;

  &:last-child { border-bottom: none; }
  &:active { background: rgba(47, 53, 66, 0.04); }

  .suggest-icon {
    font-size: 24rpx;
    color: $text-muted;
    flex-shrink: 0;
  }

  .suggest-text {
    font-size: 28rpx;
    color: $text-primary;
  }
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

.history-tags,
.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.history-tag,
.hot-tag {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 24rpx;
  background: $bg-tertiary;
  border-radius: $radius-full;
  font-size: 26rpx;
  color: $text-secondary;
  font-weight: 500;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:active {
    background: rgba(47,53,66,0.08);
    transform: scale(0.97);
  }
}

.hot-tag--new {
  background: rgba(184, 152, 118, 0.12);
  color: $accent-dark;
  border: 1rpx solid rgba(184, 152, 118, 0.25);
}

// ========== 筛选栏 ==========
.filter-bar {
  position: sticky;
  top: 97rpx; // search-header height + border
  z-index: 50;
  background: #ffffff;
  border-bottom: 1rpx solid $border-light;
}

.filter-tabs {
  display: flex;
  align-items: center;
  padding: 0 $spacing-base;
  gap: 0;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 24rpx 20rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: $text-secondary;
  transition: color 0.2s ease;
  flex-shrink: 0;

  &--active {
    color: $accent-dark;
    font-weight: 700;
  }

  &--filter {
    margin-left: auto;
    font-size: 26rpx;
    color: $text-muted;

    .filter-icon {
      font-size: 22rpx;
      margin-left: 4rpx;
    }
  }
}

.sort-arrow {
  font-size: 20rpx;
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

.shimmer {
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.72) 50%, transparent 100%);
    background-size: 200% 100%;
    animation: shimmer-sweep 1.4s ease-in-out infinite;
  }
}

@keyframes shimmer-sweep {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.load-more,
.no-more {
  text-align: center;
  padding: $spacing-base 0;
  font-size: 24rpx;
  color: $text-muted;
}

.load-more text {
  &:active { color: $accent-dark; }
}

// ========== 空状态 ==========
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 40rpx;
  text-align: center;

  .empty-illustration {
    width: 120rpx;
    height: 120rpx;
    line-height: 120rpx;
    text-align: center;
    font-size: 64rpx;
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: 50%;
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

// ========== 错误状态 ==========
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 40rpx;
  text-align: center;
  gap: 24rpx;

  &__text {
    font-size: 28rpx;
    color: $text-muted;
  }

  &__btn {
    padding: 16rpx 48rpx;
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: $radius-full;
    font-size: 28rpx;
    font-weight: 600;
    color: $accent-dark;

    &:active {
      opacity: 0.8;
      transform: scale(0.97);
    }
  }
}

// ========== 筛选面板 ==========
.filter-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(47,53,66,0.40);
  animation: fade-in 0.2s ease;
}

.filter-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 201;
  width: 600rpx;
  max-width: 80vw;
  background: #fff;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  border-radius: $radius-xl 0 0 $radius-xl;

  &--open {
    transform: translateX(0);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-base $spacing-base;
    border-bottom: 1rpx solid $border-light;
    flex-shrink: 0;
  }

  &__title {
    font-size: 32rpx;
    font-weight: 700;
    color: $text-primary;
  }

  &__close {
    font-size: 48rpx;
    color: $text-muted;
    line-height: 1;
    padding: 8rpx;

    &:active { color: $text-primary; }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-base;
  }

  &__footer {
    display: flex;
    gap: 16rpx;
    padding: $spacing-base;
    border-top: 1rpx solid $border-light;
    flex-shrink: 0;
  }
}

.filter-group {
  margin-bottom: $spacing-lg;

  &__label {
    display: block;
    font-size: 28rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: $spacing-base;
  }
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 24rpx;
  background: $bg-tertiary;
  border-radius: $radius-full;
  font-size: 26rpx;
  color: $text-secondary;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &--selected {
    background: rgba(184,152,118,0.15);
    color: $accent-dark;
    border: 1rpx solid rgba(184,152,118,0.35);
    font-weight: 600;
  }

  &:active {
    opacity: 0.8;
    transform: scale(0.97);
  }
}

.price-range {
  display: flex;
  align-items: center;
  gap: 16rpx;

  .price-sep {
    font-size: 28rpx;
    color: $text-muted;
    flex-shrink: 0;
  }
}

.price-input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  background: $bg-tertiary;
  border-radius: $radius-md;
  font-size: 28rpx;
  color: $text-primary;
  text-align: center;
  box-sizing: border-box;
}

.filter-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-full;
  font-size: 28rpx;
  font-weight: 600;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:active {
    opacity: 0.85;
    transform: scale(0.98);
  }

  &--reset {
    background: $bg-tertiary;
    color: $text-secondary;
    border: 1rpx solid $border-light;
  }

  &--confirm {
    background: $mineral-gray;
    color: #fff;
    box-shadow: $btn-brand-shadow;
  }
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
