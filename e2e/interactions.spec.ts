import { expect, test } from '@playwright/test'
import { card, field, fill, openCategory, results } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('guided input', () => {
  test('an unlock hint expands a collapsed section and focuses the missing input', async ({ page }) => {
    await field(page, 'Media spend').fill('1000')
    await card(page, 'CPL').getByRole('button', { name: 'Leads' }).click()
    await expect(field(page, 'Leads')).toBeFocused()
    await page.keyboard.type('50')
    await expect(card(page, 'CPL')).toContainText('€20.00')
  })

  test('calculated values appear in empty inputs and can be overridden, then released', async ({ page }) => {
    await page.getByRole('button', { name: /known rates/i }).click()
    await fill(page, { 'Media spend': '1000', CPM: '5' })
    const impressions = field(page, 'Impressions')
    await expect(impressions).toHaveAttribute('placeholder', '200,000')
    await expect(impressions).toHaveValue('')
    await impressions.fill('250000') // pin a different value → contradiction
    await expect(page.getByRole('alert')).toContainText('CPM is €5.00')
    await expect(impressions).toHaveAccessibleDescription(/doesn't match/i)
    await impressions.fill('') // release → calculated again
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(impressions).toHaveAttribute('placeholder', '200,000')
  })

  test('KPIs derived from contradictory inputs are marked as conflicting', async ({ page }) => {
    await page.getByRole('button', { name: /known rates/i }).click()
    await fill(page, { 'Media spend': '1000', Impressions: '100000', CPM: '20', Clicks: '500' })
    await expect(card(page, 'CPM')).toContainText('Conflict')
    await expect(card(page, 'CTR')).toContainText('Conflict') // uses the conflicting impressions
    await expect(card(page, 'CPC')).toContainText('Conflict') // uses the conflicting spend
  })

  test('impossible derived values are explained, not shown', async ({ page }) => {
    await openCategory(page, /^tv/i)
    await page.getByRole('button', { name: /more inputs/i }).click()
    await fill(page, { 'Rating points (GRP/TRP)': '300', 'Average frequency': '2', 'Audience universe': '1000000' })
    await expect(results(page)).toContainText("Net reach can't exceed 100%")
    await expect(field(page, 'Net reach')).not.toHaveAttribute('placeholder', /150/)
    await expect(card(page, 'Gross contacts')).toContainText('Conflict')
  })

  test('invalid text and out-of-range values get accessible inline errors', async ({ page }) => {
    const margin = field(page, 'Contribution margin')
    await margin.fill('abc')
    await expect(margin).toHaveAttribute('aria-invalid', 'true')
    await expect(margin).toHaveAccessibleDescription(/enter a number/i)
    await margin.fill('101')
    await expect(margin).toHaveAccessibleDescription(/can't exceed 100%/)
    await margin.fill('1%2')
    await expect(margin).toHaveAttribute('aria-invalid', 'true')
    await margin.fill('30 %')
    await expect(margin).not.toHaveAttribute('aria-invalid')
  })

  test('accepts currency symbols, separators and formats on blur', async ({ page }) => {
    const spend = field(page, 'Media spend')
    await spend.fill('€ 12,500.5')
    await field(page, 'Impressions').click()
    await expect(spend).toHaveValue('12,500.5')
    await spend.focus()
    await expect(spend).toHaveValue('€ 12,500.5') // raw text while editing
  })

  test('ROI stays locked without a margin; zero margin has no break-even', async ({ page }) => {
    await fill(page, { 'Media spend': '200', 'Attributed revenue': '1000' })
    await expect(card(page, 'ROAS')).toContainText('5×')
    await expect(card(page, 'Marketing ROI')).toContainText('Contribution margin')
    await field(page, 'Contribution margin').fill('0')
    await expect(card(page, 'Marketing ROI')).toContainText('-100%')
    await expect(card(page, 'Break-even ROAS')).toContainText('Add')
  })

  test('help text toggles for inputs and KPIs', async ({ page }) => {
    const about = page.getByRole('button', { name: 'About Media spend' })
    await about.click()
    await expect(about).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText(/What you paid for the media/)).toBeVisible()
    await fill(page, { 'Media spend': '5000', Impressions: '1000000' })
    await card(page, 'CPM').getByText("How it's calculated").click()
    await expect(card(page, 'CPM')).toContainText('CPM = Media spend ÷ Impressions × 1000')
    await expect(card(page, 'CPM')).toContainText('Using Media spend: €5,000.00 · Impressions: 1,000,000')
  })
})

test.describe('navigation and state', () => {
  test('scenarios are kept per category and reset only the current one', async ({ page }) => {
    await field(page, 'Media spend').fill('1000')
    await openCategory(page, /^tv/i)
    await field(page, 'Media spend').fill('2000')
    await page.getByRole('button', { name: 'Reset' }).click()
    await expect(field(page, 'Media spend')).toHaveValue('')
    await expect(page.getByRole('button', { name: 'Reset' })).toBeDisabled()
    await openCategory(page, /online/i)
    await expect(field(page, 'Media spend')).toHaveValue('1,000')
  })

  test('deep links, back and forward', async ({ page }) => {
    await page.goto('/#/ooh')
    await expect(page.getByRole('radio', { name: /out-of-home/i })).toBeChecked()
    await openCategory(page, /^tv/i)
    await expect(page).toHaveURL(/#\/tv$/)
    await page.goBack()
    await expect(page.getByRole('heading', { level: 2, name: 'Out-of-home' })).toBeVisible()
    await page.goForward()
    await expect(page.getByRole('heading', { level: 2, name: 'TV' })).toBeVisible()
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 2, name: 'Online' })).toBeVisible()
    await openCategory(page, /other offline/i)
    await expect(page.getByRole('radio', { name: /out-of-home/i })).not.toBeChecked() // fresh load → Print
    await expect(page.getByRole('radio', { name: /print/i })).toBeChecked()
  })

  test('unknown routes fall back to Online', async ({ page }) => {
    await page.goto('/#/nope')
    await expect(page.getByRole('heading', { level: 2, name: 'Online' })).toBeVisible()
  })

  test('theme toggle switches and is remembered', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.reload()
    await page.getByRole('button', { name: 'Switch to dark theme' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.getByRole('button', { name: 'Switch to light theme' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('inputs are not persisted across reloads', async ({ page }) => {
    await field(page, 'Media spend').fill('1000')
    await page.reload()
    await expect(field(page, 'Media spend')).toHaveValue('')
  })
})

test.describe('keyboard only', () => {
  test.skip(({ isMobile }) => isMobile, 'no physical keyboard on mobile')

  test('skip link, tabs with arrow keys, disclosure and entry without a mouse', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit does not Tab to links/buttons by default (macOS setting)')
    await page.goto('/#/tv')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: /skip to calculator/i })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('tabpanel')).toBeFocused()
    await expect(page).toHaveURL(/#\/tv$/)

    await page.getByRole('tab', { name: /^tv/i }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: /radio/i })).toBeFocused()
    await expect(page.getByRole('tab', { name: /radio/i })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Home')
    await expect(page.getByRole('tab', { name: /online/i })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByRole('tab', { name: /other offline/i })).toHaveAttribute('aria-selected', 'true')

    // Tab from the selected tab moves into the panel, not to the other tabs (roving tabindex)
    await page.keyboard.press('Tab')
    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'))
    expect(focusedRole).not.toBe('tab')

    // offline sub-channel radios work with arrow keys
    await page.getByRole('radio', { name: /print/i }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('heading', { level: 2, name: 'Out-of-home' })).toBeVisible()

    // disclosure via keyboard
    const more = page.getByRole('button', { name: /more inputs/i })
    await more.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: /fewer inputs/i })).toHaveAttribute('aria-expanded', 'true')
  })
})

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile layout only')

  test('"View results" bar jumps to results and moves focus there', async ({ page }) => {
    await page.getByRole('button', { name: /try an example/i }).click()
    const bar = page.getByRole('link', { name: /view results/i })
    await expect(bar).toContainText('14 of 14 KPIs available')
    await bar.click()
    await expect(results(page)).toBeFocused()
    await expect(page.getByRole('heading', { name: 'Results', exact: true })).toBeInViewport()
  })

  test('layout has no horizontal scroll', async ({ page }) => {
    await page.getByRole('button', { name: /try an example/i }).click()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('focused fields are not hidden behind the results bar', async ({ page }) => {
    const input = field(page, 'Conversions')
    await input.focus()
    const box = await input.boundingBox()
    const bar = await page.getByRole('link', { name: /view results/i }).boundingBox()
    expect(box!.y + box!.height).toBeLessThanOrEqual(bar!.y)
  })
})
