<template>
  <q-page class="lk-page">
    <div class="lk-qz-head">
      <div>
        <h1 class="lk-title q-mb-none">Quizzes</h1>
        <div class="lk-meta">{{ plural(ready.length, 'quiz', 'quizzes') }} from your completed lectures</div>
      </div>
    </div>

    <template v-if="ready.length">
      <div class="lk-grid3 q-mb-lg">
        <q-card flat bordered class="lk-card"><q-card-section class="lk-stat">
          <div><div class="lk-label">Quizzes</div><div class="lk-stat-number">{{ ready.length }}</div><div class="lk-meta">{{ taken }} taken · {{ ready.length - taken }} not yet</div></div>
          <span class="lk-badge-icon"><q-icon name="quiz" size="28px" /></span>
        </q-card-section></q-card>
        <q-card flat bordered class="lk-card"><q-card-section class="lk-stat">
          <div><div class="lk-label">Average score</div><div class="lk-stat-number">{{ average == null ? '-' : `${average}%` }}</div><div class="lk-meta">{{ average == null ? 'Take a quiz to see it' : 'of your latest attempts' }}</div></div>
          <span class="lk-badge-icon"><q-icon name="insights" size="28px" /></span>
        </q-card-section></q-card>
        <q-card flat bordered class="lk-card"><q-card-section class="lk-stat">
          <div><div class="lk-label">Attempts</div><div class="lk-stat-number">{{ attemptsTotal }}</div><div class="lk-meta">{{ best == null ? 'None yet' : `Best score ${best}%` }}</div></div>
          <span class="lk-badge-icon"><q-icon name="history" size="28px" /></span>
        </q-card-section></q-card>
      </div>

      <div class="lk-qz-tools">
        <q-input v-model="search" dense outlined clearable placeholder="Search quizzes" class="lk-qz-search" aria-label="Search quizzes">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <div class="lk-qz-filters" role="group" aria-label="Show">
          <button v-for="f in filters" :key="f.key" type="button" class="lk-filter" :class="{ on: filter === f.key }" @click="filter = f.key">{{ f.label }} {{ f.count }}</button>
        </div>
      </div>

      <div v-if="shown.length" class="lk-qz-grid">
        <article v-for="s in shown" :key="s.id" class="lk-qz">
          <div class="lk-qz-top">
            <span class="lk-qz-icon"><q-icon name="quiz" size="24px" /></span>
            <div class="lk-qz-names">
              <router-link :to="`/sessions/${s.id}`" class="lk-qz-title">{{ s.title }}</router-link>
              <span class="lk-meta">{{ s.course_name }} › {{ s.module_name }}</span>
            </div>
          </div>
          <div class="lk-qz-score">
            <template v-if="last[s.id]">
              <div class="lk-qz-line"><span>Last score <b>{{ last[s.id].score }} / {{ last[s.id].total }}</b></span><b>{{ pct(last[s.id]) }}%</b></div>
              <div class="lk-bar"><span :class="level(last[s.id])" :style="{ width: pct(last[s.id]) + '%' }" /></div>
              <span class="lk-meta">{{ plural(count[s.id], 'attempt') }}</span>
            </template>
            <template v-else-if="last[s.id] === null">
              <span class="lk-chip idle">Not taken yet</span>
            </template>
            <span v-else class="lk-meta">&nbsp;</span>
          </div>
          <q-btn unelevated color="primary" no-caps :icon="last[s.id] ? 'replay' : 'play_arrow'" :label="last[s.id] ? 'Retake quiz' : 'Take quiz'" :to="`/quiz/${s.id}`" class="full-width" />
        </article>
      </div>
      <q-card v-else flat bordered class="lk-card"><q-card-section class="text-center q-py-lg lk-meta">No quizzes match your search or filter.</q-card-section></q-card>
    </template>

    <q-card v-else-if="library.loaded" flat bordered class="lk-card">
      <q-card-section class="text-center q-py-lg">
        <q-icon name="quiz" size="44px" class="lk-dim" />
        <div class="lk-section-title q-mt-sm">No quizzes yet</div>
        <div class="lk-meta q-mb-md">A quiz appears when a lecture is completed.</div>
        <q-btn unelevated color="primary" icon="add" label="New session" to="/new" />
      </q-card-section>
    </q-card>
    <q-inner-loading :showing="library.loading && !library.loaded" />
  </q-page>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useLibraryStore } from '../stores/library'
import { listAttempts } from '../api/quiz'
import { plural } from '../util/format'

const library = useLibraryStore()
const ready = computed(() => library.allSessions.filter((s) => s.state === 'done' && s.has_notes).sort((a, b) => b.id - a.id))
const last = reactive({})
const count = reactive({})
const bestOf = reactive({})
const search = ref('')
const filter = ref('all')

const pct = (a) => (a.total ? Math.round((100 * a.score) / a.total) : 0)
const level = (a) => (pct(a) >= 70 ? 'good' : pct(a) >= 40 ? 'mid' : 'low')
const takenList = computed(() => ready.value.filter((s) => last[s.id]))
const taken = computed(() => takenList.value.length)
const average = computed(() => (takenList.value.length ? Math.round(takenList.value.reduce((n, s) => n + pct(last[s.id]), 0) / takenList.value.length) : null))
const attemptsTotal = computed(() => ready.value.reduce((n, s) => n + (count[s.id] || 0), 0))
const best = computed(() => { const v = ready.value.map((s) => bestOf[s.id]).filter((x) => x != null); return v.length ? Math.max(...v) : null })
const filters = computed(() => [
  { key: 'all', label: 'All', count: ready.value.length },
  { key: 'todo', label: 'Not taken', count: ready.value.length - taken.value },
  { key: 'done', label: 'Taken', count: taken.value },
])
const shown = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  return ready.value.filter((s) => (filter.value === 'all' || (filter.value === 'done' ? !!last[s.id] : !last[s.id]))
    && (!q || `${s.title} ${s.course_name} ${s.module_name}`.toLowerCase().includes(q)))
})

watch(ready, (list) => {
  list.forEach(async (s) => {
    if (s.id in last) return
    last[s.id] = undefined
    try {
      const a = await listAttempts(s.id)
      count[s.id] = a.length
      bestOf[s.id] = a.length ? Math.max(...a.map(pct)) : null
      last[s.id] = a.length ? a[a.length - 1] : null
    } catch { last[s.id] = null }
  })
}, { immediate: true })
</script>

<style scoped>
.lk-qz-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.lk-qz-tools { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
.lk-qz-search { width: 280px; max-width: 100%; background: var(--lk-surface); border-radius: 4px; }
.lk-qz-filters { display: flex; gap: 6px; flex-wrap: wrap; }
.lk-filter { font: inherit; font-size: 13px; cursor: pointer; border: 1px solid var(--lk-border); background: var(--lk-surface); color: inherit; border-radius: 999px; padding: 4px 12px; }
.lk-filter.on { background: var(--lk-tint); border-color: var(--lk-primary); color: var(--lk-link); }
.lk-filter:focus-visible { outline: 2px solid var(--lk-primary); outline-offset: 2px; }
.lk-qz-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.lk-qz { display: flex; flex-direction: column; gap: 14px; background: var(--lk-surface); border: 1px solid var(--lk-border); border-radius: 14px; box-shadow: var(--lk-shadow); padding: 16px; }
.lk-qz-top { display: flex; gap: 12px; align-items: flex-start; }
.lk-qz-icon { flex: none; width: 44px; height: 44px; border-radius: 12px; background: var(--lk-tint); color: var(--lk-primary); display: grid; place-items: center; }
.lk-qz-names { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.lk-qz-title { font-size: 16px; font-weight: 500; line-height: 1.3; color: inherit; text-decoration: none; word-break: break-word; }
.lk-qz-title:hover { color: var(--lk-link); text-decoration: underline; }
.lk-qz-score { flex: 1 1 auto; display: flex; flex-direction: column; gap: 6px; justify-content: center; min-height: 52px; }
.lk-qz-line { display: flex; justify-content: space-between; gap: 8px; }
.lk-bar { height: 8px; border-radius: 4px; background: var(--lk-border); overflow: hidden; }
.lk-bar span { display: block; height: 100%; border-radius: 4px; }
.lk-bar .good { background: var(--lk-positive); } .lk-bar .mid { background: var(--lk-warning); } .lk-bar .low { background: var(--lk-negative); }
</style>
