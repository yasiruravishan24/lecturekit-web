// Failure and edge cases in a real browser: failed job and retry, the daily limit, someone else's lecture,
// several recording files, small screens and printing. Needs the same set-up as flow.spec.js.
import { test, expect } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { loginAs, makeSession, makeUser, sample, startProcessing, upload, waitDone } from './helpers'

const shots = path.join(import.meta.dirname, '../../test-results/shots')
mkdirSync(shots, { recursive: true })

test('a recording that cannot be read shows a plain message and Try again', async ({ page }) => {
  const user = await makeUser('failed')
  const { session } = await makeSession(user, 'Broken recording')
  await upload(user, session.id, [['broken.mp4', Buffer.from('this is not a video')]])
  await loginAs(page, user)
  await page.goto(`/#/sessions/${session.id}`)
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
  await page.goto('/#/new')
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
  await page.goto(`/#/sessions/${session.id}`)
  await expect(page.getByText('This lecture was not found.')).toBeVisible()
  await expect(page.getByText('Private lecture')).toHaveCount(0)
  await page.goto('/#/quiz/' + session.id)
  await expect(page.getByText('This quiz is not available yet.')).toBeVisible()
})

test('a lecture saved in two files is joined, and the small-screen layout and print view work', async ({ page }) => {
  const user = await makeUser('parts')
  const { course } = await makeSession(user, 'Unused')
  await loginAs(page, user)
  await page.goto(`/#/new?course=${course.id}`)
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
