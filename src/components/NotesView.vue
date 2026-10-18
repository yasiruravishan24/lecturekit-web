<template>
  <q-card flat bordered class="lk-card lk-notes-card">
    <q-tabs v-model="tab" align="left" indicator-color="primary" active-color="primary" class="lk-no-print" style="border-bottom: 1px solid var(--lk-border)">
      <q-tab name="full" icon="description" label="Full notes" />
      <q-tab name="short" icon="short_text" label="Short notes" />
      <q-tab name="quiz" icon="quiz" :label="`Quiz${quizCount != null ? ` (${quizCount})` : ''}`" />
      <q-tab name="moments" icon="photo_library" :label="`Key moments${shots.length ? ` (${shots.length})` : ''}`" />
      <q-tab name="recording" icon="play_circle" label="Recording" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated class="lk-print-all">
      <q-tab-panel name="full" class="lk-full-panel">
        <div class="lk-fullwrap">
          <aside class="lk-left lk-no-print">
            <q-card flat bordered class="lk-card q-mb-md">
              <q-card-section class="q-pb-md lk-label">Topics</q-card-section>
              <q-list role="tablist" aria-orientation="vertical" aria-label="Topics" class="q-pb-sm">
                <q-item v-for="(t, i) in notes.full_notes" :key="i" clickable role="tab" :aria-selected="active === i" :active="active === i" active-class="lk-active" @click="goTo(i)">
                  <q-item-section avatar class="lk-topic-no">{{ i + 1 }}</q-item-section>
                  <q-item-section>{{ t.heading }}</q-item-section>
                </q-item>
              </q-list>
            </q-card>
            <q-card flat bordered class="lk-card">
              <q-card-section class="q-pb-md lk-label">Built from</q-card-section>
              <q-list class="q-pb-sm">
                <q-item><q-item-section avatar><q-icon name="mic" color="primary" /></q-item-section><q-item-section>Lecture audio</q-item-section></q-item>
                <q-item v-if="shots.length"><q-item-section avatar><q-icon name="draw" color="teal" /></q-item-section><q-item-section>Board and screen</q-item-section></q-item>
                <q-item v-else-if="visualsBusy"><q-item-section avatar><q-spinner color="teal" size="22px" /></q-item-section><q-item-section class="lk-dim">Board and screen (being read)</q-item-section></q-item>
                <q-item v-if="slideCount"><q-item-section avatar><q-icon name="slideshow" color="purple" /></q-item-section><q-item-section>Slides</q-item-section></q-item>
              </q-list>
            </q-card>
          </aside>

          <div class="lk-right">
            <div ref="scroller" class="lk-topic-scroll">
              <section v-for="(t, i) in notes.full_notes" v-show="active === i" :id="`topic-${i}`" :key="i" class="lk-topic" role="tabpanel">
                <h2 class="lk-topic-title">{{ t.heading }}</h2>
                <div class="lk-summary">
                  <div class="lk-label text-primary">Summary</div>
                  <p>{{ t.summary }}</p>
                </div>
                <div v-if="t.key_points && t.key_points.length" class="lk-label text-primary lk-kp-head">Key points · {{ t.key_points.length }}</div>
                <ol v-if="t.key_points && t.key_points.length" class="lk-kp">
                  <li v-for="(k, j) in t.key_points" :key="j"><span class="lk-kp-n">{{ j + 1 }}</span><span>{{ k }}</span></li>
                </ol>
              </section>
            </div>
            <div v-if="notes.full_notes.length > 1" class="lk-pager lk-no-print">
              <q-btn flat no-caps icon="arrow_back" label="Previous topic" :disable="active === 0" @click="goTo(active - 1)" />
              <span class="lk-meta">Topic {{ active + 1 }} of {{ notes.full_notes.length }}</span>
              <q-btn flat color="primary" no-caps icon-right="arrow_forward" label="Next topic" :disable="active === notes.full_notes.length - 1" @click="goTo(active + 1)" />
            </div>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="short" class="lk-short-panel">
        <div class="lk-short-head">
          <div>
            <div class="lk-short-title">Quick revision</div>
            <div class="lk-meta">{{ plural(notes.short_notes.length, 'point') }} to remember. Tick each one when you know it.</div>
          </div>
          <div class="lk-short-count lk-no-print">{{ known.size }} / {{ notes.short_notes.length }}</div>
        </div>
        <q-linear-progress :value="notes.short_notes.length ? known.size / notes.short_notes.length : 0" rounded size="6px" color="positive" track-color="grey-3" class="lk-no-print q-mb-md" />
        <div class="lk-short-grid">
          <button v-for="(s, i) in notes.short_notes" :key="i" type="button" class="lk-short-card" :class="{ known: known.has(i) }"
                  :aria-pressed="known.has(i)" @click="toggleKnown(i)">
            <span class="lk-short-n">{{ known.has(i) ? '✓' : i + 1 }}</span>
            <span>{{ s }}</span>
          </button>
        </div>
      </q-tab-panel>

      <q-tab-panel name="quiz" class="lk-no-print">
        <div class="lk-quizwrap">
          <section class="lk-quiz-hero">
            <div class="lk-quiz-icon"><q-icon name="quiz" size="30px" /></div>
            <div class="lk-quiz-title">{{ attempts.length ? 'Try again and beat your score' : 'Test what you learned' }}</div>
            <div class="lk-meta">Multiple choice, one answer each. The correct answers and explanations appear after you submit the whole quiz.</div>
            <div class="lk-quiz-stats">
              <div><b>{{ quizCount != null ? quizCount : '-' }}</b><span>Questions</span></div>
              <div><b>{{ quizCount != null ? `${Math.max(1, Math.round(quizCount * 0.75))} min` : '-' }}</b><span>About</span></div>
              <div><b>{{ best == null ? '-' : `${best}%` }}</b><span>Best score</span></div>
            </div>
            <q-btn unelevated color="primary" size="lg" no-caps icon="play_arrow" :label="attempts.length ? 'Retake quiz' : 'Take quiz'" :to="`/quiz/${sessionId}`" class="full-width" />
          </section>

          <section class="lk-quiz-history">
            <div class="lk-label q-mb-sm">Your attempts</div>
            <div v-if="!attempts.length" class="lk-quiz-none">
              <q-icon name="history" size="28px" />
              <div>No attempts yet. Your scores will be listed here.</div>
            </div>
            <ul v-else class="lk-attempts">
              <li v-for="(a, i) in attempts" :key="a.id">
                <span class="lk-attempt-n">#{{ attempts.length - i }}</span>
                <div class="lk-attempt-body">
                  <div class="lk-attempt-top"><b>{{ a.score }} / {{ a.total }}</b><span class="lk-meta">{{ formatDate(a.submitted_at, true) }}</span></div>
                  <div class="lk-bar"><span :class="barClass(a)" :style="{ width: pct(a) + '%' }" /></div>
                </div>
                <span class="lk-attempt-pct">{{ pct(a) }}%</span>
              </li>
            </ul>
          </section>
        </div>
      </q-tab-panel>

      <q-tab-panel name="moments" class="lk-no-print lk-mom-panel">
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
const pct = (a) => (a.total ? Math.round((100 * a.score) / a.total) : 0)
const barClass = (a) => (pct(a) >= 70 ? 'good' : pct(a) >= 40 ? 'mid' : 'low')
const best = computed(() => (props.attempts.length ? Math.max(...props.attempts.map(pct)) : null))
const scroller = ref(null)
const known = ref(new Set())
function toggleKnown(i) {
  const s = new Set(known.value)
  s.has(i) ? s.delete(i) : s.add(i)
  known.value = s
}

function goTo(i) {
  if (i < 0 || i >= props.notes.full_notes.length) return
  active.value = i
  nextTick(() => { if (scroller.value) scroller.value.scrollTop = 0 })      // every topic starts at its top
}
</script>

<style scoped>
.lk-mom-panel { height: 100%; }
@media (min-width: 1024px) { .lk-mom-panel { overflow: hidden; } }
.lk-short-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin-bottom: 10px; }
.lk-short-title { font-size: 20px; font-weight: 500; letter-spacing: -0.01em; }
.lk-short-count { font-size: 14px; font-weight: 500; color: var(--lk-primary); }
.lk-short-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
.lk-short-card { display: flex; gap: 12px; align-items: flex-start; text-align: left; font: inherit; color: inherit; line-height: 1.55; cursor: pointer; background: var(--lk-surface); border: 1px solid var(--lk-border); border-radius: 12px; padding: 12px 16px; align-items: center; transition: border-color .15s, background .15s; }
.lk-short-card:hover { border-color: var(--lk-primary); }
.lk-short-card:focus-visible { outline: 2px solid var(--lk-primary); outline-offset: 2px; }
.lk-short-card.known { background: var(--lk-tint); border-color: var(--lk-positive); }
.lk-short-card.known > span:last-child { opacity: 0.7; }
.lk-short-n { flex: none; width: 26px; height: 26px; border-radius: 50%; background: var(--lk-tint); color: var(--lk-primary); font-size: 13px; font-weight: 500; display: grid; place-items: center; }
.lk-short-card.known .lk-short-n { background: var(--lk-positive); color: #fff; }
.lk-quizwrap { display: grid; grid-template-columns: minmax(280px, 400px) minmax(0, 1fr); gap: 28px; align-items: start; }
.lk-quiz-hero { background: var(--lk-tint); border-radius: 16px; padding: 24px; text-align: center; }
.lk-quiz-icon { width: 60px; height: 60px; border-radius: 50%; background: var(--lk-surface); color: var(--lk-primary); display: grid; place-items: center; margin: 0 auto 12px; }
.lk-quiz-title { font-size: 20px; font-weight: 500; letter-spacing: -0.01em; margin-bottom: 6px; }
.lk-quiz-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 20px 0; }
.lk-quiz-stats > div { background: var(--lk-surface); border-radius: 12px; padding: 10px 4px; display: flex; flex-direction: column; }
.lk-quiz-stats b { font-size: 18px; font-weight: 500; }
.lk-quiz-stats span { font-size: 12px; color: var(--lk-text-2); }
.lk-quiz-none { border: 1px dashed var(--lk-border); border-radius: 12px; padding: 28px; text-align: center; color: var(--lk-text-2); display: flex; flex-direction: column; align-items: center; gap: 6px; }
.lk-attempts { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.lk-attempts li { display: flex; align-items: center; gap: 14px; border: 1px solid var(--lk-border); background: var(--lk-surface); border-radius: 12px; padding: 12px 16px; }
.lk-attempt-n { flex: none; width: 36px; color: var(--lk-text-2); font-variant-numeric: tabular-nums; }
.lk-attempt-body { flex: 1 1 auto; min-width: 0; }
.lk-attempt-top { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
.lk-bar { height: 8px; border-radius: 4px; background: var(--lk-border); overflow: hidden; }
.lk-bar span { display: block; height: 100%; border-radius: 4px; }
.lk-bar .good { background: var(--lk-positive); } .lk-bar .mid { background: var(--lk-warning); } .lk-bar .low { background: var(--lk-negative); }
.lk-attempt-pct { flex: none; width: 48px; text-align: right; font-weight: 500; }
@media (max-width: 860px) { .lk-quizwrap { grid-template-columns: 1fr; } }
.lk-topic-title { font-size: 20px; font-weight: 500; margin: 0 0 14px; letter-spacing: -0.01em; }
.lk-summary { background: var(--lk-tint); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; }
.lk-summary p { margin: 4px 0 0; line-height: 1.65; }
.lk-kp-head { margin-bottom: 8px; }
.lk-kp { list-style: none; margin: 0; padding: 0; }
.lk-kp li { display: flex; gap: 12px; align-items: flex-start; padding: 10px 2px; line-height: 1.6; border-bottom: 1px solid var(--lk-border); }
.lk-kp li:last-child { border-bottom: 0; }
.lk-kp-n { flex: none; width: 24px; height: 24px; border-radius: 50%; background: var(--lk-tint); color: var(--lk-primary); font-size: 12px; font-weight: 500; display: grid; place-items: center; margin-top: 2px; }
.lk-topic-no { min-width: 0; padding-right: 12px; color: var(--lk-text-2); font-variant-numeric: tabular-nums; }
.lk-full-panel { padding: 0; height: 100%; overflow: hidden; }
.lk-fullwrap { display: grid; grid-template-columns: minmax(260px, 340px) minmax(0, 1fr); gap: 24px; height: 100%; }
.lk-left { scrollbar-width: thin; overflow-y: auto; padding: 16px 0 16px 16px; }
.lk-right { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.lk-topic-scroll { scrollbar-width: thin; flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 16px 24px 16px 0; }
.lk-pager { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 24px 10px 0; border-top: 1px solid var(--lk-border); background: var(--lk-surface); }
@media (max-width: 1023px) {                         /* a phone or small tablet: the page scrolls as usual, the buttons stay at the bottom edge of the screen */
  .lk-full-panel { height: auto; overflow: visible; padding: 16px; }
  .lk-fullwrap { display: block; height: auto; }
  .lk-left { padding: 0; overflow: visible; }
  .lk-topic-scroll { overflow: visible; padding: 8px 0 0; }
  .lk-pager { position: sticky; bottom: 0; padding: 10px 0; }
}
@media print { .lk-topic { display: block !important; margin-bottom: 24px; } .lk-full-panel, .lk-fullwrap, .lk-topic-scroll { height: auto !important; overflow: visible !important; } }
</style>
