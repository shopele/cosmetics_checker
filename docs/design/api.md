# API連携仕様書

作成日: 2026-05-19  
最終更新: 2026-05-20  
バージョン: 1.2

---

## 1. Claude API 概要

| 項目 | 値 |
|---|---|
| エンドポイント | `https://api.anthropic.com/v1/messages` |
| メソッド | POST |
| モデル | クライアント選択モデル（サーバーで `ANTHROPIC_MODEL` により上書き可） |
| max_tokens | 2048 |

---

## 2. リクエスト仕様

### ヘッダー

**Vercel Serverless Function 経由（本番構成）**:

```javascript
{
  'Content-Type': 'application/json',
  'x-api-key': process.env.ANTHROPIC_API_KEY,  // サーバー側環境変数
  'anthropic-version': '2023-06-01'
}
```

`anthropic-dangerous-direct-browser-access: true` はブラウザから直接 Claude API を呼び出す場合のみ必要なヘッダーである。Vercel Serverless Function 経由ではサーバーからの呼び出しになるため、このヘッダーは不要で送信しない。

### ボディ構造

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 2048,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image",
          "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": "<Base64エンコードされた画像データ>"
          }
        },
        {
          "type": "image",
          "source": {
            "type": "base64",
            "media_type": "image/png",
            "data": "<Base64エンコードされた画像データ>"
          }
        },
        {
          "type": "text",
          "text": "<プロンプトテキスト>"
        }
      ]
    }
  ]
}
```

**注意**: 画像はcontent配列内に複数指定可能。画像の後にテキストプロンプトを配置する。

---

## 3. プロンプト設計

### プロンプトテンプレート

```
あなたは薬機法の表記チェックを行うアシスタントです。
以下の画像（製品パッケージの複数面）を見て、各項目が画像内に記載されているかどうかのみを判定してください。

【重要な注意事項】
- 法的な適否判断や解釈は行わないでください
- 「画像内に記載が見えるか否か」のみを判定してください
- 複数枚の画像を合わせて一つの製品として判定してください

チェックカテゴリ: {categoryLabel}（{law}）

以下のJSON形式のみで回答してください（説明文は不要）：
{
  "results": [
    {
      "id": "項目ID",
      "name": "項目名",
      "status": "found|not_found|unclear",
      "note": "補足（任意、簡潔に）"
    }
  ],
  "ng_expressions": [
    {
      "expression": "発見した表現",
      "category_id": "ng_01",
      "category_name": "効能効果の標榜",
      "location": "表現が見つかった場所の説明"
    }
  ],
  "extracted_text": "画像から読み取ったテキスト全文"
}

statusの値の意味：
- found: 画像内に記載が確認できる
- not_found: 画像内に記載が確認できない
- unclear: 画像が不鮮明等で判定できない

チェック項目：
{itemsJson}
```

### プロンプト生成コード例

```javascript
function buildPrompt(category) {
  const rule = RULES[category];
  const itemsJson = JSON.stringify(
    rule.items.map(item => ({ id: item.id, name: item.name })),
    null, 2
  );
  
  return `あなたは薬機法の表記チェックを行うアシスタントです。
以下の画像（製品パッケージの複数面）を見て、各項目が画像内に記載されているかどうかのみを判定してください。

【重要な注意事項】
- 法的な適否判断や解釈は行わないでください
- 「画像内に記載が見えるか否か」のみを判定してください
- 複数枚の画像を合わせて一つの製品として判定してください

チェックカテゴリ: ${rule.label}（${rule.law}）

以下のJSON形式のみで回答してください（説明文は不要）：
{
  "results": [
    {
      "id": "項目ID",
      "name": "項目名",
      "status": "found|not_found|unclear",
      "note": "補足（任意、簡潔に）"
    }
  ]
}

statusの値の意味：
- found: 画像内に記載が確認できる
- not_found: 画像内に記載が確認できない
- unclear: 画像が不鮮明等で判定できない

チェック項目：
${itemsJson}`;
}
```

---

## 4. レスポンス仕様

### 正常レスポンス構造

```json
{
  "id": "msg_xxxxx",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "{\n  \"results\": [\n    {\"id\": \"cs_01\", \"name\": \"製品名（名称）\", \"status\": \"found\", \"note\": \"\"}\n  ]\n}"
    }
  ],
  "model": "claude-...",
  "stop_reason": "end_turn"
}
```

### レスポンスパース処理

```javascript
function parseResponse(responseJson, category) {
  const text = responseJson.content[0].text;
  
  // JSONブロックを抽出（```json ... ``` で囲まれている場合も対応）
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('JSONが見つかりません');
  
  const parsed = JSON.parse(jsonMatch[0]);
  const aiResults = parsed.results || [];
  
  // rules.js の項目と突合して完全な結果を生成
  const results = RULES[category].items.map(item => {
    const aiResult = aiResults.find(r => r.id === item.id) || {};
    return {
      id: item.id,
      name: item.name,
      article: item.article,
      required: item.required,
      requiredType: item.requiredType,
      status: aiResult.status || 'unclear',
      note: aiResult.note || ''
    };
  });

  return {
    results,
    ng_expressions: Array.isArray(parsed.ng_expressions) ? parsed.ng_expressions : [],
    extracted_text: typeof parsed.extracted_text === 'string' ? parsed.extracted_text : ''
  };
}
```

---

## 5. エラーレスポンス

| HTTPステータス | 意味 | 対処 |
|---|---|---|
| 401 | 認証エラー（APIキー無効） | 「APIキーが無効です」を表示 |
| 429 | レート制限 | 「しばらく待ってから再試行してください」を表示 |
| 500 | サーバーエラー | 「APIサーバーエラーが発生しました」を表示 |
| ネットワークエラー | 接続失敗 | 「通信エラーが発生しました」を表示 |

---

## 6. 画像サイズ考慮事項

- Claude API は1画像あたり最大5MB
- 大きな画像は Canvas を使って事前にリサイズ（最大1600px）する
- media_type は `image/jpeg`, `image/png`, `image/webp`, `image/gif` に対応

---

## 7. Vercel Serverless Function 仕様（`api/check.js`）

### 7.1 概要

ブラウザから Claude API を直接呼び出す代わりに、Vercel Serverless Function が APIキーを保持してプロキシする構成。クライアントは `/api/check` のみを呼び出す。

```
ブラウザ  →  POST /api/check  →  Vercel: api/check.js  →  Claude API
                                  (ANTHROPIC_API_KEY を付与)
```

### 7.2 エンドポイント仕様

| 項目 | 値 |
|---|---|
| パス | `/api/check` |
| メソッド | POST のみ |
| リクエスト Content-Type | `application/json` |
| レスポンス Content-Type | `application/json` |
| タイムアウト | 30 秒（`vercel.json` の `maxDuration` で設定） |
| レート制限 | IPあたり 10 リクエスト / 60秒（インメモリ） |

### 7.3 リクエスト仕様

クライアント（`js/app.js`）が送信するボディ構造は Claude API の Messages API 仕様に準拠し、Serverless Function はそのまま転送する。

**クライアントが送信するボディ（変更なし）**:
```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 2048,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image",
          "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": "<Base64データ>"
          }
        },
        {
          "type": "text",
          "text": "<プロンプト>"
        }
      ]
    }
  ]
}
```

`api/check.js` では、`process.env.ANTHROPIC_MODEL` が設定されている場合に `body.model` を上書きする。

**Serverless Function が Claude API に転送するヘッダー**:
```
Content-Type: application/json
x-api-key: <process.env.ANTHROPIC_API_KEY>
anthropic-version: 2023-06-01
```

注意: クライアントが元々送信していた `anthropic-dangerous-direct-browser-access: true` ヘッダーは Serverless Function 経由では不要。サーバー側からの通常の API 呼び出しになるため削除する。

### 7.4 レスポンス仕様

Claude API のレスポンスをそのままクライアントに返す（ステータスコードも含む）。

**正常時（200）**: Claude API のレスポンス JSON をそのまま返す
**Claude API エラー時（401, 429, 500 等）**: Claude API が返したステータスコードと JSON ボディをそのままクライアントに転送
**Serverless Function 内エラー（ネットワーク障害等）**: `500` + `{ "error": { "message": "<エラーメッセージ>" } }`

### 7.5 完全な実装コード

```javascript
// api/check.js - Vercel Serverless Function

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'  // 複数画像送信に対応するためデフォルトの 4.5mb から拡張
    }
  }
};

export default async function handler(req, res) {
  // POST のみ受け付ける
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  // APIキー確認
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: { message: 'Server configuration error: API key not set' } });
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

    // Claude API のステータスコードをそのままクライアントに返す
    return res.status(response.status).json(data);

  } catch (err) {
    // ネットワークエラー等、fetch 自体が失敗した場合
    return res.status(500).json({ error: { message: err.message } });
  }
}
```

### 7.6 クライアント側ヘッダーの変更

`js/app.js` の `callAPI()` 関数が `/api/check` を呼び出す際のヘッダーから `anthropic-dangerous-direct-browser-access: true` を削除する必要がある。現在の実装ではこのヘッダーは含まれていないため、変更は不要（確認済み）。

### 7.7 エラーハンドリングフロー

```
Serverless Function 内での処理順序:

1. メソッド確認
   └─ POST 以外 → 405 Method Not Allowed

2. 環境変数確認
   └─ ANTHROPIC_API_KEY 未設定 → 500 Server configuration error

3. Claude API 呼び出し
   ├─ fetch 成功
   │   ├─ response.ok (200) → そのままクライアントに 200 + JSON
   │   └─ response エラー (401/429/500等) → そのままクライアントに同ステータス + JSON
   └─ fetch 失敗（ネットワーク障害等）
       └─ 500 + { error: { message: "..." } }
```

クライアント側（`js/app.js` の `errorMessage()` 関数）は既存のステータスコード分岐（401, 429, 500+）でそのまま処理できる。

### 7.8 CORS 設定

Vercel Serverless Function は同一オリジン（`yourdomain.vercel.app`）からのリクエストのみを対象とするため、CORS 設定は原則不要。

カスタムドメインを設定した場合や、別ドメインから呼び出す場合は以下のヘッダーを追加:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
res.setHeader('Access-Control-Allow-Methods', 'POST');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```
