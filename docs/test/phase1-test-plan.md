# Phase 1 テスト計画書

作成日: 2026-05-20
対象: Phase 1.1（判定理由・代替案の詳細化）/ Phase 1.2（NG表現の改善案提示）

## テストケース

### Phase 1.1: 判定理由・代替案の詳細化

| # | テスト項目 | 確認方法 | 合格基準 |
|---|---|---|---|
| T1-1 | rules.js 化粧品全項目に reason/law_reference/suggestion が定義されている | コード確認 | 全7項目に3フィールドが存在する |
| T1-2 | rules.js 医薬部外品全項目に reason/law_reference/suggestion が定義されている | コード確認 | 全10項目に3フィールドが存在する |
| T1-3 | プロンプトに理由・改善案の返却指示が含まれている | コード確認 | buildPromptForItems() に reason/suggestion の返却指示がある |
| T1-4 | parseResponse() が reason/suggestion を取り出す | コード確認 | フィールドなし時に空文字列になる |
| T1-5 | not_found の行に詳細表示が追加される | コード確認 | displayResults() に detail-row または details 要素がある |
| T1-6 | unclear の行に詳細表示が追加される | コード確認 | not_found と同様の処理がある |
| T1-7 | found の行に詳細表示が表示されない | コード確認 | found 時は detail 非表示になっている |
| T1-8 | XSS対策（reason/suggestion に escapeHtml 適用） | コード確認 | escapeHtml() が適用されている |
| T1-9 | showHistoryDetail() または履歴表示でも詳細が反映される | コード確認 | 履歴詳細でも reason/suggestion が渡される |

### Phase 1.2: NG表現の改善案提示

| # | テスト項目 | 確認方法 | 合格基準 |
|---|---|---|---|
| T2-1 | NG_EXPRESSION_CATEGORIES 全4項目に suggestion が定義されている | コード確認 | 全4カテゴリに suggestion フィールドが存在する |
| T2-2 | NG表現テーブルに「言い換え候補」列がある | コード確認 | renderNgExpressionsSection() に列が追加されている |
| T2-3 | suggestion 未定義時に「―」が表示される | コード確認 | フォールバック処理がある |
| T2-4 | XSS対策（suggestion に escapeHtml 適用） | コード確認 | escapeHtml() が適用されている |

### デグレード確認

| # | テスト項目 | 合格基準 |
|---|---|---|
| D-1 | found の項目が正常に表示される | 既存の found 表示に変化なし |
| D-2 | 要約バッジが正常に表示される | 記載あり/なし/判定不可 の表示が正常 |
| D-3 | 履歴保存・CSV エクスポートの既存フィールドに影響なし | reason/suggestion 追加で既存フィールドが壊れない |
| D-4 | reCheckUnclearItems() が正常に動作する | 再チェック処理に影響なし |
