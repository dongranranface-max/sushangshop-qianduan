// ============================================
//  useTabSwitch.ts - Tab 切换动画 Hook
//  支持：滑动指示器 + 内容渐入 + 历史记录
// ============================================
import { ref, computed } from 'vue'

export interface TabItem {
  key: string | number
  label: string
  abbr?: string
}

export interface UseTabSwitchOptions {
  /** Tab 列表 */
  tabs: TabItem[]
  /** 默认选中 key */
  defaultKey?: string | number
  /** 切换动画时长 ms */
  duration?: number
  /** 切换前回调（返回 false 可阻止切换） */
  beforeChange?: (from: string | number, to: string | number) => boolean | void
}

export interface UseTabSwitchReturn {
  /** 当前选中 key */
  activeKey: { value: string | number }
  /** 当前选中索引 */
  activeIndex: number
  /** Tab 列表 */
  tabs: TabItem[]
  /** 切换到指定 key */
  switchTo: (key: string | number) => void
  /** 切换到指定索引 */
  switchToIndex: (index: number) => void
  /** 下一步（循环） */
  next: () => void
  /** 上一步（循环） */
  prev: () => void
  /** 是否为指定 key */
  isActive: (key: string | number) => boolean
}

export function useTabSwitch(options: UseTabSwitchOptions): UseTabSwitchReturn {
  const { tabs, defaultKey, beforeChange } = options

  const activeKey = ref<string | number>(defaultKey ?? tabs[0]?.key ?? '')
  const isAnimating = ref(false)

  const activeIndex = computed(() => {
    return tabs.findIndex((t) => t.key === activeKey.value)
  })

  async function switchTo(key: string | number) {
    if (isAnimating.value) return
    const from = activeKey.value
    const to = key
    if (from === to) return

    // beforeChange 钩子
    const canChange = beforeChange?.(from, to)
    if (canChange === false) return

    isAnimating.value = true
    activeKey.value = to

    setTimeout(() => {
      isAnimating.value = false
    }, options.duration ?? 250)
  }

  function switchToIndex(index: number) {
    if (index < 0 || index >= tabs.length) return
    switchTo(tabs[index].key)
  }

  function next() {
    const nextIndex = (activeIndex.value + 1) % tabs.length
    switchToIndex(nextIndex)
  }

  function prev() {
    const prevIndex = (activeIndex.value - 1 + tabs.length) % tabs.length
    switchToIndex(prevIndex)
  }

  function isActive(key: string | number) {
    return activeKey.value === key
  }

  return {
    activeKey,
    get activeIndex() {
      return activeIndex.value
    },
    tabs,
    switchTo,
    switchToIndex,
    next,
    prev,
    isActive,
  }
}