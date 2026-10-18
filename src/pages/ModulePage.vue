<template>
  <q-page class="lk-page">
    <template v-if="module">
      <router-link :to="{ path: '/courses', query: { course: module.course.id } }" class="lk-crumb"><q-icon name="arrow_back" size="16px" /> {{ module.course.name }}</router-link>
      <div class="lk-mod-head">
        <div class="lk-mod-title">
          <span class="lk-badge-icon"><q-icon name="folder_open" size="28px" /></span>
          <div>
            <h1 class="lk-title q-mb-none">{{ module.name }}</h1>
            <div class="lk-meta">{{ plural(sessions.length, 'lecture') }}<template v-if="counts.done"> · {{ counts.done }} completed</template><template v-if="counts.busy"> · {{ counts.busy }} processing</template><template v-if="counts.failed"> · {{ counts.failed }} failed</template></div>
          </div>
        </div>
        <q-btn unelevated color="primary" icon="add" label="New session" :to="{ path: '/new', query: { module: module.id } }" />
      </div>

      <div v-if="sessions.length" class="lk-mod-tools">
        <q-input v-model="search" dense outlined clearable placeholder="Search lectures" class="lk-mod-search" aria-label="Search lectures">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <div v-if="filters.length > 2" class="lk-mod-filters" role="group" aria-label="Show">
          <button v-for="f in filters" :key="f.key" type="button" class="lk-filter" :class="{ on: filter === f.key }" @click="filter = f.key">{{ f.label }} {{ f.count }}</button>
        </div>
      </div>

      <div v-if="shown.length" class="lk-lectures">
        <article v-for="s in shown" :key="s.id" class="lk-lecture" :class="`is-${statusOf(s).css}`">
          <router-link :to="`/sessions/${s.id}`" class="lk-lecture-link" :aria-label="`Open ${s.title}`">
            <span class="lk-lecture-icon"><q-icon :name="kindOf(s).icon" size="26px" /></span>
            <span class="lk-lecture-title">{{ s.title }}</span>
            <span class="lk-meta">{{ meta(s) }}</span>
            <span class="lk-lecture-foot">
              <status-chip :session="s" />
              <span class="lk-lecture-open">{{ s.state === 'failed' ? 'Open to try again' : s.state === 'done' ? 'Open notes' : 'Open' }} <q-icon name="arrow_forward" size="16px" /></span>
            </span>
          </router-link>
          <q-btn flat round dense icon="more_vert" class="lk-lecture-menu" aria-label="Lecture menu">
            <q-menu><q-list style="min-width: 160px">
              <q-item clickable v-close-popup @click="rename(s)"><q-item-section avatar><q-icon name="edit" /></q-item-section><q-item-section>Rename</q-item-section></q-item>
              <q-item clickable v-close-popup :disable="busy(s)" @click="remove(s)"><q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section><q-item-section class="text-negative">Delete</q-item-section></q-item>
            </q-list></q-menu>
          </q-btn>
        </article>
      </div>
      <q-card v-else-if="sessions.length" flat bordered class="lk-card">
        <empty-state icon="search_off" text="No lectures match your search or filter." />
      </q-card>
      <q-card v-else flat bordered class="lk-card">
        <empty-state icon="school" text="No sessions yet. Add your first lecture.">
          <q-btn unelevated color="primary" icon="add" label="New session" :to="{ path: '/new', query: { module: module.id } }" />
        </empty-state>
      </q-card>
    </template>
    <div v-else-if="library.loaded" class="lk-card" style="max-width: 560px">
      <empty-state icon="search_off" text="This module was not found.">
        <q-btn unelevated color="primary" label="My courses" to="/courses" />
      </empty-state>
    </div>
    <q-inner-loading :showing="library.loading && !library.loaded" />
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useLibraryStore } from '../stores/library'
import SessionRow from '../components/SessionRow.vue'
import EmptyState from '../components/EmptyState.vue'
import { askName, confirmDelete } from '../util/dialogs'
import { friendly } from '../util/errors'
import StatusChip from '../components/StatusChip.vue'
import { isBusy, kindOf, statusOf } from '../util/status'
import { formatDate, formatDuration, plural } from '../util/format'

const props = defineProps({ id: { type: String, required: true } })
const $q = useQuasar()
const library = useLibraryStore()
const module = computed(() => library.module(props.id))
const sessions = computed(() => (module.value ? [...module.value.sessions].sort((a, b) => b.id - a.id) : []))
const busy = isBusy
const search = ref('')
const filter = ref('all')
const counts = computed(() => ({
  done: sessions.value.filter((s) => s.state === 'done').length,
  busy: sessions.value.filter(isBusy).length,
  failed: sessions.value.filter((s) => s.state === 'failed').length,
}))
const filters = computed(() => [
  { key: 'all', label: 'All', count: sessions.value.length },
  { key: 'done', label: 'Completed', count: counts.value.done },
  { key: 'busy', label: 'Processing', count: counts.value.busy },
  { key: 'failed', label: 'Failed', count: counts.value.failed },
].filter((f) => f.key === 'all' || f.count))
const shown = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  return sessions.value.filter((s) => (filter.value === 'all' || (filter.value === 'busy' ? isBusy(s) : s.state === filter.value)) && (!q || s.title.toLowerCase().includes(q)))
})
const meta = (s) => [formatDate(s.created_at), kindOf(s).word, s.duration_seconds != null ? formatDuration(s.duration_seconds) : ''].filter(Boolean).join(' · ')
const fail = (e) => $q.notify({ type: 'negative', message: friendly(e) })

async function rename(s) {
  const title = await askName({ title: 'Rename lecture', label: 'Lecture title', value: s.title, max: 160 })
  if (title) try { await library.renameSession(s.id, title) } catch (e) { fail(e) }
}
async function remove(s) {
  if (!(await confirmDelete({ title: `Delete "${s.title}"?`, message: 'Its recording, notes and quiz are deleted. This cannot be undone.' }))) return
  try { await library.removeSession(s.id) } catch (e) { fail(e) }
}
</script>

<style scoped>
.lk-crumb { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--lk-link); text-decoration: none; margin-bottom: 6px; }
.lk-crumb:hover { text-decoration: underline; }
.lk-mod-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
.lk-mod-title { display: flex; align-items: center; gap: 14px; }
.lk-mod-tools { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
.lk-mod-search { width: 280px; max-width: 100%; background: var(--lk-surface); border-radius: 4px; }
.lk-mod-filters { display: flex; gap: 6px; flex-wrap: wrap; }
.lk-filter { font: inherit; font-size: 13px; cursor: pointer; border: 1px solid var(--lk-border); background: var(--lk-surface); color: inherit; border-radius: 999px; padding: 4px 12px; }
.lk-filter.on { background: var(--lk-tint); border-color: var(--lk-primary); color: var(--lk-link); }
.lk-filter:focus-visible { outline: 2px solid var(--lk-primary); outline-offset: 2px; }
.lk-lectures { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.lk-lecture { position: relative; background: var(--lk-surface); border: 1px solid var(--lk-border); border-radius: 14px; box-shadow: var(--lk-shadow); transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s; }
.lk-lecture:hover { box-shadow: var(--lk-shadow-lg); transform: translateY(-2px); border-color: var(--lk-primary); }
.lk-lecture.is-failed { border-color: rgba(193, 0, 21, 0.35); }
.lk-lecture-link { display: flex; flex-direction: column; gap: 4px; padding: 16px 16px 14px; color: inherit; text-decoration: none; border-radius: 14px; height: 100%; }
.lk-lecture-link:focus-visible { outline: 2px solid var(--lk-primary); outline-offset: 2px; }
.lk-lecture-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--lk-tint); color: var(--lk-primary); display: grid; place-items: center; margin-bottom: 8px; }
.lk-lecture.is-failed .lk-lecture-icon { background: rgba(193, 0, 21, 0.1); color: var(--lk-negative); }
.lk-lecture-title { font-size: 16px; font-weight: 500; line-height: 1.3; word-break: break-word; padding-right: 28px; }
.lk-lecture-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--lk-border); }
.lk-lecture-open { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--lk-link); }
.lk-lecture-menu { position: absolute; top: 10px; right: 8px; }
@media (prefers-reduced-motion: reduce) { .lk-lecture { transition: none; } .lk-lecture:hover { transform: none; } }
</style>
