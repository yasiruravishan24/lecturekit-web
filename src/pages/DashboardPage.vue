<template>
  <q-page class="lk-page">
    <h1 class="lk-title">Dashboard</h1>

    <div class="lk-grid3">
      <q-card flat bordered class="lk-card"><q-card-section class="lk-stat">
        <div>
          <div class="lk-label">Courses</div>
          <div class="lk-stat-number">{{ counts.courses }}</div>
          <div class="lk-meta">{{ plural(counts.modules, 'module') }}</div>
        </div>
        <span class="lk-badge-icon"><q-icon name="folder_copy" size="28px" /></span>
      </q-card-section></q-card>
      <q-card flat bordered class="lk-card"><q-card-section class="lk-stat">
        <div>
          <div class="lk-label">Lectures</div>
          <div class="lk-stat-number">{{ counts.lectures }}</div>
          <div class="lk-meta">{{ counts.ready }} completed · {{ counts.processing }} processing</div>
        </div>
        <span class="lk-badge-icon"><q-icon name="school" size="28px" /></span>
      </q-card-section></q-card>
      <q-card flat class="lk-card lk-start"><q-card-section class="lk-stat">
        <div>
          <div class="lk-label">Start</div>
          <div style="font-size: 18px; margin: 6px 0 12px">Turn a lecture into notes and a quiz</div>
          <q-btn unelevated color="white" text-color="primary" icon="add" label="New session" to="/new" />
        </div>
      </q-card-section></q-card>
    </div>

    <q-card flat bordered class="lk-card q-mt-lg">
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
      <empty-state v-else-if="library.loaded" icon="school" text="No lectures yet. Add your first lecture.">
        <q-btn unelevated color="primary" icon="add" label="New session" to="/new" />
      </empty-state>
      <q-inner-loading :showing="library.loading && !library.loaded" />
    </q-card>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useLibraryStore } from '../stores/library'
import SessionRow from '../components/SessionRow.vue'
import EmptyState from '../components/EmptyState.vue'
import { plural } from '../util/format'

const library = useLibraryStore()
const counts = computed(() => library.counts)
const recent = computed(() => [...library.allSessions].sort((a, b) => b.id - a.id).slice(0, 5))
</script>
