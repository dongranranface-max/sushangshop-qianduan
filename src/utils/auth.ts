// ============================================
//  auth.ts - 全局登录状态守卫
//  统一管理所有需要登录的操作
// ============================================

/**
 * 检查是否已登录
 * 返回 true = 已登录，false = 未登录
 */
export function isLoggedIn(): boolean {
  const token = uni.getStorageSync('token')
  return !!token && token.length > 0
}

/**
 * 检查是否已登录（带提示）
 * 已登录 → 执行回调
 * 未登录 → 弹出提示并跳转登录页
 */
export function requireAuth(callback?: () => void): boolean {
  if (isLoggedIn()) {
    callback?.()
    return true
  }
  uni.showToast({ title: '请先登录', icon: 'none' })
  setTimeout(() => {
    uni.navigateTo({ url: '/pages/auth/login' })
  }, 1000)
  return false
}

/**
 * 确保已登录（同步版本）
 * 返回登录状态，不做页面跳转
 */
export function checkAuth(): boolean {
  return isLoggedIn()
}

/**
 * 获取当前用户 ID（未登录返回空字符串）
 */
export function getCurrentUserId(): string {
  return uni.getStorageSync('userId') || ''
}

/**
 * 获取当前手机号
 */
export function getCurrentPhone(): string {
  return uni.getStorageSync('phone') || ''
}

/**
 * 清除登录状态（退出登录时调用）
 */
export function clearAuth() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userId')
  uni.removeStorageSync('phone')
  uni.removeStorageSync('nickname')
  uni.removeStorageSync('avatar')
  uni.removeStorageSync('level')
}
