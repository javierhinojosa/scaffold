import { test, expect } from '@playwright/test';

test('welcome page has expected content', async ({ page }) => {
  await page.goto('/');
  
  // Check for main heading
  await expect(page.getByText(/To get started/)).toBeVisible();
  
  // Check for documentation link
  const docsLink = page.getByRole('link', { name: 'Read our docs' });
  await expect(docsLink).toBeVisible();
  await expect(docsLink).toHaveAttribute('href', 'https://docs.astro.build');
  
  // Check for Discord link
  const discordLink = page.getByRole('link', { name: /Join our Discord/ });
  await expect(discordLink).toBeVisible();
  await expect(discordLink).toHaveAttribute('href', 'https://astro.build/chat');
  
  // Check for theme toggle
  const themeToggle = page.getByRole('checkbox', { name: /theme/i });
  await expect(themeToggle).toBeVisible();
  
  // Check for dropdown menu
  const dropdown = page.getByRole('button', { name: /open or close/i });
  await expect(dropdown).toBeVisible();
  
  // Test dropdown interaction
  await dropdown.click();
  await expect(page.getByText('Item 1')).toBeVisible();
  await expect(page.getByText('Item 2')).toBeVisible();
}); 