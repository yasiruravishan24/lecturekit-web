<template>
  <div class="lk-auth">
    <q-card flat bordered class="lk-auth-card">
      <q-card-section class="q-pb-none">
        <div class="row items-center no-wrap text-primary">
          <q-icon name="school" size="32px" />
          <span class="text-h6 q-ml-sm" style="font-weight: 500">Lecture Assistant</span>
        </div>
      </q-card-section>
      <q-card-section>
        <router-view />
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped>
.lk-auth { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; background: var(--lk-bg); }
.lk-auth-card { width: 100%; max-width: 600px; border-color: var(--lk-border); }
.lk-auth-card :deep(.q-card__section) { padding: 20px 32px; }
@media (max-width: 599px) { .lk-auth-card :deep(.q-card__section) { padding: 16px; } }
</style>
