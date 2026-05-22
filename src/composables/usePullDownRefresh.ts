// ============================================
//  usePullDownRefresh.ts - 下拉刷新 Hook
//  封装 uni 下拉刷新，支持自定义刷新动画
// ============================================
import { ref } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'

export interface UsePullDownRefreshOptions {
  /** 刷新成功后的提示（空字符串=不提示） */
  successTip?: string
  /** 刷新失败后的提示（空字符串=不提示） */
  errorTip?: string
  /** 刷新完成后的延迟（ms），让用户看到刷新动画 */
  delay?: number
}

export interface UsePullDownRefreshReturn {
  /** 是否正在刷新 */
  isRefreshing: boolean
  /** 触发刷新 */
  trigger: () => Promise<void>
  /** 刷新成功（自动停止） */
  resolve: () => void
  /** 刷新失败（自动停止） */
  reject: (err?: any) => void
}

export function usePullDownRefresh(
  onRefresh: () => Promise<void>,
  options: UsePullDownRefreshOptions = {}
): UsePullDownRefreshReturn {
  const { successTip = '刷新成功', errorTip = '刷新失败', delay = 600 } = options

  const isRefreshing = ref(false)

  async function trigger() {
    if (isRefreshing.value) return
    isRefreshing.value = true

    try {
      await onRefresh()
      if (successTip) {
        uni.showToast({ title: successTip, icon: 'success' })
      }
      resolve()
    } catch (err) {
      if (errorTip) {
        uni.showToast({ title: errorTip, icon: 'none' })
      }
      reject(err)
    } finally {
      setTimeout(() => {
        isRefreshing.value = false
        uni.stopPullDownRefresh()
      }, delay)
    }
  }

  function resolve() {
    isRefreshing.value = false
    uni.stopPullDownRefresh()
  }

  function reject(_err?: any) {
    isRefreshing.value = false
    uni.stopPullDownRefresh()
  }

  onPullDownRefresh(() => {
    trigger()
  })

  return {
    get isRefreshing() {
      return isRefreshing.value
    },
    trigger,
    resolve,
    reject,
  }
}