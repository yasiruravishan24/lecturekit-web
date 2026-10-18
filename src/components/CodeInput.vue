<template>
  <div class="row no-wrap q-gutter-sm" role="group" aria-label="6-digit code">
    <input
      v-for="(_, i) in 6"
      :key="i"
      :ref="(el) => (boxes[i] = el)"
      :value="digits[i]"
      class="lk-code-box"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="1"
      :aria-label="`Digit ${i + 1}`"
      :disabled="disabled"
      @input="onInput(i, $event)"
      @keydown="onKey(i, $event)"
      @paste.prevent="onPaste($event)"
      @focus="$event.target.select()"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'

const props = defineProps({ modelValue: { type: String, default: '' }, disabled: Boolean })
const emit = defineEmits(['update:modelValue', 'complete'])
const boxes = ref([])
const digits = computed(() => props.modelValue.padEnd(6, ' ').split('').map((c) => (c === ' ' ? '' : c)))

function set(value) {
  const clean = value.replace(/\D/g, '').slice(0, 6)
  emit('update:modelValue', clean)
  if (clean.length === 6) emit('complete', clean)
}

function onInput(i, e) {
  const d = e.target.value.replace(/\D/g, '').slice(-1)
  const arr = digits.value.slice()
  arr[i] = d
  set(arr.join(''))
  e.target.value = d
  if (d && i < 5) nextTick(() => boxes.value[i + 1]?.focus())
}

function onKey(i, e) {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) {
    const arr = digits.value.slice()
    arr[i - 1] = ''
    set(arr.join(''))
    nextTick(() => boxes.value[i - 1]?.focus())
  } else if (e.key === 'ArrowLeft' && i > 0) boxes.value[i - 1]?.focus()
  else if (e.key === 'ArrowRight' && i < 5) boxes.value[i + 1]?.focus()
}

function onPaste(e) {
  const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  if (!text) return
  set(text)
  nextTick(() => boxes.value[Math.min(text.length, 5)]?.focus())
}

onMounted(() => boxes.value[0]?.focus())
defineExpose({ focus: () => boxes.value[0]?.focus() })
</script>

<style scoped>
.lk-code-box {
  width: 56px; height: 64px; text-align: center; font-size: 28px; font-family: Roboto, sans-serif;
  border: 1px solid #bdbdbd; border-radius: 4px; background: #fff; color: #212121; outline: none;
}
.lk-code-box:focus { border: 2px solid var(--lk-primary); }
@media (max-width: 420px) { .lk-code-box { width: 44px; height: 54px; font-size: 22px; } }
</style>
