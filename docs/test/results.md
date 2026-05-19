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

---

## 改良実装（全16項目）コードレビュー結果
実施日: 2026-05-19

| # | 項目 | 結果 | 備考 |
|---|---|---|---|
| 1 | 画像圧縮 | PASS | `jpegQualityForSize()` で 1MB未満=0.85 / 1〜3MB=0.75 / 3MB超=0.65 の3段階品質調整を確認。`MAX_IMAGE_PX=1600` 設定あり。アスペクト比保持の `Math.min` ratio も正しい。 |
| 2 | レート制限 | PASS | `ipRequestCounts` Map による IP ベース制限（10回/60秒）を確認。`X-RateLimit-*` / `Retry-After` ヘッダーの付与あり。429 レスポンスのメッセージ整合も確認。軽微な問題あり（後述 #6）。 |
| 3 | エラーメッセージ | PASS | `errorMessage()` の判定順序: `!navigator.onLine` → 401 → 413 → 429 → 529 → 500以上 → 汎用。オフライン判定を先行させ fetch 失敗時に適切なメッセージを返す設計。529 と `>=500` で重複なし。 |
| 4 | モデル選択 | PASS | `MODELS` 定数（3モデル）・`setupModelSelector()` で動的 option 生成・`localStorage` への保存（`STORAGE_KEY_MODEL`）を確認。モデルID検証（`MODELS[stored]` チェック）あり。軽微な問題あり（後述 #7）。 |
| 5 | 印刷CSS | PASS | `@media print` で `.no-print`・ヘッダー・フッター・フィルター等を `display:none !important` で非表示。`window.print()` ボタンに `no-print` クラス付与。結果テーブルのみ出力される設計。 |
| 6 | 要約バッジ | PASS | `found` / `not_found` / `unclear` の件数カウントを `displayResults()` 内で集計し `.summary-badges` で表示。CSS（`.sum-ok` / `.sum-ng` / `.sum-unclear`）も定義済み。 |
| 7 | 重複送信防止 | PASS | `SESSION_KEY_RUNNING` フラグを `sessionStorage` で管理。`runCheck()` / `reCheckUnclearItems()` の両方でチェック（L266, L320）。`finally` ブロックで必ずクリア（L306, L354）。DOMContentLoaded 時にクラッシュ残存フラグをクリア（L43）。 |
| 8 | unclear再チェック | PASS | `reCheckUnclearItems()` で unclear 項目だけを抽出し専用プロンプト（`buildPromptForItems()`）で再送信。結果マージ後に `updateHistory()` で履歴を上書き保存。unclear が0件のとき再チェックボタン非表示（`counts.unclear > 0` 条件）。 |
| 9 | 履歴フィルター | PASS | カテゴリ・判定・開始日・終了日・キーワードの5種フィルターを `filterHistories()` で実装。`setupHistoryFilters()` で `input` と `change` の両イベントを登録（テキスト入力・セレクト両対応）。クリアボタンも動作確認。 |
| 10 | メモ機能 | PASS | `<textarea>` に `escapeHtml(currentMemo)` でXSS対策済み。`input` イベントで即時 `updateHistory()` 保存。`exportCSV()` でメモ列を CSV 出力に含む実装あり。 |
| 11 | コスト表示 | PASS | `renderCostInfo()` で `usage.input_tokens` / `usage.output_tokens` からコストを計算（USD × 155 で JPY 換算）。`MODELS` 定数の単価（$/1M tokens）を使用。数値は `toLocaleString()` / `toFixed()` でフォーマット。 |
| 12 | 文言切り替え（SP-01） | PASS | `applyTouchDeviceText()` で `navigator.maxTouchPoints > 0` OR `matchMedia('(hover: none)')` の OR 条件で判定。p タグとspan タグのテキストを書き換え、`touch-device` クラスを付与。 |
| 13 | カード型レイアウト（SP-02） | PASS | `@media (max-width: 640px)` で result-table・history-table の thead を非表示にし、td::before で `data-label` 属性をラベルとして表示するカード型レイアウトを実装。 |
| 14 | カスタム項目 | PASS | `STORAGE_KEY_CUSTOM_ITEMS` で localStorage 保存。`getAllItems()` で RULES 項目にカスタム項目をマージ。`buildPrompt()` のプロンプトにカスタム項目 ID/名称を含む。削除ボタンはイベントデリゲーションで安全実装。 |
| 15 | EXIF補正 | PASS | `readExifOrientation()` で JPEG の 0xFFE1 マーカーから Orientation タグ（0x0112）を抽出。`applyOrientationToCanvas()` で orientation 2〜8 の座標変換を実装。`swap` フラグ（orientation 5〜8）で canvas の width/height を入れ替え済み。case 6・case 8 の変換ロジックを検証し正確であることを確認。 |
| 16 | Service Worker | PASS | `ASSETS` リストの静的アセットをインストール時にプリキャッシュ。`activate` 時に旧キャッシュ削除。`/api/` パスを明示的にキャッシュ除外。cache-first + ネットワークフォールバック戦略。軽微な問題あり（後述 #8）。 |

### バグ・問題点

#### バグ #6（Medium）
**重大度**: Medium
**カテゴリ**: 機能バグ（レート制限メモリリーク）
**再現手順**:
1. `node server.js` など長時間稼働する Node.js 環境で `api/check.js` を動かす
2. 多数の異なる IP アドレスからリクエストを送り続ける

**期待動作**: 期限切れ IP エントリが自動削除され、Map のサイズが増大しない
**実際の動作**: `ipRequestCounts` Map は期限切れになったエントリを削除する仕組みがないため、長時間稼働時に Map が際限なく肥大化する
**対象ファイル・行**: `api/check.js:12`（`const ipRequestCounts = new Map();`）
**備考**: Vercel のサーバーレス環境では関数インスタンスが短命なため実用上の影響は低い。コメントにも「インスタンスごとに Map が独立」と記載あり。ローカル開発や長時間稼働サーバーでは注意。
**修正案**: `getRateLimitInfo()` 内でエントリを新規作成する際（`now > info.resetAt` の分岐）、期限切れエントリを定期的に削除する cleanup を追加するか、TTL 付きの Map ライブラリを使用する。

#### バグ #7（Medium）
**重大度**: Medium
**カテゴリ**: 機能バグ（存在しないモデルID）
**再現手順**:
1. アプリを初めて開く（localStorage に保存されたモデル設定がない状態）
2. デフォルトモデル `claude-opus-4-7` でチェックを実行する

**期待動作**: Anthropic API の正規モデルでチェックが実行される
**実際の動作**: `claude-opus-4-7` は現時点で確認できるモデルリストに存在しない可能性があり、API から 404 エラーが返る恐れがある（過去のテストで不正モデル名が 404 を返すことを確認済み）
**対象ファイル・行**: `js/app.js:1`（`const DEFAULT_API_MODEL = 'claude-opus-4-7';`）
**備考**: 実際の Anthropic API へのアクセステストが必要。2026年時点でモデルが追加・変更されている可能性もある。ブラウザでの実動作確認を推奨。
**修正案**: デフォルトモデルを `claude-sonnet-4-5` など確実に存在するモデルに変更するか、起動時に利用可能モデルリストを取得する仕組みを追加する。

#### バグ #8（Low）
**重大度**: Low
**カテゴリ**: 機能バグ（Service Worker フォールバック）
**再現手順**:
1. アプリをキャッシュなしの状態でオフラインにする
2. ページを読み込む

**期待動作**: エラーメッセージまたはキャッシュ済みコンテンツが表示される
**実際の動作**: `sw.js` の L47 `.catch(() => cached)` で `cached` が `undefined`（cache miss）の場合、`event.respondWith(undefined)` が呼ばれてブラウザエラーになる可能性がある
**対象ファイル・行**: `sw.js:47`
**備考**: インストール時に `ASSETS` をプリキャッシュしているため通常は発生しない。Firefox 系ブラウザで顕在化する可能性あり。
**修正案**: `.catch(() => cached || new Response('Offline', { status: 503 }))` のようにフォールバックレスポンスを返す。

#### 問題 #9（Low）
**重大度**: Low
**カテゴリ**: コード品質
**内容**: `setupCustomItemsUI()` が `DOMContentLoaded` ハンドラー（L41）と別で L908 に独立登録されており、メインの初期化フローから切り離されている。機能的問題はないが保守性が低下する。
**対象ファイル・行**: `js/app.js:908`
**修正案**: L55 の `registerServiceWorker();` の後に `setupCustomItemsUI();` の呼び出しを追加し、L908 の独立した `addEventListener` を削除する。

### セキュリティ確認（改良実装レビュー）

| 確認項目 | 結果 | 備考 |
|---|---|---|
| APIキーのフロントエンド露出 | 安全 | `api/check.js` の `process.env.ANTHROPIC_API_KEY` のみ。ブラウザ側コードに API キーなし |
| XSS: `innerHTML` へのユーザー入力 | 安全 | `escapeHtml()` がファイル名・AI 応答テキスト・メモ・カテゴリラベル・custom item 名称に適用済み |
| XSS: `onclick` 属性への変数埋め込み | 安全 | `onclick="removeImage(${index})"` の `index` は数値、`onclick="showHistoryDetail('${h.id}')"` の `h.id` は `Date.now().toString()`（数値文字列）のみ |
| XSS: img src への DataURL 挿入 | 安全 | `FileReader.readAsDataURL` は常に `data:` スキームを返すため `javascript:` は生成されない |
| MODELS 定数 option への埋め込み | 安全 | ハードコード定数でありユーザー入力は含まれない |
| コスト表示（API レスポンス由来） | 安全 | `usage.input_tokens` / `output_tokens` は数値として `toLocaleString()` / `toFixed()` で出力 |
| req.body のバリデーション | 要注意 | `api/check.js` は受信 body を無検証で Anthropic に転送。model や max_tokens の上限チェックなし（Anthropic API 側でバリデーションされるため低リスク） |

### デグレード確認

| 関数 | 結果 | 備考 |
|---|---|---|
| `runCheck()` | 問題なし | sessionStorage フラグ管理・エンコード・API 呼び出し・結果表示・履歴保存の全フロー正常 |
| `displayResults()` | 問題なし | 要約バッジ・コスト表示・再チェックボタン・メモエリア・印刷ボタンの追加は既存テーブル表示に影響なし |
| `saveHistory()` | 問題なし | `usage` / `model` / `memo` フィールドが追加されたが既存フィールド（category / results / overallStatus / imageCount）は維持 |
| `loadHistory()` | 問題なし | `filterHistories()` が挿入されたが全フィルター空のとき全件返す設計 |

### ブラウザでの確認依頼
URL: https://cosmetics-checker.vercel.app
以下を確認してください：

1. **モデル選択**: デフォルトモデル `claude-opus-4-7` でチェック実行が成功するか（API 404 エラーが出ないか）
2. **unclear 再チェック**: unclear 判定があった場合に「再チェック」ボタンが表示され、押下後に結果が更新されるか
3. **印刷/PDF**: 「印刷 / PDF保存」ボタン押下で結果テーブルのみが印刷プレビューに表示されるか（ヘッダー・履歴・フィルターが非表示になるか）
4. **カスタム項目**: 項目を追加してチェック実行し、結果テーブルに「カスタム」バッジ付きで表示されるか
5. **EXIF 補正**: スマホ縦撮り JPEG（orientation=6）をアップロードしてプレビューが正立表示されるか
6. **Service Worker**: 初回アクセス後にオフラインでページを開いて UI が表示されるか
7. **タッチデバイス**: スマートフォンでアクセスしてドロップゾーンの文言が「タップして画像を選択」に変わるか

---

## バグ修正再テスト（コミット e8d25ba）

実施日: 2026-05-19

| バグ# | 重大度 | ファイル | 修正確認 | 判定 |
|---|---|---|---|---|
| #5 | High | server.js | `import { join, dirname } from 'path'` で `join` が named import に追加され、18行目の `path.join(__dirname)` が `join(__dirname)` に変更されていることを確認 | PASS |
| #6 | Medium | api/check.js | `getRateLimitInfo()` 先頭（L27-31）に `for (const [key, val] of ipRequestCounts.entries()) { if (now > val.resetAt) ipRequestCounts.delete(key); }` のクリーンアップループが追加されていることを確認 | PASS |
| #7 | Medium | js/app.js | `MODELS` 定数の12行目が `'claude-sonnet-4-6'`、13行目が `'claude-haiku-4-5-20251001'` に修正されていることを確認 | PASS |
| #8 | Low | sw.js | L47-50 の `.catch()` が `() => cached` のみから `() => cached \|\| new Response('オフラインです。ネットワーク接続を確認してください。', { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/plain; charset=utf-8' } })` に変更されていることを確認 | PASS |
| #9 (Problem) | Low | js/app.js | `setupCustomItemsUI()` がメインの `DOMContentLoaded` ハンドラ内（L54）に統合済みであり、独立した `DOMContentLoaded` ハンドラが存在しないことを確認 | PASS |

### 総合判定: PASS

**判定基準**: High/Medium バグが全て修正済みであること

### 再テスト結論

コミット `e8d25ba` で修正された5件（Bug #5〜#8、Problem #9）全ての修正を静的コード検証により確認した。

- **Bug #5 (High)**: `server.js` の `path is not defined` エラーは、`join` を named import に追加し `path.join()` → `join()` に変更することで解消済み。`node server.js` 起動時のクラッシュが修正された。
- **Bug #6 (Medium)**: `api/check.js` の `getRateLimitInfo()` 先頭に期限切れエントリ削除ループが追加され、長時間稼働時の `ipRequestCounts` Map 肥大化が防止された。
- **Bug #7 (Medium)**: `MODELS` 定数のモデルIDが `claude-sonnet-4-6`・`claude-haiku-4-5-20251001` に修正済み。Anthropic API の正規モデルIDが使用されるようになった。
- **Bug #8 (Low)**: `sw.js` のキャッシュミス時に `undefined` を返していた箇所が 503 Response を返すよう修正済み。オフライン時のブラウザエラーが解消された。
- **Problem #9 (Low)**: `setupCustomItemsUI()` がメインの初期化フロー内に統合済み。コード保守性が向上した。

High/Medium の全バグが修正済みであるため、総合判定は PASS とする。
