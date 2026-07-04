/**
 * cc-rebuild-bootstrap.js
 * Builds GUN_PARTS, GRENADE_PARTS, etc. from STX_DATASET for part sections and advanced search.
 */
(function () {
  'use strict';

  (function initDebug() {
    try {
      var m = (location.search || '').match(/[?&]debug=(\d+|1|true)/i);
      window.__CC_DEBUG = !!(m && (m[1] === '1' || m[1] === 'true'));
    } catch (_) { window.__CC_DEBUG = false; }
  })();

  function byId(id) { return document.getElementById(id); }

  function ccIsAdvSearchDeepLink() {
    try {
      if (/ccadvancedpartssearch/i.test(String(location.hash || ''))) return true;
      var p = new URLSearchParams(location.search);
      return !!(p.get('advq') || p.get('partq') || p.get('advlikely') || p.get('advspawn'));
    } catch (_) { return false; }
  }
  try { window.__ccIsAdvSearchDeepLinkV1 = ccIsAdvSearchDeepLink; } catch (_) {}

  var deferredFullLoadersDone = false;

  function runDeferredFullLoadersChunked(step) {
    if (deferredFullLoadersDone) return;
    var steps = [
      function () {
        if (window.ensurePartPools && !window.__ccPartPoolsReady) {
          try { window.ensurePartPools(); window.__ccPartPoolsReady = true; } catch (_) {}
        }
      },
      function () {
        try {
          if (typeof window.__ccInitPartSectionsV1 === 'function') window.__ccInitPartSectionsV1();
          else if (typeof window.refreshPartSections === 'function') window.refreshPartSections();
        } catch (_) {}
      },
      function () { try { loadLegendaryPerksFallback(); } catch (_) {} },
      function () { try { ensurePresetSectionFallback(); } catch (_) {} },
      function () { try { loadToolsSkinCamoFallback(); } catch (_) {} },
      function () { try { if (typeof window.loadGuidedSkinCamo === 'function') window.loadGuidedSkinCamo(); } catch (_) {} },
      function () { try { if (typeof window.initGuidedExtraSections === 'function') window.initGuidedExtraSections(); } catch (_) {} },
      function () { try { if (typeof window.refreshTopSelectors === 'function') window.refreshTopSelectors({ deferHeavy: true }); } catch (_) {} },
      function () { try { wireLazyGuidedDropdownRefresh(); } catch (_) {} deferredFullLoadersDone = true; }
    ];
    if (step >= steps.length) return;
    try { steps[step](); } catch (_) {}
    if (step + 1 >= steps.length) return;
    var next = function () { runDeferredFullLoadersChunked(step + 1); };
    if (typeof window.stxScheduleIdle === 'function') {
      window.stxScheduleIdle(next, 90);
    } else {
      setTimeout(next, 48);
    }
  }

  function runDeferredFullLoaders() {
    if (deferredFullLoadersDone) return;
    if (ccIsLiteUi()) {
      runDeferredFullLoadersChunked(0);
      return;
    }
    deferredFullLoadersDone = true;
    if (window.ensurePartPools && !window.__ccPartPoolsReady) {
      try { window.ensurePartPools(); window.__ccPartPoolsReady = true; } catch (_) {}
    }
    try {
      if (typeof window.__ccInitPartSectionsV1 === 'function') window.__ccInitPartSectionsV1();
      else if (typeof window.refreshPartSections === 'function') window.refreshPartSections();
    } catch (_) {}
    try { loadLegendaryPerksFallback(); } catch (_) {}
    try { ensurePresetSectionFallback(); } catch (_) {}
    try { loadToolsSkinCamoFallback(); } catch (_) {}
    try { if (typeof window.loadGuidedSkinCamo === 'function') window.loadGuidedSkinCamo(); } catch (_) {}
    try { if (typeof window.initGuidedExtraSections === 'function') window.initGuidedExtraSections(); } catch (_) {}
    try {
      if (typeof window.refreshTopSelectors === 'function') window.refreshTopSelectors({ deferHeavy: true });
    } catch (_) {}
    try { wireLazyGuidedDropdownRefresh(); } catch (_) {}
  }

  function scheduleDeferredFullLoaders() {
    if (deferredFullLoadersDone || window.__ccDeferredFullLoadersScheduled) return;
    window.__ccDeferredFullLoadersScheduled = true;
    var run = function () { runDeferredFullLoaders(); };
    function arm() {
      function armPanel(el) {
        if (!el || el.__ccDeferredArm) return;
        el.__ccDeferredArm = true;
        el.addEventListener('pointerdown', run, { once: true, passive: true });
      }
      ['stxSimpleBuilderPanel', 'rebuildGuidedBuilderSection', 'rebuildToolsPanel'].forEach(function (id) {
        armPanel(byId(id));
      });
    }
    if (ccIsLiteUi()) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', arm, { once: true });
      } else {
        arm();
      }
      document.addEventListener('keydown', run, { once: true, passive: true });
      if (typeof window.stxScheduleIdle === 'function') {
        window.stxScheduleIdle(run, 90000);
      } else {
        setTimeout(run, 90000);
      }
      return;
    }
    document.addEventListener('pointerdown', run, { once: true, passive: true });
    document.addEventListener('keydown', run, { once: true, passive: true });
    if (typeof window.stxScheduleIdle === 'function') {
      window.stxScheduleIdle(run, 4500);
    } else if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(run, { timeout: 4500 });
    } else {
      setTimeout(run, 1200);
    }
  }

  /** Collapse duplicate dataset rows that share the same TypeID:ItemID (e.g. main + supplement). Prefer non-supplement rows and full spawn paths. */
  function normalizeIdRawKey(p) {
    if (!p) return '';
    var ir = String(p.idRaw != null ? p.idRaw : (p.idraw != null ? p.idraw : '')).trim();
    var m = ir.match(/^(\d+)\s*:\s*(\d+)\s*$/);
    if (m) return Number(m[1]) + ':' + Number(m[2]);
    var fam = p.family != null ? Number(p.family) : (p.familyId != null ? Number(p.familyId) : NaN);
    var idn = p.id != null ? Number(p.id) : (p.itemId != null ? Number(p.itemId) : NaN);
    if (Number.isFinite(fam) && Number.isFinite(idn)) return fam + ':' + idn;
    return '';
  }

  function dedupePartsByNumericIdentity(parts) {
    if (!Array.isArray(parts) || !parts.length) return parts;
    function normCodeKey(p) {
      var c = String(p.code != null ? p.code : '').trim();
      if (c.charAt(0) === '"' && c.charAt(c.length - 1) === '"') c = c.slice(1, -1);
      return c.toLowerCase();
    }
    function scorePart(p) {
      var s = 0;
      if (normalizeIdRawKey(p)) s += 20;
      if (p.idRaw || p.idraw) s += 4;
      var src = String(p.source || '').toLowerCase();
      if (src !== 'supplement') s += 5;
      var c = normCodeKey(p);
      if (c && c.indexOf('.') !== -1 && !/^\{\s*\d+\s*:\s*\d+\s*\}$/.test(c)) s += 3;
      return s;
    }
    var map = Object.create(null);
    var order = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p) continue;
      var idK = normalizeIdRawKey(p);
      var k = idK ? ('id:' + idK) : ('code:' + normCodeKey(p));
      if (!map[k]) {
        map[k] = p;
        order.push(k);
      } else if (scorePart(p) > scorePart(map[k])) {
        map[k] = p;
      }
    }
    return order.map(function (kk) { return map[kk]; });
  }
  try { window.__ccDedupePartsByNumericId = dedupePartsByNumericIdentity; } catch (_) {}

  function normCategoryLabel(cat) {
    return String(cat || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function categoryMatches(p, cat) {
    if (!p) return false;
    var c = normCategoryLabel(p.category);
    var want = normCategoryLabel(cat);
    if (c === want) return true;
    if (want === 'classmod' && (c === 'class mod' || c === 'character')) return true;
    return false;
  }

  function byCategory(cat) {
    var all = (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS))
      ? window.STX_DATASET.ALL_PARTS
      : (Array.isArray(window.ALL_PARTS) ? window.ALL_PARTS : []);
    return all.filter(function (p) {
      return categoryMatches(p, cat);
    });
  }

  function byCategoryOrWeapon(cat) {
    if (String(cat).toLowerCase() === 'weapon') {
      var all = (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS))
        ? window.STX_DATASET.ALL_PARTS
        : (Array.isArray(window.ALL_PARTS) ? window.ALL_PARTS : []);
      return all.filter(function (p) {
        return p && (String(p.category || '').toLowerCase() === 'weapon' ||
          (String(p.code || '').toLowerCase().indexOf('.part_') !== -1 && p.itemType === 'Weapon'));
      });
    }
    return byCategory(cat);
  }

  function ensurePools() {
    if (!window.STX_DATASET && !window.ALL_PARTS) return;
    window.GUN_PARTS = dedupePartsByNumericIdentity(window.GUN_PARTS || byCategoryOrWeapon('Weapon'));
    window.GRENADE_PARTS = dedupePartsByNumericIdentity(window.GRENADE_PARTS || byCategory('Grenade'));
    window.SHIELD_PARTS = dedupePartsByNumericIdentity(window.SHIELD_PARTS || byCategory('Shield'));
    window.REPKIT_PARTS = dedupePartsByNumericIdentity(window.REPKIT_PARTS || byCategory('Repkit'));
    window.ENHANCEMENT_PARTS = dedupePartsByNumericIdentity(window.ENHANCEMENT_PARTS || byCategory('Enhancement'));
    var all = (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS)) ? window.STX_DATASET.ALL_PARTS : [];
    var hw = all.filter(function (p) {
      if (!p) return false;
      var code = String(p.code || p.spawnCode || p.importCode || '').toLowerCase();
      if (code.indexOf('grenade_gadget.') !== -1) return false;
      return String(p.category || '').trim() === 'Heavy Weapon' ||
        String(p.itemType || '').trim() === 'Heavy Weapon' ||
        /_hw[._]|_hw\b|heavy_weapon_gadget/i.test(String(p.code || ''));
    });
    window.HEAVY_PARTS = dedupePartsByNumericIdentity(window.HEAVY_PARTS || hw);
    window.CLASSMOD_PARTS = dedupePartsByNumericIdentity(window.CLASSMOD_PARTS || byCategory('Classmod'));
    if (!window.CLASSMOD_PARTS || window.CLASSMOD_PARTS.length === 0) {
      window.CLASSMOD_PARTS = dedupePartsByNumericIdentity(byCategory('Character'));
    }
    window.__ccPartPoolsReady = true;
  }

  window.byCategory = byCategory;
  window.ensurePartPools = ensurePools;

  /** Runtime patch: fix legendary perks where stats is generic (e.g. "Barrel part for X") */
  function patchLegendaryPerkStats() {
    try {
      var all = (window.STX_DATASET && window.STX_DATASET.ALL_PARTS) ? window.STX_DATASET.ALL_PARTS : [];
      var patched = 0;
      for (var i = 0; i < all.length; i++) {
        var p = all[i];
        if (!p || !/legendary\s*perk/i.test(String(p.partType || ''))) continue;
        var stats = String(p.stats || '').trim();
        var effects = String(p.effects || p.effect || '').trim();
        if (!effects) continue;
        if (/part\s+for\s+/i.test(stats) || /barrel\s+part|mag\s+part|body\s+part/i.test(stats) || !stats) {
          p.stats = effects;
          patched++;
        }
      }
      if (window.__CC_DEBUG && patched > 0) console.log('[STX] Patched', patched, 'legendary perk stats');
    } catch (_) {}
  }

  function loadPresetSectionFallback() {
    var catSel = byId('presetCategorySelect');
    var partSel = byId('presetPartSelect');
    var moreSel = byId('presetMorePartSelect');
    if (typeof window.populatePresetParts === 'function') {
      window.populatePresetParts(catSel, partSel, null, moreSel);
    }
  }

  // HTML uses `onchange="loadPresetOptions()"` for this select.
  // Define it early so we don't depend on rebuild-presets-random.js (syntax error).
  try { window.loadPresetOptions = function () { loadPresetSectionFallback(); }; } catch (_) {}

  function getCodeAppendOutputEl() {
    var g = byId('guidedOutputDeserialized');
    var o = byId('outCode');
    if (o && typeof window.stxOutCodeHasItemHeader === 'function' && window.stxOutCodeHasItemHeader()) return o;
    if (o && typeof window.stxSimpleBuilderHasActiveBuild === 'function' && window.stxSimpleBuilderHasActiveBuild()) return o;
    var last = window.__CC_LAST_CODE_TARGET;
    if (last === 'guided' && g) return g;
    if (last === 'simple' && o) return o;
    if (g && o) {
      var gv = String(g.value || '').trim();
      var ov = String(o.value || '').trim();
      if (gv && !ov) return g;
      if (ov && !gv) return o;
    }
    return o || g;
  }
  try { window.getCodeAppendOutputEl = getCodeAppendOutputEl; } catch (_) {}

  // Ensure Quick Add "Add preset" always appends tokens with braces.
  try {
    window.addPresetPart = function () {
      var partSel = byId('presetPartSelect');
      var moreSel = byId('presetMorePartSelect');
      var qty = byId('presetQuantity');
      var code = (typeof window.resolveActivePresetPartValue === 'function')
        ? window.resolveActivePresetPartValue(partSel, moreSel)
        : String((partSel && partSel.value) || (moreSel && moreSel.value) || '').trim();
      if (!code) return;
      if (typeof window.resolvePresetTokenForOutput === 'function') {
        code = window.resolvePresetTokenForOutput(code) || code;
      }
      var nBoot = 1;
      try { nBoot = Math.max(1, parseInt((qty && qty.value) || '1', 10) || 1); } catch (_) {}
      if (typeof window.stxAppendPresetToActiveBuilder === 'function' && window.stxAppendPresetToActiveBuilder(code, { quantity: nBoot })) {
        return;
      }
      var out = (typeof window.getCodeAppendOutputEl === 'function') ? window.getCodeAppendOutputEl() : byId('outCode');
      if (!out) return;

      if (/^\d+:\d+$/.test(code)) code = '{' + code + '}';
      if (/^\d+$/.test(code)) code = '{' + code + '}';
      code = code.replace(/^"+|"+$/g, '');

      var n = 1;
      try { n = Math.max(1, parseInt((qty && qty.value) || '1', 10) || 1); } catch (_) {}

      if (out.id === 'guidedOutputDeserialized' && typeof window.appendToOutCodeGuided === 'function') {
        for (var qj = 0; qj < n; qj++) window.appendToOutCodeGuided(code);
        try { window.__CC_LAST_CODE_TARGET = 'guided'; } catch (_) {}
        return;
      }

      /* Simple Builder: merge into state.extras — refreshOutputs() rebuilds outCode from slots + extras. */
      if (out.id === 'outCode' && typeof window.stxAppendQuickPresetNumericTokens === 'function') {
        var serialSb = String(out.value || '').trim();
        var baseFamSb = null;
        try {
          var dblSb = serialSb.indexOf('||');
          var prefixSb = dblSb >= 0 ? serialSb.slice(0, dblSb).trim() : serialSb;
          var mSb = prefixSb.match(/^\s*(\d+)\s*[,\|]/) || prefixSb.match(/^\s*(\d+)/);
          baseFamSb = mSb ? Number(mSb[1]) : null;
        } catch (_) {}
        var piecesSb = [];
        for (var isb = 0; isb < n; isb++) piecesSb.push(code);
        var normPiecesSb = piecesSb;
        if (typeof window.normalizeIdTokensForBaseFamily === 'function' && baseFamSb != null) {
          normPiecesSb = window.normalizeIdTokensForBaseFamily(piecesSb, baseFamSb);
        }
        try { window.__CC_LAST_CODE_TARGET = 'simple'; } catch (_) {}
        if (window.stxAppendQuickPresetNumericTokens(normPiecesSb, { replaceBareQuickPresets: false })) {
          try { if (typeof window.refreshBuildStatsCore === 'function') window.refreshBuildStatsCore(); } catch (_) {}
          return;
        }
        if (typeof window.stxAppendPartTokenViaExtras === 'function') {
          for (var ia = 0; ia < normPiecesSb.length; ia++) {
            var skipRefresh = ia < normPiecesSb.length - 1;
            if (!window.stxAppendPartTokenViaExtras(normPiecesSb[ia], { type: 'quickPreset', skipRefresh: skipRefresh })) break;
          }
          try { if (typeof window.refreshBuildStatsCore === 'function') window.refreshBuildStatsCore(); } catch (_) {}
          return;
        }
      }

      var serial = String(out.value || '').trim();
      var dbl = serial.indexOf('||');
      var tail = dbl >= 0 ? serial.slice(dbl + 2) : '';
      var baseFamilyId = null;
      try {
        var prefix = dbl >= 0 ? serial.slice(0, dbl).trim() : serial.trim();
        var m = prefix.match(/^\s*(\d+)\s*[,\|]/) || prefix.match(/^\s*(\d+)/);
        baseFamilyId = m ? Number(m[1]) : null;
      } catch (_) {}
      var tokens = (tail.match(/\{[^}]+\}|\"[^\"]+\"|\S+/g) || []);
      var boot = /^\{\s*\d+\s*\}$/.test(String(code).trim());
      if (boot) {
        tokens = tokens.filter(function (t) { return !/^\{\s*\d+\s*\}$/.test(String(t || '').trim()); });
      }
      for (var i = 0; i < n; i++) tokens.push(code);
      if (typeof window.normalizeIdTokensForBaseFamily === 'function' && baseFamilyId != null) {
        tokens = window.normalizeIdTokensForBaseFamily(tokens, baseFamilyId, { compactSameFamily: false });
      }
      var newTail = tokens.join(' ');
      if (!dbl && !serial) {
        alert('Pick a rarity / main part in Simple Builder first so the item header (family, level) exists before adding presets.');
        return;
      }
      var newSerial = dbl >= 0
        ? serial.slice(0, dbl + 2) + newTail
        : (serial + ' || ' + newTail);

      out.value = newSerial;
      try { window.__CC_LAST_CODE_TARGET = (out.id === 'outCode') ? 'simple' : 'guided'; } catch (_) {}
      try {
        if (out.id === 'outCode') { if (window.refreshOutputs) window.refreshOutputs(true); }
        else {
          if (window.refreshGuidedOutputPreview) window.refreshGuidedOutputPreview();
          if (window.syncFloatingOutput) window.syncFloatingOutput(true);
        }
      } catch (_) {}
      try { if (typeof window.refreshBuildStatsCore === 'function') window.refreshBuildStatsCore(); } catch (_) {}
    };
  } catch (_) {}

  var __presetSectionWired = false;
  function ensurePresetSectionFallback() {
    loadPresetSectionFallback();
    if (__presetSectionWired) return;
    var catSel = byId('presetCategorySelect');
    if (catSel) {
      catSel.addEventListener('change', loadPresetSectionFallback);
      // Some UI wrappers update values without a real `change` event.
      // Listening to `input` makes the dropdown repopulate reliably.
      catSel.addEventListener('input', loadPresetSectionFallback);
      __presetSectionWired = true;
    }
    // HTML uses `onchange="loadPresetOptions()"` on this select.
    // If rebuild-presets-random.js fails to load (syntax error), ensure the handler exists.
    try { window.loadPresetOptions = function () { loadPresetSectionFallback(); }; } catch (_) {}
  }

  function loadLegendaryPerksFallback() {
    var sel = byId('legendaryPerkSelect');
    if (typeof window.populateLegendaryPerks === 'function') {
      window.populateLegendaryPerks(sel);
    }
  }

  function loadToolsSkinCamoFallback() {
    var skinSel = byId('toolsSkinSelect');
    var camoSel = byId('toolsCamoSelect');
    if (typeof window.populateSkinCamo === 'function') {
      window.populateSkinCamo(skinSel, camoSel);
      if (window.__CC_DEBUG) console.log('[STX] Skin/camo populated, skin opts:', skinSel ? skinSel.options.length : 0, 'camo opts:', camoSel ? camoSel.options.length : 0);
    }
  }

  function ccIsLiteUi() {
    try {
      if (typeof window.stxIsLiteUi === 'function' && window.stxIsLiteUi()) return true;
      if (typeof window.stxIsTouchUi === 'function' && window.stxIsTouchUi()) return true;
    } catch (_) {}
    return document.documentElement.classList.contains('stx-lite-ui') ||
      document.documentElement.classList.contains('stx-touch-ui');
  }

  function runCriticalLoaders() {
    try {
      if (typeof window.applyPartDisplayOverrides === 'function') window.applyPartDisplayOverrides();
    } catch (_) {}
    patchLegendaryPerkStats();
    if (!ccIsLiteUi()) {
      ensurePools();
      try {
        if (typeof window.__ccEnsureCodeIdMap === 'function') window.__ccEnsureCodeIdMap();
      } catch (_) {}
    }
  }

  function runAllLoaders() {
    runCriticalLoaders();
    if (ccIsAdvSearchDeepLink() || ccIsLiteUi()) {
      scheduleDeferredFullLoaders();
      return;
    }
    try { if (typeof window.refreshPartSections === 'function') window.refreshPartSections(); } catch (_) {}
    try { loadLegendaryPerksFallback(); } catch (_) {}
    try { ensurePresetSectionFallback(); } catch (_) {}
    try { loadToolsSkinCamoFallback(); } catch (_) {}
    try { if (typeof window.loadGuidedSkinCamo === 'function') window.loadGuidedSkinCamo(); } catch (_) {}
    try { if (typeof window.initGuidedExtraSections === 'function') window.initGuidedExtraSections(); } catch (_) {}
    deferredFullLoadersDone = true;
    setTimeout(function () {
      if (window.__ccPartSectionsRefreshRetried) return;
      var need = false;
      try {
        var gunDet = byId('partSectionDetailsGun');
        var gunSel = byId('partSelectGun');
        if (gunDet && gunDet.open && gunSel && gunSel.options && gunSel.options.length <= 1) need = true;
      } catch (_) {}
      if (!need) return;
      window.__ccPartSectionsRefreshRetried = true;
      try { if (typeof window.refreshPartSections === 'function') window.refreshPartSections(); } catch (_) {}
      try { loadLegendaryPerksFallback(); } catch (_) {}
      try { ensurePresetSectionFallback(); } catch (_) {}
    }, 900);
  }

  function runWhenReady() {
    function start() {
      if (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS) && window.STX_DATASET.ALL_PARTS.length > 0) {
        if (window.__CC_DEBUG) console.log('[STX] STX_DATASET ready, parts:', window.STX_DATASET.ALL_PARTS.length);
        runAllLoaders();
        return;
      }
      var tries = 120;
      function poll() {
        if (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS) && window.STX_DATASET.ALL_PARTS.length > 0) {
          runAllLoaders();
          return;
        }
        if (tries-- > 0) setTimeout(poll, 50);
      }
      if (typeof window.__ccOnStxDatasetReady === 'function') {
        var orig = window.__ccOnStxDatasetReady;
        window.__ccOnStxDatasetReady = function () {
          orig();
          runAllLoaders();
        };
      } else {
        window.__ccOnStxDatasetReady = function () { runAllLoaders(); };
      }
      setTimeout(poll, 50);
    }
    function scheduleStart() {
      if (typeof window.stxScheduleIdle === 'function') {
        window.stxScheduleIdle(start, ccIsLiteUi() ? 500 : 900);
      } else {
        setTimeout(start, ccIsLiteUi() ? 400 : 700);
      }
    }
    if (typeof window.stxWhenSplashDismissed === 'function') {
      window.stxWhenSplashDismissed(scheduleStart);
    } else {
      scheduleStart();
    }
  }

  // Skin/camo dropdowns depend only on `skin_data.js`, not on the full STX dataset.
  // If STX_DATASET loads late, these dropdowns would otherwise stay stuck at "-- None --".
  function reloadSkinCamoEarly() {
    try { loadToolsSkinCamoFallback(); } catch (_) {}
    try {
      if (typeof window.__stxArmSkinCamoSync === 'function') window.__stxArmSkinCamoSync();
    } catch (_) {}
    if (!ccIsLiteUi()) {
      try { if (typeof window.initGuidedExtraSections === 'function') window.initGuidedExtraSections(); } catch (_) {}
    }
  }

  function skinCamoHasRealOptions() {
    function has(sel) {
      try { return !!(sel && sel.options && sel.options.length > 1); } catch (_) { return false; }
    }
    return has(byId('skinSelect')) || has(byId('camoSelect'))
      || has(byId('ccGuidedSkinSelect')) || has(byId('ccGuidedCamoSelect'))
      || has(byId('toolsSkinSelect')) || has(byId('toolsCamoSelect'));
  }

  function runSkinCamoEarlyPoll() {
    if (ccIsAdvSearchDeepLink()) return;
    function run() {
      var tries = ccIsLiteUi() ? 6 : 10;
      var intervalMs = ccIsLiteUi() ? 1500 : 900;
      function tick() {
        reloadSkinCamoEarly();
        if (skinCamoHasRealOptions() || tries-- <= 0) return;
        setTimeout(tick, intervalMs);
      }
      var startPoll = function () {
        if (typeof window.stxQueueIdleWork === 'function') {
          window.stxQueueIdleWork(tick, ccIsLiteUi() ? 6500 : 4800);
        } else if (typeof window.stxScheduleIdle === 'function') {
          window.stxScheduleIdle(tick, ccIsLiteUi() ? 6500 : 4800);
        } else {
          setTimeout(tick, ccIsLiteUi() ? 4500 : 3200);
        }
      };
      startPoll();
    }
    if (typeof window.stxWhenSplashDismissed === 'function') {
      window.stxWhenSplashDismissed(run);
    } else {
      run();
    }
  }

  function wireElementDetailsLazy() {
    var det = byId('rebuildElementDetails');
    if (!det || det.__stxElementLazyWired) return;
    det.__stxElementLazyWired = true;
    det.addEventListener('toggle', function () {
      if (!det.open) return;
      var hydrate = function () {
        try {
          if (typeof window.refreshToolsStandaloneElementDropdowns === 'function') {
            window.refreshToolsStandaloneElementDropdowns();
          }
        } catch (_) {}
        try {
          if (typeof window.__ccBootCustomSelectRebuild === 'function') {
            window.__ccBootCustomSelectRebuild();
          }
        } catch (_) {}
      };
      if (typeof window.stxYieldToMain === 'function') window.stxYieldToMain(hydrate);
      else setTimeout(hydrate, 0);
    }, { passive: true });
  }

  function initPersistLastBuild() {
    try {
      var out = byId('outCode');
      if (!out) return;
      var key = '__CC_LAST_SERIAL';
      // Do not restore into the textarea on load — code sections should start blank until the user builds or imports.
      // Saving on edit still keeps the key updated for optional future use.
      var save = function () {
        try {
          var v = (out.value || '').trim();
          if (v) localStorage.setItem(key, v);
        } catch (_) {}
      };
      out.addEventListener('input', save);
      out.addEventListener('change', save);
      out.addEventListener('blur', save);
    } catch (_) {}
  }

  function runValidation() {
    var ok = true;
    if (!window.STX_DATASET || !Array.isArray(window.STX_DATASET.ALL_PARTS) || window.STX_DATASET.ALL_PARTS.length === 0) {
      if (window.__CC_DEBUG) console.warn('[STX] Validation: STX_DATASET.ALL_PARTS missing or empty');
      ok = false;
    }
    if (!window.SPAWN_SKINS && !window.SKINS) {
      if (window.__CC_DEBUG) console.warn('[STX] Validation: SPAWN_SKINS and SKINS both missing (skin_data.js?)');
      ok = false;
    }
    if (window.__CC_DEBUG && ok) console.log('[STX] Validation OK');
    return ok;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      wireElementDetailsLazy();
      runSkinCamoEarlyPoll();
      runWhenReady();
      setTimeout(function () {
        runValidation();
        initPersistLastBuild();
        try {
          var g = byId('guidedOutputDeserialized');
          var o = byId('outCode');
          function mark(which) { try { window.__CC_LAST_CODE_TARGET = which; } catch (_) {} }
          if (g) { ['focus', 'input', 'click'].forEach(function (ev) { g.addEventListener(ev, function () { mark('guided'); }); }); }
          if (o) { ['focus', 'input', 'click'].forEach(function (ev) { o.addEventListener(ev, function () { mark('simple'); }); }); }
        } catch (_) {}
      }, 500);
    });
  } else {
    wireElementDetailsLazy();
    runSkinCamoEarlyPoll();
    runWhenReady();
    setTimeout(function () {
      runValidation();
      initPersistLastBuild();
      try {
        var g = byId('guidedOutputDeserialized');
        var o = byId('outCode');
        function mark(which) { try { window.__CC_LAST_CODE_TARGET = which; } catch (_) {} }
        if (g) { ['focus', 'input', 'click'].forEach(function (ev) { g.addEventListener(ev, function () { mark('guided'); }); }); }
        if (o) { ['focus', 'input', 'click'].forEach(function (ev) { o.addEventListener(ev, function () { mark('simple'); }); }); }
      } catch (_) {}
    }, 500);
  }
})();
