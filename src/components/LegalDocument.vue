<template>
  <div>
    <section class="lk-hero">
      <wave-to-notes class="lk-hero-art" />
      <div class="lk-hero-top">
        <q-btn unelevated rounded no-caps icon="arrow_back" :label="back.label" :to="back.to" class="lk-hero-back" />
        <q-btn flat round dense color="white" :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" :aria-label="$q.dark.isActive ? 'Switch to light mode' : 'Switch to dark mode'" @click="ui.toggleDark()" />
      </div>
      <div class="lk-hero-inner">
        <h1>{{ title }}</h1>
        <p>{{ lead }}</p>
      </div>
    </section>

    <div class="lk-legal-grid">
      <aside class="lk-toc" aria-label="On this page">
        <q-expansion-item v-if="$q.screen.lt.md" label="On this page" icon="list" class="lk-card" dense>
          <q-list><q-item v-for="(s, i) in toc" :key="s.id" clickable dense @click="go(s.id)"><q-item-section>{{ i + 1 }}. {{ s.title }}</q-item-section></q-item></q-list>
        </q-expansion-item>
        <div v-else class="lk-toc-card">
          <div class="lk-label q-mb-sm">On this page</div>
          <a v-for="(s, i) in toc" :key="s.id" :href="`#${s.id}`" :class="{ on: active === s.id }" @click.prevent="go(s.id)">
            <span>{{ i + 1 }}</span>{{ s.title }}
          </a>
        </div>
      </aside>

      <article class="lk-doc-card lk-card">
        <div class="lk-glance">
          <div class="lk-glance-title"><q-icon name="bolt" size="20px" /> In short</div>
          <ul><li v-for="(g, i) in glance" :key="i">{{ g }}</li></ul>
        </div>
        <slot />
      </article>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import WaveToNotes from './WaveToNotes.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '../stores/ui'

const ui = useUiStore()
const route = useRoute()

// the button goes back to the page the person came from (?from=...), else to the app
const BACK = {
  login: { label: 'Back to log in', to: '/login' },
  register: { label: 'Back to sign up', to: '/register' },
  settings: { label: 'Back to settings', to: '/settings' },
}
const back = computed(() => BACK[route.query.from] || { label: 'Back to the app', to: '/' })

const props = defineProps({
  title: { type: String, required: true },
  lead: { type: String, required: true },
  glance: { type: Array, default: () => [] },
  toc: { type: Array, required: true },                 // [{ id, title }]
})

const active = ref(props.toc[0] && props.toc[0].id)
let observer = null

const go = (id) => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
  // highlight the section that is being read
  observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
    if (visible.length) active.value = visible[0].target.id
  }, { rootMargin: '-80px 0px -65% 0px' })
  document.querySelectorAll('.lk-legal-section').forEach((el) => observer.observe(el))
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => { observer && observer.disconnect(); window.removeEventListener('scroll', onScroll) })

// at the very bottom the last section is the one being read, even if it is too short to reach the top
const onScroll = () => {
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) active.value = props.toc[props.toc.length - 1].id
}
</script>

<style scoped>
.lk-hero { position: relative; overflow: hidden; background: linear-gradient(120deg, #1259b5, #1976d2, #2a9df4, #1565c0, #1e88e5); background-size: 300% 300%; animation: sweep 22s ease-in-out infinite; color: #fff; padding: 20px 28px 56px; }
@keyframes sweep { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
/* two soft blurred circles drifting slowly behind the text */
.lk-hero::before, .lk-hero::after { content: ''; position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; }
.lk-hero::before { width: 360px; height: 360px; left: -80px; top: -140px; background: rgba(120, 190, 255, 0.45); animation: drift 16s ease-in-out infinite alternate; }
.lk-hero::after { width: 300px; height: 300px; right: 18%; bottom: -170px; background: rgba(10, 70, 160, 0.5); animation: drift 20s ease-in-out infinite alternate-reverse; }
@keyframes drift { from { transform: translate(0, 0); } to { transform: translate(70px, 40px); } }
.lk-hero-art { position: absolute; right: max(28px, calc(50% - 540px)); top: 54%; transform: translateY(-42%); width: 330px; z-index: 1; }
.lk-hero-inner { position: relative; z-index: 2; }
@media (max-width: 1023px) { .lk-hero-art { display: none; } }
@media (prefers-reduced-motion: reduce) { .lk-hero, .lk-hero::before, .lk-hero::after { animation: none; } }
.lk-hero-top { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; margin: 0 -8px 28px; }   /* the full width of the page, not the text column */
.lk-hero-back { background: rgba(255, 255, 255, 0.18); color: #fff; padding: 4px 18px 4px 12px; font-weight: 500; backdrop-filter: blur(4px); transition: background 0.15s; }
.lk-hero-back:hover { background: rgba(255, 255, 255, 0.3); }
.lk-hero-inner { max-width: 1080px; margin: 0 auto; }
.lk-hero h1 { font-size: 38px; font-weight: 500; letter-spacing: -0.02em; margin: 0 0 10px; line-height: 1.2; }
.lk-hero p { margin: 0; max-width: 62ch; font-size: 17px; line-height: 1.6; opacity: 0.92; }

.lk-legal-grid { max-width: 1080px; width: 100%; margin: -24px auto 40px; padding: 0 16px; display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 24px; align-items: start; }
.lk-toc { position: sticky; top: 24px; }
.lk-toc-card { background: var(--lk-surface); border: 1px solid var(--lk-border); border-radius: var(--lk-radius); box-shadow: var(--lk-shadow); padding: 16px 12px; }
.lk-toc-card .lk-label { padding: 0 8px; }
.lk-toc-card a { display: flex; gap: 10px; padding: 7px 8px; border-radius: 8px; color: var(--lk-text-2); text-decoration: none; font-size: 14px; line-height: 1.35; border-left: 3px solid transparent; }
.lk-toc-card a span { flex: none; width: 18px; color: var(--lk-text-2); font-variant-numeric: tabular-nums; }
.lk-toc-card a:hover { background: var(--lk-tint); color: var(--lk-text); }
.lk-toc-card a.on { background: var(--lk-tint); color: var(--lk-link); font-weight: 500; border-left-color: var(--lk-primary); }
.lk-doc-card { padding: 32px 40px 24px; margin-top: 0; }

.lk-glance { background: var(--lk-tint); border-radius: 12px; padding: 18px 22px; margin-bottom: 20px; }
.lk-glance-title { display: flex; align-items: center; gap: 8px; font-weight: 500; color: var(--lk-link); margin-bottom: 8px; }
.lk-glance ul { margin: 0; padding-left: 20px; }
.lk-glance li { margin-bottom: 4px; line-height: 1.6; }

@media (max-width: 1023px) {
  .lk-legal-grid { grid-template-columns: 1fr; margin-top: -20px; }
  .lk-toc { position: static; padding-top: 0; }
  .lk-hero h1 { font-size: 30px; }
  .lk-doc-card { padding: 24px 20px 12px; }
}
@media print { .lk-hero-top { display: none; } .lk-hero { background: none; color: #000; padding: 0 0 16px; } .lk-toc { display: none; } .lk-legal-grid { display: block; margin: 0; } }
</style>
