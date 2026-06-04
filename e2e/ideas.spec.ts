import { test, expect } from '@playwright/test';

/**
 * E2E tests: Ideas CRUD
 * Covers: list, create, edit, delete, validation, detail view
 */

async function loginAsOwner(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await page.getByLabel('Email').fill('michael@venturelab.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/app/);
}

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await page.getByLabel('Email').fill('sarah@venturelab.com');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/app/);
}

test.describe('Ideas CRUD', () => {
  test('ideas list shows startup ideas', async ({ page }) => {
    await loginAsOwner(page);
    await expect(page.getByText('Startup Ideas')).toBeVisible();
    await expect(page.getByText('AI Fitness Coach')).toBeVisible();
  });

  test('create idea – validation errors shown for empty form', async ({ page }) => {
    await loginAsOwner(page);
    await page.getByRole('button', { name: 'Create Idea' }).click();
    await expect(page).toHaveURL(/\/app\/ideas\/new/);
    await page.getByRole('button', { name: 'Save Idea' }).click();
    await expect(page.getByText('Title is required')).toBeVisible();
    await expect(page.getByText('Industry is required')).toBeVisible();
    await expect(page.getByText('Stage is required')).toBeVisible();
    await expect(page.getByText('Description is required')).toBeVisible();
  });

  test('view idea detail page', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText('AI Fitness Coach')).toBeVisible();

    // Click the view (eye) button on first row
    const firstRow = page.locator('tbody tr').first();
    await firstRow.getByRole('button').first().click();

    await expect(page).toHaveURL(/\/app\/ideas\//);
    await expect(page.getByText('Add Your Feedback')).toBeVisible();
  });

  test('delete idea – shows confirmation and removes idea', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText('Smart Contract Auditor')).toBeVisible();

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    // Find row with Smart Contract Auditor
    let targetRow = null;
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      if (text?.includes('Smart Contract Auditor')) {
        targetRow = rows.nth(i);
        break;
      }
    }
    expect(targetRow).not.toBeNull();
    const deleteBtn = targetRow!.getByRole('button').last();
    await deleteBtn.click();

    await expect(page.getByText('Delete this idea?')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Smart Contract Auditor')).not.toBeVisible();
  });

  test('cancel delete idea keeps it in list', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText('AI Fitness Coach')).toBeVisible();

    const firstRow = page.locator('tbody tr').first();
    await firstRow.getByRole('button').last().click();

    await expect(page.getByText('Delete this idea?')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText('AI Fitness Coach')).toBeVisible();
  });
});
