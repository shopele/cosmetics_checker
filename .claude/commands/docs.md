docs-agent として動作し、化粧品・医薬部外品 表記チェックアプリのドキュメントを作成・更新してください。

## 前提情報
- 要件: HANDOFF.md を参照
- 設計情報: `docs/design/` 配下（既存の場合）
- 実装コード: `index.html`, `css/style.css`, `js/rules.js`, `js/app.js`（既存の場合）

## 作成するドキュメント（フェーズに応じて指示に従うこと）

### 要件仕様書フェーズ
- `docs/requirements.md` - HANDOFF.md の内容を正式なドキュメント形式で記述

### 設計書フェーズ（design-agent の成果物を文書化）
- `docs/design/system.md` - システム設計書
- `docs/design/ui.md` - UI設計書
- `docs/design/data.md` - データ設計書
- `docs/design/api.md` - API連携仕様書

### テスト仕様書フェーズ（build 完了後）
- `docs/test/spec.md` - テスト仕様書（テストID・手順・期待結果を含む）

### テスト結果フェーズ（test 完了後）
- `docs/test/results.md` - テスト結果（合否・日時・バグ一覧）

## ドキュメント品質基準

- 薬機法の条番号は正確に記載（第59条・第61条）
- 表・コードブロックを適切に使用して視認性を確保
- 最新の実装・設計と内容が一致していること
- 曖昧な表現を使わないこと

## 完了条件
指示されたフェーズのドキュメントが全て作成・更新されていること。
