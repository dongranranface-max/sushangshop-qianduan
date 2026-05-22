// ============================================
//  LaxImage.vue - 懒加载图片组件
//  支持：可视区懒加载 + placeholder + 加载动画 + 错误处理
// ============================================
<template>
  <view
    class="lax-image"
    :class="{ 'lax-image--loaded': isLoaded, 'lax-image--error': isError }"
    :style="containerStyle"
    @click="$emit('click')"
  >
    <!-- 占位图 -->
    <view v-if="!isLoaded && placeholder" class="lax-image__placeholder">
      <image class="lax-image__placeholder-img" :src="placeholder" mode="aspectFill" />
    </view>

    <!-- 加载中骨架屏 -->
    <view v-if="!isLoaded && showSkeleton" class="lax-image__skeleton shimmer" />

    <!-- 实际图片（懒加载） -->
    <image
      v-if="shouldLoad"
      class="lax-image__img"
      :class="{ 'lax-image__img--visible': isLoaded }"
      :src="isLoaded ? currentSrc : ''"
      :mode="mode"
      :aspect-ratio="aspectRatio"
      :style="{ paddingBottom: aspectRatio > 0 ? `${aspectRatio}%` : undefined }"
      @load="onImgLoad"
      @error="onImgError"
    />

    <!-- 加载动画遮罩 -->
    <view v-if="isLoading" class="lax-image__loading">
      <view class="lax-image__spinner" />
    </view>

    <!-- 错误状态 -->
    <view v-if="isError && showError" class="lax-image__error">
      <text class="lax-image__error-icon">🖼️</text>
      <text class="lax-image__error-text">{{ errorText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  /** 图片地址 */
  src?: string
  /** 是否懒加载（默认 true） */
  lazy?: boolean
  /** 占位图地址 */
  placeholder?: string
  /** 图片填充模式 */
  mode?: 'aspectFill' | 'aspectFit' | 'widthFix' | 'heightFix' | 'scaleToFill' | 'center'
  /** 宽高比（0=不设置，百分比字符串如 '75%' 用于 padding-bottom） */
  aspectRatio?: string | number
  /** 是否显示骨架屏（加载中） */
  showSkeleton?: boolean
  /** 是否显示错误状态 */
  showError?: boolean
  /** 错误文本 */
  errorText?: string
  /** 根节点 margin（懒加载可视区检测） */
  rootMargin?: string
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  lazy: true,
  placeholder: '',
  mode: 'aspectFill',
  aspectRatio: 0,
  showSkeleton: true,
  showError: true,
  errorText: '图片加载失败',
  rootMargin: '50px',
})

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'load', src: string): void
  (e: 'error', err: string): void
}>()

// 图片加载状态
const isLoaded = ref(false)
const isError = ref(false)
const isLoading = ref(false)
const currentSrc = ref('')
const shouldLoad = ref(false)

// 容器样式
const containerStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.aspectRatio > 0) {
    style.paddingBottom = typeof props.aspectRatio === 'string' ? props.aspectRatio : `${props.aspectRatio}%`
    style.position = 'relative'
    style.overflow = 'hidden'
  }
  return style
})

// 开始加载图片
function loadImage(url: string) {
  if (!url) return
  isLoading.value = true
  isError.value = false

  const img = uni.createImage()
  img.onload = () => {
    currentSrc.value = url
    isLoaded.value = true
    isLoading.value = false
    emit('load', url)
  }
  img.onerror = () => {
    isLoading.value = false
    isError.value = true
    emit('error', `failed to load: ${url}`)
  }
  img.src = url
}

function onImgLoad() {
  isLoaded.value = true
  isLoading.value = false
}

function onImgError() {
  isLoading.value = false
  isError.value = true
  emit('error', props.src)
}

// 懒加载逻辑
let intersectionObserver: any = null

function setupLazyObserver() {
  if (!props.lazy || !props.src) {
    shouldLoad.value = true
    return
  }

  // 等 DOM 就绪后再建立观察器
  uni.nextTick(() => {
    try {
      intersectionObserver = uni.createIntersectionObserver(null as any, {
        thresholds: [0, 0.1],
        rootMargin: props.rootMargin,
      })

      // 通过 $el 观察当前组件根节点
      intersectionObserver.observe('.lax-image', (res: any) => {
        if (res.intersectionRatio > 0 || res.intersectionRatio >= 0) {
          shouldLoad.value = true
          loadImage(props.src)
          // 只观察一次
          intersectionObserver.disconnect()
          intersectionObserver = null
        }
      })
    } catch {
      // 降级：立即加载
      shouldLoad.value = true
      loadImage(props.src)
    }
  })
}

// 立即加载模式
function loadImmediately() {
  shouldLoad.value = true
  if (props.src) {
    loadImage(props.src)
  }
}

onMounted(() => {
  if (props.lazy) {
    setupLazyObserver()
  } else {
    loadImmediately()
  }
})

onUnmounted(() => {
  if (intersectionObserver) {
    try {
      intersectionObserver.disconnect()
    } catch {
      // ignore
    }
    intersectionObserver = null
  }
})

// src 变化时重新加载
watch(
  () => props.src,
  (newSrc) => {
    if (!newSrc) return
    isLoaded.value = false
    isError.value = false
    currentSrc.value = ''

    if (props.lazy) {
      shouldLoad.value = false
      setupLazyObserver()
    } else {
      loadImage(newSrc)
    }
  }
)
</script>

<style lang="scss" scoped>
@import '@/styles/animations.scss';

.lax-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: $bg-tertiary;
  border-radius: inherit;

  // 默认 16:9 安全比例
  &--loaded {
    .lax-image__img {
      opacity: 1;
    }
    .lax-image__placeholder,
    .lax-image__skeleton {
      display: none;
    }
  }

  &--error {
    .lax-image__img {
      opacity: 0;
    }
  }
}

.lax-image__img {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;

  &--visible {
    opacity: 1;
  }
}

.lax-image__placeholder {
  position: absolute;
  inset: 0;

  .lax-image__placeholder-img {
    width: 100%;
    height: 100%;
  }
}

.lax-image__skeleton {
  position: absolute;
  inset: 0;
}

.lax-image__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 244, 241, 0.5);
}

.lax-image__spinner {
  @extend .loading-spinner;
}

.lax-image__error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: $bg-tertiary;

  .lax-image__error-icon {
    font-size: 48rpx;
    opacity: 0.5;
  }

  .lax-image__error-text {
    font-size: 22rpx;
    color: $text-muted;
  }
}
</style>