import { test, expect, request } from '@playwright/test';

const API_BASE = 'http://localhost:5000';

test('Messages page sends a message for an item', async ({ page }) => {
  const api = await request.newContext({ baseURL: API_BASE });
  const ts = Date.now();
  const itemName = `E2E Chat Wallet ${ts}`;
  const ownerEmail = `owner+${ts}@lostfinder.local`;
  const otherEmail = `friend+${ts}@lostfinder.local`;

  // Create an item so we get a valid itemId
  await api.post('/item/add', {
    data: {
      name: itemName,
      category: 'Accessories',
      location: 'Cafeteria',
      contact: '9999990000',
      email: ownerEmail,
      description: 'For messaging test',
      status: 'Lost'
    }
  });
  const list = await api.get('/item');
  const items = await list.json();
  const item = items.find(i => i.email === ownerEmail && i.name === itemName);
  if (!item) throw new Error('Seed item not found for messages test');

  // Set sender email in localStorage and open Messages page
  await page.goto('/');
  await page.addInitScript((email) => { localStorage.setItem('userEmail', email); }, otherEmail);
  await page.goto(`/messages?itemId=${item._id}&toEmail=${encodeURIComponent(ownerEmail)}`);

  const messageText = `Hello about ${itemName}`;
  await page.getByPlaceholder('Type a message...').fill(messageText);
  await page.getByRole('button', { name: /Send/i }).click();

  // Expect the message to appear in the thread
  await expect(page.getByText(messageText).first()).toBeVisible({ timeout: 5000 });
});
