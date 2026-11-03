import { expect, test } from '@playwright/test'
import { expectCards, fill, openCategory, results } from './helpers'

// Every expected value below is hand-calculated, independent of the app's own maths.
const cases = [
  {
    name: 'Online',
    open: { tab: /^online/i },
    more: true,
    inputs: {
      Mediabudget: '10.000', 'Zugeordneter Umsatz': '40000', Deckungsbeitragsquote: '30',
      Impressions: '2000000', Klicks: '20000', Conversions: '400',
      Leads: '500', 'Video-Views': '300000', 'Unique User': '400000',
    },
    kpis: {
      CPM: '5,00 €', CPC: '0,50 €', CPA: '25,00 €', CPL: '20,00 €', CPV: '0,03 €',
      CTR: '1 %', 'Conversion-Rate': '2 %', 'View-Rate': '15 %', 'Ø Kontaktfrequenz': '5',
      ROAS: '4×', 'Marketing-ROI': '20 %', 'Deckungsbeitrag nach Media': '2.000,00 €', 'Break-even-ROAS': '3,33×',
      'Umsatz pro Conversion': '100,00 €',
    },
    verdict: /über dem break-even/i,
    total: '14 von 14',
  },
  {
    name: 'TV',
    open: { tab: /^tv/i },
    more: true,
    inputs: {
      Mediabudget: '120000', 'Zugeordneter Umsatz': '360000', Deckungsbeitragsquote: '40',
      Grundgesamtheit: '5000000', 'Netto-Reichweite': '45', 'Ø Kontaktfrequenz': '3,2', Spots: '40',
    },
    kpis: {
      'Rating Points (GRP/TRP)': '144', 'Erreichte Personen': '2.250.000', Bruttokontakte: '7.200.000',
      'Ø Spot-Rating': '3,6', 'Cost per Point (CPP)': '833,33 €', 'TKP (Kosten pro 1.000 Kontakte)': '16,67 €',
      'Kosten pro Spot': '3.000,00 €', ROAS: '3×', 'Marketing-ROI': '20 %', 'Deckungsbeitrag nach Media': '24.000,00 €',
      'Break-even-ROAS': '2,5×',
    },
    verdict: /über dem break-even/i,
    total: '11 von 11',
  },
  {
    name: 'Radio',
    open: { tab: /^radio/i },
    more: true,
    inputs: {
      Mediabudget: '30000', 'Zugeordneter Umsatz': '60000', Deckungsbeitragsquote: '40',
      Grundgesamtheit: '5000000', 'Netto-Reichweite': '35', 'Ø Kontaktfrequenz': '6', Spots: '120',
    },
    kpis: {
      'Rating Points (GRP/TRP)': '210', 'Erreichte Personen': '1.750.000', Bruttokontakte: '10.500.000',
      'Ø Spot-Rating': '1,8', 'Cost per Point (CPP)': '142,86 €', 'TKP (Kosten pro 1.000 Kontakte)': '2,86 €',
      'Kosten pro Spot': '250,00 €', ROAS: '2×', 'Marketing-ROI': '-20 %', 'Deckungsbeitrag nach Media': '-6.000,00 €',
      'Break-even-ROAS': '2,5×',
    },
    verdict: /unter dem break-even/i,
    total: '11 von 11',
  },
  {
    name: 'Print',
    open: { tab: /weitere offline/i, sub: /print/i },
    more: false,
    inputs: {
      Mediabudget: '18000', 'Zugeordneter Umsatz': '45000', Deckungsbeitragsquote: '35',
      // a lone dot that isn't a thousands group is read as a decimal point
      'Verbreitete Auflage': '240000', 'Leser pro Exemplar': '2.4', Schaltungen: '2',
    },
    kpis: {
      Leserkontakte: '576.000', 'Kosten pro 1.000 Exemplare': '75,00 €', 'TKP (Kosten pro 1.000 Leserkontakte)': '31,25 €',
      'Kosten pro Schaltung': '9.000,00 €', ROAS: '2,5×', 'Marketing-ROI': '-12,5 %',
      'Deckungsbeitrag nach Media': '-2.250,00 €', 'Break-even-ROAS': '2,86×',
    },
    verdict: /unter dem break-even/i,
    total: '8 von 8',
  },
  {
    name: 'Out-of-Home',
    open: { tab: /weitere offline/i, sub: /out-of-home/i },
    more: true,
    inputs: {
      Mediabudget: '24000', 'Zugeordneter Umsatz': '50000', Deckungsbeitragsquote: '35',
      Werbeflächen: '80', Wochen: '2', 'Kontakte pro Woche': '1500000', 'Erreichte Personen': '900000',
    },
    kpis: {
      Bruttokontakte: '3.000.000', 'Ø Kontaktfrequenz': '3,33', 'TKP (Kosten pro 1.000 Kontakte)': '8,00 €',
      'Kosten pro Fläche und Woche': '150,00 €', ROAS: '2,08×', 'Marketing-ROI': '-27,08 %',
      'Deckungsbeitrag nach Media': '-6.500,00 €', 'Break-even-ROAS': '2,86×',
    },
    verdict: /unter dem break-even/i,
    total: '8 von 8',
  },
  {
    name: 'Mailing',
    open: { tab: /weitere offline/i, sub: /mailing/i },
    more: false,
    inputs: {
      Kampagnenkosten: '16000', 'Zugeordneter Umsatz': '24000', Deckungsbeitragsquote: '45',
      'Versendete Mailings': '20000', Responder: '500', Bestellungen: '120',
    },
    kpis: {
      Responsequote: '2,5 %', Bestellquote: '24 %', 'Kosten pro Mailing': '0,80 €',
      'Kosten pro Response': '32,00 €', 'Kosten pro Bestellung': '133,33 €', ROAS: '1,5×', 'Marketing-ROI': '-32,5 %',
      'Deckungsbeitrag nach Media': '-5.200,00 €', 'Break-even-ROAS': '2,22×', 'Umsatz pro Mailing': '1,20 €',
    },
    verdict: /unter dem break-even/i,
    total: '10 von 10',
  },
]

for (const c of cases) {
  test.describe(c.name, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await openCategory(page, c.open.tab, c.open.sub)
      await expect(page.getByRole('heading', { level: 2, name: c.name, exact: true })).toBeVisible()
    })

    test('typing the inputs computes every KPI correctly', async ({ page }) => {
      if (c.more) await page.getByRole('button', { name: /mehr eingaben/i }).click()
      await fill(page, c.inputs)
      await expectCards(page, c.kpis)
      await expect(results(page)).toContainText(`${c.total} KPIs verfügbar`)
      await expect(results(page).getByText(c.verdict)).toBeVisible()
      await expect(page.getByRole('alert')).toHaveCount(0)
    })

    test('"Beispiel laden" fills consistent values that unlock every KPI', async ({ page }) => {
      await page.getByRole('button', { name: 'Beispiel laden', exact: true }).click()
      await expect(results(page)).toContainText(`${c.total} KPIs verfügbar`)
      await expect(page.getByRole('alert')).toHaveCount(0)
      await expect(results(page).locator('article', { hasText: 'Konflikt' })).toHaveCount(0)
    })

    test('all KPIs start locked with an unlock hint', async ({ page }) => {
      await expect(results(page).getByText(/^0 von \d+ KPIs verfügbar$/)).toBeVisible()
      for (const name of Object.keys(c.kpis)) {
        await expect(results(page).getByRole('article', { name, exact: true }), name).toContainText('Ergänze')
      }
    })
  })
}
