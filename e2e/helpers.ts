import { expect, type Page } from '@playwright/test'

export const field = (page: Page, name: string) => page.getByRole('textbox', { name, exact: true })
export const card = (page: Page, name: string) => page.getByRole('article', { name, exact: true })
export const results = (page: Page) => page.getByRole('region', { name: 'Results' })

export async function fill(page: Page, values: Record<string, string>) {
  for (const [label, value] of Object.entries(values)) await field(page, label).fill(value)
}

export async function expectCards(page: Page, expected: Record<string, string>) {
  for (const [name, value] of Object.entries(expected)) {
    await expect(card(page, name), name).toContainText(value)
  }
}

/** Open a category the way a user would: tab, then (for offline channels) the sub-channel radio. */
export async function openCategory(page: Page, tab: RegExp, sub?: RegExp) {
  await page.getByRole('tab', { name: tab }).click()
  // the radio is visually hidden inside its label (segmented control): click the label
  if (sub) await page.getByRole('radio', { name: sub }).locator('xpath=..').click()
}
