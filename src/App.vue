<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App 启动 - 集享公社')
})

onShow(() => {
  console.log('App 显示')
})

onHide(() => {
  console.log('App 隐藏')
})
</script>

<style lang="scss">
/* ============================================
   全局样式 - Futuristic FinTech 玻璃拟态
   ============================================ */

/* 深邃深空背景：径向渐变 */
page {
  background: radial-gradient(ellipse at 50% 0%, #0A1628 0%, #060B28 40%, #020510 100%);
  background-attachment: fixed;
  background-color: #060B28;
  color: #FFFFFF;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  font-size: 28rpx;
  line-height: 1.5;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* 全局毛玻璃（legacy 兼容） */
.glass {
  background: rgba(30, 41, 59, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1rpx solid rgba(255, 255, 255, 0.12);
}

/* 发光效果 */
.glow {
  box-shadow: 0 0 30px rgba(77, 142, 255, 0.4);
}

/* 安全区域 */
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

/* 动画 */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20rpx rgba(77, 142, 255, 0.4); }
  50% { box-shadow: 0 0 40rpx rgba(77, 142, 255, 0.6); }
}

@keyframes fire-breathe {
  0%, 100% {
    box-shadow: 0 0 20rpx rgba(255, 140, 0, 0.3);
  }
  50% {
    box-shadow: 0 0 40rpx rgba(255, 140, 0, 0.6);
  }
}

@keyframes circuit-flow {
  0% { opacity: 0.2; }
  50% { opacity: 0.6; }
  100% { opacity: 0.2; }
}

@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 0 20rpx rgba(255, 69, 0, 0.4); }
  50% { box-shadow: 0 0 40rpx rgba(255, 69, 0, 0.7); }
}
</style>
