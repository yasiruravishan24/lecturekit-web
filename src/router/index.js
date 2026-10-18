import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const guestRoute = (name, page) => ({
  path: `/${name}`,
  component: () => import('../layouts/AuthLayout.vue'),
  meta: { guest: true },
  children: [{ path: '', name, component: page }],
})

const legalRoute = (name, page) => ({
  path: `/${name}`,
  component: () => import('../layouts/LegalLayout.vue'),
  children: [{ path: '', name, component: page }],
})

// normal addresses (/sessions/12): the server answers any address that is not a file or /api with index.html
export const routes = [
  // each sign-in page is its own route inside the centered layout (a shared parent at "/" would also match "/" itself)
  legalRoute('terms', () => import('../pages/TermsPage.vue')),          // public: readable whether or not you are logged in
  legalRoute('privacy', () => import('../pages/PrivacyPage.vue')),
  guestRoute('login', () => import('../pages/LoginPage.vue')),
  guestRoute('register', () => import('../pages/RegisterPage.vue')),
  guestRoute('verify', () => import('../pages/VerifyPage.vue')),
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

export const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })

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
