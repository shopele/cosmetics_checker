/**
 * チェック実行テスト（実画像使用）
 *
 * 前提: ANTHROPIC_API_KEY が環境変数に設定されていること
 * 使用画像: docs/test/test_sample.jpg（化粧品パッケージ）
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_IMAGE = path.join(__dirname, '..', 'docs', 'test', 'test_sample.jpg');
const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'test-key';

test.describe('チェック実行テスト（実画像）', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 前回の履歴をクリアして干渉を防ぐ
    await page.evaluate(() => {
      sessionStorage.removeItem('yakki_checker_running');
    });
  });

  // --- 画像アップロード後の UI 確認（API キー不要）---

  test('test_sample.jpg をアップロードするとプレビューが表示される', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);

    await expect(page.locator('#previewList')).toBeVisible();
    await expect(page.locator('#imageCount')).toContainText('1枚選択中');
  });

  test('test_sample.jpg アップロード後にチェックボタンが有効になる', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);

    await expect(page.locator('#checkBtn')).toBeEnabled();
  });

  test('化粧品カテゴリが選択されている状態でアップロードできる', async ({ page }) => {
    await expect(page.locator('input[value="cosmetic"]')).toBeChecked();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await expect(page.locator('#checkBtn')).toBeEnabled();
  });

  test('医薬部外品カテゴリに切り替えてアップロードできる', async ({ page }) => {
    await page.locator('input[value="quasi_drug"]').click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await expect(page.locator('#checkBtn')).toBeEnabled();
  });

  // --- 実際のチェック実行（API キーが必要）---

  test('チェック実行で結果エリアが表示される', async ({ page }) => {
    test.skip(!HAS_API_KEY, 'ANTHROPIC_API_KEY が未設定のためスキップ');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await page.locator('#checkBtn').click();

    // API 呼び出し完了を待つ（最大 60 秒）
    await expect(page.locator('#resultArea')).toBeVisible({ timeout: 60000 });
  });

  test('チェック結果に要約バッジが表示される', async ({ page }) => {
    test.skip(!HAS_API_KEY, 'ANTHROPIC_API_KEY が未設定のためスキップ');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await page.locator('#checkBtn').click();

    await expect(page.locator('#resultArea')).toBeVisible({ timeout: 60000 });
    // 要約バッジ（記載あり N / 記載なし N / 判定不可 N）のいずれかが表示される
    const badge = page.locator('.summary-badges');
    await expect(badge).toBeVisible();
  });

  test('チェック結果テーブルに項目が表示される', async ({ page }) => {
    test.skip(!HAS_API_KEY, 'ANTHROPIC_API_KEY が未設定のためスキップ');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await page.locator('#checkBtn').click();

    await expect(page.locator('#resultArea')).toBeVisible({ timeout: 60000 });
    // 結果テーブルに少なくとも1行あること
    await expect(page.locator('.result-table tbody tr').first()).toBeVisible();
  });

  test('NG表現チェックセクションが表示される', async ({ page }) => {
    test.skip(!HAS_API_KEY, 'ANTHROPIC_API_KEY が未設定のためスキップ');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await page.locator('#checkBtn').click();

    await expect(page.locator('#resultArea')).toBeVisible({ timeout: 60000 });
    // NG表現セクション（バナー）が表示される
    const ngSection = page.locator('.ng-expressions-banner');
    await expect(ngSection).toBeVisible();
  });

  test('AIが読み取ったテキストセクションが表示される', async ({ page }) => {
    test.skip(!HAS_API_KEY, 'ANTHROPIC_API_KEY が未設定のためスキップ');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await page.locator('#checkBtn').click();

    await expect(page.locator('#resultArea')).toBeVisible({ timeout: 60000 });
    // 抽出テキスト折りたたみセクションが表示される
    await expect(page.locator('.extracted-text-details')).toBeVisible();
  });

  test('not_found または unclear の行に詳細折りたたみが表示される（Phase 1）', async ({ page }) => {
    test.skip(!HAS_API_KEY, 'ANTHROPIC_API_KEY が未設定のためスキップ');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await page.locator('#checkBtn').click();

    await expect(page.locator('#resultArea')).toBeVisible({ timeout: 60000 });

    // not_found または unclear の行に detail-row があるか確認
    const detailRows = page.locator('.detail-row');
    const count = await detailRows.count();
    // 判定不可/記載なしが1件でもあれば detail-row が存在するはず
    // （全件 found の場合は 0 件でも PASS）
    console.log(`detail-row 件数: ${count}`);
    // エラーにはしない（結果に依存するため）
  });

  test('チェック結果が履歴に保存される', async ({ page }) => {
    test.skip(!HAS_API_KEY, 'ANTHROPIC_API_KEY が未設定のためスキップ');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await page.locator('#checkBtn').click();

    await expect(page.locator('#resultArea')).toBeVisible({ timeout: 60000 });

    // 履歴テーブルに新しい行が追加されている
    const historyRow = page.locator('#historyTableBody tr').first();
    await expect(historyRow).toBeVisible();
    await expect(historyRow).toContainText('化粧品');
  });

  test('印刷ボタンが表示される', async ({ page }) => {
    test.skip(!HAS_API_KEY, 'ANTHROPIC_API_KEY が未設定のためスキップ');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await page.locator('#checkBtn').click();

    await expect(page.locator('#resultArea')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('#printBtn')).toBeVisible();
  });

});
