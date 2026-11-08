import { test, expect } from '@playwright/test';

/**
 * Smoke e2e del front de PRAXIS.
 * El backend no se levanta en CI: estas pruebas solo cubren lo que funciona sin API
 * (redirecciones, formularios y validaciones del lado del cliente).
 */
test.describe('acceso', () => {
  test('la raíz redirige al inicio de sesión', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page).toHaveTitle(/PRAXIS/);
    await expect(page.getByRole('heading', { name: 'Acceso a la Plataforma' })).toBeVisible();
  });

  test('valida los campos vacíos sin llamar al servidor', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByText('Escribe tu correo institucional.')).toBeVisible();
    await expect(page.getByText('Escribe tu contraseña.')).toBeVisible();
  });

  test('permite mostrar la contraseña', async ({ page }) => {
    await page.goto('/auth/login');

    const password = page.locator('#login-password');
    await password.fill('Secreta*2026');
    await expect(password).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
    await expect(password).toHaveAttribute('type', 'text');
  });

  test('abre la recuperación de contraseña desde el login', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();

    await expect(page).toHaveURL(/\/recuperar-password/);
    await expect(page.getByRole('heading', { name: 'Recuperar contraseña' })).toBeVisible();
  });

  test('la recuperación valida el formato del correo', async ({ page }) => {
    await page.goto('/recuperar-password');

    await page.locator('#rec-email').fill('correo-sin-arroba');
    await page.getByRole('button', { name: 'Enviar código' }).click();

    await expect(page.getByText('Revisa el formato del correo.')).toBeVisible();
  });
});
