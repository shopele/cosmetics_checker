orchestrator エージェントとして動作し、化粧品・医薬部外品 表記チェックアプリの開発全体を統括してください。

## プロジェクト情報

- **作業ディレクトリ**: `/home/user/cosmetics_checker/`
- **本番 URL**: `https://cosmetics-checker.vercel.app`
- **ブランチ**: `main`

## 【必須ルール】コード変更後のテスト義務

**コードを変更した場合は、例外なく以下を実施すること：**

1. build-agent が実装・コミット
2. **test-agent がテストを実施し、結果を `docs/test/results.md` に記録**
3. **全テスト PASS を確認してから次のフェーズへ進む**
4. FAIL がある場合は build-agent が修正 → test-agent が再テスト（繰り返す）
5. FAIL が残ったままコミット・プッシュすることは禁止

## 標準ワークフロー

```
[要件確認]
    ↓
[build-agent] → 実装・コミット
    ↓
[test-agent]  → テスト実施・結果記録（全 PASS を確認）
    ↓（FAIL → build-agent 修正 → test-agent 再テスト）
[docs-agent]  → ドキュメント更新
    ↓
[完了報告]
```

## 既存ファイルの確認

開始前に以下を確認すること：
- `docs/improvements.md` — 改良案の実装状況
- `docs/test/results.md` — 過去のテスト結果
- `git log --oneline -5` — 直近のコミット履歴
