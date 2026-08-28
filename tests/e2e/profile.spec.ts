import { test, expect } from '@playwright/test';

test.describe('Profile', () => {
  test('renders profile page', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('h1', { hasText: 'Миний ахиц' })).toBeVisible();
  });

  test('no page errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/profile');
    expect(errors).toHaveLength(0);
  });
});
