<template>
  <view class="portals">
    <view class="portals__mall-row">
      <view
        v-for="p in mallPortals"
        :key="p.type"
        class="portal"
        @click="emit('select', p.type)"
      >
        <view v-if="p.tag" class="portal__tag">{{ p.tag }}</view>
        <text class="portal__abbr">{{ p.abbr }}</text>
        <text class="portal__name">{{ p.name }}</text>
        <text class="portal__desc">{{ p.desc }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
export type PortalType = 'consume' | 'exchange' | 'redeem' | 'wealth'

const mallPortals = [
  { type: 'consume' as const, name: '消费', desc: '赠送生态积分', abbr: '购', tag: '优选' },
  { type: 'exchange' as const, name: '换购', desc: '生态积分换算', abbr: '换', tag: '换算' },
  { type: 'redeem' as const, name: '兑换', desc: '纯绿色积分', abbr: '兑', tag: '免费' },
]

const emit = defineEmits<{ (e: 'select', type: PortalType): void }>()
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.portals {
  margin-bottom: 0;
}
.portals__mall-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $home-card-pad;
}
.portal {
  position: relative;
  padding: 28rpx $home-card-pad;
  @include premium-surface($bg-secondary);
  overflow: hidden;
  text-align: center;
  &:active { transform: scale(0.99); opacity: 0.92; }
}
.portal__abbr {
  width: 72rpx;
  height: 72rpx;
  margin: 0 auto 12rpx;
  line-height: 72rpx;
  font-size: 32rpx;
  font-weight: var(--weight-heavy);
  color: $navy;
  background: $warm-yellow;
  border-radius: 50%;
  border: 1rpx solid $border-primary;
  display: block;
}
.portal__tag {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  left: auto;
  font-size: var(--font-xs);
  font-weight: var(--weight-bold);
  padding: 4rpx 12rpx;
  border-radius: $radius-sm;
  background: $warm-yellow;
  color: rgba(154, 123, 79, 1);
  line-height: 1.2;
  z-index: 1;
}
.portal__name {
  display: block;
  @include type-card-title;
}
.portal__desc {
  @include type-caption;
  margin-top: 6rpx;
  color: $text-muted;
}
</style>
