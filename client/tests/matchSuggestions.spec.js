import { test, expect, request } from '@playwright/test';

const API_BASE = 'http://localhost:5000';

test('AI Match Detection shows suggestions for similar Found item', async ({ page }) => {
  // Prepare: create a Found item before visiting Report Lost (so initial fetch sees it)
  const api = await request.newContext({ baseURL: API_BASE });
  const ts = Date.now();
  const itemName = `E2E Glasses ${ts}`;
  await api.post('/item/add', {
    data: {
      name: itemName,
      category: 'Accessories',
      location: 'Library',
      contact: '7777777777',
      email: `found-ui+${ts}@lostfinder.local`,
      description: 'Black frame',
      status: 'Found'
    }
  });

  // Now fill a Lost report with similar details
  await page.goto('/report-lost');
  await page.getByPlaceholder('Item Name *').fill(itemName);
  await page.getByPlaceholder('Category *').fill('Accessories');
  await page.getByPlaceholder('Last Seen Location *').fill('Library');

  // Expect AI suggestions panel and the found item to be visible
  await expect(page.getByRole('heading', { name: /AI Match Detection/i })).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(itemName).first()).toBeVisible();
});
