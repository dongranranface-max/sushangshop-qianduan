<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="page-header">
      <text class="page-title">申购理财</text>
    </view>

    <view v-if="!product" class="loading">加载中...</view>

    <view v-else class="invest-detail">
      <view class="product-header">
        <text class="product-icon">{{ product.icon }}</text>
        <view class="product-info">
          <text class="product-name">{{ product.name }}</text>
          <text class="product-type">{{ product.type }}</text>
        </view>
      </view>

      <view class="yield-card">
        <view class="yield-main">
          <text class="yield-value">{{ product.annualRate }}%</text>
          <text class="yield-label">年化收益率</text>
        </view>
        <view class="yield-stats">
          <view class="stat-item">
            <text class="stat-val">{{ product.cycleDays }}天</text>
            <text class="stat-lbl">投资周期</text>
          </view>
          <view class="stat-item">
            <text class="stat-val">{{ Number(product.minAmount).toLocaleString() }}</text>
            <text class="stat-lbl">最低申购</text>
          </view>
        </view>
      </view>

      <view class="amount-section">
        <text class="section-title">输入申购数量（生态积分）</text>
        <view class="amount-input">
          <input
            v-model="amount"
            type="number"
            placeholder="请输入积分数量"
            class="input"
            @input="onAmountChange"
          />
          <text class="unit">积分</text>
        </view>
        <view class="quick-amounts">
          <view
            v-for="amt in [1000, 5000, 10000, 50000]"
            :key="amt"
            :class="['quick-btn', { active: amount === String(amt) }]"
            @click="amount = String(amt)"
          >
            {{ amt.toLocaleString() }}
          </view>
        </view>
        <view class="balance-info">
          <text>可用积分：{{ ecoPoints.toLocaleString() }}</text>
        </view>
      </view>

      <view class="expected-section">
        <text class="section-title">预期收益</text>
        <view class="expected-value">
          <text class="earning">+{{ expectedEarning.toLocaleString() }}</text>
          <text class="earning-label">积分（约 {{ (expectedEarning / 100).toFixed(2) }} 元）</text>
        </view>
        <text class="expected-tip">
          收益计算：{{ amount || 0 }} × {{ product.annualRate }}% ÷ 365 × {{ product.cycleDays }}天
        </text>
      </view>

      <view class="agreement">
        <text>我已阅读并同意</text>
        <text class="link">《理财服务协议》</text>
      </view>

      <view
        :class="['submit-btn', { disabled: !canSubmit }]"
        @click="doSubscribe"
      >
        确认申购
      </view>

      <view class="risk-notice">
        <text>⚠️ 投资有风险，理财项目不保证本金安全。提前赎回将收取 {{ (product.earlyRedeemFee || 0) * 100 }}% 手续费。</text>
      </view>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { financialApi, walletApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const product = ref<any>(null)
const amount = ref('')
const ecoPoints = ref(0)
const loading = ref(false)

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  if (!requireAuth()) return
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    // 从页面参数获取 productId
    const pages = getCurrentPages()
    const current = pages[pages.length - 1] as any
    const pid = current?.options?.productId || ''

    const [products, bal] = await Promise.all([
      financialApi.getProducts(),
      walletApi.getBalance(),
    ])

    ecoPoints.value = Number(bal.ecoPoints || 0)

    if (pid) {
      product.value = (products || []).find((p: any) => p.id === pid) || null
    } else {
      product.value = products?.[0] || null
    }

    if (product.value) {
      // 统一字段名，方便模板使用
      product.value.displayRate = product.value.displayRate || product.value.rateValue || '0'
      product.value.annualRate = parseFloat(product.value.displayRate) / 100
      product.value.cycleDays = product.value.cycleDays || product.value.cycle || 30
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const expectedEarning = computed(() => {
  if (!amount.value || !product.value) return 0
  const a = parseFloat(amount.value) || 0
  const rate = product.value.annualRate || parseFloat(product.value.displayRate || '0') / 100
  const days = product.value.cycleDays || 30
  return Math.floor(a * rate / 365 * days)
})

const canSubmit = computed(() => {
  if (!amount.value || !product.value) return false
  const a = parseFloat(amount.value)
  const min = parseFloat(product.value.minAmount || 0)
  const max = parseFloat(product.value.maxAmount || Infinity)
  const balance = ecoPoints.value
  return a >= min && a <= balance && a <= max
})

async function doSubscribe() {
  if (!canSubmit.value) return
  uni.showLoading({ title: '提交中...' })
  try {
    await financialApi.subscribe({
      productId: product.value.id,
      amount: amount.value,
    })
    uni.showToast({ title: '申购成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '申购失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.page-container {
  min-height: 100vh;
  background: $bg-primary;
  padding: 0 $spacing-lg;
}

.page-header {
  padding: $spacing-base 0;

  .page-title {
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
  }
}

.invest-detail {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.product-header {
  display: flex;
  align-items: center;
  gap: $spacing-base;

  .product-icon {
    font-size: 80rpx;
  }

  .product-info {
    .product-name {
      font-size: 36rpx;
      font-weight: 700;
      color: $text-primary;
      display: block;
    }

    .product-type {
      font-size: 24rpx;
      color: $text-secondary;
    }
  }
}

.yield-card {
  background: linear-gradient(135deg, rgba($profit, 0.2) 0%, rgba($profit, 0.05) 100%);
  border: 1rpx solid rgba($profit, 0.3);
  border-radius: $radius-lg;
  padding: $spacing-xl;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .yield-main {
    .yield-value {
      font-size: 72rpx;
      font-weight: 700;
      color: $profit;
      display: block;
    }

    .yield-label {
      font-size: 24rpx;
      color: $text-secondary;
    }
  }

  .yield-stats {
    display: flex;
    gap: $spacing-xl;

    .stat-item {
      text-align: center;

      .stat-val {
        font-size: 28rpx;
        font-weight: 600;
        color: $text-primary;
        display: block;
      }

      .stat-lbl {
        font-size: 22rpx;
        color: $text-muted;
      }
    }
  }
}

.amount-section, .expected-section {
  background: $bg-card;
  border-radius: $radius-md;
  padding: $spacing-base $spacing-lg;
  border: 1rpx solid $border-color;

  .section-title {
    font-size: 26rpx;
    color: $text-secondary;
    display: block;
    margin-bottom: $spacing-base;
  }
}

.amount-input {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  border-bottom: 2rpx solid $primary;

  .input {
    flex: 1;
    font-size: 48rpx;
    font-weight: 700;
    color: $text-primary;
    padding: $spacing-sm 0;
  }

  .unit {
    font-size: 28rpx;
    color: $text-secondary;
  }
}

.quick-amounts {
  display: flex;
  gap: $spacing-sm;
  margin-top: $spacing-base;

  .quick-btn {
    background: $bg-secondary;
    padding: 8rpx 24rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
    color: $text-secondary;

    &.active {
      background: rgba($primary, 0.2);
      color: $primary;
    }
  }
}

.balance-info {
  margin-top: $spacing-base;
  font-size: 24rpx;
  color: $text-muted;
  text-align: right;
}

.expected-value {
  .earning {
    font-size: 56rpx;
    font-weight: 700;
    color: $profit;
  }

  .earning-label {
    font-size: 24rpx;
    color: $text-secondary;
    margin-left: $spacing-sm;
  }
}

.expected-tip {
  font-size: 22rpx;
  color: $text-muted;
  margin-top: 8rpx;
  display: block;
}

.agreement {
  font-size: 24rpx;
  color: $text-muted;
  text-align: center;

  .link {
    color: $primary;
  }
}

.submit-btn {
  background: linear-gradient(135deg, $profit, #00CC00);
  color: #000;
  font-size: 32rpx;
  font-weight: 700;
  text-align: center;
  padding: $spacing-base;
  border-radius: 50rpx;

  &.disabled {
    background: $bg-secondary;
    color: $text-muted;
  }
}

.risk-notice {
  background: rgba($danger, 0.1);
  border: 1rpx solid rgba($danger, 0.3);
  border-radius: $radius-sm;
  padding: $spacing-sm $spacing-base;
  font-size: 22rpx;
  color: $danger;
  line-height: 1.6;
}

.loading {
  text-align: center;
  padding: $spacing-xl;
  color: $text-muted;
}
</style>
