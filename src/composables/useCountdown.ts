// ============================================
//  useCountdown.ts - 倒计时 Hook
// ============================================
import { ref, onUnmounted } from 'vue'

export interface UseCountdownOptions {
  /** 初始秒数 */
  seconds: number
  /** 立即开始 */
  immediate?: boolean
  /** 每秒回调 */
  onTick?: (remaining: number) => void
  /** 结束回调 */
  onComplete?: () => void
}

export interface UseCountdownReturn {
  remaining: number
  /** 格式化 mm:ss */
  formatted: string
  /** 重置倒计时 */
  reset: (seconds?: number) => void
  /** 暂停 */
  pause: () => void
  /** 继续 */
  resume: () => void
  /** 是否运行中 */
  isRunning: boolean
}

export function useCountdown(options: UseCountdownOptions): UseCountdownReturn {
  const { seconds: initialSeconds, immediate = true, onTick, onComplete } = options

  const remaining = ref(initialSeconds)
  const isRunning = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  function pad(n: number): string {
    return n < 10 ? `0${n}` : String(n)
  }

  const formatted = (): string => {
    const m = Math.floor(remaining.value / 60)
    const s = remaining.value % 60
    return `${pad(m)}:${pad(s)}`
  }

  function clearTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function start() {
    if (isRunning.value) return
    isRunning.value = true

    timer = setInterval(() => {
      if (remaining.value > 0) {
        remaining.value--
        onTick?.(remaining.value)
      } else {
        clearTimer()
        isRunning.value = false
        onComplete?.()
      }
    }, 1000)
  }

  function pause() {
    clearTimer()
    isRunning.value = false
  }

  function resume() {
    if (remaining.value <= 0) return
    start()
  }

  function reset(seconds = initialSeconds) {
    clearTimer()
    remaining.value = seconds
    isRunning.value = false
  }

  onUnmounted(() => {
    clearTimer()
  })

  if (immediate) {
    start()
  }

  return {
    get remaining() {
      return remaining.value
    },
    get formatted() {
      return formatted()
    },
    reset,
    pause,
    resume,
    get isRunning() {
      return isRunning.value
    },
  } as any
}