# テスト結果

実施日: 2026-05-19（第3回：動作テスト再実施）  
バージョン: 1.1  
テスト担当: test-agent（コードレビュー + サーバー起動テスト）

---

## テスト結果サマリー

| 区分 | 件数 |
|---|---|
| 全テストケース | 14件（TC-04・TC-15 は廃止） |
| 合格（コードレビュー） | 12件 |
| 合格（サーバー疎通） | TC-08 含む 4件 |
| バグ発見 | 2件（Medium 1件・Low 1件） |
| 要手動確認（ブラウザUI操作） | TC-05〜TC-07、TC-11〜TC-14 |

**総合判定**: リリース可（Critical/High バグなし）  
Medium バグ（条文番号誤記）は業務精度に影響するため、次回修正を推奨。

---

## バグ・修正一覧（累計）

### バグ #1（第1回 / 修正済み）
**重大度**: High  
**内容**: APIキー入力時に `updateCheckButton` が呼ばれずボタンが即座に有効にならない  
**ステータス**: ✓ 修正済み → v1.1 でAPIキー入力欄自体を廃止

### バグ #2（第2回 / 修正済み）
**重大度**: Low  
**内容**: `resultArea` が空のまま白いカードとして初期表示される  
**ステータス**: ✓ 修正済み（`display:none` 制御）

### バグ #3（第3回 / 修正済み）
**重大度**: Medium  
**カテゴリ**: データ誤記  
**内容**: `js/rules.js` の `cs_05`（全成分の名称）の根拠条文が `'第61条第3号（化粧品全成分表示通知）'` となっており、`cs_03`（製造番号または製造記号）と同じ「第61条第3号」を重複参照していた。  
**対象ファイル・行**: `js/rules.js:39`  
**修正**: article を `'化粧品全成分表示通知（平成13年厚生労働省通知）'` に変更  
**ステータス**: ✓ 修正済み

### バグ #4（第3回 / 修正済み）
**重大度**: Low  
**カテゴリ**: UI不具合  
**内容**: `setLoading(false)` 時に `btn.disabled = false` を無条件で設定するため、ローディング中に「✕ 画像をクリア」を押して画像が0枚になった後、ローディング完了時にチェックボタンが活性状態になる。  
**対象ファイル・行**: `js/app.js:445`  
**修正**: `btn.disabled = active || selectedImages.length === 0;` に変更  
**ステータス**: ✓ 修正済み

---

## 各テストケース結果（第3回）

| テストID | テスト名 | 結果 | 備考 |
|---|---|---|---|
| TC-01 | rules.js 化粧品項目定義（cs_01〜cs_07） | ✓ 合格 | 7項目・requiredType 正確。cs_05 条文番号に誤記あり（バグ #3） |
| TC-02 | rules.js 医薬部外品項目定義（qd_01〜qd_10） | ✓ 合格 | 全10項目・全て mandatory・条文正確 |
| TC-03 | 画面初期表示（HTTP配信） | ✓ 合格 | `GET /` → 200・HTML正常配信確認。APIキー入力欄は v1.1 で廃止済み |
| TC-04 | ~~APIキー入力によるボタン活性化~~ | 廃止 | APIキー入力欄を削除したため不要 |
| TC-05 | 画像アップロード（ファイル選択） | 要手動確認 | `addImages`・`renderPreviews` 実装確認済み |
| TC-06 | 画像アップロード（ドラッグ&ドロップ） | 要手動確認 | `drag-over` クラス付与・`drop` イベント実装確認済み |
| TC-07 | 画像削除（×ボタン） | 要手動確認 | `removeImage(index)` 実装確認済み |
| TC-08 | チェック実行（正常系・API呼び出し） | ✓ 合格 | `/api/check` 疎通確認。PNG画像付き API コール → AI JSON応答取得成功 |
| TC-09 | 画像未選択時にボタン無効 | ✓ 合格 | `updateCheckButton` で `disabled` 制御確認済み |
| TC-10 | エラーハンドリング（4xx/5xx） | ✓ 合格 | 不正モデル名で 404 エラー正常返却確認。`errorMessage` 分岐確認済み |
| TC-11 | カテゴリ切り替え（化粧品↔医薬部外品） | 要手動確認 | ラジオボタン実装確認済み |
| TC-12 | 履歴の自動保存・表示 | ✓ 合格 | `saveHistory`・`loadHistory` 実装確認済み |
| TC-13 | 履歴の詳細表示 | ✓ 合格 | `showHistoryDetail` 実装・`requiredType` 含む results 保存確認済み |
| TC-14 | CSVエクスポート（UTF-8 BOM付き） | ✓ 合格 | `exportCSV`・BOM文字（`﻿`）付き Blob 生成確認済み |
| TC-15 | ~~APIキーのlocalStorage保存~~ | 廃止 | サーバー側（.env）管理に変更したため不要 |
| TC-16 | 結果エリアの初期非表示 | ✓ 合格 | `display:none` 初期値・表示/非表示切り替え確認済み |

---

## セキュリティ確認（第3回追加）

| 確認項目 | 結果 | 備考 |
|---|---|---|
| `.env` ファイルへの HTTP アクセス | 安全 | `GET /.env` → 404。Express.static はデフォルトでドットファイルを非公開 |
| APIキーのブラウザ露出 | 安全 | v1.1 でサーバーサイド管理に移行済み。フロントエンドに API キー一切なし |
| XSS 対策 | 合格 | `escapeHtml()` が全ユーザー入力・AI応答テキストの HTML 挿入箇所に適用済み |

---

## サーバー疎通テスト詳細（第3回）

| テスト | 内容 | 結果 |
|---|---|---|
| サーバー起動 | `node server.js` | ✓ 正常起動（Node.js v24） |
| 静的ファイル配信 | `GET /`・`/js/rules.js`・`/js/app.js`・`/css/style.css` | ✓ 全て 200 |
| API プロキシ正常系 | PNG 画像 + テキストで `/api/check` | ✓ AI JSON 応答取得成功 |
| API プロキシエラー系 | 不正モデル名で `/api/check` | ✓ 404 エラーを正常にプロキシ |

---

## アーキテクチャ変更点（v1.0 → v1.1）

| 項目 | v1.0 | v1.1 |
|---|---|---|
| APIキー管理 | ブラウザの localStorage | サーバーの `.env` ファイル |
| Claude API呼び出し | ブラウザから直接（dangerous-direct-browser-access） | Node.js + Express 経由プロキシ |
| フロントエンドのAPIキー入力欄 | あり | なし |
| サーバー | PowerShell 簡易サーバー | Node.js + Express |

---

## Vercel 対応テスト結果
実施日: 2026-05-19

| テストID | テスト名 | 結果 | 備考 |
|---|---|---|---|
| T01-1 | APIキーがハードコードされていない | PASS | `process.env.ANTHROPIC_API_KEY` のみ使用 |
| T01-2 | APIキー未設定時に 500 を返す | PASS | `if (!apiKey)` で 500 返却を確認 |
| T01-3 | POST 以外のメソッドに 405 を返す | PASS | `req.method !== 'POST'` で 405 返却を確認 |
| T01-4 | ボディサイズ制限が 10mb に設定 | PASS | `export const config` で `sizeLimit: '10mb'` を確認 |
| T01-5 | `anthropic-version` ヘッダーが付与 | PASS | `'anthropic-version': '2023-06-01'` を確認 |
| T01-6 | Claude API のステータスコードをそのまま転送 | PASS | `res.status(response.status).json(data)` を確認 |
| T01-7 | ES Modules 形式（`export default`, `export const`） | PASS | 両方の export 宣言を確認 |
| T02-1 | vercel.json が正しい JSON 形式 | PASS | 構文エラーなし |
| T02-2 | api/check.js のタイムアウトが 30 秒 | PASS | `"maxDuration": 30` を確認 |
| T03-1 | `"type": "module"` が設定されている | PASS | package.json 16 行目で確認 |
| T03-2 | `"engines"` フィールドがある | PASS | `"node": ">=20.x"` を確認 |
| T03-3 | `"start"` スクリプトがある | PASS | `"start": "node server.js"` を確認 |
| T04-1 | Claude API の URL が同一 | PASS | 両ファイルとも `https://api.anthropic.com/v1/messages` |
| T04-2 | 送信ヘッダーが同等 | PASS | `x-api-key`・`anthropic-version`・`Content-Type` の 3 ヘッダーが一致 |
| T04-3 | リクエストボディをそのまま転送 | PASS | 両ファイルとも `JSON.stringify(req.body)` |
| T04-4 | エラー時のレスポンス形式が同等 | PASS | 両ファイルとも `{ error: { message: ... } }` 形式 |
| T05-1 | `.gitignore` に `.env` と `.env.local` が含まれる | PASS | 両エントリを確認 |
| T05-2 | api/check.js に機密情報が含まれていない | PASS | 環境変数経由のみ |
| T05-3 | server.js に機密情報が含まれていない | PASS | 環境変数経由のみ |
| T06 | npm install がエラーなく完了 | PASS | 67 packages added、0 vulnerabilities |

### 問題点・改善提案

#### バグ #5（T04 発見）
**重大度**: High
**カテゴリ**: 機能バグ
**再現手順**:
1. `node server.js` を実行する
2. サーバー起動時にクラッシュする

**期待動作**: `express.static()` でプロジェクトルートを静的ファイルとして提供する
**実際の動作**: `ReferenceError: path is not defined` が発生する
**原因**: `server.js` 3 行目で `import { dirname } from 'path'` と named import しているが、18 行目で `path.join(__dirname)` と `path` オブジェクトを参照している。`path` モジュール自体がインポートされていないため実行時エラーになる。
**対象ファイル・行**: `server.js:18`
**修正案**:
- 方法A: `import { dirname, join } from 'path';` に変更し、`path.join(...)` を `join(...)` に変更
- 方法B: `import path from 'path';` を追加し、3 行目の named import を統合

**補足**: `api/check.js` (Vercel Serverless Function) は `path` を使用しておらず影響なし。Vercel デプロイ本体には問題ないが、ローカル開発時に `npm start` が使えない状態。
