import { execSync } from 'node:child_process'
import { cpSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { card, field, fill } from './helpers'
import { serveDir } from './support/static-server'

const chromiumOnly = ({ browserName }: { browserName: string }) => browserName !== 'chromium'
const SKIP_REASON = 'service-worker + offline emulation is only reliable in Chromium-based browsers under Playwright'

async function waitForOfflineReady(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload()
  await expect(page.getByText('Works offline', { exact: true })).toBeAttached() // badge is hidden on narrow screens
}

test('web app manifest makes the app installable', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBeTruthy()
  const res = await request.get(href!)
  expect(res.ok()).toBe(true)
  const m = await res.json()
  expect(m).toMatchObject({ name: 'Marketing KPI Calculator', short_name: 'KPI Calc', display: 'standalone' })
  expect(m.start_url).toBeTruthy()
  const sizes = m.icons.map((i: { sizes: string }) => i.sizes)
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true)
  for (const icon of m.icons) {
    const r = await request.get(icon.src)
    expect(r.ok(), icon.src).toBe(true)
    expect(r.headers()['content-type']).toBe('image/png')
  }
})

test.describe('service worker', () => {
  test.skip(chromiumOnly, SKIP_REASON)

  test('works fully offline after the first visit, including categories never opened', async ({ page, context }) => {
    await page.goto('/')
    await waitForOfflineReady(page)
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { level: 2, name: 'Online' })).toBeVisible()
    await page.goto('/#/ooh')
    await fill(page, { 'Media spend': '10000', 'Weekly contacts': '500000', Weeks: '2' })
    await expect(card(page, 'Cost per 1,000 contacts')).toContainText('€10.00')
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: /export csv/i }).click()
    expect((await download).suggestedFilename()).toMatch(/^kpi-ooh-.*\.csv$/)
    // a brand-new tab in the same (offline) browser profile also starts
    const second = await context.newPage()
    await second.goto('/#/directMail')
    await expect(second.getByRole('heading', { level: 2, name: 'Direct mail' })).toBeVisible()
    await context.setOffline(false)
  })
})

test.describe('app update (version A → B)', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(chromiumOnly, SKIP_REASON)

  let root: string
  // one build directory per worker: parallel runs must not swap each other's "deployments"
  // oxlint-disable-next-line no-empty-pattern -- Playwright requires a destructured fixtures argument
  test.beforeAll(async ({}, testInfo) => {
    root = join(process.cwd(), '.e2e', `${testInfo.project.name}-${testInfo.workerIndex}`)
    rmSync(root, { recursive: true, force: true })
    for (const v of ['a', 'b']) {
      execSync(`npx vite build --outDir "${join(root, v)}" --emptyOutDir --logLevel error`, {
        env: { ...process.env, APP_VERSION: `e2e-${v}` },
        stdio: 'inherit',
      })
    }
  })

  test('update waits for the user, keeps inputs until accepted, and never reloads other windows', async ({ context }) => {
    const live = join(root, 'live')
    rmSync(live, { recursive: true, force: true })
    cpSync(join(root, 'a'), live, { recursive: true })
    const server = await serveDir(live)
    try {
      const page = await context.newPage()
      await page.goto(server.url)
      await waitForOfflineReady(page)
      await expect(page.getByText('Version e2e-a')).toBeVisible()
      await field(page, 'Media spend').fill('1000')
      await field(page, 'Media spend').blur()

      const other = await context.newPage()
      await other.goto(server.url)
      await expect(other.getByText('Version e2e-a')).toBeVisible()
      await field(other, 'Media spend').fill('2222')
      await field(other, 'Media spend').blur()

      // deploy B and let the browser discover it
      cpSync(join(root, 'b'), live, { recursive: true, force: true })
      await page.evaluate(async () => {
        await (await navigator.serviceWorker.getRegistration())!.update()
      })
      await expect(page.getByText(/new version is available/i)).toBeVisible()
      await expect(other.getByText(/new version is available/i)).toBeVisible()

      // nothing happens on its own
      await page.waitForTimeout(1500)
      await expect(page.getByText('Version e2e-a')).toBeVisible()
      await expect(field(page, 'Media spend')).toHaveValue('1,000')

      // "Later" in the other window keeps everything
      await other.getByRole('button', { name: 'Later' }).click()
      await expect(other.getByText(/new version is available/i)).toBeHidden()

      // accept in the first window → it reloads into B, inputs cleared
      await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: /reload and update/i }).click()])
      await expect(page.getByText('Version e2e-b')).toBeVisible()
      await expect(field(page, 'Media spend')).toHaveValue('')

      // the other window was NOT reloaded: still A, inputs intact, informed instead
      await expect(other.getByText(/installed from another window/i)).toBeVisible()
      await expect(other.getByText('Version e2e-a')).toBeVisible()
      await expect(field(other, 'Media spend')).toHaveValue('2,222')
      await expect(other.getByRole('heading', { level: 2, name: 'Online' })).toBeVisible()
      await other.getByRole('button', { name: /reload now/i }).click()
      await expect(other.getByText('Version e2e-b')).toBeVisible()
    } finally {
      await server.close()
    }
  })
})
