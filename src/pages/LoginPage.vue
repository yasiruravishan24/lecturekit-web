<template>
  <div>
    <h1 class="text-h5 q-mt-none q-mb-md" style="font-weight: 400">Log in</h1>

    <error-banner v-if="notice" :message="notice" info />
    <error-banner :message="error" />

    <q-form @submit.prevent="submit" class="lk-form" novalidate>
      <q-input v-model="email" type="email" label="Email" outlined hide-bottom-space autocomplete="email">
        <template #prepend><q-icon name="mail" /></template>
      </q-input>
      <q-input v-model="password" :type="show ? 'text' : 'password'" label="Password" outlined hide-bottom-space autocomplete="current-password">
        <template #prepend><q-icon name="lock" /></template>
        <template #append>
          <q-btn flat round dense size="sm" :icon="show ? 'visibility' : 'visibility_off'" :aria-label="show ? 'Hide password' : 'Show password'" @click="show = !show" />
        </template>
      </q-input>
      <q-btn type="submit" label="Log in" color="primary" unelevated class="full-width" style="height: 44px" :loading="busy" />
    </q-form>

    <div class="row items-center q-my-md"><q-separator class="col" /><span class="q-px-md lk-meta">or</span><q-separator class="col" /></div>
    <!-- Google's own button when the server has a Google client ID; otherwise the same look, switched off, so it is clear why -->
    <div v-if="googleOn" ref="googleButton" class="row justify-center" style="min-height: 44px" />
    <q-btn v-else-if="googleChecked" outline no-caps class="full-width lk-google" style="height: 44px" disable>
      <svg class="lk-g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
      Continue with Google
      <q-tooltip anchor="top middle" self="bottom middle">Google sign-in is not set up on this server yet</q-tooltip>
    </q-btn>

    <div class="text-center q-mt-md lk-meta">New here? <router-link to="/register" class="lk-link">Create an account</router-link></div>

    <q-dialog v-model="termsDialog" persistent>
      <q-card style="min-width: 320px; max-width: 420px">
        <q-card-section>
          <div class="text-h6">Create your account</div>
          <p class="q-mt-sm">To create a new account with Google, please agree to the terms.</p>
          <q-checkbox v-model="termsOk" dense class="lk-terms"><span>I understand and agree with the <legal-links from="login" />.</span></q-checkbox>
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
import LegalLinks from '../components/LegalLinks.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const email = ref(route.query.email || '')
const password = ref('')
const show = ref(false)
const busy = ref(false)
const error = ref('')
const googleOn = ref(false)
const googleChecked = ref(false)          // the server has told us whether Google sign-in is set up
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
    googleChecked.value = true
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
