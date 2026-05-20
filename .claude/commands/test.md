test-agent として動作し、化粧品・医薬部外品 表記チェックアプリのテストを実施してください。

## 【必須ルール】

**コード変更後は以下を全て実施すること。省略禁止。**

1. Playwright ブラウザ自動テストを実行（`npm test`）
2. 過去テスト項目を全件回帰確認（デグレードチェック）
3. 新機能の静的コードレビュー
4. 画像を使ったチェック実行テストを含める（`docs/test/test_sample.jpg` 使用）
5. 全テスト PASS になるまで build-agent と連携して修正を繰り返す

## テスト対象ファイル

- `index.html`, `css/style.css`, `js/rules.js`, `js/app.js`, `api/check.js`
- `tests/` 配下の Playwright テストファイル

## テストサンプル画像

- `docs/test/test_sample.jpg`（化粧品パッケージ画像）

## 実施手順

### Step 1: Playwright ブラウザ自動テスト

```bash
cd /home/user/cosmetics_checker
npm test 2>&1
```

出力を確認し、全件 PASS であることを記録する。

### Step 2: 過去テスト項目の回帰確認

`docs/test/results.md` を読み込み、過去に記録された全テスト項目を再確認する。
以下を必ず確認すること：

| 確認項目 | 確認方法 |
|---|---|
| APIキーがコードに埋め込まれていない | `api/check.js` を確認 |
| XSS 対策（escapeHtml 適用） | `js/app.js` を確認 |
| parseResponse() フォールバック処理 | `js/app.js` を確認 |
| saveHistory() 既存フィールドが保持されている | `js/app.js` を確認 |
| CSV エクスポートの列定義が正しい | `js/app.js` を確認 |
| reCheckUnclearItems() が正常に動作する | `js/app.js` を確認 |

### Step 3: 新機能の静的コードレビュー

変更ファイルを読み込み、正常系・エッジケース・XSS 対策を確認する。

### Step 4: 結果を docs/test/results.md に追記

以下のフォーマットで末尾に追記：

```markdown
---

## [機能名] テスト（コミット [hash]）

実施日: [日付]

### Playwright ブラウザ自動テスト

| ファイル | 件数 | 結果 |
|---|---|---|
| 01-page-load.spec.js | 8 | PASS/FAIL |
| 02-category.spec.js | 2 | PASS/FAIL |
| 03-custom-items.spec.js | 7 | PASS/FAIL |
| 04-image-upload.spec.js | 3 | PASS/FAIL |
| 05-history-filter.spec.js | 5 | PASS/FAIL |
| 06-check-execution.spec.js | N | PASS/FAIL |

### 静的コードレビュー（新機能）

| # | テスト項目 | 判定 | 備考 |
|---|---|---|---|

### 回帰テスト

| # | テスト項目 | 判定 | 備考 |
|---|---|---|---|
| R-1 | APIキーのハードコードなし | PASS/FAIL | |
| R-2 | XSS対策（escapeHtml）適用 | PASS/FAIL | |
| R-3 | parseResponse() フォールバック | PASS/FAIL | |
| R-4 | saveHistory() 既存フィールド保持 | PASS/FAIL | |
| R-5 | CSV エクスポート列定義 | PASS/FAIL | |
| R-6 | reCheckUnclearItems() 動作 | PASS/FAIL | |

### 総合判定: PASS / FAIL
```

## 完了条件

- [ ] `npm test` 全件 PASS
- [ ] 回帰テスト全件確認済み
- [ ] Critical / High バグ 0 件
- [ ] `docs/test/results.md` に記録済み
- [ ] `git commit -m "test: ..."` / `git push origin develop/staging` 済み
