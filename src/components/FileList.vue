<template>
  <div>
    <div v-for="(f, i) in files" :key="f.name + i" class="row items-center no-wrap q-py-xs">
      <q-icon :name="icon(f)" size="28px" color="primary" class="q-mr-sm" />
      <div class="col text-left" style="min-width: 0">
        <div class="ellipsis">{{ f.name }} <span class="lk-meta">· {{ formatSize(f.size) }}</span></div>
        <q-linear-progress v-if="progress >= 0" :value="progress / 100" rounded size="6px" class="q-mt-xs" />
        <div v-if="progress >= 0" class="lk-meta">Uploading {{ progress }}%</div>
      </div>
      <template v-if="!disabled">
        <q-btn v-if="reorder && files.length > 1" flat round dense icon="arrow_upward" :disable="i === 0" aria-label="Move up" @click="$emit('move', i, -1)" />
        <q-btn v-if="reorder && files.length > 1" flat round dense icon="arrow_downward" :disable="i === files.length - 1" aria-label="Move down" @click="$emit('move', i, 1)" />
        <q-btn flat round dense icon="close" aria-label="Remove file" @click="$emit('remove', i)" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { formatSize } from '../util/format'

defineProps({ files: { type: Array, required: true }, progress: { type: Number, default: -1 }, disabled: Boolean, reorder: Boolean })
defineEmits(['remove', 'move'])
const icon = (f) => (/\.(mp4|mov|webm|mkv)$/i.test(f.name) ? 'videocam' : /\.(pdf|pptx?|pps|ppsx|odp|docx?|odt|rtf)$/i.test(f.name) ? 'description' : 'audio_file')
</script>
