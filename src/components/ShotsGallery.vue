<template>
  <div>
    <div v-if="busy" class="lk-shots-wait">
      <q-spinner color="primary" size="28px" />
      <span>Looking at the board and the screen of the recording. Your notes will be updated when this is done.</span>
    </div>
    <div v-else-if="!shots.length" class="text-center q-py-lg">
      <q-icon name="photo_library" size="44px" class="lk-dim" />
      <div class="lk-section-title q-mt-sm">{{ emptyTitle }}</div>
      <div class="lk-meta">{{ emptyText }}</div>
    </div>

    <div v-if="shots.length" class="lk-shots">
      <button v-for="s in shots" :key="s.id" type="button" class="lk-shot" @click="open = s" :aria-label="`Picture at ${clock(s.t)}`">
        <span class="lk-shot-img"><img :src="s.url" :alt="`${label(s.kind)} at ${clock(s.t)}`" loading="lazy" /></span>
        <span class="lk-shot-meta">
          <span class="lk-chip info">{{ clock(s.t) }}</span>
          <span class="lk-meta">{{ label(s.kind) }}</span>
        </span>
        <span class="lk-shot-text">{{ s.text || s.description }}</span>
      </button>
    </div>

    <q-dialog :model-value="!!open" maximized-on-mobile @update:model-value="open = null">
      <q-card v-if="open" class="lk-shot-dialog">
        <q-card-section class="row items-center no-wrap q-pb-none">
          <div class="col"><span class="lk-chip info q-mr-sm">{{ clock(open.t) }}</span><span class="lk-meta">{{ label(open.kind) }}</span></div>
          <q-btn flat round dense icon="close" v-close-popup aria-label="Close" />
        </q-card-section>
        <q-card-section><img :src="open.url" class="lk-shot-full" :alt="`${label(open.kind)} at ${clock(open.t)}`" /></q-card-section>
        <q-card-section v-if="open.text || open.description" class="q-pt-none">
          <div class="lk-label q-mb-xs">What it says</div>
          <pre v-if="open.text" class="lk-shot-pre">{{ open.text }}</pre>
          <p v-if="open.description" class="lk-meta q-mt-sm q-mb-none">Figure: {{ open.description }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="primary" icon="download" no-caps label="Download picture" :href="`${open.url}?download=true`" />
          <q-btn v-if="canPlay" unelevated color="primary" icon="play_arrow" no-caps :label="`Play from ${clock(open.t)}`" v-close-popup @click="$emit('play', open.t)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { clock } from '../util/format'

defineProps({ shots: { type: Array, default: () => [] }, busy: Boolean, canPlay: Boolean, emptyTitle: { type: String, default: 'No board or screen content found' }, emptyText: { type: String, default: 'Pictures appear here when the recording shows a board, a slide or a screen.' } })
defineEmits(['play'])
const open = ref(null)
const label = (k) => ({ board: 'Board', slide: 'Slide on screen', screen: 'Screen' }[k] || 'Picture')
</script>

<style scoped>
.lk-shots { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.lk-shot { text-align: left; background: var(--lk-surface); border: 1px solid var(--lk-border); border-radius: 12px; padding: 0; cursor: pointer; overflow: hidden; display: flex; flex-direction: column; color: inherit; font: inherit; transition: box-shadow 0.18s, transform 0.18s; }
.lk-shot:hover { box-shadow: var(--lk-shadow-lg); transform: translateY(-2px); }
.lk-shot:focus-visible { outline: 2px solid var(--lk-primary); outline-offset: 2px; }
.lk-shot-img { display: block; background: var(--lk-surface-2); aspect-ratio: 16 / 10; overflow: hidden; }
.lk-shot-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lk-shot-meta { display: flex; align-items: center; gap: 8px; padding: 10px 12px 2px; }
.lk-shot-text { padding: 2px 12px 12px; font-size: 13px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; white-space: pre-line; }
.lk-shots-wait { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 10px; background: var(--lk-tint); color: var(--lk-link); margin-bottom: 16px; }
.lk-shot-dialog { width: 960px; max-width: 96vw; }
.lk-shot-full { width: 100%; max-height: 62vh; object-fit: contain; border-radius: 8px; background: var(--lk-surface-2); display: block; }
.lk-shot-pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: inherit; line-height: 1.55; background: var(--lk-surface-2); padding: 12px 14px; border-radius: 8px; max-height: 200px; overflow: auto; }
@media (prefers-reduced-motion: reduce) { .lk-shot { transition: none; } .lk-shot:hover { transform: none; } }
</style>
