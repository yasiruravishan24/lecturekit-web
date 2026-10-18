<template>
  <q-page class="lk-page">
    <h1 class="lk-title">New session</h1>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-lg-8">
        <q-card flat bordered class="lk-card">
          <q-card-section>
            <div class="lk-section-title q-mb-md">1. Course and module</div>
            <div v-if="loaded && !library.courses.length" class="q-mb-md">
              <error-banner info message="You need a course and a module first." />
              <q-btn unelevated color="primary" label="Go to My courses" to="/courses" />
            </div>
            <div v-else class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-select v-model="courseId" :options="courseOptions" emit-value map-options outlined label="Course *" @update:model-value="moduleId = null" :disable="busy" />
              </div>
              <div class="col-12 col-sm-6">
                <q-select v-model="moduleId" :options="moduleOptions" emit-value map-options outlined label="Module *" :disable="busy || !courseId" :hint="courseId && !moduleOptions.length ? 'This course has no modules yet' : ''" />
              </div>
              <div v-if="courseId && !moduleOptions.length" class="col-12">
                <q-btn flat color="primary" no-caps icon="create_new_folder" label="Add a module to this course" :to="{ path: '/courses', query: { course: courseId } }" />
              </div>
              <div class="col-12">
                <q-input v-model="title" outlined label="Session title *" maxlength="160" :disable="busy" />
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="lk-section-title q-mb-md">2. Lecture recording <span class="text-negative">*</span> <span class="lk-meta">(required)</span></div>
            <upload-box v-model="recordings" multiple :extensions="RECORDING_TYPES" :hint="recordingHint" :disabled="busy" :progress="uploadPercent" @rejected="reject" />
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="lk-section-title q-mb-md">3. Lecture slides <span class="lk-meta">(optional)</span></div>
            <upload-box v-model="slides" variant="row" multiple :extensions="SLIDE_TYPES" title="Add slides to improve the notes" :hint="`PDF, PPTX or DOCX · several files allowed · up to ${limits.max_slides_mb} MB each`" :disabled="busy" @rejected="reject" />
          </q-card-section>
          <q-separator />
          <q-card-section>
            <error-banner :message="error" />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat color="primary" label="Cancel" :disable="busy" @click="router.back()" />
              <q-btn unelevated color="primary" icon="auto_awesome" label="Create notes and quiz" :loading="busy" :disable="!canSubmit" @click="submit" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-4">
        <q-card flat bordered class="lk-card">
          <q-card-section>
            <div class="lk-section-title q-mb-md">What you will get</div>
            <q-list dense>
              <q-item><q-item-section avatar><q-icon name="description" color="primary" /></q-item-section><q-item-section>Full notes by topic</q-item-section></q-item>
              <q-item><q-item-section avatar><q-icon name="short_text" color="primary" /></q-item-section><q-item-section>Short revision notes</q-item-section></q-item>
              <q-item><q-item-section avatar><q-icon name="quiz" color="primary" /></q-item-section><q-item-section>Quiz questions</q-item-section></q-item>
            </q-list>
            <q-separator class="q-my-md" />
            <div class="lk-meta">
              <template v-if="target">Saved under <strong class="text-black">{{ target }}</strong>. </template>
              With slides the notes also use the slide text. A lecture saved in several files? Add them all; they are joined in order.
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import * as lib from '../api/library'
import * as sessionsApi from '../api/sessions'
import { useAuthStore } from '../stores/auth'
import { useLibraryStore } from '../stores/library'
import { friendly } from '../util/errors'
import { formatDate } from '../util/format'
import { RECORDING_TYPES, SLIDE_TYPES } from '../util/types'
import UploadBox from '../components/UploadBox.vue'
import ErrorBanner from '../components/ErrorBanner.vue'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const library = useLibraryStore()

const courseId = ref(null)
const moduleId = ref(null)
const title = ref(`Lecture ${formatDate(new Date().toISOString())}`)
const recordings = ref([])
const slides = ref([])
const busy = ref(false)
const error = ref('')
const uploadPercent = ref(-1)
const loaded = computed(() => library.loaded)
const limits = computed(() => auth.limits)

const recordingHint = computed(() => `MP3, M4A, WAV, MP4 and more · up to ${limits.value.max_recording_mb} MB in total`)
const courseOptions = computed(() => library.courses.map((c) => ({ label: c.name, value: c.id })))
const moduleOptions = computed(() => ((library.course(courseId.value) || {}).modules || []).map((m) => ({ label: m.name, value: m.id })))
const target = computed(() => {
  const c = library.course(courseId.value)
  const m = c && c.modules.find((x) => x.id === moduleId.value)
  return c && m ? `${c.name} › ${m.name}` : ''
})
const canSubmit = computed(() => !!moduleId.value && title.value.trim() && recordings.value.length > 0 && !busy.value)

const reject = (message) => $q.notify({ type: 'warning', message })

function validateSizes() {
  const mb = (n) => n / (1024 * 1024)
  if (recordings.value.length > limits.value.max_recording_parts) return `A lecture can have at most ${limits.value.max_recording_parts} recording files.`
  if (mb(recordings.value.reduce((n, f) => n + f.size, 0)) > limits.value.max_recording_mb) return `The recordings are too large (limit ${limits.value.max_recording_mb} MB in total).`
  const big = slides.value.find((f) => mb(f.size) > limits.value.max_slides_mb)
  return big ? `${big.name} is too large (limit ${limits.value.max_slides_mb} MB per slide file).` : ''
}

async function submit() {
  error.value = validateSizes()
  if (error.value) return
  busy.value = true
  let session = null
  try {
    session = await lib.createSession(moduleId.value, title.value.trim())
    uploadPercent.value = 0
    await sessionsApi.uploadFiles(session.id, recordings.value, slides.value, (p) => { uploadPercent.value = p })
    uploadPercent.value = 100
  } catch (e) {
    error.value = friendly(e)
    if (session) lib.deleteSession(session.id).catch(() => {})       // do not leave an empty lecture behind
    busy.value = false
    uploadPercent.value = -1
    return
  }
  try {
    await sessionsApi.startProcessing(session.id)
  } catch (e) {
    $q.notify({ type: 'warning', message: friendly(e) })            // the lecture stays uploaded; the session page offers "Make notes"
  }
  await library.refresh().catch(() => {})
  router.replace(`/sessions/${session.id}`)
}

onMounted(async () => {
  await Promise.all([library.load(), auth.loadConfig().catch(() => {})])
  const fromModule = library.module(route.query.module)
  const course = fromModule ? fromModule.course : library.course(route.query.course) || library.courses[0]
  if (course) {
    courseId.value = course.id
    moduleId.value = fromModule ? fromModule.id : course.modules.length === 1 ? course.modules[0].id : null
  }
})
</script>
