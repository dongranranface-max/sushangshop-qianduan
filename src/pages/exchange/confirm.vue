<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="page-header">
      <text class="back" @click="goBack">&lt;</text>
      <text class="page-title">确认换购</text>
    </view>

    <view v-if="product" class="confirm-body">
      <!-- 商品信息 -->
      <view class="product-card">
        <image class="cover" :src="product.coverImages?.[0]" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ product.name }}</text>
          <view class="price-row">
            <text class="cash-price">¥{{ product.cashPrice }}</text>
            <text class="points-price">+ {{ product.pointsPrice }}积分</text>
          </view>
        </view>
      </view>

      <!-- 银行卡信息 -->
      <view class="section bank-section">
        <view class="section-title">结算账户</view>
        <view v-if="bankCard" class="bank-card">
          <text class="bank-name">{{ bankCard.bankName }}</text>
          <text class="card-no">{{ maskCard(bankCard.bankCard) }}</text>
          <text class="bind-tip">已绑定</text>
        </view>
        <view v-else class="no-bank" @click="goBindCard">
          <text>请先绑定银行卡</text>
          <text class="arrow">&gt;</text>
        </view>
      </view>

      <!-- 收货地址 -->
      <view class="section address-section" @click="goSelectAddress">
        <view class="section-title">收货地址</view>
        <view v-if="address" class="address-info">
          <text class="consignee">{{ address.consignee }} {{ address.phone }}</text>
          <text class="addr-text">{{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail }}</text>
        </view>
        <view v-else class="no-address">
          <text>请选择收货地址</text>
          <text class="arrow">&gt;</text>
        </view>
      </view>

      <!-- 积分使用说明 -->
      <view class="section points-info">
        <view class="section-title">积分说明</view>
        <view class="points-rules">
          <view class="rule-item">
            <text class="rule-icon">提</text>
            <text class="rule-text">使用 {{ product.pointsPrice }} 生态积分抵扣 {{ product.pointsPrice }} 元现金</text>
          </view>
          <view class="rule-item">
            <text class="rule-icon">付</text>
            <text class="rule-text">实际支付：¥{{ product.cashPrice }} 现金 + {{ product.pointsPrice }} 积分</text>
          </view>
          <view class="rule-item">
            <text class="rule-icon">赠</text>
            <text class="rule-text">换购成功后，支付金额的 30% 将转为消费积分</text>
          </view>
        </view>
      </view>

      <!-- 支付方式 -->
      <view class="section pay-way">
        <view class="section-title">支付方式</view>
        <radio-group @change="payMethodChange">
          <label class="pay-option">
            <view class="pay-left">
              <text class="pay-icon">微</text>
              <text>微信支付</text>
            </view>
            <radio value="wechat" checked="true" color="#C4A574" />
          </label>
          <label class="pay-option">
            <view class="pay-left">
              <text class="pay-icon">付</text>
              <text>支付宝</text>
            </view>
            <radio value="alipay" color="#C4A574" />
          </label>
        </radio-group>
      </view>

      <view class="safe-area-bottom"></view>
    </view>

    <!-- 底部提交栏 -->
    <view v-if="product" class="submit-bar">
      <view class="submit-info">
        <text class="submit-label">合计：</text>
        <text class="submit-cash">¥{{ product.cashPrice }}</text>
        <text class="submit-points">+ {{ product.pointsPrice }}积分</text>
      </view>
      <view :class="['submit-btn', { disabled: !canSubmit }]" @click="doSubmit">
        确认换购
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { productApi, userApi, addressApi, orderApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const productId = ref('')
const product = ref<any>(null)
const bankCard = ref<any>(null)
const address = ref<any>(null)
const payMethod = ref('wechat')
const loading = ref(false)
const submitting = ref(false)

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  if (!requireAuth()) return

  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const opts = (current as any).options || {}
  productId.value = opts.productId || ''

  if (productId.value) loadData()
})

async function loadData() {
  loading.value = true
  try {
    const [prodRes, profileRes] = await Promise.all([
      productApi.getDetail(productId.value),
      userApi.getProfile(),
    ])
    product.value = prodRes
    if (profileRes.bankCard) {
      bankCard.value = profileRes.bankCard
    }

    // 优先读 storage 中的选中地址
    const savedAddr = uni.getStorageSync('selectedAddress')
    if (savedAddr) {
      try { address.value = JSON.parse(savedAddr) } catch {}
    }
    if (!address.value) {
      try {
        const defaultAddr = await addressApi.getDefault()
        address.value = defaultAddr
      } catch {}
    }
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

const canSubmit = computed(() => !!bankCard.value && !!address.value && !submitting.value)

function goBack() { uni.navigateBack() }

function goBindCard() {
  uni.navigateTo({ url: '/pages/user/bank-card' })
}

function goSelectAddress() {
  uni.navigateTo({ url: '/pages/address/list?mode=select' })
}

function payMethodChange(e: any) {
  payMethod.value = e.detail.value
}

function maskCard(no: string) {
  if (!no || no.length < 8) return no
  return no.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2')
}

async function doSubmit() {
  if (!canSubmit.value) {
    if (!bankCard.value) {
      uni.showToast({ title: '请先绑定银行卡', icon: 'none' })
      return
    }
    if (!address.value) {
      uni.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }
    return
  }

  if (!canSubmit.value) {
    if (!bankCard.value) {
      uni.showToast({ title: '请先绑定银行卡', icon: 'none' }); return
    }
    if (!address.value) {
      uni.showToast({ title: '请选择收货地址', icon: 'none' }); return
    }
    return
  }

  uni.showLoading({ title: '提交中...' })
  submitting.value = true
  try {
    await orderApi.create({
      orderType: 2,
      addressId: address.value.id,
      items: [{ productId: productId.value, quantity: 1 }],
    })
    uni.showToast({ title: '换购成功', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/order/list' })
    }, 1500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    uni.hideLoading()
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
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base) var(--spacing-lg);
  background: var(--bg-card);
  border-bottom: 1rpx solid var(--border-color);

  .back { font-size: 40rpx; color: var(--text-primary); }
  .page-title { font-size: 36rpx; font-weight: 700; color: var(--text-primary); }
}

.confirm-body {
  flex: 1;
  padding: 0 var(--spacing-lg);
  padding-bottom: 160rpx;
}

.product-card {
  display: flex;
  gap: var(--spacing-base);
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  padding: var(--spacing-base);
  margin: var(--spacing-base) 0;

  .cover {
    width: 180rpx;
    height: 180rpx;
    border-radius: $radius-sm;
    background: var(--bg-secondary);
  }

  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .name {
      font-size: 28rpx;
      color: var(--text-primary);
      display: block;
    }

    .price-row {
      display: flex;
      align-items: baseline;
      gap: var(--spacing-base);
      margin-top: 8rpx;

      .cash-price {
        font-size: 36rpx;
        font-weight: 700;
        color: var(--danger);
      }

      .points-price {
        font-size: 26rpx;
        color: var(--primary);
      }
    }
  }
}

.section {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--spacing-base) var(--spacing-lg);
  margin-bottom: var(--spacing-base);
  border: 1rpx solid var(--border-color);

  .section-title {
    font-size: 26rpx;
    color: var(--text-secondary);
    display: block;
    margin-bottom: var(--spacing-sm);
  }
}

.bank-section {
  .bank-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);

    .bank-name { font-size: 30rpx; font-weight: 600; color: var(--text-primary); }
    .card-no { font-size: 26rpx; color: var(--text-secondary); flex: 1; }
    .bind-tip { font-size: 22rpx; color: var(--profit); }
  }

  .no-bank, .no-address {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    color: var(--text-muted);
    font-size: 28rpx;

    .arrow { color: var(--text-muted); }
  }
}

.address-section {
  .address-info {
    .consignee { font-size: 28rpx; font-weight: 600; color: var(--text-primary); }
    .addr-text { font-size: 24rpx; color: var(--text-secondary); display: block; margin-top: 4rpx; }
  }
}

.points-info {
  .points-rules {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .rule-item {
    display: flex;
    align-items: flex-start;
    gap: 8rpx;

    .rule-icon { font-size: 24rpx; }
    .rule-text { font-size: 24rpx; color: var(--text-secondary); line-height: 1.6; }
  }
}

.pay-way {
  .pay-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;

    .pay-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);

      .pay-icon { font-size: 32rpx; }
      text { font-size: 28rpx; color: var(--text-primary); }
    }
  }
}

.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-card);
  border-top: 1rpx solid var(--border-color);
  display: flex;
  align-items: center;
  padding: var(--spacing-base) var(--spacing-lg);
  padding-bottom: calc(#{var(--spacing-base)} + constant(safe-area-inset-bottom));
  padding-bottom: calc(#{var(--spacing-base)} + env(safe-area-inset-bottom));

  .submit-info {
    flex: 1;
    display: flex;
    align-items: baseline;

    .submit-label { font-size: 24rpx; color: var(--text-secondary); }
    .submit-cash { font-size: 36rpx; font-weight: 700; color: var(--danger); }
    .submit-points { font-size: 24rpx; color: var(--primary); margin-left: 8rpx; }
  }

  .submit-btn {
    background: $accent-fire;
    color: $text-inverse;
    font-size: 28rpx;
    font-weight: 700;
    padding: 16rpx 48rpx;
    border-radius: 50rpx;
    box-shadow: $shadow-glow;

    &.disabled { background: $bg-tertiary; color: $text-muted; box-shadow: none; }
  }
}
</style>
