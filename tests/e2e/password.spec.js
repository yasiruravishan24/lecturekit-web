// Changing the password from Settings (a person who logs in with an email and password).
import { test, expect } from '@playwright/test'
import { api, loginAs, makeUser, PASSWORD } from './helpers'

test('change the password in Settings', async ({ page }) => {
  const user = await makeUser('pw')
  await loginAs(page, user)
  await page.goto('/settings')
  await page.getByText('Manage account', { exact: true }).click()
  await page.getByRole('button', { name: 'Change password' }).click()
  await page.getByLabel('Current password').fill('this is not it')
  await page.getByLabel('New password', { exact: true }).fill('a brand new secret')
  await page.getByLabel('New password again').fill('a brand new secret')
  await page.getByRole('button', { name: 'Change password' }).last().click()
  await expect(page.getByText('The current password is wrong.')).toBeVisible()
  await page.getByLabel('Current password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Change password' }).last().click()
  await expect(page.getByText('Your password was changed.')).toBeVisible()
  const again = await api('POST', '/auth/login', { token: null }, { email: user.email, password: 'a brand new secret' })
  expect(again.status).toBe(200)
})
