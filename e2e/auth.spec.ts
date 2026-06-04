import { test, expect } from '@playwright/test';

/**
 * E2E tests: Authentication flow
 * Covers: login, logout, register, validation errors, role-based redirect
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('landing page loads with Login and Register buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
    await expect(page.getByText('VentureLab').first()).toBeVisible();
  });

  test('login page shows validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('login shows error for invalid email format', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('notanemail');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Invalid email format')).toBeVisible();
  });

  test('login shows error for wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('michael@venturelab.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('startup owner login redirects to /app', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('michael@venturelab.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/app/);
    await expect(page.getByText('Startup Ideas')).toBeVisible();
  });

  test('investor login redirects to /investor', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('emily@venturelab.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/investor/);
  });

  test('register page shows validation errors for empty form', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
  });

  test('register shows error when passwords do not match', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /investor/i }).click();
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email').fill('testuser@test.com');
    await page.locator('#password').fill('pass123');
    await page.getByLabel('Confirm Password').fill('different');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('successful registration as Investor redirects to /investor', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /investor/i }).click();
    await page.getByLabel('Full Name').fill('New E2E Investor');
    await page.getByLabel('Email').fill(`investor_e2e_${Date.now()}@test.com`);
    await page.locator('#password').fill('pass123');
    await page.getByLabel('Confirm Password').fill('pass123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/\/investor/);
  });

  test('logout returns user to home', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.getByLabel('Email').fill('michael@venturelab.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/app/);

    // Open mobile nav drawer and click logout
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL('/login');
  });
});
