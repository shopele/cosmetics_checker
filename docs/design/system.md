# システム設計書

作成日: 2026-05-19  
バージョン: 1.1（2026-05-19 Vercel デプロイ構成追記）

---

## 1. システム概要

### アーキテクチャ

```
ブラウザ（クライアントのみ）
├── index.html        ← エントリーポイント・UI
├── css/style.css     ← スタイル
└── js/
    ├── rules.js      ← チェックルール定義（薬機法根拠付き）
    └── app.js        ← アプリケーションロジック全体
```

バックエンドサーバーなし。全処理はブラウザ内で完結。

### 外部依存

| サービス | 用途 | 認証方式 |
|---|---|---|
| Claude API (api.anthropic.com) | 画像内テキストの事実判定 | x-api-key ヘッダー |

---

## 2. ファイル責務

### `js/rules.js`
- チェックルールをJSONオブジェクトとして定義
- カテゴリごとに根拠法令・条番号・項目リストを保持
- `app.js` から参照されるが、直接DOM操作はしない

### `js/app.js`
以下のモジュールで構成する（全て同一ファイル内の関数として実装）:

| 関数グループ | 責務 |
|---|---|
| UI制御 | イベントリスナー登録・DOM操作 |
| 画像処理 | ファイル読み込み・Base64変換 |
| API連携 | Claude APIへのリクエスト送信・レスポンスパース |
| 結果表示 | チェック結果テーブル生成 |
| 履歴管理 | localStorage読み書き・履歴一覧表示 |
| CSV出力 | Blob生成・ダウンロード |

---

## 3. 処理フロー

### メイン処理（チェック実行）

```
[1] APIキー確認
    → 未入力の場合: エラーメッセージ表示・処理停止

[2] 画像確認
    → 未選択の場合: エラーメッセージ表示・処理停止

[3] カテゴリ取得
    → rules.js から該当カテゴリのチェック項目リストを取得

[4] 画像Base64変換
    → FileReader API で各画像を Base64 エンコード

[5] Claude API 呼び出し
    → 全画像 + プロンプト（チェック項目一覧）を送信
    → ローディング表示

[6] レスポンスパース
    → JSON形式のテキストを抽出・パース
    → パース失敗時: エラーメッセージ表示

[7] 結果表示
    → 各項目の status（found / not_found / unclear）を表示
    → 全体判定（全項目 found → 問題なし / それ以外 → 要確認）

[8] 履歴保存
    → localStorageに結果を保存（最新50件）
```

---

## 4. エラーハンドリング

| エラー条件 | ユーザーへの表示 | 処理 |
|---|---|---|
| APIキー未入力 | 「APIキーを入力してください」 | 処理停止 |
| 画像未選択 | 「画像をアップロードしてください」 | 処理停止 |
| API通信エラー（ネットワーク） | 「通信エラーが発生しました。接続を確認してください」 | 処理停止 |
| API認証エラー（401） | 「APIキーが無効です。確認してください」 | 処理停止 |
| APIレスポンスパース失敗 | 「結果の解析に失敗しました。再試行してください」 | 処理停止 |
| APIレート制限（429） | 「APIの利用制限に達しました。しばらくお待ちください」 | 処理停止 |

---

## 5. セキュリティ考慮事項

- APIキーは `localStorage` に保存（平文）。パスワード入力欄（type=password）で表示はマスク
- 画像データはブラウザ内でBase64変換後、Claude APIへ直接送信（中間サーバーなし）
- 外部への画像送信は使用許可済み

---

## 6. ブラウザ対応

- Chrome（最新）: 対応
- Edge（最新）: 対応
- Firefox: 動作確認対象外
- モバイル: レスポンシブ対応（補助的）

---

## 7. Vercel デプロイ構成

### 7.1 デプロイ後アーキテクチャ

```
Vercel CDN（静的ファイル配信）
├── index.html
├── css/style.css
└── js/
    ├── rules.js
    └── app.js

Vercel Serverless Function
└── api/check.js    ← POST /api/check エンドポイント
```

クライアントは `/api/check` を呼び出し、Serverless Function が `ANTHROPIC_API_KEY` を使って Claude API へプロキシする。APIキーはサーバー側環境変数に保持されるため、クライアントに露出しない。

### 7.2 ファイル追加・変更一覧

| ファイル | 操作 | 内容 |
|---|---|---|
| `api/check.js` | 新規作成 | Vercel Serverless Function（Claude API プロキシ） |
| `vercel.json` | 新規作成 | ルーティング・ビルド設定 |
| `package.json` | 更新 | `engines` フィールド追加、`express`/`dotenv` 削除 |
| `server.js` | 削除対象 | Vercel 環境では不要（ローカル開発用として保持も可） |
| `.gitignore` | 確認のみ | `.env` と `node_modules/` は既存で対応済み |
| 静的ファイル群 | 変更なし | 現在の配置（ルート直下）のままでよい |

### 7.3 静的ファイルの配置方針

Vercel はデフォルトでプロジェクトルートを静的ファイルのルートとして扱う。`vercel.json` に `"outputDirectory"` を指定しない場合、ルート直下の `index.html`、`css/`、`js/` はそのまま CDN から配信される。現在の配置変更は不要。

### 7.4 `api/check.js` 設計

Vercel Serverless Function（Node.js）として `server.js` の `/api/check` エンドポイントを変換する。

**ファイルパス**: `api/check.js`

```javascript
// Vercel Serverless Function: POST /api/check
// Claude API へのリバースプロキシ。ANTHROPIC_API_KEY はサーバー側環境変数から取得。
export default async function handler(req, res) {
  // POST のみ受け付ける
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: { message: 'API key not configured' } });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
```

**設計上の判断事項**:
- `express` と `dotenv` は使用しない（Vercel ランタイムが不要）
- `req.body` は Vercel が自動でパースする（`Content-Type: application/json` の場合）。ただし画像 Base64 を含むため最大ペイロードサイズに注意（後述）
- Claude API のステータスコードはそのままクライアントに転送する（401・429 等をクライアント側の `errorMessage()` 関数で処理済み）

### 7.5 `vercel.json` 設計

```json
{
  "functions": {
    "api/check.js": {
      "maxDuration": 30
    }
  }
}
```

**設計上の判断事項**:
- `api/` ディレクトリ内のファイルは Vercel が自動でルーティングするため、`rewrites` セクションは不要。実際の `vercel.json` には記述していない
- `maxDuration: 30` を指定する。Claude API（Vision）は画像サイズによっては応答に数十秒かかるため、デフォルトの 10 秒では不足するリスクがある（Vercel Hobby プランの上限は 60 秒）
- `Content-Type: application/json` ヘッダーは Vercel が `res.json()` 呼び出し時に自動付与するため、`headers` セクションでの設定は不要

### 7.6 `package.json` 更新方針

```json
{
  "name": "cosmetics_checker",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=20.x"
  },
  "scripts": {
    "dev": "node server.js"
  }
}
```

**変更内容**:
- `"type": "module"` に変更: `api/check.js` で `export default` 構文を使用するため CommonJS から ES Modules へ切り替える
- `"engines": { "node": ">=20.x" }` を追加: Vercel の Node.js ランタイムバージョンを明示指定。Node.js 20 は Vercel の推奨 LTS バージョン
- `express` と `dotenv` は現時点で `dependencies` に残存しているが、Serverless Function では不要。ローカル開発で `server.js` を使用する場合は `devDependencies` へ移動するか、`vercel dev` コマンドを代替手段として使うことを推奨する
- `"main": "index.js"` は削除（エントリーポイントが不要なため）

**補足 - `server.js` の扱い**:
- `server.js` は Vercel デプロイには不要だが、ローカル開発の参照用として削除せず保持を推奨
- Vercel CLI による `vercel dev` コマンドを使えば、ローカルでも Serverless Function を含む完全な動作確認が可能

### 7.7 ペイロードサイズ制限

| 環境 | 制限 |
|---|---|
| Vercel Serverless Function のリクエストボディ | 4.5 MB（デフォルト） |
| `vercel.json` で `bodyParser` を無効化した場合 | 最大約 5 MB（`req` ストリームで処理） |
| 既存の画像リサイズ処理（最大 1920px） | 1 画像あたり概ね 1 〜 3 MB |

複数枚の画像を送信する場合、4.5 MB 制限に達する可能性がある。対策として以下を検討する:

- **推奨**: `vercel.json` に `bodyParser` 設定を追加してサイズ上限を 4.5 MB から引き上げる
- **代替**: クライアント側でさらなる画像圧縮（品質・解像度の下限設定）

`vercel.json` に追記する設定例:
```json
{
  "functions": {
    "api/check.js": {
      "maxDuration": 30
    }
  }
}
```

Vercel の `bodyParser` は `api/check.js` 内で以下のようにデフォルト制限を明示的に変更できる（ただし上限は Vercel プランに依存）:
```javascript
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};
```

### 7.8 環境変数設定

| 変数名 | 設定箇所 | 値 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Vercel Dashboard > Settings > Environment Variables | 実際の API キー |

Vercel Dashboard で設定した環境変数は、Serverless Function 内で `process.env.ANTHROPIC_API_KEY` として参照できる。`Production`・`Preview`・`Development` の各環境で個別に設定可能。

### 7.9 クライアントコード（`js/app.js`）の変更点

現在の `callAPI()` 関数は `fetch('/api/check', ...)` を呼び出しており、**変更不要**。Vercel の URL が変わっても相対パスのため影響しない。

`errorMessage()` 関数の 401 エラーメッセージは現在「`.env ファイルの ANTHROPIC_API_KEY を確認してください`」となっているが、Vercel デプロイ後はユーザーが `.env` を操作しないため、「APIキーが無効です。管理者にお問い合わせください。」等に変更することを推奨する。

### 7.10 デプロイ手順概要

1. GitHub リポジトリに `api/check.js`、`vercel.json`、更新済み `package.json` をプッシュ
2. Vercel Dashboard でリポジトリをインポート（または `vercel` CLI で `vercel --prod`）
3. Vercel Dashboard > Settings > Environment Variables で `ANTHROPIC_API_KEY` を設定
4. 再デプロイ（環境変数設定後は自動再デプロイまたは手動トリガー）
5. 発行された URL で動作確認
