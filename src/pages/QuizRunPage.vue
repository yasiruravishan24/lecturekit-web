<template>
  <q-page class="lk-page">
    <h1 class="lk-title">Quiz</h1>

    <error-banner :message="error" />

    <template v-if="questions.length">
      <div class="row items-center q-mb-sm" style="max-width: 1000px">
        <div class="col lk-meta">Quiz for <strong class="text-black">{{ title }}</strong></div>
        <span class="lk-chip info">Question {{ index + 1 }} of {{ questions.length }}</span>
      </div>
      <q-linear-progress :value="(index + 1) / questions.length" rounded size="6px" class="q-mb-md" style="max-width: 1000px" />

      <q-card flat bordered class="lk-card" style="max-width: 1000px">
        <q-card-section>
          <div class="q-mb-md">
            <span v-if="q.bloom_level" class="lk-chip bloom q-mr-sm">Bloom level: {{ cap(q.bloom_level) }}</span>
          </div>
          <div id="question-text" style="font-size: 18px; font-weight: 500" class="q-mb-md">{{ q.question }}</div>
          <q-option-group v-model="chosen[q.id]" :options="options" color="primary" aria-labelledby="question-text" />
        </q-card-section>
        <q-separator />
        <q-card-actions class="q-px-md q-py-sm">
          <q-icon name="info" color="grey-6" class="q-mr-sm" />
          <span class="lk-meta col">Answers are shown when you submit the whole quiz. {{ unanswered ? `${plural(unanswered, 'question')} not answered yet.` : '' }}</span>
          <q-btn flat color="grey-9" label="Previous" :disable="index === 0" @click="index--" />
          <q-btn v-if="index < questions.length - 1" unelevated color="primary" label="Next" @click="index++" />
          <q-btn v-else unelevated color="primary" label="Submit quiz" :loading="busy" @click="submit" />
        </q-card-actions>
      </q-card>
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

const q = computed(() => questions.value[index.value])
const options = computed(() => q.value.options.map((label, value) => ({ label, value })))
const unanswered = computed(() => questions.value.filter((x) => !Number.isInteger(chosen[x.id])).length)
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

async function submit() {
  busy.value = true
  error.value = ''
  try {
    const result = await quizApi.submitAttempt(props.sessionId, quizApi.buildAnswers(questions.value, chosen))
    quizStore.setResult(props.sessionId, questions.value, chosen, result)
    router.replace({ name: 'quiz-result', params: { sessionId: props.sessionId } })
  } catch (e) {
    error.value = friendly(e)
  } finally {
    busy.value = false
  }
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
