# Playwright テスト実行ガイド

## 前提条件（初回のみ）

```bash
npm install
npx playwright install chromium
```

---

## 実行方法

### 1. ローカル実行（APIキーなし）

```bash
npm test
```

- APIキー不要のテスト 29件が PASS
- APIキー必要のテスト 8件は自動スキップ

---

### 2. ローカル実行（APIキーあり・全37件）

```bash
ANTHROPIC_API_KEY=sk-ant-xxxx npm test
```

- 全37件が実行される
- `sk-ant-xxxx` は実際の Anthropic API キーに置き換えること

---

### 3. 特定ファイルだけ実行

```bash
npx playwright test tests/06-check-execution.spec.js
```

---

### 4. UIモードで実行（ブラウザで結果確認）

```bash
npx playwright test --ui
```

---

### 5. ヘッドありモード（ブラウザを目視確認しながら実行）

```bash
npx playwright test --headed
```

---

### 6. GitHub Actions（自動実行）

`develop/staging` または `main` ブランチに push するたびに自動実行される。

**設定ファイル**: `.github/workflows/playwright.yml`

**必要なシークレット設定**:  
GitHub リポジトリ → Settings → Secrets and variables → Actions → New repository secret

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | 実際の Anthropic API キー |

結果は GitHub の **Actions タブ**で確認できる。失敗時はアーティファクトとして Playwright レポートがダウンロード可能。

---

## テストファイル一覧

| ファイル | 内容 | 件数 | APIキー |
|---|---|---|---|
| `tests/01-page-load.spec.js` | ページ読み込み・基本 UI | 8 | 不要 |
| `tests/02-category.spec.js` | カテゴリ選択 | 2 | 不要 |
| `tests/03-custom-items.spec.js` | カスタムチェック項目 | 7 | 不要 |
| `tests/04-image-upload.spec.js` | 画像アップロード | 3 | 不要 |
| `tests/05-history-filter.spec.js` | 履歴フィルター | 5 | 不要 |
| `tests/06-check-execution.spec.js` | チェック実行（実画像） | 12（4+8） | 8件のみ必要 |

### `06-check-execution.spec.js` の内訳

| テスト項目 | APIキー |
|---|---|
| test_sample.jpg をアップロードするとプレビューが表示される | 不要 |
| アップロード後にチェックボタンが有効になる | 不要 |
| 化粧品カテゴリが選択されている状態でアップロードできる | 不要 |
| 医薬部外品カテゴリに切り替えてアップロードできる | 不要 |
| チェック実行で結果エリアが表示される | **必要** |
| チェック結果に要約バッジが表示される | **必要** |
| チェック結果テーブルに項目が表示される | **必要** |
| NG表現チェックセクションが表示される | **必要** |
| AIが読み取ったテキストセクションが表示される | **必要** |
| not_found または unclear の行に詳細折りたたみが表示される | **必要** |
| チェック結果が履歴に保存される | **必要** |
| 印刷ボタンが表示される | **必要** |

---

## テスト用サンプル画像

`docs/test/test_sample.jpg`（化粧品パッケージ画像）

`06-check-execution.spec.js` で自動的に参照される。差し替える場合は同じパスに上書きすること。

---

## タイムアウト設定

`playwright.config.js` で以下を設定している。

| 設定 | 値 | 備考 |
|---|---|---|
| `timeout` | 90秒 | テスト1件あたりの上限（API呼び出し含む） |
| `retries` | 1 | 失敗時に1回リトライ |
