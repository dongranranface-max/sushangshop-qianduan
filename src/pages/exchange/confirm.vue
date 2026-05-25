<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">确认换购</text>
      <view class="page-nav__action" />
    </view>

    <scroll-view scroll-y class="confirm-body">
      <view v-if="loading" class="loading-wrap">
        <view class="loading-spinner" />
        <text>加载中...</text>
      </view>

      <template v-else-if="product">
        <!-- 商品卡片 -->
        <view class="product-card">
          <image class="product-card__cover" :src="product.coverImage || '/static/logo.png'" mode="aspectFill" lazy-load />
          <view class="product-card__info">
            <text class="product-card__name">{{ product.name }}</text>
            <view class="price-row">
              <text class="price-cash">¥{{ product.price }}</text>
              <text class="price-plus">+{{ product.requiredPoints || product.ecoPoints || 0 }}积分</text>
            </view>
          </view>
        </view>

        <!-- 收货地址 -->
        <view class="section-card" @click="goSelectAddress">
          <view class="section-card__icon-wrap">
            <text class="section-card__icon">📦</text>
          </view>
          <view class="section-card__content" v-if="address">
            <view class="address-row">
              <text class="address-name">{{ address.consignee }}</text>
              <text class="address-phone">{{ address.phone }}</text>
            </view>
            <text class="address-detail">{{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail }}</text>
          </view>
          <view class="section-card__empty" v-else>
            <text>请选择收货地址</text>
          </view>
          <text class="section-card__arrow">›</text>
        </view>

        <!-- 积分说明 -->
        <view class="info-card">
          <view class="info-card__header">
            <text class="info-card__title">换购说明</text>
          </view>
          <view class="rule-list">
            <view class="rule-item">
              <view class="rule-dot" />
              <text class="rule-text">使用 {{ product.requiredPoints || 0 }} 生态积分，抵扣 {{ product.requiredPoints || 0 }} 元现金</text>
            </view>
            <view class="rule-item">
              <view class="rule-dot" />
              <text class="rule-text">实际支付：¥{{ product.price }} 现金 + {{ product.requiredPoints || 0 }} 积分</text>
            </view>
            <view class="rule-item">
              <view class="rule-dot" />
              <text class="rule-text">换购成功后，支付金额的 30% 将转为消费积分</text>
            </view>
          </view>
        </view>
      </template>

      <view v-else-if="!loading" class="empty-state">
        <view class="empty-state__icon">商</view>
        <text class="empty-state__text">商品不存在</text>
        <view class="empty-state__btn" @click="goBack"><text>返回</text></view>
      </view>

      <view class="bottom-placeholder" :style="{ height: (160 + safeAreaBottom) + 'px' }" />
    </scroll-view>

    <!-- 底部提交栏 -->
    <view v-if="product" class="submit-bar">
      <view class="submit-bar__inner">
        <view class="submit-info">
          <text class="submit-label">合计</text>
          <text class="submit-cash">¥{{ product.price }}</text>
          <text class="submit-points">+{{ product.requiredPoints || 0 }}积分</text>
        </view>
        <view
          class="submit-btn"
          :class="{ 'submit-btn--disabled': !canSubmit }"
          @click="doSubmit"
        >
          <text>确认换购</text>
        </view>
      </view>
    </view>

    <view class="safe-area-bottom" :style="{ height: safeAreaBottom + 'px' }" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { productApi, addressApi, orderApi, type ProductDetail, type AddressItem } from '@/utils/api'
import { checkAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const loading = ref(false)
const productId = ref('')
const product = ref<ProductDetail | null>(null)
const address = ref<AddressItem | null>(null)
const submitting = ref(false)

const canSubmit = computed(() => !!address.value && !submitting.value)

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0

  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const opts = (current as unknown as { options?: Record<string, string> })?.options || {}
  productId.value = opts.productId || ''

  if (checkAuth() && productId.value) loadData()
})

async function loadData() {
  loading.value = true
  try {
    const [prodRes, addrRes] = await Promise.all([
      productApi.getDetail(productId.value),
      addressApi.getDefault().catch(() => null),
    ])
    product.value = prodRes
    const savedAddr = uni.getStorageSync('selectedAddress')
    if (savedAddr) {
      try { address.value = JSON.parse(savedAddr) } catch {}
    }
    if (!address.value && addrRes) {
      address.value = addrRes
    }
  } catch {} finally {
    loading.value = false
  }
}

function goBack() { uni.navigateBack() }

function goSelectAddress() {
  uni.navigateTo({ url: '/pages/address/list?mode=select' })
}

async function doSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  uni.showLoading({ title: '提交中...' })
  try {
    await orderApi.create({
      orderType: 2,
      addressId: address.value.id,
      items: [{ productId: productId.value, quantity: 1 }],
    })
    uni.showToast({ title: '换购成功', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: '/pages/order/list' }), 1500)
  } catch (e: unknown) {
    uni.showToast({ title: (e as Error)?.message || '提交失败', icon: 'none' })
  } finally {
    uni.hideLoading()
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  @include page-bg;
  display: flex;
  flex-direction: column;
}

.status-bar { width: 100%; }

// ========== 导航栏 ==========
.page-nav {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx $spacing-base;
  background: rgba(249, 249, 249, 0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1rpx solid rgba(20, 20, 20, 0.04);

  &__back,
  &__action {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(12px);
    border: 1rpx solid rgba(20, 20, 20, 0.06);
    border-radius: 50%;
    font-size: 28rpx;
    color: $mineral-gray;
    flex-shrink: 0;
  }

  &__title {
    flex: 1;
    font-size: 32rpx;
    font-weight: 700;
    color: $mineral-gray;
    text-align: center;
    letter-spacing: 0.5rpx;
  }
}

// ========== 内容区 ==========
.confirm-body {
  flex: 1;
  padding: $spacing-base;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 120rpx;
  font-size: 28rpx;
  color: $text-muted;
}

.loading-spinner {
  width: 56rpx;
  height: 56rpx;
  border: 3rpx solid rgba(184, 152, 118, 0.2);
  border-top-color: $accent-dark;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

// ========== 商品卡片 ==========
.product-card {
  display: flex;
  gap: $spacing-base;
  padding: $spacing-base;
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.60);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  margin-bottom: $spacing-base;

  &__cover {
    width: 180rpx;
    height: 180rpx;
    border-radius: $radius-md;
    background: $bg-tertiary;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12rpx;
  }

  &__name {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.price-cash {
  font-family: $asset-balance-font;
  font-size: 40rpx;
  font-weight: 700;
  color: $danger;
  font-variant-numeric: tabular-nums;
}

.price-plus {
  font-size: 26rpx;
  font-weight: 600;
  color: $accent-dark;
}

// ========== Section 通用卡片 ==========
.section-card {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.60);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  margin-bottom: $spacing-base;

  &__icon-wrap {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(184, 152, 118, 0.10);
    border-radius: $radius-md;
    border: 1rpx solid rgba(184, 152, 118, 0.20);
    flex-shrink: 0;
  }

  &__icon { font-size: 28rpx; }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  &__empty {
    flex: 1;
    font-size: 28rpx;
    color: $text-muted;
  }

  &__arrow {
    font-size: 36rpx;
    color: $text-muted;
    flex-shrink: 0;
  }
}

.address-row {
  display: flex;
  align-items: center;
  gap: 12rpx;

  .address-name {
    font-size: 28rpx;
    font-weight: 700;
    color: $text-primary;
  }

  .address-phone {
    font-size: 26rpx;
    color: $text-secondary;
    font-variant-numeric: tabular-nums;
  }
}

.address-detail {
  font-size: 24rpx;
  color: $text-muted;
  line-height: 1.5;
}

// ========== 积分说明卡片 ==========
.info-card {
  padding: $spacing-base $spacing-lg;
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.60);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  margin-bottom: $spacing-base;

  &__header {
    margin-bottom: $spacing-base;
  }

  &__title {
    font-size: 28rpx;
    font-weight: 700;
    color: $text-primary;
  }
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.rule-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: $accent;
  flex-shrink: 0;
  margin-top: 10rpx;
}

.rule-text {
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.6;
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
    margin-bottom: 40rpx;
  }

  &__btn {
    height: 80rpx;
    padding: 0 56rpx;
    background: $accent-gradient;
    border-radius: $radius-full;
    box-shadow: $btn-gold-shadow;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      font-size: 30rpx;
      font-weight: 700;
      color: #fff;
    }
  }
}

.bottom-placeholder { width: 100%; }

// ========== 底部提交栏 ==========
.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(20px);
  border-top: 1rpx solid rgba(20, 20, 20, 0.06);
  box-shadow: 0 -8rpx 32rpx rgba(47, 53, 66, 0.06);

  &__inner {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 16rpx $spacing-base;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  }
}

.submit-info {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
  flex: 1;

  .submit-label {
    font-size: 24rpx;
    color: $text-muted;
  }

  .submit-cash {
    font-family: $asset-balance-font;
    font-size: 40rpx;
    font-weight: 700;
    color: $danger;
    font-variant-numeric: tabular-nums;
  }

  .submit-points {
    font-size: 26rpx;
    font-weight: 600;
    color: $accent-dark;
  }
}

.submit-btn {
  height: 88rpx;
  padding: 0 56rpx;
  background: $accent-gradient;
  border-radius: $radius-full;
  box-shadow: $btn-gold-shadow;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;

  text {
    font-size: 30rpx;
    font-weight: 700;
    color: #fff;
    letter-spacing: 1rpx;
  }

  &:active { transform: scale(0.97); }

  &--disabled {
    background: rgba(47, 53, 66, 0.18);
    box-shadow: none;
    pointer-events: none;

    text { color: rgba(255, 255, 255, 0.5); }
  }
}

.safe-area-bottom { width: 100%; }
</style>
