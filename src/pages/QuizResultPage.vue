<template>
  <q-page class="lk-page lk-fit">
    <h1 class="lk-title">Quiz result</h1>
    <div v-if="result" class="lk-res">
      <aside class="lk-res-side">
        <q-card flat bordered class="lk-card lk-res-score">
          <div class="lk-sring" :style="{ '--p': percent, '--c': ringColor }" role="img" :aria-label="`${result.score} of ${result.total} correct`">
            <div class="lk-sring-in"><b>{{ result.score }}</b><span>/ {{ result.total }}</span></div>
          </div>
          <div class="lk-section-title q-mt-md">{{ verdict.title }}</div>
          <div class="lk-meta q-mb-md">{{ verdict.text }}</div>
          <div class="lk-res-stats">
            <div><b class="lk-good">{{ result.score }}</b><span>Correct</span></div>
            <div><b class="lk-bad">{{ wrongCount }}</b><span>Not quite</span></div>
            <div><b>{{ skippedCount }}</b><span>Skipped</span></div>
          </div>
          <div class="lk-res-actions">
            <q-btn unelevated color="primary" no-caps icon="replay" label="Try again" :to="`/quiz/${sessionId}`" class="full-width" />
            <q-btn outline color="primary" no-caps icon="description" label="Back to notes" :to="`/sessions/${sessionId}`" class="full-width" />
          </div>
        </q-card>

        <q-card flat bordered class="lk-card lk-res-nav">
          <div class="lk-label q-mb-sm">Questions</div>
          <div class="lk-res-dots">
            <button v-for="r in rows" :key="r.id" type="button" class="lk-dot" :class="[r.correct ? 'ok' : 'no', { now: cur && cur.id === r.id }]"
                    :aria-label="`Question ${r.position}: ${r.correct ? 'correct' : r.chosen == null ? 'skipped' : 'not quite'}`" @click="pick(r)">{{ r.position }}</button>
          </div>
        </q-card>
      </aside>

      <section class="lk-res-main">
        <div class="lk-res-filters" role="group" aria-label="Show">
          <button v-for="f in filters" :key="f.key" type="button" class="lk-filter" :class="{ on: filter === f.key }" @click="setFilter(f.key)">{{ f.label }} {{ f.count }}</button>
        </div>
        <div v-if="cur" class="lk-res-view">
          <div class="lk-res-scroll">
            <div class="lk-label">Question {{ cur.position }} ·
              <q-icon :name="cur.correct ? 'check_circle' : 'cancel'" :color="cur.correct ? 'positive' : 'negative'" size="16px" />
              {{ cur.correct ? 'Correct' : cur.chosenIndex == null ? 'Skipped' : 'Not quite' }}
            </div>
            <div class="lk-res-q"><rich-text :text="cur.text" legacy /></div>
            <div class="lk-res-opts">
              <div v-for="(o, i) in cur.options" :key="i" class="lk-res-opt" :class="{ right: i === cur.correctIndex, wrong: i === cur.chosenIndex && i !== cur.correctIndex }">
                <span class="lk-opt-letter">{{ letters[i] }}</span>
                <rich-text :text="o" class="lk-res-opt-text" />
                <span v-if="i === cur.correctIndex" class="lk-res-tag good"><q-icon name="check" size="14px" /> Correct answer</span>
                <span v-else-if="i === cur.chosenIndex" class="lk-res-tag bad">Your answer</span>
                <span v-if="i === cur.correctIndex && i === cur.chosenIndex" class="lk-res-tag you">Your answer</span>
              </div>
            </div>
            <div v-if="cur.explanation" class="lk-res-why"><strong>Explanation:</strong> {{ cur.explanation }}</div>
          </div>
          <div class="lk-res-pager">
            <q-btn flat no-caps icon="arrow_back" label="Previous" :disable="sel === 0" @click="sel--" />
            <span class="lk-meta">{{ sel + 1 }} of {{ list.length }}</span>
            <q-btn flat color="primary" no-caps icon-right="arrow_forward" label="Next" :disable="sel >= list.length - 1" @click="sel++" />
          </div>
        </div>
        <div v-else class="lk-card q-pa-lg text-center lk-meta">Nothing to show here.</div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'
import RichText from '../components/RichText.vue'

const props = defineProps({ sessionId: { type: String, required: true } })
const router = useRouter()
const store = useQuizStore()

const result = computed(() => (store.sessionId === Number(props.sessionId) ? store.result : null))

const rows = computed(() => {
  const byId = Object.fromEntries(store.questions.map((q) => [q.id, q]))
  return [...result.value.results].sort((a, b) => a.position - b.position).map((r) => {
    const q = byId[r.question_id] || { question: '', options: [] }
    return {
      id: r.question_id, position: r.position, correct: r.correct, text: q.question, options: q.options,
      chosenIndex: r.chosen_index, correctIndex: r.correct_index,
      chosen: r.chosen_index == null ? null : q.options[r.chosen_index], right: q.options[r.correct_index], explanation: r.explanation,
    }
  })
})

const letters = ['A', 'B', 'C', 'D']
const filter = ref('all')
const sel = ref(0)
const wrongCount = computed(() => rows.value.filter((r) => !r.correct && r.chosenIndex != null).length)
const skippedCount = computed(() => rows.value.filter((r) => r.chosenIndex == null).length)
const percent = computed(() => (result.value.total ? Math.round((100 * result.value.score) / result.value.total) : 0))
const ringColor = computed(() => (percent.value >= 70 ? 'var(--lk-positive)' : percent.value >= 40 ? 'var(--lk-warning)' : 'var(--lk-negative)'))
const filters = computed(() => [
  { key: 'all', label: 'All', count: rows.value.length },
  { key: 'wrong', label: 'To review', count: rows.value.filter((r) => !r.correct).length },
  { key: 'right', label: 'Correct', count: rows.value.filter((r) => r.correct).length },
].filter((f) => f.key === 'all' || f.count))
const list = computed(() => rows.value.filter((r) => filter.value === 'all' || (filter.value === 'wrong' ? !r.correct : r.correct)))
const cur = computed(() => list.value[sel.value] || null)
function setFilter(k) { filter.value = k; sel.value = 0 }
function pick(r) {
  let i = list.value.findIndex((x) => x.id === r.id)
  if (i < 0) { filter.value = 'all'; i = rows.value.findIndex((x) => x.id === r.id) }
  sel.value = i
}

const verdict = computed(() => {
  const share = result.value.total ? result.value.score / result.value.total : 0
  if (share === 1) return { title: 'Perfect score', text: 'You answered every question correctly.' }
  if (share >= 0.7) return { title: 'Good work', text: 'Review the questions you missed below, then read the notes again.' }
  if (share >= 0.4) return { title: 'Getting there', text: 'Read the notes again, then try the quiz once more.' }
  return { title: 'Keep going', text: 'Read the notes carefully, then try the quiz again.' }
})

// the result lives in memory only: after a reload there is nothing to show, so go back to the lecture
onMounted(() => { if (!result.value) router.replace(`/sessions/${props.sessionId}`) })
</script>

<style scoped>
.lk-res { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 24px; align-items: start; }
.lk-res-side { display: flex; flex-direction: column; gap: 16px; }
.lk-res-score { padding: 22px; text-align: center; }
.lk-sring { --p: 0; --c: var(--lk-primary); width: 150px; height: 150px; border-radius: 50% !important; margin: 0 auto; display: grid; place-items: center; background: conic-gradient(var(--c) calc(var(--p) * 1%), var(--lk-border) 0); }
.lk-sring-in { width: 118px; height: 118px; border-radius: 50%; background: var(--lk-surface); display: flex; align-items: baseline; justify-content: center; gap: 4px; padding-top: 34px; }
.lk-sring-in b { font-size: 38px; font-weight: 500; line-height: 1; }
.lk-sring-in span { font-size: 16px; color: var(--lk-text-2); }
.lk-res-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
.lk-res-stats > div { background: var(--lk-surface-2); border-radius: 12px; padding: 8px 4px; display: flex; flex-direction: column; }
.lk-res-stats b { font-size: 20px; font-weight: 500; }
.lk-res-stats span { font-size: 12px; color: var(--lk-text-2); }
.lk-bad { color: var(--lk-negative); }
.lk-res-actions { display: flex; flex-direction: column; gap: 8px; }
.lk-res-nav { padding: 16px; }
.lk-res-dots { display: grid; grid-template-columns: repeat(auto-fill, minmax(38px, 1fr)); gap: 8px; }
.lk-dot { font: inherit; font-size: 13px; cursor: pointer; height: 36px; border-radius: 10px; border: 1.5px solid var(--lk-border); background: var(--lk-surface); color: inherit; }
.lk-dot.ok { border-color: var(--lk-positive); background: rgba(33, 186, 69, 0.12); }
.lk-dot.no { border-color: var(--lk-negative); background: rgba(193, 0, 21, 0.1); }
.lk-dot.now { outline: 2px solid var(--lk-primary); outline-offset: 2px; font-weight: 600; }
.lk-dot:focus-visible { outline: 2px solid var(--lk-primary); outline-offset: 2px; }
.lk-res-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.lk-filter { font: inherit; font-size: 13px; cursor: pointer; border: 1px solid var(--lk-border); background: var(--lk-surface); color: inherit; border-radius: 999px; padding: 4px 12px; }
.lk-filter.on { background: var(--lk-tint); border-color: var(--lk-primary); color: var(--lk-link); }
.lk-filter:focus-visible { outline: 2px solid var(--lk-primary); outline-offset: 2px; }
.lk-res-view { display: flex; flex-direction: column; min-height: 0; border: 1px solid var(--lk-border); background: var(--lk-surface); border-radius: 14px; box-shadow: var(--lk-shadow); }
.lk-res-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 20px 22px; scrollbar-width: thin; }
.lk-res-q { font-size: 18px; font-weight: 500; margin: 8px 0 16px; }
.lk-res-opts { display: flex; flex-direction: column; gap: 10px; }
.lk-res-opt { display: flex; align-items: flex-start; gap: 12px; border: 1.5px solid var(--lk-border); border-radius: 12px; padding: 10px 14px; }
.lk-res-opt.right { border-color: var(--lk-positive); background: rgba(33, 186, 69, 0.1); }
.lk-res-opt.wrong { border-color: var(--lk-negative); background: rgba(193, 0, 21, 0.08); }
.lk-opt-letter { flex: none; width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--lk-border); display: grid; place-items: center; font-size: 13px; font-weight: 500; color: var(--lk-text-2); }
.lk-res-opt.right .lk-opt-letter { background: var(--lk-positive); border-color: var(--lk-positive); color: #fff; }
.lk-res-opt.wrong .lk-opt-letter { background: var(--lk-negative); border-color: var(--lk-negative); color: #fff; }
.lk-res-opt-text { flex: 1 1 auto; min-width: 0; padding-top: 2px; }
.lk-res-tag { flex: none; font-size: 12px; border-radius: 999px; padding: 2px 10px; white-space: nowrap; }
.lk-res-tag.good { background: var(--lk-positive); color: #fff; }
.lk-res-tag.bad { background: var(--lk-negative); color: #fff; }
.lk-res-tag.you { background: var(--lk-tint); color: var(--lk-link); }
.lk-res-why { margin-top: 16px; padding: 12px 14px; border-radius: 12px; background: var(--lk-tint); line-height: 1.55; }
.lk-res-pager { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; border-top: 1px solid var(--lk-border); }
@media (min-width: 1024px) and (min-height: 780px) {
  .lk-res { height: 100%; min-height: 0; align-items: stretch; }
  .lk-res-side { overflow-y: auto; min-height: 0; scrollbar-width: thin; }
  .lk-res-main { display: flex; flex-direction: column; min-height: 0; }
  .lk-res-view { flex: 1 1 auto; }
}
@media (max-width: 1023px) { .lk-res { grid-template-columns: 1fr; } .lk-res-pager { position: sticky; bottom: 0; background: var(--lk-surface); } }
</style>
