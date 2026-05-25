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

/* ============================================
   页面过渡动画（uni-app H5 Vue Router）
   ============================================ */

// 页面容器统一过渡
uni-page-body,
#app > view,
page {
  animation-fill-mode: both;
}

/* 页面进入：向上滑入 */
.page-enter-from,
.page-enter {
  opacity: 0;
  transform: translateY(32rpx);
}
.page-enter-to,
.page-enter-active {
  animation: page-slide-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* 页面离开：向下收起 */
.page-leave-to,
.page-leave-active {
  animation: page-slide-down 0.24s ease-in both;
}
.page-leave-from { opacity: 1; }

@keyframes page-slide-up {
  from { opacity: 0; transform: translateY(32rpx); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes page-slide-down {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(20rpx); }
}

/* Tab 切换：无动画（即时切换） */
.tab-switch-enter-active,
.tab-switch-leave-active { transition: none; }

/* Modal / 弹窗类页面：从底部滑出 */
.modal-enter-to,
.modal-enter-active {
  animation: modal-slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.modal-leave-to,
.modal-leave-active {
  animation: modal-slide-down 0.22s ease-in both;
}

@keyframes modal-slide-up {
  from { opacity: 0; transform: translateY(100%); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes modal-slide-down {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(60rpx); }
}

/* 卡片 / 列表项逐个入场 */
.list-item {
  animation: fade-slide-in 0.3s ease both;
  @for $i from 1 through 12 {
    &:nth-child(#{$i}) {
      animation-delay: #{($i - 1) * 0.06}s;
    }
  }
}

@keyframes fade-slide-in {
  from { opacity: 0; transform: translateY(20rpx); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 骨架屏列表项延迟动画 */
.skeleton-list-item {
  animation: skeleton-fade-in 0.4s ease both;
  @for $i from 1 through 8 {
    &:nth-child(#{$i}) {
      animation-delay: #{($i - 1) * 0.07}s;
    }
  }
}

@keyframes skeleton-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
</style>
