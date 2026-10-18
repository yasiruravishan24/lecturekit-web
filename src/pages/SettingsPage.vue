<template>
  <q-page class="lk-page">
    <h1 class="lk-title">Settings</h1>
    <q-card flat bordered class="lk-card" style="max-width: 720px">
      <q-card-section>
        <div class="lk-label q-mb-md">Account</div>
        <q-input :model-value="auth.user?.full_name" label="Name" outlined readonly class="q-mb-md" />
        <q-input :model-value="auth.user?.email" label="Email" outlined readonly />
        <div class="lk-label q-mt-lg q-mb-sm">Storage</div>
        <q-linear-progress :value="usedShare" rounded size="10px" :color="usedShare > 0.9 ? 'negative' : 'primary'" :track-color="$q.dark.isActive ? 'blue-grey-9' : 'blue-1'" />
        <div class="row justify-between lk-meta q-mt-xs"><span>{{ formatSize(usage.used_bytes) }} used</span><span>{{ limits.max_storage_gb }} GB available</span></div>
        <p class="lk-meta q-mt-md">
          You can make up to {{ limits.daily_limit }} lectures a day. Your recordings are kept for replay until you delete the lecture. Delete lectures you no longer need to free space.
        </p>
        <p class="lk-meta"><router-link :to="{ path: '/terms', query: { from: 'settings' } }" class="lk-link">Terms &amp; Conditions</router-link> · <router-link :to="{ path: '/privacy', query: { from: 'settings' } }" class="lk-link">Privacy Policy</router-link></p>
        <q-btn outline color="primary" icon="logout" label="Log out" class="q-mr-md" @click="logout" />
        <q-btn flat color="negative" icon="delete_forever" label="Delete account" @click="confirmOpen = true" />
      </q-card-section>
    </q-card>

    <q-dialog v-model="confirmOpen" persistent>
      <q-card style="min-width: 320px; max-width: 460px">
        <q-card-section>
          <div class="text-h6">Delete your account?</div>
          <p class="q-mt-sm">Your courses, lectures, recordings, notes and quizzes are deleted for good. This cannot be undone.</p>
          <q-input v-model="typed" outlined :label="`Type ${auth.user?.email} to confirm`" autofocus />
          <error-banner class="q-mt-md" :message="error" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="primary" label="Cancel" v-close-popup @click="typed = ''; error = ''" />
          <q-btn unelevated color="negative" label="Delete account" :disable="typed.trim().toLowerCase() !== auth.user?.email" :loading="busy" @click="remove" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useLibraryStore } from '../stores/library'
import * as authApi from '../api/auth'
import ErrorBanner from '../components/ErrorBanner.vue'
import { friendly } from '../util/errors'
import { formatSize } from '../util/format'

const router = useRouter()
const auth = useAuthStore()
const library = useLibraryStore()
const limits = computed(() => auth.limits)
const usage = ref({ used_bytes: 0, limit_bytes: 1 })
const usedShare = computed(() => Math.min(1, usage.value.used_bytes / Math.max(1, usage.value.limit_bytes)))
onMounted(() => { authApi.getUsage().then((u) => { usage.value = u }).catch(() => {}) })
const confirmOpen = ref(false)
const typed = ref('')
const busy = ref(false)
const error = ref('')

function logout() { auth.logout(); library.reset(); router.push('/login') }

async function remove() {
  busy.value = true
  error.value = ''
  try {
    await authApi.deleteAccount()
    auth.logout()
    library.reset()
    router.replace({ name: 'login' })
  } catch (e) {
    error.value = friendly(e)
  } finally {
    busy.value = false
  }
}
</script>
