<template>
  <q-page class="lk-page">
    <h1 class="lk-title">Settings</h1>
    <q-card flat bordered class="lk-card" style="max-width: 720px">
      <q-card-section>
        <div class="lk-label q-mb-md">Account</div>
        <q-input :model-value="auth.user?.full_name" label="Name" outlined readonly class="q-mb-md" />
        <q-input :model-value="auth.user?.email" label="Email" outlined readonly />
        <p class="lk-meta q-mt-md">
          You can make up to {{ limits.daily_limit }} lectures a day. Recordings are removed from the server after {{ limits.keep_media_days }} days; notes and quizzes stay.
        </p>
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useLibraryStore } from '../stores/library'
import * as authApi from '../api/auth'
import ErrorBanner from '../components/ErrorBanner.vue'
import { friendly } from '../util/errors'

const router = useRouter()
const auth = useAuthStore()
const library = useLibraryStore()
const limits = computed(() => auth.limits)
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
