<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar">
      <view class="nav-back" @click="goBack"><text>←</text></view>
      <view class="nav-tabs">
        <view :class="['nav-tab', { active: currentTab === 'detail' }]" @click="currentTab = 'detail'">商品</view>
        <view :class="['nav-tab', { active: currentTab === 'review' }]" @click="currentTab = 'review'">评价</view>
      </view>
      <view class="nav-share" @click="share"><text>⋮</text></view>
    </view>

    <!-- 商品图片 -->
    <swiper class="product-swiper" :indicator-dots="true" indicator-color="rgba(255,255,255,0.3)" indicator-active-color="#8B5CF6">
      <swiper-item v-for="(img, index) in productImages" :key="index">
        <image class="product-image" :src="img" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <!-- 商品信息 -->
    <view class="product-info">
      <view class="price-row">
        <text class="current-price">
          <text class="symbol" v-if="mode !== 'redeem'">¥</text>{{ mode === 'redeem' ? product.requiredPoints + '积分' : product.price }}
        </text>
        <text class="original-price" v-if="mode !== 'redeem'">¥{{ product.originalPrice || product.price }}</text>
        <text class="mode-tag" :class="'mode-' + mode">{{ modeLabel }}</text>
      </view>
      <view class="name-row">
        <text class="product-name">{{ product.name || '商品加载中...' }}</text>
      </view>
      <view class="desc-row">
        <text class="description">{{ product.description }}</text>
      </view>
      <view class="points-info" v-if="mode !== 'redeem' && product.ecoPoints">
        <text class="points-icon">💰</text>
        <text class="points-text">购买可得 {{ product.ecoPoints }} 生态积分</text>
      </view>

      <!-- ========== 支付公式透明化（换购商品专属） ========== -->
      <view class="settlement-formula" v-if="mode === 'exchange'">
        <view class="formula-bar">
          <text class="formula-icon">📐</text>
          <text class="formula-text">
            {{ product.totalPrice || product.price }}元 = 
            <text class="formula-cash">{{ product.cashPrice || 0 }}元现金</text>
            + 
            <text class="formula-points">{{ product.requiredPoints || 0 }}生态积分</text>
          </text>
        </view>
        <view class="reward-hint" v-if="product.ecoPoints">
          <text class="reward-icon">🎁</text>
          <text class="reward-text">下单预计返 {{ product.ecoPoints }} 消费积分</text>
        </view>
      </view>
      <view class="settlement-formula" v-else-if="mode === 'consume' && product.ecoPoints">
        <view class="formula-bar formula-simple">
          <text class="formula-icon">🎁</text>
          <text class="reward-text">下单得 {{ product.ecoPoints }} 生态积分</text>
        </view>
      </view>
    </view>

    <!-- SKU 选择 -->
    <view class="sku-section" @click="showSkuModal = true">
      <view class="sku-label"><text>已选</text></view>
      <view class="sku-content"><text>{{ selectedSku || '请选择' }}</text></view>
      <text class="sku-arrow">›</text>
    </view>

    <!-- 商品详情 -->
    <view class="detail-section" v-if="currentTab === 'detail'">
      <view class="section-title"><text>商品详情</text></view>
      <view class="detail-content">
        <image v-for="(img, index) in productImages" :key="'d' + index" class="detail-image" :src="img" mode="widthFix" />
      </view>
    </view>

    <!-- 评价 -->
    <view class="review-section" v-if="currentTab === 'review'">
      <view class="review-list">
        <view class="review-item" v-for="r in []" :key="r.id">
          <text class="review-content">{{ r.content }}</text>
        </view>
        <view class="empty-review"><text>暂无评价</text></view>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-bar">
      <view class="action-icons">
        <view class="action-icon-item" @click="goHome">
          <text>🏠</text><text class="icon-label">首页</text>
        </view>
        <view class="action-icon-item" @click="goCart">
          <text>🛒</text>
          <view v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</view>
          <text class="icon-label">购物车</text>
        </view>
      </view>
      <view class="action-buttons">
        <view class="btn-add-cart" @click="handleAddCart">加入购物车</view>
        <view class="btn-buy-now" :class="'btn-' + mode" @click="handleBuy">{{ actionLabel }}</view>
      </view>
    </view>

    <!-- SKU 弹窗 -->
    <view class="sku-modal" v-if="showSkuModal" @click="showSkuModal = false">
      <view class="sku-panel" @click.stop>
        <view class="sku-header">
          <image class="sku-image" :src="productImages[0]" mode="aspectFill" />
          <view class="sku-info">
            <text class="sku-price">
              {{ mode === 'redeem' ? product.requiredPoints + '积分' : '¥' + product.price }}
            </text>
            <text class="sku-stock">库存: {{ product.stock || 999 }}</text>
          </view>
          <view class="sku-close" @click="showSkuModal = false">×</view>
        </view>
        <view class="sku-content">
          <view class="quantity-row">
            <text class="quantity-label">数量</text>
            <view class="quantity-stepper">
              <view class="stepper-btn" @click="quantity > 1 && quantity--">-</view>
              <text class="stepper-value">{{ quantity }}</text>
              <view class="stepper-btn" @click="quantity++">+</view>
            </view>
          </view>
        </view>
        <view class="sku-footer">
          <view class="btn-buy-now-lg" :class="'btn-' + mode" @click="handleBuy">立即{{ mode === 'redeem' ? '兑换' : '购买' }}</view>
        </view>
      </view>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { productApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const currentTab = ref('detail')
const showSkuModal = ref(false)
const quantity = ref(1)
const cartCount = ref(0)
const productId = ref('')
const mode = ref<'consume' | 'exchange' | 'redeem'>('consume')

const product = ref<any>({
  name: '',
  price: 0,
  originalPrice: 0,
  requiredPoints: 0,
  ecoPoints: 0,
  stock: 999,
  description: '',
})

const productImages = computed(() => {
  const imgs = product.value.coverImages || []
  if (imgs.length > 0) return imgs
  const cover = product.value.coverImage
  if (cover) return [cover]
  return ['https://picsum.photos/750/750?random=99']
})

const modeLabel = computed(() => ({
  consume: '消费商城',
  exchange: '换购商城',
  redeem: '兑换商城',
}[mode.value] || '商品'))

const actionLabel = computed(() => ({
  consume: '立即购买',
  exchange: '立即换购',
  redeem: '立即兑换',
}[mode.value] || '购买'))

const selectedSku = computed(() => quantity.value > 1 ? `× ${quantity.value}` : '')

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20

  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const opts = (current as any).options || {}
  productId.value = opts.id || ''
  mode.value = opts.mode === 'exchange' ? 'exchange' : opts.mode === 'redeem' ? 'redeem' : 'consume'

  if (productId.value) {
    loadProduct()
  }
})

async function loadProduct() {
  try {
    const res = await productApi.getDetail(productId.value)
    product.value = res
  } catch (e: any) {
    uni.showToast({ title: '加载商品失败', icon: 'none' })
  }
}

function goBack() { uni.navigateBack() }
function goHome() { uni.switchTab({ url: '/pages/index/index' }) }
function goCart() { uni.switchTab({ url: '/pages/cart/index' }) }
function share() { uni.showShareMenu() }

function handleAddCart() {
  showSkuModal.value = true
}

function handleBuy() {
  showSkuModal.value = false
  if (!requireAuth()) return
  if (!productId.value) return

  if (mode.value === 'redeem') {
    uni.navigateTo({ url: `/pages/order/confirm?productId=${productId.value}&mode=redeem` })
  } else if (mode.value === 'exchange') {
    uni.navigateTo({ url: `/pages/order/confirm?productId=${productId.value}&mode=exchange` })
  } else {
    uni.navigateTo({ url: `/pages/order/confirm?productId=${productId.value}&mode=consume` })
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container { min-height: 100vh; background: var(--bg-primary); padding-bottom: 120rpx; }

.nav-bar { display: flex; align-items: center; padding: 16rpx 32rpx; gap: 32rpx;
  .nav-back, .nav-share { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; font-size: 40rpx; color: #fff; background: var(--glass-bg); backdrop-filter: blur(20px); border: 1rpx solid var(--glass-border); border-radius: 50%; }
  .nav-tabs { flex: 1; display: flex; justify-content: center; gap: 48rpx;
    .nav-tab { font-size: 30rpx; color: rgba(255,255,255,0.5); padding-bottom: 4rpx;
      &.active { color: #fff; font-weight: 700; border-bottom: 4rpx solid var(--primary)-light; text-shadow: 0 0 10rpx rgba(0,242,254,0.4); }
    }
  }
}

.product-swiper { width: 100%; height: 750rpx;
  .product-image { width: 100%; height: 100%; }
}

.product-info { padding: var(--spacing-base) var(--spacing-lg);
  .price-row { display: flex; align-items: baseline; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);
    .current-price {
      font-size: 48rpx; font-weight: 800;
      background: linear-gradient(135deg, var(--primary)-light, var(--primary)-dark);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0 0 10rpx rgba(0,242,254,0.3));
      letter-spacing: -1rpx;
      .symbol { font-size: 28rpx; }
    }
    .original-price { font-size: 28rpx; color: var(--text-muted); text-decoration: line-through; }
    .mode-tag { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 6rpx; margin-left: auto;
      &.mode-exchange { background: rgba(77,142,255,0.15); color: var(--primary)-light; border: 1rpx solid rgba(77,142,255,0.3); }
      &.mode-redeem { background: rgba(255,140,0,0.15); color: var(--accent); border: 1rpx solid rgba(255,140,0,0.3); }
    }
  }
  .name-row { margin-bottom: var(--spacing-xs);
    .product-name { font-size: 32rpx; font-weight: 600; color: var(--text-primary); }
  }
  .desc-row { margin-bottom: var(--spacing-xs);
    .description { font-size: 26rpx; color: var(--text-secondary); }
  }
  .points-info { display: flex; align-items: center; gap: var(--spacing-xs);
    .points-icon { font-size: 28rpx; }
    .points-text { font-size: 26rpx; color: var(--gold); }
  }
}

.sku-section { display: flex; align-items: center; padding: var(--spacing-base) var(--spacing-lg); background: var(--glass-bg); border-top: 1rpx solid var(--glass-border); border-bottom: 1rpx solid var(--glass-border);
  .sku-label { font-size: 28rpx; color: var(--text-secondary); margin-right: var(--spacing-base); }
  .sku-content { flex: 1; font-size: 28rpx; color: var(--text-primary); }
  .sku-arrow { font-size: 32rpx; color: var(--text-muted); }
}

// 支付公式透明化
.settlement-formula {
  padding: var(--spacing-base) var(--spacing-lg);

  .formula-bar {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 16rpx 20rpx;
    background: linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,212,255,0.04));
    border: 1rpx solid rgba(0,212,255,0.20);
    border-radius: var(--radius-md);
    margin-bottom: 8rpx;

    .formula-icon { font-size: 28rpx; }
    .formula-text { font-size: 26rpx; color: var(--text-secondary); }
    .formula-cash { color: var(--primary-light); font-weight: 700; }
    .formula-points { color: var(--accent); font-weight: 700; }
  }

  .formula-simple {
    background: linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.04));
    border-color: rgba(255,215,0,0.20);
  }

  .reward-hint {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 10rpx 20rpx;
    background: rgba(255,107,53,0.08);
    border: 1rpx solid rgba(255,107,53,0.15);
    border-radius: var(--radius-md);

    .reward-icon { font-size: 26rpx; }
    .reward-text { font-size: 24rpx; color: var(--accent); font-weight: 600; }
  }
}

.detail-section { padding: var(--spacing-base) var(--spacing-lg);
  .section-title { font-size: 32rpx; font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-base); }
  .detail-image { width: 100%; display: block; margin-bottom: var(--spacing-xs); }
}

.review-section { padding: var(--spacing-base) var(--spacing-lg);
  .empty-review { text-align: center; padding: 80rpx 0; color: var(--text-muted); font-size: 28rpx; }
}

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; padding: 16rpx 32rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: rgba(6,11,40,0.92); backdrop-filter: blur(20px); border-top: 1rpx solid rgba(255,255,255,0.08);
  .action-icons { display: flex; gap: var(--spacing-xl); margin-right: var(--spacing-base);
    .action-icon-item { display: flex; flex-direction: column; align-items: center; gap: 4rpx; font-size: 40rpx; position: relative;
      .cart-badge { position: absolute; top: -8rpx; right: -16rpx; min-width: 32rpx; height: 32rpx; background: var(--danger); border-radius: 16rpx; font-size: 20rpx; color: #fff; display: flex; align-items: center; justify-content: center; }
      .icon-label { font-size: 20rpx; color: var(--text-secondary); }
    }
  }
  .action-buttons { flex: 1; display: flex; gap: var(--spacing-sm);
    .btn-add-cart { flex: 1; height: 80rpx; line-height: 80rpx; text-align: center; background: rgba(77,142,255,0.10); border: 1rpx solid rgba(77,142,255,0.30); border-radius: 40rpx; font-size: 28rpx; color: var(--primary)-light; }
    .btn-buy-now { flex: 1; height: 80rpx; line-height: 80rpx; text-align: center; border-radius: 40rpx; font-size: 28rpx; font-weight: 700; color: #fff;
      &.btn-consume, &.btn-exchange { background: var(--accent-fire); box-shadow: var(--shadow-fire); }
      &.btn-redeem { background: linear-gradient(135deg, var(--accent-light), var(--accent)); box-shadow: var(--shadow-fire); }
    }
  }
}

.sku-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: flex-end;
  .sku-panel { width: 100%; background: var(--bg-card); border-radius: 24rpx 24rpx 0 0; max-height: 80vh;
    .sku-header { display: flex; align-items: center; padding: var(--spacing-base); border-bottom: 1rpx solid var(--border-color);
      .sku-image { width: 160rpx; height: 160rpx; border-radius: var(--radius)-sm; }
      .sku-info { flex: 1; margin-left: var(--spacing-base);
        .sku-price { font-size: 36rpx; font-weight: 700; color: var(--primary); display: block; }
        .sku-stock { font-size: 24rpx; color: var(--text-muted); display: block; margin-top: 8rpx; }
      }
      .sku-close { font-size: 48rpx; color: var(--text-muted); padding: 0 var(--spacing-base); }
    }
    .sku-content { padding: var(--spacing-base); max-height: 40vh; overflow-y: auto;
      .quantity-row { display: flex; align-items: center; justify-content: space-between;
        .quantity-label { font-size: 28rpx; color: var(--text-secondary); }
        .quantity-stepper { display: flex; align-items: center; gap: var(--spacing-base);
          .stepper-btn { width: 56rpx; height: 56rpx; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); border-radius: 8rpx; font-size: 32rpx; color: var(--text-primary); }
          .stepper-value { font-size: 32rpx; color: var(--text-primary); min-width: 60rpx; text-align: center; }
        }
      }
    }
    .sku-footer { padding: var(--spacing-base);
      .btn-buy-now-lg { height: 88rpx; line-height: 88rpx; text-align: center; border-radius: 44rpx; font-size: 32rpx; font-weight: 600; color: #0a0a0b;
        &.btn-consume, &.btn-exchange { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); }
        &.btn-redeem { background: linear-gradient(135deg, #52c41a, #237804); }
      }
    }
  }
}
</style>
