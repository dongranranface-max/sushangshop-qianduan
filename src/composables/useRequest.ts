// ============================================
//  useRequest.ts - 带 loading/error 状态的请求封装
//  替代在组件内手动管理 loading/error/ref
// ============================================
import { ref, readonly } from 'vue'

export interface UseRequestOptions<T> {
  /** 请求函数 */
  manual: () => Promise<T>
  /** 立即执行（默认 true） */
  immediate?: boolean
  /** 成功回调 */
  onSuccess?: (data: T) => void
  /** 失败回调 */
  onError?: (err: Error) => void
}

export interface UseRequestReturn<T> {
  data: Readonly<typeof _data>
  loading: Readonly<typeof _loading>
  error: Readonly<typeof _error>
  /** 手动触发请求 */
  run: () => Promise<T | undefined>
  /** 重置状态 */
  reset: () => void
}

const _data = ref<any>(null)
const _loading = ref(false)
const _error = ref<Error | null>(null)

export function useRequest<T>(options: UseRequestOptions<T>): UseRequestReturn<T> {
  const { manual, immediate = true, onSuccess, onError } = options

  async function run(): Promise<T | undefined> {
    if (_loading.value) return undefined
    _loading.value = true
    _error.value = null

    try {
      const result = await manual()
      _data.value = result
      onSuccess?.(result)
      return result
    } catch (err: any) {
      _error.value = err instanceof Error ? err : new Error(String(err))
      onError?.(_error.value)
      return undefined
    } finally {
      _loading.value = false
    }
  }

  function reset() {
    _data.value = null
    _error.value = null
    _loading.value = false
  }

  if (immediate) {
    run()
  }

  return {
    data: readonly(_data),
    loading: readonly(_loading),
    error: readonly(_error),
    run,
    reset,
  }
}

/** 分页请求 Hook */
export interface UsePageRequestOptions<T> extends UseRequestOptions<T> {
  params?: Record<string, any>
}

export interface UsePageRequestReturn<T> extends UseRequestReturn<T> {
  list: typeof _data
  page: number
  hasMore: boolean
  /** 加载更多 */
  loadMore: () => Promise<T | undefined>
  /** 重置并重新加载第一页 */
  reload: () => Promise<T | undefined>
}

export function usePageRequest<T>(
  manual: (params: Record<string, any>) => Promise<{ list: T[]; total: number }>,
  defaultParams: Record<string, any> = {}
): UsePageRequestReturn<T> {
  const list = ref<T[]>([]) as any
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const page = ref(1)
  const limit = ref(20)
  const hasMore = ref(true)
  const params = ref({ ...defaultParams })

  async function run(reset = false): Promise<T | undefined> {
    if (loading.value) return undefined
    if (reset) {
      page.value = 1
      hasMore.value = true
      list.value = []
    }
    if (!hasMore.value && !reset) return undefined

    loading.value = true
    error.value = null

    try {
      const p = { ...params.value, page: page.value, limit: limit.value }
      const result = await manual(p)
      const items = result.list || []

      if (reset) {
        list.value = items
      } else {
        list.value.push(...items)
      }

      hasMore.value = items.length >= limit.value
      page.value++
      return result as any
    } catch (err: any) {
      error.value = err instanceof Error ? err : new Error(String(err))
      return undefined
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    return run(false)
  }

  async function reload() {
    return run(true)
  }

  return {
    data: readonly(list),
    list,
    loading: readonly(loading),
    error: readonly(error),
    page: readonly(page),
    hasMore: readonly(hasMore),
    run,
    reset() {
      list.value = []
      page.value = 1
      hasMore.value = true
      error.value = null
    },
    loadMore,
    reload,
  }
}
