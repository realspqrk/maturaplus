import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { field, fill, openCategory, results } from './helpers'

async function downloadCsv(page: Page) {
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /csv exportieren/i }).click()
  const d = await download
  return { name: d.suggestedFilename(), text: await readFile((await d.path())!, 'utf8') }
}

test('CSV contains inputs, KPIs with raw numbers, units, status and formulas', async ({ page }) => {
  await page.goto('/#/tv')
  await page.getByRole('button', { name: 'Beispiel laden', exact: true }).click()
  const { name, text } = await downloadCsv(page)
  expect(name).toMatch(/^kpi-tv-\d{4}-\d{2}-\d{2}\.csv$/)
  expect(text.charCodeAt(0)).toBe(0xfeff) // BOM so Excel reads UTF-8 (€, ÷)
  const lines = text.slice(1).trimEnd().split('\r\n')
  expect(lines[0]).toBe('Kategorie;Gruppe;Kennzahl;Wert;Einheit;Status;Formel')
  expect(lines).toContain('TV;Eingaben;Mediabudget;120000;EUR;eingegeben;')
  expect(lines).toContain('TV;Eingaben;Netto-Reichweite;45;%;eingegeben;')
  expect(lines).toContain('TV;Reichweite & Kontakte;Rating Points (GRP/TRP);144;Punkte;berechnet;Rating Points (GRP/TRP) = Netto-Reichweite × Ø Kontaktfrequenz')
  expect(lines).toContain('TV;Geschäftsergebnis;Deckungsbeitrag nach Media;24000;EUR;berechnet;Deckungsbeitrag nach Media = Zugeordneter Umsatz × Deckungsbeitragsquote ÷ 100 − Mediabudget')
  // decimal comma, no thousands separator, so German Excel reads it as a number
  expect(lines.some((l) => l.startsWith('TV;Kosteneffizienz;TKP (Kosten pro 1.000 Kontakte);16,666'))).toBe(true)
  // every row has 7 columns (quoted separators handled)
  for (const l of lines) expect(l.replace(/"[^"]*"/g, '').split(';')).toHaveLength(7)
})

test('CSV marks missing KPIs, conflicts and warnings', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /bekannte kennzahlen/i }).click()
  await fill(page, { Mediabudget: '1000', Impressions: '100000', CPM: '20', Deckungsbeitragsquote: '0' })
  const { text } = await downloadCsv(page)
  expect(text).toContain('Online;Eingaben;CPM;20;EUR;Konflikt;')
  expect(text).toContain('Online;Eingaben;Deckungsbeitragsquote;0;%;eingegeben;') // zero is kept, not dropped
  expect(text).toContain('Online;Kosteneffizienz;CPC;;EUR;fehlt;')
  // de-DE currency has a no-break space before €
  expect(text).toContain('Online;Konflikte;CPM ist 20,00\u00a0€, aber Mediabudget ÷ Impressions × 1000 ergibt 10,00\u00a0€.;;;Konflikt;')
})

test('CSV export works from an offline sub-category', async ({ page }) => {
  await page.goto('/')
  await openCategory(page, /weitere offline/i, /mailing/i)
  await field(page, 'Kampagnenkosten').fill('800')
  const { name, text } = await downloadCsv(page)
  expect(name).toMatch(/^kpi-directMail-/)
  expect(text).toContain('Mailing;Eingaben;Kampagnenkosten;800;EUR;eingegeben;')
})

test.describe('print / PDF', () => {
  test('print layout shows a compact report and hides controls', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /mehr eingaben/i }).click()
    await fill(page, { Mediabudget: '10000', Impressions: '2000000', 'Unique User': '400000' })
    await page.getByRole('button', { name: /weniger eingaben/i }).click() // collapsed input must still print
    await page.emulateMedia({ media: 'print' })

    const table = page.getByRole('table', { name: 'Deine Eingaben' })
    await expect(table).toBeVisible()
    await expect(table.getByRole('row')).toHaveCount(3)
    await expect(table).toContainText('Unique User')
    await expect(table).toContainText('400.000')
    await expect(page.getByRole('heading', { name: 'Deine Zahlen' })).toBeHidden()
    await expect(page.getByRole('tablist')).toBeHidden()
    await expect(page.getByRole('button', { name: /csv exportieren/i })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Beispiel laden', exact: true })).toBeHidden()
    await expect(page.getByRole('article', { name: 'CPC', exact: true })).toBeHidden() // locked
    await expect(page.getByRole('article', { name: 'CPM', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'So funktioniert’s' })).toBeHidden()
    await expect(page.getByText('Funktioniert offline', { exact: true })).toBeHidden()
    await expect(results(page)).toContainText('2 von 14 KPIs verfügbar')
  })

  test('"Drucken / Als PDF speichern" opens the print dialog', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      ;(window as unknown as { printed: number }).printed = 0
      window.print = () => {
        ;(window as unknown as { printed: number }).printed++
      }
    })
    await page.getByRole('button', { name: /drucken \/ als pdf speichern/i }).click()
    expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1)
  })

  test('renders a valid A4 PDF', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'page.pdf() is Chromium-only')
    await page.goto('/#/tv')
    await page.getByRole('button', { name: 'Beispiel laden', exact: true }).click()
    const pdf = await page.pdf({ format: 'A4' })
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
    expect(pages).toBeGreaterThanOrEqual(1)
    expect(pages).toBeLessThanOrEqual(2)
  })
})
