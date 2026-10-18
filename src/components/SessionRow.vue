<template>
  <q-item clickable :to="`/sessions/${session.id}`" class="lk-session-row">
    <q-item-section avatar><q-icon :name="kind.icon" color="primary" /></q-item-section>
    <q-item-section>
      <q-item-label>{{ session.title }}</q-item-label>
      <q-item-label caption>{{ meta }}</q-item-label>
    </q-item-section>
    <q-item-section side><status-chip :session="session" /></q-item-section>
  </q-item>
</template>

<script setup>
import { computed } from 'vue'
import StatusChip from './StatusChip.vue'
import { kindOf } from '../util/status'
import { formatDate, formatDuration } from '../util/format'

const props = defineProps({ session: { type: Object, required: true }, showModule: Boolean })
const kind = computed(() => kindOf(props.session))
const meta = computed(() => {
  const parts = []
  if (props.showModule && props.session.module_name) parts.push(props.session.module_name)
  parts.push([formatDate(props.session.created_at), kind.value.word].filter(Boolean).join(' · '))
  if (props.session.duration_seconds != null) parts.push(formatDuration(props.session.duration_seconds))
  return parts.join(' · ')
})
</script>
