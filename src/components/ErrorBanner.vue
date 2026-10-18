<template>
  <q-banner v-if="message" rounded class="q-mb-md" :class="info ? 'bg-blue-1 text-primary' : 'bg-red-1 text-negative'" role="alert">
    <template #avatar><q-icon :name="info ? 'info' : 'error'" /></template>
    {{ message }}
    <template v-if="$slots.default" #action><slot /></template>
  </q-banner>
</template>

<script setup>
defineProps({ message: { type: String, default: '' }, info: { type: Boolean, default: false } })
</script>
