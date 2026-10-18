import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// hash mode: the server only serves index.html at "/", so /#/sessions/12 works without extra server code
export const routes = [
  {
    path: '/',
    component: () => import('../layouts/AuthLayout.vue'),
    meta: { guest: true },
    children: [
      { path: 'login', name: 'login', component: () => import('../pages/LoginPage.vue') },
      { path: 'register', name: 'register', component: () => import('../pages/RegisterPage.vue') },
      { path: 'verify', name: 'verify', component: () => import('../pages/VerifyPage.vue') },
    ],
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('../pages/DashboardPage.vue') },
      { path: 'courses', name: 'courses', component: () => import('../pages/CoursesPage.vue') },
      { path: 'modules/:id', name: 'module', component: () => import('../pages/ModulePage.vue'), props: true },
      { path: 'new', name: 'new', component: () => import('../pages/NewSessionPage.vue') },
      { path: 'sessions/:id', name: 'session', component: () => import('../pages/SessionPage.vue'), props: true },
      { path: 'quizzes', name: 'quizzes', component: () => import('../pages/QuizzesPage.vue') },
      { path: 'quiz/:sessionId', name: 'quiz', component: () => import('../pages/QuizRunPage.vue'), props: true },
      { path: 'quiz/:sessionId/result', name: 'quiz-result', component: () => import('../pages/QuizResultPage.vue'), props: true },
      { path: 'settings', name: 'settings', component: () => import('../pages/SettingsPage.vue') },
      { path: ':rest(.*)*', name: 'not-found', component: () => import('../pages/NotFoundPage.vue') },
    ],
  },
]

export const router = createRouter({ history: createWebHashHistory(), routes, scrollBehavior: () => ({ top: 0 }) })

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.matched.some((r) => r.meta.requiresAuth)) {
    if (!auth.loggedIn) {
      auth.clear()
      return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
    }
    try { await auth.check() } catch { /* offline: let the page show its own network message */ }
    if (!auth.loggedIn) return { name: 'login', query: { reason: 'expired' } }
  }
  if (to.meta.guest && auth.loggedIn && to.name !== 'verify') return { name: 'dashboard' }
  return true
})
