// What another device does (the extension, later the mobile app) shows up in an open page without a refresh.
import { test, expect } from '@playwright/test'
import { api, loginAs, makeSession, makeUser } from './helpers.js'

test('a recording started elsewhere appears by itself: status, notification, toast; a rename too', async ({ page }) => {
  const user = await makeUser('rt')
  const { session } = await makeSession(user, 'Online lecture')
  await loginAs(page, user)
  await page.goto(`/sessions/${session.id}`)
  await expect(page.getByText('No recording yet')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Notifications' }).locator('.q-badge')).toHaveCount(0)

  await api('POST', `/sessions/${session.id}/live`, user)                                  // the extension presses Start
  await expect(page.getByText('Recording in progress')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Recording started: Online lecture')).toBeVisible()          // the pop-up
  await expect(page.getByRole('button', { name: 'Notifications' }).locator('.q-badge')).toHaveText('1')

  await api('PATCH', `/sessions/${session.id}`, user, { title: 'Renamed on the phone' })      // another device renames it
  await expect(page.getByRole('heading', { name: 'Renamed on the phone' })).toBeVisible({ timeout: 10000 })

  await page.getByRole('button', { name: 'Notifications' }).click()
  await expect(page.getByText('Recording started').last()).toBeVisible()
  await page.getByRole('button', { name: 'Mark all as read' }).click()
  await expect(page.getByRole('button', { name: 'Notifications' }).locator('.q-badge')).toHaveCount(0)
})

test('a lecture being recorded shows how many parts arrived and how many are transcribed', async ({ page }) => {
  const user = await makeUser('liveinfo')
  const { module } = await makeSession(user, 'x')
  const made = (await api('POST', `/modules/${module.id}/sessions`, user, { title: 'Live now' })).json
  await api('POST', `/sessions/${made.id}/live`, user)
  await loginAs(page, user)
  await page.goto(`/sessions/${made.id}`)
  await expect(page.getByText('Parts received')).toBeVisible()
  await expect(page.getByText('Transcribed')).toBeVisible()
})
