<template>
  <section :id="id" class="lk-legal-section">
    <h2><span class="num">{{ n }}</span>{{ title }}</h2>
    <div class="body"><slot /></div>
  </section>
</template>

<script setup>
defineProps({ id: { type: String, required: true }, n: { type: Number, required: true }, title: { type: String, required: true } })
</script>

<style scoped>
.lk-legal-section { scroll-margin-top: 24px; padding: 28px 0; border-top: 1px solid var(--lk-border); }
.lk-legal-section:first-of-type { border-top: 0; padding-top: 8px; }
h2 { display: flex; align-items: center; gap: 12px; font-size: 20px; font-weight: 500; margin: 0 0 4px; letter-spacing: -0.01em; line-height: 1.3; }
.num { flex: none; width: 30px; height: 30px; border-radius: 50%; background: var(--lk-tint); color: var(--lk-link); font-size: 14px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.body { padding-left: 42px; }
.body :deep(> :first-child) { margin-top: 0; }
.body :deep(p) { margin: 0 0 12px; line-height: 1.75; max-width: 70ch; }
.body :deep(ul) { margin: 0 0 12px; padding-left: 20px; max-width: 70ch; }
.body :deep(li) { margin-bottom: 8px; line-height: 1.7; }
.body :deep(li::marker) { color: var(--lk-link); }
@media (max-width: 599px) { .body { padding-left: 0; } }
</style>
