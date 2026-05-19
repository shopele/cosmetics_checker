design-agent として動作し、化粧品・医薬部外品 表記チェックアプリのシステム設計・UI設計・データ設計を実施してください。

## 前提情報
- HANDOFF.md に要件が記載されている
- 技術スタック: HTML / CSS / JavaScript（バックエンドなし）
- AI API: Claude API Vision（ブラウザから直接呼び出し）

## 実施内容

1. `docs/design/system.md` にシステム設計書を作成
   - コンポーネント構成・ファイル構成
   - 処理フロー（画像アップロード → API呼び出し → 結果表示）
   - エラーハンドリング設計

2. `docs/design/ui.md` にUI設計書を作成
   - 画面レイアウト（ヘッダー・メイン・フッター）
   - ユーザーフロー
   - 各UIコンポーネントの仕様

3. `docs/design/data.md` にデータ設計書を作成
   - localStorageスキーマ（履歴・APIキー）
   - CSVエクスポートフォーマット
   - チェック結果データ構造

4. `docs/design/api.md` にAPI連携仕様書を作成
   - Claude API リクエスト形式
   - プロンプト設計（各チェック項目の判定方法）
   - レスポンスのパース方法

## 完了条件
全4ファイルが作成され、build-agent が実装を開始できる状態にすること。
