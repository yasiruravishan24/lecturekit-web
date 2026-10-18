<template>
  <!-- variant "drop": a dashed drop zone (the lecture recording). variant "row": a compact row (the slides). -->
  <div v-if="variant === 'drop'" class="lk-drop" :class="{ over }" @dragover.prevent="over = true" @dragleave.prevent="over = false" @drop.prevent="onDrop">
    <template v-if="!modelValue.length">
      <q-icon name="upload_file" size="40px" color="primary" />
      <div class="q-mt-sm">Drop your recording here</div>
      <div class="lk-meta q-mb-md">{{ hint }}</div>
      <q-btn outline color="primary" label="Choose file" :disable="disabled" @click="pick" />
    </template>
    <template v-else>
      <file-list :files="modelValue" :progress="progress" :disabled="disabled" :reorder="multiple" @remove="remove" @move="move" />
      <div v-if="modelValue.length > 1" class="lk-meta q-mt-sm">The parts are joined in this order into one lecture.</div>
      <q-btn v-if="multiple && !disabled" flat color="primary" no-caps icon="add" label="Add another part" class="q-mt-sm" @click="pick" />
    </template>
    <input ref="input" type="file" class="hidden" :multiple="multiple" :accept="acceptAttr" @change="onPick" />
  </div>

  <div v-else class="lk-card q-pa-md">
    <div class="row items-center no-wrap">
      <q-icon name="slideshow" size="32px" color="primary" class="q-mr-md" />
      <div class="col">
        <div>{{ title }}</div>
        <div class="lk-meta">{{ hint }}</div>
      </div>
      <q-btn outline color="primary" label="Choose file" :disable="disabled" @click="pick" />
    </div>
    <file-list v-if="modelValue.length" :files="modelValue" :disabled="disabled" :reorder="multiple" class="q-mt-md" @remove="remove" @move="move" />
    <input ref="input" type="file" class="hidden" :multiple="multiple" :accept="acceptAttr" @change="onPick" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import FileList from './FileList.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  variant: { type: String, default: 'drop' },
  extensions: { type: Array, required: true },       // allowed, lower case with the dot
  multiple: Boolean,
  hint: { type: String, default: '' },
  title: { type: String, default: '' },
  disabled: Boolean,
  progress: { type: Number, default: -1 },           // -1 = not uploading
})
const emit = defineEmits(['update:modelValue', 'rejected'])
const input = ref(null)
const over = ref(false)
const acceptAttr = computed(() => props.extensions.join(','))

const pick = () => input.value && input.value.click()
const extOf = (name) => { const i = name.lastIndexOf('.'); return i < 0 ? '' : name.slice(i).toLowerCase() }

function add(list) {
  const accepted = []
  const rejected = []
  for (const f of list) (props.extensions.includes(extOf(f.name)) ? accepted : rejected).push(f)
  if (rejected.length) emit('rejected', `${rejected.map((f) => f.name).join(', ')}: this file type is not supported.`)
  if (!accepted.length) return
  emit('update:modelValue', props.multiple ? [...props.modelValue, ...accepted] : [accepted[0]])
}

function onPick(e) { add([...e.target.files]); e.target.value = '' }
function onDrop(e) { over.value = false; if (!props.disabled) add([...e.dataTransfer.files]) }
function remove(i) { emit('update:modelValue', props.modelValue.filter((_, k) => k !== i)) }
function move(i, d) {
  const list = props.modelValue.slice()
  const j = i + d
  if (j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j], list[i]]
  emit('update:modelValue', list)
}
</script>
