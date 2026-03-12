import { test, expect, request } from '@playwright/test';

const API_BASE = 'http://localhost:5000';

test.beforeAll(async () => {
  const api = await request.newContext({ baseURL: API_BASE });
  const ts = Date.now();
  const admin = { name: 'E2E', email: `e2e+${ts}@lostfinder.local`, password: 'Test@1234' };
  const res = await api.post('/auth/register', { data: admin });
  // Ignore 400 if already exists
  if (!(res.ok() || res.status() === 400)) {
    throw new Error(`Admin register failed: ${res.status()} ${await res.text()}`);
  }
});

test('Admin login redirects to Admin panel', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();

  // Use the admin created in beforeAll by logging in via API first to retrieve email
  // Since email is unique per run, derive from a marker on the page? Simpler: register again here.
  const ts = Date.now();
  const email = `e2eui+${ts}@lostfinder.local`;
  const password = 'Test@1234';

  // Self-register via backend
  await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'UI', email, password }),
  }).catch(() => {});

  await page.getByPlaceholder('Admin Email').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await page.waitForURL('**/admin', { timeout: 10000 });
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: /Admin Control Panel/i })).toBeVisible();
});
