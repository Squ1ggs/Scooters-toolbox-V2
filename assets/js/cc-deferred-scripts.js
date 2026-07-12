/**
 * cc-deferred-scripts.js — load app scripts after splash without blocking first input.
 * Fast tier: dataset + builder only. Supplements + tools load in the background.
 */
(function () {
  'use strict';

  var FAST_CORE_SCRIPTS = [
    './assets/data/stx_dataset.js',
    './assets/data/stx_rarities.js',
    './assets/data/stx_rarities_raid2_patch.js',
    './assets/data/stx_rarities_community_pearl_patch.js',
    './assets/data/stx_rarities_supplement_patch.js',
    './assets/data/legacy_classmod_names.js',
    './assets/js/stx-simple-builder-core.js',
    './assets/js/cc-custom-select-rebuild.js'
  ];

  var DEFERRED_CORE_SCRIPTS = [
    './assets/data/stx_dataset_supplement.js',
    './assets/data/stx_dataset_repkit_label_patch.js',
    './assets/data/stx_raid2_supplement.js',
    './assets/data/stx_nexus_gap_supplement.js',
    './assets/data/part_display_overrides.js',
    './assets/data/inv_comp_tag_data.js',
    './assets/js/tag-comp-validation.js',
    './assets/data/part_ref_meta.js',
    './assets/data/source_paths_data.js',
    './assets/data/loot_reference_data.js',
    './assets/js/cc-itempool-drop-check.js',
    './assets/data/skin_data.js',
    './assets/data/modded_preset_catalog.js',
    './assets/js/cc-rebuild-populate.js',
    './assets/data/classmod_perk_meta.js',
    './assets/data/perk_thumb_urls.js',
    './assets/data/enhancement_data.js',
    './assets/js/cc-rebuild-bootstrap.js',
    './assets/js/stx-pearl-gear-catalog.js'
  ];

  var GUIDED_SCRIPTS = [
    './legacy/ncs_slot_map.js',
    './assets/js/cc-item-slug.js',
    './assets/js/cc-guided-builder-rebuild.js',
    './assets/js/stx-editor-smoke-guards.js'
  ];

  var FULL_SCRIPTS = [
    './assets/js/cc-classmod-checklist-rebuild.js',
    './assets/js/cc-enhancement-checklist-rebuild.js',
    './assets/js/cc-adv-search-stable.js',
    './assets/js/cc-build-stats-rebuild.js',
    './assets/vendor/cryptojs-inline.js',
    './assets/vendor/pako-inline.js',
    './assets/vendor/jsyaml-inline.js',
    './assets/js/cc-base85-rebuild.js',
    './assets/js/stx-nicnl-serial-pack.js',
    './assets/js/cc-serial-nicnl-rebuild.js',
    './assets/js/stx-decode-bridge-shared.js',
    './assets/js/cc-sav-crypto-rebuild.js',
    './assets/js/cc-yaml-save-rebuild.js',
    './assets/js/cc-stx-decoder-bridge.js',
    './assets/js/cc-lazy-bundles-rebuild.js',
    './assets/js/cc-prefix-item-search-rebuild.js',
    './assets/data/preset_data.js',
    './assets/data/profile_progression_catalog.js',
    './assets/data/yaml_save_catalog.js',
    './assets/js/cc-preset-data-rebuild.js',
    './assets/js/cc-preset-rebuild.js',
    './assets/js/cc-part-tooltip-rebuild.js',
    './assets/js/cc-part-dropdown-meta-rebuild.js',
    './assets/js/cc-skin-mixer-rebuild.js',
    './assets/js/rebuild-presets-random.js',
    './assets/js/cc-tool-nav-buttons.js',
    './assets/js/rebuild-credits-eggs.js',
    './assets/js/cc-toolbox-analytics.js',
    './assets/js/cc-toolbox-items-made.js',
    './assets/js/cc-toolbox-public-counter.js',
    './assets/js/cc-yaml-extras-rebuild.js',
    './assets/js/cc-missions-rebuild.js',
    './assets/js/cc-profile-progression-tools-rebuild.js',
    './assets/js/cc-yaml-drawer-wiring-rebuild.js'
  ];

  var fastCorePromise = null;
  var deferredCorePromise = null;
  var guidedPromise = null;
  var fullPromise = null;

  function yieldMain(fn) {
    if (typeof window.stxYieldToMain === 'function') window.stxYieldToMain(fn);
    else setTimeout(fn, 0);
  }

  function loadScriptList(urls) {
    return new Promise(function (resolve) {
      var i = 0;
      function next() {
        if (i >= urls.length) {
          resolve();
          return;
        }
        var src = urls[i++];
        var s = document.createElement('script');
        s.src = src;
        s.onload = function () { yieldMain(next); };
        s.onerror = function () {
          try { console.error('[STX] Script failed:', src); } catch (_) {}
          yieldMain(next);
        };
        document.head.appendChild(s);
      }
      next();
    });
  }

  function markGuidedSlotNativeSelects() {
    try {
      var sels = document.querySelectorAll('#rebuildGuidedBuilderSection .cc-guided-slots-grid select');
      for (var i = 0; i < sels.length; i++) {
        sels[i].removeAttribute('data-native-select');
      }
      if (typeof window.__ccBootGuidedSlotSelects === 'function') window.__ccBootGuidedSlotSelects();
    } catch (_) {}
  }

  function ensureDeferredCore() {
    if (deferredCorePromise) return deferredCorePromise;
    deferredCorePromise = loadScriptList(DEFERRED_CORE_SCRIPTS).then(function () {
      try { window.dispatchEvent(new CustomEvent('stx:deferred-core-ready')); } catch (_) {}
    });
    return deferredCorePromise;
  }

  function ensureFastCore() {
    if (fastCorePromise) return fastCorePromise;
    try { window.__stxBuilderScriptsLoading = true; } catch (_) {}
    markGuidedSlotNativeSelects();
    fastCorePromise = loadScriptList(FAST_CORE_SCRIPTS).then(function () {
      try {
        window.__stxBuilderScriptsLoading = false;
        window.__stxBuilderScriptsReady = true;
        window.dispatchEvent(new CustomEvent('stx:builder-scripts-ready'));
      } catch (_) {}
      yieldMain(function () {
        if (typeof window.stxQueueIdleWork === 'function') {
          window.stxQueueIdleWork(ensureDeferredCore, 64);
        } else {
          setTimeout(ensureDeferredCore, 64);
        }
        window.setTimeout(function () { ensureGuidedScripts(); }, 180);
      });
    });
    return fastCorePromise;
  }

  function ensureCoreScripts() {
    return ensureFastCore();
  }

  function ensureGuidedScripts() {
    if (guidedPromise) return guidedPromise;
    guidedPromise = ensureFastCore().then(function () {
      return loadScriptList(GUIDED_SCRIPTS);
    }).then(function () {
      try { window.dispatchEvent(new CustomEvent('stx:guided-scripts-ready')); } catch (_) {}
    });
    return guidedPromise;
  }

  function ensureFullScripts() {
    if (fullPromise) return fullPromise;
    fullPromise = Promise.all([
      ensureGuidedScripts(),
      ensureDeferredCore()
    ]).then(function () {
      return loadScriptList(FULL_SCRIPTS);
    }).then(function () {
      try {
        window.__stxFullScriptsReady = true;
        window.dispatchEvent(new CustomEvent('stx:full-scripts-ready'));
      } catch (_) {}
    });
    return fullPromise;
  }

  window.stxEnsureCoreScripts = ensureCoreScripts;
  window.stxEnsureGuidedScripts = ensureGuidedScripts;
  window.stxEnsureBuilderScripts = ensureCoreScripts;
  window.stxEnsureFullAppScripts = ensureFullScripts;
  window.stxMarkGuidedSlotNativeSelects = markGuidedSlotNativeSelects;

  function armSplashCoreBoot() {
    if (typeof window.stxWhenSplashDismissed === 'function') {
      window.stxWhenSplashDismissed(function () {
        yieldMain(ensureFastCore);
      }, { priority: true });
    } else {
      yieldMain(ensureFastCore);
    }
  }

  function armBackgroundPreload() {
    preloadScriptUrls(FAST_CORE_SCRIPTS.slice(0, 4));
    preloadScriptUrls(GUIDED_SCRIPTS);
  }

  function armGuidedEarlyLoad() {
    function bind() {
      markGuidedSlotNativeSelects();
      var panel = document.getElementById('rebuildGuidedBuilderSection');
      if (!panel || panel.__stxGuidedScriptArm) return;
      panel.__stxGuidedScriptArm = true;
      var arm = function () {
        yieldMain(function () { ensureGuidedScripts(); });
      };
      panel.addEventListener('pointerdown', arm, { once: true, passive: true });
      panel.addEventListener('focusin', arm, { once: true });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bind, { once: true });
    } else {
      bind();
    }
  }

  function armFullScriptIdleLoad() {
    var run = function () { ensureFullScripts(); };
    var arm = function () {
      if (typeof window.stxScheduleIdle === 'function') {
        window.stxScheduleIdle(run, 18000);
      } else {
        setTimeout(run, 18000);
      }
    };
    if (typeof window.stxWhenSplashDismissed === 'function') {
      window.stxWhenSplashDismissed(arm);
    } else {
      arm();
    }
  }

  armSplashCoreBoot();
  armGuidedEarlyLoad();
  armFullScriptIdleLoad();
})();
