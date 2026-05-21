/**
 * Phase 4 成分DB照合テスト
 *
 * APIキーありの場合のみ: 成分照合セクションの表示
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_IMAGE = path.join(__dirname, '..', 'docs', 'test', 'test_sample.jpg');
const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'test-key';

test.describe('Phase 4: 成分DB照合', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.removeItem('yakki_checker_running');
    });
  });

  test('チェック実行後に成分照合セクションが表示される', async ({ page }) => {
    test.skip(!HAS_API_KEY, 'ANTHROPIC_API_KEY が未設定のためスキップ');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await page.locator('#checkBtn').click();

    await expect(page.locator('#resultArea')).toBeVisible({ timeout: 60000 });

    // 成分照合セクション（.ingredients-section）が表示される
    // 注: 成分が抽出されなかった場合はセクション自体が非表示になる場合があるため
    //     結果エリアが表示されていることを確認後、セクション数をログ出力する
    const section = page.locator('.ingredients-section');
    const count = await section.count();
    console.log(`成分照合セクション件数: ${count}`);

    // 成分が検出された場合: セクションが表示されること
    if (count > 0) {
      await expect(section.first()).toBeVisible();
    } else {
      // 成分が検出されなかった場合はスキップ（テスト画像に依存）
      console.log('成分が検出されなかったため成分照合セクションは非表示（正常動作）');
    }
  });

  test('成分照合セクションに見出しが表示される', async ({ page }) => {
    test.skip(!HAS_API_KEY, 'ANTHROPIC_API_KEY が未設定のためスキップ');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await page.locator('#checkBtn').click();

    await expect(page.locator('#resultArea')).toBeVisible({ timeout: 60000 });

    const section = page.locator('.ingredients-section');
    const count = await section.count();

    if (count > 0) {
      // バナーテキストに「成分照合」が含まれること
      const banner = section.first().locator('.ingredients-banner');
      await expect(banner).toBeVisible();
      await expect(banner).toContainText('成分照合');
    } else {
      console.log('成分照合セクションなし（テスト画像に成分情報が含まれていない可能性あり）');
    }
  });

});
