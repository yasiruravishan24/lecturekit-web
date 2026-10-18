import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Dialog } from 'quasar'
import 'quasar/dist/quasar.css'
import './css/app.scss'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth'

// an old address with a # (/#/sessions/12) becomes the normal one (/sessions/12)
if (location.hash.startsWith('#/')) history.replaceState(null, '', location.hash.slice(1))

const app = createApp(App)
app.use(Quasar, {
  plugins: { Notify, Dialog },
  config: { notify: { position: 'top', timeout: 4000 }, brand: { primary: '#1976D2' } },
})
app.use(createPinia())
useAuthStore().wire(router)
app.use(router)
app.mount('#app')
