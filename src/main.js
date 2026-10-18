import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Dialog } from 'quasar'
import 'quasar/dist/quasar.css'
import './css/app.scss'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
app.use(Quasar, {
  plugins: { Notify, Dialog },
  config: { notify: { position: 'top', timeout: 4000 }, brand: { primary: '#1976D2' } },
})
app.use(createPinia())
useAuthStore().wire(router)
app.use(router)
app.mount('#app')
