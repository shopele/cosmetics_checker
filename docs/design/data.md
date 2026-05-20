# データ設計書

作成日: 2026-05-19  
最終更新: 2026-05-20  
バージョン: 1.1

---

## 1. localStorage スキーマ

### 履歴・設定

| キー | 型 | 説明 |
|---|---|---|
| `yakki_checker_history` | JSON string | 履歴配列（最新50件） |
| `yakki_checker_model` | string | UIで選択したモデルID |
| `yakki_checker_custom_items` | JSON string | カスタムチェック項目配列 |

### sessionStorage

| キー | 型 | 説明 |
|---|---|---|
| `yakki_checker_running` | string | 実行中フラグ（重複送信防止） |

注記: APIキーはクライアントストレージに保存しない。サーバー側環境変数で管理する。

---

## 2. チェック履歴データ構造

```json
[
  {
    "id": "2026051921300001",
    "timestamp": "2026-05-19T21:30:00.000Z",
    "category": "cosmetic",
    "categoryLabel": "化粧品",
    "imageCount": 3,
    "overallStatus": "ng",
    "model": "claude-sonnet-4-6",
    "usage": {
      "input_tokens": 1147,
      "output_tokens": 690
    },
    "ng_expressions": [],
    "extracted_text": "...",
    "memo": "",
    "results": [
      {
        "id": "cs_01",
        "name": "製品名（名称）",
        "article": "第61条第1号",
        "required": true,
        "status": "found",
        "note": ""
      },
      {
        "id": "cs_05",
        "name": "全成分の名称",
        "article": "第61条第3号",
        "required": true,
        "status": "not_found",
        "note": "全成分リストが確認できない"
      }
    ]
  }
]
```

### フィールド定義

| フィールド | 型 | 値 | 説明 |
|---|---|---|---|
| id | string | YYYYMMDDHHmmssNNN | 一意ID（日時＋連番） |
| timestamp | string | ISO 8601 | チェック実行日時 |
| category | string | `cosmetic` / `quasi_drug` | カテゴリコード |
| categoryLabel | string | `化粧品` / `医薬部外品` | 表示用カテゴリ名 |
| imageCount | number | 1以上 | 送信画像枚数 |
| overallStatus | string | `ok` / `ng` / `unclear` | 全体判定 |
| model | string/null | `claude-*` | 応答時に使用されたモデル |
| usage | object/null | `{input_tokens, output_tokens}` | トークン使用量 |
| ng_expressions | array | NG表現一覧 | 検出した問題表現 |
| extracted_text | string | 任意 | 抽出テキスト全文 |
| memo | string | 任意 | 社内向けメモ |
| results[].id | string | cs_01 など | チェック項目ID |
| results[].status | string | `found` / `not_found` / `unclear` | AIによる判定結果 |
| results[].note | string | 任意 | AIからの補足コメント |

### overallStatus の算出ルール

- 全項目が `found` → `ok`
- 1件でも `not_found` → `ng`
- `not_found` なしで `unclear` あり → `unclear`

### 最大件数

最新50件を超えた場合は古い順に削除。

---

## 3. CSVエクスポートフォーマット

### ファイル名

`yakki_check_history_YYYYMMDD.csv`

### エンコーディング

UTF-8 BOM付き（Excelで文字化けしないよう）

### ヘッダー行

```
チェック日時,カテゴリ,画像枚数,全体判定,[項目1名],[項目2名],...
```

### データ行

```
2026/05/19 21:30,化粧品,3,要確認,記載あり,記載あり,記載なし,記載あり,...
```

### status の日本語変換

| status | CSV表示 |
|---|---|
| found | 記載あり |
| not_found | 記載なし |
| unclear | 判定不可 |

### overallStatus の日本語変換

| overallStatus | CSV表示 |
|---|---|
| ok | 問題なし |
| ng | 要確認 |
| unclear | 要確認 |

---

## 4. rules.js データ構造

```javascript
const RULES = {
  cosmetic: {
    label: '化粧品',
    law: '薬機法第61条',
    items: [
      {
        id: 'cs_01',
        name: '製品名（名称）',
        required: true,
        requiredType: 'mandatory',
        article: '第61条第1号'
      },
      // ...
    ]
  },
  quasi_drug: {
    label: '医薬部外品',
    law: '薬機法第59条',
    items: [
      {
        id: 'qd_01',
        name: '製品名（名称）',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第1号'
      },
      // ...
    ]
  }
};
```

### requiredType の値

| 値 | 意味 |
|---|---|
| `mandatory` | 無条件で必須 |
| `conditional` | 条件付き必須（条件は name に記載） |
