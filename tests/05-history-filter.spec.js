import { test, expect } from '@playwright/test';

test.describe('履歴フィルター', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('カテゴリフィルターが表示される', async ({ page }) => {
    await expect(page.locator('#filterCategory')).toBeVisible();
  });

  test('判定フィルターが表示される', async ({ page }) => {
    await expect(page.locator('#filterStatus')).toBeVisible();
  });

  test('日付フィルターが表示される', async ({ page }) => {
    await expect(page.locator('#filterDateFrom')).toBeVisible();
    await expect(page.locator('#filterDateTo')).toBeVisible();
  });

  test('キーワード検索欄が表示される', async ({ page }) => {
    await expect(page.locator('#filterKeyword')).toBeVisible();
  });

  test('クリアボタンが表示される', async ({ page }) => {
    await expect(page.locator('#clearFiltersBtn')).toBeVisible();
  });

});
