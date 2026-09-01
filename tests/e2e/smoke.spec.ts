import { expect, test } from '@playwright/test';

test('launcher lists all six surfaces', async ({ page }) => {
  await page.goto('/');
  for (const route of ['/booth/message/', '/wall/', '/timeline/', '/participation/', '/console/', '/highlights/']) {
    await expect(page.locator(`a[href="${route}"]`)).toBeVisible();
  }
});

test('booth renders the three steps on one screen', async ({ page }) => {
  await page.goto('/booth/message/');
  await expect(page.locator('textarea')).toBeVisible();
  await expect(page.locator('input')).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
});

test('wall cold-starts from GET /api/messages', async ({ page }) => {
  await page.goto('/wall/');
  // seed data has 200 published messages; the slot pool must fill
  await expect(page.locator('.user-text').first()).not.toBeEmpty({ timeout: 15_000 });
});
