<template>
  <div>
    <h1 class="text-h5 q-mt-none q-mb-sm" style="font-weight: 400">Check your email</h1>
    <p class="lk-meta q-mb-md">We sent a 6-digit code to <strong class="text-black">{{ email }}</strong>. It works for 10 minutes.</p>

    <error-banner :message="error" />
    <error-banner :message="info" info />

    <code-input ref="codeBox" v-model="code" :disabled="busy" @complete="confirm" />

    <q-btn label="Confirm" color="primary" unelevated class="full-width q-mt-md" style="height: 44px" :loading="busy" :disable="code.length !== 6" @click="confirm" />

    <div class="text-center q-mt-md lk-meta">
      Did not get it?
      <a v-if="wait === 0" class="lk-link" href="#" @click.prevent="resend">Send a new code</a>
      <span v-else>Send a new code (in {{ wait }} s)</span>
    </div>
    <div class="text-center q-mt-sm lk-meta"><router-link to="/login" class="lk-link">Back to log in</router-link></div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as authApi from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { friendly, isCode } from '../util/errors'
import CodeInput from '../components/CodeInput.vue'
import ErrorBanner from '../components/ErrorBanner.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const email = String(route.query.email || '').toLowerCase()
const code = ref('')
const busy = ref(false)
const error = ref('')
const info = ref('')
const wait = ref(route.query.sent ? 60 : 0)
const codeBox = ref(null)
let timer = null

async function confirm() {
  if (code.value.length !== 6 || busy.value) return
  error.value = ''
  busy.value = true
  try {
    await authApi.verifyEmail(email, code.value)
    if (auth.pendingPassword) {
      const password = auth.pendingPassword
      auth.pendingPassword = ''                      // never kept longer than this one flow
      await auth.login(email, password)
      router.replace('/')
    } else {
      router.replace({ name: 'login', query: { confirmed: '1', email } })
    }
  } catch (e) {
    error.value = isCode(e, 'invalid_code') ? 'That code is not right. Check the email and try again.' : friendly(e)
    code.value = ''
    codeBox.value?.focus()
  } finally {
    busy.value = false
  }
}

async function resend() {
  error.value = ''
  info.value = ''
  try {
    await authApi.resendCode(email)
    info.value = 'If this address has an account waiting to be confirmed, a new code is on its way.'
    wait.value = 60
    code.value = ''
  } catch (e) {
    error.value = friendly(e)
  }
}

onMounted(() => {
  if (!email) router.replace('/login')
  timer = setInterval(() => { if (wait.value > 0) wait.value -= 1 }, 1000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
