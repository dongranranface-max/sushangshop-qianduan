<template>
  <view class="page-container">
    <view class="safe-area-top" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="page-header">
      <text class="back" @click="goBack">&lt;</text>
      <text class="page-title">邀请有礼</text>
    </view>

    <view class="invite-banner">
      <text class="banner-title">邀请好友加入</text>
      <text class="banner-sub">好友消费，你躺赚{{ rewardConfig?.referralRewardRate || '10' }}%积分奖励</text>
      <text class="banner-rule">无层级上限，永续收益</text>
    </view>

    <view class="invite-code-card">
      <text class="card-label">我的邀请码</text>
      <text class="invite-code">{{ inviteCode }}</text>
      <view class="copy-btn" @click="copyCode">复制邀请码</view>
    </view>

    <view class="share-section">
      <text class="section-title">分享链接</text>
      <view class="share-url">{{ shareUrl }}</view>
      <view class="share-btn" @click="shareInvite">分享给好友</view>
    </view>

    <view class="reward-rules">
      <text class="section-title">邀请奖励规则</text>
      <view class="rule-list">
        <view class="rule-item">
          <text class="rule-icon">邀</text>
          <view class="rule-content">
            <text class="rule-title">10% 无限级推荐奖励</text>
            <text class="rule-desc">你推荐的好友在商城任意消费，你都将获得该笔积分的10%作为推荐奖励，实时到账，无层级上限</text>
          </view>
        </view>
        <view class="rule-item">
          <text class="rule-icon">益</text>
          <view class="rule-content">
            <text class="rule-title">团队业绩计入小区理财</text>
            <text class="rule-desc">好友申购理财项目的积分，会计入你的小区业绩，帮助你升级会员等级，获得更高每日分红</text>
          </view>
        </view>
        <view class="rule-item">
          <text class="rule-icon">礼</text>
          <view class="rule-content">
            <text class="rule-title">好友注册即得启动积分</text>
            <text class="rule-desc">好友使用你的邀请码注册，将获得平台赠送的启动积分</text>
          </view>
        </view>
      </view>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { referralApi } from '@/utils/api'
import { requireAuth } from '@/utils/auth'

const statusBarHeight = ref(20)
const inviteCode = ref('')
const shareUrl = ref('')
const rewardConfig = ref<{ registerReward: string; referralRewardRate: string } | null>(null)

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  if (!requireAuth()) return
  loadData()
})

async function loadData() {
  try {
    const [codeRes, configRes] = await Promise.all([
      referralApi.getInviteCode(),
      referralApi.getRewardConfig(),
    ])
    inviteCode.value = codeRes.inviteCode || ''
    shareUrl.value = codeRes.inviteUrl || `https://jixiang.com/register?code=${inviteCode.value}`
    rewardConfig.value = configRes
  } catch {
    inviteCode.value = ''
    shareUrl.value = ''
  }
}

function goBack() {
  uni.navigateBack()
}

function copyCode() {
  uni.setClipboardData({
    data: inviteCode.value,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
  })
}

function shareInvite() {
  uni.share({
    provider: 'weixin',
    type: 0,
    title: '邀请你加入ECO积分商城',
    scene: 'WXSceneSession',
    messageExt: `我的邀请码：${inviteCode.value}，注册即得积分！`,
    href: shareUrl.value,
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/page-shell.scss';

.page-container { @include tab-page-shell; }

.page-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);

  .back {
    font-size: 40rpx;
    color: var(--text-primary);
  }

  .page-title {
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-primary);
  }
}

.invite-banner {
  @include premium-surface($warm-yellow);
  border-radius: $radius-lg;
  padding: var(--spacing-xl);
  text-align: center;
  margin: var(--spacing-base) 0;

  .banner-title {
    font-size: 40rpx;
    font-weight: 700;
    color: var(--text-primary);
    display: block;
  }

  .banner-sub {
    font-size: 28rpx;
    color: $accent-dark;
    display: block;
    margin-top: 8rpx;
  }

  .banner-rule {
    font-size: 24rpx;
    color: var(--text-muted);
    display: block;
    margin-top: 4rpx;
  }
}

.invite-code-card {
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  padding: var(--spacing-xl);
  text-align: center;

  .card-label {
    font-size: 24rpx;
    color: var(--text-muted);
  }

  .invite-code {
    font-size: 56rpx;
    font-weight: 700;
    color: $navy;
    letter-spacing: 4rpx;
    display: block;
    margin: var(--spacing-base) 0;
  }

  .copy-btn {
    display: inline-block;
    background: $accent-fire;
    color: $text-inverse;
    font-size: 26rpx;
    font-weight: 600;
    padding: 12rpx 48rpx;
    border-radius: 50rpx;
  }
}

.share-section {
  margin: var(--spacing-lg) 0;

  .section-title {
    font-size: 28rpx;
    color: var(--text-primary);
    font-weight: 600;
    display: block;
    margin-bottom: var(--spacing-base);
  }

  .share-url {
    background: var(--bg-secondary);
    border-radius: $radius-sm;
    padding: var(--spacing-base);
    font-size: 22rpx;
    color: var(--text-muted);
    word-break: break-all;
    margin-bottom: var(--spacing-base);
  }

  .share-btn {
    background: $accent-fire;
    color: $text-inverse;
    font-size: 28rpx;
    font-weight: 600;
    text-align: center;
    padding: 16rpx;
    border-radius: 50rpx;
  }
}

.reward-rules {
  .section-title {
    font-size: 28rpx;
    color: var(--text-primary);
    font-weight: 600;
    display: block;
    margin-bottom: var(--spacing-base);
  }

  .rule-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-base);
  }

  .rule-item {
    display: flex;
    gap: var(--spacing-base);
    @include premium-surface($bg-secondary);
    border-radius: $radius-lg;
    padding: var(--spacing-base);

    .rule-icon {
      width: 56rpx; height: 56rpx; line-height: 56rpx; text-align: center;
      font-size: 28rpx; font-weight: var(--weight-heavy); color: $navy;
      background: $warm-yellow; border-radius: 50%; flex-shrink: 0;
    }

    .rule-content {
      flex: 1;

      .rule-title {
        font-size: 28rpx;
        font-weight: 600;
        color: var(--text-primary);
        display: block;
      }

      .rule-desc {
        font-size: 24rpx;
        color: var(--text-secondary);
        display: block;
        margin-top: 4rpx;
        line-height: 1.6;
      }
    }
  }
}
</style>
