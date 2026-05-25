<template>
  <view class="page-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 顶部导航 -->
    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">商品详情</text>
      <view class="page-nav__share" @click="share"><text>↗</text></view>
    </view>

    <!-- 商品图片轮播 -->
    <view class="product-gallery">
      <swiper class="gallery-swiper" :indicator-dots="true" :autoplay="false"
        :current="currentImg" @change="onSwiperChange"
        indicator-color="rgba(255,255,255,0.4)"
        indicator-active-color="#B89876">
        <swiper-item v-for="(img, i) in images" :key="i">
          <image class="gallery-img" :src="img" mode="aspectFill" @error="handleImgError(i, $event)" />
        </swiper-item>
      </swiper>
      <view class="gallery-count">
        <text>{{ currentImg + 1 }} / {{ images.length || 1 }}</text>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-wrap">
      <view class="loading-spinner" />
      <text>加载中...</text>
    </view>

    <template v-else-if="product.id">
      <!-- 商品信息 -->
      <view class="product-info">
        <!-- 价格行 -->
        <view class="price-section">
          <view class="price-main">
            <template v-if="product.type === 3">
              <text class="price-points">{{ product.requiredPoints }}积分</text>
            </template>
            <template v-else>
              <text class="price-symbol">¥</text>
              <text class="price-value">{{ product.price }}</text>
              <text v-if="product.type === 2" class="price-plus">+{{ product.requiredPoints }}积分</text>
            </template>
          </view>
          <text class="sales-count">已售 {{ product.salesCount || 0 }}</text>
        </view>

        <!-- 商品名称 -->
        <text class="product-name">{{ product.name }}</text>

        <!-- 商品描述 -->
        <text v-if="product.description" class="product-desc">{{ product.description }}</text>

        <!-- 换购公式 -->
        <view v-if="product.type === 2 && product.price && product.requiredPoints" class="exchange-formula">
          <view class="formula-tag">换购公式</view>
          <text class="formula-text">
            ¥{{ product.price }} = {{ product.price }}现金 + {{ product.requiredPoints }}积分
          </text>
        </view>

        <!-- 配送信息 -->
        <view class="delivery-info">
          <text class="delivery-icon">发</text>
          <text class="delivery-text">免运费 · 预计 {{ deliveryDays }}日内送达</text>
        </view>

        <!-- SKU 规格选择 -->
        <view class="sku-section" @click.stop="openSkuSheet">
          <text class="sku-label">规格</text>
          <text class="sku-value" :class="{ 'sku-placeholder': !selectedSkuId }">
            {{ selectedText || '请选择规格' }}
          </text>
          <text class="sku-arrow">›</text>
        </view>
      </view>

      <!-- 商品详情 -->
      <view class="detail-section">
        <view class="detail-section__head">
          <text class="detail-section__title">商品详情</text>
        </view>
        <view v-for="(img, i) in detailImages" :key="i" class="detail-img-wrap">
          <image class="detail-img" :src="img" mode="widthFix" lazy-load @error="handleDetailImgError(i, $event)" />
        </view>
        <view v-if="product.detail" class="detail-text" v-html="product.detail" />
      </view>

      <view class="bottom-placeholder" :style="{ height: (140 + safeAreaBottom) + 'px' }" />
    </template>

    <!-- 空状态 -->
    <view v-else-if="!loading" class="empty-state">
      <view class="empty-state__icon">商</view>
      <text class="empty-state__text">商品不存在或已下架</text>
      <view class="empty-state__btn" @click="goCatalog"><text>去首页</text></view>
    </view>

    <!-- 底部操作栏 -->
    <view v-if="product.id" class="action-bar">
      <view class="action-bar__inner">
        <!-- 收藏 -->
        <view class="action-icon-btn" @click="toggleFavorite">
          <text class="action-icon">{{ isFavorite ? '♥' : '♡' }}</text>
          <text class="action-label">收藏</text>
        </view>
        <!-- 购物车 -->
        <view class="action-icon-btn" @click="goCart">
          <text class="action-icon">🛒</text>
          <text class="action-label">购物车</text>
          <view v-if="cartCount > 0" class="action-badge">{{ cartCount }}</view>
        </view>
        <!-- 操作按钮 -->
        <view class="action-btns">
          <view class="btn-add-cart" @click="addToCart"><text>加入购物车</text></view>
          <view class="btn-buy-now" @click="buyNow"><text>立即购买</text></view>
        </view>
      </view>
    </view>

    <view class="safe-area-bottom" :style="{ height: safeAreaBottom + 'px' }" />
    <!-- SKU 底部弹窗 -->
    <view v-if="skuSheetVisible" class="sku-overlay" @click="closeSkuSheet">
      <view class="sku-sheet" @click.stop>
        <view class="sku-sheet__header">
          <image class="sku-sheet__cover" :src="product.coverImage || DEFAULT_PRODUCT_COVER" mode="aspectFill" />
          <view class="sku-sheet__info">
            <text class="sku-sheet__price">{{ currentSkuPrice }}</text>
            <text class="sku-sheet__stock">库存 {{ currentSkuStock }} 件</text>
            <text class="sku-sheet__tips">{{ selectedText }}</text>
          </view>
          <view class="sku-sheet__close" @click="closeSkuSheet">×</view>
        </view>
        <scroll-view scroll-y class="sku-sheet__body">
          <view v-for="spec in skuSpecs" :key="spec.name" class="spec-group">
            <text class="spec-group__name">{{ spec.name }}</text>
            <view class="spec-group__options">
              <view
                v-for="opt in spec.options"
                :key="opt"
                class="spec-option"
                :class="{ 'is-selected': selectedOptions[spec.name] === opt, 'is-disabled': !isOptionAvailable(spec.name, opt) }"
                @click="selectOption(spec.name, opt)">
                <text>{{ opt }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
        <view class="sku-sheet__footer">
          <view class="sku-confirm-btn" :class="{ 'is-disabled': !selectedSkuId }" @click="confirmSku">
            <text>确认</text>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { productApi, cartApi, favoriteApi } from '@/utils/api'
import { checkAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'

const DEFAULT_PRODUCT_COVER = '/static/logo.png'

const statusBarHeight = ref(20)
const safeAreaBottom = ref(0)
const loading = ref(false)
interface Product { id: number; name: string; coverImage?: string; images?: string | string[]; detailImages?: string | string[]; description?: string; price?: string | number; requiredPoints?: number; type?: number; isFavorite?: boolean; salesCount?: number; [k: string]: unknown }
const product = ref<Product>({})
const images = ref<string[]>([])
const detailImages = ref<string[]>([])
const currentImg = ref(0)
const isFavorite = ref(false)
const cartCount = ref(0)
const deliveryDays = ref(3)
const productId = ref(0)
const productType = ref(1)

const skuSelected = ref({ color: '', size: '' }); void skuSelected

// ---- SKU选择器状态 ----
interface SkuSpec { name: string; options: string[] }
interface SkuItem { id: string; specs: string; price: string; points: string; stock: number }
const skuSpecs = ref<SkuSpec[]>([])
const skuList = ref<SkuItem[]>([])
const selectedOptions = ref<Record<string, string>>({})
const skuSheetVisible = ref(false)
const selectedSkuId = ref<string | null>(null)

const selectedText = computed(() => {
  if (!selectedSkuId.value) return ''
  const sku = skuList.value.find((s) => s.id === selectedSkuId.value)
  if (!sku) return ''
  try {
    const p = JSON.parse(sku.specs) as Record<string, string>
    return Object.entries(p).map(([k, v]) => `${k  }:${  v}`).join(' / ')
  } catch { return '' }
})

const currentSkuPrice = computed(() => {
  const sku = skuList.value.find((s) => s.id === selectedSkuId.value)
  if (!sku) return product.value.price ? `¥${  product.value.price}` : '¥--'
  const t = (product.value as Record<string, unknown>).productType
  if (t === 3) return `${sku.points  }积分`
  if (t === 2) return `¥${  sku.price  } + ${  sku.points  }积分`
  return `¥${  sku.price}`
})

const currentSkuStock = computed(() => {
  return skuList.value.find((s) => s.id === selectedSkuId.value)?.stock ?? 0
})

function isOptionAvailable(name: string, opt: string): boolean {
  if (!skuSpecs.value.length) return true
  const probe = { ...selectedOptions.value, [name]: opt }
  if (!skuSpecs.value.every((s) => probe[s.name] !== undefined)) return true
  return skuList.value.some((sku) => {
    try {
      const p = JSON.parse(sku.specs) as Record<string, string>
      return Object.entries(probe).every(([k, v]) => p[k] === v) && sku.stock > 0
    } catch { return false }
  })
}

function selectOption(name: string, opt: string) {
  if (!isOptionAvailable(name, opt)) return
  selectedOptions.value = { ...selectedOptions.value, [name]: opt }
  const matched = skuList.value.find((sku) => {
    try {
      const p = JSON.parse(sku.specs) as Record<string, string>
      return Object.entries(selectedOptions.value).every(([k, v]) => p[k] === v)
    } catch { return false }
  })
  selectedSkuId.value = matched?.id ?? null
}

function openSkuSheet() {
  const res = product.value as Record<string, unknown>
  skuSpecs.value = (res['specs'] as SkuSpec[]) ?? []
  skuList.value = (res['skus'] as SkuItem[]) ?? []
  selectedOptions.value = {}
  selectedSkuId.value = null
  skuSheetVisible.value = true
}

function closeSkuSheet() { skuSheetVisible.value = false }

function confirmSku() {
  if (!selectedSkuId.value) {
    uni.showToast({ title: '请选择完整规格', icon: 'none' })
    return
  }
  skuSheetVisible.value = false
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  safeAreaBottom.value = sys.safeAreaInsets?.bottom || 0
})

onShow(() => {
  if (checkAuth()) { assetStore.fetchBalance(); loadCartCount() }
  loadFromRoute()
})

function loadFromRoute() {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const options = (current as unknown as { options?: Record<string, string> })?.options || {}
  const id = Number(options.id || 0)
  const type = Number(options.type || 1)
  if (id) { productId.value = id; productType.value = type; loadProduct(id) }
}

async function loadProduct(id: number) {
  loading.value = true
  try {
    const res = await productApi.getDetail(id)
    product.value = res || {}
    const allImages: string[] = []
    if (res.coverImage) allImages.push(res.coverImage)
    if (res.images) {
      try {
        const imgs = typeof res.images === 'string' ? JSON.parse(res.images) : res.images
        allImages.push(...(Array.isArray(imgs) ? imgs : []))
      } catch {}
    }
    if (res.detailImages) {
      try {
        const di = typeof res.detailImages === 'string' ? JSON.parse(res.detailImages) : res.detailImages
        detailImages.value = Array.isArray(di) ? di : []
      } catch {}
    }
    images.value = allImages.length ? allImages : [DEFAULT_PRODUCT_COVER]
    isFavorite.value = res.isFavorite || false
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '加载失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadCartCount() {
  try {
    const res = await cartApi.count()
    cartCount.value = res?.count ?? 0
  } catch {}
}

async function toggleFavorite() {
  if (!checkAuth()) return
  try {
    const checkRes = await favoriteApi.check(String(productId.value))
    if (checkRes?.favorited) {
      await favoriteApi.remove(String(productId.value))
      isFavorite.value = false
      uni.showToast({ title: '已取消', icon: 'success' })
    } else {
      await favoriteApi.add(String(productId.value))
      isFavorite.value = true
      uni.showToast({ title: '已收藏', icon: 'success' })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    uni.showToast({ title: message, icon: 'none' })
  }
}

function showSkuPicker() { openSkuSheet() } void showSkuPicker

async function addToCart() {
  if (!checkAuth()) return
  if (skuList.value.length > 0 && !selectedSkuId.value) { openSkuSheet(); return }
  try {
    await cartApi.add({ productId: String(productId.value), quantity: 1, skuId: selectedSkuId.value ?? undefined })
    const countRes = await cartApi.count()
    cartCount.value = countRes?.count ?? 0
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '添加失败'
    uni.showToast({ title: message, icon: 'none' })
  }
}

function buyNow() {
  if (!checkAuth()) return
  if (skuList.value.length > 0 && !selectedSkuId.value) { openSkuSheet(); return }
  const _navUrl = selectedSkuId.value ? `/pages/order/confirm?productId=${productId.value}&quantity=1&type=${productType.value}&skuId=${selectedSkuId.value}` : `/pages/order/confirm?productId=${productId.value}&quantity=1&type=${productType.value}`; uni.navigateTo({ url: _navUrl })
}

function goBack() { uni.navigateBack() }
function goCatalog() { uni.switchTab({ url: '/pages/index/index' }) }
function goCart() { uni.switchTab({ url: '/pages/cart/index' }) }
function share() { uni.showShareMenu({ menus: ['shareTimeline', 'shareAppMessage'] }) }
function onSwiperChange(e: { detail: { current: number } }) { currentImg.value = e.detail.current }

function handleImgError(index: number, _e: unknown) {
  if (images.value[index] !== DEFAULT_PRODUCT_COVER) {
    images.value[index] = DEFAULT_PRODUCT_COVER
  }
}

function handleDetailImgError(index: number, _e: unknown) {
  if (detailImages.value[index] !== DEFAULT_PRODUCT_COVER) {
    detailImages.value[index] = DEFAULT_PRODUCT_COVER
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  @include page-bg;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}

.status-bar { width: 100%; }

// ========== 顶部导航 ==========
.page-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx $spacing-base;
  background: rgba(249, 249, 249, 0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1rpx solid rgba(20, 20, 20, 0.04);

  &__back,
  &__share {
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

// ========== 商品图库 ==========
.product-gallery {
  position: relative;
  padding-top: 100rpx;
}

.gallery-swiper {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  overflow: hidden;
  background: $bg-tertiary;
}

.gallery-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: $bg-tertiary;
}

.gallery-count {
  position: absolute;
  bottom: 24rpx;
  right: 24rpx;
  padding: 6rpx 20rpx;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  border-radius: 20rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
}

// ========== 商品信息 ==========
.product-info {
  padding: $spacing-lg $spacing-base;
  border-bottom: 1rpx solid $border-light;
}

.price-section {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: $spacing-base;
}

.price-main {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.price-symbol {
  font-size: 32rpx;
  font-weight: 700;
  color: $mineral-gray;
}

.price-value {
  font-family: $asset-balance-font;
  font-size: 56rpx;
  font-weight: 700;
  color: $mineral-gray;
  letter-spacing: -1rpx;
  font-variant-numeric: tabular-nums;
}

.price-points {
  font-family: $asset-balance-font;
  font-size: 48rpx;
  font-weight: 700;
  color: $accent-dark;
  letter-spacing: -1rpx;
  font-variant-numeric: tabular-nums;
}

.price-plus {
  font-size: 26rpx;
  font-weight: 600;
  color: $accent-dark;
  margin-left: 8rpx;
}

.sales-count {
  font-size: 22rpx;
  color: $text-muted;
}

.product-name {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.4;
  margin-bottom: $spacing-sm;
}

.product-desc {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.6;
  margin-bottom: $spacing-base;
}

// ========== SKU 规格选择 ==========
.sku-section {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: $spacing-base;
  padding: 16rpx $spacing-base;
  background: rgba(47, 53, 66, 0.04);
  border: 1rpx solid $border-light;
  border-radius: $radius-lg;

  .sku-label {
    font-size: 26rpx;
    font-weight: 600;
    color: $text-secondary;
    flex-shrink: 0;
  }

  .sku-value {
    flex: 1;
    font-size: 26rpx;
    color: $text-primary;
    font-weight: 500;

    &.sku-placeholder {
      color: #ff7c31;
    }
  }

  .sku-arrow {
    font-size: 32rpx;
    color: $text-muted;
    flex-shrink: 0;
  }
}

// ========== 换购公式 ==========
.exchange-formula {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx $spacing-base;
  background: rgba(184, 152, 118, 0.06);
  border: 1rpx solid rgba(184, 152, 118, 0.15);
  border-radius: $radius-lg;
  margin-bottom: $spacing-base;

  .formula-tag {
    font-size: 20rpx;
    font-weight: 600;
    padding: 4rpx 12rpx;
    background: $warm-yellow;
    color: $accent-dark;
    border-radius: 20rpx;
    border: 1rpx solid $border-primary;
    flex-shrink: 0;
  }

  .formula-text {
    font-size: 24rpx;
    color: $text-secondary;
    font-weight: 500;
  }
}

// ========== 配送信息 ==========
.delivery-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.delivery-icon {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(47, 53, 66, 0.06);
  border-radius: 50%;
  font-size: 18rpx;
  font-weight: 700;
  color: $mineral-gray;
  flex-shrink: 0;
}

.delivery-text {
  font-size: 24rpx;
  color: $text-muted;
}

// ========== 商品详情 ==========
.detail-section {
  padding: $spacing-base;

  &__head {
    padding: $spacing-sm 0;
    margin-bottom: $spacing-base;
  }

  &__title {
    font-size: 30rpx;
    font-weight: 700;
    color: $text-primary;
    letter-spacing: 0.5rpx;
  }
}

.detail-img-wrap {
  width: 100%;
  overflow: hidden;
  margin-bottom: 4rpx;

  .detail-img {
    width: 100%;
    display: block;
    background: $bg-tertiary;
  }
}

.detail-text {
  padding: $spacing-base 0;
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1.7;
}

// ========== 底部操作栏 ==========
.action-bar {
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
    gap: 12rpx;
    padding: 16rpx $spacing-base;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  }
}

.action-icon-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 8rpx 20rpx;
  flex-shrink: 0;

  .action-icon {
    font-size: 36rpx;
    color: $mineral-gray;
  }

  .action-label {
    font-size: 18rpx;
    color: $text-muted;
    font-weight: 500;
  }

  .action-badge {
    position: absolute;
    top: 0;
    right: 8rpx;
    min-width: 32rpx;
    height: 32rpx;
    padding: 0 6rpx;
    background: $danger;
    border-radius: 16rpx;
    font-size: 18rpx;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }
}

.action-btns {
  flex: 1;
  display: flex;
  gap: 12rpx;

  > view {
    flex: 1;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-full;
    font-size: 30rpx;
    font-weight: 700;
    letter-spacing: 0.5rpx;
    transition: transform 0.15s ease;

    &:active { transform: scale(0.97); }
  }
}

.btn-add-cart {
  background: rgba(255, 255, 255, 0.95);
  border: 1rpx solid rgba(20, 20, 20, 0.12);
  color: $mineral-gray;
}

.btn-buy-now {
  background: $btn-gold-gradient;
  box-shadow: $btn-gold-shadow;
  color: #fff;
}

// ========== 空/加载状态 ==========
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx;
  gap: 16rpx;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
  text-align: center;

  &__icon {
    width: 140rpx;
    height: 140rpx;
    line-height: 140rpx;
    text-align: center;
    font-size: 56rpx;
    font-weight: 800;
    background: $warm-yellow;
    border: 1rpx solid $border-primary;
    border-radius: 50%;
    color: $accent-dark;
    margin-bottom: 32rpx;
  }

  &__text {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 40rpx;
  }

  &__btn {
    height: 80rpx;
    padding: 0 56rpx;
    background: $btn-gold-gradient;
    border-radius: $radius-full;
    box-shadow: $btn-gold-shadow;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      font-size: 30rpx;
      font-weight: 700;
      color: #fff;
      letter-spacing: 1rpx;
    }
  }
}

// ========== SKU 底部弹窗 ==========
.sku-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end;
}
.sku-sheet {
  width: 100%; max-height: 72vh; background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex; flex-direction: column; overflow: hidden;
  &__header { display: flex; align-items: center; padding: 32rpx; gap: 24rpx;
    border-bottom: 1rpx solid $border-light; flex-shrink: 0; }
  &__cover { width: 160rpx; height: 160rpx; border-radius: $radius-md; background: $bg-tertiary; flex-shrink: 0; }
  &__info { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
  &__price { font-size: 40rpx; font-weight: 800; color: $accent-dark; }
  &__stock { font-size: 24rpx; color: $text-muted; }
  &__tips { font-size: 24rpx; color: $text-secondary; }
  &__close { width: 56rpx; height: 56rpx; display: flex; align-items: center;
    justify-content: center; font-size: 40rpx; color: $text-muted; flex-shrink: 0; }
  &__body { flex: 1; padding: 32rpx; overflow-y: auto; }
  &__footer { padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
    flex-shrink: 0; border-top: 1rpx solid $border-light; }
}
.spec-group { margin-bottom: 32rpx;
  &__name { display: block; font-size: 26rpx; font-weight: 600; color: $text-primary; margin-bottom: 16rpx; }
  &__options { display: flex; flex-wrap: wrap; gap: 16rpx; }
}
.spec-option {
  min-width: 100rpx; padding: 12rpx 24rpx; border: 2rpx solid $border-light;
  border-radius: $radius-md; font-size: 26rpx; text-align: center;
  color: $text-primary; background: #fff; transition: border-color .18s, color .18s, background .18s;
  &.is-selected { border-color: $accent-dark; color: $accent-dark;
    background: rgba(184,152,118,0.08); font-weight: 600; }
  &.is-disabled { opacity: 0.35; text-decoration: line-through; pointer-events: none; }
}
.sku-confirm-btn {
  height: 88rpx; background: $btn-gold-gradient; border-radius: $radius-full;
  box-shadow: $btn-gold-shadow; display: flex; align-items: center;
  justify-content: center; font-size: 32rpx; font-weight: 700; color: #fff; letter-spacing: 2rpx;
  &.is-disabled { opacity: 0.45; pointer-events: none; }
}

</style>
