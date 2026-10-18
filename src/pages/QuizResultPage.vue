<template>
  <q-page class="lk-page">
    <h1 class="lk-title">Quiz result</h1>
    <template v-if="result">
      <q-card flat bordered class="lk-card" style="max-width: 1000px">
        <q-card-section class="row items-center q-col-gutter-md">
          <div class="col-auto"><span style="font-size: 56px; color: var(--lk-primary)">{{ result.score }}</span><span style="font-size: 32px; color: var(--lk-text-2)"> / {{ result.total }}</span></div>
          <div class="col" style="min-width: 220px">
            <div class="lk-section-title">{{ verdict.title }}</div>
            <div class="lk-meta">{{ verdict.text }}</div>
          </div>
          <div class="col-auto">
            <q-btn outline color="primary" label="Try again" class="q-mr-sm" :to="`/quiz/${sessionId}`" />
            <q-btn unelevated color="primary" label="Back to notes" :to="`/sessions/${sessionId}`" />
          </div>
        </q-card-section>
      </q-card>

      <div class="q-mt-lg" style="max-width: 1000px">
        <div v-for="r in rows" :key="r.id" class="lk-result-row" :class="r.correct ? 'correct' : 'wrong'">
          <div class="lk-label">Question {{ r.position }} · <q-icon :name="r.correct ? 'check_circle' : 'cancel'" :color="r.correct ? 'positive' : 'negative'" size="16px" /> {{ r.correct ? 'Correct' : r.chosen == null ? 'Skipped' : 'Not quite' }}</div>
          <div style="font-weight: 500" class="q-my-xs">{{ r.text }}</div>
          <div>
            You chose: <strong v-if="r.chosen != null">{{ r.chosen }}</strong><span v-else class="lk-meta">no answer</span>
            <template v-if="!r.correct"> · Correct answer: <span class="lk-good">{{ r.right }}</span></template>
          </div>
          <div v-if="r.explanation" class="lk-meta q-mt-xs">Explanation: {{ r.explanation }}</div>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'

const props = defineProps({ sessionId: { type: String, required: true } })
const router = useRouter()
const store = useQuizStore()

const result = computed(() => (store.sessionId === Number(props.sessionId) ? store.result : null))

const rows = computed(() => {
  const byId = Object.fromEntries(store.questions.map((q) => [q.id, q]))
  return [...result.value.results].sort((a, b) => a.position - b.position).map((r) => {
    const q = byId[r.question_id] || { question: '', options: [] }
    return {
      id: r.question_id, position: r.position, correct: r.correct, text: q.question,
      chosen: r.chosen_index == null ? null : q.options[r.chosen_index], right: q.options[r.correct_index], explanation: r.explanation,
    }
  })
})

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
