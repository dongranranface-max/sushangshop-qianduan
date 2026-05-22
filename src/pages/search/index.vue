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
          focus
        />
        <text v-if="keyword" class="clear-icon" @click="keyword = ''">×</text>
      </view>
      <text class="cancel-btn" @click="goBack">取消</text>
    </view>
    
    <!-- 搜索历史 -->
    <view class="history-section" v-if="!keyword && historyList.length > 0">
      <view class="section-header">
        <text class="section-title">搜索历史</text>
        <text class="clear-history" @click="clearHistory">清空</text>
      </view>
      <view class="history-tags">
        <text 
          class="history-tag" 
          v-for="(tag, index) in historyList" 
          :key="index"
          @click="searchWithKeyword(tag)"
        >
          {{ tag }}
        </text>
      </view>
    </view>
    
    <!-- 热门搜索 -->
    <view class="hot-section" v-if="!keyword">
      <view class="section-header">
        <text class="section-title">热门搜索</text>
      </view>
      <view class="hot-list">
        <view 
          class="hot-item" 
          v-for="(item, index) in hotList" 
          :key="index"
          @click="searchWithKeyword(item.keyword)"
        >
          <view class="hot-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</view>
          <view class="hot-info">
            <text class="hot-keyword">{{ item.keyword }}</text>
            <text class="hot-desc">{{ item.desc }}</text>
          </view>
          <view class="hot-tag" v-if="item.isNew">新</view>
        </view>
      </view>
    </view>
    
    <!-- 搜索结果 -->
    <view class="result-section" v-if="keyword && searchResult.length > 0">
      <view class="result-header">
        <text class="result-count">找到 {{ searchResult.length }} 个商品</text>
      </view>
      <view class="result-list">
        <view 
          class="result-item" 
          v-for="product in searchResult" 
          :key="product.id"
          @click="goProduct(product.id)"
        >
          <image class="result-image" :src="product.coverImage" mode="aspectFill" />
          <view class="result-info">
            <text class="result-name">{{ product.name }}</text>
            <view class="result-bottom">
              <text class="result-price">¥{{ product.price }}</text>
              <text class="result-points" v-if="product.requiredPoints">+{{ product.requiredPoints }}积分</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 搜索骨架 -->
    <view class="sk-result" v-if="keyword && searching">
      <view class="sk-item" v-for="i in 4" :key="i">
        <view class="sk-img shimmer"></view>
        <view class="sk-info">
          <view class="sk-line sk-long shimmer"></view>
          <view class="sk-line sk-short shimmer"></view>
        </view>
      </view>
    </view>

    <!-- 无结果 -->
    <view class="empty-section" v-else-if="keyword && searchResult.length === 0 && searching">
      <text class="empty-icon">搜</text>
      <text class="empty-text">没有找到相关商品</text>
      <text class="empty-hint">试试其他关键词</text>
    </view>
    
    <!-- 搜索建议 -->
    <view class="suggest-section" v-if="keyword && !searching">
      <view 
        class="suggest-item" 
        v-for="(suggest, index) in suggestList" 
        :key="index"
        @click="searchWithKeyword(suggest)"
      >
        <text class="suggest-icon">搜</text>
        <text class="suggest-text">{{ suggest }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { productApi } from '@/utils/api'

const keyword = ref('')
const searching = ref(false)
const historyList = ref<string[]>([])
const searchingTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const hotList = ref([
  { keyword: 'iPhone 15', desc: '热搜第一', isNew: false },
  { keyword: '华为 Mate 60', desc: '国产旗舰', isNew: true },
  { keyword: '戴森吹风机', desc: '热门推荐', isNew: false },
  { keyword: 'AirPods Pro', desc: '苹果耳机', isNew: false },
  { keyword: '小米手环', desc: '智能穿戴', isNew: false },
  { keyword: 'Switch游戏机', desc: '掌机热卖', isNew: true }
])

const searchResult = ref<any[]>([])
const suggestList = ref<string[]>([])

onMounted(() => {
  const history = uni.getStorageSync('searchHistory')
  if (history) {
    try { historyList.value = JSON.parse(history) } catch {}
  }
})

function goBack() {
  uni.navigateBack()
}

async function doSearch() {
  if (!keyword.value) return
  searching.value = true
  suggestList.value = []

  try {
    const res = await productApi.getList({ keyword: keyword.value, limit: 50 })
    searchResult.value = res.list || []

    // 添加到历史
    if (keyword.value && !historyList.value.includes(keyword.value)) {
      historyList.value.unshift(keyword.value)
      uni.setStorageSync('searchHistory', JSON.stringify(historyList.value))
    }
  } catch {
    searchResult.value = []
  } finally {
    searching.value = false
  }
}

function searchWithKeyword(kw: string) {
  keyword.value = kw
  doSearch()
}

function clearHistory() {
  historyList.value = []
  uni.removeStorageSync('searchHistory')
}

function goProduct(id: string | number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

// 搜索建议（实时从商品列表拉取）
watch(keyword, (newVal) => {
  if (searchingTimer.value) {
    clearTimeout(searchingTimer.value)
  }

  if (!newVal) {
    suggestList.value = []
    return
  }

  searchingTimer.value = setTimeout(async () => {
    try {
      const res = await productApi.getList({ keyword: newVal, limit: 10 })
      suggestList.value = (res.list || []).map((p: any) => p.name)
    } catch {
      suggestList.value = []
    }
  }, 300)
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.page-container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0 var(--spacing-lg);
}

.search-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base) 0;
  
  .search-bar {
    flex: 1;
    @include search-bar-shell;
    margin-bottom: 0;
    
    .search-icon {
      font-size: 26rpx;
      font-weight: var(--weight-heavy);
      color: $navy;
      margin-right: 8rpx;
    }
    
    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: $text-primary;
      margin: 0 var(--spacing-sm);
    }
    
    .clear-icon {
      font-size: 36rpx;
      color: var(--text-muted);
    }
  }
  
  .cancel-btn {
    font-size: 28rpx;
    color: var(--text-secondary);
  }
}

.history-section, .hot-section {
  margin-top: var(--spacing-xl);
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-base);
    
    .section-title {
      font-size: 30rpx;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .clear-history {
      font-size: 26rpx;
      color: var(--primary);
    }
  }
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  
  .history-tag {
    padding: 12rpx 24rpx;
    background: var(--bg-card);
    border: 1rpx solid var(--border-color);
    border-radius: 50rpx;
    font-size: 26rpx;
    color: var(--text-secondary);
  }
}

.hot-list {
  .hot-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-base) 0;
    border-bottom: 1rpx solid var(--border-light);
    
    .hot-rank {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      font-weight: 700;
      color: var(--text-secondary);
      background: var(--bg-card);
      border-radius: 8rpx;
      
      &.rank-1 { color: var(--gold); background: rgba(var(--gold), 0.2); }
      &.rank-2 { color: #C0C0C0; background: rgba(192, 192, 192, 0.2); }
      &.rank-3 { color: #CD7F32; background: rgba(205, 127, 50, 0.2); }
    }
    
    .hot-info {
      flex: 1;
      margin-left: var(--spacing-base);
      
      .hot-keyword {
        font-size: 28rpx;
        color: var(--text-primary);
        font-weight: 500;
      }
      
      .hot-desc {
        font-size: 22rpx;
        color: var(--text-muted);
        margin-left: var(--spacing-sm);
      }
    }
    
    .hot-tag {
      padding: 4rpx 12rpx;
      background: var(--danger);
      color: #fff;
      font-size: 20rpx;
      border-radius: 6rpx;
    }
  }
}

.result-section {
  margin-top: var(--spacing-lg);
  
  .result-header {
    margin-bottom: var(--spacing-base);
    
    .result-count {
      font-size: 26rpx;
      color: var(--text-secondary);
    }
  }
  
  .result-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-base);
    
    .result-item {
      display: flex;
      @include premium-surface($bg-secondary);
      border-radius: $radius-lg;
      overflow: hidden;
      padding: var(--spacing-base);
      
      .result-image {
        width: 180rpx;
        height: 180rpx;
        border-radius: $radius-sm;
      }
      
      .result-info {
        flex: 1;
        margin-left: var(--spacing-base);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        
        .result-name {
          font-size: 28rpx;
          color: var(--text-primary);
          @include line-clamp(2);
        }
        
        .result-bottom {
          display: flex;
          align-items: baseline;
          gap: var(--spacing-sm);
          
          .result-price {
            font-size: 32rpx;
            font-weight: 700;
            color: var(--primary);
          }
          
          .result-points {
            font-size: 22rpx;
            color: var(--gold);
          }
        }
      }
    }
  }
}

// 搜索骨架屏
.sk-result {
  margin-top: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);

  .sk-item {
    display: flex;
    @include premium-surface($bg-secondary);
    border-radius: $radius-lg;
    overflow: hidden;
    padding: var(--spacing-base);

    .sk-img {
      width: 180rpx;
      height: 180rpx;
      border-radius: $radius-sm;
      background: $bg-tertiary;
      flex-shrink: 0;
    }

    .sk-info {
      flex: 1;
      margin-left: var(--spacing-base);
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16rpx;
    }

    .sk-line {
      height: 24rpx;
      border-radius: 8rpx;
      background: $bg-tertiary;
      &.sk-long { width: 80%; }
      &.sk-short { width: 45%; }
    }
  }
}

.shimmer {
  animation: shimmer 1.2s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl) 0;
  
  .empty-icon {
    width: 120rpx; height: 120rpx; line-height: 120rpx; text-align: center;
    font-size: 44rpx; font-weight: var(--weight-heavy); color: $navy;
    background: $warm-yellow; border-radius: 50%;
    margin-bottom: var(--spacing-base);
  }
  
  .empty-text {
    font-size: 32rpx;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  .empty-hint {
    font-size: 26rpx;
    color: var(--text-secondary);
  }
}

.suggest-section {
  margin-top: var(--spacing-lg);
  
  .suggest-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-base) 0;
    border-bottom: 1rpx solid var(--border-light);
    
    .suggest-icon {
      font-size: 28rpx;
      color: var(--text-secondary);
      margin-right: var(--spacing-sm);
    }
    
    .suggest-text {
      font-size: 28rpx;
      color: var(--text-primary);
    }
  }
}
</style>
