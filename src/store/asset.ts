// src/store/asset.ts
// 全局资产状态管理 - Pinia Store
// 实时同步：生态积分 + 消费积分 + 待收分红

import { reactive, computed, watch } from 'vue'

// ===========================================
// 资产数据类型
// ===========================================
export interface AssetState {
  // 积分余额
  ecoPoints: number        // 生态积分
  consumerPoints: number   // 消费积分
  pendingDividend: number  // 待收分红
  // 收益数据
  yesterdayProfit: number  // 昨日分红
  profitRate: number       // 年化收益率 %
  // 用户等级
  level: number            // 当前等级 V1-V9
  teamPerformance: number  // 小区业绩
  nextLevelThreshold: number // 下一级门槛
  // 加载状态
  loading: boolean
  lastUpdate: number       // 最后更新时间戳
}

// ===========================================
// 资产 Store
// ===========================================
class AssetStore {
  private state: AssetState = reactive({
    ecoPoints: 0,
    consumerPoints: 0,
    pendingDividend: 0,
    yesterdayProfit: 0,
    profitRate: 0,
    level: 1,
    teamPerformance: 0,
    nextLevelThreshold: 10000,
    loading: false,
    lastUpdate: 0,
  })

  // ---- Getters ----
  get totalAssets(): number {
    return this.state.ecoPoints + this.state.consumerPoints + this.state.pendingDividend
  }

  get totalAssetsDisplay(): string {
    return Number(this.totalAssets).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  }

  get ecoPointsDisplay(): string {
    return Number(this.state.ecoPoints).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  }

  get consumerPointsDisplay(): string {
    return Number(this.state.consumerPoints).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  }

  get pendingDividendDisplay(): string {
    return Number(this.state.pendingDividend).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  }

  get yesterdayProfitDisplay(): string {
    return Number(this.state.yesterdayProfit).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  get profitRateDisplay(): string {
    return this.state.profitRate.toFixed(1)
  }

  get nextLevel(): number {
    return Math.min(this.state.level + 1, 9)
  }

  get progressPercent(): number {
    if (this.state.nextLevelThreshold <= 0) return 0
    return Math.min(100, Math.round((this.state.teamPerformance / this.state.nextLevelThreshold) * 100))
  }

  get levelName(): string {
    const names = ['', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9']
    return names[this.state.level] || 'V1'
  }

  get levelColor(): 'primary' | 'accent' | 'gold' {
    if (this.state.level <= 3) return 'primary'
    if (this.state.level <= 6) return 'accent'
    return 'gold'
  }

  get stateRef(): AssetState {
    return this.state
  }

  // ---- Actions ----
  async fetchBalance() {
    this.state.loading = true
    try {
      const { walletApi } = await import('@/utils/api')
      const bal = await walletApi.getBalance()
      this.state.ecoPoints = Number(bal.ecoPoints || 0)
      this.state.consumerPoints = Number(bal.consumerPoints || 0)
      this.state.pendingDividend = Number(bal.pendingDividend || 0)
      this.state.yesterdayProfit = Number(bal.yesterdayProfit || 0)
      this.state.profitRate = Number(bal.profitRate || 0)
      this.state.level = Number(bal.level || 1)
      this.state.teamPerformance = Number(bal.teamPerformance || 0)
      this.state.nextLevelThreshold = Number(bal.nextLevelThreshold || 10000)
      this.state.lastUpdate = Date.now()
    } catch (e) {
      console.error('[AssetStore] fetchBalance failed', e)
    } finally {
      this.state.loading = false
    }
  }

  // 模拟增加积分（下单返积分、理财收益入账）
  addEcoPoints(amount: number) {
    this.state.ecoPoints += amount
    this.state.lastUpdate = Date.now()
  }

  // 模拟扣减积分（兑换、购买）
  deductEcoPoints(amount: number): boolean {
    if (this.state.ecoPoints < amount) return false
    this.state.ecoPoints -= amount
    this.state.lastUpdate = Date.now()
    return true
  }

  // 分红入账
  creditDividend(amount: number) {
    this.state.pendingDividend += amount
    this.state.lastUpdate = Date.now()
  }

  // 领取分红
  claimDividend(): number {
    const amount = this.state.pendingDividend
    this.state.pendingDividend = 0
    this.state.lastUpdate = Date.now()
    return amount
  }

  // 重置（退出登录）
  reset() {
    this.state.ecoPoints = 0
    this.state.consumerPoints = 0
    this.state.pendingDividend = 0
    this.state.yesterdayProfit = 0
    this.state.profitRate = 0
    this.state.level = 1
    this.state.teamPerformance = 0
    this.state.nextLevelThreshold = 10000
    this.state.lastUpdate = 0
  }
}

// 单例导出
export const assetStore = new AssetStore()