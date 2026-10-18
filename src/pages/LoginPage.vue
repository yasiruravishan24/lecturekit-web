<template>
  <div>
    <div class="lk-meta q-mb-md">Notes and quizzes from your lectures</div>
    <h1 class="text-h5 q-mt-none q-mb-md" style="font-weight: 400">Log in</h1>

    <error-banner v-if="notice" :message="notice" info />
    <error-banner :message="error" />

    <q-form @submit.prevent="submit" class="q-gutter-md" novalidate>
      <q-input v-model="email" type="email" label="Email" outlined autocomplete="email" />
      <q-input v-model="password" :type="show ? 'text' : 'password'" label="Password" outlined autocomplete="current-password">
        <template #append>
          <q-btn flat round dense size="sm" :icon="show ? 'visibility' : 'visibility_off'" :aria-label="show ? 'Hide password' : 'Show password'" @click="show = !show" />
        </template>
      </q-input>
      <q-btn type="submit" label="Log in" color="primary" unelevated class="full-width" style="height: 44px" :loading="busy" />
    </q-form>

    <template v-if="googleOn">
      <div class="row items-center q-my-md"><q-separator class="col" /><span class="q-px-md lk-meta">or</span><q-separator class="col" /></div>
      <div ref="googleButton" class="row justify-center" style="min-height: 44px" />
    </template>

    <div class="text-center q-mt-md lk-meta">New here? <router-link to="/register" class="lk-link">Create an account</router-link></div>

    <q-dialog v-model="termsDialog" persistent>
      <q-card style="min-width: 320px; max-width: 420px">
        <q-card-section>
          <div class="text-h6">Create your account</div>
          <p class="q-mt-sm">To create a new account with Google, please accept the terms of use.</p>
          <q-checkbox v-model="termsOk" label="I accept the terms of use" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup @click="pendingToken = ''" />
          <q-btn unelevated label="Continue" color="primary" :disable="!termsOk" :loading="busy" @click="finishGoogle(true)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { friendly, isCode } from '../util/errors'
import { loadGoogle } from '../util/google'
import ErrorBanner from '../components/ErrorBanner.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const email = ref(route.query.email || '')
const password = ref('')
const show = ref(false)
const busy = ref(false)
const error = ref('')
const googleOn = ref(false)
const googleButton = ref(null)
const termsDialog = ref(false)
const termsOk = ref(false)
const pendingToken = ref('')

const notice = computed(() => {
  if (route.query.reason === 'expired') return 'Please log in again.'
  if (route.query.confirmed) return 'Your email is confirmed. Log in to continue.'
  return ''
})

const rules = {
  required: (v) => !!v || 'Required',
  email: (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v || '').trim()) || 'Enter a valid email address',
}

const next = () => router.replace(typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/')

async function submit() {
  error.value = ''
  const emailOk = rules.email(email.value) === true
  if (!emailOk || !password.value) {
    error.value = !emailOk ? 'Enter a valid email address.' : 'Enter your password.'
    return
  }
  busy.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    await next()
  } catch (e) {
    if (isCode(e, 'email_not_verified')) {
      auth.pendingPassword = password.value
      router.push({ name: 'verify', query: { email: email.value.trim().toLowerCase() } })
    } else if (isCode(e, 'bad_credentials')) error.value = 'Wrong email or password.'
    else error.value = friendly(e)
  } finally {
    busy.value = false
  }
}

async function finishGoogle(acceptTerms) {
  busy.value = true
  error.value = ''
  try {
    await auth.loginWithGoogle(pendingToken.value, acceptTerms)
    termsDialog.value = false
    await next()
  } catch (e) {
    if (isCode(e, 'terms_required')) termsDialog.value = true
    else { termsDialog.value = false; error.value = friendly(e) }
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  try {
    const config = await auth.loadConfig()
    if (!config.google_enabled) return
    googleOn.value = true
    const google = await loadGoogle()
    google.accounts.id.initialize({
      client_id: config.google_client_id,
      callback: (r) => { pendingToken.value = r.credential; finishGoogle(false) },
    })
    google.accounts.id.renderButton(googleButton.value, { theme: 'outline', size: 'large', text: 'continue_with', width: 400 })
  } catch {
    googleOn.value = false          // the rest of the page works without Google
  }
})
</script>
