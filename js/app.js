const API_MODEL = 'claude-opus-4-7';
const STORAGE_KEY_HISTORY = 'yakki_checker_history';
const MAX_HISTORY = 50;
const MAX_IMAGE_PX = 1920;

let selectedImages = [];

// ── 初期化 ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  setupDropZone();
  setupFileInput();
  setupCheckButton();
  setupExportButton();
  setupClearImagesButton();
});

// ── 画像アップロード ─────────────────────────────────────────

function setupDropZone() {
  const zone = document.getElementById('dropZone');

  zone.addEventListener('click', () => document.getElementById('fileInput').click());

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    addImages(Array.from(e.dataTransfer.files));
  });
}

function setupFileInput() {
  document.getElementById('fileInput').addEventListener('change', e => {
    addImages(Array.from(e.target.files));
    e.target.value = '';
  });
}

function addImages(files) {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  imageFiles.forEach(file => {
    if (!selectedImages.find(img => img.name === file.name && img.size === file.size)) {
      selectedImages.push(file);
    }
  });
  renderPreviews();
  updateCheckButton();
}

function removeImage(index) {
  selectedImages.splice(index, 1);
  renderPreviews();
  updateCheckButton();
}

function clearImages() {
  selectedImages = [];
  renderPreviews();
  updateCheckButton();
}

function setupClearImagesButton() {
  document.getElementById('clearImagesBtn').addEventListener('click', clearImages);
}

function renderPreviews() {
  const container = document.getElementById('previewList');
  const clearBtn = document.getElementById('clearImagesBtn');

  container.innerHTML = '';
  clearBtn.style.display = selectedImages.length > 0 ? 'inline-block' : 'none';
  const countEl = document.getElementById('imageCount');
  countEl.textContent = selectedImages.length > 0 ? `${selectedImages.length}枚選択中` : '';

  selectedImages.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = e => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.innerHTML = `
        <img src="${e.target.result}" alt="${escapeHtml(file.name)}">
        <div class="preview-name">${escapeHtml(file.name)}</div>
        <button class="preview-remove" onclick="removeImage(${index})">×</button>
      `;
      container.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

// ── 画像リサイズ・Base64変換 ──────────────────────────────────

function resizeAndEncode(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_PX || height > MAX_IMAGE_PX) {
          const ratio = Math.min(MAX_IMAGE_PX / width, MAX_IMAGE_PX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({
          data: dataUrl.split(',')[1],
          media_type: 'image/jpeg'
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── チェック実行 ──────────────────────────────────────────────

function setupCheckButton() {
  document.getElementById('checkBtn').addEventListener('click', runCheck);
}

function updateCheckButton() {
  document.getElementById('checkBtn').disabled = selectedImages.length === 0;
}

async function runCheck() {
  if (selectedImages.length === 0) return showError('画像をアップロードしてください。');

  const category = document.querySelector('input[name="category"]:checked').value;

  setLoading(true);
  hideError();
  clearResultArea();

  try {
    const encodedImages = await Promise.all(selectedImages.map(resizeAndEncode));
    const prompt = buildPrompt(category);
    const response = await callAPI(encodedImages, prompt);
    const results = parseResponse(response, category);
    const overallStatus = calcOverallStatus(results);

    displayResults(results, overallStatus, category);
    saveHistory({ category, results, overallStatus, imageCount: selectedImages.length });
    loadHistory();
  } catch (err) {
    showError(errorMessage(err));
  } finally {
    setLoading(false);
  }
}

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

async function callAPI(images, promptText) {
  const imageContent = images.map(img => ({
    type: 'image',
    source: { type: 'base64', media_type: img.media_type, data: img.data }
  }));

  const body = {
    model: API_MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [...imageContent, { type: 'text', text: promptText }]
    }]
  };

  const res = await fetch('/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const apiErr = new Error(err.error?.message || `HTTP ${res.status}`);
    apiErr.status = res.status;
    throw apiErr;
  }

  return res.json();
}

function parseResponse(responseJson, category) {
  const text = responseJson.content?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AIの応答からJSONを取得できませんでした。');

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('AIの応答のJSONが解析できませんでした。');
  }

  const aiResults = parsed.results || [];

  return RULES[category].items.map(item => {
    const ai = aiResults.find(r => r.id === item.id) || {};
    return {
      id: item.id,
      name: item.name,
      article: item.article,
      required: item.required,
      requiredType: item.requiredType,
      status: ai.status || 'unclear',
      note: ai.note || ''
    };
  });
}

function calcOverallStatus(results) {
  const mandatoryResults = results.filter(r => r.requiredType === 'mandatory');
  if (mandatoryResults.some(r => r.status === 'not_found')) return 'ng';
  if (results.some(r => r.status === 'unclear')) return 'unclear';
  return 'ok';
}

function errorMessage(err) {
  if (err.status === 401) return 'APIキーが無効です。サーバーの ANTHROPIC_API_KEY 設定を確認してください。';
  if (err.status === 429) return 'APIの利用制限に達しました。しばらく時間をおいて再試行してください。';
  if (err.status >= 500) return 'サーバーエラーが発生しました。';
  if (!navigator.onLine) return 'インターネット接続を確認してください。';
  return `エラーが発生しました: ${err.message}`;
}

// ── 結果表示 ──────────────────────────────────────────────────

function displayResults(results, overallStatus, category) {
  const area = document.getElementById('resultArea');
  const rule = RULES[category];

  const bannerClass = overallStatus === 'ok' ? 'banner-ok' : overallStatus === 'ng' ? 'banner-ng' : 'banner-unclear';
  const bannerText = overallStatus === 'ok'
    ? '問題なし：必須項目の記載が全て確認されました'
    : overallStatus === 'ng'
    ? '要確認：記載が確認できない必須項目があります'
    : '要確認：判定できなかった項目があります';

  const rows = results.map((r, i) => {
    const statusClass = r.status === 'found' ? 'status-found' : r.status === 'not_found' ? 'status-not-found' : 'status-unclear';
    const statusLabel = r.status === 'found' ? '✓ 記載あり' : r.status === 'not_found' ? '✗ 記載なし' : '? 判定不可';
    const requiredLabel = r.requiredType === 'mandatory' ? '必須' : '条件付き';
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.name)}</td>
        <td class="article-col">${escapeHtml(r.article)}</td>
        <td><span class="required-badge ${r.requiredType === 'mandatory' ? 'badge-mandatory' : 'badge-conditional'}">${requiredLabel}</span></td>
        <td class="${statusClass}">${statusLabel}</td>
        <td class="note-col">${escapeHtml(r.note)}</td>
      </tr>`;
  }).join('');

  area.style.display = 'block';
  area.innerHTML = `
    <div class="result-banner ${bannerClass}">${bannerText}</div>
    <div class="result-meta">
      カテゴリ: ${escapeHtml(rule.label)}（${escapeHtml(rule.law)}）
    </div>
    <div class="table-wrapper">
      <table class="result-table">
        <thead>
          <tr>
            <th>#</th>
            <th>項目名</th>
            <th>根拠条文</th>
            <th>区分</th>
            <th>判定結果</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function clearResultArea() {
  const area = document.getElementById('resultArea');
  area.innerHTML = '';
  area.style.display = 'none';
}

// ── 履歴 ──────────────────────────────────────────────────────

function saveHistory(entry) {
  const histories = getHistories();
  const id = Date.now().toString();
  const record = {
    id,
    timestamp: new Date().toISOString(),
    category: entry.category,
    categoryLabel: RULES[entry.category].label,
    imageCount: entry.imageCount,
    overallStatus: entry.overallStatus,
    results: entry.results
  };
  histories.unshift(record);
  if (histories.length > MAX_HISTORY) histories.splice(MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(histories));
}

function getHistories() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]');
  } catch {
    return [];
  }
}

function loadHistory() {
  const histories = getHistories();
  const tbody = document.getElementById('historyBody');
  const exportBtn = document.getElementById('exportBtn');

  exportBtn.disabled = histories.length === 0;

  if (histories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-row">履歴はありません</td></tr>';
    return;
  }

  tbody.innerHTML = histories.map(h => {
    const dt = new Date(h.timestamp);
    const dateStr = `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
    const statusClass = h.overallStatus === 'ok' ? 'status-found' : 'status-not-found';
    const statusLabel = h.overallStatus === 'ok' ? '問題なし' : '要確認';
    return `
      <tr class="history-row" onclick="showHistoryDetail('${h.id}')">
        <td>${dateStr}</td>
        <td>${escapeHtml(h.categoryLabel)}</td>
        <td>${h.imageCount}枚</td>
        <td class="${statusClass}">${statusLabel}</td>
        <td><button class="detail-btn" onclick="showHistoryDetail('${h.id}'); event.stopPropagation()">詳細</button></td>
      </tr>`;
  }).join('');
}

function showHistoryDetail(id) {
  const histories = getHistories();
  const record = histories.find(h => h.id === id);
  if (!record) return;
  displayResults(record.results, record.overallStatus, record.category);
  document.getElementById('resultArea').scrollIntoView({ behavior: 'smooth' });
}

// ── CSVエクスポート ───────────────────────────────────────────

function setupExportButton() {
  document.getElementById('exportBtn').addEventListener('click', exportCSV);
}

function exportCSV() {
  const histories = getHistories();
  if (histories.length === 0) return;

  const allItemIds = [...new Set(histories.flatMap(h => h.results.map(r => r.id)))];
  const itemNames = {};
  histories.forEach(h => h.results.forEach(r => { itemNames[r.id] = r.name; }));

  const statusLabel = s => s === 'found' ? '記載あり' : s === 'not_found' ? '記載なし' : '判定不可';
  const overallLabel = s => s === 'ok' ? '問題なし' : '要確認';

  const headers = ['チェック日時', 'カテゴリ', '画像枚数', '全体判定', ...allItemIds.map(id => itemNames[id])];

  const rows = histories.map(h => {
    const dt = new Date(h.timestamp);
    const dateStr = `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
    const itemCols = allItemIds.map(id => {
      const r = h.results.find(r => r.id === id);
      return r ? statusLabel(r.status) : '';
    });
    return [dateStr, h.categoryLabel, `${h.imageCount}枚`, overallLabel(h.overallStatus), ...itemCols];
  });

  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const bom = '﻿';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `yakki_check_history_${dateStr}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ── ユーティリティ ────────────────────────────────────────────

function setLoading(active) {
  const btn = document.getElementById('checkBtn');
  const spinner = document.getElementById('spinner');
  btn.disabled = active || selectedImages.length === 0;
  btn.textContent = active ? '確認中...' : 'チェック実行';
  spinner.style.display = active ? 'block' : 'none';
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError() {
  document.getElementById('errorMsg').style.display = 'none';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
