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
      /** js-yaml parses 0x… ints with parseInt and loses uint64 precision; game expects decimal. */
      if (typeof BigInt !== 'undefined') {
        yaml = yaml.replace(/^(\s*points\s*:\s*)(0x[0-9a-fA-F]+)(\s*(?:#.*)?)$/gm, function (_full, lead, hex, tail) {
          try {
            return lead + BigInt(hex).toString(10) + tail;
          } catch (_) {
            return _full;
          }
        });
      }
      return yaml;
    } catch (_) { return yaml; }
  }
  window.sanitizeYamlForParse = sanitizeYamlForParse;

  /** Walk save object; normalize experience `points` (VaultCard / Character / etc.) for safe YAML round-trip. */
  function normalizeYamlExperiencePointsInData(data) {
    if (!data || typeof data !== 'object' || typeof BigInt === 'undefined') return;
    function isExperienceEntryType(t) {
      var s = String(t || '');
      if (!s) return false;
      if (s === 'Character' || s === 'Specialization') return true;
      return /experience/i.test(s);
    }
    function normalizePointsScalar(v) {
      if (v == null) return v;
      if (typeof v === 'string') {
        var st = v.trim();
        if (/^\d+$/.test(st)) return st;
        if (/^0x[0-9a-fA-F]+$/i.test(st)) {
          try {
            return BigInt(st).toString(10);
          } catch (_) {
            return v;
          }
        }
        return v;
      }
      if (typeof v === 'number' && Number.isFinite(v)) {
        if (v >= 0 && Number.isSafeInteger(v)) return v;
        if (Number.isInteger(v) && v < 0) {
          try {
            var u = (BigInt(v) + (1n << 64n)) & ((1n << 64n) - 1n);
            return u.toString(10);
          } catch (_) {}
        }
      }
      return v;
    }
    var seen = new WeakSet();
    function walk(o) {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) {
        for (var i = 0; i < o.length; i++) {
          var item = o[i];
          if (item && typeof item === 'object' && isExperienceEntryType(item.type) && Object.prototype.hasOwnProperty.call(item, 'points')) {
            item.points = normalizePointsScalar(item.points);
          }
          walk(item);
        }
        return;
      }
      if (seen.has(o)) return;
      seen.add(o);
      for (var k in o) {
        if (Object.prototype.hasOwnProperty.call(o, k)) walk(o[k]);
      }
    }
    walk(data);
  }
  window.normalizeYamlExperiencePointsInData = normalizeYamlExperiencePointsInData;

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
        if (data && typeof data === 'object') {
          normalizeYamlExperiencePointsInData(data);
          return data;
        }
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
  function profileObjectHasBlackMarketKeys(o) {
    return o && typeof o === 'object' && (
      Object.prototype.hasOwnProperty.call(o, 'blackmarket_items') ||
      Object.prototype.hasOwnProperty.call(o, 'blackmarket_usedpools') ||
      Object.prototype.hasOwnProperty.call(o, 'blackmarket_trackerstate')
    );
  }
  /** Resolve `profile:` (or equivalent) object that holds `blackmarket_*` keys. */
  function getProfileBlackMarketContainer(data, create) {
    if (!data || typeof data !== 'object') return null;
    if (profileObjectHasBlackMarketKeys(data.profile)) return data.profile;
    if (data.domains && data.domains.local && profileObjectHasBlackMarketKeys(data.domains.local.profile)) {
      return data.domains.local.profile;
    }
    if (profileObjectHasBlackMarketKeys(data)) return data;
    if (!create) return null;
    data.profile = data.profile && typeof data.profile === 'object' ? data.profile : {};
    return data.profile;
  }
  function stripQuotedPartCode(c) {
    if (c == null) return '';
    var s = String(c).trim();
    if ((s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') || (s.charAt(0) === "'" && s.charAt(s.length - 1) === "'")) {
      s = s.slice(1, -1).replace(/\\"/g, '"');
    }
    return s;
  }
  var __ccBlackMarketDatalistFilled = false;
  window.__ccEnsureBlackMarketCompDatalist = function () {
    var dl = byId('ccBlackMarketCompDatalist');
    if (!dl || __ccBlackMarketDatalistFilled) return;
    var parts = window.STX_DATASET && window.STX_DATASET.ALL_PARTS;
    if (!Array.isArray(parts) || !parts.length) return;
    __ccBlackMarketDatalistFilled = true;
    var seen = {};
    var cap = 2800;
    for (var i = 0; i < parts.length && Object.keys(seen).length < cap; i++) {
      var raw = parts[i] && parts[i].code;
      var s = stripQuotedPartCode(raw);
      if (!s || !/\.comp_05_legendary_|\.comp_06_pearl_/.test(s)) continue;
      if (seen[s]) continue;
      seen[s] = true;
      var opt = document.createElement('option');
      opt.value = s;
      dl.appendChild(opt);
    }
  };
  function syncBlackMarketFieldsFromYamlData(data) {
    var container = data ? getProfileBlackMarketContainer(data, false) : null;
    function slot(idx) {
      var tEl = byId('yaml-bm-slot' + idx + '-type');
      var cEl = byId('yaml-bm-slot' + idx + '-comp');
      var gEl = byId('yaml-bm-slot' + idx + '-stage');
      var row = container && Array.isArray(container.blackmarket_items) ? container.blackmarket_items[idx - 1] : null;
      var tt = row && row.blackmarket_itemtype != null ? String(row.blackmarket_itemtype) : '';
      var cc = row && row.blackmarket_itemcomp != null ? String(row.blackmarket_itemcomp) : '';
      var gg = row && row.blackmarket_gamestage != null ? String(row.blackmarket_gamestage) : '';
      if (tEl) tEl.value = tt;
      if (cEl) cEl.value = cc;
      if (gEl) gEl.value = gg !== '' ? gg : '50';
    }
    slot(1);
    slot(2);
    var pools = container && Array.isArray(container.blackmarket_usedpools) ? container.blackmarket_usedpools : [];
    for (var p = 0; p < 3; p++) {
      var pel = byId('yaml-bm-pool' + p);
      if (pel) pel.value = pools[p] != null ? String(pools[p]) : '';
    }
    var tr = byId('yaml-bm-tracker');
    if (tr) {
      if (!container || container.blackmarket_trackerstate == null) tr.checked = false;
      else tr.checked = !!container.blackmarket_trackerstate;
    }
  }
  function applyBlackMarketFieldsToYamlData(data) {
    var t1 = byId('yaml-bm-slot1-type');
    var c1 = byId('yaml-bm-slot1-comp');
    var g1 = byId('yaml-bm-slot1-stage');
    var t2 = byId('yaml-bm-slot2-type');
    var c2 = byId('yaml-bm-slot2-comp');
    var g2 = byId('yaml-bm-slot2-stage');
    if (!t1 && !c1 && !g1 && !t2 && !c2 && !g2) return;
    var container = getProfileBlackMarketContainer(data, true);
    if (!container) return;
    var gs1 = g1 && g1.value.trim() !== '' ? parseInt(g1.value, 10) : 50;
    var gs2 = g2 && g2.value.trim() !== '' ? parseInt(g2.value, 10) : 50;
    if (!Number.isFinite(gs1)) gs1 = 50;
    if (!Number.isFinite(gs2)) gs2 = 50;
    container.blackmarket_items = [
      {
        blackmarket_itemtype: (t1 && t1.value.trim()) || '',
        blackmarket_itemcomp: (c1 && c1.value.trim()) || '',
        blackmarket_gamestage: gs1
      },
      {
        blackmarket_itemtype: (t2 && t2.value.trim()) || '',
        blackmarket_itemcomp: (c2 && c2.value.trim()) || '',
        blackmarket_gamestage: gs2
      }
    ];
    var pEls = [byId('yaml-bm-pool0'), byId('yaml-bm-pool1'), byId('yaml-bm-pool2')];
    var allPoolsEmpty = true;
    for (var pe = 0; pe < pEls.length; pe++) {
      if (pEls[pe] && String(pEls[pe].value).trim() !== '') { allPoolsEmpty = false; break; }
    }
    if (!allPoolsEmpty) {
      container.blackmarket_usedpools = pEls.map(function (el) {
        if (!el || String(el.value).trim() === '') return 0;
        var n = parseInt(el.value, 10);
        return Number.isFinite(n) ? n : 0;
      });
    }
    var tr = byId('yaml-bm-tracker');
    if (tr) container.blackmarket_trackerstate = !!tr.checked;
  }
  window.__ccUpdatePresetCosmeticUnlockCountUi = function () {
    var countEl = byId('yaml-profile-cosmetics-preset-count');
    var catsEl = byId('yaml-profile-cosmetics-preset-cats');
    if (!countEl && !catsEl) return;
    var n = 0;
    var lists = 0;
    try {
      if (typeof window.ensurePresetDataLoaded === 'function') window.ensurePresetDataLoaded();
      var U = typeof window.__ccPresetUnlockables === 'function' ? window.__ccPresetUnlockables() : null;
      if (U && typeof U === 'object') {
        for (var k in U) {
          if (!Object.prototype.hasOwnProperty.call(U, k) || k === 'shared_progress') continue;
          var ent = U[k] && U[k].entries;
          if (Array.isArray(ent)) {
            n += ent.length;
            lists++;
          }
        }
      }
    } catch (_e) {}
    if (countEl) countEl.textContent = n ? String(n) : '—';
    if (catsEl) catsEl.textContent = lists ? String(lists) : '—';
  };

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
      var vhUnlockedEl = byId('yaml-vh-level-unlocked');
      var vhProfUnlockedEl = byId('yaml-profile-vh-unlocked');
      var vhCurrentEl = byId('yaml-profile-vh-current');
      var vc01El = byId('yaml-profile-vc01-level');
      var vc02El = byId('yaml-profile-vc02-level');
      var vcTok1El = byId('yaml-profile-vaultcard01-tokens');
      var vcTok2El = byId('yaml-profile-vaultcard02-tokens');
      var echoTokEl = byId('yaml-profile-echotoken-points');
      if (data.globals && typeof data.globals === 'object') {
        var gvh = data.globals.highest_unlocked_vault_hunter_level;
        if (gvh != null) {
          if (vhUnlockedEl) vhUnlockedEl.value = String(gvh);
          if (vhProfUnlockedEl) vhProfUnlockedEl.value = String(gvh);
        }
        if (vhCurrentEl && data.globals.vault_hunter_level != null) {
          vhCurrentEl.value = String(data.globals.vault_hunter_level);
        }
      }
      var kind = typeof detectYamlKind === 'function' ? detectYamlKind(text) : 'unknown';
      var bankSum = byId('yaml-profile-bank-summary');
      if (kind === 'profile' && bankSum) {
        if (typeof window.__ccExtractBankSerialsSimple === 'function' && typeof window.__ccNextAvailableBankSlot === 'function') {
          var bankSerials = window.__ccExtractBankSerialsSimple(text) || [];
          var filled = 0;
          for (var bi = 0; bi < bankSerials.length; bi++) {
            if (bankSerials[bi] && String(bankSerials[bi].serial || '').trim()) filled++;
          }
          var nextSl = window.__ccNextAvailableBankSlot(text);
          bankSum.textContent =
            'Shared bank: ' + filled + ' item slot(s) with serials, ' + bankSerials.length + ' slot entrie(s) parsed — next suggested index: ' + nextSl +
            ' (YAML path: domains.local.shared.inventory.items.bank).';
        } else {
          bankSum.textContent = 'Shared bank: load YAML to refresh summary.';
        }
      } else if (bankSum) {
        bankSum.textContent = 'Load a profile YAML to see shared bank stats.';
      }
      if (kind === 'profile' && data.domains && data.domains.local && data.domains.local.shared) {
        var sh = data.domains.local.shared;
        function sharedExpByType(tn) {
          var ex = sh.experience;
          if (!Array.isArray(ex)) return null;
          for (var k = 0; k < ex.length; k++) {
            var en = ex[k];
            if (en && String(en.type || '') === tn) return en;
          }
          return null;
        }
        var e1 = sharedExpByType('VaultCard01_Experience');
        var e2 = sharedExpByType('VaultCard02_Experience');
        if (vc01El && e1 && e1.level != null) vc01El.value = String(e1.level);
        if (vc02El && e2 && e2.level != null) vc02El.value = String(e2.level);
        var cur = sh.currencies || {};
        if (vcTok1El && cur.vaultcard01_tokens != null) vcTok1El.value = String(cur.vaultcard01_tokens);
        if (vcTok2El && cur.vaultcard02_tokens != null) vcTok2El.value = String(cur.vaultcard02_tokens);
      }
      var progShared = data.domains && data.domains.local && data.domains.local.progression_shared;
      if (echoTokEl && progShared && progShared.point_pools && progShared.point_pools.echotokenprogresspoints != null) {
        echoTokEl.value = String(progShared.point_pools.echotokenprogresspoints);
      }
      if (kind === 'profile') {
        syncBlackMarketFieldsFromYamlData(data);
        if (typeof window.__ccEnsureBlackMarketCompDatalist === 'function') window.__ccEnsureBlackMarketCompDatalist();
        if (typeof window.__ccUpdatePresetCosmeticUnlockCountUi === 'function') window.__ccUpdatePresetCosmeticUnlockCountUi();
        var achTa = byId('yaml-profile-stats-achievements-text');
        if (achTa && typeof window.__ccAchievementsToLines === 'function') {
          var achObj = data.stats && data.stats.achievements;
          achTa.value = window.__ccAchievementsToLines(achObj && typeof achObj === 'object' ? achObj : null);
        }
      } else {
        syncBlackMarketFieldsFromYamlData(null);
        var pc = byId('yaml-profile-cosmetics-preset-count');
        var pt = byId('yaml-profile-cosmetics-preset-cats');
        if (pc) pc.textContent = '—';
        if (pt) pt.textContent = '—';
        var achTaClear = byId('yaml-profile-stats-achievements-text');
        if (achTaClear) achTaClear.value = '';
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
    var vhUnlockedEl = byId('yaml-vh-level-unlocked');
    if (vhUnlockedEl && vhUnlockedEl.value.trim() !== '') {
      data.globals = data.globals || {};
      data.globals.highest_unlocked_vault_hunter_level = parseInt(vhUnlockedEl.value, 10);
    }
    var vhCurEl = byId('yaml-profile-vh-current');
    if (vhCurEl && vhCurEl.value.trim() !== '') {
      data.globals = data.globals || {};
      data.globals.vault_hunter_level = parseInt(vhCurEl.value, 10);
    }
    if (typeof window.commitYamlDataToEditor === 'function') window.commitYamlDataToEditor(data);
  };

  function parseOptionalInt(el) {
    if (!el || el.value.trim() === '') return null;
    var n = parseInt(el.value, 10);
    return Number.isFinite(n) ? n : null;
  }

  window.applyProfileYamlFieldChanges = function () {
    var data = window.getYamlDataFromEditor();
    if (!data) return alert('Load or paste a YAML file first.');
    if (typeof detectYamlKind !== 'function' || detectYamlKind(window.getYamlText().text || '') !== 'profile') {
      return alert('This action is for profile saves only (domains.local / profile).');
    }
    var vhUnlockedEl = byId('yaml-vh-level-unlocked');
    var vhCurrentEl = byId('yaml-profile-vh-current');
    var vc01El = byId('yaml-profile-vc01-level');
    var vc02El = byId('yaml-profile-vc02-level');
    var vcTok1El = byId('yaml-profile-vaultcard01-tokens');
    var vcTok2El = byId('yaml-profile-vaultcard02-tokens');
    var echoTokEl = byId('yaml-profile-echotoken-points');
    var vhProfUnlockedEl = byId('yaml-profile-vh-unlocked');
    var hu = parseOptionalInt(vhProfUnlockedEl);
    if (hu == null) hu = parseOptionalInt(vhUnlockedEl);
    var vlc = parseOptionalInt(vhCurrentEl);
    if (hu != null || vlc != null) {
      data.globals = data.globals || {};
      if (hu != null) data.globals.highest_unlocked_vault_hunter_level = hu;
      if (vlc != null) data.globals.vault_hunter_level = vlc;
    }
    data.domains = data.domains || {};
    data.domains.local = data.domains.local || {};
    data.domains.local.shared = data.domains.local.shared || {};
    var sh = data.domains.local.shared;
    var t1 = parseOptionalInt(vcTok1El);
    var t2 = parseOptionalInt(vcTok2El);
    if (t1 != null || t2 != null) {
      sh.currencies = sh.currencies || {};
      if (t1 != null) sh.currencies.vaultcard01_tokens = t1;
      if (t2 != null) sh.currencies.vaultcard02_tokens = t2;
    }
    var l1 = parseOptionalInt(vc01El);
    var l2 = parseOptionalInt(vc02El);
    if (l1 != null || l2 != null) {
      sh.experience = Array.isArray(sh.experience) ? sh.experience : [];
      function setVaultCardLevelIfPresent(arr, typeName, level) {
        if (level == null || !Array.isArray(arr)) return;
        for (var i = 0; i < arr.length; i++) {
          if (arr[i] && String(arr[i].type || '') === typeName) { arr[i].level = level; return; }
        }
      }
      setVaultCardLevelIfPresent(sh.experience, 'VaultCard01_Experience', l1);
      setVaultCardLevelIfPresent(sh.experience, 'VaultCard02_Experience', l2);
    }
    var echoN = parseOptionalInt(echoTokEl);
    if (echoN != null) {
      data.domains.local.progression_shared = data.domains.local.progression_shared || {};
      data.domains.local.progression_shared.point_pools = data.domains.local.progression_shared.point_pools || {};
      data.domains.local.progression_shared.point_pools.echotokenprogresspoints = echoN;
    }
    applyBlackMarketFieldsToYamlData(data);
    var achTa = byId('yaml-profile-stats-achievements-text');
    if (achTa && String(achTa.value || '').trim() !== '') {
      if (typeof window.__ccParseAchievementLines === 'function' && typeof window.__ccMergeAchievementPatch === 'function') {
        var patch = window.__ccParseAchievementLines(achTa.value);
        var hasPatch = false;
        for (var pk in patch) {
          if (Object.prototype.hasOwnProperty.call(patch, pk)) { hasPatch = true; break; }
        }
        if (hasPatch) {
          data.stats = data.stats || {};
          data.stats.achievements = window.__ccMergeAchievementPatch(data.stats.achievements, patch);
        }
      }
    }
    if (typeof window.commitYamlDataToEditor === 'function') window.commitYamlDataToEditor(data);
  };
  function detectYamlKind(text) {
    var t = String(text || '').replace(/^\uFEFF/, '');
    if (!t.trim()) return 'unknown';
    var y = window.jsyaml || (typeof jsyaml !== 'undefined' ? jsyaml : null);
    if (y && typeof y.load === 'function') {
      try {
        var sanitized = typeof window.sanitizeYamlForParse === 'function' ? window.sanitizeYamlForParse(t) : t;
        var data = y.load(sanitized, {});
        if (data && typeof data === 'object') {
          var st = data.state;
          if (st && typeof st === 'object') {
            if (st.inventory || Array.isArray(st.experience) || st.char_guid != null || st.char_name != null || data.char_name != null) {
              return 'character';
            }
          }
          if (data.domains && data.domains.local) return 'profile';
        }
      } catch (_) {}
    }
    /** Root `state:` at line start — avoids nested `state:` under profile-only trees. */
    var hasRootState = /^state\s*:/m.test(t);
    var hasDomains = /(^|\n)\s*domains\s*:/m.test(t);
    var hasProfileHints =
      /(^|\n)\s*profile\s*:/m.test(t) ||
      /(^|\n)\s*unlockables\s*:/m.test(t) ||
      /profile_guid\s*:/i.test(t);
    if (hasRootState) return 'character';
    if (hasDomains || hasProfileHints) return 'profile';
    return 'unknown';
  }
  window.detectYamlSaveKind = detectYamlKind;
  function updateButtons() {
    var text = getActiveYamlText();
    var kind = detectYamlKind(text);
    var buttons = document.querySelectorAll('button[data-requires]');
    buttons.forEach(function (btn) {
      var req = btn.getAttribute('data-requires') || 'character';
      var ok = false;
      if (kind !== 'unknown') {
        if (req === 'both') ok = kind === 'character' || kind === 'profile';
        else if (req === 'profile') ok = kind === 'profile';
        else if (req === 'character') ok = kind === 'character';
        else ok = true;
      }
      btn.disabled = !ok;
    });
    var banner = byId('ccYamlKindBanner');
    if (banner) {
      if (!text.trim()) {
        banner.textContent =
          'No YAML in the editor — load or paste a file. Buttons below stay dimmed until a character or profile save is detected.';
      } else if (kind === 'character') {
        banner.textContent =
          'Detected: character save (root state:). Character / world / mission presets are enabled; profile-only buttons are dimmed.';
      } else if (kind === 'profile') {
        banner.textContent =
          'Detected: profile save (domains / unlockables / profile). Profile-only buttons are enabled; character / mission presets are dimmed.';
      } else {
        banner.textContent =
          'Could not detect save type. Expect a root line state: (character) or domains: / profile markers (profile).';
      }
    }
    if (typeof window.updateYamlInjectButtons === 'function') window.updateYamlInjectButtons();
    var profTools = byId('ccProfileYamlTools');
    if (profTools) profTools.style.display = kind === 'profile' ? 'block' : 'none';
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
    var vhAdv = byId('yaml-vh-level-unlocked');
    var vhProf = byId('yaml-profile-vh-unlocked');
    if (vhAdv && vhProf) {
      vhAdv.addEventListener('input', function () { vhProf.value = vhAdv.value; });
      vhProf.addEventListener('input', function () { vhAdv.value = vhProf.value; });
    }
    var scrollBankBtn = byId('ccProfileScrollBankSerialsBtn');
    if (scrollBankBtn) {
      scrollBankBtn.addEventListener('click', function () {
        var el = byId('yamlAddSerialsInput');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          try { el.focus(); } catch (_) {}
        }
      });
    }
    var achFill = byId('yaml-profile-ach-fill-preset');
    if (achFill && achFill.dataset.ccWired !== '1') {
      achFill.dataset.ccWired = '1';
      achFill.addEventListener('click', function () {
        var getMax = window.__ccGetBundledAchievementCountersMax;
        var toLines = window.__ccAchievementsToLines;
        if (typeof getMax !== 'function' || typeof toLines !== 'function') return;
        var ta = byId('yaml-profile-stats-achievements-text');
        if (ta) ta.value = toLines(getMax());
      });
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
