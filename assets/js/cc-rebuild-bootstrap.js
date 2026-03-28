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

  function byCategory(cat) {
    var all = (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS))
      ? window.STX_DATASET.ALL_PARTS
      : (Array.isArray(window.ALL_PARTS) ? window.ALL_PARTS : []);
    var c = String(cat || '').toLowerCase();
    return all.filter(function (p) {
      return p && String(p.category || '').toLowerCase() === c;
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
    window.GUN_PARTS = window.GUN_PARTS || byCategoryOrWeapon('Weapon');
    window.GRENADE_PARTS = window.GRENADE_PARTS || byCategory('Grenade');
    window.SHIELD_PARTS = window.SHIELD_PARTS || byCategory('Shield');
    window.REPKIT_PARTS = window.REPKIT_PARTS || byCategory('Repkit');
    window.ENHANCEMENT_PARTS = window.ENHANCEMENT_PARTS || byCategory('Enhancement');
    var hw = byCategory('Heavy Weapon');
    if (!hw || hw.length === 0) {
      var all = (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS)) ? window.STX_DATASET.ALL_PARTS : [];
      hw = all.filter(function (p) { return p && String(p.itemType || '').trim() === 'Heavy Weapon'; });
    }
    window.HEAVY_PARTS = window.HEAVY_PARTS || hw;
    window.CLASSMOD_PARTS = window.CLASSMOD_PARTS || byCategory('Classmod');
    if (!window.CLASSMOD_PARTS || window.CLASSMOD_PARTS.length === 0) {
      window.CLASSMOD_PARTS = byCategory('Character');
    }
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
    if (typeof window.populatePresetParts === 'function') {
      window.populatePresetParts(catSel, partSel);
    }
  }

  // HTML uses `onchange="loadPresetOptions()"` for this select.
  // Define it early so we don't depend on rebuild-presets-random.js (syntax error).
  try { window.loadPresetOptions = function () { loadPresetSectionFallback(); }; } catch (_) {}

  // Ensure Quick Add "Add preset" always appends tokens with braces.
  try {
    window.addPresetPart = function () {
      var partSel = byId('presetPartSelect');
      var qty = byId('presetQuantity');
      var out = byId('outCode');
      if (!partSel || !out) return;
      var code = String(partSel.value || '').trim();
      if (!code) return;

      // Normalize "22:72" => "{22:72}"
      if (/^\d+:\d+$/.test(code)) code = '{' + code + '}';
      if (/^\d+$/.test(code)) code = '{' + code + '}';
      code = code.replace(/^"+|"+$/g, '');

      var n = 1;
      try { n = Math.max(1, parseInt((qty && qty.value) || '1', 10) || 1); } catch (_) {}

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

      // Append normalized token n times
      var mTok = String(code).match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
      if (baseFamilyId != null && mTok) {
        var fam = Number(mTok[1]);
        var id = Number(mTok[2]);
        if (fam === baseFamilyId) code = '{' + id + '}';
      }
      for (var i = 0; i < n; i++) tokens.push(code);
      var newTail = tokens.join(' ');
      var newSerial = dbl >= 0
        ? serial.slice(0, dbl + 2) + newTail
        : (serial ? (serial + ' || ' + newTail) : ('|| ' + newTail));

      out.value = newSerial;
      try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
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

  function runAllLoaders() {
    patchLegendaryPerkStats();
    ensurePools();
    try { if (typeof window.refreshPartSections === 'function') window.refreshPartSections(); } catch (_) {}
    try { loadLegendaryPerksFallback(); } catch (_) {}
    try { ensurePresetSectionFallback(); } catch (_) {}
    try { loadToolsSkinCamoFallback(); } catch (_) {}
    try { if (typeof window.loadGuidedSkinCamo === 'function') window.loadGuidedSkinCamo(); } catch (_) {}
    try { if (typeof window.initGuidedExtraSections === 'function') window.initGuidedExtraSections(); } catch (_) {}
    (function schedule(k) {
      if (k > 3) return;
      setTimeout(function () {
        try { if (typeof window.refreshPartSections === 'function') window.refreshPartSections(); } catch (_) {}
        try { loadLegendaryPerksFallback(); } catch (_) {}
        try { ensurePresetSectionFallback(); } catch (_) {}
        try { loadToolsSkinCamoFallback(); } catch (_) {}
        try { if (typeof window.loadGuidedSkinCamo === 'function') window.loadGuidedSkinCamo(); } catch (_) {}
        try { if (typeof window.initGuidedExtraSections === 'function') window.initGuidedExtraSections(); } catch (_) {}
        schedule(k + 1);
      }, 150);
    })(1);
  }

  function runWhenReady() {
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

  // Skin/camo dropdowns depend only on `skin_data.js`, not on the full STX dataset.
  // If STX_DATASET loads late, these dropdowns would otherwise stay stuck at "-- None --".
  function reloadSkinCamoEarly() {
    try { loadToolsSkinCamoFallback(); } catch (_) {}
    // Guided skin/camo is loaded inside initGuidedExtraSections().
    try { if (typeof window.initGuidedExtraSections === 'function') window.initGuidedExtraSections(); } catch (_) {}
  }

  function skinCamoHasRealOptions() {
    function has(sel) {
      try { return !!(sel && sel.options && sel.options.length > 1); } catch (_) { return false; }
    }
    return has(byId('ccGuidedSkinSelect')) || has(byId('ccGuidedCamoSelect'))
      || has(byId('toolsSkinSelect')) || has(byId('toolsCamoSelect'));
  }

  function runSkinCamoEarlyPoll() {
    // skin_data.js is `defer`, so it can finish after the first few seconds.
    // Keep polling long enough that guided/tools dropdowns will populate even if STX_DATASET is slow.
    var tries = 150; // ~30 seconds at 200ms
    function tick() {
      reloadSkinCamoEarly();
      if (skinCamoHasRealOptions() || tries-- <= 0) return;
      setTimeout(tick, 200);
    }
    tick();
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
      runSkinCamoEarlyPoll();
      runWhenReady();
      setTimeout(function () {
        runValidation();
        initPersistLastBuild();
      }, 500);
    });
  } else {
    runSkinCamoEarlyPoll();
    runWhenReady();
    setTimeout(function () {
      runValidation();
      initPersistLastBuild();
    }, 500);
  }
})();
