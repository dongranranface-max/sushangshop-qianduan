<template>
  <view class="page-container">
    <!-- 顶部沉浸式资产状态栏（已登录用户） -->
    <AssetStatusBar v-if="loggedIn" />
    <view v-else class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">购物车</text>
      <text class="edit-btn" @click="isEditMode = !isEditMode">
        {{ isEditMode ? '完成' : '编辑' }}
      </text>
    </view>
    
    <!-- 购物车为空 -->
    <view class="empty-cart" v-if="cartItems.length === 0">
      <view class="empty-icon"><text>购</text></view>
      <text class="empty-text">购物车是空的</text>
      <text class="empty-hint">快去挑选心仪的商品吧</text>
      <view class="empty-btn" @click="goShop">去逛逛</view>
    </view>
    
    <!-- 购物车列表 -->
    <view class="cart-list" v-else>
      <!-- 消费商城商品 -->
      <view class="cart-group" v-if="consumeItems.length > 0">
        <view class="group-header">
          <view class="group-select" @click="toggleSelectAll('consume')">
            <text :class="isAllSelected('consume') ? 'checkbox-checked' : 'checkbox'">✓</text>
          </view>
          <text class="group-title">消费商城</text>
        </view>
        <view 
          class="cart-item" 
          v-for="item in consumeItems" 
          :key="item.id"
        >
          <view class="item-select" @click="toggleSelect(item.id)">
            <text :class="item.selected ? 'checkbox-checked' : 'checkbox'">✓</text>
          </view>
          <image class="item-image" :src="item.image" mode="aspectFill" @click="goProduct(item.id)" />
          <view class="item-info">
            <text class="item-name" @click="goProduct(item.id)">{{ item.name }}</text>
            <view class="item-tags">
              <text v-if="item.mallType === 'flash'" class="tag tag-green">限时</text>
            </view>
            <view class="item-bottom">
              <text class="item-price">¥{{ item.price }}</text>
              <view class="item-stepper">
                <view class="stepper-btn" @click="changeQuantity(item, -1)">-</view>
                <text class="stepper-value">{{ item.quantity }}</text>
                <view class="stepper-btn" @click="changeQuantity(item, 1)">+</view>
              </view>
            </view>
          </view>
          <view class="item-delete" @click="deleteItem(item.id)" v-if="isEditMode">×</view>
        </view>
      </view>
      
      <!-- 换购商城商品 -->
      <view class="cart-group" v-if="exchangeItems.length > 0">
        <view class="group-header">
          <view class="group-select" @click="toggleSelectAll('exchange')">
            <text :class="isAllSelected('exchange') ? 'checkbox-checked' : 'checkbox'">✓</text>
          </view>
          <text class="group-title">🔄 换购商城</text>
        </view>
        <view 
          class="cart-item" 
          v-for="item in exchangeItems" 
          :key="item.id"
        >
          <view class="item-select" @click="toggleSelect(item.id)">
            <text :class="item.selected ? 'checkbox-checked' : 'checkbox'">✓</text>
          </view>
          <image class="item-image" :src="item.image" mode="aspectFill" />
          <view class="item-info">
            <text class="item-name">{{ item.name }}</text>
            <view class="item-tags">
              <text class="tag tag-purple">换购</text>
            </view>
            <view class="item-bottom">
              <view class="item-price-row">
                <text class="item-price">¥{{ item.price }}</text>
                <text class="item-points">+{{ item.points }}积分</text>
              </view>
              <view class="item-stepper">
                <view class="stepper-btn" @click="changeQuantity(item, -1)">-</view>
                <text class="stepper-value">{{ item.quantity }}</text>
                <view class="stepper-btn" @click="changeQuantity(item, 1)">+</view>
              </view>
            </view>
          </view>
          <view class="item-delete" @click="deleteItem(item.id)" v-if="isEditMode">×</view>
        </view>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="cartItems.length > 0">
      <!-- 混合结算公式 -->
      <view class="settlement-formula" v-if="selectedCount > 0">
        <text class="formula-label">混合结算</text>
        <text class="formula-value">{{ totalCashDisplay }}元现金 + {{ totalPointsDisplay }}积分</text>
      </view>
      <view class="bottom-inner">
        <view class="select-all" @click="toggleSelectAll('all')">
          <text :class="isAllSelected('all') ? 'checkbox-checked' : 'checkbox'">✓</text>
          <text class="select-label">全选</text>
        </view>
        <view class="total-info">
          <view class="total-row">
            <text class="total-label">合计:</text>
            <text class="total-price">¥{{ totalPrice }}</text>
          </view>
          <view class="points-row" v-if="totalPoints > 0">
            <text class="points-label">+{{ totalPoints }}积分</text>
          </view>
        </view>
        <view class="submit-btn" @click="goCheckout">
          <text>结算({{ selectedCount }})</text>
        </view>
        <view class="delete-btn" @click="deleteSelected" v-if="isEditMode">
          <text>删除</text>
        </view>
      </view>
    </view>
    
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { checkAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'
import AssetStatusBar from '@/components/AssetStatusBar.vue'

const statusBarHeight = ref(20)
const loggedIn = ref(checkAuth())
const isEditMode = ref(false)

onShow(() => {
  loggedIn.value = checkAuth()
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  if (loggedIn.value) assetStore.fetchBalance()
})

interface CartItem {
  id: number
  name: string
  price: number
  points: number
  quantity: number
  image: string
  selected: boolean
  mall: 'consume' | 'exchange' | 'redeem'
  mallType?: 'flash'
}

const cartItems = ref<CartItem[]>([
  { id: 1, name: 'iPhone 15 Pro Max 256GB 深空黑', price: 9999, points: 500, quantity: 1, image: 'https://picsum.photos/200/200?random=110', selected: false, mall: 'consume' },
  { id: 2, name: 'AirPods Pro 2 代 MagSafe充电盒', price: 1899, points: 95, quantity: 2, image: 'https://picsum.photos/200/200?random=111', selected: false, mall: 'consume' },
  { id: 3, name: '戴森吹风机 HD15 紫红色', price: 2999, points: 150, quantity: 1, image: 'https://picsum.photos/200/200?random=112', selected: false, mall: 'exchange' },
  { id: 4, name: '小米手环 8 Pro 石墨黑', price: 399, points: 20, quantity: 1, image: 'https://picsum.photos/200/200?random=113', selected: false, mall: 'consume', mallType: 'flash' }
])

const consumeItems = computed(() => cartItems.value.filter(i => i.mall === 'consume'))
const exchangeItems = computed(() => cartItems.value.filter(i => i.mall === 'exchange'))
const redeemItems = computed(() => cartItems.value.filter(i => i.mall === 'redeem'))

const totalPrice = computed(() => {
  return cartItems.value
    .filter(i => i.selected)
    .reduce((sum, i) => sum + i.price * i.quantity, 0)
    .toFixed(2)
})

const totalCashDisplay = computed(() => {
  return cartItems.value
    .filter(i => i.selected)
    .reduce((sum, i) => sum + i.price * i.quantity, 0)
    .toFixed(2)
})

const totalPointsDisplay = computed(() => {
  return cartItems.value
    .filter(i => i.selected && i.mall === 'consume')
    .reduce((sum, i) => sum + i.points * i.quantity, 0)
})

const totalPoints = computed(() => {
  return cartItems.value
    .filter(i => i.selected && i.mall === 'consume')
    .reduce((sum, i) => sum + i.points * i.quantity, 0)
})

const selectedCount = computed(() => cartItems.value.filter(i => i.selected).length)

function toggleSelect(id: number) {
  const item = cartItems.value.find(i => i.id === id)
  if (item) item.selected = !item.selected
}

function isAllSelected(type: 'consume' | 'exchange' | 'all') {
  if (type === 'all') {
    return cartItems.value.length > 0 && cartItems.value.every(i => i.selected)
  }
  const items = type === 'consume' ? consumeItems.value : exchangeItems.value
  return items.length > 0 && items.every(i => i.selected)
}

function toggleSelectAll(type: 'consume' | 'exchange' | 'all') {
  const items = type === 'all' 
    ? cartItems.value 
    : type === 'consume' 
      ? consumeItems.value 
      : exchangeItems.value
  
  const allSelected = items.every(i => i.selected)
  items.forEach(i => i.selected = !allSelected)
}

function changeQuantity(item: CartItem, delta: number) {
  const newQty = item.quantity + delta
  if (newQty < 1) {
    deleteItem(item.id)
    return
  }
  item.quantity = newQty
}

function deleteItem(id: number) {
  uni.showModal({
    title: '提示',
    content: '确定要删除这件商品吗？',
    success: (res) => {
      if (res.confirm) {
        const index = cartItems.value.findIndex(i => i.id === id)
        if (index > -1) cartItems.value.splice(index, 1)
      }
    }
  })
}

function deleteSelected() {
  const selectedIds = cartItems.value.filter(i => i.selected).map(i => i.id)
  if (selectedIds.length === 0) {
    uni.showToast({ title: '请先选择商品', icon: 'none' })
    return
  }
  
  uni.showModal({
    title: '提示',
    content: `确定要删除选中的 ${selectedIds.length} 件商品吗？`,
    success: (res) => {
      if (res.confirm) {
        cartItems.value = cartItems.value.filter(i => !i.selected)
      }
    }
  })
}

function goShop() {
  uni.switchTab({ url: '/pages/buy/index' })
}

function goProduct(id: number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

function goCheckout() {
  if (selectedCount.value === 0) {
    uni.showToast({ title: '请先选择商品', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/pages/order/confirm' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.page-container {
  @include tab-page-shell;
}

.page-header {
  @include page-header-bar;

  .edit-btn {
    font-size: var(--font-body);
    color: $text-accent;
  }
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl 0;
  
  .empty-icon {
    width: 120rpx;
    height: 120rpx;
    line-height: 120rpx;
    text-align: center;
    font-size: 48rpx;
    font-weight: var(--weight-heavy);
    color: $navy;
    background: $warm-yellow;
    border-radius: 50%;
    border: 1rpx solid $border-primary;
    margin-bottom: $spacing-lg;
  }

  .empty-text {
    @include type-page-title;
    margin-bottom: $spacing-sm;
  }

  .empty-hint {
    @include type-body;
    color: $text-secondary;
    margin-bottom: $spacing-xl;
  }

  .empty-btn {
    padding: 20rpx 64rpx;
    background: $navy;
    border-radius: $radius-full;
    font-size: var(--font-card-title);
    color: $text-inverse;
  }
}

.cart-list {
  .cart-group {
    margin-bottom: $spacing-xl;

    .group-header {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      padding: $spacing-base 0;

      .group-title {
        @include type-card-title;
      }
    }

    .cart-item {
      display: flex;
      align-items: center;
      @include premium-surface($bg-secondary);
      border-radius: $radius-md;
      padding: $spacing-base;
      margin-bottom: $spacing-sm;
      position: relative;

      .item-select, .group-select {
        margin-right: $spacing-sm;

        .checkbox, .checkbox-checked {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40rpx;
          height: 40rpx;
          border: 2rpx solid $border-color;
          border-radius: 50%;
          font-size: var(--font-body);
          color: transparent;
        }

        .checkbox-checked {
          background: $navy;
          border-color: $navy;
          color: $text-inverse;
        }
      }

      .item-image {
        width: 180rpx;
        height: 180rpx;
        border-radius: $radius-sm;
        flex-shrink: 0;
      }

      .item-info {
        flex: 1;
        margin-left: $spacing-base;
        display: flex;
        flex-direction: column;

        .item-name {
          @include type-card-title;
          @include line-clamp(2);
          margin-bottom: $spacing-xs;
        }

        .item-tags {
          margin-bottom: $spacing-sm;
          
          .tag {
            font-size: 18rpx;
            padding: 2rpx 12rpx;
            border-radius: 6rpx;
          }
        }
        
        .item-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          
          .item-price-row {
            display: flex;
            align-items: baseline;
            gap: $spacing-sm;
          }

          .item-price {
            font-size: var(--font-page-title);
            font-weight: var(--weight-heavy);
            color: $text-primary;
          }

          .item-points {
            @include type-caption;
            color: $gold;
          }

          .item-stepper {
            display: flex;
            align-items: center;

            .stepper-btn {
              width: 48rpx;
              height: 48rpx;
              display: flex;
              align-items: center;
              justify-content: center;
              background: $bg-tertiary;
              border-radius: $radius-sm;
              font-size: var(--font-card-title);
              color: $text-primary;
            }

            .stepper-value {
              font-size: var(--font-card-title);
              color: $text-primary;
              min-width: 60rpx;
              text-align: center;
            }
          }
        }
      }

      .item-delete {
        position: absolute;
        top: $spacing-sm;
        right: $spacing-sm;
        width: 40rpx;
        height: 40rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba($danger, 0.12);
        border-radius: 50%;
        font-size: var(--font-card-title);
        color: $danger;
      }
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(20px);
  border-top: 1rpx solid $border-light;
  box-shadow: 0 -8rpx 32rpx rgba(26, 36, 56, 0.06);
  
  .select-all {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    .select-label {
      @include type-body;
    }

    .checkbox, .checkbox-checked {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40rpx;
      height: 40rpx;
      border: 2rpx solid $border-color;
      border-radius: 50%;
      font-size: var(--font-body);
      color: transparent;
    }

    .checkbox-checked {
      background: $navy;
      border-color: $navy;
      color: $text-inverse;
    }
  }

  .total-info {
    flex: 1;
    margin: 0 $spacing-base;
    text-align: right;

    .total-row {
      display: flex;
      align-items: baseline;
      justify-content: flex-end;
      gap: $spacing-xs;

      .total-label {
        @include type-body;
        color: $text-secondary;
      }

      .total-price {
        font-size: 36rpx;
        font-weight: var(--weight-heavy);
        color: $text-primary;
      }
    }

    .points-row {
      .points-label {
        @include type-caption;
        color: $gold;
      }
    }
  }

  .submit-btn {
    background: $navy;
    color: $text-inverse;
    padding: 20rpx 48rpx;
    border-radius: $radius-full;
    font-size: var(--font-card-title);
    font-weight: var(--weight-bold);
    box-shadow: $shadow-fire;
  }

  .delete-btn {
    background: $danger;
    color: $text-inverse;
    padding: 20rpx 32rpx;
    border-radius: $radius-full;
    font-size: var(--font-card-title);
    margin-left: $spacing-sm;
  }
}

.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}
</style>
