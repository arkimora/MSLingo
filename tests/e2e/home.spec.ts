import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads without crashing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await expect(page.locator('text=MSLingo')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('displays MSL branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1', { hasText: 'Монгол дохионы хэл' })).toBeVisible();
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav >> text=Сурах')).toBeVisible();
    await expect(page.locator('nav >> text=Дахин үзэх')).toBeVisible();
    await expect(page.locator('nav >> text=Толь')).toBeVisible();
  });

  test('learn button navigates to /learn', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /суралцаж/i }).click();
    await expect(page).toHaveURL(/\/learn/);
  });

  test('review button navigates to /review', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /дахин үзэх/i }).first().click();
    await expect(page).toHaveURL(/\/review/);
  });

  test('skip link focuses main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /skip/i });
    await expect(skip).toBeFocused();
    await skip.click();
    await expect(page.locator('#main-content')).toBeFocused();
  });
});
