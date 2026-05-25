<template>
  <view class="invest-card" @click="$emit('click', project)">
    <view class="invest-header">
      <view class="invest-type">
        <view class="type-icon">{{ project.icon || defaultIcon }}</view>
        <text class="type-name">{{ project.name }}</text>
      </view>
      <view class="invest-tag" :class="riskTagClass">
        {{ riskTagLabel }}
      </view>
    </view>

    <view class="invest-stats">
      <view class="stat-item">
        <text class="stat-value profit">{{ project.displayRate || project.rateValue }}%</text>
        <text class="stat-label">年化收益</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ project.cycleDays || project.cycle || 30 }}天</text>
        <text class="stat-label">投资周期</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ formatAmount(project.minAmount) }}</text>
        <text class="stat-label">最低申购</text>
      </view>
    </view>

    <view class="invest-footer">
      <view class="invest-progress">
        <view class="progress-bar-small">
          <view
            class="progress-fill-small"
            :style="{ width: Math.min(100, project.progress || 50) + '%' }"
          />
        </view>
        <text class="progress-text">
          已投 {{ project.progress || 50 }}% ·
          剩余 {{ formatAmount((1 - (project.progress || 50) / 100) * Number(project.totalAmount || 0)) }}
        </text>
      </view>
      <view class="invest-btn" @click.stop="$emit('invest', project)">
        {{ project.riskLevel === 1 ? '稳健申购' : project.riskLevel === 2 ? '立即申购' : '进取申购' }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FinancialProduct } from '@/types/api'

const props = defineProps<{
  project: Partial<FinancialProduct>
}>()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
defineEmits<{
  (e: 'click', project: Partial<FinancialProduct>): void
  (e: 'invest', project: Partial<FinancialProduct>): void
}>()

const defaultIcon = computed(() => {
  const map: Record<number, string> = { 1: '稳', 2: '平', 3: '进' }
  return map[props.project.riskLevel || 2] || '理'
})

const riskTagClass = computed(() => {
  const map: Record<number, string> = { 1: 'tag-safe', 2: 'tag-new', 3: 'tag-high' }
  return map[props.project.riskLevel || 2] || 'tag-new'
})

const riskTagLabel = computed(() => {
  const map: Record<number, string> = { 1: '稳健', 2: '平衡', 3: '进取' }
  return map[props.project.riskLevel || 2] || '平衡型'
})

function formatAmount(v: string | number | undefined): string {
  const num = parseFloat(String(v || '0'))
  if (isNaN(num)) return '0'
  return num.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.invest-card {
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  padding: var(--spacing-base);

  .invest-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-base);

    .invest-type {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);

      .type-icon {
        width: 48rpx;
        height: 48rpx;
        line-height: 48rpx;
        text-align: center;
        font-size: 24rpx;
        font-weight: var(--weight-heavy);
        color: $navy;
        background: $warm-yellow;
        border-radius: 50%;
      }

      .type-name {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .invest-tag {
      font-size: 20rpx;
      padding: 4rpx 16rpx;
      border-radius: 8rpx;

      &.tag-high {
        background: linear-gradient(135deg, var(--danger), #DC2626);
        color: #fff;
      }

      &.tag-new {
        background: linear-gradient(135deg, var(--accent), var(--accent-dark));
        color: #fff;
      }

      &.tag-safe {
        background: linear-gradient(135deg, var(--primary), var(--primary)-dark);
        color: #fff;
      }
    }
  }

  .invest-stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: var(--spacing-base);

    .stat-item {
      text-align: center;

      .stat-value {
        font-size: 40rpx;
        font-weight: 800;
        display: block;
        letter-spacing: -1rpx;
        color: $navy;

        &.profit {
          @include ai-jelly-text;
        }
      }

      .stat-label {
        font-size: 22rpx;
        color: var(--text-secondary);
      }
    }
  }

  .invest-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .invest-progress {
      flex: 1;

      .progress-bar-small {
        height: 8rpx;
        background: rgba($navy, 0.08);
        border-radius: 4rpx;
        overflow: hidden;

        .progress-fill-small {
          height: 100%;
          background: $gold-gradient;
          border-radius: 4rpx;
        }
      }

      .progress-text {
        font-size: 20rpx;
        color: var(--text-muted);
        margin-top: 4rpx;
        display: block;
      }
    }

    .invest-btn {
      background: $navy;
      color: $text-inverse;
      font-size: 26rpx;
      font-weight: 700;
      padding: 12rpx 32rpx;
      border-radius: 50rpx;
      margin-left: var(--spacing-base);
      box-shadow: $shadow-glow;
    }
  }
}
</style>
