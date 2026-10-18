<template>
  <!-- opens in a new tab, so a half-filled form is not lost; "from" tells the page where to go back to -->
  <a class="lk-link" :href="`/terms?from=${from}`" target="_blank" rel="noopener" @click.stop>Terms &amp; Conditions</a>
  and
  <a class="lk-link" :href="`/privacy?from=${from}`" target="_blank" rel="noopener" @click.stop>Privacy Policy</a>
</template>

<script setup>
defineProps({ from: { type: String, default: 'app' } })
</script>
