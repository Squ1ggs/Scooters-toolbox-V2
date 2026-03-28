/**
 * cc-build-stats-rebuild.js
 * Build Stats (Core Snapshot) for Scooter's Toolbox Rebuild.
 * Provides accumulateFromSelected() to compute estimated multipliers from resolved part stats.
 *
 * Alternative: all_parts_stats_vd49.xlsx has structured stats (part_code, bucket, stat_value, combine, invert).
 * Run scripts/build_parts_stats_from_excel.py to export to assets/data/parts_stats.json.
 * Integration would need a part_code mapping (Excel uses "bor_hw.part_barrel_01", we use idRaw "254:10").
 */
(function () {
  'use strict';
  if (window.__ccBuildStatsRebuildV1) return;
  window.__ccBuildStatsRebuildV1 = true;

  function byId(id) { try { return document.getElementById(id); } catch (_) { return null; } }
  function q(s) { return String(s == null ? '' : s).trim(); }

  function addRefsFromText(text, refs) {
    var s = String(text || '');
    var ms = s.match(/\b\d{1,6}:\d{1,6}\b/g);
    if (ms) ms.forEach(function (r) { refs.add(r); });
    var braceMs = s.match(/\{\s*(\d{1,6})\s*:\s*(\d{1,6})\s*\}/g);
    if (braceMs) braceMs.forEach(function (b) {
      var m = b.match(/\{\s*(\d+)\s*:\s*(\d+)\s*\}/);
      if (m) refs.add(m[1] + ':' + m[2]);
    });
    try {
      var reQuoted = /"([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)"/g;
      var m;
      while ((m = reQuoted.exec(s)) !== null) {
        var tok = q(m[1]);
        if (tok) refs.add(tok);
      }
    } catch (_) {}
    var reList = /\{(\d{1,6})\s*:\s*\[\s*([0-9,\s]+)\s*\]\s*\}/g;
    var m2;
    while ((m2 = reList.exec(s)) !== null) {
      var fam = m2[1];
      var list = String(m2[2] || '').replace(/,/g, ' ').trim().split(/\s+/).filter(Boolean);
      for (var i = 0; i < list.length; i++) {
        if (/^\d{1,6}$/.test(list[i])) refs.add(fam + ':' + list[i]);
      }
    }
  }

  function stripQuotes(s) { return q(s).replace(/^"+|"+$/g, ''); }

  function resolvePart(ref) {
    if (!ref) return null;
    var code = typeof ref === 'string' ? stripQuotes(ref) : (ref.idRaw || ref.code || ref.spawnCode || '');
    if (!code) return null;
    try {
      if (typeof window.__lookupPartByImportCode === 'function') {
        var p = window.__lookupPartByImportCode(code);
        if (p) return p;
      }
    } catch (_) {}
    var all = (window.STX_DATASET && window.STX_DATASET.ALL_PARTS) ? window.STX_DATASET.ALL_PARTS : [];
    var norm = function (x) { return String(x || '').replace(/^"+|"+$/g, '').trim(); };
    var t = norm(code);
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p) continue;
      if (norm(p.idRaw || p.idraw || '') === t) return p;
      if (/^\d+$/.test(t) && Number(p.id) === Number(t)) return p;
      if (norm(p.code) === norm(t)) return p;
      var m = t.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);
      if (m && p.family != null && p.id != null && Number(m[1]) === Number(p.family) && Number(m[2]) === Number(p.id)) return p;
    }
    return null;
  }

  function displayStatsFor(part) {
    try {
      var p = (typeof resolvePart === 'function' ? resolvePart(part) : part) || part;
      if (p && typeof p.stats === 'string' && p.stats.trim()) return String(p.stats).trim();
      if (p && typeof p.statText === 'string' && p.statText.trim()) return String(p.statText).trim();
      var code = (p && (p.code || p.spawnCode || p.importCode || ''));
      code = String(code || '').replace(/^"+|"+$/g, '').trim();
      if (code) {
        var zip = window.__CC_ZIP_WEAPON_PARTS || window.ZIP_WEAPON_PARTS;
        if (zip && typeof zip === 'object' && zip[code] && zip[code].stats) return String(zip[code].stats).trim();
      }
    } catch (_) {}
    return '';
  }

  function getPartCodes(part) {
    var codes = [];
    var p = (typeof resolvePart === 'function' ? resolvePart(part) : part) || part;
    if (!p) return codes;
    var code = String(p.code || p.spawnCode || p.importCode || '').replace(/^"+|"+$/g, '').trim();
    if (code) codes.push(code);
    var idRaw = String(p.idRaw || p.idraw || '').trim();
    if (idRaw) codes.push(idRaw);
    if (p.family != null && p.id != null) codes.push(p.family + ':' + p.id);
    return codes;
  }

  function getExcelStatsForPart(part) {
    var data = window.PARTS_STATS_DATA;
    if (!data) return null;
    var codes = getPartCodes(part);
    for (var i = 0; i < codes.length; i++) {
      var c = String(codes[i] || '').trim();
      if (!c) continue;
      if (data.by_id_raw && data.by_id_raw[c]) return data.by_id_raw[c];
      if (data.by_part_code && data.by_part_code[c]) return data.by_part_code[c];
      if (data.by_code_suffix && data.by_code_suffix[c]) return data.by_code_suffix[c];
      var suffix = c.indexOf('.') >= 0 ? c.split('.').pop() : c;
      if (data.by_code_suffix && data.by_code_suffix[suffix]) return data.by_code_suffix[suffix];
    }
    return null;
  }

  function applyExcelStatsToBuckets(stats, buckets, record, partLabel) {
    if (!stats || !Array.isArray(stats)) return;
    var pl = partLabel || '';
    for (var i = 0; i < stats.length; i++) {
      var s = stats[i];
      var bucket = s && s.bucket ? String(s.bucket).trim() : '';
      if (!bucket || !buckets[bucket]) continue;
      var comb = String(s.combine || '').trim();
      /** Raw engine offsets (accuracy_value, firerate_value, etc.) — not scale multipliers. */
      if (comb === 'value') continue;
      var val = Number(s.stat_value);
      if (!Number.isFinite(val)) continue;
      var mult = 1;
      if (comb === 'mul') {
        mult = val;
      } else if (comb === 'add' || !comb) {
        mult = 1 + val;
      } else {
        continue;
      }
      if (s.invert && mult !== 0) mult = 1 / mult;
      var detail = formatExcelStatRow(s);
      record(bucket, '', mult, { part: pl, source: 'PARTS_STATS_DATA', detail: detail, combine: comb, multApplied: mult });
    }
  }

  /** Rough map from weapon init / stat_field names to core snapshot buckets (same coarse groups as text parser). */
  var FIELD_TO_BUCKET = {
    damage_scale: 'damage',
    critdamage_add: 'crit',
    statuschance_scale: 'elemental',
    statusdamage_scale: 'elemental',
    elementaldamage_scale: 'elemental',
    elementalchance_scale: 'elemental',
    accuracy_scale: 'accuracy',
    maxaccuracy_scale: 'accuracy',
    spread_scale: 'accuracy',
    zoomtime_scale: 'ads',
    sway_scale: 'ads',
    recoil_scale: 'ads',
    accimpulse_scale: 'ads',
    equiptime_scale: 'ads',
    putdowntime_scale: 'ads',
    firerate_scale: 'firerate',
    projpershot_scale: 'projectiles',
    reloadtime_scale: 'reload_time',
    reloadtime_value: 'reload_time',
    thrownreloadtime_value: 'reload_time'
  };

  /**
   * weapon_stats_data uses:
   * - _scale: direct multiplier (e.g. damage_scale 0.95)
   * - _add: additive (e.g. critdamage_add 0.35 = +35% crit damage -> mult 1.35)
   * - _value: additive offset to base stat, NOT a multiplier — exclude from mult display
   */
  function applyWstatsObjectToBuckets(obj, buckets, record, partLabel) {
    if (!obj || typeof obj !== 'object') return;
    var pl = partLabel || '';
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.indexOf('_value') !== -1) continue;
      var bucket = FIELD_TO_BUCKET[k];
      if (!bucket || !buckets[bucket]) continue;
      var val = Number(obj[k]);
      if (!Number.isFinite(val) || val === 0) continue;
      var mult;
      if (k.indexOf('_add') !== -1) {
        mult = 1 + val;
      } else if (k === 'spread_scale') {
        mult = 1 / val;
      } else {
        mult = val;
      }
      record(bucket, k, mult, { part: pl, source: 'WEAPON_STATS_DATA', detail: k + ': ' + obj[k], multApplied: mult });
    }
  }

  function getWstatsGlobal() {
    try {
      if (typeof WEAPON_STATS_DATA !== 'undefined' && WEAPON_STATS_DATA) return WEAPON_STATS_DATA;
    } catch (_) {}
    return null;
  }

  var WEAPON_TYPE_MAP = { pistol: 'PS', shotgun: 'SG', ar: 'AR', smg: 'SM', sniper: 'SR', heavy_weapon: 'HW' };
  var MFR_BARREL_PREFIX = { Daedalus: 'DAD', Jakobs: 'JAK', Tediore: 'TED', Torgue: 'TOR', Order: 'ORD', Vladof: 'VLA', Borg: 'BOR', Maliwan: 'MAL' };

  function getWeaponTypeCode(slug) {
    if (!slug) return null;
    var parts = String(slug).split('_');
    var type = parts.slice(1).join('_');
    return WEAPON_TYPE_MAP[type] || null;
  }

  function getMfrFromSlug(slug) {
    if (!slug) return null;
    var parts = String(slug).split('_');
    var map = { daedalus: 'Daedalus', jakobs: 'Jakobs', tediore: 'Tediore', torgue: 'Torgue', order: 'Order', vladof: 'Vladof', ripper: 'Borg', maliwan: 'Maliwan', atlas: 'Atlas', cov: 'COV', hyperion: 'Hyperion' };
    return map[parts[0]] || null;
  }

  function lookupBarrelStats(slug, partName) {
    var WSTATS = getWstatsGlobal();
    if (!WSTATS || !slug || !partName) return null;
    var typeCode = getWeaponTypeCode(slug);
    if (!typeCode) return null;
    var tableKey = 'Weapon_' + typeCode + '_Barrel_Init';
    var table = WSTATS[tableKey];
    if (!table || !table.rows) return null;
    var mfr = getMfrFromSlug(slug);
    var prefix = mfr ? MFR_BARREL_PREFIX[mfr] : '';
    var bestMatch = null;
    var keys = Object.keys(table.rows);
    for (var i = 0; i < keys.length; i++) {
      var rowName = keys[i];
      if (partName && rowName.toLowerCase().indexOf(String(partName).replace(/^part_/i, '').toLowerCase()) !== -1) {
        bestMatch = table.rows[rowName];
        break;
      }
      if (prefix && rowName.indexOf(prefix) === 0) {
        var partIdx = partName ? String(partName).match(/(\d+)/) : null;
        var rowIdx = rowName.match(/(\d+)/);
        if (partIdx && rowIdx && partIdx[1] === rowIdx[1]) {
          bestMatch = table.rows[rowName];
          break;
        }
      }
    }
    return bestMatch;
  }

  function lookupMagStats(slug, partName) {
    var WSTATS = getWstatsGlobal();
    if (!WSTATS || !slug || !partName) return null;
    var typeCode = getWeaponTypeCode(slug);
    if (!typeCode) return null;
    var table = WSTATS['Weapon_' + typeCode + '_Magazine_Init'];
    if (!table || !table.rows) return null;
    var mfr = getMfrFromSlug(slug);
    var prefix = mfr ? MFR_BARREL_PREFIX[mfr] : '';
    var keys = Object.keys(table.rows);
    for (var i = 0; i < keys.length; i++) {
      var rowName = keys[i];
      if (partName && rowName.toLowerCase().indexOf(String(partName).replace(/^part_/i, '').toLowerCase()) !== -1) return table.rows[rowName];
      if (prefix && rowName.indexOf(prefix) === 0) {
        var pIdx = partName ? String(partName).match(/(\d+)/) : null;
        var rIdx = rowName.match(/(\d+)/);
        if (pIdx && rIdx && pIdx[1] === rIdx[1]) return table.rows[rowName];
      }
    }
    return null;
  }

  function lookupMfrStats(slug) {
    var WSTATS = getWstatsGlobal();
    if (!WSTATS || !WSTATS.WeaponManufacturer_Init) return null;
    var mfr = getMfrFromSlug(slug);
    if (!mfr) return null;
    return WSTATS.WeaponManufacturer_Init.rows[mfr] || null;
  }

  /** Best-effort item slug for weapon init tables (Legit Builder passes slug explicitly). */
  function inferSlugHint() {
    try {
      if (typeof window.__STX_ITEM_SLUG === 'string' && window.__STX_ITEM_SLUG.trim()) return window.__STX_ITEM_SLUG.trim();
    } catch (_) {}
    try {
      var sd = window.selectedData;
      if (sd && typeof sd === 'object') {
        if (sd.itemSlug) return String(sd.itemSlug);
        if (sd.slug) return String(sd.slug);
        if (sd.item && sd.item.slug) return String(sd.item.slug);
      }
    } catch (_) {}
    var outIds = ['guidedOutputDeserialized', 'outCode', 'deserialized-code-output', 'deserialized-code-output-yaml', 'importBox'];
    for (var i = 0; i < outIds.length; i++) {
      var el = byId(outIds[i]);
      if (!el) continue;
      var t = String(el.value != null ? el.value : el.textContent || '').slice(0, 120000);
      var m = t.match(/\b([a-z]+_(?:pistol|shotgun|ar|smg|sniper|heavy_weapon)(?:_[a-z0-9]+)*)\b/i);
      if (m) return m[1].toLowerCase();
      var m2 = t.match(/(?:^|[\s"'{,])(slug|itemtype|item_type)\s*[:=]\s*['\"]?([a-z][a-z0-9_]*(?:_(?:pistol|shotgun|ar|smg|sniper|heavy_weapon)|_[a-z0-9_]+)*)/i);
      if (m2 && m2[2]) return m2[2].toLowerCase();
    }
    return '';
  }

  function wstatsObjectToLines(obj) {
    if (!obj || typeof obj !== 'object') return [];
    var keys = Object.keys(obj);
    var lines = [];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      lines.push(k + ': ' + obj[k]);
    }
    return lines;
  }

  function tryBarrelMagWstats(part, slug) {
    if (!slug || !part || typeof part !== 'object') return null;
    var name = String(part.name || '').toLowerCase();
    var code = String(part.code || '').toLowerCase();
    if (name.indexOf('barrel') >= 0 || code.indexOf('barrel') >= 0) return lookupBarrelStats(slug, part.name || code);
    if (name.indexOf('mag') >= 0 || name.indexOf('magazine') >= 0 || code.indexOf('mag') >= 0) return lookupMagStats(slug, part.name || code);
    return null;
  }

  function parseNumericEffect(text) {
    var s = String(text || '').replace(/[xX\u00D7]/g, 'x').replace(/<[^>]*>/g, ' ').replace(/(\d),(\d)/g, '$1.$2');
    var m = s.match(/x\s*([0-9]*\.?[0-9]+)/i) || s.match(/([0-9]*\.?[0-9]+)\s*x\b/i);
    if (m) {
      var v = parseFloat(m[1]);
      return Number.isFinite(v) ? v : null;
    }
    var rePct = /([+-]?\s*\d+(?:\.\d+)?)\s*%/g;
    var best = null;
    var bestIdx = -1;
    var m2;
    while ((m2 = rePct.exec(s)) !== null) {
      var pct = parseFloat(String(m2[1]).replace(/\s+/g, ''));
      if (Number.isFinite(pct)) {
        var left = s.slice(Math.max(0, m2.index - 18), m2.index).toLowerCase();
        var right = s.slice(m2.index, Math.min(s.length, m2.index + 26)).toLowerCase();
        if (!/(chance|proc)/.test(left) && !/(chance|proc)/.test(right)) {
          if (m2.index > bestIdx) {
            bestIdx = m2.index;
            best = 1 + (pct / 100);
          }
        }
      }
    }
    if (best != null) return best;
    var mh = s.match(/([+-])\s*(\d+(?:\.\d+)?)/);
    if (mh) {
      var sign = mh[1] === '-' ? -1 : 1;
      var v = parseFloat(mh[2]);
      if (Number.isFinite(v)) return 1 + (sign * v / 100);
    }
    return null;
  }

  function classifyLine(line) {
    var l = String(line || '').toLowerCase();
    return {
      damage: /(damage|weapon damage|gun damage)/.test(l) && !/(crit|critical)/.test(l) && !/(element|status|dot|incendiary|\bfire\b(?!\s*rate)|burn|shock|corros|cryo|radiat)/.test(l),
      crit: /(crit|critical)/.test(l),
      elemental: /(element|status|dot|incendiary|\bfire\b(?!\s*rate)|burn|shock|corros|cryo|radiat|slag|poison)/.test(l),
      accuracy: /(accuracy|spread|precision|bloom)/.test(l),
      ads: /(ads|aim\s*down\s*sights|\baim\b|handling|recoil|stability|sway)/.test(l),
      firerate: /(fire\s*rate|rate\s*of\s*fire|\brof\b)/.test(l),
      reload_time: /(reload\s*time|time\s*to\s*reload|reload\b)/.test(l) && !/(reload\s*speed)/.test(l),
      reload_speed: /(reload\s*speed)/.test(l),
      ammo_mag: /(mag(azine)?(\s*(size|capacity))?|ammo\s*(capacity)?|clip\s*size)/.test(l),
      projectiles: /(projectile|projectiles|pellet|pellets)/.test(l)
    };
  }

  /** Shared by accumulateFromSelected + getFullStatsBreakdown */
  function collectRefsAndDedupedParts() {
    var refs = new Set();
    var outIds = ['guidedOutputDeserialized', 'outCode', 'deserialized-code-output', 'deserialized-code-output-yaml', 'deserialized-result', 'deserialized-result-yaml', 'output-code-live', 'output-code-yaml', 'output-code', 'importBox'];
    for (var i = 0; i < outIds.length; i++) {
      var el = byId(outIds[i]);
      if (!el) continue;
      var txt = String(el.value != null ? el.value : el.textContent || '').slice(0, 200000);
      addRefsFromText(txt, refs);
    }
    try {
      var selects = document.querySelectorAll('select');
      for (var j = 0; j < selects.length; j++) {
        var v = String((selects[j].value || '')).trim();
        if (v) addRefsFromText(v, refs);
      }
    } catch (_) {}
    try {
      var sd = window.selectedData || null;
      if (sd && typeof sd === 'object') {
        var seenWalk = new Set();
        function walk(v) {
          if (v == null) return;
          if (typeof v === 'string') { addRefsFromText(v, refs); return; }
          if (typeof v !== 'object') return;
          if (seenWalk.has(v)) return;
          seenWalk.add(v);
          if (v.idRaw) addRefsFromText(String(v.idRaw), refs);
          if (v.code) addRefsFromText(String(v.code), refs);
          if (v.spawnCode) addRefsFromText(String(v.spawnCode), refs);
          if (Array.isArray(v)) { for (var k = 0; k < v.length; k++) walk(v[k]); return; }
          var keys = Object.keys(v);
          for (var kk = 0; kk < keys.length; kk++) {
            if (keys[kk] === 'yaml' || keys[kk] === 'yamlText' || keys[kk] === 'raw' || keys[kk] === 'rawText') continue;
            walk(v[keys[kk]]);
          }
        }
        walk(sd);
      }
    } catch (_) {}
    var arr = Array.from(refs);
    if (!arr.length) return null;
    var resolved = [];
    for (var r = 0; r < arr.length; r++) {
      try {
        var p = resolvePart(arr[r]);
        resolved.push(p || arr[r]);
      } catch (_) {
        resolved.push(arr[r]);
      }
    }
    var seen = new Set();
    var deduped = [];
    for (var d = 0; d < resolved.length; d++) {
      var p = resolved[d];
      var k = (p && typeof p === 'object' && (p.partRef || p.id || p.name)) ? String(p.partRef || p.id || p.name) : String(p);
      if (seen.has(k)) continue;
      seen.add(k);
      deduped.push(p);
    }
    return { refList: arr, deduped: deduped };
  }

  function partDisplayName(part) {
    if (!part || typeof part !== 'object') return String(part);
    return String(part.name || part.code || part.idRaw || part.spawnCode || part.partRef || '').trim() || 'Part';
  }

  function formatExcelStatRow(s) {
    if (!s || typeof s !== 'object') return '';
    var sf = s.stat_field != null ? String(s.stat_field) : '';
    var sv = s.stat_value;
    var bucket = s.bucket != null ? String(s.bucket) : '';
    var comb = s.combine != null ? String(s.combine) : '';
    var line = sf ? (sf + ': ' + sv) : String(sv);
    var meta = [bucket, comb].filter(Boolean).join(' · ');
    if (meta) line += ' [' + meta + ']';
    if (s.invert) line += ' (invert)';
    return line;
  }

  /** Per-part lines for the full-stats panel (PARTS_STATS_DATA → weapon init tables → embedded text). Matches Legit Builder priority where possible. */
  function getFullStatsBreakdown() {
    var col = collectRefsAndDedupedParts();
    if (!col || !col.deduped.length) {
      return { entries: [], message: 'No part refs found. Import code, use Guided Builder, or paste serials to see full stat lines.' };
    }
    var slug = inferSlugHint();
    var entries = [];
    for (var i = 0; i < col.deduped.length; i++) {
      var part = col.deduped[i];
      var name = partDisplayName(part);
      var excelStats = null;
      try {
        excelStats = getExcelStatsForPart(part);
      } catch (_) {}
      var source = 'embedded stat text';
      var lines = [];
      if (excelStats && excelStats.length) {
        source = 'PARTS_STATS_DATA';
        for (var j = 0; j < excelStats.length; j++) {
          lines.push(formatExcelStatRow(excelStats[j]));
        }
      } else if (slug) {
        var wRow = tryBarrelMagWstats(part, slug);
        if (wRow) {
          source = 'WEAPON_STATS_DATA (barrel/mag init)';
          lines = wstatsObjectToLines(wRow);
        }
      }
      if (!lines.length) {
        var raw = '';
        try {
          raw = displayStatsFor(part) || '';
        } catch (_) {}
        if (raw) {
          lines = raw.split(/(?:\r?\n|\r|;|\u2022|\u25AA|\u25CF)+/).map(function (t) { return t.trim(); }).filter(Boolean);
          if (source === 'embedded stat text' && lines.length) source = 'embedded stat text (dataset / ZIP)';
        }
      }
      entries.push({ name: name, source: source, lines: lines });
    }
    if (slug) {
      var mfr = lookupMfrStats(slug);
      if (mfr && Object.keys(mfr).length) {
        entries.unshift({
          name: 'Manufacturer (' + (getMfrFromSlug(slug) || slug) + ')',
          source: 'WEAPON_STATS_DATA (manufacturer init)',
          lines: wstatsObjectToLines(mfr)
        });
      }
    }
    return { entries: entries, slugHint: slug || null };
  }

  function accumulateFromSelected() {
    var col = collectRefsAndDedupedParts();
    if (!col) return null;
    var deduped = col.deduped;
    var slug = inferSlugHint();
    var pname = function (part) { return partDisplayName(part); };

    var buckets = {
      damage: { mult: 1, hits: 0, nonNumeric: 0, contributions: [] },
      crit: { mult: 1, hits: 0, nonNumeric: 0, contributions: [] },
      elemental: { mult: 1, hits: 0, nonNumeric: 0, contributions: [] },
      accuracy: { mult: 1, hits: 0, nonNumeric: 0, contributions: [] },
      ads: { mult: 1, hits: 0, nonNumeric: 0, contributions: [] },
      firerate: { mult: 1, hits: 0, nonNumeric: 0, contributions: [] },
      reload_time: { mult: 1, hits: 0, nonNumeric: 0, contributions: [] },
      reload_speed: { mult: 1, hits: 0, nonNumeric: 0, contributions: [] },
      ammo_mag: { mult: 1, hits: 0, nonNumeric: 0, contributions: [] },
      projectiles: { mult: 1, hits: 0, nonNumeric: 0, contributions: [] }
    };

    function record(key, line, mult, contrib) {
      var b = buckets[key];
      if (!b) return;
      b.hits++;
      if (mult) {
        b.mult *= mult;
      } else {
        b.nonNumeric++;
      }
      if (contrib && b.contributions) b.contributions.push(contrib);
    }

    for (var idx = 0; idx < deduped.length; idx++) {
      var part = deduped[idx];
      var pl = pname(part);
      var excelStats = null;
      try {
        excelStats = getExcelStatsForPart(part);
      } catch (_) {}
      if (excelStats && excelStats.length) {
        applyExcelStatsToBuckets(excelStats, buckets, record, pl);
        continue;
      }
      var wRow = slug ? tryBarrelMagWstats(part, slug) : null;
      if (wRow) {
        applyWstatsObjectToBuckets(wRow, buckets, record, pl);
        continue;
      }
      var raw = '';
      try {
        raw = displayStatsFor(part) || '';
      } catch (_) {}
      if (!raw) continue;

      var lines = raw.split(/(?:\r?\n|\r|;|\u2022|\u25AA|\u25CF)+/).map(function (t) { return t.trim(); }).filter(Boolean);
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        var c = classifyLine(line);
        var mult = parseNumericEffect(line);
        var cb = { part: pl, source: 'parsed text', detail: line, multApplied: mult };
        if (c.damage) record('damage', line, mult, cb);
        if (c.crit) record('crit', line, mult, cb);
        if (c.elemental) record('elemental', line, mult, cb);
        if (c.accuracy) record('accuracy', line, mult, cb);
        if (c.ads) record('ads', line, mult, cb);
        if (c.firerate) record('firerate', line, mult, cb);
        if (c.reload_time) record('reload_time', line, mult, cb);
        if (c.reload_speed) record('reload_speed', line, mult, cb);
        if (c.ammo_mag) record('ammo_mag', line, mult, cb);
        if (c.projectiles) record('projectiles', line, mult, cb);
      }
    }

    if (slug) {
      var mfr = lookupMfrStats(slug);
      if (mfr) applyWstatsObjectToBuckets(mfr, buckets, record, 'Manufacturer');
    }

    var detected = 0;
    var keys = Object.keys(buckets);
    for (var ki = 0; ki < keys.length; ki++) {
      var bk = buckets[keys[ki]];
      if (bk && bk.hits) detected += Number(bk.hits) || 0;
    }
    buckets.detectedParts = detected;

    return buckets;
  }

  function getBuildStatsDebugInfo() {
    var refs = new Set();
    var outIds = ['guidedOutputDeserialized', 'outCode', 'deserialized-code-output', 'deserialized-code-output-yaml', 'deserialized-result', 'deserialized-result-yaml', 'output-code-live', 'output-code-yaml', 'output-code', 'importBox'];
    for (var i = 0; i < outIds.length; i++) {
      var el = byId(outIds[i]);
      if (!el) continue;
      var txt = String(el.value != null ? el.value : el.textContent || '').slice(0, 200000);
      addRefsFromText(txt, refs);
    }
    try {
      var selects = document.querySelectorAll('select');
      for (var j = 0; j < selects.length; j++) {
        var v = String((selects[j].value || '')).trim();
        if (v) addRefsFromText(v, refs);
      }
    } catch (_) {}
    try {
      var sd = window.selectedData || null;
      if (sd && typeof sd === 'object') {
        var seen = new Set();
        function walk(v) {
          if (v == null) return;
          if (typeof v === 'string') { addRefsFromText(v, refs); return; }
          if (typeof v !== 'object') return;
          if (seen.has(v)) return;
          seen.add(v);
          if (v.idRaw) addRefsFromText(String(v.idRaw), refs);
          if (v.code) addRefsFromText(String(v.code), refs);
          if (v.spawnCode) addRefsFromText(String(v.spawnCode), refs);
          if (Array.isArray(v)) { for (var k = 0; k < v.length; k++) walk(v[k]); return; }
          var keys = Object.keys(v);
          for (var kk = 0; kk < keys.length; kk++) {
            if (keys[kk] === 'yaml' || keys[kk] === 'yamlText' || keys[kk] === 'raw' || keys[kk] === 'rawText') continue;
            walk(v[keys[kk]]);
          }
        }
        walk(sd);
      }
    } catch (_) {}
    var arr = Array.from(refs);
    var resolved = [];
    var withStats = [];
    var withoutStats = [];
    for (var r = 0; r < arr.length; r++) {
      try {
        var p = resolvePart(arr[r]);
        var part = p || arr[r];
        resolved.push({ ref: arr[r], part: part });
        var raw = displayStatsFor(part) || '';
        if (raw && raw.trim()) {
          withStats.push({ ref: arr[r], part: part, stats: raw });
        } else {
          withoutStats.push({ ref: arr[r], part: part });
        }
      } catch (_) {
        resolved.push({ ref: arr[r], part: arr[r] });
        withoutStats.push({ ref: arr[r], part: arr[r] });
      }
    }
    return { refs: arr, resolved: resolved, withStats: withStats, withoutStats: withoutStats };
  }

  window.accumulateFromSelected = accumulateFromSelected;
  window.displayStatsFor = displayStatsFor;
  window.getBuildStatsDebugInfo = getBuildStatsDebugInfo;
  window.getFullStatsBreakdown = getFullStatsBreakdown;

  function triggerRefresh() {
    try {
      if (typeof window.refreshBuildStatsCore === 'function') window.refreshBuildStatsCore();
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(triggerRefresh, 100);
      setTimeout(triggerRefresh, 400);
    });
  } else {
    setTimeout(triggerRefresh, 100);
  }

  document.addEventListener('change', function (ev) {
    var t = ev && ev.target;
    if (t && t.tagName === 'SELECT') setTimeout(triggerRefresh, 80);
  }, true);

  setTimeout(function () {
    try {
      if (typeof window.refreshOutputs === 'function') {
        var orig = window.refreshOutputs;
        if (orig && !orig.__buildStatsWrapped) {
          window.refreshOutputs = function () {
            var r = orig.apply(this, arguments);
            setTimeout(triggerRefresh, 50);
            return r;
          };
          window.refreshOutputs.__buildStatsWrapped = true;
        }
      }
      if (typeof window.refreshGuidedOutput === 'function') {
        var origGuided = window.refreshGuidedOutput;
        if (origGuided && !origGuided.__buildStatsWrapped) {
          window.refreshGuidedOutput = function () {
            var r = origGuided.apply(this, arguments);
            setTimeout(triggerRefresh, 50);
            return r;
          };
          window.refreshGuidedOutput.__buildStatsWrapped = true;
        }
      }
      var outIds = ['guidedOutputDeserialized', 'outCode'];
      for (var i = 0; i < outIds.length; i++) {
        var el = byId(outIds[i]);
        if (el && !el.__buildStatsInputBound) {
          el.addEventListener('input', function () { setTimeout(triggerRefresh, 80); });
          el.addEventListener('change', function () { setTimeout(triggerRefresh, 80); });
          el.__buildStatsInputBound = true;
        }
      }
    } catch (_) {}
  }, 500);
})();
