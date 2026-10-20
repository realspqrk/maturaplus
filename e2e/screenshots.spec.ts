import { test } from '@playwright/test'

// Captures screens for visual review: npx playwright test screenshots
const viewports = { desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } }

for (const [vpName, viewport] of Object.entries(viewports)) {
  for (const theme of ['light', 'dark'] as const) {
    test(`screens ${vpName} ${theme}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ colorScheme: theme })
      await page.goto('/#/online')
      await page.screenshot({ path: `screenshots/${vpName}-${theme}-online-empty.png`, fullPage: true })
      await page.getByRole('button', { name: /try an example/i }).click()
      await page.screenshot({ path: `screenshots/${vpName}-${theme}-online-example.png`, fullPage: true })
      await page.goto('/#/tv')
      await page.getByRole('textbox', { name: 'Media spend', exact: true }).fill('40000')
      await page.getByRole('textbox', { name: 'Audience universe', exact: true }).fill('1000000')
      await page.getByRole('textbox', { name: 'Net reach', exact: true }).fill('50')
      await page.screenshot({ path: `screenshots/${vpName}-${theme}-tv-partial.png`, fullPage: true })
      await page.goto('/#/online')
      await page.getByRole('button', { name: /reset/i }).click()
      await page.getByRole('button', { name: /known rates/i }).click()
      await page.getByRole('textbox', { name: 'Media spend', exact: true }).fill('1000')
      await page.getByRole('textbox', { name: 'Impressions', exact: true }).fill('100000')
      await page.getByRole('textbox', { name: 'CPM', exact: true }).fill('20')
      await page.getByRole('textbox', { name: 'Contribution margin', exact: true }).fill('120')
      await page.screenshot({ path: `screenshots/${vpName}-${theme}-online-conflict.png`, fullPage: true })
      await page.goto('/#/directMail')
      await page.getByRole('button', { name: /try an example/i }).click()
      await page.screenshot({ path: `screenshots/${vpName}-${theme}-directmail-example.png`, fullPage: true })
    })
  }
}

test('print layout', async ({ page }) => {
  await page.goto('/#/tv')
  await page.getByRole('button', { name: /try an example/i }).click()
  await page.emulateMedia({ media: 'print' })
  await page.pdf({ path: 'screenshots/print-tv.pdf', format: 'A4' })
  await page.screenshot({ path: 'screenshots/print-tv.png', fullPage: true })
})
