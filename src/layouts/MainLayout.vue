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
          <q-menu class="lk-account-menu" anchor="bottom right" self="top right" :offset="[0, 8]">
            <div class="lk-acc-head">
              <q-avatar size="44px" font-size="17px" color="primary" text-color="white" style="font-weight: 500">{{ initialsText }}</q-avatar>
              <div class="lk-acc-who">
                <div class="lk-acc-name">{{ auth.user?.full_name || 'Account' }}</div>
                <div class="lk-acc-mail">{{ auth.user?.email }}</div>
              </div>
            </div>
            <q-separator />
            <q-list class="q-py-sm">
              <q-item clickable v-close-popup to="/settings">
                <q-item-section avatar><q-icon name="settings" /></q-item-section>
                <q-item-section>Settings</q-item-section>
              </q-item>
              <q-item clickable @click="ui.toggleDark()">
                <q-item-section avatar><q-icon :name="isDark ? 'dark_mode' : 'light_mode'" /></q-item-section>
                <q-item-section>Dark mode</q-item-section>
                <q-item-section side><q-toggle :model-value="isDark" dense color="primary" aria-label="Dark mode" @click.stop="ui.toggleDark()" /></q-item-section>
              </q-item>
            </q-list>
            <q-separator />
            <q-list class="q-py-sm">
              <q-item clickable v-close-popup class="lk-acc-logout" @click="logout">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Log out</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above :width="240" bordered class="lk-drawer">
      <q-scroll-area class="fit">
        <q-list class="lk-nav">
          <q-item v-for="n in nav" :key="n.to" clickable :to="n.to" :exact="n.exact" active-class="lk-nav-active" @click="closeIfSmall">
            <q-item-section avatar><q-icon :name="n.icon" /></q-item-section>
            <q-item-section>{{ n.label }}</q-item-section>
          </q-item>
        </q-list>
        <q-separator class="q-my-sm" />
        <div class="lk-side-head">
          <span class="lk-label">Courses<template v-if="library.courses.length"> · {{ library.courses.length }}</template></span>
          <q-btn flat round dense size="sm" icon="add" to="/courses" aria-label="Add a course"><q-tooltip>Add a course</q-tooltip></q-btn>
        </div>
        <div v-if="!library.courses.length && library.loaded" class="q-px-md q-pb-md lk-meta">No courses yet. Add your first course.</div>
        <ul class="lk-tree">
          <li v-for="c in library.courses" :key="c.id" class="lk-tree-course">
            <button type="button" class="lk-tree-row" :aria-expanded="isOpen(c)" @click="toggle(c)">
              <span class="lk-tree-icon"><q-icon :name="isOpen(c) ? 'folder_open' : 'folder'" size="20px" /></span>
              <span class="lk-tree-name">{{ c.name }}</span>
              <span class="lk-tree-count">{{ c.modules.length }}</span>
              <q-icon name="expand_more" size="20px" class="lk-tree-chev" :class="{ open: isOpen(c) }" />
            </button>
            <ul v-show="isOpen(c)" class="lk-tree-kids">
              <li v-for="m in c.modules" :key="m.id">
                <router-link :to="`/modules/${m.id}`" class="lk-tree-mod" active-class="on" @click="closeIfSmall">
                  <span class="lk-tree-dot" /><span class="lk-tree-name">{{ m.name }}</span>
                </router-link>
              </li>
              <li v-if="!c.modules.length">
                <router-link :to="{ path: '/courses', query: { course: c.id } }" class="lk-tree-add" @click="closeIfSmall"><q-icon name="add" size="16px" /> Add a module</router-link>
              </li>
            </ul>
          </li>
        </ul>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component, route: current }">
        <transition name="lk-fade" mode="out-in">
          <component :is="Component" :key="current.path" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth'
import { useLibraryStore } from '../stores/library'
import { useUiStore } from '../stores/ui'
import { initials } from '../util/format'
import { friendly } from '../util/errors'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const library = useLibraryStore()
const ui = useUiStore()
const isDark = computed(() => $q.dark.isActive)
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
const opened = ref({})                                   // what the person opened or closed by hand
const hasCurrent = (c) => route.path.startsWith('/modules/') && c.modules.some((m) => String(m.id) === String(route.params.id))
const isOpen = (c) => (c.id in opened.value ? opened.value[c.id] : hasCurrent(c))
const toggle = (c) => { opened.value = { ...opened.value, [c.id]: !isOpen(c) } }

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
