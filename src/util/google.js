// Google Identity Services: the sign-in button and the ID token the server checks (POST /auth/google).
let pending = null

export function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.onload = () => resolve(window.google)
      s.onerror = () => { pending = null; reject(new Error('Google sign-in could not be loaded')) }
      document.head.appendChild(s)
    })
  }
  return pending
}
