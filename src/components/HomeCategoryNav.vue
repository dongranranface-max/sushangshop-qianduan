<template>
  <view class="cat-nav" :class="{ 'cat-nav--animated': mounted }">
    <view
      v-for="(c, index) in displayList"
      :key="c.id"
      class="cat-nav__item"
      :class="[
        { 'cat-nav__item--all': c.id === ALL_ID },
        { 'cat-nav__item--active': c.id === selectedId },
        { 'cat-nav__item--pressed': pressedId === c.id },
      ]"
      :style="{ '--stagger': index }"
      @click.stop="onTap(c)"
      @touchstart="pressedId = c.id"
      @touchend="pressedId = null"
      @touchcancel="pressedId = null"
    >
      <!-- 图标圆 -->
      <view class="cat-nav__icon" :class="{ 'cat-nav__icon--all': c.id === ALL_ID }">
        <text class="cat-nav__abbr">{{ c.abbr }}</text>
      </view>
      <!-- 名称 -->
      <text class="cat-nav__name">{{ c.name }}</text>
      <!-- 激活指示器 -->
      <view v-if="c.id === selectedId" class="cat-nav__dot" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { HomeCategory } from '@/utils/category'
import { HOME_CATEGORY_FALLBACK } from '@/utils/category'

export type { HomeCategory }

const ALL_ID = '__all__'

const props = withDefaults(
  defineProps<{
    categories?: HomeCategory[]
    selectedId?: string
  }>(),
  {
    categories: () => [],
    selectedId: '',
  }
)

const emit = defineEmits<{
  (e: 'select', cat: HomeCategory): void
  (e: 'all'): void
}>()

const mounted = ref(false)
const pressedId = ref<string | null>(null)

onMounted(() => {
  setTimeout(() => {
    mounted.value = true
  }, 50)
})

const ABBR_MAP: Record<string, string> = {
  数码: '数', 电子: '数', 生活: '活', 食品: '食', 生鲜: '鲜',
  服饰: '服', 箱包: '包', 美妆: '美', 护肤: '护', 家电: '电', 母婴: '婴', 运动: '动',
}

function pickAbbr(name: string): string {
  for (const [k, v] of Object.entries(ABBR_MAP)) {
    if (name.includes(k)) return v
  }
  return name.slice(0, 1) || '类'
}

const FALLBACK = HOME_CATEGORY_FALLBACK.map((c) => ({
  ...c,
  abbr: pickAbbr(c.name),
}))

const displayList = computed(() => {
  const src = props.categories.length ? props.categories : FALLBACK
  const cats = src.slice(0, 8).map((c) => ({
    ...c,
    abbr: 'abbr' in c ? (c as { abbr: string }).abbr : pickAbbr(c.name),
  }))
  cats.push({ id: ALL_ID, name: '全部分类', abbr: '全' })
  return cats
})

function onTap(c: HomeCategory & { abbr?: string }) {
  if (c.id === ALL_ID) emit('all')
  else emit('select', c)
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
@import '@/styles/animations.scss';

.cat-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx 12rpx;
  margin-bottom: 0;

  // 交错进入动画
  &--animated .cat-nav__item {
    animation: slideUp var(--duration-slow) var(--ease-out) calc(var(--stagger) * 60ms) both;
  }
}

.cat-nav__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 8rpx;
  @include premium-surface($bg-secondary);
  border-radius: $radius-lg;
  text-align: center;
  cursor: pointer;
  // 过渡
  transition:
    transform var(--duration-base) var(--ease-spring),
    box-shadow var(--duration-base) var(--ease-default),
    background var(--duration-fast) ease;

  &:active {
    transform: scale(0.95);
  }

  &--pressed {
    transform: scale(0.96);
    box-shadow: 0 2rpx 8rpx rgba(26, 36, 56, 0.06);
  }

  &--active {
    background: $warm-yellow;
    border-color: $border-primary;
    box-shadow: $shadow-gold;

    .cat-nav__name {
      color: $accent-dark;
      font-weight: var(--weight-semibold);
    }
  }

  &--all .cat-nav__icon {
    background: $ai-gradient-soft;
    border-color: $border-color;
  }
}

.cat-nav__icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  border: 2rpx solid $border-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--duration-base) var(--ease-spring);

  .cat-nav__item:active & {
    transform: scale(1.08);
  }
}

.cat-nav__abbr {
  font-size: 26rpx;
  font-weight: var(--weight-heavy);
  color: $navy;
}

.cat-nav__name {
  font-size: 22rpx;
  color: $text-secondary;
  max-width: 100%;
  @include line-clamp(1);
  transition: color var(--duration-fast) ease;
}

.cat-nav__dot {
  position: absolute;
  bottom: 6rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: $accent;
}
</style>