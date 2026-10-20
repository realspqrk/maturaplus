import { expect, test } from '@playwright/test'
import { expectCards, fill, openCategory, results } from './helpers'

// Every expected value below is hand-calculated, independent of the app's own maths.
const cases = [
  {
    name: 'Online',
    open: { tab: /online/i },
    more: true,
    inputs: {
      'Media spend': '10,000', 'Attributed revenue': '40000', 'Contribution margin': '30',
      Impressions: '2000000', Clicks: '20000', Conversions: '400',
      Leads: '500', 'Video views': '300000', 'Unique users reached': '400000',
    },
    kpis: {
      CPM: '€5.00', CPC: '€0.50', CPA: '€25.00', CPL: '€20.00', CPV: '€0.03',
      CTR: '1%', 'Conversion rate': '2%', 'View rate': '15%', 'Average frequency': '5',
      ROAS: '4×', 'Marketing ROI': '20%', 'Contribution after media': '€2,000.00', 'Break-even ROAS': '3.33×',
      'Revenue per conversion': '€100.00',
    },
    verdict: /above break-even/i,
    total: '14 of 14',
  },
  {
    name: 'TV',
    open: { tab: /^tv/i },
    more: true,
    inputs: {
      'Media spend': '120000', 'Attributed revenue': '360000', 'Contribution margin': '40',
      'Audience universe': '5000000', 'Net reach': '45', 'Average frequency': '3.2', Spots: '40',
    },
    kpis: {
      'Rating points (GRP/TRP)': '144', 'Unique reach': '2,250,000', 'Gross contacts': '7,200,000',
      'Average spot rating': '3.6', 'Cost per point (CPP)': '€833.33', 'Cost per 1,000 contacts': '€16.67',
      'Cost per spot': '€3,000.00', ROAS: '3×', 'Marketing ROI': '20%', 'Contribution after media': '€24,000.00',
      'Break-even ROAS': '2.5×',
    },
    verdict: /above break-even/i,
    total: '11 of 11',
  },
  {
    name: 'Radio',
    open: { tab: /radio/i },
    more: true,
    inputs: {
      'Media spend': '30000', 'Attributed revenue': '60000', 'Contribution margin': '40',
      'Audience universe': '5000000', 'Net reach': '35', 'Average frequency': '6', Spots: '120',
    },
    kpis: {
      'Rating points (GRP/TRP)': '210', 'Unique reach': '1,750,000', 'Gross contacts': '10,500,000',
      'Average spot rating': '1.8', 'Cost per point (CPP)': '€142.86', 'Cost per 1,000 contacts': '€2.86',
      'Cost per spot': '€250.00', ROAS: '2×', 'Marketing ROI': '-20%', 'Contribution after media': '-€6,000.00',
      'Break-even ROAS': '2.5×',
    },
    verdict: /below break-even/i,
    total: '11 of 11',
  },
  {
    name: 'Print',
    open: { tab: /other offline/i, sub: /print/i },
    more: false,
    inputs: {
      'Media spend': '18000', 'Attributed revenue': '45000', 'Contribution margin': '35',
      'Distributed copies': '240000', 'Readers per copy': '2.4', Insertions: '2',
    },
    kpis: {
      'Reader contacts': '576,000', 'Cost per 1,000 copies': '€75.00', 'Cost per 1,000 reader contacts': '€31.25',
      'Cost per insertion': '€9,000.00', ROAS: '2.5×', 'Marketing ROI': '-12.5%',
      'Contribution after media': '-€2,250.00', 'Break-even ROAS': '2.86×',
    },
    verdict: /below break-even/i,
    total: '8 of 8',
  },
  {
    name: 'Out-of-home',
    open: { tab: /other offline/i, sub: /out-of-home/i },
    more: true,
    inputs: {
      'Media spend': '24000', 'Attributed revenue': '50000', 'Contribution margin': '35',
      'Panels / sites': '80', Weeks: '2', 'Weekly contacts': '1500000', 'Unique reach': '900000',
    },
    kpis: {
      'Gross contacts': '3,000,000', 'Average frequency': '3.33', 'Cost per 1,000 contacts': '€8.00',
      'Cost per panel per week': '€150.00', ROAS: '2.08×', 'Marketing ROI': '-27.08%',
      'Contribution after media': '-€6,500.00', 'Break-even ROAS': '2.86×',
    },
    verdict: /below break-even/i,
    total: '8 of 8',
  },
  {
    name: 'Direct mail',
    open: { tab: /other offline/i, sub: /direct mail/i },
    more: false,
    inputs: {
      'Campaign cost': '16000', 'Attributed revenue': '24000', 'Contribution margin': '45',
      'Pieces sent': '20000', Responders: '500', Orders: '120',
    },
    kpis: {
      'Response rate': '2.5%', 'Responder-to-order rate': '24%', 'Cost per piece': '€0.80',
      'Cost per response': '€32.00', 'Cost per order': '€133.33', ROAS: '1.5×', 'Marketing ROI': '-32.5%',
      'Contribution after media': '-€5,200.00', 'Break-even ROAS': '2.22×', 'Revenue per piece': '€1.20',
    },
    verdict: /below break-even/i,
    total: '10 of 10',
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
      if (c.more) await page.getByRole('button', { name: /more inputs/i }).click()
      await fill(page, c.inputs)
      await expectCards(page, c.kpis)
      await expect(results(page)).toContainText(`${c.total} KPIs available`)
      await expect(results(page).getByText(c.verdict)).toBeVisible()
      await expect(page.getByRole('alert')).toHaveCount(0)
    })

    test('"Try an example" fills consistent values that unlock every KPI', async ({ page }) => {
      await page.getByRole('button', { name: /try an example/i }).click()
      await expect(results(page)).toContainText(`${c.total} KPIs available`)
      await expect(page.getByRole('alert')).toHaveCount(0)
      await expect(results(page).locator('article', { hasText: 'Conflict' })).toHaveCount(0)
    })

    test('all KPIs start locked with an unlock hint', async ({ page }) => {
      await expect(results(page).getByText(/^0 of \d+ KPIs available$/)).toBeVisible()
      for (const name of Object.keys(c.kpis)) {
        await expect(results(page).getByRole('article', { name, exact: true }), name).toContainText('Add')
      }
    })
  })
}
