<template>
  <q-page class="lk-page">
    <h1 class="lk-title">My courses</h1>

    <div v-if="!library.courses.length && library.loaded" class="lk-card" style="max-width: 560px">
      <empty-state icon="folder_copy" text="No courses yet. Add your first course.">
        <q-btn unelevated color="primary" icon="add" label="Add course" @click="addCourse" />
      </empty-state>
    </div>

    <template v-else-if="course">
      <q-tabs :model-value="course.id" align="left" indicator-color="primary" active-color="primary" class="lk-tabs" @update:model-value="select">
        <q-tab v-for="c in library.courses" :key="c.id" :name="c.id" :label="c.name" />
        <q-btn flat no-caps icon="add" label="Add course" class="lk-flat q-px-md" @click="addCourse" />
      </q-tabs>

      <div class="row items-center q-mt-md q-mb-md">
        <div class="col">
          <div class="row items-center no-wrap">
            <div class="lk-section-title" style="font-size: 20px">{{ course.name }}</div>
            <q-btn flat round dense icon="more_vert" aria-label="Course menu">
              <q-menu><q-list style="min-width: 160px">
                <q-item clickable v-close-popup @click="renameCourse"><q-item-section avatar><q-icon name="edit" /></q-item-section><q-item-section>Rename</q-item-section></q-item>
                <q-item clickable v-close-popup @click="deleteCourse"><q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section><q-item-section class="text-negative">Delete</q-item-section></q-item>
              </q-list></q-menu>
            </q-btn>
          </div>
          <div class="lk-meta">{{ summary }}</div>
        </div>
        <q-btn outline color="primary" icon="create_new_folder" label="Add module" class="q-mr-sm" @click="addModule" />
        <q-btn unelevated color="primary" icon="add" label="New session" :to="{ path: '/new', query: { course: course.id } }" />
      </div>

      <div v-if="!course.modules.length" class="lk-card">
        <empty-state icon="create_new_folder" text="No modules yet. Add a module, for example a topic or a week.">
          <q-btn unelevated color="primary" icon="create_new_folder" label="Add module" @click="addModule" />
        </empty-state>
      </div>

      <div class="lk-grid3">
        <article v-for="m in course.modules" :key="m.id" class="lk-modcard">
          <header class="lk-modcard-head">
            <span class="lk-modcard-icon"><q-icon name="folder_special" size="24px" /></span>
            <div class="lk-modcard-name">
              <router-link :to="`/modules/${m.id}`" class="lk-modcard-title">{{ m.name }}</router-link>
              <span class="lk-meta">{{ plural(m.sessions.length, 'session') }}<template v-if="busyCount(m)"> · {{ busyCount(m) }} working</template></span>
            </div>
            <q-btn flat round dense icon="more_vert" aria-label="Module menu">
              <q-menu><q-list style="min-width: 160px">
                <q-item clickable v-close-popup @click="renameModule(m)"><q-item-section avatar><q-icon name="edit" /></q-item-section><q-item-section>Rename</q-item-section></q-item>
                <q-item clickable v-close-popup @click="deleteModule(m)"><q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section><q-item-section class="text-negative">Delete</q-item-section></q-item>
              </q-list></q-menu>
            </q-btn>
          </header>

          <ul v-if="m.sessions.length" class="lk-modcard-list">
            <li v-for="s in latest(m)" :key="s.id">
              <router-link :to="`/sessions/${s.id}`" class="lk-modcard-row">
                <span class="lk-modcard-kind"><q-icon :name="kindOf(s).icon" size="20px" /></span>
                <span class="lk-modcard-text">
                  <span class="lk-modcard-stitle">{{ s.title }}</span>
                  <span class="lk-meta">{{ sessionMeta(s) }}</span>
                </span>
                <status-chip :session="s" />
              </router-link>
            </li>
          </ul>
          <div v-else class="lk-modcard-empty lk-meta">No sessions yet.</div>

          <footer class="lk-modcard-foot">
            <router-link :to="`/modules/${m.id}`" class="lk-modcard-open">{{ m.sessions.length > 2 ? `View all ${m.sessions.length} sessions` : 'Open module' }} <q-icon name="arrow_forward" size="16px" /></router-link>
            <q-btn flat round dense icon="add" color="primary" aria-label="New session in this module" :to="{ path: '/new', query: { module: m.id } }"><q-tooltip>New session</q-tooltip></q-btn>
          </footer>
        </article>
      </div>
    </template>
    <q-inner-loading :showing="library.loading && !library.loaded" />
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useLibraryStore } from '../stores/library'
import StatusChip from '../components/StatusChip.vue'
import { isBusy, kindOf } from '../util/status'
import EmptyState from '../components/EmptyState.vue'
import { askName, confirmDelete } from '../util/dialogs'
import { friendly } from '../util/errors'
import { formatDate, formatDuration, plural } from '../util/format'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const library = useLibraryStore()

const course = computed(() => library.course(route.query.course) || library.courses[0] || null)
const summary = computed(() => {
  const c = course.value
  const n = c.modules.reduce((k, m) => k + m.sessions.length, 0)
  const last = c.modules.flatMap((m) => m.sessions).map((s) => s.created_at).sort().pop()
  return `${plural(c.modules.length, 'module')} · ${plural(n, 'session')}` + (last ? ` · last session ${formatDate(last, true)}` : '')
})

const latest = (m) => [...m.sessions].sort((a, b) => b.id - a.id).slice(0, 2)
const busyCount = (m) => m.sessions.filter(isBusy).length
const sessionMeta = (s) => [formatDate(s.created_at), kindOf(s).word, s.duration_seconds != null ? formatDuration(s.duration_seconds) : ''].filter(Boolean).join(' · ')
const select = (id) => router.replace({ query: { course: id } })
const fail = (e) => $q.notify({ type: 'negative', message: friendly(e) })

async function addCourse() {
  const name = await askName({ title: 'Add course', label: 'Course name', ok: 'Add' })
  if (!name) return
  try { const c = await library.addCourse(name); select(c.id) } catch (e) { fail(e) }
}
async function renameCourse() {
  const name = await askName({ title: 'Rename course', label: 'Course name', value: course.value.name })
  if (name) try { await library.renameCourse(course.value.id, name) } catch (e) { fail(e) }
}
async function deleteCourse() {
  const c = course.value
  if (!(await confirmDelete({ title: `Delete "${c.name}"?`, message: 'Its modules, lectures, notes and quizzes are deleted too. This cannot be undone.' }))) return
  try { await library.removeCourse(c.id); router.replace({ query: {} }) } catch (e) { fail(e) }
}
async function addModule() {
  const name = await askName({ title: 'Add module', label: 'Module name (for example a topic or a week)', ok: 'Add' })
  if (name) try { await library.addModule(course.value.id, name) } catch (e) { fail(e) }
}
async function renameModule(m) {
  const name = await askName({ title: 'Rename module', label: 'Module name', value: m.name })
  if (name) try { await library.renameModule(m.id, name) } catch (e) { fail(e) }
}
async function deleteModule(m) {
  if (!(await confirmDelete({ title: `Delete "${m.name}"?`, message: 'Its lectures, notes and quizzes are deleted too. This cannot be undone.' }))) return
  try { await library.removeModule(m.id) } catch (e) { fail(e) }
}
</script>

<style scoped>
.lk-modcard { display: flex; flex-direction: column; background: var(--lk-surface); border: 1px solid var(--lk-border); border-radius: 14px; box-shadow: var(--lk-shadow); transition: box-shadow 0.18s, border-color 0.18s; }
.lk-modcard:hover { box-shadow: var(--lk-shadow-lg); border-color: var(--lk-primary); }
.lk-modcard-head { display: flex; align-items: center; gap: 12px; padding: 14px 12px 12px 16px; }
.lk-modcard-icon { flex: none; width: 42px; height: 42px; border-radius: 12px; background: var(--lk-tint); color: var(--lk-primary); display: grid; place-items: center; }
.lk-modcard-name { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.lk-modcard-title { font-size: 16px; font-weight: 500; color: inherit; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lk-modcard-title:hover { color: var(--lk-link); }
.lk-modcard-list { list-style: none; margin: 0; padding: 0 8px; display: flex; flex-direction: column; gap: 2px; }
.lk-modcard-row { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 10px; color: inherit; text-decoration: none; }
.lk-modcard-row:hover { background: var(--lk-tint); }
.lk-modcard-row:focus-visible, .lk-modcard-open:focus-visible, .lk-modcard-title:focus-visible { outline: 2px solid var(--lk-primary); outline-offset: 2px; }
.lk-modcard-kind { flex: none; width: 36px; height: 36px; border-radius: 10px; background: var(--lk-surface-2); color: var(--lk-primary); display: grid; place-items: center; }
.lk-modcard-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.lk-modcard-stitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lk-modcard-empty { padding: 8px 16px 14px; }
.lk-modcard-foot { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px 8px 16px; margin-top: 6px; border-top: 1px solid var(--lk-border); }
.lk-modcard-open { display: inline-flex; align-items: center; gap: 6px; color: var(--lk-link); text-decoration: none; font-weight: 500; font-size: 14px; }
.lk-modcard-open:hover { text-decoration: underline; }
@media (prefers-reduced-motion: reduce) { .lk-modcard { transition: none; } }
</style>
