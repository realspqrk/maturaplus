import { expect, test } from '@playwright/test'
import { card, field, fill, openCategory, results } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('guided input', () => {
  test('an unlock hint expands a collapsed section and focuses the missing input', async ({ page }) => {
    await field(page, 'Mediabudget').fill('1000')
    await card(page, 'CPL').getByRole('button', { name: 'Leads' }).click()
    await expect(field(page, 'Leads')).toBeFocused()
    await page.keyboard.type('50')
    await expect(card(page, 'CPL')).toContainText('20,00 €')
  })

  test('calculated values appear in empty inputs and can be overridden, then released', async ({ page }) => {
    await page.getByRole('button', { name: /bekannte kennzahlen/i }).click()
    await fill(page, { Mediabudget: '1000', CPM: '5' })
    const impressions = field(page, 'Impressions')
    await expect(impressions).toHaveAttribute('placeholder', '200.000')
    await expect(impressions).toHaveValue('')
    await impressions.fill('250000') // pin a different value → contradiction
    await expect(page.getByRole('alert')).toContainText('CPM ist 5,00 €')
    await expect(impressions).toHaveAccessibleDescription(/passt nicht zu deinen anderen eingaben/i)
    await impressions.fill('') // release → calculated again
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(impressions).toHaveAttribute('placeholder', '200.000')
  })

  test('KPIs derived from contradictory inputs are marked as conflicting', async ({ page }) => {
    await page.getByRole('button', { name: /bekannte kennzahlen/i }).click()
    await fill(page, { Mediabudget: '1000', Impressions: '100000', CPM: '20', Klicks: '500' })
    await expect(card(page, 'CPM')).toContainText('Konflikt')
    await expect(card(page, 'CTR')).toContainText('Konflikt') // uses the conflicting impressions
    await expect(card(page, 'CPC')).toContainText('Konflikt') // uses the conflicting spend
  })

  test('impossible derived values are explained, not shown', async ({ page }) => {
    await openCategory(page, /^tv/i)
    await page.getByRole('button', { name: /mehr eingaben/i }).click()
    await fill(page, { 'Rating Points (GRP/TRP)': '300', 'Ø Kontaktfrequenz': '2', Grundgesamtheit: '1000000' })
    await expect(results(page)).toContainText('Netto-Reichweite darf nicht größer als 100 % sein.')
    await expect(field(page, 'Netto-Reichweite')).not.toHaveAttribute('placeholder', /150/)
    await expect(card(page, 'Bruttokontakte')).toContainText('Konflikt')
  })

  test('invalid text and out-of-range values get accessible inline errors', async ({ page }) => {
    const margin = field(page, 'Deckungsbeitragsquote')
    await margin.fill('abc')
    await expect(margin).toHaveAttribute('aria-invalid', 'true')
    await expect(margin).toHaveAccessibleDescription(/gib eine zahl ein/i)
    await margin.fill('101')
    await expect(margin).toHaveAccessibleDescription(/darf nicht größer als 100\s%/)
    await margin.fill('1%2')
    await expect(margin).toHaveAttribute('aria-invalid', 'true')
    await margin.fill('30 %')
    await expect(margin).not.toHaveAttribute('aria-invalid')
  })

  test('accepts currency symbols, German separators and formats on blur', async ({ page }) => {
    const spend = field(page, 'Mediabudget')
    await spend.fill('€ 12.500,5')
    await field(page, 'Impressions').click()
    await expect(spend).toHaveValue('12.500,5')
    await spend.focus()
    await expect(spend).toHaveValue('€ 12.500,5') // raw text while editing

    const impressions = field(page, 'Impressions')
    await impressions.fill('1000000')
    await spend.click()
    await expect(impressions).toHaveValue('1.000.000')
    await spend.fill('1234,5')
    await impressions.click()
    await expect(spend).toHaveValue('1.234,5')
    // German notation is what gets calculated with: 1.234,50 € ÷ 1.000.000 × 1000
    await expect(card(page, 'CPM')).toContainText('1,23 €')
  })

  test('ROI stays locked without a margin; zero margin has no break-even', async ({ page }) => {
    await fill(page, { Mediabudget: '200', 'Zugeordneter Umsatz': '1000' })
    await expect(card(page, 'ROAS')).toContainText('5×')
    await expect(card(page, 'Marketing-ROI')).toContainText('Deckungsbeitragsquote')
    await field(page, 'Deckungsbeitragsquote').fill('0')
    await expect(card(page, 'Marketing-ROI')).toContainText('-100 %')
    await expect(card(page, 'Break-even-ROAS')).toContainText('Ergänze')
  })

  test('help text toggles for inputs and KPIs', async ({ page }) => {
    const about = page.getByRole('button', { name: 'Info zu Mediabudget' })
    await about.click()
    await expect(about).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText(/Was du für die Medien/)).toBeVisible()
    await fill(page, { Mediabudget: '5000', Impressions: '1000000' })
    await card(page, 'CPM').getByText('So wird gerechnet').click()
    await expect(card(page, 'CPM')).toContainText('CPM = Mediabudget ÷ Impressions × 1000')
    await expect(card(page, 'CPM')).toContainText('Mit Mediabudget: 5.000,00 € · Impressions: 1.000.000')
  })
})

test.describe('navigation and state', () => {
  test('scenarios are kept per category and reset only the current one', async ({ page }) => {
    await field(page, 'Mediabudget').fill('1000')
    await openCategory(page, /^tv/i)
    await field(page, 'Mediabudget').fill('2000')
    await page.getByRole('button', { name: 'Zurücksetzen' }).click()
    await expect(field(page, 'Mediabudget')).toHaveValue('')
    await expect(page.getByRole('button', { name: 'Zurücksetzen' })).toBeDisabled()
    await openCategory(page, /^online/i)
    await expect(field(page, 'Mediabudget')).toHaveValue('1.000')
  })

  test('deep links, back and forward', async ({ page }) => {
    await page.goto('/#/ooh')
    await expect(page.getByRole('radio', { name: /out-of-home/i })).toBeChecked()
    await openCategory(page, /^tv/i)
    await expect(page).toHaveURL(/#\/tv$/)
    await page.goBack()
    await expect(page.getByRole('heading', { level: 2, name: 'Out-of-Home' })).toBeVisible()
    await page.goForward()
    await expect(page.getByRole('heading', { level: 2, name: 'TV' })).toBeVisible()
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 2, name: 'Online' })).toBeVisible()
    await openCategory(page, /weitere offline/i)
    await expect(page.getByRole('radio', { name: /out-of-home/i })).not.toBeChecked() // fresh load → Print
    await expect(page.getByRole('radio', { name: /print/i })).toBeChecked()
  })

  test('unknown routes fall back to Online', async ({ page }) => {
    await page.goto('/#/nope')
    await expect(page.getByRole('heading', { level: 2, name: 'Online' })).toBeVisible()
  })

  test('stays in light mode when the system is set to dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.reload()
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).toMatch(/oklch\(0\.98|rgb\(248, 250, 252\)/) // slate-50
    await expect(page.getByRole('button', { name: /dunkel|dark|theme|farbschema/i })).toHaveCount(0)
  })

  test('quick-start guide loads an example, hides and comes back', async ({ page }) => {
    const guide = page.getByRole('region', { name: 'So funktioniert’s' })
    await expect(guide).toBeVisible()
    await guide.getByRole('button', { name: 'Zeig mir ein Beispiel', exact: true }).click()
    await expect(card(page, 'CPM')).toContainText('5,00 €')
    await guide.getByRole('button', { name: 'Verstanden, ausblenden', exact: true }).click()
    await expect(guide).toHaveCount(0)
    await page.getByRole('button', { name: 'So funktioniert’s', exact: true }).click()
    await expect(page.getByRole('region', { name: 'So funktioniert’s' })).toBeVisible()
  })

  test('inputs are not persisted across reloads', async ({ page }) => {
    await field(page, 'Mediabudget').fill('1000')
    await page.reload()
    await expect(field(page, 'Mediabudget')).toHaveValue('')
  })
})

test.describe('keyboard only', () => {
  test.skip(({ isMobile }) => isMobile, 'no physical keyboard on mobile')

  test('skip link, tabs with arrow keys, disclosure and entry without a mouse', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit does not Tab to links/buttons by default (macOS setting)')
    await page.goto('/#/tv')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: /zum rechner springen/i })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('tabpanel')).toBeFocused()
    await expect(page).toHaveURL(/#\/tv$/)

    await page.getByRole('tab', { name: /^tv/i }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: /^radio/i })).toBeFocused()
    await expect(page.getByRole('tab', { name: /^radio/i })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Home')
    await expect(page.getByRole('tab', { name: /^online/i })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByRole('tab', { name: /weitere offline/i })).toHaveAttribute('aria-selected', 'true')

    // Tab from the selected tab moves into the panel, not to the other tabs (roving tabindex)
    await page.keyboard.press('Tab')
    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'))
    expect(focusedRole).not.toBe('tab')

    // offline sub-channel radios work with arrow keys
    await page.getByRole('radio', { name: /print/i }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('heading', { level: 2, name: 'Out-of-Home' })).toBeVisible()

    // disclosure via keyboard
    const more = page.getByRole('button', { name: /mehr eingaben/i })
    await more.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: /weniger eingaben/i })).toHaveAttribute('aria-expanded', 'true')
  })
})

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile layout only')

  test('"Zu den Ergebnissen" bar jumps to results and moves focus there', async ({ page }) => {
    await page.getByRole('button', { name: 'Beispiel laden', exact: true }).click()
    const bar = page.getByRole('link', { name: /zu den ergebnissen/i })
    await expect(bar).toContainText('14 von 14 KPIs verfügbar')
    await bar.click()
    await expect(results(page)).toBeFocused()
    await expect(page.getByRole('heading', { name: 'Ergebnisse', exact: true })).toBeInViewport()
  })

  test('layout has no horizontal scroll', async ({ page }) => {
    await page.getByRole('button', { name: 'Beispiel laden', exact: true }).click()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('focused fields are not hidden behind the results bar', async ({ page }) => {
    const input = field(page, 'Conversions')
    await input.focus()
    const box = await input.boundingBox()
    const bar = await page.getByRole('link', { name: /zu den ergebnissen/i }).boundingBox()
    expect(box!.y + box!.height).toBeLessThanOrEqual(bar!.y)
  })
})
