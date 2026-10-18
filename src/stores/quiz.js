import { defineStore } from 'pinia'

// The result of the attempt just submitted. It is only held in memory: quiz answers are never cached before a submit.
export const useQuizStore = defineStore('quiz', {
  state: () => ({ result: null, questions: [], sessionId: null, chosen: {} }),
  actions: {
    setResult(sessionId, questions, chosen, result) {
      Object.assign(this, { sessionId: Number(sessionId), questions, chosen: { ...chosen }, result })
    },
    clear() { Object.assign(this, { result: null, questions: [], sessionId: null, chosen: {} }) },
  },
})
