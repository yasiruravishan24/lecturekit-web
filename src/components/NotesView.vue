<template>
  <q-card flat bordered class="lk-card">
    <q-tabs v-model="tab" align="left" indicator-color="primary" active-color="primary" class="lk-no-print" style="border-bottom: 1px solid var(--lk-border)">
      <q-tab name="full" icon="description" label="Full notes" />
      <q-tab name="short" icon="short_text" label="Short notes" />
      <q-tab name="quiz" icon="quiz" :label="`Quiz${quizCount != null ? ` (${quizCount})` : ''}`" />
      <q-tab name="moments" icon="photo_library" :label="`Key moments${shots.length ? ` (${shots.length})` : ''}`" />
      <q-tab name="recording" icon="play_circle" label="Recording" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated class="lk-print-all">
      <q-tab-panel name="full">
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-4 lk-no-print">
            <q-card flat bordered class="lk-card q-mb-md">
              <q-card-section class="q-pb-none lk-label">Topics</q-card-section>
              <q-list>
                <q-item v-for="(t, i) in notes.full_notes" :key="i" clickable :active="active === i" active-class="lk-active" @click="goTo(i)">
                  <q-item-section>{{ t.heading }}</q-item-section>
                </q-item>
              </q-list>
            </q-card>
            <q-card flat bordered class="lk-card">
              <q-card-section class="q-pb-none lk-label">Built from</q-card-section>
              <q-list>
                <q-item><q-item-section avatar><q-icon name="mic" color="primary" /></q-item-section><q-item-section>Lecture audio</q-item-section></q-item>
                <q-item v-if="slideCount"><q-item-section avatar><q-icon name="slideshow" color="purple" /></q-item-section><q-item-section>Slides ({{ plural(slideCount, 'file') }})</q-item-section></q-item>
              </q-list>
            </q-card>
          </div>
          <div class="col-12 col-md-8">
            <section v-for="(t, i) in notes.full_notes" :id="`topic-${i}`" :key="i" class="q-mb-lg">
              <h2 style="font-size: 18px; font-weight: 500; margin: 0 0 8px">{{ t.heading }}</h2>
              <div class="lk-topic-block">
                <div class="lk-label text-primary">Summary</div>
                <div>{{ t.summary }}</div>
              </div>
              <div v-if="t.key_points && t.key_points.length" class="lk-topic-block">
                <div class="lk-label text-primary">Key points</div>
                <ul><li v-for="(k, j) in t.key_points" :key="j">{{ k }}</li></ul>
              </div>
            </section>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="short">
        <div class="lk-label q-mb-sm">Short revision notes</div>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.8"><li v-for="(s, i) in notes.short_notes" :key="i">{{ s }}</li></ul>
      </q-tab-panel>

      <q-tab-panel name="quiz" class="lk-no-print">
        <div v-if="quizCount != null" class="q-mb-md">
          {{ plural(quizCount, 'question') }}. The correct answers are shown after you submit the whole quiz.
        </div>
        <q-btn unelevated color="primary" icon="quiz" label="Take quiz" :to="`/quiz/${sessionId}`" />
        <div v-if="attempts.length" class="q-mt-lg">
          <div class="lk-label q-mb-sm">Your attempts</div>
          <q-list bordered separator style="max-width: 420px; border-color: var(--lk-border); border-radius: 4px">
            <q-item v-for="a in attempts" :key="a.id" dense>
              <q-item-section>{{ a.score }} / {{ a.total }}</q-item-section>
              <q-item-section side>{{ formatDate(a.submitted_at, true) }}</q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-tab-panel>

      <q-tab-panel name="moments" class="lk-no-print">
        <shots-gallery :shots="shots" :busy="visualsBusy" :can-play="!!(replay && replay.state === 'ready')" :empty-title="momentsEmpty.title" :empty-text="momentsEmpty.text" @play="playFrom" />
      </q-tab-panel>

      <q-tab-panel name="recording" class="lk-no-print">
        <replay-player ref="player" :replay="replay" :can-make="canMakeReplay" :starting="startingReplay" @make="$emit('make-replay')" />
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { formatDate, plural } from '../util/format'
import ReplayPlayer from './ReplayPlayer.vue'
import ShotsGallery from './ShotsGallery.vue'

const props = defineProps({
  notes: { type: Object, required: true },
  sessionId: { type: [Number, String], required: true },
  slideCount: { type: Number, default: 0 },
  quizCount: { type: Number, default: null },
  attempts: { type: Array, default: () => [] },
  shots: { type: Array, default: () => [] },
  replay: { type: Object, default: null },
  visualsBusy: Boolean,
  canMakeReplay: Boolean,
  startingReplay: Boolean,
})
defineEmits(['make-replay'])
const tab = ref('full')
const player = ref(null)

// "Play from 12:30": open the recording tab and jump there
async function playFrom(seconds) {
  tab.value = 'recording'
  await nextTick()
  setTimeout(() => player.value && player.value.seek(seconds), 400)
}

const momentsEmpty = computed(() => (props.replay && props.replay.kind === 'audio'
  ? { title: 'This recording has no picture', text: 'Pictures of the board and screen come from video recordings.' }
  : { title: 'No board or screen content found', text: 'Pictures appear here when the recording shows a board, a slide or a screen.' }))
const active = ref(0)

function goTo(i) {
  active.value = i
  const el = document.getElementById(`topic-${i}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>
