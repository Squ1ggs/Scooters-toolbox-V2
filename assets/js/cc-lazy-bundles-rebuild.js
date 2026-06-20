/**
 * cc-lazy-bundles-rebuild.js
 * Defers loading large data bundles until a panel needs them (~10 MB saved on cold start).
 */
(function () {
  'use strict';
  if (window.__ccLazyBundlesV1) return;
  window.__ccLazyBundlesV1 = true;

  var DATA_BASE = './assets/data/';
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
    serialsPromise = loadScriptsSequential([
      DATA_BASE + 'serials_data.js',
      DATA_BASE + 'bl4_spawncodes_bundle_serials.js',
    ]).then(function () {
      return (window.STX_SERIALS_DATA && window.STX_SERIALS_DATA.serials) || [];
    }).catch(function () {
      serialsPromise = null;
      return [];
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
    ]).then(function () { return true; }).catch(function () {
      godrollPromise = null;
      return false;
    });
    return godrollPromise;
  }

  window.__ccEnsurePartsStatsData = ensurePartsStatsData;
  window.__ccEnsureSerialsCatalog = ensureSerialsCatalog;
  window.__ccEnsureGodrollBundles = ensureGodrollBundles;

  function whenDetailsOpen(id, loader, onReady) {
    var det = document.getElementById(id);
    if (!det) return;
    function run() {
      if (!det.open) return;
      loader().then(function () {
        if (typeof onReady === 'function') onReady();
      });
    }
    det.addEventListener('toggle', run);
    if (det.open) run();
  }

  function scheduleIdleStatsWarm() {
    var statsSec = document.getElementById('rebuildBuildStatsSection');
    if (!statsSec || !statsSec.open || window.PARTS_STATS_DATA) return;
    var run = function () {
      ensurePartsStatsData().then(function () {
        if (typeof window.__ccRefreshBuildStatsAfterStatsLoad === 'function') {
          window.__ccRefreshBuildStatsAfterStatsLoad();
        }
      });
    };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(run, { timeout: 8000 });
    } else {
      setTimeout(run, 3500);
    }
  }

  function wireLazyBundles() {
    whenDetailsOpen('rebuildPrefixItemSearchSection', ensureSerialsCatalog, function () {
      if (typeof window.__ccBootstrapPrefixItemSearch === 'function') window.__ccBootstrapPrefixItemSearch();
    });
    whenDetailsOpen('rebuildGodrollSection', ensureGodrollBundles, function () {
      if (typeof window.__ccBootstrapGodrollSearch === 'function') window.__ccBootstrapGodrollSearch();
    });
    whenDetailsOpen('rebuildBuildStatsSection', ensurePartsStatsData, function () {
      if (typeof window.__ccRefreshBuildStatsAfterStatsLoad === 'function') {
        window.__ccRefreshBuildStatsAfterStatsLoad();
      }
    });

    var guidedFull = document.getElementById('ccGuidedFullStatsPreview');
    if (guidedFull) {
      guidedFull.addEventListener('change', function () {
        if (guidedFull.checked) ensurePartsStatsData();
      });
    }
    var grFull = document.getElementById('godrollShowFullStatsToggle');
    if (grFull) {
      grFull.addEventListener('change', function () {
        if (grFull.checked) ensurePartsStatsData();
      });
    }

    var serialIn = document.getElementById('serialSearchInput');
    if (serialIn) {
      serialIn.addEventListener('focus', function () { ensureSerialsCatalog(); }, { passive: true });
    }

    scheduleIdleStatsWarm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireLazyBundles);
  } else {
    wireLazyBundles();
  }
})();
