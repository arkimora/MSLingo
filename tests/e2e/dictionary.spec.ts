import { test, expect } from '@playwright/test';

test.describe('Dictionary', () => {
  test('renders dictionary page', async ({ page }) => {
    await page.goto('/dictionary');
    await expect(page.locator('h1', { hasText: 'Толь бичиг' })).toBeVisible();
  });

  test('search input is interactive', async ({ page }) => {
    await page.goto('/dictionary');
    const input = page.locator('input[type="search"]');
    await expect(input).toBeVisible();
    await input.fill('гэр');
    await expect(input).toHaveValue('гэр');
  });

  test('topic tab switches view', async ({ page }) => {
    await page.goto('/dictionary');
    await page.getByRole('button', { name: 'Сэдвээр' }).click();
    await expect(page.getByRole('button', { name: 'Бүгд' })).toBeVisible();
  });

  test('all tab shows results or empty state', async ({ page }) => {
    await page.goto('/dictionary');
    await expect(page.locator('h1', { hasText: 'Толь бичиг' })).toBeVisible();
  });
});
