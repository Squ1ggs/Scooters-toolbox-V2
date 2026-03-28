/**
 * cc-yaml-save-rebuild.js
 * YAML backpack parsing, serial list, and delete for the rebuild.
 * Shows item name/level/elements per serial (like bulk deserializer) and Import button.
 */
(function () {
  'use strict';

  var ELEMENT_IDS = { 10: 'Corrosive', 11: 'Cryo', 12: 'Fire', 13: 'Radiation', 14: 'Shock' };

  function byId(id) { return document.getElementById(id); }

  window.extractedSerials = window.extractedSerials || [];
  window.__ccDecodedSerialsCache = window.__ccDecodedSerialsCache || {};

  var YAML_SERIALS_PAGE_SIZE = 50;
  var YAML_DECODE_CHUNK_SIZE = 400;
  if (window.__yamlSerialsPageIndex == null) window.__yamlSerialsPageIndex = 0;

  function cacheKeyVariants(raw) {
    var s = String(raw || '').trim().replace(/^["']|["']$/g, '');
    if (!s) return [];
    var out = [s];
    if (s.length > 2 && s.indexOf('@U') === 0) out.push(s.slice(2));
    var unquoted = s.replace(/^["']|["']$/g, '');
    if (unquoted !== s) out.push(unquoted);
    return Array.from(new Set(out));
  }

  function buildSerialsNameMap() {
    if (window.__ccSerialsNameMap) return window.__ccSerialsNameMap;
    var map = Object.create(null);
    var arr = (window.STX_SERIALS_DATA && window.STX_SERIALS_DATA.serials) || [];
    for (var i = 0; i < arr.length; i++) {
      var ent = arr[i];
      if (!ent || !ent.serial || !ent.name) continue;
      var keys = cacheKeyVariants(ent.serial);
      for (var k = 0; k < keys.length; k++) map[keys[k]] = ent.name;
    }
    window.__ccSerialsNameMap = map;
    return map;
  }

  function lookupNameBySerial(serial) {
    var keys = cacheKeyVariants(serial);
    var map = buildSerialsNameMap();
    for (var i = 0; i < keys.length; i++) {
      if (map[keys[i]]) return map[keys[i]];
    }
    return '';
  }

  function parseSerialMeta(serial) {
    var s = String(serial || '').trim().replace(/^["']|["']$/g, '');
    var out = { name: '', level: null, elements: [], familyId: null, itemId: null, deserialized: '' };
    if (!s) return out;
    var cache = window.__ccDecodedSerialsCache;
    var keys = cacheKeyVariants(s);
    var c = null;
    if (cache) {
      for (var ki = 0; ki < keys.length; ki++) {
        if (cache[keys[ki]]) { c = cache[keys[ki]]; break; }
      }
    }
    if (c && (c.success !== false || c.deserialized)) {
      out.name = c.baseName || c.name || '';
      out.level = c.level != null ? c.level : null;
      out.familyId = c.itemTypeId != null ? c.itemTypeId : null;
      out.itemId = c.itemId != null ? c.itemId : null;
      out.deserialized = c.deserialized || '';
      if (c.resolvedParts && Array.isArray(c.resolvedParts)) {
        for (var i = 0; i < c.resolvedParts.length; i++) {
          var rp = c.resolvedParts[i];
          var rawRef = (rp && (rp.raw || rp.t || rp.ref));
          if (rawRef) {
            var em = String(rawRef).match(/^\{\s*1\s*:\s*(\d+)\s*\}$/);
            if (em) {
              var elemId = parseInt(em[1], 10);
              if (elemId >= 10 && elemId <= 14) out.elements.push(ELEMENT_IDS[elemId] || 'Element ' + elemId);
            }
          }
        }
      }
      if ((looksLikePartOrStatName(out.name) || /^Item\s+\d+:\d+$/i.test(out.name || '')) && out.deserialized && Number.isFinite(out.familyId)) {
        var fromBarrel = resolveNameFromBarrelOrBodyPart(out.deserialized, out.familyId);
        if (fromBarrel) out.name = fromBarrel;
      }
      if (!out.name) out.name = lookupNameBySerial(s);
      return out;
    }
    var deser = s;
    if (s.indexOf('||') === -1 && s.indexOf(',') === -1 && typeof window.deserializeBase85 === 'function') {
      try {
        var d = window.deserializeBase85(s);
        deser = (d && typeof d.then === 'function') ? '' : String(d || '').trim();
      } catch (_) { deser = ''; }
    }
    var looksDeserialized = deser && (deser.indexOf('||') >= 0 || /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|/.test(deser));
    if (looksDeserialized) out.deserialized = deser;
    if (!deser || !looksDeserialized) return out;
    var head = deser.match(/^\s*(\d+)\s*,\s*\d+\s*,\s*\d+\s*,\s*(\d+)\s*\|\s*(\d+)\s*,\s*(\d+)\s*(?:\||\s)/);
    var headerHasItemId = false;
    if (head) {
      out.familyId = parseInt(head[1], 10);
      out.level = parseInt(head[2], 10);
      out.itemId = parseInt(head[4], 10);
      headerHasItemId = true;
    } else {
      var fb = deser.match(/^\s*(\d+)\s*,\s*\d+\s*,\s*\d+\s*,\s*(\d+)\s*\|/);
      if (fb) {
        out.familyId = parseInt(fb[1], 10);
        out.level = parseInt(fb[2], 10);
      }
    }
    var pairRe = /\{\s*(\d+)\s*:\s*(\d+)\s*\}/g;
    var singleRe = /\{\s*(\d+)\s*\}/g;
    var m;
    var pairs = [];
    while ((m = pairRe.exec(deser))) {
      var fam = parseInt(m[1], 10);
      var id = parseInt(m[2], 10);
      if (Number.isFinite(fam) && Number.isFinite(id)) {
        if (fam === 1 && id >= 10 && id <= 14) out.elements.push(ELEMENT_IDS[id] || 'Element ' + id);
        else if (!out.itemId && fam === out.familyId) out.itemId = id;
        else if (!Number.isFinite(out.familyId)) out.familyId = fam;
        pairs.push({ fam: fam, id: id });
      }
    }
    singleRe.lastIndex = 0;
    var singles = [];
    while ((m = singleRe.exec(deser))) {
      var sid = parseInt(m[1], 10);
      if (Number.isFinite(sid)) singles.push(sid);
    }
    for (var si = 1; si < singles.length; si += 2) {
      var fa = singles[si - 1];
      var ib = singles[si];
      if (Number.isFinite(fa) && Number.isFinite(ib) && fa >= 1 && fa <= 999 && ib >= 1 && ib <= 9999) {
        if (fa === 1 && ib >= 10 && ib <= 14) out.elements.push(ELEMENT_IDS[ib] || 'Element ' + ib);
        else if (!out.itemId && fa === out.familyId) out.itemId = ib;
        else if (!Number.isFinite(out.familyId)) out.familyId = fa;
        pairs.push({ fam: fa, id: ib });
      }
    }
    if (!headerHasItemId) {
      if (!out.itemId && singles.length && pairs.length === 0) {
        out.itemId = singles[0];
        if (!Number.isFinite(out.familyId)) out.familyId = 1;
      }
      if (!out.itemId && Number.isFinite(out.familyId) && singles.length) {
        out.itemId = singles[0];
      }
      if (!Number.isFinite(out.itemId) && pairs.length) {
        var pick = out.familyId ? pairs.find(function (p) { return p.fam === out.familyId; }) : null;
        pick = pick || pairs[0];
        if (pick) { out.itemId = pick.id; if (!Number.isFinite(out.familyId)) out.familyId = pick.fam; }
      }
    }
    out.name = resolveItemNameByFamilyId(out.familyId, out.itemId);
    if ((looksLikePartOrStatName(out.name) || /^Item\s+\d+:\d+$/i.test(out.name || '')) && out.deserialized && Number.isFinite(out.familyId)) {
      var fromBarrel = resolveNameFromBarrelOrBodyPart(out.deserialized, out.familyId);
      if (fromBarrel) out.name = fromBarrel;
    }
    if (!out.name || /^Item\s+\d+:\d+$/i.test(out.name)) {
      var bySerial = lookupNameBySerial(s);
      if (bySerial) out.name = bySerial;
    }
    return out;
  }

  function looksLikePartOrStatName(name) {
    var n = String(name || '').trim();
    return !n || /^comp[_\-]?\d{2}\s*(epic|legendary|rare|uncommon|common)$/i.test(n) ||
      /^Comp\s+\d{2}\s+(Epic|Legendary|Rare|Uncommon|Common)$/i.test(n) ||
      /^Status\s+Effect\s+(Application\s+Chance|Damage)$/i.test(n) ||
      /^(Legendary|Epic|Rare|Uncommon|Common)$/i.test(n) ||
      /^(Skill|Action\s+Skill)\s+(Damage|Application\s+Chance)$/i.test(n) ||
      /^part[_\.]/i.test(n) || /^[A-Z]{3,5}[_\.]/i.test(n);
  }

  function resolveNameFromBarrelOrBodyPart(deser, familyId) {
    if (!deser || !Number.isFinite(familyId)) return '';
    var all = (window.STX_DATASET && window.STX_DATASET.ALL_PARTS) ? window.STX_DATASET.ALL_PARTS : [];
    var candidates = [];
    var pairRe = /\{\s*(\d+)\s*:\s*(\d+)\s*\}/g;
    var listRe = /\{\s*(\d+)\s*:\s*\[([^\]]*)\]\s*\}/g;
    var m;
    while ((m = pairRe.exec(deser))) {
      var fam = parseInt(m[1], 10);
      var id = parseInt(m[2], 10);
      if (Number.isFinite(fam) && Number.isFinite(id)) candidates.push({ fam: fam, id: id });
    }
    listRe.lastIndex = 0;
    while ((m = listRe.exec(deser))) {
      var fam = parseInt(m[1], 10);
      var ids = (m[2] || '').match(/\d+/g) || [];
      for (var i = 0; i < ids.length; i++) candidates.push({ fam: fam, id: parseInt(ids[i], 10) });
    }
    var bareRe = /\{\s*(\d+)\s*\}/g;
    bareRe.lastIndex = 0;
    while ((m = bareRe.exec(deser))) {
      var id = parseInt(m[1], 10);
      if (Number.isFinite(id)) candidates.push({ fam: familyId, id: id });
    }
    var preferPartTypes = ['Barrel', 'Body', 'Main Part', 'Name+Skin'];
    var sameFamily = [];
    var otherFamily = [];
    for (var ci = 0; ci < candidates.length; ci++) {
      if (candidates[ci].fam === familyId) sameFamily.push(candidates[ci]);
      else otherFamily.push(candidates[ci]);
    }
    var orderedCandidates = sameFamily.concat(otherFamily);
    for (var pt = 0; pt < preferPartTypes.length; pt++) {
      for (var ci = 0; ci < orderedCandidates.length; ci++) {
        var c = orderedCandidates[ci];
        for (var a = 0; a < all.length; a++) {
          var p = all[a];
          if (!p || (c.fam != null && (p.family == null || Number(p.family) !== c.fam)) || (p.id != null && Number(p.id) !== c.id)) continue;
          var idRaw = String(p.idRaw || p.idraw || '').trim();
          if (idRaw && idRaw !== (c.fam + ':' + c.id) && idRaw !== String(c.id)) continue;
          var ptName = String(p.partType || '').trim();
          if (ptName !== preferPartTypes[pt]) continue;
          var name = p.name || p.legendaryName || p.displayName || '';
          if (name && !looksLikePartOrStatName(name)) return name;
        }
      }
    }
    for (var ci = 0; ci < orderedCandidates.length; ci++) {
      var c = orderedCandidates[ci];
      for (var a = 0; a < all.length; a++) {
        var p = all[a];
        if (!p || (c.fam != null && (p.family == null || Number(p.family) !== c.fam)) || (p.id != null && Number(p.id) !== c.id)) continue;
        var name = p.name || p.legendaryName || p.displayName || '';
        if (name && !looksLikePartOrStatName(name)) return name;
      }
    }
    return '';
  }

  function isItemCategory(cat, partType) {
    var c = String(cat || '').toLowerCase();
    var pt = String(partType || '').toLowerCase();
    if (/^(classmod|weapon|shield|grenade|enhancement|repkit|artifact|heavy)$/.test(c)) return true;
    if (pt === 'rarity' || pt === 'perk') return false;
    return true;
  }

  function resolveItemNameByFamilyId(fam, id) {
    if (!Number.isFinite(fam) && !Number.isFinite(id)) return '';
    var all = (window.STX_DATASET && window.STX_DATASET.ALL_PARTS) ? window.STX_DATASET.ALL_PARTS : [];
    var idRaw = Number.isFinite(fam) && Number.isFinite(id) ? (fam + ':' + id) : '';
    var fallback = '';
    var itemFallback = '';
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p) continue;
      var pr = String(p.idRaw || p.idraw || '').trim();
      var name = p.name || p.legendaryName || p.displayName || '';
      var match = (idRaw && pr === idRaw) ||
        (Number.isFinite(fam) && Number.isFinite(id) && p.family != null && p.id != null && Number(p.family) === fam && Number(p.id) === id) ||
        (Number.isFinite(id) && !Number.isFinite(fam) && (pr === String(id) || (p.id != null && Number(p.id) === id)));
      if (!match) continue;
      if (!looksLikePartOrStatName(name) && isItemCategory(p.category, p.partType)) return name;
      if (!looksLikePartOrStatName(name)) itemFallback = itemFallback || name;
      if (!fallback) fallback = name;
    }
    if (itemFallback) return itemFallback;
    if (fallback) return fallback;
    if (Number.isFinite(id) && idRaw) {
      for (var j = 0; j < all.length; j++) {
        var q = all[j];
        if (!q) continue;
        var qr = String(q.idRaw || q.idraw || '').trim();
        var qn = q.name || q.legendaryName || q.displayName || '';
        if ((qr === String(id) || (q.id != null && Number(q.id) === id)) && !looksLikePartOrStatName(qn)) return qn;
      }
    }
    if (window.__ccAdvStableCodeIdMapV1 && Number.isFinite(fam) && Number.isFinite(id)) {
      var codeNorm = Object.keys(window.__ccAdvStableCodeIdMapV1).find(function (k) {
        var v = window.__ccAdvStableCodeIdMapV1[k];
        return v && Number(v.family) === fam && Number(v.id) === id;
      });
      if (codeNorm) {
        var hit = window.__lookupPartByImportCode && window.__lookupPartByImportCode(codeNorm);
        if (hit) return hit.name || hit.legendaryName || '';
      }
    }
    if (Number.isFinite(fam) && Number.isFinite(id)) {
      return 'Item ' + fam + ':' + id;
    }
    return '';
  }

  function getYamlText() {
    var el = byId('yamlInput') || byId('fullYamlInput');
    return { text: el ? (el.value || '') : '', el: el };
  }

  function setYamlText(text) {
    var el = byId('yamlInput') || byId('fullYamlInput');
    if (el) el.value = text;
    if (typeof window.scheduleParseYAMLBackpack === 'function') window.scheduleParseYAMLBackpack(80);
  }

  function extractBackpackSerialsSimple(yamlText) {
    var serials = [];
    var text = String(yamlText || '');
    var lines = text.split(/\r?\n/);
    var inBackpack = false;
    var baseIndent = 999;
    var slotNum = null;
    var serial = '';
    var slotIdx = 0;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var m = line.match(/^(\s*)(\S?)/);
      var lineIndent = m ? m[1].length : 0;
      var content = line.trim();

      if (/^backpack\s*:?\s*$/i.test(content)) {
        inBackpack = true;
        baseIndent = lineIndent;
        slotIdx = 0;
        continue;
      }
      if (inBackpack && content && lineIndent <= baseIndent) {
        inBackpack = false;
      }
      if (!inBackpack) continue;

      var slotMatch = line.match(/^\s*slot_(\d+)\s*:\s*$/i) ||
        line.match(/^\s*-\s*slot\s*:\s*(\d+)/i) ||
        line.match(/^\s*slot\s*:\s*(\d+)/i);
      if (slotMatch) {
        if (slotNum != null) serials.push({ slot: slotNum, serial: serial || '' });
        slotNum = parseInt(slotMatch[1], 10);
        serial = '';
      } else {
        var dashSlot = line.match(/^\s*-\s*$/);
        if (dashSlot && lineIndent > baseIndent) {
          if (slotNum != null) serials.push({ slot: slotNum, serial: serial || '' });
          slotNum = slotIdx++;
          serial = '';
        }
      }
      var serialMatch = line.match(/^\s*serial\s*:\s*(.+)/i);
      if (serialMatch && slotNum != null) {
        serial = String(serialMatch[1]).trim().replace(/^["']|["']$/g, '');
      }
    }
    if (slotNum != null) serials.push({ slot: slotNum, serial: serial || '' });
    return serials;
  }

  function computeMaxBackpackSlotFromExtracted(serials) {
    var maxSlot = -1;
    var arr = serials || [];
    for (var i = 0; i < arr.length; i++) {
      var sl = arr[i] && arr[i].slot;
      if (sl == null) continue;
      var n = parseInt(sl, 10);
      if (Number.isFinite(n) && n > maxSlot) maxSlot = n;
    }
    return maxSlot;
  }

  function nextAvailableBackpackSlot(yamlText) {
    return computeMaxBackpackSlotFromExtracted(extractBackpackSerialsSimple(yamlText)) + 1;
  }

  function updateYamlNextSlotDisplay() {
    var slotInfo = byId('yaml-auto-slot-info');
    if (!slotInfo) return;
    var yamlText = getYamlText().text;
    if (!yamlText || !String(yamlText).trim()) {
      slotInfo.textContent = 'Next available slot: —';
      return;
    }
    var lines = String(yamlText).split(/\r?\n/);
    if (!findBackpackBlock(lines)) {
      slotInfo.textContent = 'Next available slot: — (no backpack: section)';
      return;
    }
    slotInfo.textContent = 'Next available slot: ' + nextAvailableBackpackSlot(yamlText);
  }

  function importSerialToEditor(serial) {
    var s = String(serial || '').trim();
    if (!s) return;
    var importBox = byId('importBox');
    var outCode = byId('outCode');
    var pasteDetails = byId('rebuildPasteCodeDetails');
    var toPut = s;
    var looksLikeBase85 = s.indexOf('||') < 0 && s.indexOf('{') < 0 && s.length > 20;
    if (looksLikeBase85 && typeof window.deserializeBase85 === 'function') {
      try {
        var deser = window.deserializeBase85(s);
        if (deser && typeof deser === 'string' && deser.trim().length) toPut = deser.trim();
      } catch (_) {}
    }
    if (importBox) importBox.value = toPut;
    if (outCode) outCode.value = toPut;
    if (!importBox && !outCode) {
      var yamlAdd = byId('yamlAddSerialsInput');
      if (yamlAdd) {
        var cur = String(yamlAdd.value || '').trim();
        yamlAdd.value = cur ? (cur + '\n' + toPut) : toPut;
      }
    }
    if (pasteDetails && !pasteDetails.open) pasteDetails.open = true;
    try {
      if (typeof window.importTokens === 'function') window.importTokens();
      if (typeof window.refreshOutputs === 'function') window.refreshOutputs();
      if (typeof window.refreshBuilder === 'function') window.refreshBuilder();
    } catch (_) {}
  }
  window.importSerialToEditor = importSerialToEditor;

  function createSerialRowElement(item, idx) {
    var meta = parseSerialMeta(item.serial);
    var row = document.createElement('div');
    row.className = 'yaml-serial-row';
    row.style.cssText = 'padding:10px;background:rgba(0,200,255,0.08);border:1px solid rgba(0,200,255,0.25);border-radius:6px;margin-bottom:8px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:10px;';
    var left = document.createElement('div');
    left.style.flex = '1';
    left.style.minWidth = '0';
    var nameLevel = (meta.name || 'Unknown Item') + (Number.isFinite(meta.level) ? ' | Level ' + meta.level : '');
    var elementsHtml = '';
    if (meta.elements && meta.elements.length) {
      elementsHtml = '<div style="color:rgba(0,243,255,0.85);font-size:0.85em;margin-top:4px;">Elements: ' + meta.elements.join(', ') + '</div>';
    }
    var deserDisplay = meta.deserialized ? escapeHtml(meta.deserialized) : '';
    var codeDisplay = deserDisplay || escapeHtml((item.serial || '').substring(0, 120)) + ((item.serial && item.serial.length > 120) ? '…' : '');
    var codeLabel = deserDisplay ? 'Deserialized:' : 'Serial:';
    var rawSerialHtml = item.serial ? ('<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;">Base85: ' + escapeHtml((item.serial || '').substring(0, 60)) + ((item.serial && item.serial.length > 60) ? '…' : '') + '</div>') : '';
    left.innerHTML = '<div style="color:#00c8ff;font-size:12px;">Slot ' + (item.slot != null ? item.slot : idx + 1) + '</div>' +
      '<div style="color:rgba(255,255,255,0.9);font-size:0.9em;margin-top:4px;">' + escapeHtml(nameLevel) + '</div>' +
      elementsHtml +
      '<div style="margin-top:6px;"><span style="font-size:10px;color:rgba(0,243,255,0.7);">' + codeLabel + '</span><code style="display:block;word-break:break-all;font-size:11px;color:rgba(255,255,255,0.85);margin-top:2px;">' + codeDisplay + '</code></div>' +
      (deserDisplay ? rawSerialHtml : '');
    var right = document.createElement('div');
    right.style.display = 'flex';
    right.style.gap = '8px';
    right.style.flexWrap = 'wrap';
    var copyBtn = document.createElement('button');
    copyBtn.className = 'btn';
    copyBtn.textContent = 'Copy';
    copyBtn.type = 'button';
    copyBtn.addEventListener('click', function () {
      try { navigator.clipboard.writeText(item.serial || ''); } catch (_) {}
    });
    var importBtn = document.createElement('button');
    importBtn.className = 'btn btn-Firmware';
    importBtn.textContent = 'Import';
    importBtn.type = 'button';
    importBtn.title = 'Import into editor / builder';
    importBtn.addEventListener('click', function () { importSerialToEditor(item.serial); });
    var delBtn = document.createElement('button');
    delBtn.className = 'btn';
    delBtn.textContent = 'Delete';
    delBtn.type = 'button';
    delBtn.setAttribute('data-serial', item.serial || '');
    delBtn.setAttribute('data-delete-for', String(item.slot != null ? item.slot : idx));
    delBtn.addEventListener('click', function () {
      var slot = this.getAttribute('data-delete-for');
      if (slot) window.deleteYAMLSerial(parseInt(slot, 10));
      else window.deleteYAMLSerial(this.getAttribute('data-serial'));
    });
    right.appendChild(copyBtn);
    right.appendChild(importBtn);
    right.appendChild(delBtn);
    row.appendChild(left);
    row.appendChild(right);
    return row;
  }

  function refreshBackpackUI() {
    updateYamlNextSlotDisplay();
    var container = byId('yaml-serials-container');
    var countEl = byId('yaml-serial-count');
    var pageRow = byId('yaml-serials-pagination');
    var pageInfo = byId('yaml-serials-page-info');
    var prevBtn = byId('yaml-serials-prev-btn');
    var nextBtn = byId('yaml-serials-next-btn');
    if (!container) return;

    var list = window.extractedSerials || [];
    var total = list.length;
    if (countEl) countEl.textContent = total;

    var bulkHint = byId('yaml-serials-bulk-hint');
    if (bulkHint) bulkHint.style.display = total > 200 ? 'block' : 'none';

    var totalPages = total ? Math.ceil(total / YAML_SERIALS_PAGE_SIZE) : 1;
    if (window.__yamlSerialsPageIndex >= totalPages) window.__yamlSerialsPageIndex = Math.max(0, totalPages - 1);
    if (window.__yamlSerialsPageIndex < 0) window.__yamlSerialsPageIndex = 0;

    var page = window.__yamlSerialsPageIndex;
    var start = page * YAML_SERIALS_PAGE_SIZE;
    var slice = list.slice(start, start + YAML_SERIALS_PAGE_SIZE);

    if (pageRow) {
      if (total > YAML_SERIALS_PAGE_SIZE) {
        pageRow.style.display = 'flex';
        if (pageInfo) {
          var endShown = Math.min(start + slice.length, total);
          pageInfo.textContent = 'Showing ' + (total ? start + 1 : 0) + '–' + endShown + ' of ' + total;
        }
        if (prevBtn) prevBtn.disabled = page <= 0;
        if (nextBtn) nextBtn.disabled = page >= totalPages - 1;
      } else {
        pageRow.style.display = 'none';
      }
    }

    container.innerHTML = '';
    slice.forEach(function (item, sliceIdx) {
      var idx = start + sliceIdx;
      container.appendChild(createSerialRowElement(item, idx));
    });
  }
  window.refreshBackpackUI = refreshBackpackUI;

  (function wireYamlSerialPagination() {
    var prev = byId('yaml-serials-prev-btn');
    var next = byId('yaml-serials-next-btn');
    if (!prev || prev._yamlPageBound) return;
    prev._yamlPageBound = true;
    prev.addEventListener('click', function () {
      if (window.__yamlSerialsPageIndex > 0) {
        window.__yamlSerialsPageIndex--;
        refreshBackpackUI();
      }
    });
    if (next) {
      next.addEventListener('click', function () {
        var list = window.extractedSerials || [];
        var tp = list.length ? Math.ceil(list.length / YAML_SERIALS_PAGE_SIZE) : 1;
        if (window.__yamlSerialsPageIndex < tp - 1) {
          window.__yamlSerialsPageIndex++;
          refreshBackpackUI();
        }
      });
    }
  })();

  var SESSION_HANDOFF_MAX = 4 * 1024 * 1024 - 65536;

  (function wireBulkDecoderHandoff() {
    var linesBtn = byId('yaml-serials-open-bulk-btn');
    var yamlBtn = byId('yaml-serials-open-bulk-yaml-btn');
    if (!linesBtn || linesBtn._bulkHandoffBound) return;
    linesBtn._bulkHandoffBound = true;
    linesBtn.addEventListener('click', function () {
      var list = window.extractedSerials || [];
      var out = [];
      for (var i = 0; i < list.length; i++) {
        var s = String((list[i] && list[i].serial) || '').trim();
        if (s) out.push(s);
      }
      if (!out.length) {
        alert('No serials found in the loaded YAML backpack.');
        return;
      }
      var text = out.join('\n');
      if (text.length > SESSION_HANDOFF_MAX) {
        alert('Serial list is too large for a browser handoff (~4MB cap). Save YAML to a file and open it in the bulk deserializer, or copy a section at a time.');
        return;
      }
      try {
        sessionStorage.setItem('stx_bulk_decoder_prefill', text);
      } catch (e) {
        alert('Could not store handoff: ' + (e && e.message ? e.message : String(e)));
        return;
      }
      var bulkDec = (typeof window.STX_BULK_DECODER_PAGE === 'string' && window.STX_BULK_DECODER_PAGE) ? window.STX_BULK_DECODER_PAGE : './legacy/bl4-bulk-decoder.html';
      window.open(bulkDec + (bulkDec.indexOf('?') >= 0 ? '&' : '?') + 'prefill=1', '_blank', 'noopener,noreferrer');
    });
    if (yamlBtn) {
      yamlBtn.addEventListener('click', function () {
        var t = getYamlText();
        var text = (t && t.text) ? String(t.text) : '';
        if (!text.trim()) {
          alert('No YAML in the editor.');
          return;
        }
        if (text.length > SESSION_HANDOFF_MAX) {
          alert('YAML is larger than the ~4MB browser handoff limit. Save it as a file and use File → pick in the bulk deserializer instead.');
          return;
        }
        try {
          sessionStorage.setItem('stx_bulk_decoder_prefill_yaml', text);
        } catch (e) {
          alert('Could not store handoff: ' + (e && e.message ? e.message : String(e)));
          return;
        }
        var bulkDecY = (typeof window.STX_BULK_DECODER_PAGE === 'string' && window.STX_BULK_DECODER_PAGE) ? window.STX_BULK_DECODER_PAGE : './legacy/bl4-bulk-decoder.html';
        window.open(bulkDecY + (bulkDecY.indexOf('?') >= 0 ? '&' : '?') + 'prefill_yaml=1', '_blank', 'noopener,noreferrer');
      });
    }
  })();

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function findBackpackBlock(lines) {
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/^(\s*)backpack\s*:?\s*$/i);
      if (m) return { headerIndex: i, headerIndent: (m[1] || '').length };
    }
    for (var j = 0; j < lines.length; j++) {
      if (/^\s*inventory:\s*$/.test(lines[j])) {
        var invIndent = (lines[j].match(/^(\s*)/) || ['', ''])[1].length;
        for (var k = j + 1; k < lines.length; k++) {
          if (!lines[k].trim()) continue;
          var ki = (lines[k].match(/^(\s*)/) || ['', ''])[1].length;
          if (ki <= invIndent) break;
          if (/^\s*items:\s*$/.test(lines[k])) {
            var itemsIndent = ki;
            for (var n = k + 1; n < lines.length; n++) {
              if (!lines[n].trim()) continue;
              var ni = (lines[n].match(/^(\s*)/) || ['', ''])[1].length;
              if (ni <= itemsIndent) break;
              var bm = lines[n].match(/^(\s*)backpack\s*:?\s*$/i);
              if (bm) return { headerIndex: n, headerIndent: (bm[1] || '').length };
            }
          }
        }
      }
    }
    return null;
  }

  function findSlotInLines(lines, start, end, slotNum) {
    for (var i = start; i < end; i++) {
      var m = lines[i].match(/^\s*slot_(\d+)\s*:\s*$/i) ||
        lines[i].match(/^\s*-\s*slot\s*:\s*(\d+)/i) ||
        lines[i].match(/^\s*slot\s*:\s*(\d+)/i);
      if (m && parseInt(m[1], 10) === slotNum) return i;
    }
    return -1;
  }

  function findSlotBlockEnd(lines, headerIndex, maxEnd) {
    var slotIndent = (lines[headerIndex].match(/^(\s*)/) || ['', ''])[1].length;
    var i = headerIndex + 1;
    while (i < maxEnd && i < lines.length) {
      var line = lines[i];
      var m = line.match(/^(\s*)\S/);
      var indent = m ? m[1].length : 0;
      if (!line.trim()) { i++; continue; }
      if (indent <= slotIndent) break;
      i++;
    }
    return i;
  }

  window.deleteYAMLSerial = function (serialOrIndex) {
    try {
      var yamlText = getYamlText().text;
      if (!yamlText || !String(yamlText).trim()) return false;

      var lines = String(yamlText).split(/\r?\n/);
      var bp = findBackpackBlock(lines);
      if (!bp) return false;

      var headerIndent = bp.headerIndent != null ? bp.headerIndent : 999;
      var end = lines.length;
      for (var i = bp.headerIndex + 1; i < lines.length; i++) {
        var m = lines[i].match(/^(\s*)\S/);
        if (m && lines[i].trim() && (m[1] || '').length <= headerIndent) { end = i; break; }
      }

      var slotNum = null;
      if (typeof serialOrIndex === 'number' && Number.isFinite(serialOrIndex)) {
        slotNum = Math.floor(serialOrIndex);
      } else {
        var raw = String(serialOrIndex || '').trim();
        var extracted = window.extractedSerials || [];
        for (var j = 0; j < extracted.length; j++) {
          if (String(extracted[j].serial) === raw && extracted[j].slot != null) {
            slotNum = parseInt(extracted[j].slot, 10);
            break;
          }
        }
        if (slotNum == null && /^\d+$/.test(raw)) slotNum = parseInt(raw, 10);
      }

      if (!Number.isFinite(slotNum)) return false;

      var headerIndex = findSlotInLines(lines, bp.headerIndex, end, slotNum);
      if (headerIndex < 0) return false;

      var blockEnd = findSlotBlockEnd(lines, headerIndex, end);
      var newLines = lines.slice(0, headerIndex).concat(lines.slice(blockEnd));
      var updated = newLines.join('\n');
      setYamlText(updated);

      window.extractedSerials = (window.extractedSerials || []).filter(function (it) {
        return String(it.slot) !== String(slotNum);
      });
      refreshBackpackUI();
      return true;
    } catch (e) {
      return false;
    }
  };

  function populateCacheFromDecodedResults(results) {
    var cache = window.__ccDecodedSerialsCache || {};
    window.__ccDecodedSerialsCache = cache;
    var count = 0;
    if (!Array.isArray(results)) return 0;
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (!r || !r.input) continue;
      var key = String(r.input).trim().replace(/^["']|["']$/g, '');
      if (!key) continue;
      var entry = {
        input: r.input,
        success: r.success,
        deserialized: r.deserialized,
        itemTypeId: r.itemTypeId,
        itemId: r.itemId,
        level: r.level,
        baseName: r.baseName,
        name: r.baseName || r.name,
        manufacturer: r.manufacturer,
        itemType: r.itemType,
        rarity: r.rarity,
        resolvedParts: r.resolvedParts
      };
      var keys = cacheKeyVariants(key);
      for (var k = 0; k < keys.length; k++) cache[keys[k]] = entry;
      count++;
    }
    return count;
  }

  window.parseYAMLBackpack = function () {
    var yamlText = getYamlText().text;
    if (!yamlText || !String(yamlText).trim()) {
      window.extractedSerials = [];
      window.__yamlSerialsPageIndex = 0;
      refreshBackpackUI();
      return;
    }
    window.__yamlSerialsPageIndex = 0;
    window.extractedSerials = extractBackpackSerialsSimple(yamlText);
    refreshBackpackUI();

    var serials = window.extractedSerials || [];
    var seen = Object.create(null);
    var toDecode = [];
    for (var i = 0; i < serials.length; i++) {
      var s = String((serials[i] && serials[i].serial) || '').trim().replace(/^["']|["']$/g, '');
      if (!s || s.length < 10 || seen[s]) continue;
      seen[s] = true;
      toDecode.push(s);
    }
    if (toDecode.length === 0 || typeof window.decodeSerialsViaBridge !== 'function') return;

    if (typeof window.initStxDecoderBridge === 'function') window.initStxDecoderBridge();

    var offset = 0;
    function decodeNextChunk() {
      if (offset >= toDecode.length) return;
      var chunk = toDecode.slice(offset, offset + YAML_DECODE_CHUNK_SIZE);
      offset += chunk.length;
      window.decodeSerialsViaBridge(chunk, function (results) {
        if (results && results.length) {
          var fixed = [];
          for (var j = 0; j < chunk.length; j++) {
            var r = results[j] || {};
            var entry = {};
            for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) entry[k] = r[k];
            entry.input = chunk[j];
            fixed.push(entry);
          }
          populateCacheFromDecodedResults(fixed);
        }
        if (offset < toDecode.length) setTimeout(decodeNextChunk, 0);
        else if (typeof window.refreshBackpackUI === 'function') window.refreshBackpackUI();
      });
    }
    decodeNextChunk();
  };

  var parseTimer = null;
  window.scheduleParseYAMLBackpack = function (delay) {
    delay = delay || 80;
    if (parseTimer) clearTimeout(parseTimer);
    parseTimer = setTimeout(function () {
      parseTimer = null;
      window.parseYAMLBackpack();
    }, delay);
  };

  (function () {
    var ta = byId('yamlInput');
    if (ta) ta.addEventListener('input', function () { window.scheduleParseYAMLBackpack(150); });
  })();

  window.loadDecodedResultsFromJSON = function (jsonText) {
    try {
      var arr = JSON.parse(String(jsonText || ''));
      if (!Array.isArray(arr)) arr = [arr];
      var count = populateCacheFromDecodedResults(arr);
      if (typeof window.refreshBackpackUI === 'function') window.refreshBackpackUI();
      return count;
    } catch (e) {
      return -1;
    }
  };

  (function () {
    var btn = byId('loadDecodedResultsBtn');
    var input = byId('loadDecodedResultsInput');
    var status = byId('decodedResultsStatus');
    if (btn && input) {
      btn.addEventListener('click', function () { input.click(); });
      input.addEventListener('change', function () {
        var f = input.files && input.files[0];
        input.value = '';
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          var n = window.loadDecodedResultsFromJSON(r.result);
          if (status) status.textContent = n >= 0 ? (n + ' decoded results loaded') : 'Invalid JSON';
          if (n >= 0 && typeof window.refreshBackpackUI === 'function') window.refreshBackpackUI();
        };
        r.readAsText(f);
      });
    }
  })();

  window.appendSerialToYAML = function (serial) {
    var s = String(serial || '').trim();
    if (!s) return false;
    var yaml = getYamlText();
    if (!yaml.text || !yaml.text.trim()) return false;
    var lines = yaml.text.split(/\r?\n/);
    var bp = findBackpackBlock(lines);
    if (!bp) return false;
    var headerIndent = Number(bp.headerIndent) || 0;
    var slotIndent = headerIndent + 2;
    var slotPrefix = (new Array(slotIndent + 1)).join(' ');
    var nextSlot = nextAvailableBackpackSlot(yaml.text);
    var escaped = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    var insertIdx = bp.headerIndex + 1;
    for (var j = bp.headerIndex + 1; j < lines.length; j++) {
      var ln = lines[j];
      var ind = (ln.match(/^(\s*)/) || ['', ''])[1].length;
      if (ln.trim() && ind <= headerIndent) break;
      insertIdx = j + 1;
    }
    var newBlock = slotPrefix + 'slot_' + nextSlot + ':\n' + slotPrefix + '  serial: "' + escaped + '"';
    var newLines = lines.slice(0, insertIdx).concat(newBlock.split('\n'), lines.slice(insertIdx));
    setYamlText(newLines.join('\n'));
    window.scheduleParseYAMLBackpack(50);
    return true;
  };

  function normalizeSerialLineForYamlBackpack(line) {
    var c = String(line || '').trim();
    if (!c || c.charAt(0) === '#') return '';
    var looksLikeBase85 = c.indexOf('||') < 0 && c.indexOf('{') < 0 && c.length > 20;
    if (looksLikeBase85 && typeof window.deserializeBase85 === 'function') {
      try {
        var d = window.deserializeBase85(c);
        if (d && typeof d === 'string' && d.trim().length) return d.trim();
      } catch (_) {}
    }
    return c;
  }

  /** Append multiple serials (one per line). Ignores empty lines and lines starting with #. Returns { added, failed }. */
  window.appendSerialLinesToYAML = function (multiline) {
    var lines = String(multiline || '').split(/\r?\n/);
    var added = 0;
    var failed = 0;
    for (var i = 0; i < lines.length; i++) {
      var s = normalizeSerialLineForYamlBackpack(lines[i]);
      if (!s) continue;
      if (window.appendSerialToYAML && window.appendSerialToYAML(s)) added++;
      else failed++;
    }
    return { added: added, failed: failed };
  };

  window.initYamlAddSerialsSection = function () {
    var ta = byId('yamlAddSerialsInput');
    var btn = byId('yamlAddSerialsBtn');
    var clearBtn = byId('yamlAddSerialsClearBtn');
    var status = byId('yaml-add-serials-status');
    if (!ta || !btn) return;
    btn.addEventListener('click', function () {
      var yaml = getYamlText();
      if (!yaml.text || !yaml.text.trim()) {
        if (status) {
          status.style.display = 'block';
          status.style.color = '#ff9090';
          status.textContent = 'Load or paste YAML in the editor above first (needs a backpack: section).';
        }
        return;
      }
      var raw = ta.value || '';
      if (!String(raw).trim()) {
        if (status) {
          status.style.display = 'block';
          status.style.color = '#ff9090';
          status.textContent = 'Paste at least one serial (one line = one item).';
        }
        return;
      }
      var r = window.appendSerialLinesToYAML ? window.appendSerialLinesToYAML(raw) : { added: 0, failed: 0 };
      if (status) {
        status.style.display = 'block';
        status.style.color = 'rgba(0,200,255,0.95)';
        if (r.added > 0) {
          status.textContent = 'Added ' + r.added + ' item(s) to backpack.' + (r.failed ? ' (' + r.failed + ' line(s) could not be added.)' : '');
          ta.value = '';
        } else {
          status.textContent = 'Nothing added. Use one serial per line (Base85 or deserialized), or confirm the YAML has a backpack block.';
        }
      }
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        ta.value = '';
        if (status) { status.textContent = ''; status.style.display = 'none'; }
      });
    }
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        btn.click();
      }
    });
  };

  window.initSerialSearchSection = function () {
    var fileInput = byId('serialLibraryFileInput');
    var searchInput = byId('serialSearchInput');
    var resultsEl = byId('serial-search-results');
    var statusEl = byId('serial-search-status');
    var selectAllBtn = byId('serialSearchSelectAllBtn');
    var clearBtn = byId('serialSearchClearBtn');
    var addToYamlBtn = byId('serialSearchAddToYamlBtn');
    var addToEditorBtn = byId('serialSearchAddToEditorBtn');
    if (!resultsEl) return;
    window.serialLibrarySerials = window.serialLibrarySerials || [];
    var library = window.serialLibrarySerials;

    function extractSerialsFromText(raw, mode) {
      var out = [];
      var text = String(raw || '').trim();
      if (!text) return out;
      if (mode === 'yaml' || mode === 'yml') {
        var yamlLines = text.split(/\r?\n/);
        for (var i = 0; i < yamlLines.length; i++) {
          var m = yamlLines[i].match(/^\s*(?:-\s*)?serial\s*:\s*(.+)$/i);
          if (m) {
            var v = String(m[1]).trim().replace(/^["']|["']\s*$/g, '');
            if (v) out.push(v);
          }
        }
      } else if (mode === 'json') {
        try {
          var parsed = JSON.parse(text);
          function walk(node) {
            if (Array.isArray(node)) { for (var k = 0; k < node.length; k++) walk(node[k]); return; }
            if (node && typeof node === 'object') {
              if (node.serial && typeof node.serial === 'string') out.push(node.serial.trim());
              if (Array.isArray(node.serials)) for (var k = 0; k < node.serials.length; k++) {
                var v = node.serials[k];
                var s = typeof v === 'string' ? v.trim() : (v && v.serial ? String(v.serial).trim() : '');
                if (s) out.push(s);
              }
              for (var key in node) { if (node.hasOwnProperty(key)) walk(node[key]); }
            }
          }
          walk(parsed);
        } catch (_) {}
      } else {
        var txtLines = text.split(/\r?\n/);
        for (var t = 0; t < txtLines.length; t++) {
          var line = txtLines[t].trim();
          if (line && (line.indexOf('@U') === 0 || line.length > 20)) out.push(line);
        }
      }
      return out;
    }

    function renderResults(filtered) {
      resultsEl.innerHTML = '';
      if (!filtered || !filtered.length) {
        resultsEl.innerHTML = '<div style="color:rgba(255,255,255,0.6);font-size:0.9em;">No serials match.</div>';
        return;
      }
      filtered.forEach(function (item, idx) {
        var meta = parseSerialMeta(item.serial);
        var name = meta.name || 'Unknown Item';
        var level = Number.isFinite(meta.level) ? ' Lv' + meta.level : '';
        var idStr = (meta.familyId != null && meta.itemId != null) ? ' (' + meta.familyId + ':' + meta.itemId + ')' : '';
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px;background:rgba(0,200,255,0.06);border-radius:6px;border:1px solid rgba(0,200,255,0.2);';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = item.selected || false;
        cb.setAttribute('data-idx', String(item._idx));
        cb.addEventListener('change', function () {
          var i = parseInt(this.getAttribute('data-idx'), 10);
          if (Number.isFinite(i) && library[i]) library[i].selected = this.checked;
        });
        var label = document.createElement('label');
        label.style.cssText = 'flex:1;cursor:pointer;color:rgba(255,255,255,0.9);font-size:0.9em;';
        label.appendChild(cb);
        label.appendChild(document.createTextNode(' ' + name + level + idStr));
        row.appendChild(cb);
        row.appendChild(label);
        resultsEl.appendChild(row);
      });
    }

    function applyFilter() {
      var q = (searchInput && searchInput.value || '').trim().toLowerCase();
      var filtered = [];
      for (var i = 0; i < library.length; i++) {
        var it = library[i];
        var meta = parseSerialMeta(it.serial);
        var name = (meta.name || '').toLowerCase();
        var idStr = (meta.familyId != null && meta.itemId != null) ? (meta.familyId + ':' + meta.itemId) : '';
        var serial = (it.serial || '').toLowerCase();
        if (!q || name.indexOf(q) >= 0 || idStr.indexOf(q) >= 0 || serial.indexOf(q) >= 0) {
          filtered.push({ serial: it.serial, selected: it.selected, _idx: i });
        }
      }
      renderResults(filtered);
    }

    var pasteBtn = byId('serialLibraryPasteBtn');
    var pasteArea = byId('serialLibraryPasteArea');
    if (pasteBtn && pasteArea) {
      pasteBtn.addEventListener('click', function () {
        var raw = (pasteArea.value || '').trim();
        if (!raw) { if (statusEl) statusEl.textContent = 'Paste content first.'; return; }
        var mode = /^\s*[{[]/.test(raw) ? 'json' : /(^|\n)\s*(?:-\s*)?serial\s*:\s*['"]?@U/m.test(raw) || /(^|\n)\s*[\w\-]+\s*:\s*/m.test(raw) && /@U/.test(raw) ? 'yaml' : 'txt';
        var extracted = extractSerialsFromText(raw, mode);
        for (var i = 0; i < library.length; i++) if (library[i]) library[i].selected = false;
        library.length = 0;
        for (var e = 0; e < extracted.length; e++) {
          var s = String(extracted[e]).trim();
          if (s) library.push({ serial: s, selected: false });
        }
        if (statusEl) statusEl.textContent = 'Loaded ' + library.length + ' serials from paste.';
        applyFilter();
      });
    }
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        var f = this.files && this.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          var raw = r.result || '';
          var name = (f.name || '').toLowerCase();
          var mode = name.endsWith('.yaml') || name.endsWith('.yml') ? 'yaml' : name.endsWith('.json') ? 'json' : 'txt';
          var extracted = extractSerialsFromText(raw, mode);
          for (var i = 0; i < library.length; i++) if (library[i]) library[i].selected = false;
          library.length = 0;
          for (var e = 0; e < extracted.length; e++) {
            var s = String(extracted[e]).trim();
            if (s) library.push({ serial: s, selected: false });
          }
          if (statusEl) statusEl.textContent = 'Loaded ' + library.length + ' serials from ' + (f.name || 'file') + '.';
          applyFilter();
        };
        r.readAsText(f);
        this.value = '';
      });
    }
    if (searchInput) searchInput.addEventListener('input', applyFilter);
    if (searchInput) searchInput.addEventListener('keyup', applyFilter);
    if (selectAllBtn) selectAllBtn.addEventListener('click', function () {
      var q = (searchInput && searchInput.value || '').trim().toLowerCase();
      for (var i = 0; i < library.length; i++) {
        var it = library[i];
        var meta = parseSerialMeta(it.serial);
        var name = (meta.name || '').toLowerCase();
        var idStr = (meta.familyId != null && meta.itemId != null) ? (meta.familyId + ':' + meta.itemId) : '';
        var serial = (it.serial || '').toLowerCase();
        if (!q || name.indexOf(q) >= 0 || idStr.indexOf(q) >= 0 || serial.indexOf(q) >= 0) it.selected = true;
      }
      applyFilter();
    });
    if (clearBtn) clearBtn.addEventListener('click', function () {
      library.length = 0;
      if (statusEl) statusEl.textContent = '';
      if (searchInput) searchInput.value = '';
      resultsEl.innerHTML = '<div style="color:rgba(255,255,255,0.6);font-size:0.9em;">Load a file or paste serials above to search.</div>';
    });
    if (addToYamlBtn) addToYamlBtn.addEventListener('click', function () {
      var selected = library.filter(function (it) { return it.selected; });
      if (!selected.length) { alert('Select at least one serial first.'); return; }
      var yaml = getYamlText();
      if (!yaml.text || !yaml.text.trim()) { alert('Load a YAML file first.'); return; }
      var added = 0;
      for (var a = 0; a < selected.length; a++) {
        if (window.appendSerialToYAML && window.appendSerialToYAML(selected[a].serial)) added++;
      }
      if (statusEl) statusEl.textContent = 'Added ' + added + ' serial(s) to YAML backpack.';
    });
    if (addToEditorBtn) addToEditorBtn.addEventListener('click', function () {
      var selected = library.filter(function (it) { return it.selected; });
      if (!selected.length) { alert('Select at least one serial first.'); return; }
      var codes = selected.map(function (it) { return it.serial; });
      if (codes.length === 1) {
        importSerialToEditor(codes[0]);
      } else {
        var importBox = byId('importBox');
        var outCode = byId('outCode');
        var pasteDetails = byId('rebuildPasteCodeDetails');
        var parts = [];
        for (var i = 0; i < codes.length; i++) {
          var c = String(codes[i] || '').trim();
          if (!c) continue;
          var looksLikeBase85 = c.indexOf('||') < 0 && c.indexOf('{') < 0 && c.length > 20;
          if (looksLikeBase85 && typeof window.deserializeBase85 === 'function') {
            try {
              var d = window.deserializeBase85(c);
              if (d && typeof d === 'string' && d.trim().length) c = d.trim();
            } catch (_) {}
          }
          parts.push(c);
        }
        var joined = parts.join('\n');
        if (importBox) importBox.value = joined;
        if (outCode) outCode.value = joined;
        if (!importBox && !outCode) {
          var yamlAddM = byId('yamlAddSerialsInput');
          if (yamlAddM) {
            var curM = String(yamlAddM.value || '').trim();
            yamlAddM.value = curM ? (curM + '\n' + joined) : joined;
          }
        }
        if (pasteDetails && !pasteDetails.open) pasteDetails.open = true;
        try {
          if (typeof window.importTokens === 'function') window.importTokens();
          if (typeof window.refreshOutputs === 'function') window.refreshOutputs();
          if (typeof window.refreshBuilder === 'function') window.refreshBuilder();
        } catch (_) {}
      }
      if (statusEl) statusEl.textContent = 'Imported ' + codes.length + ' serial(s) into editor.';
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        if (typeof window.initSerialSearchSection === 'function') window.initSerialSearchSection();
        if (typeof window.initYamlAddSerialsSection === 'function') window.initYamlAddSerialsSection();
      }, 100);
    });
  } else {
    setTimeout(function () {
      if (typeof window.initSerialSearchSection === 'function') window.initSerialSearchSection();
      if (typeof window.initYamlAddSerialsSection === 'function') window.initYamlAddSerialsSection();
    }, 100);
  }
})();
