<template>
  <div class="lk-legal">
    <router-view />
    <footer class="lk-legal-foot">&copy; {{ new Date().getFullYear() }} Lecture Assistant</footer>
  </div>
</template>

<style scoped>
.lk-legal { min-height: 100vh; background: var(--lk-bg); display: flex; flex-direction: column; }
.lk-legal-foot { margin-top: auto; padding: 24px 16px 32px; text-align: center; color: var(--lk-text-2); font-size: 13px; }
@media print { .lk-legal-foot { display: none; } }
</style>
