import { defineConfig } from '@playwright/test'

// The end-to-end test needs `npm run dev` (port 5173) and the local Docker stack (see tests/e2e/flow.spec.js).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 420000,
  expect: { timeout: 15000 },
  reporter: 'list',
  use: { ignoreHTTPSErrors: true, baseURL: process.env.LK_WEB || 'http://localhost:5173', viewport: { width: 1440, height: 900 }, screenshot: 'off' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
