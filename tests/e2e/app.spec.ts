import { test, expect } from '@playwright/test';

test('landing page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('SynapseHub Collaboration Cloud')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create account' })).toBeVisible();
});

test('login route renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
});