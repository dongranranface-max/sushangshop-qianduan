<template>
  <view class="cat-nav">
    <view
      v-for="c in displayList"
      :key="c.id"
      class="cat-nav__item"
      :class="{ 'cat-nav__item--all': c.id === ALL_ID }"
      @click="onTap(c)"
    >
      <view class="cat-nav__icon" :class="{ 'cat-nav__icon--all': c.id === ALL_ID }">
        <text>{{ c.abbr }}</text>
      </view>
      <text class="cat-nav__name">{{ c.name }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HomeCategory } from '@/utils/category'
import { HOME_CATEGORY_FALLBACK } from '@/utils/category'

export type { HomeCategory }

const ALL_ID = '__all__'

const props = withDefaults(
  defineProps<{ categories?: HomeCategory[] }>(),
  { categories: () => [] }
)

const emit = defineEmits<{
  (e: 'select', cat: HomeCategory): void
  (e: 'all'): void
}>()

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

const FALLBACK: (HomeCategory & { abbr: string })[] = HOME_CATEGORY_FALLBACK.map((c) => ({
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

.cat-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx 12rpx;
  margin-bottom: 0;
}
.cat-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  &:active { opacity: 0.75; }
}
.cat-nav__icon {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: var(--weight-heavy);
  color: $navy;
  @include premium-surface($bg-secondary);
  border-radius: 50%;
  margin-bottom: 12rpx;
  &--all {
    background: $navy;
    color: $gold-light;
    border-color: transparent;
  }
}
.cat-nav__item--all .cat-nav__name {
  color: $text-accent;
  font-weight: var(--weight-bold);
}
.cat-nav__name {
  font-size: var(--font-xs);
  color: $text-secondary;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: var(--tracking-normal);
}
</style>
