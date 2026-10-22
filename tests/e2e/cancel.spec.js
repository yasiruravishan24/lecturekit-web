// Pressing Make notes by mistake: Cancel stops it and deletes the lecture (real server, real pipeline: cancelled within the first seconds).
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { api, loginAs, makeSession, makeUser, sample, startProcessing, upload } from './helpers'

test('cancel the notes while they are being made: the lecture is gone', async ({ page }) => {
  test.setTimeout(120000)
  const user = await makeUser('cancel')
  const { session, module } = await makeSession(user, 'By mistake')
  await upload(user, session.id, [['lecture.m4a', readFileSync(sample('sample-recording.m4a'))]])
  await startProcessing(user, session.id)
  await loginAs(page, user)
  await page.goto(`/sessions/${session.id}`)
  await expect(page.getByText('Making your notes')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.getByRole('button', { name: 'Cancel and delete' }).click()
  await expect(page).toHaveURL(new RegExp(`/modules/${module.id}`), { timeout: 60000 })       // left for the module page
  expect((await api('GET', `/sessions/${session.id}`, user)).status).toBe(404)                 // the lecture is gone
})
