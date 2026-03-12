import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5000';

test('Report Lost & Found then verify in Items', async ({ page }) => {
  const ts = Date.now();
  const itemName = `E2E Wallet ${ts}`;
  const lostEmail = `lost-ui+${ts}@lostfinder.local`;
  const foundEmail = `found-ui+${ts}@lostfinder.local`;

  // Report Lost
  await page.goto('/report-lost');
  await page.getByPlaceholder('Item Name *').fill(itemName);
  await page.getByPlaceholder('Category *').fill('Accessories');
  await page.getByPlaceholder('Last Seen Location *').fill('Library');
  await page.getByPlaceholder('Contact Number').fill('9999999999');
  await page.getByPlaceholder('Email').fill(lostEmail);

  const lostReq = page.waitForResponse(resp =>
    resp.url().includes(`${API_BASE}/item/add`) && resp.status() === 200
  );
  await page.getByRole('button', { name: /Submit Lost Item/i }).click();
  await lostReq;

  // Report Found
  await page.goto('/report-found');
  await page.getByPlaceholder('Item Name *').fill(itemName);
  await page.getByPlaceholder('Category *').fill('Accessories');
  await page.getByPlaceholder('Found Location *').fill('Library');
  await page.getByPlaceholder('Contact Number').fill('8888888888');
  await page.getByPlaceholder('Email').fill(foundEmail);

  const foundReq = page.waitForResponse(resp =>
    resp.url().includes(`${API_BASE}/item/add`) && resp.status() === 200
  );
  await page.getByRole('button', { name: /Submit Found Item/i }).click();
  await foundReq;

  // Verify both appear in Items list
  await page.goto('/items');
  await expect(page.getByText(itemName).first()).toBeVisible();
  await page.getByRole('combobox').first().selectOption('Lost');
  await expect(page.getByText(itemName).first()).toBeVisible();
  await page.getByRole('combobox').first().selectOption('Found');
  await expect(page.getByText(itemName).first()).toBeVisible();
});
