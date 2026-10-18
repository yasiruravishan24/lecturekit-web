<template>
  <div>
    <h1 class="text-h5 q-mt-none q-mb-md" style="font-weight: 400">Create your account</h1>
    <error-banner :message="error">
      <q-btn v-if="taken" flat dense no-caps label="Log in" color="negative" :to="{ name: 'login', query: { email } }" />
    </error-banner>

    <q-form @submit.prevent="submit" class="lk-form" novalidate>
      <q-input v-model="fullName" label="Full name" outlined hide-bottom-space autocomplete="name" maxlength="120" :error="!!errors.fullName" :error-message="errors.fullName">
        <template #prepend><q-icon name="person" /></template>
      </q-input>
      <q-input v-model="email" type="email" label="Email" outlined hide-bottom-space autocomplete="email" maxlength="254" :error="!!errors.email" :error-message="errors.email">
        <template #prepend><q-icon name="mail" /></template>
      </q-input>
      <div>
        <q-input v-model="password" :type="show ? 'text' : 'password'" label="Password" outlined hide-bottom-space autocomplete="new-password" maxlength="200" :error="!!errors.password" :error-message="errors.password">
          <template #prepend><q-icon name="lock" /></template>
          <template #append>
            <q-btn flat round dense size="sm" :icon="show ? 'visibility' : 'visibility_off'" :aria-label="show ? 'Hide password' : 'Show password'" @click="show = !show" />
          </template>
        </q-input>
        <div v-if="password" class="q-mt-sm" aria-live="polite">
          <div class="lk-strength">
            <span v-for="n in 3" :key="n" :class="{ on: strength.level >= n, [strength.css]: strength.level >= n }" />
          </div>
          <div class="lk-meta q-mt-xs">{{ strength.text }}</div>
        </div>
      </div>
      <div>
        <q-checkbox v-model="terms" dense class="lk-check lk-terms">
          <span>I understand and agree with the <legal-links from="register" />.</span>
        </q-checkbox>
        <div v-if="errors.terms" class="text-negative q-mt-xs" style="font-size: 12px">{{ errors.terms }}</div>
      </div>
      <q-btn type="submit" label="Create account" color="primary" unelevated class="full-width" style="height: 44px" :loading="busy" />
    </q-form>

    <div class="text-center q-mt-md lk-meta">Already registered? <router-link to="/login" class="lk-link">Log in</router-link></div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as authApi from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { friendly, isCode } from '../util/errors'
import ErrorBanner from '../components/ErrorBanner.vue'
import LegalLinks from '../components/LegalLinks.vue'

const router = useRouter()
const auth = useAuthStore()
const fullName = ref('')
const email = ref('')
const password = ref('')
const terms = ref(false)
const show = ref(false)
const busy = ref(false)
const error = ref('')
const errors = reactive({ fullName: '', email: '', password: '', terms: '' })
const lastCode = ref('')
const taken = computed(() => lastCode.value === 'email_taken')

// a hint only (the server accepts any password of 8 or more characters)
const strength = computed(() => {
  const p = password.value
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length
  if (p.length < 8) return { level: 1, css: 'weak', text: 'Too short' }
  if (p.length >= 12 && kinds >= 3) return { level: 3, css: 'strong', text: 'Strong' }
  if (kinds >= 2) return { level: 2, css: 'ok', text: 'Good' }
  return { level: 1, css: 'weak', text: 'Weak: add numbers or capitals' }
})

function validate() {
  errors.fullName = fullName.value.trim() ? '' : 'Enter your name'
  errors.email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim()) ? '' : 'Enter a valid email address'
  errors.password = password.value.length >= 8 ? '' : 'Use at least 8 characters'
  errors.terms = terms.value ? '' : 'Please agree to the Terms & Conditions and the Privacy Policy'
  return !Object.values(errors).some(Boolean)
}

async function submit() {
  error.value = ''
  lastCode.value = ''
  if (!validate()) return
  busy.value = true
  try {
    const cleanEmail = email.value.trim().toLowerCase()
    await authApi.register({ full_name: fullName.value.trim(), email: cleanEmail, password: password.value, accept_terms: true })
    auth.pendingPassword = password.value          // kept in memory for the next step only
    router.push({ name: 'verify', query: { email: cleanEmail, sent: '1' } })
  } catch (e) {
    lastCode.value = e.code
    error.value = isCode(e, 'email_taken') ? 'That email is already registered.' : friendly(e)
  } finally {
    busy.value = false
  }
}
</script>
