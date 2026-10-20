import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { field, fill, openCategory, results } from './helpers'

async function downloadCsv(page: Page) {
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /export csv/i }).click()
  const d = await download
  return { name: d.suggestedFilename(), text: await readFile((await d.path())!, 'utf8') }
}

test('CSV contains inputs, KPIs with raw numbers, units, status and formulas', async ({ page }) => {
  await page.goto('/#/tv')
  await page.getByRole('button', { name: /try an example/i }).click()
  const { name, text } = await downloadCsv(page)
  expect(name).toMatch(/^kpi-tv-\d{4}-\d{2}-\d{2}\.csv$/)
  expect(text.charCodeAt(0)).toBe(0xfeff) // BOM so Excel reads UTF-8 (€, ÷)
  const lines = text.slice(1).trimEnd().split('\r\n')
  expect(lines[0]).toBe('Category,Group,Metric,Value,Unit,Status,Formula')
  expect(lines).toContain('TV,Inputs,Media spend,120000,EUR,entered,')
  expect(lines).toContain('TV,Inputs,Net reach,45,%,entered,')
  expect(lines).toContain('TV,Reach & weight,Rating points (GRP/TRP),144,points,calculated,Rating points (GRP/TRP) = Net reach × Average frequency')
  expect(lines).toContain('TV,Business outcome,Contribution after media,24000,EUR,calculated,Contribution after media = Attributed revenue × Contribution margin ÷ 100 − Media spend')
  expect(lines.some((l) => l.startsWith('TV,Cost efficiency,"Cost per 1,000 contacts",16.666'))).toBe(true)
  // every row has 7 columns (quoted commas handled)
  for (const l of lines) expect(l.replace(/"[^"]*"/g, '').split(',')).toHaveLength(7)
})

test('CSV marks missing KPIs, conflicts and warnings', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /known rates/i }).click()
  await fill(page, { 'Media spend': '1000', Impressions: '100000', CPM: '20', 'Contribution margin': '0' })
  const { text } = await downloadCsv(page)
  expect(text).toContain('Online,Inputs,CPM,20,EUR,conflict,')
  expect(text).toContain('Online,Inputs,Contribution margin,0,%,entered,') // zero is kept, not dropped
  expect(text).toContain('Online,Cost efficiency,CPC,,EUR,missing,')
  expect(text).toContain('Online,Conflicts,"CPM is €20.00, but Media spend ÷ Impressions × 1000 gives €10.00.",,,conflict,')
})

test('CSV export works from an offline sub-category', async ({ page }) => {
  await page.goto('/')
  await openCategory(page, /other offline/i, /direct mail/i)
  await field(page, 'Campaign cost').fill('800')
  const { name, text } = await downloadCsv(page)
  expect(name).toMatch(/^kpi-directMail-/)
  expect(text).toContain('Direct mail,Inputs,Campaign cost,800,EUR,entered,')
})

test.describe('print / PDF', () => {
  test('print layout shows a compact report and hides controls', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /more inputs/i }).click()
    await fill(page, { 'Media spend': '10000', Impressions: '2000000', 'Unique users reached': '400000' })
    await page.getByRole('button', { name: /fewer inputs/i }).click() // collapsed input must still print
    await page.emulateMedia({ media: 'print' })

    const table = page.getByRole('table', { name: 'Your inputs' })
    await expect(table).toBeVisible()
    await expect(table.getByRole('row')).toHaveCount(3)
    await expect(table).toContainText('Unique users reached')
    await expect(table).toContainText('400,000')
    await expect(page.getByRole('heading', { name: 'Your numbers' })).toBeHidden()
    await expect(page.getByRole('tablist')).toBeHidden()
    await expect(page.getByRole('button', { name: /export csv/i })).toBeHidden()
    await expect(page.getByRole('button', { name: /try an example/i })).toBeHidden()
    await expect(page.getByRole('article', { name: 'CPC', exact: true })).toBeHidden() // locked
    await expect(page.getByRole('article', { name: 'CPM', exact: true })).toBeVisible()
    await expect(page.getByText('Works offline', { exact: true })).toBeHidden()
    await expect(results(page)).toContainText('2 of 14 KPIs available')
  })

  test('"Print / Save as PDF" opens the print dialog', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      ;(window as unknown as { printed: number }).printed = 0
      window.print = () => {
        ;(window as unknown as { printed: number }).printed++
      }
    })
    await page.getByRole('button', { name: /print \/ save as pdf/i }).click()
    expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1)
  })

  test('renders a valid A4 PDF', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'page.pdf() is Chromium-only')
    await page.goto('/#/tv')
    await page.getByRole('button', { name: /try an example/i }).click()
    const pdf = await page.pdf({ format: 'A4' })
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
    expect(pages).toBeGreaterThanOrEqual(1)
    expect(pages).toBeLessThanOrEqual(2)
  })
})
