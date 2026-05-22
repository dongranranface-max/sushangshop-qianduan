<template>
  <view class="portals" :class="{ 'portals--animated': mounted }">
    <view class="portals__mall-row">
      <view
        v-for="(p, index) in mallPortals"
        :key="p.type"
        class="portal"
        :class="[`portal--${p.type}`, { 'portal--pressed': pressedIndex === index }]"
        :style="{ '--stagger': index }"
        @click.stop="onSelect(p.type, index)"
        @touchstart="pressedIndex = index"
        @touchend="pressedIndex = null"
        @touchcancel="pressedIndex = null"
      >
        <!-- 背景装饰光 -->
        <view class="portal__glow" />
        <!-- 标签 -->
        <view v-if="p.tag" class="portal__tag" :class="`portal__tag--${p.type}`">
          {{ p.tag }}
        </view>
        <!-- 图标圆 -->
        <view class="portal__icon-wrap" :class="`portal__icon-wrap--${p.type}`">
          <text class="portal__abbr">{{ p.abbr }}</text>
        </view>
        <!-- 文字 -->
        <text class="portal__name">{{ p.name }}</text>
        <text class="portal__desc">{{ p.desc }}</text>
        <!-- 进入箭头 -->
        <text class="portal__arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

export type PortalType = 'consume' | 'exchange' | 'redeem' | 'wealth'

interface PortalItem {
  type: PortalType
  name: string
  desc: string
  abbr: string
  tag?: string
}

const mallPortals: PortalItem[] = [
  { type: 'consume', name: '消费', desc: '赠送生态积分', abbr: '购', tag: '优选' },
  { type: 'exchange', name: '换购', desc: '生态积分换算', abbr: '换', tag: '换算' },
  { type: 'redeem', name: '兑换', desc: '纯绿色积分', abbr: '兑', tag: '免费' },
]

const emit = defineEmits<{
  (e: 'select', type: PortalType): void
}>()

const mounted = ref(false)
const pressedIndex = ref<number | null>(null)

onMounted(() => {
  // 延迟触发进入动画
  setTimeout(() => {
    mounted.value = true
  }, 100)
})

function onSelect(type: PortalType, index: number) {
  emit('select', type)
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/animations.scss';

.portals {
  margin-bottom: 0;

  // 交错进入动画
  &--animated .portal {
    animation: slideUp var(--duration-slow) var(--ease-out) calc(var(--stagger) * 80ms) both;
  }
}

.portals__mall-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $home-card-pad;
}

.portal {
  position: relative;
  padding: 28rpx $home-card-pad 24rpx;
  @include premium-surface($bg-secondary);
  border-radius: $radius-xl;
  overflow: hidden;
  text-align: center;
  // 底部悬浮阴影
  box-shadow: $clay-shadow;
  // 过渡
  transition:
    transform var(--duration-base) var(--ease-spring),
    box-shadow var(--duration-base) var(--ease-default);

  &:active {
    transform: scale(0.97);
    box-shadow: 0 4rpx 16rpx rgba(26, 36, 56, 0.04);
  }

  &--pressed {
    transform: scale(0.97);
  }

  // ---- 类型主题 ----
  &--consume {
    .portal__icon-wrap { border-color: rgba($accent, 0.4); }
    .portal__icon-wrap--consume { background: rgba($accent, 0.08); color: $accent-dark; border-color: $border-primary; }
    .portal__glow { background: radial-gradient(circle at 80% 20%, rgba($accent, 0.12) 0%, transparent 60%); }
  }
  &--exchange {
    .portal__icon-wrap--exchange { background: rgba($primary-light, 0.08); color: $primary-light; border-color: rgba($primary-light, 0.3); }
    .portal__glow { background: radial-gradient(circle at 80% 20%, rgba($primary-light, 0.1) 0%, transparent 60%); }
  }
  &--redeem {
    .portal__icon-wrap--redeem { background: rgba($success, 0.08); color: $success; border-color: rgba($success, 0.3); }
    .portal__glow { background: radial-gradient(circle at 80% 20%, rgba($success, 0.08) 0%, transparent 60%); }
  }
}

.portal__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.portal__tag {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  font-size: 18rpx;
  font-weight: var(--weight-bold);
  padding: 4rpx 12rpx;
  border-radius: $radius-sm;
  background: transparent;
  line-height: 1.2;
  z-index: 1;
  border: 1rpx solid;
  letter-spacing: var(--tracking-wide);

  &--consume { color: $accent-dark; border-color: $border-primary; }
  &--exchange { color: $primary-light; border-color: rgba($primary-light, 0.3); }
  &--redeem { color: $success; border-color: rgba($success, 0.3); }
}

.portal__icon-wrap {
  position: relative;
  z-index: 1;
  width: 72rpx;
  height: 72rpx;
  margin: 0 auto 12rpx;
  border-radius: 50%;
  border: 2rpx solid;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--duration-base) var(--ease-spring);

  .portal:active & {
    transform: scale(1.08);
  }
}

.portal__abbr {
  font-size: 30rpx;
  font-weight: var(--weight-heavy);
}

.portal__name {
  display: block;
  position: relative;
  z-index: 1;
  @include type-card-title;
  margin-bottom: 4rpx;
}

.portal__desc {
  display: block;
  position: relative;
  z-index: 1;
  font-size: 20rpx;
  color: $text-muted;
  margin-bottom: 8rpx;
}

.portal__arrow {
  position: absolute;
  bottom: 16rpx;
  right: $home-card-pad;
  font-size: 28rpx;
  color: $text-muted;
  opacity: 0;
  transform: translateX(-8rpx);
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
  z-index: 1;

  .portal:hover &,
  .portal:active & {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>