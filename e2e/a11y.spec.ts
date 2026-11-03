import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { fill } from './helpers'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoViolations(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([])
}

// axe is markedly slower in Firefox/WebKit; each test runs it twice
test.describe.configure({ timeout: 90_000 })

// light mode only: a dark OS setting must not change anything
for (const scheme of ['light', 'dark'] as const) {
  test.describe(`system set to ${scheme}`, () => {
    test.use({ colorScheme: scheme })

    for (const hash of ['online', 'tv', 'radio', 'print', 'ooh', 'directMail']) {
      test(`${hash}: empty and filled states`, async ({ page }) => {
        await page.goto(`/#/${hash}`)
        await expectNoViolations(page)
        await page.getByRole('button', { name: 'Beispiel laden', exact: true }).click()
        await page.getByRole('button', { name: /bekannte kennzahlen/i }).click()
        const more = page.getByRole('button', { name: /mehr eingaben/i })
        if (await more.count()) await more.click() // not every category has one
        await expectNoViolations(page)
      })
    }

    test('conflict, invalid input and help states', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /bekannte kennzahlen/i }).click()
      await fill(page, { Mediabudget: '1000', Impressions: '100000', CPM: '20', Deckungsbeitragsquote: '120' })
      await page.getByRole('button', { name: 'Info zu Mediabudget' }).click()
      await page.getByRole('article', { name: 'CPM', exact: true }).getByText('Über diese KPI').click()
      await expect(page.getByRole('alert')).toBeVisible()
      await expectNoViolations(page)
    })
  })
}
