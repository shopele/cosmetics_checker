import { test, expect } from '@playwright/test';

test.describe('カテゴリ選択', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('医薬部外品に切り替えられる', async ({ page }) => {
    await page.locator('input[value="quasi_drug"]').click();
    await expect(page.locator('input[value="quasi_drug"]')).toBeChecked();
    await expect(page.locator('input[value="cosmetic"]')).not.toBeChecked();
  });

  test('化粧品に戻せる', async ({ page }) => {
    await page.locator('input[value="quasi_drug"]').click();
    await page.locator('input[value="cosmetic"]').click();
    await expect(page.locator('input[value="cosmetic"]')).toBeChecked();
  });

});
