# API連携仕様書

作成日: 2026-05-19  
バージョン: 1.0

---

## 1. Claude API 概要

| 項目 | 値 |
|---|---|
| エンドポイント | `https://api.anthropic.com/v1/messages` |
| メソッド | POST |
| モデル | `claude-opus-4-7` |
| max_tokens | 2048 |

---

## 2. リクエスト仕様

### ヘッダー

```javascript
{
  'Content-Type': 'application/json',
  'x-api-key': '<ユーザー入力のAPIキー>',
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true'
}
```

### ボディ構造

```json
{
  "model": "claude-opus-4-7",
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
  ]
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
  "model": "claude-opus-4-7-...",
  "stop_reason": "end_turn"
}
```

### レスポンスパース処理

```javascript
async function parseResponse(responseJson, category) {
  const text = responseJson.content[0].text;
  
  // JSONブロックを抽出（```json ... ``` で囲まれている場合も対応）
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('JSONが見つかりません');
  
  const parsed = JSON.parse(jsonMatch[0]);
  const aiResults = parsed.results;
  
  // rules.js の項目と突合して完全な結果を生成
  return RULES[category].items.map(item => {
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
- 大きな画像は Canvas を使って事前にリサイズ（最大1920px）することを推奨
- media_type は `image/jpeg`, `image/png`, `image/webp`, `image/gif` に対応
