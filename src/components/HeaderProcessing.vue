<template>
  <q-btn v-if="busy.length" flat round dense class="q-mr-xs" :aria-label="`${busy.length} lectures processing`">
    <q-icon name="autorenew" class="lk-spin" />
    <q-badge color="white" text-color="primary" floating rounded>{{ busy.length }}</q-badge>
    <q-tooltip>{{ busy.length }} processing</q-tooltip>
    <q-menu anchor="bottom right" self="top right" :offset="[0, 8]">
      <div class="lk-proc-head lk-label">Processing now</div>
      <q-separator />
      <q-list style="min-width: 320px; max-width: 380px">
        <q-item v-for="s in busy" :key="s.id" clickable v-close-popup :to="`/sessions/${s.id}`">
          <q-item-section avatar><q-spinner color="primary" size="22px" /></q-item-section>
          <q-item-section>
            <q-item-label lines="1">{{ s.title }}</q-item-label>
            <q-item-label caption lines="1">{{ s.course_name }} › {{ s.module_name }}</q-item-label>
          </q-item-section>
          <q-item-section side><span class="lk-meta">{{ s.state === 'queued' ? 'Waiting' : 'Working' }}</span></q-item-section>
        </q-item>
      </q-list>
      <div class="lk-proc-foot lk-meta">You can keep using the app. You will be told when each one is ready.</div>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'
import { useLibraryStore } from '../stores/library'
import { isBusy } from '../util/status'

const library = useLibraryStore()
const busy = computed(() => library.allSessions.filter(isBusy))
</script>

<style scoped>
.lk-proc-head { padding: 10px 14px; }
.lk-proc-foot { padding: 8px 14px 12px; max-width: 380px; }
.lk-spin { animation: lk-spin 1.6s linear infinite; }
@keyframes lk-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .lk-spin { animation: none; } }
</style>
