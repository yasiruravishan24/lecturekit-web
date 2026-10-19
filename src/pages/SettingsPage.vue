<template>
  <q-page class="lk-page">
    <h1 class="lk-title">Settings</h1>
    <div class="lk-set">
      <div class="lk-set-col">
        <q-card flat bordered class="lk-card lk-set-profile">
          <q-avatar size="72px" font-size="26px" color="primary" text-color="white" style="font-weight: 500; border-radius: 50% !important">{{ initialsText }}</q-avatar>
          <div class="lk-set-id">
            <div class="lk-set-name">{{ auth.user?.full_name }}</div>
            <div class="lk-meta lk-set-email">{{ auth.user?.email }}</div>
            <div class="lk-set-chips">
              <span v-if="auth.user?.email_verified" class="lk-chip completed"><q-icon name="verified" size="14px" /> Email confirmed</span>
              <span v-if="auth.user?.google_linked" class="lk-chip info"><q-icon name="link" size="14px" /> Google linked</span>
              <span v-if="since" class="lk-chip idle">Member since {{ since }}</span>
            </div>
          </div>
        </q-card>

        <q-card flat bordered class="lk-card lk-set-card">
          <div class="lk-label q-mb-sm">Appearance</div>
          <div class="lk-meta q-mb-md">Choose how Lecture Assistant looks. System follows your device.</div>
          <q-btn-toggle :model-value="ui.theme" no-caps unelevated spread toggle-color="primary" color="grey-3" text-color="grey-9" aria-label="Theme"
                        :options="[{ label: 'Light', value: 'light', icon: 'light_mode' }, { label: 'Dark', value: 'dark', icon: 'dark_mode' }, { label: 'System', value: 'auto', icon: 'brightness_auto' }]"
                        @update:model-value="ui.setTheme" />
        </q-card>

        <q-card flat bordered class="lk-card lk-set-card">
          <div class="lk-label q-mb-sm">Legal</div>
          <router-link :to="{ path: '/terms', query: { from: 'settings' } }" class="lk-set-link"><q-icon name="gavel" size="20px" /> Terms &amp; Conditions <q-icon name="chevron_right" size="20px" class="lk-set-go" /></router-link>
          <router-link :to="{ path: '/privacy', query: { from: 'settings' } }" class="lk-set-link"><q-icon name="privacy_tip" size="20px" /> Privacy Policy <q-icon name="chevron_right" size="20px" class="lk-set-go" /></router-link>
        </q-card>
      </div>

      <div class="lk-set-col">
        <q-card flat bordered class="lk-card lk-set-card">
          <div class="lk-label q-mb-md">Storage</div>
          <div class="lk-set-store">
            <b>{{ formatSize(usage.used_bytes) }}</b><span class="lk-meta">of {{ limits.max_storage_gb }} GB used</span>
            <span class="lk-set-pct">{{ pct }}%</span>
          </div>
          <q-linear-progress :value="usedShare" rounded size="10px" :color="usedShare > 0.9 ? 'negative' : 'primary'" :track-color="$q.dark.isActive ? 'blue-grey-9' : 'blue-1'" aria-label="Storage used" />
          <div class="lk-set-facts">
            <div><b>{{ counts.lectures }}</b><span>Lectures</span></div>
            <div><b>{{ counts.courses }}</b><span>Courses</span></div>
            <div><b>{{ limits.daily_limit }}</b><span>Lectures a day</span></div>
          </div>
          <p class="lk-meta q-mb-none">Your recordings are kept for replay until you delete the lecture. Delete lectures you no longer need to free space.</p>
        </q-card>

        <q-card flat bordered class="lk-card lk-set-card lk-set-danger">
          <div class="lk-label q-mb-sm text-negative">Danger zone</div>
          <div class="lk-set-row">
            <div><div class="lk-set-h">Delete account</div><div class="lk-meta">Removes your courses, lectures, recordings, notes and quizzes for good.</div></div>
            <q-btn outline color="negative" no-caps icon="delete_forever" label="Delete account" @click="confirmOpen = true" />
          </div>
        </q-card>
      </div>
    </div>

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
import { useUiStore } from '../stores/ui'
import * as authApi from '../api/auth'
import ErrorBanner from '../components/ErrorBanner.vue'
import { friendly } from '../util/errors'
import { formatDate, formatSize, initials } from '../util/format'

const router = useRouter()
const auth = useAuthStore()
const library = useLibraryStore()
const ui = useUiStore()
const counts = computed(() => library.counts)
const initialsText = computed(() => initials(auth.user?.full_name, auth.user?.email))
const since = computed(() => (auth.user?.created_at ? formatDate(auth.user.created_at) : ''))
const limits = computed(() => auth.limits)
const usage = ref({ used_bytes: 0, limit_bytes: 1 })
const pct = computed(() => (usedShare.value < 0.01 && usage.value.used_bytes ? '<1' : Math.round(usedShare.value * 100)))
const usedShare = computed(() => Math.min(1, usage.value.used_bytes / Math.max(1, usage.value.limit_bytes)))
onMounted(() => { authApi.getUsage().then((u) => { usage.value = u }).catch(() => {}) })
const confirmOpen = ref(false)
const typed = ref('')
const busy = ref(false)
const error = ref('')


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

<style scoped>
.lk-set { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; align-items: start; }
.lk-set-col { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.lk-set-profile { display: flex; align-items: center; gap: 18px; padding: 22px; }
.lk-set-id { min-width: 0; }
.lk-set-name { font-size: 20px; font-weight: 500; }
.lk-set-email { overflow: hidden; text-overflow: ellipsis; }
.lk-set-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.lk-set-card { padding: 20px 22px; }
.lk-set-link { display: flex; align-items: center; gap: 12px; padding: 12px 4px; color: inherit; text-decoration: none; border-top: 1px solid var(--lk-border); }
.lk-set-link:first-of-type { border-top: 0; }
.lk-set-link:hover { color: var(--lk-link); }
.lk-set-go { margin-left: auto; opacity: 0.6; }
.lk-set-store { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; }
.lk-set-store b { font-size: 26px; font-weight: 500; }
.lk-set-pct { margin-left: auto; font-weight: 500; color: var(--lk-primary); }
.lk-set-facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 18px 0; }
.lk-set-facts > div { background: var(--lk-surface-2); border-radius: 12px; padding: 10px 4px; text-align: center; display: flex; flex-direction: column; }
.lk-set-facts b { font-size: 20px; font-weight: 500; }
.lk-set-facts span { font-size: 12px; color: var(--lk-text-2); }
.lk-set-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.lk-set-h { font-weight: 500; }
.lk-set-danger { border-color: rgba(193, 0, 21, 0.35) !important; }
@media (max-width: 900px) { .lk-set { grid-template-columns: 1fr; } }
</style>
