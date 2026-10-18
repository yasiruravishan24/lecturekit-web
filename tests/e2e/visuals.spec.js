// The picture side, with the real pipeline: board pictures read by Claude, notes refined, screenshots, replay with seek.
// sample-board.mp4 is a 52 s video of a board (no people) with the sample lecture's speech.
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { loginAs, makeSession, makeUser, sample, startProcessing, upload, waitDone } from './helpers'

test('board pictures, refined notes, screenshots and a replay you can seek in', async ({ page }) => {
  test.setTimeout(420000)
  const user = await makeUser('board')
  const { session } = await makeSession(user, 'Board lecture')
  await upload(user, session.id, [['board.mp4', readFileSync(sample('sample-board.mp4'))]])
  await waitDone(user, (await startProcessing(user, session.id)).json.job_id)
  await loginAs(page, user)
  await page.goto(`/sessions/${session.id}`)
  await expect(page.getByRole('tab', { name: /Full notes/ })).toBeVisible()                  // the notes come first

  // key moments appear by themselves
  await page.getByRole('tab', { name: /Key moments/ }).click()
  await expect(page.locator('.lk-shot')).toHaveCount(1, { timeout: 180000 })
  await expect(page.locator('.lk-shot').first()).toContainText('Newton')
  await page.waitForTimeout(700)                                                              // let the tab finish sliding in
  await page.screenshot({ path: 'test-results/shots/v1-moments.png', fullPage: true })
  await page.locator('.lk-shot').first().click()                                              // shows the picture and what it says
  await expect(page.locator('.lk-shot-pre')).toContainText('F = 12 N')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'test-results/shots/v2-moment-dialog.png' })

  // the replay is made after the pictures, then "Play from" jumps there
  await expect(page.getByRole('button', { name: /Play from/ })).toBeVisible({ timeout: 180000 })
  await page.getByRole('button', { name: /Play from/ }).click()
  const video = page.locator('video')
  await expect(video).toBeVisible()
  await expect.poll(() => video.evaluate((v) => v.readyState), { timeout: 30000 }).toBeGreaterThanOrEqual(1)
  expect(await video.evaluate((v) => v.duration)).toBeGreaterThan(45)
  await expect.poll(() => video.evaluate((v) => v.currentTime), { timeout: 15000 }).toBeGreaterThan(20)    // started where the board was shown
  await video.evaluate((v) => v.pause())
  await page.screenshot({ path: 'test-results/shots/v3-replay.png', fullPage: true })

  // the quiz grew by questions about the board, after the old ones
  await page.goto(`/sessions/${session.id}`)
  await expect(page.getByRole('tab', { name: /Quiz \((1[1-3])\)/ })).toBeVisible({ timeout: 120000 })
  await page.goto(`/quiz/${session.id}`)
  await expect(page.getByText(/Question 1 of 1[1-3]/)).toBeVisible()
  await expect(page.getByText('From the board')).toHaveCount(0)                              // the first questions are the old ones
  for (let i = 0; i < 10; i++) await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('From the board')).toBeVisible()                               // the new ones come last
  await page.screenshot({ path: 'test-results/shots/v4-board-question.png' })

  await page.goto(`/sessions/${session.id}`)
  await expect(page.getByText('Board and screen', { exact: true })).toBeVisible()      // the "Built from" card names the pictures too
  // the notes now carry the board content, and the storage is counted
  await page.getByRole('tab', { name: /Full notes/ }).click()
  expect(await page.locator('.lk-topic').filter({ hasText: /Newton|F = m/ }).count()).toBeGreaterThan(0)      // the board content is in the notes
  await page.goto('/settings')
  await expect(page.getByText(/used/)).toBeVisible()
  await expect(page.getByText('10 GB available')).toBeVisible()
})
