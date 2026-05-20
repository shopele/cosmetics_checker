import { test, expect } from '@playwright/test';

test.describe('カスタムチェック項目', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // localStorage をクリアして初期状態にする
    await page.evaluate(() => localStorage.removeItem('yakki_checker_custom_items'));
    await page.reload();
  });

  test('カスタム項目パネルが折りたたまれている', async ({ page }) => {
    await expect(page.locator('#customItemsPanel')).toBeHidden();
  });

  test('トグルボタンでパネルが開く', async ({ page }) => {
    await page.locator('#customItemsToggle').click();
    await expect(page.locator('#customItemsPanel')).toBeVisible();
  });

  test('追加ボタンが初期状態で無効', async ({ page }) => {
    await page.locator('#customItemsToggle').click();
    await expect(page.locator('#addCustomItemBtn')).toBeDisabled();
  });

  test('テキスト入力で追加ボタンが有効になる', async ({ page }) => {
    await page.locator('#customItemsToggle').click();
    await page.locator('#customItemInput').fill('テスト項目');
    await expect(page.locator('#addCustomItemBtn')).toBeEnabled();
  });

  test('テキストをクリアすると追加ボタンが無効に戻る', async ({ page }) => {
    await page.locator('#customItemsToggle').click();
    await page.locator('#customItemInput').fill('テスト項目');
    await page.locator('#customItemInput').fill('');
    await expect(page.locator('#addCustomItemBtn')).toBeDisabled();
  });

  test('項目を追加できる', async ({ page }) => {
    await page.locator('#customItemsToggle').click();
    await page.locator('#customItemInput').fill('自社ロゴの記載');
    await page.locator('#addCustomItemBtn').click();
    await expect(page.locator('#customItemsList')).toContainText('自社ロゴの記載');
  });

  test('追加した項目を削除できる', async ({ page }) => {
    await page.locator('#customItemsToggle').click();
    await page.locator('#customItemInput').fill('削除テスト項目');
    await page.locator('#addCustomItemBtn').click();
    await page.locator('#customItemsList button[data-idx]').first().click();
    await expect(page.locator('#customItemsList')).not.toContainText('削除テスト項目');
  });

});
