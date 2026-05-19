build-agent として動作し、化粧品・医薬部外品 表記チェックアプリを実装してください。

## 前提情報
- 設計書: `docs/design/` 配下の各ファイルを参照
- 要件: HANDOFF.md を参照
- 技術スタック: HTML / CSS / JavaScript（バックエンドなし）

## 実装するファイル

1. **`js/rules.js`** - チェックルール定義
   - 医薬部外品（薬機法第59条）の10項目
   - 化粧品（薬機法第61条）の7項目
   - 各項目に id・name・required・article（根拠条文）を定義

2. **`js/app.js`** - アプリロジック
   - 画像アップロード処理（複数枚・ドラッグ&ドロップ）
   - Claude API 呼び出し（Base64画像 + プロンプト）
   - チェック結果のパース・表示
   - 履歴のlocalStorage保存・読み込み
   - CSVエクスポート

3. **`css/style.css`** - スタイル
   - クリーンでプロフェッショナルなデザイン
   - レスポンシブ対応
   - 結果表示の見やすさ重視

4. **`index.html`** - メイン画面
   - APIキー入力欄（localStorage保存・マスク表示）
   - カテゴリ選択（化粧品/医薬部外品）
   - 画像アップロードエリア
   - チェック実行ボタン
   - 結果表示エリア
   - 履歴一覧・CSVエクスポートボタン
   - 免責表示（常時表示）

## Claude API 呼び出し仕様

```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  },
  body: JSON.stringify({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    messages: [{ role: 'user', content: [...] }]
  })
});
```

## 完了条件
ブラウザで `index.html` を開き、全機能が正常に動作すること。
