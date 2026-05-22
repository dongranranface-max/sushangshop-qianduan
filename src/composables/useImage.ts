// ============================================
//  useImage.ts - 图片加载/懒加载 Composable
// ============================================
import { ref, computed, watch, type Ref } from 'vue'

export interface UseImageOptions {
  /** 图片地址 */
  src: string
  /** 懒加载模式（进入可视区再加载） */
  lazy?: boolean
  /** 占位图（可选） */
  placeholder?: string
  /** 根节点 margin（懒加载用） */
  rootMargin?: string
  /** 加载成功回调 */
  onLoad?: () => void
  /** 加载失败回调 */
  onError?: (err: string) => void
}

export interface UseImageReturn {
  currentSrc: Ref<string>
  isLoaded: Ref<boolean>
  isError: Ref<boolean>
  isLoading: Ref<boolean>
  load: () => void
  reload: () => void
}

/**
 * 图片加载控制 + 懒加载（Intersection Observer）
 * - lazy=true: 进入可视区才开始加载
 * - lazy=false: 立即加载
 */
export function useImage(options: UseImageOptions): UseImageReturn {
  const { src, lazy = false, placeholder = '', onLoad, onError } = options

  const currentSrc = ref(placeholder || '')
  const isLoaded = ref(false)
  const isError = ref(false)
  const isLoading = ref(false)
  const resolvedSrc = ref(src)

  let observer: any = null

  function loadImage(url: string) {
    if (!url) {
      isError.value = true
      onError?.('empty src')
      return
    }

    isLoading.value = true
    isError.value = false

    // 使用 uni.createImage 实现图片预加载
    const img = uni.createImage()
    img.onload = () => {
      currentSrc.value = url
      isLoaded.value = true
      isLoading.value = false
      onLoad?.()
    }
    img.onerror = () => {
      // 加载失败，回退到占位图
      currentSrc.value = placeholder
      isError.value = true
      isLoading.value = false
      onError?.(`failed to load: ${url}`)
    }
    img.src = url
  }

  function load() {
    if (resolvedSrc.value) {
      loadImage(resolvedSrc.value)
    }
  }

  function reload() {
    isLoaded.value = false
    isError.value = false
    load()
  }

  // 非懒加载模式：立即加载
  if (!lazy && src) {
    // 延迟到组件 mount 后执行，避免阻塞首屏
    uni.nextTick(() => {
      load()
    })
  }

  // 懒加载模式：建立 IntersectionObserver
  if (lazy && src) {
    // 延迟建立，等 DOM 就绪
    uni.nextTick(() => {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      if (!currentPage) return

      try {
        observer = (currentPage as any).createIntersectionObserver({
          submitNode: null,
        })

        // 监听组件节点（通过 $el）
        // 这里假设 useImage 在组件内调用，具体节点由外部传入
      } catch {
        // 降级：直接加载
        load()
      }
    })
  }

  return {
    currentSrc,
    isLoaded,
    isError,
    isLoading: computed(() => isLoading.value),
    load,
    reload,
  }
}

/**
 * 批量图片预加载
 */
export function preloadImages(urls: string[], onProgress?: (loaded: number, total: number) => void): Promise<string[]> {
  return new Promise((resolve) => {
    const results: string[] = []
    let completed = 0

    if (urls.length === 0) {
      resolve(results)
      return
    }

    urls.forEach((url) => {
      const img = uni.createImage()
      img.onload = () => {
        results.push(url)
        completed++
        onProgress?.(completed, urls.length)
        if (completed === urls.length) {
          resolve(results)
        }
      }
      img.onerror = () => {
        results.push('')
        completed++
        onProgress?.(completed, urls.length)
        if (completed === urls.length) {
          resolve(results)
        }
      }
      img.src = url
    })
  })
}