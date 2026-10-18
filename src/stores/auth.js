import { defineStore } from 'pinia'
import * as authApi from '../api/auth'
import { configureClient } from '../api/client'

const KEY = 'lk_token'
const KEY_EXP = 'lk_expires'

const read = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* private window */ } }

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: read(KEY),
    expiresAt: read(KEY_EXP),
    user: null,
    config: null,                 // from GET /auth/config: Google client id and the server limits
    checked: false,               // has the stored token been checked with /auth/me
    pendingPassword: '',          // kept in memory only, for the one flow register -> confirm -> login
  }),
  getters: {
    loggedIn: (s) => !!s.token && (!s.expiresAt || new Date(s.expiresAt) > new Date()),
    limits: (s) => (s.config && s.config.limits) || { daily_limit: 5, keep_media_days: 7, max_recording_mb: 1500, max_slides_mb: 100, max_recording_parts: 10 },
  },
  actions: {
    wire(router) {
      configureClient({
        getToken: () => this.token,
        unauthorized: () => {
          const had = !!this.token
          this.clear()
          if (had) router.push({ path: '/login', query: { reason: 'expired' } })
        },
      })
    },
    setSession({ token, expires_at, user }) {
      this.token = token
      this.expiresAt = expires_at
      this.user = user
      this.checked = true
      write(KEY, token)
      write(KEY_EXP, expires_at)
    },
    clear() {
      this.token = null
      this.expiresAt = null
      this.user = null
      this.checked = false
      write(KEY, null)
      write(KEY_EXP, null)
    },
    async loadConfig() {
      if (!this.config) this.config = await authApi.getConfig()
      return this.config
    },
    async login(email, password) {
      this.setSession(await authApi.login(email, password))
    },
    async loginWithGoogle(idToken, acceptTerms) {
      this.setSession(await authApi.googleLogin(idToken, acceptTerms))
    },
    async check() {
      if (this.checked || !this.token) return
      try {
        this.user = (await authApi.me()).user
        this.checked = true
      } catch (e) {
        if (e.status === 401) this.clear()
        else throw e
      }
    },
    logout() {
      this.clear()
    },
  },
})
