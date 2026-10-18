<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white" style="height: 50px">
      <q-toolbar style="min-height: 50px">
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="drawer = !drawer" />
        <q-toolbar-title class="row items-center no-wrap" style="font-size: 20px; font-weight: 500">
          <q-icon name="school" size="28px" class="q-mr-sm" />
          Lecture Assistant
        </q-toolbar-title>
        <q-btn round flat no-caps aria-label="Account menu">
          <q-avatar size="32px" font-size="14px" color="white" text-color="primary" style="font-weight: 500">{{ initialsText }}</q-avatar>
          <q-menu>
            <q-list style="min-width: 200px">
              <q-item class="text-grey-8" dense>
                <q-item-section>
                  <q-item-label>{{ auth.user?.full_name || 'Account' }}</q-item-label>
                  <q-item-label caption>{{ auth.user?.email }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup to="/settings"><q-item-section avatar><q-icon name="settings" /></q-item-section><q-item-section>Settings</q-item-section></q-item>
              <q-item clickable v-close-popup @click="logout"><q-item-section avatar><q-icon name="logout" /></q-item-section><q-item-section>Log out</q-item-section></q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above :width="240" bordered class="bg-white lk-drawer">
      <q-scroll-area class="fit">
        <q-list>
          <q-item v-for="n in nav" :key="n.to" clickable :to="n.to" :exact="n.exact" active-class="lk-nav-active" @click="closeIfSmall">
            <q-item-section avatar><q-icon :name="n.icon" /></q-item-section>
            <q-item-section>{{ n.label }}</q-item-section>
          </q-item>
        </q-list>
        <q-separator class="q-my-sm" />
        <div class="lk-label q-px-md q-py-sm">Courses</div>
        <div v-if="!library.courses.length && library.loaded" class="q-px-md q-pb-md lk-meta">No courses yet. Add your first course.</div>
        <q-list>
          <q-expansion-item v-for="c in library.courses" :key="c.id" :label="c.name" icon="folder" expand-separator :default-opened="isCourseOpen(c)">
            <q-item v-for="m in c.modules" :key="m.id" clickable :to="`/modules/${m.id}`" class="lk-sub" active-class="lk-nav-active" @click="closeIfSmall">
              <q-item-section>{{ m.name }}</q-item-section>
            </q-item>
            <div v-if="!c.modules.length" class="lk-sub q-py-xs lk-meta">No modules yet</div>
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth'
import { useLibraryStore } from '../stores/library'
import { initials } from '../util/format'
import { friendly } from '../util/errors'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const library = useLibraryStore()
const drawer = ref(false)

const nav = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', exact: true },
  { to: '/courses', label: 'My courses', icon: 'folder_copy' },
  { to: '/new', label: 'New session', icon: 'add_circle' },
  { to: '/quizzes', label: 'Quizzes', icon: 'quiz' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

const initialsText = computed(() => initials(auth.user?.full_name, auth.user?.email))
const closeIfSmall = () => { if ($q.screen.lt.md) drawer.value = false }
const isCourseOpen = (c) => c.modules.some((m) => String(m.id) === String(route.params.id))

function logout() {
  auth.logout()
  library.reset()
  router.push('/login')
}

// lectures being processed change by themselves: refresh the lists now and then while any is busy and the tab is visible
let timer = null
onMounted(async () => {
  try { await library.load() } catch (e) { $q.notify({ type: 'negative', message: friendly(e) }) }
  timer = setInterval(() => {
    if (library.anyBusy && !document.hidden) library.refresh().catch(() => {})
  }, 6000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
