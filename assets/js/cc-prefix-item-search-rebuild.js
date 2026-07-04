/**
 * cc-prefix-item-search-rebuild.js
 * Prefix/Item Search and Add - search bundled serials by name, prefix, or ID.
 */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  function getGlobalYamlInjectCopies() {
    var el = byId('stxYamlInjectCopiesGlobal');
    if (el && typeof window.stxNormalizeYamlInjectCopies === 'function') {
      return window.stxNormalizeYamlInjectCopies(el.value);
    }
    return 1;
  }

  function alertYamlInjectNeedSave(kind) {
    if (typeof window.stxAlertNeedSaveForYamlInject === 'function') {
      window.stxAlertNeedSaveForYamlInject(kind);
    } else {
      alert(kind === 'bank'
        ? 'Could not add to profile bank. Load a profile YAML (shared inventory) first.'
        : 'Could not add to backpack. Load a character save YAML (root state:) first.');
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    s = String(s || '');
    if (s.length > 900) s = s.slice(0, 897) + '…';
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  var serialsData = null;
  var lastSelected = null;
  var godrollData = null;
  var lastGodrollSelected = null;
  var godrollLoadPromise = null;
  var godrollStatsCache = {};
  var prefixRenderLimit = 80;
  var godrollRenderLimit = 80;
  var SEARCH_DEBOUNCE_MS = 350;
  var MIN_SEARCH_QUERY_LEN = 2;
  var INDEX_CHUNK_SIZE = 350;
  var serialSearchIndexReady = false;
  var godrollSearchIndexReady = false;
  var serialIndexInFlight = false;
  var godrollIndexInFlight = false;
  var prefixSearchDebounceTimer = null;
  var godrollSearchDebounceTimer = null;

  function scheduleIndexStep(fn) {
    if (typeof window.stxYieldToMain === 'function') {
      window.stxYieldToMain(fn);
    } else if (typeof window.stxScheduleIdle === 'function') {
      window.stxScheduleIdle(fn, 120);
    } else if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(function () { fn(); }, { timeout: 120 });
    } else {
      setTimeout(fn, 0);
    }
  }

  var loadPromise = null;
  function loadSerials() {
    if (serialsData) return Promise.resolve(serialsData);
    if (window.STX_SERIALS_DATA && window.STX_SERIALS_DATA.serials && window.STX_SERIALS_DATA.serials.length) {
      serialsData = window.STX_SERIALS_DATA.serials;
      return Promise.resolve(serialsData);
    }
    if (loadPromise) return loadPromise;
    var proto = (typeof location !== 'undefined' && location.protocol) || '';
    if (proto === 'file:' || proto === 'chrome-extension:' || proto === 'moz-extension:') {
      serialsData = [];
      loadPromise = Promise.resolve(serialsData);
      return loadPromise;
    }
    var ensure = (typeof window.__ccEnsureSerialsCatalog === 'function')
      ? window.__ccEnsureSerialsCatalog()
      : Promise.resolve([]);
    loadPromise = ensure.then(function (arr) {
      if (arr && arr.length) {
        serialsData = arr;
        return serialsData;
      }
      return fetch('./assets/data/serials.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          serialsData = data && data.serials ? data.serials : [];
          return serialsData;
        })
        .catch(function (e) {
          serialsData = [];
          console.warn('Could not load serials catalog. Click "Load from file" or use embedded serials.', e);
          return serialsData;
        });
    });
    return loadPromise;
  }

  function getSearchText() {
    var el = byId('prefixItemSearchInput');
    return el ? String(el.value || '').trim().toLowerCase() : '';
  }

  function buildSerialSearchHay(item, allowDecode) {
    var parts = [
      String(item.name || '').toLowerCase(),
      String(item.serial || '').toLowerCase(),
    ];
    if (item.familyId != null && item.itemId != null) {
      parts.push(String(item.familyId) + ':' + String(item.itemId));
    }
    if (item.idRaw) parts.push(String(item.idRaw).toLowerCase());
    if (allowDecode && window.parseSerialMeta) {
      try {
        var meta = window.parseSerialMeta(item.serial);
        if (meta.familyId != null && meta.itemId != null) {
          parts.push(String(meta.familyId) + ':' + String(meta.itemId));
        }
        if (meta.name) parts.push(String(meta.name).toLowerCase());
      } catch (_e) {}
    }
    return parts.join('\x00');
  }

  function ensureSerialSearchIndex(done) {
    if (serialSearchIndexReady || !serialsData || !serialsData.length) {
      if (done) done();
      return;
    }
    if (serialIndexInFlight) {
      ensureSerialSearchIndex.__pendingDone = done;
      return;
    }
    serialIndexInFlight = true;
    var i = 0;
    function step() {
      var end = Math.min(i + INDEX_CHUNK_SIZE, serialsData.length);
      for (; i < end; i++) {
        if (!serialsData[i].__searchHay) {
          serialsData[i].__searchHay = buildSerialSearchHay(serialsData[i], false);
        }
      }
      if (i < serialsData.length) {
        scheduleIndexStep(step);
      } else {
        serialSearchIndexReady = true;
        serialIndexInFlight = false;
        var pending = ensureSerialSearchIndex.__pendingDone;
        ensureSerialSearchIndex.__pendingDone = null;
        if (done) done();
        if (pending && pending !== done) pending();
      }
    }
    step();
  }

  function matches(item, q) {
    if (!q) return true;
    var hay = item.__searchHay || buildSerialSearchHay(item, false);
    if (hay.indexOf(q) >= 0) return true;
    if (!/\d/.test(q)) return false;
    if (!item.__searchHayDecoded) {
      item.__searchHayDecoded = buildSerialSearchHay(item, true);
    }
    return item.__searchHayDecoded.indexOf(q) >= 0;
  }

  function filterSerials(q) {
    if (!serialsData) return [];
    if (!q) return serialsData;
    return serialsData.filter(function (item) { return matches(item, q); });
  }

  function renderResults(items) {
    var el = byId('prefixItemSearchResults');
    if (!el) return;
    el.innerHTML = '';
    if (!items || !items.length) {
      el.innerHTML = '<div style="color:rgba(255,255,255,0.6);font-size:0.9em;">No matches.</div>';
      return;
    }
    items.slice(0, prefixRenderLimit).forEach(function (item, idx) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:flex-start;gap:10px;padding:8px;background:rgba(0,200,255,0.06);border-radius:6px;margin-bottom:6px;border:1px solid rgba(0,200,255,0.15);cursor:pointer;';
      row.setAttribute('data-serial', item.serial || '');
      var name = item.name || 'Unknown';
      var meta = window.parseSerialMeta ? window.parseSerialMeta(item.serial) : {};
      var level = Number.isFinite(meta.level) ? ' Lv' + meta.level : '';
      var idStr = (meta.familyId != null && meta.itemId != null) ? ' (' + meta.familyId + ':' + meta.itemId + ')' : '';
      
      var deser = getCachedDeserialized(item);
      var deserHtml = '';
      if (deser) {
        deserHtml = '<div style="font-size:0.7em;color:rgba(200,230,255,0.8);margin-top:3px;word-break:break-all;font-family:Consolas,monospace;background:rgba(0,0,0,0.15);padding:2px 4px;border-radius:3px;">' + escapeHtml(deser) + '</div>';
      }

      row.innerHTML = '<div style="flex:1;min-width:0;color:rgba(255,255,255,0.95);font-size:0.9em;">' + escapeHtml(name + level + idStr) + 
        deserHtml + 
        '</div>' +
        '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Copy serial to clipboard">Copy</button>' +
        '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to editor">Editor</button>' +
        '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to character backpack">YAML</button>' +
        '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to profile bank">Bank</button>';
      var btns = row.querySelectorAll('button');
      btns[0].addEventListener('click', function (e) {
        e.stopPropagation();
        var ser = String(item.serial || '').trim();
        if (!ser) return;
        try { navigator.clipboard.writeText(ser); } catch (_) {}
      });
      btns[1].addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.importSerialToEditor) window.importSerialToEditor(item.serial);
      });
      btns[2].addEventListener('click', function (e) {
        e.stopPropagation();
        lastSelected = item;
        var n = getGlobalYamlInjectCopies();
        if (window.appendSerialToYAML && window.appendSerialToYAML(item.serial, n)) {
          openSaveYamlDrawer();
        } else {
          alertYamlInjectNeedSave('backpack');
        }
      });
      btns[3].addEventListener('click', function (e) {
        e.stopPropagation();
        lastSelected = item;
        var nb = getGlobalYamlInjectCopies();
        if (window.appendSerialToProfileBank && window.appendSerialToProfileBank(item.serial, nb)) {
          openSaveYamlDrawer();
        } else {
          alertYamlInjectNeedSave('bank');
        }
      });
      row.addEventListener('click', function () { lastSelected = item; });
      el.appendChild(row);
    });
    if (items.length > prefixRenderLimit) {
      var moreWrap = document.createElement('div');
      moreWrap.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;';
      var more = document.createElement('div');
      more.style.cssText = 'color:rgba(255,255,255,0.6);font-size:0.85em;';
      more.textContent = 'Showing ' + prefixRenderLimit + ' of ' + items.length + '.';
      var moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'btn';
      moreBtn.style.cssText = 'padding:4px 8px;font-size:11px;';
      moreBtn.textContent = 'Show more';
      moreBtn.addEventListener('click', function () {
        prefixRenderLimit += 80;
        renderResults(items);
      });
      moreWrap.appendChild(more);
      moreWrap.appendChild(moreBtn);
      el.appendChild(moreWrap);
    }
  }

  function titleCaseWords(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/\b([a-z])/g, function (_, c) { return c.toUpperCase(); });
  }

  function normalizeRpList(entry) {
    var raw = entry && (entry.rp || entry.resolvedParts);
    if (!Array.isArray(raw)) return [];
    return raw.map(function (p) {
      if (!p) return null;
      if (p.t !== undefined || p.n !== undefined) {
        return { part_type: String(p.t || ''), name: String(p.n || '') };
      }
      return { part_type: String(p.part_type || ''), name: String(p.name || '') };
    }).filter(Boolean);
  }

  var GENERIC_RARITY_BODY = { common: 1, uncommon: 1, rare: 1, epic: 1, legendary: 1, part_body: 1 };

  function isUglyInternalPartLabel(s) {
    s = String(s || '').trim();
    if (!s) return true;
    if (/^part_/i.test(s)) return true;
    if (GENERIC_RARITY_BODY[s.toLowerCase()]) return true;
    return false;
  }

  function deriveGodrollNameAndPrefix(entry, rpNorm) {
    var base = String(entry.baseName || entry.name || '').trim();
    var prefixHint = '';
    var skin = null;
    var i;
    for (i = 0; i < rpNorm.length; i++) {
      var pt = rpNorm[i].part_type;
      if (pt === 'Name+Skin' || pt === 'Name+Skin+Leg Effect') {
        skin = rpNorm[i];
        break;
      }
    }
    if (skin && skin.name && !/^psion name$/i.test(String(skin.name).trim())) {
      var sn = String(skin.name).trim();
      if (!base) base = sn;
      else if (sn.toLowerCase() !== base.toLowerCase() && base.indexOf(sn) < 0) prefixHint = sn;
    }
    var titleBarrel = '';
    for (i = 0; i < rpNorm.length; i++) {
      if (rpNorm[i].part_type !== 'Barrel') continue;
      var bn = String(rpNorm[i].name || '').trim();
      if (!isUglyInternalPartLabel(bn)) {
        titleBarrel = bn;
        break;
      }
    }
    if (titleBarrel) {
      if (!base) base = titleBarrel;
      else if (titleBarrel.toLowerCase() !== base.toLowerCase() && base.indexOf(titleBarrel) < 0) {
        prefixHint = prefixHint ? (prefixHint + ' · ' + titleBarrel) : titleBarrel;
      }
    }
    if (!base && rpNorm.length) {
      for (i = 0; i < rpNorm.length; i++) {
        if (rpNorm[i].part_type !== 'Body') continue;
        var bodyN = String(rpNorm[i].name || '').trim();
        if (bodyN && !isUglyInternalPartLabel(bodyN)) {
          base = bodyN;
          break;
        }
      }
    }
    return { name: base, prefixHint: prefixHint };
  }

  function godrollMaxItemLevel() {
    if (typeof window.getCharacterLevelCap === 'function') return window.getCharacterLevelCap();
    if (typeof window.STX_MAX_ITEM_LEVEL === 'number') return window.STX_MAX_ITEM_LEVEL;
    return 60;
  }

  function ensureGodrollItemMaxLevel(item) {
    if (!item || typeof item !== 'object') return item;
    var maxLv = godrollMaxItemLevel();
    var cur = Number(item.level);
    if (Number.isFinite(cur) && cur >= maxLv) return item;
    item.level = maxLv;
    if (item.deserialized) {
      item.deserialized = String(item.deserialized).replace(
        /^(\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*)\d+(\s*\|)/,
        '$1' + maxLv + '$2'
      );
    }
    if (typeof window.updateSerialLevelFlexible === 'function' && item.serial) {
      try {
        var bumped = window.updateSerialLevelFlexible(item.serial, maxLv);
        if (bumped && String(bumped).trim()) item.serial = String(bumped).trim();
      } catch (_e) {}
    }
    return item;
  }

  function normalizeGodrollEntry(entry, godrollCategory) {
    if (!entry || typeof entry !== 'object') return null;
    var serial = String(entry.input || entry.serial || entry.base85 || '').trim();
    if (!serial) return null;
    var rpNorm = normalizeRpList(entry);
    var derived = deriveGodrollNameAndPrefix(entry, rpNorm);
    var name = String(derived.name || '').trim();
    var maker = String(entry.manufacturer || '').trim();
    var type = String(entry.itemType || '').trim();
    var rarity = String(entry.rarity || '').trim();
    var level = Number.isFinite(Number(entry.level)) ? Number(entry.level) : null;
    var prefixHint = String(derived.prefixHint || '').trim();
    if (!name && maker && type) name = [titleCaseWords(maker), titleCaseWords(type)].filter(Boolean).join(' ');
    var deser = String(entry.deserialized || '').trim();
    var out = {
      serial: serial,
      name: name,
      manufacturer: maker,
      itemType: type,
      rarity: rarity,
      level: level,
      familyId: Number.isFinite(Number(entry.itemTypeId)) ? Number(entry.itemTypeId) : null,
      godrollCategory: godrollCategory || entry.godrollCategory || 'imported',
      prefixHint: prefixHint,
      deserialized: deser,
      rpParts: rpNorm.slice(),
      rpRaw: Array.isArray(entry.rp || entry.resolvedParts) ? (entry.rp || entry.resolvedParts) : []
    };
    return ensureGodrollItemMaxLevel(out);
  }

  function godrollShouldShowFullStats() {
    var cb = byId('godrollShowFullStatsToggle');
    return !!(cb && cb.checked);
  }

  function godrollStatsPartKeyForRow(p) {
    if (!p || typeof p !== 'object') return '';
    var alpha = String(p.alpha_code || '').trim().replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
    if (alpha) return alpha.toLowerCase();
    var key = String(p.key || '').trim();
    if (/^\d+:\d+$/.test(key)) return key;
    return '';
  }

  function getFamilyIdForGodroll(item) {
    if (item && Number.isFinite(item.familyId)) return item.familyId;
    if (window.parseSerialMeta && item && item.serial) {
      try {
        var m = window.parseSerialMeta(item.serial);
        if (m && Number.isFinite(Number(m.familyId))) return Number(m.familyId);
      } catch (_e) {}
    }
    return null;
  }

  function godrollKeysFromDeserialized(item) {
    var deser = String(godrollDeserializedForDisplay(item) || '').trim();
    if (!deser) return [];
    var fam = getFamilyIdForGodroll(item);
    var out = [];
    var re = /\{([^}]+)\}/g;
    var m;
    while ((m = re.exec(deser))) {
      var tok = String(m[1] || '').trim();
      if (!tok) continue;
      var pair = tok.match(/^(\d+)\s*:\s*(\d+)$/);
      if (pair) {
        out.push(pair[1] + ':' + pair[2]);
        continue;
      }
      var single = tok.match(/^(\d+)$/);
      if (single && fam != null) {
        out.push(String(fam) + ':' + single[1]);
      }
    }
    var seen = {};
    return out.filter(function (k) {
      if (!k || seen[k]) return false;
      seen[k] = true;
      return true;
    });
  }

  function buildGodrollFullStatsData(item) {
    var byPart = window.PARTS_STATS_DATA && window.PARTS_STATS_DATA.by_part_code;
    if (!byPart) return null;
    var keys = [];
    var i;
    var raw = Array.isArray(item && item.rpRaw) ? item.rpRaw : [];
    for (i = 0; i < raw.length; i++) {
      var k = godrollStatsPartKeyForRow(raw[i]);
      if (k) keys.push(k);
    }
    if (!keys.length) keys = godrollKeysFromDeserialized(item);
    if (!keys.length) return null;
    var unique = {};
    keys = keys.filter(function (k2) { if (!k2 || unique[k2]) return false; unique[k2] = 1; return true; });

    var rows = [];
    var sourceParts = [];
    var fieldCounts = {};
    for (i = 0; i < keys.length; i++) {
      var partKey = keys[i];
      var statRows = byPart[partKey];
      if (!Array.isArray(statRows) || !statRows.length) continue;
      sourceParts.push(partKey);
      for (var j = 0; j < statRows.length; j++) {
        var s = statRows[j] || {};
        var field = String(s.stat_field || '');
        rows.push({
          part_code: partKey,
          stat_field: field,
          stat_value: s.stat_value,
          bucket: String(s.bucket || '')
        });
        if (field) fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      }
    }
    if (!rows.length) return null;
    var topFields = Object.keys(fieldCounts)
      .sort(function (a, b) { return (fieldCounts[b] - fieldCounts[a]) || a.localeCompare(b); })
      .slice(0, 6)
      .map(function (f) { return f + ' ×' + fieldCounts[f]; });
    return {
      source_parts: sourceParts,
      row_count: rows.length,
      top_fields: topFields,
      rows: rows
    };
  }

  function buildGodrollStatsBlockHtml(item) {
    if (!item || !item.serial) return '';
    var cacheKey = String(item.serial);
    var data = godrollStatsCache[cacheKey];
    if (data === undefined) {
      data = buildGodrollFullStatsData(item);
      godrollStatsCache[cacheKey] = data || null;
    }
    if (!data) {
      return '<div class="cc-godroll-stats" style="margin-top:6px;padding:6px;border:1px dashed rgba(255,190,80,0.3);border-radius:6px;font-size:0.72em;color:rgba(255,220,170,0.85);">Full stats: no mapped rows</div>';
    }
    var top = data.top_fields && data.top_fields.length ? data.top_fields.join(' · ') : '—';
    var lines = data.rows.slice(0, 24).map(function (r) {
      var sv = (r.stat_value === null || r.stat_value === undefined) ? '' : String(r.stat_value);
      var b = r.bucket ? (' [' + r.bucket + ']') : '';
      return r.part_code + ' → ' + r.stat_field + ': ' + sv + b;
    });
    var more = data.rows.length > 24 ? ('\n… +' + (data.rows.length - 24) + ' more rows') : '';
    return ''
      + '<details class="cc-godroll-stats" style="margin-top:6px;border:1px solid rgba(255,190,80,0.34);border-radius:6px;background:rgba(0,0,0,0.2);">'
      + '<summary style="cursor:pointer;padding:6px 8px;font-size:0.75em;color:rgba(255,236,190,0.95);font-weight:700;">'
      + 'Full stats: ' + escapeHtml(String(data.row_count)) + ' rows / ' + escapeHtml(String(data.source_parts.length)) + ' parts'
      + '</summary>'
      + '<div style="padding:6px 8px 8px;">'
      + '<div style="font-size:0.7em;color:rgba(255,220,180,0.9);margin-bottom:4px;"><strong>Top fields:</strong> ' + escapeHtml(top) + '</div>'
      + '<pre style="margin:0;max-height:10em;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:0.68em;line-height:1.35;color:rgba(220,240,255,0.86);background:rgba(0,0,0,0.25);padding:6px;border-radius:4px;border:1px solid rgba(255,180,80,0.2);">'
      + escapeHtml(lines.join('\n') + more)
      + '</pre>'
      + '</div></details>';
  }

  function godrollDeserializedForDisplay(item) {
    var d = item && String(item.deserialized || '').trim();
    if (d) return d;
    if (window.parseSerialMeta && item && item.serial) {
      try {
        var m = window.parseSerialMeta(item.serial);
        if (m && String(m.deserialized || '').trim()) return String(m.deserialized).trim();
      } catch (_e) {}
    }
    if (typeof window.deserializeBase85 === 'function' && item && item.serial) {
      try {
        var raw = String(item.serial || '').trim();
        if (raw.indexOf('||') < 0 && raw.indexOf(',') < 0 && raw.length > 8) {
          var x = window.deserializeBase85(raw);
          if (x && typeof x === 'string' && x.trim()) return x.trim();
        }
      } catch (_e2) {}
    }
    return '';
  }

  /** One-line summary of bundled rp / resolvedParts (KeepinItGrimeeys + community exports). */
  function formatGodrollPartsLine(rpNorm, opts) {
    opts = opts || {};
    var max = typeof opts.max === 'number' ? opts.max : 16;
    if (!rpNorm || !rpNorm.length) return '';
    var segments = [];
    var i;
    for (i = 0; i < rpNorm.length && segments.length < max; i++) {
      var p = rpNorm[i];
      var pt = String(p.part_type || '').trim();
      var pn = String(p.name || '').trim();
      if (!pt && !pn) continue;
      var seg = pn ? (pt + ': ' + pn) : pt;
      segments.push(seg);
    }
    var tail = rpNorm.length > max ? (' … +' + (rpNorm.length - max) + ' parts') : '';
    return segments.join(' · ') + tail;
  }

  function buildGodrollDetailBlockHtml(item) {
    var partsLine = formatGodrollPartsLine(item && item.rpParts);
    var deser = getCachedDeserialized(item);
    var out = '';
    if (partsLine) {
      out += '<div class="cc-godroll-parts" style="font-size:0.72em;line-height:1.35;color:rgba(255,235,200,0.88);margin-top:4px;word-break:break-word;">'
        + '<span style="opacity:0.75;font-weight:700;">Parts:</span> '
        + escapeHtml(partsLine)
        + '</div>';
    }
    if (deser) {
      var deserEsc = escapeHtml(deser);
      out += '<div class="cc-godroll-deser" style="margin-top:5px;font-size:0.68em;line-height:1.3;color:rgba(200,230,255,0.82);">'
        + '<div style="opacity:0.8;font-weight:700;margin-bottom:2px;">Deserialized</div>'
        + '<pre style="margin:0;max-height:4.2em;overflow:auto;white-space:pre-wrap;word-break:break-all;font-family:Consolas,ui-monospace,monospace;background:rgba(0,0,0,0.22);padding:4px 6px;border-radius:4px;border:1px solid rgba(255,180,80,0.2);" title="' + escapeAttr(deser) + '">'
        + deserEsc
        + '</pre></div>';
    }
    return out;
  }

  var deserCache = new Map();
  function getCachedDeserialized(item) {
    var s = String(item && item.serial || '').trim();
    if (!s) return '';
    if (deserCache.has(s)) return deserCache.get(s);
    var d = godrollDeserializedForDisplay(item);
    deserCache.set(s, d);
    return d;
  }

  function looksGenericItemName(name) {
    var s = String(name || '').trim();
    if (!s) return true;
    if (/^godroll item$/i.test(s)) return true;
    if (/^item\s+\d+:\d+$/i.test(s)) return true;
    if (/^unknown$/i.test(s)) return true;
    return false;
  }

  function findBundledNameForSerial(serial) {
    var list = (window.STX_SERIALS_DATA && Array.isArray(window.STX_SERIALS_DATA.serials))
      ? window.STX_SERIALS_DATA.serials
      : [];
    if (!list.length) return '';
    var want = String(serial || '').trim();
    if (!want) return '';
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      if (!it) continue;
      if (String(it.serial || '').trim() === want) {
        return String(it.name || '').trim();
      }
    }
    return '';
  }

  function pickTitleFromRpParts(rpNorm) {
    if (!rpNorm || !rpNorm.length) return '';
    var i;
    var pn;
    for (i = 0; i < rpNorm.length; i++) {
      if (String(rpNorm[i].part_type || '') !== 'Barrel') continue;
      var bn = String(rpNorm[i].name || '').trim();
      if (bn && !isUglyInternalPartLabel(bn)) return bn;
    }
    for (i = 0; i < rpNorm.length; i++) {
      var pt = String(rpNorm[i].part_type || '');
      pn = String(rpNorm[i].name || '').trim();
      if (!pn || isUglyInternalPartLabel(pn)) continue;
      if (pt === 'Body' || pt === 'Name+Skin' || pt === 'Name+Skin+Leg Effect') continue;
      if (pt === 'Manufacturer Part' || pt === 'Barrel') return pn;
    }
    for (i = 0; i < rpNorm.length; i++) {
      pn = String(rpNorm[i].name || '').trim();
      if (pn && !isUglyInternalPartLabel(pn)) return pn;
    }
    return '';
  }

  function effectiveGodrollName(item) {
    var raw = String((item && item.name) || '').trim();
    if (!looksGenericItemName(raw)) return raw;
    var metaName = '';
    try {
      if (window.parseSerialMeta && item && item.serial) {
        metaName = String((window.parseSerialMeta(item.serial) || {}).name || '').trim();
      }
    } catch (_e) {}
    if (!looksGenericItemName(metaName)) return metaName;
    var bundledName = findBundledNameForSerial(item && item.serial);
    if (!looksGenericItemName(bundledName)) return bundledName;
    var fromRp = pickTitleFromRpParts(item && item.rpParts);
    if (fromRp) return fromRp;
    var makerType = [titleCaseWords(item && item.manufacturer), titleCaseWords(item && item.itemType)]
      .filter(Boolean)
      .join(' ');
    if (makerType) return makerType;
    return 'Godroll Item';
  }

  function mergeBundledGodrolls() {
    var bySerial = {};
    function add(arr, cat) {
      if (!Array.isArray(arr)) return;
      var j;
      for (j = 0; j < arr.length; j++) {
        var n = normalizeGodrollEntry(arr[j], cat);
        if (!n || !n.serial) continue;
        bySerial[n.serial] = n;
      }
    }
    add(window.STX_GODROLL_DATA, 'community');
    add(window.STX_GODROLL_GRIMEEY_DATA, 'keepinitgrimeeys');
    return Object.keys(bySerial).map(function (k) { return bySerial[k]; });
  }

  function loadGodrolls() {
    if (godrollData) return Promise.resolve(godrollData);
    if (godrollLoadPromise) return godrollLoadPromise;
    var ensure = (typeof window.__ccEnsureGodrollBundles === 'function')
      ? window.__ccEnsureGodrollBundles()
      : Promise.resolve();
    godrollLoadPromise = ensure.then(function () {
      var merged = mergeBundledGodrolls();
      if (merged.length) {
        godrollData = merged;
        return godrollData;
      }
      var proto = (typeof location !== 'undefined' && location.protocol) || '';
      if (proto === 'file:' || proto === 'chrome-extension:' || proto === 'moz-extension:') {
        godrollData = [];
        return godrollData;
      }
      return fetch('./assets/data/godroll_serials.json')
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(function (data) {
          var arr = Array.isArray(data) ? data : (Array.isArray(data && data.items) ? data.items : []);
          godrollData = arr.map(function (e) { return normalizeGodrollEntry(e, 'community'); }).filter(Boolean);
          return godrollData;
        })
        .catch(function () {
          godrollData = [];
          return godrollData;
        });
    });
    return godrollLoadPromise;
  }

  function buildGodrollSearchHay(item, allowDecode) {
    var parts = [
      String(item.name || '').toLowerCase(),
      String(item.serial || '').toLowerCase(),
      String(item.manufacturer || '').toLowerCase(),
      String(item.itemType || '').toLowerCase(),
      String(item.rarity || '').toLowerCase(),
      String(item.prefixHint || '').toLowerCase(),
      formatGodrollPartsLine(item.rpParts || [], { max: 200 }).toLowerCase(),
    ];
    if (allowDecode) {
      if (item.deserialized) parts.push(String(item.deserialized).toLowerCase());
      else parts.push(String(getCachedDeserialized(item) || '').toLowerCase());
      if (window.parseSerialMeta) {
        try {
          var meta = window.parseSerialMeta(item.serial);
          if (meta.familyId != null && meta.itemId != null) {
            parts.push(String(meta.familyId) + ':' + String(meta.itemId));
          }
          if (meta.name) parts.push(String(meta.name).toLowerCase());
        } catch (_e) {}
      }
    }
    return parts.join('\x00');
  }

  function ensureGodrollSearchIndex(done) {
    if (godrollSearchIndexReady || !godrollData || !godrollData.length) {
      if (done) done();
      return;
    }
    if (godrollIndexInFlight) {
      ensureGodrollSearchIndex.__pendingDone = done;
      return;
    }
    godrollIndexInFlight = true;
    var i = 0;
    function step() {
      var end = Math.min(i + INDEX_CHUNK_SIZE, godrollData.length);
      for (; i < end; i++) {
        if (!godrollData[i].__searchHay) {
          godrollData[i].__searchHay = buildGodrollSearchHay(godrollData[i], false);
        }
      }
      if (i < godrollData.length) {
        scheduleIndexStep(step);
      } else {
        godrollSearchIndexReady = true;
        godrollIndexInFlight = false;
        var pending = ensureGodrollSearchIndex.__pendingDone;
        ensureGodrollSearchIndex.__pendingDone = null;
        if (done) done();
        if (pending && pending !== done) pending();
      }
    }
    step();
  }

  function matchesGodroll(item, q) {
    if (!q) return true;
    var hay = item.__searchHay || buildGodrollSearchHay(item, false);
    if (hay.indexOf(q) >= 0) return true;
    if (!item.__searchHayDecoded) {
      item.__searchHayDecoded = buildGodrollSearchHay(item, true);
    }
    return item.__searchHayDecoded.indexOf(q) >= 0;
  }

  function filterGodrollPool(pool, q) {
    if (!pool) return [];
    if (!q) return pool;
    return pool.filter(function (item) { return matchesGodroll(item, q); });
  }

  function renderGodrollResults(items) {
    var el = byId('godrollSearchResults');
    if (!el) return;
    el.innerHTML = '';
    if (!items || !items.length) {
      el.innerHTML = '<div style="color:rgba(255,255,255,0.62);font-size:0.9em;">No Godroll matches.</div>';
      return;
    }
    items.slice(0, godrollRenderLimit).forEach(function (item) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:flex-start;gap:10px;padding:8px;background:rgba(255,180,60,0.08);border-radius:6px;margin-bottom:6px;border:1px solid rgba(255,170,70,0.28);cursor:pointer;';
      row.setAttribute('data-serial', item.serial || '');
      var meta = window.parseSerialMeta ? window.parseSerialMeta(item.serial) : {};
      var nm = effectiveGodrollName(item);
      var lvl = Number.isFinite(item.level) ? (' Lv' + item.level) : (Number.isFinite(meta.level) ? (' Lv' + meta.level) : '');
      var idStr = (meta.familyId != null && meta.itemId != null) ? ' (' + meta.familyId + ':' + meta.itemId + ')' : '';
      var badge = [item.manufacturer, item.itemType, item.rarity].filter(Boolean).join(' · ');
      var hint = String(item.prefixHint || '').trim();
      var hintLine = '';
      if (hint && hint.toLowerCase() !== String(nm || '').trim().toLowerCase()) {
        hintLine = '<div style="font-size:0.78em;color:rgba(255,235,190,0.92);margin-top:2px;">' + escapeHtml(hint) + '</div>';
      }
      var bundledListName = findBundledNameForSerial(item.serial);
      var bundledLine = '';
      if (bundledListName) {
        var nmNorm = String(nm || '').trim().toLowerCase();
        var bNorm = bundledListName.trim().toLowerCase();
        var redundant = nmNorm && (nmNorm === bNorm || nmNorm.indexOf(bNorm) >= 0 || bNorm.indexOf(nmNorm) >= 0);
        if (!redundant) {
          bundledLine = '<div style="font-size:0.76em;color:rgba(170,255,210,0.9);margin-top:3px;">Prefix / item list match: ' + escapeHtml(bundledListName) + '</div>';
        }
      }
      row.innerHTML = '<div style="flex:1;min-width:0;color:rgba(255,248,230,0.96);font-size:0.9em;">'
        + escapeHtml(nm + lvl + idStr)
        + hintLine
        + bundledLine
        + (badge ? '<div style="font-size:0.76em;color:rgba(255,220,170,0.82);margin-top:2px;">' + escapeHtml(badge) + '</div>' : '')
        + buildGodrollDetailBlockHtml(item)
        + (godrollShouldShowFullStats() ? buildGodrollStatsBlockHtml(item) : '')
        + '</div>'
        + '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Copy serial to clipboard">Copy</button>'
        + '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to editor">Editor</button>'
        + '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to character backpack">YAML</button>'
        + '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to profile bank">Bank</button>';
      var btns = row.querySelectorAll('button');
      btns[0].addEventListener('click', function (e) {
        e.stopPropagation();
        var ser = String(item.serial || '').trim();
        if (!ser) return;
        try { navigator.clipboard.writeText(ser); } catch (_) {}
      });
      btns[1].addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.importSerialToEditor) window.importSerialToEditor(item.serial);
      });
      btns[2].addEventListener('click', function (e) {
        e.stopPropagation();
        lastGodrollSelected = item;
        var n = getGlobalYamlInjectCopies();
        if (window.appendSerialToYAML && window.appendSerialToYAML(item.serial, n)) {
          openSaveYamlDrawer();
        } else {
          alertYamlInjectNeedSave('backpack');
        }
      });
      btns[3].addEventListener('click', function (e) {
        e.stopPropagation();
        lastGodrollSelected = item;
        var nb = getGlobalYamlInjectCopies();
        if (window.appendSerialToProfileBank && window.appendSerialToProfileBank(item.serial, nb)) {
          openSaveYamlDrawer();
        } else {
          alertYamlInjectNeedSave('bank');
        }
      });
      row.addEventListener('click', function () { lastGodrollSelected = item; });
      el.appendChild(row);
    });
    if (items.length > godrollRenderLimit) {
      var moreWrap = document.createElement('div');
      moreWrap.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;';
      var more = document.createElement('div');
      more.style.cssText = 'color:rgba(255,235,185,0.75);font-size:0.85em;';
      more.textContent = 'Showing ' + godrollRenderLimit + ' of ' + items.length + '.';
      var moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'btn';
      moreBtn.style.cssText = 'padding:4px 8px;font-size:11px;';
      moreBtn.textContent = 'Show more';
      moreBtn.addEventListener('click', function () {
        godrollRenderLimit += 80;
        renderGodrollResults(items);
      });
      moreWrap.appendChild(more);
      moreWrap.appendChild(moreBtn);
      el.appendChild(moreWrap);
    }
  }

  function openSaveYamlDrawer() {
    var drawer = byId('rp-saveyaml-drawer');
    if (drawer) {
      drawer.classList.add('rp-open');
      document.body.classList.add('rp-saveyaml-drawer-open');
    }
  }

  function applySearch() {
    var q = getSearchText();
    var statusEl = byId('prefixItemSearchStatus');
    if (!serialsData) return;
    lastSelected = null;
    if (!q) prefixRenderLimit = 80;
    if (q && q.length < MIN_SEARCH_QUERY_LEN) {
      if (statusEl) {
        statusEl.textContent = 'Type at least ' + MIN_SEARCH_QUERY_LEN + ' characters to search ' + serialsData.length + ' serials.';
      }
      renderResults([]);
      return;
    }
    var filtered = filterSerials(q);
    if (statusEl) statusEl.textContent = q ? (filtered.length + ' matches') : (serialsData.length + ' serials loaded — showing first ' + Math.min(prefixRenderLimit, filtered.length) + (filtered.length > prefixRenderLimit ? ' (use Show more)' : '') + '.');
    renderResults(filtered);
  }

  function runPrefixSearch() {
    if (!prefixSearchBootstrapped) {
      bootstrapPrefixSearch();
      return;
    }
    var q = getSearchText();
    if (!serialSearchIndexReady && serialsData && serialsData.length && q && q.length >= MIN_SEARCH_QUERY_LEN) {
      var statusEl = byId('prefixItemSearchStatus');
      if (statusEl) statusEl.textContent = 'Building search index…';
      ensureSerialSearchIndex(applySearch);
      return;
    }
    applySearch();
  }

  function schedulePrefixSearch(immediate) {
    clearTimeout(prefixSearchDebounceTimer);
    if (immediate) {
      runPrefixSearch();
      return;
    }
    prefixSearchDebounceTimer = setTimeout(runPrefixSearch, SEARCH_DEBOUNCE_MS);
  }

  function getGodrollSearchText() {
    var el = byId('godrollSearchInput');
    return el ? String(el.value || '').trim().toLowerCase() : '';
  }

  function getGodrollCategoryFilter() {
    var sel = byId('godrollCategorySelect');
    return sel ? String(sel.value || '').trim() : '';
  }

  function syncGodrollCategoryHoverTip() {
    var sel = byId('godrollCategorySelect');
    if (!sel) return;
    var idx = typeof sel.selectedIndex === 'number' ? sel.selectedIndex : -1;
    var opt = (idx >= 0 && sel.options && sel.options[idx]) ? sel.options[idx] : null;
    var tip = opt ? String(opt.getAttribute('title') || '').trim() : '';
    sel.title = tip;
    var helper = byId('godrollCategoryTip');
    if (helper) {
      helper.title = tip;
      helper.style.display = tip ? 'inline-flex' : 'none';
    }
  }

  function getGodrollCategoryPool() {
    if (!godrollData) return [];
    var catFilter = getGodrollCategoryFilter();
    if (!catFilter) return godrollData;
    return godrollData.filter(function (item) { return item.godrollCategory === catFilter; });
  }

  function applyGodrollSearch() {
    var q = getGodrollSearchText();
    var statusEl = byId('godrollSearchStatus');
    if (!godrollData) return;
    lastGodrollSelected = null;
    if (!q) godrollRenderLimit = 80;
    var categoryFilter = getGodrollCategoryFilter();
    var pool = getGodrollCategoryPool();
    if (q && q.length < MIN_SEARCH_QUERY_LEN) {
      if (statusEl) {
        statusEl.textContent = 'Type at least ' + MIN_SEARCH_QUERY_LEN + ' characters to search Godrolls.';
      }
      renderGodrollResults([]);
      return;
    }
    var filtered = filterGodrollPool(pool, q);
    if (statusEl) {
      if (categoryFilter) {
        statusEl.textContent = q
          ? (filtered.length + ' matches in this category')
          : (filtered.length + ' in category · type to search');
      } else {
        statusEl.textContent = q ? (filtered.length + ' Godroll matches') : (godrollData.length + ' Godrolls loaded — showing first ' + Math.min(godrollRenderLimit, filtered.length) + (filtered.length > godrollRenderLimit ? ' (use Show more)' : '') + '.');
      }
    }
    renderGodrollResults(filtered);
  }

  function runGodrollSearch() {
    if (!godrollSearchBootstrapped) {
      bootstrapGodrollSearch();
      return;
    }
    var q = getGodrollSearchText();
    if (!godrollSearchIndexReady && godrollData && godrollData.length && q && q.length >= MIN_SEARCH_QUERY_LEN) {
      ensureGodrollSearchIndex(applyGodrollSearch);
      return;
    }
    applyGodrollSearch();
  }

  function scheduleGodrollSearch(immediate) {
    clearTimeout(godrollSearchDebounceTimer);
    if (immediate) {
      runGodrollSearch();
      return;
    }
    godrollSearchDebounceTimer = setTimeout(runGodrollSearch, SEARCH_DEBOUNCE_MS);
  }

  function wireGodrollFileLoad() {
    var pickBtn = byId('godrollLoadFileBtn');
    var fileInput = byId('godrollFileInput');
    if (pickBtn && fileInput) {
      pickBtn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var f = fileInput.files && fileInput.files[0];
        if (!f) return;
        var fr = new FileReader();
        fr.onload = function () {
          try {
            var raw = JSON.parse(String(fr.result || ''));
            var arr = Array.isArray(raw) ? raw : (Array.isArray(raw && raw.items) ? raw.items : []);
            godrollData = arr.map(function (e) { return normalizeGodrollEntry(e, 'imported'); }).filter(Boolean);
            lastGodrollSelected = null;
            godrollSearchIndexReady = false;
            runGodrollSearch();
          } catch (e) {
            var statusEl = byId('godrollSearchStatus');
            if (statusEl) statusEl.textContent = 'Invalid JSON file.';
          }
        };
        fr.readAsText(f);
        fileInput.value = '';
      });
    }
  }

  var prefixSearchBootstrapped = false;
  function bootstrapPrefixSearch() {
    if (prefixSearchBootstrapped) return;
    prefixSearchBootstrapped = true;
    var statusEl = byId('prefixItemSearchStatus');
    if (statusEl) statusEl.textContent = 'Loading serials…';
    loadSerials().then(function () {
      if (statusEl) {
        statusEl.textContent = serialsData.length
          ? (serialsData.length + ' serials loaded. Type to search.')
          : 'Serials not loaded.';
      }
      applySearch();
    });
  }

  var godrollSearchBootstrapped = false;
  function bootstrapGodrollSearch() {
    if (godrollSearchBootstrapped) return;
    godrollSearchBootstrapped = true;
    var st = byId('godrollSearchStatus');
    if (st) st.textContent = 'Loading Godroll list…';
    loadGodrolls().then(function () {
      if (st) st.textContent = godrollData && godrollData.length
        ? (godrollData.length + ' Godroll serials loaded. Type to search.')
        : 'Godroll list not bundled.';
      try {
        runGodrollSearch();
      } catch (e) {
        console.error('Godroll UI update failed', e);
        if (st) st.textContent = 'Godroll list loaded but UI error — check console.';
      }
      syncGodrollCategoryHoverTip();
    });
  }

  try { window.__ccBootstrapPrefixItemSearch = bootstrapPrefixSearch; } catch (_) {}
  try { window.__ccBootstrapGodrollSearch = bootstrapGodrollSearch; } catch (_) {}

  function init() {
    var searchInput = byId('prefixItemSearchInput');
    var addEditorBtn = byId('prefixItemAddToEditorBtn');
    var addYamlBtn = byId('prefixItemAddToYamlBtn');
    var addBankBtn = byId('prefixItemAddToBankBtn');
    var godrollSearchInput = byId('godrollSearchInput');
    var godrollAddEditorBtn = byId('godrollAddToEditorBtn');
    var godrollAddYamlBtn = byId('godrollAddToYamlBtn');
    var godrollAddBankBtn = byId('godrollAddToBankBtn');
    var copyBtn = byId('prefixItemCopyBtn');
    var godrollCopyBtn = byId('godrollCopyBtn');

    if (searchInput) {
      searchInput.addEventListener('focus', function () { bootstrapPrefixSearch(); }, { passive: true });
      searchInput.addEventListener('input', function () { schedulePrefixSearch(false); });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') schedulePrefixSearch(true);
      });
    }

    if (addEditorBtn) {
      addEditorBtn.addEventListener('click', function () {
        if (!lastSelected) {
          var q = getSearchText();
          var filtered = filterSerials(q);
          if (filtered.length === 1) lastSelected = filtered[0];
        }
        if (lastSelected && window.importSerialToEditor) {
          window.importSerialToEditor(lastSelected.serial);
        } else {
          alert('Search and click a result first, or narrow to one match.');
        }
      });
    }

    if (addYamlBtn) {
      addYamlBtn.addEventListener('click', function () {
        if (!lastSelected) {
          var q = getSearchText();
          var filtered = filterSerials(q);
          if (filtered.length === 1) lastSelected = filtered[0];
        }
        if (lastSelected && window.appendSerialToYAML) {
          var ok = window.appendSerialToYAML(lastSelected.serial, getGlobalYamlInjectCopies());
          if (ok) {
            openSaveYamlDrawer();
          } else {
            alertYamlInjectNeedSave('backpack');
          }
        } else {
          alert('Search and click a result first, or narrow to one match.');
        }
      });
    }

    if (addBankBtn) {
      addBankBtn.addEventListener('click', function () {
        if (!lastSelected) {
          var q = getSearchText();
          var filtered = filterSerials(q);
          if (filtered.length === 1) lastSelected = filtered[0];
        }
        if (lastSelected && window.appendSerialToProfileBank) {
          var okb = window.appendSerialToProfileBank(lastSelected.serial, getGlobalYamlInjectCopies());
          if (okb) openSaveYamlDrawer();
          else alertYamlInjectNeedSave('bank');
        } else {
          alert('Search and click a result first, or narrow to one match.');
        }
      });
    }
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        if (!lastSelected) {
          var q = getSearchText();
          var filtered = filterSerials(q);
          if (filtered.length === 1) lastSelected = filtered[0];
        }
        if (lastSelected && lastSelected.serial) {
          try { navigator.clipboard.writeText(String(lastSelected.serial).trim()); } catch (_) {}
        } else {
          alert('Search and click a result first, or narrow to one match.');
        }
      });
    }

    if (godrollSearchInput) {
      godrollSearchInput.addEventListener('focus', function () { bootstrapGodrollSearch(); }, { passive: true });
      godrollSearchInput.addEventListener('input', function () { scheduleGodrollSearch(false); });
      godrollSearchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') scheduleGodrollSearch(true);
      });
    }
    var showStatsToggle = byId('godrollShowFullStatsToggle');
    if (showStatsToggle) {
      showStatsToggle.addEventListener('change', function () { runGodrollSearch(); });
    }
    var godrollCatSel = byId('godrollCategorySelect');
    if (godrollCatSel) {
      godrollCatSel.addEventListener('change', function () { runGodrollSearch(); });
      godrollCatSel.addEventListener('change', syncGodrollCategoryHoverTip);
    }
    if (godrollAddEditorBtn) {
      godrollAddEditorBtn.addEventListener('click', function () {
        if (!lastGodrollSelected) {
          var q = getGodrollSearchText();
          var filtered = filterGodrollPool(getGodrollCategoryPool(), q);
          if (filtered.length === 1) lastGodrollSelected = filtered[0];
        }
        if (lastGodrollSelected && window.importSerialToEditor) window.importSerialToEditor(lastGodrollSelected.serial);
        else alert('Search and click a Godroll result first, or narrow to one match.');
      });
    }
    if (godrollCopyBtn) {
      godrollCopyBtn.addEventListener('click', function () {
        if (!lastGodrollSelected) {
          var q = getGodrollSearchText();
          var filtered = filterGodrollPool(getGodrollCategoryPool(), q);
          if (filtered.length === 1) lastGodrollSelected = filtered[0];
        }
        if (lastGodrollSelected && lastGodrollSelected.serial) {
          try { navigator.clipboard.writeText(String(lastGodrollSelected.serial).trim()); } catch (_) {}
        } else {
          alert('Search and click a Godroll result first, or narrow to one match.');
        }
      });
    }
    if (godrollAddYamlBtn) {
      godrollAddYamlBtn.addEventListener('click', function () {
        if (!lastGodrollSelected) {
          var q = getGodrollSearchText();
          var filtered = filterGodrollPool(getGodrollCategoryPool(), q);
          if (filtered.length === 1) lastGodrollSelected = filtered[0];
        }
        if (lastGodrollSelected && window.appendSerialToYAML) {
          var ok = window.appendSerialToYAML(lastGodrollSelected.serial, getGlobalYamlInjectCopies());
          if (ok) {
            openSaveYamlDrawer();
          } else {
            alertYamlInjectNeedSave('backpack');
          }
        } else {
          alert('Search and click a Godroll result first, or narrow to one match.');
        }
      });
    }
    if (godrollAddBankBtn) {
      godrollAddBankBtn.addEventListener('click', function () {
        if (!lastGodrollSelected) {
          var q = getGodrollSearchText();
          var filtered = filterGodrollPool(getGodrollCategoryPool(), q);
          if (filtered.length === 1) lastGodrollSelected = filtered[0];
        }
        if (lastGodrollSelected && window.appendSerialToProfileBank) {
          var okg = window.appendSerialToProfileBank(lastGodrollSelected.serial, getGlobalYamlInjectCopies());
          if (okg) openSaveYamlDrawer();
          else alertYamlInjectNeedSave('bank');
        } else {
          alert('Search and click a Godroll result first, or narrow to one match.');
        }
      });
    }
    wireGodrollFileLoad();

    if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
