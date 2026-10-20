import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const field = (page: import('@playwright/test').Page, name: string) => page.getByRole('textbox', { name, exact: true })
const card = (page: import('@playwright/test').Page, name: string) => page.getByRole('article', { name, exact: true })

test('online happy path: ROAS and ROI', async ({ page }) => {
  await page.goto('/')
  await field(page, 'Media spend').fill('200')
  await field(page, 'Attributed revenue').fill('1,000')
  await expect(card(page, 'ROAS')).toContainText('5×')
  await expect(card(page, 'Marketing ROI')).toContainText('Add')
  await field(page, 'Contribution margin').fill('10')
  await expect(card(page, 'Marketing ROI')).toContainText('-50%')
})

test('TV: reach × frequency gives GRP, CPP and contact CPM', async ({ page }) => {
  await page.goto('/#/tv')
  await field(page, 'Media spend').fill('40000')
  await field(page, 'Audience universe').fill('1000000')
  await field(page, 'Net reach').fill('50')
  await field(page, 'Average frequency').fill('4')
  await expect(card(page, 'Rating points (GRP/TRP)')).toContainText('200')
  await expect(card(page, 'Cost per point (CPP)')).toContainText('€200.00')
  await expect(card(page, 'Cost per 1,000 contacts')).toContainText('€20.00')
  await expect(card(page, 'Gross contacts')).toContainText('2,000,000')
})

test('tabs support arrow-key navigation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: /online/i }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: /^tv/i })).toBeFocused()
  await expect(page).toHaveURL(/#\/tv$/)
  await page.keyboard.press('End')
  await expect(page.getByRole('tab', { name: /other offline/i })).toHaveAttribute('aria-selected', 'true')
})

for (const hash of ['online', 'tv', 'print', 'ooh', 'directMail']) {
  for (const theme of ['light', 'dark'] as const) {
    test(`no axe violations: ${hash} (${theme}, example filled)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme })
      await page.goto(`/#/${hash}`)
      await page.getByRole('button', { name: /try an example/i }).click()
      await page.getByRole('button', { name: /known rates/i }).click()
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([])
    })
  }
}

test('works offline after first load, including categories never visited', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload() // now controlled by the service worker
  await expect(page.getByText('Works offline', { exact: true })).toBeVisible()
  await context.setOffline(true)
  await page.reload()
  await page.goto('/#/ooh')
  await field(page, 'Media spend').fill('10000')
  await field(page, 'Weekly contacts').fill('500000')
  await field(page, 'Weeks').fill('2')
  await expect(card(page, 'Cost per 1,000 contacts')).toContainText('€10.00')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /export csv/i }).click()
  expect((await download).suggestedFilename()).toMatch(/^kpi-ooh-.*\.csv$/)
  await context.setOffline(false)
})
