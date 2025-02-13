import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestUser, TEST_USER } from '@sfh/testing/auth';

test.describe('Authentication Flow', () => {
  test.beforeAll(async () => {
    await setupTestUser();
  });

  test.afterAll(async () => {
    await cleanupTestUser();
  });

  test('should redirect to login page when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should show error message with wrong credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in wrong credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Check for error message
    const errorMessage = await page.waitForSelector('.text-red-600');
    expect(await errorMessage.isVisible()).toBeTruthy();
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Fill in correct credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Should show dashboard content
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Then logout
    await page.click('button:has-text("Sign out")');

    // Should redirect to login page
    await expect(page).toHaveURL('/login');

    // Should not be able to access dashboard anymore
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});
