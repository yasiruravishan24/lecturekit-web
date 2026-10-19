<template>
  <q-page class="lk-page">
    <h1 class="lk-title">Quiz</h1>

    <error-banner :message="error" />
    <error-banner :message="notice" info />

    <template v-if="questions.length">
      <div class="lk-run">
        <section class="lk-run-main">
          <div class="lk-run-top">
            <div class="lk-meta">Quiz for <strong class="lk-strong">{{ title }}</strong></div>
            <span class="lk-chip info">Question {{ index + 1 }} of {{ questions.length }}</span>
          </div>
          <q-linear-progress :value="(answered) / questions.length" rounded size="6px" class="q-mb-md" aria-label="Answered" />

          <q-card flat bordered class="lk-card lk-run-card">
            <q-card-section>
              <div class="q-mb-md">
                <span v-if="q.bloom_level" class="lk-chip bloom q-mr-sm">Bloom level: {{ cap(q.bloom_level) }}</span>
                <span v-if="q.source === 'board'" class="lk-chip info q-mr-sm"><q-icon name="draw" size="14px" /> From the board</span>
              </div>
              <div id="question-text" class="lk-q-text"><rich-text :text="q.question" legacy /></div>
              <div class="lk-opts" role="radiogroup" aria-labelledby="question-text">
                <label v-for="(o, i) in q.options" :key="`${q.id}-${i}`" class="lk-opt" :class="{ on: chosen[q.id] === i }">
                  <input v-model="chosen[q.id]" type="radio" :name="`q${q.id}`" :value="i" :aria-label="`Option ${letters[i]}`" />
                  <span class="lk-opt-letter">{{ letters[i] }}</span>
                  <rich-text :text="o" class="lk-opt-text" />
                </label>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-actions class="q-px-md q-py-sm">
              <q-icon name="info" class="lk-dim q-mr-sm" />
              <span class="lk-meta col">Answers are shown when you submit the whole quiz. {{ unanswered ? `${plural(unanswered, 'question')} not answered yet.` : '' }}</span>
              <q-btn flat class="lk-flat" label="Previous" :disable="index === 0" @click="index--" />
              <q-btn v-if="index < questions.length - 1" unelevated color="primary" label="Next" @click="index++" />
              <q-btn v-else unelevated color="primary" label="Submit quiz" :loading="busy" @click="submit" />
            </q-card-actions>
          </q-card>
        </section>

        <aside class="lk-run-nav lk-no-print">
          <div class="lk-label q-mb-sm">Questions · {{ answered }} / {{ questions.length }} answered</div>
          <div class="lk-run-dots">
            <button v-for="(x, i) in questions" :key="x.id" type="button" class="lk-dot" :class="{ now: i === index, done: Number.isInteger(chosen[x.id]) }"
                    :aria-label="`Go to question ${i + 1}${Number.isInteger(chosen[x.id]) ? ', answered' : ''}`" :aria-current="i === index" @click="index = i">{{ i + 1 }}</button>
          </div>
          <q-btn v-if="index < questions.length - 1 && answered === questions.length" flat no-caps color="primary" icon="done_all" label="Go to the last question" class="q-mt-sm" @click="index = questions.length - 1" />
        </aside>
      </div>
    </template>

    <div v-else-if="!loading && !error" class="lk-card q-pa-lg text-center" style="max-width: 560px">
      <div class="q-mb-md">This quiz is not available yet.</div>
      <q-btn unelevated color="primary" label="Back to the lecture" :to="`/sessions/${sessionId}`" />
    </div>
    <q-inner-loading :showing="loading" />
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as quizApi from '../api/quiz'
import { getSession } from '../api/library'
import { useQuizStore } from '../stores/quiz'
import ErrorBanner from '../components/ErrorBanner.vue'
import RichText from '../components/RichText.vue'
import { friendly } from '../util/errors'
import { plural } from '../util/format'

const props = defineProps({ sessionId: { type: String, required: true } })
const router = useRouter()
const quizStore = useQuizStore()

const questions = ref([])
const title = ref('')
const index = ref(0)
const chosen = reactive({})
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const letters = ['A', 'B', 'C', 'D']

const q = computed(() => questions.value[index.value])
const unanswered = computed(() => questions.value.filter((x) => !Number.isInteger(chosen[x.id])).length)
const answered = computed(() => questions.value.length - unanswered.value)
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

async function submit() {
  busy.value = true
  error.value = ''
  try {
    const result = await quizApi.submitAttempt(props.sessionId, quizApi.buildAnswers(questions.value, chosen))
    quizStore.setResult(props.sessionId, questions.value, chosen, result)
    router.replace({ name: 'quiz-result', params: { sessionId: props.sessionId } })
  } catch (e) {
    if (e.code === 'quiz_changed') await reload()
    else error.value = friendly(e)
  } finally {
    busy.value = false
  }
}

// questions about the board were added while this page was open: fetch them, keep the answers already given, go to the first new one
async function reload() {
  const before = questions.value.length
  const quiz = await quizApi.getQuiz(props.sessionId)
  questions.value = quiz.questions
  const firstNew = quiz.questions.findIndex((x) => !Number.isInteger(chosen[x.id]))
  index.value = Math.max(0, firstNew)
  notice.value = `${plural(quiz.questions.length - before, 'new question')} about the board ${quiz.questions.length - before === 1 ? 'was' : 'were'} added to this quiz. Answer ${quiz.questions.length - before === 1 ? 'it' : 'them'} and submit again; your other answers are kept.`
}

onMounted(async () => {
  quizStore.clear()
  try {
    const [quiz, session] = await Promise.all([quizApi.getQuiz(props.sessionId), getSession(props.sessionId)])
    questions.value = quiz.questions
    title.value = session.title
  } catch (e) {
    if (e.status !== 404) error.value = friendly(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.lk-run { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 24px; align-items: start; }
.lk-run-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.lk-q-text { font-size: 18px; font-weight: 500; margin-bottom: 18px; }
.lk-q-text :deep(.lk-rich-p) { line-height: 1.5; }
.lk-opts { display: flex; flex-direction: column; gap: 10px; }
.lk-opt { position: relative; display: flex; align-items: flex-start; gap: 14px; border: 1.5px solid var(--lk-border); background: var(--lk-surface); border-radius: 12px; padding: 12px 14px; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.lk-opt:hover { border-color: var(--lk-primary); }
.lk-opt.on { border-color: var(--lk-primary); background: var(--lk-tint); }
.lk-opt:has(input:focus-visible) { outline: 2px solid var(--lk-primary); outline-offset: 2px; }
.lk-opt input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
.lk-opt-letter { flex: none; width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--lk-border); display: grid; place-items: center; font-size: 13px; font-weight: 500; color: var(--lk-text-2); }
.lk-opt.on .lk-opt-letter { background: var(--lk-primary); border-color: var(--lk-primary); color: #fff; }
.lk-opt-text { flex: 1 1 auto; min-width: 0; padding-top: 2px; }
.lk-run-nav { position: sticky; top: 76px; border: 1px solid var(--lk-border); background: var(--lk-surface); border-radius: 14px; padding: 14px; }
.lk-run-dots { display: grid; grid-template-columns: repeat(auto-fill, minmax(38px, 1fr)); gap: 8px; }
.lk-dot { font: inherit; font-size: 13px; cursor: pointer; height: 36px; border-radius: 10px; border: 1.5px solid var(--lk-border); background: var(--lk-surface); color: inherit; }
.lk-dot.done { background: var(--lk-tint); border-color: var(--lk-primary); color: var(--lk-link); }
.lk-dot.now { background: var(--lk-primary); border-color: var(--lk-primary); color: #fff; }
.lk-dot:focus-visible { outline: 2px solid var(--lk-primary); outline-offset: 2px; }
@media (max-width: 1023px) { .lk-run { grid-template-columns: 1fr; } .lk-run-nav { position: static; order: -1; } }
@media (prefers-reduced-motion: reduce) { .lk-opt { transition: none; } }
</style>
