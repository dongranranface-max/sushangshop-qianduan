<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">{{ modeLabel }}确认</text>
      <text class="nav-placeholder"></text>
    </view>

    <!-- 收货地址 -->
    <view class="address-section" @click="selectAddress">
      <view class="address-icon">址</view>
      <view class="address-info" v-if="address">
        <view class="address-top">
          <text class="address-name">{{ address.consignee }}</text>
          <text class="address-phone">{{ address.phone }}</text>
          <view class="address-tag" v-if="address.isDefault">默认</view>
        </view>
        <text class="address-detail">{{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}</text>
      </view>
      <view class="address-empty" v-else>
        <text>请选择收货地址</text>
      </view>
      <text class="address-arrow">›</text>
    </view>

    <!-- 商品信息 -->
    <view class="order-items">
      <view class="order-item" v-for="item in orderItems" :key="item.productId">
        <image class="item-image" :src="item.coverImage" mode="aspectFill" />
        <view class="item-info">
          <text class="item-name">{{ item.productName }}</text>
          <view class="item-tags">
            <text class="tag tag-purple" v-if="mode === 'exchange'">换购</text>
            <text class="tag tag-green" v-if="mode === 'redeem'">兑换</text>
            <text class="tag tag-gold" v-if="mode === 'consume'">消费</text>
          </view>
          <view class="item-bottom">
            <text class="item-price">
              <text v-if="mode === 'redeem'">{{ item.requiredPoints }}积分</text>
              <text v-else>¥{{ item.price }}</text>
            </text>
            <text class="item-quantity">×{{ item.quantity }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ===== 消费商城订单信息 ===== -->
    <view class="order-info-section" v-if="mode === 'consume'">
      <view class="info-row">
        <text class="info-label">商品金额</text>
        <text class="info-value">¥{{ goodsAmount }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">运费</text>
        <text class="info-value info-free">免运费</text>
      </view>
      <view class="info-row">
        <text class="info-label">预计可得积分</text>
        <text class="info-value info-points">+{{ estimatedEcoPoints }} 积分</text>
      </view>
    </view>

    <!-- ===== 换购商城订单信息 ===== -->
    <view class="order-info-section" v-if="mode === 'exchange'">
      <view class="info-row">
        <text class="info-label">商品金额</text>
        <text class="info-value">¥{{ goodsAmount }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">运费</text>
        <text class="info-value info-free">免运费</text>
      </view>
      <view class="info-row">
        <text class="info-label">生态积分抵扣</text>
        <text class="info-value info-points">-{{ exchangePointsDisplay }} 积分</text>
      </view>
      <view class="info-row">
        <text class="info-label">实付金额</text>
        <text class="info-value info-primary">¥{{ exchangeCashPay }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">积分说明</text>
        <text class="info-value info-muted">支付后30%转消费积分</text>
      </view>
    </view>

    <!-- ===== 兑换商城订单信息 ===== -->
    <view class="order-info-section" v-if="mode === 'redeem'">
      <view class="info-row">
        <text class="info-label">兑换积分</text>
        <text class="info-value info-points">{{ totalRequiredPoints }}积分</text>
      </view>
      <view class="info-row">
        <text class="info-label">运费</text>
        <text class="info-value info-free">免运费</text>
      </view>
      <view class="info-row">
        <text class="info-label">我的消费积分</text>
        <text class="info-value" :class="{ 'info-danger': consumerPoints < totalRequiredPoints }">
          {{ consumerPoints }}积分
          <text v-if="consumerPoints < totalRequiredPoints" class="insufficient">（不足）</text>
        </text>
      </view>
    </view>

    <!-- ===== 支付方式（消费+换购需要） ===== -->
    <view class="payment-section" v-if="mode === 'consume' || mode === 'exchange'">
      <view class="section-title">支付方式</view>
      <view class="payment-list">
        <view class="payment-item" :class="{ active: paymentMethod === 'wechat' }" @click="paymentMethod = 'wechat'">
          <text class="payment-icon pay-wechat">微</text>
          <text class="payment-name">微信支付</text>
          <text :class="paymentMethod === 'wechat' ? 'radio-checked' : 'radio'">✓</text>
        </view>
        <view class="payment-item" :class="{ active: paymentMethod === 'alipay' }" @click="paymentMethod = 'alipay'">
          <text class="payment-icon pay-alipay">支</text>
          <text class="payment-name">支付宝</text>
          <text :class="paymentMethod === 'alipay' ? 'radio-checked' : 'radio'">✓</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="total-info">
        <text class="total-label">{{ mode === 'redeem' ? '合计' : '实付' }}：</text>
        <text class="total-price">
          <text v-if="mode === 'redeem'">{{ totalRequiredPoints }}积分</text>
          <text v-else-if="mode === 'exchange'">¥{{ exchangeCashPay }}</text>
          <text v-else>¥{{ goodsAmount }}</text>
        </text>
      </view>
      <view class="submit-btn" :class="{ loading: submitting, 'btn-redeem': mode === 'redeem' }" @click="submitOrder">
        <text>{{ submitting ? '提交中...' : '提交订单' }}</text>
      </view>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { orderApi, addressApi, walletApi, productApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const mode = ref<'consume' | 'exchange' | 'redeem'>('consume')
const submitting = ref(false)
const paymentMethod = ref('wechat')

const productId = ref('')
const product = ref<any>(null)
const orderItems = ref<any[]>([])
const address = ref<any>(null)
const ecoPointsData = ref<any>(null)
const consumerPoints = ref(0)

const modeLabel = computed(() => ({
  consume: '消费',
  exchange: '换购',
  redeem: '兑换',
}[mode.value]))

const goodsAmount = computed(() =>
  orderItems.value.reduce((s, i) => s + Number(i.price) * i.quantity, 0).toFixed(2)
)

// 消费商城：预估可得积分（1元 = 1积分）
const estimatedEcoPoints = computed(() =>
  Math.floor(Number(goodsAmount.value))
)

// 换购商城：积分抵扣 = 商品金额 × 40%（1元 = 1积分）
const exchangePoints = computed(() => Math.floor(Number(goodsAmount.value) * 0.4))
const exchangePointsDisplay = computed(() =>
  Math.min(exchangePoints.value, Number(ecoPointsData.value?.ecoPoints || 0))
)
// 换购商城：实付现金 = 商品金额 - 积分抵扣
const exchangeCashPay = computed(() =>
  Math.max(0, Number(goodsAmount.value) - exchangePoints.value).toFixed(2)
)

const totalRequiredPoints = computed(() =>
  orderItems.value.reduce((s, i) => s + Number(i.requiredPoints || 0) * i.quantity, 0)
)

const availableEcoPoints = computed(() => Number(ecoPointsData.value?.ecoPoints || 0))

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const opts = (current as any).options || {}
  productId.value = opts.productId || ''
  mode.value = opts.mode === 'redeem' ? 'redeem' : opts.mode === 'exchange' ? 'exchange' : 'consume'

  if (!requireAuth()) return
  loadData()
})

async function loadData() {
  try {
    const addrs = await addressApi.list()
    address.value = addrs?.find((a: any) => a.isDefault) || addrs?.[0] || null

    if (productId.value) {
      product.value = await productApi.getDetail(productId.value)
      const coverImg = (product.value.coverImages || [])[0] || product.value.coverImage || ''
      const item = {
        productId: product.value.id,
        productName: product.value.name,
        coverImage: coverImg,
        price: product.value.price,
        quantity: 1,
        requiredPoints: product.value.requiredPoints || 0,
      }
      orderItems.value = [item]
    }

    const bal = await walletApi.getBalance()
    ecoPointsData.value = bal
    consumerPoints.value = Number(bal.consumerPoints || 0)
  } catch (e: any) {
    uni.showToast({ title: `加载失败: ${e.message}`, icon: 'none' })
  }
}

function goBack() { uni.navigateBack() }

function selectAddress() {
  uni.navigateTo({ url: '/pages/address/list?mode=select' })
}

async function submitOrder() {
  if (submitting.value) return
  if (!address.value) {
    return uni.showToast({ title: '请选择收货地址', icon: 'none' })
  }
  if (mode.value === 'redeem' && consumerPoints.value < totalRequiredPoints.value) {
    return uni.showToast({ title: '消费积分不足', icon: 'none' })
  }

  submitting.value = true
  uni.showLoading({ title: '提交中...' })

  try {
    // 构建订单项
    const items = orderItems.value.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      coverImage: i.coverImage,
      price: Number(i.price),
      quantity: i.quantity,
      ...(mode.value === 'redeem' && i.requiredPoints
        ? { requiredPoints: String(i.requiredPoints) }
        : {}),
      ...(mode.value === 'exchange'
        ? { ecoPointsAmount: String(exchangePoints.value) }
        : {}),
    }))

    const res = await orderApi.create({
      orderType: mode.value === 'redeem' ? 3 : mode.value === 'exchange' ? 2 : 1,
      addressId: address.value.id,
      items,
    })

    uni.hideLoading()

    if (mode.value === 'redeem') {
      // 兑换订单：立即完成
      uni.showToast({ title: '兑换成功', icon: 'success' })
      setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 1500)
    } else {
      // 消费/换购订单：模拟支付（实际生产应调起微信/支付宝）
      uni.showLoading({ title: '支付中...' })
      await new Promise(r => setTimeout(r, 1500))
      await orderApi.paymentCallback(res.orderNo, paymentMethod.value)
      uni.hideLoading()
      uni.showToast({ title: '支付成功', icon: 'success' })
      setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 1500)
    }
  } catch (e: any) {
    uni.hideLoading()
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.page-container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0 var(--spacing-lg);
  padding-bottom: 140rpx;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  .nav-back { font-size: 40rpx; color: $text-primary; }
  .nav-title { font-size: 34rpx; font-weight: 600; color: $text-primary; }
  .nav-placeholder { width: 60rpx; }
}

.address-section {
  display: flex;
  align-items: center;
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-base);
  .address-icon { font-size: 48rpx; margin-right: var(--spacing-base); }
  .address-info { flex: 1;
    .address-top { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: 8rpx;
      .address-name { font-size: 30rpx; font-weight: 600; color: var(--text-primary); }
      .address-phone { font-size: 28rpx; color: var(--text-secondary); }
      .address-tag { padding: 4rpx 12rpx; background: var(--primary); color: #fff; font-size: 20rpx; border-radius: 6rpx; }
    }
    .address-detail { font-size: 26rpx; color: var(--text-secondary); }
  }
  .address-empty { flex: 1; text-align: center; font-size: 28rpx; color: var(--text-muted); }
  .address-arrow { font-size: 36rpx; color: var(--text-muted); }
}

.order-items { margin-bottom: var(--spacing-base);
  .order-item {
    display: flex;
    background: var(--bg-card);
    border-radius: $radius-md;
    padding: var(--spacing-base);
    margin-bottom: var(--spacing-sm);
    border: 1rpx solid var(--border-color);
    .item-image { width: 160rpx; height: 160rpx; border-radius: $radius-sm; flex-shrink: 0; }
    .item-info { flex: 1; margin-left: var(--spacing-base); display: flex; flex-direction: column;
      .item-name { font-size: 28rpx; color: var(--text-primary); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; margin-bottom: var(--spacing-xs); }
      .item-tags { margin-bottom: var(--spacing-sm);
        .tag { font-size: 18rpx; padding: 2rpx 12rpx; border-radius: 6rpx; margin-right: var(--spacing-xs); }
        .tag-purple { background: $warm-blue; color: $navy; }
        .tag-green { background: $warm-yellow; color: $accent-dark; }
        .tag-gold { background: rgba(255,215,0,0.15); color: $gold; }
      }
      .item-bottom { display: flex; align-items: center; justify-content: space-between;
        .item-price { font-size: 30rpx; font-weight: 700; color: var(--primary); }
        .item-quantity { font-size: 26rpx; color: var(--text-secondary); }
      }
    }
  }
}

.order-info-section {
  background: var(--bg-card);
  border-radius: $radius-md;
  padding: var(--spacing-base);
  margin-bottom: var(--spacing-base);
  border: 1rpx solid var(--border-color);
  .info-row { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-sm) 0;
    .info-label { font-size: 28rpx; color: var(--text-secondary); }
    .info-value { font-size: 28rpx; color: var(--text-primary);
      &.info-free { color: $success; }
      &.info-points { color: $gold; font-weight: 600; }
      &.info-primary { color: var(--primary); font-weight: 700; }
      &.info-muted { font-size: 24rpx; color: var(--text-muted); }
      &.info-danger { color: var(--danger); }
    }
    .insufficient { font-size: 22rpx; }
  }
}

.payment-section { margin-bottom: var(--spacing-base);
  .section-title { font-size: 30rpx; font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-base); }
  .payment-list {
    .payment-item { display: flex; align-items: center; background: var(--bg-card); border-radius: $radius-md; padding: var(--spacing-base); margin-bottom: var(--spacing-sm); border: 2rpx solid transparent;
      &.active { border-color: var(--primary); }
      .payment-icon { width: 64rpx; height: 64rpx; line-height: 64rpx; text-align: center; border-radius: 12rpx; font-size: 28rpx; font-weight: 700; margin-right: var(--spacing-base);
        &.pay-wechat { background: #07C160; color: #fff; }
        &.pay-alipay { background: #1677FF; color: #fff; }
      }
      .payment-name { flex: 1; font-size: 28rpx; color: var(--text-primary); }
      .radio, .radio-checked { width: 40rpx; height: 40rpx; border: 2rpx solid var(--border-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24rpx; color: transparent; }
      .radio-checked { background: var(--primary); border-color: var(--primary); color: #fff; }
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: var(--bg-overlay);
  backdrop-filter: blur(20px);
  border-top: 1rpx solid var(--border-color);
  box-shadow: 0 -8rpx 32rpx rgba(26, 36, 56, 0.06);
  .total-info {
    .total-label { font-size: 26rpx; color: var(--text-secondary); }
    .total-price { font-size: 44rpx; font-weight: 800; @include ai-jelly-text; margin-left: var(--spacing-xs); }
  }
  .submit-btn { background: var(--accent-fire); color: #fff; padding: 24rpx 64rpx; border-radius: 50rpx; font-size: 32rpx; font-weight: 700; box-shadow: var(--shadow-fire);
    &.loading { opacity: 0.6; }
    &.btn-redeem { background: $gold-gradient; color: $navy; }
  }
}
</style>
