<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { checkAuth } from '@/utils/auth'
import { assetStore } from '@/store/asset'

onLaunch(() => {
  if (checkAuth()) assetStore.fetchBalance()
})

onShow(() => {
  if (checkAuth()) assetStore.fetchBalance()
})
</script>

<style lang="scss">
@import './styles/theme.scss';

/* 全局样式 - 轻奢金融 · 象牙白底 · 深藏青 · 香槟金 */

page {
  background: linear-gradient(180deg, #FFFFFF 0%, #F5F4F1 35%, #EFEEEB 100%);
  background-attachment: fixed;
  background-color: #F5F4F1;
  color: #141414;
  font-family: var(--font-sans);
  font-size: var(--font-base);
  line-height: var(--leading-normal);
  font-weight: var(--weight-regular);
  letter-spacing: 0.02em;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar {
  display: none;
  width: 0;
}

.glass,
.clay,
.glass-card {
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
}

.safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 6rpx 28rpx rgba(26, 36, 56, 0.08); }
  50% { box-shadow: 0 10rpx 40rpx rgba(196, 165, 116, 0.2); }
}

@keyframes clay-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.01); }
}

/* AI 果冻顶条 */
.top-arc {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3rpx;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(196, 165, 116, 0.35) 25%,
    rgba(26, 36, 56, 0.25) 50%,
    rgba(196, 165, 116, 0.35) 75%,
    transparent 100%);
  z-index: 9999;
  pointer-events: none;
}
</style>
