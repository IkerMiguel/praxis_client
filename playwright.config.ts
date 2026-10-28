import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

/**
 * Carga .env / .env.local (mismo criterio que Next.js).
 * El backend NO vive en este repo: solo se consume vía NEXT_PUBLIC_API_URL.
 */
loadEnvConfig(process.cwd());

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Levanta el front local antes de los e2e (el API externo no se inicia aquí). */
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
