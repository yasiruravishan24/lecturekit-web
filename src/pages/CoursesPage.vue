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
        <q-card v-for="m in course.modules" :key="m.id" flat bordered class="lk-card lk-hover">
          <q-card-section class="row items-center no-wrap q-pb-sm">
            <q-icon name="folder_special" size="30px" color="primary" class="q-mr-md" />
            <div class="col" style="min-width: 0">
              <div class="lk-section-title ellipsis">{{ m.name }}</div>
              <div class="lk-meta">{{ plural(m.sessions.length, 'session') }}</div>
            </div>
            <q-btn flat round dense icon="more_vert" aria-label="Module menu">
              <q-menu><q-list style="min-width: 160px">
                <q-item clickable v-close-popup @click="renameModule(m)"><q-item-section avatar><q-icon name="edit" /></q-item-section><q-item-section>Rename</q-item-section></q-item>
                <q-item clickable v-close-popup @click="deleteModule(m)"><q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section><q-item-section class="text-negative">Delete</q-item-section></q-item>
              </q-list></q-menu>
            </q-btn>
          </q-card-section>
          <q-separator />
          <q-list>
            <session-row v-for="s in latest(m)" :key="s.id" :session="s" />
            <q-item v-if="!m.sessions.length"><q-item-section class="lk-meta">No sessions yet.</q-item-section></q-item>
          </q-list>
          <q-separator />
          <q-card-actions>
            <q-btn flat color="primary" label="Open module" :to="`/modules/${m.id}`" />
          </q-card-actions>
        </q-card>
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
import SessionRow from '../components/SessionRow.vue'
import EmptyState from '../components/EmptyState.vue'
import { askName, confirmDelete } from '../util/dialogs'
import { friendly } from '../util/errors'
import { formatDate, plural } from '../util/format'

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

const latest = (m) => [...m.sessions].sort((a, b) => b.id - a.id).slice(0, 3)
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
