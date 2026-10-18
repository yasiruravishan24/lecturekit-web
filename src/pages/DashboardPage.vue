<template>
  <q-page class="lk-page">
    <h1 class="lk-title">Dashboard</h1>

    <div class="lk-grid3">
      <q-card flat bordered class="lk-card"><q-card-section>
        <div class="lk-label">Courses</div>
        <div style="font-size: 40px; line-height: 1.2">{{ counts.courses }}</div>
        <div class="lk-meta">{{ plural(counts.modules, 'module') }}</div>
      </q-card-section></q-card>
      <q-card flat bordered class="lk-card"><q-card-section>
        <div class="lk-label">Lectures</div>
        <div style="font-size: 40px; line-height: 1.2">{{ counts.lectures }}</div>
        <div class="lk-meta">{{ counts.ready }} ready · {{ counts.processing }} processing</div>
      </q-card-section></q-card>
      <q-card flat bordered class="lk-card"><q-card-section>
        <div class="lk-label">Start</div>
        <q-btn unelevated color="primary" icon="add" label="New session" to="/new" class="q-mt-md" />
      </q-card-section></q-card>
    </div>

    <q-card flat bordered class="lk-card q-mt-lg" style="max-width: 1000px">
      <q-card-section class="row items-center no-wrap">
        <q-icon name="history" size="32px" color="primary" class="q-mr-md" />
        <div>
          <div class="lk-section-title">Recent lectures</div>
          <div class="lk-meta">Your last five sessions</div>
        </div>
      </q-card-section>
      <q-separator />
      <q-list v-if="recent.length" separator>
        <session-row v-for="s in recent" :key="s.id" :session="s" show-module />
      </q-list>
      <q-card-section v-else-if="library.loaded" class="text-center q-py-lg">
        <div class="lk-meta q-mb-md">No lectures yet. Add your first lecture.</div>
        <q-btn unelevated color="primary" label="New session" to="/new" />
      </q-card-section>
      <q-inner-loading :showing="library.loading && !library.loaded" />
    </q-card>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useLibraryStore } from '../stores/library'
import SessionRow from '../components/SessionRow.vue'
import { plural } from '../util/format'

const library = useLibraryStore()
const counts = computed(() => library.counts)
const recent = computed(() => [...library.allSessions].sort((a, b) => b.id - a.id).slice(0, 5))
</script>
