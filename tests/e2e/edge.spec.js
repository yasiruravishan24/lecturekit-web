// Failure and edge cases in a real browser: failed job and retry, the daily limit, someone else's lecture,
// several recording files, small screens and printing. Needs the same set-up as flow.spec.js.
import { test, expect } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { loginAs, makeSession, makeUser, sample, startProcessing, upload, waitDone } from './helpers'

const shots = path.join(import.meta.dirname, '../../test-results/shots')
mkdirSync(shots, { recursive: true })

test('a logged-out visitor is sent to the login page, whatever address is opened', async ({ page }) => {
  for (const address of ['/', '/courses', '/sessions/1', '/nowhere']) {
    await page.goto(address)
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible()
  }
  await page.goto('/sessions/1')
  await expect(page).toHaveURL(/redirect=/)                            // and back to the lecture after logging in
})

test('dark mode: switch from the account menu, remembered after a reload', async ({ page }) => {
  const user = await makeUser('dark')
  await makeSession(user, 'Night lecture')
  await loginAs(page, user)
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await expect(page.getByText('Recent lectures')).toBeVisible()
  await expect(page.locator('body')).not.toHaveClass(/body--dark/)
  await page.screenshot({ path: path.join(shots, 'd1-light-dashboard.png'), fullPage: true })
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByText('Dark mode').click()
  await expect(page.locator('body')).toHaveClass(/body--dark/)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)                                       // let the colours finish changing
  await page.screenshot({ path: path.join(shots, 'd2-dark-dashboard.png'), fullPage: true })
  await page.goto('/courses')
  await expect(page.locator('.lk-grid3').getByText('Programming Fundamentals')).toBeVisible()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(shots, 'd3-dark-courses.png'), fullPage: true })
  await page.reload()
  await expect(page.locator('body')).toHaveClass(/body--dark/)           // remembered
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByText('Dark mode').click()                                  // the same row switches back
  await expect(page.locator('body')).not.toHaveClass(/body--dark/)
})

test('dark and light mode can be switched on the login page too', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/login')
  await expect(page.locator('body')).not.toHaveClass(/body--dark/)
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect(page.locator('body')).toHaveClass(/body--dark/)
  await page.reload()
  await expect(page.locator('body')).toHaveClass(/body--dark/)           // remembered
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await expect(page.locator('body')).not.toHaveClass(/body--dark/)
  await page.goto('/register')
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible()
})

test('terms and privacy pages are public and linked from the sign-up form', async ({ page, context }) => {
  await page.goto('/register')
  const box = page.getByRole('checkbox', { name: /I understand and agree with the Terms & Conditions and Privacy Policy/ })
  await expect(box).toBeVisible()
  await expect(page.getByRole('link', { name: 'Terms & Conditions' }).first()).toHaveAttribute('target', '_blank')
  await page.getByRole('link', { name: 'Privacy Policy' }).first().click({ modifiers: [] })      // opens a new tab, the form stays
  const tab = await context.waitForEvent('page')
  await tab.waitForLoadState()
  await expect(tab.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
  await expect(tab).toHaveURL(/privacy\?from=register/)
  await expect(tab.getByRole('link', { name: 'Back to sign up' })).toBeVisible()          // it knows where we came from
  await expect(tab.getByText('10 GB').first()).toBeVisible()                                         // the numbers come from the server's settings
  await expect(page.getByLabel('Full name')).toBeVisible()
  await tab.close()
  await page.getByRole('button', { name: 'Create account' }).click()                          // not agreed yet
  await expect(page.getByText('Please agree to the Terms & Conditions and the Privacy Policy')).toBeVisible()
  // public pages, logged out
  await page.goto('/terms')
  await expect(page.getByRole('heading', { name: 'Terms & Conditions' })).toBeVisible()
  await expect(page.getByText('up to 5 lectures a day')).toBeVisible()
  await expect(page.locator('.lk-hero-art')).toBeVisible()                                   // the wave-to-notes picture on wide screens
  await expect(page.locator('.lk-legal-bar')).toHaveCount(0)                               // no top bar, only the banner with the back button
  await expect(page.getByRole('link', { name: 'Back to the app' })).toBeVisible()
  await expect(page.getByText(`© ${new Date().getFullYear()} Lecture Assistant`)).toBeVisible()   // a plain centered footer
  await page.screenshot({ path: path.join(shots, 'l1-terms-top.png') })
  await page.setViewportSize({ width: 390, height: 800 })
  await expect(page.locator('.lk-hero-art')).toBeHidden()                                    // and hidden on a phone
  await page.setViewportSize({ width: 1440, height: 900 })
  // and logged in
  const user = await makeUser('legal')
  await loginAs(page, user)
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
})

test('the back button of the legal pages goes back to where you came from', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Terms & Conditions' }).click()
  await expect(page).toHaveURL(/terms\?from=login/)
  const back = page.getByRole('link', { name: 'Back to log in' })
  await expect(back).toBeVisible()
  await page.getByRole('link', { name: 'Privacy Policy' }).first().click()                  // the link inside the text keeps the origin
  await expect(page).toHaveURL(/privacy\?from=login/)
  await expect(page.getByRole('link', { name: 'Back to log in' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to log in' }).click()
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible()
  await page.goto('/register')
  await page.getByRole('link', { name: 'Privacy Policy' }).last().click()
  await expect(page.getByRole('link', { name: 'Back to sign up' })).toBeVisible()
  await page.goto('/terms')
  await expect(page.getByRole('link', { name: 'Back to the app' })).toBeVisible()           // no origin given
  await page.goto('/terms?from=%3Cscript%3E')
  await expect(page.getByRole('link', { name: 'Back to the app' })).toBeVisible()           // an unknown value is ignored
  const user = await makeUser('backs')
  await loginAs(page, user)
  await page.goto('/settings')
  await page.getByRole('link', { name: 'Privacy Policy' }).click()
  await page.getByRole('link', { name: 'Back to settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
})

test('the login page: no tagline, a Google button that says why it is off, ambient glow', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('Notes and quizzes from your lectures')).toHaveCount(0)
  await expect(page.locator('.lk-ambient span')).toHaveCount(3)
  const google = page.getByRole('button', { name: 'Continue with Google' })
  await expect(google).toBeVisible()
  await expect(google).toBeDisabled()                                   // this local server has no Google client ID
  await page.goto('/register')
  await expect(page.locator('.lk-ambient span')).toHaveCount(3)
  await page.screenshot({ path: path.join(shots, 'a1-register-ambient.png') })
})

test('an old address with a # still works', async ({ page }) => {
  await page.goto('/#/nowhere')
  await expect(page).toHaveURL(/\/login\?redirect=.*nowhere$/)
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible()
})

test('a recording that cannot be read shows a plain message and Try again', async ({ page }) => {
  const user = await makeUser('failed')
  const { session } = await makeSession(user, 'Broken recording')
  await upload(user, session.id, [['broken.mp4', Buffer.from('this is not a video')]])
  await loginAs(page, user)
  await page.goto(`/sessions/${session.id}`)
  await expect(page.getByText('Ready to make notes')).toBeVisible()
  await page.getByRole('button', { name: 'Make notes' }).click()
  await expect(page.getByText('The notes could not be made')).toBeVisible({ timeout: 60000 })
  await expect(page.getByText('ffmpeg could not read this file')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  await expect(page.locator('.lk-chip', { hasText: 'Failed' })).toBeVisible()
  await page.screenshot({ path: path.join(shots, 'e1-failed.png'), fullPage: true })
})

test('the daily limit is explained and the lecture stays uploaded', async ({ page }) => {
  const user = await makeUser('limit')
  const { session, module } = await makeSession(user, 'First')
  for (let i = 0; i < 5; i++) {                                   // five quick failures use up the day (failed jobs count too)
    const s = i === 0 ? session : (await makeSession(user, `Extra ${i}`)).session
    await upload(user, s.id, [['broken.mp4', Buffer.from('not a video')]])
    await waitDone(user, (await startProcessing(user, s.id)).json.job_id)
  }
  await loginAs(page, user)
  await page.goto('/new')
  await page.getByLabel('Session title *').fill('Sixth lecture')
  await page.locator('input[type=file]').nth(0).setInputFiles(sample('chunk0.m4a'))
  await page.getByRole('button', { name: 'Create notes and quiz' }).click()
  await expect(page.getByText("You have reached today's limit. Try again tomorrow.").first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Make notes' })).toBeVisible()          // uploaded, waiting for tomorrow
  await page.screenshot({ path: path.join(shots, 'e2-daily-limit.png'), fullPage: true })
})

test("another account cannot open someone else's lecture", async ({ page }) => {
  const owner = await makeUser('owner')
  const { session } = await makeSession(owner, 'Private lecture')
  const other = await makeUser('other')
  await loginAs(page, other)
  await page.goto(`/sessions/${session.id}`)
  await expect(page.getByText('This lecture was not found.')).toBeVisible()
  await expect(page.getByText('Private lecture')).toHaveCount(0)
  await page.goto('/quiz/' + session.id)
  await expect(page.getByText('This quiz is not available yet.')).toBeVisible()
})

test('a lecture saved in two files is joined, and the small-screen layout and print view work', async ({ page }) => {
  const user = await makeUser('parts')
  const { course } = await makeSession(user, 'Unused')
  await loginAs(page, user)
  await page.goto(`/new?course=${course.id}`)
  await page.getByLabel('Session title *').fill('Two parts')
  const inputs = page.locator('input[type=file]')
  await inputs.nth(0).setInputFiles(sample('sample-recording.m4a'))
  await expect(page.getByText('sample-recording.m4a')).toBeVisible()
  await inputs.nth(0).setInputFiles(sample('chunk0.m4a'))                       // the second part (added to the first)
  await expect(page.getByText('The parts are joined in this order into one lecture.')).toBeVisible()
  await page.getByRole('button', { name: 'Move down' }).first().click()          // chunk first, then the long one
  await expect(page.getByText('chunk0.m4a')).toBeVisible()
  await page.getByRole('button', { name: 'Create notes and quiz' }).click()
  await expect(page.getByRole('tab', { name: /Full notes/ })).toBeVisible({ timeout: 300000 })

  // 1024 px and 390 px: the drawer becomes a menu
  await page.setViewportSize({ width: 1024, height: 800 })
  await page.screenshot({ path: path.join(shots, 'r1-1024.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeHidden()
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.screenshot({ path: path.join(shots, 'r2-390-notes.png'), fullPage: true })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)                                                    // no sideways scrolling on a phone

  // print: only the notes
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.q-header')).toBeHidden()
  await expect(page.locator('.q-drawer')).toBeHidden()
  await expect(page.getByText('Summary').first()).toBeVisible()
  await page.emulateMedia({ media: 'screen' })
})
