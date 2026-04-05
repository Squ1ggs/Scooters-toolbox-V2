/**
 * cc-prefix-item-search-rebuild.js
 * Prefix/Item Search and Add - search bundled serials by name, prefix, or ID.
 */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

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
  var prefixRenderLimit = 80;
  var godrollRenderLimit = 80;

  var loadPromise = null;
  function loadSerials() {
    if (serialsData) return Promise.resolve(serialsData);
    if (window.STX_SERIALS_DATA && window.STX_SERIALS_DATA.serials) {
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
    loadPromise = fetch('./assets/data/serials.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        serialsData = data && data.serials ? data.serials : [];
        return serialsData;
      })
      .catch(function (e) {
        serialsData = [];
        console.warn('Could not load serials.json. Click "Load from file" or use embedded serials.', e);
        return serialsData;
      });
    return loadPromise;
  }

  function getSearchText() {
    var el = byId('prefixItemSearchInput');
    return el ? String(el.value || '').trim().toLowerCase() : '';
  }

  function matches(item, q) {
    if (!q) return true;
    var name = String(item.name || '').toLowerCase();
    var serial = String(item.serial || '').toLowerCase();
    if (name.indexOf(q) >= 0) return true;
    if (serial.indexOf(q) >= 0) return true;
    if (window.parseSerialMeta) {
      var meta = window.parseSerialMeta(item.serial);
      var idStr = (meta.familyId != null && meta.itemId != null) ? (meta.familyId + ':' + meta.itemId) : '';
      if (idStr && idStr.indexOf(q) >= 0) return true;
      if (meta.name && String(meta.name).toLowerCase().indexOf(q) >= 0) return true;
    }
    return false;
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
      row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px;background:rgba(0,200,255,0.06);border-radius:6px;margin-bottom:6px;border:1px solid rgba(0,200,255,0.15);cursor:pointer;';
      row.setAttribute('data-serial', item.serial || '');
      var name = item.name || 'Unknown';
      var meta = window.parseSerialMeta ? window.parseSerialMeta(item.serial) : {};
      var level = Number.isFinite(meta.level) ? ' Lv' + meta.level : '';
      var idStr = (meta.familyId != null && meta.itemId != null) ? ' (' + meta.familyId + ':' + meta.itemId + ')' : '';
      row.innerHTML = '<div style="flex:1;color:rgba(255,255,255,0.95);font-size:0.9em;">' + escapeHtml(name + level + idStr) + '</div>' +
        '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to editor">Editor</button>' +
        '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to character backpack">YAML</button>' +
        '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to profile bank">Bank</button>';
      var btns = row.querySelectorAll('button');
      btns[0].addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.importSerialToEditor) window.importSerialToEditor(item.serial);
      });
      btns[1].addEventListener('click', function (e) {
        e.stopPropagation();
        lastSelected = item;
        if (window.appendSerialToYAML && window.appendSerialToYAML(item.serial)) {
          openSaveYamlDrawer();
        } else {
          alert('Load a character save YAML (root state:) with a backpack section first.');
        }
      });
      btns[2].addEventListener('click', function (e) {
        e.stopPropagation();
        lastSelected = item;
        if (window.appendSerialToProfileBank && window.appendSerialToProfileBank(item.serial)) {
          openSaveYamlDrawer();
        } else {
          alert('Load profile .sav or YAML first.');
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
    return {
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
      rpParts: rpNorm.slice()
    };
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
    var deser = godrollDeserializedForDisplay(item);
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
    var merged = mergeBundledGodrolls();
    if (merged.length) {
      godrollData = merged;
      return Promise.resolve(godrollData);
    }
    if (godrollLoadPromise) return godrollLoadPromise;
    var proto = (typeof location !== 'undefined' && location.protocol) || '';
    if (proto === 'file:' || proto === 'chrome-extension:' || proto === 'moz-extension:') {
      godrollData = [];
      godrollLoadPromise = Promise.resolve(godrollData);
      return godrollLoadPromise;
    }
    godrollLoadPromise = fetch('./assets/data/godroll_serials.json')
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
    return godrollLoadPromise;
  }

  function matchesGodroll(item, q) {
    if (!q) return true;
    var name = String(item.name || '').toLowerCase();
    var serial = String(item.serial || '').toLowerCase();
    var maker = String(item.manufacturer || '').toLowerCase();
    var type = String(item.itemType || '').toLowerCase();
    var rarity = String(item.rarity || '').toLowerCase();
    var ph = String(item.prefixHint || '').toLowerCase();
    if (name.indexOf(q) >= 0 || serial.indexOf(q) >= 0 || maker.indexOf(q) >= 0 || type.indexOf(q) >= 0 || rarity.indexOf(q) >= 0 || ph.indexOf(q) >= 0) return true;
    if (window.parseSerialMeta) {
      var meta = window.parseSerialMeta(item.serial);
      var idStr = (meta.familyId != null && meta.itemId != null) ? (meta.familyId + ':' + meta.itemId) : '';
      if (idStr && idStr.indexOf(q) >= 0) return true;
      if (meta.name && String(meta.name).toLowerCase().indexOf(q) >= 0) return true;
    }
    var partsHay = formatGodrollPartsLine(item.rpParts || [], { max: 200 }).toLowerCase();
    if (partsHay && partsHay.indexOf(q) >= 0) return true;
    var desHay = String(item.deserialized || godrollDeserializedForDisplay(item) || '').toLowerCase();
    if (desHay && desHay.indexOf(q) >= 0) return true;
    return false;
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
        + '</div>'
        + '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to editor">Editor</button>'
        + '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to character backpack">YAML</button>'
        + '<button type="button" class="btn" style="padding:4px 8px;font-size:11px;" title="Add to profile bank">Bank</button>';
      var btns = row.querySelectorAll('button');
      btns[0].addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.importSerialToEditor) window.importSerialToEditor(item.serial);
      });
      btns[1].addEventListener('click', function (e) {
        e.stopPropagation();
        lastGodrollSelected = item;
        if (window.appendSerialToYAML && window.appendSerialToYAML(item.serial)) {
          openSaveYamlDrawer();
        } else {
          alert('Load a character save YAML (root state:) with a backpack section first.');
        }
      });
      btns[2].addEventListener('click', function (e) {
        e.stopPropagation();
        lastGodrollSelected = item;
        if (window.appendSerialToProfileBank && window.appendSerialToProfileBank(item.serial)) {
          openSaveYamlDrawer();
        } else {
          alert('Load profile .sav or YAML first.');
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

  function doSearch() {
    var q = getSearchText();
    var statusEl = byId('prefixItemSearchStatus');
    if (!serialsData) {
      if (statusEl) statusEl.textContent = 'Loading serials…';
      loadSerials().then(function () {
        if (statusEl) statusEl.textContent = serialsData.length + ' serials loaded.';
        applySearch();
      });
      return;
    }
    applySearch();
  }

  function applySearch() {
    var q = getSearchText();
    var statusEl = byId('prefixItemSearchStatus');
    if (!serialsData) return;
    lastSelected = null;
    if (!q) prefixRenderLimit = 80;
    var filtered = serialsData.filter(function (item) { return matches(item, q); });
    if (statusEl) statusEl.textContent = q ? (filtered.length + ' matches') : (serialsData.length + ' serials loaded. Showing popular/start of list.');
    renderResults(filtered);
  }

  function getGodrollSearchText() {
    var el = byId('godrollSearchInput');
    return el ? String(el.value || '').trim().toLowerCase() : '';
  }

  function getGodrollCategoryFilter() {
    var sel = byId('godrollCategorySelect');
    return sel ? String(sel.value || '').trim() : '';
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
    var filtered = pool.filter(function (item) { return matchesGodroll(item, q); });
    if (statusEl) {
      if (categoryFilter) {
        statusEl.textContent = q
          ? (filtered.length + ' matches in this category')
          : (filtered.length + ' in category · type to search');
      } else {
        statusEl.textContent = q ? (filtered.length + ' Godroll matches') : (godrollData.length + ' Godroll serials loaded. Showing start of list.');
      }
    }
    renderGodrollResults(filtered);
  }

  function doGodrollSearch() {
    var statusEl = byId('godrollSearchStatus');
    if (!godrollData) {
      if (statusEl) statusEl.textContent = 'Loading Godroll list…';
      loadGodrolls().then(function () { applyGodrollSearch(); });
      return;
    }
    applyGodrollSearch();
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
            applyGodrollSearch();
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

  function init() {
    var searchInput = byId('prefixItemSearchInput');
    var addEditorBtn = byId('prefixItemAddToEditorBtn');
    var addYamlBtn = byId('prefixItemAddToYamlBtn');
    var addBankBtn = byId('prefixItemAddToBankBtn');
    var godrollSearchInput = byId('godrollSearchInput');
    var godrollAddEditorBtn = byId('godrollAddToEditorBtn');
    var godrollAddYamlBtn = byId('godrollAddToYamlBtn');
    var godrollAddBankBtn = byId('godrollAddToBankBtn');

    if (searchInput) {
      searchInput.addEventListener('input', doSearch);
    }

    if (addEditorBtn) {
      addEditorBtn.addEventListener('click', function () {
        if (!lastSelected) {
          var q = getSearchText();
          var filtered = serialsData ? serialsData.filter(function (item) { return matches(item, q); }) : [];
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
          var filtered = serialsData ? serialsData.filter(function (item) { return matches(item, q); }) : [];
          if (filtered.length === 1) lastSelected = filtered[0];
        }
        if (lastSelected && window.appendSerialToYAML) {
          var ok = window.appendSerialToYAML(lastSelected.serial);
          if (ok) {
            openSaveYamlDrawer();
          } else {
            alert('Load a character save YAML (root state:) with a backpack section first.');
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
          var filtered = serialsData ? serialsData.filter(function (item) { return matches(item, q); }) : [];
          if (filtered.length === 1) lastSelected = filtered[0];
        }
        if (lastSelected && window.appendSerialToProfileBank) {
          var okb = window.appendSerialToProfileBank(lastSelected.serial);
          if (okb) openSaveYamlDrawer();
          else alert('Load profile .sav or YAML first.');
        } else {
          alert('Search and click a result first, or narrow to one match.');
        }
      });
    }

    if (godrollSearchInput) {
      godrollSearchInput.addEventListener('input', doGodrollSearch);
    }
    var godrollCatSel = byId('godrollCategorySelect');
    if (godrollCatSel) {
      godrollCatSel.addEventListener('change', doGodrollSearch);
    }
    if (godrollAddEditorBtn) {
      godrollAddEditorBtn.addEventListener('click', function () {
        if (!lastGodrollSelected) {
          var q = getGodrollSearchText();
          var filtered = getGodrollCategoryPool().filter(function (item) { return matchesGodroll(item, q); });
          if (filtered.length === 1) lastGodrollSelected = filtered[0];
        }
        if (lastGodrollSelected && window.importSerialToEditor) window.importSerialToEditor(lastGodrollSelected.serial);
        else alert('Search and click a Godroll result first, or narrow to one match.');
      });
    }
    if (godrollAddYamlBtn) {
      godrollAddYamlBtn.addEventListener('click', function () {
        if (!lastGodrollSelected) {
          var q = getGodrollSearchText();
          var filtered = getGodrollCategoryPool().filter(function (item) { return matchesGodroll(item, q); });
          if (filtered.length === 1) lastGodrollSelected = filtered[0];
        }
        if (lastGodrollSelected && window.appendSerialToYAML) {
          var ok = window.appendSerialToYAML(lastGodrollSelected.serial);
          if (ok) {
            openSaveYamlDrawer();
          } else {
            alert('Load a character save YAML (root state:) with a backpack section first.');
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
          var filtered = getGodrollCategoryPool().filter(function (item) { return matchesGodroll(item, q); });
          if (filtered.length === 1) lastGodrollSelected = filtered[0];
        }
        if (lastGodrollSelected && window.appendSerialToProfileBank) {
          var okg = window.appendSerialToProfileBank(lastGodrollSelected.serial);
          if (okg) openSaveYamlDrawer();
          else alert('Load profile .sav or YAML first.');
        } else {
          alert('Search and click a Godroll result first, or narrow to one match.');
        }
      });
    }
    wireGodrollFileLoad();

    loadSerials().then(function () {
      var statusEl = byId('prefixItemSearchStatus');
      if (statusEl) {
        statusEl.textContent = serialsData.length
          ? serialsData.length + ' serials loaded.'
          : 'Serials not loaded.';
      }
      applySearch();
    });
    loadGodrolls().then(function () {
      var st = byId('godrollSearchStatus');
      if (st) st.textContent = godrollData && godrollData.length
        ? (godrollData.length + ' Godroll serials loaded. Type to search.')
        : 'Godroll list not bundled. Click "Load JSON File" to import your list.';
      try {
        doGodrollSearch();
      } catch (e) {
        console.error('Godroll UI update failed', e);
        if (st) st.textContent = 'Godroll list loaded but UI error — check console.';
      }
    });
    if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
