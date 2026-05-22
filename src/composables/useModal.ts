// ============================================
//  useModal.ts - 模态框/Toast/Haptic 反馈 Hook
//  封装 uni.showToast / showModal / showLoading
// ============================================
import { ref } from 'vue'

export type ToastIcon = 'success' | 'none' | 'loading'

export interface ToastOptions {
  title: string
  icon?: ToastIcon
  duration?: number
  mask?: boolean
}

export interface UseModalReturn {
  /** 显示成功轻提示（1.5s） */
  success: (title: string, duration?: number) => void
  /** 显示错误轻提示（2s） */
  error: (title: string, duration?: number) => void
  /** 显示信息轻提示 */
  info: (title: string, duration?: number) => void
  /** 显示加载中（需手动 close） */
  loading: (title?: string) => () => void
  /** 显示确认对话框 */
  confirm: (options: ConfirmOptions) => Promise<boolean>
  /** 显示操作菜单 */
  actionSheet: (options: ActionSheetOptions) => Promise<number | null>
  /** 轻震动反馈（iOS/Android） */
  vibrate: (type?: 'light' | 'medium' | 'heavy') => void
}

interface ConfirmOptions {
  title?: string
  content: string
  confirmText?: string
  cancelText?: string
  confirmColor?: string
}

interface ActionSheetOptions {
  title?: string
  items: string[]
}

export function useModal(): UseModalReturn {
  function success(title: string, duration = 1500) {
    uni.showToast({ title, icon: 'success', duration })
  }

  function error(title: string, duration = 2000) {
    uni.showToast({ title, icon: 'none', duration })
  }

  function info(title: string, duration = 1500) {
    uni.showToast({ title, icon: 'none', duration })
  }

  function loading(title = '加载中...'): () => void {
    uni.showLoading({ title, mask: true })
    return () => uni.hideLoading()
  }

  async function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      uni.showModal({
        title: options.title || '提示',
        content: options.content,
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        confirmColor: options.confirmColor || '#1A2438',
        success: (res) => {
          resolve(res.confirm)
        },
        fail: () => {
          resolve(false)
        },
      })
    })
  }

  async function actionSheet(options: ActionSheetOptions): Promise<number | null> {
    return new Promise((resolve) => {
      uni.showActionSheet({
        title: options.title,
        itemList: options.items,
        success: (res) => {
          resolve(res.tapIndex)
        },
        fail: () => {
          resolve(null)
        },
      })
    })
  }

  function vibrate(type: 'light' | 'medium' | 'heavy' = 'medium') {
    // #ifdef APP-PLUS
    const vibrateMap = {
      light: 10,
      medium: 30,
      heavy: 50,
    }
    plus.device.vibrate(vibrateMap[type])
    // #endif
  }

  return {
    success,
    error,
    info,
    loading,
    confirm,
    actionSheet,
    vibrate,
  }
}