<template>
  <q-page class="lk-page">
    <div class="lk-card" style="max-width: 560px">
      <empty-state icon="search_off" text="That page was not found.">
        <q-btn unelevated color="primary" label="Back to the dashboard" to="/" />
      </empty-state>
    </div>
  </q-page>
</template>

<script setup>
import EmptyState from '../components/EmptyState.vue'
</script>
