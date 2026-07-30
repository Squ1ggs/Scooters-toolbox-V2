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

  function yamlTextLengthHint() {
    var ta = byId('yamlInput') || byId('fullYamlInput');
    return ta && ta.value ? ta.value.length : 0;
  }
  function yamlParseDelayHint(explicit) {
    if (explicit != null && explicit > 0) return explicit;
    var len = yamlTextLengthHint();
    if (len > 500000) return 600;
    if (len > 200000) return 400;
    if (len > 80000) return 250;
    if (len > 30000) return 150;
    return 80;
  }
  function yamlDecodeChunkSize(total) {
    if (total > 3000) return 120;
    if (total > 1500) return 200;
    return YAML_DECODE_CHUNK_SIZE;
  }
  function yamlDecodeChunkDelay(total) {
    if (total > 2000) return 16;
    if (total > 800) return 8;
    return 0;
  }

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
    var headerHasItemId = false;
    var headMatch = deser.match(/^\s*(\d+)\s*,\s*\d+\s*,\s*\d+\s*,\s*(\d+)\s*\|([\s\S]*?)\|\|/);
    if (headMatch) {
      out.familyId = parseInt(headMatch[1], 10);
      out.level = parseInt(headMatch[2], 10);
      var flagSegments = String(headMatch[3] || '').split('|').map(function (s) { return String(s || '').trim(); }).filter(Boolean);
      for (var fi = 0; fi < flagSegments.length; fi++) {
        var fsm = flagSegments[fi].match(/^(\d+)\s*,\s*(\d+)\s*$/);
        if (!fsm) continue;
        var fid = parseInt(fsm[1], 10);
        var fval = parseInt(fsm[2], 10);
        if (fid === 2 && Number.isFinite(fval)) {
          out.itemId = fval;
          headerHasItemId = true;
        }
      }
    } else {
      var head = deser.match(/^\s*(\d+)\s*,\s*\d+\s*,\s*\d+\s*,\s*(\d+)\s*\|\s*(\d+)\s*,\s*(\d+)\s*(?:\||\s)/);
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

  window.parseSerialMeta = parseSerialMeta;

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
    if (typeof window.getYamlText === 'function') {
      try {
        var w = window.getYamlText();
        if (w && typeof w === 'object' && typeof w.text === 'string') return w;
      } catch (_) {}
    }
    var el = byId('yamlInput') || byId('fullYamlInput') || document.querySelector('textarea[aria-label="YAML editor"]');
    return { text: el ? (el.value || '') : '', el: el };
  }

  function setYamlText(text) {
    if (typeof window.setYamlText === 'function') {
      try {
        window.setYamlText(text);
        if (typeof window.scheduleParseYAMLBackpack === 'function') window.scheduleParseYAMLBackpack(80);
        return;
      } catch (_) {}
    }
    var el = byId('yamlInput') || byId('fullYamlInput') || document.querySelector('textarea[aria-label="YAML editor"]');
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

      if (/^backpack\s*:?\s*$/i.test(content) || /^backpack\s*:\s*\{\}\s*$/i.test(content)) {
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

  function extractBankSerialsSimple(yamlText) {
    var serials = [];
    var text = String(yamlText || '');
    var lines = text.split(/\r?\n/);
    var inBank = false;
    var baseIndent = 999;
    var slotNum = null;
    var serial = '';
    var slotIdx = 0;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var m = line.match(/^(\s*)(\S?)/);
      var lineIndent = m ? m[1].length : 0;
      var content = line.trim();

      if (/^bank\s*:?\s*$/i.test(content)) {
        inBank = true;
        baseIndent = lineIndent;
        slotIdx = 0;
        continue;
      }
      if (inBank && content && lineIndent <= baseIndent) {
        inBank = false;
      }
      if (!inBank) continue;

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

  function nextAvailableBankSlot(yamlText) {
    return computeMaxBackpackSlotFromExtracted(extractBankSerialsSimple(yamlText)) + 1;
  }

  window.__ccExtractBankSerialsSimple = extractBankSerialsSimple;
  window.__ccNextAvailableBankSlot = nextAvailableBankSlot;

  function updateYamlNextSlotDisplay() {
    var slotInfo = byId('yaml-auto-slot-info');
    if (!slotInfo) return;
    var yamlText = getYamlText().text;
    if (!yamlText || !String(yamlText).trim()) {
      slotInfo.textContent = 'Next available slot: —';
      return;
    }
    var kind = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(yamlText) : 'unknown';
    var lines = String(yamlText).split(/\r?\n/);
    if (kind === 'profile') {
      if (!findBankBlock(lines)) {
        slotInfo.textContent = 'Next available slot: — (no bank: section)';
        return;
      }
      slotInfo.textContent = 'Next available slot: ' + nextAvailableBankSlot(yamlText) + ' (profile bank)';
      return;
    }
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
      else {
        if (typeof window.refreshOutputs === 'function') window.refreshOutputs();
        if (typeof window.refreshBuilder === 'function') window.refreshBuilder();
      }
    } catch (_) {}
    try {
      if (typeof window.__ccEnsureBuildStatsData === 'function') {
        window.__ccEnsureBuildStatsData(function () {
          try { if (typeof window.refreshBuildStatsCore === 'function') window.refreshBuildStatsCore(); } catch (_) {}
        });
      } else if (typeof window.refreshBuildStatsCore === 'function') {
        window.refreshBuildStatsCore();
      }
    } catch (_) {}
  }
  window.importSerialToEditor = importSerialToEditor;

  function getDecodedCacheForSerial(serial) {
    var cache = window.__ccDecodedSerialsCache;
    if (!cache) return null;
    var keys = cacheKeyVariants(String(serial || '').trim());
    for (var ki = 0; ki < keys.length; ki++) {
      if (cache[keys[ki]]) return cache[keys[ki]];
    }
    return null;
  }

  function yamlPartStatsKeyFromRow(p) {
    var alpha = String((p && p.alpha_code) || '').trim().replace(/^"(.*)"$/, '$1');
    if (alpha) return alpha.toLowerCase();
    var key = String((p && p.key) || '').trim();
    if (/^\d+:\d+$/.test(key)) return key;
    return '';
  }

  function formatStatRowBrief(s) {
    var f = String((s && s.stat_field) || '').trim();
    var v = s && s.stat_value;
    if (!f || !Number.isFinite(Number(v))) return '';
    return f.replace(/_value|_scale|_add/g, '') + ': ' + Number(v);
  }

  function buildYamlSerialPartStatsHtml(serial) {
    var c = getDecodedCacheForSerial(serial);
    if (!c || !Array.isArray(c.resolvedParts) || !c.resolvedParts.length) {
      return '<div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:8px;">Part stats unavailable — re-parse YAML or open in bulk decoder first.</div>';
    }
    var byPart = window.PARTS_STATS_DATA && window.PARTS_STATS_DATA.by_part_code;
    var byIdRaw = window.PARTS_STATS_DATA && window.PARTS_STATS_DATA.by_id_raw;
    var blocks = [];
    var maxParts = 12;
    for (var i = 0; i < c.resolvedParts.length && i < maxParts; i++) {
      var p = c.resolvedParts[i];
      if (p && p.unresolved) continue;
      var title = String((p && (p.name || p.pretty || p.alpha_code)) || yamlPartStatsKeyFromRow(p) || 'Part').trim();
      var lines = [];
      var pk = yamlPartStatsKeyFromRow(p);
      if (byPart && pk && Array.isArray(byPart[pk])) {
        for (var si = 0; si < byPart[pk].length && lines.length < 6; si++) {
          var brief = formatStatRowBrief(byPart[pk][si]);
          if (brief) lines.push(brief);
        }
      }
      if (!lines.length && byIdRaw && p && p.key && Array.isArray(byIdRaw[p.key])) {
        for (var ri = 0; ri < byIdRaw[p.key].length && lines.length < 6; ri++) {
          brief = formatStatRowBrief(byIdRaw[p.key][ri]);
          if (brief) lines.push(brief);
        }
      }
      if (!lines.length && p && (p.stats_text || p.effects_text)) {
        lines.push(String(p.stats_text || p.effects_text).slice(0, 140));
      }
      if (!lines.length) continue;
      blocks.push(
        '<div style="margin-top:6px;padding:6px 8px;border-radius:6px;background:rgba(0,0,0,0.22);border:1px solid rgba(255,255,255,0.08);">' +
        '<div style="font-size:11px;color:rgba(0,243,255,0.9);">' + escapeHtml(title) + '</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.72);margin-top:3px;line-height:1.4;">' + escapeHtml(lines.join(' · ')) + '</div></div>'
      );
    }
    if (!blocks.length) {
      return '<div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:8px;">No deep stat rows in PARTS_STATS_DATA for resolved parts.</div>';
    }
    var more = c.resolvedParts.length > maxParts
      ? ('<div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:4px;">+' + (c.resolvedParts.length - maxParts) + ' more parts — import for full build stats or open Parts stats catalog.</div>')
      : '';
    return '<div class="yaml-serial-part-stats" style="margin-top:8px;width:100%;">' + blocks.join('') + more + '</div>';
  }

  function createSerialRowElement(item, idx) {
    var meta = parseSerialMeta(item.serial);
    var row = document.createElement('div');
    row.className = 'yaml-serial-row';
    row.style.cssText = 'padding:10px;background:rgba(0,200,255,0.08);border:1px solid rgba(0,200,255,0.25);border-radius:6px;margin-bottom:8px;display:flex;flex-direction:column;gap:8px;';
    var topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:10px;width:100%;';
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
    var statsBtn = document.createElement('button');
    statsBtn.className = 'btn';
    statsBtn.textContent = 'Part stats';
    statsBtn.type = 'button';
    statsBtn.title = 'Show deep per-part stat rows from PARTS_STATS_DATA';
    var statsPanel = document.createElement('div');
    statsPanel.style.display = 'none';
    statsPanel.style.width = '100%';
    statsBtn.addEventListener('click', function () {
      var open = statsPanel.style.display !== 'none';
      if (open) {
        statsPanel.style.display = 'none';
        statsBtn.textContent = 'Part stats';
        return;
      }
      function renderStatsPanel() {
        statsPanel.innerHTML = buildYamlSerialPartStatsHtml(item.serial);
        statsPanel.style.display = '';
        statsBtn.textContent = 'Hide stats';
      }
      if (window.PARTS_STATS_DATA && typeof window.__ccEnsureBuildStatsData === 'function') {
        window.__ccEnsureBuildStatsData(renderStatsPanel);
      } else {
        renderStatsPanel();
      }
    });
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
    right.appendChild(statsBtn);
    right.appendChild(delBtn);
    topRow.appendChild(left);
    topRow.appendChild(right);
    row.appendChild(topRow);
    row.appendChild(statsPanel);
    return row;
  }

  function updateYamlSerialsSourceBadge() {
    var badge = byId('yaml-serials-source-badge');
    if (!badge) return;
    var src = window.__yamlInventorySource;
    if (src === 'bank') {
      badge.textContent = ' · profile bank';
      badge.title = 'Listing serials under bank: (domains.local.shared.inventory.items.bank)';
    } else if (src === 'backpack') {
      badge.textContent = ' · backpack';
      badge.title = 'Listing serials under state.inventory.items.backpack';
    } else {
      badge.textContent = '';
      badge.title = '';
    }
  }

  function refreshBackpackUI() {
    updateYamlNextSlotDisplay();
    updateYamlSerialsSourceBadge();
    var container = byId('yaml-serials-container');
    var countEl = byId('yaml-serial-count');
    var listRoot = byId('yaml-serials-list');
    var pageRows = listRoot ? listRoot.querySelectorAll('.yaml-serials-pagination-row') : [];
    var pageInfos = listRoot ? listRoot.querySelectorAll('.yaml-serials-page-info') : [];
    var prevBtns = listRoot ? listRoot.querySelectorAll('[data-yaml-serials-dir="prev"]') : [];
    var nextBtns = listRoot ? listRoot.querySelectorAll('[data-yaml-serials-dir="next"]') : [];
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

    if (pageRows && pageRows.length) {
      if (total > YAML_SERIALS_PAGE_SIZE) {
        var endShown = Math.min(start + slice.length, total);
        var infoText = 'Showing ' + (total ? start + 1 : 0) + '–' + endShown + ' of ' + total;
        for (var pr = 0; pr < pageRows.length; pr++) pageRows[pr].style.display = 'flex';
        for (var pi = 0; pi < pageInfos.length; pi++) pageInfos[pi].textContent = infoText;
        for (var pb = 0; pb < prevBtns.length; pb++) prevBtns[pb].disabled = page <= 0;
        for (var nb = 0; nb < nextBtns.length; nb++) nextBtns[nb].disabled = page >= totalPages - 1;
      } else {
        for (var pr2 = 0; pr2 < pageRows.length; pr2++) pageRows[pr2].style.display = 'none';
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
    var root = byId('yaml-serials-list');
    if (!root || root._yamlSerialPageDelegated) return;
    root._yamlSerialPageDelegated = true;
    root.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-yaml-serials-dir]') : null;
      if (!btn || !root.contains(btn)) return;
      var dir = btn.getAttribute('data-yaml-serials-dir');
      var list = window.extractedSerials || [];
      var tp = list.length ? Math.ceil(list.length / YAML_SERIALS_PAGE_SIZE) : 1;
      if (dir === 'prev' && window.__yamlSerialsPageIndex > 0) {
        window.__yamlSerialsPageIndex--;
        refreshBackpackUI();
      } else if (dir === 'next' && window.__yamlSerialsPageIndex < tp - 1) {
        window.__yamlSerialsPageIndex++;
        refreshBackpackUI();
      }
    });
  })();

  var SESSION_HANDOFF_MAX = 4 * 1024 * 1024 - 65536;
  var HANDOFF_PREFILL_KEY = 'stx_bulk_decoder_prefill';
  var HANDOFF_YAML_KEY = 'stx_bulk_decoder_prefill_yaml';
  var HANDOFF_VALIDATOR_KEY = 'stx_bulk_validator_prefill';
  var HANDOFF_VALIDATOR_YAML_KEY = 'stx_bulk_validator_prefill_yaml';

  function storeBulkHandoff(key, text) {
    // localStorage survives noopener window.open (sessionStorage does not across tabs).
    try {
      localStorage.setItem(key, text);
      try { sessionStorage.setItem(key, text); } catch (_) {}
      return true;
    } catch (e) {
      try {
        sessionStorage.setItem(key, text);
        return true;
      } catch (e2) {
        throw e2 || e;
      }
    }
  }

  function collectSerialLinesForBulkHandoff() {
    var list = window.extractedSerials || [];
    if (list.length) {
      var out = [];
      for (var i = 0; i < list.length; i++) {
        var s = String((list[i] && list[i].serial) || '').trim();
        if (s) out.push(s);
      }
      if (out.length) return out;
    }
    var yamlText = getYamlText().text;
    if (!yamlText || !String(yamlText).trim()) return [];
    if (typeof window.parseYAMLBackpack === 'function') window.parseYAMLBackpack();
    list = window.extractedSerials || [];
    if (list.length) {
      out = [];
      for (var j = 0; j < list.length; j++) {
        s = String((list[j] && list[j].serial) || '').trim();
        if (s) out.push(s);
      }
      if (out.length) return out;
    }
    var kind = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(yamlText) : 'unknown';
    if (kind === 'profile') list = extractBankSerialsSimple(yamlText);
    else list = extractBackpackSerialsSimple(yamlText);
    out = [];
    for (var k = 0; k < list.length; k++) {
      s = String((list[k] && list[k].serial) || '').trim();
      if (s) out.push(s);
    }
    return out;
  }

  window.initYamlBulkDecoderHandoff = function () {
    if (typeof window.initYamlBulkValidatorHandoff === 'function') window.initYamlBulkValidatorHandoff();
    var linesBtn = byId('yaml-serials-open-bulk-btn');
    var yamlBtn = byId('yaml-serials-open-bulk-yaml-btn');
    if (linesBtn && !linesBtn._bulkHandoffBound) {
      linesBtn._bulkHandoffBound = true;
      linesBtn.addEventListener('click', function () {
        var out = collectSerialLinesForBulkHandoff();
        if (!out.length) {
          alert('No serials found in the loaded YAML. Paste a character or profile save first.');
          return;
        }
        var text = out.join('\n');
        if (text.length > SESSION_HANDOFF_MAX) {
          alert('Serial list is too large for a browser handoff (~4MB cap). Save YAML to a file and open it in the bulk deserializer, or copy a section at a time.');
          return;
        }
        try {
          storeBulkHandoff(HANDOFF_PREFILL_KEY, text);
        } catch (e) {
          alert('Could not store handoff: ' + (e && e.message ? e.message : String(e)));
          return;
        }
        var bulkDec = (typeof window.STX_BULK_DECODER_PAGE === 'string' && window.STX_BULK_DECODER_PAGE) ? window.STX_BULK_DECODER_PAGE : './legacy/bl4-bulk-decoder.html';
        window.open(bulkDec + (bulkDec.indexOf('?') >= 0 ? '&' : '?') + 'prefill=1', '_blank');
      });
    }
    if (yamlBtn && !yamlBtn._bulkHandoffBound) {
      yamlBtn._bulkHandoffBound = true;
      yamlBtn.addEventListener('click', function () {
        var t = getYamlText();
        var text = (t && t.text) ? String(t.text) : '';
        if (!text.trim()) {
          alert('No YAML in the editor.');
          return;
        }
        if (text.length > SESSION_HANDOFF_MAX) {
          alert('YAML is larger than the ~4MB browser handoff limit. Save it as a file and open it in the bulk decoder instead.');
          return;
        }
        try {
          storeBulkHandoff(HANDOFF_YAML_KEY, text);
        } catch (e) {
          alert('Could not store handoff: ' + (e && e.message ? e.message : String(e)));
          return;
        }
        var bulkDecY = (typeof window.STX_BULK_DECODER_PAGE === 'string' && window.STX_BULK_DECODER_PAGE) ? window.STX_BULK_DECODER_PAGE : './legacy/bl4-bulk-decoder.html';
        window.open(bulkDecY + (bulkDecY.indexOf('?') >= 0 ? '&' : '?') + 'prefill_yaml=1', '_blank');
      });
    }
  };

  function openBulkValidatorHandoff(text, isYaml) {
    if (!text || !String(text).trim()) {
      alert(isYaml ? 'No YAML in the editor.' : 'No serials found in the loaded YAML. Paste a character or profile save first.');
      return;
    }
    if (text.length > SESSION_HANDOFF_MAX) {
      alert('Payload is too large for a browser handoff (~4MB cap). Save to a file and open it in the bulk serial validator instead.');
      return;
    }
    try {
      storeBulkHandoff(isYaml ? HANDOFF_VALIDATOR_YAML_KEY : HANDOFF_VALIDATOR_KEY, text);
    } catch (e) {
      alert('Could not store handoff: ' + (e && e.message ? e.message : String(e)));
      return;
    }
    var validatorPage = (typeof window.STX_BULK_VALIDATOR_PAGE === 'string' && window.STX_BULK_VALIDATOR_PAGE)
      ? window.STX_BULK_VALIDATOR_PAGE
      : './assets/bulk-serial-validator.html';
    var rel = validatorPage;
    try {
      if (/save-yaml-full\.html/i.test(String(location.pathname || ''))) {
        rel = validatorPage.replace(/^\.\//, '');
      }
    } catch (_) {}
    window.open(rel + (rel.indexOf('?') >= 0 ? '&' : '?') + (isYaml ? 'prefill_yaml=1' : 'prefill=1'), '_blank');
  }

  window.initYamlBulkValidatorHandoff = function () {
    var linesBtn = byId('yaml-serials-open-validator-btn');
    var yamlBtn = byId('yaml-serials-open-validator-yaml-btn');
    if (linesBtn && !linesBtn._validatorHandoffBound) {
      linesBtn._validatorHandoffBound = true;
      linesBtn.addEventListener('click', function () {
        var out = collectSerialLinesForBulkHandoff();
        openBulkValidatorHandoff(out.join('\n'), false);
      });
    }
    if (yamlBtn && !yamlBtn._validatorHandoffBound) {
      yamlBtn._validatorHandoffBound = true;
      yamlBtn.addEventListener('click', function () {
        var t = getYamlText();
        openBulkValidatorHandoff((t && t.text) ? String(t.text) : '', true);
      });
    }
  };

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function findBackpackBlock(lines) {
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/^(\s*)backpack\s*:?\s*$/i) || lines[i].match(/^(\s*)backpack\s*:\s*\{\}\s*$/i);
      if (m) return { headerIndex: i, headerIndent: (m[1] || '').length, emptyInline: /\{\s*\}\s*$/.test(lines[i]) };
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
              var bm = lines[n].match(/^(\s*)backpack\s*:?\s*$/i) || lines[n].match(/^(\s*)backpack\s*:\s*\{\}\s*$/i);
              if (bm) return { headerIndex: n, headerIndent: (bm[1] || '').length, emptyInline: /\{\s*\}\s*$/.test(lines[n]) };
            }
          }
        }
      }
    }
    return null;
  }

  /** Profile shared bank under `...inventory.items.bank` (same slot layout as backpack). */
  function findBankBlock(lines) {
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/^(\s*)bank\s*:?\s*$/i);
      if (m) return { headerIndex: i, headerIndent: (m[1] || '').length };
    }
    for (var j = 0; j < lines.length; j++) {
      if (/^\s*inventory:\s*$/.test(lines[j])) {
        var invIndentB = (lines[j].match(/^(\s*)/) || ['', ''])[1].length;
        for (var k = j + 1; k < lines.length; k++) {
          if (!lines[k].trim()) continue;
          var ki = (lines[k].match(/^(\s*)/) || ['', ''])[1].length;
          if (ki <= invIndentB) break;
          if (/^\s*items:\s*$/.test(lines[k])) {
            var itemsIndentB = ki;
            for (var n = k + 1; n < lines.length; n++) {
              if (!lines[n].trim()) continue;
              var ni = (lines[n].match(/^(\s*)/) || ['', ''])[1].length;
              if (ni <= itemsIndentB) break;
              var bm = lines[n].match(/^(\s*)bank\s*:?\s*$/i);
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
      var kind = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(yamlText) : 'unknown';
      var bp = kind === 'profile' ? findBankBlock(lines) : findBackpackBlock(lines);
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
      window.__yamlInventorySource = '';
      window.__yamlSerialsPageIndex = 0;
      function clearUi() {
        if (typeof window.refreshBackpackUI === 'function') window.refreshBackpackUI();
        if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
      }
      if (typeof window.stxYieldToMain === 'function') window.stxYieldToMain(clearUi);
      else clearUi();
      return;
    }
    function runParse() {
      window.__yamlSerialsPageIndex = 0;
      var kind = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(yamlText) : 'unknown';
      if (kind === 'profile') {
        window.__yamlInventorySource = 'bank';
        window.extractedSerials = extractBankSerialsSimple(yamlText);
      } else if (kind === 'character') {
        window.__yamlInventorySource = 'backpack';
        window.extractedSerials = extractBackpackSerialsSimple(yamlText);
      } else {
        window.__yamlInventorySource = '';
        window.extractedSerials = extractBackpackSerialsSimple(yamlText);
      }
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
      if (toDecode.length === 0 || typeof window.decodeSerialsViaBridge !== 'function') {
        if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
        return;
      }

      if (typeof window.initStxDecoderBridge === 'function') window.initStxDecoderBridge();

      var offset = 0;
      var chunkSize = yamlDecodeChunkSize(toDecode.length);
      var chunkDelay = yamlDecodeChunkDelay(toDecode.length);
      function decodeNextChunk() {
        if (offset >= toDecode.length) return;
        var chunk = toDecode.slice(offset, offset + chunkSize);
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
          if (offset < toDecode.length) setTimeout(decodeNextChunk, chunkDelay);
          else if (typeof window.refreshBackpackUI === 'function') window.refreshBackpackUI();
        });
      }
      decodeNextChunk();
      if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
    }
    if (typeof window.stxYieldToMain === 'function') window.stxYieldToMain(runParse);
    else runParse();
  };

  var parseTimer = null;
  window.scheduleParseYAMLBackpack = function (delay) {
    delay = yamlParseDelayHint(delay);
    if (parseTimer) clearTimeout(parseTimer);
    parseTimer = setTimeout(function () {
      parseTimer = null;
      window.parseYAMLBackpack();
    }, delay);
  };

  (function () {
    function onYamlInput() {
      window.scheduleParseYAMLBackpack();
      if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
    }
    var ta = byId('yamlInput');
    var ta2 = byId('fullYamlInput');
    if (ta) ta.addEventListener('input', onYamlInput);
    if (ta2) ta2.addEventListener('input', onYamlInput);
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

  /**
   * YAML saves must store BL-base85 only (not deserialized pipe text).
   * Accepts @U… Base85, compact base85, or NicNL-style deserialized; returns '' if unusable (sync only).
   */
  window.ensureBase85SerialForYamlSave = function (raw) {
    var s = String(raw || '').trim().replace(/^["']|["']$/g, '');
    if (!s || s === '—') return '';
    function looksDeserializedOrPipe(t) {
      t = String(t || '');
      if (t.indexOf('||') >= 0) return true;
      if (/^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\|/.test(t)) return true;
      if (/\{\s*\d+\s*:\s*\d+\s*\}/.test(t)) return true;
      if (/\|\s*\{/.test(t) && /\d+\s*,\s*\d+/.test(t)) return true;
      return false;
    }
    function normalizeAtU(t) {
      t = String(t || '').trim();
      if (t.indexOf('@U') !== 0) t = '@U' + t.replace(/^@U/i, '');
      return t;
    }
    /** BL4 custom Base85 alphabet includes `{|}`; reject only deserialized markers (commas / ||). */
    function validStoredB85(t) {
      t = String(t || '').trim();
      if (t.indexOf('@U') !== 0) return false;
      if (t.length < 10) return false;
      if (t.indexOf(',') >= 0) return false;
      if (t.indexOf('||') >= 0) return false;
      return true;
    }
    function packDeserializedToB85(deserIn) {
      var deser = String(deserIn || '').trim();
      if (!deser) return '';
      var normDeser = deser;
      if (typeof window.__stxNormalizeDeserializedInput === 'function') {
        try {
          var normD = window.__stxNormalizeDeserializedInput(deser);
          if (normD) normDeser = String(normD).trim();
        } catch (_) {}
      }
      function tryPackOne(input) {
        var d = String(input || '').trim();
        if (!d) return '';
        if (typeof window.__stxNicnlPackDeserialized === 'function') {
          try {
            var pk = window.__stxNicnlPackDeserialized(d);
            pk = (pk && String(pk).trim()) || '';
            pk = normalizeAtU(pk);
            if (validStoredB85(pk)) return pk;
          } catch (_) {}
        }
        if (typeof window.serializeToBase85 === 'function') {
          try {
            var b = window.serializeToBase85(d, undefined, true);
            b = (b && String(b).trim()) || '';
            b = normalizeAtU(b);
            if (validStoredB85(b)) return b;
          } catch (_) {}
        }
        return '';
      }
      var packed = tryPackOne(deser);
      if (packed) return packed;
      if (normDeser && normDeser !== deser) {
        packed = tryPackOne(normDeser);
        if (packed) return packed;
      }
      return '';
    }
    if (s.charAt(0) === '@') {
      var u = normalizeAtU(s);
      /* Never re-decode/re-pack a valid @U — local deserialize truncates and shortens serials. */
      if (validStoredB85(u)) return u;
      return '';
    }
    if (!looksDeserializedOrPipe(s) && validStoredB85(normalizeAtU(s)) && s.length >= 10) {
      return normalizeAtU(s);
    }
    if (looksDeserializedOrPipe(s)) {
      return packDeserializedToB85(s);
    }
    return '';
  };

  function normalizeYamlInjectCopies(copies) {
    var n = copies == null || copies === '' ? 1 : parseInt(String(copies), 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    if (n > 999) n = 999;
    return n;
  }

  /** Single backpack insert (character YAML). */
  function appendOneSerialToYamlBackpack(serial) {
    var s = typeof window.ensureBase85SerialForYamlSave === 'function' ? window.ensureBase85SerialForYamlSave(serial) : String(serial || '').trim();
    if (!s) return false;
    var yaml = getYamlText();
    if (!yaml.text || !yaml.text.trim()) return false;
    if (typeof window.detectYamlSaveKind === 'function' && window.detectYamlSaveKind(yaml.text) === 'profile') return false;
    var lines = yaml.text.split(/\r?\n/);
    var bp = findBackpackBlock(lines);
    if (!bp) return false;
    var headerIndent = Number(bp.headerIndent) || 0;
    var headerPrefix = (new Array(headerIndent + 1)).join(' ');
    if (bp.emptyInline) {
      lines[bp.headerIndex] = headerPrefix + 'backpack:';
    }
    var slotIndent = headerIndent + 2;
    var slotPrefix = (new Array(slotIndent + 1)).join(' ');
    var nextSlot = nextAvailableBackpackSlot(lines.join('\n'));
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
    return true;
  }

  /**
   * Append item(s) to character backpack in YAML. Optional second arg: repeat count (1–999).
   * @param {string} serial
   * @param {number} [copies]
   */
  window.appendSerialToYAML = function (serial, copies) {
    var n = normalizeYamlInjectCopies(copies);
    var ok = 0;
    for (var i = 0; i < n; i++) {
      if (appendOneSerialToYamlBackpack(serial)) ok++;
      else break;
    }
    if (ok > 0 && typeof window.scheduleParseYAMLBackpack === 'function') window.scheduleParseYAMLBackpack(50);
    return ok === n;
  };

  /** Profile `profile.sav` YAML: insert into `domains.local.shared.inventory.items.bank`. */
  window.appendSerialToProfileBank = function (serial, copies) {
    var s = typeof window.ensureBase85SerialForYamlSave === 'function' ? window.ensureBase85SerialForYamlSave(serial) : String(serial || '').trim();
    if (!s) return false;
    var yaml = getYamlText();
    if (!yaml.text || !yaml.text.trim()) return false;
    if (typeof window.detectYamlSaveKind === 'function' && window.detectYamlSaveKind(yaml.text) !== 'profile') return false;
    if (typeof window.insertSerials !== 'function') return false;
    var n = normalizeYamlInjectCopies(copies);
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(s);
    return window.insertSerials(arr) === true;
  };

  window.stxNormalizeYamlInjectCopies = normalizeYamlInjectCopies;

  /** User-facing hints when YAML editor has no character/profile save loaded. */
  window.stxAlertNeedSaveForYamlInject = function (where) {
    var w = String(where || 'backpack').toLowerCase();
    if (w === 'bank' || w === 'profile') {
      window.alert(
        'No profile save is loaded in the YAML editor.\n\n' +
        'Load a profile .sav (decrypt to YAML) or paste/load profile YAML that contains the shared bank (e.g. domains.local.shared.inventory.items.bank), then try again.'
      );
    } else {
      window.alert(
        'No character save is loaded in the YAML editor.\n\n' +
        'Load a character .sav (decrypt to YAML) or paste/load character YAML with root state: and backpack, then try again.\n\n' +
        'Profile saves use the bank, not the character backpack.'
      );
    }
  };

  function wrapLooseJsonArray(text) {
    var t = String(text || '').trim();
    if (!t || t.charAt(0) === '[') return t;
    t = t.replace(/,\s*$/, '');
    return '[' + t + ']';
  }

  function collectSerialsFromJsonNode(node, out) {
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) collectSerialsFromJsonNode(node[i], out);
      return;
    }
    if (node && typeof node === 'object') {
      if (typeof node.serial === 'string') {
        var sv = node.serial.trim();
        if (sv) out.push(sv);
      }
      if (Array.isArray(node.serials)) {
        for (var j = 0; j < node.serials.length; j++) {
          var v = node.serials[j];
          var s = typeof v === 'string' ? v.trim() : (v && v.serial ? String(v.serial).trim() : '');
          if (s) out.push(s);
        }
      }
      for (var key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) collectSerialsFromJsonNode(node[key], out);
      }
    }
  }

  function tryParseJsonPaste(text) {
    var t = String(text || '').trim();
    if (!t) return null;
    var attempts = [t, wrapLooseJsonArray(t)];
    for (var ai = 0; ai < attempts.length; ai++) {
      try { return JSON.parse(attempts[ai]); } catch (_) {}
    }
    var lines = t.split(/\r?\n/);
    var objs = [];
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li].trim();
      if (!line || line === '[' || line === ']' || line === ',') continue;
      if (line.charAt(0) !== '{') continue;
      line = line.replace(/,\s*$/, '');
      try { objs.push(JSON.parse(line)); } catch (_) {}
    }
    return objs.length ? objs : null;
  }

  function extractSerialFieldsByRegex(text) {
    var out = [];
    var re = /"serial"\s*:\s*"((?:\\.|[^"\\])*)"/g;
    var m;
    while ((m = re.exec(text))) {
      var val = m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      if (val.trim()) out.push(val.trim());
    }
    return out;
  }

  function detectSerialPasteMode(raw) {
    var r = String(raw || '').trim();
    if (!r) return 'txt';
    if (/^\s*[\[{]/.test(r)) return 'json';
    if (/"serial"\s*:/.test(r) && /[{[]/.test(r)) return 'json';
    if (/@U/.test(r) && /(^|\n)\s*(?:-\s*)?serial\s*:\s*/im.test(r)) return 'yaml';
    if (/@U/.test(r) && /(^|\n)\s*[\w.\-]+\s*:\s*/m.test(r)) return 'yaml';
    return 'txt';
  }

  function lineLooksLikeSerialLine(line) {
    var t = String(line || '').trim();
    if (!t || t.charAt(0) === '#') return false;
    if (t.charAt(0) === '{' || t.charAt(0) === '[') return false;
    if (t.indexOf('@U') >= 0) return true;
    if (t.length > 15) return true;
    if (t.length >= 10 && !/\s/.test(t) && /[A-Za-z0-9]/.test(t)) return true;
    return false;
  }

  function extractSerialsFromMultilinePaste(raw, mode) {
    var out = [];
    var text = String(raw || '').trim();
    if (!text) return out;
    if (mode === 'yaml' || mode === 'yml') {
      var yamlLines = text.split(/\r?\n/);
      for (var i = 0; i < yamlLines.length; i++) {
        var ym = yamlLines[i].match(/^\s*(?:-\s*)?serial\s*:\s*(.+)$/i);
        if (ym) {
          var yv = String(ym[1]).trim().replace(/^["']|["']\s*$/g, '');
          if (yv) out.push(yv);
        }
      }
    } else if (mode === 'json') {
      var parsed = tryParseJsonPaste(text);
      if (parsed != null) collectSerialsFromJsonNode(parsed, out);
      if (!out.length) out = extractSerialFieldsByRegex(text);
    } else {
      var txtLines = text.split(/\r?\n/);
      for (var t = 0; t < txtLines.length; t++) {
        var line = txtLines[t].trim();
        if (lineLooksLikeSerialLine(line)) out.push(line);
      }
    }
    return out;
  }

  function extractSerialsFromMultilinePasteWithFallback(raw) {
    var mode = detectSerialPasteMode(raw);
    var ex = extractSerialsFromMultilinePaste(raw, mode);
    if (ex.length) return ex;
    if (mode !== 'json') { ex = extractSerialsFromMultilinePaste(raw, 'json'); if (ex.length) return ex; }
    if (mode !== 'yaml') { ex = extractSerialsFromMultilinePaste(raw, 'yaml'); if (ex.length) return ex; }
    if (mode !== 'txt') { ex = extractSerialsFromMultilinePaste(raw, 'txt'); if (ex.length) return ex; }
    return [];
  }

  window.extractSerialsFromMultilinePaste = extractSerialsFromMultilinePasteWithFallback;

  function normalizeSerialLineForYamlBackpack(line) {
    var c = String(line || '').trim();
    if (!c || c.charAt(0) === '#') return '';
    if (typeof window.ensureBase85SerialForYamlSave === 'function') {
      return window.ensureBase85SerialForYamlSave(c);
    }
    return c;
  }

  /** Append multiple serials (plain lines, YAML serial:, or JSON with "serial" fields). Returns { added, failed }. */
  window.appendSerialLinesToYAML = function (multiline) {
    var yamlText = getYamlText().text || '';
    var kind = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(yamlText) : 'unknown';
    var extracted = extractSerialsFromMultilinePasteWithFallback(String(multiline || ''));
    var serials = [];
    for (var i = 0; i < extracted.length; i++) {
      var s = normalizeSerialLineForYamlBackpack(extracted[i]);
      if (s) serials.push(s);
    }
    var perLineCopies = 1;
    try {
      var qEl = byId('yamlAddSerialsCount');
      if (qEl) perLineCopies = normalizeYamlInjectCopies(qEl.value);
    } catch (_) {}
    if (kind === 'profile' && typeof window.insertSerials === 'function') {
      if (!serials.length) return { added: 0, failed: 0 };
      var expandedP = [];
      for (var pi = 0; pi < serials.length; pi++) {
        for (var pj = 0; pj < perLineCopies; pj++) expandedP.push(serials[pi]);
      }
      var okP = window.insertSerials(expandedP);
      return okP
        ? { added: expandedP.length, failed: 0 }
        : { added: 0, failed: expandedP.length };
    }
    var added = 0;
    var failed = 0;
    for (var j = 0; j < serials.length; j++) {
      var sj = serials[j];
      if (!sj) continue;
      if (window.appendSerialToYAML && window.appendSerialToYAML(sj, perLineCopies)) added += perLineCopies;
      else failed += perLineCopies;
    }
    return { added: added, failed: failed };
  };

  function nextSlotIndexForYamlContainer(container) {
    var maxIdx = -1;
    for (var k in container || {}) {
      if (!Object.prototype.hasOwnProperty.call(container, k)) continue;
      var m = /^slot_(\d+)$/.exec(k);
      if (m) maxIdx = Math.max(maxIdx, parseInt(m[1], 10));
    }
    return maxIdx + 1;
  }

  function getYamlInventoryContainer(data, which) {
    var w = String(which || '');
    if (w === 'backpack') {
      if (!data || !data.state || !data.state.inventory || !data.state.inventory.items) return null;
      var bp = data.state.inventory.items.backpack;
      if (bp == null || typeof bp !== 'object' || Array.isArray(bp)) return null;
      return bp;
    }
    if (w === 'bank') {
      if (!data || !data.domains || !data.domains.local || !data.domains.local.shared) return null;
      var sh = data.domains.local.shared;
      if (!sh.inventory || !sh.inventory.items) return null;
      var b = sh.inventory.items.bank;
      if (b == null || typeof b !== 'object' || Array.isArray(b)) return null;
      return b;
    }
    return null;
  }

  function shallowCopySlotObject(slot) {
    var o = {};
    for (var k in slot) {
      if (Object.prototype.hasOwnProperty.call(slot, k)) o[k] = slot[k];
    }
    return o;
  }

  function parseYamlTextToData(rawText) {
    var text = rawText == null ? '' : String(rawText);
    if (!text.trim()) return null;
    if (typeof window.sanitizeYamlForParse === 'function') text = window.sanitizeYamlForParse(text);
    var y = window.jsyaml || (typeof jsyaml !== 'undefined' ? jsyaml : null);
    if (!y || typeof y.load !== 'function') return null;
    var attempts = [];
    attempts.push({});
    if (y.CORE_SCHEMA) attempts.push({ schema: y.CORE_SCHEMA });
    if (y.JSON_SCHEMA) attempts.push({ schema: y.JSON_SCHEMA });
    if (y.FAILSAFE_SCHEMA) attempts.push({ schema: y.FAILSAFE_SCHEMA });
    for (var i = 0; i < attempts.length; i++) {
      try {
        var data = y.load(text, attempts[i]);
        if (data && typeof data === 'object') {
          if (typeof window.normalizeYamlExperiencePointsInData === 'function') {
            window.normalizeYamlExperiencePointsInData(data);
          }
          return data;
        }
      } catch (e) { /* try next schema */ }
    }
    return null;
  }

  function collectSlotObjectsFromYamlData(data) {
    var out = [];
    function collectFrom(which) {
      var container = getYamlInventoryContainer(data, which);
      if (!container) return;
      var keyRows = [];
      for (var sk in container) {
        if (!Object.prototype.hasOwnProperty.call(container, sk)) continue;
        var mm = /^slot_(\d+)$/.exec(sk);
        if (mm) keyRows.push({ key: sk, n: parseInt(mm[1], 10) });
      }
      keyRows.sort(function (a, b) { return a.n - b.n; });
      for (var i = 0; i < keyRows.length; i++) {
        var entry = container[keyRows[i].key];
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
        var rawSerial = entry.serial;
        if (rawSerial == null || !String(rawSerial).trim()) continue;
        out.push(shallowCopySlotObject(entry));
      }
    }
    collectFrom('backpack');
    collectFrom('bank');
    return out;
  }

  function appendSlotObjectsToYamlContainer(container, toAdd, targetLevel) {
    var L = targetLevel == null || targetLevel === '' ? NaN : Math.floor(Number(targetLevel));
    var useLevel = Number.isFinite(L);
    var start = nextSlotIndexForYamlContainer(container);
    var added = 0;
    for (var j = 0; j < toAdd.length; j++) {
      var slotObj = toAdd[j];
      var s0 = String(slotObj.serial || '').trim().replace(/^['"]|['"]$/g, '');
      var s = typeof window.ensureBase85SerialForYamlSave === 'function' ? window.ensureBase85SerialForYamlSave(s0) : s0;
      if (!s) continue;
      if (useLevel && typeof window.updateSerialLevelFlexible === 'function') {
        var leveled = window.updateSerialLevelFlexible(s, L);
        if (leveled && String(leveled).trim()) {
          s = typeof window.ensureBase85SerialForYamlSave === 'function' ? (window.ensureBase85SerialForYamlSave(leveled) || leveled) : leveled;
        }
      }
      if (s.indexOf('@U') !== 0) s = '@U' + String(s).replace(/^@U/, '');
      if (!s || s.length < 10 || s.indexOf(',') >= 0 || s.indexOf('||') >= 0) continue;
      slotObj.serial = s;
      container['slot_' + (start + added)] = slotObj;
      added++;
    }
    return added;
  }

  /**
   * Append all backpack/bank items from another YAML into the currently loaded save.
   * Source character → backpack slots; source profile → bank slots (both collected if present).
   * Destination is backpack (character) or bank (profile) based on the loaded editor.
   * @returns {{ added: number, dest: string }|false}
   */
  window.mergeInventoryFromYamlText = function (sourceText, targetLevel) {
    var yaml = getYamlText();
    if (!yaml.text || !String(yaml.text).trim()) {
      alert('Load or paste YAML in the editor first.');
      return false;
    }
    var kind = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(yaml.text) : 'unknown';
    if (kind !== 'character' && kind !== 'profile') {
      alert('Merge needs a character save (root state:) or profile save loaded in the editor.');
      return false;
    }
    if (typeof window.getYamlDataFromEditor !== 'function' || typeof window.commitYamlDataToEditor !== 'function') {
      alert('YAML tools are not ready yet. Reload the page.');
      return false;
    }
    if (!sourceText || !String(sourceText).trim()) {
      alert('The selected YAML file is empty.');
      return false;
    }
    var sourceData = parseYamlTextToData(sourceText);
    if (!sourceData) {
      alert('Could not parse the YAML file to merge. Fix syntax errors and try again.');
      return false;
    }
    var toAdd = collectSlotObjectsFromYamlData(sourceData);
    if (!toAdd.length) {
      alert('No backpack or bank items with serials found in that YAML.');
      return false;
    }
    var data = window.getYamlDataFromEditor();
    if (!data) {
      alert('Could not parse the loaded YAML. Fix syntax errors and try again.');
      return false;
    }
    var destWhich = kind === 'profile' ? 'bank' : 'backpack';
    var container = getYamlInventoryContainer(data, destWhich);
    if (!container) {
      alert(destWhich === 'backpack' ? 'No backpack object found in this save.' : 'No shared bank object found in this profile.');
      return false;
    }
    var added = appendSlotObjectsToYamlContainer(container, toAdd, targetLevel);
    if (!added) {
      alert('No valid serials could be merged from that YAML.');
      return false;
    }
    window.commitYamlDataToEditor(data);
    if (typeof window.scheduleParseYAMLBackpack === 'function') window.scheduleParseYAMLBackpack(80);
    if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
    if (typeof window.refreshBackpackUI === 'function') window.refreshBackpackUI();
    return { added: added, dest: destWhich };
  };

  window.duplicateYamlInventorySection = function (which, targetLevel) {
    var w = String(which || '');
    if (w !== 'backpack' && w !== 'bank') return false;
    var yaml = getYamlText();
    if (!yaml.text || !String(yaml.text).trim()) {
      alert('Load or paste YAML in the editor first.');
      return false;
    }
    var kind = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(yaml.text) : 'unknown';
    if (w === 'backpack' && kind !== 'character') {
      alert('Duplicate backpack needs a character save (root state:).');
      return false;
    }
    if (w === 'bank' && kind !== 'profile') {
      alert('Duplicate bank needs a profile save.');
      return false;
    }
    if (typeof window.getYamlDataFromEditor !== 'function' || typeof window.commitYamlDataToEditor !== 'function') {
      alert('YAML tools are not ready yet. Reload the page.');
      return false;
    }
    var data = window.getYamlDataFromEditor();
    if (!data) {
      alert('Could not parse YAML. Fix syntax errors and try again.');
      return false;
    }
    var container = getYamlInventoryContainer(data, w);
    if (!container) {
      alert(w === 'backpack' ? 'No backpack object found in this save.' : 'No shared bank object found in this profile.');
      return false;
    }
    var keyRows = [];
    for (var sk in container) {
      if (!Object.prototype.hasOwnProperty.call(container, sk)) continue;
      var mm = /^slot_(\d+)$/.exec(sk);
      if (mm) keyRows.push({ key: sk, n: parseInt(mm[1], 10) });
    }
    keyRows.sort(function (a, b) { return a.n - b.n; });
    var toAdd = [];
    for (var i = 0; i < keyRows.length; i++) {
      var entry = container[keyRows[i].key];
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
      var rawSerial = entry.serial;
      if (rawSerial == null || !String(rawSerial).trim()) continue;
      toAdd.push(shallowCopySlotObject(entry));
    }
    if (!toAdd.length) {
      alert('No items with serials found to duplicate.');
      return false;
    }
    var added = appendSlotObjectsToYamlContainer(container, toAdd, targetLevel);
    if (!added) {
      alert('No valid serials could be duplicated.');
      return false;
    }
    window.commitYamlDataToEditor(data);
    if (typeof window.scheduleParseYAMLBackpack === 'function') window.scheduleParseYAMLBackpack(80);
    if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
    if (typeof window.refreshBackpackUI === 'function') window.refreshBackpackUI();
    return true;
  };

  function normalizeSerialKeyForYamlDedupe(raw) {
    var s0 = String(raw == null ? '' : raw).trim().replace(/^['"]|['"]$/g, '');
    if (!s0) return '';
    var s = typeof window.ensureBase85SerialForYamlSave === 'function'
      ? (window.ensureBase85SerialForYamlSave(s0) || s0)
      : s0;
    s = String(s || '').trim();
    if (!s) return '';
    if (s.indexOf('@U') !== 0) s = '@U' + s.replace(/^@U/, '');
    return s;
  }

  /**
   * Remove duplicate serial strings from backpack (character) or bank (profile).
   * Keeps the first occurrence of each serial (slot order ascending) and rebuilds
   * contiguous slot_0…slot_n-1. Non-slot keys on the container are preserved.
   * @returns {{ removed: number, kept: number, dest: string, compacted: boolean }|false}
   */
  window.dedupeYamlInventorySerials = function () {
    var yaml = getYamlText();
    if (!yaml.text || !String(yaml.text).trim()) {
      alert('Load or paste YAML in the editor first.');
      return false;
    }
    var kind = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(yaml.text) : 'unknown';
    if (kind !== 'character' && kind !== 'profile') {
      alert('De-dupe needs a character save (root state:) or profile save loaded in the editor.');
      return false;
    }
    if (typeof window.getYamlDataFromEditor !== 'function' || typeof window.commitYamlDataToEditor !== 'function') {
      alert('YAML tools are not ready yet. Reload the page.');
      return false;
    }
    var data = window.getYamlDataFromEditor();
    if (!data) {
      alert('Could not parse YAML. Fix syntax errors and try again.');
      return false;
    }
    var destWhich = kind === 'profile' ? 'bank' : 'backpack';
    var container = getYamlInventoryContainer(data, destWhich);
    if (!container) {
      alert(destWhich === 'backpack' ? 'No backpack object found in this save.' : 'No shared bank object found in this profile.');
      return false;
    }

    var keyRows = [];
    for (var sk in container) {
      if (!Object.prototype.hasOwnProperty.call(container, sk)) continue;
      var mm = /^slot_(\d+)$/.exec(sk);
      if (mm) keyRows.push({ key: sk, n: parseInt(mm[1], 10) });
    }
    keyRows.sort(function (a, b) { return a.n - b.n; });

    var seen = Object.create(null);
    var kept = [];
    var removed = 0;
    var scanned = 0;
    var needsCompact = false;
    for (var i = 0; i < keyRows.length; i++) {
      var entry = container[keyRows[i].key];
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
      var rawSerial = entry.serial;
      if (rawSerial == null || !String(rawSerial).trim()) continue;
      scanned++;
      var key = normalizeSerialKeyForYamlDedupe(rawSerial);
      if (!key) key = String(rawSerial).trim().replace(/^['"]|['"]$/g, '');
      if (!key) continue;
      if (seen[key]) {
        removed++;
        continue;
      }
      seen[key] = true;
      var copy = shallowCopySlotObject(entry);
      if (key.indexOf('@U') === 0) copy.serial = key;
      kept.push(copy);
      if (keyRows[i].n !== kept.length - 1) needsCompact = true;
    }

    if (!scanned) {
      alert(destWhich === 'backpack' ? 'No backpack items with serials found.' : 'No bank items with serials found.');
      return false;
    }
    if (!removed && !needsCompact) {
      return { removed: 0, kept: kept.length, dest: destWhich, compacted: false };
    }
    if (!removed && needsCompact) {
      var okCompact = confirm(
        'No duplicate serials found, but ' + destWhich + ' slots are not contiguous.\n\n' +
        'Renumber ' + kept.length + ' item(s) as slot_0…slot_' + (kept.length - 1) + '?'
      );
      if (!okCompact) return false;
    } else {
      var okDup = confirm(
        'Remove ' + removed + ' duplicate serial(s) from ' + destWhich + '?\n\n' +
        'Keep ' + kept.length + ' unique item(s) and renumber as slot_0…slot_' + Math.max(0, kept.length - 1) + '.'
      );
      if (!okDup) return false;
    }

    var nonSlot = {};
    for (var nk in container) {
      if (!Object.prototype.hasOwnProperty.call(container, nk)) continue;
      if (/^slot_\d+$/.test(nk)) continue;
      nonSlot[nk] = container[nk];
    }
    for (var dk in container) {
      if (Object.prototype.hasOwnProperty.call(container, dk) && /^slot_\d+$/.test(dk)) {
        delete container[dk];
      }
    }
    for (var j = 0; j < kept.length; j++) {
      container['slot_' + j] = kept[j];
    }
    for (var rk in nonSlot) {
      if (Object.prototype.hasOwnProperty.call(nonSlot, rk)) container[rk] = nonSlot[rk];
    }

    window.commitYamlDataToEditor(data);
    if (typeof window.scheduleParseYAMLBackpack === 'function') window.scheduleParseYAMLBackpack(80);
    if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
    if (typeof window.refreshBackpackUI === 'function') window.refreshBackpackUI();
    return { removed: removed, kept: kept.length, dest: destWhich, compacted: true };
  };

  /** Enable/disable Add to YAML (character backpack) vs Add to bank (profile) by detectYamlSaveKind. */
  window.updateYamlInjectButtons = function () {
    var txt = '';
    var gt = getYamlText();
    txt = gt && gt.text ? String(gt.text) : '';
    var kind = !txt.trim() ? 'unknown' : (typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(txt) : 'unknown');
    var yamlIds = ['prefixItemAddToYamlBtn', 'godrollAddToYamlBtn', 'serialSearchAddToYamlBtn', 'yamlAddSerialsBtn', 'guidedAddItemToYaml', 'floatingAddItemToYaml', 'yamlDupBackpackBtn', 'yamlDupBackpackLevelBtn'];
    var bankIds = ['prefixItemAddToBankBtn', 'godrollAddToBankBtn', 'serialSearchAddToBankBtn', 'yamlAddSerialsBankBtn', 'guidedAddItemToBank', 'floatingAddItemToBank', 'yamlDupBankBtn', 'yamlDupBankLevelBtn'];
    var mergeIds = ['yamlMergeAsIsBtn', 'yamlMergeLevelBtn'];
    var dedupeIds = ['yamlDedupeSerialsBtn'];
    var yTitleOk = 'Add to character backpack (root state: save)';
    var yTitleNo = 'Load a character save YAML (root state:) first.';
    var bTitleOk = 'Add to profile bank (shared inventory)';
    var bTitleNo = 'Load profile .sav or YAML first.';
    var mTitleOk = 'Append all items from another YAML into this save';
    var mTitleNo = 'Load a character or profile YAML in the editor first.';
    var dTitleOkChar = 'Remove duplicate backpack serials and renumber slots';
    var dTitleOkProf = 'Remove duplicate bank serials and renumber slots';
    var dTitleNo = 'Load a character or profile YAML in the editor first.';
    for (var a = 0; a < yamlIds.length; a++) {
      var ye = byId(yamlIds[a]);
      if (!ye) continue;
      var yOk = kind === 'character';
      ye.disabled = !yOk;
      ye.title = yOk ? yTitleOk : yTitleNo;
    }
    for (var b = 0; b < bankIds.length; b++) {
      var be = byId(bankIds[b]);
      if (!be) continue;
      var bOk = kind === 'profile';
      be.disabled = !bOk;
      be.title = bOk ? bTitleOk : bTitleNo;
    }
    var mergeOk = kind === 'character' || kind === 'profile';
    for (var m = 0; m < mergeIds.length; m++) {
      var me = byId(mergeIds[m]);
      if (!me) continue;
      me.disabled = !mergeOk;
      me.title = mergeOk ? mTitleOk : mTitleNo;
    }
    for (var d = 0; d < dedupeIds.length; d++) {
      var de = byId(dedupeIds[d]);
      if (!de) continue;
      de.disabled = !mergeOk;
      de.title = !mergeOk ? dTitleNo : (kind === 'profile' ? dTitleOkProf : dTitleOkChar);
    }
    var strip = byId('stx-yaml-kind-strip');
    if (strip) {
      if (!txt.trim()) {
        strip.textContent = 'Detected: — paste or load YAML to classify this editor.';
      } else if (kind === 'character') {
        strip.textContent = 'Detected: character save — serial list = backpack; use Add to YAML / Add to backpack.';
      } else if (kind === 'profile') {
        strip.textContent = 'Detected: profile save — serial list = shared bank; use Add to bank.';
      } else {
        strip.textContent = 'Detected: unknown — expect root state: (character) or domains:/profile markers. Inventory tools may not apply.';
      }
    }
  };

  window.initYamlAddSerialsSection = function () {
    var ta = byId('yamlAddSerialsInput');
    var btn = byId('yamlAddSerialsBtn');
    var bankBtn = byId('yamlAddSerialsBankBtn');
    var clearBtn = byId('yamlAddSerialsClearBtn');
    var status = byId('yaml-add-serials-status');
    if (!ta || !btn) return;
    function runAdd(useBank) {
      var yaml = getYamlText();
      if (!yaml.text || !yaml.text.trim()) {
        if (status) {
          status.style.display = 'block';
          status.style.color = '#ff9090';
          status.textContent = 'Load or paste YAML in the editor above first.';
        }
        return;
      }
      var kind = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(yaml.text) : 'unknown';
      if (useBank && kind !== 'profile') {
        if (status) {
          status.style.display = 'block';
          status.style.color = '#ff9090';
          status.textContent = 'This action is for profile saves only. Load profile .sav or YAML, or use Add to backpack on a character save.';
        }
        return;
      }
      if (!useBank && kind !== 'character') {
        if (status) {
          status.style.display = 'block';
          status.style.color = '#ff9090';
          status.textContent = 'Add to backpack needs a character save (root state:). For profile, use Add to bank.';
        }
        return;
      }
      var raw = ta.value || '';
      if (!String(raw).trim()) {
        if (status) {
          status.style.display = 'block';
          status.style.color = '#ff9090';
          status.textContent = 'Paste at least one serial (one per line, YAML serial:, or JSON with "serial" fields).';
        }
        return;
      }
      var r = window.appendSerialLinesToYAML ? window.appendSerialLinesToYAML(raw) : { added: 0, failed: 0 };
      if (status) {
        status.style.display = 'block';
        status.style.color = 'rgba(0,200,255,0.95)';
        var where = useBank ? 'profile bank' : 'backpack';
        if (r.added > 0) {
          status.textContent = 'Added ' + r.added + ' item(s) to ' + where + '.' + (r.failed ? ' (' + r.failed + ' line(s) could not be added.)' : '');
          ta.value = '';
        } else {
          status.textContent = 'Nothing added. Use one serial per line, YAML serial:, JSON objects with "serial", or check the save type matches the button.';
        }
      }
    }
    btn.addEventListener('click', function () { runAdd(false); });
    if (bankBtn) bankBtn.addEventListener('click', function () { runAdd(true); });
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        ta.value = '';
        if (status) { status.textContent = ''; status.style.display = 'none'; }
      });
    }
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        var k = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(getYamlText().text || '') : 'unknown';
        if (k === 'profile' && bankBtn) bankBtn.click();
        else btn.click();
      }
    });
    if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
  };

  window.initYamlDuplicateSection = function () {
    var root = byId('yaml-dup-section');
    if (!root || root.dataset.yamlDupWired === '1') return;
    root.dataset.yamlDupWired = '1';
    var lvl = byId('yamlDupTargetLevel');
    var bpAs = byId('yamlDupBackpackBtn');
    var bpLv = byId('yamlDupBackpackLevelBtn');
    var bkAs = byId('yamlDupBankBtn');
    var bkLv = byId('yamlDupBankLevelBtn');
    var status = byId('yaml-add-serials-status');
    function showStatus(msg, ok) {
      if (!status) return;
      status.style.display = 'block';
      status.style.color = ok ? 'rgba(0,200,255,0.95)' : '#ff9090';
      status.textContent = msg;
    }
    function readLevel() {
      if (!lvl) return NaN;
      var n = parseInt(String(lvl.value || '').trim(), 10);
      return Number.isFinite(n) ? n : NaN;
    }
    if (bpAs) {
      bpAs.addEventListener('click', function () {
        if (window.duplicateYamlInventorySection && window.duplicateYamlInventorySection('backpack', null)) {
          showStatus('Duplicated backpack (as-is).', true);
        }
      });
    }
    if (bpLv) {
      bpLv.addEventListener('click', function () {
        var L = readLevel();
        if (!Number.isFinite(L)) {
          showStatus('Enter a target level for the copies.', false);
          return;
        }
        if (window.duplicateYamlInventorySection && window.duplicateYamlInventorySection('backpack', L)) {
          showStatus('Duplicated backpack at level ' + L + '.', true);
        }
      });
    }
    if (bkAs) {
      bkAs.addEventListener('click', function () {
        if (window.duplicateYamlInventorySection && window.duplicateYamlInventorySection('bank', null)) {
          showStatus('Duplicated bank (as-is).', true);
        }
      });
    }
    if (bkLv) {
      bkLv.addEventListener('click', function () {
        var L2 = readLevel();
        if (!Number.isFinite(L2)) {
          showStatus('Enter a target level for the copies.', false);
          return;
        }
        if (window.duplicateYamlInventorySection && window.duplicateYamlInventorySection('bank', L2)) {
          showStatus('Duplicated bank at level ' + L2 + '.', true);
        }
      });
    }
    if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
  };

  window.initYamlDedupeSection = function () {
    var root = byId('yaml-dedupe-section');
    if (!root || root.dataset.yamlDedupeWired === '1') return;
    root.dataset.yamlDedupeWired = '1';
    var btn = byId('yamlDedupeSerialsBtn');
    var status = byId('yaml-add-serials-status');
    function showStatus(msg, ok) {
      if (!status) return;
      status.style.display = 'block';
      status.style.color = ok ? 'rgba(0,200,255,0.95)' : '#ff9090';
      status.textContent = msg;
    }
    if (btn) {
      btn.addEventListener('click', function () {
        var result = window.dedupeYamlInventorySerials ? window.dedupeYamlInventorySerials() : false;
        if (!result) return;
        if (!result.removed && !result.compacted) {
          showStatus('No duplicate serials in ' + result.dest + ' (' + result.kept + ' unique).', true);
          return;
        }
        if (result.removed) {
          showStatus(
            'Removed ' + result.removed + ' duplicate(s) from ' + result.dest +
            '; kept ' + result.kept + ' unique item(s), renumbered slot_0…',
            true
          );
        } else {
          showStatus('Renumbered ' + result.kept + ' ' + result.dest + ' item(s) as contiguous slots.', true);
        }
      });
    }
    if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
  };

  window.initYamlMergeSection = function () {
    var root = byId('yaml-merge-section');
    if (!root || root.dataset.yamlMergeWired === '1') return;
    root.dataset.yamlMergeWired = '1';
    var fileInput = byId('yamlMergeFileInput');
    var lvl = byId('yamlMergeTargetLevel');
    var asBtn = byId('yamlMergeAsIsBtn');
    var lvBtn = byId('yamlMergeLevelBtn');
    var status = byId('yaml-add-serials-status');
    var pendingLevel = null;
    function showStatus(msg, ok) {
      if (!status) return;
      status.style.display = 'block';
      status.style.color = ok ? 'rgba(0,200,255,0.95)' : '#ff9090';
      status.textContent = msg;
    }
    function readLevel() {
      if (!lvl) return NaN;
      var n = parseInt(String(lvl.value || '').trim(), 10);
      return Number.isFinite(n) ? n : NaN;
    }
    function pickAndMerge(useLevel) {
      if (!fileInput) {
        showStatus('Merge file picker is missing. Reload the page.', false);
        return;
      }
      if (useLevel) {
        var L = readLevel();
        if (!Number.isFinite(L)) {
          showStatus('Enter a target level for the imported items.', false);
          return;
        }
        pendingLevel = L;
      } else {
        pendingLevel = null;
      }
      fileInput.value = '';
      fileInput.click();
    }
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        var f = fileInput.files && fileInput.files[0];
        if (!f) return;
        var levelForMerge = pendingLevel;
        pendingLevel = null;
        var reader = new FileReader();
        reader.onload = function () {
          var text = reader.result == null ? '' : String(reader.result);
          var result = window.mergeInventoryFromYamlText
            ? window.mergeInventoryFromYamlText(text, levelForMerge)
            : false;
          if (result && result.added > 0) {
            var where = result.dest === 'bank' ? 'profile bank' : 'backpack';
            var lvlNote = Number.isFinite(levelForMerge) ? ' at level ' + levelForMerge : '';
            showStatus('Merged ' + result.added + ' item(s) from "' + f.name + '" into ' + where + lvlNote + '.', true);
          }
        };
        reader.onerror = function () {
          showStatus('Could not read that YAML file.', false);
        };
        reader.readAsText(f);
      });
    }
    if (asBtn) {
      asBtn.addEventListener('click', function () { pickAndMerge(false); });
    }
    if (lvBtn) {
      lvBtn.addEventListener('click', function () { pickAndMerge(true); });
    }
    if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
  };

  window.initSerialSearchSection = function () {
    var fileInput = byId('serialLibraryFileInput');
    var searchInput = byId('serialSearchInput');
    var resultsEl = byId('serial-search-results');
    var statusEl = byId('serial-search-status');
    var selectAllBtn = byId('serialSearchSelectAllBtn');
    var clearBtn = byId('serialSearchClearBtn');
    var addToYamlBtn = byId('serialSearchAddToYamlBtn');
    var addToBankBtn = byId('serialSearchAddToBankBtn');
    var addToEditorBtn = byId('serialSearchAddToEditorBtn');
    if (!resultsEl) return;
    if (resultsEl.dataset.stxSerialSearchWired === '1') {
      try {
        if (typeof window.__stxRefreshSerialSearchCatalog === 'function') window.__stxRefreshSerialSearchCatalog();
      } catch (_) {}
      return;
    }
    resultsEl.dataset.stxSerialSearchWired = '1';
    window.serialLibrarySerials = window.serialLibrarySerials || [];
    var library = window.serialLibrarySerials;
    var catalogSerials = null;
    var catalogLoadPromise = null;
    var catalogSelection = Object.create(null);
    var serialSearchRenderLimit = 80;
    var lastFilteredRows = [];
    var SERIAL_SEARCH_DEBOUNCE_MS = 350;
    var SERIAL_MIN_QUERY_LEN = 2;
    var serialSearchDebounceTimer = null;
    var catalogSearchIndexReady = false;
    var INDEX_CHUNK_SIZE = 2000;
    var catalogIndexInFlight = false;

    function escapeHtml(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function paintCatalogStatus() {
      if (!statusEl) return;
      var libN0 = library.length;
      var n = catalogSerials && catalogSerials.length ? catalogSerials.length : 0;
      statusEl.textContent = n
        ? (n + ' items in catalog' + (libN0 ? (' · ' + libN0 + ' in your list') : '') + '. Type to search.')
        : ('Catalog not loaded yet' + (libN0 ? (' · ' + libN0 + ' in your list') : '') + '. Retrying…');
    }

    function loadCatalogSerials(force) {
      if (!force && catalogSerials && catalogSerials.length) return Promise.resolve(catalogSerials);
      if (!force && catalogLoadPromise) return catalogLoadPromise;
      if (force) {
        catalogLoadPromise = null;
        catalogSerials = null;
        catalogSearchIndexReady = false;
      }
      var ensure = (typeof window.__ccEnsureSerialsCatalog === 'function')
        ? window.__ccEnsureSerialsCatalog()
        : null;
      if (ensure) {
        catalogLoadPromise = ensure.then(function (arr) {
          catalogSerials = Array.isArray(arr) ? arr : [];
          return catalogSerials;
        }).catch(function () {
          catalogSerials = (window.STX_SERIALS_DATA && window.STX_SERIALS_DATA.serials) || [];
          return catalogSerials;
        });
        return catalogLoadPromise;
      }
      if (window.STX_SERIALS_DATA && window.STX_SERIALS_DATA.serials && window.STX_SERIALS_DATA.serials.length) {
        catalogSerials = window.STX_SERIALS_DATA.serials;
        return Promise.resolve(catalogSerials);
      }
      var proto = (typeof location !== 'undefined' && location.protocol) || '';
      // file:// cannot fetch; wait for lazy serials_data.js instead of locking in an empty catalog.
      if (proto === 'file:' || proto === 'chrome-extension:' || proto === 'moz-extension:') {
        catalogSerials = [];
        catalogLoadPromise = Promise.resolve(catalogSerials);
        return catalogLoadPromise;
      }
      catalogLoadPromise = fetch((function () {
        try {
          if (/\/assets(\/|$)/i.test(String(location.pathname || ''))) return './data/serials.json';
        } catch (_) {}
        return './assets/data/serials.json';
      })())
        .then(function (r) { return r.json(); })
        .then(function (data) {
          catalogSerials = data && data.serials ? data.serials : [];
          return catalogSerials;
        })
        .catch(function () {
          catalogSerials = (window.STX_SERIALS_DATA && window.STX_SERIALS_DATA.serials) || [];
          return catalogSerials;
        });
      return catalogLoadPromise;
    }

    window.__stxRefreshSerialSearchCatalog = function () {
      var need = !(catalogSerials && catalogSerials.length);
      var canEnsure = typeof window.__ccEnsureSerialsCatalog === 'function'
        || (window.STX_SERIALS_DATA && window.STX_SERIALS_DATA.serials && window.STX_SERIALS_DATA.serials.length);
      if (!need && !canEnsure) return;
      if (!need) {
        paintCatalogStatus();
        renderResults(buildFilteredRows((searchInput && searchInput.value || '').trim().toLowerCase()));
        return;
      }
      if (statusEl) statusEl.textContent = 'Loading item catalog…';
      loadCatalogSerials(true).then(function () {
        paintCatalogStatus();
        renderResults(buildFilteredRows((searchInput && searchInput.value || '').trim().toLowerCase()));
      });
    };

    function buildCatalogSearchHay(item, allowDecode) {
      var parts = [
        String(item.name || '').toLowerCase(),
        String(item.serial || '').toLowerCase(),
      ];
      if (item.familyId != null && item.itemId != null) {
        parts.push(String(item.familyId) + ':' + String(item.itemId));
      }
      if (item.idRaw) parts.push(String(item.idRaw).toLowerCase());
      if (allowDecode) {
        var meta = parseSerialMeta(item.serial);
        if (meta.familyId != null && meta.itemId != null) {
          parts.push(String(meta.familyId) + ':' + String(meta.itemId));
        }
        if (meta.name) parts.push(String(meta.name).toLowerCase());
      }
      return parts.join('\x00');
    }

    function scheduleCatalogIndexStep(fn) {
      if (typeof window.stxScheduleIdle === 'function') {
        window.stxScheduleIdle(fn, 120);
      } else if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(function () { fn(); }, { timeout: 120 });
      } else {
        setTimeout(fn, 0);
      }
    }

    function ensureCatalogSearchIndex(done) {
      if (catalogSearchIndexReady || !catalogSerials || !catalogSerials.length) {
        if (done) done();
        return;
      }
      if (catalogIndexInFlight) {
        ensureCatalogSearchIndex.__pendingDone = done;
        return;
      }
      catalogIndexInFlight = true;
      var i = 0;
      function step() {
        var end = Math.min(i + INDEX_CHUNK_SIZE, catalogSerials.length);
        for (; i < end; i++) {
          if (!catalogSerials[i].__searchHay) {
            catalogSerials[i].__searchHay = buildCatalogSearchHay(catalogSerials[i], false);
          }
        }
        if (i < catalogSerials.length) {
          scheduleCatalogIndexStep(step);
        } else {
          catalogSearchIndexReady = true;
          catalogIndexInFlight = false;
          var pending = ensureCatalogSearchIndex.__pendingDone;
          ensureCatalogSearchIndex.__pendingDone = null;
          if (done) done();
          if (pending && pending !== done) pending();
        }
      }
      step();
    }

    function buildLibrarySearchHay(it) {
      var name = String(it.name || lookupNameBySerial(it.serial) || '').toLowerCase();
      return [
        name,
        String(it.serial || '').toLowerCase(),
      ].join('\x00');
    }

    function catalogMatches(item, q) {
      if (!q) return true;
      var hay = item.__searchHay || buildCatalogSearchHay(item, false);
      if (hay.indexOf(q) >= 0) return true;
      if (!/\d/.test(q)) return false;
      if (!item.__searchHayDecoded) {
        item.__searchHayDecoded = buildCatalogSearchHay(item, true);
      }
      return item.__searchHayDecoded.indexOf(q) >= 0;
    }

    function isRowSelected(row) {
      if (!row) return false;
      if (row.source === 'library' && Number.isFinite(row._idx) && library[row._idx]) {
        return !!library[row._idx].selected;
      }
      return !!catalogSelection[row.serial];
    }

    function setRowSelected(row, on) {
      if (!row) return;
      if (row.source === 'library' && Number.isFinite(row._idx) && library[row._idx]) {
        library[row._idx].selected = !!on;
      } else if (row.serial) {
        catalogSelection[row.serial] = !!on;
      }
    }

    function getSelectedRows() {
      var out = [];
      var seen = Object.create(null);
      for (var i = 0; i < lastFilteredRows.length; i++) {
        var row = lastFilteredRows[i];
        if (!isRowSelected(row)) continue;
        var ser = String(row.serial || '').trim();
        if (!ser || seen[ser]) continue;
        seen[ser] = true;
        out.push(row);
      }
      return out;
    }

    function openSaveYamlDrawer() {
      if (typeof window.stxOpenSaveYamlDrawer === 'function') {
        window.stxOpenSaveYamlDrawer({ skipParse: true });
        return;
      }
      var drawer = byId('rp-saveyaml-drawer');
      if (drawer) {
        drawer.classList.add('rp-open');
        document.body.classList.add('rp-saveyaml-drawer-open');
      }
    }

    function getSerialSearchInjectCopies() {
      try {
        var mq = byId('serialSearchInjectCopies');
        if (mq) return normalizeYamlInjectCopies(mq.value);
      } catch (_) {}
      return 1;
    }

    function detectSerialTextMode(raw) {
      return detectSerialPasteMode(raw);
    }

    function extractSerialsFromText(raw, mode) {
      return extractSerialsFromMultilinePaste(raw, mode);
    }

    function extractSerialsWithModeFallback(raw) {
      return extractSerialsFromMultilinePasteWithFallback(raw);
    }

    function loadPasteIntoLibraryIfEmpty() {
      if (library.length > 0) return;
      var pa = byId('serialLibraryPasteArea');
      if (!pa) return;
      var raw = (pa.value || '').trim();
      if (!raw) return;
      var extracted = extractSerialsWithModeFallback(raw);
      if (!extracted.length) return;
      for (var e = 0; e < extracted.length; e++) {
        var s = String(extracted[e]).trim();
        if (s) library.push({ serial: s, selected: false });
      }
      if (statusEl && library.length) {
        statusEl.textContent = 'Loaded ' + library.length + ' serial(s) from paste box (auto). Use “Load from Paste” to replace from the same box.';
      }
    }

    function renderResults(filtered) {
      lastFilteredRows = filtered || [];
      resultsEl.innerHTML = '';
      if (!filtered || !filtered.length) {
        resultsEl.innerHTML = '<div style="color:rgba(255,255,255,0.6);font-size:0.9em;">No matches. Try another name, serial, or ID (e.g. 272:11).</div>';
        return;
      }
      var show = filtered.slice(0, serialSearchRenderLimit);
      show.forEach(function (item) {
        var meta = parseSerialMeta(item.serial);
        var name = item.name || meta.name || lookupNameBySerial(item.serial) || 'Unknown Item';
        var level = Number.isFinite(meta.level) ? ' Lv' + meta.level : '';
        var tag = item.source === 'library' ? ' <span style="opacity:0.55;font-size:0.75em;">(your list)</span>' : '';
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:flex-start;gap:8px;padding:8px;background:rgba(0,200,255,0.06);border-radius:6px;border:1px solid rgba(0,200,255,0.2);';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        var cbKey = String(item.serial || item.name || Math.random()).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);
        cb.id = 'cc-yaml-serial-pick-' + cbKey;
        cb.name = cb.id;
        cb.setAttribute('aria-label', 'Select ' + (item.name || 'serial'));
        cb.checked = isRowSelected(item);
        cb.addEventListener('change', function () {
          setRowSelected(item, this.checked);
        });
        var label = document.createElement('div');
        label.style.cssText = 'flex:1;min-width:0;color:rgba(255,255,255,0.9);font-size:0.9em;';
        /* Show name + level only — hide raw family:item ids like (25:2504) from the list UI. */
        label.innerHTML = escapeHtml(name + level) + tag;
        row.appendChild(cb);
        row.appendChild(label);
        var btnStyle = 'padding:4px 8px;font-size:11px;';
        ['Copy', 'Editor', 'YAML', 'Bank'].forEach(function (lbl, bi) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn';
          btn.style.cssText = btnStyle;
          btn.textContent = lbl;
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var ser = String(item.serial || '').trim();
            if (!ser) return;
            if (bi === 0) {
              try { navigator.clipboard.writeText(ser); } catch (_) {}
              if (statusEl) statusEl.textContent = 'Copied serial.';
              return;
            }
            if (bi === 1) {
              importSerialToEditor(ser);
              return;
            }
            var mult = getSerialSearchInjectCopies();
            if (bi === 2) {
              if (window.appendSerialToYAML && window.appendSerialToYAML(ser, mult)) {
                openSaveYamlDrawer();
                if (statusEl) statusEl.textContent = 'Added to character backpack.';
              } else if (typeof window.stxAlertNeedSaveForYamlInject === 'function') {
                window.stxAlertNeedSaveForYamlInject('backpack');
              } else alert('Load a character save YAML (root state:) first.');
              return;
            }
            if (window.appendSerialToProfileBank && window.appendSerialToProfileBank(ser, mult)) {
              openSaveYamlDrawer();
              if (statusEl) statusEl.textContent = 'Added to profile bank.';
            } else if (typeof window.stxAlertNeedSaveForYamlInject === 'function') {
              window.stxAlertNeedSaveForYamlInject('bank');
            } else alert('Load profile .sav or YAML first.');
          });
          row.appendChild(btn);
        });
        resultsEl.appendChild(row);
      });
      if (filtered.length > serialSearchRenderLimit) {
        var moreWrap = document.createElement('div');
        moreWrap.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;';
        var more = document.createElement('div');
        more.style.cssText = 'color:rgba(255,255,255,0.6);font-size:0.85em;';
        more.textContent = 'Showing ' + serialSearchRenderLimit + ' of ' + filtered.length + '.';
        var moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'btn';
        moreBtn.style.cssText = 'padding:4px 8px;font-size:11px;';
        moreBtn.textContent = 'Show more';
        moreBtn.addEventListener('click', function () {
          serialSearchRenderLimit += 80;
          renderResults(filtered);
        });
        moreWrap.appendChild(more);
        moreWrap.appendChild(moreBtn);
        resultsEl.appendChild(moreWrap);
      }
    }

    function buildFilteredRows(q) {
      var filtered = [];
      var seen = Object.create(null);
      function pushRow(row) {
        var ser = String(row.serial || '').trim();
        if (!ser || seen[ser]) return;
        seen[ser] = true;
        filtered.push(row);
      }
      if (catalogSerials && catalogSerials.length) {
        var pool = q
          ? catalogSerials.filter(function (it) { return catalogMatches(it, q); })
          : catalogSerials.slice(0, 120);
        for (var c = 0; c < pool.length; c++) {
          var ent = pool[c];
          pushRow({
            serial: ent.serial,
            name: ent.name,
            source: 'catalog',
          });
        }
      }
      for (var i = 0; i < library.length; i++) {
        var it = library[i];
        var hay = it.__searchHay || buildLibrarySearchHay(it);
        if (!it.__searchHay) it.__searchHay = hay;
        if (!q || hay.indexOf(q) >= 0) {
          var meta = parseSerialMeta(it.serial);
          pushRow({
            serial: it.serial,
            name: meta.name || lookupNameBySerial(it.serial),
            source: 'library',
            _idx: i,
          });
        }
      }
      return filtered;
    }

    function runApplyFilter() {
      loadPasteIntoLibraryIfEmpty();
      var q = (searchInput && searchInput.value || '').trim().toLowerCase();
      if (!q) serialSearchRenderLimit = 80;
      if (!catalogSerials || !catalogSerials.length) {
        if (statusEl) statusEl.textContent = 'Loading item catalog…';
        loadCatalogSerials(!(catalogSerials && catalogSerials.length)).then(function () {
          function paint() {
            var filtered = buildFilteredRows(q);
            if (statusEl) {
              var libN = library.length;
              statusEl.textContent = q
                ? filtered.length + ' match(es) · catalog + your list' + (libN ? ' (' + libN + ' pasted)' : '')
                : (catalogSerials.length + ' items in catalog' + (libN ? ' · ' + libN + ' in your list' : '') + '. Type to search.');
            }
            renderResults(filtered);
          }
          if (q && q.length >= SERIAL_MIN_QUERY_LEN) {
            ensureCatalogSearchIndex(paint);
          } else {
            paint();
          }
        });
        return;
      }
      if (!catalogSearchIndexReady && q && q.length >= SERIAL_MIN_QUERY_LEN) {
        if (statusEl) statusEl.textContent = 'Building search index…';
        ensureCatalogSearchIndex(function () { runApplyFilter(); });
        return;
      }
      if (q && q.length < SERIAL_MIN_QUERY_LEN) {
        if (statusEl) {
          statusEl.textContent = 'Type at least ' + SERIAL_MIN_QUERY_LEN + ' characters to search '
            + catalogSerials.length + ' catalog items.';
        }
        renderResults([]);
        return;
      }
      var filtered = buildFilteredRows(q);
      if (statusEl) {
        var libN2 = library.length;
        statusEl.textContent = q
          ? filtered.length + ' match(es) · catalog + your list' + (libN2 ? ' (' + libN2 + ' pasted)' : '')
          : (catalogSerials.length + ' items in catalog' + (libN2 ? ' · ' + libN2 + ' in your list' : '') + '. Type to search.');
      }
      renderResults(filtered);
    }

    function scheduleApplyFilter(immediate) {
      clearTimeout(serialSearchDebounceTimer);
      if (immediate) {
        runApplyFilter();
        return;
      }
      serialSearchDebounceTimer = setTimeout(runApplyFilter, SERIAL_SEARCH_DEBOUNCE_MS);
    }

    function applyFilter() {
      scheduleApplyFilter(false);
    }

    var pasteBtn = byId('serialLibraryPasteBtn');
    var pasteArea = byId('serialLibraryPasteArea');
    if (pasteBtn && pasteArea) {
      pasteBtn.addEventListener('click', function () {
        var raw = (pasteArea.value || '').trim();
        if (!raw) { if (statusEl) statusEl.textContent = 'Paste content first.'; return; }
        var extracted = extractSerialsWithModeFallback(raw);
        for (var i = 0; i < library.length; i++) if (library[i]) library[i].selected = false;
        library.length = 0;
        for (var e = 0; e < extracted.length; e++) {
          var s = String(extracted[e]).trim();
          if (s) library.push({ serial: s, selected: false });
        }
        if (statusEl) statusEl.textContent = extracted.length ? ('Loaded ' + library.length + ' serial(s) from paste.') : 'No serial lines found — try YAML/TXT/JSON format.';
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
          if (!extracted.length) extracted = extractSerialsWithModeFallback(raw);
          for (var i = 0; i < library.length; i++) if (library[i]) library[i].selected = false;
          library.length = 0;
          for (var e = 0; e < extracted.length; e++) {
            var s = String(extracted[e]).trim();
            if (s) library.push({ serial: s, selected: false });
          }
          if (statusEl) {
            statusEl.textContent = library.length ? ('Loaded ' + library.length + ' serial(s) from ' + (f.name || 'file') + '.') : ('No serials parsed from ' + (f.name || 'file') + ' — try another format.');
          }
          applyFilter();
        };
        r.readAsText(f);
        this.value = '';
      });
    }
    if (searchInput) {
      searchInput.addEventListener('input', function () { scheduleApplyFilter(false); });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') scheduleApplyFilter(true);
      });
    }
    if (selectAllBtn) selectAllBtn.addEventListener('click', function () {
      for (var s = 0; s < lastFilteredRows.length; s++) setRowSelected(lastFilteredRows[s], true);
      applyFilter();
    });
    if (clearBtn) clearBtn.addEventListener('click', function () {
      library.length = 0;
      catalogSelection = Object.create(null);
      if (statusEl) statusEl.textContent = '';
      if (searchInput) searchInput.value = '';
      serialSearchRenderLimit = 80;
      applyFilter();
    });
    if (addToYamlBtn) addToYamlBtn.addEventListener('click', function () {
      var selected = getSelectedRows();
      if (!selected.length) { alert('Select at least one item first.'); return; }
      var yaml = getYamlText();
      if (!yaml.text || !yaml.text.trim()) {
        if (typeof window.stxAlertNeedSaveForYamlInject === 'function') window.stxAlertNeedSaveForYamlInject('backpack');
        else alert('Load a YAML file first.');
        return;
      }
      var kind = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(yaml.text) : 'unknown';
      if (kind !== 'character') {
        if (typeof window.stxAlertNeedSaveForYamlInject === 'function') window.stxAlertNeedSaveForYamlInject('backpack');
        else alert('Load a character save YAML (root state:) first.');
        return;
      }
      var mult = getSerialSearchInjectCopies();
      var added = 0;
      for (var a = 0; a < selected.length; a++) {
        if (window.appendSerialToYAML && window.appendSerialToYAML(selected[a].serial, mult)) added += mult;
      }
      if (added) openSaveYamlDrawer();
      if (statusEl) statusEl.textContent = added ? ('Added ' + added + ' item(s) to character backpack.') : 'Could not add (check backpack section).';
    });
    if (addToBankBtn) addToBankBtn.addEventListener('click', function () {
      var selected = getSelectedRows();
      if (!selected.length) { alert('Select at least one item first.'); return; }
      var yaml = getYamlText();
      if (!yaml.text || !yaml.text.trim()) {
        if (typeof window.stxAlertNeedSaveForYamlInject === 'function') window.stxAlertNeedSaveForYamlInject('bank');
        else alert('Load a YAML file first.');
        return;
      }
      var kind = typeof window.detectYamlSaveKind === 'function' ? window.detectYamlSaveKind(yaml.text) : 'unknown';
      if (kind !== 'profile') {
        if (typeof window.stxAlertNeedSaveForYamlInject === 'function') window.stxAlertNeedSaveForYamlInject('bank');
        else alert('Load profile .sav or YAML first.');
        return;
      }
      var multB = getSerialSearchInjectCopies();
      var serials = [];
      for (var b = 0; b < selected.length; b++) {
        var sb0 = String(selected[b].serial || '').trim();
        var sb = typeof window.ensureBase85SerialForYamlSave === 'function' ? window.ensureBase85SerialForYamlSave(sb0) : sb0;
        if (sb) {
          for (var bi = 0; bi < multB; bi++) serials.push(sb);
        }
      }
      if (!serials.length) { alert('No serials to add.'); return; }
      if (typeof window.insertSerials === 'function' && window.insertSerials(serials)) {
        openSaveYamlDrawer();
        if (statusEl) statusEl.textContent = 'Added ' + serials.length + ' item(s) to profile bank.';
      } else if (statusEl) {
        statusEl.textContent = 'Could not add to bank (load profile YAML first).';
      }
    });
    if (addToEditorBtn) addToEditorBtn.addEventListener('click', function () {
      var selected = getSelectedRows();
      if (!selected.length) { alert('Select at least one item first.'); return; }
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
    if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
    if (statusEl) statusEl.textContent = 'Loading item catalog…';
    loadCatalogSerials().then(function () {
      paintCatalogStatus();
      renderResults(buildFilteredRows(''));
      // If scripts loaded out of order (or file://), retry once ensure is available.
      if (!(catalogSerials && catalogSerials.length) && typeof window.__ccEnsureSerialsCatalog === 'function') {
        window.__stxRefreshSerialSearchCatalog();
      }
    });
  };

  function initYamlTextareaDragDrop() {
    var ta = byId('yamlInput') || byId('fullYamlInput');
    if (!ta || ta.dataset.stxYamlDropWired === '1') return;
    ta.dataset.stxYamlDropWired = '1';
    ta.classList.add('stx-yaml-drop-target');
    function halt(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    ta.addEventListener('dragenter', function (e) {
      halt(e);
      ta.classList.add('stx-yaml-drop-hover');
    });
    ta.addEventListener('dragover', function (e) {
      halt(e);
      ta.classList.add('stx-yaml-drop-hover');
    });
    ta.addEventListener('dragleave', function (e) {
      if (e.target === ta) ta.classList.remove('stx-yaml-drop-hover');
    });
    ta.addEventListener('drop', function (e) {
      halt(e);
      ta.classList.remove('stx-yaml-drop-hover');
      var files = e.dataTransfer && e.dataTransfer.files;
      var f = files && files[0];
      if (!f) return;
      var name = (f.name || '').toLowerCase();
      if (name.endsWith('.yaml') || name.endsWith('.yml')) {
        var reader = new FileReader();
        reader.onload = function () {
          var text = String(reader.result || '');
          ta.value = text;
          if (typeof window.scheduleParseYAMLBackpack === 'function') window.scheduleParseYAMLBackpack(50);
          if (typeof window.syncYamlToFields === 'function') window.syncYamlToFields();
          if (typeof window.__updatePresetButtonsAvailability === 'function') window.__updatePresetButtonsAvailability();
          if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
          if (typeof window.__ccRenderRuntimeStatus === 'function') window.__ccRenderRuntimeStatus();
        };
        reader.readAsText(f);
        return;
      }
      if (name.endsWith('.sav')) {
        try {
          window.selectedSaveFile = f;
          window.selectedSaveFileName = f.name;
          window.currentSavFileName = f.name;
        } catch (_) {}
        var info = byId('sav-file-info');
        if (info) {
          info.style.display = 'block';
          info.textContent = f.name + ' — decrypting to YAML…';
        }
        setTimeout(function () {
          if (typeof window.convertSAVToYAML === 'function') window.convertSAVToYAML();
        }, 0);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      var defer = (typeof requestIdleCallback === 'function')
        ? function (fn) { requestIdleCallback(fn, { timeout: 2500 }); }
        : function (fn) { setTimeout(fn, 500); };
      defer(function () {
        if (typeof window.initSerialSearchSection === 'function') window.initSerialSearchSection();
        if (typeof window.initYamlAddSerialsSection === 'function') window.initYamlAddSerialsSection();
        if (typeof window.initYamlDuplicateSection === 'function') window.initYamlDuplicateSection();
        if (typeof window.initYamlDedupeSection === 'function') window.initYamlDedupeSection();
        if (typeof window.initYamlMergeSection === 'function') window.initYamlMergeSection();
        if (typeof window.initYamlBulkDecoderHandoff === 'function') window.initYamlBulkDecoderHandoff();
        initYamlTextareaDragDrop();
      });
    });
  } else {
    var deferNow = (typeof requestIdleCallback === 'function')
      ? function (fn) { requestIdleCallback(fn, { timeout: 2500 }); }
      : function (fn) { setTimeout(fn, 500); };
    deferNow(function () {
      if (typeof window.initSerialSearchSection === 'function') window.initSerialSearchSection();
      if (typeof window.initYamlAddSerialsSection === 'function') window.initYamlAddSerialsSection();
      if (typeof window.initYamlDuplicateSection === 'function') window.initYamlDuplicateSection();
      if (typeof window.initYamlDedupeSection === 'function') window.initYamlDedupeSection();
      if (typeof window.initYamlMergeSection === 'function') window.initYamlMergeSection();
      if (typeof window.initYamlBulkDecoderHandoff === 'function') window.initYamlBulkDecoderHandoff();
      initYamlTextareaDragDrop();
    });
  }
})();
