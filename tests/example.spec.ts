import { test, expect } from '@playwright/test';

/**
 * Smoke e2e del front.
 * El backend no se levanta aquí: si un flujo necesita API, mockea con page.route()
 * o apunta PLAYWRIGHT_API_URL a un staging.
 */
test.describe('home', () => {
  test('carga la página principal', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Create Next App/i);
    await expect(
      page.getByRole('heading', { name: /To get started/i }),
    ).toBeVisible();
  });

  test('muestra el logo de Next.js', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByAltText('Next.js logo')).toBeVisible();
  });
});
