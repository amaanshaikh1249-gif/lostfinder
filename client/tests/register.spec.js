import { test, expect } from '@playwright/test';

test('user registration', async ({ page }) => {
  await page.goto('/user-register');

  await page.fill('input[placeholder="Full name"]', 'Test User');
  await page.fill('input[placeholder="Email"]', 'testuser@example.com');
  await page.fill('input[placeholder="Create password"]', 'password123');
  await page.fill('input[placeholder="Confirm password"]', 'password123');

  await page.click('button:has-text("Signup")');

  await expect(page).toHaveURL('/items');
});
