const STX_WASM_URL = (typeof window !== 'undefined' && typeof window.STX_WASM_URL_OVERRIDE === 'string' && window.STX_WASM_URL_OVERRIDE)
  ? window.STX_WASM_URL_OVERRIDE
  : '../assets/wasm/stx-deserializer.wasm';
const PARTS_DB = window.PARTS_DB;
const fileInput = document.getElementById('fileInput');
const modeSelect = document.getElementById('modeSelect');
const inputBox = document.getElementById('inputBox');
const decodeBtn = document.getElementById('decodeBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const statusEl = document.getElementById('status');
const resultsBody = document.getElementById('resultsBody');
const kTotal = document.getElementById('kTotal');
const kDecoded = document.getElementById('kDecoded');
const kResolved = document.getElementById('kResolved');
const kUnresolved = document.getElementById('kUnresolved');
const openEditorBtn = document.getElementById('openEditorBtn');
const sendFirstBtn = document.getElementById('sendFirstBtn');
const EDITOR_HANDOFF_KEY = 'STX_DECODER_TO_EDITOR_V1';
const EDITOR_PAGE = '../index.html';
let lastResults = [];
let bulkPageIndex = 0;
const BULK_PAGE_SIZE = 50;
let decoderReadyPromise = null;

/** Same tail fix as stx-decode-bridge-shared.ensureDoublePipeBeforePartTail (standalone page may load without bridge). */
function ensureDoublePipeBeforePartTailBulk(s) {
  s = String(s || '').trim();
  if (!s || s.indexOf('||') >= 0) return s;
  s = s.replace(/\|\s*(?=\{)/g, '|| ').replace(/\|\s*(?=")/g, '|| ');
  if (s.indexOf('||') >= 0) return s.replace(/\s+/g, ' ').trim();
  const m = s.match(/^([\s\S]+?)(\s+)(\{[\s\S]*)$/);
  if (m) {
    const head = m[1];
    if (/^[\d\s,|]+$/.test(head.replace(/\s+$/, ''))) {
      return (head + '||' + m[2] + m[3]).replace(/\s+/g, ' ').trim();
    }
  }
  return s.replace(/\s+/g, ' ').trim();
}

/** WASM rejects space-separated `{fam:[a b c]}`; use commas (same as stx-decode-bridge-shared). */
function normalizeDeserializedForWasmBulk(s) {
  if (typeof window.__stxNormalizeDeserializedInput === 'function') {
    return window.__stxNormalizeDeserializedInput(s);
  }
  const t = String(s || '').trim().replace(/^['"]|['"]$/g, '');
  if (!t || t.indexOf('@U') === 0) return s;
  const deserShape =
    t.indexOf('||') >= 0 ||
    /^\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|/.test(t) ||
    /^\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|[\s\S]*\{/.test(t);
  if (!deserShape) return s;

  let out = t.replace(/\[([^\]]*)\]/g, (full, inner) => {
    const parts = String(inner || '').trim().split(/\s+/).filter((x) => /^\d+$/.test(x));
    if (parts.length <= 1) return full;
    return '[' + parts.join(',') + ']';
  });

  out = ensureDoublePipeBeforePartTailBulk(out);
  return out.replace(/\s+/g, ' ').trim();
}

function status(msg, kind='') {
  if (!statusEl) return;
  statusEl.className = 'status' + (kind ? ' ' + kind : '');
  statusEl.textContent = msg;
}

function editorHandoffPayload(result) {
  return {
    ts: Date.now(),
    source: 'stx-offline-serial-decoder',
    input: String(result && result.input || '').trim(),
    deserialized: String(result && result.deserialized || '').trim(),
    itemTypeId: result && result.itemTypeId != null ? result.itemTypeId : null,
    itemId: result && result.itemId != null ? result.itemId : null,
    itemTitle: itemTitle(result),
    manufacturer: result && result.manufacturer || '',
    itemType: result && result.itemType || '',
    baseName: result && result.baseName || '',
    parts: Array.isArray(result && result.resolvedParts) ? result.resolvedParts : []
  };
}
function savePayloadForEditor(result) {
  const payload = editorHandoffPayload(result);
  localStorage.setItem(EDITOR_HANDOFF_KEY, JSON.stringify(payload));
  return payload;
}
function openEditorWithPayload(result, autoNavigate=true) {
  try {
    const payload = savePayloadForEditor(result);
    status('Sent "' + (payload.itemTitle || 'decoded item') + '" to the editor bridge.', 'good');
    if (autoNavigate) {
      try { window.location.href = EDITOR_PAGE + '#pasteCodeYAML'; } catch (_e) {}
    }
  } catch (err) {
    console.error(err);
    status('Could not send decoded item to the editor: ' + (err && err.message ? err.message : String(err)), 'bad');
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function canonicalType(type) {
  const raw = String(type || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const map = {
    'ps':'pistol','pistol':'pistol','sg':'shotgun','shotgun':'shotgun','sm':'smg','smg':'smg','sr':'sniper','sniper':'sniper','sniper rifle':'sniper',
    'ar':'assault rifle','assault rifle':'assault rifle','hw':'heavy weapon','heavy weapon':'heavy weapon','gr':'grenade','grenade':'grenade',
    'rk':'repkit','repkit':'repkit','repair kit':'repkit','cm':'class mod','class mod':'class mod','classmod':'class mod',
    'en':'enhancement','enhancement':'enhancement','enhancer':'enhancement','energy shield':'shield','armor shield':'shield','shield':'shield','firmware':'firmware'
  };
  return map[raw] || raw;
}
function titleLooksGeneric(name) {
  return /^part[_\.]/i.test(String(name || '').trim()) || /^[A-Z]{3,5}[_\.]/.test(String(name || '').trim());
}
function alphaManufacturer(alpha) {
  const m = String(alpha || '').match(/^([A-Z]{3})_/);
  const map = {DAD:'daedalus',JAK:'jakobs',MAL:'maliwan',ORD:'order',BOR:'ripper',TED:'tediore',TOR:'torgue',VLA:'vladof',ATL:'atlas',COV:'cov',HYP:'hyperion'};
  return m ? (map[m[1]] || '') : '';
}
function dedupeResolvedRows(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows || []) {
    const sig = [row.alpha_code || '', row.name || '', row.part_type || '', row.stats_text || '', row.effects_text || '', row.key || ''].join('||');
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(row);
  }
  return out;
}
function candidateScore(row, result) {
  let score = 0;
  const manu = String(result.manufacturer || '').toLowerCase();
  const itemType = canonicalType(result.itemType || '');
  const rowManu = String(row.manufacturer_or_group || '').toLowerCase();
  const rowType = canonicalType(row.weapon_type_or_category || '');
  const src = String(row.source || '');
  const alphaManu = alphaManufacturer(row.alpha_code || '');
  if (manu) {
    if (rowManu === manu) score += 10;
    else if (alphaManu === manu) score += 7;
    else if (String(row.context_path || '').toLowerCase().includes(manu)) score += 4;
  }
  if (itemType && rowType) {
    if (rowType === itemType) score += 8;
    else if (itemType === 'shield' && (rowType === 'armor shield' || rowType === 'energy shield')) score += 5;
  }
  if (row.stats_text) score += 2;
  if (row.effects_text) score += 1.2;
  if (row.part_type) score += 0.8;
  if (row.name && !titleLooksGeneric(row.name)) score += 1.3;
  if (row.alpha_code) score += 0.4;
  if (src === 'MASTER LIST.html') score -= 1.2;
  if (src === 'normalized_csv') score += 0.2;
  if (/Lookup Table|Weapon Parts List/.test(src)) score += 0.7;
  return score;
}
/** Lazy index of STX_DATASET.ALL_PARTS by idRaw — used when PARTS_DB has no row for a key. */
let __stxIdRawPartCache = null;
function stxPartToLookupRow(p) {
  const rawCode = p.code;
  const code = typeof rawCode === 'string' ? rawCode.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"') : '';
  return {
    manufacturer_or_group: p.manufacturer || '',
    weapon_type_or_category: p.itemType || p.category || '',
    part_type: p.partType || '',
    name: p.name || '',
    alpha_code: code,
    stats_text: p.stats || '',
    effects_text: '',
    context_path: 'stx_dataset > ' + (p.category || '') + ' > ' + String(p.idRaw || ''),
    source: 'stx_dataset'
  };
}
function resolveCandidatesFromStxDataset(key) {
  if (!key || !/^\d+:\d+$/.test(String(key))) return [];
  if (!__stxIdRawPartCache) {
    __stxIdRawPartCache = {};
    const ap = (typeof window !== 'undefined' && window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS))
      ? window.STX_DATASET.ALL_PARTS
      : [];
    for (let i = 0; i < ap.length; i++) {
      const p = ap[i];
      if (!p || p.idRaw == null) continue;
      const k = String(p.idRaw).trim();
      if (!/^\d+:\d+$/.test(k)) continue;
      if (!__stxIdRawPartCache[k]) __stxIdRawPartCache[k] = [];
      __stxIdRawPartCache[k].push(stxPartToLookupRow(p));
    }
  }
  return __stxIdRawPartCache[key] || [];
}
function resolveCandidates(key, result) {
  let rows = PARTS_DB[key] || [];
  if (!rows.length) rows = resolveCandidatesFromStxDataset(key);
  if (!rows.length) return rows;
  const scored = rows.slice().sort((a, b) => candidateScore(b, result) - candidateScore(a, result));
  return dedupeResolvedRows(scored);
}

/**
 * All lookup keys for one WASM part token (handles comma/space list brackets, {fam:idx}, bare {idx}).
 */
function collectPartLookupKeys(part, result) {
  const keys = [];
  const sub = part && part.subtype;
  const itemTypeId = result && result.itemTypeId;
  if ((sub === 'none' || sub == null || sub === '') && itemTypeId != null && part && part.index != null && part.index !== '') {
    keys.push(String(itemTypeId) + ':' + String(part.index));
  }
  if (sub === 'int' && part && part.value != null && part.index != null && part.index !== '') {
    keys.push(String(part.index) + ':' + String(part.value));
  }
  if (sub === 'list' && part && Array.isArray(part.values) && part.index != null) {
    for (const v of part.values) keys.push(String(part.index) + ':' + String(v));
  }
  const text = part && typeof part.text === 'string' ? part.text.trim() : '';
  if (text) {
    const listM = text.match(/^\{\s*(\d+)\s*:\s*\[([\d\s,]+)\]\s*\}$/);
    if (listM) {
      const idx = listM[1];
      for (const v of listM[2].split(/[\s,]+/).filter(Boolean)) {
        if (/^\d+$/.test(v)) keys.push(idx + ':' + v);
      }
    }
    const pairM = text.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
    if (pairM) keys.push(pairM[1] + ':' + pairM[2]);
    if (itemTypeId != null) {
      const bareM = text.match(/^\{\s*(\d+)\s*\}$/);
      if (bareM) keys.push(String(itemTypeId) + ':' + bareM[1]);
    }
  }
  const seen = new Set();
  const out = [];
  for (const k of keys) {
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}
function prettyPartTitle(p) {
  const n = String(p.name || '').trim();
  const a = String(p.alpha_code || '').trim();
  if (n && !titleLooksGeneric(n)) return n;
  if (a) return a;
  if (n) return n;
  return p.raw || 'Unknown part';
}
function resolveParts(result) {
  const out = [];
  let unresolved = 0;
  for (const part of (result.parts || [])) {
    const keys = collectPartLookupKeys(part, result);
    if (!keys.length) { out.push({ raw: part.text, unresolved: true }); unresolved++; continue; }
    let foundAny = false;
    for (const key of keys) {
      const choices = resolveCandidates(key, result);
      if (!choices.length) { out.push({ raw: part.text, key, unresolved: true }); unresolved++; continue; }
      foundAny = true;
      for (const choice of choices.slice(0, 2)) out.push(Object.assign({ raw: part.text, key }, choice));
    }
  }
  return { parts: dedupeResolvedRows(out), unresolved };
}
function itemTitle(result) {
  const bits = [];
  if (result.level != null) bits.push('L' + String(result.level));
  if (result.rarity) bits.push(result.rarity);
  bits.push(result.baseName || [result.manufacturer, result.itemType].filter(Boolean).join(' ') || (result.itemTypeId != null ? ('Family ' + result.itemTypeId) : 'Unlabelled item'));
  return bits.filter(Boolean).join(' ');
}
function noteSummary(result, resolved) {
  const notes = [];
  if (result.itemTypeId != null) notes.push('Family ' + String(result.itemTypeId));
  if (result.manufacturer || result.itemType) notes.push([result.manufacturer, result.itemType].filter(Boolean).join(' • '));
  if (resolved.unresolved) notes.push(String(resolved.unresolved) + ' unresolved part ref' + (resolved.unresolved === 1 ? '' : 's'));
  return notes.join(' • ');
}
function partMetaLine(p) {
  return [p.raw, p.key, p.manufacturer_or_group, p.weapon_type_or_category, p.part_type].filter(Boolean).join(' • ');
}
function partRefMetaHint(key) {
  if (!key || !window.PART_REF_META) return '';
  const k = String(key).trim();
  const m = window.PART_REF_META[k];
  if (!m) return '';
  const bits = [];
  if (m.source) bits.push('Ref: ' + m.source);
  if (m.note) bits.push(m.note);
  return bits.join(' · ');
}
function renderPartCard(p) {
  if (p.unresolved) {
    const hint = partRefMetaHint(p.key);
    const hintHtml = hint ? '<div class="small" style="color:var(--warn);margin-top:6px;">' + escapeHtml(hint) + '</div>' : '';
    return '<div class="part"><h4 class="bad">' + escapeHtml(p.raw) + '</h4><div class="meta">Unresolved' + (p.key ? ' • ' + escapeHtml(p.key) : '') + '</div>' + hintHtml + '</div>';
  }
  return '<div class="part"><h4>' + escapeHtml(prettyPartTitle(p)) + '</h4>' +
    '<div class="meta">' + escapeHtml(partMetaLine(p)) + '</div>' +
    (p.alpha_code ? '<div class="small"><code>' + escapeHtml(p.alpha_code) + '</code></div>' : '') +
    (p.stats_text ? '<div class="small">' + escapeHtml(p.stats_text) + '</div>' : '') +
    (p.effects_text ? '<div class="small">' + escapeHtml(p.effects_text) + '</div>' : '') +
    '</div>';
}
function enrichResultForUi(result) {
  const resolved = resolveParts(result);
  result.resolvedParts = resolved.parts;
  result.__resolvedUi = resolved;
  return resolved;
}
window.__stxEnrichDecodeResult = function (result) {
  if (!result || !result.success) return result;
  enrichResultForUi(result);
  return result;
};
function buildResultRowHtml(result, idx) {
  const resolved = result.__resolvedUi;
  const partsHtml = resolved.parts.length ? '<div class="details">' + resolved.parts.map(renderPartCard).join('') + '</div>' : '<span class="small">No parts found.</span>';
  const dropSource = (typeof window.CC_ITEMPOOL_DROP_CHECK !== 'undefined' && window.CC_ITEMPOOL_DROP_CHECK.getDropSource)
    ? window.CC_ITEMPOOL_DROP_CHECK.getDropSource(result, resolved.parts) : '—';
  return '<tr>' +
    '<td><strong>' + escapeHtml(itemTitle(result)) + '</strong><div class="chips">' +
    (result.success ? '<span class="chip good">decoded</span>' : '<span class="chip bad">failed</span>') +
    (result.itemTypeId != null ? '<span class="chip">family ' + escapeHtml(String(result.itemTypeId)) + '</span>' : '') +
    '</div></td>' +
    '<td><code>' + escapeHtml(result.input) + '</code></td>' +
    '<td>' + (result.success ? '<code>' + escapeHtml(result.deserialized || '') + '</code>' : '<span class="bad">' + escapeHtml(result.error || 'decode failed') + '</span>') + '</td>' +
    '<td>' + partsHtml + '</td>' +
    '<td><div class="small">' + escapeHtml(noteSummary(result, resolved)) + '</div></td>' +
    '<td><div class="small">' + escapeHtml(dropSource) + '</div></td>' +
    '<td>' + (result.success ? '<button class="secondary send-editor-btn" type="button" data-result-index="' + String(idx) + '">Send to editor</button>' : '<span class="small">—</span>') + '</td>' +
    '</tr>';
}
function applyKpisFromResults(results) {
  let decoded = 0, resolvedCount = 0, unresolvedCount = 0;
  for (const result of results) {
    const r = result.__resolvedUi;
    decoded += result.success ? 1 : 0;
    resolvedCount += r.parts.filter(p => !p.unresolved).length;
    unresolvedCount += r.unresolved;
  }
  kTotal.textContent = String(results.length);
  kDecoded.textContent = String(decoded);
  kResolved.textContent = String(resolvedCount);
  kUnresolved.textContent = String(unresolvedCount);
  if (sendFirstBtn) sendFirstBtn.disabled = !results.some(r => r && r.success && r.deserialized);
}
function renderResultsBody() {
  const results = lastResults;
  if (!results.length) return;
  const pageRow = document.getElementById('bulk-results-pagination');
  const pageInfo = document.getElementById('bulk-page-info');
  const prevB = document.getElementById('bulk-prev-btn');
  const nextB = document.getElementById('bulk-next-btn');
  if (pageRow) {
    if (results.length > BULK_PAGE_SIZE) {
      pageRow.style.display = 'flex';
      const tp = Math.ceil(results.length / BULK_PAGE_SIZE) || 1;
      if (bulkPageIndex >= tp) bulkPageIndex = Math.max(0, tp - 1);
      const start = bulkPageIndex * BULK_PAGE_SIZE;
      const end = Math.min(start + BULK_PAGE_SIZE, results.length);
      if (pageInfo) pageInfo.textContent = 'Showing ' + (start + 1) + '–' + end + ' of ' + results.length;
      if (prevB) prevB.disabled = bulkPageIndex <= 0;
      if (nextB) nextB.disabled = bulkPageIndex >= tp - 1;
    } else {
      pageRow.style.display = 'none';
    }
  }
  const start = bulkPageIndex * BULK_PAGE_SIZE;
  const slice = results.slice(start, start + BULK_PAGE_SIZE);
  const rows = [];
  for (let i = 0; i < slice.length; i++) rows.push(buildResultRowHtml(slice[i], start + i));
  resultsBody.innerHTML = rows.join('');
}
function render(results) {
  lastResults = results;
  bulkPageIndex = 0;
  exportBtn.disabled = !results.length;
  if (!results.length) {
    resultsBody.innerHTML = '<tr><td colspan="7" class="small">No results yet.</td></tr>';
    kTotal.textContent = '0'; kDecoded.textContent = '0'; kResolved.textContent = '0'; kUnresolved.textContent = '0';
    if (sendFirstBtn) sendFirstBtn.disabled = true;
    return;
  }
  for (const result of results) enrichResultForUi(result);
  applyKpisFromResults(results);
  renderResultsBody();
}
function uniqueSerials(arr) {
  const seen = new Set();
  const out = [];
  for (const value of (arr || [])) {
    const s = String(value == null ? '' : value).trim().replace(/^['"]|['"]$/g, '');
    if (!s) continue;
    if (!seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out;
}
function looksDeserializedStx(s) {
  const v = String(s || '').trim().replace(/^['"]|['"]$/g, '').replace(/^\uFEFF/, '');
  if (!v || v.startsWith('@U')) return false;
  if (v.includes('||') || /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|/.test(v)) return true;
  if (/^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|[\s\S]*\{/.test(v)) return true;
  return false;
}
function looksLikeRawBase85TokenStx(s) {
  const v = String(s || '').trim().replace(/^['"]|['"]$/g, '').replace(/^\uFEFF/, '');
  if (!v || v.length < 12 || v.startsWith('@U')) return false;
  if (looksDeserializedStx(v)) return false;
  if (/^\d+\s*,/.test(v)) return false;
  return /^[0-9A-Za-z!#$%&()*+;<=>?@^_`{|}~\/-]+$/.test(v);
}
/** Same rules as BulkSerialInputParse.extractStxTokenFromLine (BOM, # comments, TSV junk, quotes). */
function extractStxTokenFromLineBulk(line) {
  let trimmed = String(line || '').replace(/^\uFEFF/g, '').trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    trimmed = trimmed.slice(1, -1);
  }
  const mU = trimmed.match(/@U[^\s"'`,\]}]+/);
  if (mU) return mU[0];
  const mRB = trimmed.match(/(?:^|[\s:;,\t])([0-9A-Za-z!#$%&()*+;<=>?@^_`{|}~\/-]{14,})(?:\s|$)/);
  if (mRB && looksLikeRawBase85TokenStx(mRB[1])) return mRB[1];
  const mD = trimmed.match(/(\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|[\s\S]*)/);
  if (mD) {
    const cand = mD[1].trim().replace(/\s+#.*$/, '');
    if (looksDeserializedStx(cand)) return cand;
  }
  trimmed = trimmed.replace(/\s+#.*$/, '').trim();
  if (looksDeserializedStx(trimmed)) return trimmed;
  return null;
}
function detectMode(raw, filename='') {
  const name = String(filename || '').toLowerCase();
  if (name.endsWith('.yaml') || name.endsWith('.yml') || name.endsWith('.save')) return 'yaml';
  if (name.endsWith('.json')) return 'json';
  if (name.endsWith('.txt') || name.endsWith('.log')) return 'txt';
  const text = String(raw || '').trim();
  if (!text) return 'txt';
  if (/^\s*[{[]/.test(text)) return 'json';
  if (/(^|\n)\s*(?:-\s*)?serial\s*:\s*['"]?@U/m.test(text)) return 'yaml';
  if (/(^|\n)\s*[\w\-]+\s*:\s*/m.test(text) && /@U/.test(text)) return 'yaml';
  return 'txt';
}
function extractFromYaml(raw) {
  const text = String(raw || '').replace(/\r\n?/g, '\n');
  const out = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*(?:-\s*)?serial\s*:\s*(.*?)\s*$/i);
    if (!m) continue;
    let v = String(m[1] || '').trim();
    if (!v) continue;
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
      v = v.slice(1, -1);
    } else {
      v = v.replace(/\s+#.*$/, '').trim();
    }
    if (v.startsWith('@U') || looksDeserializedStx(v) || looksLikeRawBase85TokenStx(v)) out.push(v);
  }
  if (out.length) return uniqueSerials(out);
  const loose = text.match(/@U[^\s"'`,\]}]+/g) || [];
  if (loose.length) return uniqueSerials(loose);
  const fallback = [];
  for (const ln of text.split('\n')) {
    const t = extractStxTokenFromLineBulk(ln);
    if (t) fallback.push(t);
  }
  return uniqueSerials(fallback);
}
function extractJsonStrings(node, out) {
  if (node == null) return;
  if (typeof node === 'string') {
    const t = node.trim();
    if (t.startsWith('@U') || looksDeserializedStx(t) || looksLikeRawBase85TokenStx(t)) out.push(t);
    return;
  }
  if (Array.isArray(node)) { for (const item of node) extractJsonStrings(item, out); return; }
  if (typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      const k = String(key).toLowerCase();
      if (k === 'serial' && typeof value === 'string') out.push(value.trim());
      else if (k === 'serials' && Array.isArray(value)) extractJsonStrings(value, out);
      else extractJsonStrings(value, out);
    }
  }
}
function extractFromJson(raw) {
  const text = String(raw || '').trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    const out = [];
    extractJsonStrings(parsed, out);
    return uniqueSerials(out);
  } catch (err) {
    const matches = text.match(/@U[^\s"'`,\]}]+/g) || [];
    const lines = text.split(/\r?\n/);
    for (const ln of lines) {
      const tok = extractStxTokenFromLineBulk(ln);
      if (tok) matches.push(tok);
    }
    return uniqueSerials(matches);
  }
}
function extractFromTxt(raw) {
  const text = String(raw || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const out = [];
  for (const line of text.split('\n')) {
    const t = extractStxTokenFromLineBulk(line);
    if (t) out.push(t);
  }
  return uniqueSerials(out);
}
function stxFileProtocolWasmHelp() {
  return 'Cannot load WASM. If you removed assets/js/stx-wasm-inline.js, restore it by running: python tools/embed_stx_wasm.py (or use http://localhost with serve-local.bat).';
}
function wasmBytesFromInline() {
  const b64 = typeof window.STX_WASM_INLINE_B64 === 'string' ? window.STX_WASM_INLINE_B64 : '';
  if (!b64.length) return null;
  try {
    const binary = atob(b64);
    const len = binary.length;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch (e) {
    console.warn('STX inline WASM decode failed', e);
    return null;
  }
}
async function loadWasmBytes() {
  const fromInline = wasmBytesFromInline();
  if (fromInline) return fromInline;
  const url = STX_WASM_URL;
  try {
    const wasmResp = await fetch(url);
    if (!wasmResp.ok) throw new Error('HTTP ' + wasmResp.status);
    return new Uint8Array(await wasmResp.arrayBuffer());
  } catch (fetchErr) {
    if (location.protocol !== 'file:') throw fetchErr;
    try {
      const bytes = await new Promise(function (resolve, reject) {
        const x = new XMLHttpRequest();
        x.open('GET', url, true);
        x.responseType = 'arraybuffer';
        x.onload = function () {
          if (x.status === 0 || x.status === 200) resolve(new Uint8Array(x.response));
          else reject(new Error('XHR status ' + x.status));
        };
        x.onerror = function () { reject(new Error('XHR failed')); };
        x.send();
      });
      return bytes;
    } catch (_xhrErr) {
      const err = new Error(stxFileProtocolWasmHelp());
      err.cause = fetchErr;
      throw err;
    }
  }
}
async function initDecoder() {
  if (window.stxDecodeBulk && window.stxDecoderReady) return;
  if (!decoderReadyPromise) {
    decoderReadyPromise = (async () => {
      const go = new Go();
      const bytes = await loadWasmBytes();
      const result = await WebAssembly.instantiate(bytes.buffer, go.importObject);
      go.run(result.instance);
      await new Promise((resolve, reject) => {
        let tries = 0;
        const tick = () => {
          if (window.bl4DecodeBulk && window.bl4DecoderReady) {
            window.stxDecodeBulk = window.bl4DecodeBulk;
            window.stxDecoderReady = window.bl4DecoderReady;
            return resolve();
          }
          tries += 1;
          if (tries > 200) return reject(new Error('decoder did not initialize'));
          setTimeout(tick, 10);
        };
        tick();
      });
    })();
  }
  return decoderReadyPromise;
}
async function decodeCurrent(filename='') {
  const raw = inputBox.value;
  const mode = modeSelect.value === 'auto' ? detectMode(raw, filename) : modeSelect.value;
  const serials = mode === 'yaml' ? extractFromYaml(raw) : mode === 'json' ? extractFromJson(raw) : extractFromTxt(raw);
  if (!serials.length) { status('No serials found in the current input.', 'warn'); render([]); return; }
  status('Found ' + String(serials.length) + ' serials. Initializing decoder...');
  decodeBtn.disabled = true;
  try {
    await initDecoder();
    status('Decoder ready. Decoding ' + String(serials.length) + ' serials...');
    const forWasm = serials.map((x) => {
      const t = String(x == null ? '' : x).trim();
      if (looksLikeRawBase85TokenStx(t)) return '@U' + t;
      if (t.startsWith('@U')) return x;
      if (looksDeserializedStx(t)) {
        const n = normalizeDeserializedForWasmBulk(x);
        if (typeof window.__stxNicnlPackDeserialized === 'function') {
          try {
            const p = window.__stxNicnlPackDeserialized(n);
            if (p && p.startsWith('@U') && p.length > 6) return p;
          } catch (_e) {}
        }
        if (typeof window.serializeToBase85 === 'function') {
          try {
            const b = window.serializeToBase85(n, 17, false);
            if (b && b.startsWith('@U') && b.length > 6) return b;
          } catch (_e2) {}
        }
        return n;
      }
      return normalizeDeserializedForWasmBulk(x);
    });
    const results = JSON.parse(window.stxDecodeBulk(JSON.stringify(forWasm)) || '[]');
    render(results);
    status('Decoded ' + String(results.filter(r => r.success).length) + ' of ' + String(results.length) + ' serials locally.', 'good');
  } catch (err) {
    console.error(err);
    status('Decoder error: ' + (err && err.message ? err.message : String(err)), 'bad');
  } finally {
    decodeBtn.disabled = false;
  }
}
(function bindBulkDecoderUi(){
if (!(fileInput && decodeBtn && inputBox && clearBtn && exportBtn && resultsBody)) return;
fileInput.addEventListener('change', async ev => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  inputBox.value = await file.text();
  await decodeCurrent(file.name);
});
decodeBtn.addEventListener('click', () => decodeCurrent(fileInput.files && fileInput.files[0] ? fileInput.files[0].name : ''));

(function wireBulkPagination() {
  const prevB = document.getElementById('bulk-prev-btn');
  const nextB = document.getElementById('bulk-next-btn');
  if (prevB && !prevB._bulkPageBound) {
    prevB._bulkPageBound = true;
    prevB.addEventListener('click', function () {
      if (bulkPageIndex > 0) { bulkPageIndex--; renderResultsBody(); }
    });
  }
  if (nextB && !nextB._bulkPageBound) {
    nextB._bulkPageBound = true;
    nextB.addEventListener('click', function () {
      const n = lastResults.length;
      const tp = n ? Math.ceil(n / BULK_PAGE_SIZE) : 1;
      if (bulkPageIndex < tp - 1) { bulkPageIndex++; renderResultsBody(); }
    });
  }
})();

resultsBody.addEventListener('click', ev => {
  const btn = ev.target && ev.target.closest ? ev.target.closest('.send-editor-btn') : null;
  if (!btn) return;
  const index = Number(btn.getAttribute('data-result-index'));
  const result = lastResults[index];
  if (result && result.success && result.deserialized) openEditorWithPayload(result, true);
});
if (openEditorBtn) {
  openEditorBtn.addEventListener('click', () => {
    try { window.location.href = EDITOR_PAGE + '#pasteCodeYAML'; } catch (_e) {}
  });
}
if (sendFirstBtn) {
  sendFirstBtn.addEventListener('click', () => {
    const first = lastResults.find(r => r && r.success && r.deserialized);
    if (!first) { status('Decode at least one serial first.', 'warn'); return; }
    openEditorWithPayload(first, true);
  });
}

clearBtn.addEventListener('click', () => { inputBox.value = ''; fileInput.value = ''; render([]); status('Cleared.'); });
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(lastResults, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'stx-decoded-results.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
window.addEventListener('error', ev => {
  if (ev && ev.error && ev.error.message) status('Page error: ' + ev.error.message, 'bad');
});
status('Ready. Load a file or paste serials.');
})();