/**
 * cc-classmod-checklist-rebuild.js
 * Guided Class Mod checklist UI.
 * Character buttons + Primary (skills) + Secondary (Perks/Firmware) checkbox lists.
 * Syncs with state.slots (perk, universal, firmware) and refreshOutputs.
 */
(function () {
  'use strict';

  var CM_ROWS_PER_PAGE = 10;
  var cmListPageState = { cmPrimaryList: 0, cmSecondaryList: 0, cmUniversalList: 0, cmFirmwareList: 0 };
  var cmSkillQtyState = {};
  /** >0 while mutating many checklist rows — skips per-row refreshOutputs for responsiveness */
  var cmBulkSuppressDepth = 0;
  var FAMILY_BY_KEY = { vex: 254, amon: 255, rafa: 256, harlowe: 259, c4sh: 404, robodealer: 404, universal: 234, firmware: 234 };
  /** Must match #classmodChecklistSection / #classmodQuickChecklistSection `.cm-checklist--resize-master` CSS. */
  var CM_CHECKLIST_PAIR_MIN_PX = 240;
  var CM_CHECKLIST_PAIR_MAX_PX = 800;
  var CM_CHECKLIST_HEIGHT_PAIRS = [
    ['cmPrimaryList', 'cmSecondaryList'],
    ['cmUniversalList', 'cmFirmwareList'],
    ['cmQuickPrimaryList', 'cmQuickSecondaryList'],
    ['cmQuickUniversalList', 'cmQuickFirmwareList']
  ];
  var cmChecklistHeightSyncReady = false;

  function byId(id) { return document.getElementById(id); }

  function clampCmChecklistPairHeight(px) {
    var n = Math.round(Number(px) || 0);
    if (n < CM_CHECKLIST_PAIR_MIN_PX) return CM_CHECKLIST_PAIR_MIN_PX;
    if (n > CM_CHECKLIST_PAIR_MAX_PX) return CM_CHECKLIST_PAIR_MAX_PX;
    return n;
  }

  function syncCmChecklistRowHeights() {
    for (var i = 0; i < CM_CHECKLIST_HEIGHT_PAIRS.length; i++) {
      var master = byId(CM_CHECKLIST_HEIGHT_PAIRS[i][0]);
      var slave = byId(CM_CHECKLIST_HEIGHT_PAIRS[i][1]);
      if (!master || !slave) continue;
      var h = clampCmChecklistPairHeight(master.getBoundingClientRect().height);
      slave.style.height = h + 'px';
      slave.style.minHeight = CM_CHECKLIST_PAIR_MIN_PX + 'px';
      slave.style.maxHeight = CM_CHECKLIST_PAIR_MAX_PX + 'px';
    }
  }

  function initCmChecklistHeightSync() {
    if (cmChecklistHeightSyncReady) return;
    cmChecklistHeightSyncReady = true;
    window.__ccSyncCmChecklistRowHeights = syncCmChecklistRowHeights;
    document.addEventListener('mouseup', syncCmChecklistRowHeights, true);
    document.addEventListener('touchend', syncCmChecklistRowHeights, true);
    for (var j = 0; j < CM_CHECKLIST_HEIGHT_PAIRS.length; j++) {
      var el = byId(CM_CHECKLIST_HEIGHT_PAIRS[j][0]);
      if (!el || el.__cmChecklistPairRO) continue;
      el.__cmChecklistPairRO = true;
      try {
        var ro = new ResizeObserver(syncCmChecklistRowHeights);
        ro.observe(el);
      } catch (_) {}
    }
    syncCmChecklistRowHeights();
  }

  function getState() {
    return window.__STX_SIMPLE_STATE || window.state || {};
  }

  function getClassModAllParts() {
    var ds = window.STX_DATASET;
    var ap = (ds && Array.isArray(ds.ALL_PARTS)) ? ds.ALL_PARTS : [];
    var out = ap.filter(function (p) {
      var c = String((p && p.category) || '').trim().toLowerCase().replace(/\s+/g, '');
      return c === 'classmod' || c === 'character';
    });
    if (out.length) return out;
    return Array.isArray(window.CLASSMOD_PARTS) ? window.CLASSMOD_PARTS.slice() : [];
  }

  function toChecklistItem(p, source, category) {
    var code = partCodeOf(p);
    return {
      name: String(((p && (p.name || p.legendaryName)) || code) || '').trim() || code,
      code: code,
      partType: String(((p && p.partType) || (p && p.kind) || '') || '').trim(),
      category: category || 'Classmod',
      _cmSource: source || '',
      part: p
    };
  }

  function getDisplayClassName(charName) {
    var raw = String(charName || '').trim();
    var key = charToKey(raw);
    return KEY_TO_DISPLAY[key] || MAN_TO_DISPLAY[raw] || raw;
  }

  function getClassModManufacturerName(charName) {
    var display = getDisplayClassName(charName);
    return DISPLAY_TO_MAN[display] || String(charName || '').trim();
  }

  function getFilteredClassModRawParts(charName, partType) {
    var filterParts = typeof window.filterPartsForGuided === 'function' ? window.filterPartsForGuided : null;
    if (!filterParts) return [];
    var man = getClassModManufacturerName(charName);
    var parts = filterParts({ category: 'Class Mod', manufacturer: man, partType: partType }) || [];
    return Array.isArray(parts) ? parts.slice() : [];
  }

  function getFilteredClassModItems(charName, partType, source) {
    var parts = getFilteredClassModRawParts(charName, partType);
    if (!parts.length) {
      if (partType === 'Firmware') return getItemsForKey('firmware');
      if (partType === 'Universal') return getItemsForKey('universal');
      if (partType === 'Secondary') return getItemsForKey('secondary');
      return [];
    }
    return parts
      .map(function (p) { return toChecklistItem(p, source || String(partType || '').toLowerCase(), 'Classmod Perk'); })
      .filter(isGuidedPerkEntry);
  }

  /** Dataset strings → actual `assets/img/classmod-firmware/<stem>.png` filenames. */
  var CM_FIRMWARE_ICON_STEM_ALIASES = {
    atlasinfinum: 'atlasinfinium',
    atlasinfiniumm: 'atlasinfinium',
    daeddyo: 'daedyo',
    deaddyo: 'daedyo',
    bulletspare: 'bulletstospare',
    getthrowin: 'getthrowd'
  };
  var CM_PERK_ICON_KEY_ALIASES = {
    alcentro: 'alcentro',
    alcentrorafa: 'alcentro',
    abajorafa: 'abajo',
    arribarafa: 'arriba',
    batterysubscriptionservicerafa: 'batterysubscriptionservice',
    firstimpressionrafa: 'firstimpression',
    propreitaryincendiary: 'proprietaryincendiary',
    thethrill: 'thethrillamon',
    healthregenpersecond: 'gravevitality',
    maximumhealthcapacity: 'vitalorgans',
    maximumshieldcapacity: 'shieldbarriest',
    movementspeed: 'fasthands',
    legerdamain: 'legerdemain',
    toothofnail: 'toothandnail',
    chainreaction: 'chainreactor',
    scertaintyprinciple: 'harlowescertaintyprinciple',
    certaintyprinciple: 'harlowescertaintyprinciple'
  };

  function normalizePerkNameForMeta(name) {
    var raw = String(name || '');
    try {
      if (typeof raw.normalize === 'function') raw = raw.normalize('NFD').replace(/\p{M}+/gu, '');
    } catch (_) {}
    if (typeof window.__normalizePerkName === 'function') {
      try { return String(window.__normalizePerkName(raw) || ''); } catch (_) {}
    }
    return String(raw || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').trim();
  }

  function getClassmodPerkMetaByName(name) {
    var raw = String(name || '').trim();
    if (!raw) return null;
    var byName = window.__CLASSMOD_PERK_META_BY_NAME || null;
    if (byName && byName[raw]) return byName[raw];
    var byKey = window.__CLASSMOD_PERK_META || null;
    var key = normalizePerkNameForMeta(raw);
    return byKey && key ? (byKey[key] || null) : null;
  }

  function getClassmodPerkMetaForItem(item) {
    if (!item) return null;
    var name = String(item.name || '').trim();
    if (!name && item.part) name = String(item.part.name || item.part.legendaryName || '').trim();
    var meta = getClassmodPerkMetaByName(name);
    if (meta) return meta;
    if (Array.isArray(item._cmGroupParts)) {
      for (var i = 0; i < item._cmGroupParts.length; i++) {
        var p = item._cmGroupParts[i];
        var m = getClassmodPerkMetaByName(String((p && (p.name || p.legendaryName)) || '').trim());
        if (m) return m;
      }
    }
    return null;
  }

  function getPerkTreeLabel(it) {
    var m = getClassmodPerkMetaForItem(it);
    var t = m && m.tree ? String(m.tree).trim() : '';
    return t || 'Other';
  }

  function resolvePerkThumbKey(it) {
    if (!it) return '';
    var meta = getClassmodPerkMetaForItem(it);
    var thumbMap = window.__PERK_THUMB_URL_BY_KEY || {};
    var tryNames = [];
    if (meta && meta.name) tryNames.push(String(meta.name).trim());
    if (it.name) tryNames.push(String(it.name).trim());
    if (Array.isArray(it._cmGroupParts)) {
      for (var gi = 0; gi < it._cmGroupParts.length; gi++) {
        var gp = it._cmGroupParts[gi];
        tryNames.push(String((gp && (gp.name || gp.legendaryName)) || '').trim());
      }
    }
    if (it.part) tryNames.push(String(it.part.name || it.part.legendaryName || '').trim());
    for (var j = 0; j < tryNames.length; j++) {
      var k = normalizePerkNameForMeta(tryNames[j]);
      if (k && thumbMap[k]) return k;
      if (k && meta && meta.vaultHunter) {
        var vh = String(meta.vaultHunter || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
        var vk = k + vh;
        if (thumbMap[vk]) return vk;
      }
      if (k) return k;
    }
    if (meta && meta.name) {
      var base = String(meta.name).replace(/\s*\([^)]*\)\s*/g, ' ').trim();
      var kb = normalizePerkNameForMeta(base);
      if (kb && thumbMap[kb]) return kb;
      var vh2 = String(meta.vaultHunter || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (kb && vh2 && thumbMap[kb + vh2]) return kb + vh2;
    }
    return '';
  }

  function perkThumbUrlCandidates(it, key) {
    if (!key) return [];
    var src = String(it._cmSource || '').toLowerCase();
    var isFw = src.indexOf('firmware') !== -1;
    var isPassive = src.indexOf('passive') !== -1;
    
    var map = window.__PERK_THUMB_URL_BY_KEY || {};
    var out = [];
    var meta = getClassmodPerkMetaForItem(it);
    var displayName = String((meta && meta.name) || (it && it.name) || '').trim();

    var keyCandidates = [];
    function addKeyCandidate(v) {
      var s = normalizePerkNameForMeta(v);
      if (!s) return;
      if (CM_PERK_ICON_KEY_ALIASES[s]) s = CM_PERK_ICON_KEY_ALIASES[s];
      if (keyCandidates.indexOf(s) === -1) keyCandidates.push(s);
    }
    
    addKeyCandidate(key);
    addKeyCandidate(displayName);
    if (it && it.name) addKeyCandidate(it.name);
    if (meta && meta.name) addKeyCandidate(meta.name);
    if (it && it.part) addKeyCandidate(it.part.name || it.part.legendaryName);
    
    if (Array.isArray(it && it._cmGroupParts)) {
      for (var kci = 0; kci < it._cmGroupParts.length; kci++) {
        var gpk = it._cmGroupParts[kci];
        if (gpk) addKeyCandidate(gpk.name || gpk.legendaryName);
      }
    }

    function pushSpeculativeUrls(stem) {
      var raw = normalizePerkNameForMeta(stem);
      if (!raw) return;
      var variants = [raw];
      var stripped = raw;
      if (typeof window.stxStripVaultHunterPrefixFromClassmodPerkStem === 'function') {
        try { stripped = window.stxStripVaultHunterPrefixFromClassmodPerkStem(raw) || raw; } catch (_) {}
      }
      if (stripped && stripped !== raw) variants.push(stripped);

      for (var vi = 0; vi < variants.length; vi++) {
        var s = variants[vi];
        if (typeof window.stxRemapClassmodPerkArtStem === 'function') {
          try { s = window.stxRemapClassmodPerkArtStem(s) || s; } catch (_) {}
        }
        if (!s) continue;

        /* Prefer catalog/CDN map first so missing local PNGs don't spam 404s. */
        if (map[s]) out.push(map[s]);

        var uni = typeof window.stxResolveUniversalClassmodPerkIconUrl === 'function' ? window.stxResolveUniversalClassmodPerkIconUrl(s) : null;
        if (uni) out.push(uni);

        // Avoid pointless disk/CDN lookups for plain stat rows once universal art is wired.
        var isGeneric = /actionskill|assaultrifle|criticalhit|damagedealt|damagereduction|elementaldamage|energyshield|firerate|criticalhitchance/.test(s);
        if (isGeneric) continue;

        if (isFw) {
          var fw = CM_FIRMWARE_ICON_STEM_ALIASES[s] || s;
          out.push('./assets/img/classmod-firmware/' + fw + '.png');
        } else if (isPassive) {
          out.push('./assets/img/classmod-passive/' + s + '.png');
          out.push('./assets/img/classmod-perks/' + s + '.png');
        } else {
          out.push('./assets/img/classmod-perks/' + s + '.png');
          out.push('./assets/img/classmod-passive/' + s + '.png');
          out.push('./assets/img/classmod-firmware/' + s + '.png');
        }
      }
    }

    for (var ci = 0; ci < keyCandidates.length; ci++) pushSpeculativeUrls(keyCandidates[ci]);

    return out;
  }

  function appendPerkThumbToRow(labelWrap, it) {
    var key = resolvePerkThumbKey(it);
    if (!key) return;
    var urls = perkThumbUrlCandidates(it, key);
    if (!urls.length) return;
    var img = document.createElement('img');
    img.className = 'cm-perk-thumb';
    img.alt = '';
    img.decoding = 'async';
    var idx = 0;
    img.addEventListener('error', function tryNext() {
      idx++;
      if (idx >= urls.length) {
        // Do not leave a blank cell: keep a vault-hunter fallback icon.
        var meta = getClassmodPerkMetaForItem(it) || {};
        var vh = String(meta.vaultHunter || '').trim().toLowerCase();
        if (vh === 'rafa') {
          img.src = './assets/img/vault-hunters/player_class_exo_soldier.png';
          return;
        }
        if (vh === 'c4sh' || vh === 'robodealer') {
          img.src = './assets/img/vault-hunters/player_robodealer.png';
          return;
        }
        img.remove();
        return;
      }
      img.src = urls[idx];
    });
    function beginThumbLoad() {
      if (img.__cmThumbLoadBegun) return;
      img.__cmThumbLoadBegun = true;
      img.loading = 'lazy';
      img.src = urls[0];
    }
    labelWrap.appendChild(img);
    if (typeof IntersectionObserver === 'function') {
      var io = new IntersectionObserver(function (ents) {
        for (var ei = 0; ei < ents.length; ei++) {
          if (ents[ei] && ents[ei].isIntersecting) {
            try { io.disconnect(); } catch (_) {}
            beginThumbLoad();
            return;
          }
        }
      }, { root: null, rootMargin: '100px 0px 100px 0px', threshold: 0.01 });
      try {
        io.observe(img);
      } catch (_) {
        beginThumbLoad();
      }
    } else {
      beginThumbLoad();
    }
  }

  function normalizeSkillGroupName(name) {
    return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function sortClassModSkillParts(parts) {
    return (Array.isArray(parts) ? parts.slice() : []).sort(function (a, b) {
      var ida = Number((a && a.id != null) ? a.id : String((a && (a.idRaw || a.idraw)) || '').split(':').pop());
      var idb = Number((b && b.id != null) ? b.id : String((b && (b.idRaw || b.idraw)) || '').split(':').pop());
      if (Number.isFinite(ida) && Number.isFinite(idb) && ida !== idb) return ida - idb;
      return partCodeOf(a).localeCompare(partCodeOf(b), undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  function getPreferredSkillGroupName(parts) {
    var counts = {};
    var best = '';
    var bestCount = -1;
    for (var i = 0; i < (parts || []).length; i++) {
      var name = String((parts[i] && parts[i].name) || '').trim();
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
      if (counts[name] > bestCount || (counts[name] === bestCount && name.localeCompare(best, undefined, { sensitivity: 'base' }) < 0)) {
        best = name;
        bestCount = counts[name];
      }
    }
    return best || String((parts && parts[0] && parts[0].name) || '').trim();
  }

  function getPrimarySkillGroupCount(item) {
    if (!item || !Array.isArray(item._cmGroupParts)) return 0;
    var state = getState();
    var selected = Array.isArray(state && state.slots && state.slots.perk) ? state.slots.perk : [];
    var picked = new Set(selected.map(partCodeOf));
    var count = 0;
    for (var i = 0; i < item._cmGroupParts.length; i++) {
      if (picked.has(partCodeOf(item._cmGroupParts[i]))) count++;
    }
    return count;
  }

  function getPrimarySkillDesiredCount(item) {
    var code = String(item && item.code || '').trim();
    var wanted = Number(cmSkillQtyState[code] || (item && item._cmDesiredCount) || 1);
    if (!Number.isFinite(wanted) || wanted < 1) wanted = 1;
    var max = Array.isArray(item && item._cmGroupParts) ? item._cmGroupParts.length : 1;
    return Math.min(max || 1, Math.max(1, Math.floor(wanted)));
  }

  function setPrimarySkillCount(item, nextCount) {
    if (!item || !Array.isArray(item._cmGroupParts)) return;
    var state = getState();
    if (!state.slots) state.slots = {};
    if (!Array.isArray(state.slots.perk)) state.slots.perk = [];

    var max = item._cmGroupParts.length;
    var count = Math.max(0, Math.min(max, Number(nextCount) || 0));
    if (count > 0) cmSkillQtyState[item.code] = count;

    var remove = new Set(item._cmGroupParts.map(partCodeOf));
    var keep = state.slots.perk.filter(function (p) { return !remove.has(partCodeOf(p)); });
    var ordered = sortClassModSkillParts(item._cmGroupParts).slice(0, count);
    state.slots.perk = keep.concat(ordered);

    if (cmBulkSuppressDepth <= 0) {
      try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
      try { if (typeof window.refreshBuilder === 'function') window.refreshBuilder(); } catch (_) {}
      syncChecklistClassModOutputs();
    }
  }

  function isChecklistItemSelected(item) {
    if (item && Array.isArray(item._cmGroupParts)) return getPrimarySkillGroupCount(item) > 0;
    return !!(item && isChecked(item.code));
  }

  function getPrimarySkillGroupSummary(item) {
    if (!item || !Array.isArray(item._cmGroupParts) || !item._cmGroupParts.length) return item && item.code ? item.code : '';
    return 'IDs: ' + item._cmGroupParts.map(function (p) { return partCodeOf(p); }).join(', ');
  }

  function getChecklistItemByCode(code) {
    var groups = [
      Array.isArray(window.__cmChecklistPrimaryItems) ? window.__cmChecklistPrimaryItems : [],
      Array.isArray(window.__cmChecklistSecondaryItems) ? window.__cmChecklistSecondaryItems : [],
      Array.isArray(window.__cmChecklistUniversalItems) ? window.__cmChecklistUniversalItems : [],
      Array.isArray(window.__cmChecklistFirmwareItems) ? window.__cmChecklistFirmwareItems : []
    ];
    for (var g = 0; g < groups.length; g++) {
      for (var i = 0; i < groups[g].length; i++) {
        var item = groups[g][i];
        if (item && String(item.code || '').trim() === String(code || '').trim()) return item;
      }
    }
    return null;
  }

  function partFamilyOf(p) {
    if (!p) return null;
    var f = p.familyId != null ? Number(p.familyId) : (p.family != null ? Number(p.family) : null);
    if (Number.isFinite(f)) return f;
    var raw = String((p.idRaw || p.idraw || p.code || '') || '').trim();
    var m = raw.match(/^(\d+)\s*:/) || raw.match(/\{(\d+):/);
    return m ? Number(m[1]) : null;
  }

  function partCodeOf(p) {
    if (!p) return '';
    var raw = String((p.idRaw || p.idraw || '') || '').trim();
    if (/^\d+\s*:\s*\d+$/.test(raw)) return '{' + raw.replace(/\s+/, ':') + '}';
    return String((p.code || '') || '').trim();
  }

  function getItemsForKey(key) {
    var k = String(key || '').trim().toLowerCase();
    var all = getClassModAllParts();
    if (!all.length) return [];

    var fam = FAMILY_BY_KEY[k];
    if (k === 'secondary') fam = FAMILY_BY_KEY.universal; /* shared perk family 234 */
    var seen = new Set();
    var out = [];

    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p) continue;
      var pf = partFamilyOf(p);
      if (fam != null && pf !== fam) continue;
      if (k === 'firmware') {
        var pt = String((p.partType || p.kind || '') || '').toLowerCase();
        var codeL = String((p.code || p.spawnCode || '') || '').toLowerCase();
        if (pt !== 'firmware' && codeL.indexOf('part_firmware') === -1) continue;
      }
      if (k === 'universal' || k === 'secondary') {
        var pt2 = String((p.partType || p.kind || '') || '').toLowerCase();
        var codeL2 = String((p.code || p.spawnCode || '') || '').toLowerCase();
        if (pt2 !== 'perk') continue;
        if (pt2 === 'firmware' || pt2 === 'rarity' || pt2 === 'name+skin' || pt2 === 'body') continue;
        if (codeL2.indexOf('statspecial') !== -1) continue;
        var isStat2 = /(^|[._])stat2([._]|$)/.test(codeL2);
        if (k === 'universal' && isStat2) continue;
        if (k === 'secondary' && !isStat2) continue;
      }
      var code = partCodeOf(p);
      if (!code || seen.has(code)) continue;
      if (isBrokenClassmodPlaceholderPart(p)) continue;
      seen.add(code);
      out.push({
        name: String((p.name || p.legendaryName || code) || '').trim() || code,
        code: code,
        partType: String((p.partType || p.kind || '') || '').trim(),
        category: (k === 'universal' || k === 'firmware' || k === 'secondary') ? 'Classmod Perk' : 'Classmod',
        _cmSource: k === 'firmware' ? 'firmware' : (k === 'secondary' ? 'secondary' : 'perk'),
        part: p
      });
    }
    return out;
  }

  function getClassModPrimaryItems(charName) {
    var cls = String(charName || getSelectedCharacter() || '').trim();
    var raw = [];
    try {
      if (typeof window.__ccEnsureClassmodSkillsData === 'function') {
        var p = window.__ccEnsureClassmodSkillsData();
        var skillsReady = typeof window.__ccClassmodSkillsLoaded === 'function'
          ? !!window.__ccClassmodSkillsLoaded()
          : !!(window.__LEGACY_CLASSMOD_PARTS_BY_KEY && window.__LEGACY_CLASSMOD_PARTS_BY_KEY.vex);
        if (p && typeof p.then === 'function' && !skillsReady) {
          p.then(function () {
            try {
              if (typeof window.__ccClassmodSkillsReady === 'function') window.__ccClassmodSkillsReady();
              else if (typeof window.__ccClassmodChecklistRender === 'function') window.__ccClassmodChecklistRender();
            } catch (_) {}
          });
        }
      }
    } catch (_) {}
    var getLegacy = typeof window.getLegacyClassModSkillParts === 'function'
      ? window.getLegacyClassModSkillParts
      : null;
    if (getLegacy) {
      try {
        raw = getLegacy(cls) || [];
        if (!raw.length) {
          /* Retry with manufacturer / display aliases (Vex↔Siren, etc.). */
          var man = getClassModManufacturerName(cls);
          if (man && man !== cls) raw = getLegacy(man) || [];
          var disp = getDisplayClassName(cls);
          if (!raw.length && disp && disp !== cls) raw = getLegacy(disp) || [];
        }
      } catch (_) { raw = []; }
    }
    /* Dataset Skill rows are Nexus stubs ("Passive Blue …") — never use them for Primary. */
    if (!raw.length) return [];
    raw = raw.filter(isGuidedPerkEntry);
    if (!raw.length) return [];

    var groups = {};
    for (var i = 0; i < raw.length; i++) {
      var part = raw[i];
      var key = normalizeSkillGroupName(part && part.name);
      if (!key) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push(part);
    }

    return Object.keys(groups).map(function (groupKey) {
      var parts = sortClassModSkillParts(groups[groupKey]);
      var uniqueParts = [];
      var seenCodes = new Set();
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var code = partCodeOf(part);
        if (!code || seenCodes.has(code)) continue;
        seenCodes.add(code);
        uniqueParts.push(part);
      }
      uniqueParts = uniqueParts.slice(0, 5);
      var displayName = getPreferredSkillGroupName(uniqueParts);
      var code = 'skill-group:' + (charToKey(cls) || 'vex') + ':' + groupKey.replace(/[^a-z0-9]+/g, '-');
      return {
        name: displayName,
        code: code,
        category: 'Classmod',
        partType: 'Skill',
        _primary: true,
        _cmSource: 'skill',
        _cmGroupParts: uniqueParts,
        _cmDesiredCount: getPrimarySkillDesiredCount({ code: code, _cmGroupParts: uniqueParts })
      };
    }).filter(function (item) {
      return item && Array.isArray(item._cmGroupParts) && item._cmGroupParts.length;
    }).sort(classmodTreeThenNameCompare);
  }

  function isChecked(code) {
    var state = getState();
    var slots = state.slots || {};
    var codeStr = String(code || '').trim();
    var arrs = [slots.perk, slots.universal, slots.secondary, slots.firmware];
    for (var a = 0; a < arrs.length; a++) {
      var arr = Array.isArray(arrs[a]) ? arrs[a] : [];
      for (var i = 0; i < arr.length; i++) {
        var p = arr[i];
        if (p && (partCodeOf(p) === codeStr || String((p.code || '') || '').trim() === codeStr)) return true;
      }
    }
    return false;
  }

  function slotKeyForItem(it) {
    if (!it) return 'perk';
    var src = String((it._cmSource || it.source || it.kind) || '').toLowerCase();
    if (src.indexOf('firmware') !== -1) return 'firmware';
    if (src === 'secondary') return 'secondary';
    if (src === 'universal') return 'universal';
    return 'universal';
  }

  function setChecked(code, checked, meta) {
    if (meta && Array.isArray(meta._cmGroupParts)) {
      setPrimarySkillCount(meta, checked ? getPrimarySkillDesiredCount(meta) : 0);
      return;
    }
    var state = getState();
    if (!state.slots) state.slots = {};
    var slots = state.slots;
    var codeStr = String(code || '').trim();
    var slotKey = (meta && meta._primary) ? 'perk' : slotKeyForItem(meta);

    function findIdx(arr) {
      if (!Array.isArray(arr)) return -1;
      for (var i = 0; i < arr.length; i++) {
        var p = arr[i];
        if (p && (partCodeOf(p) === codeStr || String((p.code || '') || '').trim() === codeStr)) return i;
      }
      return -1;
    }

    function ensureArr(k) {
      if (!Array.isArray(slots[k])) slots[k] = [];
      return slots[k];
    }

    if (checked) {
      var arr = ensureArr(slotKey);
      if (findIdx(arr) === -1) {
        var part = (meta && meta.part) || { code: codeStr, name: (meta && meta.name) || codeStr };
        arr.push(part);
      }
    } else {
      ['perk', 'universal', 'secondary', 'firmware'].forEach(function (k) {
        var arr = ensureArr(k);
        var idx = findIdx(arr);
        if (idx !== -1) arr.splice(idx, 1);
      });
    }
    if (cmBulkSuppressDepth <= 0) {
      try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
      try { if (typeof window.refreshBuilder === 'function') window.refreshBuilder(); } catch (_) {}
      syncChecklistClassModOutputs();
    }
  }

  function setCheckedBulk(items, checked) {
    if (!Array.isArray(items) || !items.length) return;
    cmBulkSuppressDepth++;
    try {
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (it && it.code) setChecked(it.code, checked, it);
      }
    } finally {
      cmBulkSuppressDepth--;
    }
    try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
    try { if (typeof window.refreshBuilder === 'function') window.refreshBuilder(); } catch (_) {}
    syncChecklistClassModOutputs();
  }

  function setActiveClassButton(cls) {
    var wrap = byId('classmodChecklistButtons');
    if (!wrap) return;
    var key = charToKey(cls);
    var display = KEY_TO_DISPLAY[key] || String(cls || '').trim();
    var btns = wrap.querySelectorAll('button[data-cm-class]');
    for (var b = 0; b < btns.length; b++) {
      var btn = btns[b];
      var active = String(btn.getAttribute('data-cm-class') || '').trim() === display;
      btn.classList.toggle('classmod-class-selected', active);
    }
  }

  function getListPage(listId) {
    var id = String(listId || '');
    var n = Number(cmListPageState[id] || 0);
    return Math.max(0, Number.isFinite(n) ? Math.floor(n) : 0);
  }

  function setListPage(listId, nextPage) {
    var id = String(listId || '');
    if (!id) return;
    var n = Number(nextPage);
    cmListPageState[id] = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }

  function ensureSkillQtySelectIdName(scopeEl) {
    var root = scopeEl || document;
    if (!root || !root.querySelectorAll) return;
    var nodes = root.querySelectorAll('select.cm-skill-qty-select');
    for (var i = 0; i < nodes.length; i++) {
      var sel = nodes[i];
      var tok = String(sel.getAttribute('data-cm-skill-qty') || '').toLowerCase();
      var slug = tok.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      var fallback = 'cm-skill-qty-auto-' + i;
      var id = sel.id || ('cm-skill-qty-' + (slug || fallback));
      sel.id = id;
      if (!sel.name) sel.name = id;
    }
  }

  function renderChecklist(listEl, items) {
    if (!listEl) return;
    var listId = String(listEl.id || '');
    if (!listId) return;

    var allItems = Array.isArray(items) ? items.slice() : [];
    listEl.__cmAllItems = allItems;
    listEl.innerHTML = '';
    if (!allItems.length) {
      setListPage(listId, 0);
      listEl.innerHTML = '<div style="opacity:0.8; padding:8px 0;">(No entries found in data)</div>';
      return;
    }

    var totalPages = Math.max(1, Math.ceil(allItems.length / CM_ROWS_PER_PAGE));
    var page = getListPage(listId);
    if (page >= totalPages) page = totalPages - 1;
    setListPage(listId, page);
    var start = page * CM_ROWS_PER_PAGE;
    var end = Math.min(start + CM_ROWS_PER_PAGE, allItems.length);
    var pageItems = allItems.slice(start, end);

    var treeHeaders = shouldEmitPerkTreeHeaders(listId, allItems);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < pageItems.length; i++) {
      var it = pageItems[i];
      var idxGlobal = start + i;
      if (treeHeaders) {
        if (idxGlobal === 0 || getPerkTreeLabel(it) !== getPerkTreeLabel(allItems[idxGlobal - 1])) {
          var hRow = document.createElement('div');
          hRow.className = 'cm-tree-header-row';
          hRow.setAttribute('data-cm-tree-header', '1');
          hRow.textContent = getPerkTreeLabel(it);
          frag.appendChild(hRow);
        }
      }
      var selected = isChecklistItemSelected(it);
      var isPrimaryGroup = !!(it && Array.isArray(it._cmGroupParts) && it._cmGroupParts.length);
      var row = document.createElement('div');
      row.className = 'cm-check-row' + (selected ? ' cm-checked' : '');
      row.setAttribute('data-code', it.code);
      row.setAttribute('data-name', it.name || '');
      row.setAttribute('data-category', it.category || 'Classmod');
      row.setAttribute('data-source', it._cmSource || it.source || it.kind || '');
      if (isPrimaryGroup) row.setAttribute('data-cm-primary-group', '1');
      if (typeof window.partTooltipText === 'function' && it.part) { var tip = window.partTooltipText(it.part); if (tip) row.title = tip; }

      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = 'cm-' + listId + '-' + (start + i);
      cb.name = cb.id;
      cb.checked = selected;

      var labelWrap = document.createElement('label');
      labelWrap.style.cssText = 'display:flex; align-items:flex-start; gap:10px; flex:1; cursor:pointer;';
      var labelInner = document.createElement('div');
      labelInner.style.cssText = 'display:flex; flex-direction:column; gap:2px;';
      var t = document.createElement('div');
      t.textContent = it.name || it.code;
      var c = document.createElement('div');
      c.className = 'cm-check-code';
      c.textContent = isPrimaryGroup ? getPrimarySkillGroupSummary(it) : it.code;
      labelInner.appendChild(t);
      labelInner.appendChild(c);
      var perkMeta = getClassmodPerkMetaForItem(it);
      if (perkMeta && perkMeta.description) {
        var metaWrap = document.createElement('div');
        metaWrap.className = 'cm-perk-meta';
        var desc = document.createElement('div');
        desc.className = 'cm-perk-desc';
        desc.textContent = String(perkMeta.description);
        metaWrap.appendChild(desc);
        labelInner.appendChild(metaWrap);
      }
      labelWrap.appendChild(cb);
      appendPerkThumbToRow(labelWrap, it);
      labelWrap.appendChild(labelInner);
      row.appendChild(labelWrap);

      if (isPrimaryGroup) {
        var qtyWrap = document.createElement('div');
        qtyWrap.style.cssText = 'display:flex; flex:0 0 auto; flex-direction:column; align-items:flex-end; gap:4px;';
        var qtyLabel = document.createElement('div');
        qtyLabel.className = 'cm-check-code';
        qtyLabel.textContent = 'Amount';
        var qtySel = document.createElement('select');
        qtySel.className = 'editor-select cm-skill-qty-select';
        qtySel.setAttribute('data-cm-skill-qty', it.code);
        var qtySlug = String(it.code || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        var qtyId = 'cm-skill-qty-' + (qtySlug || ('row-' + (start + i)));
        qtySel.id = qtyId;
        qtySel.name = qtyId;
        qtySel.setAttribute('data-native-select', 'yes');
        qtySel.setAttribute('aria-label', (it.name || 'Skill') + ' amount');
        qtySel.style.cssText = 'min-width:62px;';
        ['pointerdown', 'mousedown', 'click'].forEach(function (evtName) {
          qtySel.addEventListener(evtName, function (evt) { evt.stopPropagation(); });
        });
        var maxQty = Math.min(5, Array.isArray(it._cmGroupParts) ? it._cmGroupParts.length : 1);
        for (var qty = 1; qty <= maxQty; qty++) {
          var opt = document.createElement('option');
          opt.value = String(qty);
          opt.textContent = String(qty);
          qtySel.appendChild(opt);
        }
        qtySel.value = String(getPrimarySkillDesiredCount(it));
        qtyWrap.appendChild(qtyLabel);
        qtyWrap.appendChild(qtySel);
        row.appendChild(qtyWrap);
      }

      frag.appendChild(row);
    }
    listEl.appendChild(frag);
    ensureSkillQtySelectIdName(listEl);

    if (totalPages > 1) {
      var nav = document.createElement('div');
      nav.className = 'cm-page-nav';
      var prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'btn btn-Firmware cm-page-btn';
      prev.textContent = 'Prev';
      prev.disabled = page <= 0;
      prev.setAttribute('data-cm-page', 'prev');
      prev.setAttribute('data-cm-target', listId);
      var meta = document.createElement('div');
      meta.className = 'cm-page-meta';
      meta.textContent = 'Rows ' + (start + 1) + '-' + end + ' of ' + allItems.length + ' (Page ' + (page + 1) + '/' + totalPages + ')';
      var next = document.createElement('button');
      next.type = 'button';
      next.className = 'btn btn-Firmware cm-page-btn';
      next.textContent = 'Next';
      next.disabled = page >= totalPages - 1;
      next.setAttribute('data-cm-page', 'next');
      next.setAttribute('data-cm-target', listId);
      nav.appendChild(prev);
      nav.appendChild(meta);
      nav.appendChild(next);
      listEl.appendChild(nav);
    }
  }

  function getChecklistItemsForListId(listId) {
    var id = String(listId || '');
    if (id === 'cmPrimaryList') return window.__cmChecklistPrimaryItems;
    if (id === 'cmSecondaryList') return window.__cmChecklistSecondaryItems;
    if (id === 'cmUniversalList') return window.__cmChecklistUniversalItems;
    if (id === 'cmFirmwareList') return window.__cmChecklistFirmwareItems;
    return null;
  }

  /** Re-render a single paged checklist (keeps other class mod lists untouched). */
  function renderChecklistByListId(listId) {
    var el = byId(listId);
    var items = getChecklistItemsForListId(listId);
    if (!el || !Array.isArray(items)) {
      renderUI();
      return;
    }
    renderChecklist(el, items);
  }

  function refreshChecklistSerialOutputs() {
    try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
    try { if (typeof window.refreshBuilder === 'function') window.refreshBuilder(); } catch (_) {}
    syncChecklistClassModOutputs();
  }

  function isClassmodSelected() {
    var stxItem = byId('stx_itemType');
    var guidedItem = byId('ccGuidedItemType');
    var itemType = (stxItem && stxItem.value) || (guidedItem && guidedItem.value) || '';
    return /class\s*mod|classmod/i.test(String(itemType || ''));
  }

  var CHAR_ALIAS = { vex: 'vex', siren: 'vex', 'dark siren': 'vex', darksiren: 'vex', amon: 'amon', paladin: 'amon', rafa: 'rafa', 'exo soldier': 'rafa', 'exo-soldier': 'rafa', exosoldier: 'rafa', harlowe: 'harlowe', gravitar: 'harlowe', c4sh: 'c4sh', robodealer: 'c4sh', universal: 'universal' };
  var KEY_TO_DISPLAY = { vex: 'Vex', amon: 'Amon', rafa: 'Rafa', harlowe: 'Harlowe', c4sh: 'C4sh', universal: 'Universal' };
  var DISPLAY_TO_MAN = { Vex: 'Siren', Amon: 'Paladin', Rafa: 'Exo Soldier', Harlowe: 'Gravitar', C4sh: 'Robodealer', Universal: 'Universal' };
  var MAN_TO_DISPLAY = { 'Siren': 'Vex', 'Dark Siren': 'Vex', 'Paladin': 'Amon', 'Exo Soldier': 'Rafa', 'Gravitar': 'Harlowe', 'Robodealer': 'C4sh', 'C4sh': 'C4sh', 'Universal': 'Universal' };

  /** Per-class rarity IDs (family:rarityId). Non-legendary tiers only. */
  var RARITY_BY_CLASS = {
    Vex: { common: 217, uncommon: 218, rare: 219, epic: 220 },
    Amon: { common: 70, uncommon: 69, rare: 68, epic: 67 },
    Rafa: { common: 66, uncommon: 67, rare: 68, epic: 69 },
    Harlowe: { common: 224, uncommon: 223, rare: 222, epic: 221 },
    C4sh: { common: 52, uncommon: 53, rare: 54, epic: 55, legendary: 56 }
  };
  var RARITY_TIER_ORDER = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };

  /**
   * Legendary class-mod **rarity row** itemId in the vault-hunter family, keyed by the
   * leg-effect / name code (10–15). Pairs the correct comp_05 row with the chosen name
   * so the deserialized tail matches the game’s expected `{family:rarityId}` then `{family:nameId}` order.
   */
  var LEGENDARY_RARITY_ITEM_BY_NAME_CODE = {
    Vex: { 10: 56, 11: 55, 12: 54, 13: 53, 14: 52, 15: 51 },
    Amon: { 10: 25, 11: 24, 12: 23, 13: 22, 14: 21, 15: 20 },
    Rafa: { 10: 26, 11: 25, 12: 24, 13: 23, 14: 22, 15: 21 },
    Harlowe: { 10: 26, 11: 25, 12: 24, 13: 23, 14: 22, 15: 21 }
  };

  /** DLC / post-base legendary name body → rarity comp itemId (same vault-hunter family). */
  var LEGENDARY_DLC_NAME_TO_RARITY = {
    Vex: { 538: 539 /* cowbell */, 544: 545 /* raid2 */, 546: 547 /* tuba */ },
    Amon: { 538: 539, 544: 545, 546: 547 },
    Rafa: { 540: 541 /* raid1 */, 542: 543 /* cowbell */, 546: 547 /* raid2 */, 548: 549 /* tuba */ },
    Harlowe: { 540: 541 /* raid1 */, 542: 543 /* cowbell */, 546: 547 /* raid2 */, 548: 549 /* tuba */ }
  };

  var MAN_TO_CLASSMOD_SLUG = {
    Siren: 'classmod_dark_siren',
    Paladin: 'classmod_paladin',
    'Exo Soldier': 'classmod_exo_soldier',
    Gravitar: 'classmod_gravitar',
    Robodealer: 'classmod_robodealer',
    C4sh: 'classmod_robodealer'
  };

  /** Cowbell / Mandolin / raid DLC display names when extract still ships the internal slug. */
  var CLASSMOD_DLC_DISPLAY_BY_SPAWN = {
    'classmod_dark_siren.leg_body_cowbell': 'Configuration',
    'classmod_dark_siren.comp_05_legendary_cowbell': 'Configuration',
    'classmod_dark_siren.leg_body_raid2': 'Grim Sister',
    'classmod_dark_siren.comp_05_legendary_raid2': 'Grim Sister',
    'classmod_dark_siren.leg_body_tuba': 'Living Weapon',
    'classmod_dark_siren.comp_05_legendary_tuba': 'Living Weapon',
    'classmod_exo_soldier.leg_body_cowbell': 'Reaparición',
    'classmod_exo_soldier.comp_05_legendary_cowbell': 'Reaparición',
    'classmod_exo_soldier.leg_body_raid2': 'Bombastic',
    'classmod_exo_soldier.comp_05_legendary_raid2': 'Bombastic',
    'classmod_exo_soldier.leg_body_tuba': 'Power-Puncher',
    'classmod_exo_soldier.comp_05_legendary_tuba': 'Power-Puncher',
    'classmod_gravitar.leg_body_cowbell': 'Phlebotomist',
    'classmod_gravitar.comp_05_legendary_cowbell': 'Phlebotomist',
    'classmod_gravitar.leg_body_raid2': 'Plasmaphile',
    'classmod_gravitar.comp_05_legendary_raid2': 'Plasmaphile',
    'classmod_gravitar.leg_body_tuba': 'Chirurgeon',
    'classmod_gravitar.comp_05_legendary_tuba': 'Chirurgeon',
    'classmod_paladin.leg_body_cowbell': 'Tempest',
    'classmod_paladin.comp_05_legendary_cowbell': 'Tempest',
    'classmod_paladin.leg_body_raid2': 'Artificer',
    'classmod_paladin.comp_05_legendary_raid2': 'Artificer',
    'classmod_paladin.leg_body_tuba': 'Damned',
    'classmod_paladin.comp_05_legendary_tuba': 'Damned',
    'classmod_robodealer.leg_body_raid2': 'Prestidigitator',
    'classmod_robodealer.comp_05_legendary_raid2': 'Prestidigitator',
    'classmod_robodealer.leg_body_tuba': 'Trainer',
    'classmod_robodealer.comp_05_legendary_tuba': 'Trainer'
  };

  /** Comp_Rarity display names for C4sh (Robodealer) when STX/name parts omit them. Source: community reference list (item id within family 404). */
  var C4SH_COMP_RARITY_NAMES = {
    217: 'Whale',
    218: 'Cooler',
    219: 'Hotshot',
    220: 'Ludopath',
    221: 'Rounder',
    56: 'Windrider',
    539: 'Hooligan',
    540: 'Gamer'
  };

  /** Tier from STX_RARITIES row. Never use row.legendaryName here — patches often fill it on every row and force "legendary". */
  function getClassModRarityTierFromRow(row) {
    var itStr = String((row && row.itemTypeString) || '').trim().toLowerCase();
    var m = itStr.match(/\.comp_\d+_(common|uncommon|rare|epic|legendary)(?:_|$)/);
    if (m && m[1]) return m[1];
    if (itStr.indexOf('uncommon') !== -1) return 'uncommon';
    if (itStr.indexOf('_common') !== -1 || /\bcomp_[0-9]+_common\b/.test(itStr)) return 'common';
    if (itStr.indexOf('rare') !== -1) return 'rare';
    if (itStr.indexOf('epic') !== -1) return 'epic';
    if (itStr.indexOf('legendary') !== -1) return 'legendary';
    return '';
  }

  function inferClassModTierFromItemId(displayClass, itemId) {
    var map = RARITY_BY_CLASS[displayClass];
    if (!map || !Number.isFinite(Number(itemId))) return '';
    var idNum = Number(itemId);
    for (var tier in map) {
      if (!Object.prototype.hasOwnProperty.call(map, tier)) continue;
      if (Number(map[tier]) === idNum) return String(tier).toLowerCase();
    }
    return '';
  }

  function normPartSpawnCode(part) {
    return String((part && part.code) || '')
      .replace(/^"+|"+$/g, '')
      .replace(/^\\"|\\"$/g, '')
      .trim()
      .toLowerCase();
  }

  function displayNameForClassModPart(part) {
    var code = normPartSpawnCode(part);
    if (CLASSMOD_DLC_DISPLAY_BY_SPAWN[code]) return CLASSMOD_DLC_DISPLAY_BY_SPAWN[code];
    if (typeof window.stxResolveClassModPartDisplayName === 'function') {
      try {
        var resolved = String(window.stxResolveClassModPartDisplayName(part) || '').trim();
        if (resolved) return resolved;
      } catch (_) {}
    }
    var nm = String((part && (part.name || part.legendaryName)) || '').trim();
    if (/^cowbell$/i.test(nm) && /classmod_gravitar/.test(code)) return 'Phlebotomist';
    if (/^cowbell$/i.test(nm) && /classmod_dark_siren/.test(code)) return 'Configuration';
    if (/^cowbell$/i.test(nm) && /classmod_exo_soldier/.test(code)) return 'Reaparición';
    if (/^cowbell$/i.test(nm) && /classmod_paladin/.test(code)) return 'Tempest';
    if (/^(raid\s*\d+|raid\d+|harmonica)$/i.test(nm.replace(/[\s_-]+/g, ' ').trim())) return '';
    return nm;
  }
  try { window.stxClassModDisplayNameForPart = displayNameForClassModPart; } catch (_) {}

  function getClassModNameParts(charName) {
    var getNames = typeof window.getLegacyClassModNameParts === 'function' ? window.getLegacyClassModNameParts : null;
    var filterParts = typeof window.filterPartsForGuided === 'function' ? window.filterPartsForGuided : null;
    var man = getClassModManufacturerName(charName);
    var parts = [];
    if (getNames) {
      try { parts = getNames(man) || []; } catch (_) { parts = []; }
    }
    if (!parts.length && filterParts) {
      parts = filterParts({ category: 'Class Mod', manufacturer: man, partType: 'Name+Skin' }) || [];
    }

    /* Dataset leg_body_* rows (raid/cowbell/tuba/…) are legendary names but often partType Body. */
    var slug = MAN_TO_CLASSMOD_SLUG[man] || '';
    var all = (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS)) ? window.STX_DATASET.ALL_PARTS : [];
    var have = new Set();
    for (var i = 0; i < parts.length; i++) {
      var id0 = getNumericItemId(parts[i]);
      if (Number.isFinite(id0)) have.add(id0);
      var c0 = normPartSpawnCode(parts[i]);
      if (c0) have.add(c0);
    }
    if (slug && all.length) {
      for (var j = 0; j < all.length; j++) {
        var p = all[j];
        if (isBrokenClassmodPlaceholderPart(p)) continue;
        var code = normPartSpawnCode(p);
        if (!code || code.indexOf(slug + '.leg_body_') !== 0) continue;
        var id = getNumericItemId(p);
        if ((Number.isFinite(id) && have.has(id)) || have.has(code)) continue;
        var human = displayNameForClassModPart(p);
        if (!human) continue; /* unnamed raid3/harmonica stubs — omit until real names exist */
        var enriched = Object.assign({}, p, {
          partType: 'Name+Skin',
          name: human
        });
        parts.push(enriched);
        if (Number.isFinite(id)) have.add(id);
        have.add(code);
      }
    }

    for (var k = 0; k < parts.length; k++) {
      var dn = displayNameForClassModPart(parts[k]);
      if (dn && dn !== String((parts[k] && parts[k].name) || '').trim()) {
        parts[k] = Object.assign({}, parts[k], { name: dn });
      }
    }
    return Array.isArray(parts)
      ? parts.filter(function (p) { return !isBrokenClassmodPlaceholderPart(p); })
      : [];
  }

  function getNumericItemId(part) {
    if (!part) return null;
    var id = Number((part && part.id != null) ? part.id : NaN);
    if (Number.isFinite(id)) return id;
    var raw = String((part && (part.idRaw || part.idraw || part.code)) || '').trim();
    var match = raw.match(/:\s*(\d+)\s*\}?$/);
    return match ? Number(match[1]) : null;
  }

  function getClassModNameLookup(charName) {
    var parts = getClassModNameParts(charName);
    var lookup = Object.create(null);
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      var itemId = getNumericItemId(part);
      if (!Number.isFinite(itemId)) continue;
      if (lookup[itemId]) continue;
      lookup[itemId] = {
        name: String((part && part.name) || '').trim(),
        legendary: isLegendaryNamePart(part)
      };
    }
    return lookup;
  }

  function getClassModRarityEntries(charName) {
    var rows = Array.isArray(window.STX_RARITIES) ? window.STX_RARITIES : [];
    var man = getClassModManufacturerName(charName);
    var manNorm = String(man || '').trim().toLowerCase();
    var slug = String(MAN_TO_CLASSMOD_SLUG[man] || '').toLowerCase();
    var fam = resolveClassModFamilyIdForCharacter(charName);
    var nameLookup = getClassModNameLookup(charName);
    var out = rows.filter(function (row) {
      if (!row) return false;
      var itemType = String((row && row.itemType) || '').trim();
      var itemTypeString = String((row && row.itemTypeString) || '').trim().toLowerCase();
      if (itemType !== 'Class Mod' && !/classmod|class\s*mod/i.test(itemTypeString)) return false;
      var rowMan = String((row && row.manufacturer) || '').trim().toLowerCase();
      if (rowMan === manNorm) return true;
      if (slug && itemTypeString.indexOf(slug) !== -1) return true;
      return false;
    }).map(function (row) {
      var itemId = Number(row && row.itemId);
      var rowFam = Number((row && row.familyId) != null ? row.familyId : fam);
      if (!Number.isFinite(itemId) || !Number.isFinite(rowFam)) return null;
      var disp = getDisplayClassName(charName);
      var tier = getClassModRarityTierFromRow(row);
      if (!tier) tier = inferClassModTierFromItemId(disp, itemId);
      var nameEntry = nameLookup[itemId] || null;
      var legendaryName = '';
      if (tier === 'legendary') {
        legendaryName = String((row && row.legendaryName) || '').trim();
        var its = String((row && row.itemTypeString) || '').trim().toLowerCase();
        if (CLASSMOD_DLC_DISPLAY_BY_SPAWN[its]) legendaryName = CLASSMOD_DLC_DISPLAY_BY_SPAWN[its];
        else if (/^cowbell$/i.test(legendaryName) && /gravitar/.test(its)) legendaryName = 'Phlebotomist';
        if (!legendaryName && nameEntry && nameEntry.legendary) {
          legendaryName = String(nameEntry.name || '').trim();
        }
        if (!legendaryName && disp === 'C4sh' && C4SH_COMP_RARITY_NAMES[itemId]) {
          legendaryName = C4SH_COMP_RARITY_NAMES[itemId];
        }
      }
      return {
        code: '{' + rowFam + ':' + itemId + '}',
        familyId: rowFam,
        itemId: itemId,
        tier: tier,
        tierLabel: tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Rarity',
        legendaryName: legendaryName,
        row: row
      };
    }).filter(Boolean);

    if (!out.length) {
      var displayClass = getDisplayClassName(charName);
      var fallbackMap = RARITY_BY_CLASS[displayClass] || {};
      var fallbackFam = resolveClassModFamilyIdForCharacter(charName);
      out = Object.keys(fallbackMap).map(function (tier) {
        var itemId = Number(fallbackMap[tier]);
        if (!Number.isFinite(itemId) || !Number.isFinite(Number(fallbackFam))) return null;
        var legName = (nameLookup[itemId] && nameLookup[itemId].legendary) ? String(nameLookup[itemId].name || '').trim() : '';
        if (!legName && String(tier || '').toLowerCase() === 'legendary' && displayClass === 'C4sh' && C4SH_COMP_RARITY_NAMES[itemId]) {
          legName = C4SH_COMP_RARITY_NAMES[itemId];
        }
        return {
          code: '{' + Number(fallbackFam) + ':' + itemId + '}',
          familyId: Number(fallbackFam),
          itemId: itemId,
          tier: String(tier || '').trim().toLowerCase(),
          tierLabel: String(tier || 'Rarity').charAt(0).toUpperCase() + String(tier || 'Rarity').slice(1),
          legendaryName: legName,
          row: null
        };
      }).filter(Boolean);
    }

    return out.sort(function (a, b) {
      var ta = Number(RARITY_TIER_ORDER[a.tier] || 99);
      var tb = Number(RARITY_TIER_ORDER[b.tier] || 99);
      if (ta !== tb) return ta - tb;
      if (a.itemId !== b.itemId) return a.itemId - b.itemId;
      return String(a.legendaryName || '').localeCompare(String(b.legendaryName || ''), undefined, { sensitivity: 'base' });
    });
  }

  function parseFamilyItemToken(raw) {
    var s = String(raw || '').trim();
    var m = s.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/) || s.match(/^(\d+)\s*:\s*(\d+)$/);
    if (!m) return null;
    return { family: Number(m[1]), itemId: Number(m[2]) };
  }

  function getChecklistClassModLevel() {
    var guidedLevel = byId('ccGuidedLevel');
    var state = getState();
    var level = Number((guidedLevel && guidedLevel.value) || state.level || 60);
    if (!Number.isFinite(level) || level < 1) level = 60;
    if (level > 60) level = 60;
    return level;
  }

  function getChecklistClassModSeed(base) {
    var state = getState();
    var seedEl = byId('seedInput');
    var manual = String((seedEl && seedEl.value) || '').trim();
    if (manual && /^-?\d+$/.test(manual)) {
      state.__seedEnabled = true;
      state.seedAuto = null;
      state.seedKey = null;
      if (seedEl) seedEl.placeholder = 'manual';
      return Number(manual);
    }
    if (!state.__seedEnabled) {
      if (seedEl && !seedEl.value) seedEl.placeholder = 'random (enabled after selecting base / adding a part)';
      return 0;
    }
    var key = base ? [base.familyId, base.itemId, getChecklistClassModLevel()].join(':') : 'none';
    if (typeof state.seedAuto !== 'number' || state.seedKey !== key) {
      state.seedAuto = Math.floor(Math.random() * 9999) + 1;
      state.seedKey = key;
    }
    if (seedEl) seedEl.placeholder = 'random (' + state.seedAuto + ')';
    return Number(state.seedAuto);
  }

  function partTokenForChecklist(part) {
    if (!part) return '';
    var code = partCodeOf(part);
    if (code) return code;
    if (typeof window.tokenForPart === 'function') {
      try {
        var tok = window.tokenForPart(part);
        if (tok) return String(tok).trim();
      } catch (_) {}
    }
    return '';
  }

  function buildChecklistClassModCode() {
    var state = getState();
    var main = state.mainPart || null;
    if (!main) return '';
    var mainType = String((main && main.partType) || '').trim().toLowerCase();
    var mainPair = parseFamilyItemToken((main && (main.code || main.idRaw || main.idraw)) || '');
    var family = mainPair ? Number(mainPair.family) : Number(resolveClassModFamilyIdForCharacter(getSelectedCharacter()));
    if (!Number.isFinite(family)) return '';

    var tokens = [];
    if (mainType === 'rarity') {
      if (mainPair && Number.isFinite(mainPair.family) && Number.isFinite(mainPair.itemId)) {
        tokens.push('{' + Number(mainPair.family) + ':' + Number(mainPair.itemId) + '}');
      }
    } else {
      var mainToken = partTokenForChecklist(main);
      if (mainToken) tokens.push(mainToken);
    }

    if (state.slots && state.slots.namePart) {
      var nameToken = partTokenForChecklist(state.slots.namePart);
      if (nameToken) {
        tokens.push(nameToken);
        /* Harlowe + legendary: append `{27}` after the leg-effect / name token (game format). */
        var raritySelEl = byId('cmRaritySelect');
        var isLegCm = raritySelEl && String(raritySelEl.value || '').toLowerCase() === 'legendary';
        var dispCm = getDisplayClassName(getSelectedCharacter());
        if (isLegCm && (charToKey(getSelectedCharacter()) === 'harlowe' || dispCm === 'Harlowe')) {
          var has27 = tokens.some(function (t) { return String(t || '').trim() === '{27}'; });
          if (!has27) tokens.push('{27}');
        }
      }
    }
    if (state.slots && state.slots.rarityNamePart) {
      var rarityNameToken = partTokenForChecklist(state.slots.rarityNamePart);
      if (rarityNameToken) tokens.push(rarityNameToken);
    }

    ['universal', 'secondary', 'perk', 'firmware'].forEach(function (slotKey) {
      var arr = Array.isArray(state && state.slots && state.slots[slotKey]) ? state.slots[slotKey] : [];
      for (var i = 0; i < arr.length; i++) {
        var tok = partTokenForChecklist(arr[i]);
        if (tok) tokens.push(tok);
      }
    });

    var base = { familyId: family, itemId: mainPair ? Number(mainPair.itemId) : null };
    var seed = getChecklistClassModSeed(base);
    var level = getChecklistClassModLevel();
    var lockFirmware = !!(
      (state && state.lockFirmware) ||
      (byId('lockFirmware') && byId('lockFirmware').checked) ||
      (byId('firmwareLock') && byId('firmwareLock').checked) ||
      (byId('ccGuidedFirmwareLockFlag') && byId('ccGuidedFirmwareLockFlag').checked)
    );
    var buybackFlag = !!(
      (state && state.buybackFlag) ||
      (byId('buybackFlag') && byId('buybackFlag').checked) ||
      (byId('ccGuidedBuybackFlag') && byId('ccGuidedBuybackFlag').checked)
    );

    /* Prefix carries vault-hunter family — always truncate same-family refs to bare `{id}` after `||`. */
    var normalizedTokens = (typeof window.normalizeIdTokensForBaseFamily === 'function')
      ? window.normalizeIdTokensForBaseFamily(tokens, family, { compactSameFamily: true })
      : tokens.slice();
    if (typeof window.compressConsecutiveFamilyRefs === 'function') {
      try { normalizedTokens = window.compressConsecutiveFamilyRefs(normalizedTokens); } catch (_) {}
    }

    var out = family + ', 0, 1, ' + level + '|';
    if (typeof window.stxBuildSerialHeaderSuffix === 'function') {
      out += window.stxBuildSerialHeaderSuffix(seed, lockFirmware, buybackFlag);
    } else {
      if (lockFirmware) out += ' 9, 1|';
      if (buybackFlag) out += ' 10, 1|';
      if (Number(seed) !== 0) out += ' 2, ' + seed + '||';
      else out += '||';
    }
    out += normalizedTokens.length ? (' ' + normalizedTokens.join(' ') + '|') : '|';
    return String(out || '').replace(/\s+\|$/, '|');
  }

  function syncChecklistClassModOutputs() {
    if (!isClassmodSelected()) return;
    var code = buildChecklistClassModCode();
    if (!code) return;
    var outCode = byId('outCode');
    var guidedOut = byId('guidedOutputDeserialized');
    if (guidedOut) guidedOut.value = code;
    if (outCode) outCode.value = code;
    try {
      if (typeof window.writeSharedItemCode === 'function') {
        window.writeSharedItemCode({ deser: code, source: guidedOut ? 'guided' : 'simple', skipB85: false, force: true });
      } else {
        window.__CC_LAST_CODE_TARGET = guidedOut ? 'guided' : 'simple';
      }
    } catch (_) {
      try { window.__CC_LAST_CODE_TARGET = guidedOut ? 'guided' : 'simple'; } catch (_t) {}
    }
    try { if (typeof window.refreshGuidedOutputPreview === 'function') window.refreshGuidedOutputPreview(); } catch (_) {}
    try { if (typeof window.refreshBuildStatsCore === 'function') window.refreshBuildStatsCore(); } catch (_) {}
    try { if (typeof window.refreshImportedInspector === 'function') window.refreshImportedInspector(); } catch (_) {}
    try { if (typeof window.syncFloatingOutput === 'function') window.syncFloatingOutput(true); } catch (_) {}
  }

  function getSelectedCharacter() {
    var guidedMan = byId('ccGuidedManufacturer');
    var stxMan = byId('stx_manufacturer');
    var guidedValue = String((guidedMan && guidedMan.value) || '').trim();
    var stxValue = String((stxMan && stxMan.value) || '').trim();
    if (guidedValue) return guidedValue;
    if (stxValue) return stxValue;
    var state = getState();
    if (state.classmodClass) return String(state.classmodClass).trim();
    if (state.manufacturer) return String(state.manufacturer).trim();
    return '';
  }

  function getDisplayClassForRarity() {
    return getDisplayClassName(getSelectedCharacter());
  }

  function charToKey(charName) {
    var lc = String(charName || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
    return CHAR_ALIAS[lc] || CHAR_ALIAS[lc.replace(/\s+/g, '-')] || lc.replace(/\s+/g, '');
  }

  function resolveClassModFamilyIdForCharacter(charName) {
    var getFamily = typeof window.classModFamilyIdForCharacter === 'function'
      ? window.classModFamilyIdForCharacter
      : null;
    if (getFamily) {
      var resolved = Number(getFamily(charName));
      if (Number.isFinite(resolved)) return resolved;
    }
    var fallback = Number(FAMILY_BY_KEY[charToKey(charName)]);
    return Number.isFinite(fallback) ? fallback : null;
  }

  function alphaByName(a, b) {
    return String((a && a.name) || '').localeCompare(String((b && b.name) || ''), undefined, { sensitivity: 'base' });
  }

  function classmodTreeThenNameCompare(a, b) {
    var ta = getPerkTreeLabel(a);
    var tb = getPerkTreeLabel(b);
    if (ta !== tb) return ta.localeCompare(tb, undefined, { sensitivity: 'base' });
    return alphaByName(a, b);
  }

  function sortClassmodChecklistByTreeThenName(items) {
    return (items || []).slice().sort(classmodTreeThenNameCompare);
  }

  function classmodListUsesTreeHeaders(listId) {
    return listId === 'cmPrimaryList' || listId === 'cmSecondaryList' || listId === 'cmUniversalList';
  }

  function shouldEmitPerkTreeHeaders(listId, allItems) {
    if (!classmodListUsesTreeHeaders(listId) || !allItems || !allItems.length) return false;
    var seen = {};
    for (var i = 0; i < allItems.length; i++) {
      seen[getPerkTreeLabel(allItems[i])] = true;
    }
    var keys = Object.keys(seen);
    if (keys.length === 1 && keys[0] === 'Other') return false;
    return true;
  }

  function isBrokenClassmodPlaceholderPart(p) {
    if (!p) return false;
    if (typeof window.stxIsBrokenClassmodDatasetPlaceholderPart === 'function') {
      try { return !!window.stxIsBrokenClassmodDatasetPlaceholderPart(p); } catch (_) {}
    }
    var nm = String((p.name || p.legendaryName) || '').trim();
    var code = String(partCodeOf(p) || '').toLowerCase();
    var ef = String((p.effects || p.effect || '') || '');
    var blob = (nm + ' ' + code + ' ' + ef).toLowerCase();
    if (/\bbroken\s*(red|green|blue|white)\b/i.test(blob)) return true;
    if (/\bbroken[\s_]*\?{2,}/i.test(blob) || /\bbroken\?{2,}/i.test(blob.replace(/\s+/g, ''))) return true;
    var nn = nm.toLowerCase().replace(/\s+/g, '');
    if (/broken(red|green|blue|white)/.test(nn)) return true;
    if (/^broken\?+$/.test(nn) || /^broken\?{3,}$/i.test(nn.replace(/\s+/g, ''))) return true;
    if (/^passive\s+(blue|green|red|white|purple)\b/i.test(nm)) return true;
    if (/^action\s+skill\b/i.test(nm) && /\btier\s*\d+/i.test(nm)) return true;
    if (/^capstone\b/i.test(nm) && /\btier\s*\d+/i.test(nm)) return true;
    if (/(^|[._])passive_(blue|green|red|white|purple)(_|\d)/i.test(code)) return true;
    if (/\.(?:leg_body_|comp_05_legendary_)(raid3|raid4|harmonica)(?:["']|$)/i.test(code)) return true;
    if (/^(raid\s*\d+|raid\d+|harmonica)$/i.test(nm.replace(/[\s_-]+/g, ' ').trim())) return true;
    return false;
  }

  function isBrokenClassmodPlaceholderPerk(it) {
    if (!it) return false;
    if (it.part && isBrokenClassmodPlaceholderPart(it.part)) return true;
    return isBrokenClassmodPlaceholderPart({
      name: (it && it.name) || '',
      legendaryName: (it && it.legendaryName) || '',
      code: (it && it.code) || '',
      effects: (it && (it.effects || (it.part && (it.part.effects || it.part.effect)))) || ''
    });
  }

  function isGuidedPerkEntry(it) {
    if (isBrokenClassmodPlaceholderPerk(it)) return false;
    var nm = String((it && it.name) || '').toLowerCase();
    var kd = String((it && it.kind) || '').toLowerCase();
    var pt = String((it && it.partType) || (it && it.part && it.part.partType) || '').toLowerCase();
    if (!nm) return false;
    if (kd.indexOf('name+skin') !== -1 || pt.indexOf('name+skin') !== -1) return false;
    if (pt === 'rarity' || pt === 'item card') return false;
    if (pt === 'body') return false;
    /* Exact rarity / body labels only — never substring-match real perk names. */
    if (/^(common|uncommon|rare|epic|legendary|pearlescent)(\b|$)/i.test(nm)) return false;
    if (/^(class\s*)?body\b/i.test(nm)) return false;
    return true;
  }

  function isLegendaryNamePart(p) {
    var kind = String((p && (p.kind || p.partType)) || '').trim().toLowerCase();
    if (kind.indexOf('leg effect') !== -1) return true;
    var code = normPartSpawnCode(p);
    if (/\.leg_body_/i.test(code) || /^leg_body_/i.test(code)) return true;
    var id = p && (p.id != null ? Number(p.id) : null);
    if (Number.isFinite(id)) {
      if (id >= 10 && id <= 15) return true;
      /* DLC / raid legendary name bodies use high serial ids (5xx). */
      if (id >= 500) return true;
    }
    var raw = String((p && (p.idRaw || p.idraw)) || '').trim();
    var m = raw.match(/:\s*(\d+)$/);
    if (m) {
      var n = Number(m[1]);
      if (n >= 10 && n <= 15) return true;
      if (n >= 500) return true;
    }
    return false;
  }

  function buildNameOptions() {
    var sel = byId('cmNameSelect');
    var raritySel = byId('cmRaritySelect');
    if (!raritySel) return;
    if (!sel) {
      // Name select is optionally hidden for simpler classmod flow.
      return;
    }
    var cls = getDisplayClassForRarity();
    var isLeg = String(raritySel.value || '').toLowerCase() === 'legendary';
    var isUniversal = charToKey(cls) === 'universal' || cls === 'Universal';
    sel.innerHTML = '';
    if (isUniversal) {
      sel.innerHTML = '<option value="">-- Universal (no name) --</option>';
      return;
    }
    var getNames = typeof window.getLegacyClassModNameParts === 'function' ? window.getLegacyClassModNameParts : null;
    var filterParts = typeof window.filterPartsForGuided === 'function' ? window.filterPartsForGuided : null;
    var man = DISPLAY_TO_MAN[cls] || cls;
    var parts = getClassModNameParts(cls);
    if (!parts.length && getNames) parts = getNames(man);
    if (!parts.length && filterParts) {
      parts = filterParts({ category: 'Class Mod', manufacturer: man, partType: 'Name+Skin' }) || [];
    }
    var filtered = parts.filter(function (p) {
      if (isBrokenClassmodPlaceholderPart(p)) return false;
      var human = displayNameForClassModPart(p);
      if (!human && isLegendaryNamePart(p)) return false;
      var leg = isLegendaryNamePart(p);
      return leg === isLeg;
    });
    filtered.sort(function (a, b) {
      var na = displayNameForClassModPart(a) || String((a && a.name) || '').trim();
      var nb = displayNameForClassModPart(b) || String((b && b.name) || '').trim();
      return na.localeCompare(nb, undefined, { sensitivity: 'base' });
    });
    var preserveTok = String(sel.value || '').trim();
    if (!preserveTok) {
      var stKeep = getState();
      if (stKeep && stKeep.slots && stKeep.slots.namePart) preserveTok = String(partCodeOf(stKeep.slots.namePart) || '').trim();
    }
    sel.innerHTML = '<option value="">-- Select name --</option>';
    filtered.forEach(function (p) {
      var opt = document.createElement('option');
      var tok = partCodeOf(p);
      opt.value = tok;
      var human = displayNameForClassModPart(p) || String((p && p.name) || '').trim();
      var idTok = '';
      try {
        var idRaw = String((p && (p.idRaw || p.idraw)) || '').trim();
        if (/^\d+\s*:\s*\d+$/.test(idRaw)) {
          var bits = idRaw.split(':');
          idTok = '{' + String(bits[0]).trim() + ':' + String(bits[1]).trim() + '}';
        } else if (idRaw) idTok = idRaw;
      } catch (_) {}
      if (human && idTok) opt.textContent = human + ' · ' + idTok;
      else if (human) opt.textContent = human;
      else opt.textContent = tok || '—';
      if (typeof window.partTooltipText === 'function') { var t = window.partTooltipText(p); if (t) opt.title = t; }
      sel.appendChild(opt);
    });
    if (preserveTok) {
      var canKeepName = Array.prototype.some.call(sel.options || [], function (opt) {
        return String((opt && opt.value) || '').trim() === preserveTok;
      });
      if (canKeepName) sel.value = preserveTok;
    }
  }

  function createRarityMainPart() {
    var raritySel = byId('cmRaritySelect');
    var cls = getDisplayClassForRarity();
    var isUniversal = charToKey(cls) === 'universal' || cls === 'Universal';
    if (isUniversal) return null;
    var tier = String(raritySel && raritySel.value || 'common').toLowerCase();
    var map = RARITY_BY_CLASS[cls];
    var entry = null;
    if (map && Number.isFinite(Number(map[tier]))) {
      var famFromMap = resolveClassModFamilyIdForCharacter(cls);
      if (Number.isFinite(Number(famFromMap))) {
        entry = {
          code: '{' + Number(famFromMap) + ':' + Number(map[tier]) + '}',
          familyId: Number(famFromMap),
          itemId: Number(map[tier]),
          tierLabel: tier.charAt(0).toUpperCase() + tier.slice(1),
          legendaryName: ''
        };
      }
    }
    if (!entry) entry = getClassModRarityEntries(cls).filter(function (x) { return x && x.tier === tier; })[0] || null;
    if (!entry) {
      if (!map) return null;
      var rarityId = map[tier];
      if (!Number.isFinite(Number(rarityId))) return null;
      var fam = resolveClassModFamilyIdForCharacter(cls);
      if (!Number.isFinite(Number(fam))) return null;
      entry = {
        code: '{' + fam + ':' + rarityId + '}',
        familyId: fam,
        itemId: Number(rarityId),
        tierLabel: tier.charAt(0).toUpperCase() + tier.slice(1),
        legendaryName: ''
      };
    }

    /* Legendary: rarity row itemId must match the selected leg-effect / DLC name body. */
    if (String(tier).toLowerCase() === 'legendary') {
      var nameCode = null;
      var nameSpawn = '';
      var nameSel0 = byId('cmNameSelect');
      if (nameSel0 && nameSel0.value) {
        var pp0 = parseFamilyItemToken(String(nameSel0.value).trim());
        if (pp0 && Number.isFinite(pp0.itemId)) nameCode = pp0.itemId;
        nameSpawn = String(nameSel0.value || '').replace(/^"+|"+$/g, '').trim().toLowerCase();
      }
      if (nameCode == null) {
        var st0 = getState();
        if (st0 && st0.slots && st0.slots.namePart) {
          var nid = getNumericItemId(st0.slots.namePart);
          if (Number.isFinite(nid)) nameCode = nid;
          if (!nameSpawn) nameSpawn = normPartSpawnCode(st0.slots.namePart);
        }
      }
      var legRid = null;
      if (nameCode != null && nameCode >= 10 && nameCode <= 15) {
        var byName = LEGENDARY_RARITY_ITEM_BY_NAME_CODE[cls];
        if (byName && Number.isFinite(Number(byName[nameCode]))) legRid = Number(byName[nameCode]);
      }
      if (!Number.isFinite(legRid) && nameCode != null) {
        var dlcMap = LEGENDARY_DLC_NAME_TO_RARITY[cls];
        if (dlcMap && Number.isFinite(Number(dlcMap[nameCode]))) legRid = Number(dlcMap[nameCode]);
      }
      if (!Number.isFinite(legRid) && nameSpawn) {
        var bodyTail = (nameSpawn.match(/leg_body_([a-z0-9_]+)/i) || [])[1] || '';
        if (bodyTail) {
          var want = 'comp_05_legendary_' + bodyTail.toLowerCase();
          var legs = getClassModRarityEntries(cls).filter(function (x) { return x && x.tier === 'legendary'; });
          for (var li = 0; li < legs.length; li++) {
            var its = String((legs[li].row && legs[li].row.itemTypeString) || legs[li].code || '').toLowerCase();
            if (its.indexOf(want) !== -1) {
              legRid = Number(legs[li].itemId);
              break;
            }
          }
        }
      }
      if (Number.isFinite(legRid)) {
        var famL = resolveClassModFamilyIdForCharacter(cls);
        if (Number.isFinite(Number(famL))) {
          var legName = String((entry && entry.legendaryName) || '').trim();
          if (nameSpawn && CLASSMOD_DLC_DISPLAY_BY_SPAWN[nameSpawn]) legName = CLASSMOD_DLC_DISPLAY_BY_SPAWN[nameSpawn];
          entry = {
            code: '{' + Number(famL) + ':' + legRid + '}',
            familyId: Number(famL),
            itemId: legRid,
            tierLabel: 'Legendary',
            legendaryName: legName,
            row: entry && entry.row
          };
        }
      }
    }

    return {
      code: entry.code,
      idRaw: entry.familyId + ':' + entry.itemId,
      family: entry.familyId,
      id: entry.itemId,
      name: entry.legendaryName || entry.tierLabel || tier.charAt(0).toUpperCase() + tier.slice(1),
      partType: 'Rarity'
    };
  }

  function applyRarityAndName() {
    var state = getState();
    var baseMain = createRarityMainPart();
    state.mainPart = baseMain;
    if (!state.slots) state.slots = {};
    state.slots.rarityNamePart = null;
    var nameSel = byId('cmNameSelect');
    if (!nameSel) {
      // Name selection is hidden/disabled in simplified C4sh classmod flow.
      if (state.slots) state.slots.namePart = null;
      return;
    }
    var code = nameSel && nameSel.value ? String(nameSel.value).trim() : '';
    if (code) {
      var cls = getDisplayClassForRarity();
      var parts = getClassModNameParts(cls);
      var part = parts.find(function (p) { return partCodeOf(p) === code; });
      if (part) {
        if (!state.slots) state.slots = {};
        state.slots.namePart = Object.assign({}, part, { name: displayNameForClassModPart(part) || part.name });
      } else {
        if (state.slots) state.slots.namePart = { code: code, idRaw: code.replace(/[{}]/g, ''), name: code };
      }
    } else {
      if (state.slots) state.slots.namePart = null;
    }
  }

  function renderUI() {
    var section = byId('classmodChecklistSection');
    if (!section) return;

    var show = isClassmodSelected();
    section.style.display = 'block';
    section.classList.toggle('cm-disabled', !show);
    var hintEl = section.querySelector('[data-cm-hint]');
    if (hintEl) hintEl.style.display = show ? 'none' : 'block';

    var cls = getSelectedCharacter() || 'Vex';
    var state = getState();
    state.classmodClass = cls;
    setActiveClassButton(cls);

    var isUniversal = charToKey(cls) === 'universal' || cls === 'Universal';
    var rarityNameRow = byId('classmodRarityNameRow');
    if (rarityNameRow) rarityNameRow.style.display = isUniversal ? 'none' : 'flex';

    buildNameOptions();
    applyRarityAndName();

    var primaryItems = getClassModPrimaryItems(cls);
    var secondaryItems = sortClassmodChecklistByTreeThenName(dedupeList(getFilteredClassModItems(cls, 'Secondary', 'secondary')));
    var universalItems = sortClassmodChecklistByTreeThenName(dedupeList(getFilteredClassModItems(cls, 'Universal', 'universal')));
    var firmwareItems = dedupeList(getFilteredClassModItems(cls, 'Firmware', 'firmware')).sort(alphaByName);

    function dedupeList(items) {
      var seenCodes = new Set();
      var out = [];
      for (var i = 0; i < (items || []).length; i++) {
        var x = items[i];
        if (!x || !x.code) continue;
        if (seenCodes.has(x.code)) continue;
        seenCodes.add(x.code);
        out.push(x);
      }
      return out;
    }

    primaryItems.forEach(function (it) { it._primary = true; });
    window.__cmChecklistPrimaryItems = primaryItems;
    window.__cmChecklistSecondaryItems = secondaryItems;
    window.__cmChecklistUniversalItems = universalItems;
    window.__cmChecklistFirmwareItems = firmwareItems;

    renderChecklist(byId('cmPrimaryList'), primaryItems);
    renderChecklist(byId('cmSecondaryList'), secondaryItems);
    renderChecklist(byId('cmUniversalList'), universalItems);
    renderChecklist(byId('cmFirmwareList'), firmwareItems);

    /* Emit checklist serial first so Simple `refreshOutputs` sees rarity/name slots (spawn mode used to drop names). */
    syncChecklistClassModOutputs();
    try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
    try { if (typeof window.refreshBuilder === 'function') window.refreshBuilder(); } catch (_) {}
    try { syncCmChecklistRowHeights(); } catch (_) {}
  }

  function installHandlers() {
    var section = byId('classmodChecklistSection');
    if (!section) return;

    var raritySel = byId('cmRaritySelect');
    var nameSel = byId('cmNameSelect');
    if (raritySel && !raritySel.__cmBound) {
      raritySel.__cmBound = true;
      raritySel.addEventListener('change', function () {
        buildNameOptions();
        applyRarityAndName();
        syncChecklistClassModOutputs();
        try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
        try { if (typeof window.refreshBuilder === 'function') window.refreshBuilder(); } catch (_) {}
      });
    }
    if (nameSel && !nameSel.__cmBound) {
      nameSel.__cmBound = true;
      nameSel.addEventListener('change', function () {
        applyRarityAndName();
        syncChecklistClassModOutputs();
        try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
        try { if (typeof window.refreshBuilder === 'function') window.refreshBuilder(); } catch (_) {}
      });
    }

    section.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-cm-class]');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        var cls = btn.getAttribute('data-cm-class');
        var state = getState();
        state.classmodClass = cls;
        var manVal = DISPLAY_TO_MAN[cls] || cls;
        var guidedMan = byId('ccGuidedManufacturer');
        function setSelVal(sel, v) { if (!sel) return false; var ok = Array.prototype.some.call(sel.options || [], function(o){ return String(o.value||'').trim()===String(v||'').trim(); }); if (ok) sel.value = v; return ok; }
        if (!setSelVal(guidedMan, manVal)) setSelVal(guidedMan, cls);
        // Keep Simple Builder's #stx_manufacturer independent — guided classmod uses ccGuidedManufacturer + checklist only.
        state.manufacturer = manVal;
        setListPage('cmPrimaryList', 0);
        setListPage('cmSecondaryList', 0);
        setListPage('cmUniversalList', 0);
        setListPage('cmFirmwareList', 0);
        renderUI();
        try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
        syncChecklistClassModOutputs();
        return;
      }

      var pageBtn = e.target.closest('button[data-cm-page][data-cm-target]');
      if (pageBtn) {
        e.preventDefault();
        e.stopPropagation();
        var targetId = pageBtn.getAttribute('data-cm-target');
        var dir = pageBtn.getAttribute('data-cm-page');
        var delta = dir === 'next' ? 1 : -1;
        setListPage(targetId, getListPage(targetId) + delta);
        renderChecklistByListId(targetId);
        return;
      }

      var row = e.target.closest('.cm-check-row');
      if (row) {
        if (e.target.closest('select[data-cm-skill-qty], .custom-select-wrapper, .custom-select-display, .custom-select-list, .custom-select-option')) return;
        e.preventDefault();
        e.stopPropagation();
        var code = row.getAttribute('data-code');
        var name = row.getAttribute('data-name') || code;
        var category = row.getAttribute('data-category') || 'Classmod';
        var src = row.getAttribute('data-source') || '';
        var primaryItems = Array.isArray(window.__cmChecklistPrimaryItems) ? window.__cmChecklistPrimaryItems : [];
        var it = getChecklistItemByCode(code);
        var next = !isChecklistItemSelected(it || { code: code });
        setChecked(code, next, it || { name: name, category: category, _cmSource: src, _primary: primaryItems.some(function (x) { return x && x.code === code; }) });
        var cb = row.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = next;
        row.classList.toggle('cm-checked', next);
      }
    }, true);

    section.addEventListener('change', function (e) {
      var qtySel = e.target.closest('select[data-cm-skill-qty]');
      if (qtySel) {
        var item = getChecklistItemByCode(qtySel.getAttribute('data-cm-skill-qty'));
        if (!item || !Array.isArray(item._cmGroupParts)) return;
        var qty = Math.max(1, Math.min(item._cmGroupParts.length, Number(qtySel.value) || 1));
        cmSkillQtyState[item.code] = qty;
        item._cmDesiredCount = qty;
        if (isChecklistItemSelected(item)) {
          setPrimarySkillCount(item, qty);
        }
        renderChecklistByListId('cmPrimaryList');
        refreshChecklistSerialOutputs();
        return;
      }

      var cb = e.target.closest('.cm-check-row input[type="checkbox"]');
      if (!cb) return;
      var row = e.target.closest('.cm-check-row');
      if (!row) return;
      e.stopPropagation();
      var code = row.getAttribute('data-code');
      var name = row.getAttribute('data-name') || code;
      var category = row.getAttribute('data-category') || 'Classmod';
      var src = row.getAttribute('data-source') || '';
      var primaryItems = Array.isArray(window.__cmChecklistPrimaryItems) ? window.__cmChecklistPrimaryItems : [];
      var it = getChecklistItemByCode(code);
      setChecked(code, cb.checked, it || { name: name, category: category, _cmSource: src, _primary: primaryItems.some(function (x) { return x && x.code === code; }) });
      row.classList.toggle('cm-checked', isChecklistItemSelected(it || { code: code }));
    }, true);

    var togglePrimary = byId('cmToggleAllPrimaryBtn');
    if (togglePrimary && !togglePrimary.__bound) {
      togglePrimary.__bound = true;
      togglePrimary.addEventListener('click', function () {
        var items = Array.isArray(window.__cmChecklistPrimaryItems) ? window.__cmChecklistPrimaryItems.slice() : [];
        if (!items.length) return;
        var anyUnchecked = items.some(function (it) { return !isChecklistItemSelected(it); });
        setCheckedBulk(items, anyUnchecked);
        renderChecklistByListId('cmPrimaryList');
        refreshChecklistSerialOutputs();
      });
    }

    var toggleSecondary = byId('cmToggleAllSecondaryBtn');
    if (toggleSecondary && !toggleSecondary.__bound) {
      toggleSecondary.__bound = true;
      toggleSecondary.addEventListener('click', function () {
        var raw = Array.isArray(window.__cmChecklistSecondaryItems) ? window.__cmChecklistSecondaryItems : [];
        var items = raw.filter(function (it) {
          var src = String((it && it._cmSource) || '').toLowerCase();
          return src.indexOf('firmware') === -1;
        });
        if (!items.length) return;
        var anyUnchecked = items.some(function (it) { return !isChecked(it.code); });
        setCheckedBulk(items, anyUnchecked);
        renderChecklistByListId('cmSecondaryList');
        refreshChecklistSerialOutputs();
      });
    }

    var toggleUniversal = byId('cmToggleAllUniversalBtn');
    if (toggleUniversal && !toggleUniversal.__bound) {
      toggleUniversal.__bound = true;
      toggleUniversal.addEventListener('click', function () {
        var raw = Array.isArray(window.__cmChecklistUniversalItems) ? window.__cmChecklistUniversalItems : [];
        if (!raw.length) return;
        var anyUnchecked = raw.some(function (it) { return !isChecked(it.code); });
        setCheckedBulk(raw, anyUnchecked);
        renderChecklistByListId('cmUniversalList');
        refreshChecklistSerialOutputs();
      });
    }

    var toggleFirmware = byId('cmToggleAllFirmwareBtn');
    if (toggleFirmware && !toggleFirmware.__bound) {
      toggleFirmware.__bound = true;
      toggleFirmware.addEventListener('click', function () {
        var raw = Array.isArray(window.__cmChecklistFirmwareItems) ? window.__cmChecklistFirmwareItems : [];
        if (!raw.length) return;
        var anyUnchecked = raw.some(function (it) { return !isChecked(it.code); });
        setCheckedBulk(raw, anyUnchecked);
        renderChecklistByListId('cmFirmwareList');
        refreshChecklistSerialOutputs();
      });
    }
  }

  function boot() {
    installHandlers();
    initCmChecklistHeightSync();
    var section = byId('classmodChecklistSection');
    if (section) {
      section.style.display = 'block';
      section.classList.add('cm-disabled');
      var hintEl = section.querySelector('[data-cm-hint]');
      if (hintEl) hintEl.style.display = 'block';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.__ccClassmodChecklistRender = renderUI;
  window.syncChecklistClassModOutputs = syncChecklistClassModOutputs;
})();