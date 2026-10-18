<template>
  <q-page class="lk-page">
    <template v-if="module">
      <div class="lk-meta"><router-link :to="{ path: '/courses', query: { course: module.course.id } }" class="lk-link" style="font-weight: 400">{{ module.course.name }}</router-link></div>
      <div class="row items-center q-mb-md">
        <h1 class="lk-title col q-mb-none">{{ module.name }}</h1>
        <q-btn unelevated color="primary" icon="add" label="New session" :to="{ path: '/new', query: { module: module.id } }" />
      </div>

      <q-card flat bordered class="lk-card" style="max-width: 900px">
        <q-list v-if="sessions.length" separator>
          <div v-for="s in sessions" :key="s.id" class="row items-center no-wrap">
            <session-row :session="s" class="col" />
            <q-btn flat round dense icon="more_vert" class="q-mr-sm" aria-label="Lecture menu">
              <q-menu><q-list style="min-width: 160px">
                <q-item clickable v-close-popup @click="rename(s)"><q-item-section avatar><q-icon name="edit" /></q-item-section><q-item-section>Rename</q-item-section></q-item>
                <q-item clickable v-close-popup :disable="busy(s)" @click="remove(s)"><q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section><q-item-section class="text-negative">Delete</q-item-section></q-item>
              </q-list></q-menu>
            </q-btn>
          </div>
        </q-list>
        <q-card-section v-else class="text-center q-py-lg">
          <div class="lk-meta q-mb-md">No sessions yet. Add your first lecture.</div>
          <q-btn unelevated color="primary" label="New session" :to="{ path: '/new', query: { module: module.id } }" />
        </q-card-section>
      </q-card>
    </template>
    <div v-else-if="library.loaded" class="lk-card q-pa-lg text-center" style="max-width: 560px">
      <div class="q-mb-md">This module was not found.</div>
      <q-btn unelevated color="primary" label="My courses" to="/courses" />
    </div>
    <q-inner-loading :showing="library.loading && !library.loaded" />
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useLibraryStore } from '../stores/library'
import SessionRow from '../components/SessionRow.vue'
import { askName, confirmDelete } from '../util/dialogs'
import { friendly } from '../util/errors'
import { isBusy } from '../util/status'

const props = defineProps({ id: { type: String, required: true } })
const $q = useQuasar()
const library = useLibraryStore()
const module = computed(() => library.module(props.id))
const sessions = computed(() => (module.value ? [...module.value.sessions].sort((a, b) => b.id - a.id) : []))
const busy = isBusy
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
