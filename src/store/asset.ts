// 全局资产状态 — 对接 /wallet/balance + /users/asset + /level/my

import { reactive } from 'vue'

export interface AssetState {
  ecoPoints: number
  consumerPoints: number
  frozenEcoPoints: number
  balance: number
  todayEarnings: number
  totalEarnings: number
  pendingDividend: number
  level: number
  levelName: string
  teamPerformance: number
  upgradeNeed: number
  dailyBonus: number
  loading: boolean
  lastUpdate: number
}

export interface Product {
  id: number | string
  name: string
  price: number
  image: string
  description?: string
  stock?: number
  unit?: string
}

export interface CartItem {
  product: Product
  quantity: number
  note?: string
}

class AssetStore {
  private state: AssetState = reactive({
    ecoPoints: 0,
    consumerPoints: 0,
    frozenEcoPoints: 0,
    balance: 0,
    todayEarnings: 0,
    totalEarnings: 0,
    pendingDividend: 0,
    level: 1,
    levelName: 'V1',
    teamPerformance: 0,
    upgradeNeed: 0,
    dailyBonus: 0,
    loading: false,
    lastUpdate: 0,
  })

  get totalAssets(): number {
    return this.state.ecoPoints + this.state.consumerPoints + this.state.pendingDividend
  }

  get totalAssetsDisplay(): string {
    return this.fmt(this.totalAssets)
  }

  get ecoPointsDisplay(): string {
    return this.fmt(this.state.ecoPoints)
  }

  get consumerPointsDisplay(): string {
    return this.fmt(this.state.consumerPoints)
  }

  get pendingDividendDisplay(): string {
    return this.fmt(this.state.pendingDividend)
  }

  get yesterdayProfitDisplay(): string {
    return this.fmt(this.state.todayEarnings, 2)
  }

  get balanceDisplay(): string {
    return this.fmt(this.state.balance, 2)
  }

  get levelName(): string {
    return this.state.levelName || `V${this.state.level}`
  }

  get progressPercent(): number {
    const next = this.state.teamPerformance + this.state.upgradeNeed
    if (next <= 0 || this.state.upgradeNeed <= 0) return 100
    return Math.min(
      100,
      Math.round((this.state.teamPerformance / (this.state.teamPerformance + this.state.upgradeNeed)) * 100)
    )
  }

  get stateRef(): AssetState {
    return this.state
  }

  private fmt(n: number, d = 0): string {
    return Number(n).toLocaleString('zh-CN', {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    })
  }

  /** 拉取钱包 + 用户资产 + 等级（API 契约） */
  async fetchBalance() {
    this.state.loading = true
    try {
      const { walletApi, userApi, levelApi } = await import('@/utils/api')
      const [wallet, asset, level] = await Promise.all([
        walletApi.getBalance().catch(() => null),
        userApi.getAsset().catch(() => null),
        levelApi.getMyLevel().catch(() => null),
      ])

      if (wallet) {
        this.state.ecoPoints = Number(wallet.ecoPoints || 0)
        this.state.consumerPoints = Number(wallet.consumerPoints || 0)
        this.state.frozenEcoPoints = Number(wallet.frozenEcoPoints || 0)
      }
      if (asset) {
        if (!wallet) {
          this.state.ecoPoints = Number(asset.ecoPoints || 0)
          this.state.consumerPoints = Number(asset.consumerPoints || 0)
        }
        this.state.balance = Number(asset.balance || 0)
        this.state.todayEarnings = Number(asset.todayEarnings || 0)
        this.state.totalEarnings = Number(asset.totalEarnings || 0)
        this.state.pendingDividend = Number(asset.todayEarnings || 0)
      }
      if (level) {
        this.state.level = level.level
        this.state.levelName = level.levelName
        this.state.teamPerformance = Number(level.teamPerformance || 0)
        this.state.upgradeNeed = Number(level.upgradeNeed || 0)
        this.state.dailyBonus = Number(level.dailyBonus || 0)
      }
      this.state.lastUpdate = Date.now()
    } catch (e) {
      console.error('[AssetStore] fetchBalance', e)
    } finally {
      this.state.loading = false
    }
  }

  addEcoPoints(amount: number) {
    this.state.ecoPoints += amount
    this.state.lastUpdate = Date.now()
  }

  deductEcoPoints(amount: number): boolean {
    if (this.state.ecoPoints < amount) return false
    this.state.ecoPoints -= amount
    this.state.lastUpdate = Date.now()
    return true
  }

  formatEco(pts?: number): string {
    return this.fmt(pts ?? this.state.ecoPoints)
  }

  formatConsumer(pts?: number): string {
    return this.fmt(pts ?? this.state.consumerPoints)
  }

  formatBalance(bal?: number): string {
    return this.fmt(bal ?? this.state.balance, 2)
  }

  formatProfit(profit?: number): string {
    return this.fmt(profit ?? this.state.todayEarnings)
  }

  formatTotalAssets(): string {
    return this.fmt(this.totalAssets)
  }

  reset() {
    Object.assign(this.state, {
      ecoPoints: 0,
      consumerPoints: 0,
      frozenEcoPoints: 0,
      balance: 0,
      todayEarnings: 0,
      totalEarnings: 0,
      pendingDividend: 0,
      level: 1,
      levelName: 'V1',
      teamPerformance: 0,
      upgradeNeed: 0,
      dailyBonus: 0,
      lastUpdate: 0,
    })
  }
}

export const assetStore = new AssetStore()
