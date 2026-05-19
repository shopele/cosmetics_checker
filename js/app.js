const DEFAULT_API_MODEL = 'claude-opus-4-7';
const STORAGE_KEY_HISTORY = 'yakki_checker_history';
const STORAGE_KEY_MODEL = 'yakki_checker_model';
const STORAGE_KEY_CUSTOM_ITEMS = 'yakki_checker_custom_items';
const SESSION_KEY_RUNNING = 'yakki_checker_running';
const MAX_HISTORY = 50;
const MAX_IMAGE_PX = 1600;

// 利用可能なモデル（簡易価格表: USD per 1M tokens）
const MODELS = {
  'claude-opus-4-7':    { label: 'Opus 4.7（精度重視）',    input: 15,   output: 75   },
  'claude-sonnet-4-5':  { label: 'Sonnet 4.5（バランス）',  input: 3,    output: 15   },
  'claude-haiku-4-5':   { label: 'Haiku 4.5（速度重視）',   input: 1,    output: 5    }
};

function getSelectedModel() {
  const stored = localStorage.getItem(STORAGE_KEY_MODEL);
  if (stored && MODELS[stored]) return stored;
  return DEFAULT_API_MODEL;
}

function setSelectedModel(model) {
  if (MODELS[model]) localStorage.setItem(STORAGE_KEY_MODEL, model);
}

// 元ファイルサイズに応じた JPEG 品質
function jpegQualityForSize(byteSize) {
  if (byteSize < 1 * 1024 * 1024) return 0.85;
  if (byteSize < 3 * 1024 * 1024) return 0.75;
  return 0.65;
}

let selectedImages = [];
// 直近のチェック結果（unclear 再チェック用に保持）
let lastResults = null;
let lastCategory = null;
let lastHistoryId = null;

// ── 初期化 ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // 前回のページクラッシュ等で残った実行中フラグをクリア
  sessionStorage.removeItem(SESSION_KEY_RUNNING);

  applyTouchDeviceText();
  setupModelSelector();
  setupHistoryFilters();
  loadHistory();
  setupDropZone();
  setupFileInput();
  setupCheckButton();
  setupExportButton();
  setupClearImagesButton();
  registerServiceWorker();
});

// タッチデバイス用のドロップゾーン文言切り替え
function applyTouchDeviceText() {
  const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || matchMedia('(hover: none)').matches;
  const zone = document.getElementById('dropZone');
  if (!zone) return;
  if (isTouch) {
    const p = zone.querySelector('p');
    const span = zone.querySelector('span');
    if (p) p.textContent = 'タップして画像を選択';
    if (span) span.textContent = '複数枚選択可（外箱・本体・各面など）';
    zone.classList.add('touch-device');
  }
}

function setupModelSelector() {
  const sel = document.getElementById('modelSelect');
  if (!sel) return;
  // option を構築
  sel.innerHTML = Object.entries(MODELS).map(([id, m]) =>
    `<option value="${id}">${m.label}</option>`
  ).join('');
  sel.value = getSelectedModel();
  sel.addEventListener('change', () => setSelectedModel(sel.value));
}

// Service Worker（オフライン対応）
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* 静かに無視 */ });
    });
  }
}

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

// JPEG の EXIF Orientation を読み取る（1〜8, 1=正常）
function readExifOrientation(arrayBuffer) {
  try {
    const view = new DataView(arrayBuffer);
    if (view.getUint16(0) !== 0xFFD8) return 1; // not JPEG
    const len = view.byteLength;
    let offset = 2;
    while (offset < len) {
      if (offset + 2 > len) break;
      const marker = view.getUint16(offset);
      offset += 2;
      if (marker === 0xFFE1) {
        if (view.getUint32(offset + 2) !== 0x45786966) return 1;
        const little = view.getUint16(offset + 8) === 0x4949;
        const ifdOffset = view.getUint32(offset + 12, little);
        const tagBase = offset + 8;
        const tags = view.getUint16(tagBase + ifdOffset, little);
        for (let i = 0; i < tags; i++) {
          const entry = tagBase + ifdOffset + 2 + i * 12;
          if (view.getUint16(entry, little) === 0x0112) {
            return view.getUint16(entry + 8, little);
          }
        }
        break;
      } else if ((marker & 0xFF00) !== 0xFF00) {
        break;
      } else {
        offset += view.getUint16(offset);
      }
    }
  } catch { /* ignore */ }
  return 1;
}

function applyOrientationToCanvas(ctx, orientation, w, h) {
  switch (orientation) {
    case 2: ctx.translate(w, 0); ctx.scale(-1, 1); break;
    case 3: ctx.translate(w, h); ctx.rotate(Math.PI); break;
    case 4: ctx.translate(0, h); ctx.scale(1, -1); break;
    case 5: ctx.rotate(0.5 * Math.PI); ctx.scale(1, -1); break;
    case 6: ctx.rotate(0.5 * Math.PI); ctx.translate(0, -h); break;
    case 7: ctx.rotate(0.5 * Math.PI); ctx.translate(w, -h); ctx.scale(-1, 1); break;
    case 8: ctx.rotate(-0.5 * Math.PI); ctx.translate(-w, 0); break;
    default: break;
  }
}

function resizeAndEncode(file) {
  return new Promise((resolve, reject) => {
    const quality = jpegQualityForSize(file.size);
    // EXIF 用に ArrayBuffer を先読み
    const bufReader = new FileReader();
    bufReader.onload = bufEvt => {
      const orientation = file.type === 'image/jpeg' ? readExifOrientation(bufEvt.target.result) : 1;

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
          const swap = orientation >= 5 && orientation <= 8;
          canvas.width = swap ? height : width;
          canvas.height = swap ? width : height;
          const ctx = canvas.getContext('2d');
          applyOrientationToCanvas(ctx, orientation, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
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
    };
    bufReader.onerror = reject;
    bufReader.readAsArrayBuffer(file);
  });
}

// ── チェック実行 ──────────────────────────────────────────────

function setupCheckButton() {
  document.getElementById('checkBtn').addEventListener('click', () => {
    if (sessionStorage.getItem(SESSION_KEY_RUNNING)) {
      showError('チェックが実行中です。完了までお待ちください。');
      return;
    }
    runCheck();
  });
}

function updateCheckButton() {
  document.getElementById('checkBtn').disabled = selectedImages.length === 0;
}

async function runCheck() {
  if (selectedImages.length === 0) return showError('画像をアップロードしてください。');

  const category = document.querySelector('input[name="category"]:checked').value;

  sessionStorage.setItem(SESSION_KEY_RUNNING, '1');
  setLoading(true);
  hideError();
  clearResultArea();

  try {
    const encodedImages = await Promise.all(selectedImages.map(resizeAndEncode));
    const prompt = buildPrompt(category);
    const response = await callAPI(encodedImages, prompt);
    const results = parseResponse(response, category);
    const overallStatus = calcOverallStatus(results);
    const usage = response.usage || null;
    const model = response.model || getSelectedModel();

    lastResults = results;
    lastCategory = category;
    lastHistoryId = saveHistory({ category, results, overallStatus, imageCount: selectedImages.length, usage, model });

    displayResults(results, overallStatus, category, { usage, model, historyId: lastHistoryId });
    loadHistory();
  } catch (err) {
    showError(errorMessage(err));
  } finally {
    sessionStorage.removeItem(SESSION_KEY_RUNNING);
    setLoading(false);
  }
}

// ── unclear 項目の個別再チェック ─────────────────────────────
async function reCheckUnclearItems() {
  if (!lastResults || !lastCategory) return;
  const unclearItems = lastResults.filter(r => r.status === 'unclear');
  if (unclearItems.length === 0) return;
  if (selectedImages.length === 0) {
    showError('再チェックには元の画像が必要です。画像を再度アップロードしてください。');
    return;
  }
  if (sessionStorage.getItem(SESSION_KEY_RUNNING)) {
    showError('チェックが実行中です。完了までお待ちください。');
    return;
  }

  sessionStorage.setItem(SESSION_KEY_RUNNING, '1');
  setLoading(true);
  hideError();

  try {
    const encodedImages = await Promise.all(selectedImages.map(resizeAndEncode));
    const prompt = buildPromptForItems(lastCategory, unclearItems);
    const response = await callAPI(encodedImages, prompt);
    const reResults = parseResponse(response, lastCategory);

    // unclear だった項目だけを上書き
    const unclearIds = new Set(unclearItems.map(i => i.id));
    const merged = lastResults.map(r => {
      if (!unclearIds.has(r.id)) return r;
      const re = reResults.find(rr => rr.id === r.id);
      return re ? { ...r, status: re.status, note: re.note } : r;
    });

    const overallStatus = calcOverallStatus(merged);
    lastResults = merged;

    // 履歴を上書き保存
    updateHistory(lastHistoryId, { results: merged, overallStatus });

    displayResults(merged, overallStatus, lastCategory);
    loadHistory();
  } catch (err) {
    showError(errorMessage(err));
  } finally {
    sessionStorage.removeItem(SESSION_KEY_RUNNING);
    setLoading(false);
  }
}

// カスタムチェック項目（社内基準）の取得
function getCustomItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_ITEMS) || '[]');
  } catch {
    return [];
  }
}

function setCustomItems(items) {
  localStorage.setItem(STORAGE_KEY_CUSTOM_ITEMS, JSON.stringify(items));
}

// ルール項目 + カスタム項目をまとめて取得
function getAllItems(category) {
  const baseItems = RULES[category].items;
  const customItems = getCustomItems().map(c => ({
    id: c.id,
    name: c.name,
    article: '社内基準',
    required: 'カスタム',
    requiredType: 'custom'
  }));
  return [...baseItems, ...customItems];
}

function buildPrompt(category) {
  const rule = RULES[category];
  const allItems = getAllItems(category);
  const itemsJson = JSON.stringify(
    allItems.map(item => ({ id: item.id, name: item.name })),
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

// 指定された項目だけを対象にしたプロンプトを組み立てる（unclear 再チェック用）
function buildPromptForItems(category, items) {
  const rule = RULES[category];
  const itemsJson = JSON.stringify(
    items.map(item => ({ id: item.id, name: item.name })),
    null, 2
  );

  return `あなたは薬機法の表記チェックを行うアシスタントです。
以下の画像（製品パッケージの複数面）を見て、指定の項目だけを丁寧に再判定してください。
前回 unclear（判定不可）だった項目です。画像の細部を注意深く確認してください。

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

再チェック対象項目：
${itemsJson}`;
}

async function callAPI(images, promptText) {
  const imageContent = images.map(img => ({
    type: 'image',
    source: { type: 'base64', media_type: img.media_type, data: img.data }
  }));

  const body = {
    model: getSelectedModel(),
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
  const allItems = getAllItems(category);

  return allItems.map(item => {
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
  if (!navigator.onLine) return 'インターネット接続を確認してください。';
  if (err.status === 401) return 'APIキーが無効です。サーバーの ANTHROPIC_API_KEY 設定を確認してください。';
  if (err.status === 413) return '画像データが大きすぎます。画像枚数を減らすか、より小さい画像を使用してください。';
  if (err.status === 429) return '送信回数の制限に達しました。1分ほど待ってから再試行してください。';
  if (err.status === 529) return 'AIサービスが混雑しています。しばらく待ってから再試行してください。';
  if (err.status >= 500) return 'サーバーエラーが発生しました。しばらく待ってから再試行してください。';
  return `エラーが発生しました: ${err.message}`;
}

// ── 結果表示 ──────────────────────────────────────────────────

function displayResults(results, overallStatus, category, opts = {}) {
  const area = document.getElementById('resultArea');
  const rule = RULES[category];

  const bannerClass = overallStatus === 'ok' ? 'banner-ok' : overallStatus === 'ng' ? 'banner-ng' : 'banner-unclear';
  const bannerText = overallStatus === 'ok'
    ? '問題なし：必須項目の記載が全て確認されました'
    : overallStatus === 'ng'
    ? '要確認：記載が確認できない必須項目があります'
    : '要確認：判定できなかった項目があります';

  // 要約バッジ
  const counts = {
    found: results.filter(r => r.status === 'found').length,
    not_found: results.filter(r => r.status === 'not_found').length,
    unclear: results.filter(r => r.status === 'unclear').length
  };
  const summaryBadges = `
    <div class="summary-badges">
      <span class="sum-badge sum-ok">✓ 記載あり ${counts.found}</span>
      <span class="sum-badge sum-ng">✗ 記載なし ${counts.not_found}</span>
      <span class="sum-badge sum-unclear">? 判定不可 ${counts.unclear}</span>
    </div>`;

  const rows = results.map((r, i) => {
    const statusClass = r.status === 'found' ? 'status-found' : r.status === 'not_found' ? 'status-not-found' : 'status-unclear';
    const statusLabel = r.status === 'found' ? '✓ 記載あり' : r.status === 'not_found' ? '✗ 記載なし' : '? 判定不可';
    const requiredLabel = r.requiredType === 'mandatory' ? '必須' : r.requiredType === 'custom' ? 'カスタム' : '条件付き';
    const badgeClass = r.requiredType === 'mandatory' ? 'badge-mandatory' : r.requiredType === 'custom' ? 'badge-custom' : 'badge-conditional';
    return `
      <tr>
        <td data-label="#">${i + 1}</td>
        <td data-label="項目名">${escapeHtml(r.name)}</td>
        <td class="article-col" data-label="根拠条文">${escapeHtml(r.article)}</td>
        <td data-label="区分"><span class="required-badge ${badgeClass}">${requiredLabel}</span></td>
        <td class="${statusClass}" data-label="判定">${statusLabel}</td>
        <td class="note-col" data-label="備考">${escapeHtml(r.note)}</td>
      </tr>`;
  }).join('');

  // 再チェックボタン
  const reCheckBtn = counts.unclear > 0
    ? `<button class="btn btn-secondary" id="reCheckBtn">? 判定不可項目を再チェック（${counts.unclear}件）</button>`
    : '';

  // メモエリア
  const historyId = opts.historyId || lastHistoryId;
  const currentMemo = historyId ? (getHistories().find(h => h.id === historyId)?.memo || '') : '';
  const memoArea = historyId ? `
    <div class="memo-area no-print">
      <label for="memoInput" class="memo-label">メモ（社内向け）</label>
      <textarea id="memoInput" rows="2" placeholder="例: 実物確認済み / 要修正 等">${escapeHtml(currentMemo)}</textarea>
    </div>` : '';

  // コスト表示
  const usage = opts.usage;
  const model = opts.model || getSelectedModel();
  const costInfo = usage ? renderCostInfo(usage, model) : '';

  area.style.display = 'block';
  area.innerHTML = `
    <div class="result-banner ${bannerClass}">${bannerText}</div>
    ${summaryBadges}
    <div class="result-meta">
      カテゴリ: ${escapeHtml(rule.label)}（${escapeHtml(rule.law)}）
      ${model ? ` ／ モデル: ${escapeHtml(MODELS[model]?.label || model)}` : ''}
    </div>
    ${costInfo}
    <div class="result-actions no-print">
      ${reCheckBtn}
      <button class="btn btn-secondary" id="printBtn">🖨 印刷 / PDF保存</button>
    </div>
    ${memoArea}
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

  // 後付けイベント
  const reBtn = document.getElementById('reCheckBtn');
  if (reBtn) reBtn.addEventListener('click', reCheckUnclearItems);
  const prBtn = document.getElementById('printBtn');
  if (prBtn) prBtn.addEventListener('click', () => window.print());
  const memoInput = document.getElementById('memoInput');
  if (memoInput && historyId) {
    memoInput.addEventListener('input', () => {
      updateHistory(historyId, { memo: memoInput.value });
    });
  }
}

function renderCostInfo(usage, model) {
  const m = MODELS[model];
  if (!m || !usage) return '';
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const costUsd = (inputTokens / 1_000_000) * m.input + (outputTokens / 1_000_000) * m.output;
  const costJpy = costUsd * 155; // 概算レート
  return `
    <div class="cost-info">
      利用トークン: 入力 ${inputTokens.toLocaleString()} / 出力 ${outputTokens.toLocaleString()}
      ／ 概算コスト: $${costUsd.toFixed(4)}（約 ¥${costJpy.toFixed(2)}）
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
    results: entry.results,
    memo: '',
    usage: entry.usage || null,
    model: entry.model || null
  };
  histories.unshift(record);
  if (histories.length > MAX_HISTORY) histories.splice(MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(histories));
  return id;
}

function updateHistory(id, patch) {
  if (!id) return;
  const histories = getHistories();
  const idx = histories.findIndex(h => h.id === id);
  if (idx === -1) return;
  histories[idx] = { ...histories[idx], ...patch };
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(histories));
}

function getHistories() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]');
  } catch {
    return [];
  }
}

function setupHistoryFilters() {
  ['filterCategory', 'filterStatus', 'filterDateFrom', 'filterDateTo', 'filterKeyword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', loadHistory);
    if (el) el.addEventListener('change', loadHistory);
  });
  const clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    ['filterCategory', 'filterStatus', 'filterDateFrom', 'filterDateTo', 'filterKeyword'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'SELECT') el.value = '';
      else el.value = '';
    });
    loadHistory();
  });
}

function filterHistories(histories) {
  const cat = document.getElementById('filterCategory')?.value || '';
  const st = document.getElementById('filterStatus')?.value || '';
  const from = document.getElementById('filterDateFrom')?.value || '';
  const to = document.getElementById('filterDateTo')?.value || '';
  const kw = (document.getElementById('filterKeyword')?.value || '').trim().toLowerCase();

  return histories.filter(h => {
    if (cat && h.category !== cat) return false;
    if (st && h.overallStatus !== st) return false;
    if (from) {
      if (new Date(h.timestamp) < new Date(from + 'T00:00:00')) return false;
    }
    if (to) {
      if (new Date(h.timestamp) > new Date(to + 'T23:59:59')) return false;
    }
    if (kw) {
      const hay = (h.categoryLabel + ' ' + (h.memo || '')).toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
}

function loadHistory() {
  const all = getHistories();
  const histories = filterHistories(all);
  const tbody = document.getElementById('historyBody');
  const exportBtn = document.getElementById('exportBtn');

  exportBtn.disabled = all.length === 0;

  if (histories.length === 0) {
    const msg = all.length === 0 ? '履歴はありません' : '条件に一致する履歴はありません';
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">${msg}</td></tr>`;
    return;
  }

  tbody.innerHTML = histories.map(h => {
    const dt = new Date(h.timestamp);
    const dateStr = `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
    const statusClass = h.overallStatus === 'ok' ? 'status-found' : 'status-not-found';
    const statusLabel = h.overallStatus === 'ok' ? '問題なし' : '要確認';
    const memoPreview = h.memo ? escapeHtml(h.memo.slice(0, 30)) + (h.memo.length > 30 ? '…' : '') : '';
    return `
      <tr class="history-row" onclick="showHistoryDetail('${h.id}')">
        <td data-label="日時">${dateStr}</td>
        <td data-label="カテゴリ">${escapeHtml(h.categoryLabel)}</td>
        <td data-label="画像">${h.imageCount}枚</td>
        <td class="${statusClass}" data-label="判定">${statusLabel}</td>
        <td data-label="メモ" class="note-col">${memoPreview}</td>
        <td data-label="詳細"><button class="detail-btn" onclick="showHistoryDetail('${h.id}'); event.stopPropagation()">詳細</button></td>
      </tr>`;
  }).join('');
}

function showHistoryDetail(id) {
  const histories = getHistories();
  const record = histories.find(h => h.id === id);
  if (!record) return;
  lastResults = record.results;
  lastCategory = record.category;
  lastHistoryId = record.id;
  displayResults(record.results, record.overallStatus, record.category, {
    usage: record.usage,
    model: record.model,
    historyId: record.id
  });
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

  const headers = ['チェック日時', 'カテゴリ', '画像枚数', '全体判定', 'メモ', ...allItemIds.map(id => itemNames[id])];

  const rows = histories.map(h => {
    const dt = new Date(h.timestamp);
    const dateStr = `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
    const itemCols = allItemIds.map(id => {
      const r = h.results.find(r => r.id === id);
      return r ? statusLabel(r.status) : '';
    });
    return [dateStr, h.categoryLabel, `${h.imageCount}枚`, overallLabel(h.overallStatus), h.memo || '', ...itemCols];
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

// ── カスタム項目管理 ─────────────────────────────────────────

function renderCustomItemsUI() {
  const list = document.getElementById('customItemsList');
  if (!list) return;
  const items = getCustomItems();
  if (items.length === 0) {
    list.innerHTML = '<div class="hint">カスタム項目はありません</div>';
    return;
  }
  list.innerHTML = items.map((it, i) => `
    <div class="custom-item-row">
      <span>${escapeHtml(it.name)}</span>
      <button class="btn btn-ghost" data-idx="${i}">✕ 削除</button>
    </div>
  `).join('');
  list.querySelectorAll('button[data-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      const arr = getCustomItems();
      arr.splice(idx, 1);
      setCustomItems(arr);
      renderCustomItemsUI();
    });
  });
}

function setupCustomItemsUI() {
  const toggle = document.getElementById('customItemsToggle');
  const panel = document.getElementById('customItemsPanel');
  const addBtn = document.getElementById('addCustomItemBtn');
  const input = document.getElementById('customItemInput');
  if (!toggle || !panel || !addBtn || !input) return;

  toggle.addEventListener('click', () => {
    const visible = panel.style.display !== 'none';
    panel.style.display = visible ? 'none' : 'block';
    if (!visible) renderCustomItemsUI();
  });

  addBtn.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) return;
    const items = getCustomItems();
    items.push({ id: 'custom_' + Date.now(), name });
    setCustomItems(items);
    input.value = '';
    renderCustomItemsUI();
  });
}

// 初期化に組み込み
document.addEventListener('DOMContentLoaded', setupCustomItemsUI);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
