import { test, expect } from '@playwright/test';

/**
 * E2E tests: Offers workflow
 * Covers: investor sends offer, owner accepts/rejects, validation
 */

async function loginAs(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

test.describe('Offers Workflow', () => {
  test('investor can browse marketplace and view idea', async ({ page }) => {
    await loginAs(page, 'emily@venturelab.com', 'password123');
    await expect(page).toHaveURL(/\/investor/);

    // Navigate to marketplace
    await page.getByRole('button', { name: /marketplace/i }).click();
    await expect(page).toHaveURL(/\/investor\/marketplace/);
    await expect(page.getByText('AI Fitness Coach')).toBeVisible();
  });

  test('investor sees offer form on idea detail', async ({ page }) => {
    await loginAs(page, 'emily@venturelab.com', 'password123');
    await page.goto('/investor/marketplace');
    await expect(page.getByText('AI Fitness Coach')).toBeVisible();

    // Click View Details on first idea card
    await page.getByRole('button', { name: 'View Details' }).first().click();
    await expect(page).toHaveURL(/\/investor\/ideas\//);
    await expect(page.getByRole('button', { name: /send offer/i })).toBeVisible();
  });

  test('offer form validation – empty fields', async ({ page }) => {
    await loginAs(page, 'emily@venturelab.com', 'password123');
    await page.goto('/investor/marketplace');
    await page.getByRole('button', { name: 'View Details' }).first().click();

    await page.getByRole('button', { name: /send offer/i }).click();

    // Modal should appear
    await expect(page.getByText(/investment amount/i)).toBeVisible();

    // Submit with empty fields
    await page.getByRole('button', { name: /^send offer$/i }).click();
    await expect(page.getByText('Amount is required')).toBeVisible();
    await expect(page.getByText('Equity is required')).toBeVisible();
    await expect(page.getByText('Message is required')).toBeVisible();
  });

  test('offer form validation – invalid amount', async ({ page }) => {
    await loginAs(page, 'emily@venturelab.com', 'password123');
    await page.goto('/investor/marketplace');
    await page.getByRole('button', { name: 'View Details' }).first().click();
    await page.getByRole('button', { name: /send offer/i }).click();

    await page.getByLabel(/investment amount/i).fill('-500');
    await page.getByRole('button', { name: /^send offer$/i }).click();
    await expect(page.getByText('Amount must be a positive number')).toBeVisible();
  });

  test('owner can see received offers', async ({ page }) => {
    await loginAs(page, 'michael@venturelab.com', 'password123');
    await expect(page).toHaveURL(/\/app/);

    // Navigate to offers
    await page.getByRole('button', { name: 'Offers' }).click();
    await expect(page).toHaveURL(/\/app\/offers/);
    await expect(page.getByText('Offers Received')).toBeVisible();
    // Should show offers (Emily has sent offers to Michael's ideas)
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('owner can accept an offer', async ({ page }) => {
    await loginAs(page, 'michael@venturelab.com', 'password123');
    await page.goto('/app/offers');
    await expect(page.getByText('Offers Received')).toBeVisible();

    const acceptButtons = page.getByRole('button', { name: /accept/i });
    const count = await acceptButtons.count();
    if (count > 0) {
      await acceptButtons.first().click();
      await expect(page.getByText('Accepted').first()).toBeVisible();
    }
  });

  test('owner can reject an offer', async ({ page }) => {
    await loginAs(page, 'michael@venturelab.com', 'password123');
    await page.goto('/app/offers');
    await expect(page.getByText('Offers Received')).toBeVisible();

    const rejectButtons = page.getByRole('button', { name: /reject/i });
    const count = await rejectButtons.count();
    if (count > 0) {
      await rejectButtons.first().click();
      await expect(page.getByText('Rejected').first()).toBeVisible();
    }
  });

  test('investor can view their sent offers', async ({ page }) => {
    await loginAs(page, 'emily@venturelab.com', 'password123');
    await expect(page).toHaveURL(/\/investor/);

    await page.getByRole('button', { name: 'My Offers' }).click();
    await expect(page).toHaveURL(/\/investor\/offers/);
    await expect(page.getByText('My Offers')).toBeVisible();
  });

  test('admin analytics dashboard shows charts', async ({ page }) => {
    await loginAs(page, 'sarah@venturelab.com', 'admin123');
    await page.goto('/app/analytics');
    await expect(page.getByText('Analytics Dashboard')).toBeVisible();
    // Toggle to analytics view
    await page.getByRole('button', { name: 'Analytics View' }).click();
    await expect(page.getByText('Offer Status Distribution')).toBeVisible();
  });
});
