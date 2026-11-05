import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, retries: 0,
  timeout: 30_000, expect: { timeout: 8000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: { baseURL: 'http://127.0.0.1:18105', trace: 'retain-on-failure', screenshot: 'only-on-failure', serviceWorkers: 'allow' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'node server.js', url: 'http://127.0.0.1:18105/healthz',
    reuseExistingServer: false, timeout: 15_000,
    env: { HOST: '127.0.0.1', PORT: '18105', OPENWEATHER_API_KEY: '', TRUST_PROXY: 'false', PUBLIC_ORIGIN: '', PUBLIC_ROOT: '' },
  },
});
