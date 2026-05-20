import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('画像アップロード', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('画像をアップロードするとプレビューが表示される', async ({ page }) => {
    // テスト用画像を用意（1x1 pixel の PNG を base64 で生成）
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const testImagePath = path.join(__dirname, 'fixtures', 'test.png');

    // fixtures ディレクトリがなければ作成
    const fs = await import('fs');
    if (!fs.existsSync(path.join(__dirname, 'fixtures'))) {
      fs.mkdirSync(path.join(__dirname, 'fixtures'), { recursive: true });
    }
    fs.writeFileSync(testImagePath, buffer);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    await expect(page.locator('#previewList')).toBeVisible();
    await expect(page.locator('#imageCount')).toContainText('1枚選択中');
  });

  test('画像アップロード後にチェックボタンが有効になる', async ({ page }) => {
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const testImagePath = path.join(__dirname, 'fixtures', 'test.png');
    const fs = await import('fs');
    if (!fs.existsSync(path.join(__dirname, 'fixtures'))) {
      fs.mkdirSync(path.join(__dirname, 'fixtures'), { recursive: true });
    }
    fs.writeFileSync(testImagePath, buffer);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    await expect(page.locator('#checkBtn')).toBeEnabled();
  });

  test('画像クリアボタンでプレビューが消える', async ({ page }) => {
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const testImagePath = path.join(__dirname, 'fixtures', 'test.png');
    const fs = await import('fs');
    if (!fs.existsSync(path.join(__dirname, 'fixtures'))) {
      fs.mkdirSync(path.join(__dirname, 'fixtures'), { recursive: true });
    }
    fs.writeFileSync(testImagePath, buffer);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    await page.locator('#clearImagesBtn').click();

    await expect(page.locator('#previewList')).toBeEmpty();
    await expect(page.locator('#checkBtn')).toBeDisabled();
  });

});
