<template>
  <div class="lk-replay">
    <!-- ready -->
    <template v-if="replay && replay.state === 'ready' && replay.url">
      <video v-if="replay.kind === 'video'" ref="media" class="lk-video" :src="replay.url" controls preload="metadata" playsinline />
      <div v-else class="lk-audio">
        <q-icon name="graphic_eq" size="48px" color="primary" />
        <audio ref="media" :src="replay.url" controls preload="metadata" />
      </div>
      <div class="row items-center q-mt-md q-gutter-sm">
        <q-btn outline color="primary" icon="download" no-caps :label="replay.kind === 'video' ? 'Download video' : 'Download audio'" :href="`${replay.url}?download=true`" />
        <span class="lk-meta">{{ formatSize(replay.bytes) }} · {{ replay.kind === 'video' ? 'faces of other people are blurred' : 'audio only' }}</span>
      </div>
    </template>

    <!-- being made -->
    <div v-else-if="replay && (replay.state === 'queued' || replay.state === 'processing' || visualsBusy)" class="lk-replay-wait">
      <q-icon name="movie_filter" size="44px" color="primary" />
      <div class="lk-section-title q-mt-sm">Preparing the replay</div>
      <div class="lk-meta q-mb-md">{{ waitText }}</div>
      <q-linear-progress rounded size="8px" :value="(replay.percent || 0) / 100" :indeterminate="replay.state !== 'processing'" style="max-width: 360px; margin: 0 auto" />
      <div class="lk-meta q-mt-sm">Your notes are already ready. This runs in the background.</div>
    </div>

    <!-- failed -->
    <div v-else-if="replay && replay.state === 'failed'" class="lk-replay-wait">
      <q-icon name="error_outline" size="44px" color="negative" />
      <div class="lk-section-title q-mt-sm">The replay could not be made</div>
      <div class="lk-meta q-mb-md">Your recording is still on the server. You can try again.</div>
      <q-btn unelevated color="primary" icon="refresh" label="Try again" :loading="starting" @click="$emit('make')" />
    </div>

    <!-- none: an older lecture, or the original is gone -->
    <div v-else class="lk-replay-wait">
      <q-icon name="videocam_off" size="44px" class="lk-dim" />
      <div class="lk-section-title q-mt-sm">No replay for this lecture</div>
      <div class="lk-meta q-mb-md">{{ canMake ? 'It was processed before replays existed. You can make one now.' : 'The original recording is no longer on the server.' }}</div>
      <q-btn v-if="canMake" unelevated color="primary" icon="movie" label="Make the replay" :loading="starting" @click="$emit('make')" />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { formatSize } from '../util/format'

const props = defineProps({ replay: { type: Object, default: null }, canMake: Boolean, starting: Boolean })
defineEmits(['make'])
const media = ref(null)
const visualsBusy = computed(() => props.replay && ['queued', 'processing'].includes(props.replay.visuals_state))
const waitText = computed(() => {
  const r = props.replay
  if (r.state === 'processing') return `Blurring faces and converting the video${r.percent ? `: ${r.percent}%` : ''}`
  if (r.visuals_state === 'processing') return 'First looking at the board and screen, then the replay follows'
  return 'Waiting for its turn'
})

// jump to a moment of the lecture and play from there
function seek(seconds) {
  nextTick(() => {
    if (!media.value) return
    media.value.currentTime = seconds
    media.value.play().catch(() => {})
  })
}
defineExpose({ seek })
</script>

<style scoped>
.lk-video { width: 100%; max-height: 70vh; background: #000; border-radius: 12px; display: block; }
.lk-audio { display: flex; align-items: center; gap: 16px; padding: 20px; background: var(--lk-tint); border-radius: 12px; }
.lk-audio audio { flex: 1; min-width: 0; }
.lk-replay-wait { text-align: center; padding: 36px 16px; }
</style>
