import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test('renders settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1', { hasText: 'Тохиргоо' })).toBeVisible();
  });

  test('theme switcher is visible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('text=Харааны горим')).toBeVisible();
  });

  test('reduced motion toggle exists', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('text=Хөдөлгөөн багасгах')).toBeVisible();
  });

  test('daily goal slider is present', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('input[type="range"]')).toBeVisible();
  });
});
