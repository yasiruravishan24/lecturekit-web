<template>
  <q-page class="lk-page">
    <template v-if="session">
      <div class="lk-meta lk-no-print">
        <router-link v-if="where" :to="{ path: '/courses', query: { course: where.course.id } }" class="lk-link" style="font-weight: 400">{{ where.course.name }}</router-link>
        <template v-if="where"> › <router-link :to="`/modules/${where.id}`" class="lk-link" style="font-weight: 400">{{ where.name }}</router-link></template>
      </div>

      <div class="row items-center q-mb-md q-mt-xs">
        <div class="col row items-center q-gutter-sm">
          <h1 class="lk-title q-mb-none q-ml-sm">{{ session.title }}</h1>
          <status-chip :session="session" />
          <span v-if="meta" class="lk-chip info">{{ meta }}</span>
        </div>
        <div class="lk-no-print">
          <template v-if="session.state === 'done'">
            <q-btn flat color="grey-9" icon="download" label="Export">
              <q-menu><q-list style="min-width: 220px">
                <q-item clickable v-close-popup @click="downloadMarkdown"><q-item-section avatar><q-icon name="download" /></q-item-section><q-item-section>Download Markdown</q-item-section></q-item>
                <q-item clickable v-close-popup @click="printNotes"><q-item-section avatar><q-icon name="print" /></q-item-section><q-item-section>Print / save as PDF</q-item-section></q-item>
              </q-list></q-menu>
            </q-btn>
            <q-btn flat color="primary" icon="quiz" label="Take quiz" :to="`/quiz/${session.id}`" />
          </template>
          <q-btn flat round dense icon="more_vert" aria-label="Lecture menu">
            <q-menu><q-list style="min-width: 160px">
              <q-item clickable v-close-popup @click="rename"><q-item-section avatar><q-icon name="edit" /></q-item-section><q-item-section>Rename</q-item-section></q-item>
              <q-item clickable v-close-popup :disable="isBusy(session)" @click="remove"><q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section><q-item-section class="text-negative">Delete</q-item-section></q-item>
            </q-list></q-menu>
          </q-btn>
        </div>
      </div>

      <error-banner :message="error" />

      <!-- processing -->
      <progress-panel v-if="isBusy(session)" :job="job" :has-slides="session.has_slides" />

      <!-- failed -->
      <q-card v-else-if="session.state === 'failed'" flat bordered class="lk-card" style="max-width: 720px">
        <q-card-section>
          <div class="lk-section-title">The notes could not be made</div>
          <error-banner class="q-mt-md" :message="failedMessage" />
          <div class="lk-meta q-mb-md">Nothing is lost: your recording is still on the server, so you can try again.</div>
          <q-btn unelevated color="primary" icon="refresh" label="Try again" :loading="working" @click="retry" />
        </q-card-section>
      </q-card>

      <!-- uploaded, waiting for Make notes -->
      <q-card v-else-if="session.state === 'uploaded'" flat bordered class="lk-card" style="max-width: 720px">
        <q-card-section>
          <div class="lk-section-title">Ready to make notes</div>
          <div class="lk-meta q-mb-md">{{ fileSummary }}</div>
          <q-btn unelevated color="primary" icon="auto_awesome" label="Make notes" :loading="working" @click="start" />
        </q-card-section>
      </q-card>

      <!-- live recording that was not finished -->
      <q-card v-else-if="session.state === 'live'" flat bordered class="lk-card" style="max-width: 720px">
        <q-card-section>
          <div class="lk-section-title">This recording was not finished</div>
          <div class="lk-meta q-mb-md">{{ liveText }}</div>
          <q-btn unelevated color="primary" icon="auto_awesome" label="Finish and make notes" :loading="working" :disable="!liveTotal" @click="finishLive" />
        </q-card-section>
      </q-card>

      <!-- empty -->
      <q-card v-else-if="session.state === 'empty'" flat bordered class="lk-card" style="max-width: 720px">
        <q-card-section>
          <div class="lk-section-title">No recording yet</div>
          <div class="lk-meta q-mb-md">Add a recording to make notes and a quiz.</div>
          <q-btn unelevated color="primary" icon="add" label="New session" :to="{ path: '/new', query: where ? { module: where.id } : {} }" />
        </q-card-section>
      </q-card>

      <!-- done -->
      <notes-view v-else-if="notes" :notes="notes" :session-id="session.id" :slide-count="slideCount" :quiz-count="quizCount" :attempts="attempts" />
      <q-inner-loading :showing="loadingNotes" />
    </template>

    <div v-else-if="notFound" class="lk-card q-pa-lg text-center" style="max-width: 560px">
      <q-icon name="search_off" size="48px" color="grey-5" />
      <div class="q-mt-sm q-mb-md">This lecture was not found.</div>
      <q-btn unelevated color="primary" label="My courses" to="/courses" />
    </div>
    <q-inner-loading :showing="!session && !notFound" />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import * as sessionsApi from '../api/sessions'
import * as lib from '../api/library'
import * as quizApi from '../api/quiz'
import { useLibraryStore } from '../stores/library'
import StatusChip from '../components/StatusChip.vue'
import ProgressPanel from '../components/ProgressPanel.vue'
import NotesView from '../components/NotesView.vue'
import ErrorBanner from '../components/ErrorBanner.vue'
import { askName, confirmDelete } from '../util/dialogs'
import { friendly } from '../util/errors'
import { plural } from '../util/format'
import { isBusy, kindOf } from '../util/status'

const props = defineProps({ id: { type: String, required: true } })
const $q = useQuasar()
const router = useRouter()
const library = useLibraryStore()

const session = ref(null)
const job = ref(null)
const notes = ref(null)
const quizCount = ref(null)
const attempts = ref([])
const notFound = ref(false)
const working = ref(false)
const loadingNotes = ref(false)
const error = ref('')
const liveText = ref('')
const liveTotal = ref(0)

const where = computed(() => (session.value ? library.module(session.value.module_id) : null))
const slideCount = computed(() => (session.value ? session.value.files.filter((f) => f.kind === 'slides').length : 0))
const meta = computed(() => {
  if (!session.value || session.value.state !== 'done') return ''
  const kind = kindOf(session.value).word
  return [kind ? kind[0].toUpperCase() + kind.slice(1) : '', session.value.has_slides ? 'slides' : ''].filter(Boolean).join(' · ')
})
const fileSummary = computed(() => {
  const n = session.value.files.filter((f) => f.kind === 'recording').length
  return `${plural(n, 'recording file')}${slideCount.value ? ` and ${plural(slideCount.value, 'slide file')}` : ''} uploaded.`
})
const failedMessage = computed(() => (session.value && session.value.latest_job && session.value.latest_job.error_message) || 'Something went wrong while making the notes.')

let timer = null
let startedAt = 0
let gone = false

const stopPolling = () => { clearTimeout(timer); timer = null }

async function load() {
  error.value = ''
  try {
    session.value = await lib.getSession(props.id)
    notFound.value = false
  } catch (e) {
    if (e.status === 404 || e.status === 422) notFound.value = true
    else error.value = friendly(e)
    return
  }
  if (session.value.latest_job) job.value = session.value.latest_job
  if (isBusy(session.value)) schedulePoll()
  else if (session.value.state === 'done') await loadResults()
  else if (session.value.state === 'live') await loadLive()
}

async function loadResults() {
  if (notes.value) return
  loadingNotes.value = true
  try {
    notes.value = await sessionsApi.getNotes(props.id)
    quizApi.getQuiz(props.id).then((q) => { quizCount.value = q.questions.length }).catch(() => {})
    quizApi.listAttempts(props.id).then((a) => { attempts.value = a }).catch(() => {})
  } catch (e) {
    error.value = friendly(e)
  } finally {
    loadingNotes.value = false
  }
}

async function loadLive() {
  try {
    const s = await sessionsApi.liveStatus(props.id)
    const received = s.received || []
    liveTotal.value = received.length ? Math.max(...received) + 1 : 0
    liveText.value = liveTotal.value
      ? `${plural(received.length, 'part')} of the recording reached the server. You can finish it now and make notes from what arrived.`
      : 'No part of the recording reached the server.'
  } catch (e) {
    liveText.value = friendly(e)
  }
}

// poll the job every 2 s (every 5 s after the first minute); pause while the tab is hidden
function schedulePoll() {
  stopPolling()
  const delay = Date.now() - startedAt > 60000 ? 5000 : 2000
  timer = setTimeout(poll, delay)
}

async function poll() {
  if (gone) return
  if (document.hidden) return schedulePoll()
  try {
    const id = (job.value && job.value.id) || (session.value.latest_job && session.value.latest_job.id)
    if (id) job.value = await sessionsApi.getJob(id)
    if (job.value && (job.value.state === 'done' || job.value.state === 'failed')) {
      await load()
      library.refresh().catch(() => {})
      return
    }
  } catch (e) {
    if (e.code !== 'network') error.value = friendly(e)
  }
  schedulePoll()
}

async function run(action) {
  working.value = true
  error.value = ''
  try {
    const started = await action()
    job.value = { id: started.job_id, state: 'queued', stage: 'queued', percent: 0 }
    startedAt = Date.now()
    await load()
    library.refresh().catch(() => {})
  } catch (e) {
    error.value = friendly(e)
  } finally {
    working.value = false
  }
}

const start = () => run(() => sessionsApi.startProcessing(props.id))
const retry = () => run(() => sessionsApi.retry(props.id))
const finishLive = () => run(() => sessionsApi.finishLive(props.id, liveTotal.value))

async function rename() {
  const title = await askName({ title: 'Rename lecture', label: 'Lecture title', value: session.value.title, max: 160 })
  if (!title) return
  try { session.value = await lib.renameSession(props.id, title); library.refresh().catch(() => {}) } catch (e) { $q.notify({ type: 'negative', message: friendly(e) }) }
}

async function remove() {
  if (!(await confirmDelete({ title: `Delete "${session.value.title}"?`, message: 'Its recording, notes and quiz are deleted. This cannot be undone.' }))) return
  try {
    const moduleId = session.value.module_id
    await library.removeSession(props.id)
    router.replace(`/modules/${moduleId}`)
  } catch (e) { $q.notify({ type: 'negative', message: friendly(e) }) }
}

async function downloadMarkdown() {
  try {
    const blob = await sessionsApi.exportMarkdown(props.id)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${session.value.title.replace(/[^\w\- ]+/g, '').trim() || 'notes'}.md`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e) { $q.notify({ type: 'negative', message: friendly(e) }) }
}

const printNotes = () => window.print()

onMounted(() => { startedAt = Date.now(); load() })
onBeforeUnmount(() => { gone = true; stopPolling() })
watch(() => props.id, () => { session.value = null; job.value = null; notes.value = null; quizCount.value = null; attempts.value = []; notFound.value = false; stopPolling(); startedAt = Date.now(); load() })
</script>
