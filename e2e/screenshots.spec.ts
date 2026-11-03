import { test } from '@playwright/test'

// Captures screens for visual review: npx playwright test screenshots
const viewports = { desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } }

for (const [vpName, viewport] of Object.entries(viewports)) {
  test(`screens ${vpName}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/#/online')
    await page.screenshot({ path: `screenshots/${vpName}-online-empty.png`, fullPage: true })
    await page.getByRole('button', { name: 'Beispiel laden', exact: true }).click()
    await page.screenshot({ path: `screenshots/${vpName}-online-example.png`, fullPage: true })
    await page.goto('/#/tv')
    await page.getByRole('textbox', { name: 'Mediabudget', exact: true }).fill('40000')
    await page.getByRole('textbox', { name: 'Grundgesamtheit', exact: true }).fill('1000000')
    await page.getByRole('textbox', { name: 'Netto-Reichweite', exact: true }).fill('50')
    await page.screenshot({ path: `screenshots/${vpName}-tv-partial.png`, fullPage: true })
    await page.goto('/#/online')
    await page.getByRole('button', { name: 'Zurücksetzen' }).click()
    await page.getByRole('button', { name: /bekannte kennzahlen/i }).click()
    await page.getByRole('textbox', { name: 'Mediabudget', exact: true }).fill('1000')
    await page.getByRole('textbox', { name: 'Impressions', exact: true }).fill('100000')
    await page.getByRole('textbox', { name: 'CPM', exact: true }).fill('20')
    await page.getByRole('textbox', { name: 'Deckungsbeitragsquote', exact: true }).fill('120')
    await page.screenshot({ path: `screenshots/${vpName}-online-conflict.png`, fullPage: true })
    await page.goto('/#/directMail')
    await page.getByRole('button', { name: 'Beispiel laden', exact: true }).click()
    await page.screenshot({ path: `screenshots/${vpName}-directmail-example.png`, fullPage: true })
  })
}

test('print layout', async ({ page }) => {
  await page.goto('/#/tv')
  await page.getByRole('button', { name: 'Beispiel laden', exact: true }).click()
  await page.emulateMedia({ media: 'print' })
  await page.pdf({ path: 'screenshots/print-tv.pdf', format: 'A4' })
  await page.screenshot({ path: 'screenshots/print-tv.png', fullPage: true })
})
