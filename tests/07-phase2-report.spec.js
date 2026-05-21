/**
 * Phase 2 機能テスト（担当者名・HTMLレポート）
 *
 * APIキー不要なテスト: 担当者名入力欄の表示・localStorage 保存・チェックボタン有効化
 * APIキーありの場合のみ: HTMLレポートボタンの表示・ダウンロード
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_IMAGE = path.join(__dirname, '..', 'docs', 'test', 'test_sample.jpg');
const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'test-key';

test.describe('Phase 2: 担当者名・HTMLレポート', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.removeItem('yakki_checker_running');
    });
  });

  // --- APIキー不要テスト ---

  test('担当者名入力欄が表示される', async ({ page }) => {
    const input = page.locator('#checkerNameInput');
    await expect(input).toBeVisible();
  });

  test('担当者名を入力するとlocalStorageに保存される', async ({ page }) => {
    const input = page.locator('#checkerNameInput');
    await input.fill('テスト担当者');

    // localStorage に保存されているか確認
    const saved = await page.evaluate(() => localStorage.getItem('yakki_checker_name'));
    expect(saved).toBe('テスト担当者');

    // リロード後も値が保持される
    await page.reload();
    const inputAfterReload = page.locator('#checkerNameInput');
    await expect(inputAfterReload).toHaveValue('テスト担当者');

    // クリーンアップ
    await page.evaluate(() => localStorage.removeItem('yakki_checker_name'));
  });

  test('担当者名が空でもチェックボタンは有効（画像アップロード後）', async ({ page }) => {
    // 担当者名を空にする
    const nameInput = page.locator('#checkerNameInput');
    await nameInput.fill('');

    // 画像をアップロード
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);

    // チェックボタンが有効になること（担当者名は任意項目）
    await expect(page.locator('#checkBtn')).toBeEnabled();
  });

  // --- APIキーありの場合のみ ---

  test('チェック後にHTMLレポートボタンが表示される', async ({ page }) => {
    test.skip(!HAS_API_KEY, 'ANTHROPIC_API_KEY が未設定のためスキップ');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await page.locator('#checkBtn').click();

    await expect(page.locator('#resultArea')).toBeVisible({ timeout: 60000 });

    // #reportBtn が結果エリア内に表示される
    await expect(page.locator('#reportBtn')).toBeVisible();
  });

  test('HTMLレポートボタン押下でダウンロードが始まる', async ({ page }) => {
    test.skip(!HAS_API_KEY, 'ANTHROPIC_API_KEY が未設定のためスキップ');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await page.locator('#checkBtn').click();

    await expect(page.locator('#resultArea')).toBeVisible({ timeout: 60000 });

    // ダウンロードイベントを監視
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.locator('#reportBtn').click();
    const download = await downloadPromise;

    // ダウンロードが開始されたこと（ファイル名に .html が含まれる）
    expect(download.suggestedFilename()).toContain('.html');
  });

});
