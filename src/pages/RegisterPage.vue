<template>
  <div>
    <h1 class="text-h5 q-mt-none q-mb-md" style="font-weight: 400">Create your account</h1>
    <error-banner :message="error">
      <q-btn v-if="taken" flat dense no-caps label="Log in" color="negative" :to="{ name: 'login', query: { email } }" />
    </error-banner>

    <q-form @submit.prevent="submit" class="q-gutter-md" novalidate>
      <q-input v-model="fullName" label="Full name" outlined autocomplete="name" maxlength="120" :error="!!errors.fullName" :error-message="errors.fullName" />
      <q-input v-model="email" type="email" label="Email" outlined autocomplete="email" maxlength="254" :error="!!errors.email" :error-message="errors.email" />
      <q-input v-model="password" :type="show ? 'text' : 'password'" label="Password (at least 8 characters)" outlined autocomplete="new-password" maxlength="200" :error="!!errors.password" :error-message="errors.password">
        <template #append>
          <q-btn flat round dense size="sm" :icon="show ? 'visibility' : 'visibility_off'" :aria-label="show ? 'Hide password' : 'Show password'" @click="show = !show" />
        </template>
      </q-input>
      <div>
        <q-checkbox v-model="terms" label="I accept the terms of use" />
        <div v-if="errors.terms" class="text-negative" style="font-size: 12px; margin-left: 10px">{{ errors.terms }}</div>
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

function validate() {
  errors.fullName = fullName.value.trim() ? '' : 'Enter your name'
  errors.email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim()) ? '' : 'Enter a valid email address'
  errors.password = password.value.length >= 8 ? '' : 'Use at least 8 characters'
  errors.terms = terms.value ? '' : 'Please accept the terms of use'
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
