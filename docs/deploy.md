# Vercel デプロイ手順書

作成日: 2026-05-19  
バージョン: 1.0

---

## 1. 概要

本アプリケーションは Vercel を使ってホスティングする。静的ファイルは Vercel CDN から配信し、Claude API との通信は Vercel Serverless Function（`api/check.js`）が担う。

### 構成図

```
ブラウザ
  │
  ├── GET /           → Vercel CDN（index.html, css/, js/）
  │
  └── POST /api/check → Vercel Serverless Function（api/check.js）
                            │
                            └── POST https://api.anthropic.com/v1/messages
                                （ANTHROPIC_API_KEY はサーバー側環境変数から取得）
```

この構成により、`ANTHROPIC_API_KEY` はサーバー側にのみ保持され、ブラウザに露出しない。

### 主要ファイルの役割

| ファイル | 役割 |
|---|---|
| `api/check.js` | Vercel Serverless Function。Claude API へのリクエストをプロキシする |
| `vercel.json` | Vercel の関数設定（タイムアウト等） |
| `server.js` | ローカル開発用 Express サーバー。Vercel 環境では使用しない |
| `index.html`, `css/`, `js/` | 静的ファイル群。変更なしで CDN から配信される |

---

## 2. 前提条件

| 項目 | 要件 |
|---|---|
| Node.js | v20 以上（`package.json` の `engines` フィールドで指定） |
| Vercel アカウント | [vercel.com](https://vercel.com) でアカウント作成済みであること |
| Vercel CLI | `npm install -g vercel` でインストール（後述） |
| Anthropic API キー | [console.anthropic.com](https://console.anthropic.com) で発行済みであること |

---

## 3. Vercel へのデプロイ手順

### 3.1 Vercel CLI のインストール

```bash
npm install -g vercel
```

### 3.2 Vercel へのログイン

```bash
vercel login
```

ブラウザが起動し、Vercel アカウントでの認証を求められる。完了すると CLI がログイン状態になる。

### 3.3 デプロイの実行

プロジェクトルート（`/home/user/cosmetics_checker/` 相当のディレクトリ）で以下を実行する。

```bash
vercel --prod
```

### 3.4 初回デプロイ時の設定

初回実行時は対話形式でプロジェクト設定を求められる。以下のように回答する。

| 質問 | 回答 |
|---|---|
| Set up and deploy? | `Y` |
| Which scope? | 自分のアカウントまたは組織を選択 |
| Link to existing project? | `N`（新規の場合） |
| What's your project's name? | `cosmetics-checker`（任意） |
| In which directory is your code located? | `./`（そのまま Enter） |
| Want to modify these settings? | `N` |

フレームワーク自動検出では「Other」が選択される。本プロジェクトはフレームワークなしの構成のため、そのまま進める。

デプロイ完了後、`https://<プロジェクト名>.vercel.app` 形式の URL が発行される。

---

## 4. Vercel ダッシュボードでの環境変数設定

デプロイ完了直後はまだ `ANTHROPIC_API_KEY` が設定されていないため、アプリケーションは正常に動作しない。以下の手順で環境変数を設定する。

### 4.1 設定手順

1. [vercel.com/dashboard](https://vercel.com/dashboard) にアクセスしてログインする
2. デプロイしたプロジェクトを選択する
3. 上部タブから **Settings** をクリックする
4. 左メニューから **Environment Variables** を選択する
5. 以下の値を入力して **Save** をクリックする

| フィールド | 値 |
|---|---|
| Key | `ANTHROPIC_API_KEY` |
| Value | `sk-ant-api03-...`（実際の API キー） |
| Environment | `Production`、`Preview`、`Development` すべてにチェックを入れる |

### 4.2 設定後の再デプロイ

環境変数は設定後のデプロイから有効になる。設定直後は古いデプロイが動作しているため、**Deployments** タブから最新のデプロイを選択して **Redeploy** を実行する。

または、ソースコードに軽微な変更を加えて再度 `vercel --prod` を実行してもよい。

---

## 5. ローカル開発手順

### 5.1 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、API キーを記載する。

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

`.env` ファイルは `.gitignore` に含まれており、リポジトリにはコミットされない。

### 5.2 依存パッケージのインストール

```bash
npm install
```

### 5.3 ローカルサーバーの起動

```bash
node server.js
```

起動成功時のログ:

```
サーバー起動中: http://localhost:3000
```

### 5.4 ブラウザでのアクセス

`http://localhost:3000` をブラウザで開く。

### 5.5 Vercel CLI によるローカル開発（推奨）

`vercel dev` コマンドを使うと、ローカルでも Serverless Function（`api/check.js`）を含む完全な動作確認ができる。

```bash
vercel dev
```

`vercel dev` は `.env` ファイルを自動で読み込むため、別途 `.env` の設定は不要（ただし `.env` ファイルが存在しない場合はダッシュボードからの環境変数取得を促される）。

---

## 6. ディレクトリ構成

```
cosmetics_checker/
├── api/
│   └── check.js        Vercel Serverless Function（POST /api/check）
├── css/
│   └── style.css       スタイルシート
├── js/
│   ├── app.js          アプリケーションロジック
│   └── rules.js        チェックルール定義
├── docs/               ドキュメント類
├── index.html          エントリーポイント
├── package.json        Node.js プロジェクト設定（type: module, engines: >=20.x）
├── vercel.json         Vercel 設定（maxDuration: 30）
├── server.js           ローカル開発用 Express サーバー（Vercel では使用しない）
└── .env                ローカル開発用環境変数（gitignore 済み・手動作成が必要）
```

### Vercel での静的ファイル配信

Vercel はプロジェクトルート直下のファイルをそのまま CDN から配信する。`outputDirectory` の設定は不要で、現在の配置変更なしに `index.html`、`css/`、`js/` が配信される。

### `api/` ディレクトリの扱い

`api/` ディレクトリ内の `.js` ファイルは Vercel により自動的に Serverless Function として認識され、ファイルパスに対応するエンドポイントとして公開される。`api/check.js` は `/api/check` エンドポイントにマッピングされる。

---

## 7. トラブルシューティング

### 401 エラー（認証エラー）

**症状**: チェック実行時に「APIキーが無効です」エラーが表示される

**原因と対処**:

| 原因 | 対処 |
|---|---|
| `ANTHROPIC_API_KEY` が Vercel に設定されていない | セクション4の手順で設定し、再デプロイする |
| API キーが無効または失効している | [console.anthropic.com](https://console.anthropic.com) で API キーの状態を確認する |
| 環境変数設定後に再デプロイしていない | Vercel ダッシュボードから Redeploy を実行する |

### タイムアウトエラー（504 Gateway Timeout）

**症状**: チェック実行時に応答が返らず、タイムアウトする

**原因と対処**:

| 原因 | 対処 |
|---|---|
| 送信画像のファイルサイズが大きい | 画像を縮小してから再試行する（目安: 1 画像あたり 2MB 以下） |
| `vercel.json` の `maxDuration` 不足 | `maxDuration` を `60` に増やす（Hobby プランの上限） |
| Claude API 側の応答遅延 | しばらく待ってから再試行する |

`vercel.json` の `maxDuration` を変更する場合:
```json
{
  "functions": {
    "api/check.js": {
      "maxDuration": 60
    }
  }
}
```

### 413 エラー（ペイロードサイズ超過）

**症状**: 複数枚の画像を送信した際に 413 エラーが発生する

**原因と対処**:

`api/check.js` の `config` エクスポートで `sizeLimit: '10mb'` を設定しているが、Vercel プランによっては上限が異なる。

```javascript
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};
```

送信する画像の枚数を減らすか、各画像のサイズを圧縮してから再試行する。

### ローカルで `node server.js` がエラーになる

**症状**: `ReferenceError: path is not defined` 等のエラーが出る

**原因**: `server.js` は `path` モジュールの名前付きインポートが不完全な場合がある。

**対処**: `vercel dev` コマンドを代わりに使用する。`vercel dev` は `api/check.js` を含む完全な動作確認環境をローカルで提供する。

### Function が見つからない（404）

**症状**: `/api/check` にアクセスすると 404 が返る

**原因と対処**:

| 原因 | 対処 |
|---|---|
| `api/check.js` がデプロイに含まれていない | `.vercelignore` や `.gitignore` で `api/` が除外されていないか確認する |
| ファイル名・パスが違う | `api/check.js` のパスとエクスポート形式（`export default function handler`）を確認する |
