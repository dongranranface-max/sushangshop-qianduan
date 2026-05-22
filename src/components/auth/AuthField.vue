<template>
  <view class="af">
    <view v-if="label" class="af__label">
      <text>{{ label }}</text>
      <text v-if="required" class="af__req">必填</text>
    </view>
    <view
      class="af__row"
      :class="{
        'af__row--underline': variant === 'underline',
        'af__row--focus': focused,
        'af__row--error': error,
        'af__row--ok': ok && !error,
      }"
    >
      <view v-if="icon" class="af__icon" :class="`af__icon--${icon}`">
        <text class="af__icon-text">{{ iconChar }}</text>
      </view>
      <input
        class="af__input"
        :value="modelValue"
        :type="inputType"
        :password="password"
        :maxlength="maxlength"
        :placeholder="placeholder"
        placeholder-class="af-ph"
        :confirm-type="confirmType"
        @input="onInput"
        @focus="emit('focus')"
        @blur="emit('blur')"
        @confirm="emit('confirm')"
      />
      <view v-if="clearable && modelValue" class="af__action" @click.stop="emit('update:modelValue', '')">
        <text>×</text>
      </view>
      <view v-else-if="passwordToggle" class="af__action" @click.stop="emit('toggle-pwd')">
        <text>{{ password ? '显示' : '隐藏' }}</text>
      </view>
      <slot name="suffix" />
    </view>
    <text v-if="error && errorText" class="af__err">{{ errorText }}</text>
    <slot name="hint" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    icon?: 'phone' | 'lock' | 'gift' | 'user'
    required?: boolean
    focused?: boolean
    error?: boolean
    ok?: boolean
    errorText?: string
    inputType?: string
    password?: boolean
    maxlength?: number
    clearable?: boolean
    passwordToggle?: boolean
    confirmType?: string
    variant?: 'boxed' | 'underline'
  }>(),
  {
    placeholder: '',
    inputType: 'text',
    maxlength: 140,
    confirmType: 'done',
    variant: 'boxed',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'input', v: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'toggle-pwd'): void
  (e: 'confirm'): void
}>()

const iconChar = computed(() => {
  const m: Record<string, string> = { phone: '☎', lock: '◆', gift: '★', user: '◎' }
  return props.icon ? m[props.icon] || '·' : ''
})

function onInput(e: { detail: { value: string } }) {
  const v = e.detail.value
  emit('update:modelValue', v)
  emit('input', v)
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.af {
  margin-bottom: 28rpx;
}
.af__label {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: var(--font-sm);
  font-weight: var(--weight-semibold);
  color: $text-secondary;
  margin-bottom: 12rpx;
}
.af__req {
  font-size: var(--font-xs);
  color: $danger;
  font-weight: var(--weight-semibold);
}
.af__row {
  display: flex;
  align-items: center;
  min-height: 96rpx;
  padding: 0 20rpx;
  background: $bg-tertiary;
  border: 2rpx solid transparent;
  border-radius: $radius-lg;
  transition: all 0.2s ease;
}
.af__row--focus {
  border-color: $border-primary;
  background: $bg-secondary;
  box-shadow: 0 0 0 6rpx rgba(196, 165, 116, 0.12);
}
.af__row--error {
  border-color: rgba(240, 113, 113, 0.65);
  box-shadow: 0 0 0 6rpx rgba(240, 113, 113, 0.08);
}
.af__row--ok {
  border-color: rgba(93, 212, 168, 0.45);
}

/* 奢侈品牌线条式输入 */
.af__row--underline {
  min-height: 88rpx;
  padding: 12rpx 0 8rpx;
  background: transparent;
  border: none;
  border-bottom: 2rpx solid $border-color;
  border-radius: 0;

  &.af__row--focus {
    border-bottom-color: $accent;
    background: transparent;
    box-shadow: none;
  }

  &.af__row--error {
    border-bottom-color: $danger;
    box-shadow: none;
  }

  &.af__row--ok {
    border-bottom-color: rgba(196, 165, 116, 0.65);
  }

  .af__icon {
    width: auto;
    height: auto;
    margin-right: 20rpx;
    padding: 0;
    background: transparent !important;
    border: none !important;
  }

  .af__icon-text {
    font-size: var(--font-sm);
    color: $text-muted;
    font-weight: var(--weight-medium);
    letter-spacing: 2rpx;
  }

  &.af__row--focus .af__icon-text {
    color: $accent-dark;
  }

  .af__input {
    height: 72rpx;
    font-size: var(--font-lg);
    letter-spacing: 1rpx;
  }

  :deep(.auth-code-btn) {
    margin-left: 8rpx;
    padding: 10rpx 0;
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    border-bottom: 2rpx solid $border-primary !important;
    color: $accent-dark !important;
  }
}
.af__icon {
  width: 52rpx;
  height: 52rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
  &--phone { background: $warm-yellow; }
  &--lock { background: $warm-blue; }
  &--gift { background: $warm-yellow; border: 1rpx solid $border-primary; }
  &--user { background: $bg-tertiary; }
}
.af__icon-text {
  font-size: 26rpx;
  color: $navy;
  font-weight: var(--weight-heavy);
}
.af__input {
  flex: 1;
  font-size: var(--font-md);
  color: $text-primary;
  height: 88rpx;
  font-family: $font-sans;
}
.af__action {
  padding: 8rpx 12rpx;
  font-size: var(--font-xs);
  color: $text-muted;
  flex-shrink: 0;
}
.af__err {
  display: block;
  margin-top: 10rpx;
  font-size: var(--font-xs);
  color: $danger;
}
:deep(.af-ph) {
  color: $text-muted;
  font-size: var(--font-md);
}
</style>
