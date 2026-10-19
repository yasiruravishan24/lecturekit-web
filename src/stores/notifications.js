import { defineStore } from 'pinia'

// "Your notes are ready" / "Processing failed", kept in this browser. They are made when the lecture list shows that a lecture
// which was being processed has finished, so they appear while the app is open or the next time it is opened.
const MAX = 30
const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) || fallback } catch { return fallback } }
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private window */ } }
const BUSY = ['queued', 'processing']

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({ uid: null, items: [], states: {} }),
  getters: { unread: (s) => s.items.filter((i) => !i.read).length },
  actions: {
    start(userId) {
      this.uid = userId
      this.items = read(`lk_notes_${userId}`, [])
      this.states = read(`lk_states_${userId}`, {})
    },
    // sessions: the flat list of lectures. Returns the notifications just made.
    observe(sessions) {
      if (this.uid == null) return []
      const made = []
      const next = {}
      for (const s of sessions) {
        next[s.id] = s.state
        if (BUSY.includes(this.states[s.id]) && (s.state === 'done' || s.state === 'failed')) {
          made.push({ id: `${s.id}-${Date.now()}`, sessionId: s.id, title: s.title, kind: s.state, at: new Date().toISOString(), read: false })
        }
      }
      this.states = next
      write(`lk_states_${this.uid}`, next)
      if (made.length) {
        this.items = [...made, ...this.items].slice(0, MAX)
        write(`lk_notes_${this.uid}`, this.items)
      }
      return made
    },
    markRead(id) {
      this.items = this.items.map((i) => (i.id === id ? { ...i, read: true } : i))
      write(`lk_notes_${this.uid}`, this.items)
    },
    markAllRead() {
      this.items = this.items.map((i) => ({ ...i, read: true }))
      write(`lk_notes_${this.uid}`, this.items)
    },
    clear() {
      this.items = []
      write(`lk_notes_${this.uid}`, [])
    },
  },
})
