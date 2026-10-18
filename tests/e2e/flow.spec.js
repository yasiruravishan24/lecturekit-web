import { readFileSync } from 'node:fs'
// Whole student journey in a real browser against the local Docker stack (real pipeline: costs a few cents of Claude credit).
//   docker compose up -d   (project folder)      npm run dev   (web folder)      npx playwright test
// The confirmation code only goes to the email, so the account is confirmed with the admin command after the wrong-code check.
import { test, expect } from '@playwright/test'
import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

const root = path.resolve(import.meta.dirname, '../../..')
const files = path.join(root, 'lecturekit-server/postman/sample-files')
const shots = path.join(import.meta.dirname, '../../test-results/shots')
const email = `e2e${Date.now()}@example.com`
const password = 'Passw0rd-for-tests'

test('register, confirm, make notes from a recording and slides, take the quiz, delete the account', async ({ page }) => {
  fs.mkdirSync(shots, { recursive: true })
  const shot = (name) => page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: true })

  // sign up
  await page.goto('/register')
  await expect(page.locator('.lk-strength')).toHaveCount(0)               // the strength hint waits until something is typed
  await page.getByLabel('Full name').fill('E2E Student')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await expect(page.locator('.lk-strength')).toBeVisible()
  await page.getByRole('checkbox', { name: /I understand and agree/ }).check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
  await shot('03-confirm-email')

  // a wrong code is refused
  await page.getByLabel('Digit 1').click()
  await page.keyboard.type('000000')
  await expect(page.getByText('That code is not right')).toBeVisible()

  // confirm by the admin command (the real code is in the email), then log in
  execSync(`docker compose exec -T app python -m server.admin verify-email ${email}`, { cwd: root })
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('No lectures yet')).toBeVisible()
  await shot('04-dashboard-empty')

  // a course and a module
  await page.goto('/courses')
  await page.getByRole('button', { name: 'Add course' }).click()
  await page.getByLabel('Course name').fill('BSc Computing')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('BSc Computing').first()).toBeVisible()
  await page.getByRole('button', { name: 'Add module' }).first().click()
  await page.getByLabel(/Module name/).fill('Programming Fundamentals')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.locator('.lk-grid3').getByText('Programming Fundamentals')).toBeVisible()
  await shot('05-my-courses')

  // a new session: a recording and slides
  await page.goto('/new')
  await expect(page.getByLabel('Module *')).toHaveValue('Programming Fundamentals')
  await page.getByLabel('Session title *').fill('Strings and input')
  const inputs = page.locator('input[type=file]')
  await inputs.nth(0).setInputFiles(path.join(files, 'sample-recording.m4a'))
  await inputs.nth(1).setInputFiles(path.join(files, 'sample-slides.pdf'))
  await expect(page.getByText('sample-recording.m4a')).toBeVisible()
  await shot('06-new-session')
  await page.getByRole('button', { name: 'Create notes and quiz' }).click()
  await expect(page.getByText('Making your notes')).toBeVisible()
  await shot('07-processing')

  // the notes appear by themselves
  await expect(page.getByRole('tab', { name: /Full notes/ })).toBeVisible({ timeout: 300000 })
  await expect(page.getByText('Summary').first()).toBeVisible()
  await expect(page.getByText('Key points').first()).toBeVisible()
  await shot('08-notes')
  // the topics are read one at a time
  const items = page.locator('[aria-label="Topics"] [role=tab]')
  const n = await items.count()
  expect(n).toBeGreaterThan(2)
  await expect(page.locator('.lk-topic:visible')).toHaveCount(1)
  await expect(page.getByText(`Topic 1 of ${n}`)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Previous topic' })).toBeDisabled()
  const heading = await page.locator('.lk-topic:visible h2').innerText()
  await page.getByRole('button', { name: 'Next topic' }).click()
  await expect(page.getByText(`Topic 2 of ${n}`)).toBeVisible()
  expect(await page.locator('.lk-topic:visible h2').innerText()).not.toBe(heading)
  await items.nth(n - 1).click()
  await expect(page.getByRole('button', { name: 'Next topic' })).toBeDisabled()
  await expect(page.locator('.lk-topic:visible')).toHaveCount(1)
  await page.getByRole('button', { name: /Export/ }).click()                             // a real PDF made by the server
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByText('Download PDF').click()])
  expect(download.suggestedFilename()).toMatch(/\.pdf$/)
  expect(readFileSync(await download.path()).subarray(0, 4).toString()).toBe('%PDF')
  await page.getByRole('tab', { name: /Short notes/ }).click()
  await expect(page.getByText('Quick revision')).toBeVisible()
  await page.locator('.lk-short-card').first().click()                                    // tick a point as known
  await expect(page.locator('.lk-short-card.known')).toHaveCount(1)

  // the quiz: answer every question with the first option, then submit
  await page.getByRole('link', { name: 'Take quiz' }).first().click()
  await expect(page.getByText(/Question 1 of \d+/)).toBeVisible()
  const total = Number((await page.getByText(/Question 1 of \d+/).textContent()).match(/of (\d+)/)[1])
  for (let i = 0; i < total; i++) {
    await page.getByRole('radio').first().check()
    if (i === 2) await shot('09-quiz')
    await page.getByRole('button', { name: i < total - 1 ? 'Next' : 'Submit quiz' }).click()
  }
  await expect(page.getByRole('heading', { name: 'Quiz result' })).toBeVisible()
  await expect(page.getByText(/Explanation:/).first()).toBeVisible()
  await shot('10-quiz-result')

  // the dashboard and the quiz list now show the lecture
  await page.goto('/')
  await expect(page.getByText('Strings and input')).toBeVisible()
  await page.goto('/quizzes')
  await expect(page.getByText(/Last score/)).toBeVisible()

  // settings and deleting the account
  await page.goto('/settings')
  await shot('11-settings')
  await page.getByRole('button', { name: 'Delete account' }).click()
  await page.getByLabel(/Type .* to confirm/).fill(email)
  await page.getByRole('button', { name: 'Delete account' }).last().click()
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible()
})
