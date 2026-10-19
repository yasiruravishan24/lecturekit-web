import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

// LK_API: where `npm run dev` forwards /api (the local Docker stack by default, self-signed certificate)
const api = process.env.LK_API || 'https://localhost:8443'

export default defineConfig({
  base: '/',
  plugins: [vue({ template: { transformAssetUrls } }), quasar()],
  server: { port: 5173, proxy: { '/api': { target: api, changeOrigin: true, secure: false, ws: true } } },
  test: { environment: 'jsdom', include: ['tests/**/*.test.js'] },
})
