<template>
  <view class="page-container">
    <!-- 毛玻璃状态栏 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 页面导航 -->
    <view class="page-nav">
      <view class="page-nav__back" @click="goBack"><text>←</text></view>
      <text class="page-nav__title">购物车</text>
      <view class="page-nav__action" @click="goHome"><text>首</text></view>
    </view>

    <!-- 三大商城分组切换 -->
    <view class="mall-group-tabs">
      <view
        v-for="group in groups"
        :key="group.type"
        class="mall-group-tab"
        :class="{ active: currentGroup === group.type }"
        @click="switchGroup(group.type)"
      >
        <text class="mall-group-tab__abbr">{{ group.abbr }}</text>
        <text class="mall-group-tab__label">{{ group.label }}</text>
        <view v-if="getGroupCount(group.type) > 0" class="mall-group-tab__count">
          {{ getGroupCount(group.type) }}
        </view>
      </view>
    </view>

    <!-- 购物车列表 -->
    <scroll-view class="cart-scroll" scroll-y>
      <!-- 骨架屏 -->
      <view v-if="loading && !filteredItems.length" class="cart-list">
        <view v-for="i in 2" :key="i" class="sk-item">
          <view class="sk-check shimmer" />
          <view class="sk-img shimmer" />
          <view class="sk-info">
            <view class="sk-line shimmer" />
            <view class="sk-line sk-short shimmer" />
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!filteredItems.length" class="empty-state">
        <view class="empty-state__icon">{{ currentGroup === 1 ? '购' : currentGroup === 2 ? '换' : '兑' }}</view>
        <text class="empty-state__text">购物车是空的</text>
        <text class="empty-state__sub">去{{ currentGroup === 1 ? '消费' : currentGroup === 2 ? '换购' : '兑换' }}商城发现好物吧</text>
        <view class="empty-state__btn" @click="goCatalog">
          <text>去逛逛</text>
        </view>
      </view>

      <!-- 购物车卡片 -->
      <view v-else class="cart-list">
        <view
          v-for="item in filteredItems"
          :key="item.id"
          class="cart-item"
          :class="{ selected: item.selected }"
        >
          <!-- 选择框 -->
          <view class="cart-item__check" @click="toggleSelect(item)">
            <view class="check-circle" :class="{ 'is-selected': item.selected }">
              <text v-if="item.selected" class="check-mark">✓</text>
            </view>
          </view>

          <!-- 商品图片 -->
          <image
            class="cart-item__img"
            :src="item.product?.coverImage || item.coverImage"
            mode="aspectFill"
          />

          <!-- 商品信息 -->
          <view class="cart-item__info">
            <text class="cart-item__name">{{ item.product?.name || item.name }}</text>

            <!-- 价格展示 -->
            <view class="cart-item__price-row">
              <template v-if="item.type === 1">
                <text class="cart-item__cash">¥{{ item.price }}</text>
                <view class="cart-item__tag">返积分</view>
              </template>
              <template v-else-if="item.type === 2">
                <text class="cart-item__cash">¥{{ item.price }}</text>
                <view class="cart-item__tag cart-item__tag--gold">
                  +{{ item.requiredPoints || 0 }}积分
                </view>
              </template>
              <template v-else>
                <text class="cart-item__points">{{ item.requiredPoints }}积分</text>
              </template>
            </view>

            <!-- 数量操作 -->
            <view class="cart-item__stepper">
              <view class="stepper-btn" @click="changeQty(item, -1)"><text>−</text></view>
              <text class="stepper-num">{{ item.quantity }}</text>
              <view class="stepper-btn" @click="changeQty(item, 1)"><text>+</text></view>
            </view>
          </view>

          <!-- 删除 -->
          <view class="cart-item__del" @click="removeItem(item)"><text>×</text></view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部结算栏 -->
    <view v-if="filteredItems.length" class="bottom-bar">
      <!-- 全选 -->
      <view class="bottom-bar__select" @click="toggleSelectAll">
        <view class="check-circle" :class="{ 'is-selected': allSelected }">
          <text v-if="allSelected" class="check-mark">✓</text>
        </view>
        <text class="bottom-bar__select-label">全选</text>
      </view>

      <!-- 合计 -->
      <view class="bottom-bar__total">
        <text class="total-label">合计</text>
        <view class="total-amount">
          <text class="total-cash">¥{{ totalCash.toFixed(2) }}</text>
          <text v-if="totalPoints > 0" class="total-points">+{{ totalPoints }}积分</text>
        </view>
      </view>

      <!-- 结算按钮 -->
      <view class="bottom-bar__btn" :class="{ 'is-disabled': !hasSelected }" @click="goSettle">
        <text>结算 ({{ selectedCount }})</text>
      </view>
    </view>

    <!-- 安全区 -->
    <view class="safe-area-bottom" />

    <LuxuryTabbar />
    <AssetStatusBar v-if="loggedIn" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { cartApi } from '@/utils/api'
import { checkAuth, requireAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'
import LuxuryTabbar from '@/components/LuxuryTabbar.vue'
import AssetStatusBar from '@/components/AssetStatusBar.vue'

const statusBarHeight = ref(20)
const loggedIn = ref(checkAuth())
const currentGroup = ref(1)
const cartItems = ref<any[]>([])
const loading = ref(false)

const groups = [
  { type: 1, abbr: '消', label: '消费' },
  { type: 2, abbr: '换', label: '换购' },
  { type: 3, abbr: '兑', label: '兑换' },
]

const filteredItems = computed(() =>
  cartItems.value.filter(item => item.type === currentGroup.value)
)

function getGroupCount(type: number) {
  return cartItems.value.filter(item => item.type === type).length
}

const allSelected = computed(() =>
  filteredItems.value.length > 0 && filteredItems.value.every((i: any) => i.selected)
)

const selectedItems = computed(() => filteredItems.value.filter((i: any) => i.selected))

const selectedCount = computed(() => selectedItems.value.length)

const totalCash = computed(() =>
  selectedItems.value.reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0)
)

const totalPoints = computed(() =>
  selectedItems.value.reduce((s: number, i: any) => s + ((i.requiredPoints || 0) * i.quantity), 0)
)

const hasSelected = computed(() => selectedCount.value > 0)

onMounted(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
})

onShow(() => {
  loggedIn.value = checkAuth()
  if (loggedIn.value) {
    assetStore.fetchBalance()
    loadCart()
  }
})

async function loadCart() {
  loading.value = true
  try {
    const res = await cartApi.list()
    cartItems.value = (res || []).map((item: any) => ({ ...item, selected: item.selected ?? false }))
  } catch {
    cartItems.value = []
  } finally {
    loading.value = false
  }
}

async function changeQty(item: any, delta: number) {
  const newQty = item.quantity + delta
  if (newQty < 1) return
  try {
    await cartApi.updateQuantity(item.id, newQty)
    item.quantity = newQty
  } catch (e: any) {
    uni.showToast({ title: e.message || '修改失败', icon: 'none' })
  }
}

async function toggleSelect(item: any) {
  try {
    await cartApi.updateSelected(item.id, !item.selected)
    item.selected = !item.selected
  } catch {}
}

async function toggleSelectAll() {
  const all = allSelected.value
  try {
    await cartApi.selectAll(!all)
    filteredItems.value.forEach((item: any) => { item.selected = !all })
  } catch {}
}

async function removeItem(item: any) {
  try {
    await cartApi.remove(item.id)
    cartItems.value = cartItems.value.filter((i: any) => i.id !== item.id)
  } catch {}
}

function switchGroup(type: number) {
  currentGroup.value = type
}

function goBack() { uni.navigateBack() }
function goHome() { uni.switchTab({ url: '/pages/index/index' }) }
function goCatalog() { uni.switchTab({ url: '/pages/catalog/index' }) }

function goSettle() {
  if (!hasSelected.value) return
  if (!requireAuth()) return
  const ids = selectedItems.value.map((i: any) => i.id).join(',')
  uni.navigateTo({ url: `/pages/order/confirm?cartIds=${ids}` })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, #F9F9F9 0%, #F0EDE8 100%);
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.status-bar { width: 100%; }

.page-nav {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx $spacing-base;

  &__back,
  &__action {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
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

// ========== 商城分组 Tab ==========
.mall-group-tabs {
  display: flex;
  padding: 0 $spacing-base $spacing-base;
  gap: 12rpx;
}

.mall-group-tab {
  flex: 1;
  height: 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1rpx solid rgba(20, 20, 20, 0.06);
  border-radius: $radius-lg;
  position: relative;
  transition: all 0.25s ease;

  &.active {
    background: $warm-yellow;
    border-color: $border-primary;
    box-shadow: $shadow-gold;

    .mall-group-tab__label { color: $accent-dark; font-weight: 700; }
  }

  &__abbr {
    width: 36rpx;
    height: 36rpx;
    line-height: 36rpx;
    text-align: center;
    font-size: 20rpx;
    font-weight: 800;
    background: $bg-tertiary;
    border-radius: 50%;
    color: $mineral-gray;
  }

  &.active &__abbr {
    background: $accent-dark;
    color: $bronze-light;
  }

  &__label {
    font-size: 22rpx;
    font-weight: 500;
    color: $text-muted;
  }

  &__count {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
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

// ========== 购物车列表 ==========
.cart-scroll {
  height: calc(100vh - 400rpx);
  padding: 0 $spacing-base;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-base;
}

.sk-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: $spacing-base;
  background: rgba(255, 255, 255, 0.7);
  border-radius: $radius-lg;

  .sk-check {
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    background: $bg-tertiary;
    flex-shrink: 0;
  }

  .sk-img {
    width: 160rpx;
    height: 160rpx;
    border-radius: $radius-md;
    background: $bg-tertiary;
    flex-shrink: 0;
  }

  .sk-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  .sk-line {
    height: 24rpx;
    border-radius: 8rpx;
    background: $bg-tertiary;
    width: 70%;

    &.sk-short { width: 40%; }
  }
}

.shimmer { animation: shim 1.4s ease-in-out infinite; }

@keyframes shim {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.7; }
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: $spacing-base;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  box-shadow: $clay-shadow;
  transition: all 0.2s ease;

  &--selected {
    border-color: rgba(184, 152, 118, 0.25);
    box-shadow: 0 4rpx 20rpx rgba(184, 152, 118, 0.12);
  }

  &__check {
    flex-shrink: 0;
    padding: 8rpx;
    cursor: pointer;
  }

  &__img {
    width: 160rpx;
    height: 160rpx;
    border-radius: $radius-md;
    background: $bg-tertiary;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__name {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    line-height: 1.4;
  }

  &__price-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex-wrap: wrap;
  }

  &__cash {
    font-family: $asset-balance-font;
    font-size: 30rpx;
    font-weight: 700;
    color: $mineral-gray;
    font-variant-numeric: tabular-nums;
  }

  &__points {
    font-size: 24rpx;
    font-weight: 700;
    color: $accent-dark;
  }

  &__tag {
    font-size: 18rpx;
    font-weight: 600;
    padding: 4rpx 10rpx;
    border-radius: 999rpx;
    background: rgba(47, 53, 66, 0.06);
    color: $mineral-gray;
    border: 1rpx solid rgba(47, 53, 66, 0.1);

    &--gold {
      background: rgba(184, 152, 118, 0.10);
      color: $accent-dark;
      border-color: rgba(184, 152, 118, 0.30);
    }
  }

  &__stepper {
    display: flex;
    align-items: center;
    border: 1rpx solid rgba(47, 53, 66, 0.1);
    border-radius: $radius-md;
    width: fit-content;
    overflow: hidden;
  }

  &__del {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-muted;
    font-size: 36rpx;
    flex-shrink: 0;
  }
}

.stepper-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-tertiary;
  font-size: 28rpx;
  color: $mineral-gray;
  font-weight: 500;

  &:active { background: rgba(47, 53, 66, 0.1); }
}

.stepper-num {
  min-width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
  color: $mineral-gray;
  font-variant-numeric: tabular-nums;
  border-left: 1rpx solid rgba(47, 53, 66, 0.08);
  border-right: 1rpx solid rgba(47, 53, 66, 0.08);
  box-sizing: border-box;
}

.check-circle {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(47, 53, 66, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.5);

  &.is-selected {
    background: $accent-dark;
    border-color: $accent-dark;
  }

  .check-mark {
    font-size: 22rpx;
    color: #fff;
    font-weight: 700;
  }
}

// ========== 底部结算栏 ==========
.bottom-bar {
  position: fixed;
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx $spacing-base;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1rpx solid rgba(20, 20, 20, 0.06);
  box-shadow: 0 -8rpx 32rpx rgba(47, 53, 66, 0.06);

  &__select {
    display: flex;
    align-items: center;
    gap: 10rpx;
    flex-shrink: 0;
    cursor: pointer;
  }

  &__select-label {
    font-size: 26rpx;
    color: $text-secondary;
    font-weight: 500;
  }

  &__total {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4rpx;
  }

  &__btn {
    height: 80rpx;
    padding: 0 40rpx;
    background: $btn-gold-gradient;
    border-radius: $radius-full;
    box-shadow: $btn-gold-shadow;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    font-weight: 700;
    color: #fff;
    letter-spacing: 1rpx;
    flex-shrink: 0;
    transition: all 0.2s ease;

    &:active { transform: scale(0.97); }

    &.is-disabled {
      background: $btn-disabled-bg;
      color: $btn-disabled-text;
      box-shadow: none;
      pointer-events: none;
    }
  }
}

.total-label {
  font-size: 22rpx;
  color: $text-muted;
}

.total-amount {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
}

.total-cash {
  font-family: $asset-balance-font;
  font-size: 34rpx;
  font-weight: 700;
  color: $mineral-gray;
  font-variant-numeric: tabular-nums;
}

.total-points {
  font-size: 22rpx;
  color: $accent-dark;
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 40rpx;
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
    margin-bottom: 12rpx;
  }

  &__sub {
    font-size: 26rpx;
    color: $text-muted;
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
</style>
