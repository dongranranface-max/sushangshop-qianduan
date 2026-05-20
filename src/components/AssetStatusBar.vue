<template>
  <!-- ============================================
       顶部沉浸式资产状态栏
       实时显示：总资产 = 生态积分 + 消费积分 + 待收分红
       跑马灯滚动，每 3s 刷新一次余额
       ============================================ -->
  <view class="asset-status-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
    <!-- 左侧：Logo + 总资产 -->
    <view class="bar-left">
      <text class="bar-logo">💎</text>
      <view class="bar-asset-group">
        <text class="bar-asset-label">总资产</text>
        <text class="bar-asset-value">{{ assetStore.totalAssetsDisplay }}</text>
      </view>
    </view>

    <!-- 中间：滚动字幕（积分动态） -->
    <view class="bar-marquee-wrap">
      <view class="bar-marquee" :animation="marqueeAnim">
        <text class="marquee-text" v-for="(item, i) in marqueeItems" :key="i">{{ item }}</text>
        <!-- 重复一份实现无缝滚动 -->
        <text class="marquee-text" v-for="(item, i) in marqueeItems" :key="'copy-' + i">{{ item }}</text>
      </view>
    </view>

    <!-- 右侧：快捷操作 -->
    <view class="bar-right">
      <view class="bar-profit-chip" @click="onProfitClick">
        <text class="profit-chip-label">昨日</text>
        <text class="profit-chip-value">+{{ assetStore.yesterdayProfitDisplay }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { assetStore } from '@/store/asset'

const statusBarHeight = ref(20)
const marqueeItems = ref<string[]>([
  '🏆 用户「深圳-张**」成功申购 5000 积分',
  '🎉 用户「广州-李**」获得 320 消费积分',
  '📈 用户「上海-王**」领取分红 158.50',
  '⭐ 用户「北京-赵**」升级至 V4',
  '🔥 用户「杭州-陈**」申购年化 15.2% 项目',
])

let marqueeAnimData: any = null
let tickerTimer: ReturnType<typeof setInterval> | null = null
let refreshTimer: ReturnType<typeof setInterval> | null = null
const ANIM_DURATION = 15000 // 跑马灯滚动一圈 15s

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20

  // 启动跑马灯动画
  startMarquee()

  // 每 30s 刷新一次资产余额
  refreshTimer = setInterval(() => {
    assetStore.fetchBalance()
  }, 30000)
})

onUnmounted(() => {
  if (tickerTimer) clearInterval(tickerTimer)
  if (refreshTimer) clearInterval(refreshTimer)
  if (marqueeAnimData) marqueeAnimData.destroy()
})

function startMarquee() {
  const animation = uni.createAnimation({
    duration: ANIM_DURATION,
    timingFunction: 'linear',
  })

  const totalWidth = 750 // rpx
  const wrapWidth = 280  // 可视区域宽度

  let offset = 0
  tickerTimer = setInterval(() => {
    offset = (offset + 1) % (totalWidth * 2)
    animation.translateX(-offset).step()
    marqueeAnimData = animation.export()
  }, 30)
}

function onProfitClick() {
  // 跳转到收益详情
  uni.navigateTo({ url: '/pages/wealth/my-invest' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.asset-status-bar {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 24rpx;
  background: linear-gradient(90deg,
    rgba(0, 212, 255, 0.12) 0%,
    rgba(0, 153, 204, 0.06) 50%,
    rgba(255, 107, 53, 0.08) 100%);
  border-bottom: 1rpx solid rgba(0, 212, 255, 0.12);
  gap: 16rpx;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

// 左侧 Logo + 总资产
.bar-left {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-shrink: 0;
}

.bar-logo {
  font-size: 36rpx;
  filter: drop-shadow(0 0 8rpx rgba(0, 212, 255, 0.6));
}

.bar-asset-group {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.bar-asset-label {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.bar-asset-value {
  font-size: 28rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 6rpx rgba(255, 215, 0, 0.4));
}

// 中间跑马灯
.bar-marquee-wrap {
  flex: 1;
  overflow: hidden;
  height: 40rpx;
  display: flex;
  align-items: center;
}

.bar-marquee {
  display: flex;
  white-space: nowrap;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.6);
}

.marquee-text {
  margin-right: 60rpx;
}

// 右侧收益快捷按钮
.bar-right {
  flex-shrink: 0;
}

.bar-profit-chip {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 6rpx 16rpx;
  background: rgba(255, 107, 53, 0.15);
  border: 1rpx solid rgba(255, 107, 53, 0.30);
  border-radius: 999rpx;

  &:active {
    background: rgba(255, 107, 53, 0.25);
  }
}

.profit-chip-label {
  font-size: 18rpx;
  color: rgba(255, 140, 0, 0.8);
}

.profit-chip-value {
  font-size: 20rpx;
  font-weight: 700;
  color: #FF8C00;
  text-shadow: 0 0 8rpx rgba(255, 140, 0, 0.5);
}
</style>