// ============================================
//  usePageScroll.ts - 页面滚动状态 Hook
//  监听滚动方向、位置、吸顶/吸底
// ============================================
import { ref, onMounted, onUnmounted } from 'vue'
import { onPageScroll } from '@dcloudio/uni-app'

export interface UsePageScrollOptions {
  /** 滚动多少px后视为"已滚动" */
  scrollThreshold?: number
  /** 是否监听滚动方向 */
  trackDirection?: boolean
}

export interface UsePageScrollReturn {
  /** 当前滚动距离 */
  scrollTop: number
  /** 是否已滚动超过阈值 */
  isScrolled: boolean
  /** 滚动方向：'up' | 'down' | null */
  direction: 'up' | 'down' | null
  /** 是否正在向上滚动 */
  isScrollingUp: boolean
  /** 是否正在向下滚动 */
  isScrollingDown: boolean
}

export function usePageScroll(options: UsePageScrollOptions = {}): UsePageScrollReturn {
  const { scrollThreshold = 50, trackDirection = true } = options

  const scrollTop = ref(0)
  const isScrolled = ref(false)
  const direction = ref<'up' | 'down' | null>(null)
  let lastScrollTop = 0

  function handleScroll(e: { scrollTop: number }) {
    const current = e.scrollTop || 0

    // 滚动距离
    scrollTop.value = current
    isScrolled.value = current > scrollThreshold

    // 滚动方向
    if (trackDirection) {
      if (current > lastScrollTop) {
        direction.value = 'down'
      } else if (current < lastScrollTop) {
        direction.value = 'up'
      }
      lastScrollTop = current
    }
  }

  onMounted(() => {
    onPageScroll(handleScroll)
  })

  return {
    get scrollTop() {
      return scrollTop.value
    },
    get isScrolled() {
      return isScrolled.value
    },
    get direction() {
      return direction.value
    },
    get isScrollingUp() {
      return direction.value === 'up'
    },
    get isScrollingDown() {
      return direction.value === 'down'
    },
  }
}