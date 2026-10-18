<template>
  <q-card flat bordered class="lk-card" style="max-width: 720px">
    <q-card-section>
      <div class="lk-section-title">Making your notes</div>
      <div class="lk-meta q-mt-xs">This takes a few minutes. You can leave this page and come back; the lecture will show as Ready.</div>
      <q-linear-progress :value="percent / 100" rounded size="8px" class="q-mt-md" :indeterminate="job && job.state === 'queued'" />
      <div class="row justify-between q-mt-xs">
        <span>{{ stageText(job ? job.stage : 'starting') }}</span>
        <strong v-if="!(job && job.state === 'queued')">{{ percent }}%</strong>
      </div>
      <q-list class="q-mt-md">
        <q-item v-for="(s, i) in steps" :key="s.key" dense class="q-px-none">
          <q-item-section avatar>
            <q-icon v-if="i < current" name="check_circle" color="positive" />
            <q-icon v-else-if="i === current" name="autorenew" color="primary" class="lk-spin" />
            <q-icon v-else name="radio_button_unchecked" color="grey-5" />
          </q-item-section>
          <q-item-section :class="{ 'text-weight-bold': i === current, 'text-grey-6': i > current }">{{ s.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { currentStep, stageText, stepList } from '../util/stages'

const props = defineProps({ job: { type: Object, default: null }, hasSlides: Boolean })
const percent = computed(() => Math.max(0, Math.min(100, (props.job && props.job.percent) || 0)))
const steps = computed(() => stepList(props.hasSlides))
const current = computed(() => currentStep(props.job ? props.job.stage : 'starting', props.job ? props.job.state : 'queued', props.hasSlides, percent.value))
</script>

<style scoped>
.lk-spin { animation: spin 1.4s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .lk-spin { animation: none; } }
</style>
