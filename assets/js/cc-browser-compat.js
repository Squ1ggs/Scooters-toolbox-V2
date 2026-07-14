/**
 * cc-browser-compat.js — early host hints for lite perf (Edge/mobile) + idle scheduling.
 * Load without defer in <head> so html classes apply before first paint.
 */
(function () {
  'use strict';

  var html = document.documentElement;
  var ua = navigator.userAgent || '';

  function mq(q) {
    try {
      return window.matchMedia(q).matches;
    } catch (_) {
      return false;
    }
  }

  var isEdge = /\bEdg\//.test(ua);
  var isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  var coarse = mq('(pointer: coarse)');
  var narrow = mq('(max-width: 768px)');
  var reduceMotion = mq('(prefers-reduced-motion: reduce)');
  var lowMem = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0 && navigator.deviceMemory <= 4;

  var touchUi = coarse || narrow || isMobileUa;
  var liteUi = touchUi || reduceMotion || lowMem || isEdge;

  if (touchUi) html.classList.add('stx-touch-ui');
  if (liteUi) html.classList.add('stx-lite-ui');
  if (isEdge) html.classList.add('stx-edge');
  if (reduceMotion) html.classList.add('stx-reduced-motion');

  if (typeof window.requestIdleCallback !== 'function') {
    window.requestIdleCallback = function (cb) {
      return window.setTimeout(function () {
        cb({
          didTimeout: false,
          timeRemaining: function () {
            return 0;
          }
        });
      }, 1);
    };
    window.cancelIdleCallback = function (id) {
      window.clearTimeout(id);
    };
  }

  function idleTimeout(defaultMs) {
    var base = Number(defaultMs) || 2000;
    return liteUi ? Math.max(base, Math.round(base * 1.75)) : base;
  }

  window.stxIsLiteUi = function () {
    return html.classList.contains('stx-lite-ui');
  };
  window.stxIsTouchUi = function () {
    return html.classList.contains('stx-touch-ui');
  };
  window.stxScheduleIdle = function (fn, timeoutMs) {
    var t = idleTimeout(timeoutMs);
    if (typeof window.requestIdleCallback === 'function') {
      return window.requestIdleCallback(fn, { timeout: t });
    }
    return window.setTimeout(fn, liteUi ? Math.min(t, 400) : 1);
  };

  /** Yield so pointer/keyboard input can run (keeps INP low). */
  window.stxYieldToMain = function (fn) {
    if (typeof fn !== 'function') return;
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(function () {
        window.setTimeout(fn, 0);
      });
    } else {
      window.setTimeout(fn, 0);
    }
  };

  /**
   * Open Save/YAML drawer with paint-first timing (mobile INP).
   * Shows the shell immediately, keeps the heavy body skipped for 1–2 frames,
   * then unlocks content and optionally schedules backpack parse.
   */
  window.stxOpenSaveYamlDrawer = function (opts) {
    opts = opts || {};
    var drawer = document.getElementById('rp-saveyaml-drawer');
    if (!drawer) return;
    var alreadyOpen = drawer.classList.contains('rp-open');
    drawer.classList.add('rp-open');
    if (!alreadyOpen) drawer.classList.add('rp-opening');

    // Save/YAML serial library + decrypt tooling live in the deferred full-script pack —
    // load them as soon as the panel opens (do not wait for the idle preload).
    function kickSaveYamlScripts() {
      var ready = typeof window.stxEnsureFullAppScripts === 'function'
        ? window.stxEnsureFullAppScripts()
        : Promise.resolve();
      Promise.resolve(ready).then(function () {
        try {
          if (typeof window.initSerialSearchSection === 'function') window.initSerialSearchSection();
        } catch (_) {}
        try {
          if (typeof window.initYamlBulkDecoderHandoff === 'function') window.initYamlBulkDecoderHandoff();
        } catch (_) {}
        try {
          if (typeof window.__stxRefreshSerialSearchCatalog === 'function') window.__stxRefreshSerialSearchCatalog();
        } catch (_) {}
      }).catch(function () {});
    }
    try { kickSaveYamlScripts(); } catch (_) {}

    function afterPaint() {
      try { drawer.classList.remove('rp-opening'); } catch (_) {}
      try { document.body.classList.add('rp-saveyaml-drawer-open'); } catch (_) {}
      if (opts.skipParse) return;
      function runParse() {
        var ta = document.getElementById('yamlInput');
        var hasYaml = !!(ta && String(ta.value || '').trim());
        if (!hasYaml) {
          if (typeof window.updateYamlInjectButtons === 'function') {
            try { window.updateYamlInjectButtons(); } catch (_) {}
          }
          return;
        }
        if (typeof window.scheduleParseYAMLBackpack === 'function') {
          var delay = opts.parseDelay;
          if (delay == null) delay = liteUi ? 220 : 120;
          window.scheduleParseYAMLBackpack(delay);
        }
      }
      if (typeof window.stxYieldToMain === 'function') window.stxYieldToMain(runParse);
      else window.setTimeout(runParse, 0);
    }

    if (alreadyOpen) {
      afterPaint();
      return;
    }
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(afterPaint);
      });
    } else {
      window.setTimeout(afterPaint, liteUi ? 48 : 32);
    }
  };

  window.stxCloseSaveYamlDrawer = function () {
    var drawer = document.getElementById('rp-saveyaml-drawer');
    if (drawer) {
      drawer.classList.remove('rp-open');
      drawer.classList.remove('rp-opening');
    }
    try { document.body.classList.remove('rp-saveyaml-drawer-open'); } catch (_) {}
  };

  window.stxToggleSaveYamlDrawer = function () {
    var drawer = document.getElementById('rp-saveyaml-drawer');
    if (drawer && drawer.classList.contains('rp-open')) window.stxCloseSaveYamlDrawer();
    else window.stxOpenSaveYamlDrawer();
  };

  /** Queue idle work so splash-dismiss handlers don't pile up on one frame. */
  window.stxQueueIdleWork = function (fn, delayMs) {
    if (typeof fn !== 'function') return;
    window.__stxIdleWorkQueue = window.__stxIdleWorkQueue || [];
    window.__stxIdleWorkQueue.push({ fn: fn, delay: Number(delayMs) || 0 });
    if (window.__stxIdleWorkQueueRunning) return;
    window.__stxIdleWorkQueueRunning = true;
    function drain() {
      var q = window.__stxIdleWorkQueue;
      if (!q || !q.length) {
        window.__stxIdleWorkQueueRunning = false;
        return;
      }
      var job = q.shift();
      var run = function () {
        try { job.fn(); } catch (_) {}
        window.stxYieldToMain(drain);
      };
      if (job.delay > 0) {
        window.stxScheduleIdle(run, job.delay);
      } else {
        window.stxYieldToMain(run);
      }
    }
    window.stxYieldToMain(drain);
  };

  /** Run `work(start, end)` on slices of `items`, yielding between slices. */
  window.stxRunInSlices = function (items, sliceSize, work, done) {
    if (!items || !items.length) {
      if (typeof done === 'function') done();
      return;
    }
    var i = 0;
    var size = Math.max(1, Number(sliceSize) || 200);
    function step() {
      var end = Math.min(i + size, items.length);
      try { work(i, end); } catch (_) {}
      i = end;
      if (i < items.length) {
        window.stxYieldToMain(step);
      } else if (typeof done === 'function') {
        window.stxYieldToMain(done);
      }
    }
    step();
  };

  function openDockToolNavOnDesktop() {
    if (touchUi) return;
    var det = document.getElementById('stxDockMoreTools');
    if (det) det.setAttribute('open', '');
  }

  function collapseHeavyPanelsForLite() {
    if (!liteUi) return;
    var collapseIds = [
      'rebuildBuildStatsSection',
      'ccAdvancedPartsSearch',
      'rebuildImportedInspectorDetails',
      'rebuildPrefixItemSearchSection',
      'rebuildGodrollSection'
    ];
    for (var i = 0; i < collapseIds.length; i++) {
      var el = document.getElementById(collapseIds[i]);
      if (el && el.hasAttribute('open')) el.removeAttribute('open');
    }
    try {
      var hub = document.getElementById('ccGearGuidedHub');
      if (hub) {
        var openDetails = hub.querySelectorAll('details[open]');
        for (var j = 0; j < openDetails.length; j++) openDetails[j].removeAttribute('open');
      }
    } catch (_) {}
  }

  if (liteUi) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', collapseHeavyPanelsForLite, { once: true });
    } else {
      collapseHeavyPanelsForLite();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', openDockToolNavOnDesktop, { once: true });
  } else {
    openDockToolNavOnDesktop();
  }

  /** Prevent ghost taps on dock links / builder controls after splash dismiss (mobile). */
  function stxEnsureSplashClickBlocker() {
    var blocker = document.getElementById('stxSplashClickBlock');
    if (blocker) return blocker;
    blocker = document.createElement('div');
    blocker.id = 'stxSplashClickBlock';
    blocker.setAttribute('aria-hidden', 'true');
    blocker.style.cssText = 'position:fixed;inset:0;z-index:99998;touch-action:none;background:transparent;display:none;';
    document.body.appendChild(blocker);
    return blocker;
  }

  window.stxDismissSplash = function (ev) {
    var splash = document.getElementById('splash');
    if (!splash || splash.classList.contains('dismissed')) return;
    if (ev) {
      try { ev.preventDefault(); } catch (_) {}
      try { ev.stopPropagation(); } catch (_) {}
      try { ev.stopImmediatePropagation(); } catch (_) {}
    }
    splash.classList.add('dismissed');
    html.classList.add('stx-splash-dismissed');
    try { splash.style.willChange = 'auto'; } catch (_) {}
    var blocker = stxEnsureSplashClickBlocker();
    blocker.style.display = 'block';
    var guardMs = liteUi ? (touchUi ? 180 : 120) : (touchUi ? 520 : 360);
    window.setTimeout(function () {
      blocker.style.display = 'none';
    }, guardMs);
    flushSplashDismissQueue();
  };

  var splashDismissQueue = [];
  var splashDismissPriorityQueue = [];
  var splashDismissFlushing = false;

  function flushSplashDismissQueue() {
    if (splashDismissFlushing) return;
    splashDismissFlushing = true;
    while (splashDismissPriorityQueue.length) {
      try { splashDismissPriorityQueue.shift()(); } catch (_) {}
    }
    function drain() {
      if (!splashDismissQueue.length) {
        splashDismissFlushing = false;
        try { window.dispatchEvent(new CustomEvent('stx:splash-dismissed')); } catch (_) {}
        return;
      }
      var fn = splashDismissQueue.shift();
      var gap = liteUi ? 48 : 24;
      window.stxQueueIdleWork(function () {
        try { fn(); } catch (_) {}
        window.stxYieldToMain(drain);
      }, gap);
    }
    window.stxQueueIdleWork(drain, liteUi ? 32 : 16);
  }

  window.stxWhenSplashDismissed = function (fn, opts) {
    if (typeof fn !== 'function') return;
    var priority = !!(opts && opts.priority);
    if (html.classList.contains('stx-splash-dismissed')) {
      if (priority) {
        try { fn(); } catch (_) {}
        return;
      }
      window.stxQueueIdleWork(fn, liteUi ? 80 : 0);
      return;
    }
    if (priority) splashDismissPriorityQueue.push(fn);
    else splashDismissQueue.push(fn);
  };

  window.stxBindSplashDismiss = function (btn, splash) {
    if (!btn || !splash || splash.dataset.ccDismissBound === '1') return;
    splash.dataset.ccDismissBound = '1';
    btn.addEventListener('click', function (ev) {
      window.stxDismissSplash(ev);
    });
  };

  function bindSplashEarly() {
    window.stxBindSplashDismiss(document.getElementById('splashDismiss'), document.getElementById('splash'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindSplashEarly, { once: true });
  } else {
    bindSplashEarly();
  }

  window.stxIsFileProtocol = function () {
    try {
      return location.protocol === 'file:';
    } catch (_) {
      return false;
    }
  };

  /** Sync read for local guide .txt when fetch/iframes fail on file:// */
  window.stxLoadLocalTextSync = function (url) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.overrideMimeType('text/plain; charset=utf-8');
      xhr.send(null);
      if (xhr.status === 0 || xhr.status === 200) return String(xhr.responseText || '');
    } catch (_) {}
    return '';
  };

  if (window.stxIsFileProtocol()) {
    window.STX_DECODER_USE_INLINE = true;
  }

  /**
   * Shared-host deploy base (e.g. save-editor.be/Scooters_TBX).
   * Root-absolute href="/…" would otherwise open save-editor.be/ (another toolbox).
   */
  function stxDetectDeployBase() {
    try {
      var canon = document.querySelector('link[rel="canonical"]');
      if (canon && canon.getAttribute('href')) {
        var cu = new URL(canon.getAttribute('href'), location.href);
        var cp = (cu.pathname || '').replace(/\/+$/, '');
        if (cp && cp !== '/') return cp;
      }
    } catch (_) {}
    try {
      var parts = (location.pathname || '/').split('/').filter(Boolean);
      if (parts.length >= 2 && (parts[1] === 'legacy' || parts[1] === 'assets')) {
        return '/' + parts[0];
      }
      if (parts[0] === 'legacy' || parts[0] === 'assets') return '';
      if (parts.length === 1 && parts[0] !== 'index.html') return '/' + parts[0];
    } catch (_) {}
    return '';
  }

  function stxHref(path) {
    path = String(path || '');
    if (!path || /^[a-z][a-z0-9+.-]*:/i.test(path) || path.indexOf('//') === 0) return path;
    if (path.charAt(0) !== '/') return path;
    var base = window.stxDeployBase || '';
    if (!base) return path;
    if (path === '/') return base + '/';
    return base + path;
  }

  function stxFixRootLinks(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('a[href^="/"]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (!h || h.charAt(0) !== '/' || h.indexOf('//') === 0) return;
      var fixed = stxHref(h);
      if (fixed !== h) a.setAttribute('href', fixed);
    });
  }

  function stxRefreshDeployBase() {
    window.stxDeployBase = stxDetectDeployBase();
  }

  stxRefreshDeployBase();
  window.stxHref = stxHref;
  window.stxFixRootLinks = stxFixRootLinks;
  window.stxRefreshDeployBase = stxRefreshDeployBase;

  function stxRunDeployLinkFix() {
    stxRefreshDeployBase();
    stxFixRootLinks(document);
    if (touchUi) {
      document.querySelectorAll(
        'a.stx-touch-tool-nav-link[href][target="_blank"], .stxDockMoreToolsLinks a.btn--brand[href][target="_blank"], #rebuildToolsPanel a.btn--brand[href][target="_blank"]'
      ).forEach(function (a) {
        try {
          var u = new URL(a.getAttribute('href'), location.href);
          if (u.origin === location.origin) a.removeAttribute('target');
        } catch (_) {}
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', stxRunDeployLinkFix, { once: true });
  } else {
    stxRunDeployLinkFix();
  }

  try {
    var stxDeployLinkObserver = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches('a[href^="/"]')) stxFixRootLinks(n.parentNode || document);
          else if (n.querySelectorAll) stxFixRootLinks(n);
        });
      });
    });
    stxDeployLinkObserver.observe(document.documentElement, { childList: true, subtree: true });
  } catch (_) {}
})();
