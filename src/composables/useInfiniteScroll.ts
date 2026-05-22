// ============================================
//  useInfiniteScroll.ts - 无限滚动 / 加载更多 Hook
//  用于列表页滚动加载更多数据
// ============================================
import { ref, onMounted } from 'vue'

export interface UseInfiniteScrollOptions<T> {
  /** 数据加载函数 */
  loader: (params: { page: number; size: number }) => Promise<{ list: T[]; total: number }>
  /** 每页数量 */
  pageSize?: number
  /** 初始页码 */
  initialPage?: number
  /** 加载前回调 */
  beforeLoad?: () => boolean | void
  /** 加载完成后回调 */
  afterLoad?: (result: { list: T[]; total: number }) => void
}

export interface UseInfiniteScrollReturn<T> {
  /** 当前列表数据 */
  list: T[]
  /** 是否正在加载 */
  isLoading: { value: boolean }
  /** 是否还有更多数据 */
  hasMore: { value: boolean }
  /** 当前页码 */
  page: { value: number }
  /** 加载更多 */
  loadMore: () => Promise<void>
  /** 重置并重新加载（回到第一页） */
  reload: () => Promise<void>
  /** 是否为空（首次加载后且无数据） */
  isEmpty: { value: boolean }
}

export function useInfiniteScroll<T>(
  options: UseInfiniteScrollOptions<T>
): UseInfiniteScrollReturn<T> {
  const { loader, pageSize = 20, initialPage = 1, beforeLoad, afterLoad } = options

  const list = ref<T[]>([]) as any
  const isLoading = ref(false)
  const hasMore = ref(true)
  const page = ref(initialPage)
  const isEmpty = ref(false)
  const total = ref(0)

  async function load(reset = false): Promise<void> {
    if (isLoading.value) return

    // 重置
    if (reset) {
      page.value = initialPage
      hasMore.value = true
      list.value = []
      isEmpty.value = false
    }

    if (!hasMore.value) return

    // beforeLoad 返回 false 则阻止加载
    const canLoad = beforeLoad?.()
    if (canLoad === false) return

    isLoading.value = true

    try {
      const result = await loader({ page: page.value, size: pageSize })
      const items = result.list || []
      total.value = result.total || 0

      if (reset) {
        list.value = items
      } else {
        list.value.push(...items)
      }

      hasMore.value = items.length >= pageSize && list.value.length < total.value
      page.value++

      if (reset && items.length === 0) {
        isEmpty.value = true
      }

      afterLoad?.(result)
    } catch (err) {
      console.error('[useInfiniteScroll] load failed', err)
    } finally {
      isLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    return load(false)
  }

  async function reload(): Promise<void> {
    return load(true)
  }

  return {
    list,
    isLoading: { value: isLoading.value },
    hasMore: { value: hasMore.value },
    page: { value: page.value },
    loadMore,
    reload,
    isEmpty: { value: isEmpty.value },
  } as any
}