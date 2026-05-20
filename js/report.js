// ── HTMLレポート生成・ダウンロード ────────────────────────────
// Phase 2.1: 自己完結型 HTML レポートを生成してダウンロードする

const REPORT_RULE_VERSION = '1.2';

function escapeReportHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateHtmlReport(data) {
  const {
    results = [],
    ng_expressions = [],
    extracted_text = '',
    overallStatus = 'unclear',
    category = 'cosmetic',
    categoryLabel = '',
    timestamp = new Date().toISOString(),
    model = '',
    checkerName = '',
    imageDataUrl = null
  } = data;

  const dt = new Date(timestamp);
  const dateStr = `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;

  const bannerColor = overallStatus === 'ok' ? '#DCFCE7' : overallStatus === 'ng' ? '#FEE2E2' : '#FEF3C7';
  const bannerTextColor = overallStatus === 'ok' ? '#15803D' : overallStatus === 'ng' ? '#B91C1C' : '#92400E';
  const bannerBorder = overallStatus === 'ok' ? '#BBF7D0' : overallStatus === 'ng' ? '#FECACA' : '#FDE68A';
  const bannerText = overallStatus === 'ok'
    ? '問題なし：必須項目の記載が全て確認されました'
    : overallStatus === 'ng'
    ? '要確認：記載が確認できない必須項目があります'
    : '要確認：判定できなかった項目があります';

  const counts = {
    found: results.filter(r => r.status === 'found').length,
    not_found: results.filter(r => r.status === 'not_found').length,
    unclear: results.filter(r => r.status === 'unclear').length
  };

  // 結果テーブル行
  const resultRows = results.map((r, i) => {
    const statusColor = r.status === 'found' ? '#16A34A' : r.status === 'not_found' ? '#DC2626' : '#D97706';
    const statusLabel = r.status === 'found' ? '✓ 記載あり' : r.status === 'not_found' ? '✗ 記載なし' : '? 判定不可';
    const requiredLabel = r.requiredType === 'mandatory' ? '必須' : r.requiredType === 'custom' ? 'カスタム' : '条件付き';
    const reqBg = r.requiredType === 'mandatory' ? '#DBEAFE' : r.requiredType === 'custom' ? '#E0E7FF' : '#FEF3C7';
    const reqColor = r.requiredType === 'mandatory' ? '#1E40AF' : r.requiredType === 'custom' ? '#3730A3' : '#92400E';

    let detailHtml = '';
    if ((r.status === 'not_found' || r.status === 'unclear') && (r.reason || r.suggestion)) {
      detailHtml = `<div style="margin-top:6px;padding:6px 10px;background:#F8FAFF;border-left:3px solid #2563EB;border-radius:0 4px 4px 0;font-size:11px;">
        ${r.reason ? `<p style="color:#6B7280;margin:2px 0;">理由: ${escapeReportHtml(r.reason)}</p>` : ''}
        ${r.suggestion ? `<p style="color:#111827;margin:2px 0;">改善案: ${escapeReportHtml(r.suggestion)}</p>` : ''}
      </div>`;
    }

    return `<tr style="background:${i % 2 === 0 ? '#fff' : '#F9FAFB'};">
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;">${i + 1}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;">
        ${escapeReportHtml(r.name)}
        ${detailHtml}
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;color:#6B7280;font-size:11px;">${escapeReportHtml(r.article || '')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;">
        <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${reqBg};color:${reqColor};">${requiredLabel}</span>
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;color:${statusColor};font-weight:600;">${statusLabel}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;color:#6B7280;font-size:11px;">${escapeReportHtml(r.note || '')}</td>
    </tr>`;
  }).join('');

  // NG表現テーブル
  let ngSection = '';
  if (Array.isArray(ng_expressions) && ng_expressions.length > 0) {
    const ngRows = ng_expressions.map(e => `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;">${escapeReportHtml(e.expression || '')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;">${escapeReportHtml(e.category_name || e.category_id || '')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;color:#6B7280;">${escapeReportHtml(e.location || '')}</td>
    </tr>`).join('');
    ngSection = `
      <div style="margin-top:24px;">
        <div style="padding:12px 18px;background:#FEE2E2;color:#B91C1C;border:1px solid #FECACA;border-radius:8px;font-weight:700;margin-bottom:12px;">
          NG表現検出：以下の表現に注意が必要です（${ng_expressions.length}件）
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#FEF2F2;">
              <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #FECACA;">検出表現</th>
              <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #FECACA;">カテゴリ</th>
              <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #FECACA;">場所</th>
            </tr>
          </thead>
          <tbody>${ngRows}</tbody>
        </table>
      </div>`;
  } else {
    ngSection = `
      <div style="margin-top:24px;padding:12px 18px;background:#DCFCE7;color:#15803D;border:1px solid #BBF7D0;border-radius:8px;font-weight:700;">
        NG表現なし：問題のある表現は検出されませんでした
      </div>`;
  }

  // 抽出テキスト
  const extractedSection = `
    <div style="margin-top:24px;">
      <h3 style="font-size:13px;font-weight:700;color:#2563EB;border-bottom:2px solid #2563EB;padding-bottom:4px;margin-bottom:8px;">AIが読み取ったテキスト</h3>
      <pre style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:8px;padding:12px;font-size:11px;font-family:'Courier New',monospace;white-space:pre-wrap;word-break:break-all;max-height:300px;overflow-y:auto;">${extracted_text ? escapeReportHtml(extracted_text) : '（テキストなし）'}</pre>
    </div>`;

  // 画像プレビュー
  const imageSection = imageDataUrl
    ? `<div style="margin-top:24px;">
        <h3 style="font-size:13px;font-weight:700;color:#2563EB;border-bottom:2px solid #2563EB;padding-bottom:4px;margin-bottom:8px;">チェック対象画像（1枚目）</h3>
        <img src="${imageDataUrl}" alt="チェック対象画像" style="max-width:400px;border:1px solid #E5E7EB;border-radius:8px;">
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>表記チェックレポート ${dateStr}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Hiragino Sans','Meiryo','Yu Gothic',sans-serif; background:#F3F4F6; color:#111827; font-size:13px; line-height:1.6; }
    .report-container { max-width:900px; margin:24px auto; background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08); padding:32px; }
    h1 { font-size:18px; font-weight:700; color:#2563EB; margin-bottom:4px; }
    h2 { font-size:15px; font-weight:700; color:#2563EB; border-bottom:2px solid #2563EB; padding-bottom:6px; margin-bottom:12px; }
    @media print {
      body { background:#fff; }
      .report-container { box-shadow:none; margin:0; padding:16px; max-width:100%; }
    }
  </style>
</head>
<body>
<div class="report-container">
  <h1>化粧品・医薬部外品 表記チェックレポート</h1>
  <p style="color:#6B7280;font-size:12px;margin-bottom:24px;">このレポートは自動生成されました。内容の最終判断は薬事専門家にご確認ください。</p>

  <!-- メタデータ -->
  <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px;padding:16px;margin-bottom:24px;">
    <h2 style="border-color:#BAE6FD;color:#075985;">チェック情報</h2>
    <table style="width:100%;font-size:12px;border-collapse:collapse;">
      <tr>
        <td style="padding:4px 8px;font-weight:700;color:#6B7280;width:140px;">チェック日時</td>
        <td style="padding:4px 8px;">${escapeReportHtml(dateStr)}</td>
        <td style="padding:4px 8px;font-weight:700;color:#6B7280;width:140px;">担当者名</td>
        <td style="padding:4px 8px;">${checkerName ? escapeReportHtml(checkerName) : '（未入力）'}</td>
      </tr>
      <tr>
        <td style="padding:4px 8px;font-weight:700;color:#6B7280;">カテゴリ</td>
        <td style="padding:4px 8px;">${escapeReportHtml(categoryLabel || category)}</td>
        <td style="padding:4px 8px;font-weight:700;color:#6B7280;">使用モデル</td>
        <td style="padding:4px 8px;">${escapeReportHtml(model || '―')}</td>
      </tr>
      <tr>
        <td style="padding:4px 8px;font-weight:700;color:#6B7280;">ルールバージョン</td>
        <td style="padding:4px 8px;" colspan="3">${escapeReportHtml(REPORT_RULE_VERSION)}</td>
      </tr>
    </table>
  </div>

  <!-- 判定バナー -->
  <div style="padding:14px 18px;background:${bannerColor};color:${bannerTextColor};border:1px solid ${bannerBorder};border-radius:8px;font-weight:700;font-size:15px;margin-bottom:16px;">
    ${bannerText}
  </div>

  <!-- 要約バッジ -->
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
    <span style="padding:6px 14px;border-radius:999px;font-size:13px;font-weight:700;background:#DCFCE7;color:#15803D;border:1px solid #BBF7D0;">✓ 記載あり ${counts.found}</span>
    <span style="padding:6px 14px;border-radius:999px;font-size:13px;font-weight:700;background:#FEE2E2;color:#B91C1C;border:1px solid #FECACA;">✗ 記載なし ${counts.not_found}</span>
    <span style="padding:6px 14px;border-radius:999px;font-size:13px;font-weight:700;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;">? 判定不可 ${counts.unclear}</span>
  </div>

  <!-- 結果テーブル -->
  <h2>チェック結果</h2>
  <div style="overflow-x:auto;margin-bottom:8px;">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="background:#F9FAFB;">
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E5E7EB;white-space:nowrap;">#</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E5E7EB;">項目名</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E5E7EB;white-space:nowrap;">根拠条文</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E5E7EB;white-space:nowrap;">区分</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E5E7EB;white-space:nowrap;">判定結果</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E5E7EB;">備考</th>
        </tr>
      </thead>
      <tbody>${resultRows}</tbody>
    </table>
  </div>

  ${ngSection}
  ${extractedSection}
  ${imageSection}

  <div style="margin-top:32px;padding:12px 16px;background:#FFF7ED;border-top:2px solid #FED7AA;border-radius:8px;font-size:11px;color:#92400E;line-height:1.7;">
    <strong style="display:block;font-size:12px;color:#78350F;margin-bottom:4px;">【免責事項】</strong>
    本ツールによる判定はAIによる参考情報です。最終的な薬機法への適合判断は、必ず薬事専門家または行政機関にご確認ください。当ツールの判定結果を根拠とした法的責任は負いかねます。
  </div>
</div>
</body>
</html>`;

  return html;
}

function downloadHtmlReport(data) {
  const html = generateHtmlReport(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const dt = new Date(data.timestamp || new Date().toISOString());
  const dateStr = `${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,'0')}${String(dt.getDate()).padStart(2,'0')}_${String(dt.getHours()).padStart(2,'0')}${String(dt.getMinutes()).padStart(2,'0')}`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `yakki_check_report_${dateStr}.html`;
  link.click();
  URL.revokeObjectURL(link.href);
}
