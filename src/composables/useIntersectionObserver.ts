// ============================================
//  useIntersectionObserver.ts
//  懒加载 + 可见性检测 Composable
// ============================================
import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface LazyOptions {
  root?: string
  margin?: string
  threshold?: number
  once?: boolean
}

export function useIntersectionObserver(
  target: Ref<HTMLElement | null>,
  callback: (isVisible: boolean) => void,
  options: LazyOptions = {}
) {
  const { margin = '50px', threshold = 0.1, once = true } = options

  let observer: any = null

  onMounted(() => {
    if (!target.value) return

    observer = uni.createIntersectionObserver(null as any, {
      thresholds: [0, threshold],
      rootMargin: margin,
    })

    observer.relativeToViewport(margin)

    observer.observe(target.value, (res: any) => {
      const isVisible = res.intersectionRatio > 0
      callback(isVisible)
      if (isVisible && once && observer) {
        observer.disconnect()
        observer = null
      }
    })
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return { observer }
}

export function useLazyImage(src: Ref<string>, placeholder = '') {
  const loaded = ref(false)
  const error = ref(false)
  const currentSrc = ref(placeholder)

  function load() {
    if (!src.value) return
    error.value = false

    const img = uni.createImage()
    img.onload = () => {
      currentSrc.value = src.value
      loaded.value = true
    }
    img.onerror = () => {
      error.value = true
      currentSrc.value = placeholder
      loaded.value = true
    }
    img.src = src.value
  }

  return { loaded, error, currentSrc, load }
}

export function useDebounce<T extends (...args: any[]) => void>(fn: T, delay = 300): T {
  let timer: ReturnType<typeof setTimeout> | null = null

  const debounced = ((...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }) as T

  return debounced
}

export function useThrottle<T extends (...args: any[]) => void>(fn: T, delay = 300): T {
  let lastCall = 0

  const throttled = ((...args: any[]) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }) as T

  return throttled
}