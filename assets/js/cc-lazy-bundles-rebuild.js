/**
 * cc-lazy-bundles-rebuild.js
 * Defers loading large data bundles until a panel needs them (~10 MB saved on cold start).
 */
(function () {
  'use strict';
  if (window.__ccLazyBundlesV1) return;
  window.__ccLazyBundlesV1 = true;

  var DATA_BASE = (function () {
    if (typeof window.STX_DATA_BASE === 'string' && window.STX_DATA_BASE) return window.STX_DATA_BASE;
    try {
      if (/\/assets(\/|$)/i.test(String(location.pathname || ''))) return './data/';
    } catch (_) {}
    return './assets/data/';
  })();
  var scriptPromises = Object.create(null);

  function loadScript(src) {
    src = String(src || '').trim();
    if (!src) return Promise.resolve();
    if (scriptPromises[src]) return scriptPromises[src];
    scriptPromises[src] = new Promise(function (resolve, reject) {
      var el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onload = function () { resolve(); };
      el.onerror = function () {
        delete scriptPromises[src];
        reject(new Error('Failed to load ' + src));
      };
      (document.head || document.documentElement).appendChild(el);
    });
    return scriptPromises[src];
  }

  function loadScriptsSequential(list) {
    var chain = Promise.resolve();
    for (var i = 0; i < list.length; i++) {
      (function (src) {
        chain = chain.then(function () { return loadScript(src); });
      })(list[i]);
    }
    return chain;
  }

  var partsStatsPromise = null;
  function ensurePartsStatsData() {
    if (window.PARTS_STATS_DATA) return Promise.resolve(window.PARTS_STATS_DATA);
    if (partsStatsPromise) return partsStatsPromise;
    partsStatsPromise = loadScript(DATA_BASE + 'parts_stats_data.js').then(function () {
      return window.PARTS_STATS_DATA || {};
    }).catch(function () {
      partsStatsPromise = null;
      return {};
    });
    return partsStatsPromise;
  }

  var serialsPromise = null;
  function ensureSerialsCatalog() {
    if (window.STX_SERIALS_DATA && Array.isArray(window.STX_SERIALS_DATA.serials) && window.STX_SERIALS_DATA.serials.length) {
      return Promise.resolve(window.STX_SERIALS_DATA.serials);
    }
    if (serialsPromise) return serialsPromise;
    serialsPromise = loadScript(DATA_BASE + 'serials_data.js')
      .then(function () {
        // Optional spawncodes overlay — never wipe the main catalog if it fails.
        return loadScript(DATA_BASE + 'bl4_spawncodes_bundle_serials.js').catch(function () { return null; });
      })
      .then(function () {
        return (window.STX_SERIALS_DATA && window.STX_SERIALS_DATA.serials) || [];
      })
      .catch(function () {
        serialsPromise = null;
        return (window.STX_SERIALS_DATA && window.STX_SERIALS_DATA.serials) || [];
      });
    return serialsPromise;
  }

  var godrollPromise = null;
  function ensureGodrollBundles() {
    if (window.STX_GODROLL_DATA || window.STX_GODROLL_GRIMEEY_DATA) {
      return Promise.resolve(true);
    }
    if (godrollPromise) return godrollPromise;
    godrollPromise = loadScriptsSequential([
      DATA_BASE + 'godroll_serials_data.js',
      DATA_BASE + 'godroll_grimeey_serials_data.js',
      DATA_BASE + 'bl4_spawncodes_bundle_notes.js',
    ]).then(function () { return true; }).catch(function () {
      godrollPromise = null;
      return false;
    });
    return godrollPromise;
  }

  var lootRefPromise = null;
  function ensureLootReferenceData() {
    if (window.LOOT_REFERENCE_DATA) return Promise.resolve(window.LOOT_REFERENCE_DATA);
    if (lootRefPromise) return lootRefPromise;
    lootRefPromise = loadScript(DATA_BASE + 'loot_reference_data.js').then(function () {
      return window.LOOT_REFERENCE_DATA || null;
    }).catch(function () {
      lootRefPromise = null;
      return null;
    });
    return lootRefPromise;
  }

  function classmodSkillsLoaded() {
    var src = window.__LEGACY_CLASSMOD_PARTS_BY_KEY;
    if (!src) return false;
    /* names.js seeds Name+Skin (+ c4sh Skills). Real VH skill names live in
       legacy_classmod_skills_full.js — require Skill rows for every vault hunter. */
    var required = ['vex', 'amon', 'rafa', 'harlowe', 'c4sh'];
    for (var r = 0; r < required.length; r++) {
      var list = src[required[r]];
      if (!Array.isArray(list) || !list.length) return false;
      var hasSkill = false;
      for (var i = 0; i < list.length; i++) {
        var row = list[i];
        if (Array.isArray(row) && row.length >= 3 && String(row[2] || '').trim() === 'Skill') {
          hasSkill = true;
          break;
        }
      }
      if (!hasSkill) return false;
    }
    return true;
  }

  var classmodSkillsPromise = null;
  function ensureClassmodSkillsData() {
    if (classmodSkillsLoaded()) {
      return Promise.resolve(window.__LEGACY_CLASSMOD_PARTS_BY_KEY);
    }
    if (classmodSkillsPromise) return classmodSkillsPromise;
    classmodSkillsPromise = loadScript(DATA_BASE + 'legacy_classmod_skills_full.js').then(function () {
      try {
        if (typeof window.__ccClassmodSkillsReady === 'function') window.__ccClassmodSkillsReady();
      } catch (_) {}
      return window.__LEGACY_CLASSMOD_PARTS_BY_KEY || {};
    }).catch(function () {
      classmodSkillsPromise = null;
      return {};
    });
    return classmodSkillsPromise;
  }

  var weaponStatsPromise = null;
  function ensureWeaponStatsData() {
    if (typeof window.WEAPON_STATS_DATA !== 'undefined' && window.WEAPON_STATS_DATA) {
      return Promise.resolve(window.WEAPON_STATS_DATA);
    }
    if (weaponStatsPromise) return weaponStatsPromise;
    weaponStatsPromise = loadScript(DATA_BASE + 'weapon_stats_data.js').then(function () {
      return window.WEAPON_STATS_DATA || null;
    }).catch(function () {
      weaponStatsPromise = null;
      return null;
    });
    return weaponStatsPromise;
  }

  function ensureBuildStatsData() {
    return Promise.all([
      ensurePartsStatsData(),
      ensureWeaponStatsData(),
    ]).then(function (pair) {
      return { parts: pair[0], weapon: pair[1] };
    });
  }

  window.__ccEnsurePartsStatsData = ensurePartsStatsData;
  window.__ccEnsureSerialsCatalog = ensureSerialsCatalog;
  window.__ccEnsureGodrollBundles = ensureGodrollBundles;
  window.__ccEnsureLootReferenceData = ensureLootReferenceData;
  window.__ccEnsureClassmodSkillsData = ensureClassmodSkillsData;
  window.__ccClassmodSkillsLoaded = classmodSkillsLoaded;
  window.__ccEnsureWeaponStatsData = ensureWeaponStatsData;
  window.__ccEnsureBuildStatsData = ensureBuildStatsData;

  try {
    if (typeof window.__stxRefreshSerialSearchCatalog === 'function') {
      window.__stxRefreshSerialSearchCatalog();
    }
  } catch (_) {}

  function deferHeavyPanelWork(fn, idleMs) {
    var run = function () {
      if (typeof window.stxScheduleIdle === 'function') {
        var lite = typeof window.stxIsLiteUi === 'function' && window.stxIsLiteUi();
        window.stxScheduleIdle(fn, idleMs != null ? idleMs : (lite ? 2800 : 900));
      } else {
        setTimeout(fn, 400);
      }
    };
    if (typeof window.stxWhenSplashDismissed === 'function') {
      window.stxWhenSplashDismissed(run);
    } else {
      run();
    }
  }

  function whenPanelNeedsData(id, loader, onReady) {
    var det = document.getElementById(id);
    if (!det) return;
    function exec() {
      loader().then(function () {
        if (typeof onReady === 'function') onReady();
      });
    }
    function run(immediate) {
      if (!det.open) return;
      if (immediate) exec();
      else deferHeavyPanelWork(exec, 12000);
    }
    det.addEventListener('toggle', function () { run(true); });
    if (det.open) run(true);
  }

  function wireSearchFocusLoad(inputId, loader, onReady) {
    var input = document.getElementById(inputId);
    if (!input || input.__ccLazyFocusLoad) return;
    input.__ccLazyFocusLoad = true;
    var once = function () {
      loader().then(function () {
        if (typeof onReady === 'function') onReady();
      });
    };
    input.addEventListener('focus', once, { once: true, passive: true });
    input.addEventListener('pointerdown', once, { once: true, passive: true });
  }

  function callWhenReady(getter, tries) {
    tries = tries == null ? 40 : tries;
    function attempt() {
      var fn = getter();
      if (typeof fn === 'function') {
        try { fn(); } catch (_) {}
        return;
      }
      if (tries-- <= 0) return;
      setTimeout(attempt, 120);
    }
    attempt();
  }

  function wireLazyBundles() {
    whenPanelNeedsData('rebuildPrefixItemSearchSection', ensureSerialsCatalog, function () {
      callWhenReady(function () { return window.__ccBootstrapPrefixItemSearch; });
    });
    wireSearchFocusLoad('prefixItemSearchInput', ensureSerialsCatalog, function () {
      callWhenReady(function () { return window.__ccBootstrapPrefixItemSearch; });
    });

    whenPanelNeedsData('rebuildGodrollSection', ensureGodrollBundles, function () {
      callWhenReady(function () { return window.__ccBootstrapGodrollSearch; });
    });
    wireSearchFocusLoad('godrollSearchInput', ensureGodrollBundles, function () {
      callWhenReady(function () { return window.__ccBootstrapGodrollSearch; });
    });

    whenPanelNeedsData('rebuildBuildStatsSection', ensureBuildStatsData, function () {
      if (typeof window.__ccRefreshBuildStatsAfterStatsLoad === 'function') {
        window.__ccRefreshBuildStatsAfterStatsLoad();
      }
    });

    var guidedFull = document.getElementById('ccGuidedFullStatsPreview');
    if (guidedFull) {
      guidedFull.addEventListener('change', function () {
        if (guidedFull.checked) ensureBuildStatsData();
      });
    }
    var grFull = document.getElementById('godrollShowFullStatsToggle');
    if (grFull) {
      grFull.addEventListener('change', function () {
        if (grFull.checked) ensureBuildStatsData();
      });
    }

    function wireClassmodLazyLoad(sel) {
      if (!sel || sel.__ccLazyClassmodLoad) return;
      sel.__ccLazyClassmodLoad = true;
      var loadIfClassmod = function () {
        var v = String(sel.value || '');
        if (!/class\s*mod|classmod/i.test(v)) return;
        ensureClassmodSkillsData().then(function () {
          try {
            if (typeof window.__ccClassmodSkillsReady === 'function') window.__ccClassmodSkillsReady();
          } catch (_) {}
          try {
            if (typeof window.__ccClassmodChecklistRender === 'function') window.__ccClassmodChecklistRender();
          } catch (_) {}
        });
      };
      sel.addEventListener('change', loadIfClassmod);
      loadIfClassmod();
    }
    wireClassmodLazyLoad(document.getElementById('stx_itemType'));
    wireClassmodLazyLoad(document.getElementById('ccGuidedItemType'));

    function wireEnhancementLazyLoad(sel) {
      if (!sel || sel.__ccLazyEnhLoad) return;
      sel.__ccLazyEnhLoad = true;
      sel.addEventListener('change', function () {
        if (String(sel.value || '').trim() !== 'Enhancement') return;
        try {
          if (typeof window.__ccEnhancementChecklistRender === 'function') window.__ccEnhancementChecklistRender();
        } catch (_) {}
      });
    }
    wireEnhancementLazyLoad(document.getElementById('stx_itemType'));
    wireEnhancementLazyLoad(document.getElementById('ccGuidedItemType'));

    function preloadLootReferenceIdle() {
      if (window.LOOT_REFERENCE_DATA) return;
      var run = function () { ensureLootReferenceData(); };
      if (typeof window.stxScheduleIdle === 'function') {
        window.stxScheduleIdle(run, 8000);
      } else {
        setTimeout(run, 4000);
      }
    }
    function preloadPartsStatsIdle() {
      if (window.PARTS_STATS_DATA) return;
      var run = function () { ensurePartsStatsData(); };
      if (typeof window.stxScheduleIdle === 'function') {
        window.stxScheduleIdle(run, 5500);
      } else {
        setTimeout(run, 3000);
      }
    }
    if (typeof window.stxWhenSplashDismissed === 'function') {
      window.stxWhenSplashDismissed(preloadLootReferenceIdle);
      window.stxWhenSplashDismissed(preloadPartsStatsIdle);
    } else {
      preloadLootReferenceIdle();
      preloadPartsStatsIdle();
    }

    var serialIn = document.getElementById('serialSearchInput');
    if (serialIn) {
      serialIn.addEventListener('focus', function () { ensureSerialsCatalog(); }, { passive: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireLazyBundles);
  } else {
    wireLazyBundles();
  }
})();
