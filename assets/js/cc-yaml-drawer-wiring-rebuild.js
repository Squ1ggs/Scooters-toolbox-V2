/**
 * cc-yaml-drawer-wiring-rebuild.js
 * Shared YAML runtime API + backpack delete wiring (same logic as index Save/YAML drawer).
 * Load after js-yaml; index and stx-save-yaml-full.html include this instead of inline copies.
 */
(function () {
  'use strict';
  function byId(id) { return document.getElementById(id); }
  function yamlTextarea() {
    return byId('yamlInput') || byId('fullYamlInput') || document.querySelector('textarea[aria-label="YAML editor"]');
  }
  function getActiveYamlText() {
    var ta = yamlTextarea();
    if (ta && ta.value && ta.value.trim()) return ta.value;
    return '';
  }
  window.getYamlText = function () {
    var el = yamlTextarea();
    return { el: el, text: el ? (el.value || '') : '' };
  };
  window.setYamlText = function (text) {
    var el = yamlTextarea();
    if (el) el.value = text;
  };
  function sanitizeYamlForParse(yaml) {
    if (!yaml || typeof yaml !== 'string') return yaml;
    try {
      yaml = yaml.replace(/:\s*!tags\s*$/gm, ':');
      yaml = yaml.replace(/^\s*!tags\s*$/gm, '');
      yaml = yaml.replace(/:\s*!tags\s*(?=\n)/g, ':');
      return yaml;
    } catch (_) { return yaml; }
  }
  window.getYamlDataFromEditor = function () {
    var t = window.getYamlText();
    var text = (t && typeof t === 'object' && t.text !== undefined) ? t.text : (typeof t === 'string' ? t : '');
    if (!text || !text.trim()) return null;
    text = sanitizeYamlForParse(text);
    var y = window.jsyaml || (typeof jsyaml !== 'undefined' ? jsyaml : null);
    if (!y || typeof y.load !== 'function') return null;
    var attempts = [];
    attempts.push({});
    if (y.CORE_SCHEMA) attempts.push({ schema: y.CORE_SCHEMA });
    if (y.JSON_SCHEMA) attempts.push({ schema: y.JSON_SCHEMA });
    if (y.FAILSAFE_SCHEMA) attempts.push({ schema: y.FAILSAFE_SCHEMA });
    var lastErr = null;
    for (var i = 0; i < attempts.length; i++) {
      try {
        var data = y.load(text, attempts[i]);
        if (data && typeof data === 'object') return data;
      } catch (e) {
        lastErr = e;
      }
    }
    console.error('YAML parse error', lastErr);
    return null;
  };
  function findCurrenciesBlock(yamlText) {
    if (!yamlText) return null;
    var lines = String(yamlText).split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      if (!/^\s*currencies\s*:\s*$/m.test(lines[i])) continue;
      var baseIndent = (lines[i].match(/^(\s*)/) || ['', ''])[1].length;
      var cash = null, eridium = null;
      for (var j = i + 1; j < lines.length; j++) {
        var ind = (lines[j].match(/^(\s*)/) || ['', ''])[1].length;
        if (lines[j].trim() !== '' && ind <= baseIndent) break;
        var cm = lines[j].match(/^\s*cash\s*:\s*([^\s#]+)/i);
        if (cm) cash = String(cm[1]).trim();
        var em = lines[j].match(/^\s*eridium\s*:\s*([^\s#]+)/i);
        if (em) eridium = String(em[1]).trim();
      }
      if (cash != null || eridium != null) return { cash: cash, eridium: eridium };
    }
    return null;
  }
  window.syncYamlToFields = function () {
    var t = window.getYamlText();
    var text = (t && t.text) || '';
    if (!text || !text.trim()) return;
    try {
      var data = window.getYamlDataFromEditor();
      if (!data) return;
      var levelEl = byId('yaml-char-level');
      var xpEl = byId('yaml-char-xp');
      var specLevelEl = byId('yaml-spec-level');
      var specPointsEl = byId('yaml-spec-points');
      var cashEl = byId('yaml-cash');
      var eridiumEl = byId('yaml-eridium');
      if (data.state && Array.isArray(data.state.experience)) {
        var charExp = data.state.experience.find(function (e) { return e && String(e.type || '').toLowerCase() === 'character'; });
        if (charExp) {
          if (levelEl && charExp.level != null) levelEl.value = String(charExp.level);
          if (xpEl && charExp.points != null) xpEl.value = String(charExp.points);
          var itemLvTgt = byId('yaml-items-target-level');
          if (itemLvTgt && charExp.level != null) itemLvTgt.value = String(charExp.level);
        }
        var specExp = data.state.experience.find(function (e) { return e && String(e.type || '').toLowerCase().indexOf('special') !== -1; });
        if (specExp && specLevelEl && specExp.level != null) specLevelEl.value = String(specExp.level);
      }
      if (data.progression && data.progression.point_pools && specPointsEl) {
        var sp = data.progression.point_pools.specializationtokenpool ?? data.progression.point_pools.specializationpoints ?? data.progression.point_pools.characterprogresspoints;
        if (sp != null) specPointsEl.value = String(sp);
      }
      var curr = findCurrenciesBlock(text);
      if (curr) {
        if (cashEl && curr.cash != null) cashEl.value = String(curr.cash);
        if (eridiumEl && curr.eridium != null) eridiumEl.value = String(curr.eridium);
      }
    } catch (_e) {}
  };
  window.setYAMLDifficulty = function (mode) {
    var ta = yamlTextarea();
    if (!ta || !(ta.value || '').trim()) return alert('Load or paste a YAML file first.');
    var labelMap = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
    var label = labelMap[mode] || 'Normal';
    var lines = (ta.value || '').split(/\r?\n/);
    var changed = false;
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/^(\s*)(player_difficulty)\s*:\s*([^#]*?)(\s*#.*)?$/i);
      if (m) {
        lines[i] = (m[1] || '') + m[2] + ': ' + label + (m[4] || '');
        changed = true;
      }
    }
    if (!changed) return alert("Couldn't find 'player_difficulty' in this YAML.");
    ta.value = lines.join('\n');
    if (window.syncYamlToFields) window.syncYamlToFields();
  };
  window.setCharacterPreset = function (classKey) {
    var CLASS_MAP = { DarkSiren: { name: 'Vex', class: 'Siren' }, Paladin: { name: 'Amon', class: 'Forgeknight' }, Gravitar: { name: 'Harlowe', class: 'Gravitar' }, ExoSoldier: { name: 'Rafa', class: 'Exo-Soldier' }, RoboDealer: { name: 'C4sh', class: 'Robodealer' } };
    var nameToKey = { Amon: 'Paladin', Vex: 'DarkSiren', Harlowe: 'Gravitar', Rafa: 'ExoSoldier', C4sh: 'RoboDealer' };
    var resolvedKey = CLASS_MAP[classKey] ? classKey : (nameToKey[classKey] || classKey);
    var meta = CLASS_MAP[resolvedKey];
    if (!meta) return;
    var newName = meta.name + ' (TBX)';
    function replaceYamlScalar(src, key, value) {
      if (!src) return src;
      var re = new RegExp('(^\\s*' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*).*$', 'm');
      if (re.test(src)) return src.replace(re, '$1' + value);
      var stateRe = /(^state:\s*\n)/m;
      if (stateRe.test(src)) return src.replace(stateRe, '$1  ' + key + ': ' + value + '\n');
      return src;
    }
    var ta = yamlTextarea();
    if (!ta || !(ta.value || '').trim()) return alert('Load or paste a YAML file first.');
    var classId = 'Char_' + resolvedKey;
    var newGuid = resolvedKey === 'Paladin' ? '67945CBA3A5F43FBBEF162AF54E95128' : '0123456789ABCDEF0123456789ABCDEF'.split('').sort(function () { return Math.random() - 0.5; }).join('');
    var updated = ta.value;
    updated = replaceYamlScalar(updated, 'char_guid', newGuid);
    updated = replaceYamlScalar(updated, 'class', classId);
    updated = replaceYamlScalar(updated, 'char_name', newName);
    ta.value = updated;
    var nameInput = byId('yaml-char-name');
    if (nameInput) nameInput.value = newName;
    if (window.syncYamlToFields) window.syncYamlToFields();
  };
  window.applyYAMLStatsChanges = function () {
    var data = window.getYamlDataFromEditor();
    if (!data) return alert('Load or paste a YAML file first.');
    var levelEl = byId('yaml-char-level');
    var xpEl = byId('yaml-char-xp');
    var specLevelEl = byId('yaml-spec-level');
    var specPointsEl = byId('yaml-spec-points');
    var cashEl = byId('yaml-cash');
    var eridiumEl = byId('yaml-eridium');
    if (data.state && Array.isArray(data.state.experience)) {
      for (var i = 0; i < data.state.experience.length; i++) {
        var e = data.state.experience[i];
        if (e && String(e.type || '').toLowerCase() === 'character') {
          if (levelEl && levelEl.value.trim() !== '') { e.level = parseInt(levelEl.value, 10) || e.level; }
          if (xpEl && xpEl.value.trim() !== '') { e.points = parseInt(xpEl.value, 10) || e.points; }
        }
        if (e && String(e.type || '').toLowerCase().indexOf('special') !== -1 && specLevelEl && specLevelEl.value.trim() !== '') {
          e.level = parseInt(specLevelEl.value, 10) || e.level;
        }
      }
    }
    if (data.progression && data.progression.point_pools && specPointsEl && specPointsEl.value.trim() !== '') {
      data.progression.point_pools.specializationtokenpool = parseInt(specPointsEl.value, 10);
    }
    if (data.state && (cashEl || eridiumEl)) {
      data.state.currencies = data.state.currencies || {};
      if (cashEl && cashEl.value.trim() !== '') data.state.currencies.cash = parseInt(cashEl.value, 10);
      if (eridiumEl && eridiumEl.value.trim() !== '') data.state.currencies.eridium = parseInt(eridiumEl.value, 10);
    }
    if (typeof window.commitYamlDataToEditor === 'function') window.commitYamlDataToEditor(data);
  };
  function detectYamlKind(text) {
    var t = String(text || '');
    var hasState = /(^|\n)\s*state\s*:/m.test(t);
    var hasDomains = /(^|\n)\s*domains\s*:/m.test(t);
    if (hasState) return 'character';
    if (hasDomains || /(^|\n)\s*profile\s*:/m.test(t) || /(^|\n)\s*unlockables\s*:\s*$/m.test(t) || /profile_guid\s*:/i.test(t)) return 'profile';
    return 'unknown';
  }
  window.detectYamlSaveKind = detectYamlKind;
  function updateButtons() {
    var kind = detectYamlKind(getActiveYamlText());
    var buttons = document.querySelectorAll('button[data-requires]');
    buttons.forEach(function (btn) {
      var req = btn.getAttribute('data-requires') || 'character';
      var ok = false;
      if (kind !== 'unknown') {
        if (req === 'both') ok = (kind === 'character' || kind === 'profile');
        else if (req === 'profile') ok = (kind === 'profile');
        else if (req === 'character') ok = (kind === 'character');
        else ok = true;
      }
      btn.disabled = !ok;
    });
  }
  window.__updatePresetButtonsAvailability = updateButtons;
  function boolIcon(ok) { return ok ? '&#x2713;' : '&#x2717;'; }
  function render() {
    var body = byId('ccRuntimeStatusBody');
    if (!body) return;
    var libs = {
      jsyaml: !!(window.jsyaml || (typeof jsyaml !== 'undefined')),
      pako: !!(window.pako || (typeof pako !== 'undefined')),
      CryptoJS: !!(window.CryptoJS || (typeof CryptoJS !== 'undefined')),
      decryptSav: typeof window.decryptSav === 'function'
    };
    var ta = yamlTextarea();
    var taInfo = ta ? ('found ' + (ta.id ? '#' + ta.id : 'textarea')) : 'not found';
    var yamlPresent = !!(ta && typeof ta.value === 'string' && ta.value.trim().length > 0);
    body.innerHTML = '<div>' + boolIcon(libs.jsyaml) + ' js-yaml &nbsp; ' + boolIcon(libs.pako) + ' pako &nbsp; ' + boolIcon(libs.CryptoJS) + ' CryptoJS &nbsp; ' + boolIcon(libs.decryptSav) + ' decryptSav</div>' +
      '<div>' + boolIcon(!!ta) + ' YAML textarea ' + taInfo + '</div>' +
      '<div>' + boolIcon(yamlPresent) + ' YAML loaded in textarea</div>';
  }
  window.__ccRenderRuntimeStatus = render;
  function setCollapsed(collapsed) {
    var body = byId('ccRuntimeStatusBody');
    if (body) body.style.display = collapsed ? 'none' : 'block';
    var chev = byId('ccRuntimeStatusChevron');
    if (chev) chev.textContent = collapsed ? '>' : 'v';
    window.__ccRuntimeStatusCollapsed = !!collapsed;
  }
  function setupToggle() {
    var hdr = byId('ccRuntimeStatusHeader') || byId('ccRuntimeStatus');
    if (!hdr) return;
    hdr.addEventListener('click', function (ev) {
      if (ev && ev.target && ev.target.tagName === 'A') return;
      setCollapsed(!window.__ccRuntimeStatusCollapsed);
    });
    setCollapsed(true);
  }
  function wire() {
    setupToggle();
    render();
    var ta = yamlTextarea();
    if (ta) {
      ta.addEventListener('input', function () { render(); updateButtons(); });
      ta.addEventListener('change', function () { render(); updateButtons(); });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        wire();
        updateButtons();
        var ta = yamlTextarea();
        if (ta) ta.addEventListener('input', function () { if (window.syncYamlToFields) window.syncYamlToFields(); });
      }, 50);
    });
  } else {
    setTimeout(function () { wire(); updateButtons(); }, 50);
  }
})();

(function () {
  'use strict';
  function byId(id) { return document.getElementById(id); }
  function getYamlText() {
    var a = byId('yamlInput');
    if (a && a.value && a.value.trim()) return { el: a, text: a.value };
    return { el: a, text: '' };
  }
  function setYamlText(updated) {
    var a = byId('yamlInput');
    if (a) a.value = updated;
  }
  function findBackpackBlock(lines) {
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/^(\s*)backpack:\s*$/);
      if (m) return { headerIndex: i, headerIndent: m[1] || '' };
    }
    for (var j = 0; j < lines.length; j++) {
      if (/^\s*inventory:\s*$/.test(lines[j])) {
        var invIndent = (lines[j].match(/^(\s*)/) || ['', ''])[1];
        for (var k = j + 1; k < lines.length; k++) {
          if (!lines[k].trim()) continue;
          var indent = (lines[k].match(/^(\s*)/) || ['', ''])[1];
          if (indent.length <= invIndent.length) break;
          if (/^\s*items:\s*$/.test(lines[k])) {
            for (var n = k + 1; n < lines.length; n++) {
              if (!lines[n].trim()) continue;
              var ind2 = (lines[n].match(/^(\s*)/) || ['', ''])[1];
              if (ind2.length <= indent.length) break;
              if (/^\s*backpack:\s*$/.test(lines[n])) return { headerIndex: n, headerIndent: ind2 };
            }
          }
        }
      }
    }
    return null;
  }
  function getBackpackRange(lines, headerIndex, headerIndent) {
    var end = headerIndex + 1;
    for (var i = headerIndex + 1; i < lines.length; i++) {
      var line = lines[i];
      if (!line.trim()) { end = i + 1; continue; }
      var ind = (line.match(/^(\s*)/) || ['', ''])[1];
      if (ind.length <= headerIndent.length) { end = i; break; }
      end = i + 1;
    }
    return { start: headerIndex + 1, end: end };
  }
  function findSlotHeaderIndex(lines, rangeStart, rangeEnd, slotNum) {
    var rx = new RegExp('^\\s*slot_' + String(slotNum).replace(/[^\d]/g, '') + ':\\s*$');
    for (var i = rangeStart; i < rangeEnd; i++) { if (rx.test(lines[i])) return i; }
    return -1;
  }
  function computeSlotBlockEnd(lines, headerIndex, rangeEnd) {
    var slotIndentLen = ((lines[headerIndex].match(/^(\s*)/) || ['', ''])[1] || '').length;
    for (var i = headerIndex + 1; i < rangeEnd; i++) {
      var line = lines[i];
      if (!line.trim()) continue;
      var indLen = ((line.match(/^(\s*)/) || ['', ''])[1] || '').length;
      if (indLen <= slotIndentLen) return i;
    }
    return rangeEnd;
  }
  window.deleteYAMLSerial = function (serialOrIndex) {
    try {
      var yaml = getYamlText();
      if (!yaml.text || !yaml.text.trim()) return false;
      var lines = yaml.text.split(/\r?\n/);
      var bp = findBackpackBlock(lines);
      if (!bp) return false;
      var range = getBackpackRange(lines, bp.headerIndex, bp.headerIndent);
      var slotNum = null;
      var headerIndex = -1;
      if (typeof serialOrIndex === 'number' && Number.isFinite(serialOrIndex)) {
        slotNum = Math.floor(serialOrIndex);
      } else {
        var raw = String(serialOrIndex || '').trim();
        if (!raw) return false;
        var extracted = window.extractedSerials || window.extractedSerialsUI || [];
        for (var u = 0; u < extracted.length; u++) {
          var it = extracted[u];
          var s = (it && it.serial != null) ? String(it.serial).trim() : '';
          if (s && s === raw && it.slot != null) { slotNum = parseInt(it.slot, 10); break; }
        }
        if (slotNum == null && /^\d+$/.test(raw)) slotNum = parseInt(raw, 10);
      }
      if (!Number.isFinite(slotNum)) return false;
      headerIndex = findSlotHeaderIndex(lines, range.start, range.end, slotNum);
      if (headerIndex < 0) return false;
      var endIndex = computeSlotBlockEnd(lines, headerIndex, range.end);
      var newLines = lines.slice(0, headerIndex).concat(lines.slice(endIndex));
      var updated = newLines.join('\n');
      setYamlText(updated);
      try {
        if (window.yamlBackpackData && typeof window.yamlBackpackData === 'object') delete window.yamlBackpackData[String(slotNum)];
        if (window.updatedYAMLBackpack && typeof window.updatedYAMLBackpack === 'object') delete window.updatedYAMLBackpack[String(slotNum)];
      } catch (_) {}
      try {
        if (Array.isArray(window.extractedSerials)) window.extractedSerials = window.extractedSerials.filter(function (it) { return String(it && it.slot) !== String(slotNum); });
      } catch (_) {}
      if (window.scheduleParseYAMLBackpack) window.scheduleParseYAMLBackpack(20);
      return true;
    } catch (_e) { return false; }
  };
  var yamlEl = byId('yamlInput');
  if (yamlEl) {
    yamlEl.addEventListener('input', function () { if (window.scheduleParseYAMLBackpack) window.scheduleParseYAMLBackpack(300); });
    yamlEl.addEventListener('paste', function () { if (window.scheduleParseYAMLBackpack) window.scheduleParseYAMLBackpack(300); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { if (window.parseYAMLBackpack) window.parseYAMLBackpack(); });
  else setTimeout(function () { if (window.parseYAMLBackpack) window.parseYAMLBackpack(); }, 100);
})();
