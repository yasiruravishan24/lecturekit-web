<template>
  <div class="lk-search" ref="root">
    <q-btn v-if="small" flat round dense icon="search" aria-label="Search" @click="dialog = true" />
    <div v-else class="lk-search-box" :class="{ open }">
      <q-icon name="search" size="20px" class="lk-search-ico" />
      <input ref="input" v-model="query" class="lk-search-input" type="search" placeholder="Search lectures, courses and modules  ( / )" aria-label="Search"
             autocomplete="off" @focus="open = true" @keydown="onKey" />
      <div v-if="open" class="lk-search-pop" role="listbox">
        <search-results :groups="groups" :active="active" :query="query" @pick="go" @hover="active = $event" />
      </div>
    </div>

    <q-dialog v-model="dialog" position="top" @show="$refs.mobileInput && $refs.mobileInput.focus()">
      <q-card class="lk-search-dialog">
        <div class="lk-search-box open">
          <q-icon name="search" size="20px" class="lk-search-ico" />
          <input ref="mobileInput" v-model="query" class="lk-search-input" type="search" placeholder="Search lectures, courses and modules" aria-label="Search" autocomplete="off" @keydown="onKey" />
        </div>
        <search-results :groups="groups" :active="active" :query="query" @pick="go" @hover="active = $event" />
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar, QIcon } from 'quasar'
import { useLibraryStore } from '../stores/library'
import { statusOf } from '../util/status'

const $q = useQuasar()
const router = useRouter()
const library = useLibraryStore()
const root = ref(null)
const input = ref(null)
const query = ref('')
const open = ref(false)
const dialog = ref(false)
const active = ref(0)
const small = computed(() => $q.screen.lt.md)

// the list: grouped, in this order. With no text, the latest lectures are offered.
const groups = computed(() => {
  const q = query.value.trim().toLowerCase()
  const sessions = [...library.allSessions].sort((a, b) => b.id - a.id)
  const mods = library.courses.flatMap((c) => c.modules.map((m) => ({ ...m, course_name: c.name, course_id: c.id })))
  const hit = (...parts) => parts.some((p) => (p || '').toLowerCase().includes(q))
  const rank = (name) => ((name || '').toLowerCase().startsWith(q) ? 0 : 1)
  const out = []
  if (!q) {
    out.push({ title: 'Recent lectures', items: sessions.slice(0, 6).map(lecture) })
  } else {
    const l = sessions.filter((s) => hit(s.title, s.module_name, s.course_name)).sort((a, b) => rank(a.title) - rank(b.title)).slice(0, 8).map(lecture)
    const m = mods.filter((x) => hit(x.name, x.course_name)).sort((a, b) => rank(a.name) - rank(b.name)).slice(0, 4).map((x) => ({ key: `m${x.id}`, icon: 'folder_open', title: x.name, sub: x.course_name, to: `/modules/${x.id}` }))
    const c = library.courses.filter((x) => hit(x.name)).slice(0, 3).map((x) => ({ key: `c${x.id}`, icon: 'folder', title: x.name, sub: `${x.modules.length} modules`, to: { path: '/courses', query: { course: x.id } } }))
    if (l.length) out.push({ title: 'Lectures', items: l })
    if (m.length) out.push({ title: 'Modules', items: m })
    if (c.length) out.push({ title: 'Courses', items: c })
  }
  return out
})
function lecture(s) {
  return { key: `s${s.id}`, icon: s.state === 'done' ? 'description' : 'hourglass_empty', title: s.title, sub: `${s.course_name} › ${s.module_name}`, chip: statusOf(s), to: `/sessions/${s.id}` }
}
const flat = computed(() => groups.value.flatMap((g) => g.items))
watch(query, () => { active.value = 0 })

function go(item) {
  open.value = false
  dialog.value = false
  query.value = ''
  if (input.value) input.value.blur()
  router.push(item.to)
}
function onKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); active.value = Math.min(flat.value.length - 1, active.value + 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); active.value = Math.max(0, active.value - 1) }
  else if (e.key === 'Enter' && flat.value[active.value]) { e.preventDefault(); go(flat.value[active.value]) }
  else if (e.key === 'Escape') { open.value = false; if (input.value) input.value.blur(); dialog.value = false }
}
const outside = (e) => { if (root.value && !root.value.contains(e.target)) open.value = false }
const shortcut = (e) => {
  const typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable
  if ((e.key === '/' && !typing && !e.ctrlKey && !e.metaKey) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
    e.preventDefault()
    if (small.value) dialog.value = true
    else if (input.value) input.value.focus()
  }
}
onMounted(() => { document.addEventListener('mousedown', outside); document.addEventListener('keydown', shortcut) })
onBeforeUnmount(() => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', shortcut) })

// the result list, used inline and in the phone dialog
const SearchResults = defineComponent({
  props: { groups: Array, active: Number, query: String },
  emits: ['pick', 'hover'],
  setup(props, { emit }) {
    return () => {
      const total = props.groups.reduce((n, g) => n + g.items.length, 0)
      if (!total) return h('div', { class: 'lk-search-empty' }, props.query ? `Nothing found for "${props.query}"` : 'No lectures yet')
      let index = -1
      return h('div', { class: 'lk-search-list' }, props.groups.map((g) => h('div', { class: 'lk-search-group', key: g.title }, [
        h('div', { class: 'lk-search-gt' }, g.title),
        ...g.items.map((it) => {
          index += 1
          const i = index
          return h('button', { type: 'button', role: 'option', key: it.key, class: ['lk-search-item', { on: props.active === i }], onMousedown: (e) => e.preventDefault(), onClick: () => emit('pick', it), onMousemove: () => emit('hover', i) }, [
            h(QIcon, { name: it.icon, size: '20px', class: 'lk-search-itemico' }),
            h('span', { class: 'lk-search-text' }, [h('span', { class: 'lk-search-title' }, it.title), h('span', { class: 'lk-search-sub' }, it.sub)]),
            it.chip ? h('span', { class: ['lk-chip', it.chip.css] }, it.chip.text) : null,
          ])
        }),
      ])))
    }
  },
})
</script>

<style scoped>
.lk-search { position: relative; flex: 1 1 auto; display: flex; justify-content: center; min-width: 0; padding: 0 12px; }
.lk-search-box { position: relative; width: 100%; max-width: 480px; display: flex; align-items: center; background: rgba(255, 255, 255, 0.16); border-radius: 10px; transition: background 0.15s; }
.lk-search-box:hover, .lk-search-box.open { background: rgba(255, 255, 255, 0.26); }
.lk-search-ico { position: absolute; left: 10px; color: #fff; pointer-events: none; }
.lk-search-input { width: 100%; height: 36px; border: 0; outline: 0; background: transparent; color: #fff; font: inherit; font-size: 14px; padding: 0 12px 0 38px; }
.lk-search-input::placeholder { color: rgba(255, 255, 255, 0.8); }
.lk-search-input:focus-visible { outline: 2px solid #fff; outline-offset: 1px; border-radius: 10px; }
.lk-search-pop { position: absolute; top: 44px; left: 0; right: 0; background: var(--lk-surface); color: var(--lk-text); border: 1px solid var(--lk-border); border-radius: 12px; box-shadow: var(--lk-shadow-lg); overflow: hidden; z-index: 10; }
.lk-search-dialog { width: 100%; max-width: 100%; border-radius: 0 0 14px 14px; }
.lk-search-dialog .lk-search-box { background: var(--lk-surface-2); max-width: none; border-radius: 0; }
.lk-search-dialog .lk-search-ico { color: var(--lk-text-2); }
.lk-search-dialog .lk-search-input { color: var(--lk-text); height: 48px; }
.lk-search-dialog .lk-search-input::placeholder { color: var(--lk-text-2); }
</style>

<style>
.lk-search-list { max-height: min(60vh, 420px); overflow-y: auto; padding: 6px; }
.lk-search-gt { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--lk-text-2); padding: 8px 10px 4px; }
.lk-search-item { width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; font: inherit; color: inherit; background: transparent; border: 0; border-radius: 8px; padding: 8px 10px; cursor: pointer; }
.lk-search-item.on { background: var(--lk-tint); }
.lk-search-itemico { flex: none; color: var(--lk-primary); }
.lk-search-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.lk-search-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lk-search-sub { font-size: 12px; color: var(--lk-text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lk-search-empty { padding: 22px 16px; text-align: center; color: var(--lk-text-2); }
</style>
