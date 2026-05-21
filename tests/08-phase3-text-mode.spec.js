/**
 * Phase 3 テキスト入力モードテスト
 *
 * APIキー不要: タブ切り替え・テキスト入力・画像アップロードエリアの表示
 */
import { test, expect } from '@playwright/test';

test.describe('Phase 3: テキスト入力モード', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('「画像モード」「テキスト入力モード」タブが表示される', async ({ page }) => {
    await expect(page.locator('#tabImage')).toBeVisible();
    await expect(page.locator('#tabText')).toBeVisible();
    await expect(page.locator('#tabImage')).toContainText('画像');
    await expect(page.locator('#tabText')).toContainText('テキスト');
  });

  test('テキストタブをクリックするとテキスト入力エリアが表示される', async ({ page }) => {
    // 初期状態: テキストパネルは非表示
    await expect(page.locator('#panelText')).toBeHidden();

    // テキストタブをクリック
    await page.locator('#tabText').click();

    // テキストパネルが表示される
    await expect(page.locator('#panelText')).toBeVisible();
    await expect(page.locator('#textInputArea')).toBeVisible();
  });

  test('テキスト入力エリアに文字を入力するとチェックボタンが有効になる', async ({ page }) => {
    // テキストモードに切り替え
    await page.locator('#tabText').click();
    await expect(page.locator('#textInputArea')).toBeVisible();

    // チェックボタンは初期状態で無効
    await expect(page.locator('#checkBtn')).toBeDisabled();

    // テキストを入力
    await page.locator('#textInputArea').fill('製品名: テスト化粧品\n製造販売元: テスト株式会社\n内容量: 50g\n成分: 水、グリセリン');

    // チェックボタンが有効になる
    await expect(page.locator('#checkBtn')).toBeEnabled();
  });

  test('画像タブに戻すと画像アップロードエリアが表示される', async ({ page }) => {
    // テキストモードに切り替え
    await page.locator('#tabText').click();
    await expect(page.locator('#panelImage')).toBeHidden();
    await expect(page.locator('#panelText')).toBeVisible();

    // 画像タブに戻す
    await page.locator('#tabImage').click();

    // 画像パネルが表示され、テキストパネルは非表示
    await expect(page.locator('#panelImage')).toBeVisible();
    await expect(page.locator('#panelText')).toBeHidden();
  });

  test('PDFファイルが accept 属性に含まれている', async ({ page }) => {
    // input[type="file"] の accept 属性に .pdf が含まれる
    const accept = await page.locator('input[type="file"]').getAttribute('accept');
    expect(accept).toContain('.pdf');
  });

});
