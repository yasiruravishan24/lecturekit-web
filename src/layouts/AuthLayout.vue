<template>
  <div class="lk-auth">
    <div class="lk-ambient" aria-hidden="true"><span /><span /><span /></div>
    <q-btn round flat class="lk-theme-btn lk-flat" :icon="isDark ? 'light_mode' : 'dark_mode'" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="ui.toggleDark()">
      <q-tooltip>{{ isDark ? 'Light mode' : 'Dark mode' }}</q-tooltip>
    </q-btn>
    <div class="lk-auth-wrap">
      <div class="lk-halo" aria-hidden="true" />
    <q-card flat bordered class="lk-auth-card lk-card">
      <q-card-section class="q-pb-none">
        <div class="lk-logo text-primary">
          <span class="lk-logo-badge"><q-icon name="school" size="26px" /></span>
          <span style="font-size: 22px; font-weight: 500; letter-spacing: -0.01em">Lecture Assistant</span>
        </div>
      </q-card-section>
      <q-card-section>
        <router-view />
      </q-card-section>
    </q-card>
    </div>
    <div class="lk-meta lk-auth-foot">
      <router-link :to="{ path: '/terms', query: { from } }" class="lk-link">Terms &amp; Conditions</router-link> · <router-link :to="{ path: '/privacy', query: { from } }" class="lk-link">Privacy Policy</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUiStore } from '../stores/ui'

const $q = useQuasar()
const ui = useUiStore()
const isDark = computed(() => $q.dark.isActive)
const route = useRoute()
const from = computed(() => (route.name === 'register' ? 'register' : 'login'))     // where the footer links were opened from
</script>

<style scoped>
.lk-auth { flex-direction: column; }
.lk-auth-foot { margin-top: 16px; text-align: center; }
.lk-theme-btn { position: absolute; top: 16px; right: 16px; }
.lk-auth-card :deep(.q-card__section) { padding: 24px 36px; }
.lk-auth-card :deep(.q-card__section.q-pb-none) { padding-bottom: 0; }
@media (max-width: 599px) { .lk-auth-card :deep(.q-card__section) { padding: 20px 20px; } }
</style>
