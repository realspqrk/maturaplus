import { expect, test } from '@playwright/test'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { card } from './helpers'

// The one-file app students double-click: opened straight from disk, no server, no service worker.
const APP = resolve('app/kpi-rechner.html')

test.skip(!existsSync(APP), 'run `npm run build:app` first')

test('one-file app works from disk', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`))
  await page.goto(pathToFileURL(APP).href)
  await expect(page.getByRole('heading', { level: 1, name: 'Marketing-KPI-Rechner' })).toBeVisible()
  await page.getByRole('button', { name: 'Zeig mir ein Beispiel' }).click()
  await expect(card(page, 'CPM')).toContainText('€')
  await page.getByRole('tab', { name: /tv/i }).click()
  await expect(page).toHaveURL(/#\/tv$/)
  await expect(page.getByRole('heading', { level: 2, name: 'TV' })).toBeVisible()
  expect(errors).toEqual([])
})
