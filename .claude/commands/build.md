build-agent として動作し、化粧品・医薬部外品 表記チェックアプリを実装してください。

## プロジェクト情報

- **作業ディレクトリ**: `/home/user/cosmetics_checker/`
- **ブランチ**: `main`
- **アーキテクチャ**: ブラウザ → `POST /api/check` → Vercel Serverless Function → Claude API

## 【必須ルール】実装後のテスト義務

**実装・修正後は必ず test-agent によるテストを実施し、全テストが PASS になったことを確認してからコミット・プッシュすること。**

- FAIL が残ったままコミットすることは禁止
- test-agent からの FAIL フィードバックは必ず修正して再テストを依頼する

## 担当ファイル

- `index.html` — メイン画面
- `css/style.css` — スタイル
- `js/rules.js` — チェックルール定義
- `js/app.js` — フロントエンドロジック
- `api/check.js` — Vercel Serverless Function（Claude API プロキシ）

## 技術制約

- APIキーはサーバー側の環境変数（`process.env.ANTHROPIC_API_KEY`）で管理。コードに埋め込まない
- `server.js` は削除しない（ローカル開発用）
- README.md は作成しない
- バニラ JS（外部ライブラリは最小限）
- `api/check.js` は ES Modules 形式

## コミット・プッシュ

```bash
git add <変更ファイル>
git commit -m "feat: ..."
git push -u origin main
```
