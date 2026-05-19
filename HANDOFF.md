# 化粧品・医薬部外品 表記チェックアプリ 引き継ぎ資料

作成日: 2026-05-19

---

## プロジェクト概要

**アプリ名**: 化粧品・医薬部外品 表記チェッカー  
**目的**: 製品パッケージ画像を複数枚アップロードし、薬機法の必須記載事項を Claude API（Vision）で自動チェックする業務ツール  
**用途**: 業務での公式チェックツール（参考情報ではなく正式運用）

---

## 確定済みの要件

### 機能要件
- 複数枚の製品画像をアップロードして**総合判定**（各面・外箱・本体等を別々にアップ）
- カテゴリ選択：**化粧品** / **医薬部外品** の2種類
- チェック結果の**履歴保存**（localStorage）
- 履歴の **CSV エクスポート**機能
- **免責表示**を常時表示（AIによる参考判定である旨）

### チェック設計方針（Approach B）
- チェックルールを `rules.js` に **JSON として明示的に定義**（根拠法令付き）
- AI（Claude API）の役割は「**画像内に記載があるか否かの事実判定のみ**」
- 適否判断・法的解釈はしない
- 各項目に根拠条文（薬機法の条番号）を紐付け

### チェック対象法令
| カテゴリ | 根拠法令 |
|---|---|
| 医薬部外品 | 薬機法第59条 |
| 化粧品 | 薬機法第61条 ＋ 化粧品全成分表示通知（平成13年厚生労働省通知） |

### 医薬部外品 チェック項目（薬機法第59条）
| # | 項目 | 必須 |
|---|---|---|
| 1 | 製品名（名称） | 必須 |
| 2 | 「医薬部外品」の文字 | 必須 |
| 3 | 製造販売業者の名称・住所 | 必須 |
| 4 | 製造番号または製造記号 | 必須 |
| 5 | 内容量（重量・容量） | 必須 |
| 6 | 有効成分の名称・分量 | 必須 |
| 7 | 全成分（添加物）の名称 | 必須 |
| 8 | 効能・効果 | 必須 |
| 9 | 用法・用量 | 必須 |
| 10 | 使用上の注意 | 必須 |

### 化粧品 チェック項目（薬機法第61条）
| # | 項目 | 必須 |
|---|---|---|
| 1 | 製品名（名称） | 必須 |
| 2 | 製造販売業者の名称・住所 | 必須 |
| 3 | 製造番号または製造記号 | 必須 |
| 4 | 内容量（重量・容量） | 必須 |
| 5 | 全成分の名称 | 必須 |
| 6 | 使用期限 | 条件付き必須（製造後3年以内に変質する製品） |
| 7 | 使用上の注意（特定成分等） | 条件付き必須（特定成分を含む場合） |

---

## 技術スタック（確定）

| 項目 | 内容 |
|---|---|
| フロントエンド | HTML / CSS / JavaScript（バックエンドなし） |
| AI API | Claude API（Vision）、ブラウザから直接呼び出し |
| API 認証 | `anthropic-dangerous-direct-browser-access: true` ヘッダーを使用 |
| データ保存 | localStorage（履歴・API キー） |
| 実行環境 | 個人PC、ブラウザのみ（Python/Node.js 不要） |
| 外部サービス送信 | 問題なし（製品画像の外部送信許可済み） |

---

## 想定ディレクトリ構成

```
cosmetics_checker/
├── index.html              # メイン画面
├── css/
│   └── style.css           # スタイル
├── js/
│   ├── rules.js            # チェックルール定義（薬機法根拠付き）
│   └── app.js              # アプリロジック
├── docs/
│   ├── requirements.md     # 要件仕様書
│   ├── design/
│   │   ├── system.md       # システム設計書
│   │   ├── ui.md           # UI設計書
│   │   ├── data.md         # データ設計書
│   │   └── api.md          # API連携仕様
│   └── test/
│       ├── spec.md         # テスト仕様書
│       └── results.md      # テスト結果
└── .claude/
    ├── settings.json
    ├── agents/             # カスタムエージェント
    │   ├── orchestrator.md     ← 作成済み
    │   ├── design-agent.md     ← 未作成
    │   ├── build-agent.md      ← 未作成
    │   ├── test-agent.md       ← 未作成
    │   └── docs-agent.md       ← 未作成
    └── commands/           # カスタムスキル（未作成）
        ├── orchestrate.md
        ├── design.md
        ├── build.md
        ├── test.md
        └── docs.md
```

---

## マルチエージェント構成

### エージェント一覧

| エージェント | ファイル | 役割 | モデル |
|---|---|---|---|
| orchestrator | orchestrator.md | 全体統括・各エージェントへの委譲 | claude-opus-4-7 |
| design-agent | design-agent.md | システム設計・UI設計・データ設計 | claude-sonnet-4-6 |
| build-agent | build-agent.md | HTML/CSS/JS の実装 | claude-sonnet-4-6 |
| test-agent | test-agent.md | テスト実施・バグ報告 | claude-sonnet-4-6 |
| docs-agent | docs-agent.md | 仕様書・設計書・テスト仕様書作成 | claude-sonnet-4-6 |

### 開発ワークフロー

```
orchestrator
    ├─→ design-agent    : システム設計・UI設計
    ├─→ docs-agent      : 要件仕様書・設計書 作成
    ├─→ build-agent     : アプリ実装
    ├─→ docs-agent      : テスト仕様書 作成
    ├─→ test-agent      : テスト実施
    │       └─→ build-agent（バグがある場合）
    └─→ docs-agent      : 最終ドキュメント更新
```

### スキル（カスタムコマンド）一覧

| コマンド | 役割 |
|---|---|
| `/orchestrate` | orchestrator を起動して全体を統括開始 |
| `/design` | design-agent を起動して設計を実施 |
| `/build` | build-agent を起動してアプリを実装 |
| `/test` | test-agent を起動してテストを実施 |
| `/docs` | docs-agent を起動してドキュメントを作成 |

---

## 現在の進捗状態

### 完了済み
- [x] 要件定義（上記内容が確定済み）
- [x] ディレクトリ作成（`js/`, `css/`, `.claude/agents/`, `.claude/commands/`）
- [x] `orchestrator.md` 作成済み

### 未完了（次にやること）
1. `.claude/agents/design-agent.md` を作成
2. `.claude/agents/build-agent.md` を作成
3. `.claude/agents/test-agent.md` を作成
4. `.claude/agents/docs-agent.md` を作成
5. `.claude/commands/` に5つのスキルファイルを作成
6. orchestrator を起動してアプリ開発を開始

---

## 引き継ぎ時の指示

Claude Code デスクトップで開いたら、以下のように指示してください：

```
HANDOFF.md を読んで現在の状況を把握し、
未完了タスクの続きから作業を開始してください。
まず残りの4つのエージェントファイルと5つのスキルファイルを作成し、
その後 /orchestrate でアプリ開発を開始してください。
```
