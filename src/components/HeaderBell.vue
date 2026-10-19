<template>
  <q-btn flat round dense icon="notifications" class="q-mr-xs" aria-label="Notifications">
    <q-badge v-if="notes.unread" color="negative" floating rounded>{{ notes.unread > 9 ? '9+' : notes.unread }}</q-badge>
    <q-tooltip>Notifications</q-tooltip>
    <q-menu anchor="bottom right" self="top right" :offset="[0, 8]" class="lk-bell-menu">
      <div class="lk-bell-head">
        <span class="lk-label">Notifications</span>
        <span>
          <q-btn v-if="notes.unread" flat dense no-caps size="sm" color="primary" label="Mark all as read" @click="notes.markAllRead()" />
          <q-btn v-if="shown.length" flat dense no-caps size="sm" color="grey-7" label="Clear" @click="notes.clear()" />
        </span>
      </div>
      <q-separator />
      <q-list v-if="shown.length" class="lk-bell-list">
        <q-item v-for="n in shown" :key="n.id" clickable v-close-popup :class="{ unread: !n.read }" @click="open(n)">
          <q-item-section avatar>
            <q-avatar size="34px" :color="look(n).color" text-color="white" :icon="look(n).icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="lk-bell-title">{{ n.message }}</q-item-label>
            <q-item-label caption lines="2">{{ n.title }}{{ n.kind === 'failed' ? ' · open it to try again' : '' }}</q-item-label>
          </q-item-section>
          <q-item-section side top><span class="lk-meta">{{ ago(n.created_at) }}</span></q-item-section>
        </q-item>
      </q-list>
      <div v-else class="lk-bell-empty">
        <q-icon name="notifications_none" size="32px" class="lk-dim" />
        <div class="lk-meta">Nothing yet. You will be told here when a recording starts or a lecture is ready, on every device.</div>
      </div>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '../stores/notifications'
import { useLibraryStore } from '../stores/library'

const notes = useNotificationsStore()
const library = useLibraryStore()
const router = useRouter()
const LOOK = {
  recording_started: { color: 'negative', icon: 'fiber_manual_record' },
  processing_started: { color: 'primary', icon: 'autorenew' },
  notes_ready: { color: 'positive', icon: 'check' },
  replay_ready: { color: 'teal', icon: 'movie' },
  failed: { color: 'negative', icon: 'error_outline' },
}
const look = (n) => LOOK[n.kind] || { color: 'grey', icon: 'notifications' }
// notices about lectures that were deleted since are not shown
const shown = computed(() => notes.items.filter((i) => !library.loaded || !i.session_id || library.session(i.session_id)))

function open(n) {
  notes.markRead(n.id)
  if (n.session_id) router.push(`/sessions/${n.session_id}`)
}
function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)} min`
  if (s < 86400) return `${Math.floor(s / 3600)} h`
  return `${Math.floor(s / 86400)} d`
}
</script>

<style scoped>
.lk-bell-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; min-width: 340px; }
.lk-bell-list { max-height: 360px; overflow-y: auto; }
.lk-bell-list .unread { background: var(--lk-tint); }
.lk-bell-title { font-weight: 500; }
.lk-bell-empty { padding: 28px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; max-width: 340px; }
</style>
