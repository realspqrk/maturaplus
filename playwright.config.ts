import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' }, testIgnore: /screenshots/ },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: /screenshots/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: /screenshots/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: /screenshots/ },
  ],
})
