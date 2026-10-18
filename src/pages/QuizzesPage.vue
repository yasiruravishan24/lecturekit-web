<template>
  <q-page class="lk-page">
    <h1 class="lk-title">Quizzes</h1>
    <q-card flat bordered class="lk-card" style="max-width: 900px">
      <q-list v-if="ready.length" separator>
        <q-item v-for="s in ready" :key="s.id">
          <q-item-section avatar><q-icon name="quiz" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label>{{ s.title }}</q-item-label>
            <q-item-label caption>{{ s.course_name }} › {{ s.module_name }}</q-item-label>
          </q-item-section>
          <q-item-section side class="text-right">
            <span v-if="last[s.id]" class="lk-meta">Last score {{ last[s.id].score }} / {{ last[s.id].total }} · {{ plural(count[s.id], 'attempt') }}</span>
            <span v-else-if="last[s.id] === null" class="lk-meta">Not taken yet</span>
          </q-item-section>
          <q-item-section side><q-btn unelevated color="primary" label="Take quiz" :to="`/quiz/${s.id}`" /></q-item-section>
        </q-item>
      </q-list>
      <q-card-section v-else-if="library.loaded" class="text-center q-py-lg">
        <div class="lk-meta q-mb-md">No quizzes yet. A quiz appears when a lecture is ready.</div>
        <q-btn unelevated color="primary" label="New session" to="/new" />
      </q-card-section>
    </q-card>
    <q-inner-loading :showing="library.loading && !library.loaded" />
  </q-page>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useLibraryStore } from '../stores/library'
import { listAttempts } from '../api/quiz'
import { plural } from '../util/format'

const library = useLibraryStore()
const ready = computed(() => library.allSessions.filter((s) => s.state === 'done' && s.has_notes).sort((a, b) => b.id - a.id))
const last = reactive({})
const count = reactive({})

watch(ready, (list) => {
  list.forEach(async (s) => {
    if (s.id in last) return
    last[s.id] = undefined
    try {
      const a = await listAttempts(s.id)
      count[s.id] = a.length
      last[s.id] = a.length ? a[a.length - 1] : null
    } catch { last[s.id] = null }
  })
}, { immediate: true })
</script>
