import { test, expect } from '@playwright/test';

test.describe('ページ読み込み・基本 UI', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('タイトルが正しい', async ({ page }) => {
    await expect(page).toHaveTitle('化粧品・医薬部外品 表記チェッカー');
  });

  test('ヘッダーが表示される', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('化粧品・医薬部外品 表記チェッカー');
  });

  test('カテゴリ選択（化粧品・医薬部外品）が表示される', async ({ page }) => {
    await expect(page.locator('input[value="cosmetic"]')).toBeVisible();
    await expect(page.locator('input[value="quasi_drug"]')).toBeVisible();
  });

  test('デフォルトで化粧品が選択されている', async ({ page }) => {
    await expect(page.locator('input[value="cosmetic"]')).toBeChecked();
  });

  test('画像アップロードエリアが表示される', async ({ page }) => {
    await expect(page.locator('#dropZone')).toBeVisible();
  });

  test('チェック実行ボタンが表示される（初期は無効）', async ({ page }) => {
    const btn = page.locator('#checkBtn');
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });

  test('チェック履歴セクションが表示される', async ({ page }) => {
    await expect(page.locator('text=チェック履歴')).toBeVisible();
  });

  test('免責事項が表示される', async ({ page }) => {
    await expect(page.locator('text=免責事項')).toBeVisible();
  });

});
