// ============================================
//  useCountdown.ts - 倒计时 composable
//  用于：获取验证码倒计时、限时抢购等场景
// ============================================
import { ref, computed, onUnmounted } from 'vue'

export interface UseCountdownOptions {
  /** 总秒数（默认 60s） */
  totalSeconds?: number
  /** 倒计时结束时回调 */
  onComplete?: () => void
}

export interface UseCountdownReturn {
  /** 剩余秒数 */
  seconds: typeof _seconds
  /** 是否正在倒计时 */
  isRunning: typeof _isRunning
  /** 格式化显示 "60s" */
  display: ReturnType<typeof computed<string>>
  /** 显示文本（可自定义后缀） */
  displayText: (suffix?: string) => string
  /** 开始倒计时 */
  start: (seconds?: number) => void
  /** 暂停 */
  pause: () => void
  /** 重置 */
  reset: () => void
  /** 停止 */
  stop: () => void
}

const _seconds = ref(0)
const _isRunning = ref(false)
let _timer: ReturnType<typeof setInterval> | null = null
let _onCompleteCallback: (() => void) | null = null

export function useCountdown(options: UseCountdownOptions = {}): UseCountdownReturn {
  const { totalSeconds = 60, onComplete } = options
  _onCompleteCallback = onComplete || null

  function clearTimer() {
    if (_timer) {
      clearInterval(_timer)
      _timer = null
    }
  }

  function start(seconds: number = totalSeconds) {
    clearTimer()
    _seconds.value = seconds
    _isRunning.value = true

    _timer = setInterval(() => {
      _seconds.value--
      if (_seconds.value <= 0) {
        _seconds.value = 0
        _isRunning.value = false
        clearTimer()
        _onCompleteCallback?.()
      }
    }, 1000)
  }

  function pause() {
    clearTimer()
    _isRunning.value = false
  }

  function reset() {
    clearTimer()
    _seconds.value = 0
    _isRunning.value = false
  }

  function stop() {
    reset()
  }

  const display = computed(() =>
    _seconds.value > 0 ? `${_seconds.value}s` : ''
  )

  function displayText(suffix = 's'): string {
    if (!_isRunning.value || _seconds.value <= 0) return ''
    return `${_seconds.value}${suffix}`
  }

  onUnmounted(() => {
    clearTimer()
  })

  return {
    seconds: _seconds,
    isRunning: _isRunning,
    display,
    displayText,
    start,
    pause,
    reset,
    stop,
  }
}

/**
 * 简洁版 useCountdown（多实例支持）
 * 每个调用独立，不共享状态
 */
export function useCountdownSimple(defaultSeconds = 60) {
  const seconds = ref(0)
  const isRunning = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  function start(s = defaultSeconds) {
    stop()
    seconds.value = s
    isRunning.value = true
    timer = setInterval(() => {
      seconds.value--
      if (seconds.value <= 0) {
        seconds.value = 0
        isRunning.value = false
        clearInterval(timer!)
      }
    }, 1000)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isRunning.value = false
  }

  onUnmounted(stop)

  return { seconds, isRunning, start, stop }
}
